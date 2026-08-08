import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hairline, Kicker, Loading, MonoLink } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { DirectMessage, PublicProfile } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

/** One-to-one message thread with another person. */
export default function MessageThread() {
  const { peer: peerId } = useLocalSearchParams<{ peer: string }>();
  const insets = useSafeAreaInsets();
  const { profile: me } = useAuth();

  const [peer, setPeer] = useState<PublicProfile | null>(null);
  const [messages, setMessages] = useState<DirectMessage[] | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const reload = useCallback(async () => {
    if (!me || !peerId) return;
    const [p, ms] = await Promise.all([
      api.getPublicProfile(peerId, me.id),
      api.listMessages(me.id, peerId),
    ]);
    setPeer(p);
    setMessages(ms);
    // Opening the thread reads it — clears the inbox/feed unread markers.
    await api.markThreadRead(me.id, peerId);
  }, [me, peerId]);

  useEffect(() => {
    if (!me) return;
    reload();
  }, [me, reload]);

  const send = async () => {
    if (!me || !draft.trim()) return;
    setBusy(true);
    try {
      await api.sendMessage(me.id, peerId, draft);
      setDraft('');
      await reload();
      scrollRef.current?.scrollToEnd({ animated: true });
    } finally {
      setBusy(false);
    }
  };

  if (!me) {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Sign in to message</Text>
        <Pressable onPress={() => router.push('/auth')} hitSlop={12}>
          <Text style={styles.signIn}>SIGN IN →</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.head, { paddingTop: insets.top + space.m }]}>
        <Pressable onPress={() => (peer ? router.push(`/profile/${peer.id}`) : null)} hitSlop={8}>
          <Kicker style={{ marginBottom: 6 }}>MESSAGE THREAD</Kicker>
          <Text style={type.serifTitle} numberOfLines={1}>
            {peer?.display_name ?? '…'}
          </Text>
        </Pressable>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <Hairline />

      {messages === null ? (
        <Loading />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: space.l, paddingHorizontal: space.page }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <Text style={styles.empty}>
              No messages yet — start the conversation below.
            </Text>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === me.id;
              return (
                <View key={m.id} style={[styles.bubbleRow, mine && { alignItems: 'flex-end' }]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, mine && { color: colors.white }]}>
                      {m.body}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, space.m) }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={`Message ${peer?.display_name.split(' ')[0] ?? ''}`.trim()}
          placeholderTextColor={colors.grey}
          multiline
          style={styles.input}
        />
        <MonoLink
          label={busy ? 'SENDING…' : 'SEND'}
          active={!!draft.trim()}
          onPress={busy ? undefined : send}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page, gap: space.m },
  signIn: { fontFamily: fonts.monoMedium, fontSize: 12, letterSpacing: 1.6, color: colors.red },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
    gap: space.m,
  },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink },
  empty: {
    fontFamily: fonts.serifItalic, letterSpacing: 1.7, textTransform: 'uppercase',
    fontSize: 12,
    lineHeight: 19,
    color: colors.ink,
  },
  bubbleRow: { alignItems: 'flex-start', marginBottom: space.s },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: colors.ink },
  bubbleTheirs: { borderWidth: 1, borderColor: colors.hairline },
  bubbleText: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 22, color: colors.ink },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingTop: space.s,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.ink,
    maxHeight: 100,
    paddingVertical: 8,
  },
});
