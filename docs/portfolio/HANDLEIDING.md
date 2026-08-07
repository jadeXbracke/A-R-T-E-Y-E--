# Handleiding — jouw fotografieportfolio

Dit portfolio vul je volledig zelf, zonder code. Alles gaat via de GitHub-website:
je uploadt foto's in mappen, en de site werkt zichzelf automatisch bij.

## Waar staat de site?

De site staat in deze repository onder `docs/portfolio/`. Zodra GitHub Pages
aanstaat, is hij bereikbaar op:

> **https://jadexbracke.github.io/D-I-S-APP-/portfolio/**

GitHub Pages aanzetten (eenmalig):

1. Ga naar je repository op github.com
2. Klik op **Settings** → **Pages** (linkermenu)
3. Bij *Build and deployment* kies je **Deploy from a branch**
4. Kies branch **main** en map **/docs**, klik **Save**
5. Na een paar minuten is de site live

## Taal

De site zelf is Engelstalig (Work, Information, Play, ...). Schrijf de
teksten die je in `config.json` invult dus ook in het Engels.

## Foto's toevoegen

1. Ga op github.com naar de map **`docs/portfolio/photos/`**
2. Open de map van de serie waar de foto bij hoort (of maak een nieuwe serie, zie hieronder)
3. Klik rechtsboven op **Add file** → **Upload files**
4. Sleep je foto's in het venster
5. Klik onderaan op **Commit changes**

Na 1 à 2 minuten staan de foto's automatisch op de site. (Een automatische
"workflow" werkt achter de schermen de fotolijst bij — daar hoef je niets voor
te doen.)

## Series (mappen)

Elke map in `photos/` wordt een serie met een eigen filterknop bovenaan de site.

- De **mapnaam** wordt de serienaam: de map `nature` wordt "Nature" op de site
  (gebruik Engelse namen, de site is Engelstalig)
- Gebruik **streepjes in plaats van spaties**: `by-the-sea` wordt "By the sea"
- Wil je de **volgorde** van series bepalen? Zet een nummer vooraan:
  `01-nature`, `02-portraits` — het nummer verdwijnt op de site

Een nieuwe serie maak je tijdens het uploaden: klik in `photos/` op
**Add file → Upload files** lukt niet direct voor een nieuwe map, gebruik dan
**Add file → Create new file** en typ als bestandsnaam bijvoorbeeld
`mijn-nieuwe-serie/tijdelijk.txt`, commit, en upload daarna je foto's in die
map (het tekstbestandje mag je daarna weer verwijderen).

## Bestandsnamen = volgorde + bijschrift

- Foto's staan **alfabetisch** op volgorde. Nummer ze om de volgorde te bepalen:
  `01-dunes.jpg`, `02-sunset.jpg`, ...
- De bestandsnaam wordt het **bijschrift** onder de foto:
  `03-evening-at-sea.jpg` → "Evening at sea"
- **Geen bijschrift?** Eindig de naam op `_x`: `04-beach_x.jpg` toont geen tekst

## Voorbeeldfoto's verwijderen

Er staan nu twee voorbeeldseries in (`01-example-series` en `02-second-series`)
met grijze oefenafbeeldingen. Verwijder ze zo:

1. Open zo'n map op github.com
2. Klik op een bestand → klik rechtsboven op het prullenbak-icoon → **Commit changes**
3. Herhaal voor alle voorbeeldbestanden (als een map leeg is, verdwijnt hij vanzelf)

## Teksten aanpassen (naam, over-mij, contact)

Open het bestand **`docs/portfolio/config.json`**, klik op het potlood-icoon
(Edit) en pas de teksten aan:

| Veld | Wat het doet |
| --- | --- |
| `naam` | Je naam bovenaan in het midden en in de titel |
| `email` | Je e-mailadres, onder het kopje "Love letters" |
| `adres` | Je adres onder het kopje "Address"; gebruik `\n` voor een nieuwe regel (bijv. `"Straat 1\n1234 AB Stad"`); leeg = niet tonen |
| `btw` | Je BTW-nummer (alleen het nummer, "BTW" komt er vanzelf voor); leeg = niet tonen |
| `kvk` | Je KVK-nummer (alleen het nummer, "KVK" komt er vanzelf voor); leeg = niet tonen |
| `instagram` | Je Instagram-naam (zonder @), onder "Social"; leeg = niet tonen |
| `linkedin` | Je LinkedIn-naam of volledige LinkedIn-link, onder "Social"; leeg = niet tonen |
| `over` | De tekst op de informatiepagina, in het Engels (een lege regel = nieuwe alinea) |
| `copyright` | De regel onderaan elke pagina |
| `rechtsklik_beveiliging` | `true` = rechtsklikken/slepen op foto's blokkeren, `false` = toestaan |

Het contactblok op de informatiepagina bouwt zichzelf op uit deze velden, in
drie kolommen: **Address** (adres + BTW + KVK), **Love letters** (e-mail) en
**Social** (Instagram + LinkedIn). Alles wat je leeg laat wordt gewoon niet
getoond — je hoeft dus niets in te vullen wat je niet wilt delen.

Klik daarna op **Commit changes** — klaar.

## Extra's die er al in zitten

- **Openingspagina** — je naam rustig gecentreerd in beeld, met je lokale
  tijd en een scroll-hint. De naam komt automatisch uit `config.json`.
- **Verdwijnend logo** — bij omlaag scrollen glijdt de balk bovenaan weg;
  scroll je omhoog, dan komt hij terug en "versmelt" hij met de foto's die
  eronderdoor schuiven (omgekeerde kleur). Het kleine logo verschijnt pas
  nadat de grote openingsnaam uit beeld is.
- **Editorial raster** — foto's staan niet in nette kolommen maar in een
  magazine-achtig ritme van groot en klein, met verspringende hoogtes en
  nummers (01, 02, ...) bij elk beeld.
- **Grid / Index** — rechtsboven de foto's kun je wisselen tussen het
  raster en een tekstlijst van al het werk; zweef je over een regel, dan
  volgt een zwevende foto je cursor. Je keuze wordt onthouden.
- **Eigen cursor** — op de werkpagina wordt de muisaanwijzer een stip die
  uitgroeit tot "View" boven foto's en indexregels.
- **Afsluiter** — onderaan elke pagina staat een ingetogen
  "Say hello"-regel die naar je e-mail linkt.
- **Speelse teksten** — subtiele knipogen door de site heen:
  "Love letters" boven je e-mailadres,
  "Have a look" als scroll-hint en "Up we go" om terug omhoog te gaan.
  Wil je andere woorden? Vraag het of pas ze aan in `index.html` /
  `info.html`.
- **Diavoorstelling** — open een foto en klik op *Play* (of druk op de
  spatiebalk); elke 3,5 seconde verschijnt de volgende foto.
- **Vegen op je telefoon** — in de fotoweergave veeg je naar links/rechts
  voor de volgende/vorige foto.
- **Deelbare series** — kies je een serie, dan verandert de link in de
  adresbalk (bijv. `#series=nature`); die link kun je direct delen.
- **Kopieerbescherming** — rechtsklikken en slepen op foto's is geblokkeerd
  (uit te zetten in `config.json`).

Tip: in de indexweergave wordt het bijschrift van een foto de grote regel.
Geef je foto's dus sprekende bestandsnamen (bijv. `01-evening-at-sea.jpg`);
foto's zonder bijschrift (`_x`) tonen daar de serienaam.

## Tips voor je foto's

- Exporteer voor het web: **JPEG**, langste zijde rond **2000–2500 pixels**,
  kwaliteit ±80%. Dan laadt de site snel en blijven je foto's scherp.
- Ondersteunde formaten: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`, `.svg`
