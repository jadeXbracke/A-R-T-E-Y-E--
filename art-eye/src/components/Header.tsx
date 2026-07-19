import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, space } from '../theme';
import { MonoSmall, Wordmark } from './Type';

/** App header: wordmark, hairline rule, optional back link. */
export function Header({
  back = false,
  tagline,
}: {
  back?: boolean;
  tagline?: string;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + space.s }]}>
      <View style={styles.row}>
        {back ? (
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <MonoSmall style={{ color: color.ink }}>← BACK</MonoSmall>
          </Pressable>
        ) : null}
        <View style={styles.mark}>
          <Wordmark>
            ART <MonoSmall style={styles.eye}>●</MonoSmall> EYE
          </Wordmark>
          {tagline ? <MonoSmall style={styles.tagline}>{tagline}</MonoSmall> : null}
        </View>
        {back ? <View style={styles.back} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: color.paper,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
    paddingBottom: space.m,
    paddingHorizontal: space.gutter,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  back: {
    width: 64,
  },
  mark: {
    flex: 1,
    alignItems: 'center',
  },
  eye: {
    color: color.red,
    fontSize: 11,
  },
  tagline: {
    color: color.grey,
    marginTop: 4,
    letterSpacing: 1.4,
  },
});
