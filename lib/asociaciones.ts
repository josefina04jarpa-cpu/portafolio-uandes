import type { Institution } from "./instituciones";
import { getAllProjects, type ProjectRow } from "./proyectos";
import { getAllTechnologies, type TechRow } from "./tecnologias";

export type Project = ProjectRow;
export type Technology = TechRow;

const ASSOCIATION_FIELD_KEYS = new Set([
  "institucion",
  "institucionid",
  "instid",
  "entidad",
  "entidadcolaboradora",
  "partner",
  "empresa",
  "organizacion",
  "organizacioncolaboradora",
  "organization",
  "organizationpartner",
  "institution",
  "institutionid",
  "institutionpartner",
  "coejecutor",
]);

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeKey(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]/g, "");
}

function splitParts(value: string): string[] {
  return String(value || "")
    .split(/[,;|\n]/)
    .map((part) => normalizeText(part))
    .filter(Boolean);
}

function isMissing(value: string): boolean {
  const text = normalizeText(value);
  return !text || text === "-" || text === "n/a" || text === "na" || text === "#n/a" || text === "null";
}

function shouldUseIdToken(value: string): boolean {
  const token = normalizeText(value);
  if (isMissing(token)) return false;
  if (/[a-z]/.test(token)) return true;
  return token.length >= 4;
}

function isAssociationField(rawKey: string): boolean {
  const key = normalizeKey(rawKey);
  if (!key) return false;
  if (ASSOCIATION_FIELD_KEYS.has(key)) return true;
  return /(institucion|institution|entidad|partner|empresa|organizacion|organization|instid|institucionid|institutionid)/.test(key);
}

function collectInstitutionTokens(institution: Institution): string[] {
  const tokens = new Set<string>();

  const byNamePreference = Object.entries(institution.raw || {})
    .filter(([key]) => /(nombre|razonsocial|institucion|entidad|organizacion|organization|partner)/i.test(key))
    .map(([, value]) => value);

  const baseValues = [institution.name, ...byNamePreference];
  for (const value of baseValues) {
    const normalized = normalizeText(value);
    if (!isMissing(normalized) && normalized.length >= 3) tokens.add(normalized);
  }

  const idCandidates = [institution.id, institution.raw.INSTITUCION_ID, institution.raw.INST_ID, institution.raw.ID];
  for (const value of idCandidates) {
    const normalized = normalizeText(value);
    if (shouldUseIdToken(normalized)) tokens.add(normalized);
  }

  return Array.from(tokens);
}

function rowMatchesInstitution(row: Record<string, string>, institution: Institution): boolean {
  const tokens = collectInstitutionTokens(institution);
  if (tokens.length === 0) return false;

  const candidateValues: string[] = [];

  for (const [key, value] of Object.entries(row)) {
    if (!isAssociationField(key)) continue;

    const parts = splitParts(value);
    if (parts.length === 0) {
      const normalized = normalizeText(value);
      if (!isMissing(normalized)) candidateValues.push(normalized);
      continue;
    }

    candidateValues.push(...parts.filter((part) => !isMissing(part)));
  }

  if (candidateValues.length === 0) return false;

  return candidateValues.some((candidate) => {
    return tokens.some((token) => {
      if (candidate === token) return true;
      if (token.length >= 5) return candidate.includes(token) || token.includes(candidate);
      return false;
    });
  });
}

export async function getProjectsByInstitution(institution: Institution): Promise<Project[]> {
  const projects = await getAllProjects();

  return projects.filter((project) => {
    const title = normalizeText(project.title);
    if (isMissing(title)) return false;
    return rowMatchesInstitution(project.raw, institution);
  });
}

export async function getTechnologiesByInstitution(institution: Institution): Promise<Technology[]> {
  const technologies = await getAllTechnologies();

  return technologies.filter((tech) => {
    const title = normalizeText(
      tech.TECN_NombreTecnologia || tech.TECN_NombreProyecto || tech.TECN_ID || tech.TECN_N || Object.values(tech)[0] || "",
    );
    if (isMissing(title)) return false;
    return rowMatchesInstitution(tech, institution);
  });
}
