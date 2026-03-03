"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import type { TRLYearPoint } from "../lib/trl";

type Props = {
  tech: Record<string, unknown>;
  trlByYear?: TRLYearPoint[];
};

function asStringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asStringValue(item).trim())
    .filter((item) => item.length > 0);
}

export default function TechnologySidebar({ tech, trlByYear = [] }: Props) {
  const faculty = asStringValue(tech.faculty) || asStringValue(tech.TECN_Industria) || "-";
  const techId = asStringValue(tech.TECN_ID) || asStringValue(tech.id) || "-";
  const investigators = asStringValue(tech.investigators) || asStringValue(tech.TECN_Investigadores) || "-";
  const estado = asStringValue(tech.estado) || asStringValue(tech.TECN_Activo) || "-";
  const patente = asStringValue(tech.patente) || "-";
  const sources = asStringArray(tech.sources);

  const trlSeries = useMemo(() => {
    return trlByYear
      .filter((row) => Number.isFinite(row.year))
      .map((row) => ({
        year: row.year,
        trl: row.trl ?? undefined,
      }));
  }, [trlByYear]);

  const yearOptions = useMemo(() => trlSeries.map((row) => row.year), [trlSeries]);
  const latestYear = yearOptions[yearOptions.length - 1] ?? null;
  const [selectedYear, setSelectedYear] = useState<number>(latestYear ?? 0);

  const selectedDetail = useMemo(() => {
    return trlByYear.find((row) => row.year === selectedYear) ?? null;
  }, [trlByYear, selectedYear]);

  const metrics = useMemo(
    () => [
      { key: "crl", label: "CRL" },
      { key: "trl", label: "TRL" },
      { key: "brl", label: "BRL" },
      { key: "iprl", label: "IPRL" },
      { key: "tmrl", label: "TmRL" },
      { key: "frl", label: "FRL" },
    ] as const,
    [],
  );

  const displayedYears = useMemo(() => {
    return yearOptions.filter((year) => year === selectedYear);
  }, [yearOptions, selectedYear]);

  const radarData = useMemo(() => {
    return metrics.map((metric) => {
      const entry: Record<string, number | string> = { metric: metric.label };

      trlByYear.forEach((row) => {
        const key = `y${row.year}`;
        const value = row[metric.key];
        entry[key] = typeof value === "number" ? value : 0;
      });

      return entry;
    });
  }, [metrics, trlByYear]);

  const radarColors = ["#c2185b", "#8e24aa", "#3949ab", "#00897b", "#f9a825", "#ef6c00", "#6d4c41"];

  const maturityCards = useMemo(() => {
    if (!selectedDetail) return [];

    return [
      ["TRL", selectedDetail.trl],
      ["CRL", selectedDetail.crl],
      ["BRL", selectedDetail.brl],
      ["IPRL", selectedDetail.iprl],
      ["TmRL", selectedDetail.tmrl],
      ["FRL", selectedDetail.frl],
    ].filter(([, value]) => value !== null) as Array<[string, number]>;
  }, [selectedDetail]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="text-sm font-medium text-slate-900">Información de Facultad</div>
        <div className="mt-3 text-xs text-gray-600 space-y-2">
          <div>Facultad: <span className="font-medium text-slate-900">{faculty}</span></div>
          <div>ID: <span className="font-medium text-slate-900">{techId}</span></div>
          <div>PI: <span className="font-medium text-slate-900">{investigators}</span></div>
          <div>Estado: <span className="inline-block ml-2 rounded-full px-2 py-0.5 text-xs bg-gray-100">{estado}</span></div>
          <div>Patente: <span className="font-medium text-slate-900">{patente}</span></div>
        </div>

        {sources.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-gray-500">Fuentes</div>
            <ul className="mt-2 text-xs text-gray-700 list-disc list-inside">
              {sources.map((source, i) => <li key={i}>{source}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="text-sm font-medium text-slate-900">Indicadores XRL</div>

        {trlSeries.length === 0 ? (
          <p className="mt-3 text-xs text-gray-600">Sin datos de TRL para esta tecnología.</p>
        ) : (
          <>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                  <PolarGrid stroke="#d1d5db" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#334155", fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 9]} tickCount={10} tick={{ fill: "#64748b", fontSize: 10 }} />

                  {displayedYears.map((year, idx) => (
                    <Radar
                      key={year}
                      name={String(year)}
                      dataKey={`y${year}`}
                      stroke={radarColors[idx % radarColors.length]}
                      fill={radarColors[idx % radarColors.length]}
                      fillOpacity={displayedYears.length > 1 ? 0.18 : 0.34}
                      strokeWidth={2}
                    />
                  ))}

                  <Tooltip
                    contentStyle={{ background: "#111827", border: "none", borderRadius: 8, color: "#fff" }}
                    labelStyle={{ color: "#f3f4f6", fontWeight: 600 }}
                    itemStyle={{ color: "#f9fafb", fontSize: 12 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {yearOptions.map((year) => {
                const isActive = year === selectedYear;
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      isActive
                        ? "border-slate-300 bg-slate-100 text-slate-900"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {maturityCards.length === 0 ? (
                <div className="col-span-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">Sin niveles reportados en {selectedYear}.</div>
              ) : (
                maturityCards.map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-gray-50 px-2 py-2 text-center">
                    <div className="text-[11px] text-gray-500">{label}</div>
                    <div className="text-sm font-semibold text-slate-900">{value}</div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
