import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { artSource } from '../lib/art';
import { formatOpening, formatRange, statusLine } from '../lib/dates';
import { colors, fonts, space, type } from '../lib/theme';
import { Exhibition } from '../lib/types';
import { Dot, Hairline, Mono, MonoInk } from './ui';

// ---------- shared bits ----------

function SeenDot() {
  return (
    <View style={{ position: 'absolute', top: 8, right: 8 }}>
      <Dot size={10} />
    </View>
  );
}

function OpeningTag({ e }: { e: Exhibition }) {
  if (!e.opening_datetime || new Date(e.opening_datetime).getTime() < Date.now()) return null;
  return (
    <Text style={[type.monoSmall, { color: colors.accent }]}>
      {`OPENING ${formatOpening(e.opening_datetime)}`}
    </Text>
  );
}

// ---------- list row ----------

export function ExhibitionRow({ e, seen }: { e: Exhibition; seen: boolean }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(`/exhibition/${e.id}`)}>
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.6 : 1 }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: space.screenX, paddingVertical: space.m, gap: space.m }}>
            <View>
              <Image source={artSource(e)} style={{ width: 84, height: 106 }} contentFit="cover" />
              {seen && <SeenDot />}
            </View>
            <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
              <Mono>{statusLine(e)}</Mono>
              <Text style={[type.serifTitle, { fontSize: 21, lineHeight: 25 }]} numberOfLines={2}>
                {e.title}
              </Text>
              <Text style={[type.caps, { fontSize: 11, letterSpacing: 1.8 }]} numberOfLines={1}>
                {e.artists.toUpperCase()}
              </Text>
              <Mono numberOfLines={1}>{e.venue?.name.toUpperCase() ?? ''}</Mono>
              <OpeningTag e={e} />
            </View>
          </View>
          <Hairline style={{ marginHorizontal: space.screenX }} />
        </View>
      )}
    </Pressable>
  );
}

// ---------- grid cell ----------

export function ExhibitionGridCell({ e, seen, width }: { e: Exhibition; seen: boolean; width: number }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(`/exhibition/${e.id}`)} style={{ width }}>
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.6 : 1, marginBottom: space.l }}>
          <View>
            <Image source={artSource(e)} style={{ width, height: width * 1.25 }} contentFit="cover" />
            {seen && <SeenDot />}
          </View>
          <View style={{ paddingTop: space.s, gap: 3 }}>
            <Mono style={{ fontSize: 10 }}>{statusLine(e)}</Mono>
            <Text style={[type.serifTitle, { fontSize: 18, lineHeight: 21 }]} numberOfLines={2}>
              {e.title}
            </Text>
            <Text style={[type.caps, { fontSize: 10, letterSpacing: 1.6 }]} numberOfLines={1}>
              {e.artists.toUpperCase()}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

// ---------- hero carousel ----------

export function HeroCarousel({ featured }: { featured: Exhibition[] }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [active, setActive] = useState(0);
  const listRef = useRef<FlatList<Exhibition>>(null);

  const onViewable = useCallback(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) setActive(first.index);
    },
    []
  );

  if (featured.length === 0) return null;

  const height = width * 1.2;

  return (
    <View>
      <FlatList
        ref={listRef}
        data={featured}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(e) => e.id}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/exhibition/${item.id}`)}>
            <View style={{ width, height }}>
              <Image source={artSource(item)} style={{ width, height }} contentFit="cover" />
              <LinearGradient
                colors={['rgba(19,18,17,0)', 'rgba(19,18,17,0.55)']}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  paddingHorizontal: space.screenX,
                  paddingTop: 96,
                  paddingBottom: space.l,
                }}
              >
                <Text style={[type.capsLarge, { color: colors.paper, fontSize: 12, letterSpacing: 2.6 }]}>
                  {item.artists.toUpperCase()}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.serifItalic,
                    fontSize: 34,
                    lineHeight: 38,
                    color: colors.paper,
                    marginTop: 6,
                  }}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <Text style={[type.mono, { color: colors.paper, marginTop: 10, opacity: 0.9 }]}>
                  {`${item.venue?.name.toUpperCase() ?? ''} · ${formatRange(item.start_date, item.end_date)}`}
                </Text>
              </LinearGradient>
            </View>
          </Pressable>
        )}
      />
      {/* underlined artist-name tabs marking the active slide */}
      <View
        style={{
          flexDirection: 'row',
          gap: space.l,
          paddingHorizontal: space.screenX,
          paddingVertical: space.m,
          flexWrap: 'wrap',
        }}
      >
        {featured.map((e, i) => (
          <Pressable
            key={e.id}
            onPress={() => listRef.current?.scrollToIndex({ index: i, animated: true })}
            hitSlop={8}
          >
            <View
              style={{
                paddingBottom: 4,
                borderBottomWidth: 1,
                borderBottomColor: i === active ? colors.accent : 'transparent',
              }}
            >
              <Text
                style={[
                  type.caps,
                  { fontSize: 10, letterSpacing: 1.8, color: i === active ? colors.ink : colors.grey },
                ]}
              >
                {e.artists.toUpperCase()}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      <Hairline />
    </View>
  );
}

// ---------- spec table ----------

export function SpecTable({ e }: { e: Exhibition }) {
  const rows: [string, string][] = [
    ['VENUE', e.venue?.name.toUpperCase() ?? '—'],
    ['TYPE', (e.venue?.type ?? 'gallery').toUpperCase()],
    ['DATES', formatRange(e.start_date, e.end_date)],
  ];
  if (e.opening_datetime) rows.push(['OPENING', formatOpening(e.opening_datetime)]);

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.hairline }}>
      {rows.map(([label, value]) => (
        <View
          key={label}
          style={{
            flexDirection: 'row',
            paddingVertical: 13,
            paddingHorizontal: space.screenX,
            borderBottomWidth: 1,
            borderBottomColor: colors.hairline,
          }}
        >
          <Mono style={{ width: 92 }}>{label}</Mono>
          <MonoInk style={{ flex: 1 }}>{value}</MonoInk>
        </View>
      ))}
    </View>
  );
}
