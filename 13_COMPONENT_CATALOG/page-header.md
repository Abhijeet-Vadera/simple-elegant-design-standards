# PageHeader

Source of truth: `src/shared/components/ui/index.tsx:1420-1483`. Tokens cited from `.ai-design-dna/02_DESIGN_DNA.json` (`typography.scale.pageTitle`, `typography.scale.eyebrow`, `spacing.commonInlinePx.pageHeaderMarginBottom`, `color.textTertiary`, `color.textSecondary`) and `12_DESIGN_TOKENS/typography.json` / `spacing.json`.

## Purpose

The standard top-of-page banner: optional mono "eyebrow" context label, the page's `h1` title, an optional one-line sub-description, and an optional right-aligned action slot (typically a `Button`, sometimes a small toolbar). It is the primitive that makes every internal screen's top region look identical, per the DNA's stated philosophy that "PageHeader/SectionCard [give] consistent framing so the domain complexity doesn't turn into visual complexity" (`00_PROJECT_IDENTITY.md`).

## File, export, prop signature

- File: `src/shared/components/ui/index.tsx:1420`
- Export: `export function PageHeader({ eyebrow, title, sub, actions }: {...})`
- Props:
  ```ts
  eyebrow?: string;      // mono uppercase context label above the title
  title: string;         // required, rendered as <h1>
  sub?: string;          // optional one-line description below the title
  actions?: ReactNode;    // optional right-aligned slot (buttons/toolbar)
  ```
- No `className`/`style` override props — layout, spacing, and typography are fixed; only content (eyebrow/title/sub/actions) varies per call site.

## Exact styling

- Outer row: `display:flex; alignItems:"flex-end"; justifyContent:"space-between"; gap:24px; marginBottom:28px`. The `28px` bottom margin is the DNA's documented `spacing.commonInlinePx.pageHeaderMarginBottom`. `alignItems:"flex-end"` means the title block and the actions slot are baseline-aligned to the *bottom* of the header, not vertically centered — the actions sit level with the title's descender, not its cap-height.
- Eyebrow (rendered only if `eyebrow` is truthy):
  - `fontFamily: "JetBrains Mono, monospace"`, `fontSize: 11px`, `letterSpacing: "0.14em"`, `textTransform: "uppercase"`, `color: #9CA3AF`, `marginBottom: 10px`.
  - Matches DNA `typography.scale.eyebrow` exactly (`size 11px, weight 450, letterSpacing 0.14em, uppercase, color #9CA3AF, family mono`) — note the component itself does not set `fontWeight`, so it inherits the ambient body weight (400) rather than the DNA-documented non-standard `450` eyebrow weight; the `450` weight is a CSS-level convention applied elsewhere (e.g. via a utility class), not reproduced inline here. Treat this as the one deviation from the token's full spec.
- Title (`<h1>`): `fontSize: 30px; fontWeight: 600; letterSpacing: "-0.02em"; lineHeight: 1.12; margin: 0`. This is the DNA's `typography.scale.pageTitle` token verbatim, and the token's own `component` field names this exact node (`"PageHeader h1"`).
- Sub (rendered only if `sub` is truthy): `fontSize: 13px; color: #6B7280; marginTop: 8px; lineHeight: 1.5`. `#6B7280` is DNA `color.textSecondary`.
- Actions slot: `flexShrink: 0`, no other styling — whatever is passed in (typically a `Button`) renders with its own intrinsic size; `PageHeader` does not wrap it in a flex row itself, so multiple actions must already be pre-wrapped by the caller (e.g. inside a `<div className="flex gap-2">`) if more than one control is needed.

## Usage rules

- `title` is the only required prop — `eyebrow`, `sub`, and `actions` all no-op cleanly when omitted (each is conditionally rendered), so `PageHeader` degrades gracefully from "title only" up to "eyebrow + title + sub + actions" without any layout gaps left behind by the omitted pieces.
- Use `eyebrow` for a section/module label (e.g. "Settings", "Presentations") — never for the actual page title; it is styled purely as context, not as content hierarchy.
- Use `actions` for the page-level primary action (sync, create, upload) — it is the same visual slot across every screen, so a page should not additionally place a second, differently-styled primary action elsewhere in the header area.
- `PageHeader` should be the very first element under `Shell`'s content area on any screen that has a title — do not hand-roll an `<h1>` + description block outside `PageHeader` on a canonical-tree screen.

## Real call-site examples

- `src/features/workspace-settings/container/WorkspaceSettings.tsx:578-591` — full four-prop usage with a `Button` action:
  ```tsx
  <PageHeader
    eyebrow={t("workspaceSettings.pageEyebrow", "Settings")}
    title={t("workspaceSettings.pageTitle", "Workspace Settings")}
    sub={t("workspaceSettings.pageSubtitle", "Manage authentication, pipeline scoring, and submission preferences.")}
    actions={<Button variant="secondary" size="sm" onClick={fetchProviders} disabled={loadingProviders} icon={RefreshIcon}>…</Button>}
  />
  ```
- `src/features/people/container/CreateInviteScreen.tsx:37-41` — eyebrow + title + sub, no actions (inside a `max-w-[560px]` centered form column):
  ```tsx
  <PageHeader
    eyebrow={t("people.createInviteEyebrow")}
    title={t("people.createInvitationButton")}
    sub={t("people.createInviteModalSubtitle")}
  />
  ```
- `src/features/presentations/container/PresentationScreens.tsx:29` and `:116` — compact single-line JSX form, still eyebrow + title + sub, no actions:
  ```tsx
  <PageHeader eyebrow={t('presentations.title', 'Presentations')} title={t('presentations.allPresentations', 'All presentations')} sub={t('presentations.allPresentationsSub', 'Decks and documents submitted alongside ideas.')} />
  ```

## Anti-patterns

- Do not put more than one line of copy into `sub` — the component styles it as a single `<p>` with `lineHeight:1.5` and no max-width/truncation handling; long multi-sentence copy will wrap unpredictably against whatever `actions` width is on the same flex row.
- Do not use `eyebrow` as a breadcrumb substitute — breadcrumbs are a distinct `Shell`-level concern (`crumbs` prop, seen in `CreateInviteScreen.tsx`); `eyebrow` is a static label, not a navigable trail.
- Do not pass multiple sibling action elements directly as `actions` without wrapping them (e.g. `actions={<><Button/><Button/></>}`) — `actions` renders inside a bare `<div style={{flexShrink:0}}>` with no flex/gap of its own, so unwrapped siblings will stack with no spacing.
- Do not override `marginBottom` externally to tighten/loosen the 28px gap per-screen — if a screen needs different spacing under its header, that is a signal the screen's body layout should adapt, not that `PageHeader`'s fixed rhythm should be fought with an ad hoc wrapper margin.
