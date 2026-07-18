import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArtImage } from '../../src/components/exhibition';
import { ActionBar, Hairline, Kicker, Loading, RedDot } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { fmtOpening, fmtRange } from '../../src/lib/dates';
import { Exhibition, Visit } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

function SpecRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <>
      <View style={styles.specRow}>
        <Text style={styles.specLabel}>{label}</Text>
        <Text style={[styles.specValue, accent && { color: colors.red }]}>{value}</Text>
      </View>
      <Hairline />
    </>
  );
}

export default function ExhibitionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [wanted, setWanted] = useState(false);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const e = await api.getExhibition(id);
        if (!alive) return;
        setExhibition(e);
        if (profile) {
          const [watch, visits] = await Promise.all([
            api.listWatchlist(profile.id),
            api.listVisits(profile.id),
          ]);
          if (!alive) return;
          setWanted(watch.includes(id));
          setVisit(visits.find((v) => v.exhibition_id === id) ?? null);
        } else {
          setWanted(false);
          setVisit(null);
        }
        setLoaded(true);
      })();
      return () => {
        alive = false;
      };
    }, [id, profile])
  );

  const requireAuth = (fn: () => void) => {
    if (!profile) {
      router.push('/auth');
      return;
    }
    fn();
  };

  const toggleWant = () =>
    requireAuth(async () => {
      if (!profile) return;
      if (wanted) {
        setWanted(false);
        await api.removeFromWatchlist(profile.id, id);
      } else {
        setWanted(true);
        await api.addToWatchlist(profile.id, id);
      }
    });

  if (!loaded || !exhibition) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <Loading />
      </View>
    );
  }

  const e = exhibition;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xl }}>
        <View>
          <ArtImage
            uri={e.image_url}
            fallbackId={e.id}
            style={{ width, aspectRatio: 4 / 5, backgroundColor: colors.hairline }}
            contentFit="cover"
          />
          <View style={styles.overlay}>
            <Text style={styles.overlayArtist}>{e.artists.toUpperCase()}</Text>
            <Text style={styles.overlayTitle}>{e.title}</Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={[styles.back, { top: insets.top + 8 }]}
            hitSlop={12}
          >
            <Text style={styles.backLabel}>← BACK</Text>
          </Pressable>
          {visit && <RedDot size={10} style={{ position: 'absolute', top: insets.top + 16, right: space.page }} />}
        </View>

        <View style={{ paddingHorizontal: space.page, paddingTop: space.l }}>
          {e.opening_datetime && (
            <Text style={styles.openingTag}>OPENING NIGHT — {fmtOpening(e.opening_datetime).toUpperCase()}</Text>
          )}

          <Hairline />
          <SpecRow label="VENUE" value={e.venue?.name.toUpperCase() ?? '—'} />
          <SpecRow label="TYPE" value={(e.venue?.type ?? '—').toUpperCase()} />
          <SpecRow label="DATES" value={fmtRange(e.start_date, e.end_date)} />
          {e.opening_datetime && (
            <SpecRow label="OPENING" value={fmtOpening(e.opening_datetime).toUpperCase()} accent />
          )}
          {e.venue?.address && <SpecRow label="ADDRESS" value={e.venue.address.toUpperCase()} />}

          <Text style={styles.description}>{e.description}</Text>

          {e.venue?.image_url && (
            <View style={styles.venueBlock}>
              <Kicker style={{ marginBottom: space.m }}>THE SPACE</Kicker>
              <ArtImage
                uri={e.venue.image_url}
                fallbackId={e.venue.id}
                style={styles.venueImage}
                contentFit="cover"
              />
              <Text style={styles.venueName}>{e.venue.name.toUpperCase()}</Text>
              {e.venue.address && (
                <Text style={styles.venueAddress}>{e.venue.address}</Text>
              )}
            </View>
          )}

          {visit ? (
            <View style={styles.seenBlock}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <RedDot />
                <Text style={styles.seenLabel}>
                  SEEN — {visit.rating}/5
                </Text>
              </View>
              {!!visit.reflection && (
                <Text style={type.serifQuote}>“{visit.reflection}”</Text>
              )}
              <Pressable onPress={() => router.push(`/log/${e.id}`)} hitSlop={8}>
                <Text style={styles.editNote}>EDIT YOUR NOTE</Text>
              </Pressable>
            </View>
          ) : (
            <ActionBar
              actions={[
                {
                  label: wanted ? 'ON YOUR LIST ·' : 'WANT TO SEE',
                  onPress: toggleWant,
                  accent: wanted,
                },
                {
                  label: 'MARK AS SEEN',
                  onPress: () => requireAuth(() => router.push(`/log/${e.id}`)),
                },
              ]}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrim,
    paddingHorizontal: space.l,
  },
  overlayArtist: { ...type.artistCapsLarge, textAlign: 'center', marginBottom: space.s },
  overlayTitle: { ...type.serifHero, fontSize: 40, lineHeight: 46, textAlign: 'center' },
  back: { position: 'absolute', left: space.page },
  backLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.white,
  },
  openingTag: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.red,
    marginBottom: space.m,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    gap: space.m,
  },
  specLabel: { ...type.monoLabel },
  specValue: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  description: {
    ...type.serifBody,
    marginTop: space.l,
    marginBottom: space.xl,
  },
  venueBlock: { marginBottom: space.xl },
  venueImage: { width: '100%', aspectRatio: 3 / 2, backgroundColor: colors.hairline },
  venueName: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.ink,
    marginTop: space.m,
    marginBottom: 4,
  },
  venueAddress: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.grey,
  },
  seenBlock: {
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.m,
  },
  seenLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.ink,
  },
  editNote: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.grey,
    marginTop: space.m,
    textDecorationLine: 'underline',
  },
});
