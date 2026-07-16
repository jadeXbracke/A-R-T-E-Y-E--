import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { BackBar } from '@/components/Header';
import { Field, FieldLabel, InkButton, MonoText, OptionRow, UnderlineLink } from '@/components/ui';
import { useStore } from '@/lib/store';
import { ProfileType, Role } from '@/lib/types';
import { color, space, type } from '@/theme';

const PROFILE_OPTIONS: { key: ProfileType; label: string }[] = [
  { key: 'collector', label: 'COLLECTOR' },
  { key: 'enthusiast', label: 'ENTHUSIAST' },
  { key: 'student', label: 'STUDENT' },
  { key: 'artist', label: 'ARTIST' },
  { key: 'gallery_professional', label: 'GALLERY PROFESSIONAL' },
];

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, backendKind } = useStore();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [profileType, setProfileType] = useState<ProfileType | null>(null);
  const [role, setRole] = useState<Role>('user');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    try {
      if (!email.trim() || !password) {
        Alert.alert('Account', 'Email and password are required.');
        return;
      }
      setBusy(true);
      if (mode === 'in') {
        await signIn(email, password);
      } else {
        if (!name.trim()) {
          Alert.alert('Account', 'Add a display name — it appears on your Curator profile.');
          return;
        }
        if (!profileType) {
          Alert.alert('Account', 'Choose how you look at art — it is a label, not a test.');
          return;
        }
        await signUp({ email, password, displayName: name, role, profileType });
      }
      router.back();
    } catch (err) {
      Alert.alert('Account', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BackBar title="ACCOUNT" />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 26, gap: space.l }}>
          <View style={{ flexDirection: 'row', gap: 24 }}>
            <UnderlineLink label="SIGN IN" active={mode === 'in'} onPress={() => setMode('in')} />
            <UnderlineLink label="CREATE ACCOUNT" active={mode === 'up'} onPress={() => setMode('up')} />
          </View>

          <Text style={type.noteSerif}>
            {mode === 'in'
              ? 'Welcome back. Your record is where you left it.'
              : 'One account, one record. Everything you see, kept.'}
          </Text>

          {mode === 'up' && (
            <View>
              <FieldLabel>DISPLAY NAME</FieldLabel>
              <Field value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
            </View>
          )}

          <View>
            <FieldLabel>EMAIL</FieldLabel>
            <Field
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
          <View>
            <FieldLabel>PASSWORD</FieldLabel>
            <Field value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
          </View>

          {mode === 'up' && (
            <>
              <View>
                <FieldLabel>HOW DO YOU LOOK AT ART?</FieldLabel>
                <OptionRow options={PROFILE_OPTIONS} value={profileType} onChange={setProfileType} />
              </View>
              <View>
                <FieldLabel>ACCOUNT TYPE</FieldLabel>
                <OptionRow
                  options={[
                    { key: 'user', label: 'CURATOR' },
                    { key: 'venue_owner', label: 'VENUE' },
                  ]}
                  value={role}
                  onChange={(r) => setRole(r)}
                />
                {role === 'venue_owner' && (
                  <MonoText style={{ marginTop: 8 }}>
                    VENUE ACCOUNTS CAN SUBMIT AND EDIT EXHIBITIONS FOR THEIR OWN VENUE.
                  </MonoText>
                )}
              </View>
            </>
          )}

          <InkButton
            label={mode === 'in' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            onPress={submit}
            loading={busy}
          />

          {backendKind === 'demo' && (
            <MonoText>
              DEMO MODE — ACCOUNTS LIVE ON THIS DEVICE.{' '}
              {'\n'}ADMIN: SIGN IN AS JADEBRACK@GMAIL.COM, ANY PASSWORD.
            </MonoText>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
