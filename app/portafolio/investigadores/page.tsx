import { getAllResearchers } from "../../../lib/investigadores";
import ResearchersCatalog from "../../../components/ResearchersCatalog";
import TopNavigation from "../../../components/TopNavigation";

export default async function Page() {
  const rows = await getAllResearchers();

  const items = rows
    .map((r) => ({
      id: String(r.id || "").trim(),
      name: String(r.name || "").trim(),
      faculty: String(r.raw.INV_Facultad_Unidad || "").trim() || "Sin información",
      unit: String(r.raw.INV_Facultad_Unidad2 || "").trim() || "Sin información",
      email: String(r.email || "").trim(),
      gender: String(r.raw.INV_Genero || "").trim(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

  return (
    <div className="min-h-screen bg-transparent">
      <TopNavigation active="portafolio" />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <section>
          <h1 className="text-3xl font-bold text-slate-900">Investigadores</h1>
          <p className="mt-2 text-sm text-gray-600">Directorio institucional de investigadores vinculados al portafolio de Innovación Uandes.</p>
        </section>

        <ResearchersCatalog items={items} />
      </main>
    </div>
  );
}
