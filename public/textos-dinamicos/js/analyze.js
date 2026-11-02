// One pass over the video: camera cuts, burned-in logo zones, and where the speaker's head is.
import { W, H, FPS } from './fx.js';
import { gridFrames, drawCover } from './media.js';

const MW = 288, MH = 512, SCALE = W / MW;       // matting resolution for analysis

/** silhouette outline: for every 4th matte row, the [left, right] x covered by the person (full-res px), -1 if empty */
export function silhouette(alpha, w, h) {
  const rows = Math.floor(h / 4), out = new Int16Array(rows * 2), k = W / w;
  for (let r = 0; r < rows; r++) {
    const o = r * 4 * w; let l = -1, rr = -1;
    for (let x = 0; x < w; x++) if (alpha[o + x] > 0.5) { if (l < 0) l = x; rr = x; }
    out[2 * r] = l < 0 ? -1 : Math.round(l * k); out[2 * r + 1] = rr < 0 ? -1 : Math.round(rr * k);
  }
  return out;
}

/** top of the person's head (hair) in full-res px from a matte, or null */
export function hairTop(alpha, w, h) {
  let area = 0; const cnt = new Uint16Array(h);
  for (let y = 0; y < h; y++) { let c = 0; const o = y * w; for (let x = 0; x < w; x++) if (alpha[o + x] > 0.5) c++; cnt[y] = c; area += c; }
  if (area < 0.015 * w * h) return null;
  for (let y = 0; y < h; y++) if (cnt[y] >= Math.max(3, 0.02 * w)) return y * (W / w);
  return null;
}

export async function analyzeVideo(v, matte, faces, onProgress) {
  if (matte) matte.reset();
  const n = Math.max(1, Math.round(v.duration * FPS));
  const tiny = document.createElement('canvas'); tiny.width = 54; tiny.height = 96;
  const tctx = tiny.getContext('2d', { willReadFrequently: true });
  const mid = document.createElement('canvas'); mid.width = 135; mid.height = 240;
  const mctx = mid.getContext('2d', { willReadFrequently: true });
  const mc = document.createElement('canvas'); mc.width = MW; mc.height = MH;
  const mcx = mc.getContext('2d', { willReadFrequently: true });
  let prev = null; const scores = [], cuts = [0], geo = [], thumbs = [];
  for await (const { k, t, frame } of gridFrames(v, n)) {
    if (!frame) continue;
    drawCover(tctx, frame, v.rot, 54, 96);
    const px = tctx.getImageData(0, 0, 54, 96).data, g = new Uint8Array(54 * 96);
    for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = (px[j] * 0.3 + px[j + 1] * 0.59 + px[j + 2] * 0.11) | 0;
    let isCut = false;
    if (prev) {
      let d = 0; for (let i = 0; i < g.length; i++) d += Math.abs(g[i] - prev[i]);
      d /= g.length;
      const recent = scores.slice(-8), avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
      if (d > 24 && d > 3 * avg + 6 && t - cuts[cuts.length - 1] >= 0.4) { cuts.push(+t.toFixed(3)); isCut = true; }
      scores.push(d);
    }
    prev = g;
    if (isCut && matte) matte.reset();
    if (k % 6 === 0) {
      const f = faces ? await faces.detect((c, w, h) => drawCover(c, frame, v.rot, w, h), W, H) : null;
      let hair = null, prof = null;
      if (matte) {
        drawCover(mcx, frame, v.rot, MW, MH);
        const al = await matte.run(mc, 0.6);
        hair = hairTop(al, MW, MH); prof = silhouette(al, MW, MH);
      }
      if (f) geo.push({ t: +t.toFixed(3), top: f.y, bottom: f.y + f.h, h: f.h, cx: f.x + f.w / 2,
                        hair: hair !== null && hair < f.y ? hair : f.y - 0.35 * f.h, prof });
    }
    if (k % 15 === 0) {
      drawCover(mctx, frame, v.rot, 135, 240);
      const p2 = mctx.getImageData(0, 0, 135, 240).data, g2 = new Uint8Array(135 * 240);
      for (let i = 0, j = 0; i < g2.length; i++, j += 4) g2[i] = (p2[j] * 0.3 + p2[j + 1] * 0.59 + p2[j + 2] * 0.11) | 0;
      thumbs.push({ t, g: g2 });
    }
    if (k % 10 === 0) { onProgress && onProgress(k / n); await new Promise(r => setTimeout(r, 0)); }
  }
  if (v.duration - cuts[cuts.length - 1] < 0.4 && cuts.length > 1) cuts.pop();
  cuts.push(+v.duration.toFixed(3));
  const zones = overlayZones(thumbs, cuts);
  return { cuts, geo, zones, duration: v.duration };
}

/** burned-in logo/watermark: compact, static across visually different shots, near the top or bottom edge */
function overlayZones(thumbs, cuts) {
  const shots = cuts.slice(0, -1).map((a, i) => [a, cuts[i + 1]]);
  const free = shots.map(() => [0, H]);
  const idx = shots.map((s, i) => i).filter(i => shots[i][1] - shots[i][0] > 0.6);
  if (idx.length < 3 || !thumbs.length) return free;
  const sw = 135, sh = 240, N = sw * sh;
  const frames = [], used = [];
  for (const i of idx.slice(0, 16)) {
    const m = (shots[i][0] + shots[i][1]) / 2;
    let best = thumbs[0]; for (const th of thumbs) if (Math.abs(th.t - m) < Math.abs(best.t - m)) best = th;
    frames.push(best.g); used.push(i);
  }
  // only compare shots that look different: a shared set/background must not count as a logo
  const diff = (a, b) => { let d = 0; for (let p = 0; p < N; p += 3) d += Math.abs(a[p] - b[p]); return d / (N / 3); };
  const distinct = [];
  for (const f of frames) if (distinct.every(g => diff(f, g) > 18)) distinct.push(f);
  if (distinct.length < 3) return free;
  const med = new Float32Array(N), tmp = new Array(distinct.length);
  for (let p = 0; p < N; p++) { for (let f = 0; f < distinct.length; f++) tmp[f] = distinct[f][p]; tmp.sort((a, b) => a - b); med[p] = tmp[tmp.length >> 1]; }
  const edge = new Float32Array(N);
  for (let y = 1; y < sh - 1; y++) for (let x = 1; x < sw - 1; x++) {
    const p = y * sw + x, m = (dy, dx) => med[p + dy * sw + dx];
    const gx = -m(-1, -1) - 2 * m(0, -1) - m(1, -1) + m(-1, 1) + 2 * m(0, 1) + m(1, 1);
    const gy = -m(-1, -1) - 2 * m(-1, 0) - m(-1, 1) + m(1, -1) + 2 * m(1, 0) + m(1, 1);
    edge[p] = Math.abs(gx) + Math.abs(gy);
  }
  const closeOf = f => { const c = new Uint8Array(N); for (let p = 0; p < N; p++) c[p] = Math.abs(f[p] - med[p]) < 12 ? 1 : 0; return c; };
  const dclose = distinct.map(closeOf), close = frames.map(closeOf);
  const mask = new Uint8Array(N); let total = 0;
  for (let p = 0; p < N; p++) {
    let s = 0; for (const c of dclose) s += c[p];
    if (s / dclose.length >= 0.6 && edge[p] > 60) { mask[p] = 1; total++; }
  }
  if (total < 15) return free;
  const band = (y0, y1) => {
    // rows with several overlay pixels; keep the densest contiguous run (the logo), drop stray edges
    const rows = [];
    for (let y = y0; y < y1; y++) { let c = 0; for (let x = 0; x < sw; x++) c += mask[y * sw + x]; rows.push(c); }
    let best = null, cur = null, gap = 0;
    rows.forEach((c, i) => {
      if (c >= 3) { if (!cur) cur = { a: i, b: i, n: 0 }; cur.b = i; cur.n += c; gap = 0; }
      else if (cur && ++gap > 2) { if (!best || cur.n > best.n) best = cur; cur = null; gap = 0; }
    });
    if (cur && (!best || cur.n > best.n)) best = cur;
    if (!best || best.n < 15) return null;
    const ya = y0 + best.a, yb = y0 + best.b, xs = [];
    for (let y = ya; y <= yb; y++) for (let x = 0; x < sw; x++) if (mask[y * sw + x]) xs.push(x);
    xs.sort((p, q) => p - q);
    const xlo = xs[Math.floor(0.02 * (xs.length - 1))], xhi = xs[Math.floor(0.98 * (xs.length - 1))];
    if (xhi - xlo > 0.6 * sw || yb - ya > 0.15 * sh) return null;
    return [ya, yb];
  };
  const up = band(0, Math.round(sh * 0.25)), dn = band(Math.round(sh * 0.78), sh);
  if (!up && !dn) return free;
  const top = up ? Math.round((up[1] + 1) * H / sh) + 30 : 0, bottom = dn ? Math.round(dn[0] * H / sh) - 30 : H;
  const zones = shots.map(() => [top, bottom]);
  frames.forEach((f, n) => {
    let hit = 0, cnt = 0;
    for (let p = 0; p < N; p++) {
      const y = (p / sw) | 0;
      const inBand = (up && y >= up[0] && y <= up[1]) || (dn && y >= dn[0] && y <= dn[1]);
      if (mask[p] && inBand) { cnt++; hit += close[n][p]; }
    }
    if (cnt && hit / cnt < 0.85) zones[used[n]] = [0, H];
  });
  return zones;
}
