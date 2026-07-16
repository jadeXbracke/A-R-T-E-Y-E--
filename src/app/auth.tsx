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

import { Field, Hairline, InkBar, TextLink } from '../components/ui';
import { api } from '../lib/api';
import { useApp } from '../lib/app-context';
import {
  PROFILE_TYPE_LABELS,
  type ProfileType,
  type UserRole,
} from '../lib/types';
import { colors, PAGE_PAD, type } from '../theme';

const PROFILE_TYPES = Object.keys(PROFILE_TYPE_LABELS) as ProfileType[];

export default function AuthScreen() {
  const router = useRouter();
  const { setProfile, refreshPersonal, isDemo } = useApp();

  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileType, setProfileType] = useState<ProfileType>('enthusiast');
  const [role, setRole] = useState<Extract<UserRole, 'user' | 'venue_owner'>>('user');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'up' && !displayName.trim()) {
      setError('Please add your name — it appears on your Curator profile.');
      return;
    }
    setBusy(true);
    try {
      const profile =
        mode === 'in'
          ? await api.signIn(email, password)
          : await api.signUp({
              email,
              password,
              display_name: displayName,
              profile_type: profileType,
              role,
            });
      setProfile(profile);
      await refreshPersonal();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[type.wordmark, { marginTop: 28 }]}>ART EYE</Text>
        <Text style={[type.monoSmall, { marginTop: 6, marginBottom: 28 }]}>
          YOUR EYE ON THE ART WORLD
        </Text>
        <Hairline style={{ marginBottom: 24 }} />

        <View style={{ flexDirection: 'row', gap: 24, marginBottom: 28 }}>
          <TextLink label="SIGN IN" active={mode === 'in'} onPress={() => setMode('in')} />
          <TextLink label="CREATE ACCOUNT" active={mode === 'up'} onPress={() => setMode('up')} />
        </View>

        {mode === 'up' ? (
          <Field
            label="YOUR NAME"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            placeholder="As it appears on your profile"
          />
        ) : null}
        <Field
          label="EMAIL"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Field
          label="PASSWORD"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder={mode === 'up' ? 'At least 6 characters' : ''}
        />

        {mode === 'up' ? (
          <>
            <Text style={[type.monoLabel, { marginBottom: 10 }]}>YOU ARE A</Text>
            <View style={styles.linkRow}>
              {PROFILE_TYPES.map((p) => (
                <TextLink
                  key={p}
                  label={PROFILE_TYPE_LABELS[p].toUpperCase()}
                  active={profileType === p}
                  onPress={() => setProfileType(p)}
                />
              ))}
            </View>
            <Text style={[type.monoLabel, { marginTop: 24, marginBottom: 10 }]}>
              ACCOUNT TYPE
            </Text>
            <View style={styles.linkRow}>
              <TextLink label="CURATOR" active={role === 'user'} onPress={() => setRole('user')} />
              <TextLink
                label="VENUE — I LIST EXHIBITIONS"
                active={role === 'venue_owner'}
                onPress={() => setRole('venue_owner')}
              />
            </View>
          </>
        ) : null}

        {error ? (
          <Text style={[type.monoSmall, { color: colors.red, marginTop: 12 }]}>
            {error.toUpperCase()}
          </Text>
        ) : null}

        <View style={{ marginTop: 32 }}>
          <InkBar
            label={mode === 'in' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            onPress={submit}
            busy={busy}
          />
        </View>

        <View style={{ marginTop: 28, alignItems: 'flex-start' }}>
          <TextLink
            label="SUBMIT AN EXHIBITION — NO ACCOUNT NEEDED"
            onPress={() => router.push('/submit-public')}
          />
        </View>

        {isDemo ? (
          <Text style={[type.monoSmall, { marginTop: 28, color: colors.grey }]}>
            DEMO MODE — ACCOUNTS ARE STORED ON THIS DEVICE ONLY.
          </Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PAGE_PAD,
    paddingBottom: 48,
  },
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: 14,
  },
});
