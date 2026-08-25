// TEMPORARY — design exploration after Maryse Ceha. Not wired into the app;
// delete once a direction is chosen.
//
// The first attempt got this wrong: it read her paintings as *light* and
// produced soft floating gradients, which is the house style of every AI
// mockup on earth. Her work is not light, it is MATERIAL — poured resin with
// real grit in it, a hard edge, a slab thick enough to throw a shadow, and
// the gallery ceiling reflected in the gloss. The white wall around it is
// half the picture.
//
// So: no gradients as the subject. A vessel of deep pigment with a hard pour
// line for the day's progress, actual grain over it, a crisp reflection band,
// and a real shadow against generous white.
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GRAIN_URI } from '../src/components/grain';
import { space, type } from '../src/theme';

interface Look {
  name: string;
  /** The gallery wall. */
  ground: string;
  inkDeep: string;
  ink: string;
  dim: string;
  hairline: string;
  /** Unpoured resin: the dark the pigment sits in. */
  vessel: string;
  /** The poured colour itself. */
  pigment: string;
  /** The ceiling caught in the gloss. */
  reflection: string;
  /** Ink for anything sitting on the object. */
  onObject: string;
  shape: 'disc' | 'panel';
  grain: number;
}

const LOOKS: Look[] = [
  {
    name: 'POUR',
    ground: '#FFFFFF',
    inkDeep: '#050504',
    ink: '#1B1A17',
    dim: '#98938A',
    hairline: '#E4E1DB',
    vessel: '#1A1024',
    pigment: '#A2114E',
    reflection: '#3B2A55',
    onObject: '#F6EEF2',
    shape: 'disc',
    grain: 0.16,
  },
  {
    name: 'PANEL',
    ground: '#FFFFFF',
    inkDeep: '#050504',
    ink: '#1B1A17',
    dim: '#98938A',
    hairline: '#E4E1DB',
    vessel: '#08211E',
    pigment: '#11564A',
    reflection: '#2E6B60',
    onObject: '#E6F0ED',
    shape: 'panel',
    grain: 0.2,
  },
  {
    name: 'INK',
    ground: '#FFFFFF',
    inkDeep: '#050504',
    ink: '#1B1A17',
    dim: '#98938A',
    hairline: '#E4E1DB',
    vessel: '#131211',
    pigment: '#2E2C29',
    reflection: '#4A4744',
    onObject: '#F2F0EC',
    shape: 'disc',
    grain: 0.18,
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
const FRACTION = DONE / TOTAL;

/**
 * The object on the wall: deep resin filled to today's level, with a hard
 * pour line, real grit, the ceiling in its gloss, and a shadow proving it
 * stands off the surface.
 */
function Vessel({ look, size }: { look: Look; size: { width: number; height: number } }) {
  const disc = look.shape === 'disc';
  return (
    <View
      style={{
        ...size,
        borderRadius: disc ? size.width / 2 : 0,
        backgroundColor: look.vessel,
        overflow: 'hidden',
        // the slab stands off the wall
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 22,
        elevation: 10,
      }}
    >
      {/* the pour: a hard, level line, not a fade */}
      <View
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          height: `${FRACTION * 100}%`,
          backgroundColor: look.pigment,
        }}
      />
      {/* the ceiling caught in the gloss, with its own crisp lower edge */}
      <View
        style={{
          position: 'absolute', left: 0, right: 0, top: 0,
          height: '13%',
          backgroundColor: look.reflection,
          opacity: 0.3,
        }}
      />
      {/* grit in the resin */}
      <Image
        source={{ uri: GRAIN_URI }}
        resizeMode="repeat"
        style={[StyleSheet.absoluteFill, { opacity: look.grain }]}
      />
    </View>
  );
}

export default function CehaPreview() {
  const params = useLocalSearchParams<{ v?: string }>();
  const index = Math.max(0, Math.min(parseInt(params.v ?? '0', 10) || 0, LOOKS.length - 1));
  const look = LOOKS[index];
  const insets = useSafeAreaInsets();
  const size = look.shape === 'disc'
    ? { width: 206, height: 206 }
    : { width: 250, height: 190 };

  return (
    <View style={{ flex: 1, backgroundColor: look.ground }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + space.l,
          paddingHorizontal: space.page,
          paddingBottom: space.xl,
        }}
      >
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

        {/* generous wall around the object */}
        <View style={{ alignItems: 'center', marginTop: space.xxl, marginBottom: space.xl }}>
          <Vessel look={look} size={size} />
          <Text style={[type.numeral, { color: look.inkDeep, marginTop: space.l }]}>
            {DONE}<Text style={{ fontSize: 22, color: look.dim }}> / {TOTAL}</Text>
          </Text>
          <Text style={[type.label, { color: look.dim, marginTop: 2 }]}>marks today</Text>
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
                {/* the mark itself: a small poured disc, same material logic */}
                <View
                  style={{
                    width: 28, height: 28, borderRadius: 14,
                    borderWidth: 1.25, borderColor: look.ink,
                    alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {on ? (
                    <View
                      style={{
                        width: 20, height: 20, borderRadius: 10,
                        backgroundColor: look.pigment, overflow: 'hidden',
                      }}
                    >
                      <Image
                        source={{ uri: GRAIN_URI }}
                        resizeMode="repeat"
                        style={[StyleSheet.absoluteFill, { opacity: look.grain * 0.7 }]}
                      />
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

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
