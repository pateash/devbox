import { app, BrowserWindow, globalShortcut, Menu, Tray, nativeImage } from 'electron'
import { join } from 'node:path'
import { DevBoxStore } from './storage'
import { registerIpc } from './ipc'
import { GitHubService } from './github'
import { JiraService } from './jira'
import { TokenVault } from './security'
import { startDevBrowserBridge } from './dev-browser-bridge'

// Electron otherwise derives a development-specific user-data directory from
// its launcher. Keep the desktop app and the dev browser bridge on DevBox's
// one local store.
app.setName('DevBox')
if (process.env.DEVBOX_USER_DATA_DIR) {
  app.setPath('userData', process.env.DEVBOX_USER_DATA_DIR)
}

let mainWindow: BrowserWindow | null = null; let tray: Tray | null = null; let completingQuitBackup = false
const fixtureMode = process.env.DEVBOX_FIXTURES === '1'
const headless = process.env.DEVBOX_HEADLESS === '1'
function createWindow(): void { mainWindow = new BrowserWindow({ width: 1200, height: 760, minWidth: 900, minHeight: 600, show: false, webPreferences: { preload: join(__dirname, '../preload/index.js'), contextIsolation: true, sandbox: true, nodeIntegration: false } }); mainWindow.once('ready-to-show', () => { if (!headless) mainWindow?.show() }); mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' })); mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL || `file://${join(__dirname, '../renderer/index.html')}`) }
app.whenReady().then(() => { if (headless && process.platform === 'darwin' && app.dock) app.dock.hide(); const store = new DevBoxStore(join(app.getPath('userData'), 'devbox.sqlite')); const bridge=startDevBrowserBridge(store); const github=new GitHubService(store); const jira=new JiraService(store,new TokenVault()); const development=!!process.env.ELECTRON_RENDERER_URL; registerIpc(store, fixtureMode, github, jira); Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: 'DevBox', submenu: [{ role: 'quit' }] }, { role: 'editMenu' }])); if (!headless) { tray = new Tray(nativeImage.createEmpty()); tray.setToolTip('DevBox'); tray.on('click', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus() } }); globalShortcut.register('Alt+Space', () => { mainWindow?.show(); mainWindow?.focus() }) } createWindow(); app.on('activate', () => { if (!mainWindow) createWindow() }); app.on('before-quit', (event) => { const backup=store.backupStatus(); if(!development && !completingQuitBackup && backup.repository && backup.dirty) { event.preventDefault(); completingQuitBackup=true; void Promise.race([github.backupNow().catch(()=>undefined),new Promise((resolve)=>setTimeout(resolve,3000))]).finally(()=>app.quit()); return } bridge?.close(); store.close(); globalShortcut.unregisterAll() }) })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
