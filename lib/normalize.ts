const HONORIFICS = new Set([
  "dr",
  "dra",
  "prof",
  "profa",
  "sr",
  "sra",
  "ing",
  "lic",
  "mag",
  "mg",
  "msc",
  "phd",
  "ph",
  "md",
]);

export function removeDiacritics(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function reorderCommaName(value: string): string {
  const text = String(value || "").trim();
  if (!text.includes(",")) return text;

  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length !== 2) return text;
  return `${parts[1]} ${parts[0]}`.trim();
}

function stripHonorifics(value: string): string {
  const words = value.split(" ").filter(Boolean);
  return words.filter((word) => !HONORIFICS.has(word)).join(" ");
}

export function normalizeText(value: unknown): string {
  const withOrder = reorderCommaName(String(value ?? ""));
  const noDiacritics = removeDiacritics(withOrder);
  const lower = noDiacritics.toLowerCase();
  const noDots = lower.replace(/[.]/g, " ");
  const noHonorifics = stripHonorifics(noDots);
  const noPunctuation = noHonorifics.replace(/[^a-z0-9\s]/g, " ");
  return noPunctuation.replace(/\s+/g, " ").trim();
}

export function slugifyNormalized(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, "-").trim();
}

export function splitCandidateValues(value: unknown): string[] {
  const text = String(value ?? "").trim();
  if (!text) return [];

  const stageA = text
    .split(/[;|\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const stageB = stageA.flatMap((part) =>
    part
      .split(/\s+y\s+/gi)
      .map((item) => item.trim())
      .filter(Boolean),
  );

  const out: string[] = [];
  for (const candidate of stageB) {
    const commaCount = (candidate.match(/,/g) || []).length;
    if (commaCount <= 1) {
      out.push(candidate);
      continue;
    }

    candidate
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => out.push(item));
  }

  return Array.from(new Set(out));
}
