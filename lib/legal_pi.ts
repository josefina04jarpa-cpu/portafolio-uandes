import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import { resolveDataFile } from "./dataPath";
import { normalizeText } from "./normalize";
import { normalizeRelationLabel } from "./entityLinks";
import { getAllTechnologies } from "./tecnologias";
import { getAllProjects } from "./proyectos";

export type LegalPI = {
  LGL_N: string;
  LGL_NombrePI: string;
  LGL_CategPI: string;
  LGL_SubcatPI: string;
  LGL_NumSolicitud: string;
  LGL_FechaSolicitud: string;
  LGL_TipoProdAsoc: string;
  LGL_NombreProdAsoc: string;
  LGL_CreadoresUANDES: string;
  LGL_Link: string;
  LGL_ClaseMarca: string;
  LGL_NPrioridad: string;
  LGL_AnoPrioridad: string;
  LGL_IPC: string;
  LGL_CPC: string;
  LGL_ExistenciaCotitulares: string;
  LGL_NombInstCotitular: string;
  LGL_PorcTitularidad: string;
  LGL_CreadoresExternos: string;
  LGL_NumeroRegistro: string;
  LGL_FechaConcesion: string;
  LGL_FechaExpiracion: string;
  LGL_Pais: string;
  LGL_EstudioJuridico: string;
  LGL_CodigoJuridico: string;
  LGL_MarcaRenov: string;
  LGL_FechaRenovacion: string;
  LGL_Estado: string;
  LGL_Activo: string;
  LGL_Observaciones: string;
  LGL_Resumen: string;
  LGL_Archivo: string;
};

const LEGAL_KEYS: Array<keyof LegalPI> = [
  "LGL_N",
  "LGL_NombrePI",
  "LGL_CategPI",
  "LGL_SubcatPI",
  "LGL_NumSolicitud",
  "LGL_FechaSolicitud",
  "LGL_TipoProdAsoc",
  "LGL_NombreProdAsoc",
  "LGL_CreadoresUANDES",
  "LGL_Link",
  "LGL_ClaseMarca",
  "LGL_NPrioridad",
  "LGL_AnoPrioridad",
  "LGL_IPC",
  "LGL_CPC",
  "LGL_ExistenciaCotitulares",
  "LGL_NombInstCotitular",
  "LGL_PorcTitularidad",
  "LGL_CreadoresExternos",
  "LGL_NumeroRegistro",
  "LGL_FechaConcesion",
  "LGL_FechaExpiracion",
  "LGL_Pais",
  "LGL_EstudioJuridico",
  "LGL_CodigoJuridico",
  "LGL_MarcaRenov",
  "LGL_FechaRenovacion",
  "LGL_Estado",
  "LGL_Activo",
  "LGL_Observaciones",
  "LGL_Resumen",
  "LGL_Archivo",
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

function toLegalPI(raw: Record<string, string>): LegalPI {
  const out = {} as LegalPI;

  for (const key of LEGAL_KEYS) {
    out[key] = normalizeValue(raw[key]);
  }

  return out;
}

export async function getLegalPI(): Promise<LegalPI[]> {
  const path = resolveDataFile("Legal_PI.csv");
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
    .map((record) => toLegalPI(record));
}

const CONCEDIDO_TERMS = ["conced", "conces", "registr", "otorg", "grant", "granted", "issued"];

export function isInTramite(item: LegalPI): boolean {
  const estadoOriginal = normalizeValue(item.LGL_Estado);
  if (!estadoOriginal) return false;

  const estado = normalizeText(estadoOriginal);
  const containsConcedido = CONCEDIDO_TERMS.some((term) => estado.includes(term));

  const activo = normalizeText(item.LGL_Activo);
  const isNotActive = activo === "no";

  return !containsConcedido && !isNotActive;
}

export function matchByProduct(item: LegalPI, tipo: string, nombre: string): boolean {
  const itemTipo = normalizeText(item.LGL_TipoProdAsoc);
  const itemNombre = normalizeText(item.LGL_NombreProdAsoc);
  const targetTipo = normalizeText(tipo);
  const targetNombre = normalizeText(nombre);

  const canonicalTipo = (value: string): string => {
    const text = normalizeText(value);
    if (!text) return "";
    if (text.includes("tecnolog")) return "tecnologia";
    if (text.includes("proyect")) return "proyecto";
    return text.replace(/\s+/g, " ").trim();
  };

  if (!targetNombre) return false;

  const nombreMatches =
    itemNombre === targetNombre ||
    itemNombre.includes(targetNombre) ||
    targetNombre.includes(itemNombre);
  if (!nombreMatches) return false;

  if (!targetTipo) return true;

  return canonicalTipo(itemTipo) === canonicalTipo(targetTipo);
}

export function groupLegalByProduct(items: LegalPI[]): Map<string, LegalPI[]> {
  const grouped = new Map<string, LegalPI[]>();

  for (const item of items) {
    const tipo = normalizeText(item.LGL_TipoProdAsoc);
    const nombre = normalizeText(item.LGL_NombreProdAsoc);
    const key = `${tipo}||${nombre}`;

    const current = grouped.get(key);
    if (current) {
      current.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }

  return grouped;
}

// Relation 9: PI.LGL_NombreProdAsoc → Tecnologia.TECN_NombreTecnologia
export async function getLegalPIByTecnologiaNormalized(nombreTecnologia: string): Promise<LegalPI[]> {
  const [legalPI, tecnologias] = await Promise.all([getLegalPI(), getAllTechnologies()]);

  const normalized = normalizeRelationLabel(nombreTecnologia);

  return legalPI.filter((pi) => {
    const piNorm = normalizeRelationLabel(pi.LGL_NombreProdAsoc);
    if (piNorm === normalized) return true;

    // Bidirectional fallback: check if any technology name normalizes to the PI product
    const matchesTecnologia = tecnologias.some((t) => {
      const tecNorm = normalizeRelationLabel(t["TECN_NombreTecnologia"] || "");
      return tecNorm === piNorm;
    });

    return matchesTecnologia;
  });
}

// Relation 10: PI.LGL_NombreProdAsoc → Proyectos.PROY_NombreProyecto
export async function getLegalPIByProyectoNormalized(nombreProyecto: string): Promise<LegalPI[]> {
  const [legalPI, proyectos] = await Promise.all([getLegalPI(), getAllProjects()]);

  const normalized = normalizeRelationLabel(nombreProyecto);

  return legalPI.filter((pi) => {
    const piNorm = normalizeRelationLabel(pi.LGL_NombreProdAsoc);
    if (piNorm === normalized) return true;

    // Bidirectional fallback: check if any project name normalizes to the PI product
    const matchesProyecto = proyectos.some((p) => {
      const proyNorm = normalizeRelationLabel(p.title);
      return proyNorm === piNorm;
    });

    return matchesProyecto;
  });
}
