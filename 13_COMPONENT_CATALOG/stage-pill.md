# StagePill

## 1. Purpose

A pill-shaped indicator that renders one of the five fixed **workflow stage IDs** (`submitted`, `screening`, `evaluation`, `pilot`, `scaled`) with a dedicated color per stage plus an optional leading dot. It exists specifically to encode *where an idea sits in the pipeline* — it is a domain-specific status pill, distinct from the generic `Badge` primitive (see §6, Usage rules).

## 2. File / exports / prop signature

- **File:** `src/shared/components/ui/index.tsx:1211-1277`
- **Duplicated (near-identical) in the legacy barrel:** `src/components/ui/index.tsx:441` — flagged as `legacyDoNotUse` in `.ai-design-dna/12_DESIGN_TOKENS/components.json`. One real call site still imports from this legacy path (see anti-pattern note in §7): `src/components/modal/StageMovementModal.tsx:3` — `import { Modal, Button, Field, Textarea, StagePill, Spinner } from "../ui";`
- **Export:** `export function StagePill({ stageId, label, showDot = true }: {...})`

```ts
function StagePill({
  stageId,          // optional — expected to be one of: "submitted" | "screening" | "evaluation" | "pilot" | "scaled"
  label,             // optional — display text override; if omitted, derived from stageId
  showDot = true,    // optional — leading 6px dot, currentColor
}: {
  stageId?: string;
  label?: string;
  showDot?: boolean;
}): JSX.Element
```

Fallback logic (`src/shared/components/ui/index.tsx:1244-1248`):
- `safeId = stageId || ""`
- `s = STAGE_STYLE[safeId] || STAGE_STYLE.submitted` — **any unrecognized `stageId` silently renders with the `submitted` (gray) style**, not an error state.
- `displayLabel = label || (safeId ? capitalize(safeId) : "Unknown")` — if no `label` and no `stageId` at all, the pill reads literally `"Unknown"`.

## 3. Exact color map — `STAGE_STYLE` (`src/shared/components/ui/index.tsx:1212-1234`)

| stageId | background | text/dot color | border |
|---|---|---|---|
| `submitted` (default/fallback) | `#F3F4F6` | `#6B7280` | `1px solid #E5E7EB` |
| `screening` | `#FEF3C7` | `#D97706` | `1px solid #FDE68A` |
| `evaluation` | `#EFF6FF` | `#2563EB` | `1px solid #BFDBFE` |
| `pilot` | `#F0FDF4` | `#16A34A` | `1px solid #BBF7D0` |
| `scaled` | `#0A0A0A` (ink) | `#FFFFFF` | `1px solid #0A0A0A` |

Confirmed identical in `.ai-design-dna/02_DESIGN_DNA.json` → `color.stagePillColors` and `.ai-design-dna/12_DESIGN_TOKENS/semantic-colors.json` → `stagePill`. Note `scaled` is the one outlier: solid ink background + white text, not a soft tint+border triad like the other four — it's meant to read as a terminal/"done" state, visually heavier than the rest of the pipeline.

The dot (when `showDot`) is `background: "currentColor"` — it always matches the pill's text color exactly, there is no separate dot-color token.

## 4. Exact dimensions

| Property | Value |
|---|---|
| Height | `22px` (fixed, via `height: 22`) — same height as `Badge` (`controlHeights.badge: 22` in `.ai-design-dna/12_DESIGN_TOKENS/components.json`) |
| Horizontal padding | `0 9px` |
| Border radius | `999px` (full pill) |
| Font size | `11.5px` — same as `Badge`'s `badgeText` scale (`.ai-design-dna/02_DESIGN_DNA.json` → `typography.scale.badgeText`) |
| Font weight | `500` |
| Dot size | `6px × 6px`, `borderRadius: "50%"` |
| Gap (dot ↔ label) | `6px` |
| Display | `inline-flex; alignItems: center` |

`StagePill` and `Badge` share the exact same height (22px) and font-size (11.5px) family — they are visually siblings by design, differing only in their fixed color source (lookup table keyed by stage vs. an explicit `variant` prop).

## 5. Real call-site examples (grep-verified)

| File:line | Usage |
|---|---|
| `src/shared/components/ui/index.tsx:1414` | Inside `IdeaRow` (same canonical file): `<StagePill stageId={idea.stageName} showDot={false} />` |
| `src/shared/components/modal/Modals.tsx:335-339` | `<StagePill stageId={fromStyleId} label={fromLabel} showDot={false} />` — "from" side of a stage-move confirmation |
| `src/shared/components/modal/Modals.tsx:362` | `<StagePill stageId={toStyleId} label={toLabel} showDot={false} />` — "to" side, same modal |
| `src/components/modal/StageMovementModal.tsx:114-118` | `<StagePill stageId={fromStage.id} label={fromStage.name} showDot={false} />` (legacy import path — see §7) |
| `src/components/modal/StageMovementModal.tsx:144-148` | `<StagePill stageId={toStage.id} label={toStage.name} showDot={false} />` (legacy import path) |

All five live call sites pass `showDot={false}` — the leading dot, while implemented and defaulted `true`, is not actually exercised anywhere in the current app; every real usage relies purely on the color+background+border triad plus text.

**Notable real-world mismatch found at `src/shared/components/ui/index.tsx:1414`:** `IdeaRow` passes `idea.stageName` as `stageId`, but per `src/shared/types/index.ts:225` an `Idea`'s actual stage identifier field is `stage: StageId` — `stageName` (`types/index.ts:246, 302`) is a free-text, potentially tenant-customized display name (e.g. "Technical Review"), not one of the five fixed keys in `STAGE_STYLE`. In practice this call site will almost always miss the lookup table and silently fall back to the gray `submitted` style regardless of the idea's true stage — documented here as observed behavior, not corrected.

## 6. Usage rules — StagePill vs. Badge

- **Use `StagePill`** exclusively to represent an idea's position in the fixed workflow pipeline (`submitted → screening → evaluation → pilot → scaled`). It is the single source of truth for stage-color mapping; every stage-related surface (kanban labels, stage-move modals, idea rows) should resolve color through this component's `STAGE_STYLE` map, not by re-deriving stage colors ad hoc.
- **Use `Badge`** (`src/shared/components/ui/index.tsx:203-245`) for everything else that needs a colored pill: generic status (e.g. `Reviewed`/`Pending` — see `src/features/presentations/container/PresentationScreens.tsx:90`, `<Badge variant={p.status === 'Reviewed' ? 'success' : 'warning'}>`), counts, tags, or any status concept that isn't literally one of the five stage IDs. `Badge`'s `variant` prop (`""`, `solid`, `soft`, `success`, `warning`, `danger`, `blue`) is the generic vocabulary; `StagePill`'s `stageId` lookup is the pipeline-specific vocabulary. They are not interchangeable even though they render at the same height/font-size.

## 7. Anti-patterns

- **Never use `Badge` to represent a stage id.** `StagePill` already encodes the canonical stage → color mapping (`STAGE_STYLE`); re-deriving stage colors via `Badge`'s generic `variant` prop (e.g. mapping `evaluation` → `variant="blue"` by hand) creates a second, divergent source of truth that will drift from `STAGE_STYLE` the moment either is edited. If a stage needs to be shown, render `<StagePill stageId={...} />`.
- **Do not add a 6th key to `STAGE_STYLE` casually** — the five keys correspond to the app's fixed `StageId` union (`src/shared/types/index.ts:225`); a genuinely new stage requires coordinated changes to the type, the workflow config, and this map plus the token mirrors in `.ai-design-dna/02_DESIGN_DNA.json` / `12_DESIGN_TOKENS/semantic-colors.json`.
- **Do not pass a display-only stage name string as `stageId`** expecting a color match (see the `idea.stageName` mismatch documented in §5) — only pass the actual fixed stage identifier as `stageId`, and use the separate `label` prop for any custom/localized display text.
- **Do not import `StagePill` from the legacy `src/components/ui` barrel** (as `src/components/modal/StageMovementModal.tsx:3` currently does) — new code should import from `@/shared/components/ui`, per `.ai-design-dna/12_DESIGN_TOKENS/components.json`'s `legacyDoNotUse` guidance.
