# DevBox architecture

## Technology decisions

| Area | Decision | Reason |
|---|---|---|
| Desktop shell | Electron, macOS first | Supports menu bar, notifications, global shortcut, updater, and a future Windows build. |
| UI | React + TypeScript + Vite via electron-vite | Fast implementation, shared frontend skills, and strict types. |
| Styling | Tailwind CSS plus Radix primitives and Lucide icons | A consistent accessible interface without a heavy component suite. |
| Local state | Zustand for view state, TanStack Query for renderer queries | Clear division between ephemeral UI and IPC-backed data. |
| Persistence | SQLite via better-sqlite3 in the Electron main process | Fast local relational queries and an inspectable offline store. |
| Secret storage | Electron `safeStorage` with macOS Keychain backing | Tokens remain encrypted on the device and never enter renderer state. |
| Provider network | Native `fetch` in the Electron main process | Keeps credentials and provider API logic outside untrusted renderer code. |
| Testing | Vitest plus Playwright Electron | Unit coverage for domain logic and real desktop-flow coverage. |
| Packaging | electron-builder, signed/notarized DMG | Standard macOS distribution path. |

## Process model

```text
Renderer (React)
  -> narrow preload bridge
  -> Electron main process
       -> workspace service / work-item resolver
       -> integration sync coordinator
       -> GitHub and Jira adapters
       -> SQLite repository
       -> safeStorage / Keychain secrets
       -> macOS notifications, tray, global shortcuts, external browser
```

The renderer never receives a provider token, raw OAuth secret, filesystem path, or unrestricted IPC capability. The preload bridge exposes typed, capability-specific functions only.

## Repository layout

```text
devbox/
  package.json
  electron.vite.config.ts
  src/
    main/
      index.ts                 # Electron lifecycle, window, tray, shortcut
      ipc/                     # Typed request handlers
      domain/                  # Workspace, work item, resolver, priority rules
      integrations/
        github/
        jira/
      sync/                    # Scheduler, cursors, retries, dedupe
      storage/                 # SQLite migrations and repositories
      security/                # Token vault, OAuth/device-flow helpers
      platform/                # Notifications, external link opening
    preload/
      index.ts                 # Small typed window.devbox bridge
    renderer/
      app/
      features/
        dashboard/
        inbox/
        work-items/
        workspaces/
        integrations/
      components/
      styles/
      test-fixtures/
  tests/
    main/
    renderer/
    e2e/
  docs/
```

## Local data model

All records have `id`, `workspace_id`, `created_at`, and `updated_at` where relevant. Provider payloads are retained only when required for rendering and must be scoped to their workspace.

```text
Workspace
  id, name, color, icon, created_at, updated_at, last_opened_at

Integration
  id, workspace_id, provider [github|jira], state [connected|needs_reauth|error|disconnected],
  display_name, account_reference, config_json, last_synced_at, last_error

SecretReference
  integration_id, encrypted_secret_blob
  # token material is encrypted with safeStorage before it enters SQLite

SourceEntity
  id, workspace_id, integration_id, provider, provider_id, type,
  title, url, author, status, updated_at, payload_json, content_hash
  # unique: integration_id + provider_id + type

WorkItem
  id, workspace_id, title, state [open|dismissed], priority [urgent|high|normal],
  reason, last_activity_at, read_at, dismissed_at

WorkItemLink
  work_item_id, source_entity_id, relation [primary|linked|evidence],
  explanation

SyncCursor
  integration_id, stream, cursor_value, last_success_at

UserPreference
  workspace_id, key, value_json
```

The database is stored under Electron's `userData` directory, never in the repository or user-selected workspace folders. Deleting an integration removes its secret reference, source entities, cursors, and work-item links; empty work items are then removed.

## Provider adapters

### GitHub Cloud

- Authenticate through GitHub OAuth device flow opened in the user's default browser. Store the resulting token encrypted locally.
- During setup, identify the authenticated user, then let the user choose tracked organizations and repositories. The initial default is all repositories the token can read; users can narrow it before the first sync.
- Sync these streams: review requests, authored open PRs, pull-request check runs, and GitHub notifications that involve the authenticated user.
- Persist canonical PR URLs, repository, head branch, requested reviewers, merge state, and latest check summary. Fetch additional details only when the detail drawer is opened.
- Refresh every five minutes while the app is running, on manual refresh, after reconnecting, and when a workspace becomes active with stale data older than five minutes.

### Jira Cloud

- V1 connection asks for Jira Cloud base URL, account email, and a Jira API token. Validate the URL is HTTPS and ends in an Atlassian Cloud domain or allow a user-confirmed custom HTTPS domain for compatible installations.
- Store the email and site URL as integration metadata and the token encrypted locally.
- After validation, discover accessible projects and let the user choose at least one project. The default query includes non-terminal issues assigned to the authenticated Jira account within those projects.
- Sync issue key, summary, status, assignee, priority, updated timestamp, issue URL, and selected metadata. Do not fetch comments or attachments in V1.
- Use each site's configured terminal status category rather than hard-coding status names such as `Done`.

## Sync and work-item construction

1. The sync coordinator schedules independent provider streams and prevents two concurrent syncs for the same integration/stream.
2. Each adapter obtains pages incrementally using `SyncCursor`; it handles provider pagination, `429` backoff, expired credentials, and offline failures.
3. The adapter upserts `SourceEntity` rows inside one SQLite transaction and updates the cursor only after all pages complete.
4. The resolver identifies GitHub PR entities containing configured Jira keys, creates or updates a `WorkItem`, and records every relationship explanation in `WorkItemLink`.
5. The priority service calculates a deterministic priority/reason from the rules in `PRODUCT.md`.
6. The main process emits a small `workspace-data-changed` IPC event. The renderer invalidates the relevant TanStack Query keys and refreshes the current view.
7. A native notification is shown only when a newly discovered item is urgent/high, has not been locally dismissed, and is not duplicated within 30 minutes.

## IPC surface

Expose a versioned typed bridge, not generic channels. Representative calls:

```ts
window.devbox.workspaces.list(): Promise<WorkspaceSummary[]>;
window.devbox.workspaces.create(input: CreateWorkspaceInput): Promise<Workspace>;
window.devbox.workspaces.delete(id: string, confirmationName: string): Promise<void>;
window.devbox.integrations.connectGitHub(workspaceId: string): Promise<Integration>;
window.devbox.integrations.connectJira(input: JiraConnectionInput): Promise<Integration>;
window.devbox.dashboard.get(workspaceId: string): Promise<DashboardData>;
window.devbox.workItems.setLocalState(id: string, state: 'read' | 'unread' | 'dismissed'): Promise<void>;
window.devbox.links.openExternal(url: string): Promise<void>;
window.devbox.events.subscribeWorkspaceChanges(listener): Unsubscribe;
```

All inputs are validated in the main process using Zod schemas. `openExternal` accepts only provider URLs already stored in DevBox or URLs created by a validated quick-link record; it must reject arbitrary schemes and `file:` URLs.

## Security, privacy, and reliability

- Set `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, and a restrictive renderer Content Security Policy.
- Do not use `webview`, remote module access, arbitrary `executeJavaScript`, or renderer-controlled filesystem access.
- Never send provider content or tokens to a DevBox service in V1. Disable product analytics by default; crash reports require explicit user opt-in and redact provider URLs/titles.
- Show all requested integration permissions before authentication and clearly explain that DevBox has read-only behavior in V1.
- Use explicit error states: offline, permission denied, token expired, provider rate limit, invalid Jira site, and partial sync. Preserve previously synced data with a `stale` timestamp instead of clearing the dashboard on transient errors.
- Build a `Remove local data` control for each workspace and an application-wide `Erase all DevBox data` control.

