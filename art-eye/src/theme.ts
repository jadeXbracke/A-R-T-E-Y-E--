/**
 * ART EYE — design tokens, extracted from art-eye-prototype-v2.
 *
 * The system: pure white ground, ink text, a single red accent used only
 * for the "seen" dot, rating dots, opening-night tags and active underlines.
 * Hairline rules and square corners throughout — zero border radius except
 * the circular dots.
 */
export const color = {
  paper: '#FFFFFF',
  ink: '#131211',
  grey: '#7B766D',
  hairline: '#E4E1DB',
  red: '#C22F1E',
  // ink over imagery
  overlayInk: 'rgba(19, 18, 17, 0.35)',
  paperOnImage: '#FFFFFF',
} as const;

export const font = {
  /** Wordmark + artist names — letterspaced uppercase */
  caps: 'Archivo_600SemiBold',
  capsMedium: 'Archivo_500Medium',
  /** Exhibition titles, reflections, large headings — italic serif */
  serif: 'CormorantGaramond_500Medium',
  serifItalic: 'CormorantGaramond_500Medium_Italic',
  serifSemiItalic: 'CormorantGaramond_600SemiBold_Italic',
  /** Dates, venues, labels, filters, buttons, tab bar */
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;

export const type = {
  wordmark: { fontFamily: font.caps, fontSize: 15, letterSpacing: 4 },
  kicker: { fontFamily: font.mono, fontSize: 10, letterSpacing: 2 },
  headingXL: { fontFamily: font.serifItalic, fontSize: 34, lineHeight: 38 },
  headingL: { fontFamily: font.serifItalic, fontSize: 28, lineHeight: 32 },
  titleSerif: { fontFamily: font.serifItalic, fontSize: 20, lineHeight: 24 },
  artistCaps: { fontFamily: font.capsMedium, fontSize: 11, letterSpacing: 1.8 },
  mono: { fontFamily: font.mono, fontSize: 11, letterSpacing: 0.4 },
  monoSmall: { fontFamily: font.mono, fontSize: 10, letterSpacing: 0.6 },
  monoLabel: { fontFamily: font.monoMedium, fontSize: 10, letterSpacing: 1.6 },
  body: { fontFamily: font.serif, fontSize: 17, lineHeight: 25 },
  bodyItalic: { fontFamily: font.serifItalic, fontSize: 17, lineHeight: 25 },
} as const;

export const space = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  /** page gutter */
  gutter: 20,
} as const;

export const hairline = {
  borderBottomWidth: 1,
  borderBottomColor: color.hairline,
} as const;

/** dots — the only circles in the app */
export const dot = {
  seen: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.red },
  ratingSize: 16,
} as const;
