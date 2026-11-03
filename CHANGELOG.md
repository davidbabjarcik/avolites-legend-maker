# Changelog

## v4.1 – 2026-11-03
- Štítok fixtúry/spreadu je väčší a čitateľnejší: čierny s bielym okrajom, hrubé písmo
- Machuľa a priehľadné legendy nechajú štítku vlastný pruh hore, takže sa neprekrývajú
- Dlhý štítok (napr. `LED BAR · ×2`) sa radšej zmenší, než aby sa orezal

## v4 – 2026-11-03
- **Fixtúra** – štítok v pravom hornom rohu (SPOT, WASH, BEAM, LED BAR…), dá sa nastaviť pre každú legendu alebo naraz pri pridávaní
- **Spread** – pri kruhu (circle) sa nakreslí 2 / 4 / 6 / 8… krúžkov a bodka v každom je posunutá podľa fázy; pri ostatných efektoch je v štítku `×N`
- Hromadný zápis: `TEXT | podtext | farba | šípka/ikona | fixtúra | spread`, spread aj skratkou `CIRCLE x4`
- Fixtúra a spread sú aj v exporte `.txt` a `.csv`

## v3 – 2026-11-03
- **Machuľa ako fixkou** – farebná škvrna na priehľadnom pozadí s bielym písmenom (R, G, B…), ako farebné palety v Titane
- **Viac farieb** – `red+blue` spraví pruhy
- **Šípky pre pozície** – hore, dole, do strán, šikmo, fan out/in, stred, kríž, do publika, na podlahu, do neba, kruh; pri Position/FX sa vyberú samy podľa názvu
- Štýl „Podľa kategórie“ (farby = machuľa, pozície/efekty = priehľadné) a štýl pre každú legendu zvlášť
- Skratky farieb R, G, B, MAG, AMB…

## v2 – 2026-11-03
- **Obdĺžnikové legendy** – predvolene 160 × 72, ďalšie rozmery aj vlastný
- **Písané fonty** – Fixka (Permanent Marker), Rukopis (Caveat, Kalam), Paličkové (Patrick Hand), Krasopis (Dancing Script)

## v1 – 2026-11-03
- Prvá verzia: zoznam legiend, hromadné pridanie z textu, farba podľa názvu, kategórie, náhľad okna
- Export PNG (jednotlivo aj ZIP), `.txt`, `.csv`, tlač/PDF, uloženie projektu `.json`
- PWA – inštalácia a offline režim
