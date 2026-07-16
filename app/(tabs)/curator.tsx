import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Masthead } from '@/components/Header';
import {
  ArtImage,
  EmptyState,
  HairRule,
  InkButton,
  MonoLabel,
  MonoText,
  RatingDots,
} from '@/components/ui';
import { longDate } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { PROFILE_TYPE_LABEL } from '@/lib/types';
import { color, space, type } from '@/theme';

export default function CuratorScreen() {
  const router = useRouter();
  const { user, exhibitions, venueById, exhibitionById, watchlist, visits, signOut, backendKind } =
    useStore();

  const stats = useMemo(() => {
    const seen = visits.length;
    const want = watchlist.size;
    const avg = seen === 0 ? null : visits.reduce((s, v) => s + v.rating, 0) / seen;
    return { seen, want, avg };
  }, [visits, watchlist]);

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: color.white }}>
        <Masthead subtitle="YOUR EYE ON THE ART WORLD" />
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 40, gap: 24 }}>
          <MonoLabel>CURATOR</MonoLabel>
          <Text style={type.noteSerif}>
            Your record of the art world starts with an account. Everything you see, kept.
          </Text>
          <InkButton label="SIGN IN OR CREATE ACCOUNT" onPress={() => router.push('/auth')} />
          {backendKind === 'demo' && (
            <MonoText>DEMO MODE — DATA STAYS ON THIS DEVICE UNTIL SUPABASE IS CONFIGURED</MonoText>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.white }}>
      <Masthead subtitle="YOUR EYE ON THE ART WORLD" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 22 }}>
          <MonoLabel>CURATOR</MonoLabel>
          <Text style={[type.displaySerif, { marginTop: 6 }]}>{user.display_name}</Text>
          <MonoText style={{ marginTop: 8 }}>
            {PROFILE_TYPE_LABEL[user.profile_type].toUpperCase()} — {user.city.toUpperCase()}
          </MonoText>
        </View>

        {/* Stat line */}
        <View
          style={{
            flexDirection: 'row',
            marginTop: 24,
            marginHorizontal: space.gutter,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: color.hairline,
          }}
        >
          {(
            [
              { n: String(stats.seen), label: 'SEEN' },
              { n: String(stats.want), label: 'WANT TO SEE' },
              { n: stats.avg === null ? '—' : stats.avg.toFixed(1), label: 'AVG' },
            ] as const
          ).map((s, i) => (
            <View
              key={s.label}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 16,
                borderLeftWidth: i === 0 ? 0 : 1,
                borderLeftColor: color.hairline,
              }}
            >
              <Text style={[type.displaySerif, { fontSize: 26, lineHeight: 30 }]}>{s.n}</Text>
              <MonoLabel style={{ marginTop: 4 }}>{s.label}</MonoLabel>
            </View>
          ))}
        </View>

        {/* Diary */}
        <MonoLabel style={{ paddingHorizontal: space.gutter, paddingTop: 28, color: color.ink }}>
          YOUR CURATION — THE LOG
        </MonoLabel>
        {visits.length === 0 ? (
          <EmptyState text="Your log is empty. Every exhibition you see becomes part of your record — your eye on the art world, kept." />
        ) : (
          <View style={{ paddingHorizontal: space.gutter, marginTop: 6 }}>
            {visits.map((v, i) => {
              const e = exhibitionById(v.exhibition_id);
              const venue = e ? venueById(e.venue_id) : undefined;
              return (
                <View key={v.exhibition_id}>
                  {i > 0 && <HairRule />}
                  <Pressable
                    onPress={() => e && router.push(`/exhibition/${e.id}`)}
                    style={{ flexDirection: 'row', gap: space.m, paddingVertical: space.m }}
                  >
                    <ArtImage
                      uri={e?.image_url ?? null}
                      toneKey={v.exhibition_id}
                      style={{ width: 64, height: 80 }}
                    />
                    <View style={{ flex: 1 }}>
                      <MonoText>
                        {longDate(v.visit_date)}
                        {venue ? ` · ${venue.name.toUpperCase()}` : ''}
                      </MonoText>
                      <Text style={[type.titleSerif, { fontSize: 19, marginTop: 3 }]} numberOfLines={1}>
                        {e?.title ?? 'Exhibition'}
                      </Text>
                      <View style={{ marginTop: 7 }}>
                        <RatingDots value={v.rating} size={9} gap={7} />
                      </View>
                      {v.reflection ? (
                        <Text style={[type.noteSerif, { marginTop: 8, color: color.ink }]}>
                          “{v.reflection}”
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {/* Role links + account */}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 24, gap: 18 }}>
          <HairRule />
          {user.role === 'venue_owner' && (
            <Pressable onPress={() => router.push('/venue')} hitSlop={6}>
              <Text style={[type.monoAction, { textDecorationLine: 'underline' }]}>
                YOUR VENUE SUBMISSIONS
              </Text>
            </Pressable>
          )}
          {user.role === 'admin' && (
            <Pressable onPress={() => router.push('/admin')} hitSlop={6}>
              <Text style={[type.monoAction, { textDecorationLine: 'underline', textDecorationColor: color.red }]}>
                REVIEW SUBMISSIONS
              </Text>
            </Pressable>
          )}
          <Pressable onPress={() => signOut()} hitSlop={6}>
            <Text style={[type.monoAction, { color: color.grey, textDecorationLine: 'underline' }]}>
              SIGN OUT
            </Text>
          </Pressable>
          {backendKind === 'demo' && (
            <MonoText>DEMO MODE — DATA STAYS ON THIS DEVICE UNTIL SUPABASE IS CONFIGURED</MonoText>
          )}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}
