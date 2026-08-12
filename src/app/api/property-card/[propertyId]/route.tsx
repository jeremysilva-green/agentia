import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { createServiceClient } from "@/lib/supabase/service";
import { getPublicStorageUrl } from "@/lib/storage";

const BASE_WIDTH = 1080;
const BASE_HEIGHT = 1350;
const DESCRIPTION_LIMIT = 200;
const GREEN = "#16a34a";

// Route Handlers render outside the RSC client boundary, so lucide-react's
// ("use client") icon components can't be used here — inlined as raw SVG
// paths (copied from lucide-react) instead.
function Icon({ size, color, children }: { size: number; color: string; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function BedIcon(props: { size: number; color: string }) {
  return (
    <Icon {...props}>
      <path d="M2 4v16" />
      <path d="M2 8h18a2 2 0 0 1 2 2v10" />
      <path d="M2 17h20" />
      <path d="M6 8v9" />
    </Icon>
  );
}

function BathIcon(props: { size: number; color: string }) {
  return (
    <Icon {...props}>
      <path d="M10 4 8 6" />
      <path d="M17 19v2" />
      <path d="M2 12h20" />
      <path d="M7 19v2" />
      <path d="M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
    </Icon>
  );
}

function RulerIcon(props: { size: number; color: string }) {
  return (
    <Icon {...props}>
      <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
      <path d="m14.5 12.5 2-2" />
      <path d="m11.5 9.5 2-2" />
      <path d="m8.5 6.5 2-2" />
      <path d="m17.5 15.5 2-2" />
    </Icon>
  );
}

function MapPinIcon(props: { size: number; color: string }) {
  return (
    <Icon {...props}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </Icon>
  );
}

function UserIcon(props: { size: number; color: string }) {
  return (
    <Icon {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  );
}

function buildDotBackground(width: number, height: number) {
  const spacing = 28;
  const radius = 1.6;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><pattern id="dots" x="0" y="0" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse"><circle cx="${
    spacing / 2
  }" cy="${spacing / 2}" r="${radius}" fill="rgba(100,116,139,0.35)" /></pattern></defs><rect width="100%" height="100%" fill="#fafafa" /><rect width="100%" height="100%" fill="url(#dots)" /></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  available: { bg: "#ecfdf5", color: "#047857", label: "Disponible" },
  sold: { bg: "#f1f5f9", color: "#475569", label: "Vendida" },
  rented: { bg: "#fffbeb", color: "#b45309", label: "Alquilada" },
  draft: { bg: "#f1f5f9", color: "#475569", label: "Borrador" },
};

export async function GET(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;
  const service = createServiceClient();

  const { data: property } = await service
    .from("properties")
    .select("*, property_images(*), agent_profiles(profiles(avatar_url))")
    .eq("id", propertyId)
    .eq("published", true)
    .single();

  if (!property) {
    return new Response("No encontrado", { status: 404 });
  }

  const [semiboldFont, lightFont, logoBytes] = await Promise.all([
    readFile(join(process.cwd(), "font", "ClashDisplay-Semibold.otf")),
    readFile(join(process.cwd(), "font", "ClashDisplay-Light.otf")),
    readFile(join(process.cwd(), "assets", "agentia_00000.png")),
  ]);
  const logoDataUri = `data:image/png;base64,${logoBytes.toString("base64")}`;

  const { searchParams } = new URL(request.url);
  const width = Math.min(BASE_WIDTH, Math.max(120, Number(searchParams.get("w")) || BASE_WIDTH));
  const height = Math.round(width * (BASE_HEIGHT / BASE_WIDTH));
  const scale = width / BASE_WIDTH;
  const px = (value: number) => Math.round(value * scale);

  const cover = [...(property.property_images ?? [])].sort((a, b) => a.position - b.position)[0];
  const coverUrl = cover ? getPublicStorageUrl("property-photos", cover.storage_path) : null;
  const status = STATUS_STYLES[property.status] ?? STATUS_STYLES.available;
  const price = new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: property.currency,
    maximumFractionDigits: 0,
  }).format(property.price);

  const description =
    property.description.length > DESCRIPTION_LIMIT
      ? `${property.description.slice(0, DESCRIPTION_LIMIT).trim()}…`
      : property.description;

  const agentAvatarUrl =
    (
      property as typeof property & {
        agent_profiles: { profiles: { avatar_url: string | null } | null } | null;
      }
    ).agent_profiles?.profiles?.avatar_url ?? null;

  const dotBgUri = buildDotBackground(width, height);

  const pad = px(28);
  const imageHeight = Math.round(height * 0.4);
  const logoWidth = px(260);
  const logoHeight = Math.round(logoWidth * (339 / 1787));

  const stats: { icon: typeof BedIcon; text: string }[] = [];
  if (property.bedrooms != null) stats.push({ icon: BedIcon, text: `${property.bedrooms} Hab.` });
  if (property.bathrooms != null) stats.push({ icon: BathIcon, text: `${property.bathrooms} Baños` });
  if (property.area_m2 != null) stats.push({ icon: RulerIcon, text: `${property.area_m2}m²` });

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dotBgUri}
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          alt=""
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: `${px(44)}px ${pad}px 0`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: px(18), marginBottom: px(32) }}>
            <div
              style={{
                display: "flex",
                width: px(70),
                height: px(70),
                borderRadius: 999,
                overflow: "hidden",
                background: "#e2e8f0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {agentAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agentAvatarUrl}
                  width={px(70)}
                  height={px(70)}
                  style={{ objectFit: "cover", width: "100%", height: "100%", borderRadius: 999 }}
                  alt=""
                />
              ) : (
                <UserIcon size={px(32)} color="#94a3b8" />
              )}
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "ClashSemibold",
                fontSize: px(46),
                color: "#0f172a",
                letterSpacing: -1,
                textTransform: "uppercase",
              }}
            >
              Agentia
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "#ffffff",
              borderTopLeftRadius: px(48),
              borderTopRightRadius: px(48),
              borderBottomLeftRadius: px(48),
              borderBottomRightRadius: px(48),
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(15,23,42,0.12)",
              paddingBottom: px(44),
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: imageHeight,
                display: "flex",
              }}
            >
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  width={width}
                  height={imageHeight}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  alt=""
                />
              ) : (
                <div style={{ display: "flex", width: "100%", height: "100%", background: "#e2e8f0" }} />
              )}

              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: "60%",
                  backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))",
                }}
              />

              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  top: px(24),
                  left: px(24),
                  padding: `${px(12)}px ${px(26)}px`,
                  borderRadius: 999,
                  background: status.bg,
                  color: status.color,
                  fontFamily: "ClashSemibold",
                  fontSize: px(30),
                }}
              >
                {status.label}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: px(28),
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-end", gap: px(12) }}>
                  <div style={{ display: "flex", fontFamily: "ClashSemibold", fontSize: px(72), color: "#ffffff", lineHeight: 1 }}>
                    {price}
                  </div>
                  {property.listing_type === "rent" && (
                    <div style={{ display: "flex", fontFamily: "ClashLight", fontSize: px(30), color: "#e2e8f0", paddingBottom: px(8) }}>
                      /mes
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                padding: `0 ${px(28)}px`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontFamily: "ClashSemibold",
                  fontSize: px(52),
                  color: "#0f172a",
                  lineHeight: 1.15,
                  textAlign: "center",
                  marginTop: px(36),
                }}
              >
                {property.title}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: px(10), marginTop: px(14) }}>
                <MapPinIcon size={px(28)} color={GREEN} />
                <div style={{ display: "flex", fontFamily: "ClashLight", fontSize: px(34), color: "#64748b" }}>
                  {property.city}
                </div>
              </div>

              {stats.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: px(38) }}>
                  {stats.map((stat, i) => (
                    <div key={stat.text} style={{ display: "flex", alignItems: "center" }}>
                      {i > 0 && (
                        <div style={{ display: "flex", width: px(2), height: px(34), background: "#e2e8f0", margin: `0 ${px(24)}px` }} />
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: px(12) }}>
                        <stat.icon size={px(34)} color={GREEN} />
                        <div style={{ display: "flex", fontFamily: "ClashSemibold", fontSize: px(34), color: "#0f172a" }}>
                          {stat.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  fontFamily: "ClashLight",
                  fontSize: px(30),
                  color: "#64748b",
                  lineHeight: 1.4,
                  textAlign: "center",
                  marginTop: px(34),
                }}
              >
                {description}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#000000",
            borderTop: `${px(6)}px solid ${GREEN}`,
            padding: `${px(28)}px ${pad}px`,
          }}
        >
          <div style={{ display: "flex", fontFamily: "ClashLight", fontSize: px(26), color: "#ffffff" }}>
            www.agentia.com.py
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoDataUri} width={logoWidth} height={logoHeight} alt="Agentia" />
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: [
        { name: "ClashSemibold", data: semiboldFont, style: "normal", weight: 600 },
        { name: "ClashLight", data: lightFont, style: "normal", weight: 300 },
      ],
    }
  );
}
