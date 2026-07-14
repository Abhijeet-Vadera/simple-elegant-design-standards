# Field

## 1. Purpose

`Field` is the label/hint/error wrapper for a single form control. It renders an optional label (with an optional required-marker), the control itself (`children`), and then either an error message or a hint — never both. It owns none of the input styling itself; it is pure layout/typography scaffolding around whatever control is passed as `children`.

## 2. File & exports

- **File**: `src/shared/components/ui/index.tsx` (lines 301–361)
- **Export**: `export function Field(...)`
- **Barrel**: re-exported from `@/shared/components/ui`

Exact TS prop signature (inline, not a named interface):

```ts
function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}): JSX.Element
```

Note the type asymmetry: `Field.error` is a `string` (the message to display), while `Input`/`Textarea`/`Select`/`ReactSelect`'s own `error` prop is a `boolean` (just a styling flag). Callers pass the same truthy value twice in two different shapes — see Composition rules.

## 3. Variants

`Field` has no variant prop. Its only conditional branches are presence checks:

- `label` present → renders the `<label>` block (with `required` marker `*` appended when `required` is true).
- `error` present → renders the error row (`WarningIcon` + message) and **suppresses** the hint row even if `hint` is also passed (`{hint && !error && (...)}`).
- `hint` present and `error` absent → renders the hint row.

There is no icon-prefixed or size variant on `Field` itself — those live on the child control (see `input.md`).

## 4. Spacing

All values are inline `style` object literals (px), not Tailwind classes:

| Element | Property | Value |
|---|---|---|
| label | `fontSize` | `12.5px` |
| label | `fontWeight` | `500` |
| label | `color` | `#0A0A0A` |
| label | `marginBottom` | `7px` |
| label | `letterSpacing` | `-0.005em` |
| required marker | `color` | `#9CA3AF` |
| error row | `fontSize` | `12px` |
| error row | `color` | `#0A0A0A` |
| error row | `marginTop` | `7px` |
| error row | `gap` (icon↔text) | `5px` |
| error row | `fontWeight` | `500` |
| hint row | `fontSize` | `12px` |
| hint row | `color` | `#9CA3AF` |
| hint row | `marginTop` | `7px` |
| hint row | `lineHeight` | `1.45` |

These match `.ai-design-dna/02_DESIGN_DNA.json` → `typography.scale.label` (`size 12.5px, weight 500, letterSpacing -0.005em`) and `typography.scale.caption` (`size 12px, weight 400` — note the error row overrides caption's weight to `500`).

There is no outer margin/padding on the `Field` wrapper `<div>` itself — spacing between stacked `Field`s is the caller's responsibility (observed as a `gap` on the parent flex/grid container, e.g. `gap: 18` in `CreateIdeaScreen.tsx`).

## 5. States

`Field` has no interactive state of its own (no focus/hover) — it is a static layout shell. The only state-like behavior is content-driven:

- **Default**: label + children, no hint/error rows.
- **Has hint, no error**: label + children + gray hint row (`#9CA3AF`).
- **Has error**: label + children + black/ink error row (`#0A0A0A`, **not red** — see the design-DNA note below) with a `WarningIcon` (13×13). Hint is hidden even if also provided.

**Important, grounded in source**: the error text color is `#0A0A0A` (ink), the same as body text — this codebase does NOT use `#DC2626`/red for the `Field` error message. Red (`#DC2626`, tagged `semantic.errorText` in `02_DESIGN_DNA.json`) is reserved for the danger `Button` variant and other error surfaces elsewhere, not for `Field`'s inline error row. Do not "fix" this to red — it is the actual, intentional runtime style.

## 6. Motion

None. `Field` has no `transition` property anywhere in its style objects and is not wrapped in `motion.*` — it is a plain, non-animated `<div>`. (Contrast with `Input`/`Textarea`/`Select`, whose border/shadow transitions are documented in `input.md`.)

## 7. Usage rules

- `Field` always wraps exactly one labeled control as `children` — observed children in the codebase are `Input`, `Textarea`, `Dropdown` (the react-select-backed dropdown, see `select.md`), and in one case (`MigrationModal.tsx:55`) a hand-built list of buttons (i.e. `children` is not restricted to the four primitive form controls — any control can be labeled by `Field`).
- Pass `required` to render the `*` marker instead of appending `"*"` manually inside `label`.
- Pass `error` as the **validation message string** (from the hand-rolled `validate()` result), and separately pass the boolean form (`!!errors.<field>`) to the child control's own `error` prop — both must be kept in sync by the caller (see composition example below). `Field` does not read the child's props or vice versa; there is no shared context.
- Use `hint` for static helper copy that should disappear once an error appears (this is automatic — do not manually hide the hint yourself).

## 8. Composition rules (real usage)

`src/features/ideas/container/CreateIdeaScreen.tsx:439-448`:
```tsx
<Field label={t("idea.fullName", "Full name")} required error={errors.name}>
  <Input
    value={identity.name}
    onChange={(e) => setId("name", e.target.value)}
    placeholder={t("idea.fullNamePlaceholder", "e.g. Aisha Patel")}
    error={!!errors.name}
  />
</Field>
```
This is the canonical pattern: `errors.name` (a `string | undefined`) is passed as-is to `Field.error` (renders the message), and coerced with `!!` to `Input.error` (renders the boolean border style).

`src/features/workflow/components/SectionFormModal.tsx:85-92`:
```tsx
<Field label={t("workflow.sectionNameLabel", "Section name")} required>
  <Input
    value={name}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
    placeholder={t("workflow.sectionNamePlaceholder", "e.g. Discovery & Screening")}
  />
</Field>
```
Shows the no-error-yet-required case — `error` omitted entirely rather than passed as `undefined` explicitly.

`src/features/workflow/components/StageFormModal.tsx:230-243`:
```tsx
<Field label={t("workflow.descriptionLabel", "Description")}>
  <Textarea
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    placeholder={t("workflow.descriptionPlaceholder", "Describe the purpose of this stage…")}
    style={{ minHeight: 72 }}
  />
</Field>

<Field
  label={t("workflow.progressionPointsLabel", "Progression points")}
  hint={t("workflow.progressionPointsHint", "Awarded to employees when their idea reaches this stage")}
>
```
Shows `hint` usage on a `Field` with no error state.

`src/features/workflow/components/MigrationModal.tsx:55`:
```tsx
<Field label={t("workflow.moveIdeasToLabel", "Move ideas to")}>
  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
    {targets.map((s) => ( <button ...>...</button> ))}
  </div>
</Field>
```
Confirms `Field` is not limited to the primitive `Input`/`Textarea`/`Select` — it labels arbitrary custom controls too.

## 9. Anti-patterns

- Do not skip `Field` and hand-roll a label with raw markup for a form control that has validation — `src/features/ideas/components/FinancialImpactCard.tsx:85-101` does exactly this (`<p className="text-[12.5px] text-text-2 mb-[7px]">...</p>` followed by a bare `Input`) and loses the standardized error/hint slot. Treat this as an existing inconsistency to flag, not a pattern to replicate.
- Do not pass the error message string to a child control's `error` prop (it expects `boolean`) or pass a boolean to `Field.error` (it expects the message `string`) — the two props are intentionally different shapes on the same underlying validation value.
- Do not build a second "error message row" outside `Field` (e.g., a manually styled red `<p>` under an `Input`) — funnel all validation display through `Field`'s `error` slot so the ink-colored, `WarningIcon`-prefixed treatment stays consistent.
- Do not pass both `hint` and `error` expecting both to show — `hint` is always suppressed while `error` is truthy; there is no way to show both simultaneously without editing the component.
