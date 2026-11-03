import { resolveArrow, drawArrow, drawSpreadCircles } from './arrows.js';

/* Kreslenie jednej legendy do canvasu. Bez závislostí, používa sa v appke aj pri exporte. */

export const CATEGORIES = {
  playback: { label: 'Playback',     color: '#3a3f47' },
  color:    { label: 'Color',        color: '#c0392b' },
  position: { label: 'Position',     color: '#1f6fd1' },
  gobo:     { label: 'Gobo',         color: '#7d3cc8' },
  beam:     { label: 'Beam',         color: '#118a7e' },
  effect:   { label: 'Effect / FX',  color: '#e67e22' },
  macro:    { label: 'Macro',        color: '#2e8b3a' },
  group:    { label: 'Fixture group', color: '#b8960b' },
};

// Názvy farieb (EN + SK bez diakritiky). Dlhšie výrazy sú prvé, aby "warm white" vyhralo nad "white".
const COLOR_WORDS = [
  ['warm white', '#ffd9a0'], ['cold white', '#e0ecff'], ['cool white', '#e0ecff'],
  ['tepla biela', '#ffd9a0'], ['studena biela', '#e0ecff'],
  ['red', '#ff1a1a'], ['cervena', '#ff1a1a'],
  ['green', '#00c030'], ['zelena', '#00c030'],
  ['blue', '#0040ff'], ['modra', '#0040ff'],
  ['cyan', '#00e5ff'], ['tyrkysova', '#00e5ff'],
  ['magenta', '#ff00d0'], ['purpurova', '#ff00d0'],
  ['yellow', '#ffe000'], ['zlta', '#ffe000'],
  ['amber', '#ffb000'], ['jantarova', '#ffb000'],
  ['orange', '#ff7000'], ['oranzova', '#ff7000'],
  ['pink', '#ff6eb4'], ['ruzova', '#ff6eb4'],
  ['lavender', '#b48cff'], ['levandulova', '#b48cff'],
  ['violet', '#8000ff'], ['purple', '#8000ff'], ['fialova', '#8000ff'],
  ['uv', '#5a00d0'], ['congo', '#3a00a0'], ['lime', '#a0ff00'],
  ['cto', '#ffc58a'], ['ctb', '#cfe3ff'],
  ['white', '#ffffff'], ['biela', '#ffffff'],
  ['black', '#000000'], ['cierna', '#000000'],
  // skratky ako na pultoch: R, G, B, MAG, AMB…
  ['mag', '#ff00d0'], ['cyn', '#00e5ff'], ['yel', '#ffe000'], ['grn', '#00c030'], ['blu', '#0040ff'],
  ['amb', '#ffb000'], ['org', '#ff7000'], ['pnk', '#ff6eb4'], ['lav', '#b48cff'], ['wht', '#ffffff'],
  ['r', '#ff1a1a'], ['o', '#ff7000'], ['y', '#ffe000'], ['g', '#00c030'], ['c', '#00e5ff'],
  ['b', '#0040ff'], ['m', '#ff00d0'], ['w', '#ffffff'], ['a', '#ffb000'], ['p', '#ff6eb4'],
];

const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function colorFromName(text) {
  const t = ' ' + strip(text).replace(/[^a-z0-9]+/g, ' ') + ' ';
  for (const [word, hex] of COLOR_WORDS) {
    if (t.includes(' ' + word + ' ')) return hex;
  }
  return null;
}

export function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export const contrastText = (hex) => (luminance(hex) > 0.36 ? '#000000' : '#ffffff');

/** Výsledná farba pozadia legendy: ručne zadaná > podľa názvu > podľa kategórie. */
export function legendColor(item, settings) {
  if (item.bg) return item.bg;
  if (settings.autoColor) {
    const c = colorFromName(item.text);
    if (c) return c;
  }
  return (CATEGORIES[item.cat] || CATEGORIES.playback).color;
}

/** Všetky farby legendy (viac farieb = pruhy). */
export function legendColors(item, settings) {
  if (Array.isArray(item.colors) && item.colors.length > 1) return item.colors;
  return [legendColor(item, settings)];
}

export const STYLES = {
  auto: 'Podľa kategórie',
  scribble: 'Machuľa (fixka)',
  clear: 'Priehľadná (len kresba)',
  fill: 'Celá farba',
  bar: 'Tmavá + farebný pás',
  frame: 'Tmavá + farebný rám',
};

const CAT_STYLE = { color: 'scribble', position: 'clear', gobo: 'clear', beam: 'clear', effect: 'clear' };

export function resolveStyle(item, settings) {
  const st = item.style || settings.style || 'auto';
  if (st !== 'auto') return st;
  return CAT_STYLE[item.cat] || 'fill';
}

export const FONTS = {
  sans: 'Arial, Helvetica, sans-serif',
  condensed: '"Arial Narrow", "Roboto Condensed", sans-serif-condensed, Arial, sans-serif',
  impact: 'Impact, "Arial Black", sans-serif',
  mono: 'Consolas, "Courier New", monospace',
  // písané fonty (Google Fonts, pri prvom spustení sa stiahnu a potom fungujú offline)
  marker: '"Permanent Marker", "Segoe Print", cursive',
  caveat: '"Caveat", "Segoe Print", cursive',
  kalam: '"Kalam", "Segoe Print", cursive',
  patrick: '"Patrick Hand", "Segoe Print", cursive',
  dancing: '"Dancing Script", "Segoe Script", cursive',
};

/** Rozmer legendy – podporuje aj staré projekty, kde bol len "size" (štvorec). */
export function legendSize(settings) {
  const w = Number(settings.width) || Number(settings.size) || 160;
  const h = Number(settings.height) || Number(settings.size) || 100;
  return { W: Math.max(16, Math.min(1024, w)), H: Math.max(16, Math.min(1024, h)) };
}

/** Počká, kým sa písaný font načíta (canvas inak kreslí náhradným písmom). */
export async function ensureFont(key, bold) {
  const fam = FONTS[key];
  if (!fam || !fam.startsWith('"') || !document.fonts) return;
  const name = fam.split(',')[0];
  try {
    await Promise.all([
      document.fonts.load(`${bold ? 'bold' : 'normal'} 40px ${name}`, 'AaČčŽžŠšÁáÉé'),
      document.fonts.load(`normal 40px ${name}`, 'AaČčŽžŠšÁáÉé'),
    ]);
  } catch { /* offline bez cache – zostane náhradné písmo */ }
}

/** Zalomí text do riadkov tak, aby sa zmestil do boxu; vráti najväčšiu veľkosť písma, ktorá sa zmestí. */
function fitText(ctx, text, maxW, maxH, weight, family, maxSize) {
  const paragraphs = text.split('\n');
  for (let size = Math.floor(maxSize); size >= 6; size--) {
    ctx.font = `${weight} ${size}px ${family}`;
    const lineH = size * 1.08;
    const lines = [];
    let ok = true;
    for (const p of paragraphs) {
      const words = p.split(/\s+/).filter(Boolean);
      if (!words.length) { lines.push(''); continue; }
      let line = '';
      for (const w of words) {
        if (ctx.measureText(w).width > maxW) { ok = false; break; }
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width <= maxW) line = test;
        else { lines.push(line); line = w; }
      }
      if (!ok) break;
      lines.push(line);
    }
    if (ok && lines.length * lineH <= maxH) return { size, lines, lineH };
  }
  ctx.font = `${weight} 6px ${family}`;
  return { size: 6, lines: [text], lineH: 6.5 };
}

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Farebné pruhy cez celý box. */
function fillStripes(ctx, colors, x, y, w, h) {
  const sw = w / colors.length;
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x + i * sw), y, Math.ceil(sw) + 1, h);
  });
}

/** Machuľa ako od fixky: cik-cak ťahy, ktoré spolu tvoria oválnu škvrnu. */
function drawScribble(ctx, colors, x, y, w, h, seed) {
  const mask = document.createElement('canvas');
  mask.width = ctx.canvas.width;
  mask.height = ctx.canvas.height;
  const m = mask.getContext('2d');
  const rand = rng(seed);
  const lw = Math.max(3, h * 0.2);
  const x0 = x + lw * 0.6;
  const x1 = x + w - lw * 0.6;
  const cy = y + h / 2;
  const ampMax = h / 2 - lw / 2;
  const n = Math.max(6, Math.ceil((x1 - x0) / (lw * 0.75)));
  m.lineCap = 'round';
  m.lineJoin = 'round';
  m.lineWidth = lw;
  m.strokeStyle = '#000';
  m.translate(x + w / 2, cy);
  m.rotate((rand() - 0.5) * 0.08);
  m.translate(-(x + w / 2), -cy);
  for (let pass = 0; pass < 2; pass++) {
    m.beginPath();
    for (let i = 0; i <= n; i++) {
      const t = pass ? 1 - i / n : i / n;
      const e = (t - 0.5) * 2; // -1..1
      const amp = ampMax * Math.sqrt(Math.max(0, 1 - e ** 4)) * (0.82 + rand() * 0.18);
      const px = x0 + t * (x1 - x0) + (rand() - 0.5) * lw * 0.3;
      const py = cy + (i % 2 ? amp : -amp) * (pass ? 0.8 : 1) + (rand() - 0.5) * lw * 0.2;
      if (i === 0) m.moveTo(px, py); else m.lineTo(px, py);
    }
    m.stroke();
  }
  m.setTransform(1, 0, 0, 1, 0, 0);
  // pruhy najprv na samostatné plátno – "source-in" po jednom pruhu by zmazal ostatné
  const fill = document.createElement('canvas');
  fill.width = mask.width;
  fill.height = mask.height;
  fillStripes(fill.getContext('2d'), colors, x, y, w, h);
  m.globalCompositeOperation = 'source-in';
  m.drawImage(fill, 0, 0);
  ctx.drawImage(mask, 0, 0);
}

/**
 * Nakreslí legendu (obdĺžnik W × H). Pri štýloch "machuľa" a "priehľadná" je pozadie priehľadné,
 * presne ako obrázkové legendy v Titane.
 * item: { text, sub, cat, bg, colors, fg, icon, arrow, style }
 * settings: { width, height, font, bold, upper, style, autoColor, showNumber }
 */
export function drawLegend(canvas, item, settings, index = 0) {
  const { W, H } = legendSize(settings);
  const M = Math.min(W, H);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const colors = legendColors(item, settings);
  const color = colors[0];
  const style = resolveStyle(item, settings);
  const family = FONTS[settings.font] || FONTS.sans;
  const weight = settings.bold ? 'bold' : 'normal';
  const script = family.startsWith('"');
  const arrow = resolveArrow(item);

  let bg = color;
  let outline = false; // obrys textu, aby bol čitateľný na machuli / priehľadnom pozadí
  let area = { x: 0, y: 0, w: W, h: H };
  if (style === 'bar') {
    bg = '#111316';
    const barH = Math.round(H * 0.18);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    fillStripes(ctx, colors, 0, H - barH, W, barH);
    area = { x: 0, y: 0, w: W, h: H - barH };
  } else if (style === 'frame') {
    bg = '#111316';
    const b = Math.max(3, Math.round(M * 0.07));
    fillStripes(ctx, colors, 0, 0, W, H);
    ctx.fillStyle = bg;
    ctx.fillRect(b, b, W - 2 * b, H - 2 * b);
    area = { x: b, y: b, w: W - 2 * b, h: H - 2 * b };
  } else if (style === 'scribble') {
    bg = '#000000';
    outline = true;
    const m = Math.round(M * 0.03);
    drawScribble(ctx, colors, m, m, W - 2 * m, H - 2 * m, hashStr((item.text || '') + (item.id || '')));
  } else if (style === 'clear') {
    bg = '#000000';
    outline = true;
  } else {
    fillStripes(ctx, colors, 0, 0, W, H);
  }

  const fg = item.fg || (outline ? '#ffffff' : contrastText(bg));
  const pad = Math.round(M * 0.06);
  let top = area.y + pad;
  let bottom = area.y + area.h - pad;
  let left = area.x + pad;
  let right = area.x + area.w - pad;
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const put = (str, x, y, size) => {
    if (outline) {
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(2, size * 0.16);
      ctx.strokeStyle = luminance(fg) > 0.36 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)';
      ctx.strokeText(str, x, y);
      ctx.restore();
    }
    ctx.fillText(str, x, y);
  };

  if (settings.showNumber) {
    const ns = Math.round(M * 0.16);
    ctx.font = `bold ${ns}px ${FONTS.sans}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = 0.85;
    put(String(index + 1), area.x + Math.round(M * 0.04), area.y + Math.round(M * 0.03), ns);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    top += Math.round(ns * 0.6);
  }

  let text = item.text || '';
  if (settings.upper) text = text.toUpperCase();
  const hasText = text.trim().length > 0;

  // Spread: pri kruhu sa nakreslí N krúžkov s fázou, inak len štítok "×N"
  const spread = Math.max(1, Math.min(16, Number(item.spread) || 1));
  const spreadCircles = spread > 1 && arrow === 'circle';

  // Štítok vpravo hore: typ fixtúry a/alebo spread
  const badge = [String(item.fixture || '').trim().toUpperCase(), spread > 1 && !spreadCircles ? `×${spread}` : '']
    .filter(Boolean).join(' · ');
  if (badge) {
    const bs = Math.max(7, Math.round(M * 0.17));
    ctx.font = `bold ${bs}px ${FONTS.sans}`;
    const maxBw = area.w * 0.7;
    let label = badge;
    while (ctx.measureText(label).width > maxBw - bs && label.length > 2) label = label.slice(0, -2) + '…';
    const bw = ctx.measureText(label).width + bs * 0.9;
    const bh = bs * 1.35;
    const bx = area.x + area.w - bw - Math.round(M * 0.03);
    const by = area.y + Math.round(M * 0.03);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, bh / 2); else ctx.rect(bx, by, bw, bh);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + bw / 2, by + bh / 2 + 0.5);
    ctx.restore();
    // pri machuli necháme písmeno v strede škvrny, inak text posunieme pod štítok
    if (style !== 'scribble') top = Math.max(top, by + bh + Math.round(M * 0.02));
  }

  if (item.sub) {
    const ss = Math.round(M * 0.15);
    const fitted = fitText(ctx, item.sub, right - left, ss * 1.1, 'normal', family, ss);
    ctx.globalAlpha = 0.9;
    ctx.font = `normal ${fitted.size}px ${family}`;
    put(fitted.lines.join(' '), (left + right) / 2, bottom - fitted.size / 2, fitted.size);
    ctx.globalAlpha = 1;
    bottom -= fitted.size * 1.25;
  }

  if (spreadCircles) {
    const sym = (cx, cy, w, h) => {
      if (style === 'clear') drawSpreadCircles(ctx, spread, cx + 1, cy + 1, w, h, 'rgba(0,0,0,0.6)');
      drawSpreadCircles(ctx, spread, cx, cy, w, h, fg);
    };
    if (!hasText) {
      sym((left + right) / 2, (top + bottom) / 2, right - left, bottom - top);
      return;
    }
    if (W >= H * 1.3) {
      const sw = (right - left) * 0.5;
      sym(left + sw / 2, (top + bottom) / 2, sw, bottom - top);
      left += sw * 1.05;
    } else {
      const sh = (bottom - top) * 0.5;
      sym((left + right) / 2, top + sh / 2, right - left, sh);
      top += sh * 1.05;
    }
  } else if (arrow || item.icon) {
    const drawSym = (cx, cy, sz) => {
      if (arrow) {
        if (outline && style === 'clear') drawArrow(ctx, arrow, cx + 1, cy + 1, sz, 'rgba(0,0,0,0.6)');
        drawArrow(ctx, arrow, cx, cy, sz, fg);
      } else {
        ctx.font = `${sz}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", ${FONTS.sans}`;
        ctx.fillText(item.icon, cx, cy);
      }
    };
    if (!hasText) {
      // len symbol – cez celú legendu
      drawSym((left + right) / 2, (top + bottom) / 2, Math.min(bottom - top, right - left) * 0.95);
      return;
    }
    if (W >= H * 1.3) {
      // široká legenda: symbol vľavo, text vpravo
      const is = Math.round(Math.min(bottom - top, (right - left) * 0.35) * 0.9);
      drawSym(left + is / 2, (top + bottom) / 2, is);
      left += is * 1.15;
    } else {
      const is = Math.round(area.h * 0.32);
      drawSym((left + right) / 2, top + is * 0.55, is);
      top += is * 1.1;
    }
  }

  const width = right - left;
  const maxH = Math.max(8, bottom - top);
  // písané fonty majú menšie písmená, dovolíme im byť väčšie
  const { size, lines, lineH } = fitText(ctx, text, width, maxH, weight, family, H * (script ? 0.62 : 0.5));
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.fillStyle = fg;
  const blockH = lines.length * lineH;
  let y = top + (maxH - blockH) / 2 + lineH / 2;
  for (const line of lines) {
    put(line, left + width / 2, y, size);
    y += lineH;
  }
}

export function fileName(item, index) {
  const base = (item.text || 'legend')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'legend';
  return `${String(index + 1).padStart(3, '0')}_${base}.png`;
}
