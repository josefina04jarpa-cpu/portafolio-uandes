"use client";

import type { LegalPI } from "../lib/legal_pi";

type Props = {
  items: LegalPI[];
};

function display(value: unknown): string {
  const text = String(value ?? "").trim();
  return text ? text : "—";
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function isInTramiteLocal(item: LegalPI): boolean {
  const estado = normalizeText(item.LGL_Estado);
  const activo = normalizeText(item.LGL_Activo);

  if (!estado) return false;

  const blockedTerms = ["conced", "conces", "registr", "otorg", "grant", "granted", "issued"];
  const hasConcedidoTerm = blockedTerms.some((term) => estado.includes(term));

  return !hasConcedidoTerm && activo !== "no";
}

export default function LegalPITab({ items }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-600">
        —
      </div>
    );
  }

  const inTramiteCount = items.filter((item) => isInTramiteLocal(item)).length;
  const closedCount = items.length - inTramiteCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
          Total: {items.length}
        </span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          En trámite: {inTramiteCount}
        </span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          Cerradas: {closedCount}
        </span>
      </div>

      {items.map((item, index) => {
        const title = display(item.LGL_NombrePI) === "—" ? "Registro PI" : item.LGL_NombrePI;
        const tramite = isInTramiteLocal(item);
        const hasLink = String(item.LGL_Link || "").trim() !== "";

        return (
          <article key={`${item.LGL_N || "pi"}-${index}`} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-xs text-gray-500">{display(item.LGL_NombreProdAsoc)}</p>
              </div>

              <button
                type="button"
                disabled
                className={`shrink-0 cursor-default rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  tramite
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {display(item.LGL_Estado)}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <div className="text-xs text-gray-500">Categoría</div>
                <div className="mt-1 font-medium text-slate-900">{display(item.LGL_CategPI)}</div>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <div className="text-xs text-gray-500">N° Solicitud</div>
                <div className="mt-1 font-medium text-slate-900">{display(item.LGL_NumSolicitud)}</div>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <div className="text-xs text-gray-500">País</div>
                <div className="mt-1 font-medium text-slate-900">{display(item.LGL_Pais)}</div>
              </div>
            </div>

            {hasLink && (
              <div className="mt-3">
                <a
                  href={item.LGL_Link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
                >
                  Abrir
                </a>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
