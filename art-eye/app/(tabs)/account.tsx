import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hairline, Kicker, InkBar, Loading, MonoLink } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { Profile } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

// Account safety: manage who you've blocked, and — an App Store requirement
// (guideline 5.1.1v) — delete your account and everything tied to it, from
// inside the app, with no need to contact support.
export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();

  const [blocked, setBlocked] = useState<Profile[] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (profile) api.listBlocked(profile.id).then(setBlocked);
  }, [profile]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  if (!profile) {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Sign in first</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
    );
  }

  const unblock = async (id: string) => {
    await api.unblockUser(profile.id, id);
    reload();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api.deleteOwnAccount(profile.id);
      // The account is gone server-side; also clear the in-memory session so
      // the UI doesn't keep showing the deleted profile until a reload.
      await signOut();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete your account.');
      setDeleting(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.head}>
        <Kicker>ACCOUNT</Kicker>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <Text style={[type.serifHeading, styles.heading]}>Account</Text>
      <Hairline style={{ marginTop: space.m }} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BLOCKED PEOPLE</Text>
        {blocked === null ? (
          <Loading />
        ) : blocked.length === 0 ? (
          <Text style={styles.hint}>Nobody blocked. Block someone from their profile.</Text>
        ) : (
          blocked.map((p) => (
            <View key={p.id} style={styles.blockedRow}>
              <Text style={styles.blockedName} numberOfLines={1}>
                {p.display_name}
              </Text>
              <MonoLink label="UNBLOCK" onPress={() => unblock(p.id)} />
            </View>
          ))
        )}
      </View>

      <Hairline style={{ marginTop: space.l }} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DELETE ACCOUNT</Text>
        <Text style={styles.hint}>
          Permanently deletes your account, your log, follows, messages and posts. This cannot be
          undone.
        </Text>
        {!!error && <Text style={styles.error}>{error.toUpperCase()}</Text>}
        {!confirming ? (
          <Pressable onPress={() => setConfirming(true)} hitSlop={8} style={{ marginTop: space.m }}>
            <Text style={styles.deleteLink}>DELETE MY ACCOUNT</Text>
          </Pressable>
        ) : (
          <View style={{ marginTop: space.m, gap: space.m }}>
            <Text style={styles.confirmText}>
              Are you sure? Everything you've added to ART EYE will be gone for good.
            </Text>
            <InkBar
              label={deleting ? 'DELETING…' : 'YES, PERMANENTLY DELETE MY ACCOUNT'}
              onPress={confirmDelete}
              busy={deleting}
            />
            <Pressable onPress={() => setConfirming(false)} hitSlop={8}>
              <Text style={styles.back}>CANCEL</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page, gap: space.m },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.page,
  },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink },
  heading: { paddingHorizontal: space.page, marginTop: 10 },
  section: { paddingHorizontal: space.page, paddingTop: space.l },
  sectionTitle: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.8, color: colors.ink, marginBottom: space.s },
  hint: { fontFamily: fonts.serif, fontSize: 14, lineHeight: 21, color: colors.ink, opacity: 0.7 },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  blockedName: { ...type.serifTitle, fontSize: 16, flex: 1, marginRight: space.m },
  deleteLink: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink },
  confirmText: { fontFamily: fonts.serif, fontSize: 14, lineHeight: 21, color: colors.ink },
  error: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.ink, marginTop: space.s },
});
