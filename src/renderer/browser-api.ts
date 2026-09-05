import type { BackupRepository, BackupStatus, DevBoxApi, IntegrationSummary, Theme, Workspace, WorkspaceSummary, WorkItem } from '../shared/contracts'

type BrowserState = { workspaces: Workspace[]; currentId: string; themes: Record<string, Theme> }
const KEY = 'devbox:browser-preview:v1'
const listeners = new Set<() => void>()
const now = (): string => new Date().toISOString()
const initial = (): BrowserState => { const timestamp=now(); const workspace={id:crypto.randomUUID(),name:'Preview workspace',createdAt:timestamp,updatedAt:timestamp,lastOpenedAt:timestamp}; return {workspaces:[workspace],currentId:workspace.id,themes:{}} }
const read = (): BrowserState => { try { const value=window.localStorage.getItem(KEY); return value ? JSON.parse(value) as BrowserState : initial() } catch { return initial() } }
const write = (state: BrowserState): void => { window.localStorage.setItem(KEY,JSON.stringify(state)); listeners.forEach((listener)=>listener()) }
const remote = async <T>(path:string, init?:RequestInit):Promise<T>=>{const response=await fetch('/devbox-api'+path,{headers:{'content-type':'application/json'},...init}); const data=await response.json() as T&{error?:string}; if(!response.ok||data.error) throw new Error(data.error??'DevBox desktop bridge is unavailable.'); return data}

export function createBrowserDevboxApi(): DevBoxApi {
  return {
    version:'1',
    workspaces:{
      list:async()=>remote<WorkspaceSummary[]>('/workspaces'),
      create:async({name})=>remote<Workspace>('/workspaces',{method:'POST',body:JSON.stringify({name})}),
      rename:async(id,{name})=>{const state=read(); const workspace=state.workspaces.find((item)=>item.id===id); if(!workspace) throw new Error('Workspace not found.'); workspace.name=name.trim()||workspace.name; workspace.updatedAt=now(); write(state); return workspace},
      remove:async(id,{confirmationName})=>{const state=read(); const workspace=state.workspaces.find((item)=>item.id===id); if(!workspace||workspace.name!==confirmationName.trim()) throw new Error('Workspace name does not match confirmation.'); state.workspaces=state.workspaces.filter((item)=>item.id!==id); if(!state.workspaces.length) state.workspaces=initial().workspaces; const next=state.workspaces[0]; if(!next) throw new Error('Workspace could not be created.'); state.currentId=next.id; write(state)},
      archive:async(id)=>{await remote('/workspaces/archive',{method:'POST',body:JSON.stringify({id})})},
      current:async()=>remote<Workspace|null>('/workspaces/current'),
      select:async(id)=>remote<Workspace>('/workspaces/select',{method:'POST',body:JSON.stringify({id})})
    },
    dashboard:{get:async(workspaceId)=>remote(`/dashboard?workspaceId=${encodeURIComponent(workspaceId)}`)},
    github:{connectPersonalAccessToken:async()=>{throw new Error('GitHub connections are available only in the DevBox desktop app.');},global:async()=>remote<IntegrationSummary|null>('/github/global'),assignedRepositories:async(workspaceId)=>remote<string[]>(`/github/assigned?workspaceId=${encodeURIComponent(workspaceId)}`),setAssignedRepositories:async()=>undefined,refreshGlobal:async()=>undefined,refreshWorkspace:async()=>undefined,disconnect:async()=>undefined,workItems:async(workspaceId)=>remote<WorkItem[]>(`/github/work-items?workspaceId=${encodeURIComponent(workspaceId)}`)},
    backups:{status:async():Promise<BackupStatus>=>({repository:null,lastBackedUpAt:null,lastCommitUrl:null,lastError:null,dirty:false}),repositories:async():Promise<BackupRepository[]>=>[],connectToken:async()=>{throw new Error('GitHub backups are available only in the DevBox desktop app.');},configure:async()=>{throw new Error('GitHub backups are available only in the DevBox desktop app.');},run:async()=>{throw new Error('GitHub backups are available only in the DevBox desktop app.');},restoreLatest:async()=>{throw new Error('GitHub backups are available only in the DevBox desktop app.');}},
    preferences:{getTheme:async(workspaceId)=>read().themes[workspaceId]??'dark',setTheme:async(workspaceId,theme)=>{const state=read(); state.themes[workspaceId]=theme; write(state)}},
    links:{openExternal:async(url)=>{window.open(url,'_blank','noopener,noreferrer')}},
    events:{subscribeWorkspaceChanges:(listener)=>{listeners.add(listener); return ()=>listeners.delete(listener)}}
  }
}
