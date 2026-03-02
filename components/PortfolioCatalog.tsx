"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TechnologyIllustration from "./TechnologyIllustration";

type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  badges: string[];
  faculty: string;
  techId: string;
  ambito: string;
  estado: string;
};

const ITEMS_PER_PAGE = 6;

function badgeClass(badge: string) {
  const text = badge.toLowerCase();
  if (text.includes("patent") || text.includes("patentado") || text.includes("licencia")) {
    return "bg-red-50 text-red-700";
  }
  if (text.includes("desarrollo")) return "bg-yellow-50 text-yellow-700";
  if (text.includes("comercial")) return "bg-green-50 text-green-700";
  return "bg-gray-100 text-gray-800";
}

function cleanOptions(values: string[]) {
  return Array.from(new Set(values.map((v) => (v || "").trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" }),
  );
}

export default function PortfolioCatalog({ items }: { items: PortfolioItem[] }) {
  const [search, setSearch] = useState("");
  const [ambito, setAmbito] = useState("");
  const [estado, setEstado] = useState("");
  const [faculty, setFaculty] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ambitoOptions = useMemo(() => cleanOptions(items.map((i) => i.ambito)), [items]);
  const estadoOptions = useMemo(() => cleanOptions(items.map((i) => i.estado)), [items]);
  const facultyOptions = useMemo(() => cleanOptions(items.map((i) => i.faculty)), [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.techId.toLowerCase().includes(query) ||
        item.faculty.toLowerCase().includes(query);

      const matchesAmbito = !ambito || item.ambito === ambito;
      const matchesEstado = !estado || item.estado === estado;
      const matchesFaculty = !faculty || item.faculty === faculty;

      return matchesSearch && matchesAmbito && matchesEstado && matchesFaculty;
    });
  }, [items, search, ambito, estado, faculty]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, ambito, estado, faculty]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  const visiblePages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis-right", totalPages] as const;
    }

    if (currentPage >= totalPages - 3) {
      return [1, "ellipsis-left", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
    }

    return [1, "ellipsis-left", currentPage - 1, currentPage, currentPage + 1, "ellipsis-right", totalPages] as const;
  }, [currentPage, totalPages]);

  return (
    <>
      <section>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar tecnología..."
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-0">
              <select
                value={ambito}
                onChange={(e) => setAmbito(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Ámbito</option>
                {ambitoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Estado</option>
                {estadoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Facultad</option>
                {facultyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <label className="ml-2 flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="h-4 w-4 rounded" />
                Modo público
              </label>
            </div>
          </div>
        </div>
      </section>

      <section>
        {paginatedItems.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-gray-600 shadow-sm">
            No se encontraron tecnologías con los filtros seleccionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((item) => (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="mb-4 flex items-start gap-4">
                    <TechnologyIllustration
                      title={item.title}
                      description={item.description}
                      badges={item.badges}
                      className="h-10 w-10"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    {item.badges.map((badge, index) => (
                      <span
                        key={`${item.id}-${index}`}
                        className={`${badgeClass(badge)} rounded-full px-3 py-1 text-xs font-medium`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500">
                    <div>Facultad: {item.faculty || "-"}</div>
                    <div>ID: {item.techId}</div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end">
                  <Link
                    href={`/portafolio/tecnologias/${item.id}`}
                    className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                  >
                    Ver más
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>

            {visiblePages.map((pageItem, index) => {
              if (typeof pageItem !== "number") {
                return (
                  <span key={`${pageItem}-${index}`} className="px-1 text-sm text-gray-500" aria-hidden="true">
                    …
                  </span>
                );
              }

              return (
                <button
                  key={pageItem}
                  onClick={() => setCurrentPage(pageItem)}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    pageItem === currentPage
                      ? "bg-red-700 text-white"
                      : "border border-gray-200 text-gray-700"
                  }`}
                >
                  {pageItem}
                </button>
              );
            })}

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
    </>
  );
}