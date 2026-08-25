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
- Typography: **one typeface, one weight, one case**. Archivo Medium,
  uppercase everywhere, from the wordmark to the smallest footnote.
  Hierarchy comes from size, letterspacing and colour depth (`inkDeep`
  headings, then `ink`, then `dim`), never from mixing weights, families or
  cases: each of those reads as a second typeface and breaks the house
  style. No italics, and no dashes in the copy: sentences are split or
  joined with commas instead, so nothing interrupts the line.
- **The screen does not narrate itself.** A line that explains how a control
  works is a sign the control is wrong; fix the control and delete the line.
  What stays is data, a disclosure the law requires, or a short empty state.
  Everything else is cut.
- **No glyphs anywhere**: no emoji, no arrows, no symbol characters. Every
  control draws its own mark from the same circles and hairlines as the rest
  (a triangle for reordering, a line for remove, a line and a cross for the
  steppers), and anything else is written out in words.
- Plenty of negative space; nothing feels full. Timeless over trendy.

## Data model

Schema: `supabase/setup_1_schema.sql` (RLS: every row is owner-only).

| Table               | Essence                                                      |
|---------------------|--------------------------------------------------------------|
| `pillars`           | self-chosen pillars + an optional identity line              |
| `habits`            | habits per pillar + their rhythm, start date and pause state |
| `marks`             | one row per habit per day (`unique (habit_id, date)`)        |
| `health_logs`       | `kind` ∈ movement / nutrition / sleep + free `payload` jsonb |
| `knowledge_entries` | book/course/article/podcast + one short insight              |
| `inbox_items`       | mind dump: book/idea/task/watch/note, captured in seconds    |
| `sleep_logs`        | one row per night: bed/wake times ('HH:MM'), quality 0-5     |
| `health_sync`       | daily platform numbers (steps, resting HR, energy) or manual |
| `subscriptions`     | RevenueCat webhook target (free/active/expired)              |
| `calendar_events`   | reserved for Google Calendar sync (no UI in V1)              |
| `checkins`          | cycle answers: week/month/quarter/intention per period       |

Cycle registration (`cycle_periods` + `cycle_entries`) deliberately has **no
Supabase tables**: it lives only on the device (`src/lib/cycle-store.ts`) —
the strongest privacy guarantee available. One-tap deletion wipes it.

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

1. **Today** — nothing but today, and only what today asks for. A habit on
   set days is absent on its other days; a flexible one steps aside once its
   week or month is satisfied; a paused one asks nothing at all. So the
   circle can always close and a rest day never reads as a miss. Habits per pillar
   (collapsible), each with a tappable ring, an optional identity line per
   pillar, and one quiet mind-dump line. No stats, no schedule, no nudges.
2. **Growth** — one month at a time. A single ring with the month's fill
   percentage, the month grid of intensity dots — **tap any day to fill it
   in afterwards**, so a forgotten day is never lost — week dots per habit
   (unscheduled days stay blank), and the cycle: intentions in the first
   days of the month, a short reflection every Sunday, a check-in on the
   last day of the month and of the quarter. Deliberately few numbers.
3. **Body** — collapsible, everything opt-in:
   - **Sleep**: regularity over hours. Seven nights as seven bars on one
     timeline, each running bed to wake, with faint verticals at the usual
     bed and wake times. A steady week stacks into a straight-edged block, a
     ragged one staggers, so the reading needs no explaining. Beneath it, the
     average drift in minutes; duration is secondary. No sleep score, no
     warnings. Manual entry; Apple Health fills it in the phone build.
   - **Steps**: filling circle against a self-set guideline (default 8 000,
     explicitly a direction, not a norm) plus seven mini-rings for the week.
     Health platforms are read-only and per-datatype opt-in; manual entry
     always works, so a missing platform never leaves a broken state.
   - **Movement / Nutrition**: as before (nutrition adds a protein counter;
     still no calories).
   - **Cycle**: STRICTLY REGISTERING, and deliberately the quietest module
     on the screen — marking that a period started (or ended) is all it
     asks. One quiet line of context underneath (cycle day, last start) and,
     once enough cycles are recorded, one neutral observation about their
     length. No rings, no symptom grid, no phase guidance, no fertility
     prediction. Device-only, one-tap full deletion, module switchable off.
4. **Knowledge** — the mind dump inbox (quick captures: a book you want to
   read, an idea, a to-do — open ring closes when handled) above the log:
   what you read or listened to, a 1–5 circle rating and an optional note.
   Capturing also works straight from Today.
5. **More** — your name (greeting on Today), appearance system/light/dark,
   navigation placement (bottom bar or an editorial left/right side rail),
   evening reminder (off/18/20/21h — one quiet notification when habits are
   still open, native only), editable Sunday questions, managing pillars and
   habits — pillars are named in the user's own words, renamed in place at
   any time and reordered with the up/down controls, each habit carries the
   weekdays it is due, and each pillar an optional identity line — account,
   privacy, build stamp. There is no in-app agenda: a habit can be handed off to your
   own calendar from Today ("Put it in your own calendar").

## The circle concept (MVP check-in)

- **MarkRing**: open ring (hairline, 1.25pt) → tap → a disc springs closed
  (spring animation). Tapping again opens it. No checkmark, no colour.
- **DayCircle**: the inner disc grows with √(fraction) so *area* shows
  progress; the seven outer dots tell the week.
- Everything is built with pure Views (border-radius) — no SVG dependency.

## Monetisation (structure in place)

Freemium via RevenueCat. Free forever: unlimited habits, daily check-in,
basic week progress. Premium (€4.99/month or €39.99/year): Health sync,
calendar hand-off, cycle registration, correlation insights, data export,
accent colours. `src/lib/entitlements.ts` holds the single feature-flag map
(`PREMIUM_FLAGS`) so features can shift tiers in one line; the paywall
(`app/paywall.tsx`) keeps the same quiet register — no urgency language, no
discount timers. The store build initialises react-native-purchases and maps
the RevenueCat entitlement into the provider; the webhook mirrors status
into `subscriptions`. The development build unlocks everything.

## Deliberately not in V1

No social features, leaderboards, points or badges; no punishments or forced
check-ins; no calorie counting; no bright colours or playful icons.

## Rhythm

Not every habit keeps the same kind of time, so each one carries a rhythm
(`src/lib/habits.ts`):

- **Set days** — fixed weekdays (yoga on Tuesday and Thursday).
- **Per week** — a number of times a week, you pick the days. It stays on
  Today until the week's quota is met, then steps aside; the day it was
  marked on always keeps showing it, so a mark can be undone.
- **Per month** — the same, counted over the month.

Two rules keep the numbers honest either way: a habit only counts from its
`start_date`, so adding one today never makes last week look empty; and a
paused habit disappears from Today and out of every target, keeping all its
history. Targets are computed structurally — what was asked for, not what
happened — so a target never shifts underneath the number being compared to
it.

## Privacy, portability and the day boundary

- **When your day starts** is a personal setting (default 04:00). Every
  screen asks `todayKey()` for the day the user is currently living, so a
  check-in at 01:00 still counts for the night before instead of quietly
  opening a new day. It is loaded before the first render, so nothing ever
  computes a date against the wrong boundary.
- **Export / restore** (More → your data) writes one readable JSON file with
  everything, including the device-only cycle data — the app's answer to
  both GDPR portability and "I switched phones".
- **Delete account** erases the account and every row from inside the app,
  as GDPR and Apple both require (`supabase/setup_2_account.sql`).
- **Cycle data asks for explicit consent** before recording anything, and
  withdrawing consent erases it.
- **Analytics** is opt-in and structurally cannot carry health data: the
  events are a closed union with counts-only properties, and the Body and
  cycle screens never call it. See `docs/privacy-compliance.md` for what
  still has to be arranged outside the code (EU region, the Supabase DPA,
  the processing record, the public privacy statement).

## Home-screen widget

The app publishes a snapshot of today (`src/lib/widget.ts`) after every
change; `docs/widget.md` carries the native WidgetKit / Glance setup. That
half needs a development build to compile — it cannot exist in Expo Go or on
the web.

## Roadmap after V1

- **V1.1** Google Calendar sync (two-way), free-time detection on real
  calendar data; subtle reminders (opt-in).
- **V1.2** Apple Health / Google Fit for sleep; quarterly overview.
- **V1.3** Encryption-at-rest for local cycle data; data export.
