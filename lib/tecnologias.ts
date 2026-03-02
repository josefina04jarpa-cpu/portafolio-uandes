import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import { resolveDataFile } from "./dataPath";

export type TechRow = Record<string, string>;

export async function getAllTechnologies(): Promise<TechRow[]> {
  const path = resolveDataFile("tecnologias.csv");
  const raw = await readFile(path, "utf8");

  // CSV is semicolon-delimited; parse with BOM handling
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
    delimiter: ";",
  });

  // ensure all values are strings
  return records.map((r: any) => {
    const out: TechRow = {};
    for (const k of Object.keys(r)) out[k.trim()] = String(r[k] ?? "").trim();
    return out;
  });
}

export default getAllTechnologies;
