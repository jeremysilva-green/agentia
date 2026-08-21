import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * REQUIRED SETUP: place these two files in public/fonts/ before this works:
 *
 *   public/fonts/Inter-Regular.ttf        (STATIC instance — see note below)
 *   public/fonts/ClashDisplay-Semibold.otf
 *
 * IMPORTANT: the Inter file you supplied (inter_regular.ttf) is a variable
 * font. Satori's font parser cannot read it — it throws on the fvar table.
 * The Inter-Regular.ttf included alongside this code has already been
 * instanced down to a static weight-400 file with fontTools
 * (varLib.instancer, then stripped of fvar/gvar/avar/HVAR/MVAR/STAT) and is
 * confirmed working. Use that file, not the original.
 *
 * Clash Display Semibold was already a static OTF — no conversion needed.
 * Its real weight class is 600 (Semibold), not 700 — reflected below.
 */
const FONT_DIR = path.join(process.cwd(), "public", "fonts");

type LoadedFont = {
  name: string;
  data: Buffer;
  weight: 400 | 600;
  style: "normal";
};

let cachedFonts: LoadedFont[] | null = null;

export async function loadBrandFonts(): Promise<LoadedFont[]> {
  if (cachedFonts) return cachedFonts;

  const [interRegular, clashSemibold] = await Promise.all([
    readFile(path.join(FONT_DIR, "Inter-Regular.ttf")),
    readFile(path.join(FONT_DIR, "ClashDisplay-Semibold.otf")),
  ]);

  cachedFonts = [
    { name: "Inter", data: interRegular, weight: 400, style: "normal" },
    { name: "Clash Display", data: clashSemibold, weight: 600, style: "normal" },
  ];

  return cachedFonts;
}
