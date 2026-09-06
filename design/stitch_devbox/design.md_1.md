# DevBox — UI Design Specification for Google Stitch

## Overview

DevBox is a **local-first macOS desktop developer attention workspace** built with Electron. It answers one question quickly: **"What needs my attention now?"** It surfaces actionable pull requests, failing CI checks, review requests, and Jira issues across multiple named local workspaces, with a Slack-inspired navigation shell.

---

## Visual Identity

### Color Palette

| Role | Dark mode | Light mode |
|---|---|---|
| Rail background | `#3f0e40` (deep purple) | `#4b154f` |
| Sidebar background | `#1f1324` | `#f8f7f8` |
| Main canvas | `#1a1d21` | `#fdfbfc` |
| Primary accent | `#a047a5` (indigo-purple) | `#7e3387` |
| Surface / card | `#222529` | `#ffffff` |
| Border subtle | `#383c43` | `#e2dbe4` |
| Text primary | `#f2f2f2` | `#2b2030` |
| Text secondary | `#b9bdc5` | `#746979` |
| Status green | `#43d17d` | `#247b4b` |
| Status amber | `#dc9a32` | `#b76a2a` |
| Status red | `#e3514d` | `#e3514d` |
| Focus ring | `#c87fd0` | `#c87fd0` |

### Typography

- **System font stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Base size: **15 px**, minimum body: **14 px**
- Headings use tight tracking (`letter-spacing: -0.04em` for H1, `-0.025em` for H2)
- WCAG AA contrast on all text

### Motion

- Respect `prefers-reduced-motion`
- Only micro-transitions: sidebar resize (100 ms ease), button hover, drawer open
- Spinner animation for async loading states

---

## App Shell Layout

The app shell is a **three-column layout** that fills 100 vh:

```
┌────────────┬─────────────────────┬──────────────────────────────────────┐
│ Workspace  │   Workspace         │  Main Content                        │
│ Rail       │   Sidebar           │  (Topbar + Scrollable Content Body)  │
│ (76 px)    │   (240–480 px,      │                                      │
│            │    default 308 px)  │                                      │
│            │   [resizable]       │                                      │
└────────────┴─────────────────────┴──────────────────────────────────────┘
```

A **drag handle** between the sidebar and main content lets users resize the sidebar. The minimum window width is 760 px overall.

---

## 1. Workspace Rail (Far Left, 76 px wide)

A narrow vertical strip with a deep purple background (`#3f0e40`), always visible.

### Elements (top to bottom)

1. **macOS traffic lights** — three colored dots (red/amber/green), 12 px circles, 8 px gap. `aria-hidden`.
2. **Workspace avatars** — up to 5 workspaces as square avatar buttons (48×48 px, 13 px border-radius, dark purple fill). Each shows 1–2 initials. The **active workspace** has an indigo fill (`#a047a5`) and a white ring (`box-shadow: 0 0 0 2px #f5bbf2`). A small green dot (13×13 px, `#36d17c`) appears bottom-right as a presence indicator. On hover, avatars lift slightly (`translateY(-1px)`).
3. **Rail action buttons** (bottom, auto-margin-top): three icon-only buttons (38×38 px), each with a subtle border and transparent background:
   - **Global Integrations** (Blocks icon)
   - **Theme Toggle** (Sun or Moon icon, toggles dark/light)
   - **Global Settings** (Settings/gear icon)

---

## 2. Workspace Sidebar (Resizable, default 308 px)

Dark plum background (`#1f1324`), right border `#39263f`.

### Sections (top to bottom)

#### 2a. Sidebar Heading
- **Workspace Switcher button** — full-width, shows current workspace name (bold, 20 px, tight tracking) + ChevronDown icon. Clicking opens the Workspace Menu dropdown.
- **Settings button** — icon-only (Settings icon, 34×34 px) to the right of the switcher, opens Workspace Settings.

#### 2b. Search / Command Bar
- A full-width button styled as a search field: magnifier icon + placeholder "Find a section or integration" + `⌘K` shortcut badge on the right. Rounded (9 px), dark background (`#17101b`), subtle border.

#### 2c. Primary Navigation
- Vertical list of nav buttons with icon + label, 9 px padding, 7 px rounded corners. Active item: semi-transparent white background (`#ffffff17`). Items:
  - **Overview** (Boxes icon)
  - **Git** (GitPullRequest icon) — shows a green dot `•` badge when a repository is configured
  - **Tickets** (CircleDot icon)

#### 2d. Divider

#### 2e. Global Integrations Section
- Section heading "Global integrations" (bold, 20 px) with a **`+` icon button** (28×28 px, bordered) on the right.

#### 2f. Workspace Repository Status
- A compact clickable status row showing a colored dot (grey = unconfigured, green = configured) + bold label "Workspace repository" + a small subtitle line with the attached repository name or a hint message.

#### 2g. Sidebar Footer (bottom)
- Top border separator, then a small muted label "Local-first".

---

## 3. Workspace Menu (Dropdown Overlay)

Appears anchored below the workspace switcher button, z-index elevated.

- **Container**: 286 px wide, `#302236` background, 11 px border-radius, purple border, heavy drop-shadow.
- **Header**: "Switch workspace" in muted small caps.
- **Workspace rows**: each shows initials avatar + workspace name. Active workspace is highlighted.
- **Divider**.
- **"Create workspace" row**: Plus icon + label.

When the "Create workspace" row is clicked, the menu body swaps to an inline **Workspace Form** (label, text input, Save/Cancel buttons).

---

## 4. Topbar (Main Content Header, 70 px tall)

Full-width header above the scrollable content. White (`#fff`) background with bottom border.

### Left
- **Breadcrumb**: muted text "/" separator + bold current page name.

### Right
- **Sync status** text (e.g., "Refreshed 3 minutes ago" in green).
- **Refresh button**: icon-only with RefreshCw icon, spins during loading.
- **Theme toggle button**: compact pill.

---

## 5. Main Content Area

Max-width **1120 px**, centered, with generous padding (`42px 46px 56px`).

---

### Page: Overview (Developer Overview)

**Title block**: H1 "Developer overview" + subtitle "A quiet view of what needs your attention across this workspace."

#### Section: "Needs your attention"

Section heading ("Needs your attention" H2 + count badge in a rounded pill). If items exist, a **work list card** (rounded-12 border, subtle shadow):

**Work Row** (each item in the list):

```
┌──────────────────────────────────────────────────────────────┐
│  [Icon]  [Reason label — muted 12px]               [●] [Open ↗] │
│          [Title — bold 15px, ellipsis]                       │
│          [Type · repo · Updated date — muted 12px]           │
└──────────────────────────────────────────────────────────────┘
```

- **Icon cell** (38×38 px square, rounded-10, purple tint bg): GitPullRequest or CircleDot icon.
- **Priority dot** (9 px circle): default purple; `urgent` = red `#e3514d`; `high` = amber `#dc9a32`.
- **Open button**: secondary style with ExternalLink icon.
- Rows separated by 1 px divider; last row has no divider.

**Empty state** (when no items or not configured):

Centered dashed-border card: Blocks icon (purple) + H2 + description paragraph + single primary button (purple fill).

Two variants:
- *Configured, all caught up*: "You're all caught up" + "Manage integrations" button.
- *No integrations*: "Set up this workspace" + "Add an integration" button.

---

### Page: Git (GitHub Repository View)

**Repository header card**: flex row with GitHub icon badge (57×57 px, rounded-15) + repository full name (H1, 24 px) + eyebrow label "This workspace" in green uppercase.

Action cluster (right-aligned): sync status label + "Open repository ↗" secondary button + "Manage integration" secondary button.

Below: same "Pull requests & issues" section + work list as Overview.

**Empty state** (no repository attached): centered dashed card with GitHub icon + "Attach a repository to Git" + "Choose repository" button.

---

### Page: Integrations (Integration Directory)

**Title block**: eyebrow "This workspace", H1 "Integrations", description paragraph.

**Search bar**: full-width with magnifier icon, placeholder "Search integrations by name or category". Purple focus ring.

**Category filter**: `<select>` — All categories / Git / Tickets.

#### Configured integrations section (appears when at least one is connected)

H2 "Configured for this workspace" + count pill. Each connected integration shown as a horizontal card:

```
┌────────────────────────────────────────────────────────────┐
│  [Icon]  [Name]                        [Configure →]       │
│          [Detail: repos or project keys]                   │
└────────────────────────────────────────────────────────────┘
```

#### Integration catalog grid

H2 "Start with a source" (or "Add another integration") + count pill. Cards rendered in a responsive grid (2–3 columns):

**Catalog card**:

```
┌────────────────────────────────────────────────────────────┐
│  [Icon]   [Name]           [Available / Planned badge]     │
│           [Description]                                    │
│                                    [Connect / Coming soon] │
└────────────────────────────────────────────────────────────┘
```

- `available-badge`: green background `#1d4930`, green text.
- `planned-badge`: purple background `#3b2b41`, light purple text.
- "Coming soon" button is disabled/muted.

---

### Page: GitHub Integration Setup

Two visual states:

#### State A — Not connected (empty)

Centered integration-empty card:
- GitHub icon badge (57×57 px, rounded-15, purple tint).
- H2 "Bring GitHub into this workspace".
- Description paragraph about PAT encryption.
- **External link button** "Create a GitHub token ↗" (secondary).
- **Token form**: labeled password input (placeholder `github_pat_…`) + "Save and connect" primary button.

#### State B — Connected

**Integration panel** (horizontal card): GitHub icon badge + "Connected globally" eyebrow in green + H2 "GitHub · @username" + last-sync timestamp. Right cluster: "Refresh repositories" button + (if stale) "Reconnect GitHub" button + "Disconnect" danger button.

**Repository panel** (card below): eyebrow "Repository", H2 with selected repo name, search input with magnifier + typeahead dropdown listbox + "Clear" + "Save repository" buttons.

---

### Page: Jira Integration Setup

Mirror of GitHub setup, using CircleDot icon:

#### State A — Not connected

Centered card with Jira icon + H2 "Bring Jira into this workspace". Form fields:
- **Deployment** select (Jira Cloud / Jira Data Center).
- **Jira base URL** text input.
- **Account email** (Cloud only).
- **API token / PAT** password input.
- "Connect and choose projects" submit button.

After verify: shows a checkbox list of available projects. "Save projects and sync" button.

#### State B — Connected

Integration panel + project list panel (same layout as GitHub state B). Shows project keys and last-sync time.

---

### Page: Global Settings

Eyebrow "Applies to DevBox", H1 "Global settings".

**Appearance section**: H2 + description + "Use light / dark mode" toggle button.

**GitHub Backup section**:
- H2 "GitHub backup" + description.
- Warning banner about unencrypted data.
- Configured state: repo name + last backup time + dirty-changes flag + "Open backup ↗" + "Back up now" buttons.
- Unconfigured state: "Check GitHub integrations" button → repository select dropdown + acknowledgment checkbox + "Use this repository" button. Alternatively a "backup-only token" form.
- Restore section: H3 "Restore latest backup" + warning text + confirmation input (type RESTORE) + "Restore latest" danger button.

---

### Page: Workspace Settings

Eyebrow "This workspace", H1 "Workspace settings".

**Rename section**: inline form (label + text input + Save button).

**Danger zone section**: H2 "Archive workspace" + description paragraph + "Archive" danger button with Archive icon.

---

## 6. Onboarding Flow (First Launch)

A full-screen modal or dedicated onboarding page sequence:

1. **Welcome**: DevBox app mark (logo), H1 "Welcome to DevBox", brief tagline.
2. **Name your workspace**: single input field "Workspace name", "Continue" button.
3. **Choose integrations**: three cards side-by-side:
   - Connect GitHub
   - Connect Jira
   - "Start without integrations" (text link)

Cards use the same catalog card style with icons.

---

## 7. Workspace Deletion Confirmation

Modal dialog:

- H2 "Delete [workspace name]?"
- Warning copy: explains local data removal, no source-provider impact.
- Text input: "Type the workspace name to confirm".
- "Delete workspace" danger button (disabled until confirmation matches) + "Cancel" secondary button.

---

## 8. Empty & Error States

Every view must have an explicit empty state:

| Scenario | Icon | Heading |
|---|---|---|
| No work items, sources configured | Blocks | "You're all caught up" |
| No integrations configured | Blocks | "Set up this workspace" |
| No GitHub repository attached | Github | "Attach a repository to Git" |
| No search results (integrations) | Search | "No integrations match that search." |
| Integration needs reconnection | Warning | "Reconnect required" (amber sync status in integration panel) |
| Rate limited / offline | Cloud-off | Plain-language copy with retry action |

---

## 9. Component Reference

### Buttons

| Style | Description |
|---|---|
| **Primary** | Purple fill `#7e3387`, white text, 7 px radius, bold 13 px |
| **Secondary** | Transparent, purple border `#826c86`, inherits text color |
| **Danger** | Transparent, red border `#dca1a1`, red text `#a83939` |
| **Icon-only (rail)** | 38×38 px, rounded-10, transparent with border |
| **Disabled** | `opacity: 0.62`, `cursor: not-allowed` |

### Focus

All interactive elements show a **3 px purple focus ring** (`#c87fd0`) with 2 px offset.

### Badges / Pills

- **Count pill**: small rounded rect, `#ece4ee` bg, `#5d4e60` text (dark: `#30263a` / `#e7e9ec`).
- **Available badge**: green tint.
- **Planned badge**: purple tint.

### Cards

- 12 px border-radius, 1 px subtle border, `box-shadow: 0 2px 8px rgba(45,18,49,0.03)`.
- White (light) / `#222529` (dark) background.

### Loading / Async

- Button text changes to "Saving…", "Verifying…", "Refreshing…", etc.
- RefreshCw icon spins continuously (0.8 s linear infinite).
- No skeleton loaders in V1; use empty states until data arrives.

---

## 10. Accessibility Requirements

- Semantic HTML5 elements (`<nav>`, `<aside>`, `<section>`, `<article>`, `<h1>`–`<h3>`).
- All icon-only buttons have `aria-label`.
- Navigation landmark has `aria-label="Workspace navigation"`.
- Repository search results use `role="listbox"`.
- Work rows are `<article>` elements inside a list.
- Dark/light theme applied via `data-theme` attribute on `:root`.
- All filter and drawer controls operable by keyboard.
- `prefers-reduced-motion`: no decorative animations.

---

## 11. Responsive Behaviour

- Minimum overall window width: **760 px**.
- Sidebar resize: drag handle between sidebar and main content, range 240–480 px. Rail is fixed at 76 px.
- Main content body max-width 1120 px, centered.
- Integration catalog grid: 1 column at narrow canvas; 2 columns default; 3 columns at wide canvas.

---

## 12. Key Interaction Patterns

- **Global shortcut** `Option+Space` brings the window to focus from any app.
- **Menu bar icon** shows unread actionable-card count badge.
- **Workspace switching** is instant (cached data) with a background refresh trigger.
- **Detail drawer**: clicking a work row opens a right-side drawer without navigating away (preserves list scroll). Shows linked Jira + GitHub entities, matching explanation, timestamps, and deep-link buttons.
- **Dismiss / mark read**: each work card has a local-only dismiss action; dismissed cards appear under the Inbox "Dismissed" filter and resurface on new source updates.
- **Deep links**: every "Open in GitHub" / "Open in Jira" action opens in the OS default browser — never an embedded webview.
