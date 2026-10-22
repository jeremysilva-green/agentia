import { Globe, Building2 } from "lucide-react";

const NODE_COUNT = 6;
const RADIUS = 140;
const CENTER = 200;

const ACCENTS = {
  emerald: {
    lineStrong: "#13c47f4d",
    lineFaint: "#13c47f22",
    dot: "var(--em-2)",
    ring: "var(--em-2)",
    hubBg: "var(--em)",
    hubGlow: "var(--em-glow)",
    nodeBorder: "#13c47f66",
    nodeText: "var(--em-2)",
  },
  purple: {
    lineStrong: "#a855f74d",
    lineFaint: "#a855f722",
    dot: "#c084fc",
    ring: "#c084fc",
    hubBg: "#8b5cf6",
    hubGlow: "rgba(139, 92, 246, 0.45)",
    nodeBorder: "#a855f766",
    nodeText: "#c084fc",
  },
} as const;

function nodePosition(index: number) {
  const angle = (index / NODE_COUNT) * Math.PI * 2 - Math.PI / 2;
  return { x: CENTER + Math.cos(angle) * RADIUS, y: CENTER + Math.sin(angle) * RADIUS };
}

const NODES = Array.from({ length: NODE_COUNT }, (_, i) => nodePosition(i));

// Decorative only — a static (non-dragging) approximation of the mockup's
// agency-network illustration: a center hub, 6 orbiting agency nodes
// connected by dashed lines, small dots traveling hub→node, and pulsing
// rings. The whole constellation doesn't slowly rotate like the mockup's
// `.orbit` group — the mockup counter-rotates each node's icon to cancel
// that rotation out, which only makes sense with the HTML/SVG split the
// mockup uses; skipping it keeps this version simple without losing the
// more noticeable animations (the traveling dots, the pulse, the bobbing
// nodes).
export function MlsNetworkDiagram({ accent = "emerald" }: { accent?: keyof typeof ACCENTS }) {
  const c = ACCENTS[accent];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full overflow-visible">
        {NODES.map((n, i) => {
          const next = NODES[(i + 1) % NODES.length];
          return (
            <g key={i}>
              <line x1={CENTER} y1={CENTER} x2={n.x} y2={n.y} stroke={c.lineStrong} strokeWidth={1.3} strokeDasharray="4 6" />
              <line x1={n.x} y1={n.y} x2={next.x} y2={next.y} stroke={c.lineFaint} strokeWidth={1.3} strokeDasharray="4 6" />
            </g>
          );
        })}

        {NODES.map((n, i) => {
          const target = NODES[(i + 2) % NODES.length];
          return (
            <circle key={i} r={3.2} fill={c.dot}>
              <animateMotion
                dur={`${3 + i * 0.4}s`}
                repeatCount="indefinite"
                begin={`${i * 0.5}s`}
                path={`M${n.x},${n.y} L${CENTER},${CENTER} L${target.x},${target.y}`}
              />
            </circle>
          );
        })}

        {[0, 1.5].map((delay) => (
          <circle
            key={delay}
            cx={CENTER}
            cy={CENTER}
            r={34}
            fill="none"
            stroke={c.ring}
            strokeWidth={1.4}
            className="panel-svg-pulse"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </svg>

      <div
        className="absolute top-1/2 left-1/2 grid h-[68px] w-[68px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-white"
        style={{ background: c.hubBg, boxShadow: `0 0 50px -8px ${c.hubGlow}` }}
      >
        <Globe size={28} />
      </div>

      {NODES.map((n, i) => (
        <div
          key={i}
          className="panel-bob absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[13px] border bg-[var(--ink)]"
          style={{
            left: `${(n.x / 400) * 100}%`,
            top: `${(n.y / 400) * 100}%`,
            animationDelay: `${-i * 0.8}s`,
            borderColor: c.nodeBorder,
            color: c.nodeText,
          }}
        >
          <Building2 size={18} />
        </div>
      ))}
    </div>
  );
}
