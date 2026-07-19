import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { imageSource } from '../data/placeholders';
import { dateRange } from '../lib/format';
import { color, font, space } from '../theme';
import type { Exhibition } from '../types';
import { Caps, HeadingL, Mono, MonoLabel } from './Type';

/**
 * "Curator's picks" — full-bleed swipeable carousel. Artist in letterspaced
 * caps over the image, exhibition title in large italic serif beneath, mono
 * venue/date line, and underlined artist-name tabs marking the active slide.
 */
export function HeroCarousel({
  exhibitions,
  kicker = 'CURATOR’S PICKS',
  onPress,
}: {
  exhibitions: Exhibition[];
  kicker?: string;
  onPress: (e: Exhibition) => void;
}) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  if (exhibitions.length === 0) return null;

  const onScroll = (ev: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(ev.nativeEvent.contentOffset.x / width);
    if (i !== index && i >= 0 && i < exhibitions.length) setIndex(i);
  };

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  return (
    <View style={styles.wrap}>
      <MonoLabel style={styles.kicker}>{kicker}</MonoLabel>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ width }}
      >
        {exhibitions.map((e) => (
          <Pressable key={e.id} onPress={() => onPress(e)} style={{ width }}>
            <View>
              <Image
                source={imageSource(e.image_url)}
                style={{ width, height: width * 1.05, backgroundColor: color.hairline }}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.overlay}>
                <Caps style={styles.overlayArtist}>{e.artists.toUpperCase()}</Caps>
              </View>
            </View>
            <View style={styles.slideText}>
              <HeadingL style={styles.title}>{e.title}</HeadingL>
              <Mono style={styles.venueLine}>
                {`${e.venue?.name.toUpperCase() ?? ''} · ${dateRange(e.start_date, e.end_date)}`}
              </Mono>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.tabs}>
        {exhibitions.map((e, i) => (
          <Pressable key={e.id} onPress={() => goTo(i)} hitSlop={8}>
            <View
              style={[
                styles.tab,
                { borderBottomColor: i === index ? color.red : 'transparent' },
              ]}
            >
              <Mono
                numberOfLines={1}
                style={{
                  fontFamily: i === index ? font.monoMedium : font.mono,
                  fontSize: 10,
                  letterSpacing: 1.2,
                  color: i === index ? color.ink : color.grey,
                }}
              >
                {shortArtist(e.artists).toUpperCase()}
              </Mono>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function shortArtist(artists: string): string {
  const first = artists.split(',')[0].trim();
  return first.length > 18 ? `${first.slice(0, 17)}…` : first;
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: color.paper,
  },
  kicker: {
    color: color.grey,
    paddingHorizontal: space.gutter,
    paddingBottom: space.m,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: space.xl,
    backgroundColor: color.overlayInk,
  },
  overlayArtist: {
    color: color.paperOnImage,
    fontSize: 14,
    letterSpacing: 3.5,
    textAlign: 'center',
    paddingHorizontal: space.gutter,
  },
  slideText: {
    paddingHorizontal: space.gutter,
    paddingTop: space.m,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  venueLine: {
    color: color.grey,
    marginTop: space.s,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: space.l,
    rowGap: space.s,
    flexWrap: 'wrap',
    marginTop: space.m,
    paddingHorizontal: space.gutter,
  },
  tab: {
    borderBottomWidth: 2,
    paddingBottom: 4,
  },
});
