// MARK design tokens — monochrome, editorial, circular.
// Pure white ground, black ink, thin hairlines — the ART EYE house look —
// with circles and rings as the single graphic motif: open ring = to do,
// closed disc = a mark set. Wide-tracked caps, lots of negative space.

export type Scheme = 'light' | 'dark';

export interface Palette {
  bg: string;       // page ground (white / near-black)
  surface: string;  // cards, inputs
  ink: string;      // the single text colour
  dim: string;      // secondary text
  hairline: string; // thin rules
  tint: string;     // neutral fill for progress discs (graphic only)
  scrim: string;
}

export const palettes: Record<Scheme, Palette> = {
  light: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    ink: '#131211',
    dim: '#7B766D',
    hairline: '#E4E1DB',
    tint: '#DEDCD7',
    scrim: 'rgba(19,18,17,0.28)',
  },
  dark: {
    bg: '#131211',
    surface: '#1B1A18',
    ink: '#F4F3F0',
    dim: '#8F8B84',
    hairline: '#2B2925',
    tint: '#3A3833',
    scrim: 'rgba(0,0,0,0.4)',
  },
};

// ── Typography ──────────────────────────────────────────────────────────────
// One family across the whole app, the ART EYE way: Archivo. Light, wide,
// UPPERCASE headings; letter-spaced caps labels; regular body. No italics.
export const fonts = {
  display: 'Archivo_300Light',
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
  heading: { fontFamily: fonts.display, fontSize: 26, letterSpacing: 3, lineHeight: 34, textTransform: 'uppercase' as const },
  title: { fontFamily: fonts.display, fontSize: 18, letterSpacing: 2, lineHeight: 24, textTransform: 'uppercase' as const },
  numeral: { fontFamily: fonts.display, fontSize: 40, letterSpacing: 2 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23 },
  label: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 2.4, textTransform: 'uppercase' as const },
  small: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18 },
};
