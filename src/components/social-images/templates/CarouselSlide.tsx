import type { CSSProperties, ReactNode } from "react";

/**
 * Instagram carousel slide for Satori (1080 x 1350, 4:5), ported from
 * instabuffer.zip: a cream frame around the property photo, with cut-out corner
 * tabs holding the slide counter and the logo, pagination dots, a "swipe" hint
 * and the website. Satori only supports a CSS subset (flexbox, absolute
 * positioning), so every container with several children is display:flex.
 */

export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1350;

const THEME = {
  fontFamily: "Poppins",
  colors: {
    frame: "#F2EFEA", // cream frame + tabs
    ink: "#1A1A1A", // counter text
    swipe: "#EDE9E1",
    website: "rgba(255,255,255,0.85)",
    dot: "#F3ECE2",
    canvas: "#2B2724",
  },
  // Frame (cream card) and the photo window inside it.
  frame: { left: 179, top: 317, width: 721, height: 715, radius: 18 },
  photo: { inset: { top: 15, right: 17, bottom: 22, left: 16 }, radius: 15 },
};

// Lucide "chevron-right" (lucide-react's components are client-only).
const CHEVRON_RIGHT: [string, Record<string, string>][] = [["path", { d: "m9 18 6-6-6-6" }]];

export interface CarouselSlideProps {
  /** Data URIs — Satori can't fetch remote images. */
  photo: string;
  backgroundImage: string;
  logo: string;
  current: number;
  total: number;
  swipeText?: string;
  website?: string;
  /** Number of pagination dots, and which one is the active (dimmer) one. */
  dots?: number;
  activeDot?: number;
}

const font = (size: number, weight: number, extra: CSSProperties = {}): CSSProperties => ({
  fontFamily: THEME.fontFamily,
  fontSize: size,
  fontWeight: weight,
  lineHeight: 1,
  ...extra,
});

function Text({
  children,
  size,
  weight = 400,
  color = "#fff",
  italic = false,
  style = {},
}: {
  children: ReactNode;
  size: number;
  weight?: number;
  color?: string;
  italic?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        whiteSpace: "nowrap",
        color,
        ...font(size, weight),
        fontStyle: italic ? "italic" : "normal",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Icon({
  icon,
  size = 24,
  color = "#fff",
  strokeWidth = 2,
  style = {},
}: {
  icon: [string, Record<string, string>][];
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {icon.map(([Tag, attrs], i) => {
        const Element = Tag as "path";
        return <Element key={i} {...attrs} />;
      })}
    </svg>
  );
}

/**
 * Cream tab that "bites" into a corner of the photo, with an S-curve on its
 * inner side and a rounded photo corner on the other side.
 *   width  = flat part of the tab (along the long edge, at its inner edge)
 *   slope  = horizontal run of the S-curve
 *   height = how far the tab reaches into the photo
 */
function CornerTab({
  corner,
  width,
  slope,
  height,
  cornerRadius = 15,
  bleed = 3,
  color = THEME.colors.frame,
  children,
  contentStyle = {},
}: {
  corner: "top-left" | "bottom-right";
  width: number;
  slope: number;
  height: number;
  cornerRadius?: number;
  bleed?: number;
  color?: string;
  children: ReactNode;
  contentStyle?: CSSProperties;
}) {
  const W = width;
  const S = slope;
  const H = height;
  const r = cornerRadius;
  const b = bleed;
  const boxW = W + S + b;
  const boxH = H + r + b;
  // Path for the top-left version, origin at the photo's top-left corner (shifted by the bleed).
  const d = [
    `M${b} ${b} H${b + W + S}`,
    `C${b + W + S * 0.38} ${b} ${b + W + S * 0.62} ${b + H} ${b + W} ${b + H}`,
    `H${b + r}`,
    `A${r} ${r} 0 0 0 ${b} ${b + H + r}`,
    "Z",
  ].join(" ");
  const flip = corner === "bottom-right";
  // The bleed strip overlaps the frame by a few px so no seam shows along the photo edge.
  return (
    <div
      style={{
        position: "absolute",
        ...(flip ? { right: -b, bottom: -b } : { left: -b, top: -b }),
        width: boxW,
        height: boxH,
        display: "flex",
      }}
    >
      <svg width={boxW} height={boxH} viewBox={`0 0 ${boxW} ${boxH}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={flip ? `rotate(180 ${boxW / 2} ${boxH / 2})` : undefined}>
          <path d={d} fill={color} />
          <rect x="0" y="0" width={boxW} height={b + 0.5} fill={color} />
          <rect x="0" y="0" width={b + 0.5} height={boxH} fill={color} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          ...(flip ? { right: b, bottom: b } : { left: b, top: b }),
          width: W,
          height: H,
          display: "flex",
          alignItems: "center",
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Counter({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", color: THEME.colors.ink }}>
      <Text size={38} weight={700} color={THEME.colors.ink}>
        {String(current)}
      </Text>
      <Text size={27} weight={400} color={THEME.colors.ink} style={{ marginLeft: 3 }}>
        {`/${total}`}
      </Text>
    </div>
  );
}

function Dots({ count, active }: { count: number; active: number }) {
  const size = 14;
  return (
    <div style={{ display: "flex" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: THEME.colors.dot,
            opacity: i === active ? 0.6 : 0.95,
            marginLeft: i ? 20 : 0,
          }}
        />
      ))}
    </div>
  );
}

function SwipeHint({ text }: { text: string }) {
  return (
    <div style={{ position: "absolute", right: 202, top: 230, display: "flex", alignItems: "center" }}>
      <Text size={33} weight={600} color={THEME.colors.swipe}>
        {text}
      </Text>
      <Icon icon={CHEVRON_RIGHT} size={42} strokeWidth={4.5} color={THEME.colors.swipe} style={{ marginLeft: 8 }} />
    </div>
  );
}

/** Full-canvas photo, darkened, with deeper shade at the bottom. */
function Background({ src, dim = 0.8 }: { src: string; dim?: number }) {
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, display: "flex" }}>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={src} width={SLIDE_WIDTH} height={SLIDE_HEIGHT} style={{ objectFit: "cover" }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          backgroundColor: `rgba(20,17,15,${dim})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          backgroundImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </div>
  );
}

/** Cream frame with the photo window, both tabs, counter, dots and logo. */
function SlideCard({
  photo,
  logo,
  current,
  total,
  dots,
  activeDot,
}: Pick<CarouselSlideProps, "photo" | "logo" | "current" | "total"> & { dots: number; activeDot: number }) {
  const { frame, photo: photoCfg } = THEME;
  const inset = photoCfg.inset;
  const pw = frame.width - inset.left - inset.right;
  const ph = frame.height - inset.top - inset.bottom;
  return (
    <div
      style={{
        position: "absolute",
        left: frame.left,
        top: frame.top,
        width: frame.width,
        height: frame.height,
        borderRadius: frame.radius,
        backgroundColor: THEME.colors.frame,
        display: "flex",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}
    >
      {/* Photo window */}
      <div
        style={{
          position: "absolute",
          left: inset.left,
          top: inset.top,
          width: pw,
          height: ph,
          borderRadius: photoCfg.radius,
          overflow: "hidden",
          display: "flex",
          backgroundColor: "#bbb",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={photo} width={pw} height={ph} style={{ objectFit: "cover" }} />

        <div style={{ position: "absolute", right: 39, top: 28, display: "flex" }}>
          <Dots count={dots} active={activeDot} />
        </div>
      </div>

      {/* Tabs sit on top of the photo window, outside its clipping */}
      <div style={{ position: "absolute", left: inset.left, top: inset.top, width: pw, height: ph, display: "flex" }}>
        <CornerTab corner="top-left" width={98} slope={37} height={47} contentStyle={{ paddingLeft: 11, paddingTop: 2 }}>
          <Counter current={current} total={total} />
        </CornerTab>

        <CornerTab
          corner="bottom-right"
          width={216}
          slope={32}
          height={45}
          contentStyle={{ justifyContent: "flex-end", paddingRight: 36, paddingTop: 4 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={logo} width={164} height={26} />
        </CornerTab>
      </div>
    </div>
  );
}

function Website({ text }: { text: string }) {
  return (
    <div style={{ position: "absolute", left: 0, top: 1080, width: SLIDE_WIDTH, display: "flex", justifyContent: "center" }}>
      <Text size={20} weight={300} italic color={THEME.colors.website} style={{ letterSpacing: 0.4 }}>
        {text}
      </Text>
    </div>
  );
}

export function CarouselSlide({
  photo,
  backgroundImage,
  logo,
  current,
  total,
  swipeText = "swipe",
  website = "agentia.com.py",
  dots = total,
  activeDot = current - 1,
}: CarouselSlideProps) {
  return (
    <div
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: "flex",
        position: "relative",
        overflow: "hidden",
        backgroundColor: THEME.colors.canvas,
      }}
    >
      <Background src={backgroundImage} />
      <SwipeHint text={swipeText} />
      <SlideCard photo={photo} logo={logo} current={current} total={total} dots={dots} activeDot={activeDot} />
      <Website text={website} />
    </div>
  );
}
