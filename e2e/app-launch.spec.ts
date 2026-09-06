import { test, expect } from './fixtures/electron-app'

test.describe('Application Launch', () => {
  test('launches DevBox and renders initial welcome screen on fresh install', async ({
    electronApp,
    mainWindow
  }) => {
    // Verify window title
    const title = await mainWindow.title()
    expect(title).toBe('DevBox')

    // Verify window dimensions from Electron main process
    const windowSize = await electronApp.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0]
      return win ? win.getSize() : null
    })
    expect(windowSize).toEqual([1200, 760])

    // Verify first-run welcome screen elements
    const welcomeHeader = mainWindow.locator('.welcome h1')
    await expect(welcomeHeader).toBeVisible()
    await expect(welcomeHeader).toHaveText('Create your first workspace')

    // Verify workspace input is rendered and focused
    const workspaceInput = mainWindow.locator('#workspace-name')
    await expect(workspaceInput).toBeVisible()
    await expect(workspaceInput).toBeFocused()

    // Verify save button exists
    const saveButton = mainWindow.locator('button[type="submit"]')
    await expect(saveButton).toBeVisible()
    await expect(saveButton).toHaveText('Save')
  })

  test('does not produce unexpected console error logs on startup', async ({ mainWindow }) => {
    const errorLogs: string[] = []
    mainWindow.on('console', (msg) => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text())
      }
    })

    // Wait a moment for any initial queries to settle
    await mainWindow.waitForTimeout(500)
    expect(errorLogs).toEqual([])
  })
})
