// MARK design tokens — monochrome, editorial, circular.
// Pure white ground, black ink, thin hairlines, circles as the only motif.

export type Scheme = 'light' | 'dark';

export interface Palette {
  bg: string;       // page ground (white / near-black)
  surface: string;  // cards, inputs
  inkDeep: string;  // headings — the deepest step
  ink: string;      // primary text
  dim: string;      // secondary text
  hairline: string; // thin rules
  tint: string;     // neutral fill for progress discs (graphic only)
  scrim: string;
}

export const palettes: Record<Scheme, Palette> = {
  light: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    inkDeep: '#050504',
    ink: '#1B1A17',
    dim: '#98938A',
    hairline: '#E4E1DB',
    tint: '#DEDCD7',
    scrim: 'rgba(19,18,17,0.28)',
  },
  dark: {
    bg: '#131211',
    surface: '#1B1A18',
    inkDeep: '#FFFFFF',
    ink: '#E8E5DF',
    dim: '#7C776F',
    hairline: '#2B2925',
    tint: '#3A3833',
    scrim: 'rgba(0,0,0,0.4)',
  },
};

// ── Typography ──────────────────────────────────────────────────────────────
// ONE typeface, ONE weight, ONE case: Archivo Medium, uppercase throughout.
// Hierarchy is carried by size, letterspacing and colour depth (inkDeep,
// then ink, then dim), never by mixing weights, families or cases: each of
// those reads as a second typeface and breaks the house style.
const FACE = 'Archivo_500Medium';

export const fonts = {
  sans: FACE,
  // Kept as aliases so every call site resolves to the single face.
  display: FACE,
  sansMedium: FACE,
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
  wordmark: { fontFamily: FACE, fontSize: 15, letterSpacing: 7 },
  heading: { fontFamily: FACE, fontSize: 25, letterSpacing: 3.4, lineHeight: 34, textTransform: 'uppercase' as const },
  title: { fontFamily: FACE, fontSize: 17, letterSpacing: 2, lineHeight: 24, textTransform: 'uppercase' as const },
  numeral: { fontFamily: FACE, fontSize: 38, letterSpacing: 1.5 },
  body: { fontFamily: FACE, fontSize: 13.5, letterSpacing: 0.8, lineHeight: 22, textTransform: 'uppercase' as const },
  // Entity names in lists (habits, log rows). Same letter-spaced caps voice
  // as the labels — sentence case next to caps reads as a second typeface.
  item: { fontFamily: FACE, fontSize: 13, letterSpacing: 1.6, lineHeight: 20, textTransform: 'uppercase' as const },
  label: { fontFamily: FACE, fontSize: 10, letterSpacing: 2.4, textTransform: 'uppercase' as const },
  small: { fontFamily: FACE, fontSize: 10.5, letterSpacing: 0.8, lineHeight: 17, textTransform: 'uppercase' as const },
};
