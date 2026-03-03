import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getSessionEmailFromToken } from "../lib/auth";
import IndicadoresYearSelect from "./IndicadoresYearSelect";

type Props = {
  active?: "portafolio" | "indicadores" | "perfil";
  indicadoresYear?: 2024 | 2025;
};

export default async function TopNavigation({ active = "portafolio", indicadoresYear = 2025 }: Props) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value || "";
  const authenticatedEmail = getSessionEmailFromToken(token);
  const isPortafolio = active === "portafolio";
  const isIndicadores = active === "indicadores";
  const isPerfil = active === "perfil";

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-6 py-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo-innovacion.png"
                alt="Innovación Uandes"
                width={165}
                height={35}
                className="h-auto w-auto"
                priority
              />
            </Link>

            <nav className="flex items-center gap-6 text-sm">
              <div className="group relative">
                <Link
                  href="/portafolio"
                  className={`pb-1 ${
                    isPortafolio
                      ? "border-b-2 border-[#C8102E] font-medium text-slate-900"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Portafolio
                </Link>

                <div className="pointer-events-none absolute left-0 top-full z-50 w-56 rounded-xl bg-black/70 p-2 opacity-0 shadow-lg backdrop-blur-sm transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                  <Link href="/portafolio/investigadores" className="block rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10">
                    Investigadores
                  </Link>
                  <Link href="/instituciones" className="block rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10">
                    Instituciones
                  </Link>
                  <Link href="/portafolio/proyectos" className="block rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10">
                    Proyectos
                  </Link>
                  <Link href="/portafolio/tecnologias" className="block rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10">
                    Tecnologías
                  </Link>
                </div>
              </div>

              <div className="group relative">
                <Link
                  href="/indicadores"
                  className={`pb-1 ${
                    isIndicadores
                      ? "border-b-2 border-[#C8102E] font-medium text-slate-900"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Indicadores
                </Link>

                <div className="pointer-events-none absolute left-0 top-full z-50 w-56 rounded-xl bg-black/70 p-2 opacity-0 shadow-lg backdrop-blur-sm transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                  <Link href="/indicadores" className="block rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10">
                    General
                  </Link>
                  <Link href="/indicadores/subdirecciones" className="block rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10">
                    Subdirecciones
                  </Link>
                </div>
              </div>

              <Link
                href="/mi-perfil"
                className={`pb-1 ${
                  isPerfil
                    ? "border-b-2 border-[#C8102E] font-medium text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Mi perfil
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isIndicadores ? (
              <IndicadoresYearSelect currentYear={indicadoresYear} />
            ) : (
              <select defaultValue="2025" className="rounded-md border px-3 py-1 text-sm" aria-label="Seleccionar año">
                <option>2023</option>
                <option>2024</option>
                <option>2025</option>
                <option>2026</option>
              </select>
            )}

            {authenticatedEmail ? (
              <>
                <form action="/api/auth/logout" method="post">
                  <input type="hidden" name="next" value="/ingresar" />
                  <button type="submit" className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">
                    Salir
                  </button>
                </form>
              </>
            ) : (
              <Link href="/ingresar" className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
