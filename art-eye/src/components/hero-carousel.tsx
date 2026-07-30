import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { fmtRange } from '../lib/dates';
import { Exhibition } from '../lib/types';
import { colors, fonts, space, type } from '../theme';
import { LiveArt } from './live-art';
import { Kicker } from './ui';

/** Ocula-style Curator's picks carousel: full-bleed image, caps artist over
 *  the image, large italic title beneath it, mono venue/date line, and
 *  underlined artist-name tabs indicating the active slide. */
export function HeroCarousel({ exhibitions }: { exhibitions: Exhibition[] }) {
  const { width } = useWindowDimensions();
  const [active, setActive] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  if (!exhibitions.length) return null;

  const onScroll = (ev: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(ev.nativeEvent.contentOffset.x / width);
    if (i !== active && i >= 0 && i < exhibitions.length) setActive(i);
  };

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setActive(i);
  };

  return (
    <View>
      <Kicker style={{ paddingHorizontal: space.page, marginBottom: space.m }}>
        THE SYDNEY EDIT — CURATED WEEKLY
      </Kicker>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
      >
        {exhibitions.map((e, i) => (
          <Pressable
            key={e.id}
            style={{ width }}
            onPress={() => router.push(`/exhibition/${e.id}`)}
          >
            <View style={{ paddingHorizontal: space.page }}>
              <LiveArt
                videoUrl={e.video_url}
                uri={e.image_url}
                venueUri={e.venue?.image_url}
                fallbackId={e.id}
                active={i === active}
                style={{ width: width - space.page * 2, backgroundColor: colors.dim }}
                aspectRatio={4 / 3}
              />
            </View>
            <View style={styles.caption}>
              <Text style={styles.captionTitle}>{e.title}</Text>
              <Text style={styles.captionArtist}>{e.artists.toUpperCase()}</Text>
              <Text style={styles.metaLine}>
                {e.venue?.name.toUpperCase()} · {fmtRange(e.start_date, e.end_date)}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.tabs}>
        {exhibitions.map((e, i) => (
          <Pressable key={e.id} onPress={() => goTo(i)} style={styles.tab} hitSlop={8}>
            <Text
              numberOfLines={1}
              style={[styles.tabLabel, i === active && { color: colors.ink }]}
            >
              {e.artists}
            </Text>
            <View
              style={[
                styles.tabRule,
                { backgroundColor: i === active ? colors.ink : colors.dim },
              ]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    paddingHorizontal: space.page,
    paddingTop: space.l,
  },
  captionTitle: {
    ...type.serifHeading,
    fontSize: 21,
    lineHeight: 33,
    marginBottom: space.s,
  },
  captionArtist: {
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: 2.4,
    color: colors.ink,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  metaLine: {
    fontFamily: fonts.sansLight,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.grey,
  },
  tabs: {
    flexDirection: 'row',
    gap: space.m,
    paddingHorizontal: space.page,
    paddingTop: space.m,
  },
  tab: { flexShrink: 1 },
  tabLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.ink,
    textTransform: 'uppercase',
    paddingBottom: 5,
  },
  tabRule: { height: 2 },
});
