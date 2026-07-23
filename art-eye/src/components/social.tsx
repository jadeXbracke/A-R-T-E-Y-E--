import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fmtDay } from '../lib/dates';
import { FeedItem, FollowState, Profile } from '../lib/types';
import { PROFILE_TYPES } from '../lib/types';
import { colors, fonts, space, type } from '../theme';
import { Lift, MonoLink, RatingDots } from './ui';
import { LiveArt } from './live-art';

function typeLabel(pt: Profile['profile_type']): string {
  return PROFILE_TYPES.find((t) => t.value === pt)?.label ?? pt.toUpperCase();
}

/** One activity-feed entry: a person logging a visit to a show. */
export function ActivityRow({ item }: { item: FeedItem }) {
  return (
    <View style={styles.activity}>
      <View style={styles.activityHead}>
        <Text style={styles.person} onPress={() => router.push(`/profile/${item.user_id}`)}>
          {item.display_name.toUpperCase()}
        </Text>
        <Text style={styles.date}>{fmtDay(item.visit_date, true).toUpperCase()}</Text>
      </View>
      <Lift onPress={() => router.push(`/exhibition/${item.exhibition_id}`)}>
        <Text style={styles.showTitle} numberOfLines={2}>
          {item.exhibition_title}
        </Text>
        {item.venue_name && <Text style={styles.venue}>{item.venue_name.toUpperCase()}</Text>}
      </Lift>
      <View style={{ marginTop: space.s }}>
        <RatingDots value={item.rating} size={9} gap={7} />
      </View>
      {item.reflection ? <Text style={styles.reflection}>{item.reflection}</Text> : null}
      {item.video_url ? (
        <LiveArt
          videoUrl={item.video_url}
          fallbackId={item.id}
          aspectRatio={4 / 5}
          style={styles.video}
        />
      ) : null}
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
      <Lift style={{ flex: 1 }} onPress={() => router.push(`/profile/${person.id}`)}>
        <Text style={styles.personName} numberOfLines={1}>
          {person.display_name}
        </Text>
        <Text style={styles.personMeta} numberOfLines={1}>
          {typeLabel(person.profile_type)}
          {person.is_private ? '  ·  PRIVATE' : ''}
        </Text>
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
    marginBottom: 6,
  },
  person: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: colors.ink },
  date: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.ink },
  showTitle: { ...type.serifTitle, fontSize: 20 },
  venue: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: colors.ink, marginTop: 3 },
  reflection: { ...type.serifBody, fontSize: 16, lineHeight: 24, marginTop: space.s },
  video: { width: '100%', marginTop: space.m, backgroundColor: colors.hairline },
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
});
