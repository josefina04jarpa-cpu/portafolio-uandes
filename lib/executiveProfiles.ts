import { TEAM_ACCOUNTS, type TeamAccount } from "./auth";
import { normalizeText, splitCandidateValues } from "./normalize";
import { getAllProjects, type ProjectRow } from "./proyectos";

export type ExecutiveManagedProject = {
  id: string;
  title: string;
  projectCode: string;
  year: string;
  adjudicado: boolean;
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

  const direct = membersByName.get(normalizedCandidate);
  if (direct) return [direct];

  const matches: TeamAccount[] = [];
  for (const [memberKey, member] of membersByName.entries()) {
    if (!memberKey || !normalizedCandidate) continue;
    if (memberKey.includes(normalizedCandidate) || normalizedCandidate.includes(memberKey)) {
      matches.push(member);
    }
  }

  return matches;
}

function getExecutivesForProject(project: ProjectRow, membersByName: Map<string, TeamAccount>): TeamAccount[] {
  const technicalResponsible = String(project.raw.PROY_ResponsableSeguimientoTecnico || "").trim();
  if (!technicalResponsible) return [];

  const resolved = splitExecutiveCandidates(technicalResponsible)
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
  const membersByName = new Map(TEAM_ACCOUNTS.map((member) => [normalizeText(member.name), member]));

  return projects
    .filter((project) => getExecutivesForProject(project, membersByName).some((member) => member.email.toLowerCase() === targetEmail))
    .map((project) => ({
      id: project.id,
      title: String(project.title || project.raw.PROY_NombreProyecto || project.raw.PROY_TituloProyecto || "").trim(),
      projectCode: String(project.raw.PROY_CodigoProyecto || "").trim(),
      year: String(project.raw.PROY_AnoConvocatoria || "").trim(),
      adjudicado: project.adjudicado,
    }))
    .sort((first, second) => Number(second.year || 0) - Number(first.year || 0));
}

export async function getExecutiveContactForProject(project: ProjectRow): Promise<{ name: string; email: string } | null> {
  const membersByName = new Map(TEAM_ACCOUNTS.map((member) => [normalizeText(member.name), member]));
  const executives = getExecutivesForProject(project, membersByName);
  if (executives.length === 0) return null;

  return {
    name: executives[0].name,
    email: executives[0].email,
  };
}
