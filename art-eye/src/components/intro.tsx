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
 * Cosmos-style launch sequence. The overlay owns the opening beat — the
 * ARTEYE letters drift apart from a cluster into the wordmark's wide
 * tracking, the tagline breathes in beneath, then the white sheet lifts.
 * `Reveal` blocks below stagger in as the sheet fades, so the home screen
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

export function IntroOverlay() {
  const [visible, setVisible] = useState(true);
  const [lifting, setLifting] = useState(false);
  const letters = useRef(LETTERS.map(() => new Animated.Value(0))).current;
  const tagline = useRef(new Animated.Value(0)).current;
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
        Animated.stagger(
          110,
          letters.map((v) =>
            Animated.timing(v, {
              toValue: 1,
              duration: 850,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            })
          )
        ),
        Animated.timing(tagline, {
          toValue: 1,
          duration: 550,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
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
      <Animated.Text style={[styles.tagline, { opacity: tagline }]}>
        YOUR EYE ON THE ART WORLD — SYDNEY
      </Animated.Text>
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
  row: { flexDirection: 'row' },
  letter: {
    fontFamily: fonts.sansThin,
    fontSize: LETTER_SIZE,
    color: colors.ink,
    marginRight: TRACK,
  },
  tagline: {
    fontFamily: fonts.sansLight,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.grey,
    marginTop: 18,
  },
});
