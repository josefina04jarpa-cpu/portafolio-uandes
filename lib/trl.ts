import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import { resolveDataFile } from "./dataPath";
import { normalizeRelationLabel } from "./entityLinks";

type TRLRawRow = Record<string, string>;

export type TRLYearPoint = {
  year: number;
  trl: number | null;
  crl: number | null;
  brl: number | null;
  iprl: number | null;
  tmrl: number | null;
  frl: number | null;
};

let cache: TRLRawRow[] | null = null;

function parseLevel(value: string): number | null {
  const text = String(value || "").trim();
  if (!text) return null;
  const match = text.match(/^(\d{1,2})\s*[-.]/) || text.match(/^(\d{1,2})\b/);
  if (!match) return null;
  const level = Number(match[1]);
  return Number.isFinite(level) ? level : null;
}

function parseYears(value: string): number[] {
  const text = String(value || "");
  if (!text) return [];

  const years = text
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((year) => Number.isFinite(year));

  return Array.from(new Set(years)).sort((a, b) => a - b);
}

async function getAllRows(): Promise<TRLRawRow[]> {
  if (cache) return cache;

  const path = resolveDataFile("Tecn-MadurezTecnol.csv");
  const raw = await readFile(path, "utf8");
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
    delimiter: ";",
  }) as Array<Record<string, unknown>>;

  cache = records.map((record) => {
    const out: TRLRawRow = {};
    for (const key of Object.keys(record)) {
      out[key.trim()] = String(record[key] ?? "").trim();
    }
    return out;
  });

  return cache;
}

export async function getTRLByTecnologiaNormalized(technologyName: string): Promise<TRLYearPoint[]> {
  const rows = await getAllRows();
  const normalized = normalizeRelationLabel(technologyName);
  if (!normalized) return [];

  const filtered = rows.filter((row) => {
    const rowNorm = normalizeRelationLabel(row.TECT_NombreTecnologia);
    return rowNorm === normalized;
  });
  if (filtered.length === 0) return [];

  const byYear = new Map<number, TRLYearPoint>();

  for (const row of filtered) {
    const years = parseYears(row.TECT_Periodo);
    if (years.length === 0) continue;

    const point = {
      trl: parseLevel(row.TECT_TRL),
      crl: parseLevel(row.TECT_CRL),
      brl: parseLevel(row.TECT_BRL),
      iprl: parseLevel(row.TECT_IPRL),
      tmrl: parseLevel(row.TECT_TmRL),
      frl: parseLevel(row.TECT_FRL),
    };

    for (const year of years) {
      const current = byYear.get(year) || {
        year,
        trl: null,
        crl: null,
        brl: null,
        iprl: null,
        tmrl: null,
        frl: null,
      };

      byYear.set(year, {
        year,
        trl: point.trl ?? current.trl,
        crl: point.crl ?? current.crl,
        brl: point.brl ?? current.brl,
        iprl: point.iprl ?? current.iprl,
        tmrl: point.tmrl ?? current.tmrl,
        frl: point.frl ?? current.frl,
      });
    }
  }

  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}
