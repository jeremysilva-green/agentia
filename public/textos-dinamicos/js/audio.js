// Sound effects: load the set, schedule cues from the motion blocks, mix with the original audio.
export const SFX = ['whoosh', 'whoosh_fast', 'swish_soft', 'pop', 'bubble', 'click', 'tick', 'ding', 'impact', 'shimmer'];

export async function loadSfx(base) {
  const ctx = new OfflineAudioContext(1, 48000, 48000), out = {};
  await Promise.all(SFX.map(async n => {
    const ab = await (await fetch(`${base}${n}.wav`)).arrayBuffer();
    out[n] = await ctx.decodeAudioData(ab);
  }));
  return out;
}

export function collectCues(blocks, { ticks = false } = {}) {
  const cues = blocks.flatMap(b => b.cues(ticks)).filter(c => c && c.t >= 0).sort((a, b) => a.t - b.t);
  const out = [], last = {};
  for (const c of cues) {   // avoid stacking the same sound
    if (last[c.n] !== undefined && c.t - last[c.n] < 0.06) continue;
    last[c.n] = c.t; out.push(c);
  }
  return out;
}

/** original audio + effects -> stereo 48 kHz AudioBuffer */
export async function mixAudio(original, duration, cues, sfx, { enabled = true, volume = 0.8 } = {}) {
  const len = Math.ceil(duration * 48000);
  const ctx = new OfflineAudioContext(2, len, 48000);
  if (original) { const s = ctx.createBufferSource(); s.buffer = original; s.connect(ctx.destination); s.start(0); }
  if (enabled && volume > 0) {
    const bus = ctx.createGain(); bus.gain.value = volume;
    // gentle glue so effects sit under the voice
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.003; comp.release.value = 0.12;
    bus.connect(comp); comp.connect(ctx.destination);
    for (const c of cues) {
      const buf = sfx[c.n]; if (!buf || c.t >= duration) continue;
      const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = c.r || 1;
      const g = ctx.createGain(); g.gain.value = c.g ?? 0.4;
      const pan = ctx.createStereoPanner(); pan.pan.value = c.p || 0;
      src.connect(g); g.connect(pan); pan.connect(bus); src.start(Math.max(0, c.t));
    }
  }
  return ctx.startRendering();
}
