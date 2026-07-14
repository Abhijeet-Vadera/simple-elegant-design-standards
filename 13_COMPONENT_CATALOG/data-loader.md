# DataLoader

## Purpose
The canonical full-section/full-panel loading placeholder: a centered `Spinner` plus an optional message, occupying a generous minimum height so the surrounding layout (cards, grids) doesn't jump/collapse while data is in flight. Used as the entire content of a region — a `SectionCard` body, a full page body — while its data query is pending.

## File / Exports / Prop Signature
- **File:** `src/shared/components/ui/index.tsx`
- **Export:** `export function DataLoader(...)`, lines 1147–1169
- **Props:**
  ```ts
  {
    message?: string; // default "Loading data..."
    light?: boolean;  // default false
  }
  ```
- Internally composes `Spinner` (`size={20}`, forwarding `light`) — see `spinner.md`. `DataLoader` is not exported with any `size` control of its own; it always drives `Spinner` at `20`.

## Exact Styling
Source: `src/shared/components/ui/index.tsx:1156-1167`. Note this component uses Tailwind utility classes directly rather than inline `style={}` (unlike `Segmented`/`EmptyState`/`Spinner`, which are inline-style-driven) — still fully canonical, just a different authoring style within the same file.

**Outer wrapper** — `className="flex flex-col items-center justify-center py-12 px-6 min-h-[360px] w-full"`:
| Property | Value |
|---|---|
| `display` | `flex`, `flex-direction: column` |
| alignment | `align-items: center`, `justify-content: center` |
| `padding` | `48px 24px` (`py-12 px-6` → `12*4=48px` vertical, `6*4=24px` horizontal) |
| `min-height` | `360px` |
| `width` | `100%` |

**Spinner slot** — `<div className="mb-4">` (16px bottom margin) wrapping `<Spinner size={20} light={light} />`.

**Message text** (rendered only if `message` is truthy — note the default value `"Loading data..."` means it renders unless the caller explicitly passes `message=""`):
| Property | Value |
|---|---|
| `font-size` | `13.5px` (`text-[13.5px]`) |
| `font-weight` | `400` (`font-normal`) |
| `margin` | `0` (`m-0`) |
| `color` | `#6B7280` (`text-[#6B7280]`, token: `text.secondary`) when `light={false}` |
| `color` | `rgba(255,255,255,0.4)` (`text-white/40`) when `light={true}` |

## States
`DataLoader` has exactly one visual state (it is a leaf loading indicator, not a stateful component) — variance comes only from the `message` string and the `light` boolean chosen by the caller to match the background.

## Usage Rules
- **Use `DataLoader` for whole-section/whole-panel loading** — i.e. when the entire content of a `SectionCard`, table region, or page body is being replaced by the loader while its query is pending (`min-height: 360px` exists specifically to prevent layout collapse in these larger regions).
- **Use bare `Spinner` for inline loading** — inside buttons, small text links, compact panels (like the notification bell), pagination "load more" indicators — anywhere the 360px minimum height would be wrong or the loading affordance needs to sit next to/inside other content rather than replace an entire region.
- Always pass a translated, context-specific `message` (e.g. `t("dashboard.loadingDashboard", "Loading dashboard…")`) rather than leaving the generic default `"Loading data..."` in user-facing screens — every real call site overrides it.
- `light` should match the surrounding surface exactly like `Spinner`'s rule — `DataLoader` is not observed with `light={true}` in the current codebase (all real call sites are on white/light `SectionCard` surfaces), but the prop exists for dark-surface panels.

## Real Call-Site Examples
- `src/features/dashboard/container/DashboardScreen.tsx:119` — `return <DataLoader message={t("dashboard.loadingDashboard", "Loading dashboard…")} />;` as the entire return value while the dashboard query is pending (full-page replacement).
- `src/features/dashboard/container/DashboardScreen.tsx:363` — second full-page-level use for a different loading branch of the same screen.
- `src/features/people/container/EmployeeDetailScreen.tsx:255` — `<DataLoader message={t("people.loadingEmployee")} />` replacing the whole detail-page body while the employee record loads.
- `src/features/people/container/EmployeeDetailScreen.tsx:348` — `<DataLoader message={t("people.loadingTransactions")} />` inside a `SectionCard` ("Reward ledger"), gated by `txLoading`, as the sole content of that card's body — the canonical "section-level" use case.
- `src/features/people/container/EmployeeDetailScreen.tsx:365` — `<DataLoader message={t("people.loadingIdeas")} />` inside the "Submitted ideas" `SectionCard`, same pattern.

## Anti-Patterns
- Do not use `DataLoader` for small, inline loading moments (a button's pending state, a "load more" row) — its `min-height: 360px` will blow out the layout. Use bare `Spinner` there instead (see `spinner.md`'s call sites in `NotificationBell.tsx` for the correct inline pattern).
- Do not build a bespoke "centered spinner + text" block per screen with different padding/min-height/font values — every full-section loading state observed in the codebase (`DashboardScreen`, `EmployeeDetailScreen`) uses the exact same `DataLoader` component, and new sections should follow suit rather than approximate the layout with raw `flex`/`py-*`/`min-h-*` utilities.
- Do not omit the `message` prop in production screens — the generic fallback ("Loading data...") is a development default, not a polished user-facing string; always supply a translated, section-specific message.
- Do not swap in one of the hand-rolled `animate-spin` spinners (see `spinner.md` anti-patterns) inside a `DataLoader`-shaped wrapper — that recreates `DataLoader`'s layout without its canonical `Spinner`, defeating the point of having a shared component.
