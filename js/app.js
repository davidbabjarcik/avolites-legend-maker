import { CATEGORIES, STYLES, drawLegend, legendColor, legendColors, fileName, legendSize, ensureFont } from './render.js';
import { ARROWS, parseArrow } from './arrows.js';
import { makeZip } from './zip.js';

const STORE_KEY = 'alm-state-v1';
const $ = (id) => document.getElementById(id);

const DEFAULT_SETTINGS = {
  width: 160, height: 72, style: 'auto', font: 'marker', bold: false, upper: true,
  autoColor: true, showNumber: false, cols: 6,
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { settings: migrate(s.settings), items: Array.isArray(s.items) ? s.items.map(normalizeItem) : [] };
    }
  } catch { /* prázdne úložisko alebo blokované */ }
  return { settings: { ...DEFAULT_SETTINGS }, items: [] };
}

/** Staré projekty mali len "size" (štvorec) – prevedieme na šírku × výšku. */
function migrate(settings = {}) {
  const out = { ...DEFAULT_SETTINGS, ...settings };
  if (settings.size && !settings.width) {
    const { W, H } = legendSize(settings);
    out.width = W;
    out.height = H;
  }
  delete out.size;
  return out;
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* nevadí */ }
}

const uid = () => Math.random().toString(36).slice(2, 10);

function normalizeItem(i) {
  return {
    id: i.id || uid(),
    text: String(i.text ?? ''),
    sub: String(i.sub ?? ''),
    cat: CATEGORIES[i.cat] ? i.cat : 'playback',
    bg: /^#[0-9a-f]{6}$/i.test(i.bg || '') ? i.bg : '',
    fg: /^#[0-9a-f]{6}$/i.test(i.fg || '') ? i.fg : '',
    icon: String(i.icon ?? ''),
    colors: Array.isArray(i.colors) ? i.colors.filter((c) => /^#[0-9a-f]{6}$/i.test(c)) : [],
    arrow: i.arrow === 'none' || ARROWS[i.arrow] ? i.arrow : '',
    style: STYLES[i.style] && i.style !== 'auto' ? i.style : '',
    fixture: String(i.fixture ?? '').trim(),
    spread: Math.max(1, Math.min(16, Math.round(Number(i.spread)) || 1)),
  };
}

/** "red", "#ff0000", "ff0000" → "#ff0000" alebo '' */
function parseColor(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (/^#?[0-9a-f]{6}$/i.test(v)) return (v.startsWith('#') ? v : '#' + v).toLowerCase();
  const c = document.createElement('canvas').getContext('2d');
  c.fillStyle = '#000001';
  c.fillStyle = v;
  return c.fillStyle !== '#000001' ? c.fillStyle : '';
}

/** "red+blue+white" → ['#ff0000', ...] */
const parseColors = (value) => String(value || '').split(/[+,]/).map(parseColor).filter(Boolean);

/** "×4", "x4", "4" → 4 */
const parseSpread = (v) => Number(String(v || '').replace(/^[x×*]/i, '')) || 1;

/** "TEXT | podtext | farba | šípka/ikona | fixtúra | spread" → položka */
function parseLine(line, cat, defaultFixture = '') {
  let [text = '', sub = '', color = '', sym = '', fixture = '', spread = ''] = line.split('|').map((s) => s.trim());
  // "CIRCLE x4" na konci textu = spread 4
  const m = text.match(/\s+[x×](\d{1,2})$/i);
  if (m && !spread) {
    spread = m[1];
    text = text.slice(0, m.index);
  }
  const colors = parseColors(color);
  // 4. pole môže byť šípka ("up", "↑", "fan out"…) alebo emoji ikona
  const arrow = parseArrow(sym);
  return normalizeItem({
    text: text.replace(/\s*\/\/\s*/g, '\n'), sub, cat,
    bg: colors[0] || '', colors: colors.length > 1 ? colors : [],
    arrow: arrow || '', icon: arrow ? '' : sym,
    fixture: fixture || defaultFixture, spread: parseSpread(spread),
  });
}

/* ---------- vykreslenie ---------- */

function renderAll() {
  const s = state.settings;
  const preset = `${s.width}x${s.height}`;
  $('sPreset').value = [...$('sPreset').options].some((o) => o.value === preset) ? preset : 'custom';
  $('sW').value = s.width;
  $('sH').value = s.height;
  $('sStyle').value = s.style;
  $('sFont').value = s.font;
  $('sCols').value = s.cols;
  $('sBold').checked = s.bold;
  $('sUpper').checked = s.upper;
  $('sAuto').checked = s.autoColor;
  $('sNum').checked = s.showNumber;
  renderWindow();
  renderList();
}

function renderWindow() {
  const win = $('window');
  win.style.setProperty('--cols', state.settings.cols);
  win.innerHTML = '';
  state.items.forEach((item, i) => {
    const c = document.createElement('canvas');
    c.className = 'tile';
    c.title = `${i + 1}: ${item.text}`;
    drawLegend(c, item, state.settings, i);
    c.addEventListener('click', () => {
      const row = document.querySelector(`[data-id="${item.id}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.querySelector('textarea')?.focus({ preventScroll: true });
      }
    });
    win.appendChild(c);
  });
  $('empty').hidden = state.items.length > 0;
  $('count').textContent = state.items.length ? `${state.items.length} ks` : '';
}

function catOptions(selected) {
  return Object.entries(CATEGORIES)
    .map(([k, v]) => `<option value="${k}"${k === selected ? ' selected' : ''}>${v.label}</option>`)
    .join('');
}

function styleOptions(selected) {
  return '<option value="">– podľa nastavenia –</option>' + Object.entries(STYLES)
    .filter(([k]) => k !== 'auto')
    .map(([k, v]) => `<option value="${k}"${k === selected ? ' selected' : ''}>${v}</option>`).join('');
}

function arrowOptions(selected) {
  return `<option value="">auto (Position / FX)</option><option value="none"${selected === 'none' ? ' selected' : ''}>žiadna</option>` +
    Object.entries(ARROWS).map(([k, v]) => `<option value="${k}"${k === selected ? ' selected' : ''}>${v.char} ${v.label}</option>`).join('');
}

function esc(s) {
  return s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

function renderList() {
  const list = $('list');
  list.innerHTML = '';
  state.items.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'item';
    row.dataset.id = item.id;
    const auto = legendColor({ ...item, bg: '' }, state.settings);
    row.innerHTML = `
      <div class="num">${i + 1}</div>
      <canvas class="thumb"></canvas>
      <div class="fields">
        <label class="field wide">Text<textarea rows="2" data-k="text">${esc(item.text)}</textarea></label>
        <label class="field">Podtext<input data-k="sub" value="${esc(item.sub)}" placeholder="napr. Pos 1"></label>
        <label class="field">Kategória<select data-k="cat">${catOptions(item.cat)}</select></label>
        <label class="field">Štýl<select data-k="style">${styleOptions(item.style)}</select></label>
        <label class="field">Šípka<select data-k="arrow">${arrowOptions(item.arrow)}</select></label>
        <label class="field">Ikona<input data-k="icon" list="icons" value="${esc(item.icon)}" placeholder="žiadna"></label>
        <label class="field">Fixtúra<input data-k="fixture" list="fixtures" value="${esc(item.fixture)}" placeholder="napr. SPOT"></label>
        <label class="field">Spread<input type="number" data-k="spread" min="1" max="16" value="${item.spread}"></label>
        <label class="field">Pruhy (viac farieb)<input data-k="colorsText" value="${esc(item.colors.join('+'))}" placeholder="red+blue"></label>
        <div class="field colors">
          <span>Farby</span>
          <div class="color-row">
            <label class="swatch" title="Pozadie"><input type="color" data-k="bg" value="${item.bg || auto}"></label>
            <button class="mini" data-act="bgauto" title="Automatická farba"${item.bg ? '' : ' disabled'}>auto</button>
            <label class="swatch" title="Text"><input type="color" data-k="fg" value="${item.fg || '#ffffff'}"></label>
            <button class="mini" data-act="fgauto" title="Automatická farba textu"${item.fg ? '' : ' disabled'}>auto</button>
          </div>
        </div>
      </div>
      <div class="acts">
        <button class="icon-btn" data-act="up" title="Hore">↑</button>
        <button class="icon-btn" data-act="down" title="Dole">↓</button>
        <button class="icon-btn" data-act="dup" title="Duplikovať">⧉</button>
        <button class="icon-btn" data-act="png" title="Stiahnuť PNG">⬇</button>
        <button class="icon-btn del" data-act="del" title="Zmazať">✕</button>
      </div>`;
    drawLegend(row.querySelector('canvas'), item, state.settings, i);
    list.appendChild(row);
  });
}

function redrawItem(item) {
  const i = state.items.indexOf(item);
  const row = document.querySelector(`[data-id="${item.id}"]`);
  if (row) drawLegend(row.querySelector('canvas'), item, state.settings, i);
  const tile = $('window').children[i];
  if (tile) {
    drawLegend(tile, item, state.settings, i);
    tile.title = `${i + 1}: ${item.text}`;
  }
}

/* ---------- udalosti zoznamu ---------- */

$('list').addEventListener('input', (e) => {
  const el = e.target;
  const k = el.dataset.k;
  if (!k) return;
  const item = state.items.find((x) => x.id === el.closest('.item').dataset.id);
  if (!item) return;
  if (k === 'colorsText') {
    const cs = parseColors(el.value);
    item.colors = cs.length > 1 ? cs : [];
    if (cs.length) item.bg = cs[0];
  } else {
    item[k] = k === 'spread' ? Math.max(1, Math.min(16, Math.round(Number(el.value)) || 1)) : el.value;
  }
  if (k === 'bg' && item.colors.length > 1) item.colors[0] = el.value;
  if (k === 'bg' || k === 'fg') el.closest('.item').querySelector(`[data-act="${k}auto"]`).disabled = false;
  redrawItem(item);
  save();
});

$('list').addEventListener('change', (e) => {
  // zmena kategórie mení automatickú farbu – prekreslíme aj color picker
  if (e.target.dataset.k === 'cat' || e.target.dataset.k === 'colorsText') renderList();
});

$('list').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.closest('.item').dataset.id;
  const i = state.items.findIndex((x) => x.id === id);
  const item = state.items[i];
  switch (btn.dataset.act) {
    case 'up': if (i > 0) [state.items[i - 1], state.items[i]] = [state.items[i], state.items[i - 1]]; break;
    case 'down': if (i < state.items.length - 1) [state.items[i + 1], state.items[i]] = [state.items[i], state.items[i + 1]]; break;
    case 'dup': state.items.splice(i + 1, 0, { ...item, colors: [...item.colors], id: uid() }); break;
    case 'del': state.items.splice(i, 1); break;
    case 'bgauto': item.bg = ''; item.colors = []; break;
    case 'fgauto': item.fg = ''; break;
    case 'png': downloadPng(item, i); return;
  }
  save();
  renderAll();
});

/* ---------- pridávanie a nastavenia ---------- */

$('bulkCat').innerHTML = catOptions('playback');

$('addBtn').addEventListener('click', () => {
  const lines = $('bulk').value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return;
  const cat = $('bulkCat').value;
  const fixture = $('bulkFixture').value.trim();
  state.items.push(...lines.map((l) => parseLine(l, cat, fixture)));
  $('bulk').value = '';
  save();
  renderAll();
});

$('bulk').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('addBtn').click();
});

const bindSetting = (id, key, read) => {
  $(id).addEventListener('change', () => {
    state.settings[key] = read($(id));
    save();
    renderAll();
  });
};
const clampPx = (v, d) => Math.min(1024, Math.max(16, Math.round(Number(v)) || d));
bindSetting('sW', 'width', (el) => clampPx(el.value, 160));
bindSetting('sH', 'height', (el) => clampPx(el.value, 100));
$('sPreset').addEventListener('change', () => {
  const v = $('sPreset').value;
  if (v === 'custom') { $('sW').focus(); return; }
  const [w, h] = v.split('x').map(Number);
  state.settings.width = w;
  state.settings.height = h;
  save();
  renderAll();
});
bindSetting('sStyle', 'style', (el) => el.value);
$('sFont').addEventListener('change', async () => {
  state.settings.font = $('sFont').value;
  save();
  await ensureFont(state.settings.font, state.settings.bold);
  renderAll();
});
bindSetting('sCols', 'cols', (el) => Math.min(12, Math.max(2, Number(el.value) || 6)));
$('sBold').addEventListener('change', async () => {
  state.settings.bold = $('sBold').checked;
  save();
  await ensureFont(state.settings.font, state.settings.bold);
  renderAll();
});
bindSetting('sUpper', 'upper', (el) => el.checked);
bindSetting('sAuto', 'autoColor', (el) => el.checked);
bindSetting('sNum', 'showNumber', (el) => el.checked);

/* ---------- export ---------- */

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const canvasBlob = (c) => new Promise((res) => c.toBlob(res, 'image/png'));

async function downloadPng(item, i) {
  await ensureFont(state.settings.font, state.settings.bold);
  const c = document.createElement('canvas');
  drawLegend(c, item, state.settings, i);
  download(await canvasBlob(c), fileName(item, i));
}

$('zipBtn').addEventListener('click', async () => {
  if (!state.items.length) return;
  const btn = $('zipBtn');
  btn.disabled = true;
  try {
    await ensureFont(state.settings.font, state.settings.bold);
    const files = [];
    const c = document.createElement('canvas');
    for (let i = 0; i < state.items.length; i++) {
      drawLegend(c, state.items[i], state.settings, i);
      const blob = await canvasBlob(c);
      files.push({ name: fileName(state.items[i], i), data: new Uint8Array(await blob.arrayBuffer()) });
    }
    files.push({ name: 'legendy.txt', data: new TextEncoder().encode(textList()) });
    const { W, H } = legendSize(state.settings);
    download(makeZip(files), `avolites-legendy-${W}x${H}.zip`);
  } finally {
    btn.disabled = false;
  }
});

const oneLine = (s) => s.replace(/\n/g, ' / ');

function textList() {
  const lines = state.items.map((it, i) => {
    const parts = [`${String(i + 1).padStart(3, ' ')}.  ${oneLine(it.text)}`];
    if (it.sub) parts.push(`(${it.sub})`);
    if (it.fixture) parts.push(`[${it.fixture}]`);
    if (it.spread > 1) parts.push(`spread ${it.spread}`);
    parts.push(`– ${CATEGORIES[it.cat].label}`);
    parts.push(legendColor(it, state.settings));
    return parts.join('  ');
  });
  return `Avolites legendy (${state.items.length})\n${'='.repeat(30)}\n${lines.join('\n')}\n`;
}

$('txtBtn').addEventListener('click', () => {
  download(new Blob([textList()], { type: 'text/plain;charset=utf-8' }), 'avolites-legendy.txt');
});

$('csvBtn').addEventListener('click', () => {
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [['#', 'text', 'podtext', 'kategoria', 'fixtura', 'spread', 'pozadie', 'text_farba', 'ikona', 'subor']];
  state.items.forEach((it, i) => rows.push([
    i + 1, oneLine(it.text), it.sub, CATEGORIES[it.cat].label, it.fixture, it.spread, legendColor(it, state.settings),
    it.fg || 'auto', it.icon, fileName(it, i),
  ]));
  const csv = '﻿' + rows.map((r) => r.map(q).join(';')).join('\r\n');
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'avolites-legendy.csv');
});

$('printBtn').addEventListener('click', () => {
  const sheet = $('printSheet');
  const c = document.createElement('canvas');
  const rows = state.items.map((it, i) => {
    drawLegend(c, it, state.settings, i);
    return `<tr><td>${i + 1}</td><td><img src="${c.toDataURL()}" alt=""></td><td>${esc(oneLine(it.text))}</td><td>${esc(it.sub)}</td><td>${CATEGORIES[it.cat].label}</td></tr>`;
  }).join('');
  sheet.innerHTML = `<h1>Avolites legendy</h1><table><thead><tr><th>#</th><th>Legenda</th><th>Text</th><th>Podtext</th><th>Kategória</th></tr></thead><tbody>${rows}</tbody></table>`;
  window.print();
});

$('clearBtn').addEventListener('click', () => {
  if (state.items.length && confirm(`Naozaj vymazať všetkých ${state.items.length} legiend?`)) {
    state.items = [];
    save();
    renderAll();
  }
});

$('exportJson').addEventListener('click', () => {
  const data = JSON.stringify({ app: 'avolites-legend-maker', version: 1, ...state }, null, 2);
  download(new Blob([data], { type: 'application/json' }), 'avolites-legendy.json');
});

$('importJson').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.items)) throw new Error('chýba zoznam legiend');
    state = { settings: migrate(data.settings), items: data.items.map(normalizeItem) };
    save();
    await ensureFont(state.settings.font, state.settings.bold);
    renderAll();
  } catch (err) {
    alert('Súbor sa nepodarilo načítať: ' + err.message);
  }
});

/* ---------- PWA ---------- */

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $('installBtn').hidden = false;
});
$('installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $('installBtn').hidden = true;
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Ukážkové legendy pri prvom spustení
let firstRun = true;
try { firstRun = !localStorage.getItem(STORE_KEY); } catch { /* bez úložiska */ }
if (!state.items.length && firstRun) {
  const samples = [
    ['R', 'color'], ['O | | orange', 'color'], ['Y', 'color'], ['G', 'color'], ['C', 'color'],
    ['B', 'color'], ['UV', 'color'], ['W', 'color'], ['CTO', 'color'], ['R+B | | red+blue', 'color'],
    ['FAN OUT', 'position'], ['CENTER', 'position'], ['| | | up', 'position'], ['AUDIENCE', 'position'],
    ['CROSS | | | | SPOT', 'position'], ['CIRCLE | | | | SPOT', 'effect'], ['CIRCLE x4 | | | | SPOT', 'effect'],
    ['| | | circle | | 8', 'effect'], ['STROBE | | | ⚡ | WASH', 'effect'], ['GO', 'playback'],
  ];
  state.items = samples.map(([l, cat]) => parseLine(l, cat));
}

renderAll();
// písaný font sa sťahuje chvíľu – po načítaní prekreslíme
ensureFont(state.settings.font, state.settings.bold).then(renderAll);
