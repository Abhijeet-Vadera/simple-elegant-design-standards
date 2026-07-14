# Menu

**Category:** Action list (floating popover of clickable actions), NOT a form control.

## Purpose

`Menu` is the canonical **action-menu** primitive: a trigger element that toggles a floating list of clickable actions (e.g. "Edit", "Archive", "Delete"). It is what a "kebab" (⋮) button, a user-account footer button, or a row's overflow-actions button opens. It renders arbitrary `onClick` actions, not form values — there is no `value`/`onChange` concept and nothing here is meant to be submitted. Contrast with [`Dropdown`](./dropdown.md), which is a react-select-based form combobox for choosing a value from options. See "Menu vs. Dropdown" below — never conflate the two.

## File & Exports

- Canonical file: `src/shared/components/ui/index.tsx:828-947`
- Export: `Menu` (function component), plus the `MenuItem` interface (`index.tsx:829-835`)
- Barrel: re-exported from `src/shared/components/ui/index.tsx` itself (it's a primitive defined directly in the barrel file, not re-exported from an adjacent file like `Tooltip`/`Dropdown` are).
- **Legacy duplicate exists and must not be used**: `src/components/ui/index.tsx:313-353` contains a near-identical `Menu` implementation (missing the `width`/`maxHeight` props). This file is flagged in `.ai-design-dna/12_DESIGN_TOKENS/components.json` as `legacyDoNotUse` — a superseded subset of the canonical barrel. Its existence is itself the cautionary example for the anti-pattern below: a second action-menu implementation already happened once and caused drift; do not let it happen again.

## Prop Signature

```ts
export interface MenuItem {
  label?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick?: () => void;
  divider?: boolean;
  danger?: boolean;
}

function Menu({
  trigger,
  items,
  align = "right",
  drop = "down",
  width,
  maxHeight = 320,
}: {
  trigger: ReactNode;
  items: MenuItem[];
  align?: "left" | "right";
  drop?: "down" | "up";
  width?: number | string;
  maxHeight?: number | string;
})
```
(`index.tsx:829-851`)

`trigger` is any `ReactNode` — Menu wraps it in a plain `<div onClick={...}>` that toggles open state; the trigger itself carries no built-in button styling, so callers are responsible for the trigger's visual (e.g. an `Avatar` + text row, an `IconButton`, etc.).

## Variants

Two independent axes, each a simple 2-value union — there is no size/color variant system:

- **`align`**: `"left" | "right"` (default `"right"`) — controls which edge of the trigger the panel's `left`/`right` CSS property is pinned to (`index.tsx:882`, `[align]: 0`).
- **`drop`**: `"down" | "up"` (default `"down"`) — controls whether the panel opens below (`top: calc(100% + 6px)`) or above (`bottom: calc(100% + 6px)`) the trigger (`index.tsx:864-867`).

Divider items (`{ divider: true }`) render as a 1px `#E5E7EB` rule with `6px 0` vertical margin instead of a button (`index.tsx:902-910`).

## Exact Styling

Panel (`index.tsx:879-893`):

| Property | Value |
|---|---|
| position | `absolute`, offset via `pos` (drop) + `[align]: 0` |
| top/bottom | `calc(100% + 6px)` |
| z-index | `40` (matches `zIndex.dropdownMenu` in `02_DESIGN_DNA.json:177`) |
| background | `#fff` |
| border | `1px solid #E5E7EB` |
| border-radius | `10px` |
| box-shadow | `0 4px 16px rgba(10,10,10,0.06)` (matches `shadow.dropdownPanel` in `02_DESIGN_DNA.json:125`) |
| min-width | `width` prop or `180` |
| width | `width` prop (unset = auto/minWidth governs) |
| max-height | `maxHeight` prop, default `320` |
| overflow-y | `auto` |
| padding | `6px` |

Item button (`index.tsx:912-938`):

| Property | Value |
|---|---|
| display | `flex`, `alignItems: center`, `gap: 10px` |
| width | `100%` |
| padding | `8px 10px` |
| border | `0` |
| background | `transparent` (idle); `#F3F4F6` on hover via `whileHover` |
| border-radius | `7px` |
| font-size | `13px` |
| font-weight | `450` (the system's non-standard weight, reserved for dropdown/menu item text per `02_DESIGN_DNA.json:69`) |
| color | `#0A0A0A` normal, **`#DC2626` when `danger: true`** |
| text-align | `left` |
| cursor | `pointer` |
| icon size | `15×15` (when `MenuItem.icon` provided) |

Divider (`index.tsx:903-910`): `height: 1px`, `background: #E5E7EB`, `margin: 6px 0`.

## Motion

Uses the three canonical dropdown Framer Motion variants from `src/shared/lib/animations.ts` (also documented in `.ai-design-dna/12_DESIGN_TOKENS/motion.json`) — never hand-rolled:

- **`dropdownVariants`** (panel): `hidden: { opacity: 0, y: -6, scale: 0.97 }` → `show: { opacity: 1, y: 0, scale: 1, ease: [0.16,1,0.3,1], duration: 0.22 }` → `exit: { opacity: 0, y: -4, scale: 0.98, duration: 0.15 }` (`animations.ts:45-49`).
- **`dropdownContainer`** (item stagger wrapper): `show: { staggerChildren: 0.035, delayChildren: 0.05 }` (`animations.ts:52-56`).
- **`dropdownItem`** (each row): `hidden: { opacity: 0, x: -6 }` → `show: { opacity: 1, x: 0, ease: [0.16,1,0.3,1], duration: 0.24 }` → `exit: { opacity: 0, x: -4, duration: 0.12 }` (`animations.ts:58-62`).
- Per-item hover uses `whileHover={{ background: "#F3F4F6" }}` with `transition={{ duration: 0.12 }}` (`index.tsx:919-920`) — a Framer `whileHover`, not a CSS `:hover` class.

## States

- **Closed** — trigger renders alone; panel unmounted (`AnimatePresence` removes it from the DOM, not just `display: none`).
- **Open** — panel mounted, animates in via `dropdownVariants`/`dropdownContainer`/`dropdownItem`.
- **Item hover** — background `#F3F4F6` (system-wide hover-surface token, `02_DESIGN_DNA.json:24`).
- **Danger item** — text color `#DC2626` instead of `#0A0A0A`; no separate hover-background treatment for danger items (still `#F3F4F6` on hover) — color alone signals destructiveness on the label.
- **Outside click** — a `mousedown` listener on `document` closes the menu when the click target is outside the wrapping `ref` div (`index.tsx:855-862`).
- **Item click** — closes the menu (`setOpen(false)`) then invokes `it.onClick?.()` (`index.tsx:915-918`) — close-then-act ordering, not act-then-close.
- No disabled-item state exists in `MenuItem` — if an action must be conditionally unavailable, omit it from the `items` array rather than rendering a disabled row (no precedent for a disabled visual state in this component).

## Menu vs. Dropdown — do not conflate

| | `Menu` | `Dropdown` |
|---|---|---|
| Purpose | Trigger a **list of actions** (imperative `onClick`s) | Choose **a value** from options (declarative `value`/`onChange`) |
| Underlying tech | Hand-rolled `useState` + `AnimatePresence` | `react-select` wrapper |
| Typical call sites | Kebab/overflow buttons, user-account footer menu | Filter bars, form fields, table page-size picker |
| Panel radius/shadow | `10px` / `0 4px 16px rgba(10,10,10,0.06)` | `10px` / `0 8px 24px rgba(10,10,10,0.10), 0 2px 6px rgba(10,10,10,0.06)` — visually similar but NOT the same shadow value; do not copy one into the other from memory |
| Searchable/multi-select/clearable | No such concept | Yes (`isSearchable`, `isMulti`, `isClearable`) |

Both are "floating white panel with a 1px `#E5E7EB` border" — that's where the resemblance ends. If a design calls for "select one of these options" (even just 2-3), use `Dropdown`. If a design calls for "do one of these things", use `Menu`.

## Usage Rules

- ALWAYS import `Menu` from `@/shared/components/ui` (the canonical barrel) — never from `src/components/ui/index.tsx` (legacy, superseded).
- ALWAYS pass `danger: true` on destructive `MenuItem`s (delete, remove, revoke) instead of hand-coloring the label red inline — this is the only sanctioned way to mark a menu action as dangerous.
- ALWAYS let the outside-click-to-close and z-index-40 behavior come from the component itself — never wrap `Menu` in a second manual overlay/backdrop.
- Use `drop="up"` only when the trigger sits near the bottom of the viewport/its container (e.g. a sidebar footer) — this is the one real production case (`Shell.tsx:372`).

## Anti-Patterns

- **NEVER build a second global action-menu component.** A second one already exists by accident (`src/components/ui/index.tsx:313`, the legacy barrel) and it is documented tech debt, not a pattern to extend. If you need a variant, add a prop to the canonical `Menu`, don't fork it.
- **NEVER use `Menu` where a form `Select`/`Dropdown` is needed.** `Menu` items are `onClick` handlers with no persisted "selected" state and no `value` — if the UI needs to remember which option is currently chosen and re-render a control showing that value, that is a `Dropdown`/`Select` job, not a `Menu` job.
- NEVER give `Menu` items a controlled/checked visual state (e.g. a checkmark for "currently active" filter) — that responsibility belongs to `Dropdown`'s `option` selected styling (`state.isSelected` background `#0A0A0A`, `Dropdown.tsx:83-89`) or a dedicated `Segmented` control, not `Menu`.
- NEVER hand-write new enter/exit motion for a menu panel — reuse `dropdownVariants`/`dropdownContainer`/`dropdownItem` from `src/shared/lib/animations.ts` per Design Constitution rule 41.

## Real Call-Site Example

`src/shared/components/layout/Shell.tsx:372-396` — the sidebar footer user-account menu:

```tsx
<Menu
  align="left"
  drop="up"
  trigger={
    <motion.div
      whileHover={{ background: "#1C1C1C" }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-2.5 py-[9px] px-2.5 rounded-lg cursor-pointer"
    >
      <Avatar name={user?.name} size={30} dark src={...} />
      <div className="flex flex-col gap-[1px] min-w-0 flex-1">
        <span className="text-[13px] font-medium text-white truncate">{user?.name}</span>
        <span className="text-[11px] text-[#5A5A5A] truncate capitalize">{t(`roles.${user?.role}`, ...)}</span>
      </div>
    </motion.div>
  }
  items={[...]}
/>
```

This is the **only** production call site of `Menu` from the canonical barrel found in `src/` — it is a low-frequency, high-importance primitive (the account/logout/settings action list), not a component sprinkled across many screens.
