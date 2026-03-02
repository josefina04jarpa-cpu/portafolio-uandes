import TopNavigation from "../../components/TopNavigation";
import InstitutionsCatalog from "../../components/InstitutionsCatalog";
import { getAllInstitutions } from "../../lib/instituciones";

export default async function Page() {
  const institutions = await getAllInstitutions();

  const items = institutions
    .map((institution) => ({
      id: String(institution.id || "").trim(),
      name: String(institution.name || "").trim(),
      type: String(institution.type || "").trim(),
      industry: String(institution.industry || "").trim(),
      region: String(institution.region || "").trim(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

  return (
    <div className="min-h-screen bg-transparent">
      <TopNavigation active="portafolio" />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <section>
          <h1 className="text-3xl font-bold text-slate-900">Instituciones</h1>
          <p className="mt-2 text-sm text-gray-600">Catálogo institucional de instituciones colaboradoras de Innovación Uandes.</p>
        </section>

        <InstitutionsCatalog items={items} />
      </main>
    </div>
  );
}
