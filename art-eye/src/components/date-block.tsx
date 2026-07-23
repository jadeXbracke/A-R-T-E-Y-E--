import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { dayOfMonth, monthAbbr } from '../lib/dates';
import { colors, fonts } from '../theme';

// Muted, editorial block tones — chromatic (not grey) so the tiles read as the
// reference's coloured date blocks, while the date itself stays black to match
// the app's typography system. Assigned per item by a stable hash so a given
// show/fair always gets the same colour.
const BLOCK_COLORS = ['#E6E1D6', '#D8CDBB', '#C8CEBC', '#BEC8CC', '#E4CBB6', '#CFBFC7'];

function colorFor(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return BLOCK_COLORS[h % BLOCK_COLORS.length];
}

/**
 * A calendar-style tile: a coloured block with the month over the day, used in
 * list rows in place of an empty thumbnail (and for fairs, which have no image).
 */
export function DateBlock({
  date,
  seed,
  width,
  height,
  style,
}: {
  date: string;
  seed?: string;
  width?: number;
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        styles.block,
        { backgroundColor: colorFor(seed ?? date) },
        width != null && height != null ? { width, height } : null,
        style,
      ]}
    >
      <Text style={styles.month}>{monthAbbr(date)}</Text>
      <Text style={styles.day}>{dayOfMonth(date)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { alignItems: 'center', justifyContent: 'center' },
  month: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.ink,
    marginBottom: 2,
  },
  day: {
    fontFamily: fonts.sansLight,
    fontSize: 34,
    letterSpacing: 1,
    color: colors.ink,
  },
});
