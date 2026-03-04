import TopNavigation from "../../../components/TopNavigation";
import TechnologiesLandingDashboard from "../../../components/TechnologiesLandingDashboard";
import { getAllTechnologies } from "../../../lib/tecnologias";
import { getAllResearchers } from "../../../lib/investigadores";
import { getTechnologyAssociations } from "../../../lib/entityLinks";
import { getTRLByTecnologiaNormalized } from "../../../lib/trl";
import { getAllProjects } from "../../../lib/proyectos";
import { normalizeText } from "../../../lib/normalize";

type LeaderGender = "Femenino" | "Masculino" | "Sin dato";

const FEMALE_NAME_HINTS = new Set([
  "pamela",
  "camila",
  "daniela",
  "karen",
  "silvana",
  "josefina",
  "ximena",
  "consuelo",
  "alejandra",
  "carolina",
  "fernanda",
  "isabel",
  "maria",
  "paula",
  "andrea",
  "claudia",
  "veronica",
  "catalina",
  "francisca",
  "valentina",
  "sofia",
  "soledad",
]);

const MALE_NAME_HINTS = new Set([
  "juan",
  "jose",
  "pedro",
  "pablo",
  "diego",
  "felipe",
  "sebastian",
  "matias",
  "francisco",
  "cristian",
  "christian",
  "claudio",
  "ricardo",
  "andres",
  "luis",
  "miguel",
  "rodrigo",
  "jorge",
  "carlos",
  "alvaro",
  "gonzalo",
  "jaime",
  "rafael",
  "eduardo",
  "manuel",
  "oscar",
  "vicente",
  "tomas",
  "ignacio",
  "nicolas",
]);

function normalizeNameToken(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferLeadershipGenderByName(value: string): LeaderGender {
  const normalized = normalizeNameToken(value);
  if (!normalized) return "Sin dato";

  const tokens = normalized.split(" ").filter(Boolean);
  if (tokens.some((token) => FEMALE_NAME_HINTS.has(token))) return "Femenino";
  if (tokens.some((token) => MALE_NAME_HINTS.has(token))) return "Masculino";
  return "Sin dato";
}

function normalizeGender(value: string): LeaderGender {
  const normalized = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

  if (normalized.includes("femen")) return "Femenino";
  if (normalized.includes("mascul")) return "Masculino";
  return "Sin dato";
}

function resolveLeaderGender(rawGender: string, leaderName: string): LeaderGender {
  const explicitGender = normalizeGender(rawGender);
  if (explicitGender !== "Sin dato") return explicitGender;
  return inferLeadershipGenderByName(leaderName);
}

function projectNameCandidates(row: Record<string, string>): string[] {
  return [row.TECN_NombreProyecto, row.TECN_NombreTecnologia]
    .map((value) => normalizeText(value || ""))
    .filter(Boolean);
}

export default async function Page() {
  const rows = await getAllTechnologies();
  const researchers = await getAllResearchers();
  const projects = await getAllProjects();
  const researchersById = new Map(researchers.map((researcher) => [String(researcher.id), researcher]));
  const researchersByName = new Map(researchers.map((researcher) => [normalizeText(researcher.name), researcher]));

  const projectsByName = new Map<string, (typeof projects)[number]>();
  for (const project of projects) {
    const candidates = [
      normalizeText(project.title || ""),
      normalizeText(project.raw.PROY_NombreProyecto || ""),
      normalizeText(project.raw.PROY_TituloProyecto || ""),
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (!projectsByName.has(candidate)) projectsByName.set(candidate, project);
    }
  }

  const records = await Promise.all(
    rows.map(async (row, idx) => {
      const id = (row.TECN_ID || row.TECN_N || row.id || row.ID || Object.values(row)[0] || "").toString();
      const title = (row.TECN_NombreTecnologia || row.TECN_NombreProyecto || row.title || row.nombre || row.name || row.titulo || "Untitled").toString();
      const associations = await getTechnologyAssociations(id);
      const leadInvestigator = associations.investigators.auto[0];
      const associationResearcher = leadInvestigator ? researchersById.get(leadInvestigator.id) : null;

      const matchedProject = projectNameCandidates(row)
        .map((candidate) => projectsByName.get(candidate))
        .find((project): project is (typeof projects)[number] => Boolean(project));

      const projectInvestigatorName = String(matchedProject?.investigador || matchedProject?.raw.PROY_InvestigadorLiderUANDES || "").trim();
      const researcherFromProject = researchersByName.get(normalizeText(projectInvestigatorName));
      const researcher = researcherFromProject || associationResearcher || null;

      const faculty =
        (researcher?.raw.INV_Facultad_Unidad || "Sin información").toString();

      const leaderName = String(researcher?.name || projectInvestigatorName || leadInvestigator?.name || "").trim();
      const leaderGender = resolveLeaderGender(researcher?.raw.INV_Genero || "", leaderName);

      const trlByYear = await getTRLByTecnologiaNormalized(title);
      const latestWithTrl = [...trlByYear]
        .sort((a, b) => b.year - a.year)
        .find((entry) => typeof entry.trl === "number");

      return {
        id: id || `tech-${idx + 1}`,
        title,
        faculty,
        leaderGender,
        trl: latestWithTrl?.trl ?? null,
      };
    }),
  );

  return (
    <div className="min-h-screen bg-transparent">
      <TopNavigation active="portafolio" />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <TechnologiesLandingDashboard records={records} />
      </main>
    </div>
  );
}
