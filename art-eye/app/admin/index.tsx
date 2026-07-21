import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hairline, Kicker } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { colors, fonts, space, type } from '../../src/theme';

function DeskRow({
  label,
  meta,
  onPress,
}: {
  label: string;
  meta: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </Pressable>
  );
}

export default function HostDesk() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [counts, setCounts] = useState<{
    pending: number;
    venues: number;
    shows: number;
    inbox: number;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (profile?.role === 'admin') {
        Promise.all([
          api.listPending(),
          api.listVenues(),
          api.listAllExhibitions(),
          api.listProposals(),
        ]).then(
          ([p, v, e, q]) =>
            alive &&
            setCounts({ pending: p.length, venues: v.length, shows: e.length, inbox: q.length })
        );
      }
      return () => {
        alive = false;
      };
    }, [profile])
  );

  if (profile?.role !== 'admin') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: insets.top + space.xl,
          paddingHorizontal: space.page,
        }}
      >
        <Text style={type.serifHeading}>Host only</Text>
        <Text style={styles.note}>
          This desk belongs to the host account. Only the host can add, edit or remove what appears
          in the app.
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.head}>
        <View>
          <Kicker style={{ marginBottom: 10 }}>HOST CONTROL</Kicker>
          <Text style={type.serifHeading}>The desk</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <Text style={styles.intro}>
        Everything the app shows is yours to run. Publish and pull exhibitions, keep the venue
        register, and hide anything you don’t want public.
      </Text>
      <Hairline />

      <DeskRow
        label="SUBMISSIONS IN REVIEW"
        meta={counts ? `${counts.pending} WAITING` : '…'}
        onPress={() => router.push('/admin/review')}
      />
      <DeskRow
        label="VENUE REGISTER"
        meta={counts ? `${counts.venues} VENUES` : '…'}
        onPress={() => router.push('/admin/venues')}
      />
      <DeskRow
        label="EXHIBITIONS"
        meta={counts ? `${counts.shows} TOTAL` : '…'}
        onPress={() => router.push('/admin/exhibitions')}
      />
      <DeskRow
        label="OWNER INBOX — PIPELINE PROPOSALS"
        meta={counts ? (counts.inbox > 0 ? `${counts.inbox} WAITING` : 'CLEAR') : '…'}
        onPress={() => router.push('/admin/inbox')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  intro: {
    fontFamily: fonts.serifItalic,
    fontSize: 18,
    lineHeight: 27,
    color: colors.grey,
    paddingHorizontal: space.page,
    marginBottom: space.l,
  },
  back: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.grey,
    marginTop: space.m,
  },
  note: {
    fontFamily: fonts.serifItalic,
    fontSize: 18,
    lineHeight: 27,
    color: colors.grey,
    marginTop: space.m,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingVertical: space.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.ink,
    marginBottom: 6,
  },
  rowMeta: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: colors.grey },
  arrow: { fontFamily: fonts.mono, fontSize: 18, color: colors.red },
});
