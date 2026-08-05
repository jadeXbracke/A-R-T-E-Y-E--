// ART EYE design tokens — extracted from the prototype visual spec.
// White ground, black text, hairline rules, one red accent (graphic only).
// Square corners everywhere; the only circles are the dots.

export const colors = {
  bg: '#FFFFFF',
  ink: '#131211', // the single text colour — all type is black
  dim: '#131211', // merged-in screens use this for secondary text; house rule says black
  grey: '#7B766D', // retained for input placeholders + graphic borders only
  hairline: '#E4E1DB',
  red: '#C22F1E', // graphic accent: active underline, dots, bars
  white: '#FFFFFF',
  scrim: 'rgba(19,18,17,0.28)',
};

// ── Typography system ───────────────────────────────────────────────────────
// One family across the whole app: ARCHIVO — a grotesque used the M.A.P
// (mapltd.com) way: bold UPPERCASE titles, regular letter-spaced uppercase
// labels, black on white, thin rules. Every former role (sans / serif / mono)
// resolves to an Archivo weight. No italics anywhere.
export const fonts = {
  sansLight: 'Archivo_400Regular',
  sans: 'Archivo_400Regular',
  sansMedium: 'Archivo_500Medium',
  sansSemi: 'Archivo_600SemiBold',
  // "serif" role — body stays regular; titles/headings go bold (M.A.P style).
  serif: 'Archivo_400Regular',
  serifMedium: 'Archivo_700Bold',
  serifItalic: 'Archivo_400Regular',
  serifMediumItalic: 'Archivo_700Bold',
  // "mono" role (labels, dates, filters, buttons, tab bar) — Archivo.
  mono: 'Archivo_400Regular',
  monoMedium: 'Archivo_500Medium',
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

// The single source of truth for the type scale. M.A.P house style: bold
// UPPERCASE titles, letter-spaced uppercase labels, regular body. All ink.
export const type = {
  wordmark: { fontFamily: fonts.sansMedium, fontSize: 16, letterSpacing: 4, color: colors.ink },
  artistCaps: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 2.2, color: colors.ink, textTransform: 'uppercase' },
  artistCapsLarge: { fontFamily: fonts.sansMedium, fontSize: 14, letterSpacing: 3, color: colors.white, textTransform: 'uppercase' },
  // exhibition/venue titles and page headings: Archivo Bold, UPPERCASE
  serifTitle: { fontFamily: fonts.serifMedium, fontSize: 20, letterSpacing: 0.6, lineHeight: 24, color: colors.ink, textTransform: 'uppercase' },
  serifHeading: { fontFamily: fonts.serifMedium, fontSize: 28, letterSpacing: 0.6, lineHeight: 32, color: colors.ink, textTransform: 'uppercase' },
  serifHero: { fontFamily: fonts.serifMedium, fontSize: 28, letterSpacing: 0.6, lineHeight: 32, color: colors.white, textTransform: 'uppercase' },
  // body / reflections: regular Archivo, sentence case for readability
  serifBody: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 24, color: colors.ink },
  serifQuote: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 24, color: colors.ink },
  // labels, dates, filters, buttons, tab bar: letter-spaced UPPERCASE Archivo
  mono: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1, color: colors.ink, textTransform: 'uppercase' },
  monoSmall: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.4, color: colors.ink, textTransform: 'uppercase' },
  monoLabel: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.8, color: colors.ink, textTransform: 'uppercase' },
  monoButton: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 2, color: colors.ink, textTransform: 'uppercase' },
} as const;

export const hairline = {
  borderBottomWidth: 1,
  borderBottomColor: colors.hairline,
};
