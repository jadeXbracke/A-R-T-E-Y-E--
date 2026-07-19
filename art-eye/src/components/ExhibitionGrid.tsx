import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { imageSource } from '../data/placeholders';
import { dateRange } from '../lib/format';
import { color, space } from '../theme';
import type { Exhibition } from '../types';
import { Caps, MonoSmall, SerifItalic } from './Type';
import { SeenDot } from './kit';

const GAP = 1; // hairline gaps between grid images

/** Two-column image grid with hairline gaps and captions. */
export function ExhibitionGrid({
  exhibitions,
  seenIds,
  onPress,
}: {
  exhibitions: Exhibition[];
  seenIds: Set<string>;
  onPress: (e: Exhibition) => void;
}) {
  const { width } = useWindowDimensions();
  const cell = (width - GAP) / 2;
  return (
    <View style={styles.grid}>
      {exhibitions.map((e) => (
        <Pressable
          key={e.id}
          onPress={() => onPress(e)}
          style={{ width: cell, marginBottom: space.l }}
        >
          <View>
            <Image
              source={imageSource(e.image_url)}
              style={{ width: cell, height: cell * 1.2, backgroundColor: color.hairline }}
              contentFit="cover"
              transition={150}
            />
            {seenIds.has(e.id) ? <SeenDot style={styles.seenDot} /> : null}
          </View>
          <View style={styles.caption}>
            <MonoSmall style={{ color: color.grey }}>
              {dateRange(e.start_date, e.end_date)}
            </MonoSmall>
            <SerifItalic numberOfLines={2} style={styles.title}>
              {e.title}
            </SerifItalic>
            <Caps numberOfLines={1} style={{ fontSize: 10 }}>
              {e.artists.toUpperCase()}
            </Caps>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GAP,
    backgroundColor: color.paper,
  },
  seenDot: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  caption: {
    paddingHorizontal: space.m,
    paddingTop: space.s,
  },
  title: {
    fontSize: 17,
    lineHeight: 20,
    marginTop: 2,
    marginBottom: 3,
  },
});
