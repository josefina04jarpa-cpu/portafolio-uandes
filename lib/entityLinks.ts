import { getAllResearchers } from "./investigadores";
import { getAllProjects } from "./proyectos";
import { getAllInstitutions } from "./instituciones";
import { getAllTechnologies } from "./tecnologias";

type EntityRef = {
  id: string;
  name: string;
  path: string;
};

type LinkedSet = {
  auto: EntityRef[];
  suggested: Array<EntityRef & { score: number }>;
};

type EntityAssociations = {
  investigators: LinkedSet;
  technologies: LinkedSet;
  projects: LinkedSet;
  institutions: LinkedSet;
};

type AssocStore = {
  investigators: Set<string>;
  technologies: Set<string>;
  projects: Set<string>;
  institutions: Set<string>;
};

type LinksCache = {
  investigatorById: Map<string, EntityAssociations>;
  technologyById: Map<string, EntityAssociations>;
  projectById: Map<string, EntityAssociations>;
  institutionById: Map<string, EntityAssociations>;
};

interface NameIndex {
  nameToId: Map<string, string>;
  normalizedNameToIds: Map<string, Set<string>>;
  refs: Map<string, EntityRef>;
}

export function normalizeRelationLabel(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function createNameIndex(items: Array<{ id: string; name: string; path: string }>): NameIndex {
  const nameToId = new Map<string, string>();
  const normalizedNameToIds = new Map<string, Set<string>>();
  const refs = new Map<string, EntityRef>();
  for (const item of items) {
    const trimmedName = String(item.name || "").trim();
    if (trimmedName) {
      nameToId.set(trimmedName, item.id);

      const normalized = normalizeRelationLabel(trimmedName);
      if (normalized) {
        if (!normalizedNameToIds.has(normalized)) {
          normalizedNameToIds.set(normalized, new Set<string>());
        }
        normalizedNameToIds.get(normalized)!.add(item.id);
      }
    }
    refs.set(item.id, { id: item.id, name: item.name, path: item.path });
  }
  return { nameToId, normalizedNameToIds, refs };
}

function resolveByName(index: NameIndex, rawValue: string): string | null {
  const value = String(rawValue || "").trim();
  if (!value) return null;

  const exact = index.nameToId.get(value);
  if (exact) return exact;

  const normalized = normalizeRelationLabel(value);
  if (!normalized) return null;

  const ids = index.normalizedNameToIds.get(normalized);
  if (!ids || ids.size === 0) return null;

  // Si hay múltiples candidatos, usar el primero de forma determinística
  return Array.from(ids).sort()[0] || null;
}

function createStore(): AssocStore {
  return {
    investigators: new Set<string>(),
    technologies: new Set<string>(),
    projects: new Set<string>(),
    institutions: new Set<string>(),
  };
}

function toLinkedSet(idSet: Set<string>, refs: Map<string, EntityRef>): LinkedSet {
  const auto = Array.from(idSet)
    .map((id) => refs.get(id))
    .filter((item): item is EntityRef => Boolean(item));
  return { auto, suggested: [] };
}

function emptyAssociations(): EntityAssociations {
  return {
    investigators: { auto: [], suggested: [] },
    technologies: { auto: [], suggested: [] },
    projects: { auto: [], suggested: [] },
    institutions: { auto: [], suggested: [] },
  };
}

function resolveTechnologyId(row: Record<string, unknown>): string {
  return String(row.TECN_ID || row.TECN_N || row.id || row.ID || "").trim();
}

function splitRelationValues(value: string): string[] {
  return String(value || "")
    .split(/[,;|\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

let cachePromise: Promise<LinksCache> | null = null;

async function buildLinksCache(): Promise<LinksCache> {
  const [researchers, projects, institutions, technologies] = await Promise.all([
    getAllResearchers(),
    getAllProjects(),
    getAllInstitutions(),
    getAllTechnologies(),
  ]);

  // Crear índices por nombre exacto
  const researcherIndex = createNameIndex(
    researchers.map((r) => ({
      id: r.id,
      name: r.name,
      path: `/portafolio/investigadores/${encodeURIComponent(r.id)}`,
    }))
  );

  const projectIndex = createNameIndex(
    projects.map((p) => ({
      id: p.id,
      name: p.title,
      path: `/portafolio/proyectos/${encodeURIComponent(p.id)}`,
    }))
  );

  const institutionIndex = createNameIndex(
    institutions.map((i) => ({
      id: i.id,
      name: i.name,
      path: `/instituciones/${encodeURIComponent(i.id)}`,
    }))
  );

  const technologyIndex = createNameIndex(
    technologies.map((t) => ({
      id: resolveTechnologyId(t),
      name: t.TECN_NombreTecnologia || t.name || "",
      path: `/portafolio/tecnologias/${encodeURIComponent(resolveTechnologyId(t))}`,
    }))
  );

  // Almacenes de asociaciones
  const investigatorAssoc = new Map<string, AssocStore>();
  const projectAssoc = new Map<string, AssocStore>();
  const institutionAssoc = new Map<string, AssocStore>();
  const technologyAssoc = new Map<string, AssocStore>();

  const getOrCreateStore = (map: Map<string, AssocStore>, id: string): AssocStore => {
    if (!map.has(id)) map.set(id, createStore());
    return map.get(id)!;
  };

  // ===== RELACIÓN 1: Proyectos.PROY_InvestigadorLiderUANDES → Investigadores.INV_NombreCompleto =====
  for (const proj of projects) {
    const leaderName = String(proj.raw.PROY_InvestigadorLiderUANDES || "").trim();
    const leaderId = leaderName ? resolveByName(researcherIndex, leaderName) : null;
    if (leaderId) {
      getOrCreateStore(projectAssoc, proj.id).investigators.add(leaderId);
      getOrCreateStore(investigatorAssoc, leaderId).projects.add(proj.id);
    }
  }

  // ===== RELACIÓN 2: Proyectos.PROY_NombreTecnologia → Tecnologias.TECN_NombreTecnologia =====
  for (const proj of projects) {
    const techName = String(proj.raw.PROY_NombreTecnologia || "").trim();
    const techId = techName ? resolveByName(technologyIndex, techName) : null;
    if (techId) {
      getOrCreateStore(projectAssoc, proj.id).technologies.add(techId);
      getOrCreateStore(technologyAssoc, techId).projects.add(proj.id);

      // Propagar tecnología al/los investigadores ya vinculados al proyecto
      // para que aparezca en la vista "Tecnologías asociadas" del investigador.
      const linkedInvestigators = getOrCreateStore(projectAssoc, proj.id).investigators;
      for (const investigatorId of linkedInvestigators) {
        getOrCreateStore(investigatorAssoc, investigatorId).technologies.add(techId);
        getOrCreateStore(technologyAssoc, techId).investigators.add(investigatorId);
      }
    }
  }

  // ===== RELACIÓN 3: Proyectos.PROY_ResponsableSeguimientoTecnico → EquipoInnovacion.Nombre =====
  // (Solo validación; EquipoInnovación no es una entidad principal en associations)

  // ===== RELACIÓN 4: Tecnologias.TECN_NombreProyecto → Proyectos.PROY_NombreProyecto =====
  // (Ya cubierta por relación 2 bidireccional)
  for (const tech of technologies) {
    const techId = resolveTechnologyId(tech);
    const projNames = splitRelationValues(String(tech.TECN_NombreProyecto || ""));

    for (const projName of projNames) {
      const projId = resolveByName(projectIndex, projName);
      if (!projId) continue;

      if (!getOrCreateStore(technologyAssoc, techId).projects.has(projId)) {
        getOrCreateStore(technologyAssoc, techId).projects.add(projId);
        getOrCreateStore(projectAssoc, projId).technologies.add(techId);
      }

      // Propagar investigadores del proyecto hacia la tecnología
      // para que aparezcan en "Asociados" de la tecnología.
      const projectInvestigators = getOrCreateStore(projectAssoc, projId).investigators;
      for (const investigatorId of projectInvestigators) {
        getOrCreateStore(technologyAssoc, techId).investigators.add(investigatorId);
        getOrCreateStore(investigatorAssoc, investigatorId).technologies.add(techId);
      }
    }
  }

  // ===== RELACIONES 5-17: Solo validación de integridad referencial =====
  // Estas relaciones se leen desde CSVs auxiliares (MadurezTecnol, Legal_PI, Legal_Doc,
  // Proy-Financiamiento, Proy-Involucrados, Comunicaciones)
  // y se valida su existencia pero no se almacenan en associations
  // porque esas tablas se acceden directamente desde la UI

  // Construir mapas finales
  const buildAssociationMap = (
    sourceIds: string[],
    sourceStore: Map<string, AssocStore>,
  ): Map<string, EntityAssociations> => {
    const out = new Map<string, EntityAssociations>();
    for (const id of sourceIds) {
      const store = sourceStore.get(id);
      if (!store) {
        out.set(id, emptyAssociations());
        continue;
      }
      out.set(id, {
        investigators: toLinkedSet(store.investigators, researcherIndex.refs),
        technologies: toLinkedSet(store.technologies, technologyIndex.refs),
        projects: toLinkedSet(store.projects, projectIndex.refs),
        institutions: toLinkedSet(store.institutions, institutionIndex.refs),
      });
    }
    return out;
  };

  return {
    investigatorById: buildAssociationMap(
      researchers.map((r) => r.id),
      investigatorAssoc
    ),
    technologyById: buildAssociationMap(
      technologies.map((t) => resolveTechnologyId(t)),
      technologyAssoc
    ),
    projectById: buildAssociationMap(
      projects.map((p) => p.id),
      projectAssoc
    ),
    institutionById: buildAssociationMap(
      institutions.map((i) => i.id),
      institutionAssoc
    ),
  };
}

async function getLinksCache(): Promise<LinksCache> {
  if (!cachePromise) cachePromise = buildLinksCache();
  return cachePromise;
}

export async function getInvestigatorAssociations(id: string): Promise<EntityAssociations> {
  const cache = await getLinksCache();
  return cache.investigatorById.get(String(id)) ?? emptyAssociations();
}

export async function getTechnologyAssociations(id: string): Promise<EntityAssociations> {
  const cache = await getLinksCache();
  return cache.technologyById.get(String(id)) ?? emptyAssociations();
}

export async function getProjectAssociations(id: string): Promise<EntityAssociations> {
  const cache = await getLinksCache();
  return cache.projectById.get(String(id)) ?? emptyAssociations();
}

export async function getInstitutionAssociations(id: string): Promise<EntityAssociations> {
  const cache = await getLinksCache();
  return cache.institutionById.get(String(id)) ?? emptyAssociations();
}

// ===== Funciones de resolución por nombre para validación de relaciones =====
// Usadas por lib/comunicaciones.ts y otros módulos para resolver referencias por nombre
// con matching normalizado (insensible a acentos, mayúsculas, puntuación)

export async function resolveInvestigatorIdByName(name: string): Promise<string | null> {
  const researchers = await getAllResearchers();
  const researcherIndex = createNameIndex(
    researchers.map((r) => ({ id: r.id, name: r.name, path: `/portafolio/investigadores/${r.id}` }))
  );
  return resolveByName(researcherIndex, name);
}

export async function resolveProjectIdByName(name: string): Promise<string | null> {
  const projects = await getAllProjects();
  const projectIndex = createNameIndex(
    projects.map((p) => ({ id: p.id, name: p.title, path: `/portafolio/proyectos/${p.id}` }))
  );
  return resolveByName(projectIndex, name);
}

export async function resolveTechnologyIdByNameForValidation(name: string): Promise<string | null> {
  const technologies = await getAllTechnologies();
  const technologyIndex = createNameIndex(
    technologies.map((t) => ({
      id: resolveTechnologyId(t),
      name: String(t.TECN_NombreTecnologia || "").trim(),
      path: `/portafolio/tecnologias/${resolveTechnologyId(t)}`,
    }))
  );
  return resolveByName(technologyIndex, name);
}
