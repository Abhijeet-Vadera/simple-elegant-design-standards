# Create Idea Screen

## 1. Purpose & Access

One file — `src/features/ideas/container/CreateIdeaScreen.tsx` — exports **three** things and serves **two routes**:

| Export | Route | `routes.config.ts` access | Sidebar parent |
|---|---|---|---|
| `CreateIdeaScreen` | `/ideas/new` | `["manager", "admin", "management"]` | `ideas` |
| `SubmitBehalfScreen` | `/ideas/submit-behalf` | `["manager", "admin"]` | `ideas` |
| `CreateForm` (internal, not routed directly) | — | — | — |

Both routed components are thin wrappers: they render `<Shell>` with route-specific breadcrumbs (`Ideas Board → New idea` vs. `Ideas Board → Submit on behalf`) and `showSearch={false}`, then delegate all real work to the shared `CreateForm` component, passing a different `initialFor` prop:

```tsx
export function CreateIdeaScreen() {
  ...
  return (
    <Shell crumbs={[{ label: "Ideas Board", go: () => go("kanban") }, { label: "New idea" }]} showSearch={false}>
      <CreateForm initialFor="me" />
    </Shell>
  );
}

export function SubmitBehalfScreen() {
  ...
  return (
    <Shell crumbs={[{ label: "Ideas Board", go: () => go("kanban") }, { label: "Submit on behalf" }]} showSearch={false}>
      <CreateForm initialFor="others" />
    </Shell>
  );
}
```

`management` role can reach `/ideas/new` (submit for self) but **not** `/ideas/submit-behalf` — only `manager`/`admin` can submit on someone else's behalf. This is enforced entirely at the route-config layer (`access` arrays), not inside the component — the component itself has no role checks.

## 2. How "new idea" vs. "submit on behalf" is distinguished

Not via a route param read at runtime — via the **`initialFor` prop** baked into which export is mounted (`"me"` vs. `"others"`), which seeds a piece of component state:

```tsx
function CreateForm({ initialFor = "me" }: { initialFor?: "me" | "others" }) {
  const [submittingFor, setSubmittingFor] = useState<"me" | "others">(initialFor);
  ...
  const isOthers = submittingFor === "others";
```

Critically, `submittingFor` is **not locked** to the route — it's live component state, changeable at any time via a `Segmented` control in the page header ("Submit for: For Myself / For Someone Else"), regardless of which route loaded the screen. So `/ideas/submit-behalf` opens with the toggle pre-set to "For Someone Else" but a manager/admin can flip it back to "For Myself" without navigating away — and vice versa on `/ideas/new` for management/manager/admin. The route only decides the *initial* state and the breadcrumb label/access gate; the in-page toggle is the actual UX-level mode switch.

Flipping the toggle (`handleSubmittingForChange`) resets `errors`, `selectedEmployeeEmail`, and the entire `identity` object — so stale validation/selection from one mode never leaks into the other.

## 3. Layout

Single-step form (no wizard/stepper) inside a max-width, centered content column:

```
<div style={{ maxWidth: 720, margin: "0 auto" }}>
  Page header (title + subtitle  |  "Submit for" label + Segmented)
  One card:
    ├─ [conditional, animated] Submitter details block — only when isOthers
    │    ├─ section intro (title + subtitle)
    │    ├─ Field > Dropdown: Select Employee (searchable, clearable, async-loaded)
    │    └─ [conditional] 2×2 grid — only when "create_new" selected
    │         Field>Input: Full name   | Field>Input: Work email
    │         Field>Input: Phone       | Field>Dropdown: Department
    ├─ Field > Input: Idea title            (always visible)
    ├─ Field > Textarea: Your idea in detail (always visible, minHeight 120)
    └─ Field > Textarea: What problem does it solve? (always visible, minHeight 100)
  Footer (Cancel ghost button ←→ Submit primary button)
</div>
```

No multi-step/wizard pattern — it is one scrollable card. The only structural branching is: (a) show/hide the "Submitter details" section based on `isOthers`, and (b) inside that, show/hide the 2×2 identity grid based on whether the employee dropdown resolved to `"create_new"` vs. an existing employee (existing employee auto-fills `identity` read-only-in-effect, since no inputs render for that case).

The conditional submitter section is wrapped in `framer-motion`'s `AnimatePresence`/`motion.div` with a height+opacity expand/collapse (`duration: 0.2, ease: "easeInOut"`) — the only animation on the screen.

## 4. Hierarchy

1. **Page header** — `h1` "New idea" (22px/600) is the top of the visual hierarchy, paired with a muted subtitle directly under it.
2. **Mode toggle** — sits at the same header row, right-aligned, with a small label ("Submit for") to its left — visually secondary to the h1 but primary in terms of controlling the form's shape.
3. **Card** — single white bordered card holds the entire form; no internal card header, just direct padding.
4. **Submitter details sub-header** (13.5px/600 "Submitter details" + 12.5px gray subtitle) — a second, smaller heading level introduced only in "others" mode, demarcated from the idea fields below it by a `1px solid #F3F4F6` divider.
5. **Field labels** (12.5px/500, per `Field` component) are the smallest heading tier, one per input.
6. **Footer actions** — Cancel (ghost, ties for lowest visual weight) vs. Submit (primary/solid, highest-contrast actionable element on the page).

## 5. Spacing

All inline `style` objects (px), consistent with this app's convention of no Tailwind on this screen:

| Region | Property | Value |
|---|---|---|
| Root container | `maxWidth` | `720px`, centered |
| Header | `marginBottom` | `24px` |
| Header row | `gap` (label↔Segmented) | `10px` |
| Card | `borderRadius` | `12px` |
| Card body | `padding` | `30px 34px` |
| Card body | `gap` (between Fields) | `22px` |
| Submitter block | `gap` (internal) | `20px` |
| Submitter block | `paddingBottom` / `marginBottom` (before divider) | `28px` / `6px` |
| Identity 2×2 grid | `gap` | `18px`, `marginTop: 10px` |
| Footer | `padding` | `16px 22px` |

These numbers are close to but not identical with `12_DESIGN_TOKENS/spacing.json`'s documented `cardBodyPaddingLoose: "18px 20px"` and `pageHeaderMarginBottom: "28px"` — this screen runs slightly looser (30/34 padding, 24 header margin) than the catalog's "loose" reference values, worth flagging as screen-specific drift rather than a token violation.

## 6. Typography

Hardcoded inline (no shared typography token import), matching values in `12_DESIGN_TOKENS/typography.json` conventions used elsewhere in the catalog:

| Element | Size | Weight | Color | Notes |
|---|---|---|---|---|
| `h1` page title | 22px | 600 | `#0A0A0A` | `letterSpacing: -0.02em` |
| Page subtitle | 13px | 400 | `#6B7280` | |
| "Submit for" label | 12.5px | 500 | `#6B7280` | |
| "Submitter details" sub-heading | 13.5px | 600 | `#0A0A0A` | |
| Sub-heading subtitle | 12.5px | 400 | `#6B7280` | |
| `Field` labels | 12.5px | 500 | `#0A0A0A` | via `Field`, not inline here |

## 7. Components used

- **`Shell`** (`@/shared/components/layout/Shell`) — page chrome, breadcrumbs, `showSearch={false}` (this is a create/action screen, not a browse screen).
- **`Segmented`** (`@/shared/components/ui`) — the "For Myself / For Someone Else" mode toggle; default `size="md"`. See `13_COMPONENT_CATALOG/segmented.md` — this screen is literally cited there as the canonical usage example.
- **`Field`** (`@/shared/components/ui`) — wraps every input (`label`, `required`, `error` string). See `13_COMPONENT_CATALOG/field.md`, which also cites this file's `identity.name` Field as its canonical composition example.
- **`Input`** (`@/shared/components/ui`) — full name, work email (`type="email"`), phone (`type="tel"`), idea title.
- **`Textarea`** (`@/shared/components/ui`) — idea description (`minHeight: 120`) and problem statement (`minHeight: 100`).
- **`Dropdown`** (`@/shared/components/ui/Dropdown`, react-select wrapper) — used twice: (1) Select Employee — `isSearchable`, `isClearable`, `isLoading`/`isDisabled` while employees fetch, options built from live API data plus a synthetic `"create_new"` sentinel option; (2) Department — `isClearable`, options from `useDepartmentsList()`.
- **`Button`** (`@/shared/components/ui`) — `variant="ghost"` for Cancel, `variant="primary"` for Submit.
- **`Spinner`** (`@/shared/components/ui`) — swapped in for the Submit button's label while `submitting` is true (`<Spinner light />`), not a separate overlay.
- **`AnimatePresence` / `motion.div`** (framer-motion) — expand/collapse of the submitter-details block only.
- No file upload control anywhere in this screen — idea submission here is text-only (title/description/problem); no attachment/dropzone component is used.

## 8. Interaction / Validation approach

Fully manual, hand-rolled `validate()` — no schema library (Zod/Yup) — matching the project-wide convention documented at the top of this pack. Pattern: build a local `Record<string,string>` of field→message, call `setErrors(e)` once at the end, and return whether it's empty:

```tsx
const validate = (): boolean => {
  const e: Record<string, string> = {};
  if (submittingFor === "others") {
    if (!selectedEmployeeEmail) {
      e.employee = t("idea.validationSelectEmployee", "Please select an employee or create a new one.");
    } else if (selectedEmployeeEmail === "create_new") {
      if (!identity.name.trim()) e.name = t("idea.validationNameRequired", "Name is required.");
      if (!identity.email.trim()) {
        e.email = t("idea.validationEmailRequired", "Email is required.");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)) {
        e.email = t("idea.validationEmailInvalid", "Enter a valid email address.");
      }
      if (!identity.department) e.department = t("idea.validationDepartmentRequired", "Choose a department.");
    }
  }
  if (!idea.title.trim()) {
    e.title = t("idea.validationTitleRequired", "Give your idea a title.");
  } else if (idea.title.trim().length < 5) {
    e.title = t("idea.validationTitleTooShort", "Title must be at least 5 characters.");
  }
  if (!idea.description.trim()) e.description = t("idea.validationDescriptionRequired", "Please describe your idea.");
  if (!idea.problem.trim())
    e.problem = t("idea.validationProblemRequired", "Please describe the problem it solves.");
  setErrors(e);
  return Object.keys(e).length === 0;
};
```

Notes on the pattern:
- **Conditional field set**: the `identity.*` fields (`name`/`email`/`department`) are only validated when `submittingFor === "others"` **and** the employee dropdown is set to `"create_new"` — picking an existing employee from the dropdown skips identity validation entirely (it's assumed already-valid, pulled straight from the API record).
- **Short-circuit-per-field, not whole-form**: each field independently checks required → then format (e.g. title: required, then min-length; email: required, then regex) — first failing rule wins per field, all fields are still evaluated (no early `return false` on first error).
- **Errors are a message-string map**, not booleans — this is what makes it plumb directly into `Field`'s `error` prop (string) while being coerced with `!!` for each child control's own boolean `error` flag (see `Field.md` composition rules).
- **All messages are i18n'd** via `t("idea.validation...", "<english fallback>")` — every validation string has a translation key plus an inline English default, per the codebase's i18n convention.
- **Validation runs only on submit** (`handleSubmit` calls `validate()` first and bails if `false`) — no on-blur or on-change validation; errors clear proactively via `setErrors` clean-up in `handleEmployeeChange`/`handleSubmittingForChange`, not via re-running `validate()`.
- **Post-validate async side effects**: on "create_new" submission for others, `handleSubmit` also performs a live Firebase `createUserWithEmailAndPassword` + `updateProfile` + ID-token fetch + a fire-and-forget backend SSO signup call, with dedicated Firebase-error-code → toast-message mapping (`auth/email-already-in-use`, `auth/invalid-email`, `auth/weak-password`). This is submit-time provisioning logic, not something exposed in the UI itself, but it's the reason the "create new employee" sub-form exists on this screen at all — submitting on behalf of a not-yet-registered person actually creates their account.
- **No file upload** on this screen.
- Errors surface only through `Field`'s standard error row (ink-colored text + `WarningIcon`, not red — per `field.md`); there is no separate top-of-form error summary or toast for per-field validation failures. Toasts (`showToast`) are reserved for submit-level failures (network/API/Firebase errors), not field-level validation.

## 9. Accessibility

- Labels are always paired with controls via `Field` (renders a real `<label>`), so every visible field has a programmatic label — but there's no `aria-describedby` wiring observed between the label/error text and the input itself; the association is visual/DOM-adjacency only, not explicit ARIA.
- `Segmented` (per its catalog entry) has no visible focus ring beyond the browser default `<button>` outline and no `:hover` state — a documented accessibility gap inherited from the shared component, not screen-specific.
- The `Dropdown` (react-select) inherits react-select's own keyboard/ARIA handling (typeahead, arrow-key nav, `aria-selected`) for free — the most accessible control on the screen by virtue of the underlying library.
- No `autoFocus` on the first field; no explicit tab-order overrides (`tabIndex`) anywhere — relies on natural DOM order, which matches visual order.
- Required fields are marked with a `*` (via `Field`'s `required` prop) but there's no `aria-required`/`required` HTML attribute cross-check visible in this file — the asterisk is a purely visual cue backed by the manual `validate()`, not native HTML5 validation.
- Submitting state disables the Submit button (`disabled={submitting}`) and swaps its label for a `Spinner`, preventing double-submits, but the button's accessible name changes to nothing (`Spinner` renders no text) while submitting — a screen-reader user gets a disabled button with no textual status update (no `aria-live` region announcing "submitting").

## 10. Data density

Low-to-medium density, appropriate for a single create form rather than a data table:
- Exactly 3 always-visible fields (title/description/problem) plus, conditionally, 1 dropdown + up to 4 more fields (identity) — never more than ~8 visible inputs at once, and the identity fields only appear behind two nested conditions (`isOthers` AND `create_new`).
- Generous `gap: 22` between top-level Fields keeps the form airy despite the tight `30px 34px` card padding.
- The employee dropdown doubles as a lookup+create affordance (`create_new` sentinel option folded into the same list rather than a separate "add new" link/button), which is a deliberate density reduction — one control does the job of "search existing" + "switch to create mode" instead of two.

## 11. Reusable ideas

- **One container, two routes, prop-seeded initial mode, in-page toggle for the rest** is a clean pattern for "same form, different entry points/defaults" — worth reusing anywhere else in the app that has a "for me" vs. "for someone else" or "quick" vs. "detailed" duality, instead of duplicating the form across two files.
- **Sentinel option (`"create_new"`) inside a normal dropdown's option list** to unlock an inline "add new record" sub-form is a lightweight alternative to a separate modal/drawer for simple entity creation (here: provisioning a new employee) — reusable wherever a picker needs an escape hatch to "the thing I want isn't in this list yet."
- **Error-map validate() + dual-shape error prop (string to `Field`, boolean to control)** is this codebase's standing manual-validation convention; this file is one of the catalog's own cited canonical examples (see `field.md` §8) — treat it as the reference implementation when documenting or replicating form validation elsewhere.
- **Clearing dependent state on mode switch** (`handleSubmittingForChange` resets `errors`, `selectedEmployeeEmail`, `identity`) is a good defensive pattern for any toggle that swaps which fields are "active" — prevents stale errors/values from a hidden field silently blocking or polluting a later submit.
