/**
 * Focus Revolution — Design Tokens (TypeScript)
 *
 * Mirrors the CSS custom properties in src/styles/globals.css.
 * Use these constants anywhere you need a token value in JS/TS
 * (e.g. inline canvas drawing, dynamic style calculations).
 *
 * For regular component styling, prefer Tailwind utilities that
 * reference the CSS variables directly — only import from here
 * when you genuinely need the raw value in code.
 *
 * When the design evolves: update globals.css first, then sync here.
 */

// ─── Colours ─────────────────────────────────────────────────────────────────

export const colors = {
  // Orange — energy, momentum, CTAs, live indicators, celebration
  orange:      '#ED7309',
  orangeDark:  '#C25A05',
  orangeDim:   '#82400C',

  // Purple — depth, trust, body text, supporting UI
  ink:          '#312353',  // primary text, light mode
  purpleMid:    '#8A72CC',  // secondary text, soft labels
  purpleLight:  '#A99AD0',  // placeholders, hints
  purpleBlue:   '#5A6BCC',  // gradient start (avatar / progress)
  lavender:     '#AC8EFF',  // lavender avatar gradient

  // Surfaces
  surfaceLight: '#F6F3FC',  // soft chip/badge bg, light mode
  pale:         '#F0EBFB',  // icon tile bg, pale tint
  track:        '#EDE7F7',  // progress bar track, light mode
  surfaceDark:  '#1A1A1D',  // card bg, dark mode
  bgDark:       '#14101F',  // page bg, dark mode
  bgDarkGrad:   '#221A38',  // hero/timer gradient start, dark mode

  // Semantic
  error: '#E5484D',  // form validation errors ONLY
} as const

// ─── Gradients ───────────────────────────────────────────────────────────────

export const gradients = {
  orangeCta:      'linear-gradient(140deg, #ED7309, #C25A05)',
  orangeAvatar:   'linear-gradient(140deg, #ED7309, #82400C)',
  purpleBlue:     'linear-gradient(140deg, #5A6BCC, #8A72CC)',
  progress:       'linear-gradient(90deg,  #8A72CC, #ED7309)',
  darkTimer:      'linear-gradient(160deg, #221A38, #14101F)',
  blueAvatar:     'linear-gradient(140deg, #7186FF, #3E4A8C)',
  pinkAvatar:     'linear-gradient(140deg, #FE7587, #8C4049)',
  lavenderAvatar: 'linear-gradient(140deg, #AC8EFF, #5F4E8C)',
} as const

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const shadows = {
  cta:          '0 1px 2px rgba(49,35,83,.14), 0 8px 22px -8px rgba(237,115,9,.65), 0 0 20px rgba(237,115,9,.22)',
  ctaHover:     '0 2px 5px rgba(49,35,83,.16), 0 14px 30px -8px rgba(237,115,9,.8), 0 0 26px rgba(237,115,9,.3)',
  cardFeature:  '0 1px 2px rgba(49,35,83,.06), 0 18px 50px -24px rgba(49,35,83,.35)',
  cardStat:     '0 1px 2px rgba(49,35,83,.05), 0 6px 18px -12px rgba(49,35,83,.2)',
  iconTile:     '0 8px 18px -8px rgba(237,115,9,.5)',
  progressFill: '0 0 14px rgba(237,115,9,.4)',
} as const

// ─── Border radius ────────────────────────────────────────────────────────────

export const radius = {
  btn:      '14px',
  btnPill:  '999px',
  cardSm:   '18px',
  cardMd:   '20px',
  cardLg:   '24px',
  modal:    '26px',
  input:    '15px',
  tile:     '15px',
  badge:    '6px',
  chip:     '12px',
} as const

// ─── Typography ──────────────────────────────────────────────────────────────

export const fontFamily = {
  sans: '"Lexend", system-ui, sans-serif',
} as const

/**
 * Font weights used in the design system.
 * 400 = body, 500 = medium, 600 = semi-bold, 700 = bold, 800 = display
 */
export const fontWeight = {
  regular:    400,
  medium:     500,
  semibold:   600,
  bold:       700,
  extraBold:  800,
} as const
