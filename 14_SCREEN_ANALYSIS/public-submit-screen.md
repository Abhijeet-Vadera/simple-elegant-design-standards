# Screen Analysis — Public Idea Submission (`/submit/:slug`)

**File:** `src/features/public/container/PublicSubmitScreen.tsx`
**Styles:** `src/features/public/container/PublicSubmitScreen.module.css` (594 lines, CSS Module)
**Route:** `path: "/submit/:slug"` (`id: "submit"`, `src/routes/routes.config.ts:49-50`), wired through `PublicSubmitWrapper` in `src/routes/AppRouter.tsx:44` and `RouterComponents.tsx:57-58` which reads the `:slug` URL param and passes it straight through as a prop — no auth guard, no `RoleGuard` wrapper.

---

## ⚠️ Design-system boundary — read this first

**This screen does NOT use the internal app's design system.** It is one of exactly two screens in the whole product (this one, plus `PublicBalanceScreen`) that intentionally ship their **own self-contained mini design system** via a co-located CSS Module, because they are the **only public-facing, unauthenticated, QR-code-landing surfaces** in an otherwise role-gated, desktop-only internal admin dashboard.

Concretely, this means:

- **No Tailwind utility classes for layout/visual styling** (a single Tailwind-utility exception exists — `className="fixed top-5 right-5 z-50"` on the `LanguageSwitcher` wrapper, `PublicSubmitScreen.tsx:345` — everything else routes through `styles.*` from the module).
- **No imports from `src/shared/components/ui/index.tsx`.** `Button`, `Field`, `Input`, `Badge`, `SectionCard`, `Modal`, etc. — none of the internal primitive library appears here. The only shared import is `LanguageSwitcher` (`src/shared/components/LanguageSwitcher`) and the local `Field` helper is a **screen-local re-implementation** (`PublicSubmitScreen.tsx:63-81`), not the canonical `Field`.
- **Its own control geometry, independent of `.ai-design-dna/12_DESIGN_TOKENS`:** inputs are 48px tall / 12px radius / 1.5px `#e5e7eb` border (vs. the internal app's 38-40px inputs); the primary button is 52px tall / 14px radius / `#0a0a0a` fill (vs. internal `Button`'s 38-44px / 8px radius); a pill secondary button at `border-radius: 999px` has no internal-app equivalent at all (internal `Button` variants never use a full pill).
- **Its own animation primitive:** a raw CSS `@keyframes spin` (`PublicSubmitScreen.module.css:1-3`, `0.8s linear infinite` via `.spinIcon`), not the shared Framer Motion signature ease-out-expo curve `[0.16, 1, 0.3, 1]` documented for the internal app — though the screen *does* use Framer Motion for step transitions (see Interaction below), so motion tooling is shared but the timing/easing values here are locally authored, not imported from `src/shared/lib/animations.ts`.

**Directive for any AI extending this codebase:**
- If extending the **internal admin app** (dashboards, workflow, ideas list, etc.) — never copy patterns from this file: not the 48px/52px control heights, not the pill button, not the local `Field` component, not the raw `@keyframes spin`. Use `src/shared/components/ui/index.tsx` and `.ai-design-dna/12_DESIGN_TOKENS` instead.
- If extending **this public flow or `PublicBalanceScreen`** — stay inside `PublicSubmitScreen.module.css`'s existing scale (48px inputs / 52px primary button / 12-14px radii / pill secondary) rather than reaching for internal-app tokens (e.g. do not import `Button` from the shared UI library here just because it exists elsewhere in the repo).
- The two systems intentionally diverge because the audience diverges: authenticated desktop power-users in the main app vs. anonymous, likely-mobile, one-shot visitors scanning a QR code here. Do not attempt to reconcile them into one shared token set.

---

## 1. Purpose & access

- **Purpose:** Lets an anonymous employee (no account) submit an innovation idea to their organization, identified only by a `slug` URL segment resolved server-side to an `Organization` (`fetchOrgDetails`, `PublicSubmitScreen.tsx:105-116`, hitting `GET /tenants/slug/:slug`).
- **Access:** Fully public/unauthenticated route. The component itself performs an *implicit* signup: on submit it silently creates a Firebase user with a random 16-char generated password (`generateRandomPassword`, lines 9-18) via `createUserWithEmailAndPassword`, then calls a backend SSO endpoint (`/auth/employee-sso-signup`) to mint an app session token — falling back to `/auth/sso-login` if the Firebase email already exists (lines 245-274). The visitor never sees a password field or a "create account" framing; identity creation is a side-effect of "submit idea," not a first-class step.
- **Entry point:** QR code (per product context) printed/displayed by an organization, encoding `https://<host>/submit/<org-slug>`. There is no navigation *into* this screen from inside the authenticated app shell — it is a dead-end landing page reached only externally.
- **Confidentiality framing is explicit in copy:** step 1 subtitle tells the visitor "your identity is kept confidential from other employees" (line ~391) — an intentional trust-building message specific to the anonymous-submission context.

## 2. Layout

- Single-column, mobile-first, vertically-stacked flow capped at `max-width: 480px` and centered (`.stepContent`, CSS lines 79-91) — this is the narrowest primary content column anywhere in the product (internal app pages run full desktop width inside a 248px-sidebar shell; this screen assumes a phone screen scanning a QR code).
- Structural stack, top to bottom: fixed-position `LanguageSwitcher` (top-right, `fixed top-5 right-5`) → two large blurred/soft background circles (`.bgShape1`/`.bgShape2`, absolutely positioned, `rgba(10,10,10,0.02-0.03)`, purely decorative, `pointer-events: none`) → a small logo bar (`Δ` glyph in a 32px rounded-square + "Brand" wordmark) → the animated step content → a progress-dot row pinned to the bottom (hidden on the success step).
- No sidebar, no header/toolbar, no table, no card grid — a single vertical "form card" experience, closer to a native mobile onboarding flow than a dashboard screen.
- `.wrapper` is `min-height: 100dvh` with `overflow: hidden` — the whole screen is designed to fit one viewport without page-level scroll (only the step content area scrolls internally if content overflows, since `.stepContent` itself doesn't set `overflow: auto` but the flex column will naturally grow).

## 3. Hierarchy

- Two-tier heading system per step: a tiny uppercase mono "eyebrow" step label (`.stepLabel` — 11px, `JetBrains Mono`, `letter-spacing: 0.14em`, `#9ca3af`, e.g. "Step 1 of 2") sits above a bold 24px title (`.stepTitle` — 700 weight, `-0.025em` tracking, ink `#0a0a0a`), which is itself followed by a lighter 14px gray subtitle (`.stepSubtitle` — `#6b7280`, `line-height: 1.55`). This exact eyebrow→title→subtitle triad repeats for every step and mirrors the internal app's "type carries hierarchy" philosophy even though the concrete component is different.
- Within the eyebrow/title/subtitle triad, a single `<strong className={styles.highlight}>` (just re-inks text to `#0a0a0a`, no weight or color change beyond that) is used inline to call out the organization name and, later, the visitor's first name — a minimal, typographic-only emphasis technique, no color accent.
- The primary CTA button is always the single highest-affordance element per step (full-width, solid black, positioned last) — never more than one primary action visible per step.
- On the success step, hierarchy runs: animated checkmark icon (highest visual weight, largest, colored ink-black circle) → success title → confirmation message → a bordered "submitted to" info card → a clearly de-emphasized secondary path ("Have another idea?") below a labeled divider, making the primary success message dominant and the "do it again" option deliberately secondary.

## 4. Spacing

- Outer page padding: `20px 24px 0` for the logo bar, `0 24px 32px` for the step content — a consistent `24px` horizontal gutter throughout, tighter than the internal app's page-level padding conventions.
- Step header bottom margin: `28px` (step 1) / `24px` (step 2, via `.stepHeader2`) before the field stack begins.
- Field-to-field vertical rhythm: `18px` gap in `.formFields` (flex column, `gap: 18px`); the two-column phone/department row uses a tighter `14px` gap (`.twoCol`, CSS grid `1fr 1fr`).
- Inside each field: label-to-control gap is `7px` (`.fieldWrapper`, flex column `gap: 7px`) — noticeably tighter than the ≥8-10px label gaps typical of the internal app's `Field`.
- Primary button sits `28px` below the field stack (`.primaryBtn { margin-top: 28px }`).
- Success screen uses much larger jumps for its low-density, celebratory layout: `28px` icon-to-title gap, `40px` before the org card, `40px` again before the "another idea" block — spacing itself signals "this is the end of the flow, slow down."

## 5. Typography

- Base font is inherited (`font-family: inherit` throughout inputs/buttons — actual sans stack set upstream, consistent with the app's Inter default).
- `JetBrains Mono` is reserved for exactly the same "machine-ish data" role as the internal app's design language: the step-label eyebrow ("STEP 1 OF 2") and the success screen's "SUBMITTED TO" eyebrow (`.successOrgLabel`) — both 11px, uppercase, wide-tracked, gray `#9ca3af`. This is the one typographic thread that *is* shared conceptually with the internal design system, even though the CSS lives in its own module.
- Scale used: 24-26px bold titles (step titles, success title) → 15.5px semibold button label → 15px body/input text → 14px subtitle/secondary-button text → 13.5px field label → 12-13px helper/error/divider text → 11px mono eyebrow. This is a slightly larger overall type scale than the internal app's denser 11-13.5px-dominant chrome, appropriate for a low-density, single-task mobile flow.
- Negative letter-spacing (`-0.01em` to `-0.025em`) on titles/buttons/highlight text mirrors the internal app's tight-tracking-for-emphasis convention; positive wide tracking (`0.05em`-`0.14em`) reserved for uppercase mono/label text — same directional logic as the internal design system, independently re-implemented here.

## 6. Components used

All screen-local, defined either inline in this file or as CSS classes in the module — none imported from `src/shared/components/ui`:

- **`Field`** (local functional component, lines 63-81) — label + optional red `*` required-marker + children; the *only* structural form-field wrapper, unrelated to the shared library's `Field`.
- **Text `input` / `textarea`** — styled via `.input`/`.textarea` classes (48px height inputs, unconstrained-height textareas at `rows={5}`/`rows={4}`), with `.inputError`/`.textareaError` swapping border color to `#ef4444` on validation failure.
- **Department dropdown primitive** — a full custom combobox implementation is present in the CSS (`.dropdownWrapper`, `.dropdownTrigger`, `.dropdownPanel` portaled with `position: fixed` + `z-index: 99999`, `.dropdownSearch` with an inner search input, `.dropdownList`/`.dropdownOption`/`.dropdownOptionSelected`) — classes exist in the module (lines 456-593) though the JSX visible in this read renders `department` as a plain text `<input>` (line 457-466); the dropdown markup is either used by a sibling/variant of this component not shown here or is currently dead CSS — flagged as observed, not resolved.
- **Primary button** (`.primaryBtn`) — full-width, 52px, 14px radius, black fill, swaps its child content between a label+trailing-chevron-SVG idle state and a spinning-icon+"Submitting…" loading state (using the shared `.spinIcon` class + inline `<svg>` with a partial-circle path, not a dedicated `Spinner` component).
- **Secondary "pill" button** (`.secondaryBtn`) — 999px radius, white bg, gray border, subtle `translateY(-2px)` lift + shadow growth on hover, plus a `90deg` icon rotation on hover (`.secondaryBtn:hover svg`) — used once, for "Submit another idea" on the success screen.
- **Back button** (`.backBtn`) — bare-transparent text+chevron link style, gray `#9ca3af`, used to return from step 2 to step 1.
- **Progress dots** (`.progressDots`/`.dot`/`.dotActive`) — two dots, active one animated to `24px` wide via inline `style` (not a CSS class) while inactive stays `8px`, both `999px` radius — a manual step-indicator, not a shared `Stepper`/`Segmented` component.
- **`LanguageSwitcher`** — the one genuinely shared import (`@/shared/components/LanguageSwitcher`), fixed top-right, positioned with a raw Tailwind utility class rather than the module.
- **Inline `<svg>` icons** — every icon (chevron-right, chevron-left/back, plus/submit-another, checkmark) is hand-written inline SVG with `stroke="currentColor"`/`strokeWidth="2.5"`, not sourced from a shared icon set.

## 7. Interaction (form steps, flow)

- **Three-step linear wizard** driven by a single `step: "user" | "idea" | "success"` state machine (no route changes between steps — all client-side).
- **Step 1 ("user"):** name (required) + work email (required, regex-validated) + optional two-column phone/department row. "Continue" triggers `validateUser()` (lines 145-155) which populates an `errors` record; only advances (`advance("idea")`) if empty.
- **Step 2 ("idea"):** idea title (required, ≥5 chars) + description textarea (required) + problem textarea (required), validated by `validateIdea()` (157-181). A `back` handler returns to step 1 without losing entered data (state is not reset, only the visible step changes). Submission is async (`handleSubmit`, 187-317): creates/logs-in the Firebase user, exchanges for a backend token, then POSTs the idea to `/ideas`; any failure surfaces in a dedicated `.submitErrorBanner` (light-red background, `#dc2626` text) rather than a toast — errors are inline in the flow, not a global notification.
- **Step transition animation:** Framer Motion `AnimatePresence mode="wait"` with a horizontal slide (`x: ±100%`) + fade, spring transition `{ stiffness: 380, damping: 36 }` (lines 51-57) — direction-aware (`custom={direction}`), so forward = slide-from-right, back = slide-from-left, exactly like a native mobile screen-stack transition.
- **Step 3 ("success"):** non-interactive except for a "Submit another idea" reset button (`resetForm`, lines 136-143, clears all state and returns to step 1 with `direction: -1`). Success step choreographs a staggered reveal: bouncy spring-scaled checkmark icon (delay 0.1s) → title fade/slide-up (delay 0.22s) → message (0.3s) → org card fade-in (0.5s) → "another idea" block slide-up (0.7s) — a deliberately slower, celebratory sequence versus the snappy step-to-step transitions.
- **Live error clearing:** every field's `onChange` handler (`u()`/`id()` helpers, lines 319-341) clears that field's specific error the moment the user starts retyping, rather than waiting for re-validation on next submit attempt.
- **Loading/disabled state:** submit button is `disabled` during `submitting`, swaps to a spinning icon + "Submitting…" label — no full-page loading overlay, the button itself communicates busy state.

## 8. Accessibility

- Labels are real `<label>` elements (via the local `Field` component) associated only visually, not via `htmlFor`/`id` pairing — no explicit `id`/`htmlFor` wiring was found linking `<label>` to its `<input>`, meaning label-click-to-focus and screen-reader label association rely on implicit DOM adjacency rather than explicit association. This is a real gap, documented as observed.
- Required fields are marked with a red asterisk (`.fieldRequired`) but no `aria-required` or `required` HTML attribute is set on the underlying `<input>`/`<textarea>` — required-ness is communicated visually only.
- Error messages (`.errorMsg`) render as plain adjacent `<span>` text with no `aria-describedby` linking them back to the offending input and no `role="alert"`/`aria-live` region — a screen-reader user would not be automatically notified of a new validation error.
- Icons are decorative inline SVGs with no `aria-hidden` or `<title>`, but since every icon is always paired with visible text (e.g. "Continue" + chevron, "Back" + chevron) this is a low-severity gap.
- Color contrast: ink-on-white and gray-`#6b7280`-on-white body text both meet WCAG AA at their respective sizes; the `#9ca3af` mono eyebrow labels are decorative/secondary and smaller, borderline for AA at 11px but consistent with the same tier of text in the internal app.
- No explicit `prefers-reduced-motion` handling in this screen (unlike the documented internal-app-wide "motion skipped entirely under prefers-reduced-motion" policy) — the Framer Motion slide/spring transitions here would run regardless of the user's OS-level reduced-motion preference. Flagged as a divergence from the internal app's stated motion policy.
- Focus states rely on the browser default plus an explicit border-color change to `#0a0a0a` on `:focus` for inputs (`.input:focus`) — no visible focus ring/box-shadow (contrast with `PublicBalanceScreen`'s inline-styled inputs, which do add a `0 0 0 3px rgba(10,10,10,0.08)` focus ring).

## 9. Data density

- **Lowest density surface in the entire product.** One task, broken into two short steps of 2-6 fields each, one field group visible at a time, generous whitespace, large touch targets (48-52px controls) — optimized for a thumb on a phone screen immediately after scanning a QR code, the opposite end of the density spectrum from the "dense, desktop-first" internal app described in `.ai-design-dna/00_PROJECT_IDENTITY.md`.
- No tables, no lists, no counts/badges, no multi-entity relationships surfaced — the only "data" shown back to the user is their own org name and, on success, a static confirmation card.

## 10. Reusable ideas

Patterns here that are genuinely well-executed and could inform *either* system (while keeping the two systems separate):

- **Direction-aware slide transition with a single `slideVariants` + `custom={direction}` pattern** (lines 51-57, 127-134) is a clean, small, reusable Framer Motion recipe for any linear wizard — worth replicating verbatim (same variant shape, same spring config) in any other multi-step flow, public or internal, rather than re-deriving it.
- **Inline error-clear-on-edit** (`u()`/`id()` field helpers clearing their own error key on change) is a nice micro-interaction that the internal app's forms could adopt if they don't already.
- **Local, single-purpose `Field` wrapper** — three lines of JSX, zero dependencies — is a reasonable "just enough abstraction" pattern for a self-contained screen that deliberately opts out of a shared component library; not a candidate to promote into the shared library itself (it lacks the accessibility wiring and error-message integration the canonical `Field` likely has), but a fine local pattern to leave as-is.
- **Do not port:** the 48px/52px control scale, the pill secondary button, the raw `@keyframes spin`, or the department-dropdown CSS (lines 456-593) into the internal app — and equally, do not pull the internal `Button`/`Field`/focus-ring tokens into this file. Keep the boundary intact.
