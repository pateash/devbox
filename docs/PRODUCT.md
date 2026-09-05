# DevBox product and UX specification

## Product definition

DevBox is a macOS developer attention workspace. A workspace is a local container for one set of organizations, projects, integrations, saved preferences, and cached data. It resembles a Slack organization in the navigation model, but it is not a chat server and it does not synchronize workspace membership in V1.

DevBox answers one question quickly: **what needs my attention now?**

It must not become a generic launcher, an embedded browser for GitHub and Jira, or a dashboard full of information with no user action.

## Audience and V1 success criteria

Primary users are individual developers and small engineering teams on macOS who work in GitHub and Jira Cloud every day.

V1 is successful when a user can:

1. Create, rename, switch, and delete local workspaces.
2. Connect GitHub and Jira independently inside each workspace.
3. Reach the dashboard after connecting either integration.
4. See only actionable GitHub and Jira items by default.
5. Recognize a linked Jira issue, pull request, and failed check as one piece of work.
6. Open the exact GitHub or Jira page from any source or work card.
7. Understand whether data is fresh, unavailable, or needs reconnection.
8. Remove an integration and locally cached data without affecting the source system.

## Scope boundaries

### Included

- macOS desktop application, distributed as a signed and notarized DMG.
- Electron application shell, menu bar access, global shortcut, and native notifications.
- Local workspaces with independent integrations and preferences.
- GitHub Cloud integration using OAuth device flow.
- Jira Cloud integration using a user-provided site URL, email address, and API token.
- Read-only ingestion, local caching, relationship matching, dashboard filtering, deep links, and local notifications.
- Dark-first, accessible UI with a light theme preference.

### Explicitly deferred

- Slack connection, Slack message ingestion, or Slack message posting.
- GitHub/Jira write actions such as approval, ticket transition, comment, rerun, or assignment.
- GitHub Enterprise Server, Jira Server/Data Center, GitLab, CI vendors beyond GitHub Actions, incident tools, cloud tools, and mobile support.
- Shared cloud workspaces, organization membership, role management, central storage, analytics, or webhooks.
- AI-generated priority scores or inferred relationships without explainable source links.

## Information architecture

### App chrome

- **Workspace switcher:** top of the sidebar; shows workspace name and connected-integration state. Opens a menu with all workspaces, `Create workspace`, and `Manage workspaces`.
- **Primary navigation:** Overview, Inbox, My Work, Integrations, Settings.
- **Quick links:** a lower-sidebar list of connected provider homes and optionally user-saved URLs. This is secondary navigation only.
- **Header:** page title, compact global search field, sync status, refresh action, and user/profile menu.
- **Menu bar:** DevBox icon with unread actionable-card count. Clicking it opens or focuses the main window. A configurable `Option+Space` global shortcut does the same.

### Overview

The default landing page for the current workspace. It has three regions:

1. **Needs attention:** ordered work rows for review requests, failed checks on the user's PRs, unread GitHub mentions, and Jira issues that need follow-up. This is the dominant section.
2. **My active work:** active Jira issues assigned to the user and open PRs authored by the user. Linked entities are collapsed into a single row.
3. **Team pulse:** a deliberately small summary: pending review count, failing PR count, and assigned Jira issue count. No charts in V1.

Rows are dense, readable, keyboard-focusable, and use source icons plus clear status color. A row contains title, relationship summary, current state, last meaningful update, and source links. It does not use decorative metric cards.

### Inbox

An all-actionable list with filters: `All`, `Review requested`, `Build failing`, `Mentioned`, `Assigned`, and `Unread`. Filters are local to the workspace. Marking an item read only changes DevBox's local read state; it must not mark GitHub or Jira notifications read.

### My Work

Shows two sortable sections: assigned Jira issues and authored/open GitHub PRs. The view includes a `Linked` filter for cards joined by the relationship resolver.

### Work card and detail drawer

Clicking a work row opens a right-side drawer, preserving the list context. The drawer shows:

- A clear title and priority/reason label such as `CI failing on your PR`.
- Linked source entities in time order: Jira issue, PR, check runs, and source notifications.
- The matching explanation, for example `PR title includes JIRA-142`.
- Last synchronization timestamp and source-specific errors, if any.
- `Open in GitHub` and `Open in Jira` actions. These use the operating-system browser, never an embedded webview.

### Integrations

Each workspace has its own integration list. It has an empty state with two actions: `Connect GitHub` and `Connect Jira`.

Connected cards show provider, connected account/site, configured repositories or Jira projects, last sync, current sync health, and actions to configure, refresh, disconnect, or remove cached data. The connection flow must show requested access before authorization.

### Workspace lifecycle

- First launch has a short onboarding sequence: create workspace, name it, then choose GitHub, Jira, or `Start without integrations`.
- Workspace names are required, trimmed, limited to 80 characters, and unique case-insensitively on the current device.
- Switching workspaces immediately swaps the dashboard to that workspace's cached records; a background refresh begins if the data is stale.
- Deleting a workspace requires typing its name. It deletes local settings, encrypted connection records, and local cached entities. It never revokes or changes source-provider content.

## Actionable-work rules

V1 priority must be deterministic and visible. The dashboard uses the following order:

1. PR authored by the current GitHub user with a failed GitHub Actions check.
2. PR where the current user is explicitly requested as reviewer and review is still required.
3. GitHub notification that directly mentions the current user or requests review.
4. Jira issue assigned to the current Jira user and not in a terminal status.
5. Other open PRs authored by the current user.

The UI always shows the reason a card appears. Users can dismiss a card locally or mark it read; dismissed cards remain available under the Inbox's `Dismissed` filter and reappear only after a new source update.

## Relationship matching

V1 joins Jira and GitHub only when there is an explainable match:

- Jira issue key appears as a standalone string in the GitHub PR title, body, branch name, or linked issue URL.
- The matching Jira key belongs to a Jira project configured in the current workspace.

The system records the evidence field and source URL. It does not guess from semantic similarity. More than one matched Jira key produces one work card with multiple linked issues. Unmatched objects remain independent cards.

## UX and accessibility requirements

- Use a dark graphite interface with an indigo primary accent, neutral surfaces, and semantic green/amber/red statuses. Offer a light mode using the same hierarchy.
- Use system font typography, 14px minimum body copy, visible keyboard focus, and WCAG AA contrast.
- All navigation, filters, drawer controls, and context menus must work by keyboard.
- Honour `prefers-reduced-motion`; animation is limited to small state transitions.
- Every loading, empty, offline, permission-denied, rate-limited, and connection-expired state has plain-language recovery copy.
- No seeded demo data is shown after a real account is connected. A development-only fixture mode is allowed behind an environment flag.

