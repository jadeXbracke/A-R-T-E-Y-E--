import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Field, Hairline, InkBar, Kicker, MonoLink, Wordmark } from '../src/components/ui';
import { DEMO_MODE } from '../src/lib/api';
import { useAuth } from '../src/lib/auth';
import { ProfileType, PROFILE_TYPES, VenueType } from '../src/lib/types';
import { colors, fonts, space, type } from '../src/theme';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileType, setProfileType] = useState<ProfileType>('enthusiast');
  const [isVenue, setIsVenue] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [venueType, setVenueType] = useState<VenueType>('gallery');
  const [venueAddress, setVenueAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'up' && !displayName.trim()) {
      setError('Tell us your name — it appears on your Curator profile.');
      return;
    }
    if (mode === 'up' && isVenue && !venueName.trim()) {
      setError('Name your venue.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'in') {
        await signIn(email, password);
      } else {
        await signUp({
          email,
          password,
          display_name: displayName,
          profile_type: profileType,
          role: isVenue ? 'venue_owner' : 'user',
          venue: isVenue
            ? { name: venueName, type: venueType, address: venueAddress }
            : undefined,
        });
      }
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: space.page, paddingTop: space.l }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headRow}>
          <Wordmark size={22} />
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.cancel}>CLOSE</Text>
          </Pressable>
        </View>
        <Text style={styles.lede}>Your eye on the art world.</Text>

        <View style={{ flexDirection: 'row', gap: space.l, marginBottom: space.xl }}>
          <MonoLink label="SIGN IN" active={mode === 'in'} onPress={() => setMode('in')} />
          <MonoLink label="CREATE ACCOUNT" active={mode === 'up'} onPress={() => setMode('up')} />
        </View>

        {mode === 'up' && (
          <Field
            label="YOUR NAME"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="As shown on your profile"
            autoCapitalize="words"
          />
        )}
        <Field
          label="EMAIL"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Field
          label="PASSWORD"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        {mode === 'up' && (
          <>
            <Kicker style={{ marginBottom: 10 }}>YOU ARE A…</Kicker>
            <View style={styles.typeRow}>
              {PROFILE_TYPES.map((t) => (
                <MonoLink
                  key={t.value}
                  label={t.label}
                  active={profileType === t.value}
                  onPress={() => setProfileType(t.value)}
                />
              ))}
            </View>

            <Hairline style={{ marginBottom: space.l }} />
            <View style={{ flexDirection: 'row', gap: space.l, marginBottom: space.l }}>
              <MonoLink
                label="ART LOVER"
                active={!isVenue}
                onPress={() => setIsVenue(false)}
              />
              <MonoLink
                label="I RUN A VENUE"
                active={isVenue}
                onPress={() => setIsVenue(true)}
              />
            </View>

            {isVenue && (
              <>
                <Field
                  label="VENUE NAME"
                  value={venueName}
                  onChangeText={setVenueName}
                  placeholder="e.g. Roslyn Oxley9 Gallery"
                />
                <Kicker style={{ marginBottom: 10 }}>VENUE TYPE</Kicker>
                <View style={{ flexDirection: 'row', gap: space.m, marginBottom: space.l }}>
                  <MonoLink
                    label="GALLERY"
                    active={venueType === 'gallery'}
                    onPress={() => setVenueType('gallery')}
                  />
                  <MonoLink
                    label="MUSEUM"
                    active={venueType === 'museum'}
                    onPress={() => setVenueType('museum')}
                  />
                </View>
                <Field
                  label="ADDRESS — SYDNEY"
                  value={venueAddress}
                  onChangeText={setVenueAddress}
                  placeholder="Street, suburb"
                />
              </>
            )}
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <InkBar
          label={mode === 'in' ? 'SIGN IN' : 'CREATE YOUR ACCOUNT'}
          onPress={submit}
          busy={busy}
        />

        {DEMO_MODE && (
          <Text style={styles.demoNote}>
            Demo build — try jadebrack@gmail.com (admin), gallery@arteye.demo (venue) or
            curator@arteye.demo, password “arteye”.
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.l,
  },
  cancel: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  lede: {
    fontFamily: fonts.serifItalic, letterSpacing: 2.9, textTransform: 'uppercase',
    fontSize: 21,
    color: colors.ink,
    marginBottom: space.xl,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.m,
    marginBottom: space.l,
  },
  error: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.ink,
    marginBottom: space.m,
  },
  demoNote: {
    fontFamily: fonts.mono,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.4,
    color: colors.ink,
    marginTop: space.l,
  },
});
