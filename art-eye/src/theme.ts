// ART EYE design tokens — extracted from the prototype visual spec.
// White ground, black text, hairline rules, one red accent (graphic only).
// Square corners everywhere; the only circles are the dots.

export const colors = {
  bg: '#FFFFFF',
  ink: '#131211', // the single text colour — all type is black
  grey: '#7B766D', // retained for input placeholders + graphic borders only
  hairline: '#E4E1DB',
  red: '#C22F1E', // graphic accent: active underline, dots, bars
  white: '#FFFFFF',
  scrim: 'rgba(19,18,17,0.28)',
};

// ── Typography system ───────────────────────────────────────────────────────
// One family across the whole app: JOST — a geometric, Futura-style sans that
// matches the thin, airy, wide-tracked ARTEYE wordmark (CARELLI-inspired).
// Every former role (sans / serif / mono) now resolves to a Jost weight, so the
// app and the logo read as one system. Big headings use the Light weight to
// echo the logo's hairline strokes. No italics anywhere.
export const fonts = {
  sansLight: 'Jost_300Light',
  sans: 'Jost_400Regular',
  sansMedium: 'Jost_500Medium',
  sansSemi: 'Jost_600SemiBold',
  // "serif" role (titles, headings, body) — now Jost.
  serif: 'Jost_400Regular',
  serifMedium: 'Jost_400Regular',
  serifItalic: 'Jost_400Regular',
  serifMediumItalic: 'Jost_400Regular',
  // "mono" role (labels, dates, filters, buttons, tab bar) — now Jost.
  mono: 'Jost_400Regular',
  monoMedium: 'Jost_500Medium',
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
export const type = {
  // the ARTEYE wordmark — thin hairline weight, wide letter-spacing
  wordmark: { fontFamily: fonts.sansLight, fontSize: 22, letterSpacing: 10, color: colors.ink },
  artistCaps: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 2.2, color: colors.ink },
  artistCapsLarge: { fontFamily: fonts.sansMedium, fontSize: 14, letterSpacing: 3, color: colors.white },
  // exhibition/venue titles: Jost regular; big page headings go light + airy
  serifTitle: { fontFamily: fonts.serifMedium, fontSize: 21, color: colors.ink },
  serifHeading: { fontFamily: fonts.sansLight, fontSize: 34, letterSpacing: 0.5, color: colors.ink },
  serifHero: { fontFamily: fonts.sansLight, fontSize: 34, letterSpacing: 0.5, color: colors.white },
  serifBody: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 27, color: colors.ink },
  serifQuote: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 26, color: colors.ink },
  // dates, venues, labels, filters, buttons, tab bar: Jost
  mono: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.4, color: colors.ink },
  monoSmall: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.6, color: colors.ink },
  monoLabel: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.6, color: colors.ink },
  monoButton: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.8, color: colors.ink },
} as const;

export const hairline = {
  borderBottomWidth: 1,
  borderBottomColor: colors.hairline,
};
