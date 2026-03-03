import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import { resolveDataFile } from "./dataPath";
import { normalizeText } from "./normalize";

type IncubadoraRaw = Record<string, string>;

export type IncubadoraInitiative = {
  year: string;
  project: string;
  description: string;
  responsible: string;
  facultyOrSchool: string;
  status: string;
  link: string;
};

export type IncubadoraSummary = {
  initiatives: IncubadoraInitiative[];
  incubatedCount: number;
  successCount: number;
  totalCount: number;
  successCases: IncubadoraInitiative[];
  facultyDistribution: Array<{ faculty: string; count: number }>;
};

function normalizeRecord(record: Record<string, unknown>): IncubadoraRaw {
  const out: IncubadoraRaw = {};
  for (const key of Object.keys(record)) {
    out[String(key).trim()] = String(record[key] ?? "").trim();
  }
  return out;
}

function isIncubated(status: string): boolean {
  const text = normalizeText(status);
  return text.includes("seleccionado") || text.includes("primer lugar incubadora");
}

function isSuccessCase(status: string): boolean {
  const text = normalizeText(status);
  return text.includes("funcionando");
}

function normalizeInitiative(raw: IncubadoraRaw): IncubadoraInitiative | null {
  const project = String(raw["Proyecto"] || "").trim();
  const year = String(raw["Año"] || "").trim();
  const status = String(raw["Estatus"] || "").trim();

  if (!project) return null;

  return {
    year,
    project,
    description: String(raw["Descripción"] || "").trim(),
    responsible: String(raw["Responsable"] || "").trim(),
    facultyOrSchool: String(raw["Facultad o escuela"] || "").trim(),
    status,
    link: String(raw["Web, redes sociales o noticia"] || "").trim(),
  };
}

function dedupeInitiatives(items: IncubadoraInitiative[]): IncubadoraInitiative[] {
  const seen = new Set<string>();
  const out: IncubadoraInitiative[] = [];

  for (const item of items) {
    const key = `${normalizeText(item.project)}|${normalizeText(item.year)}|${normalizeText(item.responsible)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

export async function getIncubadoraSummary(): Promise<IncubadoraSummary> {
  const path = resolveDataFile("Incubadora BBDD completa.csv");
  const rawCsv = await readFile(path, "utf8");

  const records = parse(rawCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    delimiter: ";",
    relax_column_count: true,
  }) as Record<string, unknown>[];

  const initiatives = dedupeInitiatives(
    records
      .map((record) => normalizeRecord(record))
      .map((row) => normalizeInitiative(row))
      .filter((row): row is IncubadoraInitiative => Boolean(row)),
  );

  const incubatedCount = initiatives.filter((item) => isIncubated(item.status)).length;
  const successCases = initiatives.filter((item) => isSuccessCase(item.status));
  const successCount = successCases.length;

  const facultyCounter = new Map<string, number>();
  for (const item of initiatives) {
    const label = item.facultyOrSchool || "Sin facultad/escuela";
    facultyCounter.set(label, (facultyCounter.get(label) || 0) + 1);
  }

  const facultyDistribution = Array.from(facultyCounter.entries())
    .map(([faculty, count]) => ({ faculty, count }))
    .sort((first, second) => second.count - first.count)
    .slice(0, 12);

  return {
    initiatives,
    incubatedCount,
    successCount,
    totalCount: initiatives.length,
    successCases,
    facultyDistribution,
  };
}
