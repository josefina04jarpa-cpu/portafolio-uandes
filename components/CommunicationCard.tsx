import Image from "next/image";
import type { Communication } from "@/lib/comunicaciones";

type CommunicationCardProps = {
  item: Communication;
  showMetrics?: boolean;
};

function display(value: unknown): string {
  const text = String(value ?? "").trim();
  return text ? text : "-";
}

function normalize(value: unknown): string {
  return String(value ?? "").trim();
}

function isPostOrReel(item: Communication): boolean {
  const tipo = normalize(item.COM_TipoComun).toLocaleLowerCase("es");
  return tipo.includes("post") || tipo.includes("publicación") || tipo.includes("publicacion") || tipo.includes("reel");
}

function summarizeTitle(text: string, maxLength = 96): string {
  const cleaned = normalize(text)
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ");

  if (!cleaned) return "-";

  const firstSentence = cleaned.split(/[\n\.|]/).map((part) => part.trim()).find(Boolean) || cleaned;
  if (firstSentence.length <= maxLength) return firstSentence;
  return `${firstSentence.slice(0, maxLength - 3).trimEnd()}...`;
}

function toValidImagePath(value: string): string {
  const input = normalize(value);
  if (!input) return "";
  if (/^https?:\/\//i.test(input)) return input;
  if (input.startsWith("/")) return input;
  return `/${input.replace(/^\/+/, "")}`;
}

function normalizeLookup(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .trim();
}

function shouldUseDialectCostaRicaThumbnail(item: Communication): boolean {
  const tipo = normalizeLookup(item.COM_TipoComun);
  const tipoMedio = normalizeLookup(item.COM_TipoMedio);
  const tema = normalizeLookup(item.COM_TemaPubl);
  const searchable = normalizeLookup([item.COM_Titular, item.COM_Comentario, item.COM_Link].join(" "));

  const isPostOrPressAppearance =
    tipo.includes("post") ||
    tipo.includes("publicacion") ||
    tipoMedio.includes("prensa") ||
    tema.includes("apariciones en prensa");

  const hasDialectCostaRicaCopy =
    searchable.includes("estudio dialect revela severos problemas de comprension de lectura en universitarios en costa rica") ||
    (searchable.includes("dialect") && searchable.includes("costa rica") && searchable.includes("comprension"));

  return isPostOrPressAppearance && hasDialectCostaRicaCopy;
}

function getYouTubeVideoId(url: string): string {
  const input = normalize(url);
  if (!input) return "";

  const short = input.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i);
  if (short?.[1]) return short[1];

  const watch = input.match(/[?&]v=([A-Za-z0-9_-]{6,})/i);
  if (watch?.[1]) return watch[1];

  const embed = input.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i);
  if (embed?.[1]) return embed[1];

  return "";
}

function isYouTubeItem(item: Communication): boolean {
  const tipo = normalize(item.COM_TipoComun).toLocaleLowerCase("es");
  const medio = normalize(item.COM_TipoMedio).toLocaleLowerCase("es");
  const link = normalize(item.COM_Link).toLocaleLowerCase("es");

  return tipo.includes("youtube") || medio.includes("youtube") || link.includes("youtube.com") || link.includes("youtu.be");
}

function resolveThumbnail(item: Communication): string {
  if (shouldUseDialectCostaRicaThumbnail(item)) {
    return "/estudiodialectrevelaseverosproblemasdecomprensiondelecturaenuniversitariosencostarica.png";
  }

  const directThumbnail = toValidImagePath(item.COM_ThumbnailUrl);
  if (directThumbnail) return directThumbnail;

  const thumbnailPath = toValidImagePath(item.COM_ThumbnailPath);
  if (thumbnailPath) return thumbnailPath;

  if (isYouTubeItem(item)) {
    const videoId = getYouTubeVideoId(item.COM_Link);
    if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  return "";
}

function metricsRows(item: Communication) {
  return [
    { label: "Impresiones", value: item.COM_Impresiones },
    { label: "Clics", value: item.COM_Clics },
    { label: "Alcance", value: item.COM_Alcance },
    { label: "Engagement", value: item.COM_Engagement },
    { label: "Likes", value: item.COM_LikesRecomendReacciones },
    { label: "Comentarios", value: item.COM_CantComentarios },
    { label: "Guardados", value: item.COM_Guardados },
    { label: "Shares", value: item.COM_VecesCompartido_Shared },
  ];
}

export default function CommunicationCard({ item, showMetrics = true }: CommunicationCardProps) {
  const thumbnail = resolveThumbnail(item);
  const metrics = metricsRows(item);
  const subtitle = [display(item.COM_Medio), display(item.COM_TemaPubl)].join(" • ");
  const cardTitle = isPostOrReel(item) ? summarizeTitle(item.COM_Titular) : display(item.COM_Titular);
  const hasOpenLink = normalize(item.COM_Link) !== "";

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="relative mb-4 aspect-video overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={`Miniatura de ${cardTitle}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M8 13l2.5-2.5a1 1 0 011.4 0L16 14" />
              <circle cx="9" cy="9" r="1" />
            </svg>
          </div>
        )}
      </div>

      <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{cardTitle}</h3>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
          {display(item.COM_TipoComun)}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-gray-600">{subtitle}</p>
      <p className="mt-1 text-xs text-gray-500">Fecha: {display(item.COM_Fecha)}</p>

      <div className="mt-4">
        {hasOpenLink ? (
          <a
            href={item.COM_Link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Abrir
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center rounded-lg bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-500"
          >
            Abrir
          </button>
        )}
      </div>

      {showMetrics && (
        <details className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">Ver métricas</summary>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-md bg-white px-2 py-1.5">
                <dt className="text-xs text-gray-500">{metric.label}</dt>
                <dd className="font-medium text-slate-900">{display(metric.value)}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </article>
  );
}
