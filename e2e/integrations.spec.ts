import { test, expect } from './fixtures/electron-app'

test.describe('Integrations & Provider Setup Views', () => {
  test.beforeEach(async ({ mainWindow }) => {
    // Start with a workspace created
    await mainWindow.locator('#workspace-name').fill('Integrations Test Lab')
    await mainWindow.locator('button[type="submit"]:has-text("Save")').click()
    await expect(mainWindow.locator('.app-shell')).toBeVisible()
  })

  test('navigates to workspace Integrations panel', async ({ mainWindow }) => {
    await mainWindow.locator('.tools-heading button:has-text("Global integrations")').click()

    // Title should be Global integrations
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Global integrations')

    // Should show GitHub workspace integration connection screen
    await expect(mainWindow.locator('.integration-empty h2')).toContainText(
      'Bring GitHub into this workspace'
    )
    await expect(mainWindow.locator('#github-token')).toBeVisible()
  })

  test('navigates to Jira integration screen with Cloud and Data Center options', async ({
    mainWindow
  }) => {
    // Navigate to Jira via Tickets nav item
    await mainWindow.locator('nav.primary-nav button:has-text("Tickets")').click()
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Tickets')

    // Verify Jira setup form
    await expect(mainWindow.locator('.integration-empty h2')).toContainText(
      'Bring Jira into this workspace'
    )

    // Deployment dropdown should have Jira Cloud and Jira Data Center
    const deploymentSelect = mainWindow.locator('.token-form select')
    await expect(deploymentSelect).toBeVisible()
    await expect(deploymentSelect.locator('option')).toHaveCount(2)

    // Verify inputs for Jira Cloud
    await expect(mainWindow.locator('input[placeholder="https://your-site.atlassian.net"]')).toBeVisible()
    await expect(mainWindow.locator('input[type="email"]')).toBeVisible()

    // Switch to Jira Data Center and verify email input disappears
    await deploymentSelect.selectOption('data-center')
    await expect(mainWindow.locator('input[type="email"]')).not.toBeVisible()
  })

  test('displays empty state for Git view when no repository is attached', async ({ mainWindow }) => {
    // From Git view with no repository attached
    await mainWindow.locator('nav.primary-nav button:has-text("Git")').click()
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Git')
    await expect(mainWindow.locator('.empty-state h2')).toHaveText('Attach a repository to Git')
    await expect(mainWindow.locator('.empty-state button')).toHaveText('Choose repository')
  })

  test('navigates to Global Settings and verifies backup controls', async ({ mainWindow }) => {
    // Click global settings button in the rail
    await mainWindow.locator('button[aria-label="Global settings"]').click()
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Global settings')

    // Verify appearance section
    await expect(mainWindow.locator('.settings-view h1')).toHaveText('Global settings')
    await expect(mainWindow.locator('.settings-view h2:has-text("Appearance")')).toBeVisible()

    // Verify backup section
    await expect(mainWindow.locator('.backup-settings h2')).toHaveText('GitHub backup')
    await expect(mainWindow.locator('.backup-warning')).toContainText('Backups are not encrypted')
  })

  test('attaches repository and displays PRs and issues in Git section when GitHub is connected', async ({
    mainWindow,
    userDataDir
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execFileSync } = require('node:child_process')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const electronBin = require('electron')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path')
    const dbPath = path.join(userDataDir, 'devbox.sqlite')
    const script = `
      const Database = require('better-sqlite3');
      const db = new Database(${JSON.stringify(dbPath)});
      db.prepare("INSERT OR REPLACE INTO global_integrations VALUES (?, 'github', 'connected', ?, ?, NULL, NULL)").run('test-integration', 'pateash', JSON.stringify(['pateash/devbox', 'codingtools/cdt']));
      db.close();
    `
    execFileSync(electronBin, ['-e', script], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
    })

    await mainWindow.reload()
    await expect(mainWindow.locator('.app-shell')).toBeVisible()

    // Click "Git" nav item; displays empty state with "Choose repository"
    await mainWindow.locator('nav.primary-nav button:has-text("Git")').click()
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Git')
    await expect(mainWindow.locator('.empty-state h2')).toHaveText('Attach a repository to Git')

    // Click "Choose repository" to open Integrations panel
    await mainWindow.locator('.empty-state button:has-text("Choose repository")').click()
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Choose repository')
    await expect(mainWindow.locator('.repositories-panel h2')).toHaveText(
      'Choose a GitHub repository'
    )

    // Select repository from suggestions
    const repoButton = mainWindow.locator('.repository-suggestions button:has-text("pateash/devbox")')
    await expect(repoButton).toBeVisible()
    await repoButton.click()
    await expect(mainWindow.locator('.repositories-panel h2')).toHaveText('pateash/devbox')

    // Save repository
    await mainWindow.locator('button:has-text("Save repository")').click()

    // Navigate to Git section
    await mainWindow.locator('nav.primary-nav button:has-text("Git")').click()
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Git')

    // Verify Git section shows repository header and PRs & Issues
    await expect(mainWindow.locator('.repository-heading h1')).toHaveText('pateash/devbox')
    await expect(mainWindow.locator('.git-work-section h2')).toHaveText('Pull requests & issues')
    await expect(mainWindow.locator('.work-list .work-row')).toHaveCount(3)

    // Verify both PRs and Issues are rendered with their badges
    const rows = mainWindow.locator('.work-list .work-row')
    await expect(rows.filter({ hasText: 'Pull request' })).toHaveCount(2)
    await expect(rows.filter({ hasText: 'GitHub issue' })).toHaveCount(1)
  })
})
