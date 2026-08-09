import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Lift } from '../src/components/ui';
import { DateBlock } from '../src/components/date-block';
import { fmtRange } from '../src/lib/dates';
import { listFairs } from '../src/lib/fairs';
import { todayStr } from '../src/lib/dates';
import { colors, fonts, space, type } from '../src/theme';

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.kicker}>THE INTERNATIONAL CALENDAR</Text>
          <Text style={styles.kicker} onPress={() => router.back()}>
            ← BACK
          </Text>
        </View>
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
                <DateBlock date={f.start_date} seed={f.id} width={84} height={105} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {f.city.toUpperCase()} · {f.country.toUpperCase()}
                  </Text>
                  <Text style={styles.rowName} numberOfLines={2}>
                    {f.name}
                  </Text>
                  <Text style={styles.date}>
                    {fmtRange(f.start_date, f.end_date)}
                    {f.dates_estimated ? '  ·  DATES TBC' : ''}
                  </Text>
                </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowName: { ...type.serifTitle, fontSize: 20, marginBottom: 4 },
  rowMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.ink,
    marginBottom: 4,
  },
  date: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.ink,
  },
});
