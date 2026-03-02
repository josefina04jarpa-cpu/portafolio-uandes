"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ResearcherItem = {
  id: string;
  name: string;
  faculty: string;
  unit: string;
  email: string;
};

const ITEMS_PER_PAGE = 12;

export default function ResearchersCatalog({ items }: { items: ResearcherItem[] }) {
  const [query, setQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("Todas las facultades");
  const [unitFilter, setUnitFilter] = useState("Todas las unidades");
  const [currentPage, setCurrentPage] = useState(1);

  const dedupeSorted = (values: string[]) => {
    const map = new Map<string, string>();
    values.forEach((value) => {
      const normalized = value.trim() || "Sin información";
      const key = normalized.toLocaleLowerCase("es");
      if (!map.has(key)) map.set(key, normalized);
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  };

  const facultyOptions = useMemo(
    () => ["Todas las facultades", ...dedupeSorted(items.map((item) => item.faculty || "Sin información"))],
    [items],
  );

  const unitOptions = useMemo(
    () => ["Todas las unidades", ...dedupeSorted(items.map((item) => item.unit || "Sin información"))],
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q) ||
        item.faculty.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q);

      const matchesFaculty =
        facultyFilter === "Todas las facultades" ||
        item.faculty.toLocaleLowerCase("es") === facultyFilter.toLocaleLowerCase("es");

      const matchesUnit =
        unitFilter === "Todas las unidades" ||
        item.unit.toLocaleLowerCase("es") === unitFilter.toLocaleLowerCase("es");

      return matchesSearch && matchesFaculty && matchesUnit;
    });
  }, [items, query, facultyFilter, unitFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, facultyFilter, unitFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar investigador..."
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm md:flex-1"
          />

          <select
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-3 text-sm"
          >
            {facultyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-3 text-sm"
          >
            {unitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nombre investigador</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Facultad o unidad</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Correo electrónico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((item) => (
                <tr key={`${item.id}-${item.email}`} className="odd:bg-white even:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-slate-900">
                    <Link href={`/portafolio/investigadores/${item.id}`} className="hover:underline text-slate-900">
                      {item.name || "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {item.unit !== "Sin información" ? `${item.faculty} · ${item.unit}` : item.faculty || "-"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {item.email ? (
                      <a href={`mailto:${item.email}`} className="hover:underline">
                        {item.email}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginated.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">No se encontraron investigadores.</div>
        )}

        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
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
      </div>
    </section>
  );
}
