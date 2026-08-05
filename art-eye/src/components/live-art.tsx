import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, View, ViewStyle } from 'react-native';
import { ArtImage } from './exhibition';

/** Deterministic per-item drift direction so a row of covers doesn't move in
 *  lockstep — hashed from the id, never random (stable across renders). */
function driftFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const dx = (h % 3) - 1; // -1 | 0 | 1
  const dy = ((h >> 2) % 3) - 1;
  return { dx: dx === 0 ? 1 : dx, dy };
}

/**
 * Ken Burns wrapper: a very slow zoom-and-drift loop over whatever it wraps.
 * This is how the app gets a cinematic, moving background from still editorial
 * photography — no video assets required.
 */
export function KenBurns({
  id,
  active = true,
  style,
  children,
}: {
  id: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 18000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 18000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, progress]);

  const { dx, dy } = driftFor(id);
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dx * 9] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dy * 6] });

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <Animated.View style={{ width: '100%', height: '100%', transform: [{ scale }, { translateX }, { translateY }] }}>
        {children}
      </Animated.View>
    </View>
  );
}

/** Muted, looping, chrome-less video — a moving background, not a player. */
function VideoBackdrop({ url, style }: { url: string; style?: StyleProp<ViewStyle> }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={style as never}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

/**
 * The moving-cover chain: a venue- or exhibition-supplied video clip when one
 * exists, otherwise the editorial image with slow Ken Burns motion. `active`
 * gates the motion (and the video mount) so off-screen carousel slides stay
 * still and only one clip plays at a time.
 */
export function LiveArt({
  videoUrl,
  uri,
  venueUri,
  fallbackId,
  active = true,
  style,
  aspectRatio,
  onImageError,
}: {
  videoUrl?: string | null;
  uri?: string | null;
  venueUri?: string | null;
  fallbackId: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  aspectRatio?: number;
  onImageError?: () => void;
}) {
  const frame: StyleProp<ViewStyle> = [style, aspectRatio ? { aspectRatio } : null];
  if (videoUrl && active) {
    return (
      <View style={[frame, { overflow: 'hidden' }]}>
        <VideoBackdrop url={videoUrl} style={{ width: '100%', height: '100%' }} />
      </View>
    );
  }
  return (
    <KenBurns id={fallbackId} active={active} style={frame}>
      <ArtImage
        uri={uri}
        venueUri={venueUri}
        fallbackId={fallbackId}
        onAllFailed={onImageError}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
      />
    </KenBurns>
  );
}
