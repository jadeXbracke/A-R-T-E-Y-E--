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
import { Field } from '../../src/components/Field';
import { Header } from '../../src/components/Header';
import { HeadingXL, MonoLabel, MonoLabelMuted } from '../../src/components/Type';
import { FormNote, TextLink } from '../../src/components/kit';
import { useAppState } from '../../src/state/AppState';
import { color, space } from '../../src/theme';

export default function SignIn() {
  const router = useRouter();
  const { signIn } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
      router.dismissTo('/(tabs)/agenda');
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
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <MonoLabelMuted>WELCOME BACK</MonoLabelMuted>
          <HeadingXL style={styles.heading}>Sign in</HeadingXL>

          <Field
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Field
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
          <FormNote text={error} error />

          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [styles.bar, (pressed || busy) && { opacity: 0.85 }]}
          >
            <MonoLabel style={{ color: color.paper }}>
              {busy ? 'SIGNING IN…' : 'SIGN IN'}
            </MonoLabel>
          </Pressable>

          <View style={styles.alt}>
            <TextLink
              label="NEW HERE? CREATE AN ACCOUNT"
              onPress={() => router.replace('/auth/sign-up')}
            />
          </View>
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
  },
  heading: {
    marginTop: space.s,
    marginBottom: space.xl,
  },
  bar: {
    backgroundColor: color.ink,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: space.l,
  },
  alt: {
    marginTop: space.xl,
    alignItems: 'center',
  },
});
