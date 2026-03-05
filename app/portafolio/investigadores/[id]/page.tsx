import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllResearchers, getResearcherById } from "../../../../lib/investigadores";
import { getAllProjects, type ProjectRow } from "../../../../lib/proyectos";
import { getInvestigatorAssociations } from "../../../../lib/entityLinks";
import { getComunicacionesByInvestigador, keepBestSocialPostsForInvestigador } from "../../../../lib/comunicaciones";
import { getLegalPI, isInTramite, type LegalPI } from "../../../../lib/legal_pi";
import ComunicacionesSection from "../../../../components/ComunicacionesSection";
import InvestigatorPerformanceChart from "../../../../components/InvestigatorPerformanceChart";

type Params = { params: { id: string } | Promise<{ id: string }>; searchParams?: Promise<{ tab?: string }> };

type TabKey =
  | "resumen"
  | "tecnologias"
  | "proyectos"
  | "apariciones"
  | "propiedad-intelectual"
  | "galeria";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "resumen", label: "Resumen" },
  { key: "tecnologias", label: "Tecnologías asociadas" },
  { key: "proyectos", label: "Proyectos asociados" },
  { key: "apariciones", label: "Apariciones y contenidos" },
  { key: "propiedad-intelectual", label: "Propiedad intelectual" },
  { key: "galeria", label: "Galería" },
];

function displayValue(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "-";
  const normalized = text.toLowerCase();
  if (normalized === "n/a" || normalized === "na" || normalized === "#n/a" || normalized === "null" || normalized === "-") return "-";
  return text;
}

function pickRawValue(raw: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = displayValue(raw[key]);
    if (value !== "-") return value;
  }
  return "-";
}

function normalizeBasic(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const researcherProfilePhotos: Array<{ match: string; fileName: string }> = [
  { match: "maria francisca valenzuela", fileName: "María Francisca Valenzuela.png" },
  { match: "sebastian goldsack", fileName: "Sebastián goldsack.png" },
  { match: "matias petersen", fileName: "Matías Petersen.png" },
  { match: "carlos irarrazabal", fileName: "Carlos Irarrazabal.png" },
  { match: "guillermo bustamante", fileName: "Guillermo Bustamante.png" },
  { match: "sebastian illanes", fileName: "Sebastián Illanes.png" },
  { match: "jorge gaete", fileName: "Jorge Gaete.png" },
  { match: "consuelo san martin", fileName: "Consuelo San Martin.png" },
  { match: "felipe scott", fileName: "Felipe Scott.png" },
  { match: "ximena farfan", fileName: "Ximena Farfan.png" },
  { match: "wilfredo gonzalez", fileName: "Wilfredo González.png" },
  { match: "alejandra chaparro", fileName: "Alejandra Chaparro.png" },
  { match: "paulo diaz", fileName: "Paulo Díaz.png" },
  { match: "maria jose bendek", fileName: "María José Bendek.png" },
  { match: "matias recabarren", fileName: "Matías Recabarren.png" },
  { match: "pelusa orellana", fileName: "Pelusa Orellana.png" },
  { match: "pamela inostroza", fileName: "Pamela Inostroza.png" },
  { match: "anil sadarangani", fileName: "Anil Sadarangani.png" },
  { match: "danilo segovia", fileName: "Danilo Segovia.png" },
];

function getResearcherProfilePhoto(name: string): string | null {
  const normalized = normalizeBasic(name);
  if (!normalized) return null;

  const normalizedWords = new Set(normalized.split(" ").filter(Boolean));

  const match = researcherProfilePhotos.find((item) => {
    if (normalized.includes(item.match)) return true;
    const tokens = normalizeBasic(item.match).split(" ").filter(Boolean);
    return tokens.length > 0 && tokens.every((token) => normalizedWords.has(token));
  });
  if (!match) return null;
  return encodeURI(`/${match.fileName}`);
}

function buildResearcherNameCandidates(fullName: string): string[] {
  const normalizedFull = normalizeBasic(fullName);
  const parts = normalizedFull.split(" ").filter(Boolean);
  if (parts.length === 0) return [];

  const candidates = new Set<string>();
  candidates.add(normalizedFull);

  if (parts.length >= 2) candidates.add(`${parts[0]} ${parts[1]}`);
  if (parts.length >= 3) candidates.add(`${parts[0]} ${parts[2]}`);
  if (parts.length >= 4) candidates.add(`${parts[0]} ${parts[3]}`);
  if (parts.length >= 2) candidates.add(`${parts[0]} ${parts[parts.length - 1]}`);

  return Array.from(candidates).filter(Boolean);
}

function splitProjectLeaders(value: string): string[] {
  return String(value || "")
    .split(/[;,\n]+|\s+y\s+/gi)
    .map((part) => normalizeBasic(part))
    .filter(Boolean);
}

function splitCreators(value: string): string[] {
  return String(value || "")
    .split(/[;,\n]+|\s+y\s+/gi)
    .map((part) => normalizeBasic(part))
    .filter(Boolean);
}

function matchResearcherToPI(researcherFullName: string, item: LegalPI): boolean {
  const candidates = buildResearcherNameCandidates(researcherFullName);
  if (candidates.length === 0) return false;

  const creatorsField = normalizeBasic(item.LGL_CreadoresUANDES);
  if (!creatorsField) return false;

  const creators = splitCreators(item.LGL_CreadoresUANDES);

  return candidates.some((candidate) => {
    if (!candidate) return false;
    if (creatorsField.includes(candidate)) return true;
    return creators.some((creator) => creator.includes(candidate));
  });
}

function displayPiValue(value: unknown): string {
  const text = String(value ?? "").trim();
  return text ? text : "—";
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

function extractUrls(value: string): string[] {
  const matches = String(value || "").match(/https?:\/\/[^\s,;]+/gi) || [];
  return matches.map((url) => url.trim());
}

function getGalleryImages(raw: Record<string, string>) {
  const likelyImageFields = Object.keys(raw).filter((key) =>
    /imagen|image|foto|photo|gallery|galeria|avatar/i.test(key),
  );

  const images: string[] = [];
  for (const key of likelyImageFields) {
    const urls = extractUrls(raw[key]);
    images.push(...urls.filter((url) => /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(url)));
  }

  return Array.from(new Set(images)).slice(0, 6);
}

type PerformanceByYear = {
  year: string;
  postulados: number;
  adjudicados: number;
};

function parseProjectYear(project: ProjectRow): string | null {
  const candidate = String(project.raw["PROY_AnoConvocatoria"] || project.raw["PROY_AñoConvocatoria"] || "").trim();

  if (!candidate) return null;
  const match = candidate.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : null;
}

function parseAdjudicadoFromRaw(project: ProjectRow): boolean {
  const value = String(project.raw["PROY_Adjudicado"] || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

  return ["si", "yes", "true", "1", "adjudicado"].includes(value);
}

function getProjectPostulacionName(project: ProjectRow): string {
  return String(project.raw["PROY_NombreProyecto"] || "").trim();
}

function isLeaderProjectForResearcher(project: ProjectRow, researcherFullName: string, researcherShortName: string): boolean {
  const leaderField = String(project.raw["PROY_InvestigadorLiderUANDES"] || "").trim();
  if (!leaderField) return false;

  const leaders = splitProjectLeaders(leaderField);
  if (leaders.length === 0) return false;

  const candidates = new Set<string>([
    ...buildResearcherNameCandidates(researcherFullName),
    ...buildResearcherNameCandidates(researcherShortName),
  ]);

  return Array.from(candidates).some((candidate) =>
    leaders.some((leader) => leader.includes(candidate) || candidate.includes(leader)),
  );
}

function buildPerformanceByYear(projects: ProjectRow[]): PerformanceByYear[] {
  const grouped = new Map<string, { postulados: Set<string>; adjudicados: Set<string> }>();

  for (const project of projects) {
    const year = parseProjectYear(project);
    if (!year) continue;
    const projectName = getProjectPostulacionName(project);
    if (!projectName) continue;

    const current = grouped.get(year) || { postulados: new Set<string>(), adjudicados: new Set<string>() };
    current.postulados.add(projectName);
    if (parseAdjudicadoFromRaw(project)) current.adjudicados.add(projectName);
    grouped.set(year, current);
  }

  return Array.from(grouped.entries())
    .map(([year, values]) => ({
      year,
      postulados: values.postulados.size,
      adjudicados: values.adjudicados.size,
    }))
    .sort((a, b) => Number(a.year) - Number(b.year));
}

export async function generateStaticParams() {
  const researchers = await getAllResearchers();
  return researchers.map((r) => ({ id: String(r.id) })).filter((p) => p.id);
}

export default async function Page({ params, searchParams }: Params) {
  const { id } = await params;
  const q = (await searchParams) || {};
  const activeTab = tabs.some((t) => t.key === q.tab) ? (q.tab as TabKey) : "resumen";

  const researcher = await getResearcherById(id);
  if (!researcher) return notFound();

  const name = displayValue(researcher.name);
  const fullName =
    pickRawValue(researcher.raw, ["INV_NombreCompleto", "Nombre completo", "nombre", "name"]) || name;
  const unit = displayValue(researcher.unit);
  const email = displayValue(researcher.email);
  const associations = await getInvestigatorAssociations(String(researcher.id));
  const allProjects = await getAllProjects();
  const leaderProjects = allProjects.filter((project) =>
    isLeaderProjectForResearcher(project, fullName, name),
  );
  const performanceByYear = buildPerformanceByYear(leaderProjects);
  const maxPostulados = performanceByYear.reduce((max, item) => Math.max(max, item.postulados), 0);
  const facultad = pickRawValue(researcher.raw, [
    "INV_Facultad",
    "INV_Facultad_Unidad",
    "INV_Facultad_Unidad2",
    "Facultad",
    "facultad",
  ]);
  const gradoAcademico = pickRawValue(researcher.raw, [
    "INV_GradoAcademico",
    "INV_GradoAcadémico",
    "Grado académico",
    "Grado academico",
    "grado academico",
  ]);
  const activo = pickRawValue(researcher.raw, ["INV_Activo", "Activo", "INV_Estado", "Estado"]);
  const numeroProyectos = String(associations.projects.auto.length);
  const numeroTecnologias = String(associations.technologies.auto.length);

  const galleryImages = getGalleryImages(researcher.raw);
  const researcherNameForComunicaciones =
    String(researcher.raw["INV_NombreCompleto"] || "").trim() || String(researcher.name || "").trim();
  const comunicaciones = keepBestSocialPostsForInvestigador(
    getComunicacionesByInvestigador(researcherNameForComunicaciones),
  );
  const profilePhoto = getResearcherProfilePhoto(researcherNameForComunicaciones || name);
  const legalItems = (await getLegalPI()).filter((item) => matchResearcherToPI(researcherNameForComunicaciones, item));
  const ultimaActualizacion = comunicaciones
    .map((item) => item.COM_Fecha)
    .filter((date) => parseDateDDMMYYYY(date) !== null)
    .sort((a, b) => (parseDateDDMMYYYY(b) || 0) - (parseDateDDMMYYYY(a) || 0))[0] || "-";

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-4 text-sm text-gray-600">
        <Link href="/portafolio/investigadores" className="text-slate-700 hover:underline">Explorar Investigadores</Link>
        <span className="mx-2">&gt;</span>
        <span className="font-medium text-slate-900">{name}</span>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center text-xl font-semibold text-gray-600">
              {profilePhoto ? (
                <Image src={profilePhoto} alt={`Foto de ${name}`} width={80} height={80} className="h-full w-full object-cover" />
              ) : (
                <>{name !== "-" ? name.slice(0, 2).toUpperCase() : "--"}</>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{unit}</span>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                Correo electrónico:{" "}
                {email !== "-" ? (
                  <a href={`mailto:${email}`} className="font-medium text-slate-900 hover:underline">{email}</a>
                ) : (
                  <span className="font-medium text-slate-900">-</span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <button className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">Contactar</button>
              <div className="text-xs text-gray-500">
                <div>ID Investigador: <span className="font-medium text-slate-900">{displayValue(researcher.id)}</span></div>
              </div>
            </div>
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
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Resumen</h2>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                    Activo: {displayValue(activo)}
                  </span>
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                    Asociaciones: {numeroProyectos} proyectos · {numeroTecnologias} tecnologías
                  </span>
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                    Última actualización: {displayValue(ultimaActualizacion)}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <dt className="text-sm text-gray-500">Nombre completo</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{displayValue(fullName)}</dd>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <dt className="text-sm text-gray-500">Facultad</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{displayValue(facultad)}</dd>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <dt className="text-sm text-gray-500">Grado académico</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{displayValue(gradoAcademico)}</dd>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <dt className="text-sm text-gray-500">Activo</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{displayValue(activo)}</dd>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <dt className="text-sm text-gray-500">Número de proyectos</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{displayValue(numeroProyectos)}</dd>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <dt className="text-sm text-gray-500">Número de tecnologías</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{displayValue(numeroTecnologias)}</dd>
                  </div>
                </dl>

                <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                  <h3 className="text-base font-semibold text-slate-900">Rendimiento de proyectos por año</h3>
                  <p className="mt-1 text-xs text-gray-500">Postulados por año vs adjudicados por año (PROY_Adjudicado).</p>

                  <InvestigatorPerformanceChart data={performanceByYear} />
                </div>
              </div>
            )}

            {activeTab === "tecnologias" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Tecnologías asociadas</h2>
                {associations.technologies.auto.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-600">-</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {associations.technologies.auto.map((tech) => (
                      <li key={tech.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                        <Link href={tech.path} className="text-sm font-medium text-slate-900 hover:underline">
                          {displayValue(tech.name)}
                        </Link>
                        <div className="mt-1 text-xs text-gray-500">ID: {displayValue(tech.id)}</div>
                      </li>
                    ))}
                  </ul>
                )}

                {associations.technologies.suggested.length > 0 && (
                  <div className="mt-5 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
                    <div className="text-xs font-semibold text-amber-800">Posibles coincidencias (revisar)</div>
                    <ul className="mt-2 space-y-1 text-sm text-amber-900">
                      {associations.technologies.suggested.map((item) => (
                        <li key={`tech-s-${item.id}`}>
                          {item.name} <span className="text-xs text-amber-700">({item.score.toFixed(2)})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "proyectos" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Proyectos asociados</h2>
                {associations.projects.auto.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">-</div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {associations.projects.auto.map((project) => (
                      <li key={project.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                        <Link href={project.path} className="text-sm font-medium text-slate-900 hover:underline">
                          {displayValue(project.name)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                <h3 className="mt-6 text-base font-semibold text-slate-900">Instituciones asociadas</h3>
                {associations.institutions.auto.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">-</div>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {associations.institutions.auto.map((institution) => (
                      <li key={institution.id}>
                        <Link href={institution.path} className="text-sm font-medium text-slate-900 hover:underline">
                          {displayValue(institution.name)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {associations.projects.suggested.length + associations.institutions.suggested.length > 0 && (
                  <div className="mt-5 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
                    <div className="text-xs font-semibold text-amber-800">Posibles coincidencias (revisar)</div>
                    <ul className="mt-2 space-y-1 text-sm text-amber-900">
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
            )}

            {activeTab === "apariciones" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <ComunicacionesSection
                  title="Apariciones y contenidos"
                  items={comunicaciones}
                  showMetrics={false}
                />
              </div>
            )}

            {activeTab === "propiedad-intelectual" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Propiedad intelectual</h2>

                {legalItems.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-600">—</div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                        Total: {legalItems.length}
                      </span>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                        En trámite: {legalItems.filter((item) => isInTramite(item)).length}
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        Cerradas: {legalItems.filter((item) => !isInTramite(item)).length}
                      </span>
                    </div>

                    {legalItems.map((item, index) => {
                      const inTramite = isInTramite(item);
                      return (
                        <article key={`${item.LGL_N || "pi"}-${index}`} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-slate-900">{displayPiValue(item.LGL_NombrePI) === "—" ? "Registro PI" : item.LGL_NombrePI}</h3>
                              <p className="mt-1 text-xs text-gray-500">{displayPiValue(item.LGL_NombreProdAsoc)}</p>
                            </div>

                            <button
                              type="button"
                              disabled
                              className={`shrink-0 cursor-default rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                                inTramite
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {displayPiValue(item.LGL_Estado)}
                            </button>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                              <div className="text-xs text-gray-500">Categoría</div>
                              <div className="mt-1 font-medium text-slate-900">{displayPiValue(item.LGL_CategPI)}</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                              <div className="text-xs text-gray-500">N° Solicitud</div>
                              <div className="mt-1 font-medium text-slate-900">{displayPiValue(item.LGL_NumSolicitud)}</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                              <div className="text-xs text-gray-500">País</div>
                              <div className="mt-1 font-medium text-slate-900">{displayPiValue(item.LGL_Pais)}</div>
                            </div>
                          </div>

                          {String(item.LGL_Link || "").trim() !== "" && (
                            <div className="mt-3">
                              <a
                                href={item.LGL_Link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
                              >
                                Abrir
                              </a>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "galeria" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Galería</h2>
                {galleryImages.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
                    Próximamente publicaremos imágenes destacadas en esta sección.
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {galleryImages.map((src, idx) => (
                      <div key={`${src}-${idx}`} className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                        <img src={src} alt={`Imagen ${idx + 1} de ${name}`} className="h-36 w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
