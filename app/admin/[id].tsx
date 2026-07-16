import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { ExhibitionForm } from '@/components/ExhibitionForm';
import { BackBar } from '@/components/Header';
import { EmptyState, HairRule, MonoLabel, OptionRow, InkButton } from '@/components/ui';
import { useStore } from '@/lib/store';
import { Exhibition, REJECTION_REASON_LABEL, RejectionReason, Venue } from '@/lib/types';
import { color, space, type } from '@/theme';

const REASONS = (Object.keys(REJECTION_REASON_LABEL) as RejectionReason[]).map((key) => ({
  key,
  label: REJECTION_REASON_LABEL[key].toUpperCase(),
}));

/**
 * Admin review: every field editable before approving; rejecting requires
 * one tap on a reason.
 */
export default function AdminReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, listPending, approve, reject } = useStore();
  const [data, setData] = useState<{ exhibition: Exhibition; venue?: Venue } | null | 'loading'>(
    'loading'
  );
  const [reason, setReason] = useState<RejectionReason | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listPending()
      .then(({ exhibitions, venues }) => {
        const exhibition = exhibitions.find((e) => e.id === id);
        setData(
          exhibition
            ? { exhibition, venue: venues.find((v) => v.id === exhibition.venue_id) }
            : null
        );
      })
      .catch(() => setData(null));
  }, [id, listPending]);

  if (!user || user.role !== 'admin') {
    return (
      <View style={{ flex: 1, backgroundColor: color.white }}>
        <BackBar title="REVIEW" />
        <EmptyState text="The review desk is for admins." />
      </View>
    );
  }
  if (data === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: color.white }}>
        <BackBar title="REVIEW" />
      </View>
    );
  }
  if (data === null) {
    return (
      <View style={{ flex: 1, backgroundColor: color.white }}>
        <BackBar title="REVIEW" />
        <EmptyState text="Already handled — this one is no longer pending." />
      </View>
    );
  }

  const doReject = async () => {
    if (!reason) {
      Alert.alert('Reject', 'Tap a reason first — the venue sees it.');
      return;
    }
    try {
      setBusy(true);
      await reject(data.exhibition.id, reason);
      router.back();
    } catch (err) {
      Alert.alert('Reject', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BackBar title="REVIEW" />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 26 }}>
          <MonoLabel>
            {data.exhibition.submitted_by ? 'VENUE SUBMISSION' : 'PUBLIC SUBMISSION'} — EDIT ANY
            FIELD, THEN APPROVE
          </MonoLabel>
          <Text style={[type.displaySerif, { marginTop: 6, marginBottom: 24 }]}>Review</Text>

          <ExhibitionForm
            initial={data}
            submitLabel="APPROVE & PUBLISH"
            onSubmit={async (input) => {
              await approve(data.exhibition.id, input);
              Alert.alert('Published', 'It is now in the agenda.');
              router.back();
            }}
            extraActions={
              <View style={{ marginTop: 10, gap: 16 }}>
                <HairRule />
                <MonoLabel style={{ color: color.red }}>OR REJECT — TAP A REASON</MonoLabel>
                <OptionRow options={REASONS} value={reason} onChange={setReason} />
                <InkButton
                  label="REJECT SUBMISSION"
                  variant="line"
                  onPress={doReject}
                  loading={busy}
                />
              </View>
            }
          />
        </View>
        <View style={{ height: 48 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
