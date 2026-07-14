# Join Screen

**File:** `src/features/auth/container/JoinScreen.tsx`
**Route:** `id: "join"`, `path: "/join/:code?"`, `access: "public"` (`src/routes/routes.config.ts:42-47`) — no `meta.description`, no `nav` entry.

## 1. Purpose & Access

Self-service account creation for invited employees, entered via a tokenized link (`/join/:code`). `access: "public"` — must work with zero session, before any auth exists, since its whole job is to *create* one. The screen has three exclusive states driven by invitation-code validation, not just one static layout: `loading` → `invalid` → `ready`.

## 2. Layout

### State 1 — `loading`
Full-bleed single dark panel (`min-h-screen bg-[#0A0A0A] flex items-center justify-center`), centered `Spinner` (`light`, `size={24}`) + status caption. `LanguageSwitcher` fixed top-right as on every auth screen.

### State 2 — `invalid`
Full-bleed off-white background (`bg-[#F7F7F5]`), a single centered card (`max-w-[400px]`, white, `rounded-[14px]`, `border border-gray-200`, soft shadow `shadow-[0_4px_16px_rgba(10,10,10,0.04)]`): red-tinted icon badge (`XCircleIcon` in a `bg-red-50`/`border-red-300` 52px rounded square) + title + explanatory copy + two side-by-side `Button`s ("Refresh" secondary, "Go to Login" primary). This is effectively an inline empty-state/error-state card, not shared with the catalog's documented empty-state pattern but structurally identical to one (icon badge → title → body → actions).

### State 3 — `ready`
Same two-pane split as `LoginScreen`, but responsive at `lg` instead of `md` (`grid-cols-1 lg:grid-cols-[1.05fr_1fr]`) and with tighter mobile padding (`py-8 px-6 sm:py-12 sm:px-14` vs. login's fixed `p-12 md:p-14`) — this screen was clearly tuned for a narrower breakpoint than `LoginScreen`, an inconsistency worth normalizing if both are meant to share one auth-shell component.

- **Left panel**: brand lockup, then (`my-auto lg:mt-auto`) an invitation-context block: mono/uppercase eyebrow "WORKSPACE INVITATION", headline "Join {{companyName}}", invitation body copy, and a details list (location row with `GlobeIcon`, status row with `CheckCircleIcon`/`WarningIcon` colored green/red by validity) separated by a `border-t border-white/10` rule.
- **Right panel**: the **org card** (see below) sits above the form, then "Create your account" heading, an optional SSO/password mode-tab switcher, then either the SSO provider list or the password-signup form, then a "sign in here" footer link.

### The org-card stagger-reveal (distinctive branded entrance)

This is the block flagged for special attention — a self-contained "the org you're joining" card that assembles itself piece-by-piece on mount, gated by `AnimatePresence` + `mgmt.tenant` (only renders once tenant data resolves):

```tsx
<AnimatePresence>
  {mgmt.tenant && (
    <motion.div variants={orgCardVariants} initial="hidden" animate="show" exit="exit" className="... bg-white border border-gray-200 rounded-[10px] ...">
      <motion.div variants={orgBarVariants} className="absolute left-0 ... w-[3px] rounded-full bg-[#0A0A0A] origin-top" />
      <motion.div variants={orgLogoVariants} className="shrink-0">{/* tenant logo or initial avatar */}</motion.div>
      <motion.div variants={orgTextContainer} className="min-w-0">
        <motion.div variants={orgTextRow}>{companyName}</motion.div>
        <motion.div variants={orgTextRow}>{state, country}</motion.div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

Exact variant definitions, `src/shared/lib/animations.ts:71-96`:

```ts
export const orgCardVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.972, filter: "blur(3px)" },
  show:   { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { ease: [0.16, 1, 0.3, 1], duration: 0.52 } },
  exit:   { opacity: 0, y: -6, scale: 0.99, filter: "blur(2px)", transition: { duration: 0.22 } },
};

export const orgLogoVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show:   { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 480, damping: 22, delay: 0.08 } },
};

export const orgBarVariants: Variants = {
  hidden: { scaleY: 0 },
  show:   { scaleY: 1, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.45, delay: 0.05 } },
};

export const orgTextContainer: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.065, delayChildren: 0.15 } },
};

export const orgTextRow: Variants = {
  hidden: { opacity: 0, x: 14 },
  show:   { opacity: 1, x: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.4 } },
};
```

Reveal sequence, in wall-clock order:
1. **t=0** — outer card (`orgCardVariants`) begins: fade + 14px upward slide + scale from 0.972→1 + a `blur(3px)→0px` defocus, over **0.52s**, custom ease `[0.16, 1, 0.3, 1]`.
2. **t=0.05s** — the 3px left accent bar (`orgBarVariants`) begins a `scaleY: 0→1` grow-down from `origin-top`, over **0.45s**, same ease. Delay `0.05s` staggers it just behind the card's own start.
3. **t=0.08s** — the logo/avatar (`orgLogoVariants`) pops in via a **spring** (`stiffness: 480, damping: 22`, delay `0.08s`) — scale 0.6→1 + fade — a snappier, bouncier feel than the card's smooth ease-out, deliberately giving the logo a bit of "settle" overshoot distinct from everything else in the card.
4. **t=0.15s onward** — the text rows (`orgTextContainer` orchestrates children with `staggerChildren: 0.065s`, `delayChildren: 0.15s`) reveal one at a time: each `orgTextRow` fades in while sliding in from the right (`x: 14→0`) over **0.4s**, ease `[0.16, 1, 0.3, 1]`, each row starting 0.065s after the previous.

Net effect: card materializes-and-defocuses-in first, the accent bar draws down alongside it, the logo springs in with a touch of bounce just after, and the two text lines (company name, then location) slide in from the right in a quick one-two — a fully choreographed four-part entrance rather than a single fade. This entire sequence only plays once, on the transition into `pageState === "ready"` (and would play its `exit` variant — blur+shrink+drift-up over 0.22s — if `mgmt.tenant` ever became falsy again, though in practice that won't happen after initial load).

The surrounding screen content (heading, tabs, form) uses only the plain **`fadeUp`** variant (10px slide + fade, 0.5s, same `[0.16, 1, 0.3, 1]` ease) — identical treatment to `LoginScreen`'s panels. The org card is the one element on this screen (and the whole auth flow) that gets the richer four-part choreography instead of the standard `fadeUp`.

## 3. Hierarchy

1. Brand lockup — identity anchor, present in every state.
2. (ready state) Invitation framing: eyebrow → "Join {{companyName}}" headline → inviter sentence → location/status detail rows — establishes trust and context before asking for any input.
3. **Org card** — highest perceptual weight on the right panel by virtue of its animation alone; it's the first thing the eye tracks when the panel populates.
4. "Create your account" heading + subtitle.
5. Mode switcher (SSO vs. password) — only shown if `hasProviders`; when the invitation has a pre-set email, mode-switching is disabled (`disabled={Boolean(codeDetails?.codeInfo.email)}`), silently locking the user into whichever mode was pre-selected.
6. Primary form content — SSO buttons or password fields, mutually exclusive.
7. Footer "sign in here" link — lowest priority, escape hatch back to `LoginScreen`.

## 4. Spacing

- Right-panel form block spacing scales with breakpoint: org-card `mb-6 sm:mb-7`, heading `mb-1.5`, subtitle `mb-5 sm:mb-6` — a mobile-first density difference from `LoginScreen`, which has no responsive spacing variants at all.
- Org card internal padding: `py-3 sm:py-4 px-4 sm:px-[18px]`, `gap-3 sm:gap-4` between bar/logo/text.
- Mode-switcher tabs: `p-[3px]` outer padding, `gap-[2px]` between tab buttons, `py-2 sm:py-[7px] px-2 sm:px-[14px]` per tab.
- Password-form fields: `flex flex-col gap-4`, with first/last name paired in a `grid grid-cols-1 sm:grid-cols-2 gap-3` row.
- Left-panel detail rows: `flex flex-col gap-3 sm:gap-[18px]`, `pt-5 sm:pt-6` after the `border-t border-white/10` divider.

## 5. Typography

- Left-panel eyebrow: plain `text-[11px] tracking-[0.14em] uppercase text-white/50` (functionally identical to `LoginScreen`'s tagline but not wrapped in `font-mono` here — a small inconsistency; `LoginScreen`'s tagline explicitly sets `font-mono`, `JoinScreen`'s eyebrow does not, so it likely renders in the default Inter sans rather than JetBrains Mono despite matching the `eyebrow` token's other properties).
- Headline: `text-3xl sm:text-4xl leading-[1.15] tracking-[-0.03em] font-semibold` — responsive (30px→36px via Tailwind's `text-3xl`/`text-4xl`), unlike `LoginScreen`'s fixed 38px.
- "Create your account" heading: `text-xl sm:text-[22px]`.
- Detail-row labels use a two-tone treatment: dim label span (`text-white/45`) + bright value (`text-white/80`), status value additionally colored semantically green/red.
- Org card company name: `text-sm font-semibold tracking-[-0.01em]`; location sub-line: `text-xs text-gray-500`.
- Body/caption copy generally: `text-xs sm:text-[13px]` / `text-sm sm:text-[14.5px]`, following the same mobile-first responsive-step pattern absent from `LoginScreen`.

## 6. Components used

- **Spinner** (`@/shared/components/ui`) — loading state, `light size={24}`; also inside SSO/password submit buttons (`light` on primary submit, default on SSO rows).
- **Button** (`@/shared/components/ui`) — used correctly here (unlike `LoginScreen`'s hand-rolled buttons): `variant="primary"` for "Go to Login" / "Create Account", default/secondary for "Refresh".
- **Field** (`@/shared/components/ui`) — wraps every password-mode input (First name, Last name, Work email, Password, Confirm password) with proper label association, unlike `LoginScreen`'s hand-rolled labels.
- **Input** (`@/shared/components/ui`) — the underlying control inside each `Field`.
- **Icons** (`@/shared/components/ui/Icons`): `ProviderIcon`, `GlobeIcon`, `CheckCircleIcon`, `XCircleIcon`, `WarningIcon`, `EyeIcon`, `EyeOffIcon`.
- **LanguageSwitcher** (`@/shared/components/LanguageSwitcher`).
- SSO provider buttons and the mode-switch tabs are hand-rolled raw `<button>`s (same drift-from-`Button` pattern noted in `LoginScreen`), but the *invalid-state* and *password-submit* buttons do correctly use the shared `Button`. So this screen is inconsistent internally — some buttons go through the catalog component, others don't.

## 7. Interaction

- **Invitation resolution** (`useEffect` on mount): calls `getInvitationCode(inviteCode)` from `useAuth()`; response's nested `authProviders` are flattened via a local `flattenProviders()` helper (handles both `{ authProvider: {...} }` and flat shapes from the API). Drives `pageState` to `ready` or `invalid`; a request race is guarded with a `cancelled` flag in the effect's cleanup.
- If the resolved invitation has zero SSO providers, `signupMode` is forced to `"password"` immediately (`if (!details.codeInfo.authProviders?.length) setSignupMode("password")`).
- **SSO signup** (`handleProviderSignup`): maps a provider by `providerId` or (name fallback, lower-cased) to Google/Microsoft/GitHub Firebase providers; after popup sign-in, cross-checks the resulting Firebase user's email against `codeDetails.codeInfo.email` (if the invitation was pinned to a specific email) — mismatch triggers `signOut(auth)` + an `auth.errorInvitationEmailMismatch` error, explicitly undoing the sign-in rather than proceeding with a mismatched identity. On success calls `employeeSsoSignup(inviteCode, idToken)`.
- **Password signup** (`handlePasswordSignup`): client-side validation chain — all-fields-required → passwords-match → password length ≥ 8 chars — each with a distinct i18n error string, checked in that order before any network call. On pass: `createUserWithEmailAndPassword` → `updateProfile` (sets `displayName`) → `getIdToken(true)` (forced refresh so the backend sees the just-set display name in token claims) → `employeeSsoSignup(inviteCode, idToken, password)`.
- Firebase error-code-to-message mapping is narrower than `LoginScreen`'s: only `auth/email-already-in-use`, `auth/invalid-email`, `auth/weak-password` are special-cased; everything else falls back to a generic "Failed to create account" string (`LoginScreen` handles five distinct SSO error codes vs. this form's three signup codes — different failure surfaces, so the asymmetry is reasonable, not necessarily a bug).
- Password-reveal toggles exist independently for the password field (`showPassword`) and confirm field (`showConfirm`).
- Mode tabs are disabled outright (not just visually) when the invitation carries a locked email (`disabled={Boolean(codeDetails?.codeInfo.email)}`), removing the user's ability to switch away from whichever the invitation dictates.

## 8. Accessibility

- Password-mode fields correctly use the shared `Field` wrapper, which (per the catalog's `field.md`) associates a `<label>` and renders errors via a dedicated error row — better accessibility scaffolding than `LoginScreen`'s hand-rolled labels, though `Field` here is used without its own `error`/`hint` props (form-level error is shown once, below all fields, not per-field).
- Same password-reveal-button gap as `LoginScreen`: icon-only `<button>` with no `aria-label`, and `outline-none focus:outline-none` strips focus-visible styling with no substitute.
- The `invalid` state's icon badge (`XCircleIcon`) is purely decorative alongside an adjacent text title — acceptable, but the icon itself has no `aria-hidden`/`alt` treatment noted.
- Status row's semantic color-coding (green/red) is paired with icon + text label ("Verified Invitation" / "Invalid / Expired"), so the status isn't color-only — a good pattern.
- `AnimatePresence`-gated org card exit animation includes a `blur()` filter transition; no `prefers-reduced-motion` guard is applied anywhere in `animations.ts`, so users with reduced-motion preferences get the full multi-stage entrance regardless — a cross-cutting gap, not unique to this screen.

## 9. Data density

Low-to-moderate — higher than `LoginScreen` due to the invitation-context panel (location, status, expiry copy) and the org card, but still a single-task gate screen: one form, one decision point (SSO vs. password), no tables/lists beyond the short detail rows.

## 10. Reusable ideas

- **The org-card stagger-reveal (`orgCardVariants`/`orgBarVariants`/`orgLogoVariants`/`orgTextContainer`/`orgTextRow`) is the single strongest reusable motion idea found in the auth flow.** Its four-part choreography (blur-in card shell → accent bar draw → spring-in logo → staggered text lines) is a distinctive, brand-appropriate "identity reveal" pattern that generalizes well beyond this screen — e.g. a tenant-switcher dropdown, a "connected as" account card, an onboarding company-confirmation step, or any surface introducing an org/brand identity into view. Recommend promoting it to the component catalog as a named pattern (e.g. `OrgIdentityCard`) rather than leaving it as inline JSX unique to `JoinScreen`.
- The three-state (`loading`/`invalid`/`ready`) screen-level state machine, each with its own full-bleed layout, is a clean model for other token/invite-gated public screens (e.g. a password-reset-by-token flow) — worth documenting as a reusable "gated public screen" shape if more such screens exist or are planned.
- The mismatch between `LoginScreen` (fixed padding, no responsive steps, `md` breakpoint) and `JoinScreen` (responsive `sm:`-stepped padding/type, `lg` breakpoint) suggests these two should eventually share one `AuthLayout`/`AuthSplitPanel` primitive rather than independently reimplementing the same two-pane shell with drifting details.

## 11. Legacy import check

No import from legacy `src/components`, `src/store`, `src/lib`, `src/types`, or `src/data`/`src/config` — all UI/auth/type imports resolve to `@/shared/*` or `@/features/auth/*`. One import worth flagging separately: `useNav` comes from `@/hooks/helper` (`src/hooks/helper/useNav.ts`), a top-level `src/hooks` directory that sits outside `src/shared` entirely (parallel to the legacy `src/components`/`src/store`/etc. rather than inside the canonical `shared/` tree). It isn't one of the five explicitly-named legacy directories, but it's the same structural smell — a pre-refactor top-level folder — and is worth deciding whether `useNav` should live under `src/shared/hooks` for consistency.
