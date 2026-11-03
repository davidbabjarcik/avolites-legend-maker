/* Kreslené šípky a symboly pre pozície (Position palety). Kreslia sa vektorovo, takže sú ostré v každej veľkosti. */

export const ARROWS = {
  up:        { label: 'Hore',            char: '↑' },
  down:      { label: 'Dole',            char: '↓' },
  left:      { label: 'Vľavo',           char: '←' },
  right:     { label: 'Vpravo',          char: '→' },
  ul:        { label: 'Hore vľavo',      char: '↖' },
  ur:        { label: 'Hore vpravo',     char: '↗' },
  dl:        { label: 'Dole vľavo',      char: '↙' },
  dr:        { label: 'Dole vpravo',     char: '↘' },
  updown:    { label: 'Hore-dole',       char: '↕' },
  leftright: { label: 'Do strán',        char: '↔' },
  center:    { label: 'Stred / cieľ',    char: '◎' },
  fanout:    { label: 'Fan out (vejár)', char: '⋎' },
  fanin:     { label: 'Fan in',          char: '⋏' },
  cross:     { label: 'Kríž (X)',        char: '✕' },
  audience:  { label: 'Do publika',      char: '⇣' },
  floor:     { label: 'Na podlahu',      char: '⤓' },
  sky:       { label: 'Do neba',         char: '⤒' },
  circle:    { label: 'Kruh / ballyhoo', char: '⟳' },
};

// Kľúčové slová v názve (bez diakritiky). Dlhšie výrazy sú prvé.
const WORDS = [
  ['fan out', 'fanout'], ['fanout', 'fanout'], ['fan in', 'fanin'], ['fanin', 'fanin'],
  ['up left', 'ul'], ['up right', 'ur'], ['down left', 'dl'], ['down right', 'dr'],
  ['hore vlavo', 'ul'], ['hore vpravo', 'ur'], ['dole vlavo', 'dl'], ['dole vpravo', 'dr'],
  ['ballyhoo', 'circle'], ['circle', 'circle'], ['kruh', 'circle'],
  ['audience', 'audience'], ['crowd', 'audience'], ['publikum', 'audience'], ['divaci', 'audience'],
  ['floor', 'floor'], ['podlaha', 'floor'], ['zem', 'floor'],
  ['sky', 'sky'], ['nebo', 'sky'], ['strop', 'sky'], ['ceiling', 'sky'],
  ['cross', 'cross'], ['kriz', 'cross'],
  ['center', 'center'], ['centre', 'center'], ['stred', 'center'], ['mid', 'center'],
  ['spread', 'leftright'], ['wide', 'leftright'],
  ['up', 'up'], ['hore', 'up'], ['top', 'up'],
  ['down', 'down'], ['dole', 'down'],
  ['left', 'left'], ['vlavo', 'left'],
  ['right', 'right'], ['vpravo', 'right'],
];

const CHAR_TO_KIND = Object.fromEntries(Object.entries(ARROWS).map(([k, v]) => [v.char, k]));

const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** "up", "↑", "fan out"… → kľúč šípky alebo null */
export function parseArrow(value) {
  const v = String(value || '').trim();
  if (!v) return null;
  if (CHAR_TO_KIND[v]) return CHAR_TO_KIND[v];
  const t = strip(v).replace(/[^a-z]+/g, '');
  if (ARROWS[t]) return t;
  return arrowFromName(v);
}

export function arrowFromName(text) {
  const t = ' ' + strip(text).replace(/[^a-z0-9]+/g, ' ') + ' ';
  for (const [word, kind] of WORDS) {
    if (t.includes(' ' + word + ' ')) return kind;
  }
  return null;
}

/** item.arrow: '' = automaticky (len pri kategórii Position), 'none' = bez šípky, inak konkrétna šípka */
export function resolveArrow(item) {
  if (item.arrow === 'none') return null;
  if (item.arrow && ARROWS[item.arrow]) return item.arrow;
  if (item.cat === 'position' || item.cat === 'effect') return arrowFromName(item.text || '');
  return null;
}

/* ---------- kreslenie ---------- */

function arrowLine(ctx, x1, y1, x2, y2, s) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const head = s * 0.26;
  const back = head * 0.75;
  // čiara končí pred hrotom, aby hrot bol ostrý
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(ang) * back, y2 - Math.sin(ang) * back);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(ang - 0.5) * head, y2 - Math.sin(ang - 0.5) * head);
  ctx.lineTo(x2 - Math.cos(ang) * back, y2 - Math.sin(ang) * back);
  ctx.lineTo(x2 - Math.cos(ang + 0.5) * head, y2 - Math.sin(ang + 0.5) * head);
  ctx.closePath();
  ctx.fill();
}

function dot(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Spread pre kruh: N krúžkov, v každom bodka posunutá o 360°/N – vidno fázový posun medzi skupinami.
 * Kreslí sa do boxu w × h so stredom (cx, cy).
 */
export function drawSpreadCircles(ctx, n, cx, cy, w, h, color) {
  // rozloženie do mriežky, ktoré najlepšie vyplní box
  let best = { cols: n, rows: 1, cell: 0 };
  for (let rows = 1; rows <= n; rows++) {
    const cols = Math.ceil(n / rows);
    const cell = Math.min(w / cols, h / rows);
    if (cell > best.cell) best = { cols, rows, cell };
  }
  const { cols, rows, cell } = best;
  const R = cell * 0.36;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, cell * 0.08);
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const inRow = row === rows - 1 ? n - row * cols : cols; // posledný riadok vycentrujeme
    const col = i - row * cols;
    const x = cx + (col - (inRow - 1) / 2) * cell;
    const y = cy + (row - (rows - 1) / 2) * cell;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.stroke();
    const a = -Math.PI / 2 + (i * Math.PI * 2) / n;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * R, y + Math.sin(a) * R, Math.max(2, cell * 0.11), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Nakreslí symbol do štvorca so stredom (cx, cy) a stranou s. */
export function drawArrow(ctx, kind, cx, cy, s, color) {
  const r = s / 2;
  const L = r * 0.82;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.11);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const dirs = {
    up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
    ul: [-0.707, -0.707], ur: [0.707, -0.707], dl: [-0.707, 0.707], dr: [0.707, 0.707],
  };

  if (dirs[kind]) {
    const [dx, dy] = dirs[kind];
    // malý "reflektor" na začiatku šípky
    dot(ctx, cx - dx * L * 0.85, cy - dy * L * 0.85, s * 0.09);
    arrowLine(ctx, cx - dx * L * 0.6, cy - dy * L * 0.6, cx + dx * L, cy + dy * L, s);
  } else if (kind === 'updown') {
    arrowLine(ctx, cx, cy, cx, cy - L, s);
    arrowLine(ctx, cx, cy, cx, cy + L, s);
    dot(ctx, cx, cy, s * 0.09);
  } else if (kind === 'leftright') {
    arrowLine(ctx, cx, cy, cx - L, cy, s);
    arrowLine(ctx, cx, cy, cx + L, cy, s);
    dot(ctx, cx, cy, s * 0.09);
  } else if (kind === 'center') {
    ctx.lineWidth = Math.max(2, s * 0.08);
    ctx.beginPath();
    ctx.arc(cx, cy, L * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    dot(ctx, cx, cy, s * 0.11);
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * L * 0.8, cy + dy * L * 0.8);
      ctx.lineTo(cx + dx * L * 1.05, cy + dy * L * 1.05);
      ctx.stroke();
    }
  } else if (kind === 'fanout' || kind === 'fanin') {
    // tri lúče z jedného bodu dole (out) alebo zbiehajúce sa do bodu hore (in)
    const base = { x: cx, y: cy + L * 0.85 };
    const tip = { x: cx, y: cy - L * 0.95 };
    ctx.lineWidth = Math.max(2, s * 0.09);
    for (const a of [-0.62, 0, 0.62]) {
      if (kind === 'fanout') {
        const ex = base.x + Math.sin(a) * L * 1.75;
        const ey = base.y - Math.cos(a) * L * 1.75;
        arrowLine(ctx, base.x, base.y, ex, ey, s * 0.8);
      } else {
        const sx = tip.x + Math.sin(a) * L * 1.75;
        const sy = tip.y + Math.cos(a) * L * 1.75;
        arrowLine(ctx, sx, sy, tip.x + Math.sin(a) * L * 0.18, tip.y + L * 0.16, s * 0.8);
      }
    }
    dot(ctx, kind === 'fanout' ? base.x : tip.x, kind === 'fanout' ? base.y : tip.y, s * 0.1);
  } else if (kind === 'cross') {
    ctx.lineWidth = Math.max(2, s * 0.09);
    arrowLine(ctx, cx - L * 0.85, cy + L * 0.85, cx + L * 0.85, cy - L * 0.85, s * 0.85);
    arrowLine(ctx, cx + L * 0.85, cy + L * 0.85, cx - L * 0.85, cy - L * 0.85, s * 0.85);
    dot(ctx, cx - L * 0.85, cy + L * 0.85, s * 0.09);
    dot(ctx, cx + L * 0.85, cy + L * 0.85, s * 0.09);
  } else if (kind === 'audience') {
    arrowLine(ctx, cx, cy - L, cx, cy + L * 0.2, s);
    for (const dx of [-0.65, 0, 0.65]) dot(ctx, cx + dx * L, cy + L * 0.82, s * 0.1);
  } else if (kind === 'floor') {
    arrowLine(ctx, cx, cy - L, cx, cy + L * 0.55, s);
    ctx.beginPath();
    ctx.moveTo(cx - L, cy + L * 0.9);
    ctx.lineTo(cx + L, cy + L * 0.9);
    ctx.stroke();
  } else if (kind === 'sky') {
    arrowLine(ctx, cx, cy + L * 0.75, cx, cy - L * 0.45, s);
    ctx.beginPath();
    ctx.moveTo(cx - L, cy - L * 0.9);
    ctx.lineTo(cx + L, cy - L * 0.9);
    ctx.stroke();
  } else if (kind === 'circle') {
    const R = L * 0.75;
    const a0 = -Math.PI * 0.35;
    const a1 = a0 + Math.PI * 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, R, a0, a1);
    ctx.stroke();
    // hrot na konci oblúka, v smere pohybu (dotyčnica)
    const ex = cx + Math.cos(a1) * R;
    const ey = cy + Math.sin(a1) * R;
    const tx = -Math.sin(a1);
    const ty = Math.cos(a1);
    arrowLine(ctx, ex - tx * s * 0.05, ey - ty * s * 0.05, ex + tx * s * 0.2, ey + ty * s * 0.2, s);
    dot(ctx, cx, cy, s * 0.07);
  }
  ctx.restore();
}
