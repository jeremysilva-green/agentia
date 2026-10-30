import type { CSSProperties, ReactNode } from "react";
import { LogoMark } from "../LogoMark";

/**
 * Property flyer for Satori (ported from property-flyer-satori.zip).
 * Every element is a small component with props; colors, sizes and the card
 * shape live in THEME. Canvas: 1520 x 2062.
 *
 * Satori only supports a CSS subset (flexbox, absolute positioning, no
 * grid), and every container with several children must be `display: flex`.
 */

export const FLYER_WIDTH = 1520;
export const FLYER_HEIGHT = 2062;

const THEME = {
  fontFamily: "Figtree",
  colors: {
    text: "#FFFFFF",
    canvas: "#000000",
  },
  card: { left: 102, top: 133, width: 1317, height: 1790, radius: 100 },
  glow: "0 0 12px rgba(255,255,255,0.38)",
};

// Lucide icon nodes, copied from lucide-react (its components are client-only
// and can't run inside Satori).
type IconNode = [string, Record<string, string>][];

export const FLYER_ICONS = {
  phone: [
    [
      "path",
      {
        d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
      },
    ],
  ],
  email: [
    ["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" }],
    ["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2" }],
  ],
  website: [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }],
    ["path", { d: "M2 12h20" }],
  ],
  pin: [
    [
      "path",
      {
        d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
      },
    ],
  ],
  bed: [
    ["path", { d: "M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" }],
    ["path", { d: "M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" }],
    ["path", { d: "M12 4v6" }],
    ["path", { d: "M2 18h20" }],
  ],
  bath: [
    ["path", { d: "M10 4 8 6" }],
    ["path", { d: "M17 19v2" }],
    ["path", { d: "M2 12h20" }],
    ["path", { d: "M7 19v2" }],
    ["path", { d: "M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" }],
  ],
  house: [
    ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" }],
    [
      "path",
      {
        d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
      },
    ],
  ],
  area: [
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }],
  ],
  car: [
    ["path", { d: "m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8" }],
    ["path", { d: "M7 14h.01" }],
    ["path", { d: "M17 14h.01" }],
    ["rect", { width: "18", height: "8", x: "3", y: "10", rx: "2" }],
    ["path", { d: "M5 18v2" }],
    ["path", { d: "M19 18v2" }],
  ],
} satisfies Record<string, IconNode>;

export type FlyerIconName = keyof typeof FLYER_ICONS;

export interface FlyerContact {
  type: "phone" | "email" | "website";
  value: string;
}

export interface FlyerStat {
  value: string;
  label: string;
  icon: FlyerIconName;
}

export const DEFAULT_FLYER_ACCENT = "#E6B763";

function isLightColor(color: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55;
}

/** Readable glyph color on top of the accent (dark on light accents, white on dark ones). */
function inkFor(accent: string): string {
  return isLightColor(accent) ? "#15130F" : "#FFFFFF";
}

export interface PropertyFlyerProps {
  /** #rrggbb — the golden parts of the template (icons, lines, photo border) are drawn in this color. */
  accent: string;
  /** Solid color sampled from the logo's corner, so the logo tile has no visible border. */
  logoBg: string;
  /** false hides the corner logo tile altogether ("Sin Logo"). */
  showLogo: boolean;
  /** Data URIs — Satori can't fetch remote images. */
  propertyImage: string;
  backgroundImage: string;
  agentPhoto: string | null;
  logo: string | null;
  agentName: string;
  agentTitle: string;
  contacts: FlyerContact[];
  kicker: string;
  headline: string;
  location: string;
  description: string;
  stats: FlyerStat[];
}

const font = (size: number, weight: number, letterSpacing = 0, extra: CSSProperties = {}): CSSProperties => ({
  fontFamily: THEME.fontFamily,
  fontSize: size,
  fontWeight: weight,
  letterSpacing,
  lineHeight: 1,
  ...extra,
});

function Text({
  children,
  size,
  weight = 400,
  letterSpacing = 0,
  color = THEME.colors.text,
  glow = false,
  style = {},
}: {
  children: ReactNode;
  size: number;
  weight?: number;
  letterSpacing?: number;
  color?: string;
  glow?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        whiteSpace: "nowrap",
        color,
        ...font(size, weight, letterSpacing),
        ...(glow ? { textShadow: THEME.glow } : {}),
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
  color,
  strokeWidth = 2,
  fill = "none",
}: {
  icon: IconNode;
  size?: number;
  color: string;
  strokeWidth?: number;
  fill?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon.map(([Tag, attrs], i) => {
        const Element = Tag as "path";
        return <Element key={i} {...attrs} />;
      })}
    </svg>
  );
}

function Line({
  length,
  thickness,
  vertical = false,
  color,
  radius = 0,
  style = {},
}: {
  length: number;
  thickness: number;
  vertical?: boolean;
  color: string;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexShrink: 0,
        width: vertical ? thickness : length,
        height: vertical ? length : thickness,
        borderRadius: radius,
        backgroundColor: color,
        ...style,
      }}
    />
  );
}

/** Black fade overlay. stops = [[opacity 0..1, position %], ...]. */
function Fade({
  left = 0,
  top = 0,
  width,
  height,
  stops,
  strength = 0.84,
  radius = 0,
}: {
  left?: number;
  top?: number;
  width: number;
  height: number;
  stops: number[][];
  strength?: number;
  radius?: number;
}) {
  const gradient = `linear-gradient(to bottom, ${stops
    .map(([a, pct]) => `rgba(0,0,0,${(a * strength).toFixed(3)}) ${pct}%`)
    .join(", ")})`;
  return (
    <div style={{ position: "absolute", left, top, width, height, display: "flex", borderRadius: radius, overflow: "hidden" }}>
      <div style={{ display: "flex", width, height, backgroundImage: gradient }} />
    </div>
  );
}

const TOP_FADE_STOPS = [
  [1, 0], [1, 12.7], [0.973, 15.0], [0.933, 17.2], [0.867, 19.4], [0.765, 21.6], [0.631, 23.9],
  [0.482, 26.1], [0.333, 28.3], [0.204, 30.6], [0.11, 32.8], [0.047, 35.0], [0.016, 37.3], [0, 38.5],
];
const BOTTOM_FADE_STOPS = [
  [0, 0], [0.035, 5.6], [0.11, 11.1], [0.231, 16.7], [0.404, 22.2], [0.588, 27.8], [0.761, 33.3],
  [0.886, 38.9], [0.957, 44.4], [0.988, 50], [1, 61.1], [1, 100],
];

function Background({ src, dim = 0.76 }: { src: string; dim?: number }) {
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: FLYER_WIDTH, height: FLYER_HEIGHT, display: "flex" }}>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={src} width={FLYER_WIDTH} height={FLYER_HEIGHT} style={{ objectFit: "cover" }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FLYER_WIDTH,
          height: FLYER_HEIGHT,
          backgroundColor: `rgba(0,0,0,${dim})`,
        }}
      />
    </div>
  );
}

function PhotoCard({ src }: { src: string }) {
  const card = THEME.card;
  return (
    <div
      style={{
        position: "absolute",
        left: card.left,
        top: card.top,
        width: card.width,
        height: card.height,
        borderRadius: card.radius,
        overflow: "hidden",
        display: "flex",
        backgroundColor: "#111",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img
        src={src}
        width={card.width + 22}
        height={card.height + 26}
        style={{ position: "absolute", left: -12, top: -10, objectFit: "cover" }}
      />
    </div>
  );
}

function ContactRow({ type, value, accent }: FlyerContact & { accent: string }) {
  const discSize = 38;
  // Long values (a profile URL) shrink instead of running into the logo.
  const textSize = value.length > 26 ? 24 : 28;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          width: discSize,
          height: discSize,
          borderRadius: discSize / 2,
          backgroundColor: accent,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 25,
        }}
      >
        <Icon icon={FLYER_ICONS[type]} size={21} color={inkFor(accent)} strokeWidth={2.4} />
      </div>
      <Text size={textSize} weight={500} glow>
        {value}
      </Text>
    </div>
  );
}

function AgentHeader({
  photo,
  name,
  title,
  contacts,
  accent,
}: {
  photo: string | null;
  name: string;
  title: string;
  contacts: FlyerContact[];
  accent: string;
}) {
  const photoWidth = 286;
  const photoHeight = 293;
  // The name sits between the photo and the logo (~560px) — shrink long ones.
  const nameSize = Math.max(38, Math.min(64, Math.floor(560 / (name.length * 0.6))));
  const initial = (name.trim()[0] ?? "A").toUpperCase();

  return (
    <div style={{ position: "absolute", left: 151, top: 173, display: "flex", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          width: photoWidth,
          height: photoHeight,
          borderRadius: 24,
          overflow: "hidden",
          border: `3px solid ${accent}`,
          backgroundColor: accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img src={photo} width={photoWidth - 6} height={photoHeight - 6} style={{ objectFit: "cover" }} />
        ) : (
          <Text size={140} weight={700} color={inkFor(accent)}>
            {initial}
          </Text>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginLeft: 37 }}>
        <Text size={nameSize} weight={700} glow>
          {name}
        </Text>
        <Text size={22} weight={500} letterSpacing={2.5} glow style={{ marginTop: 22 }}>
          {title}
        </Text>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
          {contacts.map((contact, i) => (
            <div key={i} style={{ display: "flex", marginTop: i ? 11 : 0 }}>
              <ContactRow {...contact} accent={accent} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The logo fills the whole tile. The tile takes the logo's own corner color,
 * so a logo that isn't square (or has a solid backdrop) shows no border; the
 * Agentia mark sits on white when the agent has no logo.
 */
function LogoSlot({ src, bg }: { src: string | null; bg: string }) {
  const size = 283;
  return (
    <div
      style={{
        position: "absolute",
        left: 1081,
        top: 179,
        width: size,
        height: size,
        borderRadius: 66,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: src ? bg : "#FFFFFF",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        <img src={src} width={size} height={size} style={{ objectFit: "contain" }} />
      ) : (
        <LogoMark size={size - 90} color="#0a8f5c" />
      )}
    </div>
  );
}

function LocationRow({ text, accent }: { text: string; accent: string }) {
  const pinSize = 52;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex", position: "relative", width: pinSize, height: pinSize }}>
        <Icon
          icon={FLYER_ICONS.pin}
          size={pinSize}
          color={accent}
          fill={accent}
          strokeWidth={1.5}
        />
        <div
          style={{
            position: "absolute",
            left: pinSize * 0.385,
            top: pinSize * 0.29,
            width: pinSize / 4,
            height: pinSize / 4,
            borderRadius: pinSize / 8,
            backgroundColor: inkFor(accent),
          }}
        />
      </div>
      <Text size={37} weight={600} letterSpacing={4} style={{ marginLeft: 13 }}>
        {text}
      </Text>
    </div>
  );
}

function StatItem({ icon, value, label, accent, left }: FlyerStat & { accent: string; left: boolean }) {
  return (
    <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: left ? "flex-start" : "center",
        ...(left ? { flexShrink: 0 } : { flex: 1 }),
      }}>
      <Icon icon={FLYER_ICONS[icon]} size={64} color={accent} />
      <Text size={38} weight={700} style={{ marginTop: 11 }}>
        {value}
      </Text>
      <Text size={20} weight={500} letterSpacing={1.5} style={{ marginTop: 5 }}>
        {label}
      </Text>
    </div>
  );
}

/**
 * Four or more stats fill the card width, centered under their dividers. With
 * fewer, spreading them out looks lost, so they sit together on the left.
 */
function StatsRow({ stats, accent }: { stats: FlyerStat[]; accent: string }) {
  const left = stats.length < 4;
  const children: ReactNode[] = [];
  stats.forEach((stat, i) => {
    if (i) {
      children.push(
        <Line
          key={`d${i}`}
          vertical
          length={117}
          thickness={6}
          radius={3}
          color={accent}
          style={{ marginTop: 14, ...(left ? { marginLeft: 44, marginRight: 44 } : {}) }}
        />
      );
    }
    children.push(<StatItem key={`s${i}`} {...stat} accent={accent} left={left} />);
  });
  return <div style={{ display: "flex", alignItems: "flex-start", ...(left ? {} : { width: 1240 }) }}>{children}</div>;
}

/** Headline (price) shrinks so long figures like "Gs. 1.250.000.000" stay inside the card. */
function headlineSizeFor(text: string): number {
  return Math.max(70, Math.min(150, Math.floor(1230 / (text.length * 0.66))));
}

function TitleBlock({
  kicker,
  headline,
  location,
  description,
  stats,
  accent,
}: Pick<PropertyFlyerProps, "kicker" | "headline" | "location" | "description" | "stats" | "accent">) {
  const card = THEME.card;
  // The kicker ("EN VENTA") is a bold label on an accent-colored rounded
  // background; longer ones ("CONSTRUIMOS EN TU TERRENO") scale down to fit.
  const kickerSize = Math.min(52, Math.floor(1250 / kicker.length));
  const kickerSpacing = kickerSize * 0.16;
  return (
    <div
      style={{
        position: "absolute",
        left: 165,
        bottom: FLYER_HEIGHT - (card.top + card.height) + 47,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          backgroundColor: accent,
          borderRadius: 26,
          padding: "14px 34px",
          marginLeft: -4,
        }}
      >
        {/* Black text on light accents (yellow, white…), white on the rest — this label only. */}
        <Text
          size={kickerSize}
          weight={800}
          letterSpacing={kickerSpacing}
          color={isLightColor(accent) ? "#000000" : "#FFFFFF"}
          style={{ marginRight: -kickerSpacing }}
        >
          {kicker}
        </Text>
      </div>
      <Text size={headlineSizeFor(headline)} weight={800} letterSpacing={3} style={{ marginLeft: -9, marginTop: 14 }}>
        {headline}
      </Text>
      <div style={{ display: "flex", marginTop: 4, marginLeft: -11 }}>
        <LocationRow text={location} accent={accent} />
      </div>
      <Line length={189} thickness={10} color={accent} style={{ marginTop: 24 }} />
      {description ? (
        <div style={{ display: "flex", marginTop: 18, marginLeft: -2 }}>
          <div
            style={{
              display: "flex",
              maxWidth: 760,
              color: THEME.colors.text,
              ...font(32, 400, 1, { lineHeight: "37px" }),
            }}
          >
            {description}
          </div>
        </div>
      ) : null}
      {stats.length > 0 ? (
        <div style={{ display: "flex", marginTop: 26, marginLeft: stats.length < 4 ? -4 : -51 }}>
          <StatsRow stats={stats} accent={accent} />
        </div>
      ) : null}
    </div>
  );
}

export function PropertyFlyer(props: PropertyFlyerProps) {
  const card = THEME.card;
  return (
    <div
      style={{
        width: FLYER_WIDTH,
        height: FLYER_HEIGHT,
        display: "flex",
        position: "relative",
        overflow: "hidden",
        backgroundColor: THEME.colors.canvas,
      }}
    >
      <Background src={props.backgroundImage} />
      <PhotoCard src={props.propertyImage} />
      <Fade top={1162} width={FLYER_WIDTH} height={FLYER_HEIGHT - 1162} stops={BOTTOM_FADE_STOPS} />
      <Fade
        left={card.left}
        top={card.top}
        width={card.width}
        height={card.height}
        radius={card.radius}
        stops={TOP_FADE_STOPS}
      />

      <AgentHeader
        photo={props.agentPhoto}
        name={props.agentName}
        title={props.agentTitle}
        contacts={props.contacts}
        accent={props.accent}
      />
      {props.showLogo ? <LogoSlot src={props.logo} bg={props.logoBg} /> : null}

      <TitleBlock
        kicker={props.kicker}
        headline={props.headline}
        location={props.location}
        description={props.description}
        stats={props.stats}
        accent={props.accent}
      />
    </div>
  );
}
