import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Server } from 'node:http'
import { startDevBrowserBridge } from '../src/main/dev-browser-bridge'
import { DevBoxStore } from '../src/main/storage'
import { JiraService } from '../src/main/jira'

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
    vi.unstubAllGlobals()
  })

  it('persists repository assignment without fabricating GitHub work items', async () => {
    server = startDevBrowserBridge(store, undefined, undefined, 0)
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

    // 4. GET /github/work-items returns only persisted provider data.
    const itemsRes = await fetch(
      `${baseUrl}/devbox-api/github/work-items?workspaceId=${encodeURIComponent(workspace.id)}`,
      { headers: { origin } }
    )
    expect(itemsRes.status).toBe(200)
    const items = (await itemsRes.json()) as Array<{ kind: string; title: string; repository: string }>
    expect(items).toEqual([])
  })

  it('persists a global Jira account and one workspace project through the browser bridge', async () => {
    const realFetch=fetch
    vi.stubGlobal('fetch', vi.fn(async (input: string, init?:RequestInit) => {
      if(input.startsWith('http://127.0.0.1:')) return realFetch(input,init)
      const path=new URL(input).pathname
      if(path.endsWith('/myself')) return new Response(JSON.stringify({displayName:'Ada'}))
      if(path.endsWith('/project')) return new Response(JSON.stringify([{key:'APP',name:'App'}]))
      if(path.endsWith('/search')) return new Response(JSON.stringify({total:0,issues:[]}))
      return new Response('{}',{status:404})
    }))
    const jira=new JiraService(store,{encrypt:(value)=>Buffer.from(value),decrypt:(value)=>value.toString()})
    server=startDevBrowserBridge(store,undefined,jira,0)
    await new Promise<void>((resolve)=>server!.once('listening',resolve))
    const baseUrl=`http://127.0.0.1:${(server!.address() as {port:number}).port}`
    const workspace=store.createWorkspace('Jira Browser Lab')
    const connected=await fetch(`${baseUrl}/devbox-api/jira/connect`,{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify({deployment:'cloud',baseUrl:'https://acme.atlassian.net',email:'ada@example.com',token:'api-token'})})
    expect(connected.status).toBe(200)
    const global=await fetch(`${baseUrl}/devbox-api/jira/global`,{headers:{origin}})
    expect((await global.json() as {displayName:string}).displayName).toBe('Ada')
    const mapped=await fetch(`${baseUrl}/devbox-api/jira/project`,{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify({workspaceId:workspace.id,project:{key:'APP',name:'App'}})})
    expect(mapped.status).toBe(200)
    const assignment=await fetch(`${baseUrl}/devbox-api/jira/workspace?workspaceId=${workspace.id}`,{headers:{origin}})
    expect((await assignment.json() as {projects:Array<{key:string;name:string}>}).projects).toEqual([{key:'APP',name:'App'}])
  })
})
