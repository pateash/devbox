import { contextBridge, ipcRenderer } from 'electron'
import { BRIDGE_VERSION, type DevBoxApi } from '../shared/contracts'

const api: DevBoxApi = {
  version: BRIDGE_VERSION,
  workspaces: { list: () => ipcRenderer.invoke('workspaces:list'), create: (input) => ipcRenderer.invoke('workspaces:create', input), rename: (id, input) => ipcRenderer.invoke('workspaces:rename', id, input), remove: (id, input) => ipcRenderer.invoke('workspaces:remove', id, input), archive: (id) => ipcRenderer.invoke('workspaces:archive', id), current: () => ipcRenderer.invoke('workspaces:current'), select: (id) => ipcRenderer.invoke('workspaces:select', id) },
  dashboard: { get: (workspaceId) => ipcRenderer.invoke('dashboard:get', workspaceId) },
  github: { connectPersonalAccessToken: (token) => ipcRenderer.invoke('github:connectPersonalAccessToken', token), global: () => ipcRenderer.invoke('github:global'), assignedRepositories: (workspaceId) => ipcRenderer.invoke('github:assignedRepositories', workspaceId), setAssignedRepositories: (workspaceId, repositories) => ipcRenderer.invoke('github:setAssignedRepositories', workspaceId, repositories), refreshGlobal: () => ipcRenderer.invoke('github:refreshGlobal'), refreshWorkspace: (workspaceId) => ipcRenderer.invoke('github:refreshWorkspace', workspaceId), disconnect: () => ipcRenderer.invoke('github:disconnect'), workItems: (workspaceId) => ipcRenderer.invoke('github:workItems', workspaceId) },
  backups: { status: () => ipcRenderer.invoke('backups:status'), repositories: () => ipcRenderer.invoke('backups:repositories'), connectToken: (token) => ipcRenderer.invoke('backups:connectToken', token), configure: (repositoryId, acknowledgement) => ipcRenderer.invoke('backups:configure', repositoryId, acknowledgement), run: () => ipcRenderer.invoke('backups:run'), restoreLatest: (confirmation) => ipcRenderer.invoke('backups:restoreLatest', confirmation) },
  preferences: { getTheme: (workspaceId) => ipcRenderer.invoke('preferences:getTheme', workspaceId), setTheme: (workspaceId, theme) => ipcRenderer.invoke('preferences:setTheme', workspaceId, theme) },
  links: { openExternal: (url) => ipcRenderer.invoke('links:openExternal', url) },
  events: { subscribeWorkspaceChanges: (listener) => { const handler = () => listener(); ipcRenderer.on('workspace-data-changed', handler); return () => { ipcRenderer.removeListener('workspace-data-changed', handler) } } }
}
contextBridge.exposeInMainWorld('devbox', api)
