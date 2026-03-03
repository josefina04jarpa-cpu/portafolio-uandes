"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TechnologyLandingRecord = {
  id: string;
  title: string;
  faculty: string;
  leaderGender: "Femenino" | "Masculino" | "Sin dato";
  trl: number | null;
};

type Props = {
  records: TechnologyLandingRecord[];
};

const GENDER_COLORS: Record<string, string> = {
  Femenino: "#ec4899",
  Masculino: "#3b82f6",
  "Sin dato": "#94a3b8",
};

export default function TechnologiesLandingDashboard({ records }: Props) {
  const byFaculty = new Map<string, { total: number; trlSum: number; trlCount: number }>();
  for (const record of records) {
    const faculty = record.faculty || "Sin información";
    const current = byFaculty.get(faculty) || { total: 0, trlSum: 0, trlCount: 0 };
    current.total += 1;
    if (typeof record.trl === "number") {
      current.trlSum += record.trl;
      current.trlCount += 1;
    }
    byFaculty.set(faculty, current);
  }

  const facultyCountData = Array.from(byFaculty.entries())
    .map(([faculty, info]) => ({ faculty, total: info.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  const trlByFacultyData = Array.from(byFaculty.entries())
    .map(([faculty, info]) => ({
      faculty,
      trl: info.trlCount > 0 ? Number((info.trlSum / info.trlCount).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.trl - a.trl)
    .slice(0, 8);

  const genderMap = new Map<string, number>();
  for (const record of records) {
    genderMap.set(record.leaderGender, (genderMap.get(record.leaderGender) || 0) + 1);
  }

  const genderData = Array.from(genderMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-slate-900">Tecnologías</h1>
        <p className="mt-2 text-sm text-gray-600">
          Panorama general de madurez tecnológica (TRL), liderazgo y distribución por facultades.
        </p>
        <div className="mt-4">
          <Link
            href="/portafolio/tecnologias/lista"
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Ver listado de tecnologías
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-slate-900">TRL promedio por facultad</h2>
          <p className="mt-1 text-xs text-gray-500">Promedio de TRL más reciente por tecnología asociada a cada facultad.</p>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={trlByFacultyData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="#d1d5db" />
                <PolarAngleAxis dataKey="faculty" tick={{ fill: "#334155", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 9]} tickCount={10} tick={{ fill: "#64748b", fontSize: 10 }} />
                <Radar
                  name="TRL"
                  dataKey="trl"
                  stroke="#7c3aed"
                  fill="#7c3aed"
                  fillOpacity={0.28}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "none", borderRadius: 8, color: "#fff" }}
                  labelStyle={{ color: "#f3f4f6", fontWeight: 600 }}
                  itemStyle={{ color: "#f9fafb", fontSize: 12 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-slate-900">Tecnologías lideradas por género</h2>
          <p className="mt-1 text-xs text-gray-500">Comparación entre liderazgos femeninos y masculinos.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {genderData.map((entry) => (
                      <Cell key={entry.name} fill={GENDER_COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {genderData.map((entry) => (
                <div key={entry.name} className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2 text-sm">
                  <div className="font-medium text-slate-900">{entry.name}</div>
                  <div className="text-gray-600">{entry.value} tecnologías</div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-slate-900">Facultades con tecnologías</h2>
        <p className="mt-1 text-xs text-gray-500">Cantidad de tecnologías por facultad (top 12).</p>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={facultyCountData} margin={{ top: 8, right: 12, left: 0, bottom: 40 }}>
              <XAxis dataKey="faculty" angle={-20} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip />
              <Bar dataKey="total" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
