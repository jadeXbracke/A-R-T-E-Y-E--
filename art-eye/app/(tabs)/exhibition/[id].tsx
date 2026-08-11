import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArtImage } from '../../../src/components/exhibition';
import { LiveArt } from '../../../src/components/live-art';
import { ActionBar, Hairline, Kicker, Loading, MonoLink, RedDot } from '../../../src/components/ui';
import { api } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth';
import { fmtOpening, fmtRange } from '../../../src/lib/dates';
import { directionsUrl } from '../../../src/lib/maps';
import { ReelLink } from '../../../src/components/reel-link';
import { shareExhibition } from '../../../src/lib/share';
import { Exhibition, Visit } from '../../../src/lib/types';
import { colors, fonts, space, type } from '../../../src/theme';

function openLink(url: string) {
  Linking.openURL(url).catch(() => {});
}
function webUrl(raw: string) {
  const t = raw.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}
function instaUrl(raw: string) {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://instagram.com/${t.replace(/^@/, '')}`;
}

function SpecRow({
  label,
  value,
  accent,
  onPress,
}: {
  label: string;
  value: string;
  accent?: boolean;
  onPress?: () => void;
}) {
  const row = (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={[styles.specValue, accent && { color: colors.ink }]}>{value}</Text>
    </View>
  );
  return (
    <>
      {onPress ? <Pressable onPress={onPress}>{row}</Pressable> : row}
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
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: insets.bottom + space.xl }}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backLabel}>← BACK</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
            <Pressable
              onPress={() => shareExhibition(e.id, e.title, e.venue?.name)}
              hitSlop={12}
            >
              <Text style={styles.backLabel}>INVITE A FRIEND →</Text>
            </Pressable>
            {visit && <RedDot size={10} />}
          </View>
        </View>
        <View style={{ paddingHorizontal: space.page }}>
          <LiveArt
            videoUrl={e.video_url}
            uri={e.image_url}
            venueUri={e.venue?.image_url}
            fallbackId={e.id}
            style={{ width: width - space.page * 2, backgroundColor: colors.dim }}
            aspectRatio={4 / 3}
          />
        </View>
        <View style={styles.caption}>
          <Text style={styles.captionTitle}>{e.title}</Text>
          <Text style={styles.captionArtist}>{e.artists.toUpperCase()}</Text>
          {((e.image_url && /^https?:/.test(e.image_url)) || e.venue?.image_url) && e.venue?.name ? (
            <Text style={styles.courtesy}>COURTESY {e.venue.name.toUpperCase()}</Text>
          ) : null}
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
          {e.venue?.address && (
            <SpecRow
              label="ADDRESS — TAP FOR ROUTE"
              value={e.venue.address.toUpperCase()}
              onPress={() => openLink(directionsUrl(e.venue!))}
            />
          )}

          <Text style={styles.description}>{e.description}</Text>

          {(e.reel_url || e.venue?.reel_url) && (
            <ReelLink url={(e.reel_url || e.venue?.reel_url)!} style={{ marginBottom: space.l }} />
          )}

          {e.venue && (
            <View style={styles.venueBlock}>
              <Kicker style={{ marginBottom: space.m }}>THE SPACE</Kicker>
              {e.venue.image_url && (
                <ArtImage
                  uri={e.venue.image_url}
                  fallbackId={e.venue.id}
                  style={styles.venueImage}
                  contentFit="cover"
                />
              )}
              <Text style={styles.venueName}>{e.venue.name.toUpperCase()}</Text>
              {e.venue.address && (
                <Pressable onPress={() => openLink(directionsUrl(e.venue!))} hitSlop={6}>
                  <Text style={styles.venueAddress}>{e.venue.address}  → ROUTE</Text>
                </Pressable>
              )}
              <View style={styles.venueLinks}>
                <MonoLink
                  label="VENUE PAGE →"
                  active
                  onPress={() => router.push(`/venue/${e.venue!.id}`)}
                />
                {e.venue.website && (
                  <MonoLink
                    label="WEBSITE ●"
                    active
                    onPress={() => openLink(webUrl(e.venue!.website!))}
                  />
                )}
                {e.venue.instagram && (
                  <MonoLink
                    label="INSTAGRAM ●"
                    active
                    onPress={() => openLink(instaUrl(e.venue!.instagram!))}
                  />
                )}
              </View>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  caption: { paddingHorizontal: space.page, paddingTop: space.l },
  captionTitle: { ...type.serifHeading, fontSize: 23, lineHeight: 35, marginBottom: space.s },
  courtesy: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1.4,
    color: colors.ink,
    opacity: 0.6,
    marginTop: 6,
  },
  captionArtist: {
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: 2.4,
    color: colors.ink,
    textTransform: 'uppercase',
  },
  backLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.ink,
  },
  openingTag: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.ink,
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
  venueImage: { width: '100%', aspectRatio: 3 / 2, backgroundColor: colors.dim },
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
    color: colors.ink,
  },
  venueLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.l,
    marginTop: space.m,
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
    color: colors.ink,
    marginTop: space.m,
    textDecorationLine: 'underline',
  },
});
