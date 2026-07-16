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

import { SubmissionForm, toSubmissionInput } from '../components/submission-form';
import { Hairline, MonoLabel, TextLink } from '../components/ui';
import { api } from '../lib/api';
import { colors, PAGE_PAD, type } from '../theme';

/** Public "Submit an exhibition" — no account needed; lands as pending. */
export default function SubmitPublicScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={{ paddingTop: insets.top + 18, paddingBottom: 4 }}>
          <TextLink label="← BACK" onPress={() => router.back()} />
        </View>
        <View style={{ paddingTop: 14, paddingBottom: 18 }}>
          <MonoLabel>OPEN TO ALL — NO ACCOUNT NEEDED</MonoLabel>
          <Text style={[type.serifHeading, { marginTop: 8 }]}>Submit an exhibition</Text>
          <Text style={[type.monoSmall, { marginTop: 10 }]}>
            EVERY SUBMISSION IS REVIEWED BEFORE IT JOINS THE AGENDA.
          </Text>
        </View>
        <Hairline style={{ marginBottom: 26 }} />

        {submitted ? (
          <View>
            <Text style={type.serifQuote}>
              Thank you — your submission is with our curators for review. If it
              belongs in the Sydney agenda, you will see it there soon.
            </Text>
            <View style={{ marginTop: 24, flexDirection: 'row', gap: 20 }}>
              <TextLink label="SUBMIT ANOTHER" onPress={() => setSubmitted(false)} />
              <TextLink label="DONE" onPress={() => router.back()} />
            </View>
          </View>
        ) : (
          <SubmissionForm
            askEmail
            submitLabel="SUBMIT FOR REVIEW"
            onSubmit={async (values) => {
              await api.submitExhibition(toSubmissionInput(values), null);
              setSubmitted(true);
            }}
          />
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
