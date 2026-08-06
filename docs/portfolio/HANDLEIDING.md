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

- De **mapnaam** wordt de serienaam: de map `natuur` wordt "Natuur" op de site
- Gebruik **streepjes in plaats van spaties**: `aan-zee` wordt "Aan zee"
- Wil je de **volgorde** van series bepalen? Zet een nummer vooraan:
  `01-natuur`, `02-portretten` — het nummer verdwijnt op de site

Een nieuwe serie maak je tijdens het uploaden: klik in `photos/` op
**Add file → Upload files** lukt niet direct voor een nieuwe map, gebruik dan
**Add file → Create new file** en typ als bestandsnaam bijvoorbeeld
`mijn-nieuwe-serie/tijdelijk.txt`, commit, en upload daarna je foto's in die
map (het tekstbestandje mag je daarna weer verwijderen).

## Bestandsnamen = volgorde + bijschrift

- Foto's staan **alfabetisch** op volgorde. Nummer ze om de volgorde te bepalen:
  `01-duinen.jpg`, `02-zonsondergang.jpg`, ...
- De bestandsnaam wordt het **bijschrift** onder de foto:
  `03-avond-aan-zee.jpg` → "Avond aan zee"
- **Geen bijschrift?** Eindig de naam op `_x`: `04-strand_x.jpg` toont geen tekst

## Voorbeeldfoto's verwijderen

Er staan nu twee voorbeeldseries in (`01-serie-voorbeeld` en `02-tweede-serie`)
met grijze oefenafbeeldingen. Verwijder ze zo:

1. Open zo'n map op github.com
2. Klik op een bestand → klik rechtsboven op het prullenbak-icoon → **Commit changes**
3. Herhaal voor alle voorbeeldbestanden (als een map leeg is, verdwijnt hij vanzelf)

## Teksten aanpassen (naam, over-mij, contact)

Open het bestand **`docs/portfolio/config.json`**, klik op het potlood-icoon
(Edit) en pas de teksten aan:

| Veld | Wat het doet |
| --- | --- |
| `naam` | Je naam linksboven en in de titel |
| `ondertitel` | Het woord naast je naam (bijv. "Fotografie") |
| `email` | Je e-mailadres op de informatiepagina |
| `instagram` | Je Instagram-naam (zonder @); leeg = niet tonen |
| `over` | De tekst op de informatiepagina (een lege regel = nieuwe alinea) |
| `copyright` | De regel onderaan elke pagina |
| `rechtsklik_beveiliging` | `true` = rechtsklikken/slepen op foto's blokkeren, `false` = toestaan |

Klik daarna op **Commit changes** — klaar.

## Extra's die er al in zitten

- **Verdwijnend logo** — bij omlaag scrollen glijdt de balk met je naam weg;
  scroll je omhoog, dan komt hij terug en "versmelt" hij met de foto's die
  eronderdoor schuiven (het logo krijgt de omgekeerde kleur van de foto).
- **Diavoorstelling** — open een foto en klik op *Afspelen* (of druk op de
  spatiebalk); elke 3,5 seconde verschijnt de volgende foto.
- **Vegen op je telefoon** — in de fotoweergave veeg je naar links/rechts
  voor de volgende/vorige foto.
- **Deelbare series** — kies je een serie, dan verandert de link in de
  adresbalk (bijv. `#serie=natuur`); die link kun je direct delen.
- **Kopieerbescherming** — rechtsklikken en slepen op foto's is geblokkeerd
  (uit te zetten in `config.json`).

## Tips voor je foto's

- Exporteer voor het web: **JPEG**, langste zijde rond **2000–2500 pixels**,
  kwaliteit ±80%. Dan laadt de site snel en blijven je foto's scherp.
- Ondersteunde formaten: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`, `.svg`
