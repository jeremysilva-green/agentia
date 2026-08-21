import type { PropertySocialCardProps } from "../types";
import { LISTING_TAG_LABEL } from "../types";
import { LogoMark, buildDotGridDataUri } from "../LogoMark";

// Brand tokens — copied verbatim from agentia_moodboard.html's :root variables.
const COLORS = {
  ink: "#0E0E0E",
  paper: "#FFFFFF",
  green: "#0A8F5C",
  statText: "#c7cacd",
};

// Icon path data copied verbatim from the moodboard's <symbol id="i-bed/i-bath/i-area"> defs.
const ICON_PATHS = {
  bed: [
    "M3 18v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3",
    "M23 18v-6a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3",
    "M3 21v-3h18v3",
  ],
  bath: ["M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3z", "M6 12V6a2 2 0 0 1 3.5-1.3"],
  area: ["M4 4h16v16H4z", "M4 9h4V4M20 15h-4v5"],
};

function StatIcon({ paths }: { paths: string[] }) {
  return (
    <svg viewBox="0 0 24 24" width={28} height={28} style={{ display: "flex" }}>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={COLORS.statText}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
    </svg>
  );
}

function Stat({ icon, label }: { icon: string[]; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <StatIcon paths={icon} />
      <div style={{ display: "flex" }}>{label}</div>
    </div>
  );
}

export interface PropertyTemplateProps extends PropertySocialCardProps {
  width: number;
  height: number;
}

export function PropertyTemplate(props: PropertyTemplateProps) {
  const { width, height, price, address, listingType, bedrooms, bathrooms, areaM2, imageDataUri } = props;

  const photoHeight = Math.round(height * 0.61); // matches reference image's proportions at 1080x1350
  const dotGrid = buildDotGridDataUri(width, height, 26, 1.6, COLORS.green, 0.35);

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        backgroundColor: COLORS.ink,
        backgroundImage: `url(${dotGrid})`,
        padding: "56px 64px 64px",
        fontFamily: "Inter",
      }}
    >
      {/* Header: logo mark + wordmark text + domain */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <LogoMark size={44} color={COLORS.green} />
          <div
            style={{
              display: "flex",
              color: COLORS.paper,
              fontSize: 34,
              fontWeight: 600,
              fontFamily: "Clash Display",
              letterSpacing: "-0.01em",
            }}
          >
            AGENTIA
          </div>
        </div>
        <div style={{ display: "flex", color: COLORS.green, fontSize: 22 }}>agentia.com.py</div>
      </div>

      {/* Cover photo */}
      <div
        style={{
          display: "flex",
          marginTop: 40,
          width: "100%",
          height: photoHeight,
          borderRadius: 28,
          overflow: "hidden",
        }}
      >
        <img src={imageDataUri} width={width - 128} height={photoHeight} style={{ objectFit: "cover" }} />
      </div>

      {/* Tag — alignSelf is required, otherwise Satori's flex defaults stretch it full-width */}
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          marginTop: 36,
          backgroundColor: COLORS.green,
          color: COLORS.paper,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "12px 20px",
          borderRadius: 12,
        }}
      >
        {LISTING_TAG_LABEL[listingType]}
      </div>

      {/* Price — Clash Display Semibold per brand spec */}
      <div
        style={{
          display: "flex",
          marginTop: 22,
          color: COLORS.paper,
          fontSize: 76,
          fontWeight: 600,
          fontFamily: "Clash Display",
          letterSpacing: "-0.01em",
        }}
      >
        {price}
      </div>

      {/* Address */}
      <div style={{ display: "flex", marginTop: 10, color: COLORS.statText, fontSize: 30 }}>{address}</div>

      {/* Bottom row: stats (left) + watermark logo (right) */}
      <div style={{ display: "flex", marginTop: 32, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 40, color: COLORS.statText, fontSize: 26, alignItems: "center" }}>
          {bedrooms != null && <Stat icon={ICON_PATHS.bed} label={`${bedrooms} hab`} />}
          {bathrooms != null && <Stat icon={ICON_PATHS.bath} label={`${bathrooms} ba`} />}
          {areaM2 != null && <Stat icon={ICON_PATHS.area} label={`${areaM2} m²`} />}
        </div>
        <LogoMark size={90} color={COLORS.green} />
      </div>
    </div>
  );
}
