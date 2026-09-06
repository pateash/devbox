I've uploaded design.md which contains the full UI spec for DevBox — a 
local-first macOS developer attention workspace (Electron app). Using that 
spec as your source of truth, generate a complete end-to-end UI design with 
the following screens. Match the exact colors, layout, and component styles 
described.
---
DESIGN SYSTEM (from spec):
- Dark-first UI. Rail: #3f0e40. Sidebar: #1f1324. Canvas: #1a1d21.
- Primary accent: #a047a5. Cards: #222529. Text: #f2f2f2 / #b9bdc5.
- Status: green #43d17d, amber #dc9a32, red #e3514d.
- System font, 15px base, tight heading tracking.
- 3-column shell: 76px rail | 308px sidebar | flex main content.
---
SCREENS TO GENERATE:
1. OVERVIEW PAGE (main dashboard)
   - 3-column shell visible: workspace rail with 3 avatar buttons + action icons,
     sidebar with workspace switcher, search bar, nav (Overview active), 
     integration status row.
   - Topbar: breadcrumb "Overview", sync status "Refreshed 2 min ago", refresh icon.
   - Main content: "Developer overview" H1, "Needs your attention" section with 
     5 work rows in a card. Show variety: 2 PR review requests (purple dot), 
     1 CI failing (red dot, urgent), 1 Jira issue (amber dot, high), 
     1 mention (purple dot). Each row: icon badge + reason label + title + 
     meta line + priority dot + Open button.
2. GIT PAGE (GitHub repository focused view)
   - Same shell. "Git" nav item active with green dot indicator.
   - Repository header card: GitHub icon badge + "acme-corp/platform" H1 + 
     "This workspace" eyebrow + "Refreshed just now" + "Open repository ↗" + 
     "Manage integration" buttons.
   - Below: "Pull requests & issues" section with 3 work rows.
3. INTEGRATIONS PAGE (integration directory)
   - Same shell. 
   - Title: eyebrow "This workspace", H1 "Integrations".
   - Search bar + category filter.
   - "Configured for this workspace" section (2 cards): GitHub (1 repo) + Jira (2 projects).
   - "Add another integration" grid: Bitbucket card with "Planned" badge + 
     disabled "Coming soon" button.
4. GITHUB SETUP — CONNECTED STATE
   - Integration panel card: GitHub icon + "Connected globally" green eyebrow + 
     "GitHub · @ashish" H2 + timestamp. Right: Refresh + Disconnect buttons.
   - Repository panel below: search input + typeahead dropdown showing 
     3 repo suggestions + "Save repository" button.
5. JIRA SETUP — EMPTY STATE (connect form)
   - Centered integration-empty card: Jira icon badge + "Bring Jira into this 
     workspace" H2 + description.
   - Form: Deployment select, Base URL input, Email input, API token input, 
     "Connect and choose projects" submit button.
6. GLOBAL SETTINGS PAGE
   - Eyebrow "Applies to DevBox", H1 "Global settings".
   - Appearance row: H2 + "Use light mode" button.
   - GitHub Backup section: H2 + warning banner (unencrypted notice) + 
     configured state showing repo name + "Back up now" button + 
     Restore section with RESTORE confirmation input + danger button.
7. WORKSPACE SETTINGS PAGE
   - Eyebrow "This workspace", H1 "Workspace settings".
   - Rename form: label + input prefilled + Save button.
   - Danger zone section: H2 "Archive workspace" + description + 
     Archive danger button (red border).
8. ONBOARDING — STEP 3 (choose integrations)
   - Full-screen, no sidebar. DevBox logo centered top.
   - H1 "Connect your tools", subtitle.
   - 3 side-by-side cards: GitHub (Connect button, available), 
     Jira (Connect button, available), 
     "Start without integrations" (text link below cards).
9. WORKSPACE SWITCHER OPEN STATE
   - Overview page with the dropdown menu open below the switcher.
   - Menu shows 3 workspaces (first active/highlighted), divider, 
     "Create workspace" row with + icon.
10. EMPTY STATE — ALL CAUGHT UP
    - Overview page, main content only: large centered dashed card with 
      Blocks icon (purple), "You're all caught up" H2, description, 
      "Manage integrations" purple filled button.
---
DESIGN RULES:
- All screens share the same 3-column shell (rail + sidebar + main).
- Rail and sidebar remain dark (#3f0e40 / #1f1324) even in the onboarding screen 
  (except screen 8 which is onboarding full-screen without shell).
- Cards have 12px border-radius, 1px #383c43 border, subtle shadow.
- Buttons: primary = #7e3387 filled white text; secondary = transparent purple 
  border; danger = transparent red border red text.
- Use Lucide-style icons: GitPullRequest, CircleDot, Github, Boxes, 
  Blocks, Settings, Search, RefreshCw, ExternalLink, ChevronDown, Plus, Archive.
- Focus ring: 3px #c87fd0 with 2px offset on all interactive elements.
- Deliver as high-fidelity mockups, not wireframes. Dark theme throughout.