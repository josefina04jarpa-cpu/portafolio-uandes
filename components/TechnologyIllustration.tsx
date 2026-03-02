type Props = {
  title?: string;
  description?: string;
  badges?: string[];
  className?: string;
};

function normalizeText(value: string) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectTheme(text: string):
  | "salud"
  | "ia"
  | "educacion"
  | "energia"
  | "agua"
  | "legal"
  | "default" {
  if (/(medic|salud|clinic|odont|biom|pacient|diagnost|terapia|enferm)/.test(text)) return "salud";
  if (/(ia|inteligencia artificial|data|algorit|machine|software|digital|modelo|llm)/.test(text)) return "ia";
  if (/(educ|escuel|lectur|aprendiz|docent|alumno|pedagog|aula)/.test(text)) return "educacion";
  if (/(energia|electri|solar|eolic|bateria|hidrogen|potencia)/.test(text)) return "energia";
  if (/(agua|riego|hidric|desal|acuic|humedad|inund)/.test(text)) return "agua";
  if (/(jurid|legal|regulator|normativ|contrato|patent|propiedad intelectual)/.test(text)) return "legal";
  return "default";
}

function Illustration({ theme }: { theme: ReturnType<typeof detectTheme> }) {
  const base = "h-14 w-14 text-white";

  if (theme === "salud") {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={base} aria-hidden="true">
        <rect x="10" y="10" width="44" height="44" rx="10" stroke="currentColor" strokeWidth="2" />
        <path d="M32 20v24M20 32h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="47" cy="17" r="4" fill="currentColor" opacity="0.35" />
      </svg>
    );
  }

  if (theme === "ia") {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={base} aria-hidden="true">
        <rect x="16" y="16" width="32" height="32" rx="6" stroke="currentColor" strokeWidth="2" />
        <path d="M24 24h16v16H24z" stroke="currentColor" strokeWidth="2" />
        <path d="M10 24h6M10 32h6M10 40h6M48 24h6M48 32h6M48 40h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (theme === "educacion") {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={base} aria-hidden="true">
        <path d="M12 18h20c6 0 8 4 8 8v24H20c-4 0-8-2-8-8V18Z" stroke="currentColor" strokeWidth="2" />
        <path d="M52 18H32c-6 0-8 4-8 8v24h20c4 0 8-2 8-8V18Z" stroke="currentColor" strokeWidth="2" />
        <path d="M32 26v24" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (theme === "energia") {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={base} aria-hidden="true">
        <path d="M36 10 20 34h12l-4 20 16-24H32l4-20Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="50" cy="16" r="5" fill="currentColor" opacity="0.25" />
      </svg>
    );
  }

  if (theme === "agua") {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={base} aria-hidden="true">
        <path d="M32 10c8 10 14 15 14 23a14 14 0 1 1-28 0c0-8 6-13 14-23Z" stroke="currentColor" strokeWidth="2.5" />
        <path d="M24 39c2 2 4 3 8 3s6-1 8-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (theme === "legal") {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={base} aria-hidden="true">
        <path d="M18 22h28M24 22v24m16-24v24M16 46h32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M42 18 28 26m14-8 8 4-14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" fill="none" className={base} aria-hidden="true">
      <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2" />
      <path d="M32 20v8M32 36v8M24 32h8m8 0h0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function TechnologyIllustration({ title = "", description = "", badges = [], className = "" }: Props) {
  const text = normalizeText(`${title} ${description} ${badges.join(" ")}`);
  const theme = detectTheme(text);
  const backgroundByTheme: Record<ReturnType<typeof detectTheme>, string> = {
    salud: "bg-gradient-to-br from-emerald-500 to-teal-600",
    ia: "bg-gradient-to-br from-violet-500 to-indigo-600",
    educacion: "bg-gradient-to-br from-blue-500 to-sky-600",
    energia: "bg-gradient-to-br from-amber-500 to-orange-600",
    agua: "bg-gradient-to-br from-cyan-500 to-blue-600",
    legal: "bg-gradient-to-br from-slate-500 to-slate-700",
    default: "bg-gradient-to-br from-rose-500 to-red-600",
  };

  return (
    <div className={`h-20 w-20 rounded-lg flex items-center justify-center shadow-sm ${backgroundByTheme[theme]} ${className}`}>
      <Illustration theme={theme} />
    </div>
  );
}
