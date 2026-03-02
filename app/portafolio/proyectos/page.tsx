import TopNavigation from "../../../components/TopNavigation";
import ProjectsCatalog from "../../../components/ProjectsCatalog";
import { getAllProjects } from "../../../lib/proyectos";

export default async function Page() {
  const rows = await getAllProjects();

  const items = rows
    .map((project) => ({
      id: String(project.id || "").trim(),
      title: String(project.title || "").trim(),
      disciplinaPrincipal: String(project.disciplinaPrincipal || "").trim(),
      investigador: String(project.investigador || "").trim(),
      adjudicado: Boolean(project.adjudicado),
      estadoPostulacion: project.estadoPostulacion,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));

  return (
    <div className="min-h-screen bg-transparent">
      <TopNavigation active="portafolio" />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <section>
          <h1 className="text-3xl font-bold text-slate-900">Proyectos</h1>
          <p className="mt-2 text-sm text-gray-600">Catálogo institucional de proyectos de Innovación Uandes vinculados al portafolio.</p>
        </section>

        <ProjectsCatalog items={items} />
      </main>
    </div>
  );
}
