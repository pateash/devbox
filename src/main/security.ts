import { safeStorage } from 'electron'
export { isSafeExternalUrl } from './urls'
export class TokenVault {
  encrypt(token: string): Buffer { if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure storage is unavailable.'); return safeStorage.encryptString(token) }
  decrypt(blob: Buffer): string { if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure storage is unavailable.'); return safeStorage.decryptString(blob) }
}
