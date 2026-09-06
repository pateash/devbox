import { test, expect } from './fixtures/electron-app'

test.describe('Desktop Security & Link Allowlisting', () => {
  test('rejects unauthorized or malicious external links via IPC bridge', async ({ mainWindow }) => {
    // 1. file:// protocol attempt
    await expect(
      mainWindow.evaluate(() => window.devbox.links.openExternal('file:///etc/passwd'))
    ).rejects.toThrow(/Only stored GitHub and Jira HTTPS links may be opened/)

    // 2. javascript: URL attempt
    await expect(
      mainWindow.evaluate(() => window.devbox.links.openExternal('javascript:alert(1)'))
    ).rejects.toThrow(/Only stored GitHub and Jira HTTPS links may be opened/)

    // 3. Unapproved third-party HTTPS domain
    await expect(
      mainWindow.evaluate(() => window.devbox.links.openExternal('https://untrusted-site.example.com'))
    ).rejects.toThrow(/Only stored GitHub and Jira HTTPS links may be opened/)
  })

  test('denies renderer window.open attempts via setWindowOpenHandler', async ({
    electronApp,
    mainWindow
  }) => {
    // Attempt opening a popup window from the renderer
    await mainWindow.evaluate(() => {
      window.open('https://github.com', '_blank')
    })

    // Confirm that no additional BrowserWindow was created
    const windowCount = await electronApp.evaluate(async ({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows().length
    })
    expect(windowCount).toBe(1)
  })
})
