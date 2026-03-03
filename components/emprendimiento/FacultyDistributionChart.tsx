"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = {
  data: Array<{ faculty: string; count: number }>;
};

export default function FacultyDistributionChart({ data }: Props) {
  const safeData = (data || []).map((item) => ({
    faculty: item.faculty,
    count: Number(item.count || 0),
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={safeData} margin={{ top: 8, right: 8, left: 8, bottom: 44 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="faculty"
            interval={0}
            angle={-20}
            textAnchor="end"
            height={70}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickFormatter={(value) => String(value || "").replace(/^Facultad de\s+/i, "")}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              return (
                <div className="rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs shadow-sm">
                  <div className="font-medium text-slate-900">{label}</div>
                  <div className="mt-0.5 text-gray-600">Iniciativas: {payload[0].value}</div>
                </div>
              );
            }}
          />
          <Bar dataKey="count" fill="#0f172a" radius={[6, 6, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
