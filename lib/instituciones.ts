import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import { resolveDataFile } from "./dataPath";

export type Institution = {
  id: string;
  name: string;
  type: string;
  industry: string;
  region: string;
  raw: Record<string, string>;
};

function normalizeRecord(record: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(record)) {
    out[String(key).trim()] = String(record[key] ?? "").trim();
  }
  return out;
}

function pick(raw: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function normalizeDisplay(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "-";
  const lower = text.toLowerCase();
  if (lower === "n/a" || lower === "na" || lower === "#n/a" || lower === "null" || lower === "-") return "-";
  return text;
}

function sanitizeIdPart(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isMissingId(value: string): boolean {
  const text = String(value || "").trim().toLowerCase();
  return !text || text === "n/a" || text === "na" || text === "#n/a" || text === "null" || text === "-" || text === "0";
}

function normalizeInstitutionRow(raw: Record<string, string>, idx: number): Institution {
  const firstColumnValue = Object.values(raw)[0] ? String(Object.values(raw)[0]).trim() : "";

  const idCandidate = pick(raw, [
    "INST_ID",
    "INSTITUCION_ID",
    "ID",
    "id",
    "Codigo",
    "code",
    "INST_N",
  ]) || firstColumnValue;

  const name = normalizeDisplay(
    pick(raw, ["NombreInstitucion", "Institucion", "Nombre", "name", "INST_NombreFantasia", "INST_RazonSocial"]),
  );

  const type = normalizeDisplay(pick(raw, ["Tipo", "TipoInstitucion", "type", "INST_Tipo"]));
  const industry = normalizeDisplay(pick(raw, ["Industria", "Sector", "industry", "INST_Industria"]));
  const region = normalizeDisplay(pick(raw, ["Region", "Región", "region", "INST_Region"]));

  let id = String(idCandidate || "").trim();
  if (isMissingId(id)) {
    const namePart = sanitizeIdPart(name === "-" ? `institucion-${idx + 1}` : name);
    id = `${idx}-${namePart || `institucion-${idx + 1}`}`;
  }

  return {
    id,
    name,
    type,
    industry,
    region,
    raw,
  };
}

export async function getAllInstitutions(): Promise<Institution[]> {
  const path = resolveDataFile("Instituciones.csv");
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
    .map((record, idx) => normalizeInstitutionRow(normalizeRecord(record), idx))
    .filter((row) => row.name !== "-");
}

export async function getInstitutionById(id: string): Promise<Institution | null> {
  const all = await getAllInstitutions();
  const target = String(id || "").trim().toLowerCase();
  return all.find((institution) => institution.id.toLowerCase() === target) ?? null;
}
