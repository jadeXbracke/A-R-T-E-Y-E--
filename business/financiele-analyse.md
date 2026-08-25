# ART EYE — financiële analyse & route naar een levensvatbaar bedrijf

*Sydney, augustus 2026. Alle bedragen in AUD, exclusief GST.*
*Rekenmodel: [`business/model.py`](model.py) — elk getal in dit document komt uit dat
script en is reproduceerbaar met `python3 business/model.py`.*

---

## 0. Samenvatting

ART EYE is vandaag een werkend product met een aanbodzijde die de meeste startups pas na
jaren hebben: **143 geverifieerde Sydneyse venues** (104 galeries, 23 musea, 16 ARIs), 61
geverifieerde tentoonstellingen, een zelfvaliderende data-pipeline en een live Supabase-backend.
Dat is het bedrijfskapitaal. De financiële vraag is niet *of* er een product is, maar of er een
**betaalbereide klant** achter zit.

Het antwoord uit de doorrekening: **ja, maar niet bij de consument.** De consument levert in het
basisscenario in jaar 3 A$23.119 op — 8% van de omzet. De galeries en musea leveren A$111.031 aan
abonnementen en A$132.000 aan campagnes: samen **80% van de omzet**. ART EYE is financieel gezien
geen consumenten-app met een B2B-randje, maar een **B2B-media- en SaaS-bedrijf met een
consumentenapp als distributiekanaal**. Elke euro die naar consumentenmonetisatie gaat in plaats
van naar de venue-relatie, is verkeerd besteed.

| Basisscenario | Jaar 1 | Jaar 2 | Jaar 3 |
| --- | ---: | ---: | ---: |
| Betalende venues (eind) | 43 | 82 | 114 |
| MAU (eind) | 4.000 | 12.000 | 24.000 |
| **Omzet** | **A$27.019** | **A$131.113** | **A$302.117** |
| Kosten | A$30.160 | A$102.048 | A$279.302 |
| **EBITDA** | **A$-3.141** | **A$29.065** | **A$22.815** |
| Cash (cumulatief) | A$-3.141 | A$25.925 | A$48.740 |

Drie conclusies die de rest van dit document uitwerkt:

1. **De financieringsbehoefte is klein: A$4.864 op het diepste punt (maand 8).** Dit bedrijf is
   bootstrapbaar. Er is geen investeerder nodig, en dat is de belangrijkste strategische vrijheid
   die ART EYE heeft — mits het team pas groeit als de omzet het draagt.
2. **De grootste financiële risico's zijn intern, niet extern.** Uit de gevoeligheidsanalyse:
   25% meer personeelslast draait EBITDA jaar 3 van +A$22.815 naar **-A$27.910**. Een halvering
   van de media-omzet doet hetzelfde. De markt breekt dit bedrijf niet; te vroeg aannemen wel.
3. **De uitkomst is een goed lopend klein bedrijf, geen schaalbedrijf** — tenzij de tweede stad
   werkt. Sydney alleen loopt tegen een plafond van circa 110 betalende venues. De
   Melbourne-uitbreiding in maand 19 is geen ambitie maar een **rekenkundige noodzaak** om na
   jaar 2 door te groeien.

---

## 1. Wat er financieel al staat

Voordat er één aanname wordt gedaan, is dit de feitelijke uitgangspositie uit de codebase:

| Bezit | Stand vandaag | Financiële betekenis |
| --- | --- | --- |
| Venue-register | 143 venues, geverifieerd, met adres/lat-long | De verkooplijst. Dit is de volledige adresseerbare markt in Sydney, al gekwalificeerd. |
| Contactgegevens | 126 websites, 112 Instagram-handles | Kanaal voor koude acquisitie zonder inkoopkosten. |
| Agenda | 61 geverifieerde tentoonstellingen | Het product is gevuld — geen leeg netwerk-probleem bij lancering. |
| Data-pipeline | `validate-venues`, `discover-venues`, `enrich-images` | Redactiekosten blijven vlak terwijl het register groeit. Dit is waarom de marge >90% kan blijven. |
| Backend | Supabase live, RLS, host-controls | Geen bouwkosten meer nodig om te kunnen factureren. |
| Distributie | Web (GitHub Pages) + iOS-pad | Web omzeilt de 15% app-store-fee op abonnementen. |

De pipeline verdient een aparte opmerking. In een normale agenda-uitgeverij zijn redactiekosten
**variabel met het aantal venues**: meer venues, meer mensen die openingstijden natrekken. Hier
zijn ze grotendeels **vast** (de AI-kosten in het model zitten in de infrastructuurregel, circa
A$140–400 per maand). Dat verschil is de reden dat 114 venues in jaar 3 met minder dan 2 fte
bediend kunnen worden — en het is het enige echte technologische kostenvoordeel van dit bedrijf.

---

## 2. De markt, van onderaf gerekend

### 2.1 Aanbodzijde: wie kan er betalen?

Geen top-downschatting nodig — het register *is* de markt.

| Segment | Aantal | Betaalbereidheid | Adresseerbaar |
| --- | ---: | --- | ---: |
| Commerciële galeries | 104 | Verkopen kunst, hebben marketingbudget. Kleinste 20% heeft geen budget. | ~83 |
| Musea / instellingen | 23 | Budget aanwezig, maar lange inkooptrajecten en aanbestedingen. | ~15 (realistisch, gefaseerd) |
| ARIs (artist-run) | 16 | Draaien op subsidie en vrijwilligers. Betalen structureel niets. | ~0 (gratis houden — zij leveren content) |
| **Sydney totaal** | **143** | | **~110** |

Uitbreidingsstappen in het model: **Melbourne vanaf maand 19** (+125 adresseerbaar; Melbourne
heeft een vergelijkbare of grotere galeriedichtheid dan Sydney) en **de rest van Australië vanaf
maand 31** (+90: Brisbane, Perth, Adelaide, Hobart). Totaal adresseerbaar in jaar 3: **325 venues**.

Bij het Studio-tarief van A$49 en het Pro-tarief van A$149 is de **theoretische bovengrens** van
de abonnementsomzet in Sydney alleen circa A$8.000 MRR (A$96.000 ARR) bij 100% penetratie — een
onbereikbaar getal. Dit is de belangrijkste harde grens in de hele analyse: **abonnementen alleen
maken dit bedrijf nooit groter dan een eenmanszaak.** De media- en campagne-omzet (§3.2) en de
tweede stad zijn geen extra's; zij zijn de business case.

### 2.2 Vraagzijde: hoe groot is het publiek?

| Laag | Schatting | Grondslag |
| --- | ---: | --- |
| Volwassenen Groot-Sydney | ~4,3 mln | Bevolkingscijfer, indicatief |
| Bezoekt jaarlijks een galerie/museum | ~1,1–1,3 mln | Circa 25–30% deelname; **te valideren bij ABS Cultural Attendance en Create NSW** |
| Frequente bezoeker (4+ per jaar) | ~130–160k | 12% van de bezoekers; dit is de echte doelgroep |
| Realistisch bereikbaar (SOM, jaar 3) | 24.000 MAU | ~16% van de frequente bezoekers |

> **Waarschuwing bij deze tabel.** Dit zijn ordegrootte-schattingen, geen marktonderzoek. Ze zijn
> bewust conservatief en de business case leunt er nauwelijks op — het consumentenabonnement is
> slechts 8% van de omzet in jaar 3. Voordat er geld op de vraagzijde wordt ingezet (betaalde
> acquisitie, influencers), moeten de twee cursief gemarkeerde bronnen daadwerkelijk worden
> nageslagen. Voor de venue-omzet is dit niet nodig: die staat of valt met de 143 namen in het
> register.

### 2.3 Concurrentie en waarom die de prijs bepaalt

| Speler | Wat het doet | Wat het voor een galerie kost |
| --- | --- | --- |
| Art Almanac / Art Guide Australia | Print + web agenda, advertentiemodel | A$300–900 per advertentie/maand |
| Instagram | Bereik, maar algoritme-afhankelijk en vluchtig | "gratis" + tijd + advertentiebudget |
| Time Out / Broadsheet | Redactionele vermelding, niet te sturen | onbetaalbaar of onbereikbaar |
| Eigen nieuwsbrief | Bereikt alleen wie de galerie al kent | tijd |

De relevante vergelijking voor de prijsstelling is dus **niet** een andere app, maar de
A$300–900 die een galerie nu al aan een advertentie in Art Almanac uitgeeft. A$49 per maand
(A$588 per jaar) is tegen die referentie goedkoop — dat is precies de bedoeling in jaar 1. Het
prijsonderzoek in §8.2 laat zien dat er waarschijnlijk ruimte is naar A$69.

---

## 3. Verdienmodel: vijf stromen, één zwaartepunt

### 3.1 Venue-abonnementen (SaaS) — de basis

| Tier | Prijs/maand | Voor wie | Wat erin zit |
| --- | ---: | --- | --- |
| **Claim** | gratis | iedereen in het register | Venue-pagina, shows indienen, basisvermelding. Houdt de agenda compleet. |
| **Studio** | A$49 | kleine commerciële galerie | Statistieken (opgeslagen/gezien/doorkliks), foto + video-achtergrond, Reel-link, voorrang in de reviewwachtrij |
| **Pro** | A$149 | gevestigde galerie, meerdere ruimtes | Alles uit Studio + curator's pick-kandidatuur, opening-night push, publieksinzichten, meerdere shows tegelijk |
| **Institutioneel** | A$499 | museum, kunstbeurs | Alles uit Pro + campagneplaatsing, data-export, redactionele samenwerking |

Ontwerpkeuzes met financiële gevolgen:

- **Het gratis tier is niet vrijgevigheid maar voorraadbeheer.** De agenda moet compleet zijn,
  anders is er geen publiek en dus geen betalende venue. Nooit een show achter de betaalmuur.
- **Jaarcontracten met 2 maanden korting** (aanname: 35% neemt dit af). Dat kost 5,8% van de
  bruto-abonnementsomzet en levert daarvoor cash vooraf en aantoonbaar lagere churn.
- **Web-checkout voor abonnementen, niet in-app.** Bespaart de 15% app-store-fee; alleen
  Stripe (1,9%). Op A$111.031 abonnementsomzet in jaar 3 scheelt dat circa A$14.500.

### 3.2 Media & campagnes — de groeimotor

Betaalde plaatsing binnen de redactionele agenda: een week in de hero-carrousel, een plek in de
curated strip, een openingsavond-push naar geïnteresseerde curatoren. A$800–1.200 per campagne,
plus beurspakketten rond Sydney Contemporary, Art Month en Vivid (A$8.000–12.000).

In jaar 3 is dit met **A$132.000 de grootste enkele stroom** — groter dan alle abonnementen
samen. Dat komt doordat campagne-omzet niet vastzit aan het aantal venues maar aan het
**publieksbereik**: dezelfde 24.000 MAU kan meerdere keren per jaar aan dezelfde galerie worden
verkocht. Het is ook de stroom met het grootste redactionele risico (zie §11).

Voorwaarde: campagnes worden **altijd zichtbaar gelabeld** en de curator's pick blijft
onverkoopbaar. De geloofwaardigheid van de agenda is het product; wie die verkoopt, verkoopt de
omzet van volgend jaar.

### 3.3 Curator+ (consument) — A$39/jaar

Onbeperkt opslaan, persoonlijk archief exporteren, vroege opening-night-meldingen,
route-/dagplanner over meerdere venues, offline agenda. Conversie-aanname: 2% van MAU in jaar 1
oplopend naar 3,5% in jaar 3 — aan de voorzichtige kant voor een nichepubliek met hoge affiniteit.

Zelfs bij een **verdubbeling** van die conversie stijgt de EBITDA in jaar 3 met slechts
A$15.339 (§8.1). Behandel Curator+ dus als een retentie-instrument en een signaal richting
adverteerders ("dit publiek betaalt"), niet als een omzetpijler.

### 3.4 Ticket-affiliate — vanaf jaar 2

Doorverwijzing naar betaalde museumtentoonstellingen en beurskaarten, 8% commissie op een
gemiddelde besteding van A$28. In jaar 3: A$5.967. Klein, maar de marge is 100% en het bouwt de
relatie met de musea op die het A$499-tier moeten afnemen. Vereist partnerafspraken die nog niet
bestaan — niet inrekenen voordat er één getekend is.

### 3.5 Data & insights — vanaf jaar 3

Een kwartaalrapport over publieksgedrag in de Sydneyse kunstsector (welke wijken, welke media,
welke openingstijden werken), afgenomen door instellingen, gemeenten en fondsen: 6 abonnementen
à A$2.500 plus één sponsor à A$15.000 = A$30.000. Dit is de stroom met de hoogste marge en de
grootste strategische waarde: wie de sectorbenchmark publiceert, wordt de infrastructuur van de
sector. Vereist wel een privacybestendige aggregatiemethode (§11).

### 3.6 Wat bewust níét in het model zit

- **Subsidies** (Create NSW, City of Sydney, Creative Australia). Realistisch bereikbaar in de
  ordegrootte A$10.000–50.000 en zeer passend bij dit profiel, maar niet-terugkerend en niet
  voorspelbaar. Buiten de exploitatie houden, inzetten voor eenmalige uitgaven (uitbreiding naar
  Melbourne, het jaarrapport). **Voorwaarden en deadlines zelf nagaan** — die veranderen jaarlijks.
- **Commissie op kunstverkoop.** Verleidelijk, maar het maakt ART EYE een concurrent van de
  galeries die het moeten betalen. Strategisch verkeerd.
- **Doorverkoop van persoonsgegevens.** Nooit. Zie §11.

---

## 4. Unit economics

Basisscenario, jaar 1, gemengd over de tiers:

| Kengetal | Waarde | Toelichting |
| --- | ---: | --- |
| ARPA (omzet per venue per maand) | **A$69** | na jaarcontractkorting |
| Brutomarge | **90%** | hosting/pipeline is de enige echte variabele kost |
| Churn | **3,0% per maand** | verwachte levensduur 33 maanden |
| CAC | **A$339** | acquisitiedeel van marketing + verkooptijd oprichter à A$1.500/maand |
| LTV | **A$2.084** | ARPA × marge ÷ churn |
| **LTV/CAC** | **6,1×** | gezond; de norm voor SaaS is 3× |
| **Terugverdientijd** | **5,4 maanden** | ruim binnen de 12-maandsnorm |

Ter vergelijking: conservatief 2,5× (A$549 CAC bij tragere acquisitie — nog steeds boven de
norm), optimistisch 11,5×.

**Wat dit betekent:** de economie per klant is niet het probleem van dit bedrijf. Elke venue die
tekent, verdient zichzelf binnen een half jaar terug. Het probleem is **volume × prijs**: 110
adresseerbare venues in Sydney bij A$69 gemiddeld is een plafond, geen groeipad. De middelen
horen daarom naar de twee dingen te gaan die dat plafond doorbreken — campagne-omzet per bestaand
account (§3.2) en de tweede stad (§2.1) — en niet naar het optimaliseren van een CAC die al
gezond is.

---

## 5. Kostenstructuur

### 5.1 Infrastructuur — opvallend laag

| Post | Kosten/maand | Bron |
| --- | ---: | --- |
| Supabase Pro | ~A$40 | US$25, controleren bij huidige koers |
| Anthropic API (3 pipeline-jobs) | A$60–200 | kostenplafond van 30 calls per run zit al in de code |
| Resend (digest-mail) | ~A$30 | |
| Opslag/bandbreedte beelden | schaalt met MAU (A$0,012 per MAU) | |
| Apple Developer | ~A$12 | A$149 per jaar |
| Domein, monitoring, back-up | ~A$25 | |
| **Totaal jaar 1** | **~A$230/maand** | oplopend naar ~A$680 in jaar 3 |

Voor 24.000 MAU in jaar 3 is dat ongeveer A$8.184 per jaar, ofwel **2,7% van de omzet**. De
technische keuzes die al gemaakt zijn (statische web-export via GitHub Pages, Supabase in plaats
van eigen servers, AI-jobs met een hard kostenplafond) zijn daarmee financieel al bewezen. Hier
valt niets meer te besparen; niet verder optimaliseren.

### 5.2 Personeel — de enige post die ertoe doet

Personeel is in dit model **geen tijdlijn maar een reeks drempels**. Elke rol gaat pas open als de
terugkerende omzet hem draagt:

| MRR-drempel | Rol die opengaat | Maandlast |
| ---: | --- | ---: |
| — (vanaf maand 4) | Oprichter, bescheiden vergoeding | A$1.500 |
| A$5.000 | Redactie/community 0,4 fte | A$2.200 |
| A$9.000 | Oprichter naar A$3.500 | +A$2.000 |
| A$13.000 | Developer op contract 0,5 fte | A$3.500 |
| A$18.000 | Partnerships & sales 1 fte | A$7.500 |
| A$26.000 | Stadsredacteur Melbourne 0,4 fte | A$2.500 |
| A$34.000 | Oprichter naar A$6.000 | +A$2.500 |
| A$42.000 | Support & operations 1 fte | A$5.500 |
| A$55.000 | Tweede developer | A$8.000 |

Deze tabel is **het belangrijkste stuk van de hele analyse**. Zie §8.1: 25% meer personeelslast
dan de drempels toestaan, en jaar 3 gaat van +A$22.815 naar -A$27.910 — een omslag van A$50.725
op een omzet die geen cent verandert. Er is geen enkele externe factor in dit model met een
vergelijkbare impact. Wie hier discipline houdt, wint; wie de partnerships-hire drie maanden te
vroeg doet, verliest een jaar.

### 5.3 Overige kosten

Marketing: het hoogste van een vaste bodem (A$700–3.500/maand) of 12% van de omzet — bewust
omzetgebonden, zodat marketing meeademt. Overhead (boekhouding, verzekering, juridisch, ToS en
privacyverklaring): A$420/maand in jaar 1 tot A$1.800 in jaar 3.

---

## 6. Driejarenprojectie, drie scenario's

### 6.1 Basis

| Post | Jaar 1 | Jaar 2 | Jaar 3 |
| --- | ---: | ---: | ---: |
| Venue-abonnementen | A$22.141 | A$60.395 | A$111.031 |
| Media & beurzen | A$3.200 | A$60.000 | A$132.000 |
| Curator+ | A$1.678 | A$8.926 | A$23.119 |
| Ticket-affiliate | — | A$1.792 | A$5.967 |
| Data & insights | — | — | A$30.000 |
| **Omzet** | **A$27.019** | **A$131.113** | **A$302.117** |
| Personeel | A$13.500 | A$62.200 | A$202.900 |
| Marketing | A$8.400 | A$21.600 | A$42.000 |
| Infrastructuur | A$2.738 | A$4.560 | A$8.184 |
| Overhead | A$5.040 | A$11.400 | A$21.600 |
| Transactiekosten | A$481 | A$2.288 | A$4.618 |
| **Kosten** | **A$30.160** | **A$102.048** | **A$279.302** |
| **EBITDA** | **A$-3.141** | **A$29.065** | **A$22.815** |
| EBITDA-marge | -12% | 22% | 8% |
| Cash cumulatief | A$-3.141 | A$25.925 | A$48.740 |

De dip in de EBITDA-marge in jaar 3 (22% → 8%) is geen verslechtering maar een **investering**:
de drempels voor partnerships, Melbourne en support gaan allemaal in jaar 3 open. Dat is de
bewuste keuze om het Sydney-plafond te doorbreken. Wie in jaar 3 winst wil maximaliseren, houdt
de drempels dicht en houdt A$63.395 over (§8.1) — maar heeft dan geen jaar 4.

### 6.2 Alle drie naast elkaar

| | Conservatief | Basis | Optimistisch |
| --- | ---: | ---: | ---: |
| Venues jaar 3 | 70 | 114 | 158 |
| MAU jaar 3 | 11.000 | 24.000 | 42.000 |
| Omzet jaar 1 | A$13.908 | A$27.019 | A$50.660 |
| Omzet jaar 2 | A$56.470 | A$131.113 | A$235.500 |
| **Omzet jaar 3** | **A$122.295** | **A$302.117** | **A$538.508** |
| EBITDA jaar 3 | A$7.069 | A$22.815 | A$112.484 |
| Break-even | maand 15 | **maand 9** | maand 5 |
| Diepste cashpunt | A$-12.600 (m14) | **A$-4.864 (m8)** | A$-497 (m1) |
| Omzet 36 mnd cumulatief | A$192.673 | A$460.249 | A$824.669 |

**Het opvallendste getal in deze tabel is het diepste cashpunt.** Zelfs in het conservatieve
scenario is de maximale financieringsbehoefte A$12.600 — minder dan een maandsalaris in de
techsector. Dat komt doordat de kosten aan de omzet zijn gekoppeld. Dit bedrijf kan niet
spectaculair falen; het kan alleen te klein blijven. Voor een eenpersoonsonderneming zonder
investeerder is dat precies het goede risicoprofiel.

### 6.3 Kwartaaldetail jaar 1 (basis)

| | K1 | K2 | K3 | K4 |
| --- | ---: | ---: | ---: | ---: |
| Venues (eind) | 15 | 26 | 35 | 43 |
| MRR (eind) | A$1.031 | A$1.839 | A$2.475 | A$2.974 |
| Omzet | A$2.508 | A$5.734 | A$8.434 | A$10.343 |
| Kosten | A$4.030 | A$8.626 | A$8.720 | A$8.783 |
| EBITDA | A$-1.522 | A$-2.892 | A$-286 | A$1.560 |
| Cash (eind) | A$-1.522 | A$-4.415 | A$-4.701 | A$-3.141 |

Mijlpalen: eerste positieve maand in **maand 9**, cashbodem in **maand 8 bij A$-4.864**, MRR van
A$2.974 aan het einde van jaar 1 (A$35.688 ARR).

---

## 7. Break-even en financiering

| Vraag | Antwoord (basis) |
| --- | --- |
| Wanneer dekt de omzet de kosten? | Maand 9, en het blijft daarna positief |
| Hoeveel geld is er nodig om daar te komen? | **A$4.864** |
| Hoeveel venues zijn daarvoor nodig? | 36 betalende venues (33% van adresseerbaar Sydney) |
| Wat als het conservatieve scenario uitkomt? | A$12.600, break-even in maand 15 |
| Aanbevolen buffer | **A$20.000** — dekt conservatief plus 60% marge |

**Aanbevolen financieringsroute, in deze volgorde:**

1. **Eigen middelen / bootstrap (A$20.000 buffer).** Behoudt 100% zeggenschap en dwingt de
   discipline af die §5.2 nodig heeft. Dit is de aanbevolen route.
2. **Subsidie (A$10.000–50.000, niet-verwaterend).** Het profiel past uitstekend: culturele
   infrastructuur, Sydneyse sector, meetbaar publieksbereik. Aanvragen bij Create NSW en de
   gemeente Sydney; voorwaarden en rondes zelf verifiëren. Bestemming: uitbreiding naar Melbourne
   en het eerste sectorrapport — niet de lopende kosten.
3. **Vooruitbetaalde jaarcontracten als werkkapitaal.** 10 venues die A$490 vooruitbetalen is
   A$4.900 — precies de cashbodem. Dit is de goedkoopste financiering die er bestaat en het
   valideert tegelijk de betaalbereidheid.
4. **Angel-investering: pas overwegen als de tweede stad bewezen werkt.** Voor die tijd is de
   waardering laag en de verwatering duur. Bij A$300.000 omzet met 20% marge is er ook geen
   dwingende reden.

---

## 8. Gevoeligheidsanalyse

### 8.1 Eén variabele tegelijk, vanaf het basisscenario

| Variant | Omzet jr 3 | EBITDA jr 3 | Break-even | Cashbodem |
| --- | ---: | ---: | ---: | ---: |
| **Basis** | A$302.117 | A$22.815 | maand 9 | A$-4.864 |
| Personeelslast +25% | A$302.117 | **A$-27.910** | maand 11 | A$-20.910 |
| Personeelslast -20% | A$302.117 | **A$63.395** | maand 8 | A$-3.575 |
| Media-omzet halvering | A$230.117 | **A$-4.317** | maand 10 | A$-5.682 |
| Media-omzet verdubbeling | A$434.117 | A$94.713 | maand 8 | A$-3.554 |
| Venue-acquisitie +30% | A$314.078 | A$32.050 | maand 7 | A$-2.723 |
| Venue-acquisitie -30% | A$287.340 | A$19.319 | maand 12 | A$-8.479 |
| Curator+ conversie ×2 | A$325.235 | A$38.154 | maand 8 | A$-4.178 |
| Churn -1pp per maand | A$310.665 | A$28.701 | maand 9 | A$-4.626 |
| Churn +1pp per maand | A$294.604 | A$23.945 | maand 9 | A$-5.095 |

**Rangorde van wat er werkelijk toe doet:** (1) personeelsdiscipline, (2) media-omzet,
(3) acquisitietempo, (4) consumentenconversie, (5) churn.

> **Eerlijke kanttekening bij de churnregel.** Churn oogt in deze tabel mild omdat het model een
> opgezegde venue weer aanvult uit de adresseerbare pool. In werkelijkheid kost die heracquisitie
> verkooptijd die niet als variabele kost in het model zit, en in een markt van 110 namen raakt de
> pool bovendien uitgeput — je kunt dezelfde galerie niet drie keer werven. Lees deze regel dus
> als **ondergrens**, niet als geruststelling. Bij een churn boven 4% per maand hoort de vraag
> "wat mist dit product?" boven aan de agenda te staan, wat de tabel ook zegt.

### 8.2 Prijspunt van het Studio-tier

Hogere prijs betekent minder klanten en meer churn; de vraag is waar het optimum ligt.

| Prijs | Aangenomen churn jr 3 | Venues jr 3 | Omzet jr 3 | EBITDA jr 3 |
| ---: | ---: | ---: | ---: | ---: |
| A$29 | 1,2% | 129 | A$290.202 | A$19.627 |
| A$39 | 1,5% | 122 | A$296.825 | A$23.624 |
| **A$49** | 1,8% | 114 | A$302.117 | A$22.815 |
| A$69 | 2,4% | 100 | A$308.935 | **A$27.004** |
| A$89 | 3,1% | 86 | A$310.182 | A$28.227 |

De curve is opvallend vlak: tussen A$29 en A$89 beweegt de omzet in jaar 3 minder dan 7%. Dat
betekent dat **prijs hier geen hefboom is maar wel een positioneringskeuze**. Twee praktische
conclusies: A$49 is de juiste startprijs voor jaar 1 (drempelverlagend, sneller
referentieklanten), en er is ruimte om nieuwe klanten in jaar 2 op **A$69** te zetten met
prijsgarantie voor de eerste lichting — dat beloont vroege venues en levert circa A$4.000 extra
EBITDA. Onder A$39 zakken is zinloos: het levert meer werk en minder geld op.

---

## 9. Wat maakt dit succesvol — zeven hefbomen

Op volgorde van financiële impact, elk met de waarde uit het model.

**1. Aannamediscipline (waarde: A$50.725 in jaar 3).** De drempeltabel in §5.2 is een contract met
jezelf. Geen rol gaat open voordat de MRR er is — geen enkele uitzondering, ook niet voor een
kandidaat die "te goed is om te laten lopen". Concreet: de partnerships-hire pas bij A$18.000 MRR.

**2. Campagne-omzet uit bestaande accounts (waarde: A$99.030 verschil tussen halvering en
verdubbeling).** Elke betalende venue is ook een mediaklant. Het verkoopgesprek is niet "wil je
een abonnement" maar "je opening is over drie weken — wil je die week de hero-plek?". Doel:
minimaal 30% van de betalende venues koopt jaarlijks één campagne. Bouw hiervoor een
seizoenskalender rond Sydney Contemporary, Art Month en Vivid; dat zijn voorspelbare
budgetmomenten.

**3. De tweede stad op tijd (waarde: het verschil tussen een plafond en een groeipad).** In maand
24 staan er 82 betalende venues tegenover ~110 adresseerbare in Sydney: grofweg driekwart benut,
en vanaf dat punt kost elke nieuwe klant merkbaar meer moeite. Melbourne moet in maand 19 starten,
wat betekent: register opbouwen vanaf maand 15. Het draaiboek is er al — de `discover-venues`-pipeline doet het
zoekwerk dat in Sydney handmatig gebeurde.

**4. Jaarcontracten (waarde: cashbodem van A$-4.864 naar bijna nul).** 35% jaarcontracten is de
aanname; elke procent daarboven is gratis werkkapitaal. Verkoop het jaarcontract als standaard en
de maandoptie als uitzondering.

**5. Retentie via aantoonbare waarde.** Een galerie zegt op als ze niet ziet wat het oplevert. Het
statistiekenscherm (opgeslagen, gezien, doorkliks naar website en Instagram, routes geopend) is
daarom geen feature maar het **facturatiebewijs**. Stuur het maandelijks per e-mail, ook als
niemand inlogt. Streefwaarde: churn onder 2,5% per maand.

**6. De redactionele geloofwaardigheid bewaken.** De curator's pick is niet te koop, campagnes
zijn altijd zichtbaar gelabeld. Dit lijkt een principekwestie maar is een financiële: op het
moment dat de agenda als advertentiebord wordt gelezen, verdampt zowel de consumentenkant als de
premiumprijs van de campagnes.

**7. Het sectorrapport als toegangsbewijs (waarde: A$30.000 direct, meer indirect).** Het rapport
opent de deur bij musea en gemeenten voor wie een A$499-abonnement een rondje langs drie
handtekeningen is. Wie de benchmark van de sector publiceert, wordt gebeld in plaats van
teruggebeld.

---

## 10. KPI-dashboard

Maandelijks bijhouden, met de waarde waarbij er iets moet gebeuren:

| KPI | Doel jaar 1 | Alarmwaarde |
| --- | --- | --- |
| Betalende venues | +3,5 netto per maand | < 2 netto, twee maanden op rij |
| MRR | A$2.974 aan het einde van jaar 1 | vlakke of dalende MRR |
| Venue-churn | < 3,0%/maand | > 4% |
| Gratis → betaald conversie | > 25% van geclaimde venues | < 15% |
| MAU | 4.000 aan het einde van jaar 1 | groei < 8%/maand |
| Doorkliks per venue per maand | > 40 | < 15 (dan is er geen verhaal bij de factuur) |
| Campagnes verkocht | 0,5/maand vanaf maand 7 | 0 in twee maanden |
| Cash op de rekening | > A$10.000 | < A$5.000 |
| Kosten per MAU | < A$0,10 | > A$0,25 |
| Personeelslast ÷ omzet | < 60% | > 75% |

De laatste twee zijn de vroegste waarschuwingssignalen: zij bewegen maanden voordat de EBITDA
het laat zien.

---

## 11. Risico's en mitigatie

| Risico | Kans | Impact | Mitigatie |
| --- | --- | --- | --- |
| **Galeries willen niet betalen** | Middel | Fataal | Test dit vóór de bouw van betaalde features: 20 verkoopgesprekken, doel 10 vooruitbetaalde jaarcontracten. Een "nee" hier is meer waard dan zes maanden ontwikkelen. |
| **Te vroeg aannemen** | Middel | Zeer hoog (A$50.725) | De drempeltabel; maandelijkse toets bij de KPI-review |
| **Eenpersoonsafhankelijkheid** | Hoog | Hoog | Documenteer de pipeline en de host-controls; regel een technische achtervang voordat er 50 betalende klanten zijn |
| **Media-omzet komt niet op gang** | Middel | Hoog (EBITDA jr 3 naar -A$4.317) | Verkoop de eerste campagne al in jaar 1 met korting, om te bewijzen dat het kanaal werkt |
| **Sydney-plafond zonder tweede stad** | Hoog na jaar 2 | Hoog | Melbourne-register vanaf maand 15 |
| **Onbedoelde terugval naar demo-modus bij een build** | Laag | Hoog | Staat al in `CLAUDE.md`: nooit handmatig bouwen zonder Supabase-variabelen; de deploy-workflow doet het. Een stille terugval betekent dataverlies voor elke bezoeker. |
| **Privacy / persoonsgegevens (bezoekgedrag)** | Middel | Hoog | Sectorrapport alleen op geaggregeerd niveau, minimale drempel per cel, nooit herleidbaar naar personen; individuele watchlists zijn al onzichtbaar voor venue-accounts (RLS). Australische Privacy Act naslaan vóór publicatie van het eerste rapport. |
| **App Store-afwijzing of beleidswijziging** | Laag | Middel | Web is het primaire kanaal en blijft volwaardig; iOS is aanvulling, geen afhankelijkheid |
| **AI-kosten lopen op** | Laag | Laag | Het plafond van 30 calls per run zit al in de code |
| **GST-registratieplicht** | Zeker in jaar 2 | Administratief | Verplicht boven A$75.000 omzet; in het basisscenario in jaar 2. Prijzen zijn excl. GST — B2B-klanten verrekenen het. Drempel en tarief zelf verifiëren bij de ATO. |
| **Concurrent met kapitaal stapt in** | Laag | Middel | Het register van 143 geverifieerde venues met contactgegevens is 18 maanden voorsprong. Verdiep die: exclusieve content, meerjarige afspraken met de 20 grootste venues. |

---

## 12. Actieplan, eerste 90 dagen

**Dagen 1–30 — validatie vóór opbouw.**
Selecteer de 20 galeries met het meeste verkeer op hun ART EYE-pagina. Voer 20 gesprekken met één
vraag: "wat is een maand op de hero-plek u waard?". Doel: **10 vooruitbetaalde jaarcontracten à
A$490 = A$4.900** — genoeg om de hele cashbodem te dekken vóór de eerste uitgave. Bouw in deze
maand niets nieuws.

**Dagen 31–60 — factureerbaar maken.**
Stripe-checkout op het web (buiten de app-store-fee om). Het statistiekenscherm per venue, plus de
maandelijkse e-mail met die cijfers — dat is het facturatiebewijs uit hefboom 5. Tierbeperkingen
achter een vlag, zodat gratis venues zichtbaar blijven maar de betaalde functies af te schermen zijn.

**Dagen 61–90 — het mediakanaal openen.**
Verkoop drie campagnes, desnoods de eerste tegen kostprijs, en meet wat een hero-week aan
doorkliks oplevert. Dat getal is voortaan de prijsonderbouwing. Richt tegelijk de KPI-review van
§10 in als vast maandelijks halfuur.

**Beslismoment op dag 90.** Zijn er ≥8 betalende venues én is er ≥1 campagne verkocht? Dan het
basisscenario doorzetten. Zo niet: niet doorbouwen, maar terug naar de prijs en het aanbod — dat
is een goedkope les in maand 3 en een dure in maand 18.

---

## Appendix A — Kernaannames op één rij

| Aanname | Waarde | Onderbouwing / status |
| --- | --- | --- |
| Adresseerbare venues Sydney | 110 van 143 | Uit het register; ARIs en de kleinste galeries uitgesloten |
| Adresseerbaar Melbourne (m19) / AU (m31) | +125 / +90 | Schatting op basis van vergelijkbare stadsomvang — **te valideren** |
| Prijzen | A$49 / A$149 / A$499 | Gebenchmarkt tegen Art Almanac-advertentietarieven — **te valideren met echte offertes** |
| Jaarcontracten | 35%, 2 maanden korting | Marktconventie in SaaS |
| Venue-churn | 3,0% → 1,8% per maand | Schatting; kleine galeries zijn seizoensgevoelig |
| MAU einde jaar 1/2/3 | 4.000 / 12.000 / 24.000 | Schatting; nog geen verkeersdata beschikbaar |
| Curator+ conversie | 2,0% → 3,5% | Voorzichtig voor een nichepubliek met hoge affiniteit |
| Campagneprijs | A$800 → A$1.200 | Onder het Art Almanac-tarief van A$300–900 per advertentie gehouden |
| Brutomarge | 90% | Berekend uit de werkelijke infrastructuurkosten |
| App-store-fee / Stripe | 15% / 1,9% | Small business program; tarieven zelf verifiëren |
| GST-drempel | A$75.000 omzet | ATO, zelf verifiëren |

**Wat dit model niet is.** Geen marktonderzoek: de vraagzijdecijfers zijn ordegrootte-schattingen
die met ABS- en Create NSW-data bevestigd moeten worden. Geen prognose: het is een rekenmachine
die laat zien welke aannames ertoe doen. En geen fiscaal of juridisch advies — voor de
rechtsvorm, GST en de privacyverplichtingen rond het sectorrapport hoort een accountant en een
jurist geraadpleegd te worden.

De enige cijfers die geen schatting zijn, zijn de 143 venues, de 61 tentoonstellingen en de
infrastructuurkosten. Dat is toevallig ook precies het deel waar de business case op rust.

## Appendix B — Het model draaien

```bash
python3 business/model.py          # alle tabellen uit dit document
python3 business/model.py --csv    # maandcijfers naar business/output/*.csv
```

Aannames staan als constanten boven in `business/model.py`. Wie een aanname niet gelooft, past
de constante aan, draait opnieuw en ziet direct wat het met de break-evenmaand en de cashbodem
doet. Zo hoort dit document gebruikt te worden: niet als voorspelling, maar als het antwoord op
de vraag "wat moet er waar zijn wil dit werken?".
