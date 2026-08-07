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
 * Launch sequence on an ink sheet — a single white circle performs one
 * quick gesture on black, dissolves, and the white ARTEYE letters drift
 * apart into the wordmark's wide tracking. Then the dark sheet lifts to
 * the white app and `Reveal` blocks below stagger in, so the home screen
 * appears to assemble itself. Runs once per app launch.
 *
 * Five candidate gestures live here while the final one is being chosen —
 * set INTRO_VARIANT to lock it in:
 *   1 aperture — a large circle contracts to a point, like a lens focusing
 *   2 eclipse  — a shadow glides over the circle until only a rim remains
 *   3 blink    — the circle blinks once like an eye, then slips away
 *   4 ripple   — hairline circles ripple outward as the letters fade in
 *   5 halo     — a hairline circle glows up around the arriving wordmark
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

const DISC_SIZE = 86;
const RIM = 4; // the sliver of light the eclipse leaves
const RIPPLE_SIZE = 120;
const HALO_SIZE = 214;
const STAGE = 230;

export function IntroOverlay() {
  const [visible, setVisible] = useState(true);
  const [lifting, setLifting] = useState(false);
  const variant = useRef(activeVariant()).current;

  const discIn = useRef(new Animated.Value(0)).current;
  const discScale = useRef(new Animated.Value(1)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const shadowX = useRef(new Animated.Value(0)).current;
  const ripples = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  const halo = useRef(new Animated.Value(0)).current;
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

      const fadeFigure = (duration = 220) =>
        Animated.timing(figureFade, { toValue: 0, duration, useNativeDriver: true });

      const letterDrift = Animated.stagger(
        60,
        letters.map((v) =>
          Animated.timing(v, {
            toValue: 1,
            duration: 550,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        )
      );

      let sequence: Animated.CompositeAnimation;

      switch (variant) {
        case 2:
          // A shadow glides over the circle until only a rim of light remains.
          discScale.setValue(0.7);
          sequence = Animated.sequence([
            Animated.parallel([
              Animated.timing(discIn, { toValue: 1, duration: 300, useNativeDriver: true }),
              Animated.timing(discScale, {
                toValue: 1,
                duration: 340,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(shadowX, {
              toValue: 1,
              duration: 620,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.delay(140),
            Animated.parallel([fadeFigure(300), letterDrift]),
            Animated.delay(250),
          ]);
          break;
        case 3:
          // The circle blinks once like an eye, then slips away.
          discScale.setValue(0.6);
          sequence = Animated.sequence([
            Animated.parallel([
              Animated.timing(discIn, { toValue: 1, duration: 260, useNativeDriver: true }),
              Animated.timing(discScale, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
              }),
            ]),
            Animated.delay(120),
            Animated.timing(blink, {
              toValue: 0.06,
              duration: 160,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(blink, {
              toValue: 1,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.delay(90),
            Animated.parallel([
              Animated.timing(discScale, {
                toValue: 0.05,
                duration: 360,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.sequence([Animated.delay(190), fadeFigure(170)]),
            ]),
            letterDrift,
            Animated.delay(250),
          ]);
          break;
        case 4:
          // Hairline circles ripple outward as the letters fade in.
          sequence = Animated.sequence([
            Animated.parallel([
              Animated.stagger(
                200,
                ripples.map((v) =>
                  Animated.timing(v, {
                    toValue: 1,
                    duration: 850,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                  })
                )
              ),
              Animated.sequence([Animated.delay(420), letterDrift]),
            ]),
            Animated.delay(250),
          ]);
          break;
        case 5:
          // A hairline circle glows up around the arriving wordmark.
          sequence = Animated.sequence([
            Animated.parallel([
              letterDrift,
              Animated.timing(halo, {
                toValue: 1,
                duration: 950,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
            Animated.delay(250),
          ]);
          break;
        default:
          // 1 — a large circle contracts to a point, like a lens focusing.
          discScale.setValue(2.4);
          sequence = Animated.sequence([
            Animated.parallel([
              Animated.timing(discIn, { toValue: 1, duration: 180, useNativeDriver: true }),
              Animated.timing(discScale, {
                toValue: 0.06,
                duration: 680,
                easing: Easing.inOut(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
            fadeFigure(160),
            letterDrift,
            Animated.delay(250),
          ]);
      }

      sequence.start(() => {
        if (cancelled) return;
        setLifting(true);
        markIntroDone();
        Animated.timing(sheet, {
          toValue: 0,
          duration: 500,
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
        <Animated.View style={[styles.figure, { opacity: figureFade }]}>
          {(variant === 1 || variant === 2 || variant === 3) && (
            <Animated.View
              style={[
                styles.disc,
                {
                  opacity: discIn,
                  transform: [{ scale: discScale }, { scaleY: blink }],
                },
              ]}
            >
              {variant === 2 && (
                <Animated.View
                  style={[
                    styles.shadow,
                    {
                      transform: [
                        {
                          translateX: shadowX.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-DISC_SIZE * 1.4, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}
            </Animated.View>
          )}

          {variant === 4 &&
            ripples.map((v, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.ripple,
                  {
                    opacity: v.interpolate({
                      inputRange: [0, 0.15, 1],
                      outputRange: [0, 0.7, 0],
                    }),
                    transform: [
                      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1.9] }) },
                    ],
                  },
                ]}
              />
            ))}

          {variant === 5 && (
            <Animated.View
              style={[
                styles.halo,
                {
                  opacity: halo.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0, 0.8, 0],
                  }),
                  transform: [
                    { scale: halo.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.12] }) },
                  ],
                },
              ]}
            />
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
 * feel. Cheap after launch: once the intro has run, blocks mounted later
 * (fresh data, other screens) still ease in from their delay alone.
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
        duration: 650,
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
  disc: {
    position: 'absolute',
    left: (STAGE - DISC_SIZE) / 2,
    top: (STAGE - DISC_SIZE) / 2,
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: DISC_SIZE / 2,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  shadow: {
    position: 'absolute',
    left: RIM,
    top: RIM,
    width: DISC_SIZE - RIM * 2,
    height: DISC_SIZE - RIM * 2,
    borderRadius: (DISC_SIZE - RIM * 2) / 2,
    backgroundColor: colors.ink,
  },
  ripple: {
    position: 'absolute',
    left: (STAGE - RIPPLE_SIZE) / 2,
    top: (STAGE - RIPPLE_SIZE) / 2,
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    borderRadius: RIPPLE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  halo: {
    position: 'absolute',
    left: (STAGE - HALO_SIZE) / 2,
    top: (STAGE - HALO_SIZE) / 2,
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.white,
  },
  row: { flexDirection: 'row' },
  letter: {
    fontFamily: fonts.sansThin,
    fontSize: LETTER_SIZE,
    color: colors.white,
    marginRight: TRACK,
  },
});
