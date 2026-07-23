import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field, Hairline, InkBar, Kicker, MonoLink } from '../../../src/components/ui';
import { api } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth';
import { Venue, VenueProposal } from '../../../src/lib/types';
import { colors, fonts, space, type } from '../../../src/theme';

const ACTION_LABEL = { add: 'NEW VENUE SUGGESTION', archive: 'ARCHIVE CANDIDATE', update: 'PROPOSED UPDATE' } as const;

export default function ProposalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [proposal, setProposal] = useState<VenueProposal | null | undefined>(undefined);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    api.listProposals().then(async (all) => {
      const p = all.find((x) => x.id === id) ?? null;
      setProposal(p);
      if (p) {
        // seed editable values from the proposed payload (string fields only)
        const seed: Record<string, string> = {};
        for (const [k, v] of Object.entries(p.proposed_payload)) {
          if (typeof v === 'string') seed[k] = v;
        }
        setEdits(seed);
        if (p.venue_id) {
          const venues = await api.listVenues();
          setVenue(venues.find((v) => v.id === p.venue_id) ?? null);
        }
      }
    });
  }, [id, profile]);

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
  if (proposal === undefined) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (proposal === null) {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Proposal not found</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
    );
  }

  const p = proposal;
  const payloadKeys = Object.keys(p.proposed_payload).filter((k) => typeof p.proposed_payload[k] === 'string');

  const approve = async () => {
    setBusy(true);
    setError(null);
    try {
      // edits merged over the original payload = "edit & approve"
      await api.approveProposal(p, { ...p.proposed_payload, ...edits });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.rejectProposal(p.id, note);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + space.m,
        paddingBottom: insets.bottom + space.xl,
        paddingHorizontal: space.page,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.head}>
        <Kicker>{ACTION_LABEL[p.action_type]}</Kicker>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>

      <Text style={[type.serifHeading, { marginBottom: space.s }]}>
        {String(p.proposed_payload.name ?? venue?.name ?? 'Venue change')}
      </Text>
      <Text style={styles.meta}>
        CONFIDENCE {p.confidence != null ? `${Math.round(p.confidence * 100)}%` : '—'} ·{' '}
        {new Date(p.created_at).toLocaleDateString()}
      </Text>
      <Text style={styles.reason}>{p.reason}</Text>

      <Kicker style={{ marginBottom: 8 }}>EVIDENCE — CHECK THE SOURCES YOURSELF</Kicker>
      {p.evidence.map((e, i) => (
        <Pressable key={i} style={styles.evidence} onPress={() => WebBrowser.openBrowserAsync(e.url)}>
          <Text style={styles.evidenceUrl} numberOfLines={1}>
            {e.url} ↗
          </Text>
          <Text style={styles.evidenceSnippet}>{e.snippet}</Text>
        </Pressable>
      ))}

      <Hairline style={{ marginVertical: space.l }} />

      {p.action_type === 'archive' ? (
        <Text style={styles.archiveNote}>
          Approving archives {venue?.name ?? 'this venue'} — it leaves the public app but is never
          deleted, and can be restored later via Host Control.
        </Text>
      ) : (
        <>
          <Kicker style={{ marginBottom: space.m }}>
            {p.action_type === 'update' ? 'CURRENT → PROPOSED (EDIT BEFORE APPROVING)' : 'PROPOSED RECORD (EDIT BEFORE APPROVING)'}
          </Kicker>
          {payloadKeys.map((k) => (
            <View key={k}>
              {p.action_type === 'update' && venue && (
                <Text style={styles.currentValue}>
                  {k.toUpperCase()} NOW: {String((venue as unknown as Record<string, unknown>)[k] ?? '—')}
                </Text>
              )}
              <Field
                label={k.toUpperCase()}
                value={edits[k] ?? ''}
                onChangeText={(t) => setEdits((prev) => ({ ...prev, [k]: t }))}
                autoCapitalize="none"
              />
            </View>
          ))}
          {payloadKeys.length === 0 && (
            <Text style={styles.archiveNote}>
              No concrete field changes proposed — read the evidence, then update the venue yourself
              via Host Control → Venue register if action is needed, and reject this proposal.
            </Text>
          )}
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <InkBar
        label={p.action_type === 'archive' ? 'APPROVE — ARCHIVE VENUE' : 'APPROVE — APPLY TO THE REGISTER'}
        onPress={approve}
        busy={busy}
      />

      <Hairline style={{ marginVertical: space.l }} />
      <Field
        label="REJECTION NOTE (OPTIONAL)"
        value={note}
        onChangeText={setNote}
        placeholder="Why this is wrong — snoozed for 90 days either way"
      />
      <MonoLink label="REJECT — SNOOZE FOR 90 DAYS" color={colors.red} onPress={reject} style={{ alignSelf: 'flex-start' }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: space.m },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink },
  meta: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.4, color: colors.ink, marginBottom: space.m },
  reason: { fontFamily: fonts.serifItalic, fontSize: 18, lineHeight: 26, color: colors.ink, marginBottom: space.l },
  evidence: { borderWidth: 1, borderColor: colors.hairline, padding: space.m, marginBottom: space.s },
  evidenceUrl: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 0.6, color: colors.ink, marginBottom: 6 },
  evidenceSnippet: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 22, color: colors.ink },
  currentValue: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: colors.ink, marginBottom: 4 },
  archiveNote: { fontFamily: fonts.serifItalic, fontSize: 17, lineHeight: 25, color: colors.ink, marginBottom: space.l },
  error: { fontFamily: fonts.mono, fontSize: 11, color: colors.red, marginBottom: space.m },
});
