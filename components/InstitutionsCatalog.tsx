"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type InstitutionItem = {
  id: string;
  name: string;
  type: string;
  industry: string;
  region: string;
};

type ViewMode = "lista" | "cards";

const ITEMS_PER_PAGE = 6;

function display(value: string) {
  const text = String(value || "").trim();
  return text ? text : "-";
}

export default function InstitutionsCatalog({ items }: { items: InstitutionItem[] }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [industryFilter, setIndustryFilter] = useState("Todos");
  const [regionFilter, setRegionFilter] = useState("Todos");
  const [view, setView] = useState<ViewMode>("lista");
  const [currentPage, setCurrentPage] = useState(1);

  const uniqueSorted = (values: string[]) => {
    const byLower = new Map<string, string>();
    values.forEach((value) => {
      const normalized = display(value);
      const key = normalized.toLocaleLowerCase("es");
      if (!byLower.has(key)) byLower.set(key, normalized);
    });
    return Array.from(byLower.values()).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  };

  const typeOptions = useMemo(() => ["Todos", ...uniqueSorted(items.map((item) => item.type))], [items]);
  const industryOptions = useMemo(() => ["Todos", ...uniqueSorted(items.map((item) => item.industry))], [items]);
  const regionOptions = useMemo(() => ["Todos", ...uniqueSorted(items.map((item) => item.region))], [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.industry.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q);

      const matchesType = typeFilter === "Todos" || display(item.type).toLocaleLowerCase("es") === typeFilter.toLocaleLowerCase("es");
      const matchesIndustry =
        industryFilter === "Todos" || display(item.industry).toLocaleLowerCase("es") === industryFilter.toLocaleLowerCase("es");
      const matchesRegion =
        regionFilter === "Todos" || display(item.region).toLocaleLowerCase("es") === regionFilter.toLocaleLowerCase("es");

      return matchesSearch && matchesType && matchesIndustry && matchesRegion;
    });
  }, [items, query, typeFilter, industryFilter, regionFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, typeFilter, industryFilter, regionFilter, view]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  const emptyState = (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
      0 resultados
    </div>
  );

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 lg:max-w-4xl lg:flex-row">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar institución..."
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm lg:flex-1"
            />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-3 text-sm"
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-3 text-sm"
            >
              {industryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-3 text-sm"
            >
              {regionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setView("lista")}
              className={`rounded-md px-3 py-2 text-sm ${view === "lista" ? "bg-red-50 text-red-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Lista
            </button>
            <button
              onClick={() => setView("cards")}
              className={`rounded-md px-3 py-2 text-sm ${view === "cards" ? "bg-red-50 text-red-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {paginated.length === 0 ? (
        emptyState
      ) : view === "lista" ? (
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="w-full overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nombre de institución</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tipo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Industria</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Región</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-slate-900">
                      <Link href={`/instituciones/${item.id}`} className="text-slate-900 hover:underline">
                        {display(item.name)}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{display(item.type)}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{display(item.industry)}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{display(item.region)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginated.map((item) => (
            <Link
              key={item.id}
              href={`/instituciones/${item.id}`}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-slate-900">{display(item.name)}</h3>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <div>
                  <span className="text-gray-500">Tipo:</span>{" "}
                  <span className="font-medium text-slate-900">{display(item.type)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Industria:</span>{" "}
                  <span className="font-medium text-slate-900">{display(item.industry)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Región:</span>{" "}
                  <span className="font-medium text-slate-900">{display(item.region)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}
