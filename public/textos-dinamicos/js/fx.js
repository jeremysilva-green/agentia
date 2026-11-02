// Drawing toolkit: easing, fonts, text, glass, icons, sparkles, overlays.
export const W = 1080, H = 1920, FPS = 30;
export const CX = W / 2;

// ---------------------------------------------------------------- easing
export const clamp = (u, a = 0, b = 1) => Math.max(a, Math.min(b, u));
export const prog = (t, t0, d) => d > 0 ? clamp((t - t0) / d) : (t >= t0 ? 1 : 0);
export const lerp = (a, b, u) => a + (b - a) * u;
export const outExpo = u => u >= 1 ? 1 : 1 - Math.pow(2, -10 * u);
export const outCubic = u => 1 - Math.pow(1 - u, 3);
export const inCubic = u => u * u * u;
export const inOutCubic = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
export const outBack = (u, k = 1.6) => { u -= 1; return 1 + (k + 1) * u * u * u + k * u * u; };
export function spring(u, f = 2.2, z = 5.5) {
  if (u <= 0) return 0; if (u >= 1) return 1;
  return 1 - Math.exp(-z * u) * Math.cos(f * Math.PI * u);
}
export const exitP = (t, tout, d = 0.45, lag = 0) => inCubic(prog(t, tout - d - 0.05 + lag, d));

// ---------------------------------------------------------------- colors
export function hexRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
export const rgba = (rgb, a = 1) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
export const lum = rgb => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
export const WHITE = [255, 255, 255];

// ---------------------------------------------------------------- fonts
export const FONTS = {
  serif: ['MT Serif', 400, 'normal'], inter_m: ['MT Inter', 500, 'normal'], inter_mi: ['MT Inter', 500, 'italic'],
  inter_bi: ['MT Inter', 700, 'italic'], inter_b: ['MT Inter', 700, 'normal'], mont_thin: ['MT Mont', 100, 'normal'],
  mont_m: ['MT Mont', 500, 'normal'], mont_xb: ['MT Mont', 800, 'normal'], mont_bk: ['MT Mont', 900, 'normal'],
  pop_xl: ['MT Pop', 200, 'normal'], pop_l: ['MT Pop', 300, 'normal'], pop_xb: ['MT Pop', 800, 'normal'],
  pop_bk: ['MT Pop', 900, 'normal'],
};
export async function loadFonts(base) {
  const list = [
    ['MT Serif', 'InstrumentSerif-Regular.ttf', 400, 'normal'], ['MT Inter', 'Inter-Medium.ttf', 500, 'normal'],
    ['MT Inter', 'Inter-MediumItalic.ttf', 500, 'italic'], ['MT Inter', 'Inter-SemiBoldItalic.ttf', 700, 'italic'],
    ['MT Inter', 'Inter-Bold.ttf', 700, 'normal'], ['MT Mont', 'Montserrat-Thin.ttf', 100, 'normal'],
    ['MT Mont', 'Montserrat-Medium.ttf', 500, 'normal'], ['MT Mont', 'Montserrat-ExtraBold.ttf', 800, 'normal'],
    ['MT Mont', 'Montserrat-Black.ttf', 900, 'normal'], ['MT Pop', 'poppins-latin-200-normal.woff', 200, 'normal'],
    ['MT Pop', 'poppins-latin-300-normal.woff', 300, 'normal'], ['MT Pop', 'poppins-latin-800-normal.woff', 800, 'normal'],
    ['MT Pop', 'poppins-latin-900-normal.woff', 900, 'normal']];
  await Promise.all(list.map(async ([fam, file, weight, style]) => {
    const f = new FontFace(fam, `url(${base}${file})`, { weight: String(weight), style });
    await f.load(); document.fonts.add(f);
  }));
}

let _mctx = null;
const mctx = () => _mctx || (_mctx = document.createElement('canvas').getContext('2d'));
const HAS_LS = 'letterSpacing' in CanvasRenderingContext2D.prototype;

export function setFont(ctx, key, size, track = 0) {
  const [fam, w, st] = FONTS[key];
  ctx.font = `${st} ${w} ${size}px "${fam}"`;
  if (HAS_LS) ctx.letterSpacing = `${track * size}px`;
}
const _wcache = new Map();
export function textWidth(text, key, size, track = 0) {
  const k = text + '|' + key + '|' + size.toFixed(2) + '|' + track;
  if (_wcache.has(k)) return _wcache.get(k);
  const c = mctx(); setFont(c, key, size, HAS_LS ? 0 : 0);
  let w = c.measureText(text).width + track * size * Math.max(0, [...text].length - 1);
  _wcache.set(k, w); return w;
}
export function fit(text, key, size, maxw, track = 0, min = 40) {
  if (!text) return size;
  const w = textWidth(text, key, size, track);
  return Math.max(min, size * Math.min(1, maxw / Math.max(w, 1)));
}
// per-letter centre offsets (relative to the text centre), kerning kept via prefix widths
export function letters(text, key, size, track = 0) {
  const chars = [...text], c = mctx(); setFont(c, key, size, 0);
  let x = 0; const out = [];
  for (let i = 0; i < chars.length; i++) {
    const pre = chars.slice(0, i).join(''), adv = c.measureText(pre + chars[i]).width - c.measureText(pre).width;
    out.push({ ch: chars[i], cx: x + adv / 2, w: adv }); x += adv + track * size;
  }
  const tw = x - track * size;
  out.forEach(o => o.cx -= tw / 2);
  return { list: out.filter(o => o.ch !== ' '), width: tw };
}
export function shadow(ctx, size, a = 0.4) {
  ctx.shadowColor = `rgba(0,0,0,${a})`; ctx.shadowBlur = size * 0.16; ctx.shadowOffsetY = size * 0.03; ctx.shadowOffsetX = 0;
}
export function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }

// draw text centred at (x, baseline y) with tracking, scale around its visual centre
export function drawText(ctx, text, key, size, x, y, { color = WHITE, alpha = 1, track = 0, scale = 1, sh = 0.4, align = 'center', fill = null } = {}) {
  if (alpha <= 0.003 || scale <= 0.01 || !text) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (scale !== 1) { const cy = y - size * 0.35; ctx.translate(x, cy); ctx.scale(scale, scale); ctx.translate(-x, -cy); }
  setFont(ctx, key, size, track);
  ctx.textBaseline = 'alphabetic';
  if (sh) shadow(ctx, size, sh);
  ctx.fillStyle = fill || rgba(color);
  if (HAS_LS || !track) {
    ctx.textAlign = align;
    // letterSpacing adds space after the last glyph too; compensate for centred text
    const dx = (HAS_LS && track && align === 'center') ? track * size / 2 : 0;
    ctx.fillText(text, x + dx, y);
  } else {
    ctx.textAlign = 'left';
    const w = textWidth(text, key, size, track);
    let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    const c = mctx(); setFont(c, key, size, 0);
    for (const ch of text) { ctx.fillText(ch, cx, y); cx += c.measureText(ch).width + track * size; }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- glass
let FILTER_OK = null;
export function filterSupported() {
  if (FILTER_OK === null) { const c = document.createElement('canvas').getContext('2d'); c.filter = 'blur(2px)'; FILTER_OK = c.filter === 'blur(2px)'; }
  return FILTER_OK;
}
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); r = Math.min(r, h / 2, w / 2);
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
/** frosted glass: blurred backdrop + soft white tint + bright rim. `clipX` limits the visible part (wipes). */
export function glass(ctx, backdrop, x, y, w, h, r, { alpha = 1, tint = 0.12, rim = 0.5, clipX0 = -1e9, clipX1 = 1e9 } = {}) {
  if (alpha <= 0.003 || w <= 2) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.beginPath(); ctx.rect(Math.max(x - 60, clipX0), y - 80, Math.min(x + w + 60, clipX1) - Math.max(x - 60, clipX0), h + 160); ctx.clip();
  // soft drop shadow
  ctx.save(); roundRect(ctx, x, y, w, h, r); ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill(); ctx.restore();
  roundRect(ctx, x, y, w, h, r); ctx.save(); ctx.clip();
  if (backdrop && filterSupported()) {
    ctx.filter = 'blur(22px) saturate(140%) brightness(1.05)';
    const pad = 50, sx = Math.max(0, x - pad), sy = Math.max(0, y - pad);
    const sw = Math.min(W, x + w + pad) - sx, sh2 = Math.min(H, y + h + pad) - sy;
    if (sw > 0 && sh2 > 0) ctx.drawImage(backdrop, sx, sy, sw, sh2, sx, sy, sw, sh2);
    ctx.filter = 'none';
    ctx.fillStyle = `rgba(255,255,255,${tint})`; ctx.fillRect(x, y, w, h);
  } else {
    ctx.fillStyle = 'rgba(28,28,34,0.62)'; ctx.fillRect(x, y, w, h);
  }
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(0.45, 'rgba(255,255,255,0.03)'); g.addColorStop(1, 'rgba(255,255,255,0.08)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.restore();
  roundRect(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, r);
  const rg = ctx.createLinearGradient(x, y, x + w, y + h);
  rg.addColorStop(0, `rgba(255,255,255,${rim})`); rg.addColorStop(0.5, `rgba(255,255,255,${rim * 0.25})`); rg.addColorStop(1, `rgba(255,255,255,${rim * 0.7})`);
  ctx.strokeStyle = rg; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- icons (Lucide, stroke draw-on)
const ICONS = {};
export async function loadIcons(url) {
  const data = await (await fetch(url)).json();
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svg.appendChild(p); svg.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
  document.body.appendChild(svg);
  for (const [name, ds] of Object.entries(data)) {
    ICONS[name] = ds.map(d => { p.setAttribute('d', d); let len = 40; try { len = p.getTotalLength() || 40; } catch (e) {} return { path: new Path2D(d), len }; });
  }
  svg.remove();
}
export const hasIcon = n => !!ICONS[n];
/** draw an icon centred at (cx,cy). p = draw-on progress 0..1 */
export function drawIcon(ctx, name, cx, cy, size, { p = 1, color = WHITE, alpha = 1, width = 2.2, scale = 1, sh = 0.35 } = {}) {
  const parts = ICONS[name]; if (!parts || alpha <= 0.003 || p <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx, cy); ctx.scale(size / 24 * scale, size / 24 * scale); ctx.translate(-12, -12);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = width; ctx.strokeStyle = rgba(color);
  if (sh) { ctx.shadowColor = `rgba(0,0,0,${sh})`; ctx.shadowBlur = 6; ctx.shadowOffsetY = 1; }
  for (const { path, len } of parts) {
    if (p < 1) { ctx.setLineDash([len, len + 1]); ctx.lineDashOffset = len * (1 - p); } else ctx.setLineDash([]);
    ctx.stroke(path);
  }
  ctx.restore();
}
/** icon inside a filled circle badge that pops in */
export function iconBadge(ctx, name, cx, cy, d, t0, t, accent, { exit = 0 } = {}) {
  if (!ICONS[name]) return;
  const u = prog(t, t0, 0.35); if (u <= 0) return;
  const s = lerp(0.4, 1, outBack(u, 2.2)) * (1 - 0.2 * exit), a = clamp(u * 3) * (1 - exit);
  ctx.save(); ctx.globalAlpha *= a;
  ctx.beginPath(); ctx.arc(cx, cy, d / 2 * s, 0, Math.PI * 2);
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  ctx.fillStyle = rgba(accent); ctx.fill(); ctx.restore();
  const ic = lum(accent) > 170 ? [24, 24, 24] : WHITE;
  drawIcon(ctx, name, cx, cy, d * 0.52 * s, { p: prog(t, t0 + 0.12, 0.45), color: ic, alpha: a, width: 2.4, sh: 0 });
}

// ---------------------------------------------------------------- elements
/** sparkle burst: rays fly out and fade (dt = seconds since start) */
export function sparkle(ctx, x, y, dt, color, size = 70, n = 7, seed = 1) {
  if (dt < 0 || dt > 0.55) return;
  const u = dt / 0.55;
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = rgba(color, 1 - u); ctx.lineWidth = 5 * (1 - u * 0.6);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + seed * 0.7, r0 = size * (0.25 + 0.75 * outCubic(u)), r1 = r0 + size * 0.35 * (1 - u);
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.stroke();
  }
  ctx.restore();
}
/** hand-drawn swoosh underline, drawn left to right */
export function swoosh(ctx, x0, x1, y, p, color, thick = 9, alpha = 1) {
  if (p <= 0 || alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.lineCap = 'round'; ctx.strokeStyle = rgba(color); ctx.lineWidth = thick;
  const w = x1 - x0, len = w * 1.05;
  ctx.setLineDash([len, len + 2]); ctx.lineDashOffset = len * (1 - p);
  ctx.beginPath(); ctx.moveTo(x0, y + 6); ctx.quadraticCurveTo(x0 + w * 0.5, y - 14, x1, y - 2); ctx.stroke();
  ctx.restore();
}
/** expanding ring */
export function ring(ctx, x, y, r, dt, color, dur = 0.8) {
  if (dt < 0 || dt > dur) return;
  const u = dt / dur;
  ctx.save(); ctx.strokeStyle = rgba(color, 0.7 * (1 - u)); ctx.lineWidth = 6 * (1 - u) + 1;
  ctx.beginPath(); ctx.arc(x, y, r * (0.6 + 0.8 * outCubic(u)), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}
/** soft cinematic focus overlay: vignette + top shade (strength 0..1) */
export function focusOverlay(ctx, s) {
  if (s <= 0.003) return;
  ctx.save();
  const g = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.45, H * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${0.42 * s})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const t = ctx.createLinearGradient(0, 0, 0, H * 0.45);
  t.addColorStop(0, `rgba(0,0,0,${0.22 * s})`); t.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = t; ctx.fillRect(0, 0, W, H * 0.45);
  ctx.restore();
}
