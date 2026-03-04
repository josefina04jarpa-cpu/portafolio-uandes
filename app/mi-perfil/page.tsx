import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import TopNavigation from "../../components/TopNavigation";
import { AUTH_COOKIE_NAME, getSessionEmailFromToken, getTeamMemberByEmail } from "../../lib/auth";
import { getExecutiveManagedProjectsByEmail } from "../../lib/executiveProfiles";
import { getPhotoUrlForName } from "../../lib/equipoInnovacion";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value || "";
  const email = getSessionEmailFromToken(token);

  if (!email) {
    return (
      <div className="min-h-screen bg-transparent">
        <TopNavigation active="perfil" />
        <main className="mx-auto max-w-6xl px-6 py-8">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">Mi perfil</h1>
            <p className="mt-2 text-sm text-gray-600">Para ver tu perfil y tus proyectos a cargo, inicia sesión.</p>
            <Link href="/ingresar" className="mt-4 inline-flex rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">
              Ingresar
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const member = getTeamMemberByEmail(email);
  const projects = await getExecutiveManagedProjectsByEmail(email);

  if (!member) {
    return (
      <div className="min-h-screen bg-transparent">
        <TopNavigation active="perfil" />
        <main className="mx-auto max-w-6xl px-6 py-8">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">Mi perfil</h1>
            <p className="mt-2 text-sm text-gray-600">No fue posible cargar tu perfil.</p>
          </section>
        </main>
      </div>
    );
  }

  const profilePhoto = getPhotoUrlForName(member.name);

  // Separar proyectos por tipo de responsabilidad
  const postulacionProjects = projects.filter(p => p.responsibilityType === "postulacion" || p.responsibilityType === "both");
  const seguimientoProjects = projects.filter(p => p.responsibilityType === "seguimiento" || p.responsibilityType === "both");

  return (
    <div className="min-h-screen bg-transparent">
      <TopNavigation active="perfil" />

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-5">
            {profilePhoto ? (
              <Image
                src={profilePhoto}
                alt={member.name}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full object-cover"
                priority
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700">
                {member.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((word) => word[0]?.toUpperCase() || "")
                  .join("") || "--"}
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-slate-900">{member.name}</h1>
              <p className="mt-1 text-sm text-gray-600">{member.role}</p>
              <p className="text-xs text-gray-500">{member.area}</p>
              <p className="mt-1 text-sm text-gray-600">
                Correo: <a href={`mailto:${member.email}`} className="font-medium text-slate-900 hover:underline">{member.email}</a>
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Proyectos a cargo</h2>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
              {projects.length} proyectos
            </span>
          </div>

          {projects.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No hay proyectos para mostrar.</p>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Proyectos de Postulación */}
              {postulacionProjects.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">Responsable de Postulación</h3>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200">
                      {postulacionProjects.length} {postulacionProjects.length === 1 ? 'proyecto' : 'proyectos'}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {postulacionProjects.map((project) => (
                      <li key={`post-${project.id}-${project.projectCode}`} className="rounded-xl border border-blue-100 bg-blue-50/30 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex-1">
                            <Link
                              href={`/portafolio/proyectos/${encodeURIComponent(project.id)}`}
                              className="text-sm font-medium text-slate-900 hover:underline"
                            >
                              {project.title}
                            </Link>
                            <div className="mt-0.5 text-xs text-gray-500">
                              Código: {project.projectCode || "-"} · Año: {project.year || "-"}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {project.responsibilityType === "both" && (
                              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 border border-purple-200">
                                También Seg. Técnico
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                project.adjudicado
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {project.adjudicado ? "Adjudicado" : "No adjudicado"}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Proyectos de Seguimiento Técnico */}
              {seguimientoProjects.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">Responsable de Seguimiento Técnico</h3>
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200">
                      {seguimientoProjects.length} {seguimientoProjects.length === 1 ? 'proyecto' : 'proyectos'}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {seguimientoProjects.map((project) => (
                      <li key={`seg-${project.id}-${project.projectCode}`} className="rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex-1">
                            <Link
                              href={`/portafolio/proyectos/${encodeURIComponent(project.id)}`}
                              className="text-sm font-medium text-slate-900 hover:underline"
                            >
                              {project.title}
                            </Link>
                            <div className="mt-0.5 text-xs text-gray-500">
                              Código: {project.projectCode || "-"} · Año: {project.year || "-"}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {project.responsibilityType === "both" && (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                                También Postulación
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                project.adjudicado
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {project.adjudicado ? "Adjudicado" : "No adjudicado"}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
