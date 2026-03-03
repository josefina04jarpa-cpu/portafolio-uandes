import TopNavigation from "../../../components/TopNavigation";
import IndicadoresSubmenu from "../../../components/IndicadoresSubmenu";
import SubdireccionesGrid from "../../../components/SubdireccionesGrid";
import { getSubdireccionesCards } from "../../../lib/subdirecciones";

export default async function Page() {
  const cards = await getSubdireccionesCards();

  return (
    <div className="min-h-screen bg-transparent">
      <TopNavigation active="indicadores" indicadoresYear={2025} />

      <main>
        <IndicadoresSubmenu active="subdirecciones" />

        <div className="mx-auto max-w-6xl px-6 py-8">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">Subdirecciones y Áreas Estratégicas</h1>
            <p className="mt-2 text-sm text-gray-600">
              Conoce las áreas que impulsan la innovación en la Universidad de los Andes.
            </p>
          </section>

          <section className="mt-6">
            <SubdireccionesGrid items={cards} />
          </section>
        </div>
      </main>
    </div>
  );
}
