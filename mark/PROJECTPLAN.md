# MARK — projectplan

*"Make decisions from the perspective of who you want to become."*

MARK is een consistentie- en identiteitstracker. Elke dagelijkse check-in is
een **mark**: een klein bewijs van wie je aan het worden bent. Motivatie komt
van zichtbare groei over weken en maanden — niet van dwingende streaks. Een
gemiste dag is geen paniek, gewoon doorgaan.

## Visuele identiteit

- Wordmark **M A R K** met wijde letterspacing; een klein gevuld cirkeltje
  fungeert als punt in het logo.
- Monochroom: ink `#141311` op ecru `#FAF7F1` (licht) / `#F1EDE5` op
  `#161512` (donker). Eén zachte warme tint `#A79B89`, alleen grafisch.
- **Cirkels en ringen als enig motief**: open ring = te doen, gesloten
  schijf = mark gezet. Geen vinkjes, geen iconen — ook de tabbalk gebruikt
  tekst + een punt.
- Typografie: Cormorant Garamond (fijne serif) voor koppen en cijfers,
  Archivo voor gespatieerde caps-labels en bodytekst.
- Veel negative space; niets voelt vol. Tijdloos boven trendy.

## Datamodel

Schema: `supabase/setup_1_schema.sql` (RLS: iedere rij is owner-only).

| Tabel               | Kern                                                        |
|---------------------|-------------------------------------------------------------|
| `pillars`           | zelfgekozen pijlers (naam, positie, archived)               |
| `habits`            | gewoontes per pijler; `target_per_week` is een zácht doel   |
| `marks`             | één rij per habit per dag (`unique (habit_id, date)`)       |
| `health_logs`       | `kind` ∈ movement / nutrition / sleep + vrij `payload` jsonb |
| `knowledge_entries` | boek/cursus/artikel/podcast + één kort inzicht              |
| `calendar_events`   | eigen blokken; `source`+`external_id` klaar voor Google-sync |
| `reflections`       | 3 antwoorden per week (`unique (user_id, week_start)`)      |

**Privacy:** cyclusdata (`kind = 'cycle'`) bestaat bewust *niet* in Supabase.
De live-backend routeert die naar lokale opslag op het toestel
(`supabase-api.ts` → `demo-store.ts`); het schema weigert de kind-waarde.

## Architectuur

Zelfde snit als ART EYE: Expo + expo-router, één `Api`-interface met twee
backends. `DEMO_MODE = !EXPO_PUBLIC_SUPABASE_URL` — zonder credentials draait
alles op AsyncStorage (device-only), met credentials op Supabase.

```
mark/
  app/            expo-router: _layout, auth, (tabs)/{index,voortgang,
                  gezondheid,kennis,agenda,instellingen}
  src/theme.ts    tokens: paletten (licht/donker), typografie, spacing
  src/lib/        api.ts (mode-switch) · api-types.ts (interface) ·
                  demo-store.ts · supabase-api.ts · auth.tsx ·
                  theme-context.tsx · dates.ts · types.ts
  src/components/ rings.tsx (MarkRing, DayCircle, WeekDots, IntensityDot) ·
                  ui.tsx (Screen, Wordmark, Chip, Field, …)
  supabase/       setup_1_schema.sql
```

## Schermenoverzicht

1. **Vandaag** — het MVP-scherm. Bovenaan de dagcirkel: een schijf die zich
   vult naarmate je marks zet, omringd door zeven dag-stippen (ma bovenaan,
   met de klok mee) die sluiten wanneer een dag compleet was. Daaronder
   gewoontes per pijler (inklapbaar, blijft rustig bij veel habits), elk met
   een tikbare ring. Onderaan de agenda van vandaag en — alleen als de avond
   vrij is — één zachte suggestie.
2. **Groei** (Voortgang) — weekbeeld met 7 stippen per habit, maandraster van
   intensiteitsstippen, totaal t.o.v. vorige maand, en de wekelijkse
   reflectie (max 3 vragen).
3. **Lichaam** (Gezondheid) — inklapbare submodules: Beweging (type + minuten,
   zachte weektrend), Voeding (maaltijdkwaliteit / hydratatie / supplementen,
   géén calorieën), Slaap (uren + kwaliteit 1–5), Cyclus (symptomen + energie,
   device-only).
4. **Kennis** — items met soort, titel en één kort inzicht.
5. **Agenda** — blokken plannen (workout, leestijd) naast je marks; V1 is een
   betrouwbare lokale agenda, de Google Calendar-sync (tweerichting) volgt in
   V1.1 op hetzelfde datamodel.
6. **Meer** (Instellingen) — weergave systeem/licht/donker, beheer van pijlers
   en gewoontes (archiveren, geschiedenis blijft), account, privacyverklaring,
   build-stamp.

## Het circle-concept (MVP check-in)

- **MarkRing**: open ring (hairline, 1.25pt) → tik → een schijf veert dicht
  (spring-animatie). Nogmaals tikken opent hem weer. Geen vinkje, geen kleur.
- **DayCircle**: binnenschijf groeit met √(fractie) zodat *oppervlakte* de
  voortgang toont; de zeven buitenstippen vertellen de week.
- Alles is met pure Views (border-radius) gebouwd — geen SVG-dependency.

## Bewust niet in V1

Geen social, leaderboards, punten of badges; geen straffen of verplichte
check-ins; geen calorie-tellen; geen felle kleuren of speelse iconen.

## Roadmap na V1

- **V1.1** Google Calendar-sync (tweerichting), vrije-tijd-detectie op echte
  agenda-data; subtiele reminders (opt-in).
- **V1.2** Apple Health / Google Fit voor slaap; kwartaaloverzicht.
- **V1.3** Versleuteling-at-rest voor lokale cyclusdata; export van je data.
