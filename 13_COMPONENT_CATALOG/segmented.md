# Segmented

## Purpose
A two-or-more-option toggle control rendered as a single pill-shaped track with a "sliding" active item (iOS-style segmented control). Used for short, mutually-exclusive choices where a radio group or tab bar would be too heavy — e.g. "Submit for: Me / Someone Else", "Grant points / Redeem points".

## File / Exports / Prop Signature
- **File:** `src/shared/components/ui/index.tsx` (canonical tree — do not use the drifted duplicate at `src/components/ui/index.tsx:373`, which has an unstyled/legacy copy of the same component)
- **Export:** `export function Segmented(...)`, lines 1011–1056
- **Props:**
  ```ts
  {
    value: string;
    onChange: (v: string) => void;
    options: Array<{ value: string; label: string }>;
    size?: "sm" | "md"; // default "md"
  }
  ```
- No `disabled` prop, no icon-per-option support, no controlled/uncontrolled split — always controlled.

## Exact Styling
Source: `src/shared/components/ui/index.tsx:1023-1054`. Cross-check: `.ai-design-dna/12_DESIGN_TOKENS/radius.json` (`componentSpecific.segmentedItem: "7px"`) and `shadows.json` (`componentSpecific.segmentedActiveItem: "0 1px 2px rgba(10,10,10,0.04)"` = shadow **xs**).

**Track (outer container):**
| Property | Value |
|---|---|
| `display` | `flex` |
| `background` | `#F3F4F6` (token: `hoverSurface` in `colors.json`) |
| `border-radius` | `9px` |
| `padding` | `3px` |
| `gap` | `2px` |

**Item (button), inactive:**
| Property | Value |
|---|---|
| `border` | `0` |
| `background` | `transparent` |
| `color` | `#6B7280` (token: `text.secondary`) |
| `padding` | `7px 14px` (md) / `5px 10px` (sm) |
| `border-radius` | `7px` (token: `radius.componentSpecific.segmentedItem`) |
| `font-size` | `13px` (md) / `12px` (sm) |
| `font-weight` | `500` |
| `box-shadow` | `none` |
| `transition` | `all 0.2s` |
| `cursor` | `pointer` |

**Item, active (`value === o.value`):**
| Property | Value |
|---|---|
| `background` | `#fff` |
| `color` | `#0A0A0A` (token: `ink`) |
| `box-shadow` | `0 1px 2px rgba(10,10,10,0.04)` (shadow **xs** / `segmentedActiveItem`) |
| all other properties same as inactive at that size |

There is no layout-based sliding thumb (no `layoutId`/`motion.div` for the pill) — the "active" look is applied per-button via conditional inline styles, animated only by the `0.2s` CSS transition on `background`/`box-shadow`/`color`.

## States
- **Inactive item:** transparent bg, secondary-gray text.
- **Active item:** white bg, ink text, xs shadow — reads as a physically "raised" chip inside the gray track.
- **Hover:** not explicitly styled (no `:hover` rule) — relies on `cursor: pointer` only. This is a documented gap, not a deliberate design decision.
- **Disabled:** not supported by the component.
- **Focus:** no visible focus ring defined; falls back to browser default `<button>` focus outline.

## Usage Rules
- Use `Segmented` only for 2 (occasionally 3) short, text-label, mutually-exclusive options that change state instantly (no navigation, no async load gate). If more than ~3 options or the labels are long, use a dropdown or tab bar instead.
- Always pass `options` as `{ value, label }` — labels should be short enough to fit on one line (`whiteSpace: "nowrap"` is hardcoded, so long labels will overflow the track rather than wrap).
- `size="sm"` is for dense contexts (inside modals with tight vertical rhythm); `size="md"` (default) is for standalone form-field-level placement.

## Real Call-Site Examples
- `src/features/ideas/container/CreateIdeaScreen.tsx:343-350` — "Submit for: For Myself / For Someone Else" toggle, md size, paired with a small `12.5px/500` label above it.
- `src/features/rewards/modal/RecordTransactionModal.tsx:118-125` — "Grant points / Redeem points" transaction-type toggle inside a modal, wrapped in `<div className="mb-[18px]">`.

Both call sites import `Segmented` from `@/shared/components/ui` (the canonical barrel), confirming the legacy `src/components/ui/index.tsx` copy is dead/unreferenced by these screens.

## Anti-Patterns
- Do not reimplement a segmented toggle with two separate `<button>`s and manual active-state CSS per screen — always import `Segmented` from `@/shared/components/ui`.
- Do not use the legacy `src/components/ui/index.tsx` copy of `Segmented` — it is not the canonical source and may drift from these token values over time.
- Do not add per-screen hover/focus styling overrides to individual segmented items; if hover/focus treatment needs improving, fix it once in the shared component, not at each call site.
- Do not use `Segmented` as a substitute for `Tabs` when the options represent navigable views with their own URL/route state — segmented is for local, ephemeral UI state only.
