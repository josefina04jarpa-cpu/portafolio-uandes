"use client";

import React, { useMemo } from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from "recharts";
import type { Indicator } from "../lib/indicadores";

type Props = { allRows: Indicator[] };

export default function RadarStrategico({ allRows }: Props) {
  const data = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    allRows.forEach((r) => {
      const c = r.categoria || "Sin categoría";
      const cur = map.get(c) ?? { sum: 0, count: 0 };
      cur.sum += Number(r.avance || 0);
      cur.count += 1;
      map.set(c, cur);
    });
    const out: { categoria: string; Real: number; Meta: number }[] = [];
    for (const [categoria, v] of map.entries()) {
      const avg = v.count === 0 ? 0 : v.sum / v.count;
      out.push({ categoria, Real: Math.round(avg), Meta: 100 });
    }
    return out.sort((a,b)=>b.Real - a.Real).slice(0, 6); // limit categories to top 6 for clarity
  }, [allRows]);

  if (data.length === 0) return <div className="h-full flex items-center justify-center text-sm text-gray-500">No hay datos</div>;

  // compact layout: fixed height, smaller ticks and a short summary to improve readability
  return (
    <div className="flex flex-col lg:flex-row items-center gap-4 h-full">
      <div className="w-full lg:w-2/3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="60%">
            <PolarGrid />
            <PolarAngleAxis dataKey="categoria" tick={{ fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={4} tick={{ fontSize: 10 }} />
            <Radar name="Real" dataKey="Real" stroke="#9f1239" fill="#9f1239" fillOpacity={0.6} />
            <Radar name="Meta" dataKey="Meta" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.12} />
            <Tooltip formatter={(value: any) => `${value}%`} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full lg:w-1/3">
        <div className="text-sm font-medium text-slate-900">Radar estratégico</div>
        <div className="mt-1 text-xs text-gray-500">Promedio de avance por categoría. Meta = 100%.</div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-6 rounded bg-[#9f1239]" />
            <span className="text-xs text-gray-700">Real</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-6 rounded bg-[#94a3b8]" />
            <span className="text-xs text-gray-700">Meta (100%)</span>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {data.slice(0,3).map((d) => (
            <div key={d.categoria} className="flex items-center justify-between">
              <div className="text-sm text-gray-800 truncate">{d.categoria}</div>
              <div className="text-sm font-medium text-slate-900">{d.Real}%</div>
            </div>
          ))}
          {data.length > 3 && <div className="mt-2 text-xs text-gray-500">Mostrando {data.length} categorías (top 6).</div>}
        </div>
      </div>
    </div>
  );
}
