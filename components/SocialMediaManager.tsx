"use client";

import { useMemo, useState } from "react";
import type { Communication } from "../lib/comunicaciones";

type Props = {
  initialItems: Communication[];
};

const FIELD_ORDER: Array<keyof Communication> = [
  "COM_N",
  "ColumnVal",
  "COM_Titular",
  "COM_TipoComun",
  "COM_TipoMedio",
  "COM_Medio",
  "COM_TemaPubl",
  "COM_Fecha",
  "COM_Vocero",
  "COM_Link",
  "COM_MontoEstimado",
  "COM_AsocProd",
  "COM_NombreProdAsoc",
  "COM_Asistentes",
  "COM_Impresiones",
  "COM_Clics",
  "COM_VecesCompartido_Shared",
  "COM_LikesRecomendReacciones",
  "COM_Guardados",
  "COM_CantComentarios",
  "COM_Interaccion",
  "COM_Alcance",
  "COM_Engagement",
  "COM_Comentario",
  "COM_ThumbnailUrl",
  "COM_ThumbnailPath",
];

function labelFor(field: keyof Communication) {
  return field.replaceAll("_", " ");
}

function toText(value: unknown) {
  return String(value ?? "");
}

function parseDate(value: string): number {
  const raw = String(value || "").trim();
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return 0;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return 0;
  return date.getTime();
}

function toCsv(items: Communication[]) {
  const headers = FIELD_ORDER.map((field) => String(field));
  const escapeValue = (value: unknown) => {
    const text = String(value ?? "");
    if (/["\n;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  const lines = [headers.join(";")];
  for (const item of items) {
    lines.push(FIELD_ORDER.map((field) => escapeValue(item[field])).join(";"));
  }
  return `\uFEFF${lines.join("\n")}`;
}

function emptyRow(nextId: number): Communication {
  return {
    COM_N: nextId,
    ColumnVal: "",
    COM_Titular: "",
    COM_TipoComun: "Post/Publicación",
    COM_TipoMedio: "RRSS",
    COM_Medio: "",
    COM_TemaPubl: "",
    COM_Fecha: "",
    COM_Vocero: "",
    COM_Link: "",
    COM_MontoEstimado: "",
    COM_AsocProd: "",
    COM_NombreProdAsoc: "",
    COM_Asistentes: "",
    COM_Impresiones: "",
    COM_Clics: "",
    COM_VecesCompartido_Shared: "",
    COM_LikesRecomendReacciones: "",
    COM_Guardados: "",
    COM_CantComentarios: "",
    COM_Interaccion: "",
    COM_Alcance: "",
    COM_Engagement: "",
    COM_Comentario: "",
    COM_ThumbnailUrl: "",
    COM_ThumbnailPath: "",
  };
}

export default function SocialMediaManager({ initialItems }: Props) {
  const [items, setItems] = useState<Communication[]>(initialItems);
  const [query, setQuery] = useState("");
  const [medio, setMedio] = useState("all");
  const [tipo, setTipo] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const medios = useMemo(() => {
    const values = new Set<string>();
    items.forEach((item) => {
      const m = toText(item.COM_Medio).trim();
      if (m) values.add(m);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const tipos = useMemo(() => {
    const values = new Set<string>();
    items.forEach((item) => {
      const t = toText(item.COM_TipoComun).trim();
      if (t) values.add(t);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredIndexes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (medio !== "all" && toText(item.COM_Medio) !== medio) return false;
        if (tipo !== "all" && toText(item.COM_TipoComun) !== tipo) return false;
        if (!q) return true;
        const haystack = [item.COM_Titular, item.COM_TemaPubl, item.COM_Vocero, item.COM_Medio, item.COM_Comentario]
          .map((value) => toText(value).toLowerCase())
          .join(" ");
        return haystack.includes(q);
      })
      .sort((a, b) => parseDate(toText(b.item.COM_Fecha)) - parseDate(toText(a.item.COM_Fecha)))
      .map((entry) => entry.index);
  }, [items, query, medio, tipo]);

  const selectedItem = items[selectedIndex];
  const editingItem = editingIndex !== null ? items[editingIndex] : null;

  const updateField = (field: keyof Communication, value: string) => {
    if (editingIndex === null) return;
    setItems((prev) => prev.map((item, index) => (index === editingIndex ? { ...item, [field]: value } : item)));
  };

  const addRow = () => {
    const maxId = items.reduce((acc, item) => {
      const num = Number(item.COM_N);
      if (!Number.isFinite(num)) return acc;
      return Math.max(acc, num);
    }, 0);
    const next = emptyRow(maxId + 1);
    setItems((prev) => [...prev, next]);
    setSelectedIndex(items.length);
  };

  const openEditor = () => {
    if (!selectedItem) return;
    setEditingIndex(selectedIndex);
  };

  const closeEditor = () => {
    setEditingIndex(null);
  };

  const deleteCurrentPublication = () => {
    if (editingIndex === null) return;
    const confirmed = window.confirm("¿Eliminar esta publicación?");
    if (!confirmed) return;

    setItems((prev) => prev.filter((_, index) => index !== editingIndex));
    setSelectedIndex((prev) => {
      if (editingIndex === 0) return 0;
      if (prev >= editingIndex) return Math.max(0, editingIndex - 1);
      return prev;
    });
    setEditingIndex(null);
  };

  const exportData = (scope: "all" | "filtered") => {
    const exportItems = scope === "filtered" ? filteredIndexes.map((idx) => items[idx]).filter(Boolean) : items;
    const content = toCsv(exportItems);
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = scope === "filtered" ? "rrss_filtradas.csv" : "rrss_completo.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar titular, tema, vocero..."
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
          />
          <select value={medio} onChange={(e) => setMedio(e.target.value)} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
            <option value="all">Todos los medios</option>
            {medios.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
            <option value="all">Todos los tipos</option>
            {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <button onClick={addRow} className="rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800">Agregar publicación</button>
            <button
              onClick={openEditor}
              disabled={!selectedItem}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ✏️ Editar seleccionada
            </button>
            <button onClick={() => exportData("filtered")} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Exportar filtradas</button>
            <button onClick={() => exportData("all")} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Exportar todo</button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">Mostrando {filteredIndexes.length} de {items.length} publicaciones RRSS</div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white">
          <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-slate-900">Listado</div>
          <div className="max-h-[560px] overflow-auto">
            {filteredIndexes.map((index) => {
              const item = items[index];
              const selected = index === selectedIndex;
              return (
                <button
                  key={`${toText(item.COM_N)}-${index}`}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full border-b border-gray-100 px-4 py-3 text-left ${selected ? "bg-red-50" : "hover:bg-gray-50"}`}
                >
                  <div className="text-xs text-gray-500">#{toText(item.COM_N)} · {toText(item.COM_Fecha) || "Sin fecha"}</div>
                  <div className="mt-1 text-sm font-medium text-slate-900 line-clamp-2">{toText(item.COM_Titular) || "(Sin titular)"}</div>
                  <div className="mt-1 text-xs text-gray-600">{toText(item.COM_Medio)} · {toText(item.COM_TipoComun)}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Editor de publicación</h3>
                <p className="text-xs text-gray-500">ID: {toText(editingItem.COM_N)} · {toText(editingItem.COM_Medio)} · {toText(editingItem.COM_Fecha)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={deleteCurrentPublication}
                  className="rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
                >
                  Eliminar publicación
                </button>
                <button onClick={closeEditor} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  Cerrar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
              {FIELD_ORDER.map((field) => {
                const value = toText(editingItem[field]);
                const multiline = field === "COM_Titular" || field === "COM_Comentario" || field === "ColumnVal";
                return (
                  <div key={String(field)} className={multiline ? "md:col-span-2" : ""}>
                    <label className="mb-1 block text-xs font-medium text-gray-600">{labelFor(field)}</label>
                    {multiline ? (
                      <textarea
                        value={value}
                        onChange={(e) => updateField(field, e.target.value)}
                        rows={field === "COM_Comentario" ? 4 : 3}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      />
                    ) : (
                      <input
                        value={value}
                        onChange={(e) => updateField(field, e.target.value)}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
