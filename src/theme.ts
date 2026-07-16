/**
 * ART EYE — design tokens, extracted from art-eye-prototype-v2.
 *
 * The visual system: pure white ground, ink text, one red accent used only
 * for the "seen" dot, rating dots, opening-night tags and active underlines.
 * Hairline rules and square corners throughout — zero border-radius except
 * the circular dots. No shadows, no pills, no chips.
 */
import { StyleSheet } from 'react-native';

export const color = {
  white: '#FFFFFF',
  ink: '#131211',
  grey: '#7B766D',
  hairline: '#E4E1DB',
  red: '#C22F1E',
} as const;

export const font = {
  /** Wordmark + artist names, letterspaced uppercase */
  caps: 'Archivo_500Medium',
  capsBold: 'Archivo_700Bold',
  /** Exhibition titles, reflections, large headings */
  serif: 'CormorantGaramond_500Medium',
  serifItalic: 'CormorantGaramond_500Medium_Italic',
  serifLightItalic: 'CormorantGaramond_400Regular_Italic',
  /** Dates, venues, labels, filters, buttons, tab bar */
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;

export const type = {
  /** Large serif headings — "On now", profile name */
  displaySerif: { fontFamily: font.serif, fontSize: 34, lineHeight: 38, color: color.ink },
  /** Hero exhibition title over imagery */
  heroTitle: { fontFamily: font.serifItalic, fontSize: 34, lineHeight: 38, color: color.white },
  /** Exhibition title in lists */
  titleSerif: { fontFamily: font.serifItalic, fontSize: 21, lineHeight: 25, color: color.ink },
  /** Body copy / descriptions */
  bodySerif: { fontFamily: font.serif, fontSize: 17, lineHeight: 25, color: color.ink },
  /** Reflections, hints — italic serif */
  noteSerif: { fontFamily: font.serifItalic, fontSize: 17, lineHeight: 24, color: color.ink },
  /** Artist names — letterspaced caps */
  artistCaps: {
    fontFamily: font.caps,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: color.ink,
  },
  /** Mono meta — dates, venues */
  mono: { fontFamily: font.mono, fontSize: 11, lineHeight: 16, letterSpacing: 0.5, color: color.grey },
  /** Mono labels — section kickers, form labels, uppercase */
  monoLabel: {
    fontFamily: font.mono,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: color.grey,
  },
  /** Mono interactive — filters, toggles, buttons */
  monoAction: {
    fontFamily: font.monoMedium,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: color.ink,
  },
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

export const hairline = StyleSheet.hairlineWidth > 0 ? StyleSheet.hairlineWidth : 1;

/** absolute-fill helper (RN 0.86 dropped StyleSheet.absoluteFillObject) */
export const fill = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

export const rule = {
  hairline: { borderBottomWidth: hairline, borderBottomColor: color.hairline },
  inkBorder: { borderWidth: 1, borderColor: color.ink },
} as const;

/** Muted tonal plates used when an exhibition has no press image. */
export const plateTones = [
  '#8C8578', '#6E7266', '#9A8F7F', '#5F6068', '#7D6E5F',
  '#75797B', '#8A7A6A', '#676E62', '#8F8577', '#6B6560',
  '#7E7468', '#5D6462', '#948A7C',
] as const;

export function plateTone(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return plateTones[h % plateTones.length];
}
