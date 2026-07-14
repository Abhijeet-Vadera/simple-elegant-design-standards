# Button

## 1. Purpose

The general-purpose clickable action control for the whole app: form submits, modal confirm/cancel, navigation triggers, toolbar actions, page-header actions. It is the single primitive behind almost every "do something" affordance in the system — there is no separate `<PrimaryButton>` / `<LinkButton>` etc., only `Button` with a `variant` prop.

## 2. File & Exports

- **File:** `src/shared/components/ui/index.tsx` (lines 124–178)
- **Export:** `export function Button(props: ButtonProps)`
- Sibling internal types/constants in the same block: `BtnVariant`, `BtnSize`, `btnBase`, `btnVariants`, `btnSizes` (not exported).

### Exact TS prop signature

```ts
type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type BtnSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconRight?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  block?: boolean;
  children?: ReactNode;
}
```

`Button` extends native `ButtonHTMLAttributes<HTMLButtonElement>`, so any standard `<button>` attribute (`onClick`, `disabled`, `type`, `id`, `aria-*`, etc.) passes through via `...rest` untouched. Defaults applied by destructuring: `variant = "secondary"`, `size = "md"`.

Renders as a plain `<button>` — **not** wrapped in `framer-motion`'s `motion.button`; all transition/press feedback is pure CSS (`transition-all duration-200`, `active:scale-[0.985]`).

## 3. Variants & Sizes (exact values from `btnVariants` / `btnSizes`)

Source: `src/shared/components/ui/index.tsx:139–155`.

### Variants (`btnVariants: Record<BtnVariant, string>`)

| Variant | bg | text | border | hover bg | hover border |
|---|---|---|---|---|---|
| `primary` | `#0A0A0A` | `#FFFFFF` (white) | `#0A0A0A` | `#262626` | `#262626` |
| `secondary` | `#FFFFFF` (white) | `#0A0A0A` | `#E5E7EB` | `#F3F4F6` | `#D1D5DB` |
| `outline` | `#FFFFFF` (white) | `#0A0A0A` | `#E5E7EB` | `#F3F4F6` | `#D1D5DB` |
| `ghost` | transparent | `#6B7280` | transparent | `#F3F4F6` | transparent (unchanged); text becomes `#0A0A0A` on hover |
| `danger` | `#FFFFFF` (white) | `#DC2626` | `#E5E7EB` | `red-50` (Tailwind stock) | `red-200` (Tailwind stock) |

> **Observed duplication — documented as-is, not "fixed":** `secondary` and `outline` are byte-for-byte identical Tailwind class strings (`"bg-white text-[#0A0A0A] border-[#E5E7EB] hover:bg-[#F3F4F6] hover:border-[#D1D5DB]"`). There is no visual difference between them anywhere in the app. Do not silently collapse them into one variant or invent a 6th variant to "fix" this — this is the real, current behavior of the codebase. `.ai-design-dna/12_DESIGN_TOKENS/components.json` flags this same fact under `knownDuplicateVariants`.

`danger`'s hover uses Tailwind's stock `red-50`/`red-200` utility classes (not the project's custom danger triad `#FEE2E2`/`#FECACA` used by `Badge`/`StagePill`) — this is a real inconsistency in the source, cited here rather than corrected.

### Sizes (`btnSizes: Record<BtnSize, string>`)

| Size | height | horizontal padding | font-size | border-radius |
|---|---|---|---|---|
| `sm` | `32px` (`h-8`) | `12px` (`px-3`) | `12.5px` | `8px` |
| `md` (default) | `38px` (`h-[38px]`) | `16px` (`px-4`) | `13.5px` | `8px` |
| `lg` | `44px` (`h-11`) | `20px` (`px-5`) | `14.5px` | `8px` |

All three sizes share the same `8px` radius — there is no size-dependent radius scaling.

Icon glyph size (`icon`/`iconRight` SVG `width`/`height`) is derived, not a lookup table: `size === "sm" ? 14 : 15` — i.e. `sm` gets 14px icons, both `md` and `lg` get 15px icons (line 167).

## 4. Spacing

- Internal layout: `inline-flex items-center justify-center gap-2` — icon-to-label gap is a flat `8px` (`gap-2`) regardless of size.
- Height/padding: see size table above (exact `h-*`/`px-*` per size).
- `block` prop, when true, adds `w-full` (button stretches to fill its container width) — height/padding are unaffected.
- No vertical padding is set explicitly; vertical centering comes from the fixed `h-*` + `items-center`.

## 5. States

- **Default:** variant's base `bg`/`text`/`border` from the table above.
- **Hover:** variant's `hover:bg-*` / `hover:border-*` (and `hover:text-*` for `ghost`) — no scale or shadow change on hover, purely a color swap, animated by the shared `transition-all duration-200`.
- **Active/press:** `active:scale-[0.985]` — a 1.5% shrink on mousedown, no color change beyond whatever hover state is already active.
- **Disabled:** `disabled:opacity-40 disabled:cursor-not-allowed` — flat 40% opacity on the whole button (icon + label + border together), pointer becomes not-allowed. There is no separate disabled color palette; it's a global opacity dim of the current variant.
- **Focus:** No explicit `focus:` / `focus-visible:` classes are defined on `Button` in `btnBase` or any variant — it relies entirely on the browser's native focus outline. This differs from `Input`/`Textarea`/`Select`, which do implement an explicit `0 0 0 3px rgba(10,10,10,0.06)` focus ring. Documented as an observed gap, not invented styling.

## 6. Motion

- `btnBase` (shared by every variant/size): `transition-all duration-200 active:scale-[0.985] disabled:opacity-40 disabled:cursor-not-allowed` (line 138).
- This is a plain CSS transition, not a Framer Motion variant — `Button` does not import `motion` from `framer-motion` at all. Contrast with `Modal`'s close button and `Menu`'s items, which are `motion.button` with `whileHover`/spring/ease-out-expo motion — `Button` intentionally stays outside the Framer Motion system used elsewhere in `index.tsx`.
- `duration-200` = 200ms, Tailwind's default (unspecified) timing-function (`ease` — not the project's signature `cubic-bezier(0.16, 1, 0.3, 1)` ease-out-expo curve used in Framer Motion variants).
- Press feedback: `active:scale-[0.985]`, i.e. 98.5% scale on `:active`, no easing override — same 200ms transition governs the scale.

## 7. Usage Rules

Grounded in variant styling + observed real call sites (see §8):

- **`primary`** — the one primary/committing action per view (submit, save, confirm, create). Solid ink-black fill draws the eye; use once per section/toolbar, not on every button in a row.
- **`secondary` / `outline`** — interchangeable (identical styling, see §3) neutral/white-bordered action, used for secondary actions sitting next to a `primary` button (e.g. "Cancel" next to "Save", or a lower-emphasis toolbar action like "Upload document" next to a `primary` "Save").
- **`ghost`** — lowest-emphasis action, typically icon+text navigation/back links or trailing "see more" links inside a card header (transparent until hovered, gray `#6B7280` text at rest).
- **`danger`** — destructive confirmation actions (delete/remove), always paired with a `secondary` "Cancel" in a modal footer.
- **Sizes:** `sm` for compact toolbars/table row actions and pagination; `md` (default) for standard form/modal actions; `lg` exists in the lookup table but no `size="lg"` usage was found anywhere in `src/features` at the time of this audit — treat as available but currently unused in practice.
- **`block`** prop exists in the type but no real call site sets it in `src/features` either — available for full-width buttons (e.g. mobile/narrow forms) but not yet exercised in this codebase.

## 8. Composition Rules — real call sites

- `src/features/ideas/container/IdeaDetailScreen.tsx:348-357` — `outline` + `sm` + left `icon={UploadIcon}` + `disabled={isActionDisabled}`:
  ```tsx
  <Button id="upload-document-btn" variant="outline" size="sm" icon={UploadIcon}
    onClick={() => setShowUploadModal(true)} disabled={isActionDisabled}>
    {t("idea.uploadDocument")}
  </Button>
  ```
- `src/features/ideas/container/IdeaDetailScreen.tsx:359-364` — `primary` + `sm` + `icon={SaveIcon}`, placed directly beside the `outline` button above (secondary-then-primary left-to-right ordering).
- `src/features/workflow/components/DeleteModal.tsx:54-59` — canonical modal-footer pairing, `secondary` cancel + `danger` confirm, both `disabled={loading}`, with `Spinner light` swapped in as children while `loading`:
  ```tsx
  <Button variant="secondary" onClick={onClose} disabled={loading}>{t("common.cancel", "Cancel")}</Button>
  <Button variant="danger" onClick={onConfirm} disabled={loading}>
    {loading ? <Spinner light /> : t("workflow.deleteStageTitle", "Delete stage")}
  </Button>
  ```
- `src/features/dashboard/container/DashboardScreen.tsx:202-208` — `ghost` + `sm` + `iconRight={ChevronRightIcon}` as a `SectionCard` header action ("Board" link with trailing chevron).
- `src/features/rewards/container/RewardsScreen.tsx:225` and `src/features/presentations/container/PresentationScreens.tsx:27` — `primary` + `icon={PlusIcon}` as the standard "create new" pattern (icon left of label).
- `src/features/presentations/container/PresentationScreens.tsx:89,99` — `secondary` + `icon={DownloadIcon}` as the standard "download" pattern.

## 9. Anti-Patterns

- Do not treat `secondary` and `outline` as visually distinct — pick one consistently per call site rather than mixing them expecting a different look; they render the same.
- Do not add custom `focus:` ring classes inline per call site to "fix" the missing focus style — if focus styling needs to change, it belongs in `btnBase` in the canonical file, not patched ad hoc at each usage (out of scope for this SPA per the "no source edits" constraint of this doc, but worth flagging for any future change request).
- Do not use raw stock Tailwind color utilities (e.g. `bg-indigo-600`, `bg-emerald-500`) on a `Button` to invent a 6th "success"/"info" variant — the palette is deliberately restricted to ink/white/gray plus the `danger` red; new semantic colors belong in `Badge`/`StagePill`'s existing triads, not a bespoke button skin.
- Do not import `Button` from the legacy `src/components/ui/index.tsx` — that is a superseded 521-line subset; the canonical import is always `src/shared/components/ui/index.tsx` (or the `@/shared/components/ui` barrel).
- Do not wrap `Button` in an additional `motion.div`/`motion.button` for press feedback — the `active:scale-[0.985]` CSS behavior is already baked into `btnBase`; layering Framer Motion press animations on top would double the effect and diverge from every other `Button` in the app.
- Do not rely on `size="lg"` or `block` as "battle-tested" — they are defined and typed but have zero observed real-world usage in `src/features`; verify visually before shipping a new `lg` or full-width button since the pattern is unexercised.
