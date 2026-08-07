import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';
import { Wordmark } from './ui';

// Opening timeline, in ms from app launch. The overlay owns 0 → LIFT_AT +
// LIFT_MS; Reveal sections start their entrances while the overlay is
// lifting so the reveal reads as one continuous motion, not two steps.
const MARK_MS = 700; // wordmark fade/settle
const RULE_MS = 600; // hairline draws itself under the mark
const LIFT_AT = 1500; // overlay starts to lift
const LIFT_MS = 550; // overlay fade duration
const REVEAL_AT = LIFT_AT + 250; // sections may begin entering here

const launchedAt = Date.now();
const ease = Easing.out(Easing.cubic);

/**
 * ms until the intro overlay has lifted far enough for content entrances to
 * be seen. Reveal adds this to its own delay, so section animations always
 * play in view instead of finishing hidden behind the overlay — and cost
 * nothing (returns 0) once the opening is over.
 */
export function introRemaining() {
  return Math.max(0, launchedAt + REVEAL_AT - Date.now());
}

/**
 * Full-screen opening overlay: white ground, the ARTEYE wordmark settling
 * into place with a hairline drawing itself beneath, then the whole sheet
 * lifts to reveal the app. Renders once at the root, above the navigator,
 * and unmounts when done.
 */
export function IntroOverlay() {
  const [done, setDone] = useState(false);
  const mark = useRef(new Animated.Value(0)).current;
  const rule = useRef(new Animated.Value(0)).current;
  const sheet = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(mark, { toValue: 1, duration: MARK_MS, easing: ease, useNativeDriver: true }),
      Animated.timing(rule, { toValue: 1, duration: RULE_MS, easing: ease, useNativeDriver: true }),
      Animated.delay(Math.max(0, LIFT_AT - MARK_MS - RULE_MS)),
      Animated.timing(sheet, { toValue: 0, duration: LIFT_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]).start(() => setDone(true));
  }, [mark, rule, sheet]);

  if (done) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.sheet, { opacity: sheet }]}>
      <Animated.View
        style={{
          opacity: mark,
          transform: [
            { translateY: mark.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            { scale: mark.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
          ],
        }}
      >
        <Wordmark size={26} />
      </Animated.View>
      <Animated.View
        style={[styles.rule, { transform: [{ scaleX: rule }] }]}
      />
      <Animated.Text style={[styles.tagline, { opacity: rule }]}>
        YOUR EYE ON THE ART WORLD
      </Animated.Text>
    </Animated.View>
  );
}

/**
 * Entrance wrapper: fades its children in while drifting them up a touch,
 * after `delay` ms. During the opening it waits for the intro overlay to
 * lift first; afterwards it plays immediately, so late-loading sections
 * still enter gracefully. Plays once, on mount.
 */
export function Reveal({
  delay = 0,
  children,
  style,
}: {
  delay?: number;
  children: React.ReactNode;
  style?: object;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 550,
      delay: introRemaining() + delay,
      easing: ease,
      useNativeDriver: true,
    }).start();
  }, [t, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  rule: {
    height: 1,
    width: 220,
    backgroundColor: colors.hairline,
    marginTop: 18,
  },
  tagline: {
    fontFamily: fonts.sansLight,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.grey,
    marginTop: 14,
  },
});
