"use client";

import { useMemo, useState } from "react";
import type { Communication } from "@/lib/comunicaciones";
import CommunicationCard from "@/components/CommunicationCard";

type Props = {
  items: Communication[];
  title?: string;
  showMetrics?: boolean;
};

const DEFAULT_TITLE = "Comunicaciones";
const ALL = "Todos";

type SortMode = "recent" | "impact";

function normalizeFilterValue(value: string): string {
  return String(value || "").trim().toLocaleLowerCase("es");
}

function parseDateDDMMYYYY(value: string): number | null {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date.getTime();
}

function uniqueSorted(values: string[]): string[] {
  const map = new Map<string, string>();

  values.forEach((value) => {
    const cleaned = String(value || "").trim();
    if (!cleaned) return;

    const key = cleaned.toLocaleLowerCase("es");
    if (!map.has(key)) map.set(key, cleaned);
  });

  return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
}

function parseMetric(value: unknown): number {
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const normalized = text.replace(/\./g, "").replace(/,/g, ".").replace(/\s+/g, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function impactScore(item: Communication): number {
  const metrics = [
    item.COM_Impresiones,
    item.COM_Alcance,
    item.COM_Interaccion,
    item.COM_Clics,
    item.COM_LikesRecomendReacciones,
    item.COM_CantComentarios,
    item.COM_Guardados,
    item.COM_VecesCompartido_Shared,
  ];

  return metrics
    .map((m) => parseMetric(m))
    .reduce((acc, value) => acc + Math.log1p(value), 0);
}

export default function ComunicacionesSection({
  items,
  title = DEFAULT_TITLE,
  showMetrics = true,
}: Props) {
  const [tipoComunFilter, setTipoComunFilter] = useState(ALL);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const clearFilters = () => {
    setQuery("");
    setTipoComunFilter(ALL);
    setSortMode("recent");
  };

  const tipoComunOptions = useMemo(
    () => [ALL, ...uniqueSorted(items.map((item) => item.COM_TipoComun))],
    [items],
  );

  const filteredAndSortedItems = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es");

    const filtered = items.filter((item) => {
      const tipoComun = String(item.COM_TipoComun || "");
      const matchesTipoComun =
        tipoComunFilter === ALL ||
        normalizeFilterValue(tipoComun) === normalizeFilterValue(tipoComunFilter);

      const titular = String(item.COM_Titular || "").toLocaleLowerCase("es");
      const medio = String(item.COM_Medio || "").toLocaleLowerCase("es");
      const tema = String(item.COM_TemaPubl || "").toLocaleLowerCase("es");
      const tipoMedio = String(item.COM_TipoMedio || "").toLocaleLowerCase("es");

      const matchesQuery = !q || titular.includes(q) || medio.includes(q) || tema.includes(q) || tipoMedio.includes(q);

      return matchesTipoComun && matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "impact") {
        const byImpact = impactScore(b) - impactScore(a);
        if (byImpact !== 0) return byImpact;
      }

      const aTime = parseDateDDMMYYYY(a.COM_Fecha);
      const bTime = parseDateDDMMYYYY(b.COM_Fecha);

      if (aTime !== null && bTime !== null) return bTime - aTime;
      if (aTime !== null) return -1;
      if (bTime !== null) return 1;
      return 0;
    });
  }, [items, query, sortMode, tipoComunFilter]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>

        <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <span>{filteredAndSortedItems.length} resultados</span>
          <div className="flex items-center gap-2">
            <label htmlFor="com-sort" className="text-xs text-gray-500">Ordenar por</label>
            <select
              id="com-sort"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
            >
              <option value="recent">Más recientes</option>
              <option value="impact">Mayor impacto</option>
            </select>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="w-full">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por titular, medio o tema..."
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm"
            />
          </div>

          {tipoComunOptions.map((option) => {
            const isActive = option === tipoComunFilter;
            return (
              <button
                key={`tipo-comun-${option}`}
                type="button"
                onClick={() => setTipoComunFilter(option)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {filteredAndSortedItems.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Sin comunicaciones registradas</h3>
          <p className="mt-2 text-sm text-gray-600">No encontramos apariciones o publicaciones asociadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAndSortedItems.map((item, index) => (
            <CommunicationCard key={`${item.COM_N}-${index}`} item={item} showMetrics={showMetrics} />
          ))}
        </div>
      )}
    </section>
  );
}
