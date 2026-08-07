import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet } from 'react-native';
import { colors, type } from '../theme';

const LETTERS = ['A', 'R', 'T', 'E', 'Y', 'E'];
const SIZE = 30; // intro renders the wordmark a touch larger than the header
const TRACKING = SIZE * 0.55; // same ratio the Wordmark component uses

/**
 * The opening sequence, shown once over the app right after launch: the
 * ARTEYE letters breathe open from the centre — each fading in as it drifts
 * to its final tracked position — a hairline draws itself underneath, then
 * the whole white ground dissolves into the agenda.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const letters = useRef(LETTERS.map(() => new Animated.Value(0))).current;
  const rule = useRef(new Animated.Value(0)).current;
  const veil = useRef(new Animated.Value(1)).current;
  const [ruleWidth, setRuleWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false));
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;
    if (reduceMotion) {
      letters.forEach((v) => v.setValue(1));
      rule.setValue(1);
      Animated.timing(veil, {
        toValue: 0,
        duration: 300,
        delay: 400,
        useNativeDriver: true,
      }).start(() => onDone());
      return;
    }
    Animated.sequence([
      Animated.delay(250),
      Animated.parallel([
        Animated.stagger(
          70,
          letters.map((v) =>
            Animated.timing(v, {
              toValue: 1,
              duration: 900,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            })
          )
        ),
        Animated.timing(rule, {
          toValue: 1,
          duration: 800,
          delay: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(350),
      Animated.timing(veil, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => onDone());
  }, [reduceMotion, letters, rule, veil, onDone]);

  const centre = (LETTERS.length - 1) / 2;
  return (
    <Animated.View style={[styles.veil, { opacity: veil }]} accessibilityElementsHidden>
      <Animated.View
        style={styles.wordmarkRow}
        onLayout={(e) => setRuleWidth(Math.max(0, e.nativeEvent.layout.width - TRACKING))}
      >
        {LETTERS.map((letter, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.letter,
              {
                opacity: letters[i],
                transform: [
                  {
                    translateX: letters[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [(centre - i) * (TRACKING + 4), 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {letter}
          </Animated.Text>
        ))}
      </Animated.View>
      <Animated.View
        style={[styles.rule, { width: ruleWidth, opacity: rule, transform: [{ scaleX: rule }] }]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  wordmarkRow: { flexDirection: 'row' },
  letter: { ...type.wordmark, fontSize: SIZE, letterSpacing: TRACKING },
  // width is measured from the wordmark row (minus its trailing letter-space)
  rule: { marginTop: 18, height: 1, backgroundColor: colors.hairline },
});
