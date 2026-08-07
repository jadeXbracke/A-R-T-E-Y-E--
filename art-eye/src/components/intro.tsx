import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fonts } from '../theme';

/**
 * Cosmos-style launch sequence on an ink sheet — a ring of white dots
 * performs a quiet opening beat on black, dissolves, and the white ARTEYE
 * letters drift apart into the wordmark's wide tracking. Then the dark
 * sheet lifts to the white app and `Reveal` blocks below stagger in, so
 * the home screen appears to assemble itself. Runs once per app launch.
 *
 * Five restrained takes on that one concept live here while the final one
 * is being chosen — set INTRO_VARIANT to lock it in:
 *   1 classic — dots pop into the ring, spin, and draw into the centre
 *   2 drift   — the ring breathes in together, turns slowly, softly fades
 *   3 gather  — dots glide in from wide to form the ring, then draw in
 *   4 pulse   — the ring gives one soft heartbeat while turning
 *   5 line    — the ring unfolds into a row of dots that becomes the letters
 * On web, `?intro=N` previews a variant without rebuilding.
 */
const INTRO_VARIANT = 1;

function activeVariant(): number {
  const search: string = (globalThis as any)?.location?.search ?? '';
  const m = search.match(/[?&]intro=([1-5])/);
  return m ? Number(m[1]) : INTRO_VARIANT;
}

// ── Launch coordination ─────────────────────────────────────────────────────
// Reveal blocks anywhere in the tree hold their entrance until the overlay
// starts lifting, so content never animates unseen behind the sheet.
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

const DOTS = 6;
const DOT_SIZE = 18;
const RING_RADIUS = 40;
const STAGE = (RING_RADIUS + DOT_SIZE) * 2;

// Variant 5 — each dot's resting spot on the ring, and its slot in the row
// it unfolds into (one slot per letter).
const RING_XY = Array.from({ length: DOTS }, (_, i) => {
  const a = (i / DOTS) * Math.PI * 2;
  return { x: Math.sin(a) * RING_RADIUS, y: -Math.cos(a) * RING_RADIUS };
});
const ROW_X = Array.from({ length: DOTS }, (_, i) => (i - CENTER) * 30);

export function IntroOverlay() {
  const [visible, setVisible] = useState(true);
  const [lifting, setLifting] = useState(false);
  const variant = useRef(activeVariant()).current;

  const dots = useRef(Array.from({ length: DOTS }, () => new Animated.Value(0))).current;
  const spin = useRef(new Animated.Value(0)).current;
  const morph = useRef(new Animated.Value(0)).current;
  const figureScale = useRef(new Animated.Value(1)).current;
  const figureFade = useRef(new Animated.Value(1)).current;
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

      const popIn = Animated.stagger(
        80,
        dots.map((v) =>
          Animated.timing(v, {
            toValue: 1,
            duration: 340,
            easing: Easing.out(Easing.back(1.8)),
            useNativeDriver: true,
          })
        )
      );

      const turn = (sweepMs: number) =>
        Animated.timing(spin, {
          toValue: 1,
          duration: sweepMs,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        });

      const drawIn = Animated.parallel([
        Animated.timing(figureScale, {
          toValue: 0.08,
          duration: 550,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(310),
          Animated.timing(figureFade, { toValue: 0, duration: 240, useNativeDriver: true }),
        ]),
      ]);

      const letterDrift = Animated.stagger(
        95,
        letters.map((v) =>
          Animated.timing(v, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        )
      );

      let figure: Animated.CompositeAnimation;
      let closing: Animated.CompositeAnimation = Animated.sequence([
        letterDrift,
        Animated.delay(350),
      ]);

      switch (variant) {
        case 2:
          // The ring breathes in together, turns slowly, and softly fades.
          figure = Animated.sequence([
            Animated.parallel(
              dots.map((v) =>
                Animated.timing(v, {
                  toValue: 1,
                  duration: 700,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                })
              )
            ),
            Animated.parallel([
              turn(1400),
              Animated.sequence([
                Animated.delay(850),
                Animated.parallel([
                  Animated.timing(figureScale, {
                    toValue: 0.6,
                    duration: 550,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                  }),
                  Animated.timing(figureFade, {
                    toValue: 0,
                    duration: 550,
                    useNativeDriver: true,
                  }),
                ]),
              ]),
            ]),
          ]);
          break;
        case 3:
          // Dots glide in from wide to form the ring, then draw in.
          figure = Animated.sequence([
            Animated.stagger(
              70,
              dots.map((v) =>
                Animated.timing(v, {
                  toValue: 1,
                  duration: 650,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: true,
                })
              )
            ),
            Animated.parallel([turn(850), Animated.sequence([Animated.delay(350), drawIn])]),
          ]);
          break;
        case 4:
          // The ring gives one soft heartbeat while turning, then draws in.
          figure = Animated.sequence([
            popIn,
            Animated.parallel([
              turn(1300),
              Animated.sequence([
                Animated.timing(figureScale, {
                  toValue: 1.16,
                  duration: 420,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                }),
                Animated.timing(figureScale, {
                  toValue: 1,
                  duration: 420,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                }),
              ]),
            ]),
            drawIn,
          ]);
          break;
        case 5:
          // The ring unfolds into a row of dots that becomes the letters.
          figure = Animated.sequence([
            popIn,
            Animated.delay(150),
            Animated.timing(morph, {
              toValue: 1,
              duration: 750,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.delay(120),
          ]);
          closing = Animated.sequence([
            Animated.parallel([
              Animated.timing(figureFade, { toValue: 0, duration: 320, useNativeDriver: true }),
              letterDrift,
            ]),
            Animated.delay(350),
          ]);
          break;
        default:
          // 1 — dots pop into the ring, spin, and draw into the centre.
          figure = Animated.sequence([
            popIn,
            Animated.parallel([turn(1000), Animated.sequence([Animated.delay(450), drawIn])]),
          ]);
      }

      Animated.sequence([figure, closing]).start(() => {
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
          style={[styles.figure, { opacity: figureFade, transform: [{ scale: figureScale }] }]}
        >
          {variant === 5 ? (
            // Cartesian dots so the ring can unfold into the letter row.
            dots.map((v, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    opacity: v,
                    transform: [
                      {
                        translateX: morph.interpolate({
                          inputRange: [0, 1],
                          outputRange: [RING_XY[i].x, ROW_X[i]],
                        }),
                      },
                      {
                        translateY: morph.interpolate({
                          inputRange: [0, 1],
                          outputRange: [RING_XY[i].y, 0],
                        }),
                      },
                      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.8] }) },
                    ],
                  },
                ]}
              />
            ))
          ) : (
            <Animated.View
              style={[
                styles.figure,
                {
                  transform: [
                    {
                      rotate: spin.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', variant === 2 ? '160deg' : '300deg'],
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
                        {
                          // Variant 3 glides in from wide; the rest sit on the ring.
                          translateY:
                            variant === 3
                              ? v.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-RING_RADIUS * 2.4, -RING_RADIUS],
                                })
                              : -RING_RADIUS,
                        },
                        { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
                      ],
                    },
                  ]}
                />
              ))}
            </Animated.View>
          )}
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
    backgroundColor: colors.ink,
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
  figure: StyleSheet.absoluteFillObject,
  dot: {
    position: 'absolute',
    left: STAGE / 2 - DOT_SIZE / 2,
    top: STAGE / 2 - DOT_SIZE / 2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.white,
  },
  row: { flexDirection: 'row' },
  letter: {
    fontFamily: fonts.sansThin,
    fontSize: LETTER_SIZE,
    color: colors.white,
    marginRight: TRACK,
  },
});
