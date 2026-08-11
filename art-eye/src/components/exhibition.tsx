import { Image, ImageProps } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fmtRange } from '../lib/dates';
import { FALLBACK_PLACEHOLDER, PLACEHOLDERS } from '../lib/seed';
import { Exhibition } from '../lib/types';
import { colors, fonts, space, type } from '../theme';
import { Lift, RedDot } from './ui';

// Only real photographs (http/https) are shown as covers — no grey placeholders.
function photo(e: Exhibition): string | null {
  return e.image_url && /^https?:\/\//i.test(e.image_url) ? e.image_url : null;
}

function fallbackFor(id: string, imageUrl?: string | null): number {
  if (imageUrl?.startsWith('asset:')) {
    return PLACEHOLDERS[imageUrl.slice(6)] ?? FALLBACK_PLACEHOLDER;
  }
  const keys = Object.keys(PLACEHOLDERS);
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PLACEHOLDERS[keys[h % keys.length]];
}

export function exhibitionSource(e: Exhibition) {
  if (e.image_url && !e.image_url.startsWith('asset:')) return { uri: e.image_url };
  return fallbackFor(e.id, e.image_url);
}

/**
 * Editorial image chain: the work's own press image, else the tonal
 * placeholder (loading state and error fallback). Deliberately no venue-photo
 * fallback on exhibition covers — a building facade repeated across several
 * shows reads worse than a quiet placeholder, and the owner agrees.
 */
export function ArtImage({
  uri,
  venueUri,
  fallbackId,
  onAllFailed,
  ...props
}: Omit<ImageProps, 'source'> & {
  uri?: string | null;
  venueUri?: string | null;
  fallbackId: string;
  // Fires once every remote candidate has errored, so a caller can hide the
  // whole image area instead of showing a meaningless placeholder block.
  onAllFailed?: () => void;
}) {
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const fallback = fallbackFor(fallbackId, uri);
  const candidates = [uri, venueUri].filter(
    (u): u is string => !!u && !u.startsWith('asset:') && !failed.has(u)
  );
  const remote = candidates[0];
  return (
    <Image
      source={remote ? { uri: remote } : fallback}
      placeholder={remote ? fallback : undefined}
      onError={() => {
        if (!remote) return;
        setFailed((prev) => new Set(prev).add(remote));
        if (candidates.length <= 1) onAllFailed?.();
      }}
      transition={200}
      {...props}
    />
  );
}

/** Editorial agenda card: full-width image, then date, bold title, artist, venue. */
// A card's image: the show's own press photo, else the venue's photograph —
// real photography only, never a synthetic placeholder.
function cardArt(e: Exhibition): string | null {
  const v = e.venue?.image_url;
  return photo(e) ?? (v && /^https?:\/\//i.test(v) ? v : null);
}

export function ExhibitionRow({ exhibition, seen }: { exhibition: Exhibition; seen?: boolean }) {
  return (
    <Lift
      style={styles.row}
      onPress={() => router.push(`/exhibition/${exhibition.id}`)}
    >
      {cardArt(exhibition) && (
        <View>
          <Image source={{ uri: cardArt(exhibition)! }} style={styles.cover} contentFit="cover" transition={200} />
          {seen && <RedDot size={9} style={styles.seenDot} />}
        </View>
      )}
      <Text style={styles.rowDate}>{fmtRange(exhibition.start_date, exhibition.end_date)}</Text>
      <Text style={styles.rowTitle} numberOfLines={2}>
        {exhibition.title}
      </Text>
      <Text style={styles.rowArtist} numberOfLines={1}>
        {exhibition.artists}
      </Text>
      <Text style={styles.rowVenue} numberOfLines={1}>
        {exhibition.venue?.name}
      </Text>
    </Lift>
  );
}

/** Grid cell for the 2-column agenda grid with hairline gaps. */
export function ExhibitionGridItem({ exhibition, seen }: { exhibition: Exhibition; seen?: boolean }) {
  return (
    <Lift
      style={styles.gridItem}
      onPress={() => router.push(`/exhibition/${exhibition.id}`)}
    >
      {cardArt(exhibition) && (
        <View>
          <Image source={{ uri: cardArt(exhibition)! }} style={styles.gridImage} contentFit="cover" transition={200} />
          {seen && <RedDot size={9} style={styles.seenDot} />}
        </View>
      )}
      <Text style={styles.gridDate}>{fmtRange(exhibition.start_date, exhibition.end_date)}</Text>
      <Text style={styles.gridTitle} numberOfLines={2}>
        {exhibition.title}
      </Text>
      <Text style={styles.gridVenue} numberOfLines={1}>
        {exhibition.venue?.name}
      </Text>
    </Lift>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingTop: space.m,
    paddingBottom: space.l,
    paddingHorizontal: space.page,
  },
  cover: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.bg, marginBottom: space.s },
  seenDot: { position: 'absolute', top: 10, right: 10 },
  rowDate: { ...type.monoSmall, marginBottom: 6 },
  rowTitle: { ...type.serifTitle, fontSize: 22, lineHeight: 26, marginBottom: 6 },
  rowArtist: { ...type.artistCaps, fontSize: 11, marginBottom: 3 },
  rowVenue: { ...type.monoSmall, fontSize: 11 },
  gridItem: { width: '50%', paddingBottom: space.l, paddingHorizontal: 0.5 },
  gridImage: { width: '100%', aspectRatio: 4 / 5, backgroundColor: colors.bg },
  gridDate: { ...type.monoSmall, fontSize: 10, marginTop: 8, marginBottom: 2, paddingRight: 8 },
  gridTitle: { ...type.serifTitle, fontSize: 18, lineHeight: 22, paddingRight: 8 },
  gridVenue: {
    ...type.monoSmall,
    fontSize: 10,
    marginTop: 3,
    paddingRight: 8,
  },
});
