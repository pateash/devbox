import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DevBoxStore, validateName } from '../src/main/storage'
const stores: DevBoxStore[] = []; function store(): DevBoxStore { const value = new DevBoxStore(join(mkdtempSync(join(tmpdir(), 'devbox-')), 'test.sqlite')); stores.push(value); return value } afterEach(() => stores.splice(0).forEach((item) => item.close()))
describe('workspace storage', () => { it('trims names, keeps selection and isolates preferences', () => { const db = store(); const first = db.createWorkspace('  Acme  '); const second = db.createWorkspace('Personal'); db.selectWorkspace(first.id); db.setTheme(first.id, 'light'); expect(first.name).toBe('Acme'); expect(db.currentWorkspace()?.id).toBe(first.id); expect(db.getTheme(second.id)).toBe('dark') }); it('enforces case-insensitive uniqueness and typed deletion', () => { const db = store(); const workspace = db.createWorkspace('Acme'); expect(() => db.createWorkspace('acme')).toThrow(); expect(() => db.deleteWorkspace(workspace.id, 'wrong')).toThrow(); db.deleteWorkspace(workspace.id, 'Acme'); expect(db.listWorkspaces()).toHaveLength(0) }); it('validates workspace names', () => { expect(() => validateName('   ')).toThrow(); expect(() => validateName('a'.repeat(81))).toThrow() }) })
