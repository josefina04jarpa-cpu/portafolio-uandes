import { readFile } from "fs/promises";
import { resolveDataFile } from "./dataPath";

export type MetaRectoria = {
  ambito: string;
  concepto: string;
  responsable: string;
  meta2024: string;
  real2024: string;
  cumplimiento2024: string;
  meta2025: string;
  real2025: string;
  cumplimiento2025: string;
  meta2026: string;
  real2026: string;
  cumplimiento2026: string;
  enfoque: string;
  dimension: string;
};

function parseCSV(content: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let current: string[] = [""];
  let i = 0;
  let inQuotes = false;

  while (i < content.length) {
    const ch = content[i];

    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          current[current.length - 1] += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }

      current[current.length - 1] += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === delimiter) {
      current.push("");
      i++;
      continue;
    }

    if (ch === "\r") {
      i++;
      continue;
    }

    if (ch === "\n") {
      rows.push(current);
      current = [""];
      i++;
      continue;
    }

    current[current.length - 1] += ch;
    i++;
  }

  if (current.length > 1 || (current.length === 1 && current[0] !== "")) rows.push(current);
  return rows;
}

let cache: MetaRectoria[] | null = null;

export async function getMetasRectoria(): Promise<MetaRectoria[]> {
  if (cache) return cache;

  const path = resolveDataFile("Metas Rectoria 2026.csv");
  const raw = await readFile(path, "utf8");
  const rows = parseCSV(raw, ";");

  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => String(cell || "").trim().toLowerCase() === "concepto"),
  );

  if (headerIndex === -1) {
    cache = [];
    return [];
  }

  const dataRows = rows.slice(headerIndex + 1);
  let currentAmbito = "";

  const mapped = dataRows
    .map((row) => row.map((cell) => String(cell ?? "").trim()))
    .map((row) => {
      const ambito = row[0] || currentAmbito;
      if (ambito) currentAmbito = ambito;

      return {
        ambito,
        concepto: row[1] || "",
        responsable: row[2] || "",
        meta2024: row[6] || "",
        real2024: row[7] || "",
        cumplimiento2024: row[8] || "",
        meta2025: row[9] || "",
        real2025: row[10] || "",
        cumplimiento2025: row[11] || "",
        meta2026: row[12] || "",
        real2026: row[13] || "",
        cumplimiento2026: row[14] || "",
        enfoque: row[15] || "",
        dimension: row[16] || "",
      } satisfies MetaRectoria;
    })
    .filter((row) => row.concepto);

  cache = mapped;
  return mapped;
}
