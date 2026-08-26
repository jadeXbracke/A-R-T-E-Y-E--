// True progress rings for the dashboard — hairline track, thin ink arc,
// round caps, starting at 12 o'clock. Monochrome by design: rings are told
// apart by radius and by their labels, never by colour.
import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../lib/theme-context';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function Ring({ size, radius, fraction, stroke, track, width }: {
  size: number;
  radius: number;
  fraction: number;
  stroke: string;
  track: string;
  width: number;
}) {
  const circumference = 2 * Math.PI * radius;
  const target = Math.max(0, Math.min(1, fraction));
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: target,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [target, anim]);

  const dashOffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <Svg
      width={size}
      height={size}
      style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
    >
      <Circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={track} strokeWidth={width} fill="none"
      />
      <AnimatedCircle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={stroke} strokeWidth={width} fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
      />
    </Svg>
  );
}

/** Three concentric rings (outer→inner) with free content in the centre. */
export function ConcentricRings({ fractions, size = 216, children }: {
  fractions: [number, number, number];
  size?: number;
  children?: React.ReactNode;
}) {
  const { palette } = useTheme();
  const width = 3;
  const gap = 11;
  const outer = size / 2 - width;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {fractions.map((f, i) => (
        <Ring
          key={i}
          size={size}
          radius={outer - i * gap}
          fraction={f}
          stroke={palette.ink}
          track={palette.hairline}
          width={width}
        />
      ))}
      {children}
    </View>
  );
}

/** A single small ring with content (e.g. a percentage) in the centre. */
export function MiniRing({ fraction, size = 64, children }: {
  fraction: number;
  size?: number;
  children?: React.ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Ring
        size={size}
        radius={size / 2 - 2}
        fraction={fraction}
        stroke={palette.ink}
        track={palette.hairline}
        width={2.5}
      />
      {children}
    </View>
  );
}
