"use client";

import { useMemo, useState } from "react";
import type { MetaRectoria } from "../lib/metasRectoria";

type Props = {
  rows: MetaRectoria[];
  year?: 2024 | 2025;
};

export default function MetasRectoriaTable({ rows, year = 2025 }: Props) {
  const [search, setSearch] = useState("");
  const [ambito, setAmbito] = useState("All");
  const [responsable, setResponsable] = useState("All");
  const [enfoque, setEnfoque] = useState("All");
  const [dimension, setDimension] = useState("All");
  const [cumplimiento2025, setCumplimiento2025] = useState("All");

  const ambitos = useMemo(() => {
    const values = new Set<string>();
    rows.forEach((row) => row.ambito && values.add(row.ambito));
    return Array.from(values).sort();
  }, [rows]);

  const responsables = useMemo(() => {
    const values = new Set<string>();
    rows.forEach((row) => row.responsable && values.add(row.responsable));
    return Array.from(values).sort();
  }, [rows]);

  const enfoques = useMemo(() => {
    const values = new Set<string>();
    rows.forEach((row) => row.enfoque && values.add(row.enfoque));
    return Array.from(values).sort();
  }, [rows]);

  const dimensiones = useMemo(() => {
    const values = new Set<string>();
    rows.forEach((row) => row.dimension && values.add(row.dimension));
    return Array.from(values).sort();
  }, [rows]);

  const cumplimientosAnuales = useMemo(() => {
    const values = new Set<string>();
    rows.forEach((row) => {
      const value = year === 2024 ? row.cumplimiento2024 : row.cumplimiento2025;
      if (value) values.add(value);
    });
    return Array.from(values).sort();
  }, [rows, year]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (ambito !== "All" && row.ambito !== ambito) return false;
      if (responsable !== "All" && row.responsable !== responsable) return false;
      if (enfoque !== "All" && row.enfoque !== enfoque) return false;
      if (dimension !== "All" && row.dimension !== dimension) return false;
      const annualCumplimiento = year === 2024 ? row.cumplimiento2024 : row.cumplimiento2025;
      if (cumplimiento2025 !== "All" && annualCumplimiento !== cumplimiento2025) return false;

      if (!search) return true;
      const q = search.toLowerCase();
      return (
        row.concepto.toLowerCase().includes(q) ||
        row.ambito.toLowerCase().includes(q) ||
        row.responsable.toLowerCase().includes(q) ||
        row.enfoque.toLowerCase().includes(q) ||
        row.dimension.toLowerCase().includes(q)
      );
    });
  }, [rows, ambito, responsable, enfoque, dimension, cumplimiento2025, search, year]);

  const getMetaValue = (row: MetaRectoria) => (year === 2024 ? row.meta2024 : row.meta2025);
  const getRealValue = (row: MetaRectoria) => (year === 2024 ? row.real2024 : row.real2025);
  const getCumplimientoValue = (row: MetaRectoria) => (year === 2024 ? row.cumplimiento2024 : row.cumplimiento2025);

  const clearFilters = () => {
    setSearch("");
    setAmbito("All");
    setResponsable("All");
    setEnfoque("All");
    setDimension("All");
    setCumplimiento2025("All");
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-slate-900">Metas de Rectoría</h2>
        <p className="mt-1 text-sm text-gray-500">Información pública de metas e indicadores reportados a Rectoría ({year}).</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por indicador, ámbito o responsable"
            className="md:col-span-2 xl:col-span-3 rounded-md border px-3 py-2 text-sm"
          />

          <select
            value={ambito}
            onChange={(event) => setAmbito(event.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="All">Todos los ámbitos</option>
            {ambitos.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={responsable}
            onChange={(event) => setResponsable(event.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="All">Todos los responsables</option>
            {responsables.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={enfoque}
            onChange={(event) => setEnfoque(event.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="All">Todos los enfoques</option>
            {enfoques.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={dimension}
            onChange={(event) => setDimension(event.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="All">Todos los tipos de ámbito</option>
            {dimensiones.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={cumplimiento2025}
            onChange={(event) => setCumplimiento2025(event.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="All">Cumplimiento {year} (todos)</option>
            {cumplimientosAnuales.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ámbito</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Indicador</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Responsable</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Meta {year}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Real {year}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cumplimiento {year}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Enfoque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((row) => (
                <tr key={`${row.ambito}-${row.concepto}`} className="odd:bg-white even:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{row.ambito}</td>
                  <td className="px-4 py-2 text-sm text-slate-900">{row.concepto}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{row.responsable}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{getMetaValue(row) || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{getRealValue(row) || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{getCumplimientoValue(row) || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{row.enfoque || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-sm text-gray-500">Mostrando {filteredRows.length} de {rows.length} metas.</div>
      </div>
    </section>
  );
}
