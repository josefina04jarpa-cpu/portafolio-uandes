import { getAllResearchers } from "../../../lib/investigadores";
import { getAllProjects, type ProjectRow } from "../../../lib/proyectos";
import ResearchersCatalog from "../../../components/ResearchersCatalog";
import TopNavigation from "../../../components/TopNavigation";

function normalizeBasic(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
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

function parseAdjudicadoFromRaw(project: ProjectRow): boolean {
  const value = String(project.raw["PROY_Adjudicado"] || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

  return ["si", "yes", "true", "1", "adjudicado"].includes(value);
}

export default async function Page() {
  const [rows, allProjects] = await Promise.all([getAllResearchers(), getAllProjects()]);

  const items = rows
    .map((r) => {
      const name = String(r.name || "").trim();
      const fullName = String(r.raw.INV_NombreCompleto || "").trim() || name;

      const leaderProjects = allProjects.filter((project) => isLeaderProjectForResearcher(project, fullName, name));
      const postulados = new Set(
        leaderProjects
          .map((project) => String(project.raw["PROY_NombreProyecto"] || "").trim())
          .filter(Boolean),
      );
      const adjudicados = new Set(
        leaderProjects
          .filter((project) => parseAdjudicadoFromRaw(project))
          .map((project) => String(project.raw["PROY_NombreProyecto"] || "").trim())
          .filter(Boolean),
      );

      return {
        id: String(r.id || "").trim(),
        name,
        faculty: String(r.raw.INV_Facultad_Unidad || "").trim() || "Sin información",
        unit: String(r.raw.INV_Facultad_Unidad2 || "").trim() || "Sin información",
        email: String(r.email || "").trim(),
        gender: String(r.raw.INV_Genero || "").trim(),
        postuladosCount: postulados.size,
        adjudicadosCount: adjudicados.size,
      };
    })
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
