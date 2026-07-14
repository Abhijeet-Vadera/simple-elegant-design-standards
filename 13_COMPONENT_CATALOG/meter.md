# Meter

## Purpose
A minimal horizontal progress/fill bar: a track + an animated fill representing `value` as a percentage of `max`. It communicates a single scalar proportion (e.g. "62% complete", "priority score 7/10") inline — no numeric label, no ticks, no segments. Like `Sparkline`, it is a data-viz *primitive* meant to sit inside another component (a row, a card), not a standalone chart.

## File / exports / prop signature
- **File:** `src/shared/components/ui/index.tsx:640-671`
- **Duplicated verbatim (whitespace-only diff) in the legacy barrel:** `src/components/ui/index.tsx:262-269` (per `.ai-design-dna/12_DESIGN_TOKENS/components.json`, that legacy file is a superseded subset — do not add new call sites there)
- **Export:** `export function Meter({ value, max, h }: Props)`

```ts
{
  value: number;   // required, no default — current fill amount
  max?: number;     // default 100
  h?: number;        // default 6 (px) — track/fill height
}
```

Not forwarded/available: `w`/width prop (track is always `width: "100%"` of its parent — Meter is block-level and fills its container, unlike `Sparkline` which is fixed-width), color/variant props, label/value-text rendering, `className`/style passthrough, `aria-*` (`role="progressbar"`, `aria-valuenow`, etc. are absent — flagged below as an accessibility gap).

## Exact math / rendering approach
Read verbatim from `src/shared/components/ui/index.tsx:650-669`:

1. **Track:** outer `<div>` — `height: h` (default 6px), `background: "#F3F4F6"`, `borderRadius: 999`, `overflow: "hidden"`, `width: "100%"`.
2. **Fill:** inner `<div>` — `height: "100%"` (fills the track's height), `width: Math.min(100, (value / max) * 100) + "%"`, `background: "#0A0A0A"`, `borderRadius: 999`, `transition: "width 0.6s"`.
3. **Clamping:** the fill percentage is capped at 100 via `Math.min(100, ...)` — a `value` exceeding `max` clips visually to a full bar rather than overflowing the track. There is **no lower clamp**: a negative `value` (or negative ratio) produces a negative `width` percentage, which is invalid CSS and will render as `0` in practice, but the component does not defensively `Math.max(0, ...)` it — treat sub-zero input as unsupported/undefined behavior, not a tested guard.
4. **No SVG** — unlike `Sparkline`, `Meter` is pure CSS/DOM (`div`-in-`div`), not an SVG primitive. `overflow: hidden` on the track is what produces the pill-shaped clipped fill end.

**Colors**, all literal, matching canonical tokens in `.ai-design-dna/02_DESIGN_DNA.json`:
- Track `#F3F4F6` = `color.hoverSurface` (line 24: "tailwind: colors.hover — stock gray-100").
- Fill `#0A0A0A` = `color.ink` (line 10).
- Radius `999` = `radius.pill` (`.ai-design-dna/02_DESIGN_DNA.json:109`, `radius.json`).

## Default dimensions
- `h = 6px` track/fill height (thin hairline bar).
- Width is **always `100%` of the parent container** — there is no fixed-px default width like Sparkline's `w=120`; the caller's layout entirely determines the bar's length. This means Meter must be placed inside an element with an intentional width (a table cell, a card's content column, a flex item with a set/flex-basis width) — it will otherwise stretch to fill whatever wraps it.

## States / transitions
- **Single state dimension:** fill percentage, driven entirely by the `value`/`max` props — no internal `useState`, no hover state, no focus state, no disabled variant.
- **Transition:** `transition: "width 0.6s"` on the fill `<div>` — animates any change to the computed `width` percentage over 0.6s using the browser's default timing function (`ease`, since no easing function is specified in the string — this is a plain CSS `transition: width 0.6s` shorthand, not a cubic-bezier). This is a bare CSS transition, not a `framer-motion` variant, and is therefore **not** an instance of the app's canonical `progressBarVariants` motion definition in `src/shared/lib/animations.ts` — but it lands on the same 0.6s duration coincidentally cited in `.ai-design-dna/12_DESIGN_TOKENS/motion.json` (`durations.progressBar: "0.6s"`) and stays within the constitution's stated animation-speed band ("`.ai-design-dna/01_DESIGN_CONSTITUTION.md`:65 — nothing animates slower than 0.6s or faster than 0.12s"). Treat this as the slow end of that band, not the norm.
- Because there is no reduced-motion override on this literal inline `transition` (the global `prefers-reduced-motion` rule in `src/index.css:67-72` covers CSS animations broadly per `motion.json`'s `reducedMotion` note, but verify against that file if auditing accessibility) it should be checked alongside other un-gated transitions if a reduced-motion audit is done.

## Usage rules — Meter vs. the larger chart components
Use **Meter** when:
- You need a single-value proportion bar (score, capacity, completion %) inline in a row/card, with no comparison across categories.
- No numeric label is required from the primitive itself (the caller renders the number/label text alongside it, e.g. `"62%"` as sibling text — Meter never draws its own text).
- The visual is a track+fill bar, not a bar *chart* (single value, not a series/category set).

Use the larger chart components in `src/components/shared/charts/*` when:
- Comparing multiple categories/values side-by-side (`VerticalBarChart.tsx`, `DepartmentBarChart.tsx`, `IdeasPerDepartmentChart.tsx`) — those are true bar charts with per-category bars, not a single proportion fill.
- You need hover/click interactivity, a legend, or drill-through (e.g. `IdeasByDepartmentModal.tsx`).
- The component needs to be the primary visualization of a dashboard section rather than a compact inline indicator inside another component's layout.

## Real call-site examples
**None found.** `Meter` is exported from both `src/shared/components/ui/index.tsx:641` and the legacy `src/components/ui/index.tsx:263`, but a repo-wide search for `<Meter` and any import of `Meter` outside those two definition files returns **zero matches** across `src/`. Like `Sparkline`, it is currently dead/unused code — an available primitive with no live call site. The `.ai-design-dna/02_DESIGN_DNA.json:162` primitive list and `12_DESIGN_TOKENS/components.json` both still list it as part of the canonical primitive set, so it should be treated as an intentional, ready-to-use building block for any future "priority score," "capacity," or "% complete" UI, rather than reason to assume it's slated for removal.

## Anti-patterns
- **Do not** hand-roll a new `div`-in-`div` progress bar with inline styles when adding a proportion indicator — `Meter` already exists unused; use it instead of duplicating the track/fill/pill-radius pattern.
- **Do not** rely on `Meter` to render its own numeric/percentage label — it draws none; place the label as sibling text in the caller.
- **Do not** feed it a `value` below 0 expecting a graceful empty bar — there's no lower clamp, only the upper `Math.min(100, ...)` clamp; this is unverified/unsupported territory in the current implementation.
- **Do not** treat `transition: width 0.6s` as equivalent to the app's `progressBarVariants` framer-motion definition in `src/shared/lib/animations.ts` — it is a plain CSS transition with the browser default easing, not that named motion variant, even though the duration matches.
- **Do not** drop `Meter` into an unconstrained-width container expecting a fixed small pixel size (like Sparkline's default 120px) — it always fills 100% of its parent; give it an explicitly sized wrapper.
- **Do not** ship it in a context that needs `aria-valuenow`/`role="progressbar"` semantics for accessibility without adding those attributes at the call site — the primitive itself provides none.
