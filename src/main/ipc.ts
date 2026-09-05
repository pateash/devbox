import { BrowserWindow, ipcMain, shell } from 'electron'
import { z } from 'zod'
import { DevBoxStore } from './storage'
import { isSafeExternalUrl } from './urls'
import { GitHubService } from './github'
const id = z.string().uuid(); const name = z.object({ name: z.string() }); const confirmation = z.object({ confirmationName: z.string() }); const theme = z.enum(['dark', 'light', 'system'])
const backupRepositoryId = z.number().int().positive()
const changed = () => BrowserWindow.getAllWindows().forEach((window) => window.webContents.send('workspace-data-changed'))
export function registerIpc(store: DevBoxStore, fixtureMode: boolean, github: GitHubService): void {
  ipcMain.handle('workspaces:list', () => store.listWorkspaces())
  ipcMain.handle('workspaces:create', (_e, input) => { const result = store.createWorkspace(name.parse(input).name); changed(); return result })
  ipcMain.handle('workspaces:rename', (_e, workspaceId, input) => { const result = store.renameWorkspace(id.parse(workspaceId), name.parse(input).name); changed(); return result })
  ipcMain.handle('workspaces:remove', (_e, workspaceId, input) => { store.deleteWorkspace(id.parse(workspaceId), confirmation.parse(input).confirmationName); changed() })
  ipcMain.handle('workspaces:archive', (_e, workspaceId) => { store.archiveWorkspace(id.parse(workspaceId)); changed() })
  ipcMain.handle('workspaces:current', () => store.currentWorkspace())
  ipcMain.handle('workspaces:select', (_e, workspaceId) => { const result = store.selectWorkspace(id.parse(workspaceId)); changed(); return result })
  ipcMain.handle('dashboard:get', (_e, workspaceId) => { const workspace = store.getWorkspace(id.parse(workspaceId)); if (!workspace) throw new Error('Workspace not found.'); return { workspace, fixtureMode, message: fixtureMode ? 'Development fixture mode is active.' : 'Connect GitHub or Jira to start seeing actionable work.', fixtureItems: fixtureMode ? [{ title: 'Fixture: review requested', reason: 'Development-only sample data' }, { title: 'Fixture: failing check', reason: 'Development-only sample data' }] : [] } })
  ipcMain.handle('github:connectPersonalAccessToken', async (_e, token) => { await github.connectPersonalAccessToken(z.string().min(1).max(4096).parse(token)); changed(); const integration=store.globalGitHub(); if (!integration) throw new Error('GitHub integration was not created.'); return {...integration,provider:'github',repositories:integration.repositories.map((fullName)=>({fullName,selected:true}))} })
  ipcMain.handle('github:global', () => { const integration=store.globalGitHub(); return integration ? {...integration,provider:'github',repositories:integration.repositories.map((fullName)=>({fullName,selected:true}))}:null })
  ipcMain.handle('github:assignedRepositories', (_e, workspaceId) => store.assignedRepositories(id.parse(workspaceId)))
  ipcMain.handle('github:setAssignedRepositories', async (_e, workspaceId, repositories) => { const workspace=id.parse(workspaceId); store.setAssignedRepositories(workspace, z.array(z.string().regex(/^[^/]+\/[^/]+$/)).parse(repositories)); await github.refreshWorkspace(workspace); changed() })
  ipcMain.handle('github:refreshGlobal', async () => { await github.refreshGlobal(); changed() })
  ipcMain.handle('github:refreshWorkspace', async (_e, workspaceId) => { await github.refreshWorkspace(id.parse(workspaceId)); changed() })
  ipcMain.handle('github:disconnect', () => { store.removeGlobalGitHub(); changed() })
  ipcMain.handle('github:workItems', (_e, workspaceId) => store.workItems(id.parse(workspaceId)))
  ipcMain.handle('backups:status', () => store.backupStatus())
  ipcMain.handle('backups:repositories', () => github.backupRepositories())
  ipcMain.handle('backups:connectToken', (_e, token) => github.connectBackupToken(z.string().min(1).max(4096).parse(token)))
  ipcMain.handle('backups:configure', async (_e, repositoryId, acknowledgement) => { if(acknowledgement!==true) throw new Error('Acknowledge that this backup is unencrypted.'); const result=await github.configureBackup(backupRepositoryId.parse(repositoryId)); changed(); return result })
  ipcMain.handle('backups:run', async () => { const result=await github.backupNow(); changed(); return result })
  ipcMain.handle('backups:restoreLatest', async (_e, restoreConfirmation) => { if(restoreConfirmation!=='RESTORE') throw new Error('Type RESTORE to replace local DevBox data.'); await github.restoreLatest(); changed() })
  ipcMain.handle('preferences:getTheme', (_e, workspaceId) => store.getTheme(id.parse(workspaceId)))
  ipcMain.handle('preferences:setTheme', (_e, workspaceId, value) => { store.setTheme(id.parse(workspaceId), theme.parse(value)); changed() })
  ipcMain.handle('links:openExternal', async (_e, url) => { if (!isSafeExternalUrl(z.string().parse(url))) throw new Error('Only stored GitHub and Jira HTTPS links may be opened.'); await shell.openExternal(url) })
}
