import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ActionBar,
  Hairline,
  Loading,
  MonoLabel,
  RatingDots,
  SeenDot,
} from '../../components/ui';
import { api } from '../../lib/api';
import { useApp } from '../../lib/app-context';
import { dateRange, openingTag } from '../../lib/format';
import type { Exhibition } from '../../lib/types';
import { colors, PAGE_PAD, type } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');

function SpecRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <>
      <View style={styles.specRow}>
        <MonoLabel style={{ width: 96 }}>{label}</MonoLabel>
        <Text
          style={[
            type.monoBody,
            { flex: 1, textAlign: 'right', color: accent ? colors.red : colors.ink },
          ]}
        >
          {value}
        </Text>
      </View>
      <Hairline />
    </>
  );
}

export default function ExhibitionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, watchlistIds, visits, toggleWatchlist, exhibitions } = useApp();

  const cached = exhibitions.find((e) => e.id === id) ?? null;
  const [exhibition, setExhibition] = useState<Exhibition | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    api
      .getExhibition(id)
      .then((e) => {
        if (alive && e) setExhibition(e);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const visit = useMemo(
    () => visits.find((v) => v.exhibition_id === id) ?? null,
    [visits, id],
  );
  const wanted = id ? watchlistIds.includes(id) : false;

  if (loading && !exhibition) return <Loading />;
  if (!exhibition) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={type.serifQuote}>This exhibition is no longer on view.</Text>
      </View>
    );
  }

  const opening = openingTag(exhibition);

  const requireAccount = (action: () => void) => {
    if (!profile) {
      router.push('/auth');
      return;
    }
    action();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentInsetAdjustmentBehavior="never">
      {/* full-bleed cover with centered overlay */}
      <View>
        <Image
          source={exhibition.image_url ?? undefined}
          style={{ width: SCREEN_W, height: Math.round(SCREEN_W * 1.2), backgroundColor: colors.hairline }}
          contentFit="cover"
          transition={250}
        />
        <View style={styles.coverOverlay}>
          <Text style={[type.capsArtistLarge, styles.coverShadow, { textAlign: 'center' }]}>
            {exhibition.artists}
          </Text>
          <Text style={[styles.coverTitle, styles.coverShadow]}>{exhibition.title}</Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={[styles.back, { top: insets.top + 8 }]}
          hitSlop={12}
        >
          <Text style={[type.monoButton, { color: colors.bg }]}>← BACK</Text>
        </Pressable>
        {visit ? (
          <View style={[styles.seenBadge, { top: insets.top + 12 }]}>
            <SeenDot size={10} />
          </View>
        ) : null}
      </View>

      {/* mono spec table */}
      <View style={{ paddingHorizontal: PAGE_PAD, paddingTop: 8 }}>
        <SpecRow label="VENUE" value={exhibition.venue?.name?.toUpperCase() ?? '—'} />
        <SpecRow label="TYPE" value={(exhibition.venue?.type ?? 'gallery').toUpperCase()} />
        <SpecRow label="DATES" value={dateRange(exhibition)} />
        {opening ? <SpecRow label="OPENING" value={opening.replace('OPENING ', '')} accent /> : null}
      </View>

      {/* description */}
      {exhibition.description ? (
        <Text style={[type.serifBody, styles.description]}>{exhibition.description}</Text>
      ) : null}

      {/* your record — appears once seen */}
      {visit ? (
        <View style={{ paddingHorizontal: PAGE_PAD, paddingBottom: 8 }}>
          <Hairline style={{ marginBottom: 20 }} />
          <MonoLabel style={{ marginBottom: 10 }}>FROM YOUR CURATION</MonoLabel>
          <RatingDots rating={visit.rating} />
          {visit.reflection ? (
            <Text style={[type.serifQuote, { marginTop: 14 }]}>
              “{visit.reflection}”
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* square action bar */}
      <View style={{ paddingHorizontal: PAGE_PAD, paddingVertical: 28 }}>
        <ActionBar
          actions={[
            {
              label: wanted ? 'WANTED ✓' : 'WANT TO SEE',
              onPress: () => requireAccount(() => toggleWatchlist(exhibition.id)),
            },
            {
              label: visit ? 'SEEN — EDIT' : 'MARK AS SEEN',
              onPress: () => requireAccount(() => router.push(`/log/${exhibition.id}`)),
              filled: !visit,
            },
          ]}
        />
      </View>
      <View style={{ height: insets.bottom + 12 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  coverOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: colors.scrim,
  },
  coverTitle: {
    fontFamily: type.serifTitleLarge.fontFamily,
    fontSize: 36,
    lineHeight: 42,
    color: colors.bg,
    textAlign: 'center',
    marginTop: 10,
  },
  coverShadow: {
    textShadowColor: 'rgba(19,18,17,0.5)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 1 },
  },
  back: {
    position: 'absolute',
    left: PAGE_PAD,
  },
  seenBadge: {
    position: 'absolute',
    right: PAGE_PAD,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  description: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 24,
    paddingBottom: 28,
  },
});
