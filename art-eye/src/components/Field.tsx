import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { color, font, space } from '../theme';
import { MonoLabelMuted } from './Type';
import { TextLink } from './kit';

/**
 * Form field per the spec: mono uppercase label, square-edged input,
 * hairline underline — no rounded boxes.
 */
export function Field({
  label,
  serif = false,
  style,
  ...input
}: TextInputProps & { label: string; serif?: boolean }) {
  return (
    <View style={[styles.wrap, style]}>
      <MonoLabelMuted>{label}</MonoLabelMuted>
      <TextInput
        placeholderTextColor={color.grey}
        {...input}
        style={[styles.input, serif ? styles.serif : styles.mono, input.multiline && styles.multiline]}
      />
    </View>
  );
}

/** A row of underlined mono options acting as a radio group. */
export function OptionRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.wrap}>
      <MonoLabelMuted>{label}</MonoLabelMuted>
      <View style={styles.options}>
        {options.map((o) => (
          <TextLink
            key={o.value}
            label={o.label}
            active={value === o.value}
            muted={value !== o.value}
            onPress={() => onChange(o.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.l,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
    paddingVertical: 10,
    paddingHorizontal: 0,
    color: color.ink,
    borderRadius: 0,
  },
  mono: {
    fontFamily: font.mono,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  serif: {
    fontFamily: font.serifItalic,
    fontSize: 18,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: space.l,
    rowGap: space.m,
    marginTop: space.m,
  },
});
