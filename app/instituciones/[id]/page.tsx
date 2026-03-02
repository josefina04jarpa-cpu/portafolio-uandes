import Link from "next/link";
import { notFound } from "next/navigation";
import TopNavigation from "../../../components/TopNavigation";
import { getInstitutionById, getAllInstitutions } from "../../../lib/instituciones";
import { getInstitutionAssociations } from "../../../lib/entityLinks";

type Params = {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string; showAllProjects?: string; showAllTech?: string }>;
};

type TabKey = "resumen" | "asociadas";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "resumen", label: "Resumen" },
  { key: "asociadas", label: "Proyectos o tecnologías asociadas" },
];

const MAX_ITEMS = 6;

function display(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "-";
  const normalized = text.toLowerCase();
  if (normalized === "n/a" || normalized === "na" || normalized === "#n/a" || normalized === "null" || normalized === "-") return "-";
  return text;
}

function normalizeProject(project: { id: string; name: string; path: string }) {
  return {
    id: display(project.id),
    title: display(project.name),
    path: project.path,
  };
}

function normalizeTechnology(tech: { id: string; name: string; path: string }) {
  const id = display(tech.id);
  const title = display(tech.name);

  return { id, title, path: tech.path };
}

export async function generateStaticParams() {
  const institutions = await getAllInstitutions();
  return institutions.map((institution) => ({ id: String(institution.id) })).filter((p) => p.id);
}

export default async function Page({ params, searchParams }: Params) {
  const { id } = await params;
  const q = (await searchParams) || {};
  const activeTab = tabs.some((tab) => tab.key === q.tab) ? (q.tab as TabKey) : "resumen";
  const showAllProjects = q.showAllProjects === "1";
  const showAllTech = q.showAllTech === "1";

  const institution = await getInstitutionById(id);
  if (!institution) return notFound();
  const associations = await getInstitutionAssociations(String(institution.id));

  const projects = associations.projects.auto
    .map(normalizeProject)
    .filter((item) => item.id !== "-" && item.title !== "-");

  const technologies = associations.technologies.auto
    .map(normalizeTechnology)
    .filter((item) => item.id !== "-" && item.title !== "-");

  const visibleProjects = showAllProjects ? projects : projects.slice(0, MAX_ITEMS);
  const visibleTechnologies = showAllTech ? technologies : technologies.slice(0, MAX_ITEMS);

  const resumenEntries = [
    { label: "Nombre", value: display(institution.name) },
    { label: "Tipo", value: display(institution.type) },
    { label: "Industria", value: display(institution.industry) },
    { label: "Región", value: display(institution.region) },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <TopNavigation active="portafolio" />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="text-sm text-gray-600">
          <Link href="/instituciones" className="text-slate-700 hover:underline">Instituciones</Link>
          <span className="mx-2">&gt;</span>
          <span className="font-medium text-slate-900">{display(institution.name)}</span>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{display(institution.name)}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{display(institution.type)}</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{display(institution.industry)}</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{display(institution.region)}</span>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              ID Institución: <span className="font-medium text-slate-900">{display(institution.id)}</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {resumenEntries.map((entry) => (
                  <div key={entry.label} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <div className="text-sm text-gray-500">{entry.label}</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">{entry.value}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "asociadas" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Proyectos asociados</h2>
                  {projects.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">-</div>
                  ) : (
                    <>
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {visibleProjects.map((project, index) => (
                          <Link
                            key={`${project.id}-${index}`}
                            href={project.path}
                            className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 hover:bg-gray-50"
                          >
                            <div className="text-sm font-semibold text-slate-900 hover:underline">{project.title}</div>
                            <div className="mt-2 text-xs text-gray-500">ID: {project.id}</div>
                          </Link>
                        ))}
                      </div>
                      {projects.length > MAX_ITEMS && (
                        <div className="mt-4">
                          <Link
                            href={`?tab=asociadas&showAllProjects=${showAllProjects ? "0" : "1"}&showAllTech=${showAllTech ? "1" : "0"}`}
                            className="text-sm font-medium text-red-700 hover:underline"
                          >
                            {showAllProjects ? "Ver menos" : "Ver todos"}
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Tecnologías asociadas</h2>
                  {technologies.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">-</div>
                  ) : (
                    <>
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {visibleTechnologies.map((tech, index) => (
                          <Link
                            key={`${tech.id}-${index}`}
                            href={tech.path}
                            className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 hover:bg-gray-50"
                          >
                            <div className="text-sm font-semibold text-slate-900 hover:underline">{tech.title}</div>
                            <div className="mt-2 text-xs text-gray-500">ID: {tech.id}</div>
                          </Link>
                        ))}
                      </div>
                      {technologies.length > MAX_ITEMS && (
                        <div className="mt-4">
                          <Link
                            href={`?tab=asociadas&showAllProjects=${showAllProjects ? "1" : "0"}&showAllTech=${showAllTech ? "0" : "1"}`}
                            className="text-sm font-medium text-red-700 hover:underline"
                          >
                            {showAllTech ? "Ver menos" : "Ver todos"}
                          </Link>
                        </div>
                      )}
                    </>
                  )}

                  {associations.technologies.suggested.length > 0 && (
                    <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
                      <div className="text-xs font-semibold text-amber-800">Posibles coincidencias (revisar)</div>
                      <ul className="mt-2 space-y-1 text-sm text-amber-900">
                        {associations.technologies.suggested.map((item) => (
                          <li key={`tech-s-${item.id}`}>{item.name} <span className="text-xs text-amber-700">({item.score.toFixed(2)})</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {associations.projects.suggested.length > 0 && (
                  <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
                    <div className="text-xs font-semibold text-amber-800">Posibles proyectos (revisar)</div>
                    <ul className="mt-2 space-y-1 text-sm text-amber-900">
                      {associations.projects.suggested.map((item) => (
                        <li key={`proj-s-${item.id}`}>{item.name} <span className="text-xs text-amber-700">({item.score.toFixed(2)})</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
