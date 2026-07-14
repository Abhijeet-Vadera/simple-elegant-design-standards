# IdeaRow

Source of truth: `src/shared/components/ui/index.tsx:1338-1417`. Tokens cited from `.ai-design-dna/02_DESIGN_DNA.json` (`color.border`, `color.rowHoverTint`, `typography.families.mono`, `typography.scale.ideaRef`) and `12_DESIGN_TOKENS/colors.json` / `typography.json`.

## Purpose

A single-line, dense list row for surfacing an idea inside a list container (dashboard "assigned ideas" feed, etc.). It is not a card — it has no border/radius/shadow of its own; it relies on being stacked inside a `SectionCard` or similar list wrapper, separated by hairline bottom borders, one row per idea. It exists so the same idea-summary shape (ref code, relative time, title, reviewer avatar, stage) never has to be hand-rolled per screen.

## File, export, prop signature

- File: `src/shared/components/ui/index.tsx:1338`
- Export: `export function IdeaRow({ idea, onClick, showReviewer = true }: {...})`
- Props:
  ```ts
  idea: {
    id: string;
    ref: string;
    title: string;
    employee: { name: string };
    reviewer: { name: string } | null;
    stage: string;
    submittedRel: string;   // pre-formatted relative time string, e.g. "2h ago"
    priority: string;
    stageName: string;      // used to resolve StagePill color, not `stage`
  };
  onClick?: () => void;      // presence alone toggles pointer cursor + hover tint
  showReviewer?: boolean;    // default true
  ```
- No `className`/`style` escape hatch — the row's look is fixed; the only variance is `showReviewer` and whether `onClick` is passed. `idea.employee` and `idea.priority` are typed in the prop shape but not rendered anywhere in the component body — dead/reserved fields as authored.

## Exact styling

- Layout: `display:flex; alignItems:center; gap:14px; padding:"13px 18px"`. This matches the DNA's documented `cardPaddingCompact: "13px 18px"` spacing step.
- Divider: `borderBottom: 1px solid #E5E7EB` (DNA `color.border`) on every row — the caller is expected to stack rows directly with no extra gap; the hairline border is the only separator.
- Hover: only wired up when `onClick` is supplied. `onMouseEnter` sets inline `background: #FAFAF9` (DNA `color.rowHoverTint`, explicitly documented as "slightly warmer than canvas"); `onMouseLeave` resets to `transparent`. `transition: background 0.18s`. Rows without `onClick` get `cursor: default` and never receive the hover tint (the mouse handlers are unconditional but the enter-handler no-ops without `onClick`).
- Left content block (`flex:1; minWidth:0` so text can truncate):
  - Top line (`display:flex; gap:8px; marginBottom:3px`):
    - `idea.ref` — `fontFamily: "JetBrains Mono, monospace"`, `fontSize: 10.5px`, `color: #9CA3AF` — exactly the DNA `typography.scale.ideaRef` token (`{ size: "10.5px", family: "mono", color: "#9CA3AF" }`).
    - `idea.submittedRel` — `fontSize: 12px`, `color: #6B7280` (DNA `color.textSecondary`).
  - Title line: `fontSize: 13.5px`, `fontWeight: 500`, single-line clamp via `overflow:hidden; textOverflow:ellipsis; whiteSpace:nowrap`. 13.5px/500 matches the DNA `typography.scale.body` size step but at medium weight rather than the plain 400 body weight — a title-specific emphasis, not the generic body token.
- Right-side content, in fixed order, no wrapping label:
  1. `showReviewer && idea.reviewer` → `<Avatar name={idea.reviewer.name} size={24} />`. Renders nothing (not even a placeholder) when `reviewer` is null, even if `showReviewer` is true — the row silently loses its avatar slot rather than reserving the space.
  2. `<StagePill stageId={idea.stageName} showDot={false} />` — always rendered, dot suppressed (`showDot={false}`) since the row's own layout already carries enough visual weight; the dot is reserved for standalone StagePill usage (e.g. Kanban cards).
- No radius, no shadow, no background of its own outside the hover state — it is a bare flex row, by design, so it disappears into whatever list surface hosts it.

## Usage rules

- Always render inside a list-style wrapper that supplies the outer card chrome (`SectionCard` is the observed pairing) — `IdeaRow` provides no top/bottom/left/right container border beyond its own bottom hairline, so a lone `IdeaRow` outside a card looks unstyled.
- Pass `onClick` whenever the row should navigate/open a detail view; omitting it is a deliberate "static row, no hover" state, not an oversight — do not fake it by wrapping a non-interactive row in a clickable parent, since the hover tint is tied directly to the `onClick` prop being present.
- `showReviewer={false}` is the correct way to hide the avatar column on "my ideas" style views where the current user *is* the reviewer/owner and showing their own avatar would be redundant (see call site below).
- `idea.stageName` (not `idea.stage`) drives the StagePill color lookup — callers must supply a value that matches one of the `STAGE_STYLE` keys (`submitted`/`screening`/`evaluation`/`pilot`/`scaled`, per DNA `color.stagePillColors`), or it silently falls back to the `submitted` style.

## Real call-site example

`src/features/dashboard/container/DashboardScreen.tsx:216-221` (inside a `SectionCard` titled "My assigned ideas"):

```tsx
<IdeaRow
  key={i.id}
  idea={i}
  onClick={() => go("idea", { ideaId: i.id })}
  showReviewer={false}
/>
```

This is currently the only production call site of the canonical `IdeaRow` (imported via `@/shared/components/ui`). `showReviewer={false}` is used here because the listed ideas are already scoped to "assigned to me," so a reviewer avatar would just repeat the viewer's own identity.

## Anti-patterns

- Do not add a `className`/`style` prop to `IdeaRow` to change its padding, border, or hover color per-screen — there is no such escape hatch today; a screen that needs different row density needs a different component, not a patched `IdeaRow`.
- Do not render `IdeaRow` bare on a page background (`#F7F7F5` canvas) expecting it to look like a card — it has no surface/border/radius of its own and will look like unstyled text floating on the canvas.
- Do not rely on `idea.priority` or `idea.employee` being displayed — both are accepted in the prop type but never rendered; if a screen needs to show priority or the submitting employee inline, that requires a different composition, not passing more fields into `IdeaRow`.
- Be aware there is a **separate, legacy `IdeaRow`** at `src/components/ui/index.tsx:471` (non-canonical, part of the `src/components/*` legacy duplicate tree called out in `00_PROJECT_IDENTITY.md`). Always import from `@/shared/components/ui`, never from `@/components/ui`, and never copy patterns observed only in the legacy file.
