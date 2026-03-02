import TopNavigation from "../../components/TopNavigation";

type Params = {
  searchParams?: Promise<{ error?: string; next?: string }>;
};

export default async function Page({ searchParams }: Params) {
  const query = (await searchParams) || {};
  const nextPath = String(query.next || "/indicadores");
  const error = String(query.error || "").trim();

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation active="indicadores" />

      <main className="mx-auto flex max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Ingreso equipo de Innovación</h1>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa con tu correo autorizado del equipo y contraseña para ver todos los indicadores.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form action="/api/auth/login" method="post" className="mt-5 space-y-4">
            <input type="hidden" name="next" value={nextPath} />

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-900">
                Correo del equipo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="correo@dominio.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-red-200 focus:ring"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-900">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-red-200 focus:ring"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Ingresar
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
