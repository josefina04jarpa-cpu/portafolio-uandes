import { getAllTeamAccounts, type TeamAccount } from "./auth";
import { normalizeText, splitCandidateValues } from "./normalize";
import { getAllProjects, type ProjectRow } from "./proyectos";

export type ExecutiveManagedProject = {
  id: string;
  title: string;
  projectCode: string;
  year: string;
  adjudicado: boolean;
  responsibilityType?: "postulacion" | "seguimiento" | "both";
};

function splitExecutiveCandidates(value: string): string[] {
  return splitCandidateValues(value)
    .flatMap((candidate) =>
      String(candidate || "")
        .split(/[\/|]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .map((candidate) => candidate.replace(/^\*+/, "").trim())
    .filter(Boolean);
}

function resolveTeamMemberByCandidate(candidate: string, membersByName: Map<string, TeamAccount>): TeamAccount[] {
  const normalizedCandidate = normalizeText(candidate);
  if (!normalizedCandidate) return [];

  // Only exact match - no fuzzy matching
  const direct = membersByName.get(normalizedCandidate);
  return direct ? [direct] : [];
}

function getExecutivesForProject(project: ProjectRow, membersByName: Map<string, TeamAccount>): TeamAccount[] {
  const technicalResponsible = String(project.raw.PROY_ResponsableSeguimientoTecnico || "").trim();
  const postulationResponsible = String(project.raw.PROY_ResponsablePostulacion || "").trim();
  
  const allCandidates = [
    ...splitExecutiveCandidates(technicalResponsible),
    ...splitExecutiveCandidates(postulationResponsible),
  ];

  const resolved = allCandidates
    .flatMap((candidate) => resolveTeamMemberByCandidate(candidate, membersByName));

  const uniqueByEmail = new Map<string, TeamAccount>();
  for (const member of resolved) {
    uniqueByEmail.set(member.email.toLowerCase(), member);
  }

  return Array.from(uniqueByEmail.values());
}

export async function getExecutiveManagedProjectsByEmail(email: string): Promise<ExecutiveManagedProject[]> {
  const targetEmail = String(email || "").trim().toLowerCase();
  if (!targetEmail) return [];

  const [projects] = await Promise.all([getAllProjects()]);
  const teamAccounts = getAllTeamAccounts();
  const membersByName = new Map(teamAccounts.map((member) => [normalizeText(member.name), member]));

  const result: ExecutiveManagedProject[] = [];

  for (const project of projects) {
    const technicalResponsible = String(project.raw.PROY_ResponsableSeguimientoTecnico || "").trim();
    const postulationResponsible = String(project.raw.PROY_ResponsablePostulacion || "").trim();

    // Check if executive is in technical responsible
    const techCandidates = splitExecutiveCandidates(technicalResponsible);
    const isTechResponsible = techCandidates
      .flatMap((candidate) => resolveTeamMemberByCandidate(candidate, membersByName))
      .some((member) => member.email.toLowerCase() === targetEmail);

    // Check if executive is in postulation responsible
    const postCandidates = splitExecutiveCandidates(postulationResponsible);
    const isPostResponsible = postCandidates
      .flatMap((candidate) => resolveTeamMemberByCandidate(candidate, membersByName))
      .some((member) => member.email.toLowerCase() === targetEmail);

    if (isTechResponsible || isPostResponsible) {
      const responsibilityType = 
        isTechResponsible && isPostResponsible ? "both" :
        isPostResponsible ? "postulacion" :
        "seguimiento";

      result.push({
        id: project.id,
        title: String(project.title || project.raw.PROY_NombreProyecto || project.raw.PROY_TituloProyecto || "").trim(),
        projectCode: String(project.raw.PROY_CodigoProyecto || "").trim(),
        year: String(project.raw.PROY_AnoConvocatoria || "").trim(),
        adjudicado: project.adjudicado,
        responsibilityType,
      });
    }
  }

  return result.sort((first, second) => Number(second.year || 0) - Number(first.year || 0));
}

export async function getExecutiveContactForProject(project: ProjectRow): Promise<{ name: string; email: string } | null> {
  const teamAccounts = getAllTeamAccounts();
  const membersByName = new Map(teamAccounts.map((member) => [normalizeText(member.name), member]));
  const executives = getExecutivesForProject(project, membersByName);
  if (executives.length === 0) return null;

  return {
    name: executives[0].name,
    email: executives[0].email,
  };
}

export type ProjectResponsible = {
  name: string;
  email: string;
  role: string;
  type: "postulacion" | "seguimiento";
};

export async function getProjectResponsibles(project: ProjectRow): Promise<ProjectResponsible[]> {
  const teamAccounts = getAllTeamAccounts();
  const membersByName = new Map(teamAccounts.map((member) => [normalizeText(member.name), member]));

  const technicalResponsible = String(project.raw.PROY_ResponsableSeguimientoTecnico || "").trim();
  const postulationResponsible = String(project.raw.PROY_ResponsablePostulacion || "").trim();

  const responsibles: ProjectResponsible[] = [];

  // Resolve postulation responsible
  if (postulationResponsible) {
    const candidates = splitExecutiveCandidates(postulationResponsible);
    const resolved = candidates
      .flatMap((candidate) => resolveTeamMemberByCandidate(candidate, membersByName))
      .filter(Boolean);

    for (const member of resolved) {
      responsibles.push({
        name: member.name,
        email: member.email,
        role: member.role,
        type: "postulacion",
      });
    }
  }

  // Resolve technical responsible
  if (technicalResponsible) {
    const candidates = splitExecutiveCandidates(technicalResponsible);
    const resolved = candidates
      .flatMap((candidate) => resolveTeamMemberByCandidate(candidate, membersByName))
      .filter(Boolean);

    for (const member of resolved) {
      // Avoid duplicates - if same person is in both roles, only show once with both types
      const existing = responsibles.find((r) => r.email.toLowerCase() === member.email.toLowerCase());
      if (!existing) {
        responsibles.push({
          name: member.name,
          email: member.email,
          role: member.role,
          type: "seguimiento",
        });
      }
    }
  }

  return responsibles;
}
