// MARK design tokens — monochrome, editorial, circular.
// Black / white / ecru only, plus one soft warm tint. Circles and rings are
// the single graphic motif: open ring = to do, closed disc = a mark set.
// Wide-tracked headers, lots of negative space. Timeless over trendy.

export type Scheme = 'light' | 'dark';

export interface Palette {
  bg: string;       // page ground (warm off-white / soft near-black)
  surface: string;  // cards, inputs
  ink: string;      // the single text colour
  dim: string;      // secondary text
  hairline: string; // thin rules
  tint: string;     // the one soft accent (graphic only, never text)
  scrim: string;
}

export const palettes: Record<Scheme, Palette> = {
  light: {
    bg: '#FAF7F1',
    surface: '#FFFFFF',
    ink: '#141311',
    dim: '#7B766D',
    hairline: '#E6E2DA',
    tint: '#A79B89',
    scrim: 'rgba(20,19,17,0.28)',
  },
  dark: {
    bg: '#161512',
    surface: '#1E1C19',
    ink: '#F1EDE5',
    dim: '#948F85',
    hairline: '#2C2925',
    tint: '#8A8073',
    scrim: 'rgba(0,0,0,0.4)',
  },
};

// ── Typography ──────────────────────────────────────────────────────────────
// Two voices: Cormorant Garamond (fine serif) for headings and numerals,
// Archivo for letter-spaced caps labels and body. No italics, no bold shouting.
export const fonts = {
  serif: 'CormorantGaramond_500Medium',
  serifLight: 'CormorantGaramond_400Regular',
  sans: 'Archivo_400Regular',
  sansMedium: 'Archivo_500Medium',
};

export const space = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  page: 24,
};

// Type scale without colours — screens colour from the active palette.
export const type = {
  wordmark: { fontFamily: fonts.sansMedium, fontSize: 15, letterSpacing: 7 },
  heading: { fontFamily: fonts.serif, fontSize: 30, letterSpacing: 1, lineHeight: 38 },
  title: { fontFamily: fonts.serif, fontSize: 21, letterSpacing: 0.5, lineHeight: 28 },
  numeral: { fontFamily: fonts.serifLight, fontSize: 40, letterSpacing: 1 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23 },
  label: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 2.4, textTransform: 'uppercase' as const },
  small: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18 },
};
