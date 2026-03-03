import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import { TEAM_ACCOUNTS } from "./auth";
import { resolveDataFile } from "./dataPath";
import { normalizeText, splitCandidateValues } from "./normalize";
import { getAllProjects, type ProjectRow } from "./proyectos";

type CamilaCsvRow = Record<string, string>;

export type CamilaManagedProject = {
  title: string;
  adjudicado: boolean;
  projectCode: string;
  year: string;
  linkedProjectId: string | null;
  executiveName: string;
  executiveEmail: string;
};

const CAMILA_NAME = "Camila Adonis";
const CAMILA_EMAIL = "cadonisr@uandes.cl";

function normalizeRecord(record: Record<string, unknown>): CamilaCsvRow {
  const out: CamilaCsvRow = {};
  for (const key of Object.keys(record)) {
    out[String(key).trim()] = String(record[key] ?? "").trim();
  }
  return out;
}

function normalizeCode(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function parseBooleanSiNo(value: string): boolean {
  const normalized = normalizeText(value);
  return normalized === "si" || normalized === "yes" || normalized === "true";
}

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

async function getCamilaCsvRows(): Promise<CamilaCsvRow[]> {
  const path = resolveDataFile("Portafolio Proyectos Internos(FAIN) camila adonis.csv");
  const rawCsv = await readFile(path, "utf8");

  const lines = rawCsv.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.trim().startsWith("Tecnología;Descripción;Adjudicado;"));
  if (headerIndex < 0) return [];

  const parsed = parse(lines.slice(headerIndex).join("\n"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    delimiter: ";",
    relax_column_count: true,
  }) as Record<string, unknown>[];

  return parsed.map((record) => normalizeRecord(record));
}

function resolveLinkedProjectId(row: CamilaCsvRow, projects: ProjectRow[]): string | null {
  const code = normalizeCode(row["Código Proyecto"] || "");
  const title = normalizeText(row["Tecnología"] || "");

  if (code) {
    const byCode = projects.find((project) => normalizeCode(project.raw.PROY_CodigoProyecto || "") === code);
    if (byCode) return byCode.id;
  }

  if (title) {
    const byTitle = projects.find((project) => {
      const candidates = [project.title, project.raw.PROY_NombreProyecto, project.raw.PROY_TituloProyecto]
        .map((value) => normalizeText(value || ""))
        .filter(Boolean);
      return candidates.some((candidate) => candidate === title);
    });

    if (byTitle) return byTitle.id;
  }

  return null;
}

export async function getCamilaManagedProjects(): Promise<CamilaManagedProject[]> {
  const [rows, projects] = await Promise.all([getCamilaCsvRows(), getAllProjects()]);

  return rows
    .map((row) => ({
      title: String(row["Tecnología"] || "").trim(),
      adjudicado: parseBooleanSiNo(String(row["Adjudicado"] || "")),
      projectCode: String(row["Código Proyecto"] || "").trim(),
      year: String(row["Año Concurso"] || "").trim(),
      linkedProjectId: resolveLinkedProjectId(row, projects),
      executiveName: CAMILA_NAME,
      executiveEmail: CAMILA_EMAIL,
    }))
    .filter((row) => row.title)
    .sort((first, second) => Number(second.year || 0) - Number(first.year || 0));
}

export async function getExecutiveContactForProject(project: ProjectRow): Promise<{ name: string; email: string } | null> {
  const camilaProjects = await getCamilaManagedProjects();
  const isCamilaManaged = camilaProjects.some((item) => item.linkedProjectId === project.id);
  if (isCamilaManaged) {
    return { name: CAMILA_NAME, email: CAMILA_EMAIL };
  }

  const memberByName = new Map(
    TEAM_ACCOUNTS.map((member) => [normalizeText(member.name), { name: member.name, email: member.email }]),
  );

  const executiveSources = [
    String(project.raw.PROY_ResponsableSeguimientoTecnico || ""),
    String(project.raw.PROY_ResponsablePostulacion || ""),
    String(project.raw.PROY_OCO || ""),
  ].filter(Boolean);

  for (const source of executiveSources) {
    for (const candidate of splitExecutiveCandidates(source)) {
      const normalizedCandidate = normalizeText(candidate);
      const direct = memberByName.get(normalizedCandidate);
      if (direct) return direct;

      for (const [memberKey, member] of memberByName.entries()) {
        if (memberKey.includes(normalizedCandidate) || normalizedCandidate.includes(memberKey)) {
          return member;
        }
      }
    }
  }

  return null;
}
