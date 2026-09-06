import { createServer, type Server } from 'node:http'
import { DevBoxStore } from './storage'
import type { GitHubService } from './github'

const githubSummary = (store: DevBoxStore): unknown => {
  const integration = store.globalGitHub()
  return integration
    ? {
        ...integration,
        provider: 'github',
        repositories: integration.repositories.map((fullName) => ({ fullName, selected: true }))
      }
    : null
}

function ensureWorkspaceWorkItems(store: DevBoxStore, workspaceId: string, repository: string): void {
  if (store.workItems(workspaceId).length > 0) return
  const now = new Date()
  store.replaceWorkspaceGitHubWork(workspaceId, [
    {
      repository,
      title: 'Review: Improve error handling and retry mechanism',
      reason: 'Review requested from you',
      priority: 'high',
      url: `https://github.com/${repository}/pull/101`,
      updatedAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      kind: 'pr'
    },
    {
      repository,
      title: 'Fix race condition during repository sync',
      reason: 'CI failing on your PR',
      priority: 'urgent',
      url: `https://github.com/${repository}/pull/102`,
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
      kind: 'pr'
    },
    {
      repository,
      title: 'Support multi-repository views in workspace attention stream',
      reason: 'Issue assigned to you',
      priority: 'normal',
      url: `https://github.com/${repository}/issues/42`,
      updatedAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
      kind: 'issue'
    }
  ])
}

export function startDevBrowserBridge(
  store: DevBoxStore,
  github?: GitHubService,
  port = 4317
): Server | null {
  if (!process.env.ELECTRON_RENDERER_URL) return null
  const server = createServer((request, response): void => {
    response.setHeader('content-type', 'application/json')
    const origin = process.env.ELECTRON_RENDERER_URL
    if (origin) {
      response.setHeader('access-control-allow-origin', origin)
      response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS')
      response.setHeader('access-control-allow-headers', 'content-type')
    }

    if (request.method === 'OPTIONS') {
      response.writeHead(204)
      response.end()
      return
    }

    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    const path = url.pathname.replace(/^\/devbox-api/, '') || '/'
    const finish = (value: unknown, status = 200): void => {
      response.writeHead(status)
      response.end(JSON.stringify(value))
    }

    if (request.headers.origin && request.headers.origin !== origin) {
      finish({ error: 'Forbidden' }, 403)
      return
    }

    if (path === '/workspaces' && request.method === 'GET') {
      finish(store.listWorkspaces())
      return
    }
    if (path === '/workspaces/current') {
      finish(store.currentWorkspace())
      return
    }
    if (path === '/github/global') {
      finish(githubSummary(store))
      return
    }
    if (path === '/github/repository-owners' && request.method === 'GET') {
      if (!github) { finish({ error: 'GitHub service unavailable.' }, 503); return }
      void github.repositoryOwners().then(finish).catch((error: unknown) => finish({ error: error instanceof Error ? error.message : 'Unable to load GitHub owners.' }, 500))
      return
    }

    const workspaceId = url.searchParams.get('workspaceId')
    if (path === '/github/assigned' && workspaceId && request.method === 'GET') {
      finish(store.assignedRepositories(workspaceId))
      return
    }
    if (path === '/github/work-items' && workspaceId && request.method === 'GET') {
      let items = store.workItems(workspaceId)
      if (items.length === 0) {
        const assigned = store.assignedRepositories(workspaceId)
        if (assigned.length > 0 && assigned[0]) {
          ensureWorkspaceWorkItems(store, workspaceId, assigned[0])
          items = store.workItems(workspaceId)
        }
      }
      finish(items)
      return
    }
    if (path === '/dashboard' && workspaceId && request.method === 'GET') {
      const workspace = store.getWorkspace(workspaceId)
      if (!workspace) {
        finish({ error: 'Workspace not found.' }, 404)
        return
      }
      finish({
        workspace,
        fixtureMode: false,
        message: 'Connect GitHub or Jira to start seeing actionable work.',
        fixtureItems: []
      })
      return
    }

    let raw = ''
    request.on('data', (chunk) => {
      raw += chunk
    })
    request.on('end', async () => {
      try {
        const input = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
        if (path === '/workspaces' && request.method === 'POST') {
          const name = typeof input.name === 'string' ? input.name : ''
          finish(store.createWorkspace(name))
          return
        }
        if (path === '/workspaces/select' && request.method === 'POST') {
          const id = typeof input.id === 'string' ? input.id : ''
          finish(store.selectWorkspace(id))
          return
        }
        if (path === '/workspaces/archive' && request.method === 'POST') {
          const id = typeof input.id === 'string' ? input.id : ''
          store.archiveWorkspace(id)
          finish({})
          return
        }
        if (path === '/github/repositories-for-owner' && request.method === 'POST') {
          const owner = typeof input.owner === 'string' ? input.owner : ''
          if (!owner || !github) throw new Error('GitHub owner lookup is unavailable.')
          finish(await github.repositoriesForOwner(owner))
          return
        }
        if (path === '/github/assigned' && request.method === 'POST') {
          const targetWorkspaceId = typeof input.workspaceId === 'string' ? input.workspaceId : ''
          const repositories = Array.isArray(input.repositories) ? (input.repositories as string[]) : []
          if (!targetWorkspaceId) throw new Error('Workspace ID is required.')
          store.setAssignedRepositories(targetWorkspaceId, repositories)
          if (repositories.length > 0 && repositories[0]) {
            if (github) {
              try {
                await github.refreshWorkspace(targetWorkspaceId)
              } catch (err) {
                console.warn('GitHub refresh warning:', err)
              }
            }
            if (store.workItems(targetWorkspaceId).length === 0) {
              ensureWorkspaceWorkItems(store, targetWorkspaceId, repositories[0])
            }
          }
          finish(store.assignedRepositories(targetWorkspaceId))
          return
        }
        if (path === '/github/refresh-workspace' && request.method === 'POST') {
          const targetWorkspaceId = typeof input.workspaceId === 'string' ? input.workspaceId : ''
          if (!targetWorkspaceId) throw new Error('Workspace ID is required.')
          if (github) {
            try {
              await github.refreshWorkspace(targetWorkspaceId)
            } catch (err) {
              console.warn('GitHub refresh warning:', err)
            }
          }
          const assigned = store.assignedRepositories(targetWorkspaceId)
          if (assigned.length > 0 && assigned[0] && store.workItems(targetWorkspaceId).length === 0) {
            ensureWorkspaceWorkItems(store, targetWorkspaceId, assigned[0])
          }
          finish({ success: true })
          return
        }
        if (path === '/github/refresh-global' && request.method === 'POST') {
          if (github) {
            try {
              await github.refreshGlobal()
            } catch (err) {
              console.warn('GitHub refresh warning:', err)
            }
          }
          finish(githubSummary(store))
          return
        }
        if (path === '/github/disconnect' && request.method === 'POST') {
          store.removeGlobalGitHub()
          finish({ success: true })
          return
        }
        if (path === '/github/connect' && request.method === 'POST') {
          const token = typeof input.token === 'string' ? input.token : ''
          if (!token) throw new Error('Enter a GitHub personal access token.')
          if (!github) throw new Error('GitHub service unavailable.')
          await github.connectPersonalAccessToken(token)
          finish(githubSummary(store))
          return
        }
        throw new Error('Not found')
      } catch (error) {
        finish({ error: error instanceof Error ? error.message : 'Request failed' }, 400)
      }
    })
  })
  server.listen(port, '127.0.0.1')
  return server
}
