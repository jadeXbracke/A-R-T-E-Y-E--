// TEMPORARY — design exploration inspired by Maryse Ceha's resin paintings:
// a luminous field glowing out of a dark, glossy, layered surface. Four
// treatments of the Today screen for comparison only. Not wired into the
// app; delete once a direction is chosen.
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle, Defs, LinearGradient, RadialGradient, Rect, Stop,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, type } from '../src/theme';

interface Look {
  name: string;
  bg: string;
  inkDeep: string;
  ink: string;
  dim: string;
  hairline: string;
  arc: string;
  /** The luminous field behind everything — Ceha's glow. */
  field: [string, number] | null; // [colour, centre opacity]
  /** A resin-like sheen across the upper third. */
  gloss: boolean;
  /** A glow blooming inside the ring as the day fills. */
  bloom: [string, number] | null;
}

const LOOKS: Look[] = [
  {
    name: 'DEEP FIELD',
    bg: '#0D0C0B',
    inkDeep: '#FFFFFF',
    ink: '#E9E6E0',
    dim: '#6E6960',
    hairline: '#282521',
    arc: '#FFFFFF',
    field: ['#FFFFFF', 0.13],
    gloss: true,
    bloom: null,
  },
  {
    name: 'CRIMSON',
    bg: '#FFFFFF',
    inkDeep: '#050504',
    ink: '#1B1A17',
    dim: '#98938A',
    hairline: '#E4E1DB',
    arc: '#A81046',
    field: null,
    gloss: false,
    bloom: ['#C4185A', 0.5],
  },
  {
    name: 'EMERALD',
    bg: '#08100E',
    inkDeep: '#F2F5F3',
    ink: '#DCE5E1',
    dim: '#5C7169',
    hairline: '#17302A',
    arc: '#4FD6AE',
    field: ['#0E6B57', 0.62],
    gloss: true,
    bloom: null,
  },
  {
    name: 'LACQUER',
    bg: '#F2F0EC',
    inkDeep: '#050504',
    ink: '#1B1A17',
    dim: '#98938A',
    hairline: '#D9D5CE',
    arc: '#1B1A17',
    field: ['#000000', 0.05],
    gloss: true,
    bloom: ['#1B1A17', 0.07],
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

function DayRing({ look }: { look: Look }) {
  const r = RING / 2 - 2;
  const circumference = 2 * Math.PI * r;
  const fraction = DONE / TOTAL;

  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING} height={RING} style={{ position: 'absolute' }}>
        <Defs>
          {look.bloom ? (
            <RadialGradient id="bloom" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={look.bloom[0]} stopOpacity={look.bloom[1]} />
              <Stop offset="0.55" stopColor={look.bloom[0]} stopOpacity={look.bloom[1] * 0.35} />
              <Stop offset="1" stopColor={look.bloom[0]} stopOpacity="0" />
            </RadialGradient>
          ) : null}
        </Defs>
        {/* the day's fill blooms outward from the centre, not as a bar */}
        {look.bloom ? (
          <Circle cx={RING / 2} cy={RING / 2} r={r * Math.sqrt(fraction)} fill="url(#bloom)" />
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
  const params = useLocalSearchParams<{ v?: string }>();
  const index = Math.max(0, Math.min(parseInt(params.v ?? '0', 10) || 0, LOOKS.length - 1));
  const look = LOOKS[index];
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: look.bg }}>
      {/* the luminous field: light rising out of a dark, layered ground */}
      {look.field ? (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="field" cx="50%" cy="34%" r="72%">
              <Stop offset="0" stopColor={look.field[0]} stopOpacity={look.field[1]} />
              <Stop offset="0.5" stopColor={look.field[0]} stopOpacity={look.field[1] * 0.42} />
              <Stop offset="1" stopColor={look.field[0]} stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.10" />
              <Stop offset="0.16" stopColor="#FFFFFF" stopOpacity="0.03" />
              <Stop offset="0.28" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#field)" />
          {look.gloss ? <Rect x="0" y="0" width="100%" height="100%" fill="url(#gloss)" /> : null}
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
          <DayRing look={look} />
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
