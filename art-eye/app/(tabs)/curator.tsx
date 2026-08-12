import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArtImage } from '../../src/components/exhibition';
import { BuildStamp, EmptyState, Hairline, Kicker, Loading, MonoLink, RatingDots } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { fmtDay } from '../../src/lib/dates';
import { Exhibition, PROFILE_TYPES, Visit } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

const BIO_LIMIT = 160;

function Avatar({
  uri,
  name,
  size,
  onPress,
  busy,
}: {
  uri?: string | null;
  name: string;
  size: number;
  onPress?: () => void;
  busy?: boolean;
}) {
  const inner = uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
  ) : (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.38 }]}>
        {(name.trim()[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} disabled={busy} hitSlop={4}>
      {inner}
      <Text style={styles.avatarEdit}>{busy ? '…' : 'EDIT'}</Text>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function CuratorScreen() {
  const insets = useSafeAreaInsets();
  const { profile, signOut, refresh } = useAuth();
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [watchCount, setWatchCount] = useState(0);
  const [exhibitions, setExhibitions] = useState<Map<string, Exhibition>>(new Map());
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [bio, setBio] = useState('');
  const [bioDirty, setBioDirty] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (profile && !bioDirty) setBio(profile.bio ?? '');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile])
  );

  const changeAvatar = async () => {
    if (!profile) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    setAvatarBusy(true);
    try {
      const url = await api.uploadImage(result.assets[0].uri);
      await api.updateOwnProfile(profile.id, { avatar_url: url });
      refresh();
    } finally {
      setAvatarBusy(false);
    }
  };

  const saveBio = async () => {
    if (!profile) return;
    setBioBusy(true);
    try {
      await api.updateOwnProfile(profile.id, { bio: bio.trim() || null });
      setBioDirty(false);
      refresh();
    } finally {
      setBioBusy(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (!profile) {
        setVisits(null);
        return;
      }
      (async () => {
        const [v, w, all] = await Promise.all([
          api.listVisits(profile.id),
          api.listWatchlist(profile.id),
          api.listApprovedExhibitions(),
        ]);
        if (!alive) return;
        setVisits(v);
        setWatchCount(w.length);
        const map = new Map(all.map((e) => [e.id, e]));
        // visits can reference exhibitions no longer in the public agenda
        await Promise.all(
          v
            .filter((x) => !map.has(x.exhibition_id))
            .map(async (x) => {
              const e = await api.getExhibition(x.exhibition_id);
              if (e) map.set(e.id, e);
            })
        );
        if (alive) setExhibitions(map);
      })();
      return () => {
        alive = false;
      };
    }, [profile])
  );

  const avg = useMemo(() => {
    if (!visits?.length) return '—';
    return (visits.reduce((s, v) => s + v.rating, 0) / visits.length).toFixed(1);
  }, [visits]);

  if (!profile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: insets.top + space.xl,
          paddingHorizontal: space.page,
        }}
      >
        <Kicker style={{ marginBottom: 10 }}>CURATOR</Kicker>
        <Text style={type.serifHeading}>Your record</Text>
        <Text style={styles.signedOut}>
          Every exhibition you see becomes part of your record — your eye on the art world,
          kept. Sign in to begin.
        </Text>
        <MonoLink
          label="SIGN IN OR CREATE AN ACCOUNT"
          active
          onPress={() => router.push('/auth')}
          style={{ alignSelf: 'flex-start', marginTop: space.l }}
        />
        <BuildStamp style={{ marginTop: space.xl }} />
      </View>
    );
  }

  const typeLabel =
    PROFILE_TYPES.find((t) => t.value === profile.profile_type)?.label ?? 'ENTHUSIAST';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={{ paddingHorizontal: space.page, paddingBottom: space.l }}>
        <Kicker style={{ marginBottom: 10 }}>CURATOR</Kicker>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, marginBottom: space.m }}>
          <Avatar uri={profile.avatar_url} name={profile.display_name} size={64} onPress={changeAvatar} busy={avatarBusy} />
          <View style={{ flex: 1 }}>
            <Text style={[type.serifHeading, { marginBottom: 4 }]}>{profile.display_name}</Text>
            <Text style={styles.profileType}>
              {typeLabel} — {profile.city.toUpperCase()}
            </Text>
          </View>
        </View>
        <TextInput
          value={bio}
          onChangeText={(t) => {
            setBio(t.slice(0, BIO_LIMIT));
            setBioDirty(true);
          }}
          onBlur={() => bioDirty && saveBio()}
          placeholder="Add a short bio — what you collect, what you're drawn to…"
          placeholderTextColor={colors.grey}
          multiline
          style={styles.bioInput}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.bioCount}>{bio.length}/{BIO_LIMIT}</Text>
          {bioDirty && (
            <MonoLink label={bioBusy ? 'SAVING…' : 'SAVE BIO'} active onPress={saveBio} />
          )}
        </View>
      </View>

      <Hairline />
      <View style={styles.stats}>
        <Stat label="SEEN" value={String(visits?.length ?? 0)} />
        <View style={styles.statDivider} />
        <Stat label="WANT TO SEE" value={String(watchCount)} />
        <View style={styles.statDivider} />
        <Stat label="AVG" value={avg} />
      </View>
      <Hairline />

      <View style={{ paddingHorizontal: space.page, paddingTop: space.xl, paddingBottom: space.s }}>
        <Text style={[type.serifHeading, { fontSize: 28 }]}>Your curation</Text>
      </View>

      {visits === null ? (
        <Loading />
      ) : visits.length === 0 ? (
        <EmptyState>
          Your log is empty. Every exhibition you see becomes part of your record — your eye
          on the art world, kept.
        </EmptyState>
      ) : (
        visits.map((v, i) => {
          const e = exhibitions.get(v.exhibition_id);
          return (
            <Pressable
              key={v.exhibition_id}
              onPress={() => e && router.push(`/exhibition/${e.id}`)}
            >
              {i > 0 && <Hairline style={{ marginHorizontal: space.page }} />}
              <View style={styles.entry}>
                {e && (
                  <ArtImage
                    uri={e.image_url}
                    venueUri={e.venue?.image_url}
                    fallbackId={e.id}
                    style={styles.entryThumb}
                    contentFit="cover"
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryMeta}>
                    {fmtDay(v.visit_date, true)} · {e?.venue?.name.toUpperCase() ?? ''}
                  </Text>
                  <Text style={styles.entryTitle} numberOfLines={2}>
                    {e?.title ?? 'Exhibition'}
                  </Text>
                  <RatingDots value={v.rating} size={9} gap={7} />
                  {!!v.reflection && (
                    <Text style={styles.entryNote}>“{v.reflection}”</Text>
                  )}
                </View>
              </View>
            </Pressable>
          );
        })
      )}

      <View style={styles.footerLinks}>
        <MonoLink
          label="SUBMIT A SHOW"
          active
          onPress={() => router.push('/submit')}
          style={{ alignSelf: 'flex-start' }}
        />
        {profile.role === 'admin' && (
          <MonoLink
            label="HOST CONTROL — MANAGE THE APP"
            active
            onPress={() => router.push('/admin')}
            style={{ alignSelf: 'flex-start' }}
          />
        )}
        <MonoLink
          label="SEND FEEDBACK TO THE OWNER"
          onPress={() => router.push('/feedback')}
          style={{ alignSelf: 'flex-start' }}
        />
        <MonoLink
          label="SIGN OUT"
          onPress={() => signOut()}
          style={{ alignSelf: 'flex-start' }}
        />
        <BuildStamp style={{ marginTop: space.l }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  signedOut: {
    fontFamily: fonts.serifItalic, letterSpacing: 2.2, textTransform: 'uppercase',
    fontSize: 16,
    lineHeight: 26,
    color: colors.ink,
    marginTop: space.l,
  },
  profileType: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.ink,
  },
  avatarFallback: {
    backgroundColor: colors.dim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontFamily: fonts.serifMedium, color: colors.ink },
  avatarEdit: {
    fontFamily: fonts.monoMedium,
    fontSize: 8,
    letterSpacing: 1,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  },
  bioInput: {
    ...type.serifBody,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    minHeight: 44,
    paddingVertical: 6,
  },
  bioCount: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.6, color: colors.ink, opacity: 0.4 },
  stats: { flexDirection: 'row', paddingVertical: space.l },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.hairline },
  statValue: { fontFamily: fonts.serifMedium, letterSpacing: 3.4, textTransform: 'uppercase', fontSize: 24, color: colors.ink, marginBottom: 4 },
  statLabel: { ...type.monoLabel },
  entry: {
    flexDirection: 'row',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
  },
  entryThumb: { width: 64, height: 80, backgroundColor: colors.dim },
  entryMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.ink,
    marginBottom: 4,
  },
  entryTitle: { ...type.serifTitle, fontSize: 19, marginBottom: 7 },
  entryNote: {
    fontFamily: fonts.serifItalic, letterSpacing: 1.8, textTransform: 'uppercase',
    fontSize: 13,
    lineHeight: 20,
    color: colors.ink,
    marginTop: 8,
  },
  footerLinks: {
    paddingHorizontal: space.page,
    marginTop: space.xxl,
    gap: space.l,
  },
});
