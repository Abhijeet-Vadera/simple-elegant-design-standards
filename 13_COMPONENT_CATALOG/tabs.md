# Tabs

**Category:** In-page section switcher (underline-indicator tab strip). Not a router, not a stepper.

## Purpose

`Tabs` renders a horizontal strip of clickable labels with a sliding-indicator-free (no animated underline — see Motion) active marker, used to switch between sibling content sections within the same card/panel (e.g. "Idea Details / Attachments", "Activity / Remarks"). It is fully controlled: the parent owns `active` state and re-renders the associated content itself — `Tabs` renders no panels, only the strip.

## File & Exports

- Canonical file: `src/shared/components/ui/index.tsx:950-1008`
- Export: `Tabs` (function component)
- **Legacy duplicate exists and must not be used**: `src/components/ui/index.tsx:356+` contains a near-identical `Tabs` implementation. Same status as the legacy `Menu` — superseded, documented tech debt, not to be imported from.

## Prop Signature

```ts
function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: string; label: string; count?: number }>;
  active: string;
  onChange: (id: string) => void;
})
```
(`index.tsx:950-958`)

There is no `variant`, `size`, or `orientation` prop — `Tabs` is a single fixed visual treatment. The only per-tab customization is the optional `count` badge next to the label.

## Variants

None in the formal prop-API sense. The only "variant" is presentational, driven by data:

- **With count** — when a tab object includes `count`, a JetBrains-Mono numeral renders after the label (`index.tsx:979-990`).
- **Without count** — label only.

There is no vertical/side-tab orientation, no pill/segmented visual mode (that's `Segmented`, a separate primitive at `index.tsx:1011+`), and no icon-only tab mode.

## Exact Styling

Container (`index.tsx:960`):

| Property | Value |
|---|---|
| display | `flex` |
| gap | `2px` |
| border-bottom | `1px solid #E5E7EB` |

Tab button (`index.tsx:962-976`):

| Property | Value |
|---|---|
| position | `relative` (anchors the active-indicator bar) |
| padding | `14px 14px` |
| border | `0` |
| background | `transparent` |
| font-size | `13.5px` |
| font-weight | `500` when active, `450` when inactive |
| color | `#0A0A0A` when active, `#6B7280` when inactive |
| letter-spacing | `-0.006em` |
| transition | `color 0.2s` (plain CSS transition, not Framer) |
| cursor | `pointer` |

Count badge (`index.tsx:980-989`): `margin-left: 7px`, `font-family: "JetBrains Mono, monospace"`, `color: #9CA3AF`, `font-size: 12px`.

Active indicator bar (`index.tsx:991-1002`): absolutely positioned `span`, `left: 0; right: 0; bottom: -1px; height: 2px; background: #0A0A0A; border-radius: 2px` — sits directly under the active tab's label, overlapping the container's `1px` bottom border by 1px so it reads as a continuous 2px accent flush with the rule.

These map directly to the `tabLabel` typography scale entry in `02_DESIGN_DNA.json:85` (`size: 13.5px, weightInactive: 450, weightActive: 500, letterSpacing: -0.006em`).

## Motion

None — `Tabs` uses **zero Framer Motion**. The active-indicator bar simply appears/disappears with the re-render (conditional `{active === t.id && <span .../>}`); there is no slide/morph animation between tabs, and the only animated property anywhere in the component is the plain CSS `transition: color 0.2s` on the label color. This is a deliberate simplicity relative to `Menu`/`Dropdown`, which both use the shared `dropdownVariants` family — do not add spring/slide motion to the indicator without a specific product ask, since no precedent exists for it.

## States

- **Active** — `color: #0A0A0A`, `font-weight: 500`, 2px `#0A0A0A` indicator bar underneath.
- **Inactive** — `color: #6B7280`, `font-weight: 450`, no indicator.
- **Hover** — no dedicated hover style is defined beyond the browser default `cursor: pointer`; color does not change on hover for inactive tabs (only on click via `active` state change). Do not add a hover-color rule under the assumption one is missing — its absence is the current, intentional behavior.
- No disabled-tab state exists in the prop API — if a tab must be unavailable, omit it from the `tabs` array.

## Usage Rules

- ALWAYS keep `Tabs` controlled from the parent (`active` + `onChange`) — it holds no internal state of its own besides what's passed in.
- ALWAYS use the `count` field for a numeric badge (e.g. attachment/activity counts) rather than concatenating the count into the `label` string — this keeps the JetBrains Mono/`#9CA3AF` styling consistent.
- Reserve `Tabs` for switching **content sections within one card/panel** — for switching between full app views/routes, use the router/nav, not `Tabs`; for a segmented toggle of 2-4 mutually exclusive options that isn't "section navigation" (e.g. a view-mode switch), prefer `Segmented` (`index.tsx:1011+`) instead, which has pill-track visuals rather than an underline.

## Anti-Patterns

- NEVER build a second tabs component — as with `Menu`, one duplicate already exists in the legacy barrel (`src/components/ui/index.tsx:356`) and is documented tech debt, not a pattern to copy from.
- NEVER add a sliding/animated indicator transition without checking `src/shared/lib/animations.ts` first — none of the existing variants there target a tab-indicator use case, so if this is added it needs a new, deliberately-designed entry there, not an ad hoc one dropped directly into `Tabs`.
- NEVER use `Tabs` as a stand-in for `Segmented` or vice versa — they are visually distinct families (underline strip vs. pill track) and mixing them inconsistently across screens breaks the "which switcher am I looking at" visual grammar.

## Real Call-Site Examples

Both current production usages are in the same screen, `src/features/ideas/container/IdeaDetailScreen.tsx`:

`IdeaDetailScreen.tsx:330-343` — details/attachments tabs, no active-indicator bleed issue because it sits inside a `-mb-px` wrapper to align with the card's border:
```tsx
<Tabs
  active={detailsTab}
  onChange={setDetailsTab}
  tabs={[
    { id: "details", label: t("idea.ideaDetailsTab") },
    { id: "attachments", label: t("idea.attachmentsTab"), count: documents.length },
  ]}
/>
```

`IdeaDetailScreen.tsx:629-641` — activity/remarks tabs, demonstrating the `count` badge fed from live array lengths:
```tsx
<Tabs
  active={tab}
  onChange={setTab}
  tabs={[
    { id: "activity", label: t("idea.activityTab"), count: activities.length },
    { id: "remarks", label: t("idea.remarksTab"), count: ... },
  ]}
/>
```
