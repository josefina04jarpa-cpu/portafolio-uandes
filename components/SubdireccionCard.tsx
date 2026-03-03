import Link from "next/link";
import type { SubdireccionCardData } from "../lib/subdirecciones";

type Props = {
  item: SubdireccionCardData;
};

function AreaIcon({ icon }: { icon: SubdireccionCardData["icon"] }) {
  if (icon === "rocket") return <span aria-hidden>🚀</span>;
  if (icon === "folder") return <span aria-hidden>📁</span>;
  if (icon === "cpu") return <span aria-hidden>🧩</span>;
  if (icon === "shield") return <span aria-hidden>🛡️</span>;
  return <span aria-hidden>📣</span>;
}

function formatMetric(value: number | null, compact = false): string {
  if (value === null) return "—";
  if (compact) {
    return new Intl.NumberFormat("es-CL", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("es-CL").format(value);
}

export default function SubdireccionCard({ item }: Props) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="absolute left-0 top-0 h-1.5 w-full" style={{ backgroundColor: item.accentColor }} />

      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
          style={{ backgroundColor: `${item.accentColor}20` }}
        >
          <AreaIcon icon={item.icon} />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.shortDescription}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {item.metrics.map((metric) => (
          <div key={`${item.slug}-${metric.label}`} className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2">
            <div className="text-base font-semibold text-slate-900">
              {formatMetric(metric.value, item.slug === "comunicaciones" && metric.label === "Cobertura VPE")}
            </div>
            <div className="text-xs text-gray-500">{metric.label}</div>
          </div>
        ))}
      </div>

      <Link
        href={`/indicadores/subdirecciones/${item.slug}`}
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        Ver área →
      </Link>
    </article>
  );
}
