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
// Two families, one fixed scale, applied across the whole app:
//   • Archivo (sans)     — every label, caption, date, button, nav and metadata
//   • Cormorant (serif)  — editorial display: titles, headings and body copy
// No italics anywhere. The former IBM Plex Mono role now maps onto Archivo so
// the app never renders a third family; the mono* aliases are kept so existing
// styles keep working while resolving to the sans faces.
export const fonts = {
  sans: 'Archivo_400Regular',
  sansMedium: 'Archivo_500Medium',
  sansSemi: 'Archivo_600SemiBold',
  serif: 'CormorantGaramond_400Regular',
  serifMedium: 'CormorantGaramond_500Medium',
  // Italics retired — these aliases resolve to the upright serif faces so any
  // former-italic usage renders as normal type.
  serifItalic: 'CormorantGaramond_400Regular',
  serifMediumItalic: 'CormorantGaramond_500Medium',
  // "mono" role folded into Archivo — the app is a two-font system now.
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

// The single source of truth for the type scale. Every text colour here is ink.
export const type = {
  // wordmark + artist names: letterspaced uppercase Archivo
  wordmark: { fontFamily: fonts.sansSemi, fontSize: 16, letterSpacing: 4, color: colors.ink },
  artistCaps: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 2.2, color: colors.ink },
  artistCapsLarge: { fontFamily: fonts.sansMedium, fontSize: 14, letterSpacing: 3, color: colors.white },
  // exhibition titles, reflections, large headings: Cormorant (upright)
  serifTitle: { fontFamily: fonts.serifMedium, fontSize: 21, color: colors.ink },
  serifHeading: { fontFamily: fonts.serifMedium, fontSize: 34, color: colors.ink },
  serifHero: { fontFamily: fonts.serifMedium, fontSize: 34, color: colors.white },
  serifBody: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 27, color: colors.ink },
  serifQuote: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 26, color: colors.ink },
  // dates, venues, labels, filters, buttons, tab bar: Archivo (sans)
  mono: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.4, color: colors.ink },
  monoSmall: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.6, color: colors.ink },
  monoLabel: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.6, color: colors.ink },
  monoButton: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.8, color: colors.ink },
} as const;

export const hairline = {
  borderBottomWidth: 1,
  borderBottomColor: colors.hairline,
};
