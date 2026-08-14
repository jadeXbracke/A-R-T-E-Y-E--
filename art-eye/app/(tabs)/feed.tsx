import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Loading } from '../../src/components/ui';
import { ActivityRow, PersonRow } from '../../src/components/social';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { FeedItem, Profile } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

type FeedTab = 'discover' | 'friends';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [tab, setTab] = useState<FeedTab>('discover');
  const [discover, setDiscover] = useState<FeedItem[] | null>(null);
  const [friends, setFriends] = useState<FeedItem[] | null>(null);
  const [people, setPeople] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<number>(0);
  const [unread, setUnread] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  const reload = useCallback(() => {
    if (!profile) {
      setDiscover([]);
      setFriends([]);
      return;
    }
    Promise.all([
      api.discoverFeed(profile.id),
      api.friendsFeed(profile.id),
      api.discoverPeople(profile.id),
      api.listFollowRequests(profile.id),
      api.unreadMessageCount(profile.id),
      api.unreadNotificationCount(profile.id),
    ]).then(([d, f, p, r, u, n]) => {
      setDiscover(d);
      setFriends(f);
      setPeople(p);
      setRequests(r.length);
      setUnread(u);
      setUnreadNotifications(n);
    });
  }, [profile]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  const feed = tab === 'discover' ? discover : friends;

  const follow = async (id: string) => {
    if (!profile) return;
    await api.followUser(profile.id, id);
    reload();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={styles.kicker}>
              {tab === 'discover' ? 'EVERYONE ON ART EYE' : 'WHAT YOUR CIRCLE IS SEEING'}
            </Text>
            <Text style={type.serifHeading}>Feed</Text>
          </View>
          {profile && (
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <Pressable onPress={() => router.push('/notifications')} hitSlop={8}>
                <Text style={styles.you}>
                  {unreadNotifications > 0 ? `NOTIFICATIONS (${unreadNotifications}) →` : 'NOTIFICATIONS →'}
                </Text>
              </Pressable>
              <Pressable onPress={() => router.push('/messages')} hitSlop={8}>
                <Text style={styles.you}>
                  {unread > 0 ? `MESSAGES (${unread}) →` : 'MESSAGES →'}
                </Text>
              </Pressable>
              <Pressable onPress={() => router.push(`/profile/${profile.id}`)} hitSlop={8}>
                <Text style={styles.you}>YOUR PROFILE →</Text>
              </Pressable>
            </View>
          )}
        </View>
        {profile && (
          <View style={styles.tabs}>
            <Pressable onPress={() => setTab('discover')} hitSlop={8}>
              <Text style={[styles.tabLabel, tab === 'discover' && styles.tabLabelActive]}>
                DISCOVER
              </Text>
            </Pressable>
            <Pressable onPress={() => setTab('friends')} hitSlop={8}>
              <Text style={[styles.tabLabel, tab === 'friends' && styles.tabLabelActive]}>
                FRIENDS
              </Text>
            </Pressable>
          </View>
        )}
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
          {requests > 0 && (
            <Pressable style={styles.requests} onPress={() => router.push(`/profile/${profile.id}`)}>
              <Text style={styles.requestsText}>
                {requests} FOLLOW REQUEST{requests > 1 ? 'S' : ''} — REVIEW →
              </Text>
            </Pressable>
          )}

          {feed.length === 0 ? (
            <EmptyState>
              {tab === 'discover'
                ? 'Nothing logged publicly yet. Be the first — mark a show as seen and it lands here.'
                : "Your friends aren't here yet. Follow people on the Discover tab, or share the app so they can join — then every visit, save and comment lands here."}
            </EmptyState>
          ) : (
            feed.map((item) => <ActivityRow key={item.id} item={item} />)
          )}

          {tab === 'friends' && people.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>PEOPLE TO FOLLOW</Text>
              </View>
              {people.map((p) => (
                <PersonRow key={p.id} person={p} state="none" onFollow={() => follow(p.id)} />
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
  tabs: { flexDirection: 'row', gap: space.l, marginTop: space.l },
  tabLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.ink,
    opacity: 0.4,
    paddingBottom: 8,
  },
  tabLabelActive: { opacity: 1, borderBottomWidth: 1, borderBottomColor: colors.ink },
  signIn: { fontFamily: fonts.monoMedium, fontSize: 12, letterSpacing: 1.6, color: colors.ink },
  requests: {
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  requestsText: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.2, color: colors.ink },
  sectionHead: {
    paddingHorizontal: space.page,
    paddingTop: space.l,
    paddingBottom: space.s,
  },
  sectionTitle: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.8, color: colors.ink },
});
