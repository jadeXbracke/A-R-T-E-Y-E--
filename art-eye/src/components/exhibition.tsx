import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fmtRange } from '../lib/dates';
import { FALLBACK_PLACEHOLDER, PLACEHOLDERS } from '../lib/seed';
import { Exhibition } from '../lib/types';
import { colors, fonts, space, type } from '../theme';
import { RedDot } from './ui';

export function exhibitionSource(e: Exhibition) {
  if (e.image_url?.startsWith('asset:')) {
    return PLACEHOLDERS[e.image_url.slice(6)] ?? FALLBACK_PLACEHOLDER;
  }
  if (e.image_url) return { uri: e.image_url };
  const keys = Object.keys(PLACEHOLDERS);
  let h = 0;
  for (const c of e.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PLACEHOLDERS[keys[h % keys.length]];
}

/** Agenda list row: thumbnail (+ red seen dot), mono date, italic title, caps artist, mono venue. */
export function ExhibitionRow({ exhibition, seen }: { exhibition: Exhibition; seen?: boolean }) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/exhibition/${exhibition.id}`)}
    >
      <View>
        <Image source={exhibitionSource(exhibition)} style={styles.thumb} contentFit="cover" />
        {seen && <RedDot size={9} style={styles.seenDot} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowDate}>{fmtRange(exhibition.start_date, exhibition.end_date)}</Text>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {exhibition.title}
        </Text>
        <Text style={styles.rowArtist} numberOfLines={1}>
          {exhibition.artists.toUpperCase()}
        </Text>
        <Text style={styles.rowVenue} numberOfLines={1}>
          {exhibition.venue?.name.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
}

/** Grid cell for the 2-column agenda grid with hairline gaps. */
export function ExhibitionGridItem({ exhibition, seen }: { exhibition: Exhibition; seen?: boolean }) {
  return (
    <Pressable
      style={styles.gridItem}
      onPress={() => router.push(`/exhibition/${exhibition.id}`)}
    >
      <View>
        <Image source={exhibitionSource(exhibition)} style={styles.gridImage} contentFit="cover" />
        {seen && <RedDot size={9} style={styles.seenDot} />}
      </View>
      <Text style={styles.gridDate}>{fmtRange(exhibition.start_date, exhibition.end_date)}</Text>
      <Text style={styles.gridTitle} numberOfLines={2}>
        {exhibition.title}
      </Text>
      <Text style={styles.gridVenue} numberOfLines={1}>
        {exhibition.venue?.name.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.m,
    paddingVertical: space.m,
    paddingHorizontal: space.page,
  },
  thumb: { width: 84, height: 105, backgroundColor: colors.hairline },
  seenDot: { position: 'absolute', top: 8, right: 8 },
  rowDate: { ...type.monoSmall, marginBottom: 4 },
  rowTitle: { ...type.serifTitle, marginBottom: 4 },
  rowArtist: { ...type.artistCaps, fontSize: 11, marginBottom: 3 },
  rowVenue: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.6, color: colors.grey },
  gridItem: { width: '50%', paddingBottom: space.l, paddingHorizontal: 0.5 },
  gridImage: { width: '100%', aspectRatio: 4 / 5, backgroundColor: colors.hairline },
  gridDate: { ...type.monoSmall, fontSize: 10, marginTop: 8, marginBottom: 2, paddingRight: 8 },
  gridTitle: { ...type.serifTitle, fontSize: 18, lineHeight: 22, paddingRight: 8 },
  gridVenue: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.grey,
    marginTop: 3,
    paddingRight: 8,
  },
});
