# ART EYE ← venue-register koppeling

De ART EYE-app (Expo, repo `APPSTUDIOJB`) haalt de venues live op uit **deze**
repo, zodat het register hier beheerd kan worden zonder toegang tot de
app-code.

## Hoe het werkt

```
D-I-S-APP- (deze repo)                      ART EYE app (Expo Go)
db/seed/venues_seed.sql  ──genereert──▶  data/venues.json ──fetch──▶ VenuesScreen
```

- `data/venues.json` — de 54 geverifieerde Sydney-venues als JSON, direct
  op te halen via GitHub raw:
  `https://raw.githubusercontent.com/jadeXbracke/D-I-S-APP-/claude/sydney-venues-migration-2k48yb/data/venues.json`
  (na merge naar `main`: vervang de branchnaam door `main`)
- `VenuesScreen.js` — kant-en-klaar scherm voor de app; geen extra
  packages nodig, werkt direct in Expo Go.

## In ART EYE zetten (2 stappen)

1. Kopieer `VenuesScreen.js` naar het ART EYE-project (bijv.
   `screens/VenuesScreen.js`).
2. Voeg het scherm toe aan je navigatie, bijvoorbeeld als tab:

   ```jsx
   import VenuesScreen from './screens/VenuesScreen';
   // in je navigator:
   <Tab.Screen name="Venues" component={VenuesScreen} />
   ```

Herstart Expo Go → tab "Venues" toont alle 54 venues, met website-,
Instagram- en kaartlinks. Pull-to-refresh haalt de nieuwste versie op.

Bouw je de app met een AI-tool? Plak dan deze prompt:

> Voeg een "Venues"-scherm toe dat JSON ophaalt van
> https://raw.githubusercontent.com/jadeXbracke/D-I-S-APP-/claude/sydney-venues-migration-2k48yb/data/venues.json
> en de venues toont als cards (naam, type-badge, adres, website/Instagram/
> kaart-links), gesorteerd op type en naam. Of gebruik letterlijk het bestand
> app-integration/VenuesScreen.js uit die repo.

## Register bijwerken

1. Pas `db/seed/venues_seed.sql` aan (venue toevoegen/wijzigen).
2. Genereer `data/venues.json` opnieuw uit de database (zie `db/README.md`;
   de JSON is een export van de view `venues_public` — fixtures komen er dus
   nooit in).
3. Commit + push. De app toont de wijziging bij de volgende keer openen.

## Let op

- De JSON bevat **alleen** venues uit `venues_public` — testdata
  (`is_fixture = true`) kan nooit in de app belanden.
- Zodra ik toegang heb tot `APPSTUDIOJB` (GitHub → Settings → Installations
  → Claude → Repository access) kan ik stap "In ART EYE zetten" ook zelf
  doen, inclusief exposities per venue.
