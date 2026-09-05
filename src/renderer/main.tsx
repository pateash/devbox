import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { Archive, Bell, Blocks, Boxes, ChevronDown, CircleDot, ExternalLink, FolderKanban, Github, GitPullRequest, Inbox, LayoutGrid, Plus, RefreshCw, Search, Settings, Star, Wrench } from 'lucide-react'
import type { IntegrationSummary, Theme, WorkItem, Workspace, WorkspaceSummary } from '../shared/contracts'
import { createBrowserDevboxApi } from './browser-api'
import './styles.css'

const client = new QueryClient()
type Page = 'Overview' | 'Inbox' | 'My Work' | 'Saved' | 'Integrations' | 'GlobalIntegrations' | 'GitHub' | 'Jira' | 'Bitbucket' | 'GlobalSettings'
const MIN_SIDEBAR_WIDTH = 240
const MAX_SIDEBAR_WIDTH = 480
const DEFAULT_SIDEBAR_WIDTH = 308
const primaryNav: Array<{ label: Page; icon: typeof Boxes }> = [{ label: 'Overview', icon: Boxes }, { label: 'Inbox', icon: Inbox }, { label: 'My Work', icon: FolderKanban }, { label: 'Saved', icon: Star }]
const integrationCatalog: Array<{ id: 'github' | 'bitbucket' | 'jira'; name: string; category: 'Git' | 'Kanban'; description: string; icon: typeof Github; available: boolean }> = [
  { id: 'github', name: 'GitHub', category: 'Git', description: 'Review requests, failing checks, and mentions in one local attention view.', icon: Github, available: true },
  { id: 'bitbucket', name: 'Bitbucket', category: 'Git', description: 'Pull requests and build activity from Bitbucket workspaces.', icon: LayoutGrid, available: false },
  { id: 'jira', name: 'Jira', category: 'Kanban', description: 'Assigned work and linked issues from your configured Jira projects.', icon: CircleDot, available: false }
]

function workspaceInitials(name: string): string { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'DB' }
function AppMark({ className = '' }: { className?: string }): React.ReactElement { return <img className={'app-mark ' + className} src="/resources/devbox-icon.png" alt="" /> }

function WorkspaceForm({ current, done, cancel }: { current?: Workspace; done: () => void; cancel?: () => void }): React.ReactElement {
  const [name, setName] = useState(current?.name ?? '')
  const [error, setError] = useState('')
  useEffect(() => { setName(current?.name ?? ''); setError('') }, [current?.id])
  async function submit(event: React.FormEvent): Promise<void> { event.preventDefault(); try { if (current) await window.devbox.workspaces.rename(current.id, { name }); else await window.devbox.workspaces.create({ name }); done() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save workspace.') } }
  return <form className="workspace-form" onSubmit={(event) => void submit(event)}><label htmlFor="workspace-name">{current ? 'Rename workspace' : 'New workspace'}</label><input id="workspace-name" aria-label="Workspace name" autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Workspace name" /><div className="form-actions"><button type="submit">Save</button>{cancel && <button type="button" className="secondary" onClick={cancel}>Cancel</button>}</div>{error && <span className="error">{error}</span>}</form>
}

function WorkspaceRail({ current, workspaces, select, create, integrations, settings }: { current: Workspace; workspaces: WorkspaceSummary[]; select: (id: string) => void; create: () => void; integrations: () => void; settings: () => void }): React.ReactElement {
  return <aside className="workspace-rail" aria-label="Workspaces"><div className="traffic-lights" aria-hidden="true"><i /><i /><i /></div><div className="workspace-avatars">{workspaces.slice(0, 5).map((workspace) => <button key={workspace.id} className={'workspace-avatar ' + (workspace.id === current.id ? 'selected' : '')} onClick={() => select(workspace.id)} aria-label={'Switch to ' + workspace.name} aria-pressed={workspace.id === current.id}>{workspaceInitials(workspace.name)}{workspace.id === current.id && <span className="presence" />}</button>)}</div><div className="rail-actions"><button className="rail-button" onClick={integrations} aria-label="Global integrations"><Blocks size={19} /></button><button className="rail-button" onClick={create} aria-label="Create workspace"><Plus size={19} /></button><button className="rail-button" onClick={settings} aria-label="Global settings"><Settings size={18} /></button></div></aside>
}

function WorkspaceMenu({ current, workspaces, creating, setCreating, select, done }: { current: Workspace; workspaces: WorkspaceSummary[]; creating: boolean; setCreating: (value: boolean) => void; select: (id: string) => void; done: () => void }): React.ReactElement {
  async function archive(): Promise<void> { await window.devbox.workspaces.remove(current.id,{confirmationName:current.name}); done() }
  return <div className="workspace-menu" role="dialog" aria-label="Manage workspaces">{creating ? <WorkspaceForm done={done} cancel={() => setCreating(false)} /> : <><WorkspaceForm current={current} done={done} /><div className="menu-divider" /><button className="menu-action" onClick={() => setCreating(true)}><Plus size={16} />Create workspace</button><button className="menu-action" onClick={() => void archive()}><Archive size={16} />Archive workspace</button>{workspaces.filter((workspace) => workspace.id !== current.id).length > 0 && <div className="workspace-list"><p>Switch workspace</p>{workspaces.filter((workspace) => workspace.id !== current.id).map((workspace) => <button className="menu-action" key={workspace.id} onClick={() => select(workspace.id)}>{workspaceInitials(workspace.name)}<span>{workspace.name}</span></button>)}</div>}</>}</div>
}

function ToolGroup({ label, icon: Icon, children }: { label: string; icon: typeof Github; children: React.ReactNode }): React.ReactElement { return <section className="tool-group" aria-label={label + ' tools'}><p className="tool-group-label"><Icon size={14} />{label}</p>{children}</section> }
function ToolButton({ active, label, detail, icon: Icon, onClick, unavailable = false, connected = false }: { active: boolean; label: string; detail: string; icon: typeof Github; onClick: () => void; unavailable?: boolean; connected?: boolean }): React.ReactElement { return <button className={'tool-button ' + (active ? 'active' : '')} onClick={onClick} aria-current={active ? 'page' : undefined}><span className="tool-icon"><Icon size={17} /></span><span className="tool-copy"><strong>{label}</strong><small>{detail}</small></span>{unavailable ? <span className="tool-status">Soon</span> : connected && <span className="tool-presence" />}</button> }

function Sidebar({ current, workspaces, page, integration, menuOpen, creating, setMenuOpen, setCreating, setPage, select, done }: { current: Workspace; workspaces: WorkspaceSummary[]; page: Page; integration?: IntegrationSummary; menuOpen: boolean; creating: boolean; setMenuOpen: (value: boolean) => void; setCreating: (value: boolean) => void; setPage: (page: Page) => void; select: (id: string) => void; done: () => void }): React.ReactElement {
  const toolsActive = page === 'Integrations' || page === 'GitHub'
  return <aside className="workspace-sidebar">
    <div className="sidebar-heading"><button className="workspace-switcher" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>{current.name}<ChevronDown size={18} /></button><button className="compose-button" onClick={() => setPage('Inbox')} aria-label="Open inbox"><Bell size={18} /></button>{menuOpen && <WorkspaceMenu current={current} workspaces={workspaces} creating={creating} setCreating={setCreating} select={select} done={done} />}</div>
    <button className="sidebar-search" onClick={() => setPage('Inbox')}><Search size={18} />Find work, a tool, or a workspace<span>⌘K</span></button>
    <nav className="primary-nav" aria-label="Primary navigation">{primaryNav.map(({ label, icon: Icon }) => <button key={label} className={page === label ? 'active' : ''} onClick={() => setPage(label)}><Icon size={18} />{label}{label === 'Inbox' && <span className="unread-count">{integration ? '•' : ''}</span>}</button>)}</nav>
    <div className="sidebar-divider" />
    <div className="tools-heading"><button className={toolsActive ? 'active' : ''} onClick={() => setPage('Integrations')}><Wrench size={19} />Tools</button><button className="add-integration-button" onClick={() => setPage('Integrations')} aria-label="Browse integrations"><Plus size={16} /></button></div>
    {integration ? <div className="tool-stack"><ToolGroup label="Git" icon={GitPullRequest}><ToolButton active={page === 'GitHub'} label="GitHub" detail={integration.displayName} icon={Github} onClick={() => setPage('GitHub')} connected /></ToolGroup></div> : <button className="tools-empty" onClick={() => setPage('Integrations')}><Plus size={15} />Add your first integration</button>}
    <div className="sidebar-footer"><span>Local-first</span></div>
  </aside>
}

function GitHubConnect({ integration, refresh }: { integration?: IntegrationSummary; refresh: () => void }): React.ReactElement {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function connect(event: React.FormEvent): Promise<void> { event.preventDefault(); setBusy(true); setError(''); try { await window.devbox.github.connectPersonalAccessToken(token); setToken(''); refresh() } catch (reason) { setError(reason instanceof Error ? reason.message : 'GitHub could not verify that token.') } finally { setBusy(false) } }
  if (integration) return <><section className="integration-panel"><div className="provider-icon github"><Github size={28} /></div><div className="integration-copy"><p>Connected globally</p><h2>GitHub · {integration.displayName}</h2><span>{integration.lastError ?? (integration.lastSyncedAt ? 'Last synced ' + new Date(integration.lastSyncedAt).toLocaleString() : 'Ready to sync')}</span></div><div className="integration-actions"><button className="secondary" onClick={() => void window.devbox.github.refreshGlobal().then(refresh)}><RefreshCw size={16} />Refresh</button><button className="danger-button" onClick={() => void window.devbox.github.disconnect().then(refresh)}>Disconnect</button></div></section><section className="repositories-panel"><div><p className="eyebrow">This workspace</p><h2>{integration.repositories.length} assigned GitHub {integration.repositories.length === 1 ? 'repository' : 'repositories'}</h2><p>Assignments keep each workspace focused. Global integrations are managed from the sidebar.</p></div><ul>{integration.repositories.slice(0, 6).map((repository) => <li key={repository.fullName}><Github size={15} />{repository.fullName}</li>)}</ul></section></>
  return <section className="integration-empty"><div className="provider-icon github"><Github size={32} /></div><h2>Bring GitHub into this workspace</h2><p>Use a fine-grained personal access token. DevBox encrypts it in macOS secure storage and only uses it to sync your selected GitHub data.</p><button className="secondary external-link" type="button" onClick={() => void window.devbox.links.openExternal('https://github.com/settings/personal-access-tokens/new')}>Create a GitHub token<ExternalLink size={15} /></button><form className="token-form" onSubmit={(event) => void connect(event)}><label htmlFor="github-token">Personal access token</label><input id="github-token" type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" spellCheck={false} placeholder="github_pat_…" required disabled={busy} /><p>Grant access to the repositories you want DevBox to read, plus pull requests, checks, and notifications.</p><button type="submit" disabled={busy}>{busy ? 'Verifying token…' : 'Save and connect'}</button></form>{error && <p className="error">{error}</p>}</section>
}

function IntegrationDirectory({ integration, openGitHub }: { integration?: IntegrationSummary; openGitHub: () => void }): React.ReactElement {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'All' | 'Git' | 'Kanban'>('All')
  const matching = useMemo(() => integrationCatalog.filter((item) => (category === 'All' || item.category === category) && (item.name + item.category + item.description).toLowerCase().includes(query.trim().toLowerCase())), [category, query])
  return <section className="integration-directory">
    <div className="directory-title"><h1>Integrations</h1><p>Connect the developer tools this workspace relies on. Connected tools appear in the sidebar.</p></div>
    <label className="directory-search"><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search integrations by name or category" aria-label="Search integrations" /></label>
    <div className="directory-filters"><label>Category<select value={category} onChange={(event) => setCategory(event.target.value as 'All' | 'Git' | 'Kanban')}><option value="All">All categories</option><option value="Git">Git</option><option value="Kanban">Kanban</option></select></label></div>
    {integration && <section className="connected-integrations"><div className="directory-section-heading"><h2>Connected to {integration.displayName}</h2><span>1</span></div><article className="connected-integration"><span className="catalog-icon"><Github size={23} /></span><div><h3>GitHub</h3><p>Source control · Connected</p></div><button className="secondary" onClick={openGitHub}>Manage</button></article></section>}
    <section><div className="directory-section-heading"><h2>{integration ? 'Available integrations' : 'Connect an integration'}</h2><span>{matching.length}</span></div><div className="integration-grid">{matching.map((item) => { const Icon = item.icon; const connected = item.id === 'github' && !!integration; return <article className="catalog-card" key={item.id}><span className="catalog-icon"><Icon size={25} /></span><div className="catalog-card-copy"><div><h3>{item.name}</h3><span className={item.available ? 'available-badge' : 'planned-badge'}>{connected ? 'Connected' : item.available ? item.category : 'Planned'}</span></div><p>{item.description}</p></div><button className={item.available ? 'catalog-connect' : 'secondary'} disabled={!item.available} onClick={item.available ? openGitHub : undefined}>{connected ? 'Manage' : item.available ? 'Connect' : 'Coming soon'}</button></article> })}</div>{matching.length === 0 && <div className="catalog-no-results"><Search size={22} /><p>No integrations match that search.</p></div>}</section>
  </section>
}

function PlannedTool({ name, category }: { name: string; category: string }): React.ReactElement { return <section className="planned-tool"><span className="coming-soon">Planned integration</span><h2>{name} is not connected yet</h2><p>DevBox’s {category} area is ready in the navigation, but this provider has not been implemented in this build. Its status is shown honestly so it cannot be mistaken for a live integration.</p><button className="secondary" disabled>Coming soon</button></section> }
function WorkRow({ item }: { item: WorkItem }): React.ReactElement { const ItemIcon = item.kind === 'pr' ? GitPullRequest : Bell; return <article className={'work-row ' + item.priority}><div className="row-source"><ItemIcon size={19} /></div><div className="row-copy"><p>{item.reason}</p><h3>{item.title}</h3><span>{item.kind === 'pr' ? 'Pull request' : 'GitHub notification'} · Updated {new Date(item.updatedAt).toLocaleDateString()}</span></div><div className="row-action"><i aria-label={item.priority + ' priority'} /><button className="secondary" onClick={() => void window.devbox.links.openExternal(item.url)}>Open<ExternalLink size={15} /></button></div></article> }

function WorkView({ page, items, hasIntegration, goToGitHub }: { page: Page; items: WorkItem[]; hasIntegration: boolean; goToGitHub: () => void }): React.ReactElement {
  const heading = page === 'Inbox' ? 'Inbox' : page === 'My Work' ? 'My work' : page === 'Saved' ? 'Saved work' : 'Developer overview'
  if (page === 'Saved') return <section className="empty-state"><Star size={31} /><h2>No saved work yet</h2><p>Save a work item to keep it close without making it compete with your active attention list.</p></section>
  return <><div className="content-title"><div><h1>{heading}</h1><p>{page === 'Overview' ? 'A quiet view of what needs your attention now.' : 'Actionable items from the tools connected to this workspace.'}</p></div></div><section className="attention-section"><div className="section-heading"><h2>{page === 'My Work' ? 'Active work' : 'Needs your attention'}</h2>{items.length > 0 && <span>{items.length}</span>}</div>{items.length ? <div className="work-list">{items.map((item) => <WorkRow key={item.id} item={item} />)}</div> : <div className="empty-state"><Inbox size={31} /><h2>{hasIntegration ? 'Nothing needs your attention' : 'Your workspace is ready for its first tool'}</h2><p>{hasIntegration ? 'Refresh GitHub when you want to check for new review requests, failed checks, or mentions.' : 'Connect GitHub to bring in the work that needs a response.'}</p>{!hasIntegration && <button onClick={goToGitHub}>Connect GitHub</button>}</div>}</section></>
}

function GlobalSettingsView({ theme, onToggle }: { theme: Theme; onToggle: () => void }): React.ReactElement { return <section className="settings-view"><p className="eyebrow">Applies to DevBox</p><h1>Global settings</h1><div><div><h2>Appearance</h2><p>Choose the contrast for every workspace on this Mac.</p></div><button onClick={onToggle}>{theme === 'dark' ? 'Use light mode' : 'Use dark mode'}</button></div></section> }

function App(): React.ReactElement {
  const [page, setPage] = useState<Page>('Overview')
  const [theme, setTheme] = useState<Theme>('dark')
  const [refreshing, setRefreshing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = Number(window.localStorage.getItem('devbox:sidebar-width:v1'))
    return Number.isFinite(stored) ? Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, stored)) : DEFAULT_SIDEBAR_WIDTH
  })
  const [isResizing, setIsResizing] = useState(false)
  const resizeStart = useRef<{ pointerX: number; width: number } | null>(null)
  const { data: workspaces = [], refetch: refetchWorkspaces } = useQuery({ queryKey: ['workspaces'], queryFn: () => window.devbox.workspaces.list() })
  const { data: current, refetch: refetchCurrent } = useQuery({ queryKey: ['current'], queryFn: () => window.devbox.workspaces.current() })
  const { data: globalIntegration, refetch: refetchIntegrations } = useQuery({ queryKey: ['github-global'], queryFn: () => window.devbox.github.global() })
  const { data: assignedRepositories = [] } = useQuery({ queryKey: ['github-assigned', current?.id], enabled: !!current, queryFn: () => window.devbox.github.assignedRepositories(current!.id) })
  const { data: items = [], refetch: refetchItems } = useQuery({ queryKey: ['items', current?.id], enabled: !!current, queryFn: () => window.devbox.github.workItems(current!.id) })
  const integration = globalIntegration ? { ...globalIntegration, repositories: globalIntegration.repositories.filter((repository) => assignedRepositories.includes(repository.fullName)) } : undefined
  const refresh = (): void => { void (async () => { setRefreshing(true); try { if (globalIntegration) await window.devbox.github.refreshGlobal(); await Promise.all([refetchIntegrations(), refetchItems(), refetchWorkspaces()]) } finally { setRefreshing(false) } })() }
  const switchWorkspace = (id: string): void => { void window.devbox.workspaces.select(id).then(() => { setMenuOpen(false); setCreating(false); void refetchCurrent(); void refetchWorkspaces() }) }
  const finishWorkspaceChange = (): void => { setMenuOpen(false); setCreating(false); void refetchCurrent(); void refetchWorkspaces() }
  const title = useMemo(() => page === 'GitHub' ? 'Git' : page === 'Jira' ? 'Kanban' : page === 'Bitbucket' ? 'Git' : page, [page])
  const clampSidebarWidth = useCallback((width: number): number => Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width)), [])
  const startResize = useCallback((event: React.PointerEvent<HTMLDivElement>): void => {
    if (window.innerWidth <= 760) return
    event.preventDefault()
    event.currentTarget.focus()
    resizeStart.current = { pointerX: event.clientX, width: sidebarWidth }
    setIsResizing(true)
  }, [sidebarWidth])
  const resizeWithKeyboard = useCallback((event: React.KeyboardEvent<HTMLDivElement>): void => {
    const direction = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
    if (!direction) return
    event.preventDefault()
    setSidebarWidth((width) => clampSidebarWidth(width + direction * 16))
  }, [clampSidebarWidth])
  useEffect(() => window.devbox.events.subscribeWorkspaceChanges(refresh), [])
  useEffect(() => { setTheme((window.localStorage.getItem('devbox:global-theme:v1') as Theme | null) ?? 'dark') }, [])
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => { window.localStorage.setItem('devbox:sidebar-width:v1', String(sidebarWidth)) }, [sidebarWidth])
  useEffect(() => {
    if (!isResizing) return
    const move = (event: PointerEvent): void => {
      if (!resizeStart.current) return
      setSidebarWidth(clampSidebarWidth(resizeStart.current.width + event.clientX - resizeStart.current.pointerX))
    }
    const stop = (): void => { resizeStart.current = null; setIsResizing(false) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop) }
  }, [clampSidebarWidth, isResizing])
  if (!current) return <main className="welcome"><div className="welcome-mark"><AppMark /></div><h1>Create your first workspace</h1><p>Keep each organization’s developer attention separate and local to this Mac.</p><WorkspaceForm done={() => void refetchCurrent()} /></main>
  return <div className={'app-shell ' + (isResizing ? 'is-resizing' : '')} style={{ '--workspace-sidebar-width': sidebarWidth + 'px' } as React.CSSProperties}><WorkspaceRail current={current} workspaces={workspaces} select={switchWorkspace} create={() => { setMenuOpen(true); setCreating(true) }} integrations={() => setPage('GlobalIntegrations')} settings={() => setPage('GlobalSettings')} /><Sidebar current={current} workspaces={workspaces} page={page} integration={integration} menuOpen={menuOpen} creating={creating} setMenuOpen={setMenuOpen} setCreating={setCreating} setPage={setPage} select={switchWorkspace} done={finishWorkspaceChange} /><div className="sidebar-resizer" role="separator" aria-label="Resize workspace sidebar" aria-orientation="vertical" aria-valuemin={MIN_SIDEBAR_WIDTH} aria-valuemax={MAX_SIDEBAR_WIDTH} aria-valuenow={sidebarWidth} tabIndex={0} onPointerDown={startResize} onKeyDown={resizeWithKeyboard} /><main className="main-content"><header className="topbar"><div className="breadcrumb"><span>{current.name}</span><ChevronDown size={15} /><b>{title}</b></div><button className="topbar-button" onClick={refresh} aria-label="Refresh workspace" disabled={refreshing}><RefreshCw className={refreshing ? 'spin' : ''} size={17} />{refreshing ? 'Refreshing…' : 'Refresh'}</button></header><div className="content-body">{page === 'GlobalIntegrations' ? <GitHubConnect integration={globalIntegration ?? undefined} refresh={refresh} /> : page === 'Integrations' ? <IntegrationDirectory integration={integration} openGitHub={() => setPage('GitHub')} /> : page === 'GitHub' ? <GitHubConnect integration={integration} refresh={refresh} /> : page === 'Jira' ? <PlannedTool name="Jira" category="Kanban" /> : page === 'Bitbucket' ? <PlannedTool name="Bitbucket" category="Git" /> : page === 'GlobalSettings' ? <GlobalSettingsView theme={theme} onToggle={() => { const next = theme === 'dark' ? 'light' : 'dark'; setTheme(next); window.localStorage.setItem('devbox:global-theme:v1',next) }} /> : <WorkView page={page} items={items} hasIntegration={!!integration} goToGitHub={() => setPage('GitHub')} />}</div></main></div>
}

if (typeof window.devbox === 'undefined') window.devbox = createBrowserDevboxApi()
createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={client}><App /></QueryClientProvider></React.StrictMode>)
