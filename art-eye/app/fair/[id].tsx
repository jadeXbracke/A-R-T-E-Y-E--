import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hairline, Kicker, MonoLink } from '../../src/components/ui';
import { fmtRange } from '../../src/lib/dates';
import { getFair } from '../../src/lib/fairs';
import { directionsUrl, mapsSearchUrl } from '../../src/lib/maps';
import { colors, fonts, space, type } from '../../src/theme';

function openLink(url: string) {
  Linking.openURL(url).catch(() => {});
}

export default function FairDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const fair = getFair(id);

  if (!fair) {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Fair not found</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
    );
  }

  const mapUrl =
    fair.google_maps_url ??
    mapsSearchUrl({ name: fair.venue_name, address: fair.address, city: fair.city });

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
          {fair.city.toUpperCase()} — {fair.country.toUpperCase()}
        </Kicker>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: space.page }}>
        <Text style={[type.serifHeading, { marginBottom: space.s }]}>{fair.name}</Text>

        <Text style={styles.dates}>
          {fmtRange(fair.start_date, fair.end_date)}
          {fair.dates_estimated ? '  ·  DATES TBC' : ''}
        </Text>

        <Pressable onPress={() => openLink(mapUrl)} hitSlop={6}>
          <Text style={styles.address}>
            {fair.venue_name}, {fair.address}  → MAP
          </Text>
        </Pressable>

        <Hairline style={{ marginVertical: space.m }} />

        <Text style={styles.body}>{fair.description}</Text>

        <View style={styles.links}>
          <MonoLink label="WEBSITE ↗" active onPress={() => openLink(fair.website)} />
          <MonoLink label="GOOGLE MAPS ↗" active onPress={() => openLink(mapUrl)} />
          <MonoLink label="ROUTE ↗" active onPress={() => openLink(directionsUrl(fair))} />
        </View>
      </View>
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
    color: colors.grey,
  },
  dates: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.ink,
    marginBottom: space.s,
  },
  address: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.grey,
  },
  body: {
    ...type.serifBody,
    color: colors.ink,
    marginBottom: space.l,
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.l,
    marginBottom: space.l,
  },
});
