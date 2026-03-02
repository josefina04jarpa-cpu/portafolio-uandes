"use client";

import { useRouter } from "next/navigation";

type Props = {
  currentYear: 2024 | 2025;
};

export default function IndicadoresYearSelect({ currentYear }: Props) {
  const router = useRouter();

  return (
    <select
      value={String(currentYear)}
      className="rounded-md border px-3 py-1 text-sm"
      aria-label="Seleccionar año"
      onChange={(event) => {
        const year = event.target.value;
        if (year === "2024") {
          router.push("/indicadores/2024");
          return;
        }

        router.push("/indicadores");
      }}
    >
      <option value="2024">2024</option>
      <option value="2025">2025</option>
    </select>
  );
}
