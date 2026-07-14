# Screen: Change Password

**File**: `src/features/auth/container/ChangePasswordScreen.tsx`

## 1. Purpose & access

Per `src/routes/routes.config.ts` (id `change-password`, `path: "/change-password"`), `access: "public"` — no role gate, reachable while unauthenticated.

Two real entry paths, both grounded in code:

1. **Forced reset.** `src/routes/RouterComponents.tsx:25-26` redirects to `/change-password` whenever `localStorage.getItem("requirePasswordReset") === "true"`. That flag is set in `AuthContext.tsx:166-167` and `hooks/post/useAuthActions.ts:28-29` right after a login response indicates a reset is required, and cleared centrally in `services/httpService.ts:63` as well as locally on successful submit here (line 67).
2. **Direct/self-service visit** to `/change-password` — the screen reads `useAuthStore().authUser` and swaps its subtitle between "Signed in as {{email}}" and a generic "Update your password to continue," so it renders correctly whether or not a session exists.

On success it clears the reset flag, fires a toast (`useUiStore().showToast`), and `navigate("/dashboard")`. There is no cancel/back affordance — the form is a single mandatory path.

## 2. Layout

Full-viewport, single-column, centered auth shell — the same structural family as the Login screen, not the dashboard `Shell`:

- Outer `div`: `minHeight: 100vh`, `background: #0A0A0A`, flex column, `alignItems/justifyContent: center`, `padding: 24`.
- `LanguageSwitcher` pinned `fixed top-5 right-5 z-50` (Tailwind), independent of the centered column.
- A `motion.div` (`fadeUp` variant) capped at `maxWidth: 400`, containing:
  - **Brand row**: 30×30 glyph (`Δ`, `border-radius: 8`, translucent white fill/border) + "InnovationX" wordmark (15px/600), `marginBottom: 40`.
  - **Card**: `background: #161616`, `border: 1px solid #2A2A2A`, `border-radius: 14`, `padding: "32px 28px"` — heading, subtitle, 3 stacked `Field`s (`gap: 18`), primary `Button`.

## 3. Hierarchy

Brand row is a small anchor above the card, not a hierarchy tier. Inside the card: `h2` title (20px/600) → subtitle (13px, dynamic greeting) → three password `Field`s of equal visual weight → one full-width primary `Button`. No secondary CTA competes with the submit action.

## 4. Spacing

All inline px, all on/near the 4px base scale (`12_DESIGN_TOKENS/spacing.json`): outer padding `24`, brand-row `marginBottom: 40`, card padding `32px 28px`, heading `margin: "0 0 6px"`, subtitle `margin: "0 0 28px"`, field stack `gap: 18`, button `marginTop: 4`.

## 5. Typography

- Card title: `20px / 600 / letter-spacing -0.02em` — a **bespoke** heading size. It matches neither `pageTitle` (30px) nor `sectionCardTitle` (13.5px) in `12_DESIGN_TOKENS/typography.json`; this is a screen-specific one-off, not a documented scale step.
- Subtitle: `13px / 400`, `rgba(255,255,255,0.45)`.
- `Field` labels come from the shared component at their normal `12.5px/500` size but inherit `Field`'s **hardcoded `#0A0A0A` ink color** — see Accessibility below.
- No JetBrains Mono usage anywhere on this screen (no IDs/counts/eyebrows needed) — consistent with `monoNeverForProse`.

## 6. Components used

- `LanguageSwitcher` (`@/shared/components/LanguageSwitcher`) — light-surface-styled (`bg-card`, `text-gray-700`), pinned on a black page.
- `Field` × 3, `Input` × 3 (`@/shared/components/ui`). Each `Input` gets an inline `style` override forcing a dark look (`background: #1A1A1A`, `borderColor: error ? "#EF4444" : "#2A2A2A"`, `color: "#fff"`) on top of `Input`'s actual default (white bg, `#0A0A0A` text, per `index.tsx:363-374`) — a per-instance dark override, not a component variant.
- `Button` (`variant="primary"`), stretched via inline `style={{ width: "100%" }}` rather than the component's own `block` prop (`ButtonProps.block`) — the exact "unexercised `block`" gap already flagged in `13_COMPONENT_CATALOG/button.md` §7.
- `Spinner` (`light` prop) swapped in for the button label while `submitting`, matching the canonical loading pattern documented for `DeleteModal` in `button.md` §8.
- `fadeUp` from the **canonical** `@/shared/lib/animations` (not the legacy `src/lib/animations.ts`) — correct per Design Constitution rule 43.

## 7. Interaction

- Local `validate()` (current required; new ≥ 8 chars; confirm === new) populates an `errors` map, passed as the message `string` to each `Field.error` and coerced (`!!errors.x`) to each `Input.error` — the canonical two-shape contract described in `13_COMPONENT_CATALOG/field.md`.
- Submit does a **raw `fetch`** to `${API_BASE}/auth/change-password` with a bearer token pulled directly from `localStorage.getItem("auth_token")`, bypassing the shared `httpService.ts` client used elsewhere.
- Any request failure is written into `errors.current` unconditionally (i.e. shown under "Current password" regardless of actual cause) — a minor but real UX inconsistency, not per-field-accurate error mapping.
- Success clears `requirePasswordReset`, shows a toast, navigates to `/dashboard`.

## 8. Accessibility

- Three real `type="password"` inputs with associated `<label>`s via `Field`.
- **Contrast bug, grounded in source**: `Field`'s label and error text are hardcoded to `#0A0A0A` with no dark-mode branch (`13_COMPONENT_CATALOG/field.md` §4-5). This screen overrides the child `Input`'s style but never `Field`'s own label/error styling, so "Current password" / "New password" / "Confirm new password" labels render as near-black text on the `#161616` card — effective contrast ≈1:1, i.e. functionally invisible. This directly collides with Design Constitution rules 9-10 ("dark mode does not exist," the dark triad is sidebar-only structural color, never expected to host light-only components without override).
- `LanguageSwitcher` is likewise a light-styled component pinned to this dark page with no override, same root cause.
- No `aria-live` region for the generic top-of-form error or the toast.

## 9. Data density

None — a single 3-field form, no lists/tables/counts.

## 10. Reusable ideas

1. The brand-row-over-card centered auth shell is a clean, distinct "public/pre-auth chrome" pattern worth formalizing separately from the dashboard `Shell` if more public screens are added.
2. The manual per-`Input` dark override is fragile and is the direct cause of the `Field` contrast bug; a proper `Input`/`Field` "inverted" mode (or fixing the root label/error color) would remove the need to hand-roll this on every dark screen.
3. `Button`'s `block` prop is a direct fit here instead of the ad hoc `width: "100%"` inline style.
