import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Kicker, Loading } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { Notification } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

function describe(n: Notification): string {
  switch (n.kind) {
    case 'like':
      return `${n.actor_name} liked your post.`;
    case 'comment':
      return `${n.actor_name} commented on your post.`;
    case 'reply':
      return `${n.actor_name} replied to your comment.`;
    case 'comment_like':
      return `${n.actor_name} liked your comment.`;
    case 'follow':
      return `${n.actor_name} started following you.`;
    case 'follow_request':
      return `${n.actor_name} asked to follow you.`;
    case 'message':
      return `${n.actor_name} sent you a message.`;
    case 'mention':
      return `${n.actor_name} mentioned you in a comment.`;
    default:
      return `${n.actor_name} did something.`;
  }
}

function glyph(kind: Notification['kind']): string {
  switch (kind) {
    case 'like':
    case 'comment_like':
      return '♥';
    case 'comment':
    case 'reply':
    case 'mention':
      return '✎';
    case 'follow':
    case 'follow_request':
      return '+';
    case 'message':
      return '✉';
    default:
      return '•';
  }
}

function targetFor(n: Notification): string | null {
  if (n.kind === 'follow' || n.kind === 'follow_request') {
    return n.actor_id ? `/profile/${n.actor_id}` : null;
  }
  if (n.kind === 'message') {
    return n.actor_id ? `/messages/${n.actor_id}` : null;
  }
  if (n.post_user_id && n.exhibition_id) {
    return `/post/${n.post_user_id}~${n.exhibition_id}`;
  }
  return null;
}

function relative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'NOW';
  if (min < 60) return `${min}M`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}H`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}D`;
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }).toUpperCase();
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [items, setItems] = useState<Notification[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      api.listNotifications(profile.id).then(setItems);
      api.markNotificationsRead(profile.id);
    }, [profile])
  );

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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.head}>
        <Kicker>ACTIVITY</Kicker>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <Text style={[type.serifHeading, styles.heading]}>Notifications</Text>
      <Hairline style={{ marginTop: space.m }} />

      {items === null ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState>Nothing yet — likes, comments, replies and new followers land here.</EmptyState>
      ) : (
        items.map((n) => {
          const target = targetFor(n);
          const row = (
            <View style={styles.row}>
              <Text style={[styles.glyph, !n.read_at && { opacity: 1 }]}>{glyph(n.kind)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.text}>{describe(n)}</Text>
              </View>
              <Text style={styles.stamp}>{relative(n.created_at)}</Text>
            </View>
          );
          return target ? (
            <Pressable key={n.id} onPress={() => router.push(target)}>
              {row}
            </Pressable>
          ) : (
            <View key={n.id}>{row}</View>
          );
        })
      )}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  glyph: { fontSize: 15, color: colors.ink, opacity: 0.6, width: 18 },
  text: { ...type.serifBody, fontSize: 15, lineHeight: 21 },
  stamp: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.8, color: colors.ink, opacity: 0.5 },
});
