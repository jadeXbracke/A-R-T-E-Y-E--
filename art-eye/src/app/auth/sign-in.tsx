import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dot, Field, InkBar, Mono, MonoLink } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { colors, space, type } from '../../lib/theme';

export default function SignIn() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      router.dismissTo('/(tabs)/agenda');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.screenX, paddingTop: space.l }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: space.xl }}>
            <Text style={[type.capsLarge, { fontSize: 15, letterSpacing: 4 }]}>ART EYE</Text>
            <Dot size={7} />
          </View>
          <Text style={[type.serifHeading, { marginBottom: 4 }]}>Sign in</Text>
          <Text style={[type.serifItalicBody, { color: colors.grey, marginBottom: space.xl }]}>
            Your eye on the art world.
          </Text>

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          {error && <Mono style={{ color: colors.accent, marginBottom: space.m }}>{error.toUpperCase()}</Mono>}

          <InkBar label={busy ? 'Signing in…' : 'Sign in'} onPress={submit} disabled={busy || !email || !password} />

          <View style={{ marginTop: space.xl, gap: space.l }}>
            <MonoLink label="Create an account →" active onPress={() => router.replace('/auth/sign-up')} />
            <MonoLink label="Back to the agenda" onPress={() => router.dismissTo('/(tabs)/agenda')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
