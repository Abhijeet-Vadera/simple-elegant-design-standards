# EmptyState

## Purpose
The canonical "there is nothing here" placeholder: an optional icon well, a title, optional supporting body copy, and an optional action (typically a `Button`). Used inside `SectionCard`s, list panels, and full-page contexts whenever a data collection is empty (no assigned ideas, no mentions, no invites, no notifications, etc.).

## File / Exports / Prop Signature
- **File:** `src/shared/components/ui/index.tsx`
- **Export:** `export function EmptyState(...)`, lines 1059–1121
- **Props:**
  ```ts
  {
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    title: string;
    body?: string;
    action?: ReactNode;
  }
  ```
- `title` is required; `icon`, `body`, and `action` are all optional and independently toggle their respective blocks.

## Exact Styling
Source: `src/shared/components/ui/index.tsx:1071-1119`. Cross-check: `.ai-design-dna/12_DESIGN_TOKENS/spacing.json` (`componentSpecific.emptyStatePadding: "56px 24px"`), `radius.json` (`componentSpecific.emptyStateIconWell: "14px"`), `typography.json` (`scale.emptyStateTitle: { size: 17, weight: 600, letterSpacing: "-0.012em" }`).

**Outer container:**
| Property | Value |
|---|---|
| `text-align` | `center` |
| `padding` | `56px 24px` |
| `max-width` | `380px` |
| `margin` | `0 auto` |

**Icon well** (rendered only if `icon` prop is passed):
| Property | Value |
|---|---|
| `width` / `height` | `52px` / `52px` |
| `border-radius` | `14px` (token: `radius.componentSpecific.emptyStateIconWell`) |
| `border` | `1px solid #E5E7EB` (token: `border.default`) |
| `background` | `#fff` |
| `display` | `grid`, `place-items: center` |
| `margin` | `0 auto 18px` |
| `color` (icon stroke/fill) | `#9CA3AF` (token: `text.tertiary`) |
| icon size inside well | `22x22` (`<Icon width={22} height={22} />`) |

**Title:**
| Property | Value |
|---|---|
| `font-size` | `17px` |
| `font-weight` | `600` |
| `letter-spacing` | `-0.012em` |
| `margin-bottom` | `8px` |

**Body** (rendered only if `body` prop is passed):
| Property | Value |
|---|---|
| `font-size` | `13px` |
| `line-height` | `1.55` |
| `color` | `#6B7280` (token: `text.secondary`) |
| `margin-bottom` | `20px` if `action` is present, else `0` |

**Action:** rendered as-is (`{action}`), no extra wrapper styling — the caller's node (usually a `Button`) supplies its own look.

## States
`EmptyState` is stateless/static — there is no loading, hover, or error variant baked in. The three visible configurations are:
1. Icon + title + body (most common — e.g. dashboard "Nothing assigned").
2. Icon + title + body + action (e.g. Invites empty state with a "Create invitation" button).
3. Title only, no icon/body (minimal — allowed by the optional props but rare in the codebase).

## Usage Rules
- Use `EmptyState` for genuine "no data" conditions inside a bounded region (a `SectionCard`, a table body, a list panel) — never for loading states (use `Spinner`/`DataLoader` instead) and never for error states (there is no error variant; do not repurpose `body` as an error message without an explicit design decision).
- Keep `title` short (fits on one line at 17px/600) and `body` to one or two short sentences — the `max-width: 380px` wrapper is tuned for that length.
- Pass `action` only when there's a real next step (e.g. "Create invitation"); do not add an action just to fill space.
- Icon should be a single outline-style SVG icon component (24px viewBox family used elsewhere in the app), not an illustration or multi-color graphic — the icon well forces it to a flat `#9CA3AF` tone via `color` inheritance.

## Real Call-Site Examples
- `src/features/dashboard/container/DashboardScreen.tsx:224-228` — "Nothing assigned" (icon `InboxIcon`, no action).
- `src/features/dashboard/container/DashboardScreen.tsx:250-254` — "No mentions" (icon `UserIcon`, no action).
- `src/features/dashboard/container/DashboardScreen.tsx:310-314` — "All clear" (icon `CheckSquareIcon`, no action).
- `src/features/people/container/InvitesScreen.tsx:349-362` — "Empty invites" with icon `TicketIcon` **and** an `action` (a primary `Button` with `PlusIcon` to open the create-invite modal) — the fullest configuration of the component in the codebase.

## Anti-Patterns
- Do not hand-roll an empty-state layout per screen. A real regression exists in `src/features/notifications/components/NotificationBell.tsx:386-389`, which renders `"No notifications yet"` as a bare `<div className="py-8 px-4 text-center text-[13px] text-gray-400">` instead of using `EmptyState` — this drifts from the 17px/600 title + 13px/#6B7280 body convention and uses an off-token `text-gray-400` color instead of `#9CA3AF`/`#6B7280`. Do not repeat this pattern; new empty states (including compact ones like the notification panel) should still route through `EmptyState` or a deliberately-scoped variant of it, not ad hoc markup.
- Do not re-center, re-pad, or resize the icon well (52x52/14px radius) per screen — if a screen needs a different size, that is a signal to extend the shared component with a prop, not to inline override it.
- Do not use `EmptyState` to communicate loading or error conditions — those have their own components/conventions (`Spinner`, `DataLoader`; error text uses `errorText`/`errorTextAlt` tokens from `colors.json`).
