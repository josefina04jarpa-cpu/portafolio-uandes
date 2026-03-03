"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type PlatformFilter = "Todos" | "Instagram" | "LinkedIn";

type Props = {
  year?: number;
  monthlyValuesByPlatform: Record<PlatformFilter, number[]>;
};

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const PLATFORM_OPTIONS: PlatformFilter[] = ["Todos", "Instagram", "LinkedIn"];

function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(value / 1_000_000)}M`;
  }
  if (value >= 1_000) {
    return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(value / 1_000)}K`;
  }
  return new Intl.NumberFormat("es-CL").format(value);
}

function clampMonthlySeries(values: number[] | undefined): number[] {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const raw = values?.[monthIndex] ?? 0;
    const numeric = Number(raw);
    if (Number.isNaN(numeric) || !Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.round(numeric));
  });
}

export default function ImpresionesMensualesCard({ year = 2025, monthlyValuesByPlatform }: Props) {
  const [platform, setPlatform] = useState<PlatformFilter>("Todos");

  const values = useMemo(
    () => clampMonthlySeries(monthlyValuesByPlatform[platform]),
    [monthlyValuesByPlatform, platform],
  );

  const chartData = useMemo(
    () => values.map((value, monthIndex) => ({ month: MONTH_LABELS[monthIndex], value })),
    [values],
  );

  const totalImpresiones = useMemo(
    () => values.reduce((accumulator, value) => accumulator + value, 0),
    [values],
  );

  const promedioMensual = Math.round(totalImpresiones / 12);

  const bestMonth = useMemo(() => {
    let bestIndex = 0;
    for (let index = 1; index < values.length; index += 1) {
      if (values[index] > values[bestIndex]) bestIndex = index;
    }
    return { label: MONTH_LABELS[bestIndex], value: values[bestIndex] };
  }, [values]);

  const worstMonth = useMemo(() => {
    let worstIndex = 0;
    for (let index = 1; index < values.length; index += 1) {
      if (values[index] < values[worstIndex]) worstIndex = index;
    }
    return { label: MONTH_LABELS[worstIndex], value: values[worstIndex] };
  }, [values]);

  return (
    <article className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xs text-gray-500">Impresiones por mes</h3>

        <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
          {PLATFORM_OPTIONS.map((option) => {
            const isActive = platform === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setPlatform(option)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  isActive ? "bg-slate-900 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 text-2xl font-semibold text-slate-900">{new Intl.NumberFormat("es-CL").format(totalImpresiones)}</div>
      <div className="mt-1 text-[11px] text-gray-500">Año {year} · Fuente: Comunicaciones.csv</div>

      <div className="mt-4 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={40}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={formatCompact}
            />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const value = Number(payload[0].value || 0);
                return (
                  <div className="rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs shadow-sm">
                    <div className="font-medium text-slate-900">{label}</div>
                    <div className="mt-0.5 text-gray-600">
                      Impresiones: {new Intl.NumberFormat("es-CL").format(value)}
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#0f172a" maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-gray-100 bg-white px-2.5 py-2">
          <div className="text-[10px] text-gray-500">Promedio mensual</div>
          <div className="mt-0.5 text-xs font-semibold text-slate-900">{new Intl.NumberFormat("es-CL").format(promedioMensual)}</div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white px-2.5 py-2">
          <div className="text-[10px] text-gray-500">Mejor mes</div>
          <div className="mt-0.5 text-xs font-semibold text-slate-900">
            {bestMonth.label} · {new Intl.NumberFormat("es-CL").format(bestMonth.value)}
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white px-2.5 py-2">
          <div className="text-[10px] text-gray-500">Peor mes</div>
          <div className="mt-0.5 text-xs font-semibold text-slate-900">
            {worstMonth.label} · {new Intl.NumberFormat("es-CL").format(worstMonth.value)}
          </div>
        </div>
      </div>
    </article>
  );
}
