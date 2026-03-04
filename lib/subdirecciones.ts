import { getAllProjects } from "./proyectos";
import getAllTechnologies from "./tecnologias";
import { getAllResearchers } from "./investigadores";
import { getLegalPI } from "./legal_pi";
import { getAllComunicaciones } from "./comunicaciones";
import { getAllIndicators } from "./indicadores";
import { normalizeText } from "./normalize";
import { getMiembrosBySubdireccion, getPhotoUrlForName } from "./equipoInnovacion";
import {
  SUBDIRECCIONES,
  type SubdireccionMeta,
  type SubdireccionSlug,
  classifyIndicatorToSubdireccion,
  classifyProjectToSubdireccion,
  getSubdireccionMeta,
  splitNames,
} from "./subdireccionesMap";

type RelatedItem = {
  id: string;
  title: string;
  path: string;
};

type RelatedIndicator = {
  id: string;
  title: string;
  responsable: string;
  dato: string;
};

type RelatedCommunication = {
  title: string;
  medio: string;
  tipo: string;
  tipoMedio: string;
  fecha: string;
  link: string;
  montoEstimado: number | null;
  impresiones: number | null;
  alcance: number | null;
  interaccion: number | null;
  clicks: number | null;
  engagement: number | null;
  importanceScore: number;
};

type SubdireccionMetric = {
  label: string;
  value: number | null;
};

export type TeamMember = {
  nombre: string;
  cargo: string;
  area: string;
  email: string;
  photoUrl?: string;
};

export type SubdireccionCardData = SubdireccionMeta & {
  metrics: [SubdireccionMetric, SubdireccionMetric, SubdireccionMetric];
};

export type SubdireccionDetailData = SubdireccionMeta & {
  team: TeamMember[];
  projects: RelatedItem[];
  technologies: RelatedItem[];
  indicators: RelatedIndicator[];
  communications: RelatedCommunication[];
  legalStatusSummary: Array<{ label: string; count: number }>;
};

type AreaAccum = {
  projectIds: Set<string>;
  technologyIds: Set<string>;
  researcherNames: Set<string>;
  indicatorKeys: Set<string>;
  communicationKeys: Set<string>;
  legalKeys: Set<string>;
};

type CachedData = {
  cards: SubdireccionCardData[];
  details: Record<SubdireccionSlug, SubdireccionDetailData>;
};

let cache: CachedData | null = null;

function buildAccumulator(): AreaAccum {
  return {
    projectIds: new Set<string>(),
    technologyIds: new Set<string>(),
    researcherNames: new Set<string>(),
    indicatorKeys: new Set<string>(),
    communicationKeys: new Set<string>(),
    legalKeys: new Set<string>(),
  };
}

function toProjectItem(id: string, title: string): RelatedItem {
  return {
    id,
    title,
    path: `/portafolio/proyectos/${encodeURIComponent(id)}`,
  };
}

function toTechnologyItem(id: string, title: string): RelatedItem {
  return {
    id,
    title,
    path: `/portafolio/tecnologias/${encodeURIComponent(id)}`,
  };
}

function parseDateForSort(dateText: string): number {
  const text = String(dateText || "").trim();
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return 0;

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const date = new Date(year, month, day);
  if (Number.isNaN(date.getTime())) return 0;
  return date.getTime();
}

function parseMetricValue(value: string): number | null {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const cleaned = raw
    .replace(/\s+/g, "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const num = Number(cleaned);
  if (Number.isNaN(num) || !Number.isFinite(num)) return null;
  return num;
}

function formatNumberForIndicator(value: number): string {
  return new Intl.NumberFormat("es-CL").format(value);
}

function parseCurrencyLikeValue(value: string): number {
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const cleaned = raw
    .replace(/\s+/g, "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const num = Number(cleaned);
  if (Number.isNaN(num) || !Number.isFinite(num)) return 0;
  return num;
}

function scoreIndicatorForArea(
  slug: SubdireccionSlug,
  indicator: { nombre_indicador?: string; categoria?: string; responsable?: string },
): number {
  const text = normalizeText([
    String(indicator.nombre_indicador || ""),
    String(indicator.categoria || ""),
    String(indicator.responsable || ""),
  ].join(" "));

  const keywordMap: Record<SubdireccionSlug, string[]> = {
    emprendimiento: ["incubadora", "emprend", "startup", "alumno", "alumnos", "innovacion sostenible", "microemprendedor"],
    proyectos: ["proyecto", "proyectos", "postul", "adjudic", "fondo", "activo", "ejecucion"],
    "desarrollo-tecnologico-y-comercializacion": ["transfer", "comercial", "licenc", "mercado", "tecnolog", "spin", "venta"],
    "propiedad-intelectual": ["patente", "propiedad intelectual", "registro", "licencia", "solicitud", "conced"],
    comunicaciones: ["prensa", "medio", "rrss", "aparicion", "evento", "alcance", "impresion", "vpe", "difusion"],
    "proyecto-bici": ["bici", "open lab", "impacto social", "bidirectional", "ines i d", "maria isabel gonzalez"],
  };

  return keywordMap[slug].reduce((acc, keyword) => (text.includes(keyword) ? acc + 1 : acc), 0);
}

function communicationImportance(metrics: {
  impresiones: number | null;
  alcance: number | null;
  interaccion: number | null;
  clicks: number | null;
  engagement: number | null;
}): number {
  const metricValues = [metrics.impresiones, metrics.alcance, metrics.interaccion, metrics.clicks].map((value) =>
    Math.log1p(Math.max(0, value ?? 0)),
  );

  const engagementBoost = Math.max(0, metrics.engagement ?? 0) * 0.25;
  return metricValues.reduce((acc, current) => acc + current, 0) + engagementBoost;
}

function normalizeProjectAreaSource(raw: Record<string, string>): string {
  return [
    raw.PROY_ResponsablePostulacion,
    raw.PROY_ResponsableSeguimientoTecnico,
    raw.PROY_FondoPostulado,
    raw.PROY_DetalleFondoPostulado,
    raw.PROY_NombreProyecto,
    raw.PROY_TituloProyecto,
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeTechnologyProjectNames(value: string): string[] {
  return String(value || "")
    .split(/,|;|\|/)
    .map((name) => name.trim())
    .filter(Boolean);
}

async function buildData(): Promise<CachedData> {
  const [projects, technologies, researchers, legalItems, communications, indicators] = await Promise.all([
    getAllProjects(),
    getAllTechnologies(),
    getAllResearchers(),
    getLegalPI(),
    Promise.resolve(getAllComunicaciones()),
    getAllIndicators(),
  ]);

  const accumByArea: Record<SubdireccionSlug, AreaAccum> = {
    emprendimiento: buildAccumulator(),
    proyectos: buildAccumulator(),
    "desarrollo-tecnologico-y-comercializacion": buildAccumulator(),
    "propiedad-intelectual": buildAccumulator(),
    comunicaciones: buildAccumulator(),
    "proyecto-bici": buildAccumulator(),
  };

  const projectMap = new Map<string, (typeof projects)[number]>();
  const projectAreaByName = new Map<string, SubdireccionSlug>();
  for (const project of projects) {
    projectMap.set(project.id, project);

    const areaFromProject = classifyProjectToSubdireccion(normalizeProjectAreaSource(project.raw));
    if (!areaFromProject) continue;

    const areaAccum = accumByArea[areaFromProject];
    areaAccum.projectIds.add(project.id);

    const normalizedName = normalizeText(project.title || project.raw.PROY_NombreProyecto || "");
    if (normalizedName) projectAreaByName.set(normalizedName, areaFromProject);

    splitNames([project.investigador, project.raw.PROY_InvestigadorLiderUANDES, project.raw.PROY_CoEjecutor].filter(Boolean).join(";"))
      .forEach((name) => areaAccum.researcherNames.add(name));
  }

  const technologyMap = new Map<string, RelatedItem>();
  for (const technology of technologies) {
    const technologyId = String(technology.TECN_ID || technology.TECN_N || "").trim();
    const technologyTitle = String(technology.TECN_NombreTecnologia || technology.TECN_NombreProyecto || "").trim();
    if (!technologyId || !technologyTitle) continue;

    technologyMap.set(technologyId, toTechnologyItem(technologyId, technologyTitle));

    const projectNames = normalizeTechnologyProjectNames(technology.TECN_NombreProyecto);
    const normalizedCandidates = [
      ...projectNames.map((name) => normalizeText(name)),
      normalizeText(technologyTitle),
    ].filter(Boolean);

    let assignedArea: SubdireccionSlug | null = null;
    for (const candidate of normalizedCandidates) {
      const area = projectAreaByName.get(candidate);
      if (area) {
        assignedArea = area;
        break;
      }
    }

    if (assignedArea) {
      accumByArea[assignedArea].technologyIds.add(technologyId);
    }
  }

  const researcherMap = new Map<string, string>();
  for (const researcher of researchers) {
    const normalizedName = normalizeText(researcher.name);
    if (normalizedName) researcherMap.set(normalizedName, researcher.name);
  }

  const includeResearcherInArea = (slug: SubdireccionSlug, rawName: string) => {
    const normalized = normalizeText(rawName);
    if (!normalized) return;

    const exact = researcherMap.get(normalized);
    if (exact) {
      accumByArea[slug].researcherNames.add(exact);
      return;
    }

    for (const [nameKey, nameValue] of researcherMap.entries()) {
      if (nameKey.includes(normalized) || normalized.includes(nameKey)) {
        accumByArea[slug].researcherNames.add(nameValue);
      }
    }
  };

  for (const legal of legalItems) {
    const legalKey = `${legal.LGL_N}|${legal.LGL_NombrePI}`;
    accumByArea["propiedad-intelectual"].legalKeys.add(legalKey);

    splitNames(legal.LGL_CreadoresUANDES).forEach((name) => includeResearcherInArea("propiedad-intelectual", name));

    const normalizedProduct = normalizeText(legal.LGL_NombreProdAsoc);
    if (!normalizedProduct) continue;

    for (const project of projects) {
      const projectName = normalizeText(project.title);
      if (projectName && (projectName.includes(normalizedProduct) || normalizedProduct.includes(projectName))) {
        accumByArea["propiedad-intelectual"].projectIds.add(project.id);
      }
    }

    for (const [technologyId, technologyItem] of technologyMap.entries()) {
      const techName = normalizeText(technologyItem.title);
      if (techName && (techName.includes(normalizedProduct) || normalizedProduct.includes(techName))) {
        accumByArea["propiedad-intelectual"].technologyIds.add(technologyId);
      }
    }
  }

  const communicationRows: RelatedCommunication[] = [];
  for (const communication of communications) {
    const communicationKey = `${communication.COM_N}|${communication.COM_Titular}`;
    accumByArea.comunicaciones.communicationKeys.add(communicationKey);

    if (communication.COM_Vocero) {
      splitNames(communication.COM_Vocero).forEach((name) => includeResearcherInArea("comunicaciones", name));
    }

    const associatedName = normalizeText(communication.COM_NombreProdAsoc);
    if (associatedName) {
      for (const project of projects) {
        const projectName = normalizeText(project.title);
        if (projectName && (projectName.includes(associatedName) || associatedName.includes(projectName))) {
          accumByArea.comunicaciones.projectIds.add(project.id);
        }
      }

      for (const [technologyId, technologyItem] of technologyMap.entries()) {
        const techName = normalizeText(technologyItem.title);
        if (techName && (techName.includes(associatedName) || associatedName.includes(techName))) {
          accumByArea.comunicaciones.technologyIds.add(technologyId);
        }
      }
    }

    communicationRows.push({
      title: communication.COM_Titular || "Sin titular",
      medio: communication.COM_Medio || "-",
      tipo: communication.COM_TipoComun || "-",
      tipoMedio: communication.COM_TipoMedio || "-",
      fecha: communication.COM_Fecha || "-",
      link: communication.COM_Link || "",
      montoEstimado: parseMetricValue(communication.COM_MontoEstimado),
      impresiones: parseMetricValue(communication.COM_Impresiones),
      alcance: parseMetricValue(communication.COM_Alcance),
      interaccion: parseMetricValue(communication.COM_Interaccion),
      clicks: parseMetricValue(communication.COM_Clics),
      engagement: parseMetricValue(communication.COM_Engagement),
      importanceScore: communicationImportance({
        impresiones: parseMetricValue(communication.COM_Impresiones),
        alcance: parseMetricValue(communication.COM_Alcance),
        interaccion: parseMetricValue(communication.COM_Interaccion),
        clicks: parseMetricValue(communication.COM_Clics),
        engagement: parseMetricValue(communication.COM_Engagement),
      }),
    });
  }

  for (const indicator of indicators) {
    const source = [indicator.nombre_indicador, indicator.categoria, indicator.responsable].filter(Boolean).join(" ");
    const area = classifyIndicatorToSubdireccion(source);
    if (!area) continue;

    accumByArea[area].indicatorKeys.add(String(indicator.id));
  }

  const projectItems = projects.map((project) => toProjectItem(project.id, project.title));
  const projectItemsMap = new Map(projectItems.map((item) => [item.id, item]));

  const indicatorsById = new Map(indicators.map((indicator) => [String(indicator.id), indicator]));

  const legalStatusSummary = legalItems.reduce<Record<string, number>>((acc, item) => {
    const label = item.LGL_Estado || "Sin estado";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const details = {} as Record<SubdireccionSlug, SubdireccionDetailData>;
  const cards: SubdireccionCardData[] = [];

  for (const meta of SUBDIRECCIONES) {
    const areaAccum = accumByArea[meta.slug];

    const relatedProjects = Array.from(areaAccum.projectIds)
      .map((projectId) => projectItemsMap.get(projectId))
      .filter((item): item is RelatedItem => Boolean(item))
      .sort((first, second) => first.title.localeCompare(second.title, "es", { sensitivity: "base" }));

    const adjudicatedProjectsCount = relatedProjects.reduce((acc, project) => {
      const source = projectMap.get(project.id);
      return acc + (source?.adjudicado ? 1 : 0);
    }, 0);

    const relatedTechnologies = Array.from(areaAccum.technologyIds)
      .map((technologyId) => technologyMap.get(technologyId))
      .filter((item): item is RelatedItem => Boolean(item))
      .sort((first, second) => first.title.localeCompare(second.title, "es", { sensitivity: "base" }));

    const areaIndicatorRows = Array.from(areaAccum.indicatorKeys)
      .map((indicatorId) => indicatorsById.get(indicatorId))
      .filter((indicator): indicator is NonNullable<typeof indicator> => Boolean(indicator))
      .sort((first, second) => {
        const scoreDiff = scoreIndicatorForArea(meta.slug, second) - scoreIndicatorForArea(meta.slug, first);
        if (scoreDiff !== 0) return scoreDiff;
        return String(first.nombre_indicador || "").localeCompare(String(second.nombre_indicador || ""), "es", {
          sensitivity: "base",
        });
      });

    // Build team from EquipoInnovación.csv by AreaEstrategica
    const csvMembers = getMiembrosBySubdireccion(meta.slug);
    const team: TeamMember[] = csvMembers.map((m) => ({
      nombre: m.nombre,
      cargo: m.cargo,
      area: m.area,
      email: m.correo,
      photoUrl: getPhotoUrlForName(m.nombre) || undefined,
    }));

    const areaCommunications =
      meta.slug === "comunicaciones"
        ? [...communicationRows].sort((first, second) => {
            const diff = second.importanceScore - first.importanceScore;
            if (diff !== 0) return diff;
            return parseDateForSort(second.fecha) - parseDateForSort(first.fecha);
          })
        : [];

    const relatedIndicators: RelatedIndicator[] =
      meta.slug === "comunicaciones"
        ? [
            {
              id: "com-notas-prensa-2025",
              title: "N° de notas de prensa (2025)",
              responsable: "Área de Comunicaciones",
              dato: formatNumberForIndicator(
                areaCommunications.filter((item) => {
                  const tipo = normalizeText(item.tipo);
                  const tipoMedio = normalizeText(item.tipoMedio);
                  return tipo.includes("nota") || tipoMedio.includes("prensa") || tipo.includes("prensa");
                }).length,
              ),
            },
            {
              id: "com-cobertura-vpe-2025",
              title: "Cobertura mediática VPE (2025)",
              responsable: "Área de Comunicaciones",
              dato: formatNumberForIndicator(
                areaCommunications.reduce((acc, item) => acc + (item.montoEstimado ?? 0), 0),
              ),
            },
            {
              id: "com-eventos-2025",
              title: "Cantidad de eventos (2025)",
              responsable: "Área de Comunicaciones",
              dato: formatNumberForIndicator(
                areaCommunications.filter((item) => {
                  const tipo = normalizeText(item.tipo);
                  const tipoMedio = normalizeText(item.tipoMedio);
                  return tipo.includes("evento") || tipoMedio.includes("evento");
                }).length,
              ),
            },
          ]
        : meta.slug === "proyecto-bici"
          ? [
              {
                id: "bici-proyectos-totales",
                title: "N° de proyectos BiCI",
                responsable: "María Isabel González",
                dato: formatNumberForIndicator(relatedProjects.length),
              },
              {
                id: "bici-proyectos-activos",
                title: "N° de proyectos activos BiCI",
                responsable: "María Isabel González",
                dato: formatNumberForIndicator(
                  relatedProjects.reduce((acc, project) => {
                    const source = projectMap.get(project.id);
                    return acc + (normalizeText(source?.raw.PROY_Activo || "") === "si" ? 1 : 0);
                  }, 0),
                ),
              },
              {
                id: "bici-monto-postulado",
                title: "Monto postulado BiCI",
                responsable: "María Isabel González",
                dato: formatNumberForIndicator(
                  Math.round(
                    relatedProjects.reduce((acc, project) => {
                      const source = projectMap.get(project.id);
                      return acc + parseCurrencyLikeValue(source?.raw.PROY_PresupuestoPostulado || "");
                    }, 0),
                  ),
                ),
              },
            ]
        : areaIndicatorRows
            .map((indicator) => ({
              id: String(indicator.id || ""),
              title: String(indicator.nombre_indicador || ""),
              responsable: String(indicator.responsable || ""),
              dato: [String(indicator.valor_2025 || "").trim(), String(indicator.unidad || "").trim()].filter(Boolean).join(" "),
            }))
            .filter((item) => item.title);

    const cardMetrics: [SubdireccionMetric, SubdireccionMetric, SubdireccionMetric] =
      meta.slug === "propiedad-intelectual"
        ? [
            { label: "Registros PI", value: areaAccum.legalKeys.size },
            { label: "Tecnologías", value: relatedTechnologies.length },
            { label: "Investigadores", value: team.length },
          ]
        : meta.slug === "comunicaciones"
          ? [
              {
                label: "Notas prensa",
                value: areaCommunications.filter((item) => {
                  const tipo = normalizeText(item.tipo);
                  const tipoMedio = normalizeText(item.tipoMedio);
                  return tipo.includes("nota") || tipoMedio.includes("prensa") || tipo.includes("prensa");
                }).length,
              },
              {
                label: "Cobertura VPE",
                value: Math.round(areaCommunications.reduce((acc, item) => acc + (item.montoEstimado ?? 0), 0)),
              },
              {
                label: "Eventos",
                value: areaCommunications.filter((item) => {
                  const tipo = normalizeText(item.tipo);
                  const tipoMedio = normalizeText(item.tipoMedio);
                  return tipo.includes("evento") || tipoMedio.includes("evento");
                }).length,
              },
            ]
        : meta.slug === "proyectos"
          ? [
              { label: "N° proyectos postulados", value: relatedProjects.length },
              { label: "N° proyectos adjudicados", value: adjudicatedProjectsCount },
              { label: "Investigadores", value: team.length },
            ]
        : meta.slug === "proyecto-bici"
          ? [
              { label: "Proyectos BiCI", value: relatedProjects.length },
              {
                label: "Activos BiCI",
                value: relatedProjects.reduce((acc, project) => {
                  const source = projectMap.get(project.id);
                  return acc + (normalizeText(source?.raw.PROY_Activo || "") === "si" ? 1 : 0);
                }, 0),
              },
              { label: "Investigadores", value: team.length },
            ]
        : [
            { label: "Proyectos", value: relatedProjects.length },
            { label: "Tecnologías", value: relatedTechnologies.length },
            { label: "Investigadores", value: team.length },
          ];

    cards.push({
      ...meta,
      metrics: cardMetrics,
    });

    details[meta.slug] = {
      ...meta,
      team,
      projects: relatedProjects,
      technologies: relatedTechnologies,
      indicators: relatedIndicators,
      communications: areaCommunications,
      legalStatusSummary:
        meta.slug === "propiedad-intelectual"
          ? Object.entries(legalStatusSummary)
              .map(([label, count]) => ({ label, count }))
              .sort((first, second) => second.count - first.count)
          : [],
    };
  }

  return { cards, details };
}

async function getData(): Promise<CachedData> {
  if (cache) return cache;
  cache = await buildData();
  return cache;
}

export async function getSubdireccionesCards(): Promise<SubdireccionCardData[]> {
  const data = await getData();
  return data.cards;
}

export async function getSubdireccionDetail(slug: string): Promise<SubdireccionDetailData | null> {
  const meta = getSubdireccionMeta(slug);
  if (!meta) return null;

  const data = await getData();
  return data.details[meta.slug] || null;
}
