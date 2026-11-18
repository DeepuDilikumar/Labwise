"use client";
import { useTranslations } from "next-intl";
import * as React from "react";
import { CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Tone } from "@/lib/domain/status";
import { cn } from "@/lib/cn";
import { Segmented } from "./segmented";
import { StatusPill } from "./status-pill";
import type { MarkerStatus } from "@/lib/domain/status";

export interface TrendPoint {
  /** ISO date */
  date: string;
  dateLabel: string;
  value: number;
  valueLabel: string;
  status: MarkerStatus;
  tone: Tone;
}

/** Round the y-domain to a "nice" step so ticks read 4, 5, 6 rather than 4.3, 5.2. */
function niceDomain(lo: number, hi: number): [number, number] {
  const span = hi - lo || Math.abs(hi) || 1;
  const raw = span / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const min = Math.floor((lo - step * 0.5) / step) * step;
  return [lo >= 0 ? Math.max(0, min) : min, Math.ceil((hi + step * 0.5) / step) * step];
}

const toneVar: Record<Tone, string> = {
  ok: "var(--ok)",
  borderline: "var(--warn)",
  out: "var(--out)",
  critical: "var(--crit)",
  neutral: "var(--ink-3)",
};

/**
 * Single-series trend: one 2px line, ≥8px points (status-coloured with a
 * surface ring), shaded printed reference band, crosshair tooltip, and a
 * table view so values are never colour- or hover-only.
 */
export function TrendChart({
  points,
  unit,
  bandLow,
  bandHigh,
  title,
  className,
}: {
  points: TrendPoint[];
  unit?: string | null;
  bandLow?: number | null;
  bandHigh?: number | null;
  title: string;
  className?: string;
}) {
  const t = useTranslations("trends");
  const [view, setView] = React.useState<"chart" | "table">("chart");
  const values = points.map((p) => p.value);
  const lo = Math.min(...values, bandLow ?? Infinity);
  const hi = Math.max(...values, bandHigh ?? -Infinity);
  const domain = niceDomain(lo, hi);
  const fmtTick = (n: number) => (Math.abs(n) >= 100 ? Math.round(n).toString() : Number(n.toFixed(1)).toString());

  return (
    <figure className={cn("rounded-[var(--radius-xl)] border border-line bg-surface p-5 shadow-[var(--shadow-xs)] sm:p-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <figcaption className="min-w-0">
          <p className="text-h3 font-semibold text-ink">{title}</p>
          <p className="text-small text-ink-3">
            {unit ? `${unit} · ` : ""}
            {bandLow != null || bandHigh != null ? t("bandNote") : t("noBand")}
          </p>
        </figcaption>
        <Segmented
          label={t("viewLabel")}
          value={view}
          onChange={setView}
          options={[
            { value: "chart", label: t("chart") },
            { value: "table", label: t("table") },
          ]}
        />
      </div>

      {view === "chart" ? (
        <div className="mt-5 h-56 w-full sm:h-64" role="img" aria-label={t("aria", { title, count: points.length })}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="0" />
              {(bandLow != null || bandHigh != null) && (
                <ReferenceArea
                  y1={bandLow ?? domain[0]}
                  y2={bandHigh ?? domain[1]}
                  fill="var(--ok)"
                  fillOpacity={0.09}
                  stroke="var(--ok)"
                  strokeOpacity={0.25}
                  strokeDasharray="3 3"
                  ifOverflow="extendDomain"
                />
              )}
              <XAxis
                dataKey="dateLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--ink-3)", fontSize: 12 }}
                tickMargin={10}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={domain}
                tickCount={5}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--ink-3)", fontSize: 12 }}
                tickFormatter={fmtTick}
                width={48}
              />
              <Tooltip
                cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
                content={({ active, payload }) => {
                  const p = active && payload?.[0]?.payload as TrendPoint | undefined;
                  if (!p) return null;
                  return (
                    <div className="rounded-[12px] border border-line bg-surface px-3 py-2.5 shadow-[var(--shadow-lg)]">
                      <p className="text-caption text-ink-3">{p.dateLabel}</p>
                      <p className="mt-0.5 text-body font-semibold tabular text-ink">
                        {p.valueLabel} <span className="text-small font-normal text-ink-3">{unit}</span>
                      </p>
                      <StatusPill className="mt-1.5" size="sm" status={p.status} tone={p.tone} />
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2}
                activeDot={{ r: 6, stroke: "var(--surface)", strokeWidth: 2 }}
                dot={(props: { cx?: number; cy?: number; payload?: TrendPoint; index?: number }) => (
                  <circle
                    key={props.index}
                    cx={props.cx}
                    cy={props.cy}
                    r={5}
                    fill={props.payload ? toneVar[props.payload.tone] : "var(--primary)"}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                )}
                animationDuration={600}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <table className="mt-4 w-full text-small">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="text-left text-caption text-ink-3">
              <th className="py-2 font-medium">{t("date")}</th>
              <th className="py-2 text-right font-medium">{t("value")}</th>
              <th className="py-2 pl-3 text-right font-medium">{t("status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {[...points].reverse().map((p) => (
              <tr key={p.date}>
                <td className="py-2.5 text-ink-2">{p.dateLabel}</td>
                <td className="py-2.5 text-right font-medium tabular text-ink">
                  {p.valueLabel} <span className="font-normal text-ink-3">{unit}</span>
                </td>
                <td className="py-2.5 pl-3 text-right">
                  <StatusPill size="sm" status={p.status} tone={p.tone} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  );
}
