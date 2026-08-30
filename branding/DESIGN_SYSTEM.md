# ARTEYE — Design System

Referentiedocument voor iedereen (en elke Claude Code-sessie) die iets bouwt,
ontwerpt of schrijft namens ARTEYE — product-UI, marketing, social, of
zakelijke communicatie. Alles hieronder is afgeleid uit de daadwerkelijke
broncode (`art-eye/src/theme.ts`, `art-eye/src/components/ui.tsx`, de
app-schermen) en de bestaande merkassets in `branding/`, niet verzonnen.
Waar iets een uitbreiding is naar een context die de app zelf niet dekt
(marketing, zakelijke mail), staat dat expliciet vermeld als richtlijn, niet
als "dit staat al zo in de code".

Zie ook: `CLAUDE.md` (repo-root) voor de harde regels over welke branch
leidend is en hoe de site gebouwd wordt — dit document gaat alleen over merk,
vorm en stem.

---

## 1. Het merk in het kort

**De naam draagt het merk — geen tagline nodig.** ARTEYE staat op zichzelf.
(De regel "Your eye on the art world" komt uit bestaande app-copy — README,
auth-scherm — en blijft daar prima staan als productzin, maar is niet de
merkkern. Leid nergens mee met die tagline als merkbelofte; leid met de
naam.)

ARTEYE is een editorial agenda voor tentoonstellingen in Sydney — geen
algoritme-feed, geen advertentieplatform. Musea en galeries op één plek,
door een redactie gecureerd ("elke inzending wordt beoordeeld voordat hij
de agenda haalt"), met een persoonlijk **Curator**-profiel waar bezoekers
bijhouden wat ze gezien hebben.

Drie woorden die het merk dragen: **redactioneel, precies, Sydney-specifiek.**
Niet: speels, druk, algemeen "kunst wereldwijd".

## 2. Logo

- De wordmark **ARTEYE** is een beeldasset, geen font:
  `art-eye/assets/logo-arteye.png` (custom, extra-brede letterletters,
  1:1 gevectoriseerd naar SVG in `branding/`). **Nooit** naveranderen met
  Montserrat of een ander lettertype — die "rebrand" (PR #15–17) is
  losgelaten.
- De subline **SYDNEY** eronder staat in Archivo Medium
  (`fonts.monoMedium`), hoofdletters, letter-spaced.
- Kleur: inkt `#131211` op wit. Elke SVG-variant gebruikt `currentColor`,
  dus wit-op-donker kan (bijv. voor een donkere achtergrond of stickers).
- Varianten, allemaal in `branding/`:

  | Bestand | Gebruik |
  | --- | --- |
  | `logo-primary.svg` | ARTEYE + SYDNEY — de header-lockup |
  | `logo-wordmark.svg` | alleen de wordmark |
  | `logo-horizontal.svg` | één regel met hairline-scheiding |
  | `monogram-ae.svg` | AE-monogram, vrijstaand |
  | `monogram-ae-circle.svg` / `monogram-ae-square.svg` | AE in cirkel / vierkant (stempel) |
  | `sticker-circle.svg` | ronde sticker-badge |
  | `tile-ae-ink.svg` | app-icoon / favicon (wit op inkt) |

  Open `branding/index.html` voor het volledige visuele overzicht.

## 3. Kleur

Eén palet, uit `art-eye/src/theme.ts`. Geen andere kleuren toevoegen zonder
dit bestand aan te passen.

| Token | Hex | Rol |
| --- | --- | --- |
| `bg` / `white` | `#FFFFFF` | ondergrond — bijna alles is wit |
| `ink` | `#131211` | de enige tekstkleur, ook voor "secundaire" tekst |
| `grey` | `#7B766D` | uitsluitend placeholders en dunne grafische randen — nooit lopende tekst |
| `hairline` | `#E4E1DB` | dunne scheidingslijnen |
| `red` | `#C22F1E` | gereserveerd grafisch accent — seen-dot, rating-dots, "opening night"-tags, actieve underline. Eén kleur, spaarzaam, nooit decoratief |
| `scrim` | `rgba(19,18,17,0.28)` | transparante overlay op modals/foto's |

Vuistregel: **wit veld, zwarte inkt, één rode stip als het moet.** Geen
kleurverloop, geen tweede accentkleur, geen "brand blue". Als iets kleur
nodig heeft om te functioneren (status, fout), gebruik dan tekst/label in
inkt, niet een nieuwe kleur.

## 4. Typografie

Eén familie voor de hele merkuiting: **Archivo.** (De oudere lezing met
Cormorant Garamond-cursief en IBM Plex Mono, zoals nog in een verouderde
paragraaf van `art-eye/README.md` staat, is losgelaten — `theme.ts` is
hierin leidend en zegt expliciet: *"Every former role (sans / serif / mono)
resolves to an Archivo weight. No italics anywhere."*)

| Rol | Gewicht | Casing | Letter-spacing | Gebruik |
| --- | --- | --- | --- | --- |
| Display / heading | Archivo Light (300) | HOOFDLETTERS | breed (1.6–3) | tentoonstellings- en paginatitels |
| Hero (op donker) | Archivo Light (300), wit | HOOFDLETTERS | breed | hero-koppen op foto/donkere ondergrond |
| Body | Archivo Regular (400) | gewone zin | geen | lopende tekst, reflecties, bio's |
| Label / kicker | Archivo Regular of Medium | HOOFDLETTERS | 1–2.4 | data, venue-regels, veldlabels, tab-bar |
| Knop | Archivo Medium (500) | HOOFDLETTERS | 2 | button-tekst |

Twee registers, altijd naast elkaar: **brede hoofdletters voor structuur
(titels, labels, knoppen)** tegenover **rustige onderkast voor inhoud**
(lopende tekst, reflecties). Nooit cursief. Nooit een tweede lettertype.

## 5. Vorm, ruimte en lay-out

- **Vierkante hoeken overal.** De enige cirkels in het hele systeem zijn
  bewust: de seen-dot, rating-dots en avatars. Geen afgeronde kaarten,
  geen afgeronde knoppen, geen afgeronde inputvelden.
- **Geen schaduwen, geen elevation.** Diepte komt alleen van dunne lijnen
  (`hairline`, `#E4E1DB`) en van inkt-omlijning (1px `#131211`) — niet van
  drop shadows.
- **Spacing-schaal** (`theme.ts`): `4 / 8 / 16 / 24 / 32 / 48`, met een
  vaste pagina-marge van `20`. Gebruik deze stappen, geen tussenmaten.
- **Hairline als scheidingsteken**: een 1px lijn in `#E4E1DB` tussen header
  en inhoud, tussen secties — het belangrijkste structurerende element na
  witruimte.

## 6. Componenten — de basisvocabulaire

Geen los ontworpen componenten per feature; alles bouwt voort op dezelfde
paar bouwstenen:

- **InkBar** — volle-breedte, effen inkt-balk (56px), witte hoofdletter-
  label. Dé primaire actie (aanmelden, opslaan).
- **MonoLink** — tekst met een dunne regel eronder die van hairline naar
  inkt verspringt zodra actief. Secundaire/toggle-acties.
- **ActionBar** — rij gelijke cellen binnen één inkt-rand, met inkt-
  scheidingslijnen ertussen. Gegroepeerde acties.
- **Hairline** — de standaard sectiescheiding, overal.
- **Field** — label in kicker-stijl boven een input met alleen een
  onderrand (geen kader, geen radius).
- Kaarten (exhibition rows/grid) hebben geen rand, geen schaduw, geen
  radius — beeld, dan mono-datum, dan hoofdletter-titel, dan artiestregel.
  Interactie is een subtiele "lift" (schaal 1.015 bij hover), geen
  hover-schaduw of kleurverandering.

Vuistregel voor nieuwe UI: **als het geen InkBar, MonoLink, ActionBar,
Hairline of Field is, vraag je af of het wel nodig is.**

## 7. Tone of voice

De stem is **redactioneel-terse, warm zonder overdrijving, gallery-register
zonder jargon.** Twee registers wisselen elkaar af, net als in de
typografie: korte, feitelijke hoofdletter-labels naast rustige, persoonlijke
onderkast-zinnen.

Kernprincipes, afgeleid uit de bestaande copy in de app:

1. **Kort, dan klaar.** Geen opvulzinnen, geen "we hope you enjoy". Zie de
   bevestiging na een inzending: *"Received, with thanks. Your submission
   is with our editors and will appear in the agenda once approved."* —
   twee zinnen, geen emoji, geen uitroepteken.
2. **Specifiek boven generiek.** Nooit "no results found" zonder context.
   Vergelijk: *"Nothing here just now. The agenda turns over weekly — check
   back soon."* of *"No venues match this selection."* — altijd het "waarom"
   of "wat nu" erbij, in dezelfde zin.
3. **Persoonlijk bezit, geen account-taal.** Het gaat niet om "je profiel",
   maar om *"your record"*: *"Every exhibition you see becomes part of your
   record — your eye on the art world, kept."* Bezit en herinnering, geen
   CRM-taal.
4. **Redactioneel gezag, zonder poeha.** *"Sydney exhibitions only — each
   submission is reviewed before it joins the agenda."* Het merk curateert;
   zeg dat gewoon, zonder het te verkopen.
5. **Nooit vullend vrolijk.** Geen "Oops!", geen "Let's get started!". Leeg
   is gewoon leeg: *"Not following anyone yet."* / *"No followers yet."*
6. **Instructie in de bijzin, niet als aparte marketing-regel.** *"Sign in
   to follow friends and see what they're viewing."* — actie en reden in
   één zin, geen losse CTA-banner erboven.
7. **Labels schreeuwen niet, ze structureren.** Hoofdletters zijn voor
   navigatie en categorieën (AGENDA, VENUES, FEED, SAVED, CURATOR,
   `SEARCH — ARTISTS, SHOWS, VENUES`), niet voor nadruk in lopende tekst.

**Do**
- Twee zinnen is vaak genoeg.
- Zeg wat er ontbreekt én wanneer dat verandert ("check back soon", "will
  wait for you here").
- Gebruik "your" — het is altijd hun agenda, hun record, hun stad.
- Sydney is nooit "onze stad" met trots, gewoon de gegeven context.

**Don't**
- Geen uitroeptekens, geen emoji, geen "Oops"/"Yay"/"Awesome".
- Geen vage lege staten ("No data available") zonder vervolg.
- Geen marketing-superlatieven ("the best", "amazing", "must-see") — de
  redactie oordeelt, de tekst hoeft niet te overtuigen.
- Geen jargon uit growth/CRM ("engage", "unlock", "boost").

### 7.1 Product-UI (het hoofdregister)

Dit is het register hierboven, ongewijzigd: knoppen, lege staten,
foutmeldingen, bevestigingen. Toets elke nieuwe UI-tekst aan de zeven
principes en, waar mogelijk, aan een bestaande regel uit sectie 5 van het
onderzoek hierboven (bijv. bevestigingen volgen het patroon van de
submit-flow: wat is ontvangen → wat gebeurt er nu).

### 7.2 Marketing & social (uitbreiding — geen bestaande copy, wel dezelfde stem)

De app zelf heeft geen marketing-copy; onderstaande is een richtlijn om
diezelfde stem consistent door te trekken naar bijvoorbeeld de "Sydney
Edit"-achtige curatoriale posts of nieuwsbriefregels:

- Behandel elke post als een agenda-item, niet als een advertentie: titel
  van de tentoonstelling/venue in hoofdletters, dan één redactionele zin
  in onderkast — geen call-to-action-taal ("Don't miss out!").
  Voorbeeldtoon: *"KHALED SABSABI — ART GALLERY OF NSW. On now, and worth
  the walk through the new wing."*
- Curatorial, niet promotioneel: het merk vertelt wat de moeite waard is,
  het overtuigt niet. Vermijd superlatieven; benoem het specifieke detail
  dat het de moeite waard maakt.
- Sydney blijft impliciet aanwezig (venue-namen, buurten), niet expliciet
  bejubeld.
- Geen emoji, geen hashtags-spam; als een hashtag nodig is, houd het tot
  één, functioneel (bijv. #SydneyEdit).

### 7.3 Zakelijk / extern (uitbreiding — venues, curatoren, partnerships)

Voor mails naar galeries/musea, reviewbeslissingen, of partnerschap-
communicatie: dezelfde terse-warme toon, maar met iets meer expliciete
beleefdheid omdat het één-op-één communicatie is, niet UI-copy:

- Kom snel ter zake, in twee tot drie zinnen: wat is de status, wat is de
  volgende stap. Geen lange inleidingen.
- Erken het werk van de ander zonder overdrijving: "Thanks for sending
  this through" in plaats van "We're so excited about your show!".
  Herstel voortdurend de basistoon: informerend, niet verkopend.
  Beslissingen (afwijzing/acceptatie van een inzending) direct benoemen,
  gevolgd door de reden in één zin — geen omfloerste taal.
- Sign-offs kort en zonder overbodige formaliteit: naam + "ARTEYE" volstaat,
  geen "Kind regards, Team ARTEYE!!".

## 8. Zo gebruik je dit document

- **Voor Claude Code / development**: lees dit naast `CLAUDE.md` voordat je
  UI-copy, een nieuw scherm, of een merkasset toevoegt. Kleur- en
  typografie-tokens komen altijd uit `art-eye/src/theme.ts` — dit document
  legt uit *waarom* die tokens zo zijn, `theme.ts` blijft de technische bron.
- **Voor marketing/social/zakelijk**: sectie 7 is het uitgangspunt; er is
  geen aparte copydeck nodig — toets nieuwe tekst aan de zeven principes.
- Kom je een tegenstrijdigheid tegen tussen dit document en de code (zoals
  de verouderde typografie-paragraaf in `art-eye/README.md`), dan is de
  code (`theme.ts`, de daadwerkelijke schermen) leidend, niet oudere
  documentatie.
