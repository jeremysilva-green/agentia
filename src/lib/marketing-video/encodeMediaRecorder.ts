import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, VIDEO_TOTAL_FRAMES, type Segment, type ListingVideoInput } from "./types";
import { composeFrame } from "./composeFrame";

// Never assume video/mp4 works — support is inconsistent across browsers/OS
// versions, per spec. Candidates are tried in preference order.
const MIME_CANDIDATES = ["video/mp4;codecs=h264", "video/mp4", "video/webm;codecs=vp9", "video/webm"];

export function pickMediaRecorderMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  return MIME_CANDIDATES.find((mime) => MediaRecorder.isTypeSupported(mime)) ?? null;
}

// Fallback path when WebCodecs/H.264 isn't available. Records in real time
// (the output duration matches wall-clock time spent drawing frames) since
// MediaRecorder captures from a live canvas.captureStream(), unlike the
// WebCodecs path which encodes deterministically frame-by-frame.
export async function encodeWithMediaRecorder(
  segments: Segment[],
  listing: ListingVideoInput,
  mimeType: string,
  onProgress?: (frame: number, total: number) => void
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = VIDEO_WIDTH;
  canvas.height = VIDEO_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el contexto de canvas.");

  const stream = canvas.captureStream(VIDEO_FPS);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 7_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();

  const frameDurationMs = 1000 / VIDEO_FPS;
  for (let frame = 0; frame < VIDEO_TOTAL_FRAMES; frame++) {
    composeFrame(ctx, frame, segments, listing);
    onProgress?.(frame + 1, VIDEO_TOTAL_FRAMES);
    await new Promise((resolve) => setTimeout(resolve, frameDurationMs));
  }

  recorder.stop();
  await stopped;

  return new Blob(chunks, { type: mimeType.split(";")[0] });
}
