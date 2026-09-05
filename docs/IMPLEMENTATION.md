# DevBox implementation plan

## Delivery sequence

### Phase 0: repository and desktop foundation

1. Initialize an Electron + React + TypeScript repository using electron-vite.
2. Configure strict TypeScript, ESLint, Prettier, Vitest, Playwright Electron, and electron-builder.
3. Create an App shell with the dark-first token system, responsive window layout, keyboard focus states, sidebar, workspace switcher, and empty dashboard.
4. Add Electron main-process hardening, typed preload bridge, `safeStorage` token vault, external-link validator, application menu, tray, and global shortcut.
5. Add SQLite initialization, migrations, workspace CRUD, and a development fixture mode.

Acceptance: a fresh install can create/switch/delete workspaces, retains them after restart, opens the native window from tray/shortcut, and passes typecheck, unit tests, and Electron smoke test.

### Phase 1: GitHub read-only integration

1. Implement GitHub device-flow authorization in the main process and encrypted token storage.
2. Build the GitHub setup flow: authenticate, show identity, choose organizations/repositories, review requested scopes, and complete connection.
3. Implement sync adapters for review requests, authored PRs, latest check status, and user notifications.
4. Upsert source entities with pagination/cursor support and display real sync state.
5. Render GitHub work rows on Overview, Inbox, and My Work; deep-link all source items externally.

Acceptance: two workspaces can each connect distinct GitHub accounts or repository selections without data crossing workspace boundaries. A PR that receives a failed check becomes `urgent` if authored by the current user.

### Phase 2: Jira read-only integration

1. Implement Jira site/token connection, validation, current-user lookup, project selection, and encrypted token storage.
2. Implement assigned non-terminal issue sync through scoped JQL.
3. Render Jira work rows and their source-health states.
4. Add deterministic Jira-key matching against GitHub PR title/body/branch/links.
5. Render linked Jira/PR/check objects as one work card and show the relationship evidence in the detail drawer.

Acceptance: a Jira issue and GitHub PR are joined only when an explicit configured-project issue key is present. An unmatched issue remains independent. Disconnecting Jira removes only Jira data and relationships in that workspace.

### Phase 3: desktop quality and onboarding

1. Finish first-run onboarding, integration empty states, partial-connection states, and safe recovery flows.
2. Add local read/dismiss state, filters, search, sync timestamp, manual refresh, stale-data handling, and notification deduplication.
3. Add light theme, reduced-motion behavior, accessibility labels, keyboard navigation, and window-size responsiveness.
4. Package, sign, notarize, and test an Apple Silicon DMG; add Intel validation before public distribution.

Acceptance: a new user can understand the app without sample data, recover from bad tokens/offline state, and use the primary dashboard/inbox flow entirely by keyboard.

## API and state contracts

- Renderer requests data only through `window.devbox`; it never imports Electron or provider SDKs.
- Domain DTOs are shared TypeScript types with provider-neutral fields. Provider-specific raw payloads remain main-process-only.
- Workspace selection is persisted locally and scopes every query, mutation, cache key, and IPC event.
- Integration mutations are read-only toward providers in V1. A UI action must not imply a remote action when it only changes DevBox local state.

## Test plan

### Unit tests

- Workspace validation, uniqueness, switch persistence, and destructive-delete confirmation.
- Token vault encryption/decryption and deletion behavior.
- GitHub/Jira adapter pagination, token expiration, rate-limit retry, and malformed-payload handling using HTTP fixtures.
- Priority ordering and visible reason labels.
- Jira-key extraction and relationship matching, including multiple keys, non-configured projects, and false-positive substrings.
- URL allowlisting for external opening and IPC schema rejection.

### Integration tests

- SQLite migration from an empty database and idempotent source-entity upserts.
- Two workspace fixtures with overlapping provider IDs to prove data never leaks across workspace filters.
- Disconnect integration cleanup and workspace deletion cleanup.
- Sync transaction behavior: partial provider failure retains old records and marks data stale.

### Electron end-to-end tests

- First-run create-workspace flow and start-without-integration path.
- GitHub/Jira connection screens against fixture adapters, then dashboard rendering.
- Workspace switching changes every visible record and quick-link context.
- Linked card opens detail drawer, explains relationship, and requests validated external opening.
- Keyboard navigation, filter changes, dismiss/read behavior, offline state, reconnect state, and reduced-motion preference.

### Manual release checks

- Use real, non-production GitHub and Jira accounts with least-privilege credentials.
- Confirm macOS Keychain contains protected secrets and SQLite contains no plaintext token.
- Confirm network traffic goes directly from the app to the provider; no provider title/content leaves the device.
- Verify tray, global shortcut, notification behavior, external deep links, first-run UI, light/dark mode, and window resizing on a real Mac.

## Completion checklist

- No token or provider API access exists in renderer code.
- No provider source page is embedded in a webview.
- No integration is marked healthy without a successful authenticated sync.
- Every dashboard row has a source, a time, and an actionable reason.
- Every relation shown to a user has recorded evidence.
- Workspace-scoped records, secrets, cache, notifications, and UI state are isolated.
- GitHub/Jira source links open the exact canonical URL.
- Empty/error/loading states are designed and tested, not left as generic placeholders.

## Post-V1 roadmap

1. Add Slack via an optional hosted event relay or a user-authorized direct connection after an explicit privacy review; only ingest mentions and configured channels, then attach messages to existing work threads through source URLs/Jira keys/PR links.
2. Add GitHub/Jira safe write actions with per-action confirmation and auditable local activity history.
3. Add GitHub webhooks and a minimal encrypted relay for near-real-time updates, while retaining direct local API sync as fallback.
4. Add shared workspace membership only when a team use case requires it; make it a separate cloud-backed workspace type rather than changing local workspace semantics.
5. Add GitLab, CI providers, incident management, and configurable rules only after the GitHub/Jira attention model demonstrates recurring daily use.

