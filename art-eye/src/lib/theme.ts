/**
 * ART EYE design tokens — extracted from art-eye prototype v2.
 * White paper, ink text, one red accent. Hairlines and square corners only.
 */

export const colors = {
  paper: '#FFFFFF',
  ink: '#131211',
  grey: '#7B766D',
  hairline: '#E4E1DB',
  accent: '#C22F1E',
} as const;

export const fonts = {
  // Archivo — wordmark + artist names, letterspaced uppercase
  sans: 'Archivo_400Regular',
  sansMedium: 'Archivo_500Medium',
  sansSemiBold: 'Archivo_600SemiBold',
  // Cormorant Garamond — exhibition titles, reflections, large headings
  serif: 'CormorantGaramond_500Medium',
  serifItalic: 'CormorantGaramond_500Medium_Italic',
  serifSemiBoldItalic: 'CormorantGaramond_600SemiBold_Italic',
  // IBM Plex Mono — dates, venues, labels, filters, buttons, tab bar
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;

export const type = {
  // Mono labels/dates: small, uppercase, letterspaced
  mono: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.2, color: colors.grey },
  monoInk: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.2, color: colors.ink },
  monoSmall: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.grey },
  // Archivo caps: artist names
  caps: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 2.2, color: colors.ink },
  capsLarge: { fontFamily: fonts.sansMedium, fontSize: 14, letterSpacing: 3, color: colors.ink },
  // Serif: titles and headings
  serifTitle: { fontFamily: fonts.serifItalic, fontSize: 22, color: colors.ink },
  serifHeading: { fontFamily: fonts.serif, fontSize: 32, color: colors.ink },
  serifLarge: { fontFamily: fonts.serifItalic, fontSize: 34, color: colors.ink },
  serifBody: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 26, color: colors.ink },
  serifItalicBody: { fontFamily: fonts.serifItalic, fontSize: 17, lineHeight: 25, color: colors.ink },
} as const;

export const space = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  screenX: 20,
} as const;

export const hairline = {
  borderBottomWidth: 1,
  borderBottomColor: colors.hairline,
} as const;
