"use client";

import type { Indicator } from "../lib/indicadores";

type Props = {
  item: Indicator;
};

function parseSafeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatValue(value: number, unit?: string): string {
  const compact = new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value);

  const suffix = String(unit || "").trim();
  return suffix ? `${compact} ${suffix}` : compact;
}

function getKpiStatus(real: number, meta: number) {
  if (meta <= 0) {
    return {
      label: "Sin meta",
      arrow: "→",
      tone: "text-gray-600",
      badge: "bg-gray-100 text-gray-700 border-gray-200",
      progressClass: "bg-gray-400",
    };
  }

  const ratio = (real / meta) * 100;
  const isExact = Math.abs(ratio - 100) < 0.01;

  if (real > meta && !isExact) {
    return {
      label: "Supera meta",
      arrow: "↑",
      tone: "text-emerald-700",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      progressClass: "bg-emerald-500",
    };
  }

  if (isExact) {
    return {
      label: "Cumple meta",
      arrow: "→",
      tone: "text-amber-700",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      progressClass: "bg-amber-500",
    };
  }

  return {
    label: "Bajo meta",
    arrow: "↓",
    tone: "text-rose-700",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    progressClass: "bg-rose-500",
  };
}

export default function StrategicKPI({ item }: Props) {
  const real = parseSafeNumber(item.valor_2025_num);
  const meta = parseSafeNumber(item.meta_2025_num);
  const maxScale = Math.max(real, meta, 1);

  const realWidth = `${Math.min(100, (real / maxScale) * 100)}%`;
  const metaWidth = `${Math.min(100, (meta / maxScale) * 100)}%`;

  const deltaPct = meta > 0 ? ((real - meta) / meta) * 100 : 0;
  const deltaLabel = `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%`;

  const status = getKpiStatus(real, meta);

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-700 line-clamp-2">{item.nombre_indicador}</h3>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.badge}`}>{status.label}</span>
      </div>

      <div className="mt-4">
        <div className="text-3xl font-semibold tracking-tight text-slate-900">{formatValue(real, item.unidad)}</div>
        <div className="mt-1 text-sm text-gray-500">{formatValue(real)} / {formatValue(meta)} {item.unidad}</div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className={`text-sm font-semibold ${status.tone}`}>{status.arrow} {deltaLabel}</div>
        <div className="text-xs text-gray-500">Real vs Meta</div>
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
            <span>Real</span>
            <span>{formatValue(real)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div className={`h-2 rounded-full ${status.progressClass}`} style={{ width: realWidth }} />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
            <span>Meta</span>
            <span>{formatValue(meta)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-slate-300" style={{ width: metaWidth }} />
          </div>
        </div>
      </div>
    </article>
  );
}
