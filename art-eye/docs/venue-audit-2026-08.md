# Venue-controle — ART EYE vs. Art Guide Australia & Art Almanac

Datum: 20 augustus 2026 · Bron in de app: `art-eye/src/lib/seed.ts` (142 venues,
demo/fallback) en `art-eye/supabase/venues_seed.sql` (137 venues, live register).

## Methode en beperking (eerst lezen)

Beide vergelijkingsplatforms zijn **niet direct op te halen** vanuit deze
omgeving: `artguide.com.au` en `www.art-almanac.com.au` worden door de
egress-proxy van de sessie geweigerd (HTTP 403 op de CONNECT-tunnel). De
vergelijking hieronder is daarom gedaan via zoekresultaten van diezelfde
domeinen plus verificatie bij de venues zelf (eigen site, Art Collector,
Broadsheet, gemeente-sites).

Gevolg: de **fouten** hieronder zijn stuk voor stuk geverifieerd en betrouwbaar.
De lijst **ontbrekende venues** is aantoonbaar juist maar niet aantoonbaar
compleet — een volledige regel-voor-regel diff tegen de complete Sydney-index
van beide platforms vraagt om directe toegang tot die twee domeinen.

---

## A. Fouten in bestaande venues

| # | Venue in ART EYE | Wat er staat | Wat er klopt |
|---|---|---|---|
| A1 | Sarah Cottier Gallery | actief, Paddington | **Gesloten.** De galerie liep 1993–2024 en is opgeheven; het Instagram-account is gearchiveerd. |
| A2 | Cement Fondu | galerie in Paddington | **Geen fysieke locatie meer.** Paddington 2017–2024, sinds 2025 itinerant; het programma is in 2026 afgerond. |
| A3 | Curatorial+Co | Redfern | **Woolloomooloo** — Shop G01/02, 80 William Street. Verhuisd uit Redfern (daar sinds 2020). |
| A4 | SNO Contemporary Art Projects | Marrickville | **Rosebery** — Level 2, 30–40 Harcourt Parade. |
| A5 | Piermarq | Paddington | **Surry Hills** — 23 Foster Street (ground floor). |
| A6 | Vermilion Art | Dawes Point | Art Almanac zet 16 Hickson Road onder **Walsh Bay**. Klein verschil, maar de suburb-filter in de app zet de galerie nu in de verkeerde wandelroute. |
| A7 | Ambush Gallery | Chippendale | Dubbelzinnig: de expositieruimte staat op Central Park (Broadway, Chippendale), het hoofdkantoor op Level 1, 4 James Street, **Waterloo**. Nalopen welke van de twee publiek toegankelijk is. |

Wel gecontroleerd en **correct** bevonden: Chalk Horse (167 William St,
Darlinghurst), STATION Sydney (91 Campbell St, Surry Hills), Utopia Art Sydney
(983 Bourke St, Waterloo), 1301SW (3 Hiles St, Alexandria), Goodspace
(Chippendale, Lord Gladstone), Frontyard Projects (228 Illawarra Rd,
Marrickville), The Commercial (Marrickville), Artbank (222 Young St, Waterloo),
Woollahra Gallery at Redleaf (548 New South Head Rd, Double Bay), Boomalli
(55–59 Flood St, Leichhardt), COMA (37 Chapel St, Marrickville), 16albermarle
(Newtown), OLSEN Gallery + OLSEN Annexe (Woollahra), Roslyn Oxley9, Saint
Cloche, Wagner Contemporary, UNSW Galleries, White Rabbit, Sullivan+Strumpf
(Zetland), Mosman Art Gallery, S.H. Ervin, AGNSW, Artspace, Firstdraft,
Cassandra Bird, Sabbia Gallery, UTS Gallery, Nanda\Hobbs, Stanley Street
Gallery, National Art School Gallery.

---

## B. Venues die bij Art Almanac / Art Guide staan en bij ons ontbreken

### Commercieel — CBD, The Rocks, East Sydney
- **Ken Done Gallery** — 1 Hickson Road, The Rocks
- **CBD Gallery** — 72 Erskine Street, Sydney
- **China Cultural Centre in Sydney** — Level 1, 151 Castlereagh Street
- **The Garden Gallery** — Royal Botanic Garden, Mrs Macquaries Road
- **Robin Gibson Gallery** — 278 Liverpool Street, Darlinghurst
- **Scieppan Gallery** — Shop 2/1 Francis Street, Darlinghurst

### Potts Point
- **Becker Minty** — Shop 7, Ikon Building, 81 Macleay Street
- **Freeman Gallery** — 03/46a Macleay Street
- **Numbers** — 8 Kellett Street

### Redfern · Waterloo · Alexandria · Zetland
- **PALAS** — 42 Hansard Street, Zetland
- **Stella Downer Fine Art** — 1/24 Wellington Street, Waterloo
- **The Renshaws, Sydney** — 111–117 McEvoy Street, Alexandria
- **Revolve Gallery & Studios** — 138 Little Eveleigh Street, Redfern
- **Rogue Pop-up Gallery** — 130 Regent Street, Redfern
- **Redfern Art & Ceramic Gallery** (Art Guide)

### Inner West
- **AIRspace Projects** — 10 Junction Street, Marrickville (ARI, actief, EOI 2026 open)
- **Chrissie Cotter Gallery** — 31A Pidcock Street, Camperdown (30 jaar in 2026)
- **Gallery 371** — 371 Enmore Road, Marrickville
- **LAILA** — Level 1, 158 Edinburgh Road, Marrickville
- **Syrup** — 20 Farr Street, Marrickville
- **UPSpace Gallery + Studio** — Building 24, 142 Addison Road, Marrickville
- **Gallery LNL** — 49–51 King Street, Newtown
- **Studio 551** — 551 King Street, Newtown

### Oost & noord
- **SOHO Galleries Sydney** — 150 Edgecliff Road, Woollahra
- **Art Moment Gallery** — 99 Curlewis Street, Bondi Beach
- **Barometer** — Paddington
- **Michael Reid Northern Beaches** — Shop 2/358 Barrenjoey Road, Newport
  (we hebben alleen Michael Reid Sydney/Chippendale)
- **Sydney Road Gallery** (Art Guide) — Noord-Sydney, kunstenaarscollectief
- **Sketch Collective Gallery** — Surry Hills (nieuw, Art Guide)

### Instellingen
- **Powerhouse Ultimo** — staat helemaal niet in het register. Tijdelijk dicht
  voor de heritage-revitalisatie, maar het is wel de bekendste ontbrekende naam
  in de lijst; hoort erin met een gesloten/heropent-status.
- **Powerhouse Castle Hill** — open voor publiek in het weekend (10–16u), naast
  het Museums Discovery Centre dat we wél hebben. Nu is er één entry voor twee
  publiek toegankelijke gebouwen.
- **AGNSW** — Art Guide voert twee aparte entries (Naala Nura en Naala Badu).
  Wij hebben één entry. Verdedigbaar, maar bezoekers zoeken op "Sydney Modern".

### Regionaal NSW (scope-vraag, geen fout)
De day-trip-set dekt Wollongong, Bowral/Ngununggula, Bundanon, Katoomba,
Newcastle, The Lock-Up, Maitland en Gosford. Art Almanac voert daarnaast onder
meer **MAC yapang / Museum of Art and Culture Lake Macquarie** (Booragul),
**Bowral Art Gallery**, **Finite Gallery** (Caves Beach) en **Flying Spanners**
(Teralba), plus het hele westen en noorden van NSW (Orange, Bathurst, Goulburn,
NERAM, Tweed, Wagga, Broken Hill) dat wij bewust buiten beschouwing laten.
Beslissing nodig: blijft ART EYE Sydney + dagtrip, of wordt het NSW-breed?

---

## C. Interne datafouten (los van de vergelijking)

Deze kwamen tijdens de controle boven en wegen zwaarder dan de meeste
listing-verschillen hierboven.

### C1. Vijf venues staan nooit in de live database — en zes exposities vallen weg

`venues_seed.sql` voegt **137** venues toe. `seed.ts` (de demo-data) kent er
**142**. Deze vijf komen alleen in de demo voor en worden nooit ge-insert:

- 1301SW (Alexandria)
- Ames Yavuz (Surry Hills)
- Cassandra Bird (Potts Point)
- Grace Cossington Smith Gallery (Wahroonga)
- OLSEN Annexe (Woollahra)

Ze worden verderop in hetzelfde bestand wél *ge-update* (website, Instagram,
openingstijden) — maar een `update ... where slug = ...` op een rij die niet
bestaat doet niets, dus die regels zijn stille no-ops.

Gevolg in `exhibitions_seed.sql`: dat bestand zegt in de kop "61 geverifieerde
tentoonstellingen", maar sluit af met `join venues v on v.slug = s.slug`. De zes
shows die aan deze vijf venues hangen worden zonder foutmelding overgeslagen:

- Cassandra Bird — *Places of Delight* (Robby Bennett)
- 1301SW — *Sally Gabori & Judy Ledgerwood*
- Ames Yavuz — *Infinite Gesture*
- OLSEN Annexe — *Interconnected* (Aaron Crothers)
- Grace Cossington Smith Gallery — *Pulse*
- Grace Cossington Smith Gallery — *Abbotsleigh Biennial: Finalists*

**Live staan er dus 55, niet 61.** De demo-versie toont wel alle 61 — precies
het soort verschil tussen demo en live dat moeilijk te zien is.

### C2. Ruim de helft van de venues heeft geen adres

Van de 142 venues in `seed.ts` hebben er **72 `address: null`** — de hele
"v2 dataset". Ook ontbreekt bij **9** de website en bij **22** het
Instagram-account. Elf venues hebben coördinaten die op twee decimalen zijn
afgerond (±1 km); D'Lan Contemporary staat bijvoorbeeld op `-33.87, 151.21`,
een generiek CBD-punt.

Dit is het grootste inhoudelijke gat ten opzichte van beide platforms: Art Guide
en Art Almanac hebben bij *elke* listing een straatadres. Zonder adres werkt de
kaart niet fatsoenlijk, klopt de routebeschrijving niet en is de suburb-filter
het enige houvast.

Zes venues hebben helemaal geen coördinaten: Roslyn Oxley9, Cassandra Bird,
1301SW, Ames Yavuz, OLSEN Annexe, Grace Cossington Smith Gallery.

---

## D. Voorstel voor volgorde van aanpak

1. **C1 fixen** — vijf `insert`-regels in `venues_seed.sql`; daarmee komen ook de
   zes ontbrekende exposities live. Kleinste ingreep, grootste zichtbare effect.
2. **A1–A5 corrigeren** — Sarah Cottier archiveren (het register kent al een
   `status = 'archived'`-patroon voor May Space en Liverpool Street Gallery),
   Cement Fondu idem of omzetten naar itinerant, en drie suburbs/adressen
   rechtzetten.
3. **C2 aanvullen** — adressen bij de 72 lege venues. Dit is handwerk, maar het
   raakt de kaart, de wandelroutes en de geloofwaardigheid tegenover de twee
   platforms het hardst.
4. **B afwegen** — van de ontbrekende namen zijn PALAS, Michael Reid Northern
   Beaches, SOHO Galleries, Robin Gibson, Stella Downer, The Renshaws, AIRspace
   Projects en Chrissie Cotter de meest gemiste; de rest is een redactionele
   keuze over hoe breed de gids wil zijn.
5. **Toegang regelen** tot `artguide.com.au` en `art-almanac.com.au` in de
   egress-policy, zodat een volledige, automatische diff mogelijk wordt in
   plaats van een steekproef.
