import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
import { Hairline, Kicker, Loading, RatingDots } from '../../../src/components/ui';
import { api } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth';
import { fmtDay } from '../../../src/lib/dates';
import { Comment, FeedItem } from '../../../src/lib/types';
import { colors, fonts, space, type } from '../../../src/theme';

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [postUserId, exhibitionId] = (id ?? '').split('~');

  const [post, setPost] = useState<FeedItem | null | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    if (!postUserId || !exhibitionId) return;
    api.getPost(postUserId, exhibitionId, profile?.id ?? null).then(setPost);
    api.listComments(postUserId, exhibitionId).then(setComments);
  }, [postUserId, exhibitionId, profile]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  if (post === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <Loading />
      </View>
    );
  }
  if (post === null) {
    return (
      <View style={styles.guard}>
        <Text style={type.serifHeading}>Post not found</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
    );
  }

  const send = async () => {
    if (!profile) {
      router.push('/auth');
      return;
    }
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.addComment(profile.id, postUserId, exhibitionId, text);
      setText('');
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.head}>
          <Kicker>POST</Kicker>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>← BACK</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: space.page }}>
          <Text style={styles.person} onPress={() => router.push(`/profile/${post.user_id}`)}>
            {post.display_name.toUpperCase()} · {fmtDay(post.visit_date, true).toUpperCase()}
          </Text>
          <Pressable onPress={() => router.push(`/exhibition/${post.exhibition_id}`)}>
            <Text style={[type.serifTitle, { fontSize: 24, marginTop: 8 }]} numberOfLines={3}>
              {post.exhibition_title}
            </Text>
            {post.venue_name && <Text style={styles.venue}>{post.venue_name.toUpperCase()}</Text>}
          </Pressable>
          <View style={{ marginTop: space.s }}>
            <RatingDots value={post.rating} size={10} gap={8} />
          </View>
          {post.reflection ? <Text style={styles.reflection}>{post.reflection}</Text> : null}
          <Text style={styles.likes}>
            {post.like_count} LIKE{post.like_count === 1 ? '' : 'S'}
          </Text>

          <Hairline style={{ marginVertical: space.l }} />
          <Text style={styles.sectionTitle}>
            {comments.length} COMMENT{comments.length === 1 ? '' : 'S'}
          </Text>
        </View>

        {comments.map((c) => (
          <View key={c.id} style={styles.comment}>
            <Text style={styles.commentAuthor} onPress={() => router.push(`/profile/${c.author_id}`)}>
              {c.author_name.toUpperCase()}
            </Text>
            <Text style={styles.commentText}>{c.text}</Text>
          </View>
        ))}
        {comments.length === 0 && (
          <Text style={styles.empty}>No comments yet. Start the conversation.</Text>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, space.m) }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a comment…"
          placeholderTextColor={colors.grey}
          style={styles.input}
          multiline
        />
        <Pressable onPress={send} disabled={busy || !text.trim()} hitSlop={8}>
          <Text style={[styles.send, (!text.trim() || busy) && { opacity: 0.35 }]}>SEND</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  person: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.2, color: colors.ink },
  venue: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: colors.ink, marginTop: 4 },
  reflection: { ...type.serifBody, fontSize: 17, lineHeight: 25, marginTop: space.m },
  likes: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.4, color: colors.ink, marginTop: space.m },
  sectionTitle: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.8, color: colors.ink },
  comment: {
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  commentAuthor: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.2, color: colors.ink, marginBottom: 5 },
  commentText: { ...type.serifBody, fontSize: 16, lineHeight: 23 },
  empty: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.ink,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingTop: space.s,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  input: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.ink,
    maxHeight: 100,
    paddingVertical: space.s,
  },
  send: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.ink,
    paddingVertical: space.s,
  },
});
