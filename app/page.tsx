import Link from "next/link";
import Image from "next/image";
import { resolveImageSrc } from "../lib/imageUrl";

export default function Home() {
  const logoSrc = resolveImageSrc("/logo-innovacion.png");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <main className="relative z-10 w-full max-w-4xl rounded-2xl bg-white/60 pb-20 pt-8 px-8 shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-y-8 text-center">
          <h1 className="mt-6 flex w-full max-w-[39.67rem] justify-center">
            <Image
              src={logoSrc}
              alt="Innovación Uandes"
              width={320}
              height={96}
              className="h-auto w-full"
              priority
            />
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Impulsamos proyectos y soluciones digitales que transforman la
            experiencia educativa y la investigación en la Universidad.
          </p>

          <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/portafolio"
              className="inline-flex w-full items-center justify-center rounded-full bg-red-700 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-red-800"
            >
              Ver Portafolio
            </Link>

            <Link
              href="/indicadores"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ver Indicadores
            </Link>
          </div>

          <div className="w-full max-w-2xl rounded-lg border border-dashed border-slate-100 bg-white/50 p-6">
            <p className="text-sm text-slate-500">
              Bienvenido al repositorio de innovación. Navega el portafolio y
              revisa indicadores clave para conocer el impacto de nuestros
              proyectos.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
