import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { postParam } from '../../../src/components/social';
import { api } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth';
import { fmtDay } from '../../../src/lib/dates';
import { insertMention, parseMentionSegments } from '../../../src/lib/mentions';
import { sharePost } from '../../../src/lib/share';
import { Comment, FeedItem, Profile } from '../../../src/lib/types';
import { colors, fonts, space, type } from '../../../src/theme';

const MENTION_TRIGGER = /@([a-zA-Z0-9 ]{0,24})$/;

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [postUserId, exhibitionId] = (id ?? '').split('~');

  const [post, setPost] = useState<FeedItem | null | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!postUserId || !exhibitionId) return;
    api.getPost(postUserId, exhibitionId, profile?.id ?? null).then(setPost);
    api.listComments(postUserId, exhibitionId, profile?.id ?? null).then(setComments);
  }, [postUserId, exhibitionId, profile]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  // Candidates for the @mention picker — loaded once per session, filtered locally.
  useEffect(() => {
    if (profile) api.searchPeople(profile.id).then(setPeople);
  }, [profile?.id]);

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
    setError(null);
    try {
      await api.addComment(profile.id, postUserId, exhibitionId, text, replyTo?.id ?? null);
      setText('');
      setReplyTo(null);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send that comment.');
    } finally {
      setBusy(false);
    }
  };

  const startReply = (c: Comment) => {
    setReplyTo(c);
    setText(insertMention('', c.author_name, c.author_id));
  };

  const toggleCommentLike = async (c: Comment) => {
    if (!profile) {
      router.push('/auth');
      return;
    }
    const next = !c.liked_by_me;
    setComments((prev) =>
      prev.map((x) =>
        x.id === c.id ? { ...x, liked_by_me: next, like_count: x.like_count + (next ? 1 : -1) } : x
      )
    );
    try {
      if (next) await api.likeComment(profile.id, c.id);
      else await api.unlikeComment(profile.id, c.id);
    } catch {
      setComments((prev) =>
        prev.map((x) =>
          x.id === c.id ? { ...x, liked_by_me: !next, like_count: x.like_count + (next ? -1 : 1) } : x
        )
      );
    }
  };

  const share = () => sharePost(postParam(post), post.display_name, post.exhibition_title);

  const mentionMatch = text.match(MENTION_TRIGGER);
  const mentionQuery = mentionMatch ? mentionMatch[1] : null;
  const suggestions =
    mentionQuery !== null && mentionQuery.length > 0
      ? people.filter((p) => p.display_name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5)
      : [];

  const pickMention = (p: Profile) => {
    setText((prev) => insertMention(prev.replace(MENTION_TRIGGER, ''), p.display_name, p.id));
  };

  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const repliesFor = (parentId: string) => comments.filter((c) => c.parent_comment_id === parentId);

  const renderComment = (c: Comment, isReply: boolean) => (
    <View key={c.id} style={[styles.comment, isReply && styles.reply]}>
      <Text style={styles.commentAuthor} onPress={() => router.push(`/profile/${c.author_id}`)}>
        {c.author_name.toUpperCase()}
      </Text>
      <Text style={styles.commentText}>
        {parseMentionSegments(c.text).map((seg, i) =>
          seg.type === 'mention' ? (
            <Text key={i} style={styles.mention} onPress={() => router.push(`/profile/${seg.userId}`)}>
              @{seg.content}
            </Text>
          ) : (
            <Text key={i}>{seg.content}</Text>
          )
        )}
      </Text>
      <View style={styles.commentActions}>
        <Pressable onPress={() => toggleCommentLike(c)} hitSlop={8} style={styles.commentAction}>
          <Text style={[styles.commentActionGlyph, c.liked_by_me && { color: colors.ink }]}>
            {c.liked_by_me ? '♥' : '♡'}
          </Text>
          {c.like_count > 0 && <Text style={styles.commentActionLabel}>{c.like_count}</Text>}
        </Pressable>
        {!isReply && (
          <Pressable onPress={() => startReply(c)} hitSlop={8}>
            <Text style={styles.commentActionLabel}>REPLY</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

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
          <View style={styles.postActions}>
            <Text style={styles.likes}>
              {post.like_count} LIKE{post.like_count === 1 ? '' : 'S'}
            </Text>
            <Pressable onPress={share} hitSlop={8}>
              <Text style={styles.shareLink}>SHARE ↗</Text>
            </Pressable>
          </View>

          <Hairline style={{ marginVertical: space.l }} />
          <Text style={styles.sectionTitle}>
            {comments.length} COMMENT{comments.length === 1 ? '' : 'S'}
          </Text>
        </View>

        {topLevel.map((c) => (
          <View key={c.id}>
            {renderComment(c, false)}
            {repliesFor(c.id).map((r) => renderComment(r, true))}
          </View>
        ))}
        {comments.length === 0 && (
          <Text style={styles.empty}>No comments yet. Start the conversation.</Text>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, space.m) }]}>
        {!!error && <Text style={styles.error}>{error.toUpperCase()}</Text>}
        {replyTo && (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText}>REPLYING TO {replyTo.author_name.toUpperCase()}</Text>
            <Pressable
              onPress={() => {
                setReplyTo(null);
                setText('');
              }}
              hitSlop={8}
            >
              <Text style={styles.replyBannerCancel}>CANCEL</Text>
            </Pressable>
          </View>
        )}
        {suggestions.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions}>
            {suggestions.map((p) => (
              <Pressable key={p.id} onPress={() => pickMention(p)} style={styles.suggestion} hitSlop={4}>
                <Text style={styles.suggestionText}>@{p.display_name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Add a comment… (@ to mention)"
            placeholderTextColor={colors.grey}
            style={styles.input}
            multiline
          />
          <Pressable onPress={send} disabled={busy || !text.trim()} hitSlop={8}>
            <Text style={[styles.send, (!text.trim() || busy) && { opacity: 0.35 }]}>SEND</Text>
          </Pressable>
        </View>
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
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.m,
  },
  likes: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.4, color: colors.ink },
  shareLink: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.4, color: colors.ink },
  sectionTitle: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.8, color: colors.ink },
  comment: {
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  reply: { paddingLeft: space.page + space.l, backgroundColor: colors.dim },
  commentAuthor: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.2, color: colors.ink, marginBottom: 5 },
  commentText: { ...type.serifBody, fontSize: 16, lineHeight: 23 },
  mention: { fontFamily: fonts.serifMedium, color: colors.ink },
  commentActions: { flexDirection: 'row', gap: space.l, marginTop: space.s, alignItems: 'center' },
  commentAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  commentActionGlyph: { fontSize: 13, color: colors.ink, opacity: 0.6 },
  commentActionLabel: { fontFamily: fonts.monoMedium, fontSize: 9, letterSpacing: 1.2, color: colors.ink, opacity: 0.6 },
  empty: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.ink,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
  },
  inputBar: {
    paddingHorizontal: space.page,
    paddingTop: space.s,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  error: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.ink, marginBottom: space.s },
  replyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: space.s,
  },
  replyBannerText: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.2, color: colors.ink, opacity: 0.6 },
  replyBannerCancel: { fontFamily: fonts.monoMedium, fontSize: 9, letterSpacing: 1.2, color: colors.ink },
  suggestions: { flexDirection: 'row', marginBottom: space.s },
  suggestion: {
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: space.s,
    paddingVertical: 6,
    marginRight: space.s,
  },
  suggestionText: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 0.8, color: colors.ink },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.m },
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
