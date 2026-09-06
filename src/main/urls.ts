export function isSafeExternalUrl(value: string, jiraOrigins: string[] = []): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === 'github.com' || jiraOrigins.includes(url.origin))
  } catch {
    return false
  }
}
