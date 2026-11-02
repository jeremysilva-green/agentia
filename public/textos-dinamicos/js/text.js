// Transcript clean-up before planning: web addresses as one piece, Paraguayan voseo.

// ---------------------------------------------------------------- web addresses / emails
const TLD = new Set('com py net org io ar es co app ai me tv shop store info online site web uy br cl mx us ly gg link'.split(' '));
const punct = w => (w.match(/[,.;:!?]+$/) || [''])[0];
const bare = w => w.replace(/^[¿¡"“(]+/, '').replace(/[,;:!?"”)]+$/, '').replace(/\.+$/, '');

// how people say / how speech models write top-level domains: "pe i", "pe i griega", "pei", "pi" -> py; "con" -> com
const SPOKEN = [
  [['pe', 'i', 'griega'], 'py'], [['p', 'i', 'griega'], 'py'], [['pe', 'ye'], 'py'], [['pe', 'y'], 'py'], [['pe', 'i'], 'py'],
  [['p', 'i'], 'py'], [['p', 'y'], 'py'], [['pei'], 'py'], [['pey'], 'py'], [['pi'], 'py'], [['pie'], 'py'], [['py'], 'py'],
  [['peigriega'], 'py'], [['con'], 'com'], [['com'], 'com'], [['comp'], 'com'], [['net'], 'net'], [['org'], 'org'],
  [['ar'], 'ar'], [['es'], 'es'], [['io'], 'io'], [['app'], 'app'], [['ai'], 'ai'], [['co'], 'co'], [['uy'], 'uy'], [['br'], 'br'],
];
const tok = w => bare(w).toLowerCase().replace(/[.\-]/g, '');
/** spoken domain ending starting at words[i] -> [tld, howManyWords] or null */
function spokenTld(words, i) {
  for (const [seq, tld] of SPOKEN) {
    if (i + seq.length > words.length) continue;
    if (seq.every((s, k) => tok(words[i + k].word) === s)) return [tld, seq.length];
  }
  return null;
}
const fixTldTail = s => s.replace(/\.(pei|pey|pi|pie)$/i, '.py').replace(/\.con(?=\.|$)/i, '.com');

/** "agentia" ".com" ".py" / "agentia punto com punto pe i" / "info arroba agentia.com" -> one token */
export function mergeUrls(words) {
  const out = [];
  for (let i = 0; i < words.length; i++) {
    const w = { ...words[i] };
    const b = bare(w.word).toLowerCase();
    const prev = out[out.length - 1];
    const isTld = s => TLD.has(s.replace(/^\./, ''));
    // "punto" + spoken ending ("punto pe i", "punto con")
    if (prev && (b === 'punto' || b === 'dot' || b === '.') && i + 1 < words.length) {
      const sp = spokenTld(words, i + 1);
      if (sp) { const last = words[i + sp[1]]; join(prev, '.' + sp[0], last); i += sp[1]; continue; }
    }
    // ".com" said, then "pe i" without "punto": Paraguay's ".com.py"
    if (prev && prev.url && /\.com$/.test(bare(prev.word).toLowerCase())) {
      const sp = spokenTld(words, i);
      if (sp && sp[0] === 'py') { const last = words[i + sp[1] - 1]; join(prev, '.py', last); i += sp[1] - 1; continue; }
    }
    // ".com", ".py" glued after the previous token
    if (prev && /^\.[a-z]{2,9}$/.test(b) && isTld(fixTldTail('x' + b).slice(1))) { join(prev, fixTldTail('x' + b).slice(1), w); continue; }
    // "punto com"
    if (prev && (b === 'punto' || b === 'dot') && i + 1 < words.length && isTld(bare(words[i + 1].word).toLowerCase())) {
      const nx = words[++i]; join(prev, '.' + bare(nx.word).toLowerCase(), nx); continue;
    }
    // "arroba" / "@"
    if (prev && (b === 'arroba' || b === '@' || b === 'at' && prev.url) && i + 1 < words.length) {
      const nx = words[++i]; join(prev, '@' + bare(nx.word).toLowerCase(), nx); continue;
    }
    // a token that already looks like a domain: "agentia.com.py"
    const bb = fixTldTail(b);
    if (/^[\p{L}\p{N}-]+(\.[a-z]{2,6})+$/u.test(bb) && isTld(bb.split('.').pop())) { w.word = bb + keepTail(w.word); w.url = true; }
    out.push(w);
  }
  return out;
}
function keepTail(word) { const p = punct(word).replace(/\./g, ''); return p; }
function join(prev, piece, nx) {
  const base = bare(prev.word).toLowerCase().replace(/^www\.?/, 'www.');
  prev.word = base + piece + keepTail(nx.word);
  prev.end = nx.end; prev.url = true;
}

// ---------------------------------------------------------------- Paraguayan voseo
// tú / vosotros forms that are unambiguous -> voseo
const ALWAYS = {
  tienes: 'tenés', puedes: 'podés', quieres: 'querés', sabes: 'sabés', eres: 'sos', vienes: 'venís', haces: 'hacés',
  dices: 'decís', vas: 'vas', estás: 'estás', necesitas: 'necesitás', buscas: 'buscás', piensas: 'pensás', sientes: 'sentís',
  prefieres: 'preferís', encuentras: 'encontrás', pierdes: 'perdés', entiendes: 'entendés', vuelves: 'volvés', cuentas: 'contás',
  mandas: 'mandás', compras: 'comprás', ves: 'ves',
  tenéis: 'tenés', podéis: 'podés', queréis: 'querés', sabéis: 'sabés', sois: 'sos', venís: 'venís', hacéis: 'hacés', decís: 'decís',
  estáis: 'estás', vais: 'vas', necesitáis: 'necesitás', buscáis: 'buscás', habéis: 'has',
  // imperatives with pronouns (only imperative)
  escríbenos: 'escribinos', escríbeme: 'escribime', mándanos: 'mandanos', mándame: 'mandame', llámanos: 'llamanos', llámame: 'llamame',
  contáctanos: 'contactanos', síguenos: 'seguinos', sígueme: 'seguime', dime: 'decime', dinos: 'decinos', pregúntanos: 'preguntanos',
  cuéntanos: 'contanos', cuéntame: 'contame', visítanos: 'visitanos', escúchame: 'escuchame', muéstranos: 'mostranos', avísanos: 'avisanos',
  escríbenos: 'escribinos', únete: 'unite', suscríbete: 'suscribite', anímate: 'animate', apúrate: 'apurate', regístrate: 'registrate',
  descárgala: 'descargala', pruébalo: 'probalo', pruébala: 'probala', aprovéchalo: 'aprovechalo', mírala: 'mirala', míralo: 'miralo',
  // vosotros imperatives
  tened: 'tené', venid: 'vení', mirad: 'mirá', probad: 'probá', comprad: 'comprá', escuchad: 'escuchá', llamad: 'llamá',
  escribid: 'escribí', aprovechad: 'aprovechá', visitad: 'visitá', consultad: 'consultá', pedid: 'pedí', elegid: 'elegí', decid: 'decí',
  haced: 'hacé', poned: 'poné', salid: 'salí', sabed: 'sabé', pensad: 'pensá', buscad: 'buscá', encontrad: 'encontrá',
  descubrid: 'descubrí', entrad: 'entrá', reservad: 'reservá', agendad: 'agendá', mandad: 'mandá', contactad: 'contactá', id: 'andá',
};
// tú imperatives that are also other words: only at the start of a phrase
const AT_START = {
  ven: 'vení', ten: 'tené', haz: 'hacé', pon: 'poné', sal: 'salí', di: 'decí', elige: 'elegí', pide: 'pedí',
  mira: 'mirá', escucha: 'escuchá', aprovecha: 'aprovechá', llama: 'llamá', contacta: 'contactá', visita: 'visitá', descubre: 'descubrí',
  encuentra: 'encontrá', prueba: 'probá', consulta: 'consultá', compra: 'comprá', reserva: 'reservá', agenda: 'agendá', entra: 'entrá',
  escribe: 'escribí', piensa: 'pensá', busca: 'buscá', imagina: 'imaginá', olvida: 'olvidá', recuerda: 'recordá', sigue: 'seguí',
  vuelve: 'volvé', cuenta: 'contá', pregunta: 'preguntá', manda: 'mandá', deja: 'dejá', toma: 'tomá', usa: 'usá', conoce: 'conocé',
  empieza: 'empezá', comienza: 'comenzá', suma: 'sumá', publica: 'publicá', vende: 'vendé', alquila: 'alquilá', invierte: 'invertí',
  comparte: 'compartí', guarda: 'guardá', decide: 'decidí', ahorra: 'ahorrá', gana: 'ganá', invita: 'invitá', llega: 'llegá',
  ingresa: 'ingresá', completa: 'completá', solicita: 'solicitá', agrega: 'agregá', crea: 'creá', descarga: 'descargá', registra: 'registrá',
  disfruta: 'disfrutá', cambia: 'cambiá', mejora: 'mejorá', mueve: 'mové', abre: 'abrí', sube: 'subí', escoge: 'escogé', confía: 'confiá',
};
// vosotros imperative + "que" -> present voseo ("tened que" -> "tenés que")
const PRESENT = { tened: 'tenés', podéd: 'podés', sabed: 'sabés', venid: 'venís', haced: 'hacés' };
const SUBJECT = new Set(['él', 'ella', 'usted', 'ellos', 'ellas', 'ustedes', 'que', 'se', 'lo', 'la', 'le', 'me', 'te', 'nos', 'les']);

function caseLike(src, rep) { return /^\p{Lu}/u.test(src) ? rep[0].toUpperCase() + rep.slice(1) : rep; }

const IMPER = new Set([...Object.values(AT_START), ...Object.values(ALWAYS)].filter(v => /[áéí]$|nos$|me$/.test(v)));

export function voseo(words) {
  let lastImp = -9;                                   // index of the last imperative in this sentence
  return words.map((w, i) => {
    if (i && /[.!?]$/.test(words[i - 1].word)) lastImp = -9;
    const r = conv(w, i);
    if (IMPER.has(bare(r.word).toLowerCase())) lastImp = i;
    return r;
  });
  function conv(w, i) {
    if (w.url) return w;
    const lead = (w.word.match(/^[¿¡"“(]+/) || [''])[0], tail = (w.word.match(/[,.;:!?"”)]+$/) || [''])[0];
    const core = w.word.slice(lead.length, w.word.length - tail.length), low = core.toLowerCase();
    const next = words[i + 1] ? bare(words[i + 1].word).toLowerCase() : '';
    const prevW = words[i - 1];
    const prevB = prevW ? bare(prevW.word).toLowerCase() : '';
    // start of a phrase, or chained command: "Entrá a ... y aprovechá"
    const atStart = i === 0 || /[.!?¡¿,;:]$/.test(prevW.word) || !!lead || ((prevB === 'y' || prevB === 'e') && lastImp >= 0 && i - lastImp <= 8);
    let rep = null;
    if (next === 'que' && PRESENT[low]) rep = PRESENT[low];
    else if (ALWAYS[low]) rep = ALWAYS[low];
    else if (AT_START[low] && atStart && !SUBJECT.has(prevW ? bare(prevW.word).toLowerCase() : '')) rep = AT_START[low];
    if (!rep || rep === low) return w;
    return { ...w, word: lead + caseLike(core, rep) + tail };
  }
}

export function cleanTranscript(words, lang) {
  let out = mergeUrls(words);
  if (lang === 'es' || lang === 'auto') out = voseo(out);
  return out;
}
