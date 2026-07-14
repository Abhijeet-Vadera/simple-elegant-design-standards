# Skill: Styling — Tailwind CSS + Shadcn/ui

Read this file before writing any styling or UI layout code.

---

## Source of truth for design tokens

**Before writing any styles, read these two files:**

```
src/styles/globals.css        — CSS custom properties (colours, shadows, gradients, radii)
src/lib/design-tokens.ts      — TypeScript constants for use in components
```

Never hardcode a colour, shadow, gradient, or border radius that isn't already defined there. If a design decision isn't captured yet, add it to both files first — then use it.

This keeps tokens in one place. When the design evolves mid-project, only those two files need updating.

---

## Tailwind v4

Config lives in CSS (`@theme` in `src/styles/globals.css`), not `tailwind.config.js`.

Always use `cn()` from `@/lib/utils` for conditional class merging:

```tsx
// ✅ correct
<div className={cn('base-class', isActive && 'text-primary', className)} />

// ❌ wrong — string concatenation breaks Tailwind's purge
<div className={`base-class ${isActive ? 'text-primary' : ''}`} />
```

Never use `style={{}}` inline styles. If something genuinely can't be expressed in Tailwind, add a CSS custom property to `globals.css` and document why.

---

## Shadcn/ui

Use Shadcn components as the base for all UI primitives — buttons, inputs, dialogs, dropdowns, etc. Do not rebuild these from scratch.

Extend via `className` + `cn()` only. Never edit files in `src/components/ui/` directly — they are Shadcn-managed and will be overwritten by the CLI.

```tsx
// ✅ extend via className
<Button className={cn('w-full', isLoading && 'opacity-70 cursor-not-allowed')}>
  Book Session
</Button>

// ✅ wrap when you always use it a certain way
function PrimaryActionButton({ children, ...props }: ButtonProps) {
  return (
    <Button size="lg" className={cn('w-full font-medium', props.className)} {...props}>
      {children}
    </Button>
  )
}

// ❌ never touch this
// src/components/ui/button.tsx
```

Check this list before building any UI element — if Shadcn has it, use it:
`Button` `Input` `Textarea` `Select` `Checkbox` `Switch`
`Dialog` `Sheet` `Popover` `Tooltip` `DropdownMenu`
`Card` `Badge` `Avatar` `Separator` `Skeleton`
`Table` `Tabs` `Accordion` `Alert` `AlertDialog`
`Form` `Label` `Toast` / `Sonner` `Progress` `ScrollArea`

If a component you need isn't installed yet, note it as a comment and ask — do not install unilaterally.

---

## Dark mode

Class-based strategy (Shadcn default). Always verify components in both modes. Use semantic tokens from `globals.css` — they adapt automatically. Only add `dark:` prefixes manually when a semantic token genuinely doesn't cover the case.

---

## Responsive design

Mobile-first always. Start with the mobile layout, add breakpoint prefixes for larger screens:

```tsx
// ✅ mobile first
<div className="flex flex-col gap-4 md:flex-row md:gap-6">

// ❌ desktop first (requires overriding)
<div className="flex flex-row gap-6 max-md:flex-col">
```

---

## Animation

Use Tailwind's built-in transitions for simple states. For branded animations (e.g. the live-indicator pulse), define them as named keyframes in `globals.css` and reference them via a Tailwind utility class — not inline styles.

Always respect reduced motion:

```tsx
<div className="motion-safe:animate-[fr-pulse_1.8s_infinite]">
```

---

## Focus Revolution design principles (apply to all styling)

This platform serves people with ADHD. These never change regardless of which tokens are current:

- **Calm, not stimulating** — avoid rapid animations, high-contrast flicker, or busy patterns
- **Progress-first** — surface positive indicators prominently; never use the error colour for non-error states
- **One primary action per screen** — secondary actions must be visually quieter (ghost or soft variant)
- **Minimum 44×44px touch targets** — non-negotiable on mobile
- **Orange = energy and momentum** — the primary accent is for CTAs, live indicators, and celebration; not for warnings
- **No red for normal states** — the error colour is reserved for form validation errors only
