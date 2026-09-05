export const BRIDGE_VERSION = '1' as const
export type Theme = 'dark' | 'light' | 'system'
export interface Workspace { id: string; name: string; createdAt: string; updatedAt: string; lastOpenedAt: string }
export interface WorkspaceSummary extends Workspace { integrationCount: number }
export interface DashboardData { workspace: Workspace; fixtureMode: boolean; message: string; fixtureItems: Array<{ title: string; reason: string }> }
export interface IntegrationSummary { id: string; provider: 'github'; state: 'connected' | 'needs_reauth' | 'error'; displayName: string; lastSyncedAt: string | null; lastError: string | null; repositories: Array<{ fullName: string; selected: boolean }> }
export interface WorkItem { id: string; repository: string; title: string; reason: string; priority: 'urgent' | 'high' | 'normal'; url: string; updatedAt: string; kind: 'pr' | 'issue' }
export interface BackupRepository { id: number; fullName: string; defaultBranch: string }
export interface BackupStatus { repository: BackupRepository | null; lastBackedUpAt: string | null; lastCommitUrl: string | null; lastError: string | null; dirty: boolean }
export interface DevBoxApi {
  version: typeof BRIDGE_VERSION
  workspaces: { list(): Promise<WorkspaceSummary[]>; create(input: { name: string }): Promise<Workspace>; rename(id: string, input: { name: string }): Promise<Workspace>; remove(id: string, input: { confirmationName: string }): Promise<void>; archive(id: string): Promise<void>; current(): Promise<Workspace | null>; select(id: string): Promise<Workspace> }
  dashboard: { get(workspaceId: string): Promise<DashboardData> }
  github: { connectPersonalAccessToken(token: string): Promise<IntegrationSummary>; global(): Promise<IntegrationSummary | null>; assignedRepositories(workspaceId: string): Promise<string[]>; setAssignedRepositories(workspaceId: string, repositories: string[]): Promise<void>; refreshGlobal(): Promise<void>; refreshWorkspace(workspaceId: string): Promise<void>; disconnect(): Promise<void>; workItems(workspaceId: string): Promise<WorkItem[]> }
  backups: { status(): Promise<BackupStatus>; repositories(): Promise<BackupRepository[]>; connectToken(token: string): Promise<BackupRepository[]>; configure(repositoryId: number, acknowledgement: true): Promise<BackupStatus>; run(): Promise<BackupStatus>; restoreLatest(confirmation: 'RESTORE'): Promise<void> }
  preferences: { getTheme(workspaceId: string): Promise<Theme>; setTheme(workspaceId: string, theme: Theme): Promise<void> }
  links: { openExternal(url: string): Promise<void> }
  events: { subscribeWorkspaceChanges(listener: () => void): () => void }
}
