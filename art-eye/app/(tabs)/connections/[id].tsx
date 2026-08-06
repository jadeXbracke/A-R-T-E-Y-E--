import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersonRow } from '../../../src/components/social';
import { EmptyState, Hairline, Kicker, Loading } from '../../../src/components/ui';
import { api } from '../../../src/lib/api';
import { PublicProfile, Profile } from '../../../src/lib/types';
import { colors, fonts, space, type } from '../../../src/theme';

// /connections/<profile id>?type=followers|following — who follows this
// person, or who they follow. Every row taps through to that person's own
// profile, so you can browse the social graph one person at a time.
export default function ConnectionsScreen() {
  const { id, type: kindParam } = useLocalSearchParams<{ id: string; type?: string }>();
  const insets = useSafeAreaInsets();
  const kind = kindParam === 'following' ? 'following' : 'followers';

  const [owner, setOwner] = useState<PublicProfile | null | undefined>(undefined);
  const [people, setPeople] = useState<Profile[] | null>(null);

  const reload = useCallback(() => {
    if (!id) return;
    api.getPublicProfile(id, null).then(setOwner);
    (kind === 'following' ? api.listFollowing(id) : api.listFollowers(id)).then(setPeople);
  }, [id, kind]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: insets.bottom + space.xl }}
    >
      <View style={styles.head}>
        <Kicker>{kind === 'following' ? 'FOLLOWING' : 'FOLLOWERS'}</Kicker>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: space.page, paddingBottom: space.m }}>
        <Text style={type.serifHeading}>
          {owner === undefined ? '' : owner === null ? 'Not found' : owner.display_name}
        </Text>
      </View>
      <Hairline />

      {people === null ? (
        <Loading />
      ) : people.length === 0 ? (
        <EmptyState>
          {kind === 'following' ? 'Not following anyone yet.' : 'No followers yet.'}
        </EmptyState>
      ) : (
        people.map((p) => <PersonRow key={p.id} person={p} />)
      )}
    </ScrollView>
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
});
