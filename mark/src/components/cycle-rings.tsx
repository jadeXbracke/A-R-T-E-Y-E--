// Cycle rings: one ring per cycle, the newest outermost. Each cycle runs
// once around (day 1 at the top, normalised to its own length — never an
// assumed 28); recorded menstruation days are the dark segment. Stacked
// cycles make patterns visible by themselves. Strictly a picture of what
// was logged — nothing predictive.
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { CycleSpan } from '../lib/cycle-store';
import { useTheme } from '../lib/theme-context';

function point(cx: number, cy: number, r: number, frac: number) {
  const angle = frac * 2 * Math.PI - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function CycleRings({ spans, currentDay, size = 216, children }: {
  spans: CycleSpan[];   // oldest → newest, newest may be incomplete
  currentDay?: number;  // day within the newest span
  size?: number;
  children?: React.ReactNode;
}) {
  const { palette } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 8;
  const gap = 11;
  const last = spans.slice(-4);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {last.map((span, i) => {
          const r = outer - (last.length - 1 - i) * gap;
          const frac = Math.min(span.periodDays / span.length, 1);
          const from = point(cx, cy, r, 0);
          const to = point(cx, cy, r, frac);
          const large = frac > 0.5 ? 1 : 0;
          return (
            <React.Fragment key={span.start}>
              <Circle cx={cx} cy={cy} r={r} stroke={palette.hairline} strokeWidth={1} fill="none" />
              <Path
                d={`M ${from.x} ${from.y} A ${r} ${r} 0 ${large} 1 ${to.x} ${to.y}`}
                stroke={palette.ink} strokeWidth={4} strokeLinecap="round" fill="none"
              />
            </React.Fragment>
          );
        })}
        {/* today's position on the newest ring */}
        {currentDay && last.length ? (() => {
          const span = last[last.length - 1];
          const p = point(cx, cy, outer, Math.min(currentDay / span.length, 1));
          return <Circle cx={p.x} cy={p.y} r={4} fill={palette.ink} />;
        })() : null}
      </Svg>
      {children}
    </View>
  );
}
