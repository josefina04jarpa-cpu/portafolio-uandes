import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import { resolveDataFile } from "./dataPath";
import { normalizeText } from "./normalize";
import { normalizeRelationLabel } from "./entityLinks";
import { getAllTechnologies } from "./tecnologias";
import { getAllProjects } from "./proyectos";

export type LegalDoc = {
  DOC_N: string;
  DOC_ID: string;
  DOC_Categ: string;
  DOC_Subcateg: string;
  DOC_TipoContrato: string;
  DOC_AsocProducto: string;
  DOC_NombreProdAsoc: string;
  DOC_ObjetivoContrato: string;
  DOC_FechaSubsc: string;
  DOC_FechaInicio: string;
  DOC_FechaTermino: string;
  DOC_Estado: string;
  DOC_Vigencia: string;
  DOC_DurVig: string;
  DOC_Renovacion: string;
  DOC_Contraparte: string;
  DOC_Activo: string;
  DOC_ClasifSubsidio: string;
  DOC_MontoContrato: string;
  DOC_MontoAporteU: string;
  DOC_MontoAporteTercero: string;
  DOC_MontoTotal: string;
  DOC_NuevoPI: string;
  DOC_Observaciones: string;
  DOC_Otros: string;
};

const LEGAL_DOC_KEYS: Array<keyof LegalDoc> = [
  "DOC_N",
  "DOC_ID",
  "DOC_Categ",
  "DOC_Subcateg",
  "DOC_TipoContrato",
  "DOC_AsocProducto",
  "DOC_NombreProdAsoc",
  "DOC_ObjetivoContrato",
  "DOC_FechaSubsc",
  "DOC_FechaInicio",
  "DOC_FechaTermino",
  "DOC_Estado",
  "DOC_Vigencia",
  "DOC_DurVig",
  "DOC_Renovacion",
  "DOC_Contraparte",
  "DOC_Activo",
  "DOC_ClasifSubsidio",
  "DOC_MontoContrato",
  "DOC_MontoAporteU",
  "DOC_MontoAporteTercero",
  "DOC_MontoTotal",
  "DOC_NuevoPI",
  "DOC_Observaciones",
  "DOC_Otros",
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

function toLegalDoc(raw: Record<string, string>): LegalDoc {
  const out = {} as LegalDoc;

  for (const key of LEGAL_DOC_KEYS) {
    out[key] = normalizeValue(raw[key]);
  }

  return out;
}

export async function getLegalDocs(): Promise<LegalDoc[]> {
  const path = resolveDataFile("Legal_Doc.csv");
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
    .map((record) => toLegalDoc(record));
}

export function groupLegalDocByProduct(items: LegalDoc[]): Map<string, LegalDoc[]> {
  const grouped = new Map<string, LegalDoc[]>();

  for (const item of items) {
    const tipo = normalizeText(item.DOC_AsocProducto);
    const nombre = normalizeText(item.DOC_NombreProdAsoc);
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

// Relation 8: Doc.DOC_NombreProdAsoc → Tecnologia.TECN_NombreTecnologia
export async function getLegalDocByTecnologiaNormalized(nombreTecnologia: string): Promise<LegalDoc[]> {
  const [legalDocs, tecnologias] = await Promise.all([getLegalDocs(), getAllTechnologies()]);

  const normalized = normalizeRelationLabel(nombreTecnologia);

  return legalDocs.filter((doc) => {
    const docNorm = normalizeRelationLabel(doc.DOC_NombreProdAsoc);
    if (docNorm === normalized) return true;

    // Bidirectional fallback: check if any technology name normalizes to the document product
    const matchesTecnologia = tecnologias.some((t) => {
      const tecNorm = normalizeRelationLabel(t["TECN_NombreTecnologia"] || "");
      return tecNorm === docNorm;
    });

    return matchesTecnologia;
  });
}

// Relation 9: Doc.DOC_NombreProdAsoc → Proyectos.PROY_NombreProyecto
export async function getLegalDocByProyectoNormalized(nombreProyecto: string): Promise<LegalDoc[]> {
  const [legalDocs, proyectos] = await Promise.all([getLegalDocs(), getAllProjects()]);

  const normalized = normalizeRelationLabel(nombreProyecto);

  return legalDocs.filter((doc) => {
    const docNorm = normalizeRelationLabel(doc.DOC_NombreProdAsoc);
    if (docNorm === normalized) return true;

    // Bidirectional fallback: check if any project name normalizes to the document product
    const matchesProyecto = proyectos.some((p) => {
      const proyNorm = normalizeRelationLabel(p.title);
      return proyNorm === docNorm;
    });

    return matchesProyecto;
  });
}
