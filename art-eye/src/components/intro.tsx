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
 * Cosmos-style launch sequence built around the brand's circle motif. A
 * figure of ink dots performs an opening beat, dissolves, and the ARTEYE
 * letters drift apart into the wordmark's wide tracking. Then the sheet
 * lifts and `Reveal` blocks below stagger in, so the home screen appears
 * to assemble itself. Runs once per app launch.
 *
 * Five candidate openings live here while the final one is being chosen —
 * set INTRO_VARIANT to lock it in:
 *   1 ring   — dots pop into a ring, spin, and draw into the centre
 *   2 wave   — dots pop into a row, hop in sequence, dissolve into letters
 *   3 eye    — a pupil bursts into an iris of dots, spins, and collapses
 *   4 ripple — hairline circles ripple outward like a drop of water
 *   5 dark   — the ring opening on an ink sheet, Cosmos-style
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

// The dot figures: six ink circles — one per letter.
const DOTS = 6;
const DOT_SIZE = 18;
const RING_RADIUS = 40;
const RIPPLE_SIZE = 130;
const STAGE = RIPPLE_SIZE + 40;

export function IntroOverlay() {
  const [visible, setVisible] = useState(true);
  const [lifting, setLifting] = useState(false);
  const variant = useRef(activeVariant()).current;
  const dark = variant === 5;

  const dots = useRef(Array.from({ length: DOTS }, () => new Animated.Value(0))).current;
  const hops = useRef(Array.from({ length: DOTS }, () => new Animated.Value(0))).current;
  const ripples = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  const pupil = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
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

      const popIn = (values: Animated.Value[], stagger: number, duration: number) =>
        Animated.stagger(
          stagger,
          values.map((v) =>
            Animated.timing(v, {
              toValue: 1,
              duration,
              easing: Easing.out(Easing.back(1.8)),
              useNativeDriver: true,
            })
          )
        );

      const spinContractDissolve = Animated.parallel([
        Animated.timing(spin, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(450),
          Animated.timing(figureScale, {
            toValue: 0.08,
            duration: 550,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(760),
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
      let closing: Animated.CompositeAnimation = Animated.sequence([letterDrift, Animated.delay(350)]);

      switch (variant) {
        case 2:
          // A row of dots hops through a wave, then dissolves into the letters.
          figure = Animated.sequence([
            popIn(dots, 70, 300),
            Animated.stagger(
              85,
              hops.map((v) =>
                Animated.timing(v, {
                  toValue: 1,
                  duration: 380,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                })
              )
            ),
            Animated.delay(120),
          ]);
          closing = Animated.sequence([
            Animated.parallel([
              Animated.timing(figureFade, { toValue: 0, duration: 300, useNativeDriver: true }),
              letterDrift,
            ]),
            Animated.delay(350),
          ]);
          break;
        case 3:
          // A pupil appears, bursts into an iris of dots, spins and collapses.
          figure = Animated.sequence([
            Animated.timing(pupil, {
              toValue: 1,
              duration: 420,
              easing: Easing.out(Easing.back(1.8)),
              useNativeDriver: true,
            }),
            Animated.delay(240),
            Animated.parallel([
              Animated.timing(burst, {
                toValue: 1,
                duration: 650,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(spin, {
                toValue: 0.4,
                duration: 900,
                easing: Easing.inOut(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(figureScale, {
                toValue: 0.08,
                duration: 500,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.delay(280),
                Animated.timing(figureFade, { toValue: 0, duration: 220, useNativeDriver: true }),
              ]),
            ]),
          ]);
          break;
        case 4:
          // Hairline circles ripple outward like a drop of water.
          figure = Animated.stagger(
            320,
            ripples.map((v) =>
              Animated.timing(v, {
                toValue: 1,
                duration: 1150,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              })
            )
          );
          break;
        default:
          // 1 and 5 — dots pop into a ring, spin, and draw into the centre.
          figure = Animated.sequence([popIn(dots, 80, 340), spinContractDissolve]);
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

  const ink = dark ? colors.white : colors.ink;

  const ring = (
    <Animated.View
      style={[
        styles.figure,
        {
          opacity: figureFade,
          transform: [
            { scale: figureScale },
            { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '300deg'] }) },
          ],
        },
      ]}
    >
      {dots.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: ink },
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
  );

  return (
    <Animated.View
      pointerEvents={lifting ? 'none' : 'auto'}
      style={[
        StyleSheet.absoluteFillObject,
        styles.sheet,
        { backgroundColor: dark ? colors.ink : colors.bg, opacity: sheet },
      ]}
    >
      <View style={styles.stage}>
        {(variant === 1 || variant === 5) && ring}

        {variant === 2 && (
          <Animated.View style={[styles.figure, styles.rowFigure, { opacity: figureFade }]}>
            {dots.map((v, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.rowDot,
                  { backgroundColor: ink },
                  {
                    opacity: v,
                    transform: [
                      {
                        translateY: hops[i].interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, -16, 0],
                        }),
                      },
                      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>
        )}

        {variant === 3 && (
          <Animated.View
            style={[
              styles.figure,
              { opacity: figureFade, transform: [{ scale: figureScale }] },
            ]}
          >
            <Animated.View
              style={[
                styles.figure,
                {
                  transform: [
                    { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '300deg'] }) },
                  ],
                },
              ]}
            >
              {dots.map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    styles.irisDot,
                    { backgroundColor: ink },
                    {
                      opacity: burst,
                      transform: [
                        { rotate: `${(i / DOTS) * 360}deg` },
                        {
                          translateY: burst.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -RING_RADIUS + 4],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </Animated.View>
            <Animated.View
              style={[
                styles.dot,
                styles.pupil,
                { backgroundColor: ink },
                {
                  opacity: pupil,
                  transform: [
                    { scale: pupil.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
                  ],
                },
              ]}
            />
          </Animated.View>
        )}

        {variant === 4 &&
          ripples.map((v, i) => (
            <Animated.View
              key={i}
              style={[
                styles.ripple,
                { borderColor: ink },
                {
                  opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.55, 0] }),
                  transform: [
                    { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.15, 2.3] }) },
                  ],
                },
              ]}
            />
          ))}

        <View style={styles.row} accessibilityRole="header" accessibilityLabel="ARTEYE">
          {LETTERS.map((ch, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.letter,
                { color: ink },
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
  rowFigure: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  dot: {
    position: 'absolute',
    left: STAGE / 2 - DOT_SIZE / 2,
    top: STAGE / 2 - DOT_SIZE / 2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  irisDot: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    left: STAGE / 2 - 6.5,
    top: STAGE / 2 - 6.5,
  },
  pupil: {
    width: 22,
    height: 22,
    borderRadius: 11,
    left: STAGE / 2 - 11,
    top: STAGE / 2 - 11,
  },
  rowDot: {
    position: 'relative',
    left: undefined,
    top: undefined,
    width: 15,
    height: 15,
    borderRadius: 7.5,
  },
  ripple: {
    position: 'absolute',
    left: (STAGE - RIPPLE_SIZE) / 2,
    top: (STAGE - RIPPLE_SIZE) / 2,
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    borderRadius: RIPPLE_SIZE / 2,
    borderWidth: 1,
  },
  row: { flexDirection: 'row' },
  letter: {
    fontFamily: fonts.sansThin,
    fontSize: LETTER_SIZE,
    marginRight: TRACK,
  },
});
