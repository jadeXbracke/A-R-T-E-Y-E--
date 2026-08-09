import { router, useLocalSearchParams } from 'expo-router';
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
import { ActivityRow } from '../../../src/components/social';
import { EmptyState, Kicker, Loading, MonoLink } from '../../../src/components/ui';
import { api } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth';
import { confirmAction } from '../../../src/lib/confirm';
import { fmtOpening } from '../../../src/lib/dates';
import { sharePost } from '../../../src/lib/share';
import { FeedItem, PostComment, PostEngagement } from '../../../src/lib/types';
import { colors, fonts, space } from '../../../src/theme';

/** A single post (logged visit) with its likes and comment thread. */
export default function PostScreen() {
  const { user, exhibition } = useLocalSearchParams<{ user: string; exhibition: string }>();
  const insets = useSafeAreaInsets();
  const { profile: me } = useAuth();

  const [post, setPost] = useState<FeedItem | null | undefined>(undefined);
  const [engagement, setEngagement] = useState<PostEngagement | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    // The post is one of its author's activity rows; RLS/visibility applies.
    const activity = await api.userActivity(user, me?.id ?? null);
    const found = activity.find((a) => a.exhibition_id === exhibition) ?? null;
    setPost(found);
    if (found) {
      const [eng, cs] = await Promise.all([
        api.postEngagement(me?.id ?? null, [found]),
        api.listComments(user, exhibition),
      ]);
      setEngagement(eng[found.id] ?? { likes: 0, liked_by_me: false, comments: 0 });
      setComments(cs);
    }
  }, [user, exhibition, me]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggleLike = async () => {
    if (!me) {
      router.push('/auth');
      return;
    }
    await api.toggleLike(me.id, user, exhibition);
    reload();
  };

  const send = async () => {
    if (!me || !draft.trim()) return;
    setBusy(true);
    try {
      await api.addComment(me.id, user, exhibition, draft);
      setDraft('');
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const removeComment = async (c: PostComment) => {
    if (!me) return;
    await api.deleteComment(c.id, me.id);
    reload();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.l }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.head}>
          <Kicker>POST</Kicker>
          <View style={{ flexDirection: 'row', gap: space.l }}>
            {post && me && post.user_id !== me.id ? (
              <Pressable
                onPress={() =>
                  confirmAction(
                    'Report this post?',
                    'This sends the post to the host for review.',
                    () =>
                      api.reportContent({
                        reporterId: me.id,
                        kind: 'post',
                        subjectUserId: post.user_id,
                        exhibitionId: post.exhibition_id,
                        reason: 'Post reported from the app',
                      })
                  )
                }
                hitSlop={12}
              >
                <Text style={[styles.back, { color: colors.red }]}>REPORT</Text>
              </Pressable>
            ) : null}
            {post ? (
              <Pressable onPress={() => sharePost(post)} hitSlop={12}>
                <Text style={styles.back}>SHARE ↗</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.back}>← BACK</Text>
            </Pressable>
          </View>
        </View>

        {post === undefined ? (
          <Loading />
        ) : post === null ? (
          <EmptyState>This post isn’t available.</EmptyState>
        ) : (
          <>
            <ActivityRow
              item={post}
              engagement={engagement ?? undefined}
              onToggleLike={toggleLike}
            />

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>
                {comments.length > 0 ? `COMMENTS — ${comments.length}` : 'COMMENTS'}
              </Text>
            </View>
            {comments.length === 0 ? (
              <Text style={styles.noComments}>No comments yet. Say something first.</Text>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={styles.comment}>
                  <View style={styles.commentHead}>
                    <Text
                      style={styles.commentName}
                      onPress={() => router.push(`/profile/${c.user_id}`)}
                    >
                      {c.display_name.toUpperCase()}
                      <Text style={styles.commentDate}>
                        {'   '}
                        {fmtOpening(c.created_at).toUpperCase()}
                      </Text>
                    </Text>
                    {me && (c.user_id === me.id || post.user_id === me.id) && (
                      <MonoLink label="REMOVE" color={colors.red} onPress={() => removeComment(c)} />
                    )}
                  </View>
                  <Text style={styles.commentBody}>{c.body}</Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {post ? (
        me ? (
          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, space.m) }]}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Add a comment"
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
        ) : (
          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, space.m) }]}>
            <Pressable onPress={() => router.push('/auth')} hitSlop={8}>
              <Text style={styles.signIn}>SIGN IN TO COMMENT →</Text>
            </Pressable>
          </View>
        )
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.page,
    paddingBottom: space.m,
  },
  back: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink },
  sectionHead: { paddingHorizontal: space.page, paddingTop: space.l, paddingBottom: space.s },
  sectionTitle: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.8, color: colors.ink },
  noComments: {
    fontFamily: fonts.serifItalic, letterSpacing: 1.7, textTransform: 'uppercase',
    fontSize: 12,
    lineHeight: 19,
    color: colors.ink,
    paddingHorizontal: space.page,
    paddingBottom: space.l,
  },
  comment: {
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  commentHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentName: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.4, color: colors.ink },
  commentDate: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.8, color: colors.ink, opacity: 0.6 },
  commentBody: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 22, color: colors.ink },
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
  signIn: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.red, paddingVertical: 10 },
});
