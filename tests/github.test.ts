import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GitHubService } from '../src/main/github'
import { DevBoxStore } from '../src/main/storage'

const stores: DevBoxStore[] = []
const store = (): DevBoxStore => { const value = new DevBoxStore(join(mkdtempSync(join(tmpdir(), 'devbox-github-')), 'test.sqlite')); stores.push(value); return value }
const response = (value: unknown, status = 200): Response => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } })
afterEach(() => { stores.splice(0).forEach((item) => item.close()); vi.unstubAllGlobals() })

describe('repository-scoped GitHub sync', () => {
  it('refreshes every repository page so recently updated repositories are available', async () => {
    const db = store(); const integrationId = db.createGlobalGitHub('octocat', Buffer.from('encrypted'), ['octocat/old'])
    const calls: string[]=[]
    vi.stubGlobal('fetch', vi.fn(async (input: string) => { calls.push(input); const url=new URL(input); if(url.pathname==='/user') return response({login:'octocat'}); if(url.pathname==='/user/repos'&&url.searchParams.get('page')==='1') return response(Array.from({length:100},(_,index)=>({full_name:`octocat/repository-${index}`}))); if(url.pathname==='/user/repos'&&url.searchParams.get('page')==='2') return response([{full_name:'pateash/devbox'}]); return response({},404) }))
    await new GitHubService(db,{decrypt:()=> 'token'} as never).refreshGlobal()
    expect(db.globalGitHub()?.repositories).toContain('pateash/devbox')
    expect(calls.filter((url)=>url.includes('/user/repos')).map((url)=>new URL(url).searchParams.get('page'))).toEqual(['1','2'])
    expect(db.globalGitHub()?.id).toBe(integrationId)
  })

  it('stores only assigned-repository actionable PRs and assigned issues', async () => {
    const db = store(); const workspace = db.createWorkspace('Acme'); db.createGlobalGitHub('octocat', Buffer.from('encrypted'), ['octocat/api']); db.setAssignedRepositories(workspace.id, ['octocat/api'])
    const calls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: string) => { calls.push(input); const path = new URL(input).pathname; if (path === '/user') return response({ login: 'octocat' }); if (path.endsWith('/pulls')) return response([{ number: 1, title: 'Broken build', html_url: 'https://github.com/octocat/api/pull/1', updated_at: '2026-01-01T00:00:00Z', user: { login: 'octocat' }, head: { sha: 'abc' }, requested_reviewers: [] }, { number: 2, title: 'Review me', html_url: 'https://github.com/octocat/api/pull/2', updated_at: '2026-01-02T00:00:00Z', user: { login: 'other' }, head: { sha: 'def' }, requested_reviewers: [{ login: 'octocat' }] }]); if (path.endsWith('/issues')) return response([{ number: 3, title: 'Assigned issue', html_url: 'https://github.com/octocat/api/issues/3', updated_at: '2026-01-03T00:00:00Z' }, { number: 4, title: 'PR-shaped issue', html_url: 'https://github.com/octocat/api/issues/4', updated_at: '2026-01-04T00:00:00Z', pull_request: {} }]); if (path.endsWith('/check-runs')) return response({ check_runs: [{ conclusion: 'failure' }] }); return response({}, 404) }))
    const github = new GitHubService(db, { decrypt: () => 'token' } as never)
    await github.refreshWorkspace(workspace.id)
    expect(db.workItems(workspace.id).map((item) => [item.kind, item.title, item.repository])).toEqual([['pr', 'Broken build', 'octocat/api'], ['pr', 'Review me', 'octocat/api'], ['issue', 'Assigned issue', 'octocat/api']])
    expect(calls.some((url) => url.includes('/notifications'))).toBe(false)
  })

  it('keeps the last successful workspace cache when GitHub fails', async () => {
    const db = store(); const workspace = db.createWorkspace('Acme'); db.createGlobalGitHub('octocat', Buffer.from('encrypted'), ['octocat/api']); db.setAssignedRepositories(workspace.id, ['octocat/api']); db.replaceWorkspaceGitHubWork(workspace.id, [{ repository: 'octocat/api', title: 'Cached work', reason: 'Issue assigned to you', priority: 'normal', url: 'https://github.com/octocat/api/issues/1', updatedAt: '2026-01-01T00:00:00Z', kind: 'issue' }])
    vi.stubGlobal('fetch', vi.fn(async (input: string) => new URL(input).pathname === '/user' ? response({ login: 'octocat' }) : response({ message: 'failure' }, 500)))
    await expect(new GitHubService(db, { decrypt: () => 'token' } as never).refreshWorkspace(workspace.id)).rejects.toThrow('GitHub API 500')
    expect(db.workItems(workspace.id).map((item) => item.title)).toEqual(['Cached work'])
    expect(db.globalGitHub()?.state).toBe('error')
  })
})
