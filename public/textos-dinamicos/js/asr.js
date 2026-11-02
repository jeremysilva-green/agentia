// Speech -> words with timings, fully in the browser (Whisper via transformers.js).
// The model downloads from Hugging Face's public CDN on first use, then the browser caches it.
import { pipeline, env } from '../vendor/tfjs/transformers.min.js';

env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.wasmPaths = new URL('../vendor/tfjs/', import.meta.url).href;
env.backends.onnx.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1)) : 1;

// small = much better Spanish; base is the lighter fallback
const MODELS = ['onnx-community/whisper-small_timestamped', 'Xenova/whisper-small', 'onnx-community/whisper-base_timestamped', 'Xenova/whisper-base'];
let asr = null, loading = null, progressCb = null;

/** loads once; later callers share the same download and receive its progress */
export function loadASR(onProgress) {
  if (onProgress) progressCb = onProgress;
  if (asr) return Promise.resolve(asr);
  if (!loading) loading = doLoad().catch(e => { loading = null; throw e; });
  return loading;
}
async function doLoad() {
  let last = null;
  for (const id of MODELS) {
    try {
      const files = {};
      asr = await pipeline('automatic-speech-recognition', id, {
        device: 'wasm',
        progress_callback: p => {
          if (p.status === 'progress' && p.total) {
            files[p.file] = [p.loaded, p.total];
            const v = Object.values(files), l = v.reduce((s, x) => s + x[0], 0), t = v.reduce((s, x) => s + x[1], 0);
            progressCb && progressCb(l / t);
          }
        },
      });
      return asr;
    } catch (e) { last = e; console.warn('ASR model failed', id, e); }
  }
  throw new Error('No se pudo cargar el modelo de voz. Revisá tu conexión a internet e intentá de nuevo. (' + (last && last.message) + ')');
}

/** 16 kHz mono Float32Array from an AudioBuffer */
export async function audio16k(audioBuffer) {
  const n = Math.ceil(audioBuffer.duration * 16000);
  const ctx = new OfflineAudioContext(1, n, 16000);
  const src = ctx.createBufferSource(); src.buffer = audioBuffer; src.connect(ctx.destination); src.start();
  return (await ctx.startRendering()).getChannelData(0);
}

const LANG = { es: 'spanish', en: 'english', pt: 'portuguese' };

/** returns [{word, start, end}] */
export async function transcribe(pcm, lang, onProgress) {
  const model = await loadASR(u => onProgress && onProgress(0.6 * u));
  const opts = { return_timestamps: 'word', chunk_length_s: 30, stride_length_s: 3, task: 'transcribe' };
  if (LANG[lang]) opts.language = LANG[lang];
  onProgress && onProgress(0.62);
  let out = await model(pcm, opts);
  let words = toWords(out.chunks || []);
  const dur = pcm.length / 16000;
  if (!timingsLookRight(words, dur)) {
    // fallback: sentence-level timestamps, words spread by length inside each sentence
    const seg = await model(pcm, { ...opts, return_timestamps: true });
    words = spread(seg.chunks || [], dur);
  }
  onProgress && onProgress(1);
  return words;
}

function toWords(chunks) {
  const words = [];
  for (const c of chunks) {
    const text = (c.text || '').trim();
    if (!text) continue;
    let [s, e] = c.timestamp || [null, null];
    if (s == null) continue;
    if (e == null || e < s) e = s + 0.3;
    // whisper sometimes glues punctuation as its own chunk
    if (/^[.,;:?!¿¡…]+$/.test(text) && words.length) { words[words.length - 1].word += text; continue; }
    words.push({ word: text, start: +s.toFixed(3), end: +e.toFixed(3) });
  }
  for (let i = 0; i < words.length - 1; i++) words[i].end = Math.min(words[i + 1].start, Math.max(words[i].end, words[i].start + 0.08));
  return words;
}

function timingsLookRight(words, dur) {
  if (words.length < 3) return false;
  let same = 0, back = 0;
  for (let i = 1; i < words.length; i++) {
    if (Math.abs(words[i].start - words[i - 1].start) < 1e-3) same++;
    if (words[i].start < words[i - 1].start - 0.05) back++;
  }
  const span = words[words.length - 1].start - words[0].start;
  return same / words.length < 0.3 && back / words.length < 0.1 && span > Math.min(dur * 0.4, dur - 2);
}

function spread(segments, dur) {
  const words = [];
  for (const sg of segments) {
    let [s, e] = sg.timestamp || [0, null]; if (e == null) e = Math.min(dur, s + 5);
    const toks = (sg.text || '').trim().split(/\s+/).filter(Boolean);
    const total = toks.reduce((n, w) => n + w.length + 1, 0) || 1;
    let t = s;
    for (const w of toks) { const d = (e - s) * (w.length + 1) / total; words.push({ word: w, start: +t.toFixed(3), end: +(t + d).toFixed(3) }); t += d; }
  }
  return words;
}
