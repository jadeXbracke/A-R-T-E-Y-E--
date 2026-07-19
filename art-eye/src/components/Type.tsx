import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { color, type } from '../theme';

function make(base: TextStyle, defaults?: Partial<TextProps>) {
  return function Typo({ style, ...rest }: TextProps) {
    return (
      <Text
        {...defaults}
        {...rest}
        style={[{ color: color.ink }, base, style]}
      />
    );
  };
}

/** Letterspaced uppercase Archivo — wordmark, artist names. */
export const Caps = make(type.artistCaps as TextStyle);
export const Wordmark = make(type.wordmark as TextStyle);

/** Italic serif — exhibition titles, headings, reflections. */
export const SerifItalic = make(type.titleSerif as TextStyle);
export const HeadingL = make(type.headingL as TextStyle);
export const HeadingXL = make(type.headingXL as TextStyle);
export const Body = make(type.body as TextStyle);
export const BodyItalic = make(type.bodyItalic as TextStyle);

/** IBM Plex Mono — dates, venues, labels, filters, buttons, tab bar. */
export const Mono = make(type.mono as TextStyle);
export const MonoSmall = make(type.monoSmall as TextStyle);
export const MonoLabel = make(type.monoLabel as TextStyle);

export function MonoMuted(props: TextProps) {
  return <Mono {...props} style={[{ color: color.grey }, props.style]} />;
}

export function MonoLabelMuted(props: TextProps) {
  return <MonoLabel {...props} style={[{ color: color.grey }, props.style]} />;
}
