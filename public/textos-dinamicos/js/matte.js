// Subject cutout with Robust Video Matting (ONNX) running in the browser.
import * as ort from '../vendor/ort/ort.wasm.min.mjs';

ort.env.wasm.wasmPaths = new URL('../vendor/ort/', import.meta.url).href;
ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1)) : 1;
ort.env.logLevel = 'error';

export class Matte {
  static async create(url) {
    const m = new Matte();
    m.session = await ort.InferenceSession.create(url, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    m.reset();
    return m;
  }
  reset() { const z = () => new ort.Tensor('float32', new Float32Array(1), [1, 1, 1, 1]); this.rec = [z(), z(), z(), z()]; }
  /** canvas: small RGB canvas (w x h). Returns Float32Array alpha, length w*h, values 0..1 */
  async run(canvas, ratio) {
    const w = canvas.width, h = canvas.height;
    // the recurrent memory only fits one frame size: start fresh whenever the size changes
    if (this.size !== w + 'x' + h) { this.reset(); this.size = w + 'x' + h; }
    const px = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
    const n = w * h, src = new Float32Array(3 * n);
    for (let i = 0, j = 0; i < n; i++, j += 4) { src[i] = px[j] / 255; src[n + i] = px[j + 1] / 255; src[2 * n + i] = px[j + 2] / 255; }
    const feeds = {
      src: new ort.Tensor('float32', src, [1, 3, h, w]),
      r1i: this.rec[0], r2i: this.rec[1], r3i: this.rec[2], r4i: this.rec[3],
      downsample_ratio: new ort.Tensor('float32', new Float32Array([ratio]), [1]),
    };
    const out = await this.session.run(feeds);
    this.rec = [out.r1o, out.r2o, out.r3o, out.r4o];
    return out.pha.data;
  }
}

/** alpha (w*h floats) -> canvas whose alpha channel is the matte (to scale up with smoothing) */
// contrast curve: mostly-person pixels become fully solid (no text ghosting through hair),
// only the outermost edge stays soft
const CURVE = new Uint8Array(256);
for (let i = 0; i < 256; i++) { const u = Math.min(1, Math.max(0, (i / 255 - 0.12) / (0.62 - 0.12))); CURVE[i] = Math.round(255 * u * u * (3 - 2 * u)); }

export function alphaCanvas(alpha, w, h, canvas, solid = false) {
  canvas = canvas || document.createElement('canvas');
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
  for (let i = 0, j = 0; i < alpha.length; i++, j += 4) {
    const v = Math.max(0, Math.min(255, Math.round(alpha[i] * 255)));
    d[j] = d[j + 1] = d[j + 2] = 255; d[j + 3] = solid ? CURVE[v] : v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** YuNet face detector (ONNX, 640x640 input). Returns the most confident face {x,y,w,h,score} in target px, or null. */
export class Faces {
  static async create(url) {
    const f = new Faces();
    f.session = await ort.InferenceSession.create(url, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    f.canvas = document.createElement('canvas'); f.canvas.width = 640; f.canvas.height = 640;
    f.ctx = f.canvas.getContext('2d', { willReadFrequently: true });
    return f;
  }
  /** draw(ctx, w, h) must paint the frame into a w x h box at (0,0); we letterbox it into 640x640 */
  async detect(draw, tw, th) {
    const s = 640 / Math.max(tw, th), w = Math.round(tw * s), h = Math.round(th * s);
    this.ctx.fillStyle = '#000'; this.ctx.fillRect(0, 0, 640, 640);
    this.ctx.save(); this.ctx.scale(w / tw, h / th); draw(this.ctx, tw, th); this.ctx.restore();
    const px = this.ctx.getImageData(0, 0, 640, 640).data, N = 640 * 640, x = new Float32Array(3 * N);
    for (let i = 0, j = 0; i < N; i++, j += 4) { x[i] = px[j + 2]; x[N + i] = px[j + 1]; x[2 * N + i] = px[j]; }   // BGR, 0..255
    const o = await this.session.run({ input: new ort.Tensor('float32', x, [1, 3, 640, 640]) });
    let best = null;
    for (const st of [8, 16, 32]) {
      const n = 640 / st, cls = o['cls_' + st].data, obj = o['obj_' + st].data, bb = o['bbox_' + st].data;
      for (let i = 0; i < cls.length; i++) {
        const sc = Math.sqrt(Math.min(1, Math.max(0, cls[i])) * Math.min(1, Math.max(0, obj[i])));
        if (sc < 0.6 || (best && sc <= best.score)) continue;
        const row = Math.floor(i / n), col = i % n;
        const cx = (col + bb[4 * i]) * st, cy = (row + bb[4 * i + 1]) * st, fw = Math.exp(bb[4 * i + 2]) * st, fh = Math.exp(bb[4 * i + 3]) * st;
        best = { score: sc, x: (cx - fw / 2) / s, y: (cy - fh / 2) / s, w: fw / s, h: fh / s };
      }
    }
    if (best && best.w * best.h < tw * th * 0.004) return null;   // ignore tiny background faces
    return best;
  }
}
