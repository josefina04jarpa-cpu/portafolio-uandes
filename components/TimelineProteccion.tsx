type Props = {
  ip: Record<string, any>;
};

type TimelineItem = {
  title: string;
  dateText: string;
  icon: "solicitud" | "revision" | "aprobada" | "registro" | "vigente" | "expiracion";
  highlight?: boolean;
};

function TimelineIcon({ kind, highlighted }: { kind: TimelineItem["icon"]; highlighted?: boolean }) {
  const iconClass = highlighted ? "text-green-700" : "text-gray-600";

  switch (kind) {
    case "solicitud":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 ${iconClass}`} aria-hidden="true">
          <path d="M7 4h8l4 4v12H7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 4v4h4M10 13h6M10 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "revision":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 ${iconClass}`} aria-hidden="true">
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
          <path d="m20 20-4.2-4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "aprobada":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 ${iconClass}`} aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="m8.5 12.5 2.4 2.4 4.6-4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "registro":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 ${iconClass}`} aria-hidden="true">
          <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.5 9h7M8.5 13h7M8.5 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "vigente":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 ${iconClass}`} aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="m8.5 12.5 2.4 2.4 4.6-4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "expiracion":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 ${iconClass}`} aria-hidden="true">
          <circle cx="12" cy="13" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 10v3.5l2.2 1.2M9 3h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

function isMissing(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return true;
  const normalized = text.toLowerCase();
  return normalized === "n/a" || normalized === "na" || normalized === "-" || normalized === "null";
}

function parseDate(value: unknown): Date | null {
  if (isMissing(value)) return null;
  const text = String(value).trim();

  const asNumber = Number(text);
  if (Number.isFinite(asNumber) && asNumber > 30000 && asNumber < 60000) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return new Date(excelEpoch + asNumber * 24 * 60 * 60 * 1000);
  }

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  }

  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    return new Date(Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])));
  }

  return null;
}

function formatSpanishShortDate(value: unknown) {
  const date = parseDate(value);
  if (!date) return "-";

  const formatted = date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return formatted.replace(/\b([a-záéíóúñ])/g, (m) => m.toUpperCase());
}

function formatRange(start: unknown, end: unknown) {
  const startText = formatSpanishShortDate(start);
  const endText = formatSpanishShortDate(end);

  if (startText !== "-" && endText !== "-") return `${startText} – ${endText}`;
  if (startText !== "-") return `Desde ${startText}`;
  if (endText !== "-") return endText;
  return "-";
}

export default function TimelineProteccion({ ip }: Props) {
  const solicitudDate = formatSpanishShortDate(ip.fechaSolicitud);
  const revisionDate = formatRange(ip.fechaRevisionInicio, ip.fechaRevisionFin);
  const aprobadaDate = formatSpanishShortDate(ip.fechaAprobacion);
  const hasRegistro = !isMissing(ip.numeroRegistro);
  const registroDate = hasRegistro ? formatSpanishShortDate(ip.fechaRegistro) : "-";
  const expiracionDate = formatSpanishShortDate(ip.fechaTerminoProteccion || ip.fechaTermino);

  const vigenteRange =
    formatSpanishShortDate(ip.fechaRegistro) !== "-" && formatSpanishShortDate(ip.fechaTerminoProteccion || ip.fechaTermino) !== "-"
      ? `${formatSpanishShortDate(ip.fechaRegistro)} – ${formatSpanishShortDate(ip.fechaTerminoProteccion || ip.fechaTermino)}`
      : "-";

  const parsedEnd = parseDate(ip.fechaTerminoProteccion || ip.fechaTermino);
  const hasEnd = !isMissing(ip.fechaTerminoProteccion || ip.fechaTermino);
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const isVigente = hasEnd ? (parsedEnd ? parsedEnd >= todayUtc : true) : false;

  const fallbackRevision =
    revisionDate === "-" && solicitudDate !== "-" ? `Desde ${solicitudDate}` : revisionDate;

  const items: TimelineItem[] = [
    { title: "Solicitud presentada", dateText: solicitudDate, icon: "solicitud" },
    { title: "En revisión", dateText: fallbackRevision, icon: "revision" },
    { title: "Aprobada", dateText: aprobadaDate, icon: "aprobada" },
    { title: "Registro otorgado", dateText: registroDate, icon: "registro" },
    { title: "Vigente", dateText: vigenteRange, icon: "vigente", highlight: isVigente },
    { title: "Expiración", dateText: expiracionDate, icon: "expiracion" },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Timeline de protección</h3>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item.title}
            className={`flex items-start gap-3 rounded-xl border p-3 ${
              item.highlight
                ? "border-green-200 bg-green-50"
                : "border-gray-100 bg-white"
            }`}
          >
            <div
              className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                item.highlight
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <TimelineIcon kind={item.icon} highlighted={item.highlight} />
            </div>

            <div>
              <div className={`text-sm font-semibold ${item.highlight ? "text-green-800" : "text-slate-900"}`}>
                {item.title}
              </div>
              <div className={`text-xs ${item.highlight ? "text-green-700" : "text-gray-500"}`}>
                {item.dateText}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
