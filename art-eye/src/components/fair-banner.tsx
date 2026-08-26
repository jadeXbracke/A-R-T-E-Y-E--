import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { daysUntil, fmtRange, parseDay, todayStr } from '../lib/dates';
import { fairIsOn, fairsInFocus } from '../lib/fairs';
import { Fair } from '../lib/types';
import { colors, fonts, space, type } from '../theme';
import { Lift, RedDot } from './ui';

/** "ON NOW — DAY 2 OF 4" while it runs, a countdown before it opens. */
function statusLabel(f: Fair): string {
  if (fairIsOn(f)) {
    const day =
      Math.round(
        (parseDay(todayStr()).getTime() - parseDay(f.start_date).getTime()) / 86400000
      ) + 1;
    const total =
      Math.round(
        (parseDay(f.end_date).getTime() - parseDay(f.start_date).getTime()) / 86400000
      ) + 1;
    return `ON NOW — DAY ${day} OF ${total}`;
  }
  const days = daysUntil(f.start_date);
  if (days <= 0) return 'OPENS TODAY';
  if (days === 1) return 'OPENS TOMORROW';
  return `OPENS IN ${days} DAYS`;
}

/**
 * Fair week, front and centre. During the days a fair is on in the reader's
 * city — the busiest week of that city's art year — the agenda leads with it
 * instead of leaving it behind a filter chip. Renders nothing the rest of the
 * year, which is most of it.
 */
export function FairBanner({ city }: { city: string }) {
  const fairs = useMemo(() => fairsInFocus(city), [city]);
  if (!fairs.length) return null;

  return (
    <View style={styles.wrap}>
      {fairs.map((f) => (
        <Lift key={f.id} style={styles.card} onPress={() => router.push(`/fair/${f.id}`)}>
          <View style={styles.statusRow}>
            {fairIsOn(f) && <RedDot size={7} />}
            <Text style={styles.status}>{statusLabel(f)}</Text>
          </View>
          <Text style={styles.name}>{f.name}</Text>
          <Text style={styles.meta}>
            {fmtRange(f.start_date, f.end_date)} · {f.venue_name.toUpperCase()}
          </Text>
          <Text style={styles.cta}>THE WEEK IN FULL →</Text>
        </Lift>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.page, marginBottom: space.l },
  card: { borderWidth: 1, borderColor: colors.ink, padding: space.m },
  // House rule: red is graphic only — the dot carries the urgency, not the type.
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
    marginBottom: space.s,
  },
  status: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.ink,
  },
  name: { ...type.serifTitle, fontSize: 22, lineHeight: 28, marginBottom: space.s },
  meta: { ...type.monoSmall, fontSize: 10, marginBottom: space.m },
  cta: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.ink,
  },
});
