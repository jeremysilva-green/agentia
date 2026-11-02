// Fix proper names the speech model mishears ("Villa Murra" -> "Villa Morra").
// Built-in Paraguay glossary + names the user types in.
export const GLOSSARY = `Villa Morra, Carmelitas, Recoleta, Las Lomas, Mburucuyá, Ycuá Satí, Manorá, Los Laureles, Herrera,
Las Mercedes, Sajonia, Santísima Trinidad, Mburicaó, Villa Aurelia, San Cristóbal, Mariscal López, Aviadores del Chaco,
Santa Teresa, España, Madame Lynch, Lambaré, San Lorenzo, Luque, Fernando de la Mora, Mariano Roque Alonso, Capiatá,
Limpio, Ñemby, Villa Elisa, San Antonio, Itauguá, Areguá, San Bernardino, Altos, Encarnación, Ciudad del Este,
Hernandarias, Pedro Juan Caballero, Coronel Oviedo, Caacupé, Villarrica, Concepción, Asunción, Paraguay, Paraguaya,
Paraguayo, Shopping del Sol, Paseo La Galería, Mariscal López Shopping, Shopping Mariscal, Costanera, Ñu Guasu,
Agentia, Buzón Prime, guaraníes`.split(',').map(s => s.trim()).filter(Boolean);

const COMMON = new Set('agencia agencias agente agentes gentil villa villas lomas loma mercedes santa santo sol paraguas luque luego limpio limpia altos alto espana herrera'.split(' '));
const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ñ]/g, '');
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

/** words: [{word,start,end}]; extra: user string "Agentia, Villa Morra, ..." */
export function fixNames(words, extra = '') {
  const user = extra.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  const names = [...new Set([...user, ...GLOSSARY])].map(n => ({ text: n, toks: n.split(/\s+/), key: strip(n) }))
    .filter(n => n.key.length >= 4).sort((a, b) => b.toks.length - a.toks.length || b.key.length - a.key.length);
  const out = words.map(w => ({ ...w }));
  const done = new Set();
  for (const nm of names) {
    const L = nm.toks.length;
    for (let i = 0; i + L <= out.length; i++) {
      if ([...Array(L).keys()].some(k => done.has(i + k))) continue;
      const span = out.slice(i, i + L), key = strip(span.map(w => w.word).join(''));
      if (!key || key[0] !== nm.key[0]) continue;
      const d = lev(key, nm.key);
      const tol = nm.key.length >= 10 ? 2 : 1;
      if (d === 0 && span.map(w => w.word.replace(/[^\p{L}\p{N}]/gu, '')).join(' ') === nm.text) continue;   // already right
      if (d > tol) continue;
      // single words: accents/case are always fixed; spelling only when used as a name
      // (capitalized mid-sentence), so ordinary words like "agencia" are never touched
      if (L === 1) {
        const w = span[0].word.replace(/^[¿¡"“(]+/, ''), prevEnds = i === 0 || /[.?!]$/.test(out[i - 1].word);
        const asName = /^\p{Lu}/u.test(w) && !prevEnds;
        if (COMMON.has(key) && !asName) continue;                       // "limpio", "agencia" stay as words
        if (d > 0 && (!asName || COMMON.has(key) || nm.key.length < 5)) continue;
      }
      const lead = (span[0].word.match(/^[¿¡"“(]+/) || [''])[0], tail = (span[L - 1].word.match(/[,.;:!?"”)]+$/) || [''])[0];
      nm.toks.forEach((t, k) => { out[i + k].word = (k === 0 ? lead : '') + t + (k === L - 1 ? tail : ''); done.add(i + k); });
    }
  }
  return out;
}
