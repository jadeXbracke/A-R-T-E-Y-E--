# ART EYE — Financieel strategieplan

*Status: 9 augustus 2026 · Solo founder, avondwerk naast freelance, geen kapitaal · Beta: Sydney, rond Sydney Contemporary (3–6 sep 2026, VIP-preview 2 sep, Carriageworks — geverifieerd 10 aug 2026) · Alle bedragen in A$ tenzij anders vermeld.*

Dit document hoort bij **`ART-EYE-financieel-model.xlsx`** (zelfde map): 36 maanden, maandelijks, drie scenario's, cohort-gebaseerde retentie, volledig formule-gedreven. Draai daar aan de gele cellen; hier staat de redenering.

**Wat de repo me vertelde voordat ik iets aannam:** register van 143 Sydney-venues (104 galleries, 23 musea, 16 ARI's), kernloop = agenda → save ("Want to see") → seen + rating + reflectie → Curator-profiel, een Claude-gestuurde freshness-pipeline (validate/discover/enrich, met kostencap), een fairs-tab met **12 wereldwijde fairs**, venue-accounts met submissie/goedkeuring, en — belangrijk — **geen analytics-instrumentatie, geen push-notificaties en geen betaalfunctie in de code**. Die drie gaten bepalen het 90-dagenplan.

---

## 0 · Mijn vijf vragen — en de aannames waarmee ik doorwerkte

| # | Vraag | Aanname bij geen antwoord |
|---|---|---|
| 1 | Ben je fysiek in Sydney tijdens de beta (venue-bezoek en fair-aanwezigheid zijn niet remote te doen)? | **Ja**, minstens aug–nov 2026. Zo nee: schuif de launch niet — zoek één lokale ambassadeur, maar het plan verzwakt wezenlijk. |
| 2 | Hoeveel avonduren per week, realistisch, náást freelance? | **10–12 u/wk.** Alles hieronder is daarop gedimensioneerd. |
| 3 | Kan je freelance-inkomen ~A$5–8k cash-burn over 36 maanden absorberen zonder stress? | **Ja.** Het model piekt op ~A$3,7k cumulatieve burn (basis). |
| 4 | Heb je 2–3 warme venue-relaties (het demo-account suggereert contact met Roslyn Oxley9)? | **Ja, 2–3.** Die zijn je eerste pilotklanten, niet je eerste betaalde klanten. |
| 5 | Is het doel een zelfstandig bedrijf (op termijn founder-salaris) of een prachtig zijproject? | **Zelfstandig bedrijf.** Dan is expansie ná bewezen retentie verplicht — Sydney alleen betaalt nooit een salaris (zie §2). |

---

## 1 · Verdienmodel — zeven opties, één keuze

| # | Optie | Prijs | Wie betaalt | Brutomarge | Waarom het faalt |
|---|---|---|---|---|---|
| 1 | **Consumer subscription** (premium: stats, Wrapped, vroege fairgidsen) | A$4,49/mnd | Kunstliefhebber | ~85% (na 15% App Store Small Business-fee) | Low-frequency use case; niemand betaalt voor discovery van **gratis** events. Bij realistische retentie is de LTV per geactiveerde gebruiker **A$0,51** (model, basis). Zelfs 8.000 MAU × 5% conversie = ~A$1.500/mnd. Rekenkundig dood als hoofdmodel. |
| 2 | **Venue-SaaS** (featured plaatsing, analytics, eigen media, claim) | A$45/mnd | Galerie/venue | ~94% | Plafond per stad: ~70 adresseerbare venues × 35% max. penetratie = **~24 betalende venues = A$1.100 MRR** in Sydney. Faalt als éénstads-bedrijf; werkt alleen als herhaalbaar stads-playbook. En: kip-ei — venues betalen pas na bewezen publiek. |
| 3 | **Art-fair-partnerships** (officiële agenda-partner/gids) | A$5–15k per fair | Fair-organisator | ~90% | Lumpy (1–2× per jaar), sales-cyclus van maanden, fairs hebben eigen apps, en jij hebt pas onderhandelingsmacht mét publiek. Distributiekanaal: uitstekend. Omzetpijler: nooit. |
| 4 | **Affiliate op kunstverkoop** | 2–10% commissie | Galerie (uit verkoop) | hoog op papier | Kunstverkoop is offline, high-ticket, relatiegedreven en onmeetbaar. Attributie is onbewijsbaar, galeries delen geen commissie met een app. Faalt op de eerste factuur. |
| 5 | **Sponsored editorial** | A$300–1.000/plaatsing | Adverteerder | ~90% | CPM-economie vereist 100k+ MAU; jij hebt er straks 600–3.000. Bovendien: de curatoriële stem ís het product — sponsoring erodeert precies het vertrouwen dat retentie draagt. |
| 6 | **Ticketing** | 5–10% servicefee | Bezoeker | ~70% na PSP | De app stelt zelf vast (zie `venue-meta.ts`): galeries en ARI's zijn gratis. Alleen musea ticketen, en die zitten vast aan eigen systemen (Tessitura e.d.). Geen volume, geen wig. |
| 7 | **Data** (bezoekstromen, taste-graph aan instituties/toerisme) | A$10–50k/jr per afnemer | Institutie/overheid | ~95% | Vereist schaal (n in de tienduizenden per stad), privacy-zorgvuldigheid en een verkoopcyclus van een jaar. Op zijn vroegst een jaar-4-optie; nu een afleiding. |

**Primair: #2, venue-SaaS. De venue-kant betaalt eerst.** De redenering, streng:

1. **Er bestaat al betaalgedrag.** Australische galeries betalen vandaag voor listings in Art Guide Australia en Art Almanac. Je verkoopt geen nieuw budget, je verlegt een bestaande budgetregel naar een kanaal dat doorkliks en voetstappen kan tonen. Dat is een fundamenteel makkelijker gesprek dan een consument overtuigen te betalen voor iets wat Instagram gratis half doet.
2. **De consument betaalt structureel niet** voor discovery van gratis events (LTV A$0,51 — zie model). Consumer premium blijft bestaan als klein identiteitsproduct (Wrapped, stats) vanaf ~M6, maar draagt in het basisscenario op M36 slechts ~A$300 van A$2.600 MRR.
3. **Volgorde is dwingend:** consument gratis → dichtheid → bewijs (doorkliks per venue, saves per show) → dán venues pitchen met een rapport in de hand. Het model laat verkoop daarom pas in **M7** starten. Eerder pitchen verbrandt een kleine markt waarin iedereen elkaar kent.
4. Fair-partnership (#3) is de **distributie**-hefboom (launch rond Sydney Contemporary) en vanaf jaar 2 een bescheiden omzetregel (A$5k/sept, basis). Nooit primair.

---

## 2 · Financieel model — wat de cijfers zeggen

Volledig model in `ART-EYE-financieel-model.xlsx` (bladen: Aannames · Retentie · ModelBear/Basis/Bull · CohortBear/Basis/Bull · Sensitiviteit). Kernpunten:

### Retentie is cohort-gebaseerd en eerlijk laag
Low-frequency use case: van elk maandcohort geactiveerden is in het basisscenario **40% actief in M1, 24% in M3, 12% in M12, plateau ~9%** — de kern-loggers (het Letterboxd-patroon voor niche-logboeken). MAU is de kolomsom van het volledige cohortdriehoek (Cohort-bladen), geen groeipercentage uit de duim.

### Drie scenario's (selectie; alles in het Excel)

| | **Bear** | **Basis** | **Bull** |
|---|---|---|---|
| MAU M12 / M36 | 143 / 197 | 630 / 3.211 | 1.688 / 14.416 |
| Betalende venues M36 | 11 | 51 (2 steden) | 112 (cap) |
| MRR M36 (venue + consumer) | A$436 | **A$2.605** | A$9.108 |
| Omzet jaar 3 | A$4.7k | A$31.8k | A$99.6k |
| Max. cumulatieve burn | A$4.841 | **A$3.660** | A$3.902 |
| Break-even (cumulatief) | **nooit** | **M13** *(≈M17 zonder de A$5k fair-deal — die afhankelijkheid is expliciet)* | M12 |
| Cumulatieve cash M36 | −A$3.409 | +A$36.062 | +A$136.586 |

### Unit-economics
- **Consumer:** LTV A$0,51 per geactiveerde gebruiker; blended CAC A$0,47 (alleen guerrilla-marketing, geen paid). LTV:CAC ≈ 1,1 — het bewijs dat de consumentenkant een *acquisitie- en datamachine* is, geen omzetmachine.
- **Venue:** LTV = 45 × 94% ÷ 2,5% churn = **A$1.692**; CAC A$120 (founder-tijd + bezoek); **LTV:CAC 14:1, payback 2,8 maanden**. Unit-economics zijn nooit het probleem — het plafond per stad is het probleem. Daarom is de *stad* de groeieenheid (§4).
- **Kosten volledig:** Supabase + egress (schaalt met MAU), Claude-pipeline A$80/stad/mnd (de bestaande 30-calls-cap houdt dit hard), Expo/Resend/domein A$70, Apple A$150/jr, App Store-fee 15% (Small Business Program), marketing A$150/mnd + A$800 per fairmaand, oprichting A$400. Basis-burn vóór omzet: **~A$450/mnd**. Founder-salaris: A$0 — de echte investering is ~10 u/wk × 36 mnd aan niet-gefactureerde freelance-uren (±A$100k+ opportunity cost; wees daar eerlijk over).

### Sensitiviteit (blad Sensitiviteit, live formules)
1. **Venue-MRR = venues × prijs.** Sydney-plafond basis ≈ A$1.100. Prijs van 45→55 tillen verandert weinig; dekking en stad 2 veranderen alles.
2. **Consumer-omzet:** zelfs in het beste vak van de tabel (8.000 MAU × 5%) ~A$1.500/mnd — bevestigt de modelkeuze.
3. **Venue-LTV vs churn:** bij 5%/mnd churn halveert de LTV naar A$846 en wankelt het hele venue-model — churn ≤3% is daarom een expansie-gate, geen vanity-metric.

**De belangrijkste aanname van het hele model is het retentieplateau (blad Retentie).** Alles stroomafwaarts — MAU, venue-bewijs, expansierecht — hangt daaraan. Vandaar §6.

---

## 3 · Frameworks — toegepast, niet uitgelegd

**Godin — smallest viable market.** Je "beperk je niet"-ambitie staat al in de code: de fairs-tab scheept **12 wereldwijde fairs** mee (Basel, TEFAF, Frieze ×3, Miami…) terwijl je nog nul geverifieerde Sydney-gebruikers hebt. Dat is ambitie-lekkage. Je smallest viable market is niet "kunstliefhebbers", niet "Sydney", maar: **mensen die ≥3 openingen per kwartaal doen in het Paddington–Surry Hills–Chippendale-circuit.** Je eerste 100 fans, met naam en toenaam vindbaar: (a) de staf van de ~30 commerciële galeries in East + Inner West — zij zijn óók je toekomstige klanten; (b) NAS/UNSW Art & Design-studenten en alumni <5 jaar; (c) beginnende verzamelaars die de Instagram-accounts van Roslyn Oxley9, Sullivan+Strumpf en STATION volgen; (d) de communities rond de 16 ARI's in het register. Actie: reduceer de fairs-tab tot Sydney Contemporary + Melbourne Art Fair tot stad 2 live is. Wat je voor honderd van déze mensen onmisbaar maakt, verkoopt zichzelf aan de volgende duizend; wat je voor "iedereen" bouwt, is voor niemand onmisbaar.

**Chen — atomic network.** De kleinste eenheid die op zichzelf werkt is geen stad en geen buurt — het is **één fair-weekend**. Sydney Contemporary perst vier dagen lang 25–30k kunstbezoekers en 90+ galeries in één gebouw: kunstmatige maximale dichtheid, het perfecte koude-start-moment. Daarna moet het netwerk *landen* op het permanente substraat: het openingscircuit East + Inner West (~40 venues binnen 4 km — jouw register bewijst de dichtheid). De hard side van dit netwerk is de aanbodkant (actuele listings), en die heb je al opgelost zonder venues iets te vragen: founder-curatie + pipeline. Dat is je structurele voorsprong — bescherm hem.

**Vohra — 40%-PMF-gate.** Concreet en op de kalender: **15 december 2026**, survey aan iedereen met ≥2 sessies in de laatste 30 dagen, n ≥ 40. "Hoe teleurgesteld zou je zijn als ART EYE morgen verdwijnt?" **≥40% "zeer teleurgesteld" → door** (venue-verkoop opschalen, expansie voorbereiden). 25–40% → itereer uitsluitend op het segment dat "zeer" zei en hertest in maart. **<25% → kill de consumer-thesis** (§6). Geen derde herkansing.

**Skok — de venue-kant.** Payback 2,8 maanden en 14:1 LTV:CAC zijn uitstekend; Skoks echte les hier is een andere: bij een flat fee van A$45 en 26% jaarchurn bestaat er **geen negative churn**, dus geen compounding — het plafond per stad is hard. Antwoord: (1) expansion revenue per klant: basistier A$45, fair-pakket A$150 in september, jaarrapport-tier; (2) churn ≤3%/mnd als heilige metric — één churned galerie in een markt van 70 praat met tien andere; (3) de stad als groeieenheid: een gestandaardiseerde stads-P&L (dit model) die je kopieert, niet een product dat je per klant uitbouwt.

**Wei — status as a service.** Proof-of-work bestaat al in de app: het log (seen + rating + reflectie) kost moeite en is niet te faken zonder er geweest te zijn. Het statusspel dat loggen beloont is **taste-signaling: "mijn oog is goed, en ik was er vroeg."** Bouw precies drie dingen: (1) **"Opening week"-badge** per gelogde show — schaars, verifieerbaar via datum, maakt vroeg gaan status; (2) **jaarlijkse "Year in Art"** (Wrapped-mechaniek): deelbare kaart met aantal shows, meest bezochte venue, vroegst gespotte artiest — jouw jaarlijkse gratis acquisitiegolf; (3) het **Curator-profiel als publiek portfolio** (link-in-bio-waardig) — sociale kapitaal via curatie. Bouw géén likes/volgers-feed: dan concurreer je met Instagram op Instagrams spel, en de statusinflatie vernietigt het spaarzame kapitaal dat loggen waard maakt. Utility (agenda) is de acquisitiehaak; status is de retentiehaak; en retentie is je hele business (§2).

---

## 4 · Expansie

**Wat een stad minimaal moet hebben** (afgeleid uit wat Sydney laat werken):
- ≥60 listbare venues, waarvan **≥25 in één loopbaar circuit** (≤5 km) — dichtheid slaat aantal;
- een levende **openingscultuur** (vaste avonden, publiek dat rouleert);
- één **ankermoment** per jaar (fair / biënnale / gallery weekend) als koude-start-motor;
- ≥40 **commerciële** galeries (de betalende kant) mét bestaand listing-betaalgedrag;
- geen dominante lokale incumbent die hetzelfde mobiel al goed doet.

**Acht kandidaten na Sydney** — gescoord op venuedichtheid-in-circuit (30%), ankerevent (20%), betaalbereidheid venues (20%), concurrentievacuüm (15%), ops-kosten/nabijheid (15%); schaal 1–5:

| # | Stad | Dicht. | Anker | Betaal | Concur. | Ops | **Score** | Kern |
|---|---|---|---|---|---|---|---|---|
| 1 | **Melbourne** | 5 | 4 | 4 | 4 | 5 | **4,5** | Meer galeries dan Sydney, Melbourne Art Fair (feb '28 = M18, exact het basisscenario), zelfde taal/App Store/pers/tijdzone. Vanzelfsprekend. |
| 2 | **Londen** | 5 | 5 | 4 | 3 | 3 | **4,1** | Grootste circuit ter wereld + Frieze-week; incumbent GalleriesNow is web-first en zwak in log/status. Grote sprong in ops. |
| 3 | **Berlijn** | 5 | 4 | 2 | 4 | 3 | **3,7** | 400+ galeries, Gallery Weekend; maar notoir lage betaalbereidheid aan de venue-kant drukt de score. |
| 4 | **New York** | 5 | 5 | 4 | 2 | 3 | **3,7** | Grootste markt, maar See Saw is een gevestigde, geliefde incumbent met precies deze feature-set. Alleen instappen met een aantoonbaar onderscheid (het status-/logspel). |
| 5 | **Amsterdam** — de eerlijke toets | 3 | 3 | 3 | 2 | 4 | **3,0** | ~60–80 venues, circuit is klein; Amsterdam Art Week is een bescheiden anker; en **GalleryViewer bestaat al, gedragen door de galerievereniging zelf** — een insider-incumbent. Enige echte pro: jouw thuisvoordeel en netwerk. Conclusie: géén stad 2. Hooguit stad 3–4, en alleen als het thuisvoordeel zich laat verzilveren in 10 launching venues die vooraf ja zeggen. |
| 6 | **Brisbane** | 2 | 3 | 3 | 5 | 5 | **3,0** | Klein maar leeg speelveld, zelfde land; goedkope "derde stad" om het playbook te bewijzen op lage dichtheid. |
| 7 | **Parijs** | 4 | 5 | 3 | 3 | 2 | **3,4**→gedeeld | Art Basel Paris als anker is sterk; taal + ops-frictie + gesloten galeriewereld maken het duur voor een solo founder. |
| 8 | **Auckland** | 2 | 2 | 2 | 5 | 4 | **2,6** | Te klein circuit; alleen interessant als bijna-gratis satelliet van een AU-operatie. |

**Meetbare gates in Sydney vóór stad 2 — alle zes, geen vier-van-zes:**
1. M3-cohortretentie **≥18%** over ≥3 opeenvolgende cohorten;
2. **≥1.500 MAU** waarvan ≥60% organisch verworven;
3. Vohra-gate **≥40%** gehaald (§3);
4. **≥12 betalende venues** én churn **≤3%/mnd** over 6 maanden;
5. Content-autonomie: ≥80% van de actieve venues actueel gelist bij **≤4 u/wk** founder-tijd (de pipeline bewijst dat een stad zonder jou vers blijft);
6. Playbook gedocumenteerd: een nieuwe stad seeden (register + hours + beelden) kost **≤2 weken avondwerk**, gemeten in Sydney-termen.

---

## 5 · Kapitaal

**Bootstrap. Punt.** De cijfers laten weinig ruimte voor discussie: piek-burn is A$3.660 (basis) tot A$4.841 (bear). Met buffer is de totale cash-behoefte **~A$8k over 36 maanden** — freelance-absorbeerbaar (aanname 3).

- **Angel nu?** Nee. Je hebt geen kapitaalprobleem, je hebt een bewijsprobleem. A$150–250k ophalen vóór bewezen retentie koopt vooral verplichtingen: groeidruk die je naar paid acquisition duwt (precies wat dit model niet nodig heeft) en een gesprek over een markt die per stad A$1.100 MRR plafonneert. Ná de zes gates van §4 is dezelfde ronde 5–10× goedkoper in verwatering — en dan is het doel legitiem: 3 steden parallel in plaats van serieel.
- **Subsidie?** City of Sydney creative/business grants en Create NSW zijn klein (A$5–20k), traag en rapportage-zwaar. Alleen aanvragen als het proces <10 uur kost; nooit het plan erop bouwen. Nederlandse regelingen zijn irrelevant voor een Sydney-test.
- **Goedkoopste route naar bewezen retentie** (het enige dat nu telt): fair-weekend als gratis distributie + venue-posters/QR + het jaarlijkse Wrapped-moment als gratis acquisitiegolf + nul betaalde installs. Elke dollar marketing in het model (A$150/mnd) is guerrilla, geen performance.

---

## 6 · Tegenspraak

**Pre-mortem — de vijf waarschijnlijkste doodsoorzaken, in volgorde:**
1. **De post-fair-klif.** September geeft 900 downloads en applaus; in november is 85% weg en log je zelf de helft van de content. Dit is het Bear-scenario en het is de *default outcome* van event-apps — niet de uitzondering.
2. **De verversings-tredmolen.** De agenda is alleen waardevol als hij klopt; kloppend houden kost avonden; jouw avonden zijn het schaarste goed. Data verrot → vertrouwen weg → churn → motivatie weg. (Daarom is gate 5 van §4 een *overlevings*-criterium, geen nice-to-have.)
3. **Venues betalen niet.** "We staan al gratis in de app, we hebben Instagram en Art Guide" — als het antwoord op het analytics-rapport schouderophalen is, sterft het verdienmodel, hoe goed de app ook is.
4. **Solo-founder-uitval.** Freelance-piek, verhuizing, of gewoon maand vier van avondwerk zonder zichtbare groei. Geen team = geen demper.
5. **Launch-timing gemist.** App Store-review, een bug in de builds, of de fair-week half voorbereid — het atomic-network-moment (§3) komt pas in september 2027 terug.

**Kill-criteria — cijfers en datums, vooraf getekend:**

| Datum | Criterium | Consequentie |
|---|---|---|
| 1 dec 2026 | <700 geactiveerde gebruikers cumulatief óf W1-retentie <35% | Acquisitie-/onboarding-thesis herzien; geen nieuwe features tot gefixt |
| 15 dec 2026 | Vohra <25% "zeer teleurgesteld" | **Kill consumer-thesis**; alleen doorgaan als puur venue-tool met ander product |
| 1 mrt 2027 | M3-cohortretentie <10% (basis rekent 24%) | **Kill of pivot** — het plateau bestaat niet, dus het model bestaat niet |
| 1 jul 2027 | <8 betalende venues na ≥60 gedocumenteerde pitches | **Kill venue-verdienmodel** → ART EYE blijft portfolio/hobby; stop investering behalve onderhoud |

**De drie vragen die het hele plan onderuit kunnen halen:**
1. **Bestaat het discovery-probleem?** Of is Instagram + Art Guide voor jouw eerste 100 fans al "goed genoeg" en bouw je een vitamine met een prachtige huisstijl? (Toets: de Vohra-gate, niet je gevoel op een opening.)
2. **Betaalt een galerie voor bezoekers die tóch al kwamen?** Doorkliks bewijzen interesse, geen incrementele voetstappen. Als je incrementaliteit niet aannemelijk kunt maken (bijv. "N mensen sloegen jouw show op die je niet volgen op Instagram"), koopt de galerie een rapport, geen resultaat — en churnt bij de eerste bezuiniging.
3. **Werkt het zonder jou?** Als jij vier weken niets doet, klopt de agenda dan nog? Zo nee, dan heb je geen product maar een baan die A$0 betaalt — en is elke expansiestad een tweede onbetaalde baan.

---

## 7 · 90 dagen — week voor week, alleen avonden, één meetbaar resultaat per week

*10 aug – 8 nov 2026. Prioriteit volgt uit de gaten in de repo: eerst meten (er is nu géén analytics), dan lanceren, dan retentie, dan venue-bewijs.*

| Wk | Datums | Focus | **Meetbaar resultaat** |
|---|---|---|---|
| 1 | 10–16 aug | Analytics-instrumentatie (install→signup→save→seen-funnel + per-venue doorkliks) **én** TestFlight naar 20 doelgroep-testers — samengevoegd: de fair is maar 3 weken weg | Dashboard live + 20 actieve testers |
| 2 | 17–23 aug | September-agenda 100% (elke actieve venue met sept-show gelist, hours geverifieerd) + **App Store-build ingediend** (reviewbuffer!) | Coverage ≥95% + build in review |
| 3 | 24–30 aug | Release live + venue-launchpakket (poster+QR) naar 30 venues | App **live vóór 1 sep**; ≥10 venues bevestigen poster |
| 4 | 31 aug–6 sep | **Launch — fairweek** (VIP-preview 2 sep, fair 3–6 sep). Guerrilla rond Carriageworks, dagelijkse "vandaag zien"-push in-app | ≥600 downloads cumulatief |
| 5 | 7–13 sep | Activatie-analyse; onboarding-frictie fixen (eerste save ≤60 sec) | Activatie ≥50% op het septembercohort |
| 6 | 14–20 sep | Wekelijkse e-maildigest live (Resend staat er al); eerste W1-retentiemeting | W1-retentie gemeten + digest open rate ≥35% |
| 7 | 21–27 sep | Log-loop verkorten: seen+rating+reflectie in ≤30 sec; "opening week"-badge v1 | ≥25% van actieven heeft ≥1 log |
| 8 | 28 sep–4 okt | Vohra-survey uit naar iedereen met ≥2 sessies/30 dgn | n ≥ 40 respons binnen |
| 9 | 5–11 okt | Survey-analyse; top-3 fricties van het "zeer teleurgesteld"-segment gefixt | PMF-score gepubliceerd (voor jezelf) + 3 fixes live |
| 10 | 12–18 okt | Venue-rapport v0: per venue een A4 (views, saves, doorkliks) uit analytics | 10 rapporten verstuurd aan de 10 meest bekeken venues |
| 11 | 19–25 okt | Venue-gesprekken met rapport in de hand (nog niets verkopen; pilot peilen voor jan) | ≥5 gesprekken gevoerd |
| 12 | 26 okt–1 nov | Tweede ronde venue-gesprekken + bufferweek voor wat uitliep | ≥2 schriftelijke pilot-toezeggingen |
| 13 | 2–8 nov | 90-dagen-review tegen de kill-criteria van §6 | Go/no-go-memo geschreven, besluit genomen |

**Wat bewust níét in de 90 dagen zit:** betaalfunctie (te vroeg), stad 2-voorbereiding (gates eerst), fairs-tab uitbreiden (§3: reduceren juist), en elke vorm van paid acquisition.

---

## 8 · Upside — waarom het basisscenario bescheiden oogt, en welke hefbomen dat veranderen

Het basisscenario is bewust streng: het rekent alleen met **bewezen betaalgedrag** (galeries die nu al voor listings betalen) tegen een instapprijs, met seriële expansie op solo-avondtempo. Drie structurele oorzaken van het bescheiden beeld: (1) het plafond per stad is klein (~24 betalende galeries × A$45 ≈ A$1.100 MRR in Sydney); (2) de consumentenkant levert per definitie bijna niets op; (3) stad 2 komt pas op M18 en stad 3 helemaal niet voor in het model. Dat is geen somberheid maar prijsstelling van onzekerheid: wat nog niet bewezen is, staat op nul.

De hefbomen hieronder staan daarom **niet** in het basismodel — elk wordt pas realiteit met een specifiek bewijsstuk. Gerangschikt op realisme:

| # | Hefboom | Rekensom | Wat er eerst bewezen moet zijn |
|---|---|---|---|
| 1 | **Jaarcontracten i.p.v. maandelijks** (A$450/jr vooruit) | Churn 2,5%→1,5%/mnd tilt venue-LTV van A$1.692 naar **A$2.820**; cash komt vooruit binnen | ≥12 maandklanten die verlengen (Art Guide verkoopt óók per jaar — bestaand gedrag) |
| 2 | **Fair-seizoenspakket** | ~100 exposanten op Sydney Contemporary (deels niet-Sydney-galeries) × A$150 tijdelijke featured-plek × 20% afname ≈ **+A$3k per fair-editie**, bovenop de partnership | Eén september met aantoonbare doorkliks naar exposanten |
| 3 | **Museum-tier (A$150–300/mnd)** | Het register telt 23 musea; die hebben échte marketingbudgetten (blockbusters worden nu via Time Out/out-of-home gepromoot). 6 musea × A$200 = **+A$1.200 MRR** — verdubbelt het Sydney-plafond | 2 pilot-musea + een case ("X app-gebruikers kochten via de doorklik een ticket") |
| 4 | **Prijs omhoog met bewijs** (A$45→A$75–95) | Zelfde 24 galeries → plafond A$1.100→**A$1.800–2.300 MRR** per stad; nog steeds onder Art Guide-print | 6 maanden churn ≤2% en rapporten die galeries intern doorsturen |
| 5 | **Parallelle i.p.v. seriële expansie** | Het bedrijf is lineair in steden: 5 steden × A$2–3k (met hefboom 1–4) ≈ **A$10–15k MRR ≈ A$120–180k/jr** tegen ~90% marge — een echt founder-salaris, zonder investeerder | De zes Sydney-gates (§4) + een playbook dat een stad in ≤2 weken seedt; eventueel een kleine angel-ronde om 2–3 steden tegelijk te doen |

Twee dingen die het beeld óók verbeteren zonder nieuwe omzetregel: de kostenkant is al bijna niets (A$450/mnd), en de neerwaartse kant is gedekt (max ~A$5k verlies). **Het basisscenario is dus geen voorspelling van een klein bedrijf — het is de goedkoopst mogelijke toegangsprijs tot de tabel hierboven.** Elke hefboom heeft een datum in het bestaande plan: jaarcontracten en fair-pakket kunnen vanaf M7 (verkoopstart), museum-pilot vanaf M10, prijsverhoging vanaf M13, parallelle expansie na de gates.

Wat het beeld níét verbetert: paid advertising (CAC vernietigt de marge bij deze ARPU), een betaalmuur voor gebruikers (doodt de dichtheid waar galeries voor betalen), en meer features bouwen vóór de retentie bewezen is.

---

*Model: `docs/finance/ART-EYE-financieel-model.xlsx` — draai eerst aan de gele cellen (launch-downloads, activatie, retentieplateau via blad Retentie, close rate, churn). Het strengste dat je jezelf kunt aandoen: zet de Bear-kolom naast je eigen verwachting en noteer vandaag welk bewijs je in december moet zien om niet in Bear te leven.*
