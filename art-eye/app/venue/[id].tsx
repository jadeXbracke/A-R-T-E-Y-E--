import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExhibitionRow } from '../../src/components/exhibition';
import { LiveArt } from '../../src/components/live-art';
import { Hairline, Kicker, Loading, MonoLink } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { isOnNow, todayStr } from '../../src/lib/dates';
import { directionsUrl, mapsSearchUrl } from '../../src/lib/maps';
import { venueFacts } from '../../src/lib/venue-meta';
import { ReelLink } from '../../src/components/reel-link';
import { Exhibition, Venue } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

function openLink(url: string) {
  Linking.openURL(url).catch(() => {});
}

// Short factual block: type · founded · entry. Only verified facts are shown;
// anything unknown is flagged rather than guessed.
function VenueDescription({ venue }: { venue: Venue }) {
  const facts = venueFacts(venue);
  const known = [
    facts.typeLabel.toUpperCase(),
    facts.foundedYear ? `EST. ${facts.foundedYear}` : null,
    facts.entry === 'free' ? 'FREE ENTRY' : facts.entry === 'paid' ? 'PAID ENTRY' : null,
  ].filter(Boolean);

  const unknown = [
    facts.foundedYear ? null : 'founding year',
    facts.entry ? null : 'entry',
  ].filter(Boolean);

  return (
    <View style={{ marginBottom: space.m }}>
      <Text style={styles.facts}>{known.join('  ·  ')}</Text>
      {unknown.length > 0 && (
        <Text style={styles.factsFlag}>{unknown.join(' & ').toUpperCase()} NOT YET VERIFIED</Text>
      )}
    </View>
  );
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

export default function VenueDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [venue, setVenue] = useState<Venue | null | undefined>(undefined);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([api.listVenues(), api.listApprovedExhibitions()]).then(([vs, es]) => {
        if (!alive) return;
        setVenue(vs.find((v) => v.id === id) ?? null);
        setExhibitions(es.filter((e) => e.venue_id === id));
      });
      return () => {
        alive = false;
      };
    }, [id])
  );

  const t = todayStr();
  const onNow = useMemo(
    () =>
      exhibitions
        .filter((e) => isOnNow(e.start_date, e.end_date))
        .sort((a, b) => (a.end_date < b.end_date ? -1 : 1)),
    [exhibitions]
  );
  const upcoming = useMemo(
    () =>
      exhibitions
        .filter((e) => e.start_date > t)
        .sort((a, b) => (a.start_date < b.start_date ? -1 : 1)),
    [exhibitions, t]
  );

  if (venue === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <Loading />
      </View>
    );
  }

  if (venue === null) {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Venue not found</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + space.m,
        paddingBottom: insets.bottom + space.xl,
      }}
    >
      <View style={styles.head}>
        <Kicker>
          {(venue.category ?? venue.type).replace('_', ' ').toUpperCase()}
          {venue.suburb ? ` — ${venue.suburb.toUpperCase()}` : ''}
        </Kicker>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: space.page }}>
        <Text style={[type.serifHeading, { marginBottom: space.s }]}>{venue.name}</Text>
        <VenueDescription venue={venue} />
      </View>

      {(venue.image_url || venue.video_url) && (
        <LiveArt
          videoUrl={venue.video_url}
          uri={venue.image_url}
          fallbackId={venue.id}
          style={styles.photo}
        />
      )}

      <View style={{ paddingHorizontal: space.page, paddingTop: space.m }}>
        {venue.address && (
          <Pressable onPress={() => openLink(venue.google_maps_url ?? mapsSearchUrl(venue))} hitSlop={6}>
            <Text style={styles.address}>{venue.address}  → MAP</Text>
          </Pressable>
        )}
        {venue.opening_hours && (
          <Text style={styles.hours}>
            OPEN {venue.opening_hours.toUpperCase()}
            {venue.hours_checked ? `  ·  CHECKED ${venue.hours_checked}` : ''}
          </Text>
        )}
        {venue.editorial_note && <Text style={styles.note}>{venue.editorial_note}</Text>}

        <View style={styles.links}>
          {venue.website && (
            <MonoLink label="WEBSITE ↗" active onPress={() => openLink(webUrl(venue.website!))} />
          )}
          {venue.instagram && (
            <MonoLink label="INSTAGRAM ↗" active onPress={() => openLink(instaUrl(venue.instagram!))} />
          )}
          <MonoLink
            label="GOOGLE MAPS ↗"
            active
            onPress={() => openLink(venue.google_maps_url ?? mapsSearchUrl(venue))}
          />
          <MonoLink label="ROUTE ↗" active onPress={() => openLink(directionsUrl(venue))} />
        </View>

        {venue.reel_url && <ReelLink url={venue.reel_url} style={{ marginBottom: space.l }} />}

        <Hairline style={{ marginBottom: space.m }} />

        <Text style={styles.sectionTitle}>On now</Text>
        {onNow.length === 0 ? (
          <Text style={styles.emptyLine}>
            No shows listed in ART EYE yet — check the venue’s website for its current programme.
          </Text>
        ) : null}
      </View>
      {onNow.map((e) => (
        <ExhibitionRow key={e.id} exhibition={e} />
      ))}

      {upcoming.length > 0 && (
        <>
          <View style={{ paddingHorizontal: space.page, paddingTop: space.l }}>
            <Text style={styles.sectionTitle}>Coming up</Text>
          </View>
          {upcoming.map((e) => (
            <ExhibitionRow key={e.id} exhibition={e} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  back: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.ink,
  },
  facts: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.ink,
  },
  factsFlag: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.ink,
    marginTop: 4,
    opacity: 0.55,
  },
  photo: { width: '100%', aspectRatio: 3 / 2, backgroundColor: colors.hairline },
  address: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.ink,
    marginBottom: 6,
  },
  hours: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.ink,
    marginBottom: space.m,
  },
  note: {
    ...type.serifBody,
    color: colors.ink,
    marginBottom: space.m,
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.l,
    marginBottom: space.l,
  },
  sectionTitle: { ...type.serifHeading, fontSize: 26, marginBottom: space.s },
  emptyLine: {
    fontFamily: fonts.serifItalic,
    fontSize: 17,
    lineHeight: 25,
    color: colors.ink,
    marginBottom: space.m,
  },
});
