import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import { resolveDataFile } from "./dataPath";
import { normalizeRelationLabel } from "./entityLinks";

export type InvolucradosRow = {
  PROI_N: string;
  PROI_NombreProyecto: string;
  PROI_Rol_Invol: string;
  PROI_EsExterno: string;
  PROI_NombreInvolucrado: string;
  PROI_HrsAsignadas: string;
  PROI_InstInvolucrada: string;
  PROI_RUTInstitucionInv: string;
  PROI_NombreContacto: string;
  PROI_CorreoContacto: string;
  PROI_TelefonoContacto: string;
  PROI_FechaInicioIncorp: string;
  PROI_FechaFinInvol: string;
  PROI_Comentario: string;
};

const INVOLUCRADOS_KEYS: Array<keyof InvolucradosRow> = [
  "PROI_N",
  "PROI_NombreProyecto",
  "PROI_Rol_Invol",
  "PROI_EsExterno",
  "PROI_NombreInvolucrado",
  "PROI_HrsAsignadas",
  "PROI_InstInvolucrada",
  "PROI_RUTInstitucionInv",
  "PROI_NombreContacto",
  "PROI_CorreoContacto",
  "PROI_TelefonoContacto",
  "PROI_FechaInicioIncorp",
  "PROI_FechaFinInvol",
  "PROI_Comentario",
];

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim();
}

function normalizeValue(value: unknown): string {
  return String(value ?? "").trim();
}

function detectDelimiter(firstLine: string): ";" | "," | "\t" {
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  if (tabs > semicolons && tabs > commas) return "\t";
  if (commas > semicolons) return ",";
  return ";";
}

function normalizeRecord(record: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    out[normalizeHeader(key)] = normalizeValue(value);
  }
  return out;
}

function toInvolucrados(raw: Record<string, string>): InvolucradosRow {
  const out = {} as InvolucradosRow;

  for (const key of INVOLUCRADOS_KEYS) {
    out[key] = normalizeValue(raw[key]);
  }

  return out;
}

export async function getInvolucrados(): Promise<InvolucradosRow[]> {
  const path = resolveDataFile("Proy-Involucrados.csv");
  const rawCsv = await readFile(path, "utf8");

  const firstLine = rawCsv.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);

  const records = parse(rawCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    delimiter,
    relax_column_count: true,
  }) as Record<string, unknown>[];

  return records
    .map((record) => normalizeRecord(record))
    .map((record) => toInvolucrados(record));
}

// Relation 12: Involucrados.PROI_NombreProyecto → Proyectos.PROY_NombreProyecto
export async function getInvolucradosByProyectoNormalized(nombreProyecto: string): Promise<InvolucradosRow[]> {
  const involucrados = await getInvolucrados();

  const normalized = normalizeRelationLabel(nombreProyecto);

  return involucrados.filter((inv) => {
    const invNorm = normalizeRelationLabel(inv.PROI_NombreProyecto);
    return invNorm === normalized;
  });
}

// Relation 13: Involucrados.PROI_NombreInvolucrado → Investigadores.INV_NombreCompleto
export async function getInvolucradosByInvestigadorNormalized(nombreInvestigador: string): Promise<InvolucradosRow[]> {
  const involucrados = await getInvolucrados();

  const normalized = normalizeRelationLabel(nombreInvestigador);

  return involucrados.filter((inv) => {
    const invNorm = normalizeRelationLabel(inv.PROI_NombreInvolucrado);
    return invNorm === normalized;
  });
}

// Relation 14: Involucrados.PROI_InstInvolucrada → Instituciones.INST_NombreFantasia
export async function getInvolucradosByInstitucionNormalized(nombreInstitucion: string): Promise<InvolucradosRow[]> {
  const involucrados = await getInvolucrados();

  const normalized = normalizeRelationLabel(nombreInstitucion);

  return involucrados.filter((inv) => {
    const invNorm = normalizeRelationLabel(inv.PROI_InstInvolucrada);
    return invNorm === normalized;
  });
}
