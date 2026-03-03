"use client";

import React, { useState } from "react";
import TimelineProteccion from "./TimelineProteccion";
import type { LegalPI } from "../lib/legal";
import ExportSummaryPdfButton from "./ExportSummaryPdfButton";

type Props = { tech: Record<string, unknown>; summaryDescription?: string; legalItems?: LegalPI[] };
type ExportSheetData = {
  resumen: string;
  nombreProyecto: string;
  idProyecto: string;
  directorProyecto: string;
  investigadoresEquipo: string;
  trlSnapshot?: {
    year: number;
    crl: number | null;
    trl: number | null;
    brl: number | null;
    iprl: number | null;
    tmrl: number | null;
    frl: number | null;
  };
};

type TabsProps = Props & { exportSheetData?: ExportSheetData };
type IpData = {
  nombre?: unknown;
  tipo?: unknown;
  numeroSolicitud?: unknown;
  fechaSolicitud?: unknown;
  numeroRegistro?: unknown;
  fechaRegistro?: unknown;
  vigenciaHasta?: unknown;
  fechaTerminoProteccion?: unknown;
  pais?: unknown;
};

export default function TechnologyTabs({ tech, summaryDescription, legalItems = [], exportSheetData }: TabsProps) {
  const tabs = ["Resumen", "Detalles y potencial", "Propiedad intelectual", "Notas internas"];
  const [active, setActive] = useState(0);
  const modoPublico = String(tech.TECN_Activo || tech.modoPublico || "Si").toLowerCase() === "si";

  const displayValue = (value: unknown) => {
    const text = String(value ?? "").trim();
    if (!text) return "-";
    const normalized = text.toLowerCase();
    if (normalized === "n/a" || normalized === "na" || normalized === "-" || normalized === "null") return "-";
    return text;
  };

  const formatDateValue = (value: unknown) => {
    const text = displayValue(value);
    if (text === "-") return "-";

    const asNumber = Number(text);
    if (Number.isFinite(asNumber) && asNumber > 30000 && asNumber < 60000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + asNumber * 24 * 60 * 60 * 1000);
      return date.toLocaleDateString("es-CL");
    }

    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}-${m}-${y}`;
    }

    return text;
  };

  const ipRecord: Record<string, unknown> =
    typeof tech.ip === "object" && tech.ip !== null ? (tech.ip as Record<string, unknown>) : {};
  const primaryLegal = legalItems[0];

  const effectiveIp: IpData = primaryLegal
    ? {
        nombre: primaryLegal.LGL_NombrePI,
        tipo: [primaryLegal.LGL_CategPI, primaryLegal.LGL_SubcatPI].filter(Boolean).join(" · "),
        numeroSolicitud: primaryLegal.LGL_NumSolicitud,
        fechaSolicitud: primaryLegal.LGL_FechaSolicitud,
        numeroRegistro: primaryLegal.LGL_NumeroRegistro,
        fechaRegistro: primaryLegal.LGL_FechaConcesion,
        vigenciaHasta: primaryLegal.LGL_MarcaRenov || primaryLegal.LGL_FechaRenovacion,
        fechaTerminoProteccion: primaryLegal.LGL_FechaExpiracion,
        pais: primaryLegal.LGL_Pais,
      }
    : {
        nombre: ipRecord.nombre,
        tipo: ipRecord.tipo,
        numeroSolicitud: ipRecord.numeroSolicitud,
        fechaSolicitud: ipRecord.fechaSolicitud,
        numeroRegistro: ipRecord.numeroRegistro,
        fechaRegistro: ipRecord.fechaRegistro,
        vigenciaHasta: ipRecord.vigenciaHasta,
        fechaTerminoProteccion: ipRecord.fechaTerminoProteccion,
        pais: ipRecord.pais,
      };

  const hasRegistro = displayValue(effectiveIp.numeroRegistro) !== "-";
  const summaryTargetId = `technology-summary-export-${String(tech.id || "detalle")}`;
  const detailText = displayValue(tech.TECN_Comentario || tech.longDescription || "Sin detalles adicionales.");
  const internalNotesText = displayValue(tech.internal_notes || "Sin notas internas.");

  const renderContent = () => {
    switch (active) {
      case 0:
        return (
          <div id={summaryTargetId} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">Resumen</h3>
              <ExportSummaryPdfButton
                targetId={summaryTargetId}
                fileName={`ficha-tecnologia-${String(tech.id || "detalle")}.pdf`}
                sheetData={exportSheetData}
              />
            </div>
            <div className="text-sm text-gray-700">{displayValue(summaryDescription || tech.PROY_Descripcion || tech.description || 'Sin resumen disponible.')}</div>
          </div>
        );
      case 1:
        return (<div className="text-sm text-gray-700">{detailText}</div>);
      case 2:
        return (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-base">🔒</div>
                  <h3 className="text-lg font-semibold text-slate-900">Propiedad intelectual</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${hasRegistro ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {primaryLegal ? displayValue(primaryLegal.LGL_Estado) : hasRegistro ? "Registrada" : "En trámite"}
                </span>
              </div>

              {legalItems.length === 0 ? (
                <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    { label: "Nombre de la propiedad intelectual", value: effectiveIp.nombre },
                    { label: "Tipo de propiedad intelectual", value: effectiveIp.tipo },
                    { label: "Número de solicitud", value: effectiveIp.numeroSolicitud },
                    { label: "Fecha de solicitud", value: formatDateValue(effectiveIp.fechaSolicitud) },
                    { label: "Número de registro", value: effectiveIp.numeroRegistro },
                    { label: "Fecha de registro", value: formatDateValue(effectiveIp.fechaRegistro) },
                    { label: "Vigencia / “Hasta cuándo está vigente”", value: formatDateValue(effectiveIp.vigenciaHasta) },
                    { label: "Fecha de término de la protección", value: formatDateValue(effectiveIp.fechaTerminoProteccion) },
                    { label: "País donde se registró", value: effectiveIp.pais },
                  ].map((field) => (
                    <div key={field.label} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                      <dt className="text-sm text-gray-500">{field.label}</dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900">{displayValue(field.value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="space-y-5">
                  {legalItems.map((legal, idx) => {
                    const fields = [
                      { label: "Nombre de la propiedad intelectual", value: legal.LGL_NombrePI },
                      { label: "Tipo de propiedad intelectual", value: [legal.LGL_CategPI, legal.LGL_SubcatPI].filter(Boolean).join(" · ") },
                      { label: "Número de solicitud", value: legal.LGL_NumSolicitud },
                      { label: "Fecha de solicitud", value: formatDateValue(legal.LGL_FechaSolicitud) },
                      { label: "Número de registro", value: legal.LGL_NumeroRegistro },
                      { label: "Fecha de registro", value: formatDateValue(legal.LGL_FechaConcesion) },
                      { label: "Vigencia / “Hasta cuándo está vigente”", value: formatDateValue(legal.LGL_MarcaRenov || legal.LGL_FechaRenovacion) },
                      { label: "Fecha de término de la protección", value: formatDateValue(legal.LGL_FechaExpiracion) },
                      { label: "País donde se registró", value: legal.LGL_Pais },
                      { label: "Clase de marca", value: legal.LGL_ClaseMarca },
                      { label: "IPC", value: legal.LGL_IPC },
                      { label: "CPC", value: legal.LGL_CPC },
                      { label: "Código jurídico", value: legal.LGL_CodigoJuridico },
                      { label: "Estudio jurídico", value: legal.LGL_EstudioJuridico },
                    ];

                    return (
                      <section key={`${legal.LGL_N || "legal"}-${idx}`} className="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
                        <h4 className="mb-3 text-sm font-semibold text-slate-900">
                          {displayValue(legal.LGL_NombrePI) !== "-" ? displayValue(legal.LGL_NombrePI) : `Registro PI ${idx + 1}`}
                        </h4>
                        <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {fields.map((field) => (
                            <div key={`${legal.LGL_N || "legal"}-${field.label}`} className="rounded-xl border border-gray-100 bg-white p-4">
                              <dt className="text-sm text-gray-500">{field.label}</dt>
                              <dd className="mt-1 text-sm font-medium text-gray-900">{displayValue(field.value)}</dd>
                            </div>
                          ))}
                        </dl>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <TimelineProteccion ip={effectiveIp} />
            </div>
          </div>
        );
      case 3:
        if (modoPublico) return <div className="text-sm text-gray-500">Notas internas ocultas en modo público.</div>;
        return (<div className="text-sm text-gray-700">{internalNotesText}</div>);
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex gap-2 border-b border-gray-100 pb-3">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActive(i)} className={`text-sm px-3 py-2 rounded-md ${i===active? 'bg-red-50 text-red-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {renderContent()}
      </div>
    </div>
  );
}
