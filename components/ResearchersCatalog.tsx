"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ResearcherItem = {
  id: string;
  name: string;
  faculty: string;
  unit: string;
  email: string;
  gender: string;
};

const ITEMS_PER_PAGE = 12;

function normalizeSearchText(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildNameAliases(name: string): string[] {
  const normalized = normalizeSearchText(name);
  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length === 0) return [];

  const aliases = new Set<string>();
  aliases.add(normalized);

  if (parts.length >= 2) aliases.add(`${parts[0]} ${parts[1]}`);
  if (parts.length >= 3) aliases.add(`${parts[0]} ${parts[2]}`);
  if (parts.length >= 4) aliases.add(`${parts[0]} ${parts[3]}`);
  if (parts.length >= 2) aliases.add(`${parts[0]} ${parts[parts.length - 1]}`);

  return Array.from(aliases);
}

export default function ResearchersCatalog({ items }: { items: ResearcherItem[] }) {
  const [query, setQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("Todas las facultades");
  const [unitFilter, setUnitFilter] = useState("Todas las unidades");
  const [genderFilter, setGenderFilter] = useState("Todos");
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
    const q = normalizeSearchText(query);
    return items.filter((item) => {
      const searchableFields = [
        ...buildNameAliases(item.name),
        normalizeSearchText(item.unit),
        normalizeSearchText(item.faculty),
        normalizeSearchText(item.email),
      ];

      const matchesSearch = !q || searchableFields.some((field) => field.includes(q));

      const matchesFaculty =
        facultyFilter === "Todas las facultades" ||
        item.faculty.toLocaleLowerCase("es") === facultyFilter.toLocaleLowerCase("es");

      const matchesUnit =
        unitFilter === "Todas las unidades" ||
        item.unit.toLocaleLowerCase("es") === unitFilter.toLocaleLowerCase("es");

      const normalizedGender = item.gender.toLocaleLowerCase("es");
      const matchesGender =
        genderFilter === "Todos" ||
        (genderFilter === "Hombre" && normalizedGender.includes("mascul")) ||
        (genderFilter === "Mujer" && normalizedGender.includes("femen"));

      return matchesSearch && matchesFaculty && matchesUnit && matchesGender;
    });
  }, [items, query, facultyFilter, unitFilter, genderFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar investigador..."
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm md:flex-1"
          />

          <select
            value={facultyFilter}
            onChange={(e) => {
              setFacultyFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filtrar por facultad"
            title="Filtrar por facultad"
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
            onChange={(e) => {
              setUnitFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filtrar por unidad"
            title="Filtrar por unidad"
            className="rounded-lg border border-gray-200 px-3 py-3 text-sm"
          >
            {unitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filtrar por género"
            title="Filtrar por género"
            className="rounded-lg border border-gray-200 px-3 py-3 text-sm"
          >
            <option value="Todos">Todos</option>
            <option value="Hombre">Hombre</option>
            <option value="Mujer">Mujer</option>
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
          <span className="text-sm text-gray-600">Página {safeCurrentPage} de {totalPages}</span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, Math.min(prev, totalPages) - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, Math.min(prev, totalPages) + 1))}
              disabled={safeCurrentPage === totalPages}
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
