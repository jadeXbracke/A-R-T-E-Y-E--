import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Field, InkBar, Mono, MonoLink } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { colors, space, type } from '../../lib/theme';
import { PROFILE_TYPE_LABELS, ProfileType, Role } from '../../lib/types';

const PROFILE_TYPES = Object.keys(PROFILE_TYPE_LABELS) as ProfileType[];

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profileType, setProfileType] = useState<ProfileType>('enthusiast');
  const [role, setRole] = useState<Role>('user');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signUp(email, password, displayName, role, profileType);
      router.dismissTo('/(tabs)/agenda');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const valid = displayName.trim().length > 0 && email.includes('@') && password.length >= 6;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.screenX, paddingTop: space.l, paddingBottom: space.xxl }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[type.serifHeading, { marginBottom: 4 }]}>Create an account</Text>
          <Text style={[type.serifItalicBody, { color: colors.grey, marginBottom: space.xl }]}>
            Begin your record of the art you see.
          </Text>

          <Field label="Name" value={displayName} onChangeText={setDisplayName} autoComplete="name" />
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
            hint="Six characters or more."
          />

          <Mono style={{ marginBottom: space.m }}>YOU ARE HERE AS</Mono>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.l, marginBottom: space.xl }}>
            {PROFILE_TYPES.map((t) => (
              <MonoLink
                key={t}
                label={PROFILE_TYPE_LABELS[t]}
                active={profileType === t}
                onPress={() => setProfileType(t)}
              />
            ))}
          </View>

          <Mono style={{ marginBottom: space.m }}>ACCOUNT</Mono>
          <View style={{ flexDirection: 'row', gap: space.l, marginBottom: space.s }}>
            <MonoLink label="Curator" active={role === 'user'} onPress={() => setRole('user')} />
            <MonoLink label="Venue" active={role === 'venue_owner'} onPress={() => setRole('venue_owner')} />
          </View>
          <Text
            style={[type.serifItalicBody, { fontSize: 14, lineHeight: 19, color: colors.grey, marginBottom: space.xl }]}
          >
            {role === 'venue_owner'
              ? 'Venue accounts can submit and edit exhibitions for their own venue. Listings appear once approved.'
              : 'Curate your list, keep your record.'}
          </Text>

          {error && <Mono style={{ color: colors.accent, marginBottom: space.m }}>{error.toUpperCase()}</Mono>}

          <InkBar label={busy ? 'Creating…' : 'Create account'} onPress={submit} disabled={busy || !valid} />

          <View style={{ marginTop: space.xl, gap: space.l }}>
            <MonoLink label="Sign in instead" onPress={() => router.replace('/auth/sign-in')} />
            <MonoLink label="Back to the agenda" onPress={() => router.dismissTo('/(tabs)/agenda')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
