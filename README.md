# Avolites Legend Maker

## 👉 Web appka: **https://davidbabjarcik.github.io/avolites-legend-maker/**

Offline PWA na tvorbu legiend pre okná (workspace windows) na pultoch **Avolites Titan**. Napíšeš názvy ako text, appka z nich spraví farebné obrázkové legendy (PNG) a zároveň prehľadný textový zoznam.

## Čo vie

- **Hromadné pridanie** – jeden riadok = jedna legenda, voliteľne `TEXT | podtext | farba | ikona`, zalomenie riadku `//`
  ```
  WASH RED
  STROBE | FX | | ⚡
  FRONT // WARM | Pos 1
  GOBO 3 | | #7d3cc8
  ```
- **Automatická farba podľa názvu** – RED, BLUE, CTO, CTB, UV, AMBER… aj po slovensky (červená, modrá, tepla biela…)
- **Kategórie** s vlastnou farbou: Playback, Color, Position, Gobo, Beam, Effect/FX, Macro, Fixture group
- **Náhľad okna** – mriežka ako vo workspace okne, nastaviteľný počet stĺpcov
- **Vzhľad** – veľkosť 64 / 128 / 256 / 512 px, celá farba / tmavá s pásom / tmavá s rámom, písmo, tučné, VEĽKÉ PÍSMENÁ, číslo v rohu, ikona (emoji)
- **Export**
  - všetky PNG naraz v `.zip` (súbory `001_WASH_RED.png`…, + `legendy.txt`)
  - jedna PNG cez ⬇ pri legende
  - textový zoznam `.txt`, tabuľka `.csv` (Excel), tlač / PDF
- **Projekt** – automaticky sa ukladá v prehliadači, dá sa uložiť/otvoriť ako `.json`
- **PWA** – inštalácia na mobil, tablet aj PC, funguje offline

## Ako dostať legendy do Titanu

1. V appke daj **Stiahnuť všetky PNG (.zip)** a rozbaľ ich na USB kľúč.
2. Na pulte vlož USB, na tlačidle/okienku daj **Set Legend** a vyber obrázok (Picture / Legend editor → Import).
3. Odporúčaná veľkosť je 128 × 128; ak je legenda na pulte rozmazaná alebo malá, skús inú veľkosť.

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
js/render.js           kreslenie legendy do canvasu, farby podľa názvu
js/zip.js              jednoduchý ZIP bez knižníc
sw.js                  offline cache
manifest.webmanifest   PWA manifest
icons/                 ikony (generuje tools/make_icons.py)
```

Bez závislostí a bez build kroku – čisté HTML/CSS/JS. Postavil Claude.
