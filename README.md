# Avolites Legend Maker

## 👉 Web appka: **https://davidbabjarcik.github.io/avolites-legend-maker/**

Offline PWA na tvorbu legiend pre okná (workspace windows) na pultoch **Avolites Titan**. Napíšeš názvy ako text, appka z nich spraví farebné obrázkové legendy (PNG) a zároveň prehľadný textový zoznam.

## Čo vie

- **Hromadné pridanie** – jeden riadok = jedna legenda, voliteľne `TEXT | podtext | farba | šípka/ikona`, zalomenie riadku `//`
  ```
  R
  MAG | | magenta
  R+W | | red+white
  FAN OUT
  | | | up
  STROBE | FX | | ⚡
  ```
- **Machuľa ako fixkou** – farba ako načmáraná škvrna na priehľadnom pozadí, navrchu biele písmeno (R, G, B…) s obrysom – ako farebné palety v Titane
- **Viac farieb** – `red+blue+white` spraví pruhy (aj v machuli)
- **Šípky pre pozície** – kreslené vektorovo: hore, dole, vľavo, vpravo, šikmo, hore-dole, do strán, stred/cieľ, fan out, fan in, kríž, do publika, na podlahu, do neba, kruh/ballyhoo. Pri kategórii Position a FX sa šípka vyberie sama podľa názvu (`FAN OUT`, `CENTER`, `AUDIENCE`, `MOVE LEFT`…). Bez textu je šípka cez celú legendu.
- **Písané fonty** – Fixka (Permanent Marker), Rukopis (Caveat, Kalam), Paličkové (Patrick Hand), Krasopis (Dancing Script) + klasické tlačené
- **Obdĺžnikové legendy** – 160 × 72 (ako tlačidlo v Titane), 320 × 144, 160 × 100, 128 × 64, štvorec alebo vlastný rozmer
- **Automatická farba podľa názvu** – RED, BLUE, CTO, CTB, UV, AMBER, skratky R/G/B/MAG… aj po slovensky (červená, modrá, teplá biela…)
- **Štýly** – podľa kategórie (farby = machuľa, pozície/efekty = priehľadné), machuľa, priehľadná, celá farba, tmavá s pásom, tmavá s rámom; dá sa nastaviť aj pre každú legendu zvlášť
- **Kategórie**: Playback, Color, Position, Gobo, Beam, Effect/FX, Macro, Fixture group
- **Náhľad okna** – mriežka ako vo workspace okne, nastaviteľný počet stĺpcov
- **Vzhľad** – tučné, VEĽKÉ PÍSMENÁ, číslo v rohu, ikona (emoji)
- **Export**
  - všetky PNG naraz v `.zip` (súbory `001_WASH_RED.png`…, + `legendy.txt`)
  - jedna PNG cez ⬇ pri legende
  - textový zoznam `.txt`, tabuľka `.csv` (Excel), tlač / PDF
- **Projekt** – automaticky sa ukladá v prehliadači, dá sa uložiť/otvoriť ako `.json`
- **PWA** – inštalácia na mobil, tablet aj PC, funguje offline

## Ako dostať legendy do Titanu

1. V appke daj **Stiahnuť všetky PNG (.zip)** a rozbaľ ich na USB kľúč.
2. Na pulte vlož USB, na tlačidle/okienku daj **Set Legend** a vyber obrázok (Picture / Legend editor → Import).
3. Legenda je obdĺžnik – začni s 160 × 72; ak je na pulte rozmazaná alebo zle orezaná, skús iný rozmer. Machuľa a priehľadný štýl majú priehľadné pozadie, takže na pulte presvitá farba tlačidla.

> Presné menu sa líši podľa verzie Titanu – pozri manuál Avolites k „Legends“.

## Spustenie lokálne

Service worker potrebuje `http://localhost` alebo HTTPS:

```bash
python -m http.server 8080
```

Potom otvor http://localhost:8080.

## Štruktúra

```
index.html             rozhranie
css/style.css          vzhľad
js/app.js              logika appky (zoznam, nastavenia, export)
js/render.js           kreslenie legendy do canvasu, machuľa, farby podľa názvu, fonty
js/arrows.js           kreslené šípky pre pozície
js/zip.js              jednoduchý ZIP bez knižníc
sw.js                  offline cache
manifest.webmanifest   PWA manifest
icons/                 ikony (generuje tools/make_icons.py)
```

Bez závislostí a bez build kroku – čisté HTML/CSS/JS. Písané fonty sa načítajú z Google Fonts a po prvom spustení sa uložia do cache (offline). Postavil Claude.
