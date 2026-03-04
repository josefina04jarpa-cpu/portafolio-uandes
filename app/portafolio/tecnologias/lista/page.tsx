import TopNavigation from "../../../../components/TopNavigation";
import PortfolioCatalog from "../../../../components/PortfolioCatalog";
import { getAllTechnologies } from "../../../../lib/tecnologias";

export default async function Page() {
  const rows = await getAllTechnologies();

  const items = rows.map((r, idx) => {
    const id = (r.TECN_ID || r.TECN_N || r.id || r.ID || Object.values(r)[0] || "").toString();
    const title = (r.TECN_NombreTecnologia || r.TECN_NombreProyecto || r.title || r.nombre || r.name || r.titulo || "Untitled").toString();
    const description = (r.TECN_Descripcion || r.TECN_Comentario || r.description || r.descripcion || "").toString();
    const icon = (r.icon || r.emoji || "").toString();
    const badgesField = (r.TECN_ProdCateg || r.TECN_ProdSubcateg || r.badges || r.tags || "").toString();
    const badges = badgesField ? String(badgesField).split(/;|\||,/).map((s) => s.trim()).filter(Boolean) : [];
    const faculty = (r.faculty || "").toString();
    const ambito = (r.TECN_Ambito || r.ambito || r.scope || "").toString();
    const estado = (r.TECN_Activo || r.TECN_Transferido || r.estado || r.status || "").toString();
    const techId = (r.TECN_ID || r.techId || r.tech_id || id).toString();

    return {
      ...r,
      id,
      title,
      description,
      icon,
      badges,
      faculty,
      ambito,
      estado,
      techId,
      __idx: idx,
    };
  });

  return (
    <div className="min-h-screen bg-transparent">
      <TopNavigation active="portafolio" />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <section>
          <h1 className="text-3xl font-bold text-slate-900">Listado de Tecnologías</h1>
          <p className="mt-2 text-sm text-gray-600">Catálogo institucional de tecnologías e iniciativas de Innovación Uandes.</p>
        </section>

        <PortfolioCatalog items={items} />
      </main>
    </div>
  );
}
