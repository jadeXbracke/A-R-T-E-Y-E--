import { Image } from 'expo-image';
import React from 'react';
import { Text, View } from 'react-native';
import { colors, fonts } from '../theme';

/**
 * Round profile picture. Falls back to a monogram in a hairline circle when
 * no photo is set, so rows keep their rhythm either way.
 */
export function Avatar({
  name,
  uri,
  size = 36,
}: {
  name: string;
  uri?: string | null;
  size?: number;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.dim }}
        contentFit="cover"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: Math.max(9, size * 0.3),
          letterSpacing: 1,
          color: colors.ink,
        }}
      >
        {initials || '?'}
      </Text>
    </View>
  );
}
