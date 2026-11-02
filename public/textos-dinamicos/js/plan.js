// Automatic phrase picking (no AI service needed): complete short clauses become motion texts,
// spoken lists become glass bullets, numbers become counters, everything else becomes captions.

const ICON_WORDS = {
  plane: 'aéreo aereo avión avion vuelo vuelos air plane flight flights', ship: 'marítimo maritimo barco mar sea ship boat',
  package: 'paquete paquetes pedido pedidos caja envío envio envíos package order orders parcel box', truck: 'entrega entregas delivery camión camion truck',
  globe: 'mundo china internacional global world país', 'shopping-cart': 'compra compras comprar carrito shop buy cart tienda',
  link: 'link links enlace url', camera: 'foto fotos photo photos camera cámara', 'message-circle': 'mensaje consulta consultas escribinos escribenos chat message dm whatsapp',
  phone: 'llamá llamar llamanos teléfono call phone', house: 'casa casas hogar home house depto departamento', 'dollar-sign': 'precio precios dinero plata money price cost costo',
  clock: 'tiempo rápido rapido rápida hora horas time fast minutos', users: 'mayoristas clientes equipo team clients gente', star: 'mejor mejores calidad premium best',
  rocket: 'crecer crecé lanzá launch grow', target: 'objetivo meta goal', lightbulb: 'idea ideas tip consejo',
  'shield-check': 'seguro segura seguridad garantía safe secure', gift: 'regalo gratis free gift', tag: 'oferta descuento sale deal promo',
  'map-pin': 'ubicación dirección asunción location zona', 'trending-up': 'ventas crecimiento growth más', 'circle-help': 'cómo como qué que por',
  'circle-check': 'listo fácil facil simple easy', store: 'negocio negocios empresa business store', user: 'vos personal personales you',
  'credit-card': 'pago pagar pagos tarjeta pay payment', calendar: 'día días semana fecha date week', heart: 'amor encanta love',
};
const W2I = {}; for (const [k, v] of Object.entries(ICON_WORDS)) for (const w of v.split(' ')) if (!W2I[w]) W2I[w] = k;
const norm = w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
export function iconFor(text) {
  for (const t of (text || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || []) if (W2I[t] && t.length > 3) return W2I[t];
  return '';
}
const STOP = new Set(`para pero porque cuando donde desde hasta sobre entre también tenemos tienen puedes podés quieres querés
cómo como este esta estos estas esto that this with have from they there their about would could should which what your you
the and los las del una uno unos unas que con por sin más muy todo toda todos todas cada mismo`.split(/\s+/));
const LINK = new Set(['y', 'o', 'e', 'u', 'and', 'or', 'ou']);
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const cleanW = w => w.replace(/^[¿¡"“(]+|[,.;:!?"”)]+$/g, '');

function clauses(words) {
  const out = []; let cur = [];
  words.forEach((w, i) => { cur.push(i); if (/[.,;:?!]$/.test(w.word)) { out.push(cur); cur = []; } });
  if (cur.length) out.push(cur);
  return out;
}

/** spoken lists: "aéreo y marítimo", "link o una foto" -> bullets */
function findLists(words) {
  const res = [];
  for (let i = 1; i < words.length - 1; i++) {
    if (!LINK.has(norm(words[i].word))) continue;
    let a = i - 1, b = i + 1;
    if (['una', 'un', 'el', 'la', 'a', 'the'].includes(norm(words[b].word)) && b + 1 < words.length) b++;
    if (words[a].url || words[b].url) continue;
    const A = cleanW(words[a].word), B = cleanW(words[b].word);
    if (A.length < 3 || B.length < 3 || STOP.has(norm(A)) || STOP.has(norm(B))) continue;
    if (/^[.@]/.test(A) || /^[.@]/.test(B) || /[áéí]$/.test(B) && /^\p{Lu}/u.test(B)) continue;
    // a real list: the 2nd item closes the idea (end of phrase, or followed by a linking word), and the
    // 1st item is not the end of a previous phrase
    const after = b + 1 < words.length ? norm(words[b + 1].word) : '';
    const closes = /[,.;:?!]$/.test(words[b].word) || !after || ['para', 'en', 'de', 'con', 'que', 'sin', 'por', 'a', 'al', 'del', 'o', 'y', 'como', 'desde', 'hasta'].includes(after);
    if (!closes) continue;
    if (/[.,;:?!]$/.test(words[a].word)) continue;
    if (words[b].start - words[a].start > 2.5) continue;
    res.push({ style: 'pills', start: a, end: b, items: [{ text: cap(A), word: a, icon: iconFor(A) }, { text: cap(B), word: b, icon: iconFor(B) }] });
  }
  return res;
}

export function rulesPlan(words) {
  const evs = [];
  const lists = findLists(words);
  const ROT = ['collage', 'stack', 'glass', 'collage', 'thin', 'card', 'collage', 'stack'];
  let k = 0;
  const cls = clauses(words).filter(c => c.length >= 2 && c.length <= 6);
  const used = new Set();
  for (const l of lists) for (let i = l.start; i <= l.end; i++) used.add(i);
  const cands = [];
  for (const c of cls) {
    if (c.some(i => used.has(i) || words[i].url)) continue;
    const toks = c.map(i => cleanW(words[i].word)).filter(Boolean);
    if (toks.length < 2) continue;
    const raw = c.map(i => words[i].word).join(' ');
    const isQ = /\?$/.test(raw) || /^¿/.test(raw);
    const last = toks[toks.length - 1], lead = toks.slice(0, -1).join(' ');
    const text = toks.join(' ');
    const num = toks.find(t => /^\d[\d.,]*$/.test(t));
    let ev = null;
    if (num) {
      const v = parseFloat(num.replace(/\./g, '').replace(',', '.'));
      if (isFinite(v)) ev = { style: 'counter', value: v, label: toks.filter(t => t !== num).join(' ').slice(0, 24) };
    }
    if (!ev && isQ && !cands.some(x => x.style === 'editorial')) ev = { style: 'editorial', small: '¿' + cap(lead.replace(/^¿/, '')), big: last + '?' };
    if (!ev && !cands.length && last.length <= 12) ev = { style: 'editorial', small: cap(lead), big: last + (/[!?]$/.test(raw) ? raw.slice(-1) : '.') };   // open with a hero
    if (!ev) {
      for (let tries = 0; tries < ROT.length && !ev; tries++) {
        const st = ROT[(k + tries) % ROT.length];
        if (st === 'collage' && toks.length <= 5 && last.length <= 9 && lead.length <= 22)
          ev = toks.length >= 3 ? { style: 'collage', top: toks.slice(0, -2).join(' '), mid: toks[toks.length - 2], big: last, tail: '' }
                                : { style: 'collage', top: lead, mid: '', big: last, tail: '' };
        else if (st === 'stack' && toks.length <= 4 && last.length <= 10) ev = { style: 'stack', small: lead, big: last };
        else if (st === 'glass' && text.length <= 20) ev = { style: 'glass', text: cap(text) + (/[!?]$/.test(raw) ? raw.slice(-1) : '') };
        else if (st === 'thin' && toks.length <= 3 && toks.every(t => t.length <= 12)) ev = { style: 'thin', line1: cap(toks.slice(0, -1).join(' ')), line2: last + '.' };
        else if (st === 'card' && text.length <= 34) ev = { style: 'card', title: '', body: cap(text) };
        if (ev) k = (k + tries + 1) % ROT.length;
      }
    }
    if (!ev) continue;
    ev.start = c[0]; ev.end = c[c.length - 1]; ev.icon = ev.icon || iconFor(text);
    cands.push(ev);
  }
  // web addresses / emails: always shown whole, as a glass call-out
  const urls = [];
  words.forEach((w, i) => { if (w.url) urls.push({ style: 'glass', text: w.word.replace(/[,;:!?]+$/, ''), start: i, end: i, icon: w.word.includes('@') ? 'mail' : 'mouse-pointer-click', must: true }); });
  // merge, keep a comfortable pace (one every ~3 s); addresses win over everything else
  const all = [...urls, ...cands.filter(c => !urls.some(u => u.start >= c.start && u.start <= c.end)), ...lists].sort((a, b) => a.start - b.start);
  const clash = (x, y) => words[x.start].start < words[y.end].end + 2.6 && words[y.start].start < words[x.end].end + 2.6;
  const keep = all.filter(e => e.must);
  for (const ev of all) if (!ev.must && !keep.some(k => clash(k, ev))) keep.push(ev);
  keep.sort((a, b) => a.start - b.start);
  evs.push(...keep);
  // hero moments go behind the speaker: first and last editorial/collage
  const heroes = evs.filter(e => e.style === 'editorial' || e.style === 'collage');
  if (heroes.length) { heroes[0].behind = true; heroes[heroes.length - 1].behind = true; }
  return evs;
}

// ---------------------------------------------------------------- timing
export function finalize(evs, words, cuts, duration) {
  const out = [], inner = cuts.slice(1, -1);
  evs.forEach((e, i) => {
    const s = words[e.start].start, en = words[e.end].end;
    let tin, need;
    if (e.style === 'pills') {
      e.items.forEach(it => it.t = Math.max(0, words[it.word].start - 0.08));
      tin = e.items[0].t - 0.05; need = e.items[e.items.length - 1].t + 1.5;
    } else { tin = Math.max(0, s - 0.15); need = tin + 2.4; }
    const nxt = i + 1 < evs.length ? words[evs[i + 1].start].start - 0.25 : duration - 0.1;
    let tout = Math.max(en + 0.9, need);
    for (const c of inner) if (c >= tout - 0.4 && c <= tout + 2.0 && c - tin >= 1.4) { tout = c; break; }
    tout = Math.min(tout, nxt, duration - 0.1);
    if (out.length && tin < out[out.length - 1].tout + 0.12) {
      tin = out[out.length - 1].tout + 0.12;
      if (e.style === 'pills' && e.items[0].t < tin - 0.3) return;
    }
    if (tout - tin < 1.1) return;
    e.tin = +tin.toFixed(3); e.tout = +tout.toFixed(3);
    if (e.style === 'collage') {
      const tiers = ['top', 'mid', 'big', 'tail'].filter(k => e[k]), idx = [];
      for (let j = e.start; j <= e.end; j++) idx.push(j);
      e.tiers = {};
      tiers.forEach((k, n) => { const j = idx[Math.min(idx.length - 1, Math.round(n * (idx.length - 1) / Math.max(1, tiers.length - 1)))]; e.tiers[k] = Math.max(e.tin, words[j].start - 0.06); });
    }
    out.push(e);
  });
  return out;
}

// ---------------------------------------------------------------- captions for every other word
export function adjustEvents(events, words) {
  const covered = new Set();
  for (const e of events) for (let i = e.start; i <= e.end; i++) covered.add(i);
  events.forEach((e, i) => {
    const en = words[e.end].end;
    let nxt = null; for (let k = e.end + 1; k < words.length; k++) if (!covered.has(k)) { nxt = words[k].start; break; }
    if (nxt === null) return;
    let tout = Math.min(e.tout, Math.max(nxt + 0.05, en + 0.3, e.tin + 1.2));
    if (i + 1 < events.length) tout = Math.min(tout, events[i + 1].tin - 0.05);
    e.tout = +Math.max(tout, e.tin + 0.8).toFixed(3);
  });
  return covered;
}

export function highlights(words, covered) {
  const out = new Set(); let last = -9;
  words.forEach((w, i) => {
    const t = norm(w.word);
    if (covered.has(i) || t.length < 7 || STOP.has(t) || w.start - last < 4.5) return;
    out.add(i); last = w.start;
  });
  return out;
}

export function captionGroups(words, events, covered, duration, hl) {
  const spans = events.map(e => [e.tin, e.tout]);
  const blocked = t => { for (const [a, b] of spans) if (t >= a - 0.05 && t < b) return b - 0.12; return t; };
  const groups = []; let cur = null, prev = null;
  words.forEach((w, i) => {
    if (covered.has(i)) { prev = null; return; }
    const text = w.word.trim().replace(/[,.;:]+$/, '') || w.word.trim();
    if (!text) return;
    const pop = blocked(w.start - 0.03);
    const chars = cur ? cur.words.reduce((n, x) => n + x.text.length + 1, 0) : 0;
    const brk = !cur || cur.words.length >= 3 || chars + text.length > 16 || prev === null || i !== prev + 1
      || /[,.;:?!]$/.test(words[prev].word) || w.start - words[prev].end > 0.35
      || (pop > w.start && cur && cur.words[cur.words.length - 1].pop < pop - 0.2);
    if (brk) { cur = { words: [] }; groups.push(cur); }
    const p = cur.words.length ? Math.max(pop, cur.words[cur.words.length - 1].pop + 0.04) : pop;
    cur.words.push({ i, text, pop: +p.toFixed(3), hi: hl.has(i) });
    prev = i;
  });
  groups.forEach(g => g.t0 = g.words[0].pop);
  groups.forEach((g, k) => {
    let end = words[g.words[g.words.length - 1].i].end + 0.45;
    if (k + 1 < groups.length) end = Math.min(end, groups[k + 1].t0);
    for (const [a] of spans) if (a > g.t0) { end = Math.min(end, a); break; }
    g.t1 = +Math.min(end, duration - 0.02).toFixed(3);
  });
  return groups.filter(g => g.t1 - g.t0 > 0.08);
}

export function planVideo(words, cuts, duration, everyWord = true) {
  const events = finalize(rulesPlan(words), words, cuts, duration);
  const covered = everyWord ? adjustEvents(events, words) : new Set();
  const caps = everyWord ? captionGroups(words, events, covered, duration, highlights(words, covered)) : [];
  return { events, captions: caps, brand: '', monogram: '' };
}
