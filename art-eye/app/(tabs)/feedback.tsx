import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field, Hairline, InkBar, Kicker } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { FeedbackKind } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

// Feedback straight to the owner. Opened plain (general feedback) or with
// ?kind=venue|exhibition&id=…&name=… from a detail page, so "something is
// missing here" arrives with the place it is about already attached.
export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ kind?: string; id?: string; name?: string }>();

  const kind: FeedbackKind =
    params.kind === 'venue' || params.kind === 'exhibition' ? params.kind : 'general';
  const subjectName = params.name ? decodeURIComponent(params.name) : null;

  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // The router can keep this screen mounted in the stack; when it is opened
  // again after a send, start with a fresh form instead of the thank-you.
  useFocusEffect(
    useCallback(() => {
      setSent((wasSent) => {
        if (wasSent) {
          setText('');
          setError(null);
        }
        return false;
      });
    }, [])
  );

  const send = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.submitFeedback(
        {
          kind,
          subject_id: params.id ?? null,
          subject_name: subjectName,
          text,
        },
        profile?.id ?? null
      );
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your feedback.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.done, { paddingTop: insets.top + space.xxl }]}>
        <Kicker style={{ marginBottom: 10 }}>FEEDBACK</Kicker>
        <Text style={type.serifHeading}>Sent — thank you</Text>
        <Text style={styles.doneNote}>
          Your note went straight to the owner{subjectName ? ` with “${subjectName}” attached` : ''}.
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
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.head}>
        <View>
          <Kicker style={{ marginBottom: 10 }}>FEEDBACK</Kicker>
          <Text style={type.serifHeading}>
            {kind === 'general' ? 'Tell the owner' : 'Something missing?'}
          </Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: space.page }}>
        {subjectName && (
          <View style={styles.subject}>
            <Text style={styles.subjectLabel}>ABOUT</Text>
            <Text style={styles.subjectName}>{subjectName}</Text>
          </View>
        )}
        <Text style={styles.intro}>
          {kind === 'general'
            ? 'Ideas, problems, praise — everything lands directly with the person who runs ART EYE.'
            : 'Wrong dates, a missing show, a closed venue, a broken link — say what’s off and it lands directly with the person who runs ART EYE.'}
        </Text>
        <Hairline style={{ marginBottom: space.l }} />

        <Field
          label="YOUR NOTE"
          value={text}
          onChangeText={setText}
          placeholder={kind === 'general' ? 'What should the owner know?' : 'What’s missing or wrong here?'}
          multiline
          inputStyle={styles.noteInput}
        />

        <Text style={styles.signedAs}>
          {profile
            ? `SENT AS ${profile.display_name.toUpperCase()}`
            : 'NOT SIGNED IN — YOUR NOTE ARRIVES ANONYMOUSLY'}
        </Text>
        {!!error && <Text style={styles.error}>{error.toUpperCase()}</Text>}

        <InkBar label="SEND FEEDBACK" onPress={send} disabled={!text.trim()} busy={busy} />
      </View>
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
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink, paddingBottom: 4 },
  subject: {
    borderWidth: 1,
    borderColor: colors.ink,
    paddingHorizontal: space.m,
    paddingVertical: space.s,
    marginBottom: space.m,
  },
  subjectLabel: { fontFamily: fonts.monoMedium, fontSize: 9, letterSpacing: 1.8, color: colors.ink },
  subjectName: { ...type.serifTitle, fontSize: 17, marginTop: 3 },
  intro: {
    fontFamily: fonts.serif,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    marginBottom: space.l,
  },
  noteInput: { minHeight: 120, textAlignVertical: 'top' },
  signedAs: {
    fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: colors.ink, opacity: 0.6,
    marginBottom: space.m,
  },
  error: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.ink, marginBottom: space.m },
  done: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.page, gap: space.m },
  doneNote: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 22, color: colors.ink },
});
