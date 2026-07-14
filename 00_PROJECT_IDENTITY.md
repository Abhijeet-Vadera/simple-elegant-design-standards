# 00 — Project Identity

Source of truth for this document: `tailwind.config.js`, `src/index.css`, `src/shared/lib/animations.ts`, `src/shared/components/ui/index.tsx`, `src/shared/components/layout/Shell.tsx`, `doc/PROJECT_CONTEXT.md`, and full-repo exploration of `src/features/**`, `src/routes/**`.

## What this product is

This application is an internal **corporate innovation-management platform** — employees submit ideas, managers/admins move them through a configurable stage-gate workflow (submitted → screening → evaluation → pilot → scaled), pitch sessions get scheduled, reward points get tracked, and admins configure the whole pipeline. It is a **role-gated back-office SPA**, not a marketing site or consumer product. Primary users: employees (submitters), managers/organizers (reviewers), admins (workflow configurators), "management" (a privacy-constrained oversight role that must never see who submitted an idea).

## Product personality

- **Operator tool, not a showcase.** Every screen exists to move a piece of organizational work forward (an idea, an invite, a stage, a pitch). Nothing is decorative for its own sake.
- **Confident minimalism.** One ink color (`#0A0A0A`), one off-white canvas (`#F7F7F5`), and a single stock gray ramp carry almost the entire UI. Color is spent deliberately — only on semantic status (success/warning/danger/info badges) and on the few functional accents (file-type glyphs, priority bars).
- **Quiet precision over flourish.** Numeric/identifier data (idea refs, counts, dates, priority) is consistently rendered in JetBrains Mono, uppercase-tracked "eyebrow" labels signal secondary context — the product speaks like an engineering console that happens to have a warm, humane canvas color instead of pure white/black.
- **Motion is a confirmation, not a spectacle.** Framer Motion is used everywhere (page transitions, modals, dropdowns, toasts, stagger lists) but tuned to short durations (0.15–0.6s) with one consistent signature ease-out-expo curve — motion reassures the user something responded; it never performs.

## Visual personality

- Near-monochrome, ink-on-off-white palette. This is *not* a colorful SaaS brand — the closest reference points are Linear, Vercel dashboard, and Notion's admin views: dense information, generous but not loose whitespace, hairline borders instead of heavy shadows, soft pastel badges as the only saturated color.
- Typography does the hierarchy work that color would do in a louder product: size + weight + tracking (not hue) separate a page title from a section label from a data value.
- Elevation is restrained: 4 shadow steps, all tinted with the ink color (`rgba(10,10,10, α)`) rather than pure black — shadows read as "ink diffusing," reinforcing the monochrome identity even in depth cues.

## Emotional tone

Calm, trustworthy, slightly technical. The mono-font "eyebrow" labels and idea reference codes (`idea.ref`) give it a faint control-room feel — appropriate for a tool where admins configure workflows and reviewers make gate decisions. Never playful, never loud. Error states use the same ink black for text (not alarming red) except where a genuinely destructive/danger action needs `#DC2626`-family red — restraint even in error communication.

## Premium level

Mid-to-high premium **B2B internal tool** register: custom-drawn icon set (not a generic library), a considered 4-step shadow system, careful focus-ring treatment (`0 0 0 3px rgba(10,10,10,0.06)`), and a branded full-screen loading splash with particle animation (`GlobalLoader`) — these are signals of intentional design investment, not a bootstrapped MVP. It stops short of "consumer premium" (no glassmorphism, no gradients-as-decoration, no illustration system) — it is premium in the way a well-made developer tool is premium: restraint and consistency, not embellishment.

## Density

**Dense, desktop-first, information-forward.** The layout shell has a fixed 248px sidebar and no responsive collapse — this product assumes a desktop viewport. Row heights in lists/tables (`IdeaRow` padding `13px 18px`), compact control heights (inputs 40px, buttons 38-44px, badges 22px), and small type sizes (11-13.5px for most UI chrome) all point to a dashboard built for someone who lives in it for hours, not a landing page optimized for glanceability.

## Complexity

Moderate-to-high domain complexity hidden behind a simple visual language: role-based access control (5 roles, route-level + fine-grained permission layer), a fully admin-configurable stage-gate workflow with dynamic evaluation questionnaires per stage, drag-and-drop Kanban, i18n (en/de), and multi-entity relationships (ideas ↔ employees ↔ managers ↔ departments ↔ stages ↔ pitch sessions). The visual system's job is to make this complexity legible — hence heavy reliance on Badge/StagePill/Priority as compact "state at a glance" primitives, and PageHeader/SectionCard as consistent framing so the domain complexity doesn't turn into visual complexity.

## Audience

Internal, authenticated, role-differentiated users only (no public marketing surface except the QR-code-driven public idea-submission and balance-check pages, which intentionally get their *own* lighter design treatment via `PublicSubmitScreen.module.css`, distinct from the internal app shell). No anonymous/public browsing of the main app.

## Overall design philosophy

1. **One ink, one canvas, one gray ramp.** Nearly everything derives from `#0A0A0A` (ink), `#F7F7F5` (canvas), `#FFFFFF` (surface), and the stock Tailwind gray scale (`#E5E7EB`/`#D1D5DB`/`#9CA3AF`/`#6B7280`/`#374151`/`#111827`). Saturated color is reserved for semantic meaning (status badges) and rare functional accents (file-type glyphs).
2. **Type carries hierarchy, not color.** Size, weight (400/450/500/600/700), and letter-spacing (tighter for headings, wider/uppercase for mono "eyebrow" labels) establish visual hierarchy before color does.
3. **Two typefaces, two jobs.** Inter for everything a human reads as language; JetBrains Mono exclusively for machine-ish data — IDs, counts, timestamps, eyebrow labels, priority meters. Never mix these jobs.
4. **Motion confirms, never delays.** Every animated transition (modal, dropdown, toast, page) exists to make a state change feel continuous, tuned short (≤0.6s) with the shared `[0.16, 1, 0.3, 1]` ease-out curve. Motion is skipped entirely under `prefers-reduced-motion`.
5. **Everything is a variant of a known primitive.** New UI is built by composing `Button`/`Badge`/`Field`/`SectionCard`/`Modal`/`Menu` from `src/shared/components/ui/index.tsx`, not by inventing new visual patterns. See [[01_DESIGN_CONSTITUTION]] and [[04_COMPONENT_LIBRARY]].

## Known architectural debt (read before extending)

This codebase is mid-migration: `src/components/*`, `src/store/*`, `src/lib/*`, `src/types/*`, `src/data/*`, `src/config/*` are **legacy duplicates** of the canonical `src/shared/components/*`, `src/shared/store/*`, `src/shared/lib/*`, `src/shared/types/*`, `src/shared/data/*`, `src/shared/config/*` trees. The two trees have already drifted (e.g. legacy `src/lib/animations.ts` modal duration `0.42s` vs canonical `src/shared/lib/animations.ts` `0.28s`). **Every document in this pack describes and cites only the `src/shared/*` tree as canonical.** Never imitate a pattern found only under a legacy path. See [[08_REACT_PATTERNS]] for the full callout.
