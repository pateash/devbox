export function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === 'github.com' || url.hostname.endsWith('.atlassian.net'))
  } catch {
    return false
  }
}
