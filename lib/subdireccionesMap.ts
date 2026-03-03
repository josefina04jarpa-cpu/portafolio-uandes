import { normalizeText } from "./normalize";

export type SubdireccionSlug =
  | "emprendimiento"
  | "proyectos"
  | "desarrollo-tecnologico-y-comercializacion"
  | "propiedad-intelectual"
  | "comunicaciones"
  | "proyecto-bici";

export type SubdireccionMeta = {
  slug: SubdireccionSlug;
  title: string;
  shortDescription: string;
  longDescription: string;
  accentColor: string;
  icon: "rocket" | "folder" | "cpu" | "shield" | "megaphone";
};

export const SUBDIRECCIONES: SubdireccionMeta[] = [
  {
    slug: "emprendimiento",
    title: "Subdirección de Emprendimiento",
    shortDescription: "Impulsa iniciativas tempranas, validación y conexión con oportunidades de mercado.",
    longDescription:
      "Lidera programas e iniciativas para transformar ideas en soluciones con potencial de impacto, acompañando etapas iniciales de validación y crecimiento.",
    accentColor: "#7c3aed",
    icon: "rocket",
  },
  {
    slug: "proyectos",
    title: "Subdirección de Proyectos",
    shortDescription: "Gestiona la formulación, postulación y seguimiento de proyectos estratégicos.",
    longDescription:
      "Coordina el ciclo de vida de proyectos, desde su diseño y postulación hasta su ejecución y cierre, articulando equipos y oportunidades de financiamiento.",
    accentColor: "#2563eb",
    icon: "folder",
  },
  {
    slug: "desarrollo-tecnologico-y-comercializacion",
    title: "Subdir. Desarrollo Tecnológico y Comercialización",
    shortDescription: "Acelera la transferencia y comercialización de tecnologías con foco en adopción.",
    longDescription:
      "Promueve la maduración tecnológica y la estrategia de comercialización para conectar resultados de I+D con necesidades reales de la sociedad y la industria.",
    accentColor: "#0f766e",
    icon: "cpu",
  },
  {
    slug: "propiedad-intelectual",
    title: "Asuntos Jurídicos",
    shortDescription: "Protege activos de conocimiento y gestiona la estrategia de propiedad intelectual.",
    longDescription:
      "Conduce procesos de protección de resultados, apoyando decisiones sobre registro, titularidad y resguardo de activos intangibles institucionales.",
    accentColor: "#be123c",
    icon: "shield",
  },
  {
    slug: "comunicaciones",
    title: "Área de Comunicaciones",
    shortDescription: "Visibiliza el impacto de la innovación mediante medios, prensa y plataformas digitales.",
    longDescription:
      "Diseña y ejecuta estrategias de difusión para fortalecer el posicionamiento de proyectos, tecnologías e investigadores ante públicos internos y externos.",
    accentColor: "#d97706",
    icon: "megaphone",
  },
  {
    slug: "proyecto-bici",
    title: "Proyecto BiCI",
    shortDescription: "Impulsa iniciativas con impacto social y territorial, integrando academia, comunidad y Open Lab.",
    longDescription:
      "Articula proyectos de la iniciativa BiCI y la operación de Open Lab para acelerar soluciones aplicadas, con foco en transferencia de conocimiento e impacto en comunidades.",
    accentColor: "#0ea5e9",
    icon: "cpu",
  },
];

export function getSubdireccionMeta(slug: string): SubdireccionMeta | null {
  return SUBDIRECCIONES.find((item) => item.slug === slug) || null;
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function classifyProjectToSubdireccion(source: string): SubdireccionSlug | null {
  const text = normalizeText(source);
  if (!text) return null;

  if (includesAny(text, ["bici", "bidirectional commitment in innovation", "open lab", "ines i d", "maria isabel gonzalez"])) {
    return "proyecto-bici";
  }

  if (
    includesAny(text, [
      "innovacion sostenible",
      "incubadora",
      "incubacion",
      "preincubacion",
      "alumno",
      "alumnos",
      "alumna",
      "alumnas",
      "alumni",
    ])
  ) {
    return "emprendimiento";
  }

  if (includesAny(text, ["subdir de proyectos", "subdireccion de proyectos", "proyectos de innovacion"])) {
    return "proyectos";
  }

  if (includesAny(text, ["desarrollo tecnologico", "comercializacion", "transferencia tecnologica"])) {
    return "desarrollo-tecnologico-y-comercializacion";
  }

  if (includesAny(text, ["emprend", "inicia tu idea", "incubadora", "startup", "conecta i d", "paei"])) {
    return "emprendimiento";
  }

  return null;
}

export function classifyIndicatorToSubdireccion(source: string): SubdireccionSlug | null {
  const text = normalizeText(source);
  if (!text) return null;

  if (includesAny(text, ["bici", "open lab", "bidirectional commitment in innovation", "ines i d", "maria isabel gonzalez"])) {
    return "proyecto-bici";
  }

  if (includesAny(text, ["patente", "propiedad intelectual", "registro", "licencia", "pi"])) {
    return "propiedad-intelectual";
  }

  if (includesAny(text, ["comunic", "medio", "rrss", "engagement", "aparicion", "difusion"])) {
    return "comunicaciones";
  }

  if (
    includesAny(text, [
      "innovacion sostenible",
      "alumno",
      "alumnos",
      "alumna",
      "alumnas",
      "alumni",
      "incubadora",
      "incubacion",
      "emprend",
      "incub",
      "startup",
    ])
  ) {
    return "emprendimiento";
  }

  if (includesAny(text, ["proyecto", "fondo", "postul", "adjudic"])) {
    return "proyectos";
  }

  if (includesAny(text, ["transfer", "comercial", "tecnolog"])) {
    return "desarrollo-tecnologico-y-comercializacion";
  }

  return null;
}

export function splitNames(value: string): string[] {
  return String(value || "")
    .split(/;|,|\||\n|\s+y\s+/gi)
    .map((item) => item.trim())
    .filter(Boolean);
}
