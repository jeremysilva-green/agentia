// Read, decode and encode video in the browser (WebCodecs + mp4box + mp4-muxer).
import { createFile, DataStream } from '../vendor/mp4box.all.mjs';
import { Muxer, ArrayBufferTarget } from '../vendor/mp4-muxer.mjs';
import { W, H, FPS } from './fx.js';

export function browserSupported() {
  return typeof VideoDecoder !== 'undefined' && typeof VideoEncoder !== 'undefined' && typeof OfflineAudioContext !== 'undefined';
}

function boxBytes(box) {
  const s = new DataStream(undefined, 0, 1); box.write(s); return new Uint8Array(s.buffer, 8);
}

/** Parse an MP4/MOV file. Returns track info + encoded samples (video, and audio when present). */
export async function openVideo(file) {
  const buf = await file.arrayBuffer();
  const mp4 = createFile(true);   // keep sample data in memory
  const info = await new Promise((resolve, reject) => {
    mp4.onReady = resolve; mp4.onError = e => reject(new Error('No se pudo leer este video: ' + e));
    const b = buf.slice(0); b.fileStart = 0; mp4.appendBuffer(b); mp4.flush();
    setTimeout(() => reject(new Error('Formato no compatible. Usá un video MP4 o MOV.')), 8000);
  });
  const vt = info.videoTracks[0];
  if (!vt) throw new Error('El archivo no tiene video.');
  const at = info.audioTracks[0];
  const samples = { [vt.id]: [] }; if (at) samples[at.id] = [];
  mp4.onSamples = (id, _u, s) => { for (const x of s) samples[id].push(x); };
  mp4.setExtractionOptions(vt.id, null, { nbSamples: 1e9 });
  if (at) mp4.setExtractionOptions(at.id, null, { nbSamples: 1e9 });
  mp4.start(); mp4.flush();
  await new Promise(r => setTimeout(r, 0));

  let description;
  const trak = mp4.getTrackById(vt.id);
  for (const entry of trak.mdia.minf.stbl.stsd.entries) {
    const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
    if (box) { description = boxBytes(box); break; }
  }
  const m = vt.matrix || [65536, 0, 0, 0, 65536, 0, 0, 0, 0x40000000];
  const rot = Math.round(Math.atan2(m[1], m[0]) * 180 / Math.PI);
  const vs = samples[vt.id];
  if (!vs.length) throw new Error('No se pudieron leer los cuadros del video.');
  let mn = Infinity, mx = 0;
  for (const s of vs) { mn = Math.min(mn, s.cts); mx = Math.max(mx, s.cts + s.duration); }
  const t0 = mn / vt.timescale;
  let dur = mx / vt.timescale - t0;
  if (!(dur > 0)) dur = (vt.duration / vt.timescale) || (info.duration / info.timescale);

  let audio = null;
  if (at && samples[at.id].length) {
    let adesc;
    try {
      const atrak = mp4.getTrackById(at.id), entry = atrak.mdia.minf.stbl.stsd.entries[0];
      const esd = entry.esds && entry.esds.esd;
      const dsi = esd && esd.descs && esd.descs[0] && esd.descs[0].descs && esd.descs[0].descs[0];
      if (dsi && dsi.data) adesc = new Uint8Array(dsi.data);
    } catch (e) {}
    audio = { codec: at.codec, sampleRate: at.audio.sample_rate, channels: at.audio.channel_count, timescale: at.timescale,
              samples: samples[at.id], description: adesc };
  }
  return { buf, codec: vt.codec, width: vt.video.width, height: vt.video.height, rot: ((rot % 360) + 360) % 360,
           timescale: vt.timescale, samples: vs, description, t0, duration: dur, audio, name: file.name };
}

/** Async generator of decoded VideoFrames in presentation order. Caller must close() each frame. */
export async function* decodeFrames(v) {
  const queue = []; let wake = null, error = null;
  const dec = new VideoDecoder({
    output: f => { queue.push(f); if (wake) { wake(); wake = null; } },
    error: e => { error = e; if (wake) { wake(); wake = null; } },
  });
  const cfg = { codec: v.codec, codedWidth: v.width, codedHeight: v.height, description: v.description, optimizeForLatency: false };
  const sup = await VideoDecoder.isConfigSupported(cfg);
  if (!sup.supported) throw new Error(`Este navegador no puede leer video ${v.codec.startsWith('hvc') || v.codec.startsWith('hev') ? 'HEVC (iPhone "Alta eficiencia")' : v.codec}. Exportalo en H.264 (el más compatible) e intentá de nuevo.`);
  dec.configure(cfg);
  let i = 0; const S = v.samples;
  const feed = () => {
    while (i < S.length && dec.decodeQueueSize < 12 && queue.length < 10) {
      const s = S[i++];
      dec.decode(new EncodedVideoChunk({ type: s.is_sync ? 'key' : 'delta', timestamp: Math.round(s.cts * 1e6 / v.timescale),
                                         duration: Math.round(s.duration * 1e6 / v.timescale), data: s.data }));
    }
    if (i >= S.length && !feed.flushed) { feed.flushed = true; feed.done = dec.flush().then(() => { feed.finished = true; if (wake) { wake(); wake = null; } }); }
  };
  try {
    while (true) {
      if (error) throw error;
      feed();
      if (queue.length) { yield queue.shift(); continue; }
      if (feed.finished) break;
      await new Promise(r => { wake = r; setTimeout(r, 50); });
    }
  } finally {
    queue.forEach(f => f.close());
    if (dec.state !== 'closed') dec.close();
  }
}

/** Walk a fixed 30 fps output grid over the decoded frames (holds frames for low fps, skips for high fps). */
export async function* gridFrames(v, n) {
  const it = decodeFrames(v);
  let cur = null, next = null, done = false;
  const base = v.t0 * 1e6;
  const pull = async () => { if (done) return null; const r = await it.next(); if (r.done) { done = true; return null; } return r.value; };
  next = await pull();
  try {
    for (let k = 0; k < n; k++) {
      const tk = k * 1e6 / FPS + 1e6 / (2 * FPS);
      while (next && next.timestamp - base <= tk) { if (cur) cur.close(); cur = next; next = await pull(); }
      if (!cur && next) { cur = next; next = await pull(); }
      yield { k, t: k / FPS, frame: cur };
    }
  } finally {
    if (cur) cur.close(); if (next) next.close();
    await it.return();
  }
}

/** Draw a frame covering a 9:16 target (centre crop), with rotation and an optional zoom around (zx, zy). */
export function drawCover(ctx, frame, rot, tw, th, zoom = 1, zx = tw / 2, zy = th / 2) {
  const fw = frame.displayWidth, fh = frame.displayHeight;
  const rw = (rot % 180) ? fh : fw, rh = (rot % 180) ? fw : fh;
  const s = Math.max(tw / rw, th / rh);
  ctx.save();
  if (zoom !== 1) { ctx.translate(zx, zy); ctx.scale(zoom, zoom); ctx.translate(-zx, -zy); }
  ctx.translate(tw / 2, th / 2); ctx.rotate(rot * Math.PI / 180); ctx.scale(s, s);
  ctx.drawImage(frame, -fw / 2, -fh / 2, fw, fh);
  ctx.restore();
}

// ---------------------------------------------------------------- audio
export async function decodeAudio(v) {
  // 1) the browser's own decoder (works for most MP4/M4A/MOV)
  try {
    const ctx = new OfflineAudioContext(2, 48000, 48000);
    const ab = await ctx.decodeAudioData(v.buf.slice(0));
    if (ab && ab.duration > 0.2) return ab;
  } catch (e) {}
  // 2) WebCodecs AudioDecoder on the demuxed track
  if (!v.audio || typeof AudioDecoder === 'undefined') return null;
  const a = v.audio, chunks = [];
  const dec = new AudioDecoder({ output: d => chunks.push(d), error: e => console.warn(e) });
  const cfg = { codec: a.codec, sampleRate: a.sampleRate, numberOfChannels: a.channels, description: a.description };
  if (!(await AudioDecoder.isConfigSupported(cfg)).supported) return null;
  dec.configure(cfg);
  for (const s of a.samples) dec.decode(new EncodedAudioChunk({ type: 'key', timestamp: Math.round(s.cts * 1e6 / a.timescale), data: s.data }));
  await dec.flush(); dec.close();
  if (!chunks.length) return null;
  const sr = chunks[0].sampleRate, ch = Math.min(2, chunks[0].numberOfChannels);
  const total = chunks.reduce((n, d) => n + d.numberOfFrames, 0);
  const ctx = new OfflineAudioContext(ch, total, sr), buf = ctx.createBuffer(ch, total, sr);
  let off = 0;
  for (const d of chunks) {
    for (let c = 0; c < ch; c++) {
      const tmp = new Float32Array(d.numberOfFrames);
      d.copyTo(tmp, { planeIndex: d.format.includes('planar') ? c : 0, format: 'f32-planar' });
      buf.getChannelData(c).set(tmp, off);
    }
    off += d.numberOfFrames; d.close();
  }
  return buf;
}

/** 16 kHz mono 16-bit WAV for speech recognition */
export async function speechWav(audioBuffer) {
  const n = Math.ceil(audioBuffer.duration * 16000);
  const ctx = new OfflineAudioContext(1, n, 16000);
  const src = ctx.createBufferSource(); src.buffer = audioBuffer; src.connect(ctx.destination); src.start();
  const out = (await ctx.startRendering()).getChannelData(0);
  const bytes = new ArrayBuffer(44 + n * 2), dv = new DataView(bytes);
  const str = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt '); dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, 16000, true); dv.setUint32(28, 32000, true);
  dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); str(36, 'data'); dv.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, out[i] || 0)) * 32767, true);
  return new Blob([bytes], { type: 'audio/wav' });
}

// ---------------------------------------------------------------- encoder
export async function createEncoder(withAudio) {
  const vcands = [['avc1.640028', 'avc'], ['avc1.4d0028', 'avc'], ['avc1.42003e', 'avc'], ['vp09.00.40.08', 'vp9']];
  let vcfg = null, vmux = null;
  for (const [codec, mux] of vcands) {
    const cfg = { codec, width: W, height: H, bitrate: 12_000_000, framerate: FPS, latencyMode: 'quality' };
    if (mux === 'avc') cfg.avc = { format: 'avc' };
    try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) { vcfg = cfg; vmux = mux; break; } } catch (e) {}
  }
  if (!vcfg) throw new Error('Este navegador no puede exportar video. Usá Chrome, Edge o Safari 17+ en una computadora.');
  let acfg = null, amux = null;
  if (withAudio && typeof AudioEncoder !== 'undefined') {
    for (const [codec, mux] of [['mp4a.40.2', 'aac'], ['opus', 'opus']]) {
      const cfg = { codec, sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 };
      try { if ((await AudioEncoder.isConfigSupported(cfg)).supported) { acfg = cfg; amux = mux; break; } } catch (e) {}
    }
  }
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: vmux, width: W, height: H, frameRate: FPS },
    audio: acfg ? { codec: amux, numberOfChannels: 2, sampleRate: 48000 } : undefined,
    fastStart: 'in-memory', firstTimestampBehavior: 'offset' });
  let err = null;
  const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => err = e });
  venc.configure(vcfg);
  return {
    audioCodec: amux, videoCodec: vcfg.codec,
    async addFrame(canvas, k) {
      if (err) throw err;
      while (venc.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 2));
      const f = new VideoFrame(canvas, { timestamp: Math.round(k * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
      venc.encode(f, { keyFrame: k % (FPS * 2) === 0 }); f.close();
    },
    async addAudio(audioBuffer) {
      if (!acfg || !audioBuffer) return;
      const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => err = e });
      aenc.configure(acfg);
      const L = audioBuffer.getChannelData(0), R = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : L;
      const step = 4800;
      for (let off = 0; off < L.length; off += step) {
        const n = Math.min(step, L.length - off), data = new Float32Array(n * 2);
        data.set(L.subarray(off, off + n), 0); data.set(R.subarray(off, off + n), n);
        const ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2,
                                   timestamp: Math.round(off * 1e6 / 48000), data });
        aenc.encode(ad); ad.close();
        if (aenc.encodeQueueSize > 20) await new Promise(r => setTimeout(r, 1));
      }
      await aenc.flush(); aenc.close();
    },
    async finish() {
      await venc.flush(); venc.close();
      if (err) throw err;
      muxer.finalize();
      return new Blob([target.buffer], { type: 'video/mp4' });
    },
  };
}
