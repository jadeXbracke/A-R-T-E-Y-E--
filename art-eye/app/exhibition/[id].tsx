import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Header } from '../../src/components/Header';
import {
  Body,
  BodyItalic,
  Caps,
  HeadingL,
  Mono,
  MonoMuted,
} from '../../src/components/Type';
import { ActionBar, Loading, RatingDots, SeenDot } from '../../src/components/kit';
import { imageSource } from '../../src/data/placeholders';
import { client } from '../../src/lib/client';
import { closingTag, dateRange, openingTag } from '../../src/lib/format';
import { useAppState } from '../../src/state/AppState';
import { color, space } from '../../src/theme';
import type { Exhibition } from '../../src/types';

export default function ExhibitionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { profile, watchlist, visits, toggleWatchlist, exhibitions } = useAppState();
  const [exhibition, setExhibition] = useState<Exhibition | null>(
    () => exhibitions.find((e) => e.id === id) ?? null,
  );
  const [loading, setLoading] = useState(!exhibition);

  useEffect(() => {
    let alive = true;
    client
      .getExhibition(String(id))
      .then((e) => {
        if (alive && e) setExhibition(e);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const visit = useMemo(
    () => visits.find((v) => v.exhibition_id === id),
    [visits, id],
  );

  if (loading && !exhibition) {
    return (
      <View style={styles.screen}>
        <Header back />
        <Loading />
      </View>
    );
  }

  if (!exhibition) {
    return (
      <View style={styles.screen}>
        <Header back />
        <BodyItalic style={styles.missing}>
          We couldn’t find that exhibition. It may have left the agenda.
        </BodyItalic>
      </View>
    );
  }

  const wanted = watchlist.has(exhibition.id);
  const closing = closingTag(exhibition);

  const requireAuth = (fn: () => void) => () => {
    if (!profile) {
      router.push('/auth/sign-in');
      return;
    }
    fn();
  };

  return (
    <View style={styles.screen}>
      <Header back />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <Image
            source={imageSource(exhibition.image_url)}
            style={{ width, height: width * 1.15, backgroundColor: color.hairline }}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.overlay}>
            <Caps style={styles.overlayArtist}>{exhibition.artists.toUpperCase()}</Caps>
            <HeadingL style={styles.overlayTitle}>{exhibition.title}</HeadingL>
          </View>
        </View>

        <View style={styles.specTable}>
          <SpecRow label="VENUE" value={exhibition.venue?.name.toUpperCase() ?? '—'} />
          <SpecRow label="TYPE" value={(exhibition.venue?.type ?? 'gallery').toUpperCase()} />
          <SpecRow
            label="DATES"
            value={dateRange(exhibition.start_date, exhibition.end_date)}
            accent={closing}
          />
          {exhibition.opening_datetime ? (
            <SpecRow
              label="OPENING"
              value={openingTag(exhibition.opening_datetime).replace('OPENS ', '')}
              red
            />
          ) : null}
          {exhibition.venue?.address ? (
            <SpecRow label="WHERE" value={exhibition.venue.address.toUpperCase()} />
          ) : null}
        </View>

        {visit ? (
          <View style={styles.seenBand}>
            <View style={styles.seenLine}>
              <SeenDot />
              <MonoMuted>YOU’VE SEEN THIS</MonoMuted>
              <RatingDots value={visit.rating} size={9} />
            </View>
            {visit.reflection ? (
              <BodyItalic style={styles.seenNote}>“{visit.reflection}”</BodyItalic>
            ) : null}
          </View>
        ) : null}

        <Body style={styles.description}>{exhibition.description}</Body>

        <View style={styles.actions}>
          <ActionBar
            actions={[
              {
                label: wanted ? '● WANT TO SEE' : 'WANT TO SEE',
                active: wanted,
                onPress: requireAuth(() => toggleWatchlist(exhibition.id)),
              },
              {
                label: visit ? 'EDIT YOUR ENTRY' : 'MARK AS SEEN',
                primary: !visit,
                onPress: requireAuth(() => router.push(`/log/${exhibition.id}`)),
              },
            ]}
          />
          {!profile ? (
            <MonoMuted style={styles.signInHint}>SIGN IN TO CURATE</MonoMuted>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function SpecRow({
  label,
  value,
  red = false,
  accent,
}: {
  label: string;
  value: string;
  red?: boolean;
  accent?: string | null;
}) {
  return (
    <View style={styles.specRow}>
      <MonoMuted style={styles.specLabel}>{label}</MonoMuted>
      <View style={{ flex: 1 }}>
        <Mono style={{ color: red ? color.red : color.ink }}>{value}</Mono>
        {accent ? (
          <Mono style={{ color: color.red, marginTop: 2, fontSize: 10 }}>{accent}</Mono>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
  },
  missing: {
    padding: space.xl,
    textAlign: 'center',
    color: color.grey,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.overlayInk,
    paddingHorizontal: space.gutter,
  },
  overlayArtist: {
    color: color.paperOnImage,
    fontSize: 13,
    letterSpacing: 3.5,
    textAlign: 'center',
  },
  overlayTitle: {
    color: color.paperOnImage,
    textAlign: 'center',
    marginTop: space.m,
    fontSize: 32,
    lineHeight: 36,
  },
  specTable: {
    marginTop: space.l,
    marginHorizontal: space.gutter,
    borderTopWidth: 1,
    borderTopColor: color.hairline,
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
  },
  specLabel: {
    width: 90,
    letterSpacing: 1.2,
    fontSize: 10,
    paddingTop: 1,
  },
  seenBand: {
    marginTop: space.l,
    marginHorizontal: space.gutter,
    padding: space.m,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  seenLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
  },
  seenNote: {
    marginTop: space.s,
    fontSize: 16,
    lineHeight: 22,
  },
  description: {
    marginTop: space.l,
    marginHorizontal: space.gutter,
  },
  actions: {
    margin: space.gutter,
    marginTop: space.xl,
    marginBottom: space.xxl,
  },
  signInHint: {
    textAlign: 'center',
    marginTop: space.s,
    fontSize: 9,
    letterSpacing: 1.6,
  },
});
