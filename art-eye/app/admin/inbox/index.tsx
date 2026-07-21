import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Kicker, Loading } from '../../../src/components/ui';
import { api } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth';
import { ProposalAction, VenueProposal } from '../../../src/lib/types';
import { colors, fonts, space, type } from '../../../src/theme';

const GROUPS: { action: ProposalAction; title: string }[] = [
  { action: 'add', title: 'NEW SUGGESTIONS' },
  { action: 'archive', title: 'ARCHIVE CANDIDATES' },
  { action: 'update', title: 'UPDATES' },
];

export default function OwnerInbox() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [proposals, setProposals] = useState<VenueProposal[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (profile?.role === 'admin') {
        api.listProposals().then((p) => alive && setProposals(p));
      }
      return () => {
        alive = false;
      };
    }, [profile])
  );

  const grouped = useMemo(
    () =>
      GROUPS.map((g) => ({
        ...g,
        items: (proposals ?? []).filter((p) => p.action_type === g.action),
      })).filter((g) => g.items.length > 0),
    [proposals]
  );

  if (profile?.role !== 'admin') {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Host only</Text>
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
          <Kicker style={{ marginBottom: 10 }}>OWNER INBOX</Kicker>
          <Text style={type.serifHeading}>For review</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <Text style={styles.intro}>
        The pipeline researches and proposes — nothing changes until you approve it here.
      </Text>
      <Hairline />

      {proposals === null ? (
        <Loading />
      ) : proposals.length === 0 ? (
        <EmptyState>The inbox is clear. New proposals from the pipeline will wait for you here.</EmptyState>
      ) : (
        grouped.map((g) => (
          <View key={g.action}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{g.title}</Text>
              <Text style={styles.badge}>{g.items.length}</Text>
            </View>
            {g.items.map((p) => (
              <Pressable key={p.id} style={styles.row} onPress={() => router.push(`/admin/inbox/${p.id}`)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {String(p.proposed_payload.name ?? '') || 'Venue change'}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={2}>
                    {p.reason}
                  </Text>
                </View>
                <Text style={styles.confidence}>
                  {p.confidence != null ? `${Math.round(p.confidence * 100)}%` : '—'}
                </Text>
              </Pressable>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  intro: {
    fontFamily: fonts.serifItalic,
    fontSize: 17,
    lineHeight: 25,
    color: colors.grey,
    paddingHorizontal: space.page,
    marginBottom: space.m,
  },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.grey, marginTop: space.m },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.page,
    paddingTop: space.l,
    paddingBottom: space.s,
  },
  sectionTitle: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.8, color: colors.ink },
  badge: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1, color: colors.red },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowTitle: { ...type.serifTitle, fontSize: 20 },
  rowMeta: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.6, color: colors.grey, marginTop: 4 },
  confidence: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1, color: colors.ink },
});
