import { cookies } from "next/headers";
import TopNavigation from "../../../components/TopNavigation";
import { AUTH_COOKIE_NAME, getSessionEmailFromToken } from "../../../lib/auth";
import { getIndicatorsByYear } from "../../../lib/indicadores";
import { getMetasRectoria } from "../../../lib/metasRectoria";
import IndicadoresSectionTabs from "../../../components/IndicadoresSectionTabs";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value || "";
  const sessionEmail = getSessionEmailFromToken(token);

  const [metasRectoria, all] = await Promise.all([
    getMetasRectoria(),
    sessionEmail ? getIndicatorsByYear(2024) : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-transparent">
      <TopNavigation active="indicadores" indicadoresYear={2024} />

      <main>
        <IndicadoresSectionTabs
          isAuthenticated={Boolean(sessionEmail)}
          indicadores={all}
          metasRectoria={metasRectoria}
          metasYear={2024}
          nextPath="/indicadores/2024"
        />
      </main>
    </div>
  );
}
