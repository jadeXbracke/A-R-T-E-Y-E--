import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { fmtDay } from '../lib/dates';
import { FeedItem, FollowState, Profile } from '../lib/types';
import { PROFILE_TYPES } from '../lib/types';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { colors, fonts, space, type } from '../theme';
import { Lift, MonoLink, RatingDots } from './ui';
import { LiveArt } from './live-art';

function typeLabel(pt: Profile['profile_type']): string {
  return PROFILE_TYPES.find((t) => t.value === pt)?.label ?? pt.toUpperCase();
}

// Route param for a post = owner + exhibition, joined by a URL-safe separator.
export function postParam(item: Pick<FeedItem, 'user_id' | 'exhibition_id'>): string {
  return `${item.user_id}~${item.exhibition_id}`;
}

/** Round profile photo, or an initial on a flat fallback when there isn't one. */
function MiniAvatar({ uri, name, size }: { uri?: string | null; name: string; size: number }) {
  return uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
  ) : (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.4 }]}>
        {(name.trim()[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  );
}

const DOUBLE_TAP_MS = 280;

/** One activity-feed entry: a person logging a visit, with like + comment actions. */
export function ActivityRow({ item }: { item: FeedItem }) {
  const { profile } = useAuth();
  const [liked, setLiked] = useState(item.liked_by_me);
  const [likes, setLikes] = useState(item.like_count);
  const lastTap = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstScale = useRef(new Animated.Value(0)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;

  const like = async () => {
    if (!profile) {
      router.push('/auth');
      return;
    }
    setLiked(true);
    setLikes((n) => n + 1);
    try {
      await api.likePost(profile.id, item.user_id, item.exhibition_id);
    } catch {
      setLiked(false);
      setLikes((n) => n - 1);
    }
  };

  const unlike = async () => {
    if (!profile) return;
    setLiked(false);
    setLikes((n) => n - 1);
    try {
      await api.unlikePost(profile.id, item.user_id, item.exhibition_id);
    } catch {
      setLiked(true);
      setLikes((n) => n + 1);
    }
  };

  const toggleLike = () => (liked ? unlike() : like());

  const burstHeart = () => {
    burstScale.setValue(0.6);
    burstOpacity.setValue(1);
    Animated.sequence([
      Animated.spring(burstScale, { toValue: 1.15, useNativeDriver: true, speed: 20, bounciness: 9 }),
      Animated.timing(burstOpacity, { toValue: 0, duration: 350, delay: 250, useNativeDriver: true }),
    ]).start();
  };

  // Single tap opens the show, held briefly so a second tap can cancel it —
  // a double tap likes instead (Instagram-style; it never unlikes).
  const onMediaPress = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
      lastTap.current = 0;
      if (!profile) {
        router.push('/auth');
        return;
      }
      burstHeart();
      if (!liked) like();
      return;
    }
    lastTap.current = now;
    singleTapTimer.current = setTimeout(() => {
      router.push(`/exhibition/${item.exhibition_id}`);
    }, DOUBLE_TAP_MS);
  };

  return (
    <View style={styles.activity}>
      <View style={styles.activityHead}>
        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          onPress={() => router.push(`/profile/${item.user_id}`)}
          hitSlop={4}
        >
          <MiniAvatar uri={item.avatar_url} name={item.display_name} size={26} />
          <Text style={styles.person}>{item.display_name.toUpperCase()}</Text>
        </Pressable>
        <Text style={styles.date}>{fmtDay(item.visit_date, true).toUpperCase()}</Text>
      </View>

      <Pressable onPress={onMediaPress}>
        <LiveArt
          videoUrl={item.video_url}
          uri={item.photo_url ?? item.exhibition_image_url}
          venueUri={item.venue_image_url}
          fallbackId={item.id}
          aspectRatio={4 / 5}
          style={styles.media}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.heartBurst, { opacity: burstOpacity, transform: [{ scale: burstScale }] }]}
        >
          <Text style={styles.heartBurstGlyph}>♥</Text>
        </Animated.View>
      </Pressable>

      <Lift onPress={() => router.push(`/exhibition/${item.exhibition_id}`)} style={{ marginTop: space.m }}>
        <Text style={styles.showTitle} numberOfLines={2}>
          {item.exhibition_title}
        </Text>
        {item.venue_name && <Text style={styles.venue}>{item.venue_name.toUpperCase()}</Text>}
      </Lift>
      <View style={{ marginTop: space.s }}>
        <RatingDots value={item.rating} size={9} gap={7} />
      </View>
      {item.reflection ? <Text style={styles.reflection}>{item.reflection}</Text> : null}
      <View style={styles.actions}>
        <Pressable onPress={toggleLike} hitSlop={8} style={styles.action}>
          <Text style={[styles.actionGlyph, liked && { color: colors.ink }]}>{liked ? '♥' : '♡'}</Text>
          <Text style={styles.actionLabel}>{likes > 0 ? `${likes} ` : ''}LIKE{likes === 1 ? '' : 'S'}</Text>
        </Pressable>
        <Pressable onPress={() => router.push(`/post/${postParam(item)}`)} hitSlop={8} style={styles.action}>
          <Text style={styles.actionGlyph}>✎</Text>
          <Text style={styles.actionLabel}>
            {item.comment_count > 0 ? `${item.comment_count} ` : ''}COMMENT{item.comment_count === 1 ? '' : 'S'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/** A person row with a follow / requested / following action. */
export function PersonRow({
  person,
  state,
  onFollow,
  onUnfollow,
}: {
  person: Profile;
  state?: FollowState;
  onFollow?: () => void;
  onUnfollow?: () => void;
}) {
  return (
    <View style={styles.personRow}>
      <Lift style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.m }} onPress={() => router.push(`/profile/${person.id}`)}>
        <MiniAvatar uri={person.avatar_url} name={person.display_name} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.personName} numberOfLines={1}>
            {person.display_name}
          </Text>
          <Text style={styles.personMeta} numberOfLines={1}>
            {typeLabel(person.profile_type)}
            {person.is_private ? '  ·  PRIVATE' : ''}
          </Text>
        </View>
      </Lift>
      {state === 'following' ? (
        <MonoLink label="FOLLOWING" active onPress={onUnfollow} />
      ) : state === 'requested' ? (
        <MonoLink label="REQUESTED" onPress={onUnfollow} />
      ) : onFollow ? (
        <MonoLink label="FOLLOW" active onPress={onFollow} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  activity: {
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  activityHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.s,
  },
  person: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink },
  date: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.ink },
  media: { width: '100%', backgroundColor: colors.dim },
  heartBurst: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBurstGlyph: { fontSize: 72, color: colors.white, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 12 },
  showTitle: { ...type.serifTitle, fontSize: 20 },
  venue: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: colors.ink, marginTop: 3 },
  reflection: { ...type.serifBody, fontSize: 16, lineHeight: 24, marginTop: space.s },
  actions: { flexDirection: 'row', gap: space.l, marginTop: space.m, alignItems: 'center' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionGlyph: { fontSize: 15, color: colors.ink },
  actionLabel: { fontFamily: fonts.monoMedium, fontSize: 9, letterSpacing: 1.4, color: colors.ink },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  personName: { ...type.serifTitle, fontSize: 18 },
  personMeta: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: colors.ink, marginTop: 3 },
  avatarFallback: {
    backgroundColor: colors.dim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontFamily: fonts.serifMedium, color: colors.ink },
});
