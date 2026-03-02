"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ProjectItem = {
  id: string;
  title: string;
  disciplinaPrincipal: string;
  investigador: string;
  adjudicado: boolean;
  estadoPostulacion: "Adjudicado" | "Postulado no adjudicado";
};

type ViewMode = "lista" | "tarjetas";

function display(value: string) {
  const text = String(value || "").trim();
  return text ? text : "-";
}

function displayEstado(estado: ProjectItem["estadoPostulacion"]) {
  return estado === "Postulado no adjudicado" ? "Postulado" : estado;
}

export default function ProjectsCatalog({ items }: { items: ProjectItem[] }) {
  const [query, setQuery] = useState("");
  const [investigadorFilter, setInvestigadorFilter] = useState("Todos");
  const [disciplinaFilter, setDisciplinaFilter] = useState("Todos");
  const [adjudicacionFilter, setAdjudicacionFilter] = useState("Todos");
  const [view, setView] = useState<ViewMode>("lista");
  const [currentPage, setCurrentPage] = useState(1);

  const uniqueSorted = (values: string[]) => {
    const byLower = new Map<string, string>();
    values.forEach((value) => {
      const cleaned = display(value);
      const key = cleaned.toLocaleLowerCase("es");
      if (!byLower.has(key)) byLower.set(key, cleaned);
    });
    return Array.from(byLower.values()).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  };

  const investigadorOptions = useMemo(
    () => ["Todos", ...uniqueSorted(items.map((item) => item.investigador))],
    [items],
  );

  const disciplinaOptions = useMemo(
    () => ["Todos", ...uniqueSorted(items.map((item) => item.disciplinaPrincipal))],
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.disciplinaPrincipal.toLowerCase().includes(q) ||
        item.investigador.toLowerCase().includes(q);

      const matchesInvestigador =
        investigadorFilter === "Todos" ||
        display(item.investigador).toLocaleLowerCase("es") === investigadorFilter.toLocaleLowerCase("es");

      const matchesDisciplina =
        disciplinaFilter === "Todos" ||
        display(item.disciplinaPrincipal).toLocaleLowerCase("es") === disciplinaFilter.toLocaleLowerCase("es");

      const matchesAdjudicacion =
        adjudicacionFilter === "Todos" ||
        (adjudicacionFilter === "Adjudicados" && item.adjudicado) ||
        (adjudicacionFilter === "No adjudicados" && !item.adjudicado);

      return matchesSearch && matchesInvestigador && matchesDisciplina && matchesAdjudicacion;
    });
  }, [items, query, investigadorFilter, disciplinaFilter, adjudicacionFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, investigadorFilter, disciplinaFilter, adjudicacionFilter, view]);

  const itemsPerPage = view === "tarjetas" ? 6 : 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pageStart = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(pageStart, pageStart + itemsPerPage);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-3 md:max-w-3xl md:flex-row">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar proyecto..."
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm md:flex-1"
            />

            <select
              value={investigadorFilter}
              onChange={(e) => setInvestigadorFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-3 text-sm"
            >
              {investigadorOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={disciplinaFilter}
              onChange={(e) => setDisciplinaFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-3 text-sm"
            >
              {disciplinaOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={adjudicacionFilter}
              onChange={(e) => setAdjudicacionFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-3 text-sm"
            >
              <option>Todos</option>
              <option>Adjudicados</option>
              <option>No adjudicados</option>
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
              onClick={() => setView("tarjetas")}
              className={`rounded-md px-3 py-2 text-sm ${view === "tarjetas" ? "bg-red-50 text-red-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Tarjetas
            </button>
          </div>
        </div>
      </div>

      {view === "lista" ? (
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="w-full overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nombre del proyecto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Disciplina principal</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Investigador</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((item) => (
                  <tr key={item.id} className="odd:bg-white even:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-slate-900">
                      <Link href={`/portafolio/proyectos/${item.id}`} className="hover:underline text-slate-900">
                        {display(item.title)}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{display(item.disciplinaPrincipal)}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{display(item.investigador)}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.adjudicado ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {displayEstado(item.estadoPostulacion)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paginated.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-500">No se encontraron proyectos.</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginated.map((item) => (
            <Link
              key={item.id}
              href={`/portafolio/proyectos/${item.id}`}
              className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition hover:shadow-md"
            >
              <div className="mb-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.adjudicado ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {displayEstado(item.estadoPostulacion)}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{display(item.title)}</h3>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <div>
                  <span className="text-gray-500">Disciplina principal:</span>{" "}
                  <span className="font-medium text-slate-900">{display(item.disciplinaPrincipal)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Investigador:</span>{" "}
                  <span className="font-medium text-slate-900">{display(item.investigador)}</span>
                </div>
              </div>
            </Link>
          ))}

          {paginated.length === 0 && (
            <div className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm border border-gray-100">
              No se encontraron proyectos.
            </div>
          )}
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
