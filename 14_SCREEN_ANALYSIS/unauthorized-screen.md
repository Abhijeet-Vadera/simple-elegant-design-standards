# Screen: Unauthorized (403)

**File**: `src/features/errors/container/UnauthorizedScreen.tsx`

## 1. Purpose & access

`src/routes/routes.config.ts` (id `unauthorized`, `path: "/unauthorized"`), `access: "public"`. Wired in `src/routes/AppRouter.tsx:45` as `unauthorized: <UnauthorizedScreen />` in `COMPONENT_MAP`. The actual role-gate logic that redirects here when a user's role fails `canAccess()` (`routes.config.ts:344-348`) lives in the router guard components, not in this file — this screen is purely the terminal display, not the guard itself. Its one action, "Back to dashboard," assumes the visitor is at least authenticated even though the route is technically public.

## 2. Layout

Full-viewport centered dark shell, same family as `ChangePasswordScreen` but with no card:

- Outer `div`: `minHeight: 100vh`, `background: #0A0A0A`, `color: #fff`, flex column, centered, `gap: 24`, `padding: 32`, `textAlign: center`.
- `LanguageSwitcher` fixed `top-5 right-5 z-50`.
- Giant watermark numeral **"403"** — `fontFamily: 'JetBrains Mono, monospace'`, `80px/700`, `lineHeight: 1`, `color: rgba(255,255,255,0.08)`.
- A text block pulled up with `marginTop: -24` (deliberate hand-tuned overlap against the parent's `gap: 24`), containing `h1` title + `p` message.
- One `Button`.

## 3. Hierarchy

Numeral watermark → title → message → single action button: a clean 4-tier vertical stack with exactly one CTA, no competing actions.

## 4. Spacing

Top-level children spaced via flex `gap: 24`; page `padding: 32`; `h1` margin `"0 0 8px"`; `p` margin `0`, `maxWidth: 320`. The `marginTop: -24` on the text block is a manual correction to visually fuse it to the numeral above, not a token-driven value.

## 5. Typography

- "403": JetBrains Mono, `80px/700`, 8% white opacity — the one legitimate mono usage on this screen (status-code-as-numeral fits the "non-prose token" role per Design Constitution rule 17).
- Title: `22px/600`, `letter-spacing: -0.02em` — another bespoke heading size (matches neither `pageTitle` 30px nor `sectionCardTitle` 13.5px in `12_DESIGN_TOKENS/typography.json`; same pattern as `ChangePasswordScreen`'s 20px card title).
- Message: `13.5px/400`, `rgba(255,255,255,0.45)` — this one **does** match the `body` scale step (`13.5px/400`) exactly.

## 6. Components used

- `LanguageSwitcher` — same light-styled-on-dark-page note as `ChangePasswordScreen`.
- `Button` `variant="secondary"` (default `size="md"`), no override — renders as its normal light pill (`bg-white`, `#0A0A0A` text, `#E5E7EB` border per `13_COMPONENT_CATALOG/button.md` §3) floating on the black page; visually consistent with the rest of the Login-family screens.
- **No Framer Motion** — `fadeUp`/`screenVariants` are not imported here, unlike `ChangePasswordScreen`. Content appears with a hard cut, diverging from the app-wide motion convention (Design Constitution rule 41).
- No `Field`/`Input` — this screen has no form.

## 7. Interaction

Exactly one interactive element: the `Button`'s `onClick={() => navigate('/dashboard')}`. No async state, no loading/disabled variants.

## 8. Accessibility

- Real `h1` + `p` semantics.
- The decorative "403" numeral has no `aria-hidden="true"` — a screen reader will announce "403" as if it were meaningful heading content, ahead of the actual `h1`.
- `Button`'s `secondary` variant has no `focus-visible` styling of its own (per `button.md` §5) and relies on the browser default outline, which may render with low visibility against the pure-black page.

## 9. Data density

None — a static status message, zero data.

## 10. Reusable ideas

1. The numeral-watermark + negative-margin text block is a strong, reusable "system status" motif — already reused near-verbatim by `NotFoundScreen`; a shared `StatusScreen({ code, title, message, cta })` component would remove the duplication between the two (see `not-found-screen.md` §10).
2. Missing entrance animation is an inconsistency against the rest of the app's motion-everywhere convention — add `fadeUp` for parity with `ChangePasswordScreen`.
3. Add `aria-hidden="true"` to the decorative numeral.
