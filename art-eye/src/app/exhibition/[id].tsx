import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SpecTable } from '../../components/exhibition';
import { ActionBar, Dot, Loading, Mono } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { artSource } from '../../lib/art';
import { data } from '../../lib/data';
import { useFocusLoad } from '../../lib/hooks';
import { colors, fonts, space, type } from '../../lib/theme';
import { REJECTION_REASON_LABELS } from '../../lib/types';

export default function ExhibitionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);

  const { data: exhibition, loading } = useFocusLoad(() => data.getExhibition(id), [id]);
  const { data: watchIds, reload: reloadWatch } = useFocusLoad(
    async () => (profile ? data.watchlistIds(profile.id) : []),
    [profile?.id]
  );
  const { data: visit } = useFocusLoad(
    async () => (profile ? data.getVisit(profile.id, id) : null),
    [profile?.id, id]
  );

  if (loading && !exhibition) return <Loading />;
  if (!exhibition) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Mono style={{ padding: space.screenX }}>THIS EXHIBITION IS NO LONGER LISTED.</Mono>
      </View>
    );
  }

  const wanted = (watchIds ?? []).includes(exhibition.id);
  const seen = !!visit;

  const requireAuth = (fn: () => void) => {
    if (!profile) {
      router.push('/auth/sign-in');
      return;
    }
    fn();
  };

  const toggleWant = () =>
    requireAuth(async () => {
      if (busy || !profile) return;
      setBusy(true);
      try {
        if (wanted) await data.removeWatch(profile.id, exhibition.id);
        else await data.addWatch(profile.id, exhibition.id);
        reloadWatch();
      } finally {
        setBusy(false);
      }
    });

  const coverHeight = width * 1.15;

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} showsVerticalScrollIndicator={false}>
      {/* full-bleed cover with centred overlay */}
      <View style={{ width, height: coverHeight }}>
        <Image source={artSource(exhibition)} style={{ width, height: coverHeight }} contentFit="cover" />
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(19,18,17,0.30)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: space.l,
          }}
        >
          <Text style={[type.capsLarge, { color: colors.paper, textAlign: 'center' }]}>
            {exhibition.artists.toUpperCase()}
          </Text>
          <Text
            style={{
              fontFamily: fonts.serifItalic,
              fontSize: 38,
              lineHeight: 44,
              color: colors.paper,
              textAlign: 'center',
              marginTop: 10,
            }}
          >
            {exhibition.title}
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{ position: 'absolute', top: insets.top + 10, left: space.screenX }}
        >
          <Text style={[type.mono, { color: colors.paper }]}>← BACK</Text>
        </Pressable>
        {seen && (
          <View style={{ position: 'absolute', top: insets.top + 12, right: space.screenX }}>
            <Dot size={10} />
          </View>
        )}
      </View>

      <SpecTable e={exhibition} />

      {exhibition.status !== 'approved' && (
        <View style={{ paddingHorizontal: space.screenX, paddingTop: space.m }}>
          <Mono style={{ color: colors.accent }}>
            {exhibition.status === 'pending'
              ? 'AWAITING REVIEW — NOT YET PUBLIC'
              : `REJECTED — ${(exhibition.rejection_reason ? REJECTION_REASON_LABELS[exhibition.rejection_reason] : 'OTHER').toUpperCase()}`}
          </Mono>
        </View>
      )}

      <Text style={[type.serifBody, { paddingHorizontal: space.screenX, paddingVertical: space.l }]}>
        {exhibition.description}
      </Text>

      {seen && visit && (
        <View style={{ paddingHorizontal: space.screenX, paddingBottom: space.l, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Mono>SEEN — YOUR RATING</Mono>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Dot key={n} size={8} filled={n <= visit.rating} />
              ))}
            </View>
          </View>
          {visit.reflection ? (
            <Text style={type.serifItalicBody}>“{visit.reflection}”</Text>
          ) : null}
        </View>
      )}

      {exhibition.status === 'approved' && (
        <View style={{ paddingHorizontal: space.screenX, paddingBottom: space.xxl }}>
          <ActionBar
            actions={[
              {
                label: wanted ? '● Want to see' : 'Want to see',
                onPress: toggleWant,
                accent: wanted,
                disabled: busy,
              },
              {
                label: seen ? 'Edit your note' : 'Mark as seen',
                onPress: () => requireAuth(() => router.push(`/log/${exhibition.id}`)),
                primary: true,
              },
            ]}
          />
        </View>
      )}
    </ScrollView>
  );
}
