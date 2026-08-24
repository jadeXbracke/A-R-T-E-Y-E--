# MARK — project plan

*"Make decisions from the perspective of who you want to become."*

MARK is a consistency and identity tracker. Every daily check-in is a
**mark**: a small piece of evidence of who you are becoming. Motivation comes
from visible growth over weeks and months — not from coercive streaks. A
missed day is no reason to panic; you simply continue.

## Visual identity

- Wordmark **M A R K** with wide letterspacing; a small filled circle acts as
  the full stop of the logo.
- Monochrome, the ART EYE house look: ink `#131211` on pure white `#FFFFFF`
  (light) / `#F4F3F0` on `#131211` (dark). Thin hairlines, no accent colours;
  progress discs fill in a neutral grey.
- **Circles and rings as the only motif**: open ring = to do, closed disc =
  mark set. No checkmarks, no icons — even the tab bar uses text + a dot.
- Typography: Archivo throughout, the ART EYE way — light, wide-tracked
  UPPERCASE headings, letter-spaced caps labels, regular body. No italics.
- Plenty of negative space; nothing feels full. Timeless over trendy.

## Data model

Schema: `supabase/setup_1_schema.sql` (RLS: every row is owner-only).

| Table               | Essence                                                      |
|---------------------|--------------------------------------------------------------|
| `pillars`           | self-chosen pillars (name, position, archived)               |
| `habits`            | habits per pillar; `target_per_week` is a *soft* target      |
| `marks`             | one row per habit per day (`unique (habit_id, date)`)        |
| `health_logs`       | `kind` ∈ movement / nutrition / sleep + free `payload` jsonb |
| `knowledge_entries` | book/course/article/podcast + one short insight              |
| `calendar_events`   | own blocks; `source`+`external_id` ready for Google sync     |
| `reflections`       | 3 answers per week (`unique (user_id, week_start)`)          |

**Privacy:** cycle data (`kind = 'cycle'`) deliberately does *not* exist in
Supabase. The live backend routes it to local storage on the device
(`supabase-api.ts` → `demo-store.ts`); the schema refuses the kind value.

## Architecture

Same cut as ART EYE: Expo + expo-router, one `Api` interface with two
backends. `DEMO_MODE = !EXPO_PUBLIC_SUPABASE_URL` — without credentials
everything runs on AsyncStorage (device-only), with credentials on Supabase.

```
mark/
  app/            expo-router: _layout, auth, (tabs)/{index,voortgang,
                  gezondheid,kennis,agenda,instellingen}
  src/theme.ts    tokens: palettes (light/dark), typography, spacing
  src/lib/        api.ts (mode switch) · api-types.ts (interface) ·
                  demo-store.ts · supabase-api.ts · auth.tsx ·
                  theme-context.tsx · dates.ts · types.ts
  src/components/ rings.tsx (MarkRing, DayCircle, WeekDots, IntensityDot) ·
                  ui.tsx (Screen, Wordmark, Chip, Field, …)
  supabase/       setup_1_schema.sql
```

## Screen overview

1. **Today** — the MVP screen. At the top the day circle: a disc that fills as
   you set marks, ringed by seven day dots (Monday at the top, clockwise)
   that close when a day was complete. Below it habits per pillar
   (collapsible, stays calm with many habits), each with a tappable ring. At
   the bottom today's agenda and — only when the evening is free — one gentle
   suggestion.
2. **Growth** — week view with 7 dots per habit, a month grid of intensity
   dots, totals vs. last month, and the weekly reflection (max 3 questions).
3. **Body** — collapsible submodules: Movement (type + minutes, soft weekly
   trend), Nutrition (meal quality / hydration / supplements, *no* calories),
   Sleep (hours + quality 1–5), Cycle (symptoms + energy, device-only).
4. **Knowledge** — entries with kind, title and one short insight.
5. **Agenda** — plan blocks (workout, reading time) next to your marks; V1 is
   a reliable local agenda, the two-way Google Calendar sync follows in V1.1
   on the same data model.
6. **More** — appearance system/light/dark, managing pillars and habits
   (archiving keeps history), account, privacy statement, build stamp.

## The circle concept (MVP check-in)

- **MarkRing**: open ring (hairline, 1.25pt) → tap → a disc springs closed
  (spring animation). Tapping again opens it. No checkmark, no colour.
- **DayCircle**: the inner disc grows with √(fraction) so *area* shows
  progress; the seven outer dots tell the week.
- Everything is built with pure Views (border-radius) — no SVG dependency.

## Deliberately not in V1

No social features, leaderboards, points or badges; no punishments or forced
check-ins; no calorie counting; no bright colours or playful icons.

## Roadmap after V1

- **V1.1** Google Calendar sync (two-way), free-time detection on real
  calendar data; subtle reminders (opt-in).
- **V1.2** Apple Health / Google Fit for sleep; quarterly overview.
- **V1.3** Encryption-at-rest for local cycle data; data export.
