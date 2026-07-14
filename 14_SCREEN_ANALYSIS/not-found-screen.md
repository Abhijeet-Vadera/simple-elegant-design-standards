# Screen: Not Found (404)

**File**: `src/features/errors/container/NotFoundScreen.tsx`

## 1. Purpose & access

Not present as an entry in `src/routes/routes.config.ts`'s `ROUTES` array — it is not a navigable "route" of its own. It is wired directly in `src/routes/AppRouter.tsx` as the true catch-all, `{ path: "*", element: <NotFoundScreen /> }` (line 124), **and** reused three more times as a defensive fallback wherever a configured route id has no matching entry in `COMPONENT_MAP`: `COMPONENT_MAP[r.id] ?? <NotFoundScreen />` (lines 93, 106, 115). So it serves two distinct roles — genuine 404 for unknown URLs, and a silent safety net for router/`COMPONENT_MAP` misconfiguration. No auth check exists in the component itself; it is implicitly reachable by anyone, logged in or not.

## 2. Layout

Structurally identical to `UnauthorizedScreen` minus the `LanguageSwitcher`:

- Outer `div`: `minHeight: 100vh`, `background: #0A0A0A`, `color: #fff`, flex column, centered, `gap: 24`, `padding: 32`, `textAlign: center`.
- Watermark numeral **"404"** — JetBrains Mono, `80px/700`, `lineHeight: 1`, `color: rgba(255,255,255,0.08)`.
- Text block at `marginTop: -24`: `h1` "Page not found" + `p` message.
- One `Button`.

There is **no** `LanguageSwitcher` on this screen, unlike its sibling `UnauthorizedScreen` — a direct inconsistency between the two otherwise-twin error screens.

## 3. Hierarchy

Same 4-tier stack as `UnauthorizedScreen`: numeral → title → message → single `Button`, no competing actions.

## 4. Spacing

Identical values to `UnauthorizedScreen`: `gap: 24` (page), `padding: 32`, `h1` margin `"0 0 8px"`, `p` margin `0`/`maxWidth: 320`, `marginTop: -24` on the text block.

## 5. Typography

- "404": JetBrains Mono, `80px/700`, 8% white opacity — same treatment as `UnauthorizedScreen`'s "403".
- Title: `22px/600`, `letter-spacing: -0.02em` — same bespoke heading size as `UnauthorizedScreen` (not a documented step in `12_DESIGN_TOKENS/typography.json`).
- Message: `13.5px/400`, `rgba(255,255,255,0.45)` — matches the `body` scale step exactly.

## 6. Components used

- `Button` `variant="secondary"`, default size, `onClick={() => navigate('/dashboard')}` — the **only** imported component besides React Router's `useNavigate`. This is the leanest of the three screens: no `LanguageSwitcher`, no `Field`/`Input`, no Framer Motion (`fadeUp` not imported here either, same motion-convention gap as `UnauthorizedScreen`).

## 7. Interaction

Single interactive element: the `Button`. No form, no async state, no loading/disabled handling.

## 8. Accessibility

- Real `h1` + `p` semantics, same as `UnauthorizedScreen`.
- Decorative "404" numeral has no `aria-hidden="true"`.
- Missing `LanguageSwitcher` means a non-English visitor landing on a broken/deep link has no in-place way to switch language on this screen, even though the sibling `UnauthorizedScreen` offers exactly that — worth reconciling.
- Same unstyled-focus-outline caveat on the `secondary` `Button` as `UnauthorizedScreen`.

## 9. Data density

None — static status message, zero data.

## 10. Reusable ideas

1. `NotFoundScreen` and `UnauthorizedScreen` are ~90% byte-identical JSX (only the numeral, title, message, and `LanguageSwitcher` presence differ). A shared `StatusScreen({ code, title, message, cta, showLanguageSwitcher? })` primitive would remove the duplication and the "one has the switcher, one doesn't" drift documented above.
2. Add the missing `fadeUp` entrance for parity with the rest of the app's motion-everywhere convention (Design Constitution rule 41).
3. Decide deliberately whether `LanguageSwitcher` belongs on 404 too, rather than leaving the omission as an accident of copy-paste.
