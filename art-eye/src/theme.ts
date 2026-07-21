// ART EYE design tokens — extracted from the prototype visual spec.
// White ground, ink text, warm grey, hairline rules, one red accent.
// Square corners everywhere; the only circles are the dots.

export const colors = {
  bg: '#FFFFFF',
  ink: '#131211',
  grey: '#7B766D',
  hairline: '#E4E1DB',
  red: '#C22F1E',
  white: '#FFFFFF',
  scrim: 'rgba(19,18,17,0.28)',
};

export const fonts = {
  sans: 'Archivo_400Regular',
  sansMedium: 'Archivo_500Medium',
  sansSemi: 'Archivo_600SemiBold',
  serif: 'CormorantGaramond_400Regular',
  // Italics retired by owner request — these aliases now resolve to the
  // upright faces so every former-italic usage renders as normal type.
  serifItalic: 'CormorantGaramond_400Regular',
  serifMedium: 'CormorantGaramond_500Medium',
  serifMediumItalic: 'CormorantGaramond_500Medium',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
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

export const type = {
  // wordmark + artist names: letterspaced uppercase Archivo
  wordmark: { fontFamily: fonts.sansSemi, fontSize: 16, letterSpacing: 4, color: colors.ink },
  artistCaps: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 2.2, color: colors.ink },
  artistCapsLarge: { fontFamily: fonts.sansMedium, fontSize: 14, letterSpacing: 3, color: colors.white },
  // exhibition titles, reflections, large headings: Cormorant italic
  serifTitle: { fontFamily: fonts.serifMedium, fontSize: 21, color: colors.ink },
  serifHeading: { fontFamily: fonts.serifMedium, fontSize: 34, color: colors.ink },
  serifHero: { fontFamily: fonts.serifMedium, fontSize: 34, color: colors.white },
  serifBody: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 27, color: colors.ink },
  serifQuote: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 26, color: colors.ink },
  // dates, venues, labels, filters, buttons, tab bar: IBM Plex Mono
  mono: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.4, color: colors.ink },
  monoSmall: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.6, color: colors.grey },
  monoLabel: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.6, color: colors.grey },
  monoButton: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.8, color: colors.ink },
} as const;

export const hairline = {
  borderBottomWidth: 1,
  borderBottomColor: colors.hairline,
};
