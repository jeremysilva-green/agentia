// Transcript corrections: map the edited text back onto the word timings.
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export function wordsToText(words) { return words.map(w => w.word).join(' '); }

/** words: [{word,start,end,...}], text: the edited transcript. Returns new words with timings kept
 *  for unchanged words and spread evenly over the time of the words that were replaced. */
export function applyEdits(words, text) {
  const toks = text.split(/\s+/).filter(Boolean);
  if (!toks.length) return [];
  const n = words.length, m = toks.length, A = words.map(w => norm(w.word)), B = toks.map(norm);
  // edit-distance alignment over whole words
  const D = Array.from({ length: n + 1 }, (_, i) => { const r = new Uint32Array(m + 1); r[0] = i; return r; });
  for (let j = 0; j <= m; j++) D[0][j] = j;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
    D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1));
  const ops = []; let i = n, j = m;                      // backtrack: ['=', i, j] | ['~', i, j] | ['-', i] | ['+', j]
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1)) { ops.push([A[i - 1] === B[j - 1] ? '=' : '~', i - 1, j - 1]); i--; j--; }
    else if (i > 0 && D[i][j] === D[i - 1][j] + 1) { ops.push(['-', i - 1]); i--; }
    else { ops.push(['+', -1, j - 1]); j--; }
  }
  ops.reverse();
  // group runs of changes; each run takes the time of the old words it replaces
  const out = [];
  let k = 0;
  while (k < ops.length) {
    if (ops[k][0] === '=') { const [, a, b] = ops[k]; out.push({ ...words[a], word: toks[b] }); k++; continue; }
    const olds = [], news = [];
    while (k < ops.length && ops[k][0] !== '=') { const o = ops[k]; if (o[0] !== '+') olds.push(o[1]); if (o[0] !== '-') news.push(o[2]); k++; }
    if (!news.length) continue;                          // words deleted
    let t0, t1;
    if (olds.length) { t0 = words[olds[0]].start; t1 = words[olds[olds.length - 1]].end; }
    else {                                               // pure insertion: share the previous word's time
      const prev = out[out.length - 1];
      if (prev) { t0 = prev.start; t1 = prev.end; const d = (t1 - t0) / (news.length + 1); prev.end = t0 + d; t0 = prev.end; }
      else { const nx = words.find((_, idx) => !olds.includes(idx)) || words[0]; t0 = Math.max(0, nx.start - 0.3); t1 = nx.start; }
    }
    const d = Math.max(0.01, (t1 - t0) / news.length);
    news.forEach((b, q) => {
      const w = { word: toks[b], start: t0 + q * d, end: t0 + (q + 1) * d };
      if (/^[\p{L}\p{N}-]+(\.[a-z]{2,6})+[.,;:!?]?$/u.test(toks[b])) w.url = true;
      out.push(w);
    });
  }
  return out;
}
