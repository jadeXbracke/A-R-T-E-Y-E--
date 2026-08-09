import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../src/components/avatar';
import { EmptyState, Hairline, Kicker, Lift, Loading, RedDot } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { Conversation } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

/** Message inbox: one row per person, latest line and unread count. */
export default function MessagesInbox() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);

  const reload = useCallback(() => {
    if (!profile) {
      setConversations([]);
      return;
    }
    api.listConversations(profile.id).then(setConversations);
  }, [profile]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={styles.head}>
        <View>
          <Kicker style={{ marginBottom: 10 }}>PRIVATE, PERSON TO PERSON</Kicker>
          <Text style={type.serifHeading}>Messages</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <Hairline />

      {!profile ? (
        <View style={{ paddingTop: space.xl }}>
          <EmptyState>Sign in to send and receive messages.</EmptyState>
          <View style={{ alignItems: 'center', marginTop: space.m }}>
            <Pressable onPress={() => router.push('/auth')} hitSlop={8}>
              <Text style={styles.signIn}>SIGN IN →</Text>
            </Pressable>
          </View>
        </View>
      ) : conversations === null ? (
        <Loading />
      ) : conversations.length === 0 ? (
        <EmptyState>
          No messages yet. Open someone’s profile and tap MESSAGE to start a thread.
        </EmptyState>
      ) : (
        conversations.map((c) => (
          <Lift key={c.peer.id} onPress={() => router.push(`/messages/${c.peer.id}`)}>
            <View style={styles.row}>
              <Avatar name={c.peer.display_name} uri={c.peer.avatar_url} size={40} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {c.peer.display_name}
                  </Text>
                  {c.unread > 0 && <RedDot />}
                </View>
                <Text
                  style={[styles.preview, c.unread > 0 && { fontFamily: fonts.monoMedium }]}
                  numberOfLines={1}
                >
                  {(c.last.sender_id === profile.id ? 'YOU: ' : '') + c.last.body}
                </Text>
              </View>
              {c.unread > 0 && <Text style={styles.unread}>{c.unread}</Text>}
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
  signIn: { fontFamily: fonts.monoMedium, fontSize: 12, letterSpacing: 1.6, color: colors.red },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  name: { ...type.serifTitle, fontSize: 18 },
  preview: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.4, color: colors.ink, marginTop: 4 },
  unread: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.red },
});
