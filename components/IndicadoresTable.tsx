"use client";

import React, { useMemo, useState } from "react";
import type { Indicator } from "../lib/indicadores";

type Props = { allRows: Indicator[] };

function parseNumeric(s?: string): number | null {
  if (!s) return null;
  // extract first number-like token
  const m = s.match(/-?[\d]{1,3}([.,\d]*)?/);
  if (!m) return null;
  const token = m[0].replace(/\./g, "").replace(/,/g, ".");
  const n = parseFloat(token);
  return Number.isFinite(n) ? n : null;
}

export default function IndicadoresTable({ allRows }: Props) {
  const ITEMS_PER_PAGE = 12;

  const [qId, setQId] = useState("");
  const [qNombre, setQNombre] = useState("");
  const [categoria, setCategoria] = useState("All");
  const [unidad, setUnidad] = useState("All");
  const [prioridad, setPrioridad] = useState("All");
  const [responsable, setResponsable] = useState("All");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const [metaMin, setMetaMin] = useState("");
  const [metaMax, setMetaMax] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const categorias = useMemo(() => {
    const s = new Set<string>();
    allRows.forEach((r) => r.categoria && s.add(r.categoria));
    return Array.from(s).sort();
  }, [allRows]);

  const unidades = useMemo(() => {
    const s = new Set<string>();
    allRows.forEach((r) => r.unidad && s.add(r.unidad));
    return Array.from(s).sort();
  }, [allRows]);

  const responsables = useMemo(() => {
    const s = new Set<string>();
    allRows.forEach((r) => r.responsable && s.add(r.responsable));
    return Array.from(s).sort();
  }, [allRows]);

  const clear = () => {
    setQId("");
    setQNombre("");
    setCategoria("All");
    setUnidad("All");
    setPrioridad("All");
    setResponsable("All");
    setValorMin("");
    setValorMax("");
    setMetaMin("");
    setMetaMax("");
  };

  const filtered = useMemo(() => {
    const vMin = valorMin === "" ? null : Number(valorMin);
    const vMax = valorMax === "" ? null : Number(valorMax);
    const mMin = metaMin === "" ? null : Number(metaMin);
    const mMax = metaMax === "" ? null : Number(metaMax);

    return allRows.filter((r) => {
      if (qId && !String(r.id).toLowerCase().includes(qId.toLowerCase())) return false;
      if (qNombre && !String(r.nombre_indicador).toLowerCase().includes(qNombre.toLowerCase())) return false;
      if (categoria !== "All" && r.categoria !== categoria) return false;
      if (unidad !== "All" && r.unidad !== unidad) return false;
      if (prioridad !== "All" && String((r.prioridad || "").toLowerCase()) !== prioridad) return false;
      if (responsable !== "All" && r.responsable !== responsable) return false;

      // numeric valor_2025
      if (vMin !== null || vMax !== null) {
        const n = parseNumeric(r.valor_2025);
        if (n === null) return false;
        if (vMin !== null && n < vMin) return false;
        if (vMax !== null && n > vMax) return false;
      }

      // numeric meta_2025
      if (mMin !== null || mMax !== null) {
        const n = parseNumeric(r.meta_2025);
        if (n === null) return false;
        if (mMin !== null && n < mMin) return false;
        if (mMax !== null && n > mMax) return false;
      }

      return true;
    });
  }, [allRows, qId, qNombre, categoria, unidad, prioridad, responsable, valorMin, valorMax, metaMin, metaMax]);

  const ordered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aNum = Number.parseInt(String(a.id), 10);
      const bNum = Number.parseInt(String(b.id), 10);

      if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
      if (Number.isFinite(aNum)) return -1;
      if (Number.isFinite(bNum)) return 1;
      return String(a.id).localeCompare(String(b.id), "es", { numeric: true, sensitivity: "base" });
    });
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(ordered.length / ITEMS_PER_PAGE));

  React.useEffect(() => {
    setCurrentPage(1);
  }, [qId, qNombre, categoria, unidad, prioridad, responsable, valorMin, valorMax, metaMin, metaMax]);

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRows = ordered.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  const exportCsv = () => {
    const headers = [
      "id",
      "nombre_indicador",
      "categoria",
      "valor_2025",
      "meta_2025",
      "unidad",
      "prioridad",
      "responsable",
    ];

    const escapeValue = (value: unknown) => {
      const text = String(value ?? "");
      if (/["\n,;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
      return text;
    };

    const lines = [headers.join(",")];
    ordered.forEach((row) => {
      lines.push(
        [
          row.id,
          row.nombre_indicador,
          row.categoria,
          row.valor_2025,
          row.meta_2025,
          row.unidad,
          row.prioridad,
          row.responsable,
        ]
          .map((value) => escapeValue(value))
          .join(","),
      );
    });

    const csvContent = `\uFEFF${lines.join("\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "indicadores_filtrados.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input value={qId} onChange={(e) => setQId(e.target.value)} placeholder="ID" className="w-full rounded-md border px-3 py-2 text-sm" />
          <input value={qNombre} onChange={(e) => setQNombre(e.target.value)} placeholder="Indicador" className="w-full rounded-md border px-3 py-2 text-sm" />

          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="All">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input value={valorMin} onChange={(e) => setValorMin(e.target.value)} placeholder="Valor min" className="w-1/2 rounded-md border px-3 py-2 text-sm" />
            <input value={valorMax} onChange={(e) => setValorMax(e.target.value)} placeholder="Valor max" className="w-1/2 rounded-md border px-3 py-2 text-sm" />
          </div>

          <div className="flex gap-2">
            <input value={metaMin} onChange={(e) => setMetaMin(e.target.value)} placeholder="Meta min" className="w-1/2 rounded-md border px-3 py-2 text-sm" />
            <input value={metaMax} onChange={(e) => setMetaMax(e.target.value)} placeholder="Meta max" className="w-1/2 rounded-md border px-3 py-2 text-sm" />
          </div>

          <select value={unidad} onChange={(e) => setUnidad(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="All">Todas las unidades</option>
            {unidades.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="All">Todas las prioridades</option>
            <option value="alta">alta</option>
            <option value="media">media</option>
            <option value="baja">baja</option>
          </select>

          <div>
            <div className="mb-1 text-xs text-gray-500">Responsable</div>
            <select value={responsable} onChange={(e) => setResponsable(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
              <option value="All">Todos los responsables</option>
              {responsables.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <button onClick={exportCsv} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Exportar CSV
          </button>
          <button onClick={clear} className="rounded-md bg-gray-100 px-3 py-2 text-sm">Limpiar filtros</button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Indicador</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Categoría</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Valor 2025</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Meta 2025</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unidad</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Prioridad</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRows.map((r, idx) => (
                <tr key={r.id ?? `${r.nombre_indicador}-${idx}`} className="odd:bg-white even:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{r.id}</td>
                  <td className="px-4 py-2 text-sm text-slate-900">{r.nombre_indicador}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{r.categoria}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{r.valor_2025}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{r.meta_2025}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{r.unidad}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{r.prioridad}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{r.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`rounded-lg px-3 py-2 text-sm ${
                  pageNumber === currentPage ? "bg-red-700 text-white" : "border border-gray-200 text-gray-700"
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-500">Mostrando {ordered.length} de {allRows.length} indicadores</div>
      </div>
    </div>
  );
}
