import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
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
import { Hairline, Kicker, Loading } from '../../../src/components/ui';
import { api } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth';
import { DirectMessage, PublicProfile } from '../../../src/lib/types';
import { colors, fonts, space, type } from '../../../src/theme';

// One thread: /messages/<peer profile id>. Messages run oldest → newest,
// yours on the right in ink, theirs on the left behind a hairline.
export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { profile: me } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [peer, setPeer] = useState<PublicProfile | null | undefined>(undefined);
  const [messages, setMessages] = useState<DirectMessage[] | null>(null);
  const [allowed, setAllowed] = useState<boolean>(true);
  const [draft, setDraft] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!id || !me) return;
    api.getPublicProfile(id, me.id).then(setPeer).catch(() => setPeer(null));
    api.listMessages(me.id, id).then(setMessages);
    api.canMessage(me.id, id).then(setAllowed);
  }, [id, me]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  if (!me) {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Sign in to read your messages</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
    );
  }
  if (peer === undefined || messages === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <Loading />
      </View>
    );
  }
  if (peer === null) {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Profile not found</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
    );
  }

  const send = async () => {
    const body = draft.trim();
    if ((!body && !attachedImage) || sending) return;
    setSending(true);
    setError(null);
    try {
      const sent = await api.sendMessage(me.id, peer.id, body, attachedImage);
      setDraft('');
      setAttachedImage(null);
      setMessages((prev) => [...(prev ?? []), sent]);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the message.');
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    setAttaching(true);
    try {
      setAttachedImage(await api.uploadImage(result.assets[0].uri));
    } finally {
      setAttaching(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.head, { paddingTop: insets.top + space.m }]}>
        <Pressable onPress={() => router.push(`/profile/${peer.id}`)} hitSlop={6}>
          <Kicker>CONVERSATION</Kicker>
          <Text style={type.serifHeading} numberOfLines={1}>
            {peer.display_name}
          </Text>
        </Pressable>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <Hairline />

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.page, gap: space.s }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 && (
          <Text style={styles.empty}>
            No messages yet. Say hello — {peer.display_name.split(' ')[0]} follows you back.
          </Text>
        )}
        {messages.map((m, i) => {
          const mine = m.sender_id === me.id;
          const showTime =
            i === messages.length - 1 ||
            new Date(messages[i + 1].created_at).getTime() - new Date(m.created_at).getTime() >
              10 * 60 * 1000;
          return (
            <View key={m.id} style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <View
                style={[
                  styles.bubble,
                  mine ? styles.bubbleMine : styles.bubbleTheirs,
                  !!m.image_url && styles.bubbleImage,
                ]}
              >
                {!!m.image_url && (
                  <Image source={{ uri: m.image_url }} style={styles.image} contentFit="cover" />
                )}
                {!!m.text && (
                  <Text style={[mine ? styles.textMine : styles.textTheirs, !!m.image_url && { marginTop: space.s }]}>
                    {m.text}
                  </Text>
                )}
              </View>
              {showTime && <Text style={styles.stamp}>{stamp(m.created_at)}</Text>}
            </View>
          );
        })}
      </ScrollView>

      {allowed ? (
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, space.m) }]}>
          {!!error && <Text style={styles.error}>{error.toUpperCase()}</Text>}
          {!!attachedImage && (
            <View style={styles.attachPreview}>
              <Image source={{ uri: attachedImage }} style={styles.attachThumb} contentFit="cover" />
              <Pressable onPress={() => setAttachedImage(null)} hitSlop={8}>
                <Text style={styles.attachRemove}>REMOVE</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.composerRow}>
            <Pressable onPress={pickImage} disabled={attaching} hitSlop={8}>
              <Text style={[styles.attachButton, attaching && { opacity: 0.35 }]}>+</Text>
            </Pressable>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Write a message"
              placeholderTextColor={colors.grey}
              multiline
            />
            <Pressable onPress={send} disabled={(!draft.trim() && !attachedImage) || sending} hitSlop={8}>
              <Text style={[styles.send, (!draft.trim() && !attachedImage) || sending ? { opacity: 0.35 } : null]}>
                SEND
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, space.m) }]}>
          <Text style={styles.locked}>
            YOU CAN ONLY MESSAGE PEOPLE WHO FOLLOW YOU BACK
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function stamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  if (d.toDateString() === now.toDateString()) return time;
  const day = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }).toUpperCase();
  return `${day} · ${time}`;
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: colors.bg, paddingTop: 80, paddingHorizontal: space.page, gap: space.m },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
    gap: space.m,
  },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink, paddingBottom: 4 },
  empty: {
    fontFamily: fonts.serif, letterSpacing: 1.8, textTransform: 'uppercase',
    fontSize: 13,
    lineHeight: 20,
    color: colors.ink,
    paddingVertical: space.l,
  },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: colors.ink },
  bubbleTheirs: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.hairline },
  bubbleImage: { paddingHorizontal: 6, paddingVertical: 6 },
  image: { width: 200, height: 200, backgroundColor: colors.dim },
  textMine: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 21, color: colors.white },
  textTheirs: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 21, color: colors.ink },
  stamp: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, color: colors.ink, opacity: 0.5, marginTop: 4 },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingHorizontal: space.page,
    paddingTop: space.s,
    backgroundColor: colors.bg,
  },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.m },
  attachButton: { fontFamily: fonts.monoMedium, fontSize: 20, color: colors.ink, paddingBottom: 6 },
  attachPreview: { flexDirection: 'row', alignItems: 'center', gap: space.m, paddingBottom: space.s },
  attachThumb: { width: 44, height: 44, backgroundColor: colors.dim },
  attachRemove: { fontFamily: fonts.monoMedium, fontSize: 9, letterSpacing: 1, color: colors.ink },
  input: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
    paddingVertical: 10,
    maxHeight: 120,
  },
  send: { fontFamily: fonts.monoMedium, fontSize: 12, letterSpacing: 2, color: colors.ink, paddingVertical: 12 },
  error: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.ink, marginBottom: 4 },
  locked: {
    fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.ink, opacity: 0.6,
    paddingVertical: space.s,
  },
});
