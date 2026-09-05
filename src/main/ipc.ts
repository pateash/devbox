import { BrowserWindow, ipcMain, shell } from 'electron'
import { z } from 'zod'
import { DevBoxStore } from './storage'
import { isSafeExternalUrl } from './urls'
import { GitHubService } from './github'
const id = z.string().uuid(); const name = z.object({ name: z.string() }); const confirmation = z.object({ confirmationName: z.string() }); const theme = z.enum(['dark', 'light', 'system'])
const changed = () => BrowserWindow.getAllWindows().forEach((window) => window.webContents.send('workspace-data-changed'))
export function registerIpc(store: DevBoxStore, fixtureMode: boolean, github: GitHubService): void {
  ipcMain.handle('workspaces:list', () => store.listWorkspaces())
  ipcMain.handle('workspaces:create', (_e, input) => { const result = store.createWorkspace(name.parse(input).name); changed(); return result })
  ipcMain.handle('workspaces:rename', (_e, workspaceId, input) => { const result = store.renameWorkspace(id.parse(workspaceId), name.parse(input).name); changed(); return result })
  ipcMain.handle('workspaces:remove', (_e, workspaceId, input) => { store.deleteWorkspace(id.parse(workspaceId), confirmation.parse(input).confirmationName); changed() })
  ipcMain.handle('workspaces:current', () => store.currentWorkspace())
  ipcMain.handle('workspaces:select', (_e, workspaceId) => { const result = store.selectWorkspace(id.parse(workspaceId)); changed(); return result })
  ipcMain.handle('dashboard:get', (_e, workspaceId) => { const workspace = store.getWorkspace(id.parse(workspaceId)); if (!workspace) throw new Error('Workspace not found.'); return { workspace, fixtureMode, message: fixtureMode ? 'Development fixture mode is active.' : 'Connect GitHub or Jira to start seeing actionable work.', fixtureItems: fixtureMode ? [{ title: 'Fixture: review requested', reason: 'Development-only sample data' }, { title: 'Fixture: failing check', reason: 'Development-only sample data' }] : [] } })
  ipcMain.handle('github:beginConnect', (_e, workspaceId) => github.begin(id.parse(workspaceId)))
  ipcMain.handle('github:completeConnect', async (_e, workspaceId) => { await github.complete(id.parse(workspaceId)); changed(); const integration=store.githubIntegrations(workspaceId)[0]; if (!integration) throw new Error('GitHub integration was not created.'); return integration })
  ipcMain.handle('github:list', (_e, workspaceId) => store.githubIntegrations(id.parse(workspaceId)))
  ipcMain.handle('github:setRepositories', (_e, integrationId, repositories) => { store.setRepositories(id.parse(integrationId), z.array(z.string().regex(/^[^/]+\/[^/]+$/)).parse(repositories)); changed() })
  ipcMain.handle('github:refresh', async (_e, integrationId) => { await github.sync(id.parse(integrationId)); changed() })
  ipcMain.handle('github:disconnect', (_e, integrationId) => { const integration=store.integration(id.parse(integrationId)); store.removeGitHub(integration.workspaceId); changed() })
  ipcMain.handle('github:workItems', (_e, workspaceId) => store.workItems(id.parse(workspaceId)))
  ipcMain.handle('preferences:getTheme', (_e, workspaceId) => store.getTheme(id.parse(workspaceId)))
  ipcMain.handle('preferences:setTheme', (_e, workspaceId, value) => { store.setTheme(id.parse(workspaceId), theme.parse(value)); changed() })
  ipcMain.handle('links:openExternal', async (_e, url) => { if (!isSafeExternalUrl(z.string().parse(url))) throw new Error('Only stored GitHub and Jira HTTPS links may be opened.'); await shell.openExternal(url) })
}
