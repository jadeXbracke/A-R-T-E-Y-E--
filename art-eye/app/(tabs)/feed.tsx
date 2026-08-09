import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionBar, EmptyState, Hairline, Loading } from '../../src/components/ui';
import { ActivityRow, PersonRow } from '../../src/components/social';
import { api } from '../../src/lib/api';
import { getActivitySeen } from '../../src/lib/activity-seen';
import { useAuth } from '../../src/lib/auth';
import { FeedItem, PostEngagement, Profile } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [feed, setFeed] = useState<FeedItem[] | null>(null);
  const [engagement, setEngagement] = useState<Record<string, PostEngagement>>({});
  const [people, setPeople] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<number>(0);
  const [unread, setUnread] = useState<number>(0);
  const [newActivity, setNewActivity] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    if (!profile) {
      setFeed([]);
      return;
    }
    const [f, p, r, u, events, seen] = await Promise.all([
      api.friendsFeed(profile.id),
      api.discoverPeople(profile.id),
      api.listFollowRequests(profile.id),
      api.unreadMessageCount(profile.id),
      api.listActivity(profile.id),
      getActivitySeen(profile.id),
    ]);
    setFeed(f);
    setPeople(p);
    setRequests(r.length);
    setUnread(u);
    setNewActivity(events.filter((e) => e.created_at > seen).length);
    setEngagement(await api.postEngagement(profile.id, f));
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    reload().finally(() => setRefreshing(false));
  }, [reload]);

  const follow = async (id: string) => {
    if (!profile) return;
    await api.followUser(profile.id, id);
    reload();
  };

  const toggleLike = async (item: FeedItem) => {
    if (!profile) return;
    const liked = await api.toggleLike(profile.id, item.user_id, item.exhibition_id);
    setEngagement((prev) => {
      const cur = prev[item.id] ?? { likes: 0, liked_by_me: false, comments: 0 };
      return {
        ...prev,
        [item.id]: { ...cur, liked_by_me: liked, likes: cur.likes + (liked ? 1 : -1) },
      };
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />
      }
    >
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={styles.kicker}>WHAT YOUR CIRCLE IS SEEING</Text>
            <Text style={type.serifHeading}>Feed</Text>
          </View>
          {profile && (
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <Pressable onPress={() => router.push(`/profile/${profile.id}`)} hitSlop={8}>
                <Text style={styles.you}>YOUR PROFILE →</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/activity')} hitSlop={8}>
                <Text style={[styles.you, newActivity > 0 && { color: colors.red }]}>
                  {newActivity > 0 ? `ACTIVITY (${newActivity}) →` : 'ACTIVITY →'}
                </Text>
              </Pressable>
              <Pressable onPress={() => router.push('/messages')} hitSlop={8}>
                <Text style={[styles.you, unread > 0 && { color: colors.red }]}>
                  {unread > 0 ? `MESSAGES (${unread}) →` : 'MESSAGES →'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
      <Hairline />

      {!profile ? (
        <View style={{ paddingTop: space.xl }}>
          <EmptyState>Sign in to follow friends and see what they’re viewing.</EmptyState>
          <View style={{ alignItems: 'center', marginTop: space.m }}>
            <Pressable onPress={() => router.push('/auth')} hitSlop={8}>
              <Text style={styles.signIn}>SIGN IN →</Text>
            </Pressable>
          </View>
        </View>
      ) : feed === null ? (
        <Loading />
      ) : (
        <>
          <View style={{ paddingHorizontal: space.page, paddingVertical: space.m }}>
            <ActionBar actions={[{ label: '＋ POST', onPress: () => router.push('/new-post') }]} />
          </View>

          {requests > 0 && (
            <Pressable style={styles.requests} onPress={() => router.push(`/profile/${profile.id}`)}>
              <Text style={styles.requestsText}>
                {requests} FOLLOW REQUEST{requests > 1 ? 'S' : ''} — REVIEW →
              </Text>
            </Pressable>
          )}

          {feed.length === 0 ? (
            <EmptyState>No activity yet. Follow a few people below to fill your feed.</EmptyState>
          ) : (
            feed.map((item) => (
              <ActivityRow
                key={item.id}
                item={item}
                engagement={engagement[item.id] ?? { likes: 0, liked_by_me: false, comments: 0 }}
                onToggleLike={() => toggleLike(item)}
              />
            ))
          )}

          {people.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>PEOPLE TO FOLLOW</Text>
              </View>
              {people.map((p) => (
                <PersonRow
                  key={p.id}
                  person={p}
                  state="none"
                  onFollow={() => follow(p.id)}
                  onMessage={() => router.push(`/messages/${p.id}`)}
                />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.page, paddingBottom: space.m },
  kicker: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.ink,
    marginBottom: 10,
  },
  you: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.2, color: colors.ink },
  signIn: { fontFamily: fonts.monoMedium, fontSize: 12, letterSpacing: 1.6, color: colors.red },
  requests: {
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  requestsText: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.2, color: colors.red },
  sectionHead: {
    paddingHorizontal: space.page,
    paddingTop: space.l,
    paddingBottom: space.s,
  },
  sectionTitle: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.8, color: colors.ink },
});
