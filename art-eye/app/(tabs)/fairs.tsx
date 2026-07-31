import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Lift } from '../../src/components/ui';
import { fmtRange } from '../../src/lib/dates';
import { listFairs } from '../../src/lib/fairs';
import { todayStr } from '../../src/lib/dates';
import { colors, fonts, space, type } from '../../src/theme';

export default function FairsScreen() {
  const insets = useSafeAreaInsets();
  const fairs = useMemo(() => listFairs(), []);
  const t = todayStr();

  const upcoming = useMemo(() => fairs.filter((f) => f.end_date >= t), [fairs, t]);
  const past = useMemo(() => fairs.filter((f) => f.end_date < t), [fairs, t]);

  const sections = [
    { title: 'UPCOMING', fairs: upcoming },
    { title: 'PAST', fairs: past },
  ].filter((s) => s.fairs.length > 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>THE INTERNATIONAL CALENDAR</Text>
        <Text style={type.serifHeading}>Fairs</Text>
      </View>
      <Hairline />

      {sections.length === 0 ? (
        <EmptyState>No fairs listed yet.</EmptyState>
      ) : (
        sections.map((s) => (
          <View key={s.title}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              <Text style={styles.sectionCount}>{s.fairs.length}</Text>
            </View>
            {s.fairs.map((f) => (
              <Lift key={f.id} style={styles.row} onPress={() => router.push(`/fair/${f.id}`)}>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {f.city} · {f.country}
                </Text>
                <Text style={styles.rowName} numberOfLines={2}>
                  {f.name}
                </Text>
                <Text style={styles.date}>
                  {fmtRange(f.start_date, f.end_date)}
                  {f.dates_estimated ? '  ·  DATES TBC' : ''}
                </Text>
              </Lift>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.page, paddingBottom: space.m },
  kicker: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.ink,
    marginBottom: 10,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.page,
    paddingTop: space.l,
    paddingBottom: space.s,
  },
  sectionTitle: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.ink,
  },
  sectionCount: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.ink,
  },
  row: {
    paddingHorizontal: space.page,
    paddingVertical: space.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowName: { ...type.serifTitle, fontSize: 24, lineHeight: 28, marginBottom: 8 },
  rowMeta: { ...type.monoSmall, fontSize: 10, marginBottom: 8 },
  date: { ...type.monoLabel, fontSize: 10 },
});
