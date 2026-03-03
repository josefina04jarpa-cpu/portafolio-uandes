import Link from "next/link";

type Props = {
  active: "resumen" | "subdirecciones";
};

export default function IndicadoresSubmenu({ active }: Props) {
  const items = [
    { key: "resumen", label: "Resumen", href: "/indicadores" },
    { key: "subdirecciones", label: "Subdirecciones", href: "/indicadores/subdirecciones" },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-6 pt-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {items.map((item) => {
            const isActive = active === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "border-slate-300 bg-slate-100 text-slate-900"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
