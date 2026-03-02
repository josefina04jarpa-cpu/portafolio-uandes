"use client";

import React, { useMemo } from "react";
import type { Indicator } from "../lib/indicadores";

const RESPONSABLES = [
  "María Fernanda Gana",
  "Ariel Véliz",
  "Daniela Sánchez",
  "Karen Márquez",
  "María Isabel González",
  "Danilo Segovia",
];

type Props = { allRows: Indicator[] };

function cellColor(avance: number) {
  if (avance >= 100) return "bg-green-200";
  if (avance >= 70) return "bg-amber-200";
  return "bg-red-200";
}

export default function HeatmapResponsables({ allRows }: Props) {
  const cols = useMemo(() => allRows.filter(i => (i.prioridad||"").toLowerCase() === 'alta').slice(0,8), [allRows]);

  if (cols.length === 0) return <div className="text-sm text-gray-500">No hay indicadores prioritarios (alta)</div>;

  return (
    <div className="overflow-x-auto">
      <div className="w-full min-w-[640px]">
        <div className="grid grid-cols-[200px_repeat(auto-fill,120px)] gap-2 items-center">
          <div className="font-medium text-sm">Responsable \ Indicador</div>
          {cols.map((c) => (
            <div key={c.id} className="text-xs font-medium text-gray-700 truncate">{c.nombre_indicador}</div>
          ))}

          {RESPONSABLES.map((r) => (
            <React.Fragment key={r}>
              <div className="py-2 text-sm text-gray-700">{r}</div>
              {cols.map((c) => {
                const isOwned = (c.responsable || "").toLowerCase() === r.toLowerCase();
                const avance = c.avance ?? 0;
                const title = `${c.nombre_indicador} — ${Math.round(avance)}% — ${c.valor_2025} / ${c.meta_2025}`;
                return (
                  <div key={c.id + '|' + r} title={title} className={`h-10 w-28 flex items-center justify-center text-xs ${cellColor(avance)} rounded`}> 
                    <div className={`px-1 ${isOwned ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>{Math.round(avance)}%</div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
