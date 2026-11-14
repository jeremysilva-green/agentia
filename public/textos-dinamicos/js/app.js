// Motion Texts — browser app: UI + orchestration.
import { W, H, FPS, hexRgb, loadFonts, loadIcons } from './fx.js';
import { build, CaptionGroup } from './styles.js';
import { browserSupported, openVideo, decodeAudio, createEncoder } from './media.js';
import { transcribe, audio16k, loadASR } from './asr.js';
import { planVideo } from './plan.js';
import { fixNames } from './names.js';
import { cleanTranscript } from './text.js';
import { applyEdits, wordsToText } from './edit.js';
import { Matte, Faces } from './matte.js';
import { analyzeVideo } from './analyze.js';
import { zoomPlan, placeFront, placeBehind } from './layout.js';
import { renderVideo } from './render.js';
import { loadSfx, collectCues, mixAudio } from './audio.js';

const CFG = Object.assign({ assets: new URL('../', import.meta.url).href }, window.MT_CONFIG || {});
const $ = s => document.querySelector(s);
const STAGES_FULL = [['read', 'Leyendo el video', 0.03], ['listen', 'Transcribiendo la voz', 0.22], ['shots', 'Analizando las tomas', 0.14],
                ['plan', 'Eligiendo frases clave', 0.02], ['render', 'Animando y exportando', 0.54], ['sound', 'Mezclando efectos de sonido', 0.05]];
// re-render after correcting the text: no transcription or analysis, so the bar is spread over the remaining steps
const STAGES_FIX = [['plan', 'Eligiendo frases clave', 0.02], ['render', 'Animando y exportando', 0.9], ['sound', 'Mezclando efectos de sonido', 0.08]];
let STAGES = STAGES_FULL;
const STYLE_NAMES = { editorial: 'Editorial', stack: 'Contraste', thin: 'Fina', pills: 'Viñetas', card: 'Tarjeta', counter: 'Contador', collage: 'Collage', glass: 'Cristal' };
const SW = ['#0a8f5c', '#f5a623', '#ff5a36', '#ff3d7f', '#a78bfa', '#3b82f6', '#22d3ee', '#4ade80', '#e8ff3d'];
const store = { get: k => { try { return localStorage.getItem('mt_' + k); } catch (e) { return null; } },
                set: (k, v) => { try { localStorage.setItem('mt_' + k, v); } catch (e) {} } };

let file = null, accent = store.get('accent') || '#0a8f5c', mode = 'all', busy = false, cancel = false, outUrl = null;
let sfxOn = store.get('sfx') !== '0', sfxVol = +(store.get('vol') || 0.8), ticks = store.get('ticks') === '1';
let assetsReady = null;
let last = null;          // { file, v, audio, an, words } from the last run, reused when the text is corrected

function loadAssets() {
  if (!assetsReady) assetsReady = Promise.all([
    loadFonts(CFG.assets + 'assets/fonts/'), loadIcons(CFG.assets + 'assets/icons.json'), loadSfx(CFG.assets + 'assets/sfx/'),
    Matte.create(CFG.assets + 'models/rvm.onnx'), Faces.create(CFG.assets + 'models/face.onnx'),
  ]).then(([, , sfx, matte, faces]) => ({ sfx, matte, faces }));
  return assetsReady;
}

// ---------------------------------------------------------------- UI: accent, mode, sound
function setAccent(c) {
  accent = c.toLowerCase(); document.documentElement.style.setProperty('--accent', accent);
  $('#picker').value = accent; $('#hex').value = accent.toUpperCase();
  document.querySelectorAll('.sw').forEach(el => el.classList.toggle('sel', el.dataset.c === accent));
  store.set('accent', accent);
}
SW.forEach(c => { const d = document.createElement('button'); d.className = 'sw'; d.style.background = c; d.dataset.c = c; d.title = c.toUpperCase();
  d.setAttribute('aria-label', 'Color ' + c); d.onclick = () => setAccent(c); $('#sw').insertBefore(d, $('.custom')); });
$('#picker').oninput = e => setAccent(e.target.value);
$('#hex').onchange = e => { let v = e.target.value.trim(); if (!v.startsWith('#')) v = '#' + v; /^#[0-9a-f]{6}$/i.test(v) ? setAccent(v) : ($('#hex').value = accent.toUpperCase()); };
setAccent(accent);
function setMode(m) { mode = m; document.querySelectorAll('#seg button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); store.set('mode', m); }

$('#sfxOn').checked = sfxOn; $('#sfxVol').value = sfxVol; $('#ticks').checked = ticks;
const syncSfx = () => { sfxOn = $('#sfxOn').checked; sfxVol = +$('#sfxVol').value; ticks = $('#ticks').checked;
  $('#sfxVol').disabled = $('#ticks').disabled = !sfxOn; store.set('sfx', sfxOn ? '1' : '0'); store.set('vol', sfxVol); store.set('ticks', ticks ? '1' : '0'); };
['#sfxOn', '#sfxVol', '#ticks'].forEach(s => $(s).oninput = syncSfx); syncSfx();
$('#preview').onclick = async () => { const { sfx } = await loadAssets(); const ctx = new AudioContext();
  ['whoosh', 'pop', 'bubble', 'ding'].forEach((n, i) => { const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = sfx[n]; g.gain.value = 0.5 * sfxVol; s.connect(g); g.connect(ctx.destination); s.start(ctx.currentTime + i * 0.45); }); };

// ---------------------------------------------------------------- UI: file
const drop = $('#drop');
['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) pick(f); });
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('video')) pick(f); });
$('#file').onchange = e => { if (e.target.files[0]) pick(e.target.files[0]); };
$('#replace').onclick = () => $('#file').click();

function pick(f) {
  if (busy) return;
  file = f; last = null;
  const v = $('#srcVid'); v.src = URL.createObjectURL(f); v.play().catch(() => {});
  v.onloadedmetadata = () => { $('#srcInfo').textContent = `${v.videoWidth}×${v.videoHeight} · ${fmt(v.duration)} · ${(f.size / 1048576).toFixed(1)} MB`; };
  $('#srcName').textContent = f.name;
  drop.style.display = 'none'; $('#src').style.display = 'flex';
  $('#go').disabled = false; $('#hint').textContent = 'Todo se procesa en tu navegador. Dejá esta pestaña abierta.';
  resetResult(); loadAssets().catch(() => {}); loadASR().catch(() => {});
}
const fmt = s => { s = Math.round(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function resetResult() {
  $('#out').style.display = 'none'; $('#out').removeAttribute('src'); $('#canvas').style.display = 'none';
  $('#empty').style.display = 'block'; $('#dl').style.display = 'none'; $('#phr').style.display = 'none'; $('#fix').style.display = 'none'; $('#err').style.display = 'none';
}

// ---------------------------------------------------------------- progress
let done = 0, cur = null;
function showSteps() {
  $('#steps').style.display = 'block'; $('#stepList').innerHTML = ''; done = 0;
  STAGES.forEach(([k, l]) => { const d = document.createElement('div'); d.className = 'step'; d.id = 'st_' + k;
    d.innerHTML = `<span class="ic"></span><span class="nm">${l}</span>`; $('#stepList').appendChild(d); });
  bar(0);
}
function stage(k) {
  if (cur) { $('#st_' + cur).className = 'step done'; done += STAGES.find(s => s[0] === cur)[2]; }
  cur = k; if (k) $('#st_' + k).className = 'step act';
  bar(done);
}
function sub(u) { const w = STAGES.find(s => s[0] === cur)[2]; bar(done + w * Math.min(1, u)); }
function bar(p) { $('#barFill').style.width = (p * 100).toFixed(1) + '%'; $('#genBar').style.width = (p * 100).toFixed(1) + '%'; $('#genPct').textContent = Math.round(p * 100) + '%'; $('#hint').textContent = busy ? `Procesando… ${Math.round(p * 100)}% · dejá esta pestaña abierta` : $('#hint').textContent; }

// ---------------------------------------------------------------- pipeline
// Agently gate: the panel page that embeds this tool owns plan/trial checks.
// It charges a try (free plan) before a video is made and gets it back if that fails.
function askHost(type) {
  return new Promise(resolve => {
    if (window.parent === window) return resolve({ ok: false, error: 'Abrí esta herramienta desde tu panel de Agently.' });
    const id = Math.random().toString(36).slice(2);
    const timer = setTimeout(() => { removeEventListener('message', onMsg); resolve({ ok: false, error: 'No pude verificar tu plan. Recargá la página.' }); }, 15000);
    function onMsg(e) {
      if (e.origin !== location.origin || e.source !== window.parent || !e.data || e.data.id !== id) return;
      clearTimeout(timer); removeEventListener('message', onMsg); resolve(e.data);
    }
    addEventListener('message', onMsg);
    window.parent.postMessage({ source: 'mt', type, id }, location.origin);
  });
}

$('#go').onclick = () => generate(null);
$('#applyFix').onclick = () => {
  if (!last || busy) return;
  const text = $('#fixText').value.trim();
  if (!text) return fail('El texto está vacío.');
  generate(applyEdits(last.words, text));
};
$('#resetFix').onclick = () => { if (last) $('#fixText').value = wordsToText(last.auto); };

/** edited: corrected words (reuses the video, transcription and analysis from the last run), or null for a full run */
async function generate(edited) {
  if (!file || busy) return;
  if (!browserSupported()) return fail('Este navegador no puede crear el video. Usá Chrome, Edge o Safari 17+ en una computadora.');
  const reuse = edited && last && last.file === file;
  // The video itself costs one try on the free plan; correcting the text of a video already made here does not.
  let charged = false;
  if (!reuse) {
    busy = true; $('#go').disabled = $('#applyFix').disabled = true;
    const gate = await askHost('start');
    if (!gate.ok) { busy = false; $('#go').disabled = $('#applyFix').disabled = false; return fail(gate.error || 'No tenés acceso a esta herramienta.'); }
    charged = true;
  }
  STAGES = reuse ? STAGES_FIX : STAGES_FULL;
  busy = true; cancel = false; $('#go').disabled = $('#applyFix').disabled = true; resetResult(); showSteps(); cur = null;
  $('#genSub').textContent = 'Dejá esta pestaña abierta'; $('#gen').classList.add('on');
  const t0 = performance.now();
  try {
    let v, audio, an, words;
    const { sfx, matte, faces } = await loadAssets();
    if (reuse) {
      ({ v, audio, an } = last); words = edited;
    } else {
      stage('read');
      v = await openVideo(file);
      if (v.duration > 300) throw new Error('Usá videos de hasta 5 minutos.');
      audio = await decodeAudio(v);
      if (!audio) throw new Error('El video no tiene audio legible, así que no hay voz para animar.');

      stage('listen');
      const lang = $('#lang').value;
      store.set('lang', lang);
      words = (window.MT_TEST && window.MT_TEST.words) || null;
      if (!words) {
        const pcm = await audio16k(audio);
        words = await transcribe(pcm, lang, u => { sub(u); $('#genSub').textContent = u < 0.6 ? 'Descargando el modelo de voz (solo la primera vez)…' : 'Dejá esta pestaña abierta'; });
      }
      if (!words || words.length < 3) throw new Error('No se detectó voz en el video.');
      const names = $('#names').value.trim(); store.set('names', names);
      words = fixNames(cleanTranscript(words, lang), names);

      stage('shots');
      an = await analyzeVideo(v, matte, faces, sub);
    }
    if (words.length < 1) throw new Error('No quedaron palabras para animar.');
    last = { file, v, audio, an, words, auto: reuse ? last.auto : words };

    stage('plan');
    const plan = planVideo(words, an.cuts, v.duration, mode === 'all');
    plan.source = 'auto';

    // build + lay out
    const acc = hexRgb(accent);
    const zplan = zoomPlan(an.cuts, an.geo);
    const blocks = plan.events.map(ev => build(ev, acc, plan.brand, plan.monogram));
    placeBehind(plan.events, blocks, an, zplan, acc);
    blocks.forEach((b, i) => { if (b.kind !== 'behind') { b.top = placeFront(b, an, zplan); plan.events[i].layer = 'front'; } });
    const caps = (plan.captions || []).map(g => { const b = new CaptionGroup(g, acc); b.top = placeFront(b, an, zplan); return b; });
    const all = [...blocks, ...caps];
    window.MT_DEBUG = { an, plan, blocks: all.map(b => ({ s: b.ev && b.ev.style, kind: b.kind, top: Math.round(b.top), h: Math.round(b.height), S: b.S && Math.round(b.S), tin: b.tin, tout: b.tout })) };

    stage('render');
    const enc = await createEncoder(true);
    const canvas = $('#canvas'); canvas.width = W; canvas.height = H; canvas.style.display = 'block'; $('#empty').style.display = 'none';
    await renderVideo({ v, blocks: all, zplan, cuts: an.cuts, geo: an.geo, matte, enc, canvas, onProgress: sub, shouldStop: () => cancel });

    stage('sound');
    const mixed = await mixAudio(audio, v.duration, collectCues(all, { ticks }), sfx, { enabled: sfxOn, volume: sfxVol });
    await enc.addAudio(mixed);
    const blob = await enc.finish();
    charged = false;
    stage(null);
    done = 1; bar(1);
    showResult(blob, plan, (performance.now() - t0) / 1000, enc);
    $('#fixText').value = wordsToText(words); $('#fix').style.display = 'block';
  } catch (e) {
    console.error(e); fail(e.message || String(e));
    if (charged) { charged = false; askHost('failed'); }
    if (last && last.file === file) $('#fix').style.display = 'block';
  } finally {
    busy = false; $('#go').disabled = $('#applyFix').disabled = false; $('#gen').classList.remove('on');
  }
}

function showResult(blob, plan, secs, enc) {
  if (outUrl) URL.revokeObjectURL(outUrl);
  outUrl = URL.createObjectURL(blob);
  const v = $('#out'); v.src = outUrl; v.style.display = 'block'; $('#canvas').style.display = 'none'; $('#empty').style.display = 'none';
  v.play().catch(() => {});
  const dl = $('#dl'); dl.href = outUrl; dl.download = (file.name.replace(/\.[^.]+$/, '') || 'video') + '_motion.mp4'; dl.style.display = 'flex';
  $('#go').textContent = 'Generar de nuevo';
  const notes = (plan.notes || []).join(' ');
  $('#hint').textContent = `Listo en ${fmt(secs)} · ${(blob.size / 1048576).toFixed(1)} MB` + (enc.audioCodec === 'opus' ? ' · audio en Opus' : '') + (notes ? ' · ' + notes : '');
  const ol = $('#phrList'); ol.innerHTML = '';
  plan.events.forEach(e => {
    const li = document.createElement('li');
    const text = e.style === 'pills' ? e.items.map(i => i.text).join(' · ') : e.style === 'collage' ? [e.top, e.mid, e.big, e.tail].filter(Boolean).join(' ')
      : e.style === 'thin' ? `${e.line1} ${e.line2}` : e.style === 'card' ? e.body : e.style === 'glass' ? e.text
      : e.style === 'counter' ? `${e.prefix || ''}${e.value}${e.suffix || ''} ${e.label || ''}` : `${e.small || ''} ${e.big || ''}`;
    li.innerHTML = `<span class="t">${fmt(e.tin)}</span><span class="x"></span>` + (e.layer === 'behind' ? '<span class="tag b">Detrás</span>' : '') +
                   `<span class="tag">${STYLE_NAMES[e.style] || e.style}</span>`;
    li.querySelector('.x').textContent = text; ol.appendChild(li);
  });
  $('#phrSrc').textContent = 'elegidas automáticamente' +
                             (plan.captions && plan.captions.length ? ` · ${plan.captions.length} grupos de subtítulos` : '');
  $('#phr').style.display = 'block';
  window.MT_RESULT = { size: blob.size, events: plan.events.length, secs };
}
function fail(msg) {
  $('#err').textContent = msg || 'Algo salió mal.'; $('#err').style.display = 'block';
  document.querySelectorAll('.step.act').forEach(e => e.classList.remove('act'));
  window.MT_RESULT = { error: msg };
}

$('#lang').value = store.get('lang') || 'es';
$('#names').value = store.get('names') || '';
if (!browserSupported()) { $('#err').textContent = 'Este navegador no puede crear el video. Usá Chrome, Edge o Safari 17+ en una computadora.'; $('#err').style.display = 'block'; }
