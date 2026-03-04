import Link from "next/link";
import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import TopNavigation from "../../components/TopNavigation";
import { resolveDataFile } from "../../lib/dataPath";

type CountCard = {
  title: string;
  value: number;
  meta: string;
  href: string;
};

async function countRows(fileNames: string[]): Promise<number> {
  for (const fileName of fileNames) {
    try {
      const path = resolveDataFile(fileName);
      const raw = await readFile(path, "utf8");
      const records = parse(raw, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        delimiter: ";",
        relax_column_count: true,
      }) as Record<string, unknown>[];
      return records.length;
    } catch {
      continue;
    }
  }

  return 0;
}

export default async function Page() {
  const [investigadores, tecnologias, instituciones, proyectos] = await Promise.all([
    countRows(["Investigadores.csv", "investigadores.csv"]),
    countRows(["tecnologias.csv", "Tecnologias.csv"]),
    countRows(["Instituciones.csv", "instituciones.csv"]),
    countRows(["Proyectos.csv", "proyectos.csv"]),
  ]);

  const cards: CountCard[] = [
    { title: "Investigadores", value: investigadores, meta: "Total en base 2025", href: "/portafolio/investigadores" },
    { title: "Tecnologías", value: tecnologias, meta: "Total en base 2025", href: "/portafolio/tecnologias" },
    { title: "Instituciones asociadas", value: instituciones, meta: "Total en base 2025", href: "/portafolio/instituciones" },
    { title: "Proyectos", value: proyectos, meta: "Total en base 2025", href: "/portafolio/proyectos" },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <TopNavigation active="portafolio" />

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <section>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Portafolio</h1>
          <p className="mt-3 text-base text-gray-600">Catálogo institucional de tecnologías e iniciativas de Innovación Uandes.</p>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-2xl border border-gray-200 bg-white p-7 shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition hover:shadow-md"
            >
              <h2 className="text-sm font-medium text-gray-600">{card.title}</h2>

              <div className="mt-6 text-5xl font-semibold leading-none tracking-tight text-slate-900">{card.value}</div>
              <p className="mt-3 text-sm text-gray-500">{card.meta}</p>
            </Link>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/portafolio/investigadores" className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm hover:shadow-md">
            <div className="text-base font-semibold text-slate-900">Investigadores</div>
            <div className="mt-2 text-sm text-red-700">Explorar</div>
          </Link>

          <Link href="/portafolio/instituciones" className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm hover:shadow-md">
            <div className="text-base font-semibold text-slate-900">Instituciones</div>
            <div className="mt-2 text-sm text-red-700">Explorar</div>
          </Link>

          <Link href="/portafolio/proyectos" className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm hover:shadow-md">
            <div className="text-base font-semibold text-slate-900">Proyectos</div>
            <div className="mt-2 text-sm text-red-700">Explorar</div>
          </Link>

          <Link href="/portafolio/tecnologias" className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm hover:shadow-md">
            <div className="text-base font-semibold text-slate-900">Tecnologías</div>
            <div className="mt-2 text-sm text-red-700">Explorar</div>
          </Link>
        </section>
      </main>
    </div>
  );
}
