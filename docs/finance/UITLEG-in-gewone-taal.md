# ART EYE — het financiële plan in gewone taal

*Voor wie geen finance-achtergrond heeft. Alle bedragen in Australische dollar (A$); grofweg A$1 ≈ €0,60, dus A$45 ≈ €27.*

---

## 1 · Het idee in één minuut

1. **De app is gratis voor kunstliefhebbers.** Mensen betalen niet voor het ontdekken van gratis tentoonstellingen — dat hoeft ook niet. Zij zijn niet de klant; zij zijn het publiek.
2. **Publiek opbouwen rond het fair-weekend.** Sydney Contemporary (3–6 september, VIP-preview 2 september) brengt tienduizenden kunstliefhebbers vier dagen op één plek. Dát is het moment om te lanceren zonder marketingbudget.
3. **Bewijs verzamelen.** De app meet hoeveel mensen een galerie bekijken, een show opslaan en doorklikken. Die informatie kan een galerie nu nergens krijgen.
4. **Galeries betalen — A$45 per maand.** Niet om "in de app te staan" (dat blijft gratis), maar voor uitgelichte plaatsing, eigen foto's/video en een maandrapport met die cijfers. Pas verkopen vanaf maand 7, mét bewijs in de hand.

---

## 2 · Waar komen de cijfers vandaan?

Elk getal in de Excel valt in één van drie categorieën:

**A. Feiten uit je eigen app (de repo):**
- **143 venues** staan in je eigen venue-register (104 galeries, 23 musea, 16 artist-run spaces). Daarvan zijn er ~70 commerciële galeries — het soort dat realistisch kan betalen.
- **De vaste kosten liggen vast:** Supabase ~A$60/mnd, Apple-licentie A$150/jr, de AI-pijplijn die het register vers houdt ~A$80/mnd, e-mail/domein ~A$70/mnd. Samen ~A$450 per maand — meer kost de app je nu niet.
- **De launchdatum** volgt uit je eigen fairs-register: Sydney Contemporary staat er al in.

**B. Openbare feiten en vergelijkbare bedrijven:**
- **Galeries betalen nu al voor vermeldingen** bij Art Guide Australia en Art Almanac. Dit is het belangrijkste bewijs van het hele plan: je vraagt galeries geen nieuw gedrag, alleen een bestaand budget verleggen.
- **Apple houdt 15% in** op App Store-verkopen (kleinbedrijf-tarief).
- **Sydney Contemporary trekt ~25.000–30.000 bezoekers.**
- **Bij vergelijkbare apps** (zoals Letterboxd) betaalt 1–5% van de gebruikers voor premium, en is na één maand nog 10–15% van nieuwe gebruikers actief. Die percentages zijn als uitgangspunt overgenomen.

**C. Aannames — eerlijke schattingen:**
- 900 downloads in de launchmaand (~3% van de fairbezoekers).
- 55% maakt een account aan en slaat iets op.
- 1 op de 8 gepitchte galeries zegt ja; 2,5% van de betalende galeries zegt per maand op.
- Al deze schattingen staan in **gele cellen** op het tabblad *Aannames*. Verander je er één, dan rekent alles automatisch door.

> **Het model voorspelt de toekomst niet.** Het is een rekenmachine die laat zien wat er gebeurt *als* de aannames kloppen. Omdat je dat niet zeker weet, is alles drie keer doorgerekend: tegenvaller, verwacht, meevaller.

---

## 3 · De rekensom die alles draagt

Van elke **100 mensen** die de app installeren (verwacht scenario):

| | |
|---|---|
| **100** | installeren de app |
| **55** | maken een account en slaan een show op ("activatie") |
| **22** | zijn er na één maand nog |
| **13** | zijn er na drie maanden nog — *dit getal beslist het hele plan* |
| **~5** | blijven hangen als vaste gebruikers |

Dit klinkt somber, maar is de **normale werkelijkheid van vrijwel elke app**. Het plan is er juist omheen ontworpen: omdat maar ~5% blijft, moet het geld van galeries komen — niet van gebruikers. Eén vaste gebruiker levert via premium gemiddeld maar **A$0,51** op in z'n hele leven; één betalende galerie circa **A$1.700**. Daarom is de keuze zo eenduidig.

---

## 4 · Drie scenario's, drie uitkomsten (na 36 maanden)

| | Tegenvaller | Verwacht | Meevaller |
|---|---|---|---|
| Maandelijkse gebruikers | ~200 | ~3.200 | ~14.400 |
| Betalende galeries | 11 | 51 (2 steden) | 112 |
| Omzet per maand | A$436 | A$2.605 | A$9.108 |
| Meer omzet dan kosten vanaf | nooit | maand 13 | maand 12 |
| Totaal na 3 jaar | −A$3.409 | +A$36.062 | +A$136.586 |

Twee dingen om vast te houden:
1. **Zelfs in de tegenvaller verlies je maximaal ~A$4.800** (±€2.900) over drie jaar. Dat is het hele financiële risico — en de reden dat je geen investeerder nodig hebt.
2. **Zelfs de meevaller maakt je niet rijk.** Sydney alleen kan maximaal ~24 betalende galeries opleveren (≈A$1.100/mnd). Een salaris wordt dit pas met meerdere steden — en dat mag pas als Sydney zes concrete doelen haalt (strategiedocument, deel 4).

---

## 5 · Hoe lees je de Excel?

| Tabblad | Wat het is | Voor jou? |
|---|---|---|
| `LeesMij` | Korte handleiding en conclusies | **begin hier** |
| `Aannames` | Alle schattingen op één rij, met per regel de reden. De **gele cellen** zijn de knoppen | **ja** |
| `Retentie` | Hoe snel gebruikers afhaken (de trechter uit §3, per maand) | alleen kijken |
| `ModelBasis` | Het verwachte scenario, maand voor maand. **Onderaan het KPI-blok**: de tien getallen die ertoe doen | **ja — het KPI-blok** |
| `ModelBear` / `ModelBull` | Zelfde opbouw voor tegenvaller en meevaller | alleen KPI-blok |
| `Cohort…` | Het rekenwerk achter de gebruikersaantallen (elke maandgroep apart gevolgd) | overslaan |
| `Sensitiviteit` | Wat-als-tabellen: andere prijs, meer opzeggingen | leuk om te zien |

---

## 6 · Woordenlijst

- **MAU** — aantal mensen dat de app minstens één keer per maand opent. De maat voor "hoeveel publiek heb ik".
- **Cohort** — alle nieuwe gebruikers van één maand, als groep gevolgd. Zo zie je of de septembergroep het beter doet dan de oktobergroep.
- **Retentie** — welk deel van een groep na 1, 3, 12 maanden nog actief is. Hét getal waar dit plan op staat of valt.
- **Activatie** — deel van de downloaders dat echt begint: account + eerste show opgeslagen.
- **Churn** — opzeggers. 2,5% per maand = van elke 40 betalende galeries stopt er maandelijks één.
- **MRR** — vaste maandomzet uit abonnementen.
- **CAC** — wat het kost om één nieuwe klant/gebruiker binnen te halen.
- **LTV** — wat één klant in totaal oplevert. Gezond: LTV ruim boven CAC. Galeries: A$1.700 tegenover A$120 — uitstekend.
- **Break-even** — de maand waarin alles wat je er ooit in stak, is terugverdiend.
- **Burn** — geld dat er netto per maand uitgaat zolang kosten hoger zijn dan omzet.

---

## 7 · Als je maar vijf dingen onthoudt

1. **Gebruikers betalen nooit genoeg — galeries wel.** Een gebruiker is A$0,51 waard, een galerie A$1.700. De app is gratis voor publiek; galeries zijn de klant.
2. **Dat galeries betalen is geen hoop maar bestaand gedrag:** ze betalen vandaag al voor vermeldingen bij Art Guide en Art Almanac.
3. **Het maximale risico is klein: ~A$5.000 over drie jaar.** Daarom geen investeerder en geen lening. Je grootste investering is je avonduren.
4. **Alles hangt op terugkomers.** Downloads zijn ijdelheid; de vraag is wie er na drie maanden nog is. Daarom is week 1 van het 90-dagenplan: meten inbouwen (dat ontbreekt nu in de app).
5. **Er liggen harde afspraken met jezelf klaar** — met datums en getallen (bijv. "minder dan 8 betalende galeries op 1 juli 2027 na 60 gesprekken → stoppen met dit verdienmodel"). Zo beslist het bewijs, niet je enthousiasme.
