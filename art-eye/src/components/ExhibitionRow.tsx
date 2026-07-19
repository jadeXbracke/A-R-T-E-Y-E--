import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { imageSource } from '../data/placeholders';
import { closingTag, dateRange, openingTag } from '../lib/format';
import { color, space } from '../theme';
import type { Exhibition } from '../types';
import { Caps, Mono, MonoMuted, MonoSmall, SerifItalic } from './Type';
import { SeenDot } from './kit';

/**
 * Agenda list row: thumbnail (with red seen-dot), mono date line,
 * italic serif title, caps artist, mono venue.
 */
export function ExhibitionRow({
  exhibition,
  seen,
  onPress,
}: {
  exhibition: Exhibition;
  seen: boolean;
  onPress: () => void;
}) {
  const closing = closingTag(exhibition);
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View>
        <Image
          source={imageSource(exhibition.image_url)}
          style={styles.thumb}
          contentFit="cover"
          transition={150}
        />
        {seen ? <SeenDot style={styles.seenDot} /> : null}
      </View>
      <View style={styles.text}>
        <View style={styles.dateLine}>
          <MonoMuted>{dateRange(exhibition.start_date, exhibition.end_date)}</MonoMuted>
          {closing ? <MonoSmall style={{ color: color.red }}>{closing}</MonoSmall> : null}
        </View>
        <SerifItalic numberOfLines={2} style={styles.title}>
          {exhibition.title}
        </SerifItalic>
        <Caps numberOfLines={1} style={styles.artist}>
          {exhibition.artists.toUpperCase()}
        </Caps>
        <Mono numberOfLines={1} style={{ color: color.grey }}>
          {exhibition.venue?.name.toUpperCase() ?? ''}
        </Mono>
        {exhibition.opening_datetime ? (
          <MonoSmall style={{ color: color.red, marginTop: 3 }}>
            {openingTag(exhibition.opening_datetime)}
          </MonoSmall>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: space.m,
    paddingHorizontal: space.gutter,
    gap: space.m,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
    backgroundColor: color.paper,
  },
  thumb: {
    width: 76,
    height: 95,
    backgroundColor: color.hairline,
  },
  seenDot: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  text: {
    flex: 1,
    justifyContent: 'center',
  },
  dateLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    marginTop: 4,
  },
  artist: {
    marginTop: 4,
    marginBottom: 2,
  },
});
