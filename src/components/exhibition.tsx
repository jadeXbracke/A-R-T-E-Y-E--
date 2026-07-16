import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { dateRange, isUpcoming, openingLabel } from '@/lib/dates';
import { Exhibition, Venue } from '@/lib/types';
import { color, fill, space, type } from '@/theme';
import { ArtImage, ArtistCaps, HairRule, MonoText, SeenDot, UnderlineLink } from './ui';

export interface AgendaItem {
  exhibition: Exhibition;
  venue?: Venue;
  seen: boolean;
}

/** List row: thumbnail (with red seen-dot) + mono date + italic title + caps artist + mono venue */
export function ExhibitionListRow({ item }: { item: AgendaItem }) {
  const router = useRouter();
  const { exhibition: e, venue, seen } = item;
  return (
    <Pressable
      onPress={() => router.push(`/exhibition/${e.id}`)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View>
        <ArtImage uri={e.image_url} toneKey={e.id} style={styles.thumb} />
        {seen && <SeenDot style={styles.thumbDot} />}
      </View>
      <View style={{ flex: 1 }}>
        <MonoText>
          {dateRange(e.start_date, e.end_date)}
          {isUpcoming(e) && e.opening_datetime ? (
            <Text style={{ color: color.red }}>{`   OPENS ${openingLabel(e.opening_datetime)}`}</Text>
          ) : null}
        </MonoText>
        <Text style={[type.titleSerif, { marginTop: 4 }]} numberOfLines={2}>
          {e.title}
        </Text>
        <ArtistCaps style={{ marginTop: 5 }}>{e.artists}</ArtistCaps>
        {venue && <MonoText style={{ marginTop: 4 }}>{venue.name.toUpperCase()}</MonoText>}
      </View>
    </Pressable>
  );
}

/** Grid cell for the 2-column view: image with caption beneath */
export function ExhibitionGridItem({ item, width }: { item: AgendaItem; width: number }) {
  const router = useRouter();
  const { exhibition: e, venue, seen } = item;
  return (
    <Pressable
      onPress={() => router.push(`/exhibition/${e.id}`)}
      style={({ pressed }) => [{ width }, pressed && { opacity: 0.7 }]}
    >
      <View>
        <ArtImage uri={e.image_url} toneKey={e.id} style={{ width, height: width * 1.2 }} />
        {seen && <SeenDot style={styles.thumbDot} />}
      </View>
      <Text style={[type.titleSerif, { fontSize: 17, lineHeight: 21, marginTop: 8 }]} numberOfLines={1}>
        {e.title}
      </Text>
      <ArtistCaps style={{ fontSize: 9, marginTop: 3 }} >{e.artists}</ArtistCaps>
      {venue && (
        <MonoText style={{ fontSize: 9, marginTop: 3 }} >
          {venue.name.toUpperCase()} · {dateRange(e.start_date, e.end_date)}
        </MonoText>
      )}
    </Pressable>
  );
}

const SCREEN_W = Dimensions.get('window').width;
const HERO_H = Math.round(SCREEN_W * 1.15);

/**
 * Curator's picks — full-bleed swipeable carousel. Artist in letterspaced
 * caps over the image, title in large italic serif, mono venue/date line,
 * and underlined artist-name tabs beneath indicating the active slide.
 */
export function HeroCarousel({ items }: { items: AgendaItem[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<AgendaItem>>(null);
  if (items.length === 0) return null;

  return (
    <View>
      <FlatList
        ref={listRef}
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(it) => it.exhibition.id}
        onMomentumScrollEnd={(ev) =>
          setIndex(Math.round(ev.nativeEvent.contentOffset.x / SCREEN_W))
        }
        renderItem={({ item }) => {
          const { exhibition: e, venue } = item;
          return (
            <Pressable
              onPress={() => router.push(`/exhibition/${e.id}`)}
              style={{ width: SCREEN_W, height: HERO_H }}
            >
              <ArtImage uri={e.image_url} toneKey={e.id} style={fill} />
              <View style={styles.heroScrim} />
              <View style={styles.heroText}>
                <ArtistCaps style={{ color: color.white }}>{e.artists}</ArtistCaps>
                <Text style={[type.heroTitle, { marginTop: 8 }]}>{e.title}</Text>
                {venue && (
                  <MonoText style={{ color: 'rgba(255,255,255,0.85)', marginTop: 10 }}>
                    {venue.name.toUpperCase()} · {dateRange(e.start_date, e.end_date)}
                  </MonoText>
                )}
              </View>
            </Pressable>
          );
        }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.heroTabs}
      >
        {items.map((it, i) => (
          <UnderlineLink
            key={it.exhibition.id}
            label={it.exhibition.artists}
            active={i === index}
            onPress={() => {
              setIndex(i);
              listRef.current?.scrollToOffset({ offset: i * SCREEN_W, animated: true });
            }}
          />
        ))}
      </ScrollView>
      <HairRule />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.m,
    paddingVertical: space.m,
    alignItems: 'flex-start',
  },
  thumb: { width: 84, height: 104 },
  thumbDot: { position: 'absolute', top: 8, right: 8 },
  heroScrim: {
    ...fill,
    backgroundColor: 'rgba(19,18,17,0.30)',
  },
  heroText: {
    position: 'absolute',
    left: space.gutter,
    right: space.gutter,
    bottom: space.l,
  },
  heroTabs: {
    gap: 20,
    paddingHorizontal: space.gutter,
    paddingVertical: 14,
  },
});
