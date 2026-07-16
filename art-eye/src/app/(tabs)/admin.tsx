import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, Hairline, Loading, Mono } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { artSource } from '../../lib/art';
import { data } from '../../lib/data';
import { formatRange } from '../../lib/dates';
import { useFocusLoad } from '../../lib/hooks';
import { colors, space, type } from '../../lib/theme';

export default function AdminScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const { data: pending, loading } = useFocusLoad(
    async () => (isAdmin ? data.listPending() : []),
    [isAdmin]
  );

  if (!isAdmin) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
        <EmptyState>This area is for admins.</EmptyState>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space.screenX, paddingTop: space.l, paddingBottom: space.m }}>
          <Mono style={{ color: colors.accent }}>ADMIN</Mono>
          <Text style={[type.serifHeading, { marginTop: 6 }]}>For review</Text>
          <Mono style={{ marginTop: 4 }}>{`${(pending ?? []).length} AWAITING APPROVAL`}</Mono>
        </View>
        <Hairline />

        {loading && !pending ? (
          <Loading />
        ) : (pending ?? []).length === 0 ? (
          <EmptyState>Nothing awaiting review. New submissions will appear here first.</EmptyState>
        ) : (
          (pending ?? []).map((e) => (
            <Pressable key={e.id} onPress={() => router.push(`/review/${e.id}`)}>
              {({ pressed }) => (
                <View style={{ opacity: pressed ? 0.6 : 1 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: space.m,
                      paddingHorizontal: space.screenX,
                      paddingVertical: space.m,
                    }}
                  >
                    <Image source={artSource(e)} style={{ width: 64, height: 80 }} contentFit="cover" />
                    <View style={{ flex: 1, justifyContent: 'center', gap: 3 }}>
                      <Mono style={{ fontSize: 10 }}>{formatRange(e.start_date, e.end_date)}</Mono>
                      <Text style={[type.serifTitle, { fontSize: 20 }]} numberOfLines={2}>
                        {e.title}
                      </Text>
                      <Mono numberOfLines={1}>
                        {`${e.artists.toUpperCase()} · ${e.venue?.name.toUpperCase() ?? ''}`}
                      </Mono>
                      {!e.image_url && (
                        <Mono style={{ color: colors.accent, fontSize: 10 }}>NO IMAGE SUPPLIED</Mono>
                      )}
                    </View>
                    <View style={{ justifyContent: 'center' }}>
                      <Mono style={{ color: colors.ink }}>REVIEW →</Mono>
                    </View>
                  </View>
                  <Hairline style={{ marginHorizontal: space.screenX }} />
                </View>
              )}
            </Pressable>
          ))
        )}
        <View style={{ height: space.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
