import { test as base, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

type ElectronFixtures = {
  electronApp: ElectronApplication
  mainWindow: Page
  userDataDir: string
}

type ElectronOptions = {
  enableFixtures: boolean
  customUserDataDir?: string
}

export const test = base.extend<ElectronFixtures & ElectronOptions>({
  enableFixtures: [true, { option: true }],
  customUserDataDir: [undefined, { option: true }],

  userDataDir: async ({ customUserDataDir }, use) => {
    const dir = customUserDataDir || mkdtempSync(join(tmpdir(), 'devbox-e2e-'))
    await use(dir)
    if (!customUserDataDir) {
      try {
        rmSync(dir, { recursive: true, force: true })
      } catch {
        // Ignore cleanup error if files are locked during exit
      }
    }
  },

  electronApp: async ({ userDataDir, enableFixtures }, use) => {
    const mainPath = join(__dirname, '../../out/main/index.js')
    const app = await electron.launch({
      args: [mainPath],
      env: {
        ...process.env,
        DEVBOX_USER_DATA_DIR: userDataDir,
        DEVBOX_FIXTURES: enableFixtures ? '1' : '0',
        DEVBOX_HEADLESS: '1'
      }
    })

    await use(app)

    await app.close().catch(() => {})
  },

  mainWindow: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    await use(page)
  }
})

export { expect } from '@playwright/test'
