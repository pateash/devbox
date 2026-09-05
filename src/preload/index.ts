import { contextBridge, ipcRenderer } from 'electron'
import { BRIDGE_VERSION, type DevBoxApi } from '../shared/contracts'

const api: DevBoxApi = {
  version: BRIDGE_VERSION,
  workspaces: { list: () => ipcRenderer.invoke('workspaces:list'), create: (input) => ipcRenderer.invoke('workspaces:create', input), rename: (id, input) => ipcRenderer.invoke('workspaces:rename', id, input), remove: (id, input) => ipcRenderer.invoke('workspaces:remove', id, input), current: () => ipcRenderer.invoke('workspaces:current'), select: (id) => ipcRenderer.invoke('workspaces:select', id) },
  dashboard: { get: (workspaceId) => ipcRenderer.invoke('dashboard:get', workspaceId) },
  github: { beginConnect: (workspaceId) => ipcRenderer.invoke('github:beginConnect', workspaceId), completeConnect: (workspaceId) => ipcRenderer.invoke('github:completeConnect', workspaceId), list: (workspaceId) => ipcRenderer.invoke('github:list', workspaceId), setRepositories: (integrationId, repositories) => ipcRenderer.invoke('github:setRepositories', integrationId, repositories), refresh: (integrationId) => ipcRenderer.invoke('github:refresh', integrationId), disconnect: (integrationId) => ipcRenderer.invoke('github:disconnect', integrationId), workItems: (workspaceId) => ipcRenderer.invoke('github:workItems', workspaceId) },
  preferences: { getTheme: (workspaceId) => ipcRenderer.invoke('preferences:getTheme', workspaceId), setTheme: (workspaceId, theme) => ipcRenderer.invoke('preferences:setTheme', workspaceId, theme) },
  links: { openExternal: (url) => ipcRenderer.invoke('links:openExternal', url) },
  events: { subscribeWorkspaceChanges: (listener) => { const handler = () => listener(); ipcRenderer.on('workspace-data-changed', handler); return () => { ipcRenderer.removeListener('workspace-data-changed', handler) } } }
}
contextBridge.exposeInMainWorld('devbox', api)
