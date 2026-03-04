import Link from "next/link";
import { notFound } from "next/navigation";
import { getExecutiveContactForProject, getProjectResponsibles } from "../../../../lib/executiveProfiles";
import ExecutiveContactButton from "../../../../components/ExecutiveContactButton";
import { getAllProjects, getProjectById } from "../../../../lib/proyectos";
import { getProjectAssociations } from "../../../../lib/entityLinks";
import { getComunicacionesByProyecto } from "../../../../lib/comunicaciones";
import { getLegalPI, matchByProduct } from "../../../../lib/legal_pi";
import { getFinanciamientoByProyectoNormalized } from "../../../../lib/financiamiento";
import { getAllInstitutions } from "../../../../lib/instituciones";
import ComunicacionesSection from "../../../../components/ComunicacionesSection";
import LegalPITab from "../../../../components/LegalPITab";
import ExportSummaryPdfButton from "../../../../components/ExportSummaryPdfButton";

type Params = {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
};

type TabKey = "resumen" | "tecnologias" | "investigadores" | "apariciones" | "propiedad-intelectual" | "notas";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "resumen", label: "Resumen" },
  { key: "tecnologias", label: "Tecnologías asociadas" },
  { key: "investigadores", label: "Investigadores" },
  { key: "apariciones", label: "Apariciones y contenidos" },
  { key: "propiedad-intelectual", label: "Propiedad intelectual" },
  { key: "notas", label: "Notas internas" },
];

function display(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "-";
  const normalized = text.toLowerCase();
  if (normalized === "n/a" || normalized === "na" || normalized === "#n/a" || normalized === "null" || normalized === "-") return "-";
  return text;
}

function parseDateDDMMYYYY(value: string): number | null {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date.getTime();
}


export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map((p) => ({ id: p.id })).filter((p) => p.id);
}

export default async function Page({ params, searchParams }: Params) {
  const { id } = await params;
  const q = (await searchParams) || {};
  const activeTab = tabs.some((t) => t.key === q.tab) ? (q.tab as TabKey) : "resumen";

  const project = await getProjectById(id);
  if (!project) return notFound();
  const associations = await getProjectAssociations(String(project.id));
  const projectNameForComunicaciones =
    String(project.raw["PROY_NombreProyecto"] || "").trim() || String(project.title || "").trim();
  const comunicaciones = getComunicacionesByProyecto(projectNameForComunicaciones);
  const ultimaActualizacion = comunicaciones
    .map((item) => item.COM_Fecha)
    .filter((date) => parseDateDDMMYYYY(date) !== null)
    .sort((a, b) => (parseDateDDMMYYYY(b) || 0) - (parseDateDDMMYYYY(a) || 0))[0] || "-";
  const legalRecords = await getLegalPI();
  const legalForProject = legalRecords.filter((item) =>
    matchByProduct(item, "Proyecto", String(project.raw["PROY_NombreProyecto"] || project.title || "")),
  );
  const equipoInvestigadores = associations.investigators.auto.map((item) => String(item.name || "").trim()).filter(Boolean);
  const equipoInvestigadoresText =
    equipoInvestigadores.length > 0
      ? equipoInvestigadores.join(", ")
      : String(project.raw["PROY_CoEjecutor"] || project.raw["PROY_InvestigadorLiderUANDES"] || project.investigador || "").trim();
  const resumenProyecto = String(project.raw["PROY_Descripcion"] || project.description || "").trim();
  const directorProyecto = String(project.raw["PROY_InvestigadorLiderUANDES"] || project.investigador || "").trim();
  const nombreProyecto = String(project.raw["PROY_NombreProyecto"] || project.title || "").trim();
  const executiveContact = await getExecutiveContactForProject(project);
  const projectResponsibles = await getProjectResponsibles(project);
  const [financiamientos, allInstitutions] = await Promise.all([
    getFinanciamientoByProyectoNormalized(String(project.raw["PROY_NombreProyecto"] || project.title || "")),
    getAllInstitutions(),
  ]);

  const financedInstitutions = new Map<string, { id: string; name: string; path: string }>();
  for (const row of financiamientos) {
    const receptor = String(row.PROF_InstitucReceptora || "").trim();
    if (!receptor || receptor.toLowerCase() === "n/a") continue;

    const matched = allInstitutions.find((institution) => {
      const fantasy = String(institution.raw.INST_NombreFantasia || "").trim();
      const complete = String(institution.raw.INST_NombreCompleto || "").trim();
      return fantasy === receptor || complete === receptor || institution.name === receptor;
    });

    if (matched) {
      financedInstitutions.set(matched.id, {
        id: matched.id,
        name: matched.name,
        path: `/instituciones/${encodeURIComponent(matched.id)}`,
      });
    }
  }

  const institutionsLinked = Array.from(
    new Map(
      [...associations.institutions.auto, ...Array.from(financedInstitutions.values())].map((item) => [item.id, item]),
    ).values(),
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-4 text-sm text-gray-600">
        <Link href="/portafolio/proyectos" className="text-slate-700 hover:underline">Volver a Proyectos</Link>
        <span className="mx-2">&gt;</span>
        <span className="font-medium text-slate-900">{display(project.title)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center text-xl font-semibold text-gray-600">
                {display(project.title) !== "-" ? display(project.title).slice(0, 2).toUpperCase() : "--"}
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900">{display(project.title)}</h1>

                {project.badges.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {project.badges.map((badge) => (
                      <span key={`${project.id}-${badge}`} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {display(badge)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2">
                    <span className="text-gray-500">Disciplina principal:</span>{" "}
                    <span className="font-medium text-slate-900">{display(project.disciplinaPrincipal)}</span>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2">
                    <span className="text-gray-500">Investigador:</span>{" "}
                    <span className="font-medium text-slate-900">{display(project.investigador)}</span>
                  </div>
                </div>
              </div>

              <Link href="/portafolio/proyectos" className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">
                Volver a Proyectos
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <Link
                    key={tab.key}
                    href={`?tab=${tab.key}`}
                    className={`text-sm px-3 py-2 rounded-md ${
                      isActive ? "bg-red-50 text-red-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-5">
              {activeTab === "resumen" && (
                <div id={`project-summary-export-${project.id}`} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">Resumen</h2>
                    <ExportSummaryPdfButton
                      targetId={`project-summary-export-${project.id}`}
                      fileName={`ficha-proyecto-${String(project.id || "detalle")}.pdf`}
                      sheetData={{
                        resumen: resumenProyecto,
                        nombreProyecto,
                        idProyecto: String(project.id || "").trim(),
                        directorProyecto,
                        investigadoresEquipo: equipoInvestigadoresText,
                      }}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${project.adjudicado ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                      Estado: {project.adjudicado ? "Adjudicado" : "Postulado"}
                    </span>
                    <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                      Asociaciones: {associations.technologies.auto.length} tecnologías · {associations.investigators.auto.length} investigadores
                    </span>
                    <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                      Última actualización: {display(ultimaActualizacion)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-700">{display(project.raw["PROY_Descripcion"] || project.description)}</p>

                  <h3 className="mt-6 text-base font-semibold text-slate-900">Proyectos asociados</h3>
                  {associations.projects.auto.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-600">-</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {associations.projects.auto.map((item) => (
                        <li key={`project-link-${item.id}`} className="text-sm text-gray-700">
                          <Link href={item.path} className="font-medium text-slate-900 hover:underline">{display(item.name)}</Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  {associations.projects.suggested.length > 0 && (
                    <div className="mt-5 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
                      <div className="text-xs font-semibold text-amber-800">Posibles coincidencias de continuidad (revisar)</div>
                      <ul className="mt-2 space-y-1 text-sm text-amber-900">
                        {associations.projects.suggested.map((item) => (
                          <li key={`project-s-${item.id}`}>{item.name} <span className="text-xs text-amber-700">({item.score.toFixed(2)})</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "tecnologias" && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Tecnologías asociadas</h2>
                  {associations.technologies.auto.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-600">-</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {associations.technologies.auto.map((tech) => (
                        <li key={tech.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                          <Link href={tech.path} className="text-sm font-medium text-slate-900 hover:underline">
                            {display(tech.name)}
                          </Link>
                          <div className="mt-1 text-xs text-gray-500">ID: {display(tech.id)}</div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {associations.technologies.suggested.length > 0 && (
                    <div className="mt-5 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
                      <div className="text-xs font-semibold text-amber-800">Posibles coincidencias (revisar)</div>
                      <ul className="mt-2 space-y-1 text-sm text-amber-900">
                        {associations.technologies.suggested.map((item) => (
                          <li key={`tech-s-${item.id}`}>{item.name} <span className="text-xs text-amber-700">({item.score.toFixed(2)})</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "investigadores" && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Investigadores</h2>
                  {associations.investigators.auto.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-600">-</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {associations.investigators.auto.map((inv) => (
                        <li key={`${project.id}-inv-${inv.id}`} className="text-sm text-gray-700">
                          <Link href={inv.path} className="font-medium text-slate-900 hover:underline">{display(inv.name)}</Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h3 className="mt-6 text-base font-semibold text-slate-900">Instituciones asociadas</h3>
                  {institutionsLinked.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-600">-</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {institutionsLinked.map((institution) => (
                        <li key={`${project.id}-ins-${institution.id}`} className="text-sm text-gray-700">
                          <Link href={institution.path} className="font-medium text-slate-900 hover:underline">{display(institution.name)}</Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  {associations.investigators.suggested.length + associations.institutions.suggested.length > 0 && (
                    <div className="mt-5 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
                      <div className="text-xs font-semibold text-amber-800">Posibles coincidencias (revisar)</div>
                      <ul className="mt-2 space-y-1 text-sm text-amber-900">
                        {associations.investigators.suggested.map((item) => (
                          <li key={`inv-s-${item.id}`}>Investigador: {item.name} <span className="text-xs text-amber-700">({item.score.toFixed(2)})</span></li>
                        ))}
                        {associations.institutions.suggested.map((item) => (
                          <li key={`ins-s-${item.id}`}>Institución: {item.name} <span className="text-xs text-amber-700">({item.score.toFixed(2)})</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "notas" && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Notas internas</h2>
                  <p className="mt-3 text-sm text-gray-600">-</p>
                </div>
              )}

              {activeTab === "apariciones" && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <ComunicacionesSection title="Apariciones y contenidos" items={comunicaciones} />
                </div>
              )}

              {activeTab === "propiedad-intelectual" && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Propiedad intelectual</h2>
                  <div className="mt-4">
                    <LegalPITab items={legalForProject} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-slate-900">Ficha rápida</h3>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div>
                ID del proyecto: <span className="font-medium text-slate-900">{display(project.id)}</span>
              </div>
              <div>
                Disciplina: <span className="font-medium text-slate-900">{display(project.disciplinaPrincipal)}</span>
              </div>
              <div>
                Investigador: <span className="font-medium text-slate-900">{display(project.investigador)}</span>
              </div>
            </div>

            {projectResponsibles.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">Ejecutivos a cargo</h4>
                {projectResponsibles.map((responsible, idx) => (
                  <div key={`${responsible.email}-${idx}`} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">{display(responsible.name)}</div>
                        <div className="mt-0.5 text-xs text-gray-600">{display(responsible.role)}</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${
                        responsible.type === "postulacion"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}>
                        {responsible.type === "postulacion" ? "Postulación" : "Seguimiento Técnico"}
                      </span>
                    </div>
                    <ExecutiveContactButton
                      email={responsible.email}
                      subject={`Consulta proyecto: ${display(project.title)}`}
                      className="mt-2 w-full"
                    />
                  </div>
                ))}
              </div>
            )}

            {projectResponsibles.length === 0 && executiveContact?.email && (
              <>
                <div className="mt-4 text-sm text-gray-600">
                  Ejecutivo a cargo: <span className="font-medium text-slate-900">{display(executiveContact.name)}</span>
                </div>
                <ExecutiveContactButton
                  email={executiveContact.email}
                  subject={`Consulta proyecto: ${display(project.title)}`}
                />
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
