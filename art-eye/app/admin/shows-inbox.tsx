// Shows inbox — exhibitions the discovery pipeline found on venues' own
// websites. Owner-only: the desk links here only for the admin, this screen
// guards on role, and the database (RLS + is_admin() in the approval RPC)
// refuses every other account even if someone reaches the route anyway.
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Kicker, Loading } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { ExhibitionProposal } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

const fmt = (d: string | null) => (d ? d : '—');

function ProposalCard({
  p,
  busy,
  onApprove,
  onReject,
}: {
  p: ExhibitionProposal;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.venue}>{p.venue_name.toUpperCase()}</Text>
      <Text style={styles.title}>{p.title}</Text>
      {p.artists ? <Text style={styles.meta}>{p.artists}</Text> : null}
      <Text style={styles.meta}>
        {fmt(p.start_date)} → {fmt(p.end_date)}
      </Text>
      {p.description ? (
        <Text style={styles.desc} numberOfLines={3}>
          {p.description}
        </Text>
      ) : null}
      <View style={styles.metaRow}>
        <Text style={styles.confidence}>
          {p.confidence >= 0.9 ? 'FROM VENUE DATA' : 'AI-READ — CHECK SOURCE'}
        </Text>
        {p.source_url ? (
          <Pressable onPress={() => Linking.openURL(p.source_url!).catch(() => {})} hitSlop={8}>
            <Text style={styles.source}>SOURCE ●</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.approve, busy && styles.disabled]}
          disabled={busy}
          onPress={onApprove}
        >
          <Text style={styles.approveText}>✓ APPROVE</Text>
        </Pressable>
        <Pressable
          style={[styles.button, busy && styles.disabled]}
          disabled={busy}
          onPress={onReject}
        >
          <Text style={styles.rejectText}>✗ REJECT</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ShowsInbox() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [proposals, setProposals] = useState<ExhibitionProposal[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (profile?.role === 'admin') {
        api.listExhibitionProposals().then(
          (p) => alive && setProposals(p),
          (e) => alive && setError(e instanceof Error ? e.message : String(e))
        );
      }
      return () => {
        alive = false;
      };
    }, [profile])
  );

  const act = async (p: ExhibitionProposal, action: 'approve' | 'reject') => {
    setBusyId(p.id);
    setError(null);
    try {
      if (action === 'approve') await api.approveExhibitionProposal(p.id);
      else await api.rejectExhibitionProposal(p.id);
      setProposals((cur) => (cur ?? []).filter((x) => x.id !== p.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Host only</Text>
        <Text style={styles.guardNote}>
          The shows inbox belongs to the host account.
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
          <Kicker style={{ marginBottom: 10 }}>SHOWS INBOX</Kicker>
          <Text style={type.serifHeading}>Discovered</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <Text style={styles.intro}>
        Exhibitions the pipeline found on venues' own websites. Nothing goes live until you approve
        it here — approving publishes the show, rejecting discards it.
      </Text>
      <Hairline />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {(() => {
        const sure = (proposals ?? []).filter((p) => p.confidence >= 0.9);
        if (sure.length < 2) return null;
        return (
          <Pressable
            style={[styles.bulk, busyId === 'bulk' && styles.disabled]}
            disabled={busyId !== null}
            onPress={async () => {
              setBusyId('bulk');
              setError(null);
              try {
                for (const p of sure) await api.approveExhibitionProposal(p.id);
                setProposals((cur) => (cur ?? []).filter((x) => x.confidence < 0.9));
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              } finally {
                setBusyId(null);
              }
            }}
          >
            <Text style={styles.bulkText}>
              ✓ APPROVE ALL FROM VENUE DATA ({sure.length})
            </Text>
          </Pressable>
        );
      })()}

      {proposals === null && !error ? (
        <Loading />
      ) : (proposals ?? []).length === 0 ? (
        <EmptyState>
          The inbox is clear. The weekly discovery run will leave new finds here.
        </EmptyState>
      ) : (
        (proposals ?? []).map((p) => (
          <ProposalCard
            key={p.id}
            p={p}
            busy={busyId === p.id}
            onApprove={() => act(p, 'approve')}
            onReject={() => act(p, 'reject')}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page },
  guardNote: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink,
    marginTop: 10,
    marginBottom: 18,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.5, color: colors.ink },
  intro: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink,
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  error: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
    paddingHorizontal: space.page,
    paddingVertical: space.s,
  },
  card: {
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.ink,
  },
  venue: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.8, color: colors.ink },
  title: {
    fontFamily: fonts.serifMedium,
    fontSize: 19,
    lineHeight: 25,
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  meta: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: colors.ink, marginTop: 4 },
  desc: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: colors.ink, marginTop: 6 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  confidence: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.5, color: colors.ink },
  source: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  bulk: {
    marginHorizontal: space.page,
    marginTop: space.m,
    backgroundColor: colors.ink,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bulkText: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.5, color: colors.bg },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: 12,
    alignItems: 'center',
  },
  approve: { backgroundColor: colors.ink },
  approveText: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.5, color: colors.bg },
  rejectText: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.5, color: colors.ink },
  disabled: { opacity: 0.4 },
});
