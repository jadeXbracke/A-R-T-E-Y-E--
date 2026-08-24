import { router } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Field, Wordmark } from '../src/components/ui';
import { useAuth } from '../src/lib/auth';
import { useTheme } from '../src/lib/theme-context';
import { space, type } from '../src/theme';

export default function AuthScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      if (mode === 'in') await signIn(email.trim(), password);
      else await signUp(email.trim(), password);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space.xxl, paddingHorizontal: space.page }}>
      <Wordmark size={22} />
      <Text style={[type.heading, { color: palette.ink, marginTop: space.xxl }]}>
        {mode === 'in' ? 'Welcome back' : 'Start with one mark'}
      </Text>
      <Body dim style={{ marginTop: space.s }}>
        Small daily actions, added up, decide who you become.
      </Body>
      <View style={{ marginTop: space.xl, gap: space.m }}>
        <Field placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Field placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        {error ? <Body dim>{error}</Body> : null}
        <Button label={mode === 'in' ? 'Sign in' : 'Create account'} onPress={submit} disabled={busy || !email || !password} />
        <Text
          style={[type.small, { color: palette.dim, textAlign: 'center', marginTop: space.s }]}
          onPress={() => setMode(mode === 'in' ? 'up' : 'in')}
        >
          {mode === 'in' ? 'No account yet? Create one.' : 'Already have an account? Sign in.'}
        </Text>
      </View>
    </View>
  );
}
