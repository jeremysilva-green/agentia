// Zoom plan, safe areas, face-aware placement and behind-the-subject decisions.
import { W, H, FPS, clamp, lerp, inOutCubic } from './fx.js';
import { Editorial, Collage } from './styles.js';

const SAFE_TOP = 150, SAFE_BOTTOM = 1560;

export function geoIn(geo, t0, t1) { return geo.filter(g => g.t >= t0 && g.t <= t1); }

export function zoomPlan(cuts, geo) {
  const plan = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i], b = cuts[i + 1], L = b - a;
    const amp = L < 1 ? 0 : L < 2.5 ? 0.035 : 0.055;
    const g = geoIn(geo, a, b);
    const med = arr => { const s = [...arr].sort((x, y) => x - y); return s[s.length >> 1]; };
    const cy = g.length ? med(g.map(x => (x.top + x.bottom) / 2)) : H * 0.45;
    const cx = g.length ? med(g.map(x => x.cx)) : W / 2;
    plan.push(i % 2 === 0 ? [a, b, 1, 1 + amp, cx, cy] : [a, b, 1 + amp, 1, cx, cy]);
  }
  return plan;
}
export function zoomAt(plan, t) {
  for (const [a, b, s0, s1, cx, cy] of plan) if (t >= a && t < b) return [lerp(s0, s1, inOutCubic(clamp((t - a) / Math.max(b - a, 1e-3)))), cx, cy];
  return [1, W / 2, H / 2];
}

export function safeBand(an, t0, t1) {
  let top = SAFE_TOP, bottom = SAFE_BOTTOM;
  const c = an.cuts;
  for (let i = 0; i < c.length - 1; i++) if (c[i + 1] > t0 && c[i] < t1) { top = Math.max(top, an.zones[i][0]); bottom = Math.min(bottom, an.zones[i][1]); }
  return [top, bottom];
}

/** below the face (chest) if it fits, else above the head, else centred */
export function placeFront(block, an, zplan) {
  const hb = block.height, [stop, sbot] = safeBand(an, block.tin, block.tout);
  const g = geoIn(an.geo, block.tin - 0.1, block.tout + 0.1);
  if (g.length < 1) return Math.min(Math.max(H * 0.5 - hb / 2, stop), sbot - hb);
  const pts = g.map(x => { const [s, cx, cy] = zoomAt(zplan, x.t); return [cy + (x.top - cy) * s, cy + (x.bottom - cy) * s, x.h * s]; });
  const ft = Math.min(...pts.map(p => p[0])), fb = Math.max(...pts.map(p => p[1]));
  const fh = pts.map(p => p[2]).sort((a, b) => a - b)[pts.length >> 1];
  const top = fb + 0.5 * fh;
  if (top + hb <= sbot) return top;
  if (fb + 0.2 * fh + hb <= sbot) return sbot - hb;
  const above = ft - 0.45 * fh - hb;          // leave room for hair
  if (above >= stop) return above;
  return sbot - hb;
}

function shotOf(cuts, t) {
  for (let i = 0; i < cuts.length - 1; i++) if (t >= cuts[i] && t < cuts[i + 1]) return [cuts[i], cuts[i + 1]];
  return [cuts[cuts.length - 2], cuts[cuts.length - 1]];
}

/** Which hero events can sit behind the speaker, and their geometry. Returns blocks with kind 'behind'. */
export function placeBehind(events, blocks, an, zplan, accent) {
  const cand = [];
  events.forEach((ev, i) => {
    if (!['editorial', 'collage'].includes(ev.style)) return;
    const [a, b] = shotOf(an.cuts, (ev.tin + ev.tout) / 2);
    if (ev.tin < a - 0.15 || ev.tout > b + 0.15) return;
    const g = geoIn(an.geo, ev.tin, ev.tout), samples = Math.max(1, Math.floor((ev.tout - ev.tin) * 5));
    if (g.length < 0.7 * samples) return;
    if (Math.min(...g.map(x => x.hair)) < 330) return;
    cand.push(i);
  });
  const hinted = cand.filter(i => events[i].behind);
  const chosen = hinted.length ? hinted.slice(0, 3) : cand.filter(i => i === cand[0] || i === cand[cand.length - 1]);
  for (const i of chosen) {
    const ev = events[i];
    const g = geoIn(an.geo, ev.tin, ev.tout);
    const sc = g.map(x => { const [s, cx, cy] = zoomAt(zplan, x.t); return { hair: cy + (x.hair - cy) * s, chin: cy + (x.bottom - cy) * s, h: x.h * s }; });
    const tops = sc.map(x => x.hair).sort((a, b) => a - b);
    const ht = tops[Math.floor(tops.length * 0.1)];
    const chin = Math.max(...sc.map(x => x.chin)), fh = sc.map(x => x.h).sort((a, b) => a - b)[sc.length >> 1];
    const [stop, sbot] = safeBand(an, ev.tin, ev.tout);
    // behind the speaker the key word is sized to span the frame edge to edge (short words get huge)
    const FILLW = W * 0.96, CAP = ev.style === 'editorial' ? 820 : 640;
    const make = size => ev.style === 'editorial' ? new Editorial(ev, accent, size, FILLW) : new Collage(ev, accent, size, FILLW);
    let placed = false;
    // how much of a word of width ww with baseline y and size S stays visible (not covered by the person)
    const visible = (y, S, ww) => {
      const L = W / 2 - ww / 2, R = W / 2 + ww / 2, covers = [];
      for (const x of g) {
        if (!x.prof) continue;
        const [s, cx, cy] = zoomAt(zplan, x.t);
        for (let yy = y - 0.7 * S; yy <= y; yy += 12) {
          const y0 = cy + (yy - cy) / s, r = Math.round(y0 / H * (x.prof.length / 2));
          if (r < 0 || r >= x.prof.length / 2 || x.prof[2 * r] < 0) { covers.push(0); continue; }
          const pl = cx + (x.prof[2 * r] - cx) * s, pr = cx + (x.prof[2 * r + 1] - cx) * s;
          covers.push(Math.max(0, Math.min(R, pr) - Math.max(L, pl)) / ww);
        }
      }
      if (!covers.length) return 1;
      covers.sort((a, b) => a - b);
      return 1 - covers[Math.floor(covers.length * 0.8)];
    };
    // 1) as low as possible (down to the shoulders) while at least ~55% of the key word stays readable;
    //    the lead-in line goes above the head
    const full = Math.min(CAP, make(CAP).S);                              // largest size that still fits the frame width
    for (let size = full; size >= 160 && !placed; size = Math.round(size * 0.93)) {
      const b = make(size);
      const ww = ev.style === 'editorial' ? b.L.reduce((m, l) => Math.max(m, Math.abs(l.cx) + l.w / 2), 0) * 2 : b.bw;
      const above = b.aboveHeight(), aboveBase = ht - 26;
      if (above && aboveBase - above < stop) break;                      // no room over the head for the lead-in
      const lowest = Math.min(chin + 0.6 * fh, sbot - 0.25 * b.S);
      const highest = Math.max(ht + 0.25 * b.S, aboveBase + 0.75 * b.S + 10);   // never above the head top region
      for (let y = lowest; y >= highest && !placed; y -= 20) {
        if (y - 0.75 * b.S < stop) continue;                                // keep the top of the letters inside the frame
        if (visible(y, b.S, ww) < 0.45) continue;
        b.split(y, aboveBase); b.kind = 'behind'; blocks[i] = b; ev.layer = 'behind'; placed = true;
      }
    }
    // 2) fallback: whole block at head level
    for (let size = full; size >= 150 && !placed; size = Math.round(size * 0.95)) {
      const b = make(size);
      const sink = ev.style === 'editorial' ? 0.17 : 0.34;
      const top = ht + sink * b.S - b.baselineOffset();
      if (top >= stop) { b.kind = 'behind'; b.top = top; blocks[i] = b; ev.layer = 'behind'; placed = true; }
    }
  }
  return chosen;
}
