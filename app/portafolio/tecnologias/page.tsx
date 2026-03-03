import TopNavigation from "../../../components/TopNavigation";
import TechnologiesLandingDashboard from "../../../components/TechnologiesLandingDashboard";
import { getAllTechnologies } from "../../../lib/tecnologias";
import { getAllResearchers } from "../../../lib/investigadores";
import { getTechnologyAssociations } from "../../../lib/entityLinks";
import { getTRLByTechnologyName } from "../../../lib/trl";

type LeaderGender = "Femenino" | "Masculino" | "Sin dato";

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

export default async function Page() {
  const rows = await getAllTechnologies();
  const researchers = await getAllResearchers();
  const researchersById = new Map(researchers.map((researcher) => [String(researcher.id), researcher]));

  const records = await Promise.all(
    rows.map(async (row, idx) => {
      const id = (row.TECN_ID || row.TECN_N || row.id || row.ID || Object.values(row)[0] || "").toString();
      const title = (row.TECN_NombreTecnologia || row.TECN_NombreProyecto || row.title || row.nombre || row.name || row.titulo || "Untitled").toString();
      const associations = await getTechnologyAssociations(id);
      const leadInvestigator = associations.investigators.auto[0];
      const researcher = leadInvestigator ? researchersById.get(leadInvestigator.id) : null;

      const faculty =
        (researcher?.raw.INV_Facultad || researcher?.raw.INV_Facultad_Unidad || researcher?.unit || row.TECN_Industria || "Sin información").toString();

      const leaderGender = normalizeGender(researcher?.raw.INV_Sexo || "");

      const trlByYear = await getTRLByTechnologyName(title);
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
