import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hairline, Kicker, Loading, MonoLink } from '../../src/components/ui';
import { ActivityRow, PersonRow } from '../../src/components/social';
import { PROFILE_TYPES } from '../../src/lib/types';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { confirmAction } from '../../src/lib/confirm';
import { FeedItem, PostEngagement, Profile, PublicProfile } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

function typeLabel(pt: Profile['profile_type']): string {
  return PROFILE_TYPES.find((t) => t.value === pt)?.label ?? pt.toUpperCase();
}

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { profile: me, refresh, signOut } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  const [activity, setActivity] = useState<FeedItem[]>([]);
  const [engagement, setEngagement] = useState<Record<string, PostEngagement>>({});
  const [requests, setRequests] = useState<Profile[]>([]);
  const [blockedByMe, setBlockedByMe] = useState(false);

  const isOwn = !!me && me.id === id;

  const reload = useCallback(() => {
    if (!id) return;
    api.getPublicProfile(id, me?.id ?? null).then(setProfile);
    api.userActivity(id, me?.id ?? null).then(async (a) => {
      setActivity(a);
      setEngagement(await api.postEngagement(me?.id ?? null, a));
    });
    if (me && me.id === id) api.listFollowRequests(id).then(setRequests);
    if (me && me.id !== id) {
      api.listBlockedIds(me.id).then((ids) => setBlockedByMe(ids.includes(id)));
    }
  }, [id, me]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  if (profile === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <Loading />
      </View>
    );
  }
  if (profile === null) {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Profile not found</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
    );
  }

  const toggleFollow = async () => {
    if (!me) {
      router.push('/auth');
      return;
    }
    if (profile.follow_state === 'none') await api.followUser(me.id, profile.id);
    else await api.unfollowUser(me.id, profile.id);
    reload();
  };

  const setPrivacy = async (isPrivate: boolean) => {
    if (!isOwn) return;
    await api.setProfilePrivacy(profile.id, isPrivate);
    reload();
    refresh();
  };

  const respond = async (requesterId: string, accept: boolean) => {
    await api.respondFollowRequest(profile.id, requesterId, accept);
    reload();
  };

  const toggleBlock = () => {
    if (!me) return;
    if (blockedByMe) {
      api.unblockUser(me.id, profile.id).then(reload);
      return;
    }
    confirmAction(
      `Block ${profile.display_name}?`,
      'They won’t be able to message you, and you won’t see each other’s activity. Any follow between you is removed.',
      async () => {
        await api.blockUser(me.id, profile.id);
        reload();
      }
    );
  };

  const report = () => {
    if (!me) {
      router.push('/auth');
      return;
    }
    confirmAction(
      `Report ${profile.display_name}?`,
      'This sends the profile to the host for review.',
      async () => {
        await api.reportContent({
          reporterId: me.id,
          kind: 'profile',
          subjectUserId: profile.id,
          reason: 'Profile reported from the app',
        });
      }
    );
  };

  const deleteAccount = () => {
    if (!me) return;
    confirmAction(
      'Delete your account?',
      'This permanently removes your profile, posts, comments, likes and messages. There is no undo.',
      async () => {
        await api.deleteAccount(me.id);
        await signOut();
        router.replace('/(tabs)');
      }
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: insets.bottom + space.xl }}
    >
      <View style={styles.head}>
        <Kicker>{typeLabel(profile.profile_type)}</Kicker>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: space.page }}>
        <Text style={type.serifHeading}>{profile.display_name}</Text>
        <Text style={styles.city}>
          {profile.city.toUpperCase()}
          {profile.is_private ? '  ·  PRIVATE' : '  ·  PUBLIC'}
        </Text>

        <View style={styles.stats}>
          <Stat label="FOLLOWERS" value={profile.followers} />
          <Stat label="FOLLOWING" value={profile.following} />
          <Stat label="LOGGED" value={profile.visit_count} />
        </View>

        {!isOwn && !blockedByMe && (
          <View style={{ flexDirection: 'row', gap: space.l, marginTop: space.m }}>
            <MonoLink
              label={
                profile.follow_state === 'following'
                  ? 'FOLLOWING ✓'
                  : profile.follow_state === 'requested'
                    ? 'REQUESTED — TAP TO CANCEL'
                    : profile.is_private
                      ? 'REQUEST TO FOLLOW'
                      : 'FOLLOW'
              }
              active={profile.follow_state !== 'none'}
              onPress={toggleFollow}
            />
            <MonoLink
              label="MESSAGE"
              onPress={() => (me ? router.push(`/messages/${profile.id}`) : router.push('/auth'))}
            />
          </View>
        )}

        {!isOwn && me && (
          <View style={{ flexDirection: 'row', gap: space.l, marginTop: space.m }}>
            <MonoLink
              label={blockedByMe ? 'BLOCKED — TAP TO UNBLOCK' : 'BLOCK'}
              color={colors.red}
              onPress={toggleBlock}
            />
            {!blockedByMe && <MonoLink label="REPORT" color={colors.red} onPress={report} />}
          </View>
        )}

        {isOwn && (
          <View style={styles.privacyRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.privacyLabel}>PRIVATE PROFILE</Text>
              <Text style={styles.privacyHint}>
                When on, only accepted followers can see what you log.
              </Text>
            </View>
            <Switch
              value={!!profile.is_private}
              onValueChange={setPrivacy}
              trackColor={{ true: colors.ink, false: colors.dim }}
              thumbColor={colors.white}
            />
          </View>
        )}

        {isOwn && (
          <View style={{ flexDirection: 'row', gap: space.l, marginTop: space.l }}>
            <MonoLink
              label="PRIVACY & TERMS"
              onPress={() => router.push('/privacy')}
              style={{ alignSelf: 'flex-start' }}
            />
            <MonoLink
              label="DELETE ACCOUNT"
              color={colors.red}
              onPress={deleteAccount}
              style={{ alignSelf: 'flex-start' }}
            />
          </View>
        )}
      </View>

      <Hairline style={{ marginTop: space.l }} />

      {isOwn && requests.length > 0 && (
        <>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>FOLLOW REQUESTS</Text>
          </View>
          {requests.map((r) => (
            <View key={r.id} style={styles.request}>
              <Text style={styles.requestName} numberOfLines={1}>
                {r.display_name}
              </Text>
              <View style={{ flexDirection: 'row', gap: space.m }}>
                <MonoLink label="ACCEPT" active onPress={() => respond(r.id, true)} />
                <MonoLink label="DECLINE" color={colors.red} onPress={() => respond(r.id, false)} />
              </View>
            </View>
          ))}
        </>
      )}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{isOwn ? 'YOUR ACTIVITY' : 'ACTIVITY'}</Text>
      </View>
      {blockedByMe ? (
        <Text style={styles.private}>You’ve blocked this person, so their activity is hidden.</Text>
      ) : !profile.can_view_activity ? (
        <Text style={styles.private}>
          This profile is private. Follow to see what {profile.display_name.split(' ')[0]} logs.
        </Text>
      ) : activity.length === 0 ? (
        <Text style={styles.private}>Nothing logged yet.</Text>
      ) : (
        activity.map((item) => (
          <ActivityRow
            key={item.id}
            item={item}
            engagement={engagement[item.id] ?? { likes: 0, liked_by_me: false, comments: 0 }}
            onToggleLike={async () => {
              if (!me) {
                router.push('/auth');
                return;
              }
              await api.toggleLike(me.id, item.user_id, item.exhibition_id);
              reload();
            }}
          />
        ))
      )}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink },
  city: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, color: colors.ink, marginTop: 6 },
  stats: { flexDirection: 'row', gap: space.xl, marginTop: space.l },
  stat: {},
  statValue: { fontFamily: fonts.sansMedium, fontSize: 22, color: colors.ink },
  statLabel: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.2, color: colors.ink, marginTop: 2 },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    marginTop: space.l,
  },
  privacyLabel: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.2, color: colors.ink },
  privacyHint: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.4, color: colors.ink, marginTop: 3, opacity: 0.6 },
  sectionHead: { paddingHorizontal: space.page, paddingTop: space.l, paddingBottom: space.s },
  sectionTitle: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.8, color: colors.ink },
  request: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  requestName: { ...type.serifTitle, fontSize: 18, flex: 1 },
  private: {
    fontFamily: fonts.serif, letterSpacing: 1.8, textTransform: 'uppercase',
    fontSize: 13,
    lineHeight: 20,
    color: colors.ink,
    paddingHorizontal: space.page,
    paddingBottom: space.l,
  },
});
