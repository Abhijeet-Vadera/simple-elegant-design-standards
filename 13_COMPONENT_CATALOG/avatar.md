# Avatar

## 1. Purpose

Represents a person (submitter, reviewer, assignee, employee, manager) as a small circular identity chip — either their uploaded photo or a fallback of initials over a flat tint. Used anywhere a person needs to be visually attributed in a compact space: idea cards, kanban cards, tables, dropdowns, profile headers.

## 2. File & Exports

- **File:** `src/shared/components/ui/index.tsx` (lines 21–74)
- **Export:** `export function Avatar(props)`
- A byte-similar duplicate also exists in the superseded legacy file `src/components/ui/index.tsx:8` — **not** the canonical import (see Anti-Patterns).

### Exact TS prop signature

```ts
function Avatar({
  name,
  initials,
  size = 32,
  dark = false,
  src,
}: {
  name?: string;
  initials?: string;
  size?: number;
  dark?: boolean;
  src?: string;
})
```

No `className`/style passthrough prop exists — callers cannot extend styling from the outside; every visual choice is internal to the component.

## 3. Variants

There is no `variant` prop; the only branching is the boolean `dark` flag, plus the derived image-vs-initials fallback state.

| `dark` | background | text color | border |
|---|---|---|---|
| `false` (default) | `#EDEDEA` | `#0A0A0A` | `1px solid rgba(0,0,0,0.05)` (`border-black/5`) |
| `true` | `#1A1A1A` | `#FFFFFF` | `1px solid rgba(255,255,255,0.1)` (`border-white/10`) |

These exact pairs are also recorded in `.ai-design-dna/02_DESIGN_DNA.json` under `color.avatarDark` / `color.avatarLight`.

- **Shape:** always `rounded-full` (perfect circle), `overflow-hidden`, `shrink-0` (never compresses in a flex row).
- **Size:** fully arbitrary `number` in px via inline `style.width`/`style.height` (default `32`) — not a fixed `sm|md|lg` enum. Observed real call sites range from `14` to `64` (see §8).
- **Font size:** derived, not looked up — `fs = Math.round(size * 0.38)`, so it scales proportionally with `size` (e.g. `size=32` → `12px` text, `size=64` → `24px`).
- **Initials text:** `font-semibold tracking-[-0.02em]`. Source text priority: explicit `initials` prop wins; otherwise derived from `name` by splitting on spaces, taking the first character of each word, keeping at most the first 2 words (`.slice(0, 2)`), joined — e.g. "Jane Q. Doe" → "JQ" is wrong intuition, actual logic takes first-char of each *space-separated token* up to 2 tokens, so "Jane Q. Doe" → "JQ". If neither `name` nor `initials` is supplied, falls back to the literal string `"?"`.
- **Image mode:** if `src` is provided and hasn't errored, renders an `<img>` with `object-cover`, filling the full circle (`w-full h-full`). On `onError`, `imgError` state flips to `true` and the component falls back to the initials text instead. `useEffect` resets `imgError` to `false` whenever `src` changes, so a new photo URL always gets a fresh chance to load.

## 4. Spacing

- No internal padding — image or text is centered via `flex items-center justify-center` inside a box sized exactly `width: size, height: size` (no gap/margin of its own).
- Border is `1px` regardless of size.
- Text has no explicit line-height/margin; centering is purely flexbox.

## 5. States

- **Default / loaded image:** shows `<img>`.
- **Image error:** `imgError` becomes `true` on the `<img>`'s native `onerror`, silently swapping to initials — no visible loading spinner or placeholder flash is implemented, no retry.
- **`src` change:** resets error state via `useEffect([src])` so a previously-broken avatar can recover if a new URL is passed in.
- **No hover, focus, active, or disabled state** — `Avatar` is a non-interactive, purely presentational `<div>`; any click/hover behavior seen at call sites (e.g. `AssignDropdown`'s border-color hover) is implemented on the *wrapping* element, never inside `Avatar` itself.

## 6. Motion

None. `Avatar` renders a plain `<div>`/`<img>` — it does not import or use `framer-motion` at all. Cross-referencing `.ai-design-dna/12_DESIGN_TOKENS/animations.json`, no variant (`fadeUp`, `staggerItem`, etc.) is applied to `Avatar` in this file; any entrance animation seen around an avatar in the UI comes from an ancestor wrapper, not the primitive itself.

## 7. Usage Rules

- Use `Avatar` for **person** identity only (submitter, reviewer, manager, employee, "You"). It is not a generic image-thumbnail or icon-well component.
- Pass `src` whenever a real photo URL exists; always also pass `name` (even alongside `src`) so the initials fallback is available if the image 404s — several call sites (`EmployeesScreen.tsx:157`, `DepartmentsScreen.tsx:306`) do exactly this.
- Use `initials` only when you already have a precomputed 1–2 letter code and want to bypass the name-splitting logic; otherwise prefer `name` and let `Avatar` derive initials.
- Use `dark={true}` to mark a person as visually distinguished within a list (observed real usage: `ProfileScreen.tsx:73` sets `dark={isManager}` to visually flag the manager's own avatar; `AssignDropdown` components set `dark={isSelected}`). It is a semantic "highlighted/selected" signal, not a random alternate skin — don't apply it decoratively.
- Choose `size` contextually — small (14–20px) inline next to text/labels (e.g. `AssignedIdeaCard.tsx:226` uses `17`, `AssignDropdown.tsx` uses `14`/`16`), medium (~24–36px) for row/card/comment attribution, large (64px) for a profile page header (`ProfileScreen.tsx:73`). There is no named size token — pick a pixel value consistent with sibling call sites in the same screen.
- For a group of avatars, use `AvatarStack`, not repeated bare `Avatar`s with manual negative margins.

## 8. Composition Rules — real call sites

- `src/features/people/container/ProfileScreen.tsx:73` — profile header hero avatar: `<Avatar name={person.name} size={64} dark={isManager} />`.
- `src/features/people/container/EmployeesScreen.tsx:157` — table row identity with real photo + name fallback: `<Avatar name={fullName} size={32} src={e.profilePicture} />`.
- `src/features/ideas/container/IdeaDetailScreen.tsx:697` and `:734` — comment/activity attribution: `<Avatar name={authorName} size={30} />` and `<Avatar name="You" size={30} />` for the current user's own comment composer.
- `src/shared/components/AssignDropdown.tsx:147` — compact trigger avatar with selection-state dark flag: `<Avatar name={...} src={currentManager.profilePicture || undefined} size={compact ? 14 : 16} />`.
- `src/shared/components/layout/Shell.tsx:381` — used in the app shell/topbar for the signed-in user.
- `src/shared/components/ui/index.tsx:1412` — used internally by another primitive: `<Avatar name={idea.reviewer.name} size={24} />` inside `IdeaRow`.

## 9. Anti-Patterns

- Never import `Avatar` from the legacy `src/components/ui/index.tsx` (it has its own near-duplicate `Avatar`/`AvatarStack`/`Badge`/`Priority`/`Tag` definitions) — the canonical source is always `src/shared/components/ui/index.tsx` (or the `@/shared/components/ui` barrel).
- Don't pass only `initials` when a `name` is available and no `src` — you gain nothing over letting `Avatar` derive the initials itself, and you lose the ability to fall back gracefully if you later add a photo.
- Don't rely on `Avatar` to show a loading state while an image fetches — there isn't one; the browser simply paints initials-then-image or stays on initials forever on error. If a loading skeleton is needed, build it in the parent.
- Don't add `onClick`/hover styling directly to `Avatar`'s props — it accepts no `className`/style passthrough and no event props; wrap it in your own interactive element instead, exactly as `AssignDropdown` does.
- Don't hardcode a "grey silhouette" placeholder icon for missing photos — the established fallback pattern in this codebase is initials-on-tint, not an icon.
