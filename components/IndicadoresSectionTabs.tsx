"use client";

import { useState } from "react";
import Link from "next/link";
import type { Indicator } from "../lib/indicadores";
import type { MetaRectoria } from "../lib/metasRectoria";
import IndicadoresDashboard from "./IndicadoresDashboard";
import MetasRectoriaTable from "./MetasRectoriaTable";

type Props = {
  isAuthenticated: boolean;
  indicadores: Indicator[];
  metasRectoria: MetaRectoria[];
  metasYear?: 2024 | 2025;
  nextPath?: string;
};

type TabKey = "metas" | "equipo";

export default function IndicadoresSectionTabs({
  isAuthenticated,
  indicadores,
  metasRectoria,
  metasYear = 2025,
  nextPath = "/indicadores",
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>(isAuthenticated ? "equipo" : "metas");

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("metas")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "metas"
                ? "border-slate-300 bg-slate-100 text-slate-900"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Metas de Rectoría (público)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("equipo")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "equipo"
                ? "border-slate-300 bg-slate-100 text-slate-900"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Indicadores internos (equipo Innovación)
          </button>
        </div>
      </div>

      {activeTab === "metas" ? (
        <MetasRectoriaTable rows={metasRectoria} year={metasYear} />
      ) : isAuthenticated ? (
        <IndicadoresDashboard allRows={indicadores} />
      ) : (
        <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-slate-900">Sección privada</h2>
          <p className="mt-2 text-sm text-gray-600">Para ver los indicadores internos del equipo de Innovación debes iniciar sesión.</p>
          <div className="mt-4">
            <Link
              href={`/ingresar?next=${encodeURIComponent(nextPath)}`}
              className="inline-flex rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Ingresar
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
