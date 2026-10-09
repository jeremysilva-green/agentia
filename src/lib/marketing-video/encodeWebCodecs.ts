import { Output, Mp4OutputFormat, BufferTarget, CanvasSource, canEncodeVideo } from "mediabunny";
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, VIDEO_TOTAL_FRAMES, type Segment, type ListingVideoInput } from "./types";
import { composeFrame } from "./composeFrame";

const BITRATE = 7_000_000; // 7 Mbps, within the spec's 6-8 Mbps range

export async function canUseWebCodecs(): Promise<boolean> {
  if (typeof VideoEncoder === "undefined") return false;
  try {
    return await canEncodeVideo("avc", { width: VIDEO_WIDTH, height: VIDEO_HEIGHT, bitrate: BITRATE, frameRate: VIDEO_FPS });
  } catch {
    return false;
  }
}

export async function encodeWithWebCodecs(
  segments: Segment[],
  listing: ListingVideoInput,
  onProgress?: (frame: number, total: number) => void
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = VIDEO_WIDTH;
  canvas.height = VIDEO_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el contexto de canvas.");

  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });

  const videoSource = new CanvasSource(canvas, {
    codec: "avc",
    bitrate: BITRATE,
    keyFrameInterval: 2, // also forced explicitly at every segment cut below
  });

  output.addVideoTrack(videoSource);
  await output.start();

  const segmentStartFrames = new Set(segments.map((s) => s.startFrame));

  for (let frame = 0; frame < VIDEO_TOTAL_FRAMES; frame++) {
    composeFrame(ctx, frame, segments, listing);
    const timestamp = frame / VIDEO_FPS;
    const duration = 1 / VIDEO_FPS;
    await videoSource.add(timestamp, duration, { keyFrame: segmentStartFrames.has(frame) });
    onProgress?.(frame + 1, VIDEO_TOTAL_FRAMES);
    if (frame % 10 === 0) await new Promise((resolve) => setTimeout(resolve, 0)); // yield, keep the UI responsive
  }

  await output.finalize();

  const buffer = output.target.buffer;
  if (!buffer) throw new Error("La codificación no produjo ningún archivo.");
  return new Blob([buffer], { type: "video/mp4" });
}
