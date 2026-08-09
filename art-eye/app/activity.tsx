import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Kicker, Lift, Loading } from '../src/components/ui';
import { api } from '../src/lib/api';
import { setActivitySeen } from '../src/lib/activity-seen';
import { useAuth } from '../src/lib/auth';
import { fmtOpening } from '../src/lib/dates';
import { ActivityEvent } from '../src/lib/types';
import { colors, fonts, space, type } from '../src/theme';

/** What happened to your posts: likes and comments by others, newest first. */
export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!profile) {
        setEvents([]);
        return;
      }
      api.listActivity(profile.id).then(async (evs) => {
        setEvents(evs);
        // Opening the screen clears the badge in the feed header.
        if (evs.length > 0) await setActivitySeen(profile.id, evs[0].created_at);
      });
    }, [profile])
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.head}>
        <View>
          <Kicker style={{ marginBottom: 10 }}>WHAT HAPPENED TO YOUR POSTS</Kicker>
          <Text style={type.serifHeading}>Activity</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <Hairline />

      {!profile ? (
        <EmptyState>Sign in to see reactions to your posts.</EmptyState>
      ) : events === null ? (
        <Loading />
      ) : events.length === 0 ? (
        <EmptyState>
          Nothing yet. When someone likes or comments on a post of yours, it shows up here.
        </EmptyState>
      ) : (
        events.map((e) => (
          <Lift
            key={e.id}
            onPress={() => router.push(`/post/${profile.id}/${e.exhibition_id}`)}
          >
            <View style={styles.row}>
              <View style={styles.rowHead}>
                <Text style={styles.actor} onPress={() => router.push(`/profile/${e.actor_id}`)}>
                  {e.actor_name.toUpperCase()}
                  <Text style={{ color: e.kind === 'like' ? colors.red : colors.ink }}>
                    {e.kind === 'like' ? '  ●  LIKED' : '  COMMENTED ON'}
                  </Text>
                </Text>
                {e.created_at ? (
                  <Text style={styles.date}>{fmtOpening(e.created_at).toUpperCase()}</Text>
                ) : null}
              </View>
              <Text style={styles.show} numberOfLines={1}>
                {e.exhibition_title}
              </Text>
              {e.body ? (
                <Text style={styles.body} numberOfLines={2}>
                  “{e.body}”
                </Text>
              ) : null}
            </View>
          </Lift>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink },
  row: {
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.m,
    marginBottom: 5,
  },
  actor: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.4, color: colors.ink },
  date: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.8, color: colors.ink },
  show: { ...type.serifTitle, fontSize: 18 },
  body: { fontFamily: fonts.serif, fontSize: 14, lineHeight: 21, color: colors.ink, marginTop: 4 },
});
