import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ExhibitionForm,
  inputFromExhibition,
  validateInput,
} from '../../../src/components/ExhibitionForm';
import { Header } from '../../../src/components/Header';
import {
  BodyItalic,
  HeadingXL,
  MonoLabel,
  MonoLabelMuted,
} from '../../../src/components/Type';
import { EmptyState, FormNote, Loading, TextLink } from '../../../src/components/kit';
import { client } from '../../../src/lib/client';
import { useAppState } from '../../../src/state/AppState';
import { color, space } from '../../../src/theme';
import {
  REJECTION_REASON_LABELS,
  type ExhibitionInput,
  type RejectionReason,
} from '../../../src/types';

const REASONS = Object.keys(REJECTION_REASON_LABELS) as RejectionReason[];

/** Review one submission: edit any field, then approve or reject with a reason. */
export default function AdminReview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile, refreshAgenda } = useAppState();
  const [input, setInput] = useState<ExhibitionInput | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    client.getExhibition(String(id)).then((e) => {
      if (e) setInput(inputFromExhibition(e));
    });
  }, [id]);

  if (profile?.role !== 'admin') {
    return (
      <View style={styles.screen}>
        <Header back />
        <EmptyState text="The approval desk is for admins only." />
      </View>
    );
  }

  const approve = async () => {
    if (!input) return;
    const problem = validateInput(input);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await client.approveExhibition(String(id), input);
      await refreshAgenda();
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  const reject = async (reason: RejectionReason) => {
    setBusy(true);
    setError('');
    try {
      await client.rejectExhibition(String(id), reason);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header back />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {input === null ? (
          <Loading />
        ) : (
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <MonoLabelMuted>REVIEW SUBMISSION</MonoLabelMuted>
            <HeadingXL style={styles.heading}>Before it joins the agenda</HeadingXL>
            <BodyItalic style={styles.intro}>
              Correct anything below — the version you approve is the version
              that publishes.
            </BodyItalic>

            <ExhibitionForm input={input} onChange={setInput} />
            <FormNote text={error} error />

            <Pressable
              onPress={approve}
              disabled={busy}
              style={({ pressed }) => [styles.approveBar, (pressed || busy) && { opacity: 0.85 }]}
            >
              <MonoLabel style={{ color: color.paper }}>
                {busy ? 'WORKING…' : 'APPROVE & PUBLISH'}
              </MonoLabel>
            </Pressable>

            {rejecting ? (
              <View style={styles.reasons}>
                <MonoLabelMuted>REASON</MonoLabelMuted>
                <View style={styles.reasonRow}>
                  {REASONS.map((r) => (
                    <TextLink
                      key={r}
                      label={REJECTION_REASON_LABELS[r]}
                      onPress={() => reject(r)}
                    />
                  ))}
                </View>
                <View style={{ marginTop: space.l }}>
                  <TextLink label="KEEP REVIEWING" muted onPress={() => setRejecting(false)} />
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setRejecting(true)}
                disabled={busy}
                style={styles.rejectBar}
              >
                <MonoLabel style={{ color: color.red }}>REJECT…</MonoLabel>
              </Pressable>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
  },
  body: {
    padding: space.gutter,
    paddingTop: space.xl,
    paddingBottom: space.xxl,
  },
  heading: {
    marginTop: space.s,
  },
  intro: {
    color: color.grey,
    marginTop: space.m,
    marginBottom: space.xl,
    fontSize: 16,
    lineHeight: 23,
  },
  approveBar: {
    backgroundColor: color.ink,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: space.xl,
  },
  rejectBar: {
    borderWidth: 1,
    borderColor: color.red,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: space.m,
  },
  reasons: {
    marginTop: space.l,
    borderWidth: 1,
    borderColor: color.hairline,
    padding: space.m,
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: space.l,
    rowGap: space.m,
    marginTop: space.m,
  },
});
