import { getAllResearchers } from "./investigadores";
import { getAllProjects } from "./proyectos";
import { getAllInstitutions } from "./instituciones";
import { getAllTechnologies } from "./tecnologias";
import { normalizeText, slugifyNormalized, splitCandidateValues } from "./normalize";

type MatchMethod = "exact" | "fuzzy";

type MatchResult = {
  matchedId?: string;
  score: number;
  method?: MatchMethod;
  suggestions: Array<{ id: string; score: number }>;
};

type EntityRef = {
  id: string;
  name: string;
  path: string;
};

type LinkedSet = {
  auto: EntityRef[];
  suggested: Array<EntityRef & { score: number; method: MatchMethod }>;
};

type EntityAssociations = {
  investigators: LinkedSet;
  technologies: LinkedSet;
  projects: LinkedSet;
  institutions: LinkedSet;
};

type Candidate = {
  id: string;
  normalized: string;
  slug: string;
};

type EntityIndex = {
  candidates: Candidate[];
  slugMap: Map<string, Set<string>>;
  refs: Map<string, EntityRef>;
};

type AssocBucket = {
  auto: Set<string>;
  suggested: Map<string, { score: number; method: MatchMethod }>;
};

type AssocStore = {
  investigators: AssocBucket;
  technologies: AssocBucket;
  projects: AssocBucket;
  institutions: AssocBucket;
};

type LinksCache = {
  investigatorById: Map<string, EntityAssociations>;
  technologyById: Map<string, EntityAssociations>;
  projectById: Map<string, EntityAssociations>;
  institutionById: Map<string, EntityAssociations>;
};

const EXACT_THRESHOLD = 0.92;
const SUGGEST_THRESHOLD = 0.85;

const KEY_PATTERNS = {
  investigator: ["investigador", "investigadores", "pi", "director", "responsable", "lider"],
  institution: ["institucion", "institución", "entidad", "empresa", "partner", "organizacion", "organización", "coejecutor"],
  project: ["proyecto", "nombreproyecto", "project"],
  technology: ["tecnologia", "tecnología", "tecnologias", "tecnologías", "technology"],
} as const;

function normalizeKey(value: string): string {
  return normalizeText(value).replace(/\s+/g, "");
}

function jaroDistance(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const maxDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);

  let matches = 0;
  for (let i = 0; i < a.length; i += 1) {
    const start = Math.max(0, i - maxDist);
    const end = Math.min(i + maxDist + 1, b.length);
    for (let j = start; j < end; j += 1) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches += 1;
      break;
    }
  }

  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k += 1;
    if (a[i] !== b[k]) transpositions += 1;
    k += 1;
  }

  const m = matches;
  return (m / a.length + m / b.length + (m - transpositions / 2) / m) / 3;
}

function jaroWinkler(a: string, b: string): number {
  const jaro = jaroDistance(a, b);
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i += 1) {
    if (a[i] !== b[i]) break;
    prefix += 1;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

function createBucket(): AssocBucket {
  return { auto: new Set<string>(), suggested: new Map<string, { score: number; method: MatchMethod }>() };
}

function createStore(): AssocStore {
  return {
    investigators: createBucket(),
    technologies: createBucket(),
    projects: createBucket(),
    institutions: createBucket(),
  };
}

function getOrCreateStore(map: Map<string, AssocStore>, id: string): AssocStore {
  const existing = map.get(id);
  if (existing) return existing;
  const created = createStore();
  map.set(id, created);
  return created;
}

function addAuto(map: Map<string, AssocStore>, sourceId: string, key: keyof AssocStore, targetId: string) {
  const store = getOrCreateStore(map, sourceId);
  store[key].auto.add(targetId);
  store[key].suggested.delete(targetId);
}

function addSuggestion(map: Map<string, AssocStore>, sourceId: string, key: keyof AssocStore, targetId: string, score: number) {
  const store = getOrCreateStore(map, sourceId);
  if (store[key].auto.has(targetId)) return;
  const existing = store[key].suggested.get(targetId);
  if (!existing || score > existing.score) {
    store[key].suggested.set(targetId, { score, method: "fuzzy" });
  }
}

function createIndex(items: Array<{ id: string; aliases: string[]; name: string; path: string }>): EntityIndex {
  const refs = new Map<string, EntityRef>();
  const candidates: Candidate[] = [];
  const slugMap = new Map<string, Set<string>>();

  for (const item of items) {
    refs.set(item.id, { id: item.id, name: item.name, path: item.path });

    for (const alias of item.aliases) {
      const normalized = normalizeText(alias);
      const slug = slugifyNormalized(alias);
      if (!normalized || !slug) continue;
      candidates.push({ id: item.id, normalized, slug });
      if (!slugMap.has(slug)) slugMap.set(slug, new Set<string>());
      slugMap.get(slug)!.add(item.id);
    }
  }

  return { candidates, slugMap, refs };
}

function matchAgainstIndex(value: string, index: EntityIndex): MatchResult {
  const normalized = normalizeText(value);
  const slug = slugifyNormalized(value);
  if (!normalized || !slug) return { score: 0, suggestions: [] };

  const exact = index.slugMap.get(slug);
  if (exact && exact.size > 0) {
    const first = Array.from(exact)[0];
    return { matchedId: first, score: 1, method: "exact", suggestions: [] };
  }

  const bestById = new Map<string, number>();
  for (const candidate of index.candidates) {
    const score = jaroWinkler(normalized, candidate.normalized);
    const prev = bestById.get(candidate.id) ?? 0;
    if (score > prev) bestById.set(candidate.id, score);
  }

  const ranked = Array.from(bestById.entries())
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (best && best.score >= EXACT_THRESHOLD) {
    return { matchedId: best.id, score: best.score, method: "fuzzy", suggestions: [] };
  }

  const suggestions = ranked.filter((r) => r.score >= SUGGEST_THRESHOLD).slice(0, 5);
  return { score: best?.score ?? 0, suggestions };
}

function extractValuesFromRaw(raw: Record<string, string>, patterns: readonly string[]): string[] {
  const result: string[] = [];
  for (const [key, value] of Object.entries(raw || {})) {
    const normalizedKey = normalizeKey(key);
    const matched = patterns.some((pattern) => normalizedKey.includes(normalizeKey(pattern)));
    if (!matched) continue;
    splitCandidateValues(value).forEach((part) => result.push(part));
  }
  return Array.from(new Set(result.map((v) => v.trim()).filter(Boolean)));
}

function toLinkedSet(bucket: AssocBucket, refs: Map<string, EntityRef>): LinkedSet {
  const auto = Array.from(bucket.auto)
    .map((id) => refs.get(id))
    .filter((item): item is EntityRef => Boolean(item));

  const suggested = Array.from(bucket.suggested.entries())
    .map(([id, info]) => {
      const ref = refs.get(id);
      if (!ref) return null;
      return { ...ref, score: info.score, method: info.method };
    })
    .filter((item): item is EntityRef & { score: number; method: MatchMethod } => Boolean(item))
    .sort((a, b) => b.score - a.score);

  return { auto, suggested };
}

function emptyAssociations(): EntityAssociations {
  return {
    investigators: { auto: [], suggested: [] },
    technologies: { auto: [], suggested: [] },
    projects: { auto: [], suggested: [] },
    institutions: { auto: [], suggested: [] },
  };
}

let cachePromise: Promise<LinksCache> | null = null;

async function buildLinksCache(): Promise<LinksCache> {
  const [researchers, projects, institutions, techRows] = await Promise.all([
    getAllResearchers(),
    getAllProjects(),
    getAllInstitutions(),
    getAllTechnologies(),
  ]);

  const techItems = techRows.map((row) => {
    const id = String(row.TECN_ID || row.TECN_N || row.id || row.ID || Object.values(row)[0] || "").trim();
    const title = String(row.TECN_NombreTecnologia || row.TECN_NombreProyecto || row.title || row.nombre || id || "-").trim();
    const aliases = [
      id,
      title,
      String(row.TECN_NombreProyecto || "").trim(),
      String(row.TECN_N || "").trim(),
    ].filter(Boolean);

    return { id, name: title, aliases, path: `/portafolio/tecnologias/${encodeURIComponent(id)}`, raw: row };
  }).filter((item) => item.id);

  const researcherItems = researchers.map((item) => ({
    id: String(item.id),
    name: String(item.name || item.id),
    aliases: [item.id, item.name, item.raw.INV_NombreCompleto, item.raw.Nombre].filter(Boolean) as string[],
    path: `/portafolio/investigadores/${encodeURIComponent(item.id)}`,
    raw: item.raw,
  }));

  const projectItems = projects.map((item) => ({
    id: String(item.id),
    name: String(item.title || item.id),
    aliases: [
      item.id,
      item.title,
      item.raw.PROY_NombreProyecto,
      item.raw.PROY_TituloProyecto,
      item.raw["Nombre del proyecto"],
    ].filter(Boolean) as string[],
    path: `/portafolio/proyectos/${encodeURIComponent(item.id)}`,
    raw: item.raw,
    investigator: item.investigador,
    techNames: item.tecnologiasAsociadas,
  }));

  const institutionItems = institutions.map((item) => ({
    id: String(item.id),
    name: String(item.name || item.id),
    aliases: [item.id, item.name, item.raw.INST_RazonSocial, item.raw.INST_NombreFantasia].filter(Boolean) as string[],
    path: `/instituciones/${encodeURIComponent(item.id)}`,
    raw: item.raw,
  }));

  const researcherIndex = createIndex(researcherItems);
  const projectIndex = createIndex(projectItems);
  const institutionIndex = createIndex(institutionItems);
  const technologyIndex = createIndex(techItems);

  const investigatorAssoc = new Map<string, AssocStore>();
  const projectAssoc = new Map<string, AssocStore>();
  const institutionAssoc = new Map<string, AssocStore>();
  const technologyAssoc = new Map<string, AssocStore>();

  for (const project of projectItems) {
    const continuityCandidates = splitCandidateValues(project.raw.PROY_ProyectoAnteriorContinuidad || "");

    for (const value of continuityCandidates) {
      const match = matchAgainstIndex(value, projectIndex);
      if (match.matchedId && match.matchedId !== project.id) {
        addAuto(projectAssoc, project.id, "projects", match.matchedId);
        addAuto(projectAssoc, match.matchedId, "projects", project.id);
      }
      for (const suggestion of match.suggestions) {
        if (suggestion.id === project.id) continue;
        addSuggestion(projectAssoc, project.id, "projects", suggestion.id, suggestion.score);
      }
    }

    const invCandidates = [
      ...splitCandidateValues(project.investigator),
      ...extractValuesFromRaw(project.raw, KEY_PATTERNS.investigator),
    ];

    for (const value of invCandidates) {
      const match = matchAgainstIndex(value, researcherIndex);
      if (match.matchedId) {
        addAuto(projectAssoc, project.id, "investigators", match.matchedId);
        addAuto(investigatorAssoc, match.matchedId, "projects", project.id);
      }
      for (const suggestion of match.suggestions) {
        addSuggestion(projectAssoc, project.id, "investigators", suggestion.id, suggestion.score);
      }
    }

    const techCandidates = [
      ...(project.techNames || []),
      ...extractValuesFromRaw(project.raw, KEY_PATTERNS.technology),
    ];

    for (const value of techCandidates) {
      const match = matchAgainstIndex(value, technologyIndex);
      if (match.matchedId) {
        addAuto(projectAssoc, project.id, "technologies", match.matchedId);
        addAuto(technologyAssoc, match.matchedId, "projects", project.id);
      }
      for (const suggestion of match.suggestions) {
        addSuggestion(projectAssoc, project.id, "technologies", suggestion.id, suggestion.score);
      }
    }

    const instCandidates = extractValuesFromRaw(project.raw, KEY_PATTERNS.institution);
    for (const value of instCandidates) {
      const match = matchAgainstIndex(value, institutionIndex);
      if (match.matchedId) {
        addAuto(projectAssoc, project.id, "institutions", match.matchedId);
        addAuto(institutionAssoc, match.matchedId, "projects", project.id);
      }
      for (const suggestion of match.suggestions) {
        addSuggestion(projectAssoc, project.id, "institutions", suggestion.id, suggestion.score);
      }
    }
  }

  for (const tech of techItems) {
    const invCandidates = [
      ...splitCandidateValues(tech.raw.TECN_Investigadores || tech.raw.Investigadores || ""),
      ...extractValuesFromRaw(tech.raw, KEY_PATTERNS.investigator),
    ];

    for (const value of invCandidates) {
      const match = matchAgainstIndex(value, researcherIndex);
      if (match.matchedId) {
        addAuto(technologyAssoc, tech.id, "investigators", match.matchedId);
        addAuto(investigatorAssoc, match.matchedId, "technologies", tech.id);
      }
      for (const suggestion of match.suggestions) {
        addSuggestion(technologyAssoc, tech.id, "investigators", suggestion.id, suggestion.score);
      }
    }

    const instCandidates = extractValuesFromRaw(tech.raw, KEY_PATTERNS.institution);
    for (const value of instCandidates) {
      const match = matchAgainstIndex(value, institutionIndex);
      if (match.matchedId) {
        addAuto(technologyAssoc, tech.id, "institutions", match.matchedId);
        addAuto(institutionAssoc, match.matchedId, "technologies", tech.id);
      }
      for (const suggestion of match.suggestions) {
        addSuggestion(technologyAssoc, tech.id, "institutions", suggestion.id, suggestion.score);
      }
    }

    const projCandidates = [
      ...extractValuesFromRaw(tech.raw, KEY_PATTERNS.project),
      ...splitCandidateValues(tech.raw.TECN_NombreProyecto || ""),
    ];

    for (const value of projCandidates) {
      const match = matchAgainstIndex(value, projectIndex);
      if (match.matchedId) {
        addAuto(technologyAssoc, tech.id, "projects", match.matchedId);
        addAuto(projectAssoc, match.matchedId, "technologies", tech.id);
      }
      for (const suggestion of match.suggestions) {
        addSuggestion(technologyAssoc, tech.id, "projects", suggestion.id, suggestion.score);
      }
    }
  }

  for (const researcher of researcherItems) {
    const techCandidates = [
      ...extractValuesFromRaw(researcher.raw, KEY_PATTERNS.technology),
      ...splitCandidateValues(researcher.raw.INV_TecnologiasAsociadas || researcher.raw.INV_TecnologiaAsociada || ""),
    ];

    for (const value of techCandidates) {
      const match = matchAgainstIndex(value, technologyIndex);
      if (match.matchedId) {
        addAuto(investigatorAssoc, researcher.id, "technologies", match.matchedId);
        addAuto(technologyAssoc, match.matchedId, "investigators", researcher.id);
      }
      for (const suggestion of match.suggestions) {
        addSuggestion(investigatorAssoc, researcher.id, "technologies", suggestion.id, suggestion.score);
      }
    }

    const projCandidates = extractValuesFromRaw(researcher.raw, KEY_PATTERNS.project);
    for (const value of projCandidates) {
      const match = matchAgainstIndex(value, projectIndex);
      if (match.matchedId) {
        addAuto(investigatorAssoc, researcher.id, "projects", match.matchedId);
        addAuto(projectAssoc, match.matchedId, "investigators", researcher.id);
      }
      for (const suggestion of match.suggestions) {
        addSuggestion(investigatorAssoc, researcher.id, "projects", suggestion.id, suggestion.score);
      }
    }

    const instCandidates = extractValuesFromRaw(researcher.raw, KEY_PATTERNS.institution);
    for (const value of instCandidates) {
      const match = matchAgainstIndex(value, institutionIndex);
      if (match.matchedId) {
        addAuto(investigatorAssoc, researcher.id, "institutions", match.matchedId);
      }
      for (const suggestion of match.suggestions) {
        addSuggestion(investigatorAssoc, researcher.id, "institutions", suggestion.id, suggestion.score);
      }
    }
  }

  const buildAssociationMap = (
    sourceItems: Array<{ id: string }>,
    sourceStore: Map<string, AssocStore>,
  ): Map<string, EntityAssociations> => {
    const out = new Map<string, EntityAssociations>();
    for (const item of sourceItems) {
      const store = sourceStore.get(item.id);
      if (!store) {
        out.set(item.id, emptyAssociations());
        continue;
      }

      out.set(item.id, {
        investigators: toLinkedSet(store.investigators, researcherIndex.refs),
        technologies: toLinkedSet(store.technologies, technologyIndex.refs),
        projects: toLinkedSet(store.projects, projectIndex.refs),
        institutions: toLinkedSet(store.institutions, institutionIndex.refs),
      });
    }
    return out;
  };

  return {
    investigatorById: buildAssociationMap(researcherItems, investigatorAssoc),
    technologyById: buildAssociationMap(techItems, technologyAssoc),
    projectById: buildAssociationMap(projectItems, projectAssoc),
    institutionById: buildAssociationMap(institutionItems, institutionAssoc),
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
