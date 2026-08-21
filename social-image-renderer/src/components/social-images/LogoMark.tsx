// Path data extracted from agentia-iso-07.svg (viewBox 0 0 896 932).
// The original agentia-04.svg (full wordmark) was uploaded empty — no shape
// data inside it — so the "AGENTIA" wordmark is rendered as text (Clash
// Display Semibold) in PropertyTemplate.tsx rather than as a vector logotype.
// If a working wordmark SVG becomes available later, swap it in there.

const LOGO_PATH =
  "M4362 9310 c-73 -14 -169 -47 -222 -78 -25 -14 -900 -668 -1946 -1453 -2027 -1522 -1988 -1492 -2088 -1652 -25 -40 -57 -108 -73 -152 l-28 -80 0 -2625 0 -2625 23 -80 c77 -265 287 -464 566 -535 77 -19 110 -20 1122 -20 1024 0 1044 0 1098 20 42 16 180 121 617 472 310 248 673 535 806 639 l243 189 112 -87 c62 -47 422 -333 800 -635 422 -337 707 -558 740 -573 l53 -25 1030 0 c671 0 1053 4 1095 11 164 26 303 100 430 228 99 99 161 209 184 327 12 58 16 494 21 2634 7 2346 6 2573 -9 2659 -29 163 -101 305 -220 429 -77 82 -3799 2880 -3901 2934 -130 68 -321 101 -453 78z m1782 -2530 l1646 -1235 0 -1211 c0 -666 -3 -1650 -7 -2187 l-6 -977 -614 0 -613 0 -560 451 c-309 249 -559 455 -558 460 2 4 167 146 368 314 201 169 387 328 413 353 100 96 178 238 224 407 l28 100 0 730 c0 727 0 730 -23 820 -44 174 -166 379 -284 476 -84 69 -894 663 -953 699 -309 189 -783 238 -1185 124 -179 -52 -272 -108 -745 -454 -249 -182 -472 -353 -513 -394 -135 -131 -232 -306 -267 -481 -14 -70 -15 -171 -13 -805 3 -719 4 -726 26 -805 50 -174 167 -369 299 -496 32 -31 193 -166 358 -300 165 -133 314 -255 332 -270 l32 -27 -562 -451 -561 -451 -618 0 -618 0 0 2188 0 2188 1652 1237 c908 681 1657 1236 1663 1235 7 -2 753 -559 1659 -1238z m-1584 -1820 c234 -24 442 -129 622 -313 87 -88 150 -200 168 -296 6 -29 10 -190 10 -356 0 -323 -4 -354 -55 -455 -58 -114 -102 -156 -468 -451 l-358 -288 -352 281 c-194 154 -371 301 -394 327 -23 25 -58 76 -77 112 -61 114 -66 150 -66 464 0 333 7 394 57 495 28 59 57 96 132 171 185 185 377 283 606 309 39 4 71 8 71 9 1 0 48 -4 104 -9z";

export function LogoMark({ size, color }: { size: number; color: string }) {
  return (
    <svg viewBox="0 0 896 932" width={size} height={size} style={{ display: "flex" }}>
      <g transform="translate(0,932) scale(0.1,-0.1)" fill={color}>
        <path d={LOGO_PATH} />
      </g>
    </svg>
  );
}

/**
 * Recreates the moodboard's `.dots` texture (agentia_moodboard.html):
 * `background-image: radial-gradient(currentColor 1px, transparent 1px); background-size: 16px 16px;`
 *
 * Satori doesn't reliably support tiled/repeating gradient backgrounds, so
 * the grid is precomputed as a flat SVG and returned as a data URI — apply
 * it directly as a CSS `backgroundImage` on the root card div.
 */
export function buildDotGridDataUri(
  width: number,
  height: number,
  spacing: number,
  radius: number,
  color: string,
  opacity: number
): string {
  let circles = "";
  for (let y = spacing / 2; y < height; y += spacing) {
    for (let x = spacing / 2; x < width; x += spacing) {
      circles += `<circle cx="${x}" cy="${y}" r="${radius}"/>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g fill="${color}" opacity="${opacity}">${circles}</g></svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}
