import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
  validateInput,
} from '../src/components/ExhibitionForm';
import { Header } from '../src/components/Header';
import {
  BodyItalic,
  HeadingXL,
  MonoLabel,
  MonoLabelMuted,
} from '../src/components/Type';
import { FormNote } from '../src/components/kit';
import { client } from '../src/lib/client';
import { useAppState } from '../src/state/AppState';
import { color, space } from '../src/theme';

/** Public submission form — no account needed. Creates a pending row. */
export default function SubmitExhibition() {
  const router = useRouter();
  const { profile } = useAppState();
  const [input, setInput] = useState(emptyInput());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const problem = validateInput(input);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await client.submitExhibition(input, profile?.id ?? null);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  if (done) {
    return (
      <View style={styles.screen}>
        <Header back />
        <View style={styles.done}>
          <MonoLabelMuted>RECEIVED</MonoLabelMuted>
          <HeadingXL style={{ marginTop: space.s }}>Thank you</HeadingXL>
          <BodyItalic style={styles.doneText}>
            Your exhibition is with our curators. Once it’s approved it joins the
            agenda — usually within a day or two.
          </BodyItalic>
          <Pressable
            onPress={() => router.dismissTo('/(tabs)/agenda')}
            style={styles.bar}
          >
            <MonoLabel style={{ color: color.paper }}>BACK TO THE AGENDA</MonoLabel>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header back />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <MonoLabelMuted>FOR VENUES & FRIENDS OF VENUES</MonoLabelMuted>
          <HeadingXL style={styles.heading}>Submit an exhibition</HeadingXL>
          <BodyItalic style={styles.intro}>
            No account needed. Everything submitted is reviewed by our curators
            before it appears in the agenda.
          </BodyItalic>

          <ExhibitionForm input={input} onChange={setInput} />
          <FormNote text={error} error />

          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [styles.bar, (pressed || busy) && { opacity: 0.85 }]}
          >
            <MonoLabel style={{ color: color.paper }}>
              {busy ? 'SENDING…' : 'SEND FOR REVIEW'}
            </MonoLabel>
          </Pressable>
        </ScrollView>
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
  done: {
    padding: space.gutter,
    paddingTop: space.xxl,
  },
  doneText: {
    color: color.grey,
    marginTop: space.l,
  },
  bar: {
    backgroundColor: color.ink,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: space.xl,
  },
});
