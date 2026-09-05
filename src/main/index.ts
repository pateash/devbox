import { app, BrowserWindow, globalShortcut, Menu, Tray, nativeImage } from 'electron'
import { join } from 'node:path'
import { DevBoxStore } from './storage'
import { registerIpc } from './ipc'
import { GitHubService } from './github'
import { startDevBrowserBridge } from './dev-browser-bridge'

// Electron otherwise derives a development-specific user-data directory from
// its launcher. Keep the desktop app and the dev browser bridge on DevBox's
// one local store.
app.setName('DevBox')

let mainWindow: BrowserWindow | null = null; let tray: Tray | null = null
const fixtureMode = process.env.DEVBOX_FIXTURES === '1'
function createWindow(): void { mainWindow = new BrowserWindow({ width: 1200, height: 760, minWidth: 900, minHeight: 600, show: false, webPreferences: { preload: join(__dirname, '../preload/index.js'), contextIsolation: true, sandbox: true, nodeIntegration: false } }); mainWindow.once('ready-to-show', () => mainWindow?.show()); mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' })); mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL || `file://${join(__dirname, '../renderer/index.html')}`) }
app.whenReady().then(() => { const store = new DevBoxStore(join(app.getPath('userData'), 'devbox.sqlite')); const bridge=startDevBrowserBridge(store); registerIpc(store, fixtureMode, new GitHubService(store)); Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: 'DevBox', submenu: [{ role: 'quit' }] }, { role: 'editMenu' }])); tray = new Tray(nativeImage.createEmpty()); tray.setToolTip('DevBox'); tray.on('click', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus() } }); globalShortcut.register('Alt+Space', () => { mainWindow?.show(); mainWindow?.focus() }); createWindow(); app.on('activate', () => { if (!mainWindow) createWindow() }); app.on('before-quit', () => { bridge?.close(); store.close(); globalShortcut.unregisterAll() }) })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
