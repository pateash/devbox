import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DevBoxStore, validateName } from '../src/main/storage'
const stores: DevBoxStore[] = []; function store(): DevBoxStore { const value = new DevBoxStore(join(mkdtempSync(join(tmpdir(), 'devbox-')), 'test.sqlite')); stores.push(value); return value } afterEach(() => stores.splice(0).forEach((item) => item.close()))
describe('workspace storage', () => { it('trims names, keeps selection and isolates preferences', () => { const db = store(); const first = db.createWorkspace('  Acme  '); const second = db.createWorkspace('Personal'); db.selectWorkspace(first.id); db.setTheme(first.id, 'light'); expect(first.name).toBe('Acme'); expect(db.currentWorkspace()?.id).toBe(first.id); expect(db.getTheme(second.id)).toBe('dark') }); it('enforces case-insensitive uniqueness and typed deletion', () => { const db = store(); const workspace = db.createWorkspace('Acme'); expect(() => db.createWorkspace('acme')).toThrow(); expect(() => db.deleteWorkspace(workspace.id, 'wrong')).toThrow(); db.deleteWorkspace(workspace.id, 'Acme'); expect(db.listWorkspaces()).toHaveLength(0) }); it('validates workspace names', () => { expect(() => validateName('   ')).toThrow(); expect(() => validateName('a'.repeat(81))).toThrow() }) })

describe('repository-scoped work', () => {
  it('keeps a workspace repository attached when GitHub reconnects', () => {
    const db = store(); const workspace = db.createWorkspace('Acme'); const integrationId = db.createGlobalGitHub('octocat', Buffer.from('old-token'), ['pateash/devbox'])
    db.setAssignedRepositories(workspace.id, ['pateash/devbox'])
    expect(db.createGlobalGitHub('octocat', Buffer.from('new-token'), ['pateash/devbox'])).toBe(integrationId)
    expect(db.assignedRepositories(workspace.id)).toEqual(['pateash/devbox'])
  })

  it('allows reusable assignments and removes only stale workspace rows', () => {
    const db = store(); const first = db.createWorkspace('Acme'); const second = db.createWorkspace('Personal')
    db.createGlobalGitHub('octocat', Buffer.from('encrypted-token'), ['octocat/api', 'octocat/web'])
    db.setAssignedRepositories(first.id, ['octocat/api']); db.setAssignedRepositories(second.id, ['octocat/api'])
    db.replaceWorkspaceGitHubWork(first.id, [{ repository: 'octocat/api', title: 'API PR', reason: 'Open PR authored by you', priority: 'normal', url: 'https://github.com/octocat/api/pull/1', updatedAt: '2026-01-01T00:00:00.000Z', kind: 'pr' }, { repository: 'octocat/web', title: 'Web issue', reason: 'Issue assigned to you', priority: 'normal', url: 'https://github.com/octocat/web/issues/2', updatedAt: '2026-01-02T00:00:00.000Z', kind: 'issue' }])
    db.replaceWorkspaceGitHubWork(second.id, [{ repository: 'octocat/api', title: 'Separate workspace', reason: 'Issue assigned to you', priority: 'normal', url: 'https://github.com/octocat/api/issues/3', updatedAt: '2026-01-03T00:00:00.000Z', kind: 'issue' }])
    db.setAssignedRepositories(first.id, ['octocat/web'])
    expect(db.assignedRepositories(second.id)).toEqual(['octocat/api'])
    expect(db.workItems(first.id).map((item) => item.title)).toEqual(['Web issue'])
    expect(db.workItems(second.id).map((item) => item.title)).toEqual(['Separate workspace'])
    expect(() => db.setAssignedRepositories(first.id, ['octocat/api', 'octocat/web'])).toThrow('only one GitHub repository')
    expect(() => db.setAssignedRepositories(first.id, ['other/private'])).toThrow('not available')
  })
})

describe('GitHub backup storage', () => {
  it('exports portable data without credentials and restores it as needing reauthentication', () => {
    const source = store(); const workspace = source.createWorkspace('Acme'); source.setTheme(workspace.id, 'light')
    source.createGlobalGitHub('octocat', Buffer.from('encrypted-token'), ['octocat/private'])
    source.configureBackup({ id: 9, fullName: 'octocat/devbox-backup', defaultBranch: 'main' })
    const snapshot = source.backupSnapshot()
    expect(JSON.stringify(snapshot)).not.toContain('encrypted-token')
    expect(snapshot.data).not.toHaveProperty('global_secret_references')
    const restored = store(); restored.restoreBackup(snapshot)
    expect(restored.listWorkspaces().map((item) => item.name)).toEqual(['Acme'])
    expect(restored.getTheme(workspace.id)).toBe('light')
    expect(restored.globalGitHub()?.state).toBe('needs_reauth')
    expect(restored.backupStatus().dirty).toBe(true)
  })
  it('rejects an invalid backup before changing local data', () => {
    const db = store(); db.createWorkspace('Keep me')
    expect(() => db.restoreBackup({ format: 'devbox-backup', version: 2, data: {} })).toThrow('not supported')
    expect(db.listWorkspaces().map((item) => item.name)).toEqual(['Keep me'])
  })
})
