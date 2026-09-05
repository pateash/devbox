export const BRIDGE_VERSION = '1' as const
export type Theme = 'dark' | 'light' | 'system'
export interface Workspace { id: string; name: string; createdAt: string; updatedAt: string; lastOpenedAt: string }
export interface WorkspaceSummary extends Workspace { integrationCount: number }
export interface DashboardData { workspace: Workspace; fixtureMode: boolean; message: string; fixtureItems: Array<{ title: string; reason: string }> }
export interface IntegrationSummary { id: string; provider: 'github'; state: 'connected' | 'needs_reauth' | 'error'; displayName: string; lastSyncedAt: string | null; lastError: string | null; repositories: Array<{ fullName: string; selected: boolean }> }
export interface WorkItem { id: string; title: string; reason: string; priority: 'urgent' | 'high' | 'normal'; url: string; updatedAt: string; kind: 'pr' | 'notification' }
export interface DevBoxApi {
  version: typeof BRIDGE_VERSION
  workspaces: { list(): Promise<WorkspaceSummary[]>; create(input: { name: string }): Promise<Workspace>; rename(id: string, input: { name: string }): Promise<Workspace>; remove(id: string, input: { confirmationName: string }): Promise<void>; current(): Promise<Workspace | null>; select(id: string): Promise<Workspace> }
  dashboard: { get(workspaceId: string): Promise<DashboardData> }
  github: { beginConnect(workspaceId: string): Promise<{ userCode: string; verificationUri: string }>; completeConnect(workspaceId: string): Promise<IntegrationSummary>; list(workspaceId: string): Promise<IntegrationSummary[]>; setRepositories(integrationId: string, repositories: string[]): Promise<void>; refresh(integrationId: string): Promise<void>; disconnect(integrationId: string): Promise<void>; workItems(workspaceId: string): Promise<WorkItem[]> }
  preferences: { getTheme(workspaceId: string): Promise<Theme>; setTheme(workspaceId: string, theme: Theme): Promise<void> }
  links: { openExternal(url: string): Promise<void> }
  events: { subscribeWorkspaceChanges(listener: () => void): () => void }
}
