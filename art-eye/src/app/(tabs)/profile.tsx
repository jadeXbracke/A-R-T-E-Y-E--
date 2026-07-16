import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dot, EmptyState, Hairline, Loading, Mono, MonoLink } from '../../components/ui';
import { useAuth } from '../../context/auth';
import { artSource } from '../../lib/art';
import { data } from '../../lib/data';
import { formatDay } from '../../lib/dates';
import { useFocusLoad } from '../../lib/hooks';
import { colors, space, type } from '../../lib/theme';
import { Exhibition, PROFILE_TYPE_LABELS, REJECTION_REASON_LABELS } from '../../lib/types';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: space.l }}>
      <Text style={[type.serifHeading, { fontSize: 30 }]}>{value}</Text>
      <Mono style={{ marginTop: 4, fontSize: 10 }}>{label.toUpperCase()}</Mono>
    </View>
  );
}

function SubmissionRow({ e, onPress }: { e: Exhibition; onPress: () => void }) {
  const status =
    e.status === 'pending'
      ? 'AWAITING REVIEW'
      : e.status === 'approved'
        ? 'LIVE IN THE AGENDA'
        : `REJECTED — ${(e.rejection_reason ? REJECTION_REASON_LABELS[e.rejection_reason] : 'Other').toUpperCase()}`;
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View style={{ paddingVertical: space.m, opacity: pressed ? 0.6 : 1 }}>
          <Mono style={{ color: e.status === 'rejected' ? colors.accent : colors.grey, fontSize: 10 }}>
            {status}
          </Mono>
          <Text style={[type.serifTitle, { fontSize: 20, marginTop: 4 }]}>{e.title}</Text>
          <Mono style={{ marginTop: 3 }}>{e.venue?.name.toUpperCase() ?? ''} · EDIT →</Mono>
          <Hairline style={{ marginTop: space.m }} />
        </View>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const { data: visits, loading } = useFocusLoad(
    async () => (profile ? data.listVisits(profile.id) : []),
    [profile?.id]
  );
  const { data: watchIds } = useFocusLoad(
    async () => (profile ? data.watchlistIds(profile.id) : []),
    [profile?.id]
  );
  const { data: submissions } = useFocusLoad(
    async () =>
      profile && (profile.role === 'venue_owner' || profile.role === 'admin')
        ? data.listMySubmissions(profile.id)
        : [],
    [profile?.id, profile?.role]
  );

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
        <View style={{ paddingHorizontal: space.screenX, paddingTop: space.l }}>
          <Mono style={{ color: colors.accent }}>CURATOR</Mono>
          <Text style={[type.serifHeading, { marginTop: 6 }]}>Your record</Text>
        </View>
        <View style={{ paddingHorizontal: space.screenX, paddingTop: space.xl, gap: space.l }}>
          <Text style={[type.serifItalicBody, { color: colors.grey, fontSize: 18, lineHeight: 27 }]}>
            Every exhibition you see becomes part of your record — your eye on the art world, kept.
            Create an account to begin.
          </Text>
          <MonoLink label="Create an account →" active onPress={() => router.push('/auth/sign-up')} />
          <MonoLink label="Sign in" onPress={() => router.push('/auth/sign-in')} />
        </View>
      </SafeAreaView>
    );
  }

  const seenCount = (visits ?? []).length;
  const avg =
    seenCount > 0
      ? ((visits ?? []).reduce((s, v) => s + v.rating, 0) / seenCount).toFixed(1)
      : '—';
  const isVenue = profile.role === 'venue_owner' || profile.role === 'admin';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space.screenX, paddingTop: space.l, paddingBottom: space.l }}>
          <Mono style={{ color: colors.accent }}>CURATOR</Mono>
          <Text style={[type.serifHeading, { marginTop: 6 }]}>{profile.display_name}</Text>
          <Mono style={{ marginTop: 6 }}>
            {`${PROFILE_TYPE_LABELS[profile.profile_type].toUpperCase()} — ${profile.city.toUpperCase()}`}
          </Mono>
        </View>

        {/* stat line */}
        <Hairline />
        <View style={{ flexDirection: 'row' }}>
          <Stat value={String(seenCount)} label="Seen" />
          <View style={{ width: 1, backgroundColor: colors.hairline }} />
          <Stat value={String((watchIds ?? []).length)} label="Want to see" />
          <View style={{ width: 1, backgroundColor: colors.hairline }} />
          <Stat value={avg} label="Avg" />
        </View>
        <Hairline />

        {/* venue owner tools */}
        {isVenue && (
          <View style={{ paddingHorizontal: space.screenX, paddingTop: space.xl }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Text style={[type.serifTitle, { fontSize: 24 }]}>Your venue</Text>
              <MonoLink label="Submit an exhibition →" active onPress={() => router.push('/submit')} />
            </View>
            <View style={{ marginTop: space.m }}>
              {(submissions ?? []).length === 0 ? (
                <Text style={[type.serifItalicBody, { color: colors.grey, fontSize: 16 }]}>
                  No submissions yet. Exhibitions you submit appear in the agenda once approved.
                </Text>
              ) : (
                (submissions ?? []).map((e) => (
                  <SubmissionRow key={e.id} e={e} onPress={() => router.push(`/edit-submission/${e.id}`)} />
                ))
              )}
            </View>
          </View>
        )}

        {/* diary */}
        <View style={{ paddingHorizontal: space.screenX, paddingTop: space.xl, paddingBottom: space.s }}>
          <Text style={[type.serifTitle, { fontSize: 24 }]}>Your curation</Text>
        </View>

        {loading && !visits ? (
          <Loading />
        ) : seenCount === 0 ? (
          <EmptyState>
            Your log is empty. Every exhibition you see becomes part of your record — your eye on the
            art world, kept.
          </EmptyState>
        ) : (
          <View style={{ paddingHorizontal: space.screenX }}>
            {(visits ?? []).map((v) => (
              <Pressable key={v.id} onPress={() => router.push(`/exhibition/${v.exhibition_id}`)}>
                {({ pressed }) => (
                  <View style={{ paddingVertical: space.l, opacity: pressed ? 0.6 : 1 }}>
                    <View style={{ flexDirection: 'row', gap: space.m }}>
                      {v.exhibition && (
                        <Image
                          source={artSource(v.exhibition)}
                          style={{ width: 56, height: 70 }}
                          contentFit="cover"
                        />
                      )}
                      <View style={{ flex: 1, gap: 4 }}>
                        <Mono style={{ fontSize: 10 }}>
                          {`${formatDay(v.visit_date)} · ${v.exhibition?.venue?.name.toUpperCase() ?? ''}`}
                        </Mono>
                        <Text style={[type.serifTitle, { fontSize: 20, lineHeight: 24 }]} numberOfLines={2}>
                          {v.exhibition?.title ?? ''}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 5, marginTop: 2 }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Dot key={n} size={8} filled={n <= v.rating} />
                          ))}
                        </View>
                      </View>
                    </View>
                    {v.reflection ? (
                      <Text style={[type.serifItalicBody, { marginTop: space.m }]}>“{v.reflection}”</Text>
                    ) : null}
                    <Hairline style={{ marginTop: space.l }} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ paddingHorizontal: space.screenX, paddingVertical: space.xl }}>
          <MonoLink label="Sign out" onPress={() => signOut()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
