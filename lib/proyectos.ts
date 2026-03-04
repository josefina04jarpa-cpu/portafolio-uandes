import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import { resolveDataFile } from "./dataPath";

export type ProjectRaw = Record<string, string>;

export type ProjectRow = {
  id: string;
  title: string;
  disciplinaPrincipal: string;
  investigador: string;
  adjudicado: boolean;
  estadoPostulacion: "Adjudicado" | "Postulado no adjudicado";
  description: string;
  tecnologiasAsociadas: string[];
  badges: string[];
  raw: ProjectRaw;
};

function normalizeRecord(record: Record<string, unknown>): ProjectRaw {
  const out: ProjectRaw = {};
  for (const key of Object.keys(record)) {
    out[String(key).trim()] = String(record[key] ?? "").trim();
  }
  return out;
}

function pick(raw: ProjectRaw, keys: string[]): string {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function sanitizeId(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isMissing(value: string): boolean {
  const text = String(value || "").trim().toLowerCase();
  return !text || text === "n/a" || text === "na" || text === "#n/a" || text === "-";
}

function splitList(value: string): string[] {
  return String(value || "")
    .split(/[,;|\n]/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function normalizeAdjudicado(value: string): boolean {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

  if (["si", "yes", "true", "1", "adjudicado"].includes(normalized)) return true;
  if (["no", "false", "0", "no adjudicado", "postulado"].includes(normalized)) return false;
  return false;
}

export function normalizeRow(raw: ProjectRaw, index = 0): ProjectRow {
  const firstColumnValue = Object.values(raw)[0] ? String(Object.values(raw)[0]).trim() : "";

  const idCandidate = pick(raw, [
    "PROY_ID",
    "PROY_N",
    "PROY_CodigoProyecto",
    "id",
    "ID",
    "PROYECTO_ID",
    "Codigo",
    "Código",
  ]);

  const title =
    pick(raw, [
      "Nombre del proyecto",
      "PROY_Nombre",
      "PROY_NombreProyecto",
      "PROY_TituloProyecto",
      "Proyecto",
      "Nombre",
      "Title",
      "title",
    ]) || "";

  const disciplinaPrincipal =
    pick(raw, [
      "Disciplina principal",
      "PROY_DisciplinaPrincipal",
      "Disciplina",
      "Área",
      "Area",
      "MainDiscipline",
    ]) || "";

  const investigador =
    pick(raw, [
      "Investigador",
      "PI",
      "Investigador principal",
      "Director",
      "Responsable",
      "PROY_InvestigadorLiderUANDES",
    ]) || "";

  const adjudicadoRaw = pick(raw, ["PROY_Adjudicado", "Adjudicado", "EstadoAdjudicacion"]) || "";
  const adjudicado = normalizeAdjudicado(adjudicadoRaw);
  const estadoPostulacion: ProjectRow["estadoPostulacion"] = adjudicado ? "Adjudicado" : "Postulado no adjudicado";

  const description = pick(raw, ["PROY_Descripcion", "Descripcion", "Descripción", "Resumen", "Summary"]) || "";

  const tecnologiasAsociadas = splitList(
    pick(raw, ["PROY_NombreTecnologia", "TecnologiasAsociadas", "Tecnologías asociadas", "Tecnologias", "TechnologyIds"]),
  );

  const badges = splitList(
    pick(raw, ["PROY_FondoPostulado", "PROY_TipoFinancPostulado", "PROY_InstitucionFondoPostulado", "PROY_AlcanceTerritorial"]),
  ).slice(0, 4);

  let id = !isMissing(idCandidate) ? idCandidate : firstColumnValue;
  if (isMissing(id)) {
    const stableBase = sanitizeId(`${title}-${disciplinaPrincipal}`);
    id = stableBase || `proyecto-${index + 1}`;
  }

  return {
    id: String(id),
    title,
    disciplinaPrincipal,
    investigador,
    adjudicado,
    estadoPostulacion,
    description,
    tecnologiasAsociadas,
    badges,
    raw,
  };
}

function isEmptyRawRow(raw: ProjectRaw): boolean {
  return Object.values(raw).every((value) => isMissing(value));
}

function isValidProjectRow(row: ProjectRow): boolean {
  const titleMissing = isMissing(row.title);
  const idMissing = isMissing(row.id);

  if (titleMissing) return false;
  if (idMissing && titleMissing) return false;
  return true;
}

export async function getAllProjects(): Promise<ProjectRow[]> {
  const path = resolveDataFile("Proyectos.csv");
  const rawCsv = await readFile(path, "utf8");

  const records = parse(rawCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    delimiter: ";",
    relax_column_count: true,
  }) as Record<string, unknown>[];

  return records
    .map((record, index) => ({ raw: normalizeRecord(record), index }))
    .filter(({ raw }) => !isEmptyRawRow(raw))
    .map(({ raw, index }) => normalizeRow(raw, index))
    .filter((row) => isValidProjectRow(row));
}

export async function getProjectById(id: string): Promise<ProjectRow | null> {
  const all = await getAllProjects();
  const target = String(id || "").trim().toLowerCase();
  return all.find((project) => project.id.toLowerCase() === target) ?? null;
}
