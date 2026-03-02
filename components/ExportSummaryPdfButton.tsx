"use client";

type Props = {
  targetId: string;
  fileName: string;
  className?: string;
  sheetData?: {
    resumen: string;
    nombreProyecto: string;
    idProyecto: string;
    directorProyecto: string;
    investigadoresEquipo: string;
    trlSnapshot?: {
      year: number;
      crl: number | null;
      trl: number | null;
      brl: number | null;
      iprl: number | null;
      tmrl: number | null;
      frl: number | null;
    };
  };
};

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function display(value: string) {
  const text = String(value || "").trim();
  if (!text) return "-";
  const normalized = text.toLowerCase();
  if (normalized === "n/a" || normalized === "na" || normalized === "null" || normalized === "-") return "-";
  return text;
}

function buildRadarSvg(snapshot?: {
  year: number;
  crl: number | null;
  trl: number | null;
  brl: number | null;
  iprl: number | null;
  tmrl: number | null;
  frl: number | null;
}) {
  if (!snapshot) return "";

  const metrics = [
    { key: "crl", label: "CRL", value: snapshot.crl ?? 0 },
    { key: "trl", label: "TRL", value: snapshot.trl ?? 0 },
    { key: "brl", label: "BRL", value: snapshot.brl ?? 0 },
    { key: "iprl", label: "IPRL", value: snapshot.iprl ?? 0 },
    { key: "tmrl", label: "TmRL", value: snapshot.tmrl ?? 0 },
    { key: "frl", label: "FRL", value: snapshot.frl ?? 0 },
  ] as const;

  const size = 320;
  const center = size / 2;
  const maxRadius = 110;
  const maxValue = 9;

  const angleForIndex = (index: number) => (Math.PI * 2 * index) / metrics.length - Math.PI / 2;
  const point = (value: number, index: number) => {
    const ratio = Math.max(0, Math.min(maxValue, value)) / maxValue;
    const radius = maxRadius * ratio;
    const angle = angleForIndex(index);
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const polygonPoints = metrics.map((metric, index) => point(metric.value, index)).join(" ");

  const rings = [0.2, 0.4, 0.6, 0.8, 1].map((ratio) => {
    const radius = maxRadius * ratio;
    return `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#d1d5db" stroke-width="1" />`;
  });

  const axes = metrics.map((metric, index) => {
    const angle = angleForIndex(index);
    const x = center + Math.cos(angle) * maxRadius;
    const y = center + Math.sin(angle) * maxRadius;
    return `<line x1="${center}" y1="${center}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#9ca3af" stroke-width="1" />`;
  });

  const labels = metrics.map((metric, index) => {
    const angle = angleForIndex(index);
    const x = center + Math.cos(angle) * (maxRadius + 18);
    const y = center + Math.sin(angle) * (maxRadius + 18);
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#374151">${metric.label}</text>`;
  });

  return `
    <svg width="100%" viewBox="0 0 ${size} ${size}" role="img" aria-label="Radar TRL año ${snapshot.year}">
      ${rings.join("\n")}
      ${axes.join("\n")}
      ${labels.join("\n")}
      <polygon points="${polygonPoints}" fill="#c2185b" fill-opacity="0.28" stroke="#be185d" stroke-width="2" />
      <circle cx="${center}" cy="${center}" r="2.5" fill="#be185d" />
    </svg>
  `;
}

export default function ExportSummaryPdfButton({ targetId, fileName, className, sheetData }: Props) {
  const handleExport = () => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const popup = window.open("", "_blank", "width=1024,height=768");
    if (!popup) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join("\n");

    const structuredFicha = sheetData
      ? `
          <section class="rounded-2xl border border-gray-200 bg-white p-6">
            <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">Ficha del proyecto</h1>
            <dl style="display: grid; grid-template-columns: 1fr; gap: 10px; margin: 0;">
              <div><dt style="font-size:12px;color:#6b7280;">Nombre del proyecto</dt><dd style="margin:2px 0 0 0;font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(display(sheetData.nombreProyecto))}</dd></div>
              <div><dt style="font-size:12px;color:#6b7280;">ID del proyecto</dt><dd style="margin:2px 0 0 0;font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(display(sheetData.idProyecto))}</dd></div>
              <div><dt style="font-size:12px;color:#6b7280;">Director del proyecto</dt><dd style="margin:2px 0 0 0;font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(display(sheetData.directorProyecto))}</dd></div>
              <div><dt style="font-size:12px;color:#6b7280;">Investigadores (equipo)</dt><dd style="margin:2px 0 0 0;font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(display(sheetData.investigadoresEquipo))}</dd></div>
              <div><dt style="font-size:12px;color:#6b7280;">Resumen</dt><dd style="margin:2px 0 0 0;font-size:14px;color:#1f2937;line-height:1.55;white-space:pre-wrap;">${escapeHtml(display(sheetData.resumen))}</dd></div>
            </dl>

            ${
              sheetData.trlSnapshot
                ? `
              <div style="margin-top:20px;border-top:1px solid #e5e7eb;padding-top:16px;">
                <h2 style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 10px 0;">Indicadores XRL (último registro: ${sheetData.trlSnapshot.year})</h2>
                <div style="max-width:360px;">${buildRadarSvg(sheetData.trlSnapshot)}</div>
                <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px;max-width:520px;">
                  ${[
                    ["CRL", sheetData.trlSnapshot.crl],
                    ["TRL", sheetData.trlSnapshot.trl],
                    ["BRL", sheetData.trlSnapshot.brl],
                    ["IPRL", sheetData.trlSnapshot.iprl],
                    ["TmRL", sheetData.trlSnapshot.tmrl],
                    ["FRL", sheetData.trlSnapshot.frl],
                  ]
                    .map(
                      ([label, value]) =>
                        `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:6px 8px;">` +
                        `<div style="font-size:11px;color:#6b7280;">${label}</div>` +
                        `<div style="font-size:14px;font-weight:700;color:#111827;">${value ?? "-"}</div>` +
                        `</div>`,
                    )
                    .join("")}
                </div>
              </div>
            `
                : ""
            }
          </section>
        `
      : target.outerHTML;

    popup.document.open();
    popup.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>${fileName}</title>
          ${styles}
          <style>
            body { padding: 24px; background: #fff; }
            [data-no-print="true"] { display: none !important; }
          </style>
        </head>
        <body>
          ${structuredFicha}
        </body>
      </html>
    `);
    popup.document.close();

    popup.onload = () => {
      popup.focus();
      popup.print();
      popup.close();
    };
  };

  return (
    <button
      type="button"
      data-no-print="true"
      onClick={handleExport}
      className={
        className ||
        "rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
      }
    >
      Exportar ficha en PDF
    </button>
  );
}
