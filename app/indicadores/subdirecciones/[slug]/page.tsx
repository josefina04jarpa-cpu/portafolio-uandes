import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImpresionesMensualesCard from "../../../../components/communications/ImpresionesMensualesCard";
import FacultyDistributionChart from "../../../../components/emprendimiento/FacultyDistributionChart";
import TopNavigation from "../../../../components/TopNavigation";
import { getMonthlyImpressions } from "../../../../lib/comunicaciones";
import { getIncubadoraSummary } from "../../../../lib/incubadora";
import { normalizeText } from "../../../../lib/normalize";
import { getSubdireccionDetail } from "../../../../lib/subdirecciones";
import { SUBDIRECCIONES } from "../../../../lib/subdireccionesMap";

type Params = { params: { slug: string } | Promise<{ slug: string }> };

const AVATAR_BY_NORMALIZED_NAME: Record<string, string> = {
  [normalizeText("María Fernanda Gana")]: "/Fernanda Gana.png",
  [normalizeText("Josefina Jarpa")]: "/Josefina Jarpa.png",
  [normalizeText("Daniela Sánchez")]: "/Daniela Sánchez.png",
  [normalizeText("Camila Adonis")]: "/Camila Adonis.png",
  [normalizeText("Karen Marquez")]: "/Karen Marquez.png",
  [normalizeText("Claudio Arriaza")]: "/Claudio Arriaza.png",
  [normalizeText("Anil Sadarangani")]: "/Anil Sadarangani.png",
  [normalizeText("Danilo Segovia")]: "/Danilo Segovia.png",
  [normalizeText("Ricardo Cacciuttolo")]: "/Ricardo Cacciuttolo.png",
  [normalizeText("María Isabel González")]: "/Isabel González.png",
  [normalizeText("Vicente Meza")]: "/Vicente Meza.png",
};

function getAvatarSrc(name: string): string | null {
  return AVATAR_BY_NORMALIZED_NAME[normalizeText(name)] || null;
}

function getInitials(name: string): string {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase() || "").join("") || "?";
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const detail = await getSubdireccionDetail(slug);
  if (!detail) return notFound();

  const bannerBySlug: Partial<Record<string, { src: string; alt: string }>> = {
    comunicaciones: {
      src: "/background-comunicaciones.png",
      alt: "Banner Área de Comunicaciones",
    },
    proyectos: {
      src: "/background-proyectos.png",
      alt: "Banner Subdirección de Proyectos",
    },
    "propiedad-intelectual": {
      src: "/background-pi.png",
      alt: "Banner Subdirección de Propiedad Intelectual",
    },
    "desarrollo-tecnologico-y-comercializacion": {
      src: "/%20background-Desarrollo-Tecnológico-y-Comercialización.png",
      alt: "Banner Subdirección de Desarrollo Tecnológico y Comercialización",
    },
    emprendimiento: {
      src: "/background-emprendimiento.png",
      alt: "Banner Subdirección de Emprendimiento",
    },
  };

  const banner = bannerBySlug[detail.slug];

  const incubadoraSummary = await getIncubadoraSummary();

  const comunicacionesTeam = [
    {
      name: "María Fernanda Gana",
      role: "Jefa de Comunicaciones",
      email: "mfgana@uandes.cl",
    },
    {
      name: "Josefina Jarpa",
      role: "Content Manager (depende de María Fernanda Gana)",
      email: "jjarpa@uandes.cl",
    },
  ];

  const desarrolloTeam = [
    {
      name: "Daniela Sánchez",
      role: "Jefa de Asuntos Jurídicos",
      email: "dsanchezr@uandes.cl",
    },
    {
      name: "Camila Adonis",
      role: "Coordinadora de Proyectos de Innovación",
      email: "cadonisr@uandes.cl",
    },
    {
      name: "Karen Marquez",
      role: "Gestora Tecnológica",
      email: "kmarquez@uandes.cl",
    },
    {
      name: "Claudio Arriaza",
      role: "Agente de Comercialización",
      email: "carriaza@uandes.cl",
    },
  ];

  const proyectosTeam = [
    {
      name: "Danilo Segovia",
      role: "Subdirector de Proyectos de Innovación",
      email: "dsegovia@uandes.cl",
    },
    {
      name: "Ricardo Cacciuttolo",
      role: "Coordinador de Proyectos de Innovación",
      email: "rcacciuttolo@uandes.cl",
    },
  ];

  const asuntosJuridicosTeam = [
    {
      name: "Daniela Sánchez",
      role: "Jefa de Asuntos Jurídicos",
      email: "dsanchezr@uandes.cl",
    },
  ];

  const biciTeam = [
    {
      name: "María Isabel González",
      role: "Coordinadora Iniciativa BiCI",
      email: "migonzalezm@uandes.cl",
    },
    {
      name: "Vicente Meza",
      role: "Asistente Open Lab",
      email: "ext_vmeza@uandes.cl",
    },
  ];

  const communicationsChartYear = 2025;
  const communicationRowsForMonthly = detail.communications.map((item) => ({
    COM_Fecha: item.fecha,
    COM_TipoMedio: item.tipoMedio,
    COM_Medio: item.medio,
    COM_Impresiones: String(item.impresiones ?? 0),
  }));

  const monthlyValuesByPlatform = {
    Todos: getMonthlyImpressions(communicationRowsForMonthly, {
      year: communicationsChartYear,
      platform: "Todos",
    }).map((item) => item.value),
    Instagram: getMonthlyImpressions(communicationRowsForMonthly, {
      year: communicationsChartYear,
      platform: "Instagram",
    }).map((item) => item.value),
    LinkedIn: getMonthlyImpressions(communicationRowsForMonthly, {
      year: communicationsChartYear,
      platform: "LinkedIn",
    }).map((item) => item.value),
  };

  return (
    <div className="min-h-screen bg-transparent">
      <TopNavigation active="indicadores" indicadoresYear={2025} />

      <main>
        <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            {banner && (
              <div className="-mx-6 -mt-6 mb-6 overflow-hidden rounded-t-2xl border-b border-gray-100">
                <Image
                  src={banner.src}
                  alt={banner.alt}
                  width={1600}
                  height={520}
                  className="h-[260px] w-full object-cover"
                  priority
                />
              </div>
            )}

            <div className="mb-3 text-sm text-gray-600">
              <Link href="/indicadores/subdirecciones" className="text-slate-700 hover:underline">
                Subdirecciones
              </Link>
              <span className="mx-2">&gt;</span>
              <span className="font-medium text-slate-900">{detail.title}</span>
            </div>

            <h1 className="text-2xl font-semibold text-slate-900">{detail.title}</h1>
            <p className="mt-2 text-sm text-gray-600">{detail.longDescription}</p>

            {detail.slug === "comunicaciones" && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Redes sociales:</span>
                <a
                  href="https://www.instagram.com/innovacionuandes/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-700 transition hover:bg-gray-50"
                  aria-label="Instagram Innovación UANDES"
                  title="Instagram"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                    <path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm8.95 1.4a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8Z" />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/company/innovacionuandes/?originalSubdomain=cl"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-700 transition hover:bg-gray-50"
                  aria-label="LinkedIn Innovación UANDES"
                  title="LinkedIn"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                    <path d="M5.34 8.67A1.84 1.84 0 1 1 5.3 5a1.84 1.84 0 0 1 .04 3.67ZM3.67 9.98h3.3V20h-3.3V9.98Zm5.4 0h3.16v1.37h.05c.44-.83 1.53-1.7 3.14-1.7 3.35 0 3.97 2.2 3.97 5.07V20h-3.3v-4.67c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.2-1.79 2.45V20h-3.3V9.98Z" />
                  </svg>
                </a>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                {detail.slug === "emprendimiento" ? "Casos de éxito Incubadora" : "Equipo"}
              </h2>
              {detail.slug === "emprendimiento" ? (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
                      <div className="text-[11px] text-gray-500">Iniciativas incubadora</div>
                      <div className="mt-0.5 text-lg font-semibold text-slate-900">{new Intl.NumberFormat("es-CL").format(incubadoraSummary.totalCount)}</div>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
                      <div className="text-[11px] text-gray-500">Proyectos incubados (seleccionados)</div>
                      <div className="mt-0.5 text-lg font-semibold text-slate-900">{new Intl.NumberFormat("es-CL").format(incubadoraSummary.incubatedCount)}</div>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
                      <div className="text-[11px] text-gray-500">Casos de éxito (funcionando)</div>
                      <div className="mt-0.5 text-lg font-semibold text-slate-900">{new Intl.NumberFormat("es-CL").format(incubadoraSummary.successCount)}</div>
                    </div>
                  </div>

                  {incubadoraSummary.successCases.slice(0, 8).map((item, index) => (
                    <article key={`${item.project}-${item.year}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                      <div className="mb-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        Caso de éxito #{index + 1}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">{item.project}</h3>
                      <div className="mt-1 text-xs font-medium text-gray-700">
                        {item.responsible || "Responsable no informado"}
                        {item.facultyOrSchool ? ` · ${item.facultyOrSchool}` : ""}
                      </div>
                      <p className="mt-2 text-xs leading-5 text-gray-600">{item.description || "Iniciativa de incubación en etapa de ejecución."}</p>
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-medium text-slate-700 hover:underline">
                          Ver noticia / web
                        </a>
                      ) : null}
                    </article>
                  ))}

                  {incubadoraSummary.successCases.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay casos de éxito marcados como funcionando.</p>
                  ) : null}
                </div>
              ) : detail.slug === "desarrollo-tecnologico-y-comercializacion" ? (
                <div className="mt-3 space-y-3">
                  {desarrolloTeam.map((person) => (
                    <div key={person.name} className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                      <div className="flex items-start gap-3">
                        {getAvatarSrc(person.name) ? (
                          <Image
                            src={getAvatarSrc(person.name) || ""}
                            alt={person.name}
                            width={44}
                            height={44}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                            {getInitials(person.name)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{person.name}</div>
                          <div className="mt-0.5 text-xs text-gray-600">{person.role}</div>
                          <div className="mt-1 text-xs text-gray-500">{person.email}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : detail.slug === "proyectos" ? (
                <div className="mt-3 space-y-3">
                  {proyectosTeam.map((person) => (
                    <div key={person.name} className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                      <div className="flex items-start gap-3">
                        {getAvatarSrc(person.name) ? (
                          <Image
                            src={getAvatarSrc(person.name) || ""}
                            alt={person.name}
                            width={44}
                            height={44}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                            {getInitials(person.name)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{person.name}</div>
                          <div className="mt-0.5 text-xs text-gray-600">{person.role}</div>
                          <div className="mt-1 text-xs text-gray-500">{person.email}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : detail.slug === "propiedad-intelectual" ? (
                <div className="mt-3 space-y-3">
                  {asuntosJuridicosTeam.map((person) => (
                    <div key={person.name} className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                      <div className="flex items-start gap-3">
                        {getAvatarSrc(person.name) ? (
                          <Image
                            src={getAvatarSrc(person.name) || ""}
                            alt={person.name}
                            width={44}
                            height={44}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                            {getInitials(person.name)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{person.name}</div>
                          <div className="mt-0.5 text-xs text-gray-600">{person.role}</div>
                          <div className="mt-1 text-xs text-gray-500">{person.email}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : detail.slug === "proyecto-bici" ? (
                <div className="mt-3 space-y-3">
                  {biciTeam.map((person) => (
                    <div key={person.name} className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                      <div className="flex items-start gap-3">
                        {getAvatarSrc(person.name) ? (
                          <Image
                            src={getAvatarSrc(person.name) || ""}
                            alt={person.name}
                            width={44}
                            height={44}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                            {getInitials(person.name)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{person.name}</div>
                          <div className="mt-0.5 text-xs text-gray-600">{person.role}</div>
                          <div className="mt-1 text-xs text-gray-500">{person.email}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : detail.slug === "comunicaciones" ? (
                <div className="mt-3 space-y-3">
                  {comunicacionesTeam.map((person) => (
                    <div key={person.name} className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                      <div className="flex items-start gap-3">
                        {getAvatarSrc(person.name) ? (
                          <Image
                            src={getAvatarSrc(person.name) || ""}
                            alt={person.name}
                            width={44}
                            height={44}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                            {getInitials(person.name)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{person.name}</div>
                          <div className="mt-0.5 text-xs text-gray-600">{person.role}</div>
                          <div className="mt-1 text-xs text-gray-500">{person.email}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : detail.team.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">—</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.team.map((name) => (
                    <span key={name} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700">
                      {getAvatarSrc(name) ? (
                        <Image
                          src={getAvatarSrc(name) || ""}
                          alt={name}
                          width={24}
                          height={24}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
                          {getInitials(name)}
                        </span>
                      )}
                      <span>{name}</span>
                    </span>
                  ))}
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Indicadores relacionados</h2>
              {detail.indicators.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">—</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {detail.indicators.slice(0, 8).map((indicator) => (
                    <li key={`${indicator.id}-${indicator.title}`} className="rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <Link href="/indicadores" className="text-sm font-medium text-slate-900 hover:underline">
                          {indicator.title}
                        </Link>
                        <div className="text-xs font-medium text-slate-700">{indicator.dato || "Dato: —"}</div>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <span>Responsable:</span>
                        <span>{indicator.responsable || "-"}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          {detail.slug === "emprendimiento" && (
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Distribución de iniciativas por facultad o escuela</h2>
              <p className="mt-1 text-xs text-gray-500">Fuente: Incubadora BBDD completa.csv</p>
              {incubadoraSummary.facultyDistribution.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">—</p>
              ) : (
                <div className="mt-4">
                  <FacultyDistributionChart data={incubadoraSummary.facultyDistribution} />
                </div>
              )}
            </section>
          )}

          {detail.slug === "comunicaciones" && (
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Indicadores de Comunicaciones</h2>
              {detail.communications.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">—</p>
              ) : (
                <div className="mt-4 space-y-5">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      {
                        label: "Publicaciones",
                        value: detail.communications.length,
                      },
                      {
                        label: "Alcance total",
                        value: detail.communications.reduce((acc, item) => acc + (item.alcance ?? 0), 0),
                      },
                      {
                        label: "Impresiones totales",
                        value: detail.communications.reduce((acc, item) => acc + (item.impresiones ?? 0), 0),
                      },
                      {
                        label: "Interacciones totales",
                        value: detail.communications.reduce((acc, item) => acc + (item.interaccion ?? 0), 0),
                      },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                        <div className="text-xs text-gray-500">{metric.label}</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-900">
                          {new Intl.NumberFormat("es-CL").format(metric.value)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <ImpresionesMensualesCard
                    year={communicationsChartYear}
                    monthlyValuesByPlatform={monthlyValuesByPlatform}
                  />

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {detail.communications.slice(0, 6).map((item, index) => (
                      <article key={`${item.title}-top-${index}`} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                        <div className="mb-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          Destacada #{index + 1}
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">{item.title}</h3>
                        <div className="mt-2 text-xs text-gray-500">
                          {item.medio} · {item.tipo} · {item.fecha}
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="rounded-lg border border-gray-100 bg-white px-2 py-1.5">
                            <div className="text-[10px] text-gray-500">Alcance</div>
                            <div className="text-xs font-semibold text-slate-900">
                              {item.alcance !== null ? new Intl.NumberFormat("es-CL").format(item.alcance) : "—"}
                            </div>
                          </div>
                          <div className="rounded-lg border border-gray-100 bg-white px-2 py-1.5">
                            <div className="text-[10px] text-gray-500">Impresiones</div>
                            <div className="text-xs font-semibold text-slate-900">
                              {item.impresiones !== null ? new Intl.NumberFormat("es-CL").format(item.impresiones) : "—"}
                            </div>
                          </div>
                          <div className="rounded-lg border border-gray-100 bg-white px-2 py-1.5">
                            <div className="text-[10px] text-gray-500">Interacción</div>
                            <div className="text-xs font-semibold text-slate-900">
                              {item.interaccion !== null ? new Intl.NumberFormat("es-CL").format(item.interaccion) : "—"}
                            </div>
                          </div>
                        </div>
                        {item.link ? (
                          <a href={item.link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-medium text-slate-700 hover:underline">
                            Ver publicación
                          </a>
                        ) : null}
                      </article>
                    ))}
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-white">
                    <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-slate-900">
                      Todas las publicaciones ordenadas por importancia
                    </div>
                    <div className="max-h-[460px] overflow-auto">
                      <table className="min-w-full table-auto">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Titular</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Medio</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Alcance</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Impresiones</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Interacción</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Engagement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {detail.communications.map((item, index) => (
                            <tr key={`${item.title}-all-${index}`} className="odd:bg-white even:bg-gray-50/40">
                              <td className="px-3 py-2 text-xs text-slate-900">{item.title}</td>
                              <td className="px-3 py-2 text-xs text-gray-600">{item.medio}</td>
                              <td className="px-3 py-2 text-xs text-gray-600">{item.fecha}</td>
                              <td className="px-3 py-2 text-xs text-gray-700">
                                {item.alcance !== null ? new Intl.NumberFormat("es-CL").format(item.alcance) : "—"}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-700">
                                {item.impresiones !== null ? new Intl.NumberFormat("es-CL").format(item.impresiones) : "—"}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-700">
                                {item.interaccion !== null ? new Intl.NumberFormat("es-CL").format(item.interaccion) : "—"}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-700">{item.engagement !== null ? item.engagement : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {detail.slug === "propiedad-intelectual" && (
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Resumen por estado</h2>
              {detail.legalStatusSummary.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">—</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.legalStatusSummary.map((item) => (
                    <span key={item.label} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700">
                      {item.label}: {item.count}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  return SUBDIRECCIONES.map((item) => ({ slug: item.slug }));
}
