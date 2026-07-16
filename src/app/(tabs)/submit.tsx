import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubmissionForm, toSubmissionInput } from '../../components/submission-form';
import { EmptyState, Hairline, MonoLabel, TextLink } from '../../components/ui';
import { api } from '../../lib/api';
import { useApp } from '../../lib/app-context';
import { colors, PAGE_PAD, type } from '../../theme';

/** Venue-owner submission tab. Submissions land as pending for admin review. */
export default function SubmitScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useApp();
  const [submitted, setSubmitted] = useState(false);

  if (!profile || profile.role !== 'venue_owner') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <EmptyState body="Submitting from this tab is for venue accounts. Anyone can still propose an exhibition from the public form." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={{ paddingTop: insets.top + 18, paddingBottom: 18 }}>
          <MonoLabel>YOUR VENUE</MonoLabel>
          <Text style={[type.serifHeading, { marginTop: 8 }]}>Submit an exhibition</Text>
          <Text style={[type.monoSmall, { marginTop: 10 }]}>
            SUBMISSIONS APPEAR IN THE AGENDA ONCE APPROVED.
          </Text>
        </View>
        <Hairline style={{ marginBottom: 26 }} />

        {submitted ? (
          <View>
            <Text style={type.serifQuote}>
              Thank you — your exhibition has been submitted and is awaiting review.
              It will join the agenda once approved.
            </Text>
            <View style={{ marginTop: 24, flexDirection: 'row', gap: 20 }}>
              <TextLink label="SUBMIT ANOTHER" onPress={() => setSubmitted(false)} />
              <TextLink label="MY SUBMISSIONS" onPress={() => router.push('/my-submissions')} />
            </View>
          </View>
        ) : (
          <>
            <SubmissionForm
              submitLabel="SUBMIT FOR REVIEW"
              onSubmit={async (values) => {
                await api.submitExhibition(toSubmissionInput(values), profile.id);
                setSubmitted(true);
              }}
            />
            <View style={{ marginTop: 28, alignItems: 'flex-start' }}>
              <TextLink label="MY SUBMISSIONS" onPress={() => router.push('/my-submissions')} />
            </View>
          </>
        )}
        <View style={{ height: 48 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PAGE_PAD,
  },
});
