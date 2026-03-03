import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTechnologies } from "../../../../lib/tecnologias";
import { getAllProjects } from "../../../../lib/proyectos";
import { getLegalPI, matchByProduct } from "../../../../lib/legal";
import TechnologyTabs from "../../../../components/TechnologyTabs";
import TechnologySidebar from "../../../../components/TechnologySidebar";
import TechnologyIllustration from "../../../../components/TechnologyIllustration";
import { getTechnologyAssociations } from "../../../../lib/entityLinks";
import { getTRLByTechnologyName } from "../../../../lib/trl";

type Params = { params: { id: string } | Promise<{ id: string }> };

function normalizeRow(r: Record<string, unknown>, idx = 0) {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = r[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
    }
    return "";
  };

  const id = (r.TECN_ID || r.TECN_N || r.id || r.ID || Object.values(r)[0] || "").toString();
  const title = (r.TECN_NombreTecnologia || r.TECN_NombreProyecto || r.title || r.nombre || "Untitled").toString();
  const description = (r.TECN_Descripcion || r.TECN_Comentario || r.description || r.descripcion || "").toString();
  const estado = (r.TECN_Activo || r.TECN_Transferido || r.Estado || "").toString();
  const faculty = (r.TECN_Industria || r.faculty || r.facultad || "").toString();
  const patente = (r.TECN_ComentarioCierre || r.patent || r.patente || "").toString();
  const investigators = (r.TECN_Investigadores || r.investigadores || "").toString();
  const badgesField = (r.TECN_ProdCateg || r.TECN_ProdSubcateg || "").toString();
  const badges = badgesField ? String(badgesField).split(/;|\||,/).map((s) => s.trim()).filter(Boolean) : [];
  const ip = {
    nombre: pick("PI_Nombre", "PI_Titulo", "TECN_PI_Nombre", "TECN_PatenteNombre", "patent_title", "propiedad_intelectual_nombre"),
    tipo: pick("PI_Tipo", "TECN_PI_Tipo", "patent_type", "tipo_propiedad_intelectual"),
    numeroSolicitud: pick("PI_NumSolicitud", "PI_NumeroSolicitud", "TECN_PI_NumSolicitud", "numero_solicitud"),
    fechaSolicitud: pick("PI_FechaSolicitud", "TECN_PI_FechaSolicitud", "fecha_solicitud"),
    fechaRevisionInicio: pick("PI_FechaRevisionInicio", "PI_RevisionInicio", "TECN_PI_FechaRevisionInicio", "fecha_revision_inicio"),
    fechaRevisionFin: pick("PI_FechaRevisionFin", "PI_RevisionFin", "TECN_PI_FechaRevisionFin", "fecha_revision_fin"),
    fechaAprobacion: pick("PI_FechaAprobacion", "TECN_PI_FechaAprobacion", "fecha_aprobacion"),
    numeroRegistro: pick("PI_NumRegistro", "PI_NumeroRegistro", "TECN_PI_NumRegistro", "numero_registro"),
    fechaRegistro: pick("PI_FechaRegistro", "TECN_PI_FechaRegistro", "fecha_registro"),
    vigenciaHasta: pick("PI_VigenciaHasta", "TECN_PI_VigenciaHasta", "vigencia_hasta", "PI_Vigencia"),
    fechaTerminoProteccion: pick("PI_FechaTermino", "PI_FechaTerminoProteccion", "TECN_PI_FechaTermino", "fecha_termino_proteccion"),
    fechaTermino: pick("PI_FechaTermino", "PI_FechaTerminoProteccion", "TECN_PI_FechaTermino", "fecha_termino"),
    pais: pick("PI_Pais", "TECN_PI_Pais", "pais_registro", "pais"),
  };

  return {
    ...r,
    id,
    title,
    description,
    estado,
    faculty,
    patente,
    investigators,
    badges,
    ip,
    __idx: idx,
  } as Record<string, unknown>;
}

export default async function Page({ params }: Params) {
  const { id } = await params;
  const rows = await getAllTechnologies();
  const normalized = rows.map((r, i) => normalizeRow(r, i));
  const tech = normalized.find((t) => String(t.id) === String(id));
  if (!tech) return notFound();
  const associations = await getTechnologyAssociations(String(tech.id));
  const allProjects = await getAllProjects();
  const legalRecords = await getLegalPI();

  const normalizeText = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, " ");

  const techProjectName = normalizeText(tech.TECN_NombreProyecto || tech.PROY_NombreProyecto || tech.title);
  const linkedProject = allProjects.find((project) => {
    const projectName = normalizeText(project.raw["PROY_NombreProyecto"] || project.title);
    return projectName && techProjectName && (projectName === techProjectName || projectName.includes(techProjectName) || techProjectName.includes(projectName));
  });

  const projectSummaryDescription = String(linkedProject?.raw["PROY_Descripcion"] || "").trim();
  const productNameForLegal = String(tech.TECN_NombreTecnologia || tech.title || "").trim();
  const legalForTechnology = legalRecords.filter((item) => matchByProduct(item, "Tecnología", productNameForLegal));
  const trlByYear = await getTRLByTechnologyName(String(tech.TECN_NombreTecnologia || tech.title || ""));
  const latestTrl = trlByYear.length > 0 ? trlByYear[trlByYear.length - 1] : null;
  const investigatorsEquipo =
    associations.investigators.auto.length > 0
      ? associations.investigators.auto.map((item) => String(item.name || "").trim()).filter(Boolean).join(", ")
      : String(tech.investigators || tech.TECN_Investigadores || "").trim();
  const exportSheetData = {
    resumen: String(projectSummaryDescription || tech.PROY_Descripcion || tech.description || "").trim(),
    nombreProyecto: String(linkedProject?.raw["PROY_NombreProyecto"] || tech.TECN_NombreProyecto || tech.title || "").trim(),
    idProyecto: String(linkedProject?.id || linkedProject?.raw["PROY_ID"] || "").trim(),
    directorProyecto: String(linkedProject?.raw["PROY_InvestigadorLiderUANDES"] || "").trim(),
    investigadoresEquipo: investigatorsEquipo,
    trlSnapshot: latestTrl
      ? {
          year: latestTrl.year,
          crl: latestTrl.crl,
          trl: latestTrl.trl,
          brl: latestTrl.brl,
          iprl: latestTrl.iprl,
          tmrl: latestTrl.tmrl,
          frl: latestTrl.frl,
        }
      : undefined,
  };

  const techTitle = String(tech.title || "");
  const techDescription = String(tech.description || "");
  const techId = String(tech.id || "");
  const techInvestigators = String(tech.investigators || "");
  const techBadges = Array.isArray(tech.badges) ? tech.badges.map((badge) => String(badge || "")).filter(Boolean) : [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-4 text-sm text-gray-600">
        <Link href="/portafolio/tecnologias" className="text-slate-700 hover:underline">Explorar Tecnologías</Link>
        <span className="mx-2">&gt;</span>
        <span className="font-medium text-slate-900">{techTitle}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-start gap-6">
              <div className="shrink-0">
                <TechnologyIllustration
                  title={String(tech.title || "")}
                  description={String(tech.description || "")}
                  badges={techBadges}
                  className="h-36 w-48 rounded-xl"
                />
                <div className="mt-2 text-center text-xs text-gray-500">Ilustración 2D referencial</div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900">{techTitle}</h1>
                <p className="mt-2 text-sm text-gray-600">{techDescription}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {techBadges.map((b, i) => (
                    <span key={i} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">{b}</span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <button className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">Contactar</button>
                <div className="text-xs text-gray-500">
                  <div>ID Tecnológico: <span className="font-medium text-slate-900">{techId}</span></div>
                  <div>Tipo: <span className="font-medium text-slate-900">{techBadges[0] ?? "-"}</span></div>
                  <div>Investigadores: <span className="font-medium text-slate-900">{techInvestigators || "-"}</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <TechnologyTabs
              tech={tech}
              summaryDescription={projectSummaryDescription}
              legalItems={legalForTechnology}
              exportSheetData={exportSheetData}
            />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-slate-900">Asociados</h2>

            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Investigadores</h3>
                {associations.investigators.auto.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-600">-</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm">
                    {associations.investigators.auto.map((item) => (
                      <li key={`inv-${item.id}`}>
                        <Link href={item.path} className="font-medium text-slate-900 hover:underline">{item.name}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">Proyectos</h3>
                {associations.projects.auto.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-600">-</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm">
                    {associations.projects.auto.map((item) => (
                      <li key={`prj-${item.id}`}>
                        <Link href={item.path} className="font-medium text-slate-900 hover:underline">{item.name}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">Instituciones</h3>
                {associations.institutions.auto.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-600">-</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm">
                    {associations.institutions.auto.map((item) => (
                      <li key={`ins-${item.id}`}>
                        <Link href={item.path} className="font-medium text-slate-900 hover:underline">{item.name}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {associations.investigators.suggested.length + associations.projects.suggested.length + associations.institutions.suggested.length > 0 && (
              <div className="mt-5 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
                <div className="text-xs font-semibold text-amber-800">Posibles coincidencias (revisar)</div>
                <ul className="mt-2 space-y-1 text-sm text-amber-900">
                  {associations.investigators.suggested.map((item) => (
                    <li key={`inv-s-${item.id}`}>Investigador: {item.name} <span className="text-xs text-amber-700">({item.score.toFixed(2)})</span></li>
                  ))}
                  {associations.projects.suggested.map((item) => (
                    <li key={`prj-s-${item.id}`}>Proyecto: {item.name} <span className="text-xs text-amber-700">({item.score.toFixed(2)})</span></li>
                  ))}
                  {associations.institutions.suggested.map((item) => (
                    <li key={`ins-s-${item.id}`}>Institución: {item.name} <span className="text-xs text-amber-700">({item.score.toFixed(2)})</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <TechnologySidebar key={String(tech.id)} tech={tech} trlByYear={trlByYear} />
        </aside>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const rows = await getAllTechnologies();
  return rows
    .map((r) => {
      const id = (r.TECN_ID || r.TECN_N || r.id || Object.values(r)[0] || "").toString();
      return { id };
    })
    .filter((p) => p.id);
}
