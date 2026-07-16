import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dateRange, openingTag } from '../lib/format';
import type { Exhibition } from '../lib/types';
import { colors, type } from '../theme';
import { Hairline, SeenDot } from './ui';

/**
 * Agenda list row: thumbnail (with red seen-dot), mono date line,
 * italic serif title, caps artist, mono venue.
 */
export function ExhibitionRow({
  exhibition,
  seen,
}: {
  exhibition: Exhibition;
  seen?: boolean;
}) {
  const router = useRouter();
  const opening = openingTag(exhibition);
  return (
    <Pressable
      onPress={() => router.push(`/exhibition/${exhibition.id}`)}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      <View style={styles.row}>
        <View>
          <Image
            source={exhibition.image_url ?? undefined}
            style={styles.thumb}
            contentFit="cover"
            transition={200}
          />
          {seen ? (
            <View style={styles.seenDot}>
              <SeenDot />
            </View>
          ) : null}
        </View>
        <View style={styles.rowBody}>
          <Text style={type.monoSmall}>{dateRange(exhibition)}</Text>
          {opening ? (
            <Text style={[type.monoSmall, { color: colors.red, marginTop: 2 }]}>
              {opening}
            </Text>
          ) : null}
          <Text style={[type.serifTitle, styles.rowTitle]} numberOfLines={2}>
            {exhibition.title}
          </Text>
          <Text style={[type.capsArtist, { fontSize: 11 }]} numberOfLines={1}>
            {exhibition.artists}
          </Text>
          <Text style={[type.monoSmall, { marginTop: 6 }]} numberOfLines={1}>
            {exhibition.venue?.name?.toUpperCase()}
          </Text>
        </View>
      </View>
      <Hairline />
    </Pressable>
  );
}

/** 2-column grid cell: image with caption beneath. */
export function ExhibitionCell({
  exhibition,
  seen,
}: {
  exhibition: Exhibition;
  seen?: boolean;
}) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/exhibition/${exhibition.id}`)}
      style={({ pressed }) => [styles.cell, pressed && { opacity: 0.7 }]}
    >
      <View>
        <Image
          source={exhibition.image_url ?? undefined}
          style={styles.cellImage}
          contentFit="cover"
          transition={200}
        />
        {seen ? (
          <View style={styles.seenDot}>
            <SeenDot />
          </View>
        ) : null}
      </View>
      <Text style={[type.monoSmall, { marginTop: 8 }]}>{dateRange(exhibition)}</Text>
      <Text style={[type.serifTitle, { fontSize: 17, marginTop: 2 }]} numberOfLines={2}>
        {exhibition.title}
      </Text>
      <Text style={[type.monoSmall, { marginTop: 2 }]} numberOfLines={1}>
        {exhibition.venue?.name?.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 18,
    gap: 16,
  },
  thumb: {
    width: 92,
    height: 115,
    backgroundColor: colors.hairline,
  },
  seenDot: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  rowBody: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTitle: {
    marginTop: 4,
    marginBottom: 4,
  },
  cell: {
    flex: 1,
    marginBottom: 28,
  },
  cellImage: {
    width: '100%',
    aspectRatio: 0.8,
    backgroundColor: colors.hairline,
  },
});
