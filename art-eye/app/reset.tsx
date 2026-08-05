// New-password screen. Reached from the emailed recovery link (the link signs
// the user in; AuthProvider routes here on PASSWORD_RECOVERY).
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Kicker } from '../src/components/ui';
import { api } from '../src/lib/api';
import { colors, fonts, space, type } from '../src/theme';

export default function ResetPassword() {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.updatePassword(password);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.page, { paddingTop: insets.top + space.xl }]}>
      <Kicker style={{ marginBottom: 10 }}>ACCOUNT</Kicker>
      <Text style={type.serifHeading}>New password</Text>
      {done ? (
        <>
          <Text style={styles.note}>Your password is set. You are signed in.</Text>
          <Pressable style={styles.button} onPress={() => router.replace('/')}>
            <Text style={styles.buttonText}>TO THE AGENDA</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.label}>NEW PASSWORD</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            autoFocus
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.grey}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={[styles.button, busy && { opacity: 0.4 }]} disabled={busy} onPress={submit}>
            <Text style={styles.buttonText}>SAVE PASSWORD</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.page },
  note: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: colors.ink, marginTop: space.m },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.ink,
    marginTop: space.l,
    marginBottom: 6,
  },
  input: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    paddingVertical: 10,
  },
  error: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink, marginTop: space.s },
  button: {
    marginTop: space.l,
    backgroundColor: colors.ink,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.5, color: colors.bg },
});
