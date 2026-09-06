---
name: Dev Attention Shell
colors:
  surface: '#111417'
  surface-dim: '#111417'
  surface-bright: '#36393e'
  surface-container-lowest: '#0b0e12'
  surface-container-low: '#191c20'
  surface-container: '#1d2024'
  surface-container-high: '#272a2e'
  surface-container-highest: '#323539'
  on-surface: '#e1e2e8'
  on-surface-variant: '#d4c1cf'
  inverse-surface: '#e1e2e8'
  inverse-on-surface: '#2e3135'
  outline: '#9c8c99'
  outline-variant: '#50434e'
  surface-tint: '#ffa9fe'
  primary: '#ffa9fe'
  on-primary: '#590061'
  primary-container: '#a047a5'
  on-primary-container: '#ffe6fa'
  inverse-primary: '#913997'
  secondary: '#fbaaff'
  on-secondary: '#560761'
  secondary-container: '#73287c'
  on-secondary-container: '#f099f5'
  tertiary: '#f4b1ec'
  on-tertiary: '#4e1c4e'
  tertiary-container: '#90578c'
  on-tertiary-container: '#ffe5f8'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd6fa'
  primary-fixed-dim: '#ffa9fe'
  on-primary-fixed: '#36003c'
  on-primary-fixed-variant: '#761e7d'
  secondary-fixed: '#ffd6fc'
  secondary-fixed-dim: '#fbaaff'
  on-secondary-fixed: '#36003e'
  on-secondary-fixed-variant: '#70267a'
  tertiary-fixed: '#ffd6f7'
  tertiary-fixed-dim: '#f4b1ec'
  on-tertiary-fixed: '#350437'
  on-tertiary-fixed-variant: '#673366'
  background: '#111417'
  on-background: '#e1e2e8'
  surface-variant: '#323539'
  rail-bg: '#3f0e40'
  rail-hover: '#54205a'
  rail-border: '#652765'
  sidebar-bg: '#1f1324'
  sidebar-border: '#39263f'
  sidebar-search: '#17101b'
  sidebar-search-border: '#6a526d'
  sidebar-active: '#ffffff17'
  canvas-bg: '#1a1d21'
  surface-card: '#222529'
  surface-elevated: '#302236'
  border-subtle: '#383c43'
  border-divider: '#30343b'
  border-input: '#3d424a'
  primary-hover: '#933d9d'
  focus-ring: '#c87fd0'
  focus-glow: rgba(142, 63, 149, 0.15)
  text-primary: '#f2f2f2'
  text-secondary: '#b9bdc5'
  text-muted: '#746979'
  text-dim: '#aeb3bc'
  status-success: '#43d17d'
  status-presence: '#36d17c'
  status-caution: '#dc9a32'
  status-urgent: '#e3514d'
  badge-available-bg: '#1d4930'
  badge-available-text: '#9ae2b2'
  badge-planned-bg: '#3b2b41'
  badge-planned-text: '#e3b9e7'
  danger-border: '#dca1a1'
  danger-text: '#a83939'
  danger-fill: '#8f3035'
  icon-badge-bg: '#30263a'
  icon-badge-fg: '#d994df'
typography:
  display-h1:
    fontFamily: Inter
    fontSize: 29px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.04em
  heading-repo:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.035em
  heading-h2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.025em
  section-h2:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '700'
    lineHeight: 22px
    letterSpacing: -0.02em
  body-base:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: '0'
  body-bold:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: '0'
  body-compact:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  button-label:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: '0'
  caption:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: '0'
  meta-detail:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: '0'
  eyebrow-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.06em
  badge-count:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: '0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  rail-width: 76px
  sidebar-min: 240px
  sidebar-default: 308px
  sidebar-max: 480px
  topbar-height: 70px
  canvas-max-width: 1120px
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 12px
  gutter-lg: 16px
  gutter-xl: 24px
  gutter-2xl: 32px
  gutter-3xl: 48px
---

## Brand & Style

This design system establishes a high-density, distraction-free desktop environment engineered specifically for software engineers. It operates on a local-first philosophy to address one critical query with rapid cognitive ease: "What needs my attention right now?"

Drawing direct lineage from Slack's multi-organization navigation ergonomics and macOS desktop software paradigms, the aesthetic balances functional utilitarianism with deep tonal refinement. Visual density moves horizontally across the screen from left to right—transitioning from deep, rich aubergine rail anchors, through structured plum navigation panes, onto quiet charcoal slate canvas surfaces.

The experience relies on subtle hairline dividers, precise 3-tier text metadata stacks, and acute semantic color indicators rather than noisy UI elements. Interactions convey immediate tactile feedback through tight keyboard-driven focus rings, subtle elevations, and clean native application framing.

## Colors

The palette establishes an immersion-oriented dark hierarchy calibrated to alleviate visual fatigue during continuous development triage. 

- **Workspace Rail (`#3f0e40`)**: The deepest structural layer, housing persistent global identity and OS chrome alignment.
- **Sidebar Background (`#1f1324`)**: A plum tone that separates navigation contexts without introducing high-contrast division.
- **Main Canvas (`#1a1d21`) & Surface Cards (`#222529`)**: A balanced neutral charcoal base that eliminates glare while providing clean grounding for code diffs, pull request titles, and triage tickets.
- **Primary & Interactive Accents (`#a047a5`, `#7e3387`)**: Used intentionally for selected workspace rings, active navigation tiers, and primary CTA triggers.
- **Semantic Status Markers**: High-visibility signals that isolate critical engineering states without competing visually:
  - Fresh sync and repo readiness: `#43d17d` / `#36d17c`
  - High-priority and blocking items: Caution amber `#dc9a32`
  - Critical failures (e.g., CI failures on merge paths): Alert red `#e3514d`

## Typography

The typography structure reflects the precision and scale of desktop software. Built on a clean, neutral grotesque hierarchy (or the Apple system font stack `-apple-system, BlinkMacSystemFont`), this scale prioritizes rapid scannability and structural density over decorative expression.

Key typographic rules:
- **Tight Heading Tracking**: Headings scale from `20px` to `29px` with negative letter tracking (`-0.025em` to `-0.04em`) to maintain optical stability and typographic weight common to macOS pro tools.
- **Three-Tier Row Architecture**: Attention rows implement a strict vertical lockup:
  1. *Category/Reason eyebrow*: 12px muted string designating triggering condition ("Pull request opened", "CI build failed").
  2. *Primary title*: 15px bold identifier with clean truncation rules.
  3. *Contextual meta*: 12px dim text string combining source entity, repository pointer, and relative timestamp.
- **Compact Data Alignment**: Numbers, counts, keyboard shortcuts, and labels align to tabular metrics to avoid layout jitter during live-sync updates.

## Layout & Spacing

The layout is defined by a rigid three-column macOS application shell running full viewport height (`100vh`), engineered for keyboard productivity and persistent peripheral awareness.

### 1. Workspace Rail (Fixed 76px)
- Anchored to the far-left boundary.
- Houses macOS window management controls (12px traffic light circles with 8px gaps) with safe header padding (`20px` top).
- Vertically organizes workspace icons with a centered horizontal alignment (`48px` avatar tiles).
- Bottom utility clusters (settings, themes, integrations) pin to the bottom edge using automatic top margins.

### 2. Workspace Sidebar (Resizable 240px – 480px, Default 308px)
- Contains contextual workspace navigation, command entry points, and integration status rows.
- Separated from the main canvas by a draggable partition featuring a subtle hover highlight.

### 3. Main Content Canvas
- Flexible container with an integrated topbar (`70px` height) providing breadcrumb context, sync markers, and manual refresh controls.
- Primary body viewport is restricted to a maximum width of `1120px`, centered with generous interior padding (`42px 46px 56px`).
- Work item lists enforce consistent row bounding boxes (`min-height: 86px`) with `14px 18px` padding.

## Elevation & Depth

This system avoids diffuse or dramatic light-source shadows, adopting structural depth through tonal stacking and razor-sharp border delimiters.

1. **Surface Tiers**:
   - **Base (Level 0)**: Canvas floor (`#1a1d21`).
   - **Panels & Cards (Level 1)**: Primary cards (`#222529`) bordered by hairline strokes (`1px solid #383c43`) with subtle ambient depth: `box-shadow: 0 2px 8px rgba(45, 18, 49, 0.03)`.
   - **Dropdowns & Popovers (Level 2)**: Overlays and workspace switchers elevated in deep plum (`#302236`) using high-contrast bounds (`1px solid #39263f`) and directional shadows: `box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45)`.

2. **Divider Philosophy**:
   Internal list divisions use low-contrast hairline dividers (`1px solid #30343b`). Borders explicitly separate structural regions to remove ambiguity without visual noise.

3. **Focus & Interaction Signatures**:
   All active keyboard and focus states use an assertive `3px` solid stroke (`#c87fd0`) accompanied by a `2px` offset and a soft glow (`rgba(142, 63, 149, 0.15)`).

## Shapes

The interface balances macOS platform ergonomics with developer tool precision using calibrated radius steps:

- **Interactive Micro-controls & Badges**: `6px` to `7px` corner radius (primary and secondary buttons, sidebar navigation links, count pills).
- **Inputs & Search Triggers**: `8px` to `9px` corner radius.
- **Card Containers & List Groups**: `12px` corner radius, creating clear framing around grouped list items.
- **Avatars & Application Badges**: `13px` to `15px` squircle curves for workspace avatars and integration source emblems.
- **Status Dots & Indicators**: Full circular radii (`9999px`) for presence, priority, and indicator dots.

## Components

### Buttons & Interactive Controls
- **Primary Buttons**: Filled background (`#7e3387`), primary text (`#f2f2f2`), `7px` radius, `9px 13px` padding, 13px bold typography. Hover state: `#933d9d`. Focus state: 3px `#c87fd0` outline with 2px offset.
- **Secondary Buttons**: Ghost fill with `1px solid #826c86` border, text inheriting `#f2f2f2`, `7px` radius, `8px 11px` padding. Hover: subtle white tint overlay (`#ffffff12`).
- **Danger Actions**: Transparent or dark ruby fill (`#8f3035`) paired with a defined border (`#dca1a1`) and high-visibility danger text (`#a83939`).
- **Rail Action Buttons**: `38×38px` square frame with `10px` rounded corners, ghost background, and `1px solid rgba(187, 134, 189, 0.4)` border.

### Input Fields & Search Bars
- **Sidebar Search (`⌘K`)**: Surface `#17101b`, bounded by `#6a526d`, `9px` radius. Left-aligned search icon with right-aligned muted shortcut badge.
- **Form Inputs**: Recessed `#1a1d21` fill, `1px solid #3d424a` border, `8px` radius, `11px 12px` padding. Focus transitions border to `#94429d` with an active focus glow.

### Attention Rows (Work Item Cards)
- Bound within a unified `#222529` surface card with `12px` radius and `1px solid #383c43` outer border.
- Inner rows separated by `1px solid #30343b` (suppressed on the terminal row).
- **Layout**:
  - *Leading Icon*: `38×38px` container (`#30263a` background, `10px` radius) displaying tool glyphs in violet tint (`#d994df`).
  - *Content Stack*: Vertical layout with reason label (12px, `#746979`), item title (15px bold, `#f2f2f2`), and source metadata (12px, `#b9bdc5`).
  - *Trailing Cluster*: `9px` circular priority indicator (default violet `#7d3b8b`, caution amber `#dc9a32`, urgent alert red `#e3514d`) followed by an external link secondary button.

### Badges & Status Indicators
- **Count Pills**: Compact capsule shape, `#30263a` background with `#e7e9ec` bold text.
- **Integration Status Tags**:
  - *Available*: `#1d4930` fill with `#9ae2b2` text.
  - *Planned / Coming Soon*: `#3b2b41` fill with `#e3b9e7` text.
- **Presence Dots**: `13×13px` green `#36d17c` circular badges aligned to the bottom-right of active workspace avatars.

### Empty & Transition States
- Centered container (`max-width: 700px`) structured with a dashed border (`1px dashed #3d424a`) over a `#222529` base. Features an oversized central category icon (`31px`), concise reassurance copy, and a purple CTA button.