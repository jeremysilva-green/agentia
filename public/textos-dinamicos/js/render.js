// Render pass: video + zoom, text behind the subject, subject cutout, overlays, text in front, encode.
import { W, H, FPS, focusOverlay } from './fx.js';
import { gridFrames, drawCover } from './media.js';
import { zoomAt } from './layout.js';
import { alphaCanvas } from './matte.js';

const RW = 720, RH = 1280;  // matting resolution while rendering (2/3 of output: crisp hair edges)

function mk(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

export async function renderVideo({ v, blocks, zplan, cuts, geo = [], matte, enc, canvas, onProgress, shouldStop }) {
  const ctx = canvas.getContext('2d');
  const back = mk(), bctx = back.getContext('2d');
  const layer = mk(), lctx = layer.getContext('2d');
  const trail = mk(), tctx = trail.getContext('2d');
  const person = mk(), pctx = person.getContext('2d');
  const mc = mk(RW, RH), mcx = mc.getContext('2d', { willReadFrequently: true });
  const ac = mk(RW, RH);
  const n = Math.max(1, Math.round(v.duration * FPS));
  const env = { backdrop: back };

  // windows where the cutout is needed (behind blocks), with a short warm-up for the recurrent matting
  const wins = blocks.filter(b => b.kind === 'behind').map(b => {
    let a = b.tin - 1.0; for (const c of cuts) if (c <= b.tin + 0.01 && c > a) a = c;   // warm up inside the same shot
    return [Math.max(0, a), b.tout + 0.05, b.tin - 0.05];
  });
  let inWin = -1;

  const drawBlock = (c, b, t, tmpCtx, tmpCanvas) => {
    if (b.inMotion(t)) {               // cheap motion blur: two faint trailing sub-frames
      for (const dt of [-2 / (3 * FPS), -1 / (3 * FPS)]) {
        tmpCtx.clearRect(0, 0, W, H); b.draw(tmpCtx, t + dt, env);
        c.save(); c.globalAlpha = 0.28; c.drawImage(tmpCanvas, 0, 0); c.restore();
      }
    }
    b.draw(c, t, env);
  };

  for await (const { k, t, frame } of gridFrames(v, n)) {
    if (shouldStop && shouldStop()) throw new Error('Cancelled');
    const [s, zx, zy] = zoomAt(zplan, t);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (frame) drawCover(ctx, frame, v.rot, W, H, s, zx, zy);
    const active = blocks.filter(b => t >= b.tin - 0.05 && t <= b.tout + 0.05);
    if (active.some(b => b.glassy)) { bctx.drawImage(canvas, 0, 0); }

    // cutout for behind-the-subject text
    const w = wins.findIndex(([a, b]) => t >= a && t <= b);
    let alphaReady = false;
    if (w >= 0 && frame && matte) {
      if (w !== inWin) { matte.reset(); inWin = w; }
      drawCover(mcx, frame, v.rot, RW, RH);
      const a = await matte.run(mc, 0.3);
      alphaCanvas(a, RW, RH, ac, true);
      // the face and forehead are always solid, whatever the model thinks (dark hair on dark backgrounds)
      let g = null; for (const x of geo) if (Math.abs(x.t - t) <= 0.25 && (!g || Math.abs(x.t - t) < Math.abs(g.t - t))) g = x;
      if (g) {
        const k2 = RW / W, w2 = (g.bottom - g.top) * 0.82 * k2, top = (g.top - 0.15 * (g.bottom - g.top)) * k2, bot = g.bottom * k2;
        const cxe = g.cx * k2, cye = (top + bot) / 2, rx = w2 * 0.6, ry = (bot - top) / 2;
        const actx = ac.getContext('2d'); actx.save();
        actx.translate(cxe, cye); actx.scale(1, ry / rx);
        const gr = actx.createRadialGradient(0, 0, rx * 0.7, 0, 0, rx);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        actx.fillStyle = gr; actx.beginPath(); actx.arc(0, 0, rx, 0, Math.PI * 2); actx.fill(); actx.restore();
      }
      alphaReady = t >= wins[w][2];
    } else inWin = -1;

    const behind = active.filter(b => b.kind === 'behind');
    if (behind.length) {
      lctx.clearRect(0, 0, W, H);
      for (const b of behind) drawBlock(lctx, b, t, tctx, trail);
      ctx.drawImage(layer, 0, 0);
      if (alphaReady && frame) {
        pctx.globalCompositeOperation = 'source-over'; pctx.clearRect(0, 0, W, H);
        drawCover(pctx, frame, v.rot, W, H, s, zx, zy);
        pctx.globalCompositeOperation = 'destination-in';
        pctx.save(); pctx.translate(zx, zy); pctx.scale(s, s); pctx.translate(-zx, -zy);
        pctx.imageSmoothingQuality = 'high'; pctx.drawImage(ac, 0, 0, W, H); pctx.restore();
        pctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(person, 0, 0);
      }
    }
    const ov = Math.max(0, ...active.map(b => b.overlay(t)));
    focusOverlay(ctx, ov);
    for (const b of active) if (b.kind !== 'behind') drawBlock(ctx, b, t, tctx, trail);

    await enc.addFrame(canvas, k);
    if (k % 5 === 0) { onProgress && onProgress(k / n); await new Promise(r => setTimeout(r, 0)); }
  }
}
