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
import { Field, OptionRow } from '../../src/components/Field';
import { Header } from '../../src/components/Header';
import {
  BodyItalic,
  HeadingXL,
  MonoLabel,
  MonoLabelMuted,
} from '../../src/components/Type';
import { FormNote, TextLink } from '../../src/components/kit';
import { useAppState } from '../../src/state/AppState';
import { color, space } from '../../src/theme';
import type { ProfileType } from '../../src/types';

const PROFILE_TYPES: { value: ProfileType; label: string }[] = [
  { value: 'collector', label: 'COLLECTOR' },
  { value: 'enthusiast', label: 'ENTHUSIAST' },
  { value: 'student', label: 'STUDENT' },
  { value: 'artist', label: 'ARTIST' },
  { value: 'gallery_professional', label: 'GALLERY PROFESSIONAL' },
];

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAppState();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'venue_owner'>('user');
  const [venueName, setVenueName] = useState('');
  const [profileType, setProfileType] = useState<ProfileType | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      setError('Name, email and password are all needed.');
      return;
    }
    if (!profileType) {
      setError('Choose how you look at art — it appears on your profile.');
      return;
    }
    if (role === 'venue_owner' && !venueName.trim()) {
      setError('Tell us which venue you represent.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signUp({
        email,
        password,
        display_name: displayName,
        profile_type: profileType,
        role,
        venue_name: role === 'venue_owner' ? venueName : undefined,
      });
      router.dismissTo('/(tabs)/profile');
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
          <MonoLabelMuted>BECOME A CURATOR</MonoLabelMuted>
          <HeadingXL style={styles.heading}>Create your account</HeadingXL>

          <Field label="NAME" value={displayName} onChangeText={setDisplayName} />
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
            autoComplete="password-new"
          />

          <OptionRow
            label="ACCOUNT"
            options={[
              { value: 'user', label: 'CURATOR' },
              { value: 'venue_owner', label: 'VENUE' },
            ]}
            value={role}
            onChange={setRole}
          />
          {role === 'venue_owner' ? (
            <Field
              label="VENUE NAME"
              value={venueName}
              onChangeText={setVenueName}
              placeholder="e.g. OLSEN Annexe"
            />
          ) : null}

          <OptionRow
            label="HOW DO YOU LOOK AT ART?"
            options={PROFILE_TYPES}
            value={profileType}
            onChange={setProfileType}
          />
          <BodyItalic style={styles.hint}>
            A label for your profile, nothing more. You can be all five at once —
            pick the one that fits today.
          </BodyItalic>

          <FormNote text={error} error />

          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [styles.bar, (pressed || busy) && { opacity: 0.85 }]}
          >
            <MonoLabel style={{ color: color.paper }}>
              {busy ? 'CREATING…' : 'CREATE ACCOUNT'}
            </MonoLabel>
          </Pressable>

          <View style={styles.alt}>
            <TextLink
              label="ALREADY A CURATOR? SIGN IN"
              onPress={() => router.replace('/auth/sign-in')}
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
    paddingBottom: space.xxl,
  },
  heading: {
    marginTop: space.s,
    marginBottom: space.xl,
  },
  hint: {
    color: color.grey,
    fontSize: 15,
    lineHeight: 21,
    marginTop: -space.s,
    marginBottom: space.m,
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
