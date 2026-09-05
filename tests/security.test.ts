import { describe, expect, it } from 'vitest'
import { isSafeExternalUrl } from '../src/main/urls'
describe('external URL validation', () => { it('allows provider pages only', () => { expect(isSafeExternalUrl('https://github.com/openai/codex')).toBe(true); expect(isSafeExternalUrl('https://example.atlassian.net/browse/ABC-1')).toBe(true); expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false); expect(isSafeExternalUrl('https://evil.example')).toBe(false) }) })
