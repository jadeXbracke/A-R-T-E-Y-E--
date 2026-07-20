import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArtImage } from '../../src/components/exhibition';
import { EmptyState, Hairline, Kicker, Loading, MonoLink, RatingDots } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { fmtDay } from '../../src/lib/dates';
import { Exhibition, PROFILE_TYPES, Visit } from '../../src/lib/types';
import { colors, fonts, space, type } from '../../src/theme';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function CuratorScreen() {
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [watchCount, setWatchCount] = useState(0);
  const [exhibitions, setExhibitions] = useState<Map<string, Exhibition>>(new Map());

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (!profile) {
        setVisits(null);
        return;
      }
      (async () => {
        const [v, w, all] = await Promise.all([
          api.listVisits(profile.id),
          api.listWatchlist(profile.id),
          api.listApprovedExhibitions(),
        ]);
        if (!alive) return;
        setVisits(v);
        setWatchCount(w.length);
        const map = new Map(all.map((e) => [e.id, e]));
        // visits can reference exhibitions no longer in the public agenda
        await Promise.all(
          v
            .filter((x) => !map.has(x.exhibition_id))
            .map(async (x) => {
              const e = await api.getExhibition(x.exhibition_id);
              if (e) map.set(e.id, e);
            })
        );
        if (alive) setExhibitions(map);
      })();
      return () => {
        alive = false;
      };
    }, [profile])
  );

  const avg = useMemo(() => {
    if (!visits?.length) return '—';
    return (visits.reduce((s, v) => s + v.rating, 0) / visits.length).toFixed(1);
  }, [visits]);

  if (!profile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: insets.top + space.xl,
          paddingHorizontal: space.page,
        }}
      >
        <Kicker style={{ marginBottom: 10 }}>CURATOR</Kicker>
        <Text style={type.serifHeading}>Your record</Text>
        <Text style={styles.signedOut}>
          Every exhibition you see becomes part of your record — your eye on the art world,
          kept. Sign in to begin.
        </Text>
        <MonoLink
          label="SIGN IN OR CREATE AN ACCOUNT"
          active
          onPress={() => router.push('/auth')}
          style={{ alignSelf: 'flex-start', marginTop: space.l }}
        />
      </View>
    );
  }

  const typeLabel =
    PROFILE_TYPES.find((t) => t.value === profile.profile_type)?.label ?? 'ENTHUSIAST';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.m, paddingBottom: space.xl }}
    >
      <View style={{ paddingHorizontal: space.page, paddingBottom: space.l }}>
        <Kicker style={{ marginBottom: 10 }}>CURATOR</Kicker>
        <Text style={[type.serifHeading, { marginBottom: 8 }]}>{profile.display_name}</Text>
        <Text style={styles.profileType}>
          {typeLabel} — {profile.city.toUpperCase()}
        </Text>
      </View>

      <Hairline />
      <View style={styles.stats}>
        <Stat label="SEEN" value={String(visits?.length ?? 0)} />
        <View style={styles.statDivider} />
        <Stat label="WANT TO SEE" value={String(watchCount)} />
        <View style={styles.statDivider} />
        <Stat label="AVG" value={avg} />
      </View>
      <Hairline />

      <View style={{ paddingHorizontal: space.page, paddingTop: space.xl, paddingBottom: space.s }}>
        <Text style={[type.serifHeading, { fontSize: 28 }]}>Your curation</Text>
      </View>

      {visits === null ? (
        <Loading />
      ) : visits.length === 0 ? (
        <EmptyState>
          Your log is empty. Every exhibition you see becomes part of your record — your eye
          on the art world, kept.
        </EmptyState>
      ) : (
        visits.map((v, i) => {
          const e = exhibitions.get(v.exhibition_id);
          return (
            <Pressable
              key={v.exhibition_id}
              onPress={() => e && router.push(`/exhibition/${e.id}`)}
            >
              {i > 0 && <Hairline style={{ marginHorizontal: space.page }} />}
              <View style={styles.entry}>
                {e && (
                  <ArtImage
                    uri={e.image_url}
                    fallbackId={e.id}
                    style={styles.entryThumb}
                    contentFit="cover"
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryMeta}>
                    {fmtDay(v.visit_date, true)} · {e?.venue?.name.toUpperCase() ?? ''}
                  </Text>
                  <Text style={styles.entryTitle} numberOfLines={2}>
                    {e?.title ?? 'Exhibition'}
                  </Text>
                  <RatingDots value={v.rating} size={9} gap={7} />
                  {!!v.reflection && (
                    <Text style={styles.entryNote}>“{v.reflection}”</Text>
                  )}
                </View>
              </View>
            </Pressable>
          );
        })
      )}

      <View style={styles.footerLinks}>
        {profile.role === 'admin' && (
          <MonoLink
            label="HOST CONTROL — MANAGE THE APP"
            active
            onPress={() => router.push('/admin')}
            style={{ alignSelf: 'flex-start' }}
          />
        )}
        <MonoLink
          label="SIGN OUT"
          onPress={() => signOut()}
          style={{ alignSelf: 'flex-start' }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  signedOut: {
    fontFamily: fonts.serifItalic,
    fontSize: 20,
    lineHeight: 30,
    color: colors.grey,
    marginTop: space.l,
  },
  profileType: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.grey,
  },
  stats: { flexDirection: 'row', paddingVertical: space.l },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.hairline },
  statValue: { fontFamily: fonts.serifMedium, fontSize: 30, color: colors.ink, marginBottom: 4 },
  statLabel: { ...type.monoLabel },
  entry: {
    flexDirection: 'row',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingVertical: space.m,
  },
  entryThumb: { width: 64, height: 80, backgroundColor: colors.hairline },
  entryMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.grey,
    marginBottom: 4,
  },
  entryTitle: { ...type.serifTitle, fontSize: 19, marginBottom: 7 },
  entryNote: {
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    lineHeight: 23,
    color: colors.ink,
    marginTop: 8,
  },
  footerLinks: {
    paddingHorizontal: space.page,
    marginTop: space.xxl,
    gap: space.l,
  },
});
