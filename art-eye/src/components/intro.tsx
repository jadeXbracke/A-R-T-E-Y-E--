import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fonts } from '../theme';

/**
 * Cosmos-style launch sequence. Six ink dots pop up one by one into a ring,
 * the ring spins and draws itself into the centre, and as the dots dissolve
 * the ARTEYE letters drift apart into the wordmark's wide tracking. Then the
 * white sheet lifts and `Reveal` blocks below stagger in, so the home screen
 * appears to assemble itself. Runs once per app launch.
 */

// ── Launch coordination ─────────────────────────────────────────────────────
// Reveal blocks anywhere in the tree hold their entrance until the overlay
// starts lifting, so content never animates unseen behind the white sheet.
let introFinished = false;
let resolveIntro: () => void = () => {};
const introDone = new Promise<void>((resolve) => {
  resolveIntro = resolve;
});

function markIntroDone() {
  introFinished = true;
  resolveIntro();
}

function whenIntroDone(): Promise<void> {
  if (introFinished) return Promise.resolve();
  // Safety valve: if the overlay somehow never mounts, content still appears.
  return Promise.race([
    introDone,
    new Promise<void>((resolve) => setTimeout(resolve, 6000)),
  ]);
}

function prefersReducedMotion(): Promise<boolean> {
  try {
    return Promise.resolve(AccessibilityInfo.isReduceMotionEnabled()).catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}

// ── The overlay ─────────────────────────────────────────────────────────────

const LETTERS = ['A', 'R', 'T', 'E', 'Y', 'E'];
const LETTER_SIZE = 26;
const TRACK = LETTER_SIZE * 0.55; // matches the Wordmark's letterSpacing ratio
const CENTER = (LETTERS.length - 1) / 2;

// The dot ring: six ink circles — one per letter — orbiting before the
// wordmark takes their place.
const DOTS = 6;
const DOT_SIZE = 18;
const RING_RADIUS = 40;
const STAGE = (RING_RADIUS + DOT_SIZE) * 2;

export function IntroOverlay() {
  const [visible, setVisible] = useState(true);
  const [lifting, setLifting] = useState(false);
  const dots = useRef(Array.from({ length: DOTS }, () => new Animated.Value(0))).current;
  const spin = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringFade = useRef(new Animated.Value(1)).current;
  const letters = useRef(LETTERS.map(() => new Animated.Value(0))).current;
  const sheet = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    prefersReducedMotion().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        markIntroDone();
        setVisible(false);
        return;
      }
      Animated.sequence([
        // 1 — the dots pop up one by one into a ring
        Animated.stagger(
          80,
          dots.map((v) =>
            Animated.timing(v, {
              toValue: 1,
              duration: 340,
              easing: Easing.out(Easing.back(1.8)),
              useNativeDriver: true,
            })
          )
        ),
        // 2 — the ring spins, then draws itself into the centre and dissolves
        Animated.parallel([
          Animated.timing(spin, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(450),
            Animated.timing(ringScale, {
              toValue: 0.08,
              duration: 550,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(760),
            Animated.timing(ringFade, {
              toValue: 0,
              duration: 240,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // 3 — the letters drift apart into the wordmark where the dots were
        Animated.stagger(
          95,
          letters.map((v) =>
            Animated.timing(v, {
              toValue: 1,
              duration: 800,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            })
          )
        ),
        Animated.delay(350),
      ]).start(() => {
        if (cancelled) return;
        setLifting(true);
        markIntroDone();
        Animated.timing(sheet, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }).start(() => {
          if (!cancelled) setVisible(false);
        });
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents={lifting ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFillObject, styles.sheet, { opacity: sheet }]}
    >
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.ring,
            {
              opacity: ringFade,
              transform: [
                { scale: ringScale },
                {
                  rotate: spin.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '300deg'],
                  }),
                },
              ],
            },
          ]}
        >
          {dots.map((v, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity: v,
                  transform: [
                    { rotate: `${(i / DOTS) * 360}deg` },
                    { translateY: -RING_RADIUS },
                    { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>
        <View style={styles.row} accessibilityRole="header" accessibilityLabel="ARTEYE">
          {LETTERS.map((ch, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.letter,
                {
                  opacity: letters[i],
                  transform: [
                    {
                      // Each glyph drifts from a cluster at the centre out to
                      // its resting wide-tracked position.
                      translateX: letters[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-(i - CENTER) * TRACK * 0.9, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {ch}
            </Animated.Text>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// ── Staggered entrance blocks ───────────────────────────────────────────────

/**
 * Fades and rises its children into place once the intro sheet starts
 * lifting. Give successive blocks increasing `delay`s for the assembling
 * Cosmos feel. Cheap after launch: once the intro has run, blocks mounted
 * later (fresh data, other screens) still ease in from their delay alone.
 */
export function Reveal({
  delay = 0,
  style,
  children,
}: {
  delay?: number;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let alive = true;
    Promise.all([whenIntroDone(), prefersReducedMotion()]).then(([, reduce]) => {
      if (!alive) return;
      if (reduce) {
        t.setValue(1);
        return;
      }
      Animated.timing(t, {
        toValue: 1,
        duration: 750,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  stage: {
    width: STAGE,
    height: STAGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: StyleSheet.absoluteFillObject,
  dot: {
    position: 'absolute',
    left: STAGE / 2 - DOT_SIZE / 2,
    top: STAGE / 2 - DOT_SIZE / 2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.ink,
  },
  row: { flexDirection: 'row' },
  letter: {
    fontFamily: fonts.sansThin,
    fontSize: LETTER_SIZE,
    color: colors.ink,
    marginRight: TRACK,
  },
});
