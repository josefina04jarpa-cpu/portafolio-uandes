import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { resolveDataFile } from "./dataPath";

export type Communication = {
  COM_N: number | string;
  ColumnVal: string;
  COM_Titular: string;
  COM_TipoComun: string;
  COM_TipoMedio: string;
  COM_Medio: string;
  COM_TemaPubl: string;
  COM_Fecha: string;
  COM_Vocero: string;
  COM_Link: string;
  COM_MontoEstimado: string;
  COM_AsocProd: string;
  COM_NombreProdAsoc: string;
  COM_Asistentes: string;
  COM_Impresiones: string;
  COM_Clics: string;
  COM_VecesCompartido_Shared: string;
  COM_LikesRecomendReacciones: string;
  COM_Guardados: string;
  COM_CantComentarios: string;
  COM_Interaccion: string;
  COM_Alcance: string;
  COM_Engagement: string;
  COM_Comentario: string;
  COM_ThumbnailUrl: string;
  COM_ThumbnailPath: string;
};

export type CommunicationPlatform = "Todos" | "Instagram" | "LinkedIn";

export type MonthlyImpressionsPoint = {
  month: number;
  value: number;
};

export type MonthlyImpressionsOptions = {
  year?: number;
  platform?: CommunicationPlatform;
};

type CommunicationRaw = Record<string, string>;

const REQUIRED_KEYS: Array<keyof Communication> = [
  "COM_N",
  "ColumnVal",
  "COM_Titular",
  "COM_TipoComun",
  "COM_TipoMedio",
  "COM_Medio",
  "COM_TemaPubl",
  "COM_Fecha",
  "COM_Vocero",
  "COM_Link",
  "COM_MontoEstimado",
  "COM_AsocProd",
  "COM_NombreProdAsoc",
  "COM_Asistentes",
  "COM_Impresiones",
  "COM_Clics",
  "COM_VecesCompartido_Shared",
  "COM_LikesRecomendReacciones",
  "COM_Guardados",
  "COM_CantComentarios",
  "COM_Interaccion",
  "COM_Alcance",
  "COM_Engagement",
  "COM_Comentario",
  "COM_ThumbnailUrl",
  "COM_ThumbnailPath",
];

function normalizeFieldValue(value: unknown): string {
  const text = String(value ?? "").trim();
  const lower = text.toLowerCase();
  if (!text || lower === "nan" || lower === "null" || lower === "undefined" || lower === "n/a" || lower === "#n/a") {
    return "";
  }
  return text;
}

function normalizeRecord(record: Record<string, unknown>): CommunicationRaw {
  const out: CommunicationRaw = {};
  for (const key of Object.keys(record)) {
    out[String(key).trim()] = normalizeFieldValue(record[key]);
  }
  return out;
}

function pick(raw: CommunicationRaw, key: keyof Communication): string {
  return normalizeFieldValue(raw[key]);
}

function parseComN(value: string): number | string {
  const cleaned = normalizeFieldValue(value);
  if (!cleaned) return "";
  const asNumber = Number(cleaned.replace(/\s/g, "").replace(",", "."));
  if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) return asNumber;
  return cleaned;
}

export function normalizeKey(s: string): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function includesBidirectional(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

function toCommunication(raw: CommunicationRaw): Communication {
  return {
    COM_N: parseComN(pick(raw, "COM_N")),
    ColumnVal: pick(raw, "ColumnVal"),
    COM_Titular: pick(raw, "COM_Titular"),
    COM_TipoComun: pick(raw, "COM_TipoComun"),
    COM_TipoMedio: pick(raw, "COM_TipoMedio"),
    COM_Medio: pick(raw, "COM_Medio"),
    COM_TemaPubl: pick(raw, "COM_TemaPubl"),
    COM_Fecha: pick(raw, "COM_Fecha"),
    COM_Vocero: pick(raw, "COM_Vocero"),
    COM_Link: pick(raw, "COM_Link"),
    COM_MontoEstimado: pick(raw, "COM_MontoEstimado"),
    COM_AsocProd: pick(raw, "COM_AsocProd"),
    COM_NombreProdAsoc: pick(raw, "COM_NombreProdAsoc"),
    COM_Asistentes: pick(raw, "COM_Asistentes"),
    COM_Impresiones: pick(raw, "COM_Impresiones"),
    COM_Clics: pick(raw, "COM_Clics"),
    COM_VecesCompartido_Shared: pick(raw, "COM_VecesCompartido_Shared"),
    COM_LikesRecomendReacciones: pick(raw, "COM_LikesRecomendReacciones"),
    COM_Guardados: pick(raw, "COM_Guardados"),
    COM_CantComentarios: pick(raw, "COM_CantComentarios"),
    COM_Interaccion: pick(raw, "COM_Interaccion"),
    COM_Alcance: pick(raw, "COM_Alcance"),
    COM_Engagement: pick(raw, "COM_Engagement"),
    COM_Comentario: pick(raw, "COM_Comentario"),
    COM_ThumbnailUrl: pick(raw, "COM_ThumbnailUrl"),
    COM_ThumbnailPath: pick(raw, "COM_ThumbnailPath"),
  };
}

function ensureRequiredKeys(raw: CommunicationRaw): CommunicationRaw {
  const out: CommunicationRaw = { ...raw };
  for (const key of REQUIRED_KEYS) {
    if (!(key in out)) out[key] = "";
    out[key] = normalizeFieldValue(out[key]);
  }
  return out;
}

export function getAllComunicaciones(): Communication[] {
  const path = resolveDataFile("Comunicaciones.csv");
  const rawCsv = readFileSync(path, "utf8");

  const records = parse(rawCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    delimiter: ";",
    relax_column_count: true,
  }) as Record<string, unknown>[];

  return records
    .map((record) => normalizeRecord(record))
    .map((raw) => ensureRequiredKeys(raw))
    .map((raw) => toCommunication(raw));
}

export function getComunicacionesByInvestigador(nombreInvestigador: string): Communication[] {
  const all = getAllComunicaciones();
  const target = normalizeKey(nombreInvestigador);
  if (!target) return [];

  return all.filter((item) => {
    const vocero = normalizeKey(item.COM_Vocero);
    if (!vocero) return false;
    if (vocero === target) return true;
    return includesBidirectional(vocero, target);
  });
}

export function getComunicacionesByProyecto(nombreProyecto: string): Communication[] {
  const all = getAllComunicaciones();
  const target = normalizeKey(nombreProyecto);
  if (!target) return [];

  return all.filter((item) => {
    const nombre = normalizeKey(item.COM_NombreProdAsoc);
    if (!nombre) return false;
    if (nombre === target) return true;
    return includesBidirectional(nombre, target);
  });
}

function parseMetricValue(value: string): number {
  const raw = String(value || "").trim();
  if (!raw) return 0;

  const cleaned = raw
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");

  const num = Number(cleaned);
  if (Number.isNaN(num) || !Number.isFinite(num)) return 0;
  return num;
}

function pickFlexibleValue(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = normalizeFieldValue(row[key]);
    if (value) return value;
  }
  return "";
}

export function parseDateFlexible(value: string): Date | null {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const ddmmyyyy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]);
    const year = Number(ddmmyyyy[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
    return null;
  }

  const yyyymmdd = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmdd) {
    const year = Number(yyyymmdd[1]);
    const month = Number(yyyymmdd[2]);
    const day = Number(yyyymmdd[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
    return null;
  }

  const fallback = new Date(raw);
  if (Number.isNaN(fallback.getTime())) return null;
  return fallback;
}

export function getPlatformFromRow(row: Partial<Communication> | Record<string, unknown>): "Instagram" | "LinkedIn" | "Otros" {
  const source = row as Record<string, unknown>;
  const platformText = normalizeKey(
    pickFlexibleValue(source, ["COM_TipoMedio", "COM_Medio", "tipoMedio", "medio", "TipoMedio", "Medio"]),
  );

  if (platformText.includes("instagram")) return "Instagram";
  if (platformText.includes("linkedin")) return "LinkedIn";
  return "Otros";
}

export function getMonthlyImpressions(
  rows: Array<Partial<Communication> | Record<string, unknown>>,
  options: MonthlyImpressionsOptions = {},
): MonthlyImpressionsPoint[] {
  const year = options.year ?? 2025;
  const platform = options.platform ?? "Todos";

  const monthlyValues = Array.from({ length: 12 }, (_, index) => ({
    month: index,
    value: 0,
  }));

  for (const row of rows || []) {
    const source = row as Record<string, unknown>;
    const rowPlatform = getPlatformFromRow(source);

    if (platform !== "Todos" && rowPlatform !== platform) continue;

    const dateRaw = pickFlexibleValue(source, ["COM_Fecha", "fecha", "Fecha"]);
    const date = parseDateFlexible(dateRaw);
    if (!date) continue;
    if (date.getFullYear() !== year) continue;

    const impressionsRaw = pickFlexibleValue(source, [
      "COM_Impresiones",
      "impresiones",
      "Impresiones",
      "impressions",
      "IMPRESIONES",
    ]);

    const impressions = parseMetricValue(impressionsRaw);
    const monthIndex = date.getMonth();
    monthlyValues[monthIndex].value += impressions;
  }

  return monthlyValues;
}

function socialScore(item: Communication): number {
  const values = [
    parseMetricValue(item.COM_Impresiones),
    parseMetricValue(item.COM_Alcance),
    parseMetricValue(item.COM_Interaccion),
    parseMetricValue(item.COM_Clics),
    parseMetricValue(item.COM_LikesRecomendReacciones),
    parseMetricValue(item.COM_CantComentarios),
    parseMetricValue(item.COM_Guardados),
    parseMetricValue(item.COM_VecesCompartido_Shared),
    parseMetricValue(item.COM_Asistentes),
  ];

  return values.reduce((acc, current) => acc + Math.log1p(Math.max(0, current)), 0);
}

function isSocialPostOrReel(item: Communication): boolean {
  const tipoComun = normalizeKey(item.COM_TipoComun);
  const tipoMedio = normalizeKey(item.COM_TipoMedio);
  const medio = normalizeKey(item.COM_Medio);

  const isPostOrReel =
    tipoComun.includes("post") ||
    tipoComun.includes("publicacion") ||
    tipoComun.includes("reel");

  const isSocialMedium =
    tipoMedio.includes("rrss") ||
    tipoMedio.includes("red") ||
    medio.includes("instagram") ||
    medio.includes("linkedin") ||
    medio.includes("youtube") ||
    medio.includes("facebook") ||
    medio.includes("twitter") ||
    medio.includes("x");

  return isPostOrReel && isSocialMedium;
}

function buildSocialDedupKey(item: Communication): string {
  const base = String(item.COM_Titular || "")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[#@][^\s]+/g, " ")
    .replace(/[|•·]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const normalized = normalizeKey(base)
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return `com-${String(item.COM_N)}`;
  return normalized.slice(0, 180);
}

export function keepBestSocialPostsForInvestigador(items: Communication[]): Communication[] {
  const fixedItems = Array.isArray(items) ? items : [];
  const byKey = new Map<string, Communication>();
  const others: Communication[] = [];

  for (const item of fixedItems) {
    if (!isSocialPostOrReel(item)) {
      others.push(item);
      continue;
    }

    const dedupKey = buildSocialDedupKey(item);
    const current = byKey.get(dedupKey);
    if (!current || socialScore(item) > socialScore(current)) {
      byKey.set(dedupKey, item);
    }
  }

  return [...others, ...Array.from(byKey.values())];
}
