import { readFileSync, readdirSync } from "fs";
import path from "path";
import type { SubdireccionSlug } from "./subdireccionesMap";

export type EquipoMember = {
  nombre: string;
  cargo: string;
  area: string;
  areaEstrategica: string;
  correo: string;
};

let equipoCache: EquipoMember[] | null = null;
let photoFilesCache: string[] | null = null;

function getAllEquipo(): EquipoMember[] {
  if (equipoCache) return equipoCache;

  const filePath = path.join(process.cwd(), "data", "EquipoInnovación.csv");
  const content = readFileSync(filePath, "utf-8");
  
  const lines = content.split("\n").filter((line) => line.trim());
  const headers = lines[0].split(";").map((h) => h.trim().toLowerCase());
  
  equipoCache = lines.slice(1).map((line) => {
    const values = line.split(";");
    const record: Record<string, string> = {};
    
    headers.forEach((header, idx) => {
      record[header] = values[idx]?.trim() || "";
    });
    
    return {
      nombre: record["nombre"] || "",
      cargo: record["cargo"] || "",
      area: record["area"] || "",
      areaEstrategica: record["areaestrategica"] || record["areaestratégica"] || "",
      correo: record["correo"] || "",
    };
  });

  return equipoCache;
}

function getAvailablePhotoFiles(): string[] {
  if (photoFilesCache) return photoFilesCache;

  try {
    const publicDir = path.join(process.cwd(), "public");
    const files = readdirSync(publicDir);
    photoFilesCache = files.filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
  } catch {
    photoFilesCache = [];
  }

  return photoFilesCache;
}

function findPhotoForName(nombre: string): string | null {
  const photos = getAvailablePhotoFiles();
  const nameParts = nombre.toLowerCase().split(/\s+/).filter(Boolean);
  
  for (const photo of photos) {
    const photoName = photo.toLowerCase().replace(/\.(png|jpg|jpeg|webp)$/i, "");
    
    // Exact match after removing extension
    if (photoName === nombre.toLowerCase()) {
      return `/${photo}`;
    }
    
    // Match if photo name contains parts of the person's name
    const photoNameParts = photoName.split(/\s+/).filter(Boolean);
    const matchingParts = nameParts.filter((part) =>
      photoNameParts.some((photoPart) => photoPart.includes(part) || part.includes(photoPart))
    );
    
    if (matchingParts.length >= 2) {
      return `/${photo}`;
    }
  }
  
  return null;
}

// Map AreaEstrategica to subdirectión slugs
function areaEstrategicaToSubdireccionSlug(areaEstrategica: string): SubdireccionSlug | null {
  const area = areaEstrategica.toLowerCase().trim();
  
  if (area === "proyectos") return "proyectos";
  if (area === "subdir. de desarrollo tecnológico y comercialización" || area === "subdir. desarrollo tecnológico y comercialización") 
    return "desarrollo-tecnologico-y-comercializacion";
  if (area === "comunicaciones") return "comunicaciones";
  if (area === "proyecto bici") return "proyecto-bici";
  if (area === "asuntos jurídicos") return "propiedad-intelectual";
  
  return null;
}

export function getMiembrosBySubdireccion(slug: SubdireccionSlug): EquipoMember[] {
  const equipo = getAllEquipo();
  return equipo.filter((m) => areaEstrategicaToSubdireccionSlug(m.areaEstrategica) === slug);
}

export function getAllEquipoByArea(): Map<SubdireccionSlug, EquipoMember[]> {
  const equipo = getAllEquipo();
  const map = new Map<SubdireccionSlug, EquipoMember[]>();
  
  for (const member of equipo) {
    const slug = areaEstrategicaToSubdireccionSlug(member.areaEstrategica);
    if (!slug) continue;
    
    if (!map.has(slug)) {
      map.set(slug, []);
    }
    map.get(slug)!.push(member);
  }
  
  return map;
}

export function getPhotoUrlForName(nombre: string): string | null {
  return findPhotoForName(nombre);
}

