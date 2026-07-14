# Login Screen

**File:** `src/features/auth/container/LoginScreen.tsx`
**Route:** `id: "login"`, `path: "/login"`, `access: "public"` (`src/routes/routes.config.ts:36-41`) — no `meta.description`, no `nav` entry (not a sidebar destination).

## 1. Purpose & Access

The sole entry point into the app for unauthenticated users. Offers two independent auth paths: legacy email/password (with a Firebase-first, direct-backend-fallback flow) and org SSO (Microsoft / Google via Firebase popup). `access: "public"` — reachable with no session, and is the app's `/unauthorized`-adjacent "front door" (redirect target when a protected route is hit without auth, per the router convention used elsewhere in `routes.config.ts`).

## 2. Layout

A fixed two-pane split, no responsive collapse below `md`:

```
grid grid-cols-1 md:grid-cols-[1.05fr_1fr]   (single column until md, then editorial-left/form-right)
```

- **Left panel** (`bg-[#0A0A0A] text-white`, `p-12 md:p-14`): full-bleed ink-black "editorial" brand panel. Contains, top to bottom: wordmark lockup (icon + `Brand` wordmark, both `brightness-0 invert`-forced white), then a `mt-auto`-pinned block (mono eyebrow tagline + serif-weight headline) anchored to the bottom of the panel. A giant decorative Brand glyph is absolutely positioned bleeding off the top-right corner at `opacity-[5%]`, `pointer-events-none` — pure ambient texture, not content.
- **Right panel** (`bg-[#F7F7F5]`, `grid place-items-center`, `p-10`): the credential form, capped at `max-w-[400px]` and centered both axes. Has its own faint decorative glyph bleeding off the top-left at `opacity-[2%]`.
- A `LanguageSwitcher` floats independent of both panels: `fixed top-5 right-5 z-50`.

This is a bespoke full-screen auth layout — it does not use `Shell`/`PageHeader`/any dashboard chrome, since it renders outside the authenticated app shell.

### Entrance animation

Both panels' content blocks animate in with the shared **`fadeUp`** variant from `src/shared/lib/animations.ts` (`initial="hidden"`, `animate="show"`, no `exit` — this screen never unmounts via `AnimatePresence`):

```ts
export const EASE_OUT: Transition = { ease: [0.16, 1, 0.3, 1], duration: 0.5 };
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: EASE_OUT },
};
```
i.e. 10px upward slide + fade, 0.5s, custom ease-out-expo-ish cubic-bezier `[0.16, 1, 0.3, 1]`. Applied twice, independently, to (a) the left-panel tagline/headline block and (b) the right-panel form block — both fire on mount with no stagger between them (same `initial`→`show`, no `delayChildren`), so they visually arrive together.

**Note on the org-card entrance:** `orgCardVariants` / `orgLogoVariants` / `orgBarVariants` / `orgTextRow` (the branded stagger-reveal treatment) are **not used on this screen** — `LoginScreen.tsx` never imports them. That richer entrance is exclusive to `JoinScreen` (see `join-screen.md`), where an actual inviting org's card must self-assemble. LoginScreen has no equivalent "org card" because it has no invitation/tenant context to render at sign-in time — the whole surface only uses the plain `fadeUp`.

## 3. Hierarchy

1. Brand lockup (top-left of dark panel) — establishes identity before anything else loads.
2. Headline + tagline (bottom-anchored, dark panel) — the emotional/positioning hook, deliberately given the most visual weight (38px semibold) despite being non-interactive.
3. "Sign in" heading + subtitle (right panel) — task framing.
4. Work email → Password → primary Sign-in button — the primary path, in strict top-to-bottom tab order.
5. "or" divider — de-emphasizes the secondary path visually (thin 1px rules + 12px gray label).
6. SSO provider buttons (Microsoft, Google) — secondary path, visually equal-weight white/bordered buttons stacked below the divider.
7. Inline error text — lowest priority, appears only on failure, directly under the SSO stack.

## 4. Spacing

- Panel padding: `p-12 md:p-14` (48px/56px) left panel; `p-10` (40px) right panel.
- Form field vertical rhythm: `flex flex-col gap-3.5` (14px) between Work email / Password / Sign-in button groups.
- Label-to-input gap: `mb-[7px]` (~7px), tighter than the shared `Field` component's own convention — this screen hand-rolls its own label markup rather than using `Field` (see Components, below).
- Divider row: `gap-2.5` (10px) between rule/"or"/rule, `my-2` (8px) vertical breathing room.
- SSO button stack: `gap-3.5` (14px), `pt-1` (4px) lead-in after the "Continue with your organization account:" caption.
- Tagline-to-headline gap on dark panel: `mb-[22px]`.

## 5. Typography

- Mono eyebrow tagline: `font-mono text-[11px] tracking-[0.14em] uppercase text-white/50` — matches the catalog's `eyebrow` token (`12_DESIGN_TOKENS/typography.json`: size 11, tracking 0.14em, mono, uppercase) almost exactly.
- Headline: `text-[38px] leading-[1.12] tracking-[-0.03em] font-semibold`, with a literal `\n` (`whitespace-pre-line`) forcing a manual two-line break — larger than the catalog's documented `pageTitle` (30px), a one-off oversized treatment unique to this screen's marketing framing.
- "Sign in" heading: `text-[22px] font-semibold tracking-[-0.022em]`.
- Subtitle/caption copy: `text-[13px] text-[#6B7280]`.
- Field labels: `text-[12.5px] font-medium text-[#0A0A0A]` — matches the tokens' `label` scale (12.5px/500).
- Buttons: `text-[14.5px] font-medium`.
- Divider "or" and error text: `text-[12px]`/`text-[12.5px]` respectively; error color `#DC2626`.

## 6. Components used

- **Input** (`@/shared/components/ui`) — plain email field and password field (`type` toggled between `password`/`text` for the reveal control).
- **Spinner** (`@/shared/components/ui`) — swapped in for button label during `loading` (primary submit, `light` variant for on-black button) and per-provider during `providerLoading` (default/dark variant on white SSO buttons).
- **EyeIcon / EyeOffIcon / ProviderIcon** (`@/shared/components/ui/Icons`) — password-reveal toggle and per-SSO-provider glyph.
- **LanguageSwitcher** (`@/shared/components/LanguageSwitcher`).
- Raw `<button>` elements for both the primary Sign-in action and the SSO provider rows — **not** the shared `Button` component (no `variant`/`size` props; styling is hand-written Tailwind matching `Button`'s `primary`/`secondary` look-alike but duplicated inline). Worth flagging as drift from the catalog: this screen could use `Button` (`variant="primary"` / `variant="secondary"`) but re-implements the same visual contract by hand.
- Label markup is hand-rolled (`<label className="block text-[12.5px] font-medium ...">`) rather than composing the shared `Field` wrapper, so error/hint semantics aren't unified with the rest of the app's forms.

## 7. Interaction

- **Password login** (`handlePasswordLogin`): client-side required-fields check only (`email.trim()` + `password` truthy) before attempting; no format/strength validation. Two-stage attempt: Firebase `signInWithEmailAndPassword` → on any Firebase error, silently falls back to a legacy direct backend `login(email, password)` call (via `useAuth()`), surfacing only the *legacy* path's error message if both fail. Enter key on either field submits.
- **SSO login** (`handleProviderLogin`): opens `signInWithPopup` for Google (`GoogleAuthProvider`, pre-filled `login_hint` if an email was typed) or Microsoft (`OAuthProvider("microsoft.com")`); GitHub is wired in the provider-type switch but never offered in `ssoProviders` (dead branch — only Microsoft/Google appear in `ssoProviders` array, both flagged `isDefault: true`). A `window.addEventListener("focus", ..., { once: true })` guard with a 1.5s timeout clears `providerLoading` if the popup flow abandons without resolving (covers the case where a user closes/loses the popup without triggering a resolvable Firebase error).
- Popup-cancellation error codes (`auth/popup-closed-by-user`, `auth/cancelled-popup-request`, `auth/user-cancelled`) are explicitly swallowed — no error message shown, just resets loading state.
- Specific human-readable error copy per Firebase error code: `auth/popup-blocked`, `auth/account-exists-with-different-credential`, `auth/unauthorized-domain`, `auth/network-request-failed`, generic fallback otherwise. All strings are i18n-keyed via `t(...)` with English fallback defaults.
- Both loading states (`loading`, `providerLoading`) cross-disable each other's controls (`disabled={loading || !!providerLoading}`) so a user can't fire both flows concurrently.
- Typing in either field calls `clearError()`, so a stale error never survives a retry attempt.

## 8. Accessibility

- Inputs have visible `<label>` elements (hand-rolled `<label>` tags, correctly associated only by visual proximity — no `htmlFor`/`id` pairing present, so screen-reader label association relies on DOM adjacency rather than an explicit `for` attribute).
- Password-reveal toggle is a `<button type="button">` (correctly excluded from form submission) but has no `aria-label`/`aria-pressed` — icon-only, no accessible name beyond the icon SVG's own (likely absent) title.
- No visible `:focus` ring styling is defined beyond browser default (`outline-none focus:outline-none` is explicitly set on the reveal-toggle button, removing the focus indicator entirely with no substitute — an accessibility gap).
- Error text is a plain `<p>`, not wired to the inputs via `aria-describedby`, and has no `role="alert"` — not guaranteed to be announced by AT on appearance.
- Decorative brand glyphs correctly use `alt=""`.

## 9. Data density

Minimal — five interactive elements total (email, password, reveal toggle, submit, 2 SSO buttons) plus one conditional error line. No lists, tables, or counts. Appropriate for a gate screen.

## 10. Reusable ideas

- The **left-editorial / right-form split with a bottom-anchored headline** is a strong, distinctive full-bleed auth pattern — worth generalizing into a shared `AuthLayout` if more public screens (e.g. password reset) need the same brand presence.
- The **hand-rolled buttons duplicating `Button`'s primary/secondary visual contract** is tech debt worth resolving — swap in the shared `Button` component rather than maintaining a parallel inline implementation.
- Note for `.ai-design-dna/12_DESIGN_TOKENS/`: this screen's headline (38px) is a one-off larger than the documented `pageTitle` (30px) scale step — worth deciding whether this becomes a named `heroTitle`/`marketingTitle` token or stays a bespoke outlier.

## 11. Legacy import check

**None.** All imports resolve to canonical locations: `@/features/auth/*` (feature module), `@/shared/components/ui`, `@/shared/components/ui/Icons`, `@/shared/components/LanguageSwitcher`, `@/shared/config/firebase`, `@/shared/data` (for `ORG.domain`), `@/shared/lib/animations`, `@/shared/types`. No import from legacy `src/components`, `src/store`, `src/lib`, `src/types`, `src/data`, or `src/config`. This screen is clean.
