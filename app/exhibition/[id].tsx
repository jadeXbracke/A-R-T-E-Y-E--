import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackBar } from '@/components/Header';
import { ArtImage, ArtistCaps, EmptyState, MonoText, RatingDots, SeenDot } from '@/components/ui';
import { dateRange, isUpcoming, openingLabel } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { color, fill, font, hairline, space, type } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;

function SpecRow({ label, value, red }: { label: string; value: string; red?: boolean }) {
  return (
    <View style={styles.specRow}>
      <MonoText style={{ width: 90, color: color.grey }}>{label}</MonoText>
      <MonoText style={{ flex: 1, color: red ? color.red : color.ink }}>{value}</MonoText>
    </View>
  );
}

export default function ExhibitionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, exhibitionById, venueById, watchlist, visitFor, toggleWatchlist } = useStore();

  const e = id ? exhibitionById(id) : undefined;
  if (!e) {
    return (
      <View style={{ flex: 1, backgroundColor: color.white }}>
        <BackBar title="EXHIBITION" />
        <EmptyState text="This exhibition has left the agenda." />
      </View>
    );
  }

  const venue = venueById(e.venue_id);
  const visit = visitFor(e.id);
  const wanted = watchlist.has(e.id);
  const upcoming = isUpcoming(e);

  const requireAuth = (fn: () => void) => () => {
    if (!user) router.push('/auth');
    else fn();
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.white }}>
      <BackBar title="EXHIBITION" right={visit ? <SeenDot /> : null} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover with centered overlay */}
        <View style={{ width: SCREEN_W, height: Math.round(SCREEN_W * 1.15) }}>
          <ArtImage uri={e.image_url} toneKey={e.id} style={fill} />
          <View style={styles.scrim} />
          <View style={styles.coverText}>
            <ArtistCaps style={{ color: color.white, textAlign: 'center' }}>{e.artists}</ArtistCaps>
            <Text style={[type.heroTitle, { textAlign: 'center', marginTop: 10 }]}>{e.title}</Text>
          </View>
        </View>

        {/* Mono spec table */}
        <View style={{ marginHorizontal: space.gutter, marginTop: 8 }}>
          <SpecRow label="VENUE" value={venue ? venue.name.toUpperCase() : '—'} />
          <SpecRow label="TYPE" value={(venue?.type ?? '—').toUpperCase()} />
          <SpecRow label="DATES" value={dateRange(e.start_date, e.end_date)} />
          {e.opening_datetime && (
            <SpecRow
              label="OPENING"
              value={`OPENING NIGHT — ${openingLabel(e.opening_datetime)}`}
              red={upcoming}
            />
          )}
          {venue?.address ? <SpecRow label="WHERE" value={venue.address.toUpperCase()} /> : null}
        </View>

        {/* Description */}
        {e.description ? (
          <Text style={[type.bodySerif, { marginHorizontal: space.gutter, marginTop: 22 }]}>
            {e.description}
          </Text>
        ) : null}

        {/* Your record of it */}
        {visit && (
          <View style={{ marginHorizontal: space.gutter, marginTop: 26 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <SeenDot />
              <MonoText style={{ color: color.ink }}>IN YOUR CURATION</MonoText>
            </View>
            <View style={{ marginTop: 10 }}>
              <RatingDots value={visit.rating} size={10} gap={8} />
            </View>
            {visit.reflection ? (
              <Text style={[type.noteSerif, { marginTop: 10 }]}>“{visit.reflection}”</Text>
            ) : null}
            <Pressable onPress={requireAuth(() => router.push(`/log/${e.id}`))} hitSlop={6} style={{ marginTop: 12 }}>
              <Text style={[type.monoAction, { color: color.grey, textDecorationLine: 'underline' }]}>
                EDIT YOUR NOTE
              </Text>
            </Pressable>
          </View>
        )}

        {/* Action bar — single 1px ink border, side-by-side */}
        {!visit && (
          <View style={styles.actionBar}>
            <Pressable
              onPress={requireAuth(() => toggleWatchlist(e.id))}
              style={({ pressed }) => [
                styles.action,
                wanted && { backgroundColor: color.ink },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[type.monoAction, { color: wanted ? color.white : color.ink }]}>
                {wanted ? 'WANTED ✓' : 'WANT TO SEE'}
              </Text>
            </Pressable>
            <View style={{ width: 1, backgroundColor: color.ink }} />
            <Pressable
              onPress={requireAuth(() => router.push(`/log/${e.id}`))}
              style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
            >
              <Text style={type.monoAction}>MARK AS SEEN</Text>
            </Pressable>
          </View>
        )}

        {!user && (
          <Text
            style={{
              fontFamily: font.mono,
              fontSize: 10,
              letterSpacing: 1,
              color: color.grey,
              textAlign: 'center',
              marginTop: 12,
            }}
          >
            SIGN IN TO CURATE
          </Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...fill,
    backgroundColor: 'rgba(19,18,17,0.32)',
  },
  coverText: {
    ...fill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.l,
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: hairline,
    borderBottomColor: color.hairline,
  },
  actionBar: {
    flexDirection: 'row',
    marginHorizontal: space.gutter,
    marginTop: 28,
    borderWidth: 1,
    borderColor: color.ink,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
});
