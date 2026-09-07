export function isSafeExternalUrl(value: string, jiraOrigins: string[] = []): boolean {
  try {
    const url = new URL(value)
    const atlassianTokenPage=url.hostname==='id.atlassian.com'&&url.pathname==='/manage-profile/security/api-tokens'&&url.search===''&&url.hash===''
    return url.protocol === 'https:' && (url.hostname === 'github.com' || jiraOrigins.includes(url.origin) || atlassianTokenPage)
  } catch {
    return false
  }
}
