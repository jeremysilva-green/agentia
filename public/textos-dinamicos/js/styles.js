// Motion-text styles. Each block: {tin,tout,height,top,kind,draw(ctx,t,env),cues(),overlay(t)}
import {
  W, H, CX, clamp, prog, lerp, outExpo, outCubic, inCubic, outBack, spring, exitP, rgba, lum, WHITE,
  fit, letters, textWidth, drawText, setFont, glass, roundRect, drawIcon, iconBadge, sparkle, swoosh, ring, hasIcon, shadow, noShadow
} from './fx.js';

const MAXW = 880;
const isPunct = ch => '.?!,:;¡¿'.includes(ch);

class Block {
  constructor(ev) { this.ev = ev; this.tin = ev.tin; this.tout = ev.tout; this.kind = 'front'; this.top = 0; this.behindOk = false; }
  cues() { return []; }
  overlay() { return 0; }
  inMotion(t) { return t < this.tin + 0.75 || t > this.tout - 0.55; }
}

// 1 ─ Editorial serif: small italic line + big serif word ("¿Querés comprar en" / "China?")
export class Editorial extends Block {
  constructor(ev, accent, sizeMax = 300, maxW = MAXW) {
    super(ev); this.behindOk = true; this.accent = accent;
    this.S = fit(ev.big, 'serif', sizeMax, maxW, -0.01, 110);
    this.L = letters(ev.big, 'serif', this.S, -0.01).list;
    const main = ev.accent_big ? accent : WHITE, alt = ev.accent_big ? WHITE : accent;
    this.L.forEach(l => l.color = isPunct(l.ch) ? alt : main);
    this.small = ev.small || '';
    this.ssz = this.small ? fit(this.small, 'inter_mi', 64, MAXW - 90, -0.035, 40) : 64;
    this.sw = this.small ? textWidth(this.small, 'inter_mi', this.ssz, -0.035) : 0;
    this.gap = this.small ? 100 : 0;
    this.height = this.gap + 0.98 * this.S;
    this.icon = hasIcon(ev.icon) ? ev.icon : '';
  }
  baselineOffset() { return this.gap + 0.78 * this.S; }
  aboveHeight() { return this.small ? this.ssz * 0.8 : 0; }
  /** behind the speaker: key word at bigBase (shoulders), lead-in line at aboveBase (over the head) */
  split(bigBase, aboveBase) { this.top = bigBase - this.baselineOffset(); this.smallY = aboveBase; }
  overlay(t) { return prog(t, this.tin, 0.4) * (1 - prog(t, this.tout - 0.4, 0.4)) * 0.7; }
  cues() { return [{ t: this.tin, n: 'whoosh', g: 0.45 }, { t: this.tin + 0.32, n: 'impact', g: 0.35 }]; }
  draw(ctx, t) {
    const { tin, tout, S } = this, base = this.top + this.baselineOffset();
    if (this.small) {
      const u = outExpo(prog(t, tin, 0.75)), e = exitP(t, tout);
      const x = CX + (this.icon ? 34 : 0) - 240 * (1 - u), y = (this.smallY ?? this.top + 52) - 60 * e;
      drawText(ctx, this.small, 'inter_mi', this.ssz, x, y, { alpha: u * (1 - e), track: -0.035, sh: 0.55 });
      if (this.icon) iconBadge(ctx, this.icon, x - this.sw / 2 - 40, y - this.ssz * 0.35, 58, tin + 0.15, t, this.accent, { exit: e });
    }
    ctx.save(); ctx.beginPath(); ctx.rect(0, base - S * 0.86, W, S * 1.12); ctx.clip();
    this.L.forEach((l, k) => {
      const u = outExpo(prog(t, tin + 0.18 + k * 0.045, 0.9)), e = exitP(t, tout, 0.45, k * 0.02);
      if (u > 0) drawText(ctx, l.ch, 'serif', S, CX + l.cx, base + S * (1 - u) - S * e, { color: l.color, sh: 0.5 });
    });
    ctx.restore();
  }
}

// 2 ─ Contrast stack: small bold italic + heavy accent word, swoosh underline
export class Stack extends Block {
  constructor(ev, accent) {
    super(ev); this.accent = accent;
    this.S = Math.min(220, fit(ev.big, 'mont_xb', 220, MAXW, -0.045, 90));
    this.bw = textWidth(ev.big, 'mont_xb', this.S, -0.045);
    this.small = ev.small || '';
    this.ssz = fit(this.small, 'inter_bi', 80, this.bw > 300 ? this.bw : MAXW, -0.045, 44);
    this.sw = textWidth(this.small, 'inter_bi', this.ssz, -0.045);
    this.height = 70 + 0.84 * this.S + 0.3 * this.S;
    this.icon = hasIcon(ev.icon) ? ev.icon : '';
  }
  cues() { return [{ t: this.tin + 0.1, n: 'whoosh_fast', g: 0.45 }, { t: this.tin + 0.65, n: 'swish_soft', g: 0.25 }]; }
  draw(ctx, t) {
    const { tin, tout, S } = this, by = this.top + 70 + 0.84 * S;
    let u = outExpo(prog(t, tin + 0.15, 0.7)), e = exitP(t, tout, 0.42, 0.06);
    const bx = CX + 820 * (1 - u) - 1100 * e;
    drawText(ctx, this.ev.big, 'mont_xb', S, bx, by, { color: this.accent, alpha: clamp(u * 3) * (1 - e), track: -0.045, sh: 0.5 });
    swoosh(ctx, bx - this.bw / 2 + 10, bx + this.bw / 2 - 10, by + S * 0.16, outCubic(prog(t, tin + 0.65, 0.45)), WHITE, 10, 0.9 * (1 - e));
    u = outExpo(prog(t, tin, 0.7)); e = exitP(t, tout, 0.42);
    const left = Math.max(60 + this.sw / 2, CX - this.bw / 2 + this.sw / 2 + 12);
    const sx = left - 700 * (1 - u) - 1100 * e;
    drawText(ctx, this.small, 'inter_bi', this.ssz, sx, this.top + 70, { alpha: clamp(u * 3) * (1 - e), track: -0.045, sh: 0.6 });
    if (this.icon) drawIcon(ctx, this.icon, sx + this.sw / 2 + 44, this.top + 70 - this.ssz * 0.36, 58,
      { p: prog(t, tin + 0.35, 0.5), color: WHITE, alpha: 1 - e, width: 2.4 });
  }
}

// 3 ─ Thin giant two-liner
export class Thin extends Block {
  constructor(ev, accent) {
    super(ev);
    const lines = [ev.line1, ev.line2];
    const longest = lines.reduce((a, b) => textWidth(a, 'mont_thin', 100) > textWidth(b, 'mont_thin', 100) ? a : b);
    this.S = Math.min(260, fit(longest, 'mont_thin', 300, 900, -0.02, 90));
    this.rows = lines.map(txt => { const L = letters(txt, 'mont_thin', this.S, -0.02).list; L.forEach(l => l.color = isPunct(l.ch) ? accent : WHITE); return L; });
    this.height = 2 * this.S;
  }
  cues() { return [{ t: this.tin, n: 'swish_soft', g: 0.5 }, { t: this.tin + 0.3, n: 'swish_soft', g: 0.3, r: 1.2 }]; }
  draw(ctx, t) {
    const S = this.S;
    this.rows.forEach((L, li) => {
      const base = this.top + 0.78 * S + li * S;
      ctx.save(); ctx.beginPath(); ctx.rect(0, base - S * 0.8, W, S * 0.92); ctx.clip();
      L.forEach((l, k) => {
        const u = outExpo(prog(t, this.tin + li * 0.3 + k * 0.035, 0.85)), e = exitP(t, this.tout, 0.45, li * 0.06 + k * 0.02);
        if (u > 0) drawText(ctx, l.ch, 'mont_thin', S, CX + l.cx, base - S * 1.05 * (1 - u) + S * 1.05 * e, { color: l.color, sh: 0.5 });
      });
      ctx.restore();
    });
  }
}

// 4 ─ Glass bullets with icons, each pops when its word is spoken
export class Pills extends Block {
  constructor(ev, accent) {
    super(ev); this.accent = accent; this.glassy = true;
    this.items = ev.items.map(it => {
      const sz = 56, tw = textWidth(it.text, 'pop_xb', sz, -0.02), ic = hasIcon(it.icon) ? it.icon : '';
      const w = tw + 2 * 46 + (ic ? 62 : 0);
      return { ...it, sz, tw, w, h: 124, ic };
    });
    this.height = 124 + 150 * (this.items.length - 1);
  }
  cues() { return this.items.map((it, k) => ({ t: it.t, n: 'bubble', g: 0.4, r: 1 + 0.12 * k })); }
  draw(ctx, t, env) {
    this.items.forEach((it, k) => {
      if (t < it.t) return;
      const side = k % 2 === 0 ? -1 : 1;
      let cx = CX + side * (side < 0 ? 140 : 120);
      cx = Math.min(Math.max(cx, 40 + it.w / 2), W - 40 - it.w / 2);
      const u = spring(prog(t, it.t, 0.9)), e = exitP(t, this.tout, 0.45, k * 0.07);
      const x = cx + side * 900 * (1 - u) + side * 900 * e - it.w / 2, y = this.top + 150 * k;
      const a = clamp(prog(t, it.t, 0.15));
      glass(ctx, env.backdrop, x, y, it.w, it.h, it.h / 2, { alpha: a });
      let tx = x + 46;
      if (it.ic) {
        drawIcon(ctx, it.ic, tx + 22, y + it.h / 2, 48, { p: prog(t, it.t + 0.1, 0.5), color: this.accent, alpha: a, width: 2.5, sh: 0.2 });
        tx += 62;
      }
      drawText(ctx, it.text, 'pop_xb', it.sz, tx + it.tw / 2, y + it.h / 2 + it.sz * 0.36, { alpha: a, track: -0.02, sh: 0.25 });
    });
  }
}

// 5 ─ Glass call-out ("Stand out!"): wipes in, wipes out
export class GlassCallout extends Block {
  constructor(ev, accent) {
    super(ev); this.accent = accent; this.glassy = true;
    this.sz = Math.min(72, fit(ev.text, 'pop_xb', 72, 760, -0.02, 40));
    this.tw = textWidth(ev.text, 'pop_xb', this.sz, -0.02);
    this.icon = hasIcon(ev.icon) ? ev.icon : '';
    this.h = 150; this.w = this.tw + 2 * 64 + (this.icon ? 80 : 0);
    this.height = this.h;
  }
  cues() { return [{ t: this.tin, n: 'swish_soft', g: 0.45 }, { t: this.tin + 0.18, n: 'bubble', g: 0.3, r: 0.9 },
                   { t: this.tout - 0.45, n: 'swish_soft', g: 0.3, r: 1.3 }]; }
  draw(ctx, t, env) {
    const u = outExpo(prog(t, this.tin, 0.7)), e = inCubic(prog(t, this.tout - 0.5, 0.45));
    const x = CX - this.w / 2 - 160 * (1 - u), y = this.top;
    // reveal from the left, exit wipes left->right
    const c0 = x - 40 + (this.w + 80) * e, c1 = x - 40 + (this.w + 80) * clamp(u * 1.15);
    if (c1 <= c0) return;
    glass(ctx, env.backdrop, x, y, this.w, this.h, this.h / 2, { alpha: clamp(u * 2), clipX0: c0, clipX1: c1 });
    ctx.save(); ctx.beginPath(); ctx.rect(c0, y - 40, c1 - c0, this.h + 80); ctx.clip();
    drawText(ctx, this.ev.text, 'pop_xb', this.sz, x + 64 + this.tw / 2, y + this.h / 2 + this.sz * 0.36, { track: -0.02, sh: 0.3 });
    if (this.icon) drawIcon(ctx, this.icon, x + this.w - 64 - 30, y + this.h / 2, 56, { p: prog(t, this.tin + 0.3, 0.5), color: this.accent, width: 2.6 });
    ctx.restore();
  }
}

// 6 ─ Counter
export class Counter extends Block {
  constructor(ev, accent) {
    super(ev); this.accent = accent; this.val = +ev.value; this.dec = Number.isInteger(this.val) ? 0 : 1;
    this.S = Math.min(190, fit(this.fmt(this.val), 'mont_m', 190, MAXW, -0.02, 90));
    this.label = ev.label || ''; this.lsz = fit(this.label, 'inter_mi', 58, MAXW, -0.03, 36);
    this.icon = hasIcon(ev.icon) ? ev.icon : '';
    this.ih = this.icon ? 110 : 0;
    this.height = this.ih + 0.95 * this.S + (this.label ? 100 : 0);
  }
  fmt(v) {
    let s = v.toLocaleString('en-US', { minimumFractionDigits: this.dec, maximumFractionDigits: this.dec });
    if ((this.ev.thousands || '.') === '.') s = s.replace(/,/g, '§').replace(/\./g, ',').replace(/§/g, '.');
    return (this.ev.prefix || '') + s + (this.ev.suffix || '');
  }
  cues() {
    const c = []; for (let k = 0; k < 14; k++) c.push({ t: this.tin + 0.1 + 1.3 * Math.pow(k / 14, 1.6), n: 'tick', g: 0.18 });
    c.push({ t: this.tin + 1.5, n: 'shimmer', g: 0.45 }); return c;
  }
  draw(ctx, t) {
    const S = this.S, base = this.top + this.ih + 0.78 * S;
    if (this.icon) iconBadge(ctx, this.icon, CX, this.top + 46, 86, this.tin, t, this.accent, { exit: exitP(t, this.tout) });
    ring(ctx, CX, base - S * 0.35, S * 1.1, t - (this.tin + 1.5), this.accent);
    const u = outCubic(prog(t, this.tin + 0.1, 1.4));
    let v = this.val * u; if (!this.dec) v = Math.round(v);
    const ui = outExpo(prog(t, this.tin, 0.8)), e = exitP(t, this.tout);
    ctx.save(); ctx.beginPath(); ctx.rect(0, base - S * 0.82, W, S * 0.98); ctx.clip();
    drawText(ctx, this.fmt(v), 'mont_m', S, CX, base + S * (1 - ui) - S * e, { track: -0.02, sh: 0.5 });
    ctx.restore();
    if (this.label) {
      const u2 = outExpo(prog(t, this.tin + 0.4, 0.8)), e2 = exitP(t, this.tout, 0.4, 0.05);
      drawText(ctx, this.label, 'inter_mi', this.lsz, CX, base + 100 + 90 * (1 - u2) + 40 * e2, { color: this.accent, alpha: u2 * (1 - e2), track: -0.03, sh: 0.55 });
    }
  }
}

// 7 ─ Notification card
export class Card extends Block {
  constructor(ev, accent, brand = '', mono = '') {
    super(ev); this.accent = accent; this.glassy = true; this.mono = mono || '•';
    this.title = ev.title || brand || ev.body; this.body = (ev.title || brand) ? ev.body : '';
    this.icon = hasIcon(ev.icon) ? ev.icon : ''; this.w = 880; this.h = 196; this.height = this.h;
    this.tsz = fit(this.title, 'inter_b', 44, 560, 0, 28); this.bsz = fit(this.body || ' ', 'inter_m', 38, 640, 0, 24);
  }
  cues() { return [{ t: this.tin + 0.12, n: 'ding', g: 0.4 }]; }
  draw(ctx, t, env) {
    const u = spring(prog(t, this.tin, 1.0), 2.0, 5.0), e = exitP(t, this.tout, 0.5);
    const s = lerp(0.9, 1.0, outCubic(prog(t, this.tin, 0.6))), a = clamp(prog(t, this.tin, 0.2)) * (1 - e);
    const cy = this.top + this.h / 2 - 560 * (1 - u) - 520 * e;
    if (a <= 0.003) return;
    ctx.save(); ctx.translate(CX, cy); ctx.scale(s, s); ctx.translate(-CX, -cy);
    const x = CX - this.w / 2, y = cy - this.h / 2;
    glass(ctx, env.backdrop, x, y, this.w, this.h, 52, { alpha: a, tint: 0.06, rim: 0.35 });
    ctx.save(); ctx.globalAlpha *= a * 0.55; roundRect(ctx, x, y, this.w, this.h, 52); ctx.fillStyle = 'rgb(16,17,22)'; ctx.fill(); ctx.restore();
    const ix = x + 34, iy = y + (this.h - 116) / 2;
    ctx.save(); ctx.globalAlpha *= a; roundRect(ctx, ix, iy, 116, 116, 30); ctx.fillStyle = rgba(this.accent); ctx.fill(); ctx.restore();
    const ic = lum(this.accent) > 170 ? [20, 20, 20] : WHITE;
    if (this.icon) drawIcon(ctx, this.icon, ix + 58, iy + 58, 60, { p: prog(t, this.tin + 0.25, 0.5), color: ic, alpha: a, width: 2.4, sh: 0 });
    else drawText(ctx, this.mono, 'mont_bk', this.mono.length <= 2 ? 52 : 40, ix + 58, iy + 58 + 19, { color: ic, alpha: a, sh: 0 });
    const tx = ix + 116 + 30;
    drawText(ctx, this.title, 'inter_b', this.tsz, tx, this.body ? y + 80 : y + this.h / 2 + this.tsz * 0.36, { alpha: a, align: 'left', sh: 0 });
    if (this.body) drawText(ctx, this.body, 'inter_m', this.bsz, tx, y + 134, { alpha: a * 0.88, align: 'left', sh: 0 });
    drawText(ctx, 'ahora', 'inter_m', 32, x + this.w - 36, y + 80, { alpha: a * 0.5, align: 'right', sh: 0 });
    ctx.restore();
  }
}

// 8 ─ Collage (the reference style): light lead-in / bold connector / huge key word / light tail,
//     overlapping, mixed weights and opacity modes, sparkle on the key word
export class Collage extends Block {
  constructor(ev, accent, sizeMax = 250, maxW = 840) {
    super(ev); this.behindOk = true; this.accent = accent;
    const tiers = ev.tiers || {};
    this.A = 76; this.B = 80;
    this.S = Math.min(sizeMax, fit(ev.big, 'pop_bk', sizeMax, maxW, -0.03, 110));
    this.bw = textWidth(ev.big, 'pop_bk', this.S, -0.03);
    const T = this.T = [];
    let y = 0;
    if (ev.top) { this.topSz = fit(ev.top, 'pop_l', this.A, 760, -0.02, 44); y += this.topSz * 0.95; T.push({ k: 'top', text: ev.top, key: 'pop_l', sz: this.topSz, by: y, t: tiers.top ?? ev.tin }); }
    if (ev.mid) { const sz = fit(ev.mid, 'pop_xb', this.B, 520, -0.02, 44); y += ev.top ? sz * 0.66 : sz * 0.95; T.push({ k: 'mid', text: ev.mid, key: 'pop_xb', sz, by: y, t: tiers.mid ?? ev.tin + 0.15 }); }
    y += (T.length ? 0.74 : 0.8) * this.S; this.bigBy = y;
    T.push({ k: 'big', text: ev.big, key: 'pop_bk', sz: this.S, by: y, t: tiers.big ?? ev.tin + 0.3 });
    if (ev.tail) { const sz = fit(ev.tail, 'pop_l', this.A, 600, -0.02, 44); y += sz * 0.78; T.push({ k: 'tail', text: ev.tail, key: 'pop_l', sz, by: y, t: tiers.tail ?? ev.tin + 0.45 }); }
    this.height = y + this.S * 0.12;
    // horizontal composition: lead-in a bit right, connector tucked left, tail right-aligned to the key word
    const L = CX - this.bw / 2, R = CX + this.bw / 2;
    for (const tr of T) {
      tr.w = textWidth(tr.text, tr.key, tr.sz, -0.02);
      if (tr.k === 'top') tr.x = Math.min(R - tr.w / 2, CX + Math.min(60, this.bw * 0.08));
      else if (tr.k === 'mid') tr.x = Math.max(60 + tr.w / 2, L + tr.w / 2 + this.bw * 0.08);
      else if (tr.k === 'tail') tr.x = Math.min(W - 60 - tr.w / 2, R - tr.w / 2 + 10);
      else tr.x = CX;
      tr.x = Math.max(50 + tr.w / 2, Math.min(W - 50 - tr.w / 2, tr.x));
    }
    this.icon = hasIcon(ev.icon) ? ev.icon : '';
  }
  baselineOffset() { return this.bigBy; }
  aboveHeight() { const above = this.T.filter(t => t.k === 'top' || t.k === 'mid'); return above.length ? above[above.length - 1].by - above[0].by + above[0].sz * 0.8 : 0; }
  split(bigBase, aboveBase) {
    const above = this.T.filter(t => t.k === 'top' || t.k === 'mid'), last = above[above.length - 1];
    this.top = bigBase - this.bigBy;
    this.yOf = tr => (tr.k === 'top' || tr.k === 'mid') ? aboveBase - (last.by - tr.by) : bigBase + (tr.by - this.bigBy);
  }
  overlay(t) { return prog(t, this.tin, 0.4) * (1 - prog(t, this.tout - 0.4, 0.4)) * 0.55; }
  cues() {
    const rate = { top: 1.25, mid: 1.05, big: 0.8, tail: 1.15 };
    const c = this.T.map(tr => ({ t: tr.t, n: 'pop', g: tr.k === 'big' ? 0.45 : 0.3, r: rate[tr.k] }));
    const big = this.T.find(x => x.k === 'big');
    c.push({ t: big.t + 0.05, n: 'impact', g: 0.22 }, { t: big.t + 0.12, n: 'shimmer', g: 0.3 },
           { t: this.tout - 0.45, n: 'swish_soft', g: 0.25, r: 1.2 });
    return c;
  }
  draw(ctx, t) {
    const e = inCubic(prog(t, this.tout - 0.48, 0.45));
    // exit: soft wipe left -> right
    const wipe = this.T.length ? (e > 0) : false;
    ctx.save();
    if (wipe) {
      const x0 = -100 + (W + 200) * e;
      ctx.beginPath(); ctx.rect(x0, 0, W, H); ctx.clip();
    }
    for (const tr of this.T) {
      const dt = t - tr.t; if (dt < 0) continue;
      const by = (this.yOf ? this.yOf(tr) : this.top + tr.by) - 30 * e;
      if (tr.k === 'big') {
        // opacity mode: fades up from 40% through a blur, settles with a vertical opacity gradient
        const u = clamp(dt / 0.42), sc = dt < 0.14 ? lerp(1.28, 0.97, outCubic(dt / 0.14)) : lerp(0.97, 1, outCubic(clamp((dt - 0.14) / 0.2)));
        const a = lerp(0.4, 1, outCubic(u));
        const g = ctx.createLinearGradient(0, by - tr.sz * 0.75, 0, by + tr.sz * 0.05);
        g.addColorStop(0, rgba(this.accent, 1)); g.addColorStop(1, rgba(this.accent, 0.62));
        if (u < 1) ctx.filter = `blur(${(1 - outCubic(u)) * 14}px)`;
        drawText(ctx, tr.text, tr.key, tr.sz, tr.x, by, { alpha: a, scale: sc, track: -0.03, sh: 0.35, fill: g });
        ctx.filter = 'none';
        sparkle(ctx, tr.x + this.bw / 2 - 10, by - tr.sz * 0.72, dt - 0.08, WHITE, 64, 7, 2);
        if (this.icon) drawIcon(ctx, this.icon, tr.x + this.bw / 2 + 4, by - tr.sz * 0.98, 62,
          { p: prog(dt, 0.15, 0.5), color: WHITE, alpha: clamp((dt - 0.1) * 5), width: 2.4 });
      } else if (tr.k === 'mid') {
        // translucent bold accent connector, pops with a slight tilt
        const u = clamp(dt / 0.22), sc = dt < 0.1 ? lerp(0.5, 1.12, outCubic(dt / 0.1)) : lerp(1.12, 1, clamp((dt - 0.1) / 0.12));
        ctx.save(); ctx.translate(tr.x, by - tr.sz * 0.35); ctx.rotate((1 - u) * -0.12); ctx.translate(-tr.x, -(by - tr.sz * 0.35));
        drawText(ctx, tr.text, tr.key, tr.sz, tr.x, by, { color: this.accent, alpha: 0.88 * clamp(dt / 0.06), scale: sc, track: -0.02, sh: 0.3 });
        ctx.restore();
      } else {
        // light lead-in / tail: fade + drift, tracking settles
        const u = outExpo(clamp(dt / 0.5)), dir = tr.k === 'tail' ? 1 : -1;
        drawText(ctx, tr.text, tr.key, tr.sz, tr.x + dir * 60 * (1 - u), by, { alpha: 0.95 * u, track: -0.02 + 0.08 * (1 - u), sh: 0.45 });
      }
    }
    ctx.restore();
  }
}

// 9 ─ Captions: every other word pops in on its syllable
export class CaptionGroup extends Block {
  constructor(g, accent) {
    super({ tin: g.t0, tout: g.t1 }); this.accent = accent;
    const full = g.words.map(w => w.text).join(' ');
    this.size = fit(full, 'inter_bi', 92, 860, -0.04, 48);
    const space = textWidth(' ', 'inter_bi', this.size);
    const ws = g.words.map(w => ({ ...w, w: textWidth(w.text, 'inter_bi', this.size, -0.04) }));
    const tw = ws.reduce((s, w) => s + w.w, 0) + space * (ws.length - 1);
    let x = CX - tw / 2;
    for (const w of ws) { w.x = x + w.w / 2; x += w.w + space; }
    this.words = ws; this.height = this.size * 1.25;
  }
  inMotion(t) { return false; }
  cues(ticks) {
    return this.words.flatMap(w => w.hi ? [{ t: w.pop, n: 'pop', g: 0.22, r: 1.35 }] : (ticks ? [{ t: w.pop, n: 'tick', g: 0.07 }] : []));
  }
  draw(ctx, t) {
    const base = this.top + this.size * 0.95, out = clamp((t - (this.tout - 0.09)) / 0.09);
    for (const w of this.words) {
      const dt = t - w.pop; if (dt < 0) continue;
      const sc = dt < 0.08 ? lerp(0.55, 1.1, outCubic(dt / 0.08)) : dt < 0.17 ? lerp(1.1, 1, (dt - 0.08) / 0.09) : 1;
      const a = clamp(dt / 0.05) * (1 - out);
      drawText(ctx, w.text, 'inter_bi', this.size, w.x, base + 14 * (1 - clamp(dt / 0.12)) - 10 * out,
        { color: w.hi ? this.accent : WHITE, alpha: a, scale: sc * (1 - 0.06 * out), track: -0.04, sh: 0.6 });
      if (w.hi) sparkle(ctx, w.x + w.w / 2 + 6, base - this.size * 0.8, dt - 0.04, this.accent, 34, 6, w.i);
    }
  }
}

export function build(ev, accent, brand, mono) {
  switch (ev.style) {
    case 'editorial': return new Editorial(ev, accent);
    case 'stack': return new Stack(ev, accent);
    case 'thin': return new Thin(ev, accent);
    case 'pills': return new Pills(ev, accent);
    case 'glass': return new GlassCallout(ev, accent);
    case 'counter': return new Counter(ev, accent);
    case 'card': return new Card(ev, accent, brand, mono);
    case 'collage': return new Collage(ev, accent);
  }
  return null;
}
