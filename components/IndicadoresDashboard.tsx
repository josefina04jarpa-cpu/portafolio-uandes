"use client";

import React, { useMemo, useState } from "react";
import type { Indicator } from "../lib/indicadores";
import IndicadoresTable from "./IndicadoresTable";
import StrategicKPI from "./StrategicKPI";
import KPICategoryTabs from "./KPICategoryTabs";

type Props = { allRows: Indicator[] };

const STRATEGIC_CATEGORIES = [
  "Formación",
  "Financiamiento",
  "Transferencia",
  "Internacionalización",
  "Interdisciplinariedad",
];

function normalizeText(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function mapStrategicCategory(rawCategory: string): string | null {
  const n = normalizeText(rawCategory);
  if (!n) return null;

  if (n.includes("formacion")) return "Formación";
  if (n.includes("financ")) return "Financiamiento";
  if (n.includes("transfer")) return "Transferencia";
  if (n.includes("internacional")) return "Internacionalización";
  if (n.includes("interdiscip")) return "Interdisciplinariedad";

  return null;
}

function scoreStrategicPriority(row: Indicator): number {
  const highPriorityBonus = normalizeText(row.prioridad) === "alta" ? 1_000_000 : 0;
  const meta = Number(row.meta_2025_num || 0);
  const real = Number(row.valor_2025_num || 0);
  const impact = Math.abs(real - meta);
  return highPriorityBonus + impact + meta;
}

export default function IndicadoresDashboard({ allRows }: Props) {
  const categoriesWithData = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((row) => {
      const mapped = mapStrategicCategory(row.categoria);
      if (mapped) set.add(mapped);
    });

    return STRATEGIC_CATEGORIES.filter((category) => set.has(category));
  }, [allRows]);

  const [activeCategory, setActiveCategory] = useState<string>(categoriesWithData[0] ?? STRATEGIC_CATEGORIES[0]);

  const safeActiveCategory = categoriesWithData.includes(activeCategory)
    ? activeCategory
    : categoriesWithData[0] ?? STRATEGIC_CATEGORIES[0];

  const rowsByActiveCategory = useMemo(() => {
    return allRows.filter((row) => mapStrategicCategory(row.categoria) === safeActiveCategory);
  }, [allRows, safeActiveCategory]);

  const strategicTop = useMemo(() => {
    return [...rowsByActiveCategory].sort((a, b) => scoreStrategicPriority(b) - scoreStrategicPriority(a)).slice(0, 4);
  }, [rowsByActiveCategory]);

  const dataCutLabel = "Corte de datos: 2025";

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      {/* Section 1 - KPI Cards */}
      <section>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Indicadores relevantes</h2>
              <p className="mt-1 text-sm text-gray-500">Impacto real frente a meta por categoría estratégica</p>
              <p className="mt-1 text-xs text-gray-400">{dataCutLabel}</p>
            </div>
          </div>

          <div className="mt-5">
            <KPICategoryTabs
              categories={categoriesWithData.length > 0 ? categoriesWithData : [...STRATEGIC_CATEGORIES]}
              activeCategory={safeActiveCategory}
              onChange={setActiveCategory}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {strategicTop.map((kpi) => (
              <StrategicKPI key={`${safeActiveCategory}-${kpi.id}`} item={kpi} />
            ))}
          </div>

          {strategicTop.length === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
              No hay indicadores cargados para esta categoría.
            </div>
          )}

          {strategicTop.length > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              Mostrando {strategicTop.length} KPI estratégicos principales en {safeActiveCategory}.
            </div>
          )}
        </div>
      </section>

      {/* Section 2 - Filterable Table */}
      <section>
        <IndicadoresTable allRows={allRows} />
      </section>

      {/* Responsables card (must remain) */}
      <section>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-slate-900">Responsables de indicadores</h3>
          <ul className="mt-4 space-y-3">
            {[
              ["María Fernanda Gana", "Jefa de Comunicaciones de Innovación"],
              ["Ariel Véliz", "Jefe Financiero"],
              ["Daniela Sánchez", "Jefa de Asuntos Jurídicos"],
              ["Karen Márquez", "Gestora Tecnológica"],
              ["María Isabel González", "Coordinadora Iniciativa BiCI"],
              ["Danilo Segovia", "Subdirector de Proyectos y Fondos Públicos"],
            ].map(([name, role]) => (
              <li key={name} className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700">{name.split(" ").map(n=>n[0]).slice(0,2).join("")}</div>
                <div>
                  <div className="text-sm font-medium text-slate-900">{name}</div>
                  <div className="text-xs text-gray-500">{role}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
