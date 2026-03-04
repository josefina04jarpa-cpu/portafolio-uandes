import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import { resolveDataFile } from "./dataPath";

export interface EmprendimientoRecord {
  Año?: string;
  Proyecto?: string;
  Descripción?: string;
  Responsable?: string;
  Integrantes?: string;
  Correo?: string;
  Teléfono?: string;
  "Facultad o escuela"?: string;
  Carrera?: string;
  "Alumno, profesor o alumni"?: string;
  ODS?: string;
  Estatus?: string;
  Monto?: string;
  "Web, redes sociales o noticia"?: string;
}

export interface EmprendimientoItem {
  id: string;
  year?: string;
  name: string;
  responsable?: string;
  integrantes?: string;
  status?: string;
  raw: EmprendimientoRecord;
}

export async function getAllEmprendimientos(): Promise<EmprendimientoItem[]> {
  try {
    const path = resolveDataFile("Empren-Incubadora.csv");
    const raw = await readFile(path, "utf8");
    const records = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      delimiter: ";",
    }) as Array<Record<string, unknown>>;

    return records.map((record, idx) => {
      const cleaned: EmprendimientoRecord = {};
      for (const [key, value] of Object.entries(record)) {
        (cleaned as Record<string, string>)[key] = String(value ?? "").trim();
      }

      return {
        id: String(cleaned.Proyecto || idx).trim(),
        year: cleaned.Año,
        name: String(cleaned.Proyecto || `Proyecto${idx}`).trim(),
        responsable: cleaned.Responsable?.trim(),
        integrantes: cleaned.Integrantes?.trim(),
        status: cleaned.Estatus?.trim(),
        raw: cleaned,
      };
    }).filter(item => item.id && item.name);
  } catch {
    return [];
  }
}
