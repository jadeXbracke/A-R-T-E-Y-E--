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
            <View>
              <LiveArt
                videoUrl={e.video_url}
                uri={e.image_url}
                fallbackId={e.id}
                active={i === active}
                style={{ width, backgroundColor: colors.hairline }}
                aspectRatio={4 / 5}
              />
              <View style={styles.overlay}>
                <Text style={styles.overlayArtist}>{e.artists.toUpperCase()}</Text>
                <Text style={styles.overlayTitle}>{e.title}</Text>
              </View>
            </View>
            <Text style={styles.metaLine}>
              {e.venue?.name.toUpperCase()} · {fmtRange(e.start_date, e.end_date)}
            </Text>
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
                { backgroundColor: i === active ? colors.red : colors.hairline },
              ]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrim,
    paddingHorizontal: space.l,
  },
  overlayArtist: {
    ...type.artistCapsLarge,
    textAlign: 'center',
    marginBottom: space.s,
  },
  overlayTitle: {
    ...type.serifHero,
    fontSize: 38,
    lineHeight: 44,
    textAlign: 'center',
  },
  metaLine: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.grey,
    paddingHorizontal: space.page,
    paddingTop: space.m,
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
    color: colors.grey,
    textTransform: 'uppercase',
    paddingBottom: 5,
  },
  tabRule: { height: 2 },
});
