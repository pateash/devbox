import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { Archive, Blocks, Boxes, Check, ChevronDown, CircleDot, ExternalLink, Filter, Github, GitPullRequest, LayoutGrid, Moon, Plus, RefreshCw, Search, Settings, Sun, TicketCheck, X } from 'lucide-react'
import type { GitHubIntegrationSummary, GitHubRepositoryOwner, GlobalJiraIntegrationSummary, JiraIntegrationSummary, JiraProject, Theme, WorkItem, Workspace, WorkspaceSummary } from '../shared/contracts'
import { createBrowserDevboxApi } from './browser-api'
import '@fontsource/lato/300.css'
import '@fontsource/lato/400.css'
import '@fontsource/lato/700.css'
import '@fontsource/lato/900.css'
import './styles.css'

const client = new QueryClient()
type Page = 'Overview' | 'Integrations' | 'GlobalIntegrations' | 'GlobalGitHub' | 'GitHub' | 'GitIntegration' | 'Jira' | 'Bitbucket' | 'GlobalSettings' | 'WorkspaceSettings'
const MIN_SIDEBAR_WIDTH = 240
const MAX_SIDEBAR_WIDTH = 480
const DEFAULT_SIDEBAR_WIDTH = 308
const workspaceSections: Array<{ label: 'Git' | 'Tickets'; page: 'GitHub' | 'Jira'; icon: typeof Github }> = [{ label: 'Git', page: 'GitHub', icon: GitPullRequest }, { label: 'Tickets', page: 'Jira', icon: CircleDot }]

function workspaceInitials(name: string): string { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'DB' }
function relativeRefreshTime(value: string | null): string { if (!value) return 'Not refreshed yet'; const seconds=Math.max(0,Math.round((Date.now()-new Date(value).getTime())/1000)); if(seconds<60) return 'Refreshed just now'; const minutes=Math.floor(seconds/60); if(minutes<60) return `Refreshed ${minutes} ${minutes===1?'minute':'minutes'} ago`; const hours=Math.floor(minutes/60); if(hours<24) return `Refreshed ${hours} ${hours===1?'hour':'hours'} ago`; const days=Math.floor(hours/24); return `Refreshed ${days} ${days===1?'day':'days'} ago` }
function AppMark({ className = '' }: { className?: string }): React.ReactElement { return <img className={'app-mark ' + className} src="./devbox-icon.png" alt="DevBox" /> }

function WorkspaceForm({ current, done, cancel }: { current?: Workspace; done: (created?: boolean) => void; cancel?: () => void }): React.ReactElement {
  const [name, setName] = useState(current?.name ?? '')
  const [error, setError] = useState('')
  useEffect(() => { setName(current?.name ?? ''); setError('') }, [current?.id])
  async function submit(event: React.FormEvent): Promise<void> { event.preventDefault(); try { if (current) await window.devbox.workspaces.rename(current.id, { name }); else await window.devbox.workspaces.create({ name }); done(!current) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save workspace.') } }
  return <form className="workspace-form" onSubmit={(event) => void submit(event)}><label htmlFor="workspace-name">{current ? 'Rename workspace' : 'New workspace'}</label><input id="workspace-name" aria-label="Workspace name" autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Workspace name" /><div className="form-actions"><button type="submit">Save</button>{cancel && <button type="button" className="secondary" onClick={cancel}>Cancel</button>}</div>{error && <span className="error">{error}</span>}</form>
}

function WorkspaceRail({ current, workspaces, select, integrations, settings, theme, toggleTheme }: { current: Workspace; workspaces: WorkspaceSummary[]; select: (id: string) => void; integrations: () => void; settings: () => void; theme: Theme; toggleTheme: () => void }): React.ReactElement {
  const ThemeIcon = theme === 'dark' ? Sun : Moon
  const themeLabel = theme === 'dark' ? 'Use light mode' : 'Use dark mode'
  return <aside className="workspace-rail" aria-label="Workspaces"><div className="workspace-avatars">{workspaces.slice(0, 5).map((workspace) => <button key={workspace.id} className={'workspace-avatar ' + (workspace.id === current.id ? 'selected' : '')} onClick={() => select(workspace.id)} aria-label={'Switch to ' + workspace.name} aria-pressed={workspace.id === current.id}>{workspaceInitials(workspace.name)}{workspace.id === current.id && <span className="presence" />}</button>)}</div><div className="rail-actions"><button className="rail-button" onClick={integrations} aria-label="Global integrations"><Blocks size={19} /></button><button className="rail-button rail-theme-button" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}><ThemeIcon size={19} /></button><button className="rail-button" onClick={settings} aria-label="Preferences"><Settings size={18} /></button></div></aside>
}

function WorkspaceMenu({ current, workspaces, creating, setCreating, select, done }: { current: Workspace; workspaces: WorkspaceSummary[]; creating: boolean; setCreating: (value: boolean) => void; select: (id: string) => void; done: () => void }): React.ReactElement {
  if (creating) return <div className="workspace-menu" role="dialog" aria-label="Create workspace"><WorkspaceForm done={done} cancel={() => setCreating(false)} /></div>
  return <div className="workspace-menu" role="dialog" aria-label="Switch workspace"><p className="workspace-menu-title">Switch workspace</p>{workspaces.map((workspace) => <button className={'menu-action ' + (workspace.id === current.id ? 'selected' : '')} key={workspace.id} onClick={() => select(workspace.id)}>{workspaceInitials(workspace.name)}<span>{workspace.name}</span></button>)}<div className="menu-divider" /><button className="menu-action create-workspace-action" onClick={() => setCreating(true)}><Plus size={16} />Create workspace</button></div>
}

function Sidebar({ current, workspaces, page, assignedRepositories, menuOpen, creating, setMenuOpen, setCreating, setPage, select, done, openCommandPalette }: { current: Workspace; workspaces: WorkspaceSummary[]; page: Page; assignedRepositories: string[]; menuOpen: boolean; creating: boolean; setMenuOpen: (value: boolean) => void; setCreating: (value: boolean) => void; setPage: (page: Page) => void; select: (id: string) => void; done: () => void; openCommandPalette: () => void }): React.ReactElement {
  const gitConfigured = assignedRepositories.length > 0
  return <aside className="workspace-sidebar">
    <div className="sidebar-heading"><button className="workspace-switcher" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}><span>{current.name}</span><ChevronDown size={18} /></button><button className="compose-button" onClick={() => setPage('WorkspaceSettings')} aria-label="Workspace settings"><Settings size={19} /></button>{menuOpen && <WorkspaceMenu current={current} workspaces={workspaces} creating={creating} setCreating={setCreating} select={select} done={done} />}</div>
    <button className="sidebar-search" onClick={openCommandPalette} aria-label="Find a section, workspace, or action (Cmd+K)"><Search size={18} />Find a section or integration<span>⌘K</span></button>
    <nav className="primary-nav" aria-label="Workspace navigation"><button className={page === 'Overview' ? 'active' : ''} onClick={() => setPage('Overview')}><Boxes size={18} />Overview</button>{workspaceSections.map(({ label, page: sectionPage, icon: Icon }) => <button key={label} className={page === sectionPage ? 'active' : ''} onClick={() => setPage(sectionPage)}><Icon size={18} />{label}<span className="unread-count">{sectionPage === 'GitHub' && gitConfigured ? '•' : ''}</span></button>)}<button className={page === 'Integrations' || page === 'GitIntegration' ? 'active' : ''} onClick={() => setPage('Integrations')}><Blocks size={18} />Workspace integrations</button></nav>
    <div className="sidebar-footer"><span>Local-first</span></div>
  </aside>
}

function GitHubConnect({ integration, workspaceId, assignedRepositories, refresh, workspaceOnly = false, openGlobal }: { integration?: GitHubIntegrationSummary; workspaceId?: string; assignedRepositories: string[]; refresh: () => Promise<unknown>; workspaceOnly?: boolean; openGlobal?: () => void }): React.ReactElement {
  const [token, setToken] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState('')
  const [reconnecting, setReconnecting] = useState(false)
  const [repositoryQuery, setRepositoryQuery] = useState('')
  const [selectedOwner, setSelectedOwner] = useState('')
  const [owners, setOwners] = useState<GitHubRepositoryOwner[]>([])
  const [ownerRepositories, setOwnerRepositories] = useState<string[]>([])
  const [selectedRepository, setSelectedRepository] = useState(assignedRepositories[0] ?? '')
  useEffect(() => { setSelectedRepository(assignedRepositories[0] ?? ''); setRepositoryQuery('') }, [workspaceId, assignedRepositories])
  const githubError = (reason: unknown, fallback: string): string => { const message = reason instanceof Error ? reason.message : fallback; return message.includes('safeStorage.decryptString') ? 'GitHub needs to be reconnected before repositories can be loaded.' : message }
  useEffect(() => { if (!workspaceOnly || !integration) return; let active=true; void window.devbox.github.repositoryOwners().then((result) => { if(active) setOwners(result) }).catch((reason: unknown) => { if(active) setError(githubError(reason, 'Unable to load GitHub owners.')) }); return () => { active=false } }, [workspaceOnly, integration?.id])
  async function selectOwner(owner: string): Promise<void> { setSelectedOwner(owner); setRepositoryQuery(''); setOwnerRepositories([]); if(!owner) return; setBusy(true); setError(''); try { setOwnerRepositories(await window.devbox.github.repositoriesForOwner(owner)) } catch(reason) { setError(githubError(reason, 'Unable to load repositories for that owner.')) } finally { setBusy(false) } }
  async function connect(event: React.FormEvent): Promise<void> { event.preventDefault(); setBusy(true); setError(''); try { await window.devbox.github.connectPersonalAccessToken(token, name || undefined); setToken(''); await refresh() } catch (reason) { setError(reason instanceof Error ? reason.message : 'GitHub could not verify that token.') } finally { setBusy(false) } }
  async function saveRepository(): Promise<void> { if (!workspaceId) return; setBusy(true); setError(''); try { await window.devbox.github.setAssignedRepositories(workspaceId, selectedRepository ? [selectedRepository] : []); await refresh() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update the repository.') } finally { setBusy(false) } }
  async function refreshRepositories(): Promise<void> { setBusy(true); setError(''); setRefreshMessage(''); try { await window.devbox.github.refreshGlobal(); const availableOwners=await window.devbox.github.repositoryOwners(); setOwners(availableOwners); if(selectedOwner) setOwnerRepositories(await window.devbox.github.repositoriesForOwner(selectedOwner)); await refresh(); setRefreshMessage(selectedOwner ? 'Repository list refreshed just now.' : 'Owner list refreshed just now.') } catch (reason) { setError(githubError(reason, 'Unable to refresh repositories.')) } finally { setBusy(false) } }
  if (integration) {
    const allRepositories = ownerRepositories.map((fullName) => ({ fullName, selected: fullName === selectedRepository }))
    const query = repositoryQuery.trim().toLowerCase()
    const matchingRepositories = allRepositories.filter((repository) => {
      if (selectedOwner) {
        const [owner] = repository.fullName.split('/')
        if (owner !== selectedOwner) return false
      }
      if (!query) return true
      return repository.fullName.toLowerCase().includes(query)
    })
    const needsReconnect = integration.state === 'needs_reauth' || integration.lastError?.includes('safeStorage.decryptString')
    const currentlySavedRepo = assignedRepositories[0] ?? ''
    const isSavedActive = Boolean(selectedRepository && selectedRepository === currentlySavedRepo)
    const isUnsaved = Boolean(selectedRepository && selectedRepository !== currentlySavedRepo)
    const isCleared = Boolean(!selectedRepository && currentlySavedRepo)

    return <>{!workspaceOnly && <><section className="integration-panel"><div className="provider-icon github"><Github size={28} /></div><div className="integration-copy"><p>{needsReconnect ? 'Reconnect required' : 'Connected globally'}</p><h2>GitHub · {integration.displayName}</h2><span>{needsReconnect ? 'GitHub access needs reconnecting before repositories can refresh.' : integration.lastError ?? relativeRefreshTime(integration.lastSyncedAt)}</span></div><div className="integration-actions"><button className="secondary" onClick={() => void refreshRepositories()} disabled={busy}><RefreshCw className={busy ? 'spin' : ''} size={16} />{busy ? 'Refreshing…' : 'Refresh repositories'}</button>{needsReconnect && <button className="secondary" onClick={() => setReconnecting(!reconnecting)} disabled={busy}>{reconnecting ? 'Cancel reconnect' : 'Reconnect GitHub'}</button>}<button className="danger-button" onClick={() => void window.devbox.github.disconnect().then(refresh)} disabled={busy}>Disconnect</button></div></section>{reconnecting && <form className="token-form reconnect-form" onSubmit={(event) => void connect(event)}><label htmlFor="github-reconnect-token">New personal access token</label><input id="github-reconnect-token" type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" spellCheck={false} placeholder="github_pat_…" required disabled={busy} /><p>Reconnecting replaces the unreadable token while keeping this workspace’s repository attachment.</p><button type="submit" disabled={busy}>{busy ? 'Reconnecting…' : 'Save and reconnect'}</button></form>}{refreshMessage && <p className="refresh-message">{refreshMessage}</p>}</>}{workspaceId && <section className="repositories-panel">
      <div className="selected-repo-section">
        <p className="eyebrow">Currently selected repository</p>
        {selectedRepository ? (
          <div className="selected-repo-card">
            <div className="selected-repo-badge-icon"><Github size={22} /></div>
            <div className="selected-repo-info">
              <div className="selected-repo-title-row">
                <strong className="selected-repo-name">{selectedRepository}</strong>
                {isSavedActive && <span className="repo-status-badge active" title="Active repository in this workspace"><Check size={13} /> Active in workspace</span>}
                {isUnsaved && <span className="repo-status-badge unsaved" title="Selected but unsaved. Click 'Save repository' below to apply.">• Unsaved selection</span>}
              </div>
              <span className="selected-repo-hint">{isSavedActive ? 'Pull requests, issues, and checks from this repository sync to this workspace.' : 'Click "Save repository" below to switch this workspace to this repository.'}</span>
            </div>
            <div className="selected-repo-actions">
              <button type="button" className="secondary external-link selected-repo-btn" onClick={() => void window.devbox.links.openExternal(`https://github.com/${selectedRepository}`)} title="View repository on GitHub"><span>GitHub</span><ExternalLink size={13} /></button>
              <button type="button" className="secondary selected-repo-btn" onClick={() => { setSelectedRepository(''); setError('') }} disabled={busy} title="Clear selection">Deselect</button>
            </div>
          </div>
        ) : (
          <div className="selected-repo-card empty">
            <div className="selected-repo-badge-icon empty"><Github size={20} /></div>
            <div className="selected-repo-info">
              <strong className="selected-repo-name muted">No repository selected</strong>
              <span className="selected-repo-hint">Search and select a repository from the list below to connect it to this workspace.</span>
            </div>
            {currentlySavedRepo && <div className="selected-repo-actions"><button type="button" className="secondary selected-repo-btn" onClick={() => { setSelectedRepository(currentlySavedRepo); setError('') }} disabled={busy}>Revert to {currentlySavedRepo}</button></div>}
          </div>
        )}
      </div>

      <div className="repositories-browse-section">
        <div>
          <p className="eyebrow">Search repositories</p>
          <h2>Choose a repository</h2>
          <p>Search across all repositories in your connected GitHub account, select one, and save it to this workspace.</p>
        </div>

        <div className="repository-search-controls">
          <label className="repository-search-bar">
            <Search size={16} className="search-icon" />
            <input value={repositoryQuery} onChange={(event) => setRepositoryQuery(event.target.value)} placeholder="Search all repositories by name or owner…" aria-label="Search all repositories" autoComplete="off" />
            {repositoryQuery && <button type="button" className="search-clear-btn" onClick={() => setRepositoryQuery('')} aria-label="Clear search"><X size={15} /></button>}
          </label>
          {workspaceOnly && (
            <div className="repository-owner-filter">
              <label htmlFor="repo-owner-select"><Filter size={14} /> Owner</label>
              <select id="repo-owner-select" value={selectedOwner} onChange={(e) => void selectOwner(e.target.value)} aria-label="Load repositories for owner" disabled={busy}>
                <option value="">Choose an owner</option>
                {owners.map((owner) => <option key={owner.login} value={owner.login}>{owner.login} ({owner.count})</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="repository-list-header">
          <span className="repository-count-badge">
            {selectedOwner ? `Showing ${matchingRepositories.length} of ${allRepositories.length} repositories from ${selectedOwner}` : 'Choose an owner to load repositories'}
          </span>
          {(query || selectedOwner) && <button type="button" className="reset-filter-btn" onClick={() => { setRepositoryQuery(''); void selectOwner('') }}>Reset filters</button>}
        </div>

        <div className="repository-picker">
          {matchingRepositories.length > 0 ? (
            <div className="repository-suggestions" role="listbox" aria-label="Repository search results">
              {matchingRepositories.map((repository) => {
                const isSelected = selectedRepository === repository.fullName
                const isActive = currentlySavedRepo === repository.fullName
                const [owner, repoName] = repository.fullName.split('/')
                return (
                  <button
                    type="button"
                    key={repository.fullName}
                    className={`repository-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => { setSelectedRepository(repository.fullName); setError('') }}
                    disabled={busy}
                    aria-selected={isSelected}
                  >
                    <Github size={16} className="repo-item-icon" />
                    <span className="repo-item-fullname">
                      <span className="repo-item-owner">{owner}/</span>
                      <strong className="repo-item-name">{repoName}</strong>
                    </span>
                    <div className="repo-item-badges">
                      {isActive && <span className="repo-badge active-workspace">Active</span>}
                      {isSelected && <span className="repo-badge selected"><Check size={13} /> Selected</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="repository-empty-state">
              <Search size={22} className="empty-icon" />
              <p>{selectedOwner ? `No repositories match ${query ? `"${query}"` : 'the current filter'}.` : 'Choose an owner to load its repositories.'}</p>
              <div className="empty-actions">
                {(query || selectedOwner) && <button type="button" className="secondary" onClick={() => { setRepositoryQuery(''); void selectOwner('') }}>Clear filters</button>}
                <button type="button" className="secondary" onClick={() => void refreshRepositories()} disabled={busy}><RefreshCw size={14} className={busy ? 'spin' : ''} />Refresh from GitHub</button>
              </div>
            </div>
          )}
          <div className="repository-selection-actions">
            <button type="button" className="secondary" onClick={() => setSelectedRepository('')} disabled={busy || !selectedRepository}>Clear selection</button>
            <button className="primary-button" onClick={() => void saveRepository()} disabled={busy || (!selectedRepository && !currentlySavedRepo) || (!isUnsaved && !isCleared)}>
              {busy ? 'Saving…' : isUnsaved ? 'Save repository' : isCleared ? 'Remove repository' : 'Saved to workspace'}
            </button>
          </div>
        </div>
      </div>
    </section>}{error && <p className="error">{error}</p>}</>
  }
  if (workspaceOnly) return <section className="integration-empty"><div className="provider-icon github"><Github size={32} /></div><h2>Connect GitHub globally first</h2><p>Global integrations hold your account connection. Return here to choose this workspace’s repository.</p><button onClick={openGlobal}>Open global integrations</button></section>
  return <section className="integration-empty"><div className="provider-icon github"><Github size={32} /></div><h2>Add a GitHub integration</h2><p>Name this connection so you can distinguish accounts, organisations, and tokens.</p><button className="secondary external-link" type="button" onClick={() => void window.devbox.links.openExternal('https://github.com/settings/personal-access-tokens/new')}>Create a GitHub token<ExternalLink size={15} /></button><form className="token-form" onSubmit={(event) => void connect(event)}><label htmlFor="github-integration-name">Integration name<input id="github-integration-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Work GitHub" maxLength={120} disabled={busy} /></label><label htmlFor="github-token">Personal access token</label><input id="github-token" type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" spellCheck={false} placeholder="github_pat_…" required disabled={busy} /><p>Grant access to the repositories you want DevBox to read, plus pull requests, checks, and notifications.</p><button type="submit" disabled={busy}>{busy ? 'Verifying token…' : 'Save and connect'}</button></form>{error && <p className="error">{error}</p>}</section>
}

function IntegrationDirectory({ integration, jira, assignedRepositories, openGitHub, openJira }: { integration?: GitHubIntegrationSummary; jira?: JiraIntegrationSummary; assignedRepositories: string[]; openGitHub: () => void; openJira: () => void }): React.ReactElement {
  const githubConfigured = assignedRepositories.length > 0
  const jiraConfigured = !!jira?.projects.length
  return <section className="integration-directory workspace-integration-mapping"><div className="directory-title"><p className="eyebrow">This workspace</p><h1>Workspace integrations</h1><p>Review the sources this workspace uses, then configure anything that is not connected.</p></div><section className="workspace-mapping-list"><article className="connected-integration"><span className="catalog-icon"><Github size={23}/></span><div><h3>GitHub repository</h3><p>{githubConfigured ? assignedRepositories.join(', ') : integration ? 'No repository selected for this workspace.' : 'Add a GitHub integration first.'}</p></div><button className="secondary" onClick={openGitHub}>{githubConfigured ? 'Change repository' : integration ? 'Select repository' : 'Add GitHub'}</button></article><article className="connected-integration"><span className="catalog-icon"><CircleDot size={23}/></span><div><h3>Jira project</h3><p>{jiraConfigured ? jira?.projects[0]?.key : 'No Jira project selected for this workspace.'}</p></div><button className="secondary" onClick={openJira}>{jiraConfigured ? 'Change project' : 'Configure Jira'}</button></article><article className="connected-integration"><span className="catalog-icon"><LayoutGrid size={23}/></span><div><h3>Bitbucket</h3><p>Not configured. This integration is planned.</p></div><button className="secondary" disabled>Coming soon</button></article></section></section>
}

function GlobalIntegrationDirectory({ githubs, jiras, openGitHub, openJira }: { githubs: GitHubIntegrationSummary[]; jiras: GlobalJiraIntegrationSummary[]; openGitHub: () => void; openJira: () => void }): React.ReactElement {
  const connectedCount=githubs.length+jiras.length
  return <section className="integration-directory global-integration-directory"><div className="directory-title"><p className="eyebrow">Applies to DevBox</p><h1>Integration accounts</h1><p>Create named connections for the tools your workspaces use. Credentials remain encrypted on this Mac.</p></div><section><div className="directory-section-heading"><h2>Connected integrations</h2><span>{connectedCount}</span></div>{connectedCount ? <div className="connected-integrations">{githubs.map((github)=><article className="connected-integration" key={github.id}><span className="catalog-icon"><Github size={23}/></span><div><h3>{github.displayName}</h3><p>GitHub · {github.state==='connected'?'Connected':'Reconnect required'}</p></div></article>)}{jiras.map((jira)=><article className="connected-integration" key={jira.id}><span className="catalog-icon"><CircleDot size={23}/></span><div><h3>{jira.displayName}</h3><p>Jira · {jira.state==='connected'?'Connected':'Reconnect required'}</p></div></article>)}</div> : <div className="catalog-no-results"><Blocks size={22}/><p>No integrations connected yet.</p></div>}</section><section><div className="directory-section-heading"><h2>Add an integration</h2><span>3</span></div><div className="integration-grid"><article className="catalog-card"><span className="catalog-icon"><Github size={25}/></span><div className="catalog-card-copy"><div><h3>GitHub</h3><span className="available-badge">Available</span></div><p>Add another named GitHub account for a different organization, scope, or token.</p></div><button className="catalog-connect" onClick={openGitHub}>Add GitHub</button></article><article className="catalog-card"><span className="catalog-icon"><CircleDot size={25}/></span><div className="catalog-card-copy"><div><h3>Jira</h3><span className="available-badge">Available</span></div><p>Add another named Jira connection, then choose its project in a workspace.</p></div><button className="catalog-connect" onClick={openJira}>Add Jira</button></article><article className="catalog-card"><span className="catalog-icon"><LayoutGrid size={25}/></span><div className="catalog-card-copy"><div><h3>Bitbucket</h3><span className="planned-badge">Planned</span></div><p>Pull requests and build activity from Bitbucket workspaces.</p></div><button className="secondary" disabled>Coming soon</button></article></div></section></section>
}

void IntegrationDirectory
function JiraAccount({ refresh }: { refresh:()=>void }):React.ReactElement { const [deployment,setDeployment]=useState<'cloud'|'data-center'>('cloud'); const [name,setName]=useState(''); const [baseUrl,setBaseUrl]=useState(''); const [email,setEmail]=useState(''); const [token,setToken]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const connect=async(event:React.FormEvent):Promise<void>=>{event.preventDefault();setBusy(true);setError('');try{await window.devbox.jira.connect({deployment,name:name||undefined,baseUrl,email:deployment==='cloud'?email:undefined,token});setToken('');refresh()}catch(reason){setError(reason instanceof Error?reason.message:'Jira could not verify these credentials.')}finally{setBusy(false)}}; return <section className="integration-empty"><div className="provider-icon jira"><CircleDot size={32}/></div><h2>Add a Jira integration</h2><p>Name this connection so you can add another Jira account later without losing track of it.</p><form className="token-form" onSubmit={(event)=>void connect(event)}><label>Integration name<input value={name} onChange={(event)=>setName(event.target.value)} placeholder="e.g. Work Jira" maxLength={120} disabled={busy}/></label><label>Deployment<select value={deployment} onChange={(event)=>setDeployment(event.target.value as 'cloud'|'data-center')} disabled={busy}><option value="cloud">Jira Cloud</option><option value="data-center">Jira Data Center</option></select></label><label>Jira base URL<input type="url" value={baseUrl} onChange={(event)=>setBaseUrl(event.target.value)} placeholder="https://your-site.atlassian.net" required disabled={busy}/></label>{deployment==='cloud'&&<label>Account email<input type="email" value={email} onChange={(event)=>setEmail(event.target.value)} required disabled={busy}/></label>}<label>{deployment==='cloud'?<><span>API token</span><button className="token-help-link" type="button" onClick={()=>void window.devbox.links.openExternal('https://id.atlassian.com/manage-profile/security/api-tokens')}>Create an Atlassian API token <ExternalLink size={14}/></button></>:'Personal access token'}<input type="password" value={token} onChange={(event)=>setToken(event.target.value)} autoComplete="off" required disabled={busy}/></label><button type="submit" disabled={busy}>{busy?'Verifying…':'Connect Jira'}</button></form>{error&&<p className="error">{error}</p>}</section> }
function PlannedTool({ name, category }: { name: string; category: string }): React.ReactElement { return <section className="planned-tool"><span className="coming-soon">Planned integration</span><h2>{name} is not connected yet</h2><p>DevBox’s {category} area is ready in the navigation, but this provider has not been implemented in this build. Its status is shown honestly so it cannot be mistaken for a live integration.</p><button className="secondary" disabled>Coming soon</button></section> }
function WorkRow({ item }: { item: WorkItem }): React.ReactElement { const ItemIcon = item.kind === 'pr' ? GitPullRequest : CircleDot; const label=item.kind==='pr'?'Pull request':item.kind==='jira-issue'?`Jira issue${item.status?' · '+item.status:''}`:'GitHub issue'; return <article className={'work-row ' + item.priority}><div className="row-source"><ItemIcon size={19} /></div><div className="row-copy"><p>{item.reason}</p><h3>{item.title}</h3><span>{label} · {item.repository} · Updated {new Date(item.updatedAt).toLocaleDateString()}</span></div><div className="row-action"><i aria-label={item.priority + ' priority'} /><button className="secondary" onClick={() => void window.devbox.links.openExternal(item.url)}>Open<ExternalLink size={15} /></button></div></article> }

function WorkView({ items, hasConfiguredSources, goToIntegrations }: { items: WorkItem[]; hasConfiguredSources: boolean; goToIntegrations: () => void }): React.ReactElement {
  return <><div className="content-title"><div><h1>Developer overview</h1><p>A quiet view of what needs your attention across this workspace.</p></div></div><section className="attention-section"><div className="section-heading"><h2>Needs your attention</h2>{items.length > 0 && <span>{items.length}</span>}</div>{items.length ? <div className="work-list">{items.map((item) => <WorkRow key={item.id} item={item} />)}</div> : <div className="empty-state"><Blocks size={31} /><h2>{hasConfiguredSources ? 'You’re all caught up' : 'Set up this workspace'}</h2><p>{hasConfiguredSources ? 'New pull requests and tickets from the sources attached here will appear when they need your attention.' : 'Connect GitHub repositories, Jira projects, or both to bring this workspace to life.'}</p><button onClick={goToIntegrations}>{hasConfiguredSources ? 'Manage integrations' : 'Add an integration'}</button></div>}</section></>
}

function GitView({ repository, items, manageIntegration }: { repository?: string; integration?: GitHubIntegrationSummary; items: WorkItem[]; manageIntegration: () => void }): React.ReactElement {
  if (!repository) return <div className="empty-state"><Github size={31} /><h2>Attach a repository to Git</h2><p>Select one GitHub repository in this workspace to give it a focused pull request and issue view.</p><button onClick={manageIntegration}>Choose repository</button></div>
  return <section className="attention-section git-work-section"><div className="section-heading"><h2>Pull requests & issues</h2>{items.length > 0 && <span>{items.length}</span>}<button className="secondary section-action" onClick={manageIntegration}>Manage integration</button></div>{items.length ? <div className="work-list">{items.map((item) => <WorkRow key={item.id} item={item} />)}</div> : <div className="empty-state compact-empty"><GitPullRequest size={28} /><h2>No GitHub work needs attention</h2><p>Actionable pull requests and assigned issues from this workspace’s selected repository will appear here after the next successful sync.</p><button className="secondary" onClick={manageIntegration}>View integration</button></div>}</section>
}

function JiraProjectPicker({ workspaceId, integration, global, refresh, openGlobal }: { workspaceId:string; integration?:JiraIntegrationSummary; global?:GlobalJiraIntegrationSummary; refresh:()=>void; openGlobal:()=>void }):React.ReactElement { const [projects,setProjects]=useState<JiraProject[]>([]); const [selected,setSelected]=useState(integration?.projects[0]?.key??''); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); useEffect(()=>{setSelected(integration?.projects[0]?.key??'')},[integration?.id,integration?.projects]); useEffect(()=>{if(!global)return;void window.devbox.jira.projects().then(setProjects).catch((reason:unknown)=>setError(reason instanceof Error?reason.message:'Unable to load Jira projects.'))},[global?.id]); if(!global)return <section className="integration-empty"><div className="provider-icon jira"><CircleDot size={32}/></div><h2>Connect Jira globally first</h2><p>Global integrations hold your Jira account connection. Then return here to choose the one project this workspace tracks.</p><button onClick={openGlobal}>Open global integrations</button></section>; const save=async():Promise<void>=>{const project=projects.find((item)=>item.key===selected);if(!project)return;setBusy(true);setError('');try{await window.devbox.jira.setProject(workspaceId,project);refresh()}catch(reason){setError(reason instanceof Error?reason.message:'Unable to save Jira project.')}finally{setBusy(false)}}; return <section className="integration-empty"><div className="provider-icon jira"><CircleDot size={32}/></div><h2>Choose a Jira project</h2><p>{integration?.projects[0] ? `This workspace currently tracks ${integration.projects[0].key}.` : 'Select one accessible project to track in this workspace.'}</p><label className="project-select">Jira project<select value={selected} onChange={(event)=>setSelected(event.target.value)} disabled={busy||!projects.length}><option value="">Choose a project</option>{projects.map((project)=><option key={project.key} value={project.key}>{project.key} · {project.name}</option>)}</select></label><button onClick={()=>void save()} disabled={busy||!selected}>{busy?'Saving…':'Save project and sync'}</button>{error&&<p className="error">{error}</p>}</section> }

function TicketsView({ workspaceId, integration, global, items, openSetup, refresh, openGlobal }: { workspaceId: string; integration?: JiraIntegrationSummary; global?:GlobalJiraIntegrationSummary; items: WorkItem[]; openSetup: () => void; refresh: () => void; openGlobal:()=>void }): React.ReactElement {
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  if (!integration?.projects.length) return <JiraProjectPicker workspaceId={workspaceId} integration={integration} global={global} refresh={refresh} openGlobal={openGlobal}/>
  const visibleItems=items.filter((item)=>(status==='all'||item.status===status) && `${item.title} ${item.repository}`.toLowerCase().includes(query.trim().toLowerCase()))
  const statuses=[...new Set(items.map((item)=>item.status).filter((value): value is string => Boolean(value)))]
  return <section className="tickets-view">
    <section className="tickets-hero"><span className="provider-icon jira"><TicketCheck size={27} /></span><div><h1>{integration.displayName} tickets</h1><p>{integration.projects.length ? `${integration.projects.map((project) => project.key).join(', ')} · local read-only sync` : 'Choose Jira projects to begin syncing.'}</p></div><button className="secondary external-link" onClick={() => void window.devbox.links.openExternal(integration.baseUrl)}>Open in Jira<ExternalLink size={15} /></button><button className="primary-button" disabled title="Creating Jira issues is not available in this local read-only integration"><Plus size={16} />New issue</button></section>
    <div className="ticket-tabs" aria-label="Ticket filters"><button className="active">My assigned <span>{visibleItems.length}</span></button><label><Filter size={16} /><select value={status} onChange={(event)=>setStatus(event.target.value)} aria-label="Filter by Jira status"><option value="all">All statuses</option>{statuses.map((value)=><option key={value} value={value}>{value}</option>)}</select></label><label><Search size={16} /><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Filter tickets…" aria-label="Filter tickets" /></label></div>
    <div className="section-heading"><h2>Assigned to you</h2><span>{visibleItems.length}</span><small>Read-only Jira workspace view</small></div>
    {visibleItems.length ? <div className="work-list tickets-list">{visibleItems.map((item) => <WorkRow key={item.id} item={item} />)}</div> : <div className="empty-state compact-empty"><TicketCheck size={30} /><h2>No matching Jira tickets</h2><p>Try a different status or search term, or manage the projects this workspace tracks.</p><button onClick={openSetup}>Manage Jira projects</button></div>}
    <div className="disabled-insights" aria-label="Planned ticket insights"><article><b>Sprint progress</b><span>Available when sprint metadata is supported.</span></article><article><b>Linked pull requests</b><span>Available when repository links are configured.</span></article><article><b>Sync & webhooks</b><span>Local polling status is shown in the top bar.</span></article></div>
  </section>
}

function Onboarding({ openGitHub, openJira, skip }: { openGitHub: () => void; openJira: () => void; skip: () => void }): React.ReactElement {
  return <main className="onboarding"><AppMark /><p className="eyebrow">Step 3 of 3</p><h1>Connect your tools</h1><p>Bring the developer work you care about into a quiet, local-first workspace.</p><div className="onboarding-options"><article><span className="provider-icon github"><Github size={28} /></span><h2>GitHub</h2><p>Review requests, failed checks, and mentions from a selected repository.</p><button onClick={openGitHub}>Connect GitHub</button></article><article><span className="provider-icon jira"><CircleDot size={28} /></span><h2>Jira</h2><p>Assigned issues from the projects you choose, synced directly to this Mac.</p><button onClick={openJira}>Connect Jira</button></article></div><button className="onboarding-skip" onClick={skip}>Start without integrations</button></main>
}

function BackupSettings({ githubName }: { githubName?: string }): React.ReactElement {
  const { data: status, refetch } = useQuery({ queryKey: ['backup-status'], queryFn: () => window.devbox.backups.status() })
  const [repositories, setRepositories] = useState<Array<{ id: number; fullName: string; defaultBranch: string }>>([])
  const [repositoryId, setRepositoryId] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [token, setToken] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function chooseRepository(): Promise<void> { setBusy(true); setError(''); try { const result=await window.devbox.backups.repositories(); setRepositories(result); if(result.length===0) setError('No private GitHub repositories with push access are available.'); } catch(reason) { setError(reason instanceof Error?reason.message:'Unable to load backup repositories.') } finally { setBusy(false) } }
  async function configure(): Promise<void> { setBusy(true); setError(''); try { await window.devbox.backups.configure(Number(repositoryId),true); await refetch() } catch(reason) { setError(reason instanceof Error?reason.message:'Unable to save backup settings.') } finally { setBusy(false) } }
  async function connectToken(event: React.FormEvent): Promise<void> { event.preventDefault(); setBusy(true); setError(''); try { setRepositories(await window.devbox.backups.connectToken(token)); setToken('') } catch(reason) { setError(reason instanceof Error?reason.message:'Unable to verify the backup token.') } finally { setBusy(false) } }
  async function backup(): Promise<void> { setBusy(true); setError(''); try { await window.devbox.backups.run(); await refetch() } catch(reason) { setError(reason instanceof Error?reason.message:'Backup failed.') } finally { setBusy(false) } }
  async function restore(): Promise<void> { setBusy(true); setError(''); try { await window.devbox.backups.restoreLatest('RESTORE'); setConfirmation(''); await refetch(); window.location.reload() } catch(reason) { setError(reason instanceof Error?reason.message:'Restore failed.') } finally { setBusy(false) } }
  return <div className="backup-settings"><div><h2>GitHub backup</h2><p>Back up all non-secret local DevBox data to an existing private GitHub repository.</p></div>{githubName ? <p className="backup-integration">Using connected GitHub integration: <strong>{githubName}</strong></p> : <p>Connect a GitHub integration, or use a backup-only token below.</p>}<p className="backup-warning">Backups are not encrypted. Anyone with access to the private repository can read cached work titles, URLs, settings, and local work state. Tokens and Keychain secrets are never included.</p>{status?.repository ? <div className="backup-status"><strong>{status.repository.fullName}</strong><span>{status.lastBackedUpAt ? 'Last backed up '+new Date(status.lastBackedUpAt).toLocaleString() : 'No backup created yet'}{status.dirty ? ' · local changes pending' : ''}</span>{status.lastCommitUrl && <button className="secondary" onClick={() => void window.devbox.links.openExternal(status.lastCommitUrl!)}>Open backup<ExternalLink size={15} /></button>}<button onClick={() => void backup()} disabled={busy}>{busy ? 'Backing up…' : 'Back up now'}</button></div> : <><button className="secondary" onClick={() => void chooseRepository()} disabled={busy}>{busy ? 'Loading…' : githubName ? 'Use connected GitHub integration' : 'Check GitHub integrations'}</button>{repositories.length>0 && <div className="backup-config"><label htmlFor="backup-repository">Backup repository</label><select id="backup-repository" value={repositoryId} onChange={(event)=>setRepositoryId(event.target.value)}><option value="">Choose a repository</option>{repositories.map((repository)=><option key={repository.id} value={repository.id}>{repository.fullName}</option>)}</select><label className="backup-ack"><input type="checkbox" checked={acknowledged} onChange={(event)=>setAcknowledged(event.target.checked)} />I understand this private-repository backup is unencrypted.</label><button onClick={() => void configure()} disabled={busy||!repositoryId||!acknowledged}>Use this repository</button></div>}{repositories.length===0 && <form className="token-form backup-token-form" onSubmit={(event)=>void connectToken(event)}><label htmlFor="backup-token">Backup-only GitHub token</label><input id="backup-token" type="password" value={token} onChange={(event)=>setToken(event.target.value)} autoComplete="off" spellCheck={false} placeholder="github_pat_…" required disabled={busy} /><p>Use a fine-grained token with Contents read/write access to the private backup repository. It does not replace your existing integration.</p><button type="submit" disabled={busy}>{busy ? 'Verifying token…' : 'Use backup token'}</button></form>}</>}{status?.repository && <div className="backup-restore"><h3>Restore latest backup</h3><p>This replaces all local DevBox data. GitHub must be reconnected afterward because credentials are never restored.</p><input aria-label="Restore confirmation" value={confirmation} onChange={(event)=>setConfirmation(event.target.value)} placeholder="Type RESTORE" /><button className="danger-button" onClick={() => void restore()} disabled={busy||confirmation!=='RESTORE'}>Restore latest</button></div>}{error && <p className="error">{error}</p>}</div>
}

function GlobalSettingsView({ theme, onToggle, githubConnected }: { theme: Theme; onToggle: () => void; githubConnected: boolean }): React.ReactElement { return <section className="settings-view"><p className="eyebrow">Applies to DevBox</p><h1>Preferences</h1><div><div><h2>Appearance</h2><p>Choose the contrast for every workspace on this Mac.</p></div><button onClick={onToggle}>{theme === 'dark' ? 'Use light mode' : 'Use dark mode'}</button></div><BackupSettings githubName={githubConnected ? 'your connected account' : undefined} /></section> }
function GlobalModal({ section, onSelect, onClose, children }: { section: 'integrations' | 'github' | 'jira' | 'settings'; onSelect: (section: 'integrations' | 'settings') => void; onClose: () => void; children: React.ReactNode }): React.ReactElement {
  useEffect(() => { const close = (event: KeyboardEvent): void => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [onClose])
  const title = section === 'settings' ? 'Preferences' : section === 'github' ? 'GitHub account' : section === 'jira' ? 'Jira account' : 'Global integrations'
  return <div className="global-modal-backdrop" role="presentation" onMouseDown={onClose}><section className="global-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><header><h1>{title}</h1><button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog"><X size={28} /></button></header><div className="global-modal-body"><nav aria-label="Global preferences"><button className={section === 'integrations' || section === 'github' || section === 'jira' ? 'active' : ''} onClick={() => onSelect('integrations')}><Blocks size={18} />Integrations</button><button className={section === 'settings' ? 'active' : ''} onClick={() => onSelect('settings')}><Settings size={18} />Preferences</button></nav><div className="global-modal-content">{children}</div></div></section></div>
}
type PaletteGroup = 'Navigation' | 'Workspaces' | 'Actions'

interface PaletteItem {
  id: string
  group: PaletteGroup
  title: string
  subtitle?: string
  icon: typeof Boxes
  badge?: string
  shortcut?: string
  keywords?: string[]
  onSelect: () => void
}

function CommandPalette({
  isOpen,
  onClose,
  currentWorkspace,
  workspaces,
  selectWorkspace,
  createWorkspace,
  setPage,
  openGlobalModal,
  toggleTheme,
  currentTheme,
  syncWorkspace,
  refreshing,
  hasGitHub,
  assignedRepositories
}: {
  isOpen: boolean
  onClose: () => void
  currentWorkspace: Workspace
  workspaces: WorkspaceSummary[]
  selectWorkspace: (id: string) => void
  createWorkspace: () => void
  setPage: (page: Page) => void
  openGlobalModal: (section: 'integrations' | 'settings' | 'github') => void
  toggleTheme: () => void
  currentTheme: Theme
  syncWorkspace: () => void
  refreshing: boolean
  hasGitHub: boolean
  assignedRepositories: string[]
}): React.ReactElement | null {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const activeItemRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      const timer = setTimeout(() => inputRef.current?.focus(), 25)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isOpen])

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const allItems = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [
      {
        id: 'nav-overview',
        group: 'Navigation',
        title: 'Overview',
        subtitle: 'Developer attention and priority items',
        icon: Boxes,
        shortcut: 'G O',
        keywords: ['overview', 'dashboard', 'attention', 'pull requests', 'issues', 'home'],
        onSelect: () => { setPage('Overview'); onClose() }
      },
      {
        id: 'nav-git',
        group: 'Navigation',
        title: 'Git',
        subtitle: assignedRepositories[0] ? `PRs & issues for ${assignedRepositories[0]}` : 'Attach a GitHub repository',
        icon: GitPullRequest,
        shortcut: 'G G',
        keywords: ['git', 'github', 'prs', 'pull requests', 'issues', 'commits', assignedRepositories[0] ?? ''],
        onSelect: () => { setPage('GitHub'); onClose() }
      },
      {
        id: 'nav-tickets',
        group: 'Navigation',
        title: 'Tickets',
        subtitle: 'Assigned Jira issues in this workspace',
        icon: CircleDot,
        shortcut: 'G T',
        keywords: ['tickets', 'jira', 'issues', 'tasks', 'bugs', 'sprint'],
        onSelect: () => { setPage('Jira'); onClose() }
      },
      {
        id: 'nav-integrations',
        group: 'Navigation',
        title: 'Workspace Integrations',
        subtitle: 'Configure GitHub & Jira sources for this workspace',
        icon: Blocks,
        shortcut: 'G I',
        keywords: ['integrations', 'sources', 'github', 'jira', 'bitbucket', 'repositories'],
        onSelect: () => { setPage('Integrations'); onClose() }
      },
      {
        id: 'nav-repo-picker',
        group: 'Navigation',
        title: 'Choose Workspace Repository',
        subtitle: 'Search and attach a repository to this workspace',
        icon: Github,
        keywords: ['choose repository', 'change repo', 'attach repo', 'select repository'],
        onSelect: () => { setPage('GitIntegration'); onClose() }
      },
      {
        id: 'nav-workspace-settings',
        group: 'Navigation',
        title: 'Workspace Settings',
        subtitle: `Rename or archive "${currentWorkspace.name}"`,
        icon: Settings,
        keywords: ['workspace settings', 'rename', 'archive', 'preferences'],
        onSelect: () => { setPage('WorkspaceSettings'); onClose() }
      },
      {
        id: 'nav-global-integrations',
        group: 'Navigation',
        title: 'Global Integrations',
        subtitle: 'Manage connected GitHub and Jira accounts',
        icon: Blocks,
        keywords: ['global integrations', 'accounts', 'github token', 'pat'],
        onSelect: () => { openGlobalModal('integrations'); onClose() }
      },
      {
        id: 'nav-global-settings',
        group: 'Navigation',
        title: 'Global Settings',
        subtitle: 'Appearance and private GitHub repository backups',
        icon: Settings,
        keywords: ['global settings', 'appearance', 'theme', 'backup', 'restore'],
        onSelect: () => { openGlobalModal('settings'); onClose() }
      },

      ...workspaces.map((ws) => ({
        id: `ws-${ws.id}`,
        group: 'Workspaces' as const,
        title: ws.name,
        subtitle: ws.id === currentWorkspace.id ? 'Current active workspace' : 'Switch to this workspace',
        icon: Boxes,
        badge: ws.id === currentWorkspace.id ? 'Active' : workspaceInitials(ws.name),
        keywords: ['workspace', 'switch', ws.name],
        onSelect: () => { selectWorkspace(ws.id); onClose() }
      })),
      {
        id: 'ws-create',
        group: 'Workspaces',
        title: 'Create new workspace',
        subtitle: 'Start a new local workspace for another project or org',
        icon: Plus,
        keywords: ['create workspace', 'new workspace', 'add workspace'],
        onSelect: () => { createWorkspace(); onClose() }
      },

      {
        id: 'action-sync',
        group: 'Actions',
        title: refreshing ? 'Syncing workspace…' : 'Sync workspace',
        subtitle: 'Refresh latest PRs, issues, and checks from GitHub & Jira',
        icon: RefreshCw,
        shortcut: '⌘R',
        keywords: ['sync', 'refresh', 'fetch', 'reload'],
        onSelect: () => { syncWorkspace(); onClose() }
      },
      {
        id: 'action-theme',
        group: 'Actions',
        title: currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
        subtitle: currentTheme === 'dark' ? 'Use high contrast light background' : 'Use dark attention workspace theme',
        icon: currentTheme === 'dark' ? Sun : Moon,
        keywords: ['theme', 'dark mode', 'light mode', 'contrast', 'color'],
        onSelect: () => { toggleTheme(); onClose() }
      },
      {
        id: 'action-github',
        group: 'Actions',
        title: hasGitHub ? 'Manage GitHub account' : 'Connect GitHub account',
        subtitle: hasGitHub ? 'View global GitHub connection status' : 'Connect personal access token',
        icon: Github,
        keywords: ['github', 'token', 'connect', 'pat'],
        onSelect: () => { openGlobalModal('github'); onClose() }
      }
    ]
    return list
  }, [assignedRepositories, currentTheme, currentWorkspace.name, currentWorkspace.id, hasGitHub, onClose, openGlobalModal, refreshing, selectWorkspace, setPage, syncWorkspace, toggleTheme, workspaces, createWorkspace])

  const cleanQuery = query.trim().toLowerCase()
  const filteredItems = useMemo(() => {
    if (!cleanQuery) return allItems
    return allItems.filter((item) => {
      if (item.title.toLowerCase().includes(cleanQuery)) return true
      if (item.subtitle?.toLowerCase().includes(cleanQuery)) return true
      if (item.group.toLowerCase().includes(cleanQuery)) return true
      if (item.keywords?.some((k) => k.toLowerCase().includes(cleanQuery))) return true
      return false
    })
  }, [allItems, cleanQuery])

  useEffect(() => {
    setActiveIndex(0)
  }, [cleanQuery])

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (filteredItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filteredItems.length)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (filteredItems.length > 0) {
        setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = filteredItems[activeIndex]
      if (selected) {
        selected.onSelect()
      }
    }
  }

  if (!isOpen) return null

  const groups: PaletteGroup[] = ['Navigation', 'Workspaces', 'Actions']
  let runningIndex = 0

  return (
    <div className="command-palette-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="command-palette-card"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <header className="command-palette-header">
          <Search size={19} className="command-palette-search-icon" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a section, workspace, or action…"
            aria-label="Command search"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="palette-kbd">ESC</kbd>
        </header>

        <div className="command-palette-results" role="listbox">
          {filteredItems.length === 0 ? (
            <div className="command-palette-empty">
              <p>No results found for &ldquo;{query}&rdquo;</p>
              <span>Try searching for overview, git, tickets, settings, or a workspace name.</span>
            </div>
          ) : (
            groups.map((group) => {
              const itemsInGroup = filteredItems.filter((i) => i.group === group)
              if (itemsInGroup.length === 0) return null
              return (
                <div key={group} className="command-palette-group">
                  <div className="command-palette-group-title">{group}</div>
                  {itemsInGroup.map((item) => {
                    const itemIndex = runningIndex++
                    const isSelected = itemIndex === activeIndex
                    const Icon = item.icon
                    return (
                      <button
                        type="button"
                        key={item.id}
                        ref={isSelected ? activeItemRef : null}
                        className={`command-palette-item ${isSelected ? 'active' : ''}`}
                        onClick={item.onSelect}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="palette-item-icon">
                          <Icon size={17} />
                        </span>
                        <div className="palette-item-text">
                          <span className="palette-item-title">{item.title}</span>
                          {item.subtitle && <span className="palette-item-subtitle">{item.subtitle}</span>}
                        </div>
                        {item.badge && <span className="palette-item-badge">{item.badge}</span>}
                        {item.shortcut && <kbd className="palette-item-shortcut">{item.shortcut}</kbd>}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        <footer className="command-palette-footer">
          <div className="palette-footer-hints">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> select</span>
            <span><kbd>esc</kbd> close</span>
          </div>
          <div className="palette-footer-count">
            {filteredItems.length} {filteredItems.length === 1 ? 'command' : 'commands'}
          </div>
        </footer>
      </section>
    </div>
  )
}

function WorkspaceSettingsView({ workspace, done }: { workspace: Workspace; done: () => void }): React.ReactElement { const [error,setError]=useState(''); async function archive(): Promise<void> { try { await window.devbox.workspaces.archive(workspace.id); done() } catch(reason) { setError(reason instanceof Error?reason.message:'Unable to archive workspace.') } } return <section className="settings-view workspace-settings-view"><p className="eyebrow">This workspace</p><h1>Workspace settings</h1><div className="workspace-settings-section"><WorkspaceForm current={workspace} done={done} /></div><div className="workspace-settings-section danger-zone"><div><h2>Archive workspace</h2><p>Hide {workspace.name} from the workspace switcher. Its local data is kept for restoration.</p></div><button className="danger-button" onClick={() => void archive()}><Archive size={16} />Archive</button></div>{error&&<p className="error">{error}</p>}</section> }

function App(): React.ReactElement {
  const [page, setPage] = useState<Page>('Overview')
  const [globalModal, setGlobalModal] = useState<'integrations' | 'github' | 'jira' | 'settings' | null>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [onboarding, setOnboarding] = useState(false)
  const [theme, setTheme] = useState<Theme>('dark')
  const [refreshing, setRefreshing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const raw = window.localStorage.getItem('devbox:sidebar-width:v1')
    if (raw === null) return DEFAULT_SIDEBAR_WIDTH
    const stored = Number(raw)
    return Number.isFinite(stored) ? Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, stored)) : DEFAULT_SIDEBAR_WIDTH
  })
  const [isResizing, setIsResizing] = useState(false)
  const resizeStart = useRef<{ pointerX: number; width: number } | null>(null)
  const { data: workspaces = [], refetch: refetchWorkspaces } = useQuery({ queryKey: ['workspaces'], queryFn: () => window.devbox.workspaces.list() })
  const { data: current, refetch: refetchCurrent } = useQuery({ queryKey: ['current'], queryFn: () => window.devbox.workspaces.current() })
  const { data: globalIntegration, refetch: refetchIntegrations } = useQuery({ queryKey: ['github-global'], queryFn: () => window.devbox.github.global() })
  const { data: globalIntegrations = [], refetch: refetchIntegrationList } = useQuery({ queryKey: ['github-globals'], queryFn: () => window.devbox.github.list() })
  const { data: globalJira, refetch: refetchGlobalJira } = useQuery({ queryKey: ['jira-global'], queryFn: () => window.devbox.jira.global() })
  const { data: globalJiras = [], refetch: refetchJiraList } = useQuery({ queryKey: ['jira-globals'], queryFn: () => window.devbox.jira.list() })
  const { data: jiraIntegration, refetch: refetchJira } = useQuery({ queryKey: ['jira', current?.id], enabled: !!current, queryFn: () => window.devbox.jira.get(current!.id) })
  const { data: assignedRepositories = [], refetch: refetchAssigned } = useQuery({ queryKey: ['github-assigned', current?.id], enabled: !!current, queryFn: () => window.devbox.github.assignedRepositories(current!.id) })
  const { data: githubItems = [], refetch: refetchItems } = useQuery({ queryKey: ['items', current?.id], enabled: !!current, queryFn: () => window.devbox.github.workItems(current!.id) })
  const { data: jiraItems = [], refetch: refetchJiraItems } = useQuery({ queryKey: ['jira-items', current?.id], enabled: !!current, queryFn: () => window.devbox.jira.workItems(current!.id) })
  const items = useMemo(() => [...githubItems,...jiraItems].sort((a,b) => ({urgent:0,high:1,normal:2}[a.priority]-{urgent:0,high:1,normal:2}[b.priority] || b.updatedAt.localeCompare(a.updatedAt))), [githubItems,jiraItems])
  const integration = globalIntegration ?? undefined
  const refreshData = (): Promise<unknown[]> => Promise.all([refetchIntegrations(), refetchIntegrationList(), refetchGlobalJira(), refetchJiraList(), refetchJira(), refetchAssigned(), refetchItems(), refetchJiraItems(), refetchWorkspaces()])
  const refresh = (): void => { void (async () => { setRefreshing(true); try { if (current && globalIntegration) await window.devbox.github.refreshWorkspace(current.id); if (current && jiraIntegration?.projects.length) await window.devbox.jira.refresh(current.id); await refreshData() } finally { setRefreshing(false) } })() }
  const switchWorkspace = (id: string): void => { void window.devbox.workspaces.select(id).then(() => { setMenuOpen(false); setCreating(false); void refetchCurrent(); void refetchWorkspaces() }) }
  const finishWorkspaceChange = (): void => { setMenuOpen(false); setCreating(false); void refetchCurrent(); void refetchWorkspaces() }
  // An archive can move the current-workspace pointer in the main process.
  // If a renderer observes the list before that pointer, recover to an active
  // workspace rather than showing first-run onboarding.
  useEffect(() => { if (!current && workspaces[0]) switchWorkspace(workspaces[0].id) }, [current, workspaces])
  const title = useMemo(() => page === 'GitHub' ? 'Git' : page === 'GitIntegration' ? 'Repository selection' : page === 'GlobalGitHub' ? 'GitHub account' : page === 'Integrations' ? 'Workspace integrations' : page === 'Jira' ? 'Tickets' : page === 'Bitbucket' ? 'Git' : page === 'GlobalSettings' ? 'Global settings' : page === 'GlobalIntegrations' ? 'Integration accounts' : page === 'WorkspaceSettings' ? 'Workspace settings' : page, [page])
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
  useEffect(() => window.devbox.events.subscribeWorkspaceChanges(refreshData), [])
  useEffect(() => { setTheme((window.localStorage.getItem('devbox:global-theme:v1') as Theme | null) ?? 'dark') }, [])
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => { window.localStorage.setItem('devbox:sidebar-width:v1', String(sidebarWidth)) }, [sidebarWidth])
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])
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
  if (!current) return <main className="welcome"><div className="welcome-mark"><AppMark /></div><h1>Create your first workspace</h1><p>Keep each organization’s developer attention separate and local to this Mac.</p><WorkspaceForm done={(created) => { if (created) setOnboarding(true); void refetchCurrent() }} /></main>
  const hasConfiguredSource = assignedRepositories.length > 0 || !!jiraIntegration?.projects.length
  if (onboarding) return <Onboarding openGitHub={() => { setOnboarding(false); setGlobalModal('integrations') }} openJira={() => { setOnboarding(false); setGlobalModal('integrations') }} skip={() => setOnboarding(false)} />
  const toggleTheme = (): void => { const next = theme === 'dark' ? 'light' : 'dark'; setTheme(next); window.localStorage.setItem('devbox:global-theme:v1', next) }
  const workspaceContent = page === 'GitIntegration' ? <GitHubConnect integration={integration} workspaceId={current.id} assignedRepositories={assignedRepositories} refresh={refreshData} workspaceOnly openGlobal={() => setGlobalModal('integrations')} /> : page === 'Integrations' ? <IntegrationDirectory integration={integration} jira={jiraIntegration ?? undefined} assignedRepositories={assignedRepositories} openGitHub={() => setPage('GitIntegration')} openJira={() => globalJira ? setPage('Jira') : setGlobalModal('integrations')} /> : page === 'GitHub' ? <GitView repository={assignedRepositories[0]} integration={integration} items={githubItems} manageIntegration={() => setPage('GitIntegration')} /> : page === 'Jira' ? <TicketsView workspaceId={current.id} integration={jiraIntegration ?? undefined} global={globalJira ?? undefined} items={jiraItems} refresh={() => void refreshData()} openSetup={() => setPage('Jira')} openGlobal={() => setGlobalModal('integrations')} /> : page === 'Bitbucket' ? <PlannedTool name="Bitbucket" category="Git" /> : page === 'WorkspaceSettings' ? <WorkspaceSettingsView workspace={current} done={finishWorkspaceChange} /> : <WorkView items={items} hasConfiguredSources={hasConfiguredSource} goToIntegrations={() => setPage('Integrations')} />
  const modalContent = globalModal === 'github' ? <GitHubConnect assignedRepositories={[]} refresh={refreshData} /> : globalModal === 'settings' ? <GlobalSettingsView theme={theme} githubConnected={!!globalIntegration} onToggle={toggleTheme} /> : globalModal === 'jira' ? <JiraAccount refresh={() => void refreshData()} /> : <GlobalIntegrationDirectory githubs={globalIntegrations} jiras={globalJiras} openGitHub={() => setGlobalModal('github')} openJira={() => setGlobalModal('jira')} />
  return <div className={'app-shell ' + (isResizing ? 'is-resizing' : '')} style={{ '--workspace-sidebar-width': sidebarWidth + 'px' } as React.CSSProperties}>
    <WorkspaceRail current={current} workspaces={workspaces} select={switchWorkspace} integrations={() => setGlobalModal('integrations')} settings={() => setGlobalModal('settings')} theme={theme} toggleTheme={toggleTheme} />
    <Sidebar current={current} workspaces={workspaces} page={page} assignedRepositories={assignedRepositories} menuOpen={menuOpen} creating={creating} setMenuOpen={setMenuOpen} setCreating={setCreating} setPage={setPage} select={switchWorkspace} done={finishWorkspaceChange} openCommandPalette={() => setCommandPaletteOpen(true)} />
    <div className="sidebar-resizer" role="separator" aria-label="Resize workspace sidebar" aria-orientation="vertical" aria-valuemin={MIN_SIDEBAR_WIDTH} aria-valuemax={MAX_SIDEBAR_WIDTH} aria-valuenow={sidebarWidth} tabIndex={0} onPointerDown={startResize} onKeyDown={resizeWithKeyboard} />
    <main className="main-content"><header className="topbar"><div className="breadcrumb"><Boxes size={17} /><span>DevBox</span><ChevronDown size={15} /><b>{title}</b></div><div className="topbar-actions"><span className="sync-pill"><i />{refreshing ? 'Syncing…' : relativeRefreshTime(integration?.lastSyncedAt ?? jiraIntegration?.lastSyncedAt ?? null)}</span><button className="topbar-button" onClick={refresh} aria-label="Refresh workspace" disabled={refreshing}><RefreshCw className={refreshing ? 'spin' : ''} size={17} />Sync</button></div></header><div className="content-body">{workspaceContent}</div></main>
    {globalModal && <GlobalModal section={globalModal} onClose={() => setGlobalModal(null)} onSelect={(section) => setGlobalModal(section)}>{modalContent}</GlobalModal>}
    {commandPaletteOpen && current && (
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        currentWorkspace={current}
        workspaces={workspaces}
        selectWorkspace={switchWorkspace}
        createWorkspace={() => { setMenuOpen(true); setCreating(true) }}
        setPage={setPage}
        openGlobalModal={setGlobalModal}
        toggleTheme={toggleTheme}
        currentTheme={theme}
        syncWorkspace={refresh}
        refreshing={refreshing}
        hasGitHub={Boolean(globalIntegration)}
        assignedRepositories={assignedRepositories}
      />
    )}
  </div>
}

if (typeof window.devbox === 'undefined') window.devbox = createBrowserDevboxApi()
createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={client}><App /></QueryClientProvider></React.StrictMode>)
