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
  emptyInput,
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
import { FormNote, Loading } from '../../../src/components/kit';
import { client } from '../../../src/lib/client';
import { useAppState } from '../../../src/state/AppState';
import { color, space } from '../../../src/theme';
import type { ExhibitionInput } from '../../../src/types';

/** Venue owners create and edit their own submissions. */
export default function VenueEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const router = useRouter();
  const { profile } = useAppState();
  const [input, setInput] = useState<ExhibitionInput | null>(isNew ? emptyInput() : null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) return;
    client.getExhibition(String(id)).then((e) => {
      if (e) setInput(inputFromExhibition(e));
    });
  }, [id, isNew]);

  if (!profile) {
    return (
      <View style={styles.screen}>
        <Header back />
        <BodyItalic style={styles.missing}>Sign in with your venue account first.</BodyItalic>
      </View>
    );
  }

  const save = async () => {
    if (!input) return;
    const problem = validateInput(input);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (isNew) {
        await client.submitExhibition(input, profile.id);
      } else {
        await client.updateSubmission(String(id), input);
      }
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
            <MonoLabelMuted>{isNew ? 'NEW SUBMISSION' : 'EDIT SUBMISSION'}</MonoLabelMuted>
            <HeadingXL style={styles.heading}>
              {isNew ? 'A new exhibition' : 'Refine the details'}
            </HeadingXL>
            <BodyItalic style={styles.intro}>
              {isNew
                ? 'It goes to the curators first, then joins the agenda.'
                : 'Edits go back to the curators for a fresh look before publishing.'}
            </BodyItalic>

            <ExhibitionForm input={input} onChange={setInput} />
            <FormNote text={error} error />

            <Pressable
              onPress={save}
              disabled={busy}
              style={({ pressed }) => [styles.bar, (pressed || busy) && { opacity: 0.85 }]}
            >
              <MonoLabel style={{ color: color.paper }}>
                {busy ? 'SENDING…' : 'SEND FOR REVIEW'}
              </MonoLabel>
            </Pressable>
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
  missing: {
    padding: space.xl,
    textAlign: 'center',
    color: color.grey,
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
  bar: {
    backgroundColor: color.ink,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: space.xl,
  },
});
