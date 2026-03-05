"use client";

import { useEffect, useState } from "react";

type PerformanceByYear = {
  year: string;
  postulados: number;
  adjudicados: number;
};

type Props = {
  data: PerformanceByYear[];
};

export default function InvestigatorPerformanceChart({ data }: Props) {
  const [focusBar, setFocusBar] = useState<"postulados" | "adjudicados" | null>(null);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(false);
    const frame = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(frame);
  }, [data]);

  const maxPostulados = data.reduce((max, item) => Math.max(max, item.postulados), 0);

  if (data.length === 0) {
    return (
      <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-600">-</div>
    );
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-slate-300" />
          Proyectos postulados
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-red-700" />
          Proyectos adjudicados
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="flex h-64 items-end gap-4 border-b border-gray-200 pb-3">
            {data.map((item) => {
              const postuladosHeight =
                item.postulados === 0 || maxPostulados === 0
                  ? 0
                  : Math.max(8, (item.postulados / maxPostulados) * 100);
              const adjudicadosHeight =
                item.adjudicados === 0 || maxPostulados === 0
                  ? 0
                  : Math.max(8, (item.adjudicados / maxPostulados) * 100);

              const fadeAdjudicados = focusBar === "postulados";
              const fadePostulados = focusBar === "adjudicados";

              return (
                <div key={item.year} className="flex min-w-[84px] flex-1 flex-col items-center">
                  <div className="relative h-48 w-16">
                    <div className="absolute bottom-0 left-1/2 flex h-full w-full -translate-x-1/2 items-end justify-center gap-1">
                    <div
                      className="group relative z-10 w-6 transition-all duration-700 ease-out"
                      style={{ height: animateIn ? `${postuladosHeight}%` : "0%" }}
                    >
                      <button
                        type="button"
                        aria-label={`Postulados ${item.year}: ${item.postulados}`}
                        onMouseEnter={() => setFocusBar("postulados")}
                        onMouseLeave={() => setFocusBar(null)}
                        onTouchStart={() => setFocusBar("postulados")}
                        onTouchEnd={() => setFocusBar(null)}
                        className="h-full w-full rounded-t-md border border-slate-400/40 bg-slate-300 transition-opacity duration-200"
                        style={{
                          opacity: fadePostulados ? 0.45 : 1,
                        }}
                      />
                      <div className="pointer-events-none absolute -top-9 left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-sm group-hover:block">
                        Postulados: {item.postulados}
                      </div>
                    </div>

                    <div
                      className="group relative z-20 w-6 transition-all duration-700 ease-out"
                      style={{ height: animateIn ? `${adjudicadosHeight}%` : "0%" }}
                    >
                      <button
                        type="button"
                        aria-label={`Adjudicados ${item.year}: ${item.adjudicados}`}
                        onMouseEnter={() => setFocusBar("adjudicados")}
                        onMouseLeave={() => setFocusBar(null)}
                        onTouchStart={() => setFocusBar("adjudicados")}
                        onTouchEnd={() => setFocusBar(null)}
                        className="h-full w-full rounded-t-md bg-red-700 transition-opacity duration-200"
                        style={{
                          opacity: fadeAdjudicados ? 0.35 : 1,
                        }}
                      />
                      <div className="pointer-events-none absolute -top-9 left-1/2 z-40 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-sm group-hover:block">
                        Adjudicados: {item.adjudicados}
                      </div>
                    </div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs font-medium text-slate-700">{item.year}</div>
                  <div className="text-[11px] text-gray-500">P: {item.postulados} · A: {item.adjudicados}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
