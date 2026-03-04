import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import { resolveDataFile } from "./dataPath";

export type ResearcherRaw = Record<string, string>;

export type Researcher = {
  id: string;
  name: string;
  unit: string;
  email: string;
  raw: ResearcherRaw;
};

function normalizeRecord(record: Record<string, unknown>): ResearcherRaw {
  const out: ResearcherRaw = {};
  for (const key of Object.keys(record)) {
    out[String(key).trim()] = String(record[key] ?? "").trim();
  }
  return out;
}

function pick(raw: ResearcherRaw, keys: string[]): string {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function sanitizeIdPart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildStableId(name: string, unit: string, fallbackIndex: number): string {
  const namePart = sanitizeIdPart(name || "investigador");
  const unitPart = sanitizeIdPart(unit || "sin-unidad");
  const base = [namePart, unitPart].filter(Boolean).join("-");
  return base || `investigador-${fallbackIndex + 1}`;
}

function isMissingId(value: string): boolean {
  const text = String(value || "").trim().toLowerCase();
  return !text || text === "n/a" || text === "na" || text === "#n/a" || text === "-";
}

export async function getAllResearchers(): Promise<Researcher[]> {
  const path = resolveDataFile("Investigadores.csv");
  const rawCsv = await readFile(path, "utf8");

  const records = parse(rawCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    delimiter: ";",
  }) as Record<string, unknown>[];

  return records.map((record, index) => {
    const raw = normalizeRecord(record);

    const name = pick(raw, ["INV_NombreCompleto", "nombre", "name", "Nombre", "NOMBRE"]);
    const unit = pick(raw, ["INV_Facultad_Unidad", "INV_Facultad_Unidad2", "unidad", "facultad", "unit"]);
    const email = pick(raw, ["INV_EmailPrincipal", "INV_EmailSecundario", "email", "correo", "mail"]);

    const candidateId = pick(raw, ["INV_ID", "INV_N", "id", "ID", "investigador_id"]);
    const id = isMissingId(candidateId) ? buildStableId(name, unit, index) : candidateId;

    return {
      id,
      name,
      unit,
      email,
      raw,
    };
  });
}

export async function getResearcherById(id: string): Promise<Researcher | null> {
  const all = await getAllResearchers();
  const target = String(id || "").trim().toLowerCase();
  return all.find((researcher) => researcher.id.toLowerCase() === target) ?? null;
}
