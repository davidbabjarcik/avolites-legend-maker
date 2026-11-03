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

export const FONTS = {
  sans: 'Arial, Helvetica, sans-serif',
  condensed: '"Arial Narrow", "Roboto Condensed", "Helvetica Neue Condensed", sans-serif-condensed, Arial, sans-serif',
  impact: 'Impact, "Arial Black", sans-serif',
  mono: 'Consolas, "Courier New", monospace',
};

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

/**
 * Nakreslí legendu.
 * item: { text, sub, cat, bg, fg, icon }
 * settings: { size, font, bold, upper, style, autoColor, showNumber }
 */
export function drawLegend(canvas, item, settings, index = 0) {
  const S = settings.size;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  const color = legendColor(item, settings);
  const family = FONTS[settings.font] || FONTS.sans;
  const weight = settings.bold ? 'bold' : 'normal';

  // Pozadie podľa štýlu
  let bg = color;
  let area = { x: 0, y: 0, w: S, h: S };
  if (settings.style === 'bar') {
    bg = '#111316';
    const barH = Math.round(S * 0.2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = color;
    ctx.fillRect(0, S - barH, S, barH);
    area = { x: 0, y: 0, w: S, h: S - barH };
  } else if (settings.style === 'frame') {
    bg = '#111316';
    const b = Math.max(3, Math.round(S * 0.07));
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = bg;
    ctx.fillRect(b, b, S - 2 * b, S - 2 * b);
    area = { x: b, y: b, w: S - 2 * b, h: S - 2 * b };
  } else {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, S, S);
  }

  const fg = item.fg || contrastText(bg);
  const pad = Math.round(S * 0.06);
  let top = area.y + pad;
  let bottom = area.y + area.h - pad;
  const left = area.x + pad;
  const width = area.w - 2 * pad;
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (settings.showNumber) {
    const ns = Math.round(S * 0.12);
    ctx.font = `bold ${ns}px ${FONTS.sans}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = 0.75;
    ctx.fillText(String(index + 1), area.x + Math.round(S * 0.04), area.y + Math.round(S * 0.03));
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    top += Math.round(ns * 0.6);
  }

  if (item.icon) {
    const is = Math.round(area.h * 0.32);
    ctx.font = `${is}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", ${FONTS.sans}`;
    ctx.fillText(item.icon, S / 2, top + is * 0.55);
    top += is * 1.1;
  }

  if (item.sub) {
    const ss = Math.round(S * 0.11);
    const fitted = fitText(ctx, item.sub, width, ss * 1.1, 'normal', family, ss);
    ctx.globalAlpha = 0.85;
    ctx.font = `normal ${fitted.size}px ${family}`;
    ctx.fillText(fitted.lines.join(' '), S / 2, bottom - fitted.size / 2);
    ctx.globalAlpha = 1;
    bottom -= fitted.size * 1.25;
  }

  let text = item.text || '';
  if (settings.upper) text = text.toUpperCase();
  const maxH = Math.max(8, bottom - top);
  const { size, lines, lineH } = fitText(ctx, text, width, maxH, weight, family, S * 0.32);
  ctx.font = `${weight} ${size}px ${family}`;
  const blockH = lines.length * lineH;
  let y = top + (maxH - blockH) / 2 + lineH / 2;
  for (const line of lines) {
    ctx.fillText(line, left + width / 2, y);
    y += lineH;
  }
}

export function fileName(item, index) {
  const base = (item.text || 'legend')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'legend';
  return `${String(index + 1).padStart(3, '0')}_${base}.png`;
}
