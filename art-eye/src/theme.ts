// ART EYE design tokens — M.A.P-inspired rebrand.
// White ground, black text, thin black rules, generous whitespace.
// One geometric sans (Jost) set in caps with wide letter-spacing throughout.
// Fully monochrome: the former red accent now renders in ink.

export const colors = {
  bg: '#FFFFFF',
  ink: '#131211', // the single text colour — all type is black
  grey: '#9B9B9B', // secondary type (M.A.P-style grey) + input placeholders
  hairline: '#131211', // rules are thin and black now
  dim: '#E8E6E2', // image placeholders, inactive dots/tracks — quiet, not black
  red: '#131211', // former accent — monochrome now; key kept so styles resolve
  white: '#FFFFFF',
  scrim: 'rgba(19,18,17,0.28)',
};

// ── Typography system ───────────────────────────────────────────────────────
// One family, one voice: Montserrat (wide geometric grotesque) everywhere —
// every heading, label, caption, date, button and body block. Display and
// body copy render in caps with wide tracking, M.A.P-style: headings solid
// and wide, body/meta feather-light. The former serif/mono roles are kept
// as aliases so existing styles keep working while resolving to the single
// sans family.
export const fonts = {
  sansLight: 'Montserrat_300Light',
  sans: 'Montserrat_400Regular',
  sansMedium: 'Montserrat_400Regular',
  // Slimmed a step for the editorial look: headings sit at medium, never bold.
  sansSemi: 'Montserrat_500Medium',
  // Serif retired — editorial body copy is now light, wide-tracked caps.
  serif: 'Montserrat_300Light',
  serifMedium: 'Montserrat_400Regular',
  serifItalic: 'Montserrat_300Light',
  serifMediumItalic: 'Montserrat_400Regular',
  // "mono" role folded into the same family — the app is a one-font system.
  mono: 'Montserrat_400Regular',
  monoMedium: 'Montserrat_400Regular',
};

export const space = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  page: 20, // page gutter
};

// The single source of truth for the type scale. Every text colour here is ink.
// Caps + tracking are baked in so content stays as-is but renders M.A.P-style.
export const type = {
  // the ART EYE wordmark — solid medium-bold caps, wide letter-spacing
  wordmark: { fontFamily: fonts.sansSemi, fontSize: 22, letterSpacing: 6, color: colors.ink },
  artistCaps: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 2.6, color: colors.ink, textTransform: 'uppercase' },
  artistCapsLarge: { fontFamily: fonts.sansMedium, fontSize: 14, letterSpacing: 3.2, color: colors.white, textTransform: 'uppercase' },
  // exhibition titles, reflections, large headings: bold geometric caps
  serifTitle: { fontFamily: fonts.sansSemi, fontSize: 16, letterSpacing: 3, color: colors.ink, textTransform: 'uppercase' },
  serifHeading: { fontFamily: fonts.sansSemi, fontSize: 25, letterSpacing: 3.8, color: colors.ink, textTransform: 'uppercase' },
  serifHero: { fontFamily: fonts.sansSemi, fontSize: 25, letterSpacing: 3.8, color: colors.white, textTransform: 'uppercase' },
  serifBody: { fontFamily: fonts.sansLight, fontSize: 13, lineHeight: 25, letterSpacing: 2.6, color: colors.ink, textTransform: 'uppercase' },
  serifQuote: { fontFamily: fonts.sansLight, fontSize: 13, lineHeight: 24, letterSpacing: 2.6, color: colors.ink, textTransform: 'uppercase' },
  // dates, venues, labels, filters, buttons, tab bar
  mono: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1.6, color: colors.ink, textTransform: 'uppercase' },
  monoSmall: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.6, color: colors.ink, textTransform: 'uppercase' },
  monoLabel: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 2, color: colors.ink, textTransform: 'uppercase' },
  monoButton: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 2.2, color: colors.ink, textTransform: 'uppercase' },
} as const;

export const hairline = {
  borderBottomWidth: 1,
  borderBottomColor: colors.hairline,
};
