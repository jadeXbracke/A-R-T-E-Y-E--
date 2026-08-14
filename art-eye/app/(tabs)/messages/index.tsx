import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Kicker, Loading, MonoLink } from '../../../src/components/ui';
import { api } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth';
import { Conversation, Profile } from '../../../src/lib/types';
import { colors, fonts, space, type } from '../../../src/theme';

// The inbox: every conversation, newest first, plus the mutual follows you
// could start one with. Messaging is mutual-follow only, so everything on
// this screen is someone who follows you back.
export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const { profile: me } = useAuth();

  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [startable, setStartable] = useState<Profile[]>([]);

  const reload = useCallback(() => {
    if (!me) {
      setConversations([]);
      return;
    }
    Promise.all([api.listConversations(me.id), api.listMessageablePeople(me.id)]).then(
      ([convs, people]) => {
        setConversations(convs);
        const inConv = new Set(convs.map((c) => c.peer.id));
        setStartable(people.filter((p) => !inConv.has(p.id)));
      }
    );
  }, [me]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.head}>
        <View>
          <Kicker>INBOX</Kicker>
          <Text style={type.serifHeading}>Messages</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <Hairline />

      {!me ? (
        <View style={{ paddingTop: space.xl }}>
          <EmptyState>Sign in to message people who follow you back.</EmptyState>
        </View>
      ) : conversations === null ? (
        <Loading />
      ) : (
        <>
          {conversations.length === 0 && (
            <Text style={styles.empty}>
              No conversations yet. Message someone below — you can message anyone who follows
              you back.
            </Text>
          )}
          {conversations.map((c) => (
            <ConversationRow key={c.peer.id} conversation={c} myId={me.id} />
          ))}

          {startable.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>START A CONVERSATION</Text>
              </View>
              {startable.map((p) => (
                <View key={p.id} style={styles.startRow}>
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => router.push(`/profile/${p.id}`)}
                    hitSlop={6}
                  >
                    <Text style={styles.startName} numberOfLines={1}>
                      {p.display_name}
                    </Text>
                  </Pressable>
                  <MonoLink label="MESSAGE" active onPress={() => router.push(`/messages/${p.id}`)} />
                </View>
              ))}
            </>
          )}

          {conversations.length === 0 && startable.length === 0 && (
            <Text style={styles.empty}>
              Follow people and let them follow you back — then you can message each other here.
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

function ConversationRow({ conversation, myId }: { conversation: Conversation; myId: string }) {
  const { peer, last_message, unread } = conversation;
  const mine = last_message.sender_id === myId;
  return (
    <Pressable style={styles.row} onPress={() => router.push(`/messages/${peer.id}`)}>
      {peer.avatar_url ? (
        <Image source={{ uri: peer.avatar_url }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitial}>
            {(peer.display_name.trim()[0] ?? '?').toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.rowHead}>
          <Text style={styles.name} numberOfLines={1}>
            {peer.display_name}
          </Text>
          <Text style={styles.time}>{shortTime(last_message.created_at)}</Text>
        </View>
        <Text style={[styles.preview, unread > 0 && styles.previewUnread]} numberOfLines={1}>
          {mine ? 'You: ' : ''}
          {last_message.text || (last_message.image_url ? '📷 Photo' : '')}
        </Text>
      </View>
      {unread > 0 && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

// "14:32" today, "MON" this week, "12 AUG" older.
function shortTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  const days = (now.getTime() - d.getTime()) / 86400000;
  if (days < 7) return d.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase();
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }).toUpperCase();
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink, paddingBottom: 4 },
  empty: {
    fontFamily: fonts.serif, letterSpacing: 1.8, textTransform: 'uppercase',
    fontSize: 13,
    lineHeight: 20,
    color: colors.ink,
    paddingHorizontal: space.page,
    paddingVertical: space.l,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.s },
  name: { ...type.serifTitle, fontSize: 18, flex: 1 },
  time: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.ink },
  preview: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.4, color: colors.ink, marginTop: 4, opacity: 0.6 },
  previewUnread: { opacity: 1, fontFamily: fonts.monoMedium },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ink },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.dim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // the fallback circle is ink (colors.dim == ink in this theme), so the
  // initial must be white to stay visible
  avatarInitial: { fontFamily: fonts.serifMedium, fontSize: 17, color: colors.white },
  sectionHead: { paddingHorizontal: space.page, paddingTop: space.l, paddingBottom: space.s },
  sectionTitle: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.8, color: colors.ink },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  startName: { ...type.serifTitle, fontSize: 18 },
});
