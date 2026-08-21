"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { niceMax, formatCompact } from "@/lib/chartMath";
import type { MonthlyTrendPoint } from "@/lib/data/dashboard";

const GREEN = "#059669"; // emerald-600, the app's brand accent
const GREEN_WASH = "#a7f3d0"; // emerald-200, lighter step of the same ramp
const GRID = "#e2e8f0"; // slate-200, recessive one-step-off-surface gray
const AXIS_TEXT = "#64748b"; // slate-500, text token — never the series color

const CHART_WIDTH = 340;
const CHART_HEIGHT = 190;
const PAD = { top: 16, right: 12, bottom: 28, left: 12 };

function ChartFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-1 border-emerald-100! bg-emerald-50! p-5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
      <div className="mt-2 w-full overflow-x-auto">{children}</div>
    </Card>
  );
}

function BarTrend({ data, valueKey, valueFormat }: { data: MonthlyTrendPoint[]; valueKey: "soldCount" | "interactions"; valueFormat?: (n: number) => string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const values = data.map((d) => d[valueKey]);
  const max = niceMax(Math.max(...values, 0));
  const plotHeight = CHART_HEIGHT - PAD.top - PAD.bottom;
  const plotWidth = CHART_WIDTH - PAD.left - PAD.right;
  const bandWidth = plotWidth / data.length;
  const barWidth = Math.min(24, bandWidth * 0.5);

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg width="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label="Gráfico de barras mensual" className="min-w-[220px]">
      {gridSteps.map((step) => {
        const y = PAD.top + plotHeight * (1 - step);
        return <line key={step} x1={PAD.left} x2={CHART_WIDTH - PAD.right} y1={y} y2={y} stroke={GRID} strokeWidth={1} />;
      })}

      {data.map((point, i) => {
        const value = point[valueKey];
        const targetHeight = max === 0 ? 0 : (value / max) * plotHeight;
        const height = mounted ? targetHeight : 0;
        const x = PAD.left + i * bandWidth + (bandWidth - barWidth) / 2;
        const y = PAD.top + plotHeight - height;

        return (
          <g key={point.label + i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={height}
              rx={4}
              fill={GREEN}
              style={{ transition: `height 600ms ease-out ${i * 70}ms, y 600ms ease-out ${i * 70}ms` }}
            />
            {value > 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize={10}
                fill={AXIS_TEXT}
                style={{ opacity: mounted ? 1 : 0, transition: `opacity 300ms ease-out ${i * 70 + 400}ms` }}
              >
                {valueFormat ? valueFormat(value) : value}
              </text>
            )}
            <text x={x + barWidth / 2} y={CHART_HEIGHT - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineTrend({ data }: { data: MonthlyTrendPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const values = data.map((d) => d.netIncomePYG);
  const max = niceMax(Math.max(...values, 0));
  const plotHeight = CHART_HEIGHT - PAD.top - PAD.bottom;
  const plotWidth = CHART_WIDTH - PAD.left - PAD.right;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = PAD.left + i * stepX;
    const y = PAD.top + plotHeight - (max === 0 ? 0 : (d.netIncomePYG / max) * plotHeight);
    return { x, y, value: d.netIncomePYG, label: d.label };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${PAD.top + plotHeight} L ${points[0]?.x ?? 0} ${PAD.top + plotHeight} Z`;

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg width="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label="Gráfico de línea de ingreso neto mensual" className="min-w-[220px]">
      {gridSteps.map((step) => {
        const y = PAD.top + plotHeight * (1 - step);
        return <line key={step} x1={PAD.left} x2={CHART_WIDTH - PAD.right} y1={y} y2={y} stroke={GRID} strokeWidth={1} />;
      })}

      <path
        d={areaPath}
        fill={GREEN_WASH}
        opacity={mounted ? 0.35 : 0}
        style={{ transition: "opacity 700ms ease-out 200ms" }}
      />

      <path
        d={linePath}
        fill="none"
        stroke={GREEN}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: mounted ? 0 : 1,
          transition: "stroke-dashoffset 900ms ease-out",
        }}
      />

      {points.map((p, i) => (
        <g key={p.label + i} style={{ opacity: mounted ? 1 : 0, transition: `opacity 300ms ease-out ${600 + i * 60}ms` }}>
          <circle cx={p.x} cy={p.y} r={4} fill={GREEN} stroke="#ffffff" strokeWidth={2} />
          {p.value > 0 && (
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={10} fill={AXIS_TEXT}>
              Gs. {formatCompact(p.value)}
            </text>
          )}
          <text x={p.x} y={CHART_HEIGHT - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function AnalyticsCharts({ data }: { data: MonthlyTrendPoint[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartFrame title="Interacciones por mes" subtitle="Vistas de tus propiedades, últimos 6 meses">
        <BarTrend data={data} valueKey="interactions" />
      </ChartFrame>
      <ChartFrame title="Propiedades vendidas por mes" subtitle="Cantidad de ventas cerradas, últimos 6 meses">
        <BarTrend data={data} valueKey="soldCount" />
      </ChartFrame>
      <ChartFrame title="Balance de ingreso neto" subtitle="Comisión estimada por mes, últimos 6 meses">
        <LineTrend data={data} />
      </ChartFrame>
    </div>
  );
}
