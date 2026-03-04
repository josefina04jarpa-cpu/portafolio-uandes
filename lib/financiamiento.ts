import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import { resolveDataFile } from "./dataPath";
import { normalizeRelationLabel } from "./entityLinks";

export type FinanciamientoRow = {
  PROF_N: string;
  PROF_NombreProyecto: string;
  PROF_TipoFinanciamiento: string;
  PROF_InstitucionOtorgadoraFinanciamiento: string;
  PROF_FondoObtenido: string;
  PROF_DetalleFondo: string;
  PROF_PeriodoVigenciaFondo: string;
  PROF_EsBeneficiario: string;
  PROF_InstitucReceptora: string;
  PROF_SubsidioMonto: string;
  PROF_NoIncrementalMonto: string;
  PROF_IncrementalMonto: string;
  PROF_Total: string;
  PROF_Comentario: string;
};

const FINANCIAMIENTO_KEYS: Array<keyof FinanciamientoRow> = [
  "PROF_N",
  "PROF_NombreProyecto",
  "PROF_TipoFinanciamiento",
  "PROF_InstitucionOtorgadoraFinanciamiento",
  "PROF_FondoObtenido",
  "PROF_DetalleFondo",
  "PROF_PeriodoVigenciaFondo",
  "PROF_EsBeneficiario",
  "PROF_InstitucReceptora",
  "PROF_SubsidioMonto",
  "PROF_NoIncrementalMonto",
  "PROF_IncrementalMonto",
  "PROF_Total",
  "PROF_Comentario",
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

function toFinanciamiento(raw: Record<string, string>): FinanciamientoRow {
  const out = {} as FinanciamientoRow;

  for (const key of FINANCIAMIENTO_KEYS) {
    out[key] = normalizeValue(raw[key]);
  }

  return out;
}

export async function getFinanciamiento(): Promise<FinanciamientoRow[]> {
  const path = resolveDataFile("Proy-Financiamiento.csv");
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
    .map((record) => toFinanciamiento(record));
}

// Relation 10: Financiamiento.PROF_NombreProyecto → Proyectos.PROY_NombreProyecto
export async function getFinanciamientoByProyectoNormalized(nombreProyecto: string): Promise<FinanciamientoRow[]> {
  const rows = await getFinanciamiento();
  const normalized = normalizeRelationLabel(nombreProyecto);

  return rows.filter((row) => normalizeRelationLabel(row.PROF_NombreProyecto) === normalized);
}

// Relation 11: Financiamiento.PROF_InstitucReceptora → Instituciones.INST_NombreFantasia
export async function getFinanciamientoByInstitucionNormalized(nombreInstitucion: string): Promise<FinanciamientoRow[]> {
  const rows = await getFinanciamiento();
  const normalized = normalizeRelationLabel(nombreInstitucion);

  return rows.filter((row) => normalizeRelationLabel(row.PROF_InstitucReceptora) === normalized);
}
