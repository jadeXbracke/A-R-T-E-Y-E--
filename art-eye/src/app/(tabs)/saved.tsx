import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExhibitionRow } from '../../components/exhibition';
import { EmptyState, Hairline, Loading, Mono, MonoLink } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { data } from '../../lib/data';
import { useFocusLoad } from '../../lib/hooks';
import { colors, space, type } from '../../lib/theme';

export default function SavedScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const { data: rows, loading } = useFocusLoad(
    async () => (profile ? data.listWatchlist(profile.id) : []),
    [profile?.id]
  );
  const { data: seenIds } = useFocusLoad(
    async () => (profile ? (await data.listVisits(profile.id)).map((v) => v.exhibition_id) : []),
    [profile?.id]
  );
  const seen = new Set(seenIds ?? []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space.screenX, paddingTop: space.l, paddingBottom: space.m }}>
          <Mono style={{ color: colors.accent }}>YOUR CURATION</Mono>
          <Text style={[type.serifHeading, { marginTop: 6 }]}>Want to see</Text>
        </View>
        <Hairline />

        {!profile ? (
          <View style={{ paddingHorizontal: space.screenX, paddingVertical: space.xxl, gap: space.l }}>
            <Text style={[type.serifItalicBody, { color: colors.grey, fontSize: 18, lineHeight: 27 }]}>
              Your list lives with your account. Sign in to start curating what you want to see.
            </Text>
            <MonoLink label="Sign in →" active onPress={() => router.push('/auth/sign-in')} />
          </View>
        ) : loading && !rows ? (
          <Loading />
        ) : (rows ?? []).length === 0 ? (
          <EmptyState>
            Nothing saved yet. When an exhibition catches your eye, keep it here — this is where your
            curation begins.
          </EmptyState>
        ) : (
          <View>
            {(rows ?? []).map((e) => (
              <ExhibitionRow key={e.id} e={e} seen={seen.has(e.id)} />
            ))}
          </View>
        )}
        <View style={{ height: space.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
