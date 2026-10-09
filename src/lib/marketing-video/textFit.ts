// Shrink-to-fit + greedy word-wrap for canvas text, since canvas has no
// native text layout. Used for the title (up to 120 chars, per
// src/lib/validations/property.ts) and the location line (city names can
// be long multi-word Guaraní names from CITY_OPTIONS).

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

// Shrinks a font size (in px, within [minSizePx, maxSizePx]) until the given
// text wraps to at most maxLines within maxWidth. `buildFont` maps a px size
// to a canvas font string (e.g. clashDisplayFont(size)).
export function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  buildFont: (sizePx: number) => string,
  maxWidth: number,
  maxLines: number,
  maxSizePx: number,
  minSizePx: number
): { sizePx: number; lines: string[] } {
  for (let size = maxSizePx; size >= minSizePx; size -= 2) {
    ctx.font = buildFont(size);
    const lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) {
      return { sizePx: size, lines };
    }
  }

  // Nothing fit within maxLines even at the minimum size — clamp to
  // minSizePx and truncate the wrapped output rather than overflow.
  ctx.font = buildFont(minSizePx);
  const lines = wrapText(ctx, text, maxWidth).slice(0, maxLines);
  if (lines.length > 0) {
    let last = lines[lines.length - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = `${last}…`;
  }
  return { sizePx: minSizePx, lines };
}
