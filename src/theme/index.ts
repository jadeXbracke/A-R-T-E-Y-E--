/**
 * ART EYE design tokens — extracted from art-eye-prototype-v2.
 *
 * The system is white, hairline, square-edged and mono-labeled.
 * A single red accent is reserved for: the "seen" dot, rating dots,
 * opening-night tags and active-state underlines. Nothing else is red.
 */

export const colors = {
  bg: '#FFFFFF',
  ink: '#131211',
  grey: '#7B766D',
  hairline: '#E4E1DB',
  red: '#C22F1E',
  // overlay scrim used on full-bleed cover images
  scrim: 'rgba(19, 18, 17, 0.30)',
} as const;

/**
 * Font families. Keys map to the exact names registered with expo-font
 * in src/theme/fonts.ts.
 *
 * - Archivo        → wordmark + artist names in letterspaced uppercase
 * - Cormorant      → exhibition titles, reflections, large headings (italic)
 * - Mono (IBM Plex)→ all dates, venues, labels, filters, buttons, tab bar
 */
export const fonts = {
  archivo: 'Archivo_500Medium',
  archivoSemi: 'Archivo_600SemiBold',
  serif: 'CormorantGaramond_500Medium',
  serifItalic: 'CormorantGaramond_500Medium_Italic',
  serifItalicSemi: 'CormorantGaramond_600SemiBold_Italic',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;

export const type = {
  // IBM Plex Mono — labels, dates, venues, filters, buttons
  monoLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.grey,
    textTransform: 'uppercase' as const,
  },
  monoSmall: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.4,
    color: colors.grey,
  },
  monoBody: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 0.4,
    color: colors.ink,
  },
  monoButton: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
  // Archivo — letterspaced caps artist names + wordmark
  capsArtist: {
    fontFamily: fonts.archivoSemi,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.ink,
    textTransform: 'uppercase' as const,
  },
  capsArtistLarge: {
    fontFamily: fonts.archivoSemi,
    fontSize: 14,
    letterSpacing: 2.4,
    color: colors.bg,
    textTransform: 'uppercase' as const,
  },
  wordmark: {
    fontFamily: fonts.archivoSemi,
    fontSize: 16,
    letterSpacing: 4,
    color: colors.ink,
  },
  // Cormorant Garamond italic — titles, headings, reflections
  serifTitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 21,
    color: colors.ink,
  },
  serifTitleLarge: {
    fontFamily: fonts.serifItalic,
    fontSize: 30,
    color: colors.ink,
  },
  serifHeading: {
    fontFamily: fonts.serifItalic,
    fontSize: 34,
    lineHeight: 38,
    color: colors.ink,
  },
  serifBody: {
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 26,
    color: colors.ink,
  },
  serifQuote: {
    fontFamily: fonts.serifItalic,
    fontSize: 17,
    lineHeight: 25,
    color: colors.ink,
  },
} as const;

export const space = {
  xs: 4,
  s: 8,
  m: 12,
  l: 20,
  xl: 28,
  xxl: 40,
} as const;

/** Page side padding — everything aligns to this rail. */
export const PAGE_PAD = 20;

/** All rules are true hairlines. Corners are square everywhere: radius 0. */
export const hairline = {
  borderBottomWidth: 1,
  borderBottomColor: colors.hairline,
} as const;

export const inkBorder = {
  borderWidth: 1,
  borderColor: colors.ink,
} as const;

/** Circular dots are the ONLY curved shape in the app. */
export const dot = (size: number, filled: boolean) =>
  ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: filled ? colors.red : 'transparent',
    borderWidth: filled ? 0 : 1,
    borderColor: colors.red,
  }) as const;
