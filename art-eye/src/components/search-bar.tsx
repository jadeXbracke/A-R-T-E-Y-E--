import { router } from 'expo-router';
import React from 'react';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts } from '../theme';
import { Lift } from './ui';

/** Prominent search entry — a full-width bar that opens the search screen. */
export function SearchBar({
  label = 'SEARCH — ARTISTS, SHOWS, VENUES',
  style,
}: {
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Lift
      style={StyleSheet.flatten([styles.bar, style])}
      onPress={() => router.push('/search')}
    >
      <Text style={styles.glyph}>⌕</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Lift>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  glyph: {
    fontSize: 17,
    color: colors.ink,
    lineHeight: 20,
  },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.ink,
    flexShrink: 1,
  },
});
