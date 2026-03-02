import { readFile } from "fs/promises";
import { resolveDataFile } from "./dataPath";

export type Indicator = {
  id: string;
  nombre_indicador: string;
  categoria: string;
  valor_2025: string;
  meta_2025: string;
  valor_2025_num: number;
  meta_2025_num: number;
  avance: number; // porcentaje 0-100
  unidad: string;
  prioridad: string;
  responsable: string;
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
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        current[current.length - 1] += ch;
        i++;
        continue;
      }
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

    if (ch === '\r') {
      // skip, handle with \n
      i++;
      continue;
    }

    if (ch === '\n') {
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

async function loadCSV(fileName: string): Promise<Indicator[]> {
  const path = resolveDataFile(fileName);
  let raw = "";
  try {
    raw = await readFile(path, "utf8");
  } catch {
    return [];
  }

  // detect delimiter: prefer semicolon if present in header line
  const firstLine = raw.split(/\r?\n/)[0] || "";
  const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";

  const rows = parseCSV(raw, delimiter);
  if (rows.length === 0) return [];

  const normalize = (h: string) =>
    h
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, "_");

  const headers = rows[0].map((h) => normalize(h));
  const dataRows = rows.slice(1);
  const out: Indicator[] = dataRows.map((r) => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = (r[i] ?? "").trim();
    }
    // normalize expected keys
    const mapped = {
      id: obj['id'] ?? '',
      nombre_indicador: obj['nombre_indicador'] ?? obj['descripcion'] ?? '',
      categoria: obj['categoria'] ?? '',
      valor_2025: obj['valor_2025'] ?? obj['valor'] ?? '',
      meta_2025: obj['meta_2025'] ?? '',
      unidad: obj['unidad'] ?? '',
      prioridad: (obj['prioridad'] ?? '').toLowerCase(),
      responsable: obj['responsable'] ?? obj['responsable'] ?? '',
    };
    // parse numeric values (handle thousands and comma decimals)
    const parseNumber = (s: unknown) => {
      if (s === undefined || s === null) return 0;
      const str = String(s).replace(/\./g, "").replace(/,/g, ".").trim();
      const n = parseFloat(str);
      return Number.isFinite(n) ? n : 0;
    };

    const valorNum = parseNumber(mapped.valor_2025);
    const metaNum = parseNumber(mapped.meta_2025);
    const avance = metaNum === 0 ? 0 : Math.min(100, (valorNum / metaNum) * 100);

    return {
      ...mapped,
      valor_2025_num: valorNum,
      meta_2025_num: metaNum,
      avance,
    } as Indicator;
  });
  return out;
}

const cacheByFile = new Map<string, Indicator[]>();

export async function getIndicatorsByYear(year: number): Promise<Indicator[]> {
  const fileName = `indicadores-${year}.csv`;
  const cached = cacheByFile.get(fileName);
  if (cached) return cached;

  const data = await loadCSV(fileName);
  cacheByFile.set(fileName, data);
  return data;
}

export async function getAllIndicators(): Promise<Indicator[]> {
  return getIndicatorsByYear(2025);
}

export async function getTopKpis(): Promise<Indicator[]> {
  const all = await getAllIndicators();
  return all.filter((i) => (i.prioridad || "").toLowerCase() === "alta");
}
