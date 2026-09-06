import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Server } from 'node:http'
import { startDevBrowserBridge } from '../src/main/dev-browser-bridge'
import { DevBoxStore } from '../src/main/storage'

describe('dev browser bridge HTTP API', () => {
  let store: DevBoxStore
  let server: Server | null = null
  const origin = 'http://localhost:5173'

  beforeEach(() => {
    process.env.ELECTRON_RENDERER_URL = origin
    store = new DevBoxStore(join(mkdtempSync(join(tmpdir(), 'devbox-bridge-test-')), 'test.sqlite'))
  })

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()))
      server = null
    }
    store.close()
    delete process.env.ELECTRON_RENDERER_URL
  })

  it('handles repository assignment and returns PRs/issues in browser preview', async () => {
    server = startDevBrowserBridge(store, undefined, 0)
    expect(server).not.toBeNull()
    await new Promise<void>((resolve) => server!.once('listening', () => resolve()))
    const address = server!.address() as { port: number }
    const baseUrl = `http://127.0.0.1:${address.port}`

    // 1. Create workspace and global GitHub integration in store
    const workspace = store.createWorkspace('Browser Test Lab')
    store.createGlobalGitHub('pateash', Buffer.from('token'), [
      'pateash/devbox',
      'codingtools/cdt'
    ])

    // 2. GET /github/global
    const globalRes = await fetch(`${baseUrl}/devbox-api/github/global`, {
      headers: { origin }
    })
    expect(globalRes.status).toBe(200)
    const globalData = (await globalRes.json()) as { displayName: string; repositories: Array<{ fullName: string }> }
    expect(globalData.displayName).toBe('pateash')
    expect(globalData.repositories.map((r) => r.fullName)).toContain('pateash/devbox')

    // 3. POST /github/assigned to assign repository
    const assignRes = await fetch(`${baseUrl}/devbox-api/github/assigned`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({
        workspaceId: workspace.id,
        repositories: ['pateash/devbox']
      })
    })
    expect(assignRes.status).toBe(200)
    const assignedData = await assignRes.json()
    expect(assignedData).toEqual(['pateash/devbox'])

    // 4. GET /github/work-items to verify PRs and issues are returned
    const itemsRes = await fetch(
      `${baseUrl}/devbox-api/github/work-items?workspaceId=${encodeURIComponent(workspace.id)}`,
      { headers: { origin } }
    )
    expect(itemsRes.status).toBe(200)
    const items = (await itemsRes.json()) as Array<{ kind: string; title: string; repository: string }>
    expect(items.length).toBeGreaterThan(0)
    expect(items.some((item) => item.kind === 'pr')).toBe(true)
    expect(items.some((item) => item.kind === 'issue')).toBe(true)
    expect(items.every((item) => item.repository === 'pateash/devbox')).toBe(true)
  })
})
