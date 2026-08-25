// TEMPORARY — design exploration inspired by Maryse Ceha's resin paintings:
// a luminous field glowing out of a dark, glossy, layered surface. Four
// treatments of the Today screen for comparison only. Not wired into the
// app; delete once a direction is chosen.
//
// The field is alive: two or three soft lobes drift and breathe on their own
// slow, mismatched cycles, so the light never settles into a pattern the eye
// can catch. Motion is ambient, never signal — it says nothing about your
// habits, and it stops entirely when the system asks for reduced motion.
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, Animated, Easing, StyleSheet, Text, View,
} from 'react-native';
import Svg, {
  Circle, Defs, LinearGradient, RadialGradient, Rect, Stop,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, type } from '../src/theme';

interface Lobe {
  colour: string;
  opacity: number;
  /** Diameter as a share of screen width. */
  size: number;
  /** Drift range in points, as [from, to] on each axis. */
  x: [number, number];
  y: [number, number];
  /** A full breath, in ms. Deliberately prime-ish so lobes never sync up. */
  duration: number;
}

interface Look {
  name: string;
  bg: string;
  inkDeep: string;
  ink: string;
  dim: string;
  hairline: string;
  arc: string;
  aura: Lobe[];
  /** A resin-like sheen across the upper edge. */
  gloss: boolean;
  /** A glow blooming inside the ring as the day fills. */
  bloom: [string, number] | null;
}

const LOOKS: Look[] = [
  {
    // Cold light rising out of blue-black — the top edge of the crimson
    // painting, where the resin goes almost to ink.
    name: 'DEEP FIELD',
    bg: '#08090C',
    inkDeep: '#FFFFFF',
    ink: '#E4E8EE',
    dim: '#666E7A',
    hairline: '#1E2229',
    arc: '#FFFFFF',
    aura: [
      { colour: '#8FA8D8', opacity: 0.20, size: 1.5, x: [-70, 60], y: [-40, 70], duration: 17000 },
      { colour: '#6E5AA8', opacity: 0.16, size: 1.2, x: [80, -50], y: [120, 10], duration: 23000 },
      { colour: '#DCE6F5', opacity: 0.08, size: 0.9, x: [-30, 90], y: [220, 150], duration: 29000 },
    ],
    gloss: true,
    bloom: null,
  },
  {
    // One deep hue, the way each painting commits to one: magenta at the
    // core cooling to violet at the rim.
    name: 'CRIMSON',
    bg: '#FBFAFC',
    inkDeep: '#050508',
    ink: '#1A1820',
    dim: '#918D9C',
    hairline: '#E4E1E8',
    arc: '#A30F52',
    aura: [
      { colour: '#C4185A', opacity: 0.13, size: 1.3, x: [-60, 70], y: [-30, 60], duration: 19000 },
      { colour: '#5B2A8C', opacity: 0.10, size: 1.1, x: [90, -40], y: [140, 40], duration: 26000 },
    ],
    gloss: false,
    bloom: ['#C4185A', 0.5],
  },
  {
    // The green diptych: cold teal light through a dark, mineral ground.
    name: 'EMERALD',
    bg: '#050D0E',
    inkDeep: '#EFF6F5',
    ink: '#D3E3E0',
    dim: '#54706C',
    hairline: '#12292B',
    arc: '#3FD9C0',
    aura: [
      { colour: '#0C6E67', opacity: 0.55, size: 1.5, x: [-70, 50], y: [-40, 60], duration: 18000 },
      { colour: '#1FA894', opacity: 0.22, size: 1.1, x: [70, -60], y: [130, 30], duration: 25000 },
      { colour: '#8FE8DC', opacity: 0.07, size: 0.8, x: [-20, 80], y: [230, 160], duration: 31000 },
    ],
    gloss: true,
    bloom: null,
  },
  {
    // Cool paper under lacquer: barely there, felt more than seen.
    name: 'LACQUER',
    bg: '#EEF0F3',
    inkDeep: '#050608',
    ink: '#1A1C20',
    dim: '#8E939B',
    hairline: '#D6D9DE',
    arc: '#1A1C20',
    aura: [
      { colour: '#3C4658', opacity: 0.10, size: 1.4, x: [-60, 60], y: [-30, 70], duration: 21000 },
      { colour: '#7E8CA8', opacity: 0.09, size: 1.0, x: [80, -50], y: [150, 50], duration: 28000 },
    ],
    gloss: true,
    bloom: ['#1A1C20', 0.07],
  },
];

const PILLARS: Array<{ name: string; habits: Array<[string, boolean]> }> = [
  { name: 'Health', habits: [['Walk', true], ['Training', true]] },
  { name: 'Mind', habits: [['Meditate', true]] },
  { name: 'Reading & learning', habits: [['Read 20 minutes', false]] },
  { name: 'Work & skill', habits: [['Deep work block', false]] },
];

const DONE = 3;
const TOTAL = 5;
const RING = 186;
const SCREEN_W = 390;

/** One drifting, breathing lobe of the aura. */
function AuraLobe({ lobe, id, still }: { lobe: Lobe; id: string; still: boolean }) {
  const drift = useRef(new Animated.Value(0)).current;
  const diameter = SCREEN_W * lobe.size;

  useEffect(() => {
    if (still) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: lobe.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: lobe.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, lobe.duration, still]);

  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: lobe.x });
  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: lobe.y });
  // A shallow swell, so the field feels like it is breathing rather than
  // sliding around the screen.
  const scale = drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.12, 1] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: (SCREEN_W - diameter) / 2,
        top: -diameter * 0.15,
        width: diameter,
        height: diameter,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    >
      <Svg width={diameter} height={diameter}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={lobe.colour} stopOpacity={lobe.opacity} />
            <Stop offset="0.45" stopColor={lobe.colour} stopOpacity={lobe.opacity * 0.42} />
            <Stop offset="1" stopColor={lobe.colour} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={diameter / 2} cy={diameter / 2} r={diameter / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

function DayRing({ look, index }: { look: Look; index: number }) {
  const r = RING / 2 - 2;
  const circumference = 2 * Math.PI * r;
  const fraction = DONE / TOTAL;

  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING} height={RING} style={{ position: 'absolute' }}>
        <Defs>
          {look.bloom ? (
            <RadialGradient id={`bloom-${index}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={look.bloom[0]} stopOpacity={look.bloom[1]} />
              <Stop offset="0.55" stopColor={look.bloom[0]} stopOpacity={look.bloom[1] * 0.35} />
              <Stop offset="1" stopColor={look.bloom[0]} stopOpacity="0" />
            </RadialGradient>
          ) : null}
        </Defs>
        {/* the day's fill blooms outward from the centre, not as a bar */}
        {look.bloom ? (
          <Circle
            cx={RING / 2} cy={RING / 2} r={r * Math.sqrt(fraction)}
            fill={`url(#bloom-${index})`}
          />
        ) : null}
        <Circle
          cx={RING / 2} cy={RING / 2} r={r}
          stroke={look.hairline} strokeWidth={1.5} fill="none"
        />
        <Circle
          cx={RING / 2} cy={RING / 2} r={r}
          stroke={look.arc} strokeWidth={1.75} fill="none" strokeLinecap="round"
          strokeDasharray={`${circumference * fraction} ${circumference}`}
          transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={[type.numeral, { color: look.inkDeep }]}>
          {DONE}<Text style={{ fontSize: 22, color: look.dim }}> / {TOTAL}</Text>
        </Text>
        <Text style={[type.label, { color: look.dim, marginTop: 2 }]}>marks today</Text>
      </View>
    </View>
  );
}

function MarkDot({ on, look }: { on: boolean; look: Look }) {
  return (
    <View
      style={{
        width: 28, height: 28, borderRadius: 14,
        borderWidth: 1.25, borderColor: on ? look.arc : look.ink,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {on ? (
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: look.arc }} />
      ) : null}
    </View>
  );
}

export default function CehaPreview() {
  const params = useLocalSearchParams<{ v?: string; still?: string }>();
  const index = Math.max(0, Math.min(parseInt(params.v ?? '0', 10) || 0, LOOKS.length - 1));
  const look = LOOKS[index];
  const insets = useSafeAreaInsets();

  // Ambient motion is the first thing to drop when someone asks for less of
  // it. `?still=1` freezes it for screenshots.
  const [reduceMotion, setReduceMotion] = useState(params.still === '1');
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(on => { if (on) setReduceMotion(true); })
      .catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: look.bg, overflow: 'hidden' }}>
      {look.aura.map((lobe, i) => (
        <AuraLobe key={i} lobe={lobe} id={`aura-${index}-${i}`} still={reduceMotion} />
      ))}

      {look.gloss ? (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id={`gloss-${index}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.09" />
              <Stop offset="0.14" stopColor="#FFFFFF" stopOpacity="0.025" />
              <Stop offset="0.26" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#gloss-${index})`} />
        </Svg>
      ) : null}

      <View style={{ flex: 1, paddingTop: insets.top + space.l, paddingHorizontal: space.page }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[type.wordmark, { color: look.inkDeep }]}>MARK</Text>
            <View
              style={{
                width: 5, height: 5, borderRadius: 5,
                backgroundColor: look.inkDeep, marginLeft: 3, marginTop: 3,
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[type.label, { color: look.dim }]}>More</Text>
            <View
              style={{
                width: 18, height: 18, borderRadius: 9,
                borderWidth: 1.25, borderColor: look.ink,
              }}
            />
          </View>
        </View>

        <Text style={[type.heading, { color: look.inkDeep, marginTop: space.xl }]}>Today</Text>
        <Text style={[type.small, { color: look.dim, marginTop: space.xs }]}>Tuesday 25 August</Text>

        <View style={{ alignItems: 'center', marginVertical: space.xl }}>
          <DayRing look={look} index={index} />
        </View>

        {PILLARS.map(pillar => (
          <View key={pillar.name} style={{ marginBottom: space.l }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[type.label, { color: look.ink }]}>{pillar.name}</Text>
              <Text style={[type.label, { color: look.dim }]}>
                {pillar.habits.filter(h => h[1]).length} / {pillar.habits.length}
              </Text>
            </View>
            {pillar.habits.map(([name, on]) => (
              <View
                key={name}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: look.hairline,
                }}
              >
                <Text style={[type.item, { color: look.ink }]}>{name}</Text>
                <MarkDot on={on} look={look} />
              </View>
            ))}
          </View>
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          borderTopWidth: 1, borderTopColor: look.hairline,
          paddingBottom: insets.bottom + 8, paddingTop: 12,
        }}
      >
        {['TODAY', 'GROWTH', 'BODY', 'MIND'].map((t, i) => (
          <View key={t} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
            <Text style={[type.label, { fontSize: 9, color: i === 0 ? look.inkDeep : look.dim }]}>{t}</Text>
            <View
              style={{
                width: 4, height: 4, borderRadius: 2,
                backgroundColor: i === 0 ? look.inkDeep : 'transparent',
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
