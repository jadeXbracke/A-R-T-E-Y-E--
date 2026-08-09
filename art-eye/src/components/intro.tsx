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
 * Launch sequence on an ink sheet — a gesture of white paint performs one
 * quick splatter on black, dissolves, and the white ARTEYE letters drift
 * apart into the wordmark's wide tracking. Then the dark sheet lifts to
 * the white app and `Reveal` blocks below stagger in, so the home screen
 * appears to assemble itself. Runs once per app launch.
 *
 * Five candidate splatter gestures live here while the final one is being
 * chosen — set INTRO_VARIANT to lock it in:
 *   1 flick   — the splatter flicks in on a diagonal, like a wrist snap
 *   2 impact  — a blob drops, flattens on impact, and bursts outward
 *   3 sweep   — a broad brush stroke wipes across, trailing spatter
 *   4 spray   — the whole splatter bursts at once, fast and punchy
 *   5 drip    — a drop falls slowly and settles into a soft splatter
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

const STAGE = 200;

// A hand-placed splatter of ink flecks — irregular radius, size and opacity
// so it reads as paint rather than a neat geometric ring.
const SPLATTER = [
  { dx: -58, dy: -34, size: 16, sx: 1.3, sy: 0.8, o: 1 },
  { dx: -74, dy: 8, size: 10, sx: 0.8, sy: 1.4, o: 0.85 },
  { dx: -48, dy: 42, size: 7, sx: 1, sy: 1, o: 0.7 },
  { dx: -16, dy: 64, size: 13, sx: 1.2, sy: 0.9, o: 1 },
  { dx: 22, dy: 70, size: 8, sx: 0.9, sy: 1.3, o: 0.75 },
  { dx: 54, dy: 48, size: 15, sx: 1.1, sy: 0.85, o: 1 },
  { dx: 76, dy: 12, size: 6, sx: 1, sy: 1, o: 0.6 },
  { dx: 62, dy: -30, size: 11, sx: 0.85, sy: 1.2, o: 0.9 },
  { dx: 32, dy: -60, size: 9, sx: 1.3, sy: 0.8, o: 0.8 },
  { dx: -8, dy: -72, size: 14, sx: 1, sy: 1.1, o: 1 },
  { dx: -40, dy: -58, size: 6, sx: 1, sy: 1, o: 0.65 },
  { dx: 10, dy: -22, size: 5, sx: 1, sy: 1, o: 0.9 },
  { dx: -16, dy: 24, size: 4, sx: 1, sy: 1, o: 0.7 },
];
const DX_MIN = Math.min(...SPLATTER.map((p) => p.dx));
const DX_MAX = Math.max(...SPLATTER.map((p) => p.dx));
const DIST_MAX = Math.max(...SPLATTER.map((p) => Math.hypot(p.dx, p.dy)));

export function IntroOverlay() {
  const [visible, setVisible] = useState(true);
  const [lifting, setLifting] = useState(false);
  const variant = useRef(activeVariant()).current;

  const burst = useRef(new Animated.Value(0)).current;
  const groupSweep = useRef(new Animated.Value(0)).current;
  const drop = useRef(new Animated.Value(0)).current;
  const squash = useRef(new Animated.Value(0)).current;
  const blobFade = useRef(new Animated.Value(1)).current;
  const barX = useRef(new Animated.Value(0)).current;
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

      const contract = (duration = 460) =>
        Animated.parallel([
          Animated.timing(figureScale, {
            toValue: 0.08,
            duration,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(duration - 200),
            Animated.timing(figureFade, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]),
        ]);

      const closing = Animated.sequence([contract(), letterDrift, Animated.delay(250)]);

      let opening: Animated.CompositeAnimation;

      switch (variant) {
        case 2:
          // A blob drops, flattens on impact, and bursts outward.
          opening = Animated.sequence([
            Animated.timing(drop, {
              toValue: 1,
              duration: 380,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(squash, {
              toValue: 1,
              duration: 90,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(squash, { toValue: 0, duration: 140, useNativeDriver: true }),
              Animated.timing(blobFade, { toValue: 0, duration: 160, useNativeDriver: true }),
              Animated.timing(burst, {
                toValue: 1,
                duration: 420,
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
              }),
            ]),
            Animated.delay(120),
          ]);
          break;
        case 3:
          // A broad brush stroke wipes across, trailing spatter behind it.
          opening = Animated.parallel([
            Animated.timing(barX, {
              toValue: 1,
              duration: 520,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.delay(80),
              Animated.timing(burst, {
                toValue: 1,
                duration: 560,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
          ]);
          break;
        case 4:
          // The whole splatter bursts at once — fast and punchy.
          opening = Animated.timing(burst, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.back(1.6)),
            useNativeDriver: true,
          });
          break;
        case 5:
          // A drop falls slowly and settles into a soft splatter.
          opening = Animated.sequence([
            Animated.timing(drop, {
              toValue: 1,
              duration: 520,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(squash, {
              toValue: 1,
              duration: 130,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(squash, { toValue: 0, duration: 200, useNativeDriver: true }),
              Animated.timing(blobFade, { toValue: 0, duration: 260, useNativeDriver: true }),
              Animated.timing(burst, {
                toValue: 1,
                duration: 620,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
            Animated.delay(120),
          ]);
          break;
        default:
          // 1 — the splatter flicks in on a diagonal, like a wrist snap.
          opening = Animated.parallel([
            Animated.timing(groupSweep, {
              toValue: 1,
              duration: 360,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(burst, {
              toValue: 1,
              duration: 380,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]);
      }

      Animated.sequence([opening, closing]).start(() => {
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

  // Each fleck flies out from the centre to its splatter position as it
  // reveals, staggered per-point so the burst reads as paint, not a ring.
  const staggerFor = (i: number, p: (typeof SPLATTER)[number]) => {
    if (variant === 3) return ((p.dx - DX_MIN) / (DX_MAX - DX_MIN)) * 0.45;
    if (variant === 2 || variant === 5) return (Math.hypot(p.dx, p.dy) / DIST_MAX) * 0.35;
    if (variant === 1) return (i / SPLATTER.length) * 0.4;
    return (i / SPLATTER.length) * 0.15;
  };

  const flecks = SPLATTER.map((p, i) => {
    const t0 = staggerFor(i, p);
    const reveal = burst.interpolate({
      inputRange: [t0, Math.min(t0 + 0.3, 0.99), 1],
      outputRange: [0, 1, 1],
    });
    return (
      <Animated.View
        key={i}
        style={[
          styles.dot,
          {
            left: STAGE / 2 - p.size / 2,
            top: STAGE / 2 - p.size / 2,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            opacity: Animated.multiply(reveal, p.o),
            transform: [
              { translateX: Animated.multiply(reveal, p.dx) },
              { translateY: Animated.multiply(reveal, p.dy) },
              { scaleX: p.sx },
              { scaleY: p.sy },
            ],
          },
        ]}
      />
    );
  });

  return (
    <Animated.View
      pointerEvents={lifting ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFillObject, styles.sheet, { opacity: sheet }]}
    >
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.figure,
            {
              opacity: figureFade,
              transform: [
                { scale: figureScale },
                variant === 1
                  ? {
                      translateX: groupSweep.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-46, 0],
                      }),
                    }
                  : { translateX: 0 },
                variant === 1
                  ? {
                      rotate: groupSweep.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-16deg', '0deg'],
                      }),
                    }
                  : { rotate: '0deg' },
              ],
            },
          ]}
        >
          {(variant === 2 || variant === 5) && (
            <Animated.View
              style={[
                styles.blob,
                {
                  opacity: blobFade,
                  transform: [
                    {
                      translateY: drop.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-STAGE * 1.3, 0],
                      }),
                    },
                    { scaleX: squash.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) },
                    { scaleY: squash.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }) },
                  ],
                },
              ]}
            />
          )}

          {variant === 3 && (
            <Animated.View
              style={[
                styles.bar,
                {
                  transform: [
                    {
                      translateX: barX.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-190, 90],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}

          {flecks}
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
  dot: {
    position: 'absolute',
    backgroundColor: colors.white,
  },
  blob: {
    position: 'absolute',
    left: STAGE / 2 - 14,
    top: STAGE / 2 - 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  bar: {
    position: 'absolute',
    left: STAGE / 2 - 60,
    top: STAGE / 2 - 8,
    width: 120,
    height: 16,
    borderRadius: 8,
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
