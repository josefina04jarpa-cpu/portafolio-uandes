import { ONE_DRIVE_IMAGE_MAP } from "./oneDriveImageMap";

function toBase64Url(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  if (typeof btoa !== "undefined") {
    const utf8 = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    );

    return btoa(utf8)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  return "";
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function normalizeLookup(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

const oneDriveByFileName = new Map<string, string>(
  ONE_DRIVE_IMAGE_MAP.map(([fileName, url]) => [normalizeLookup(fileName), url]),
);

function toOneDriveDirectUrl(value: string): string {
  const input = String(value || "").trim();
  if (!input) return "";

  if (/^https:\/\/api\.onedrive\.com\/v1\.0\/shares\//i.test(input)) {
    return input;
  }

  if (!/(1drv\.ms|onedrive\.live\.com)/i.test(input)) {
    return input;
  }

  const encoded = toBase64Url(input);
  if (!encoded) return input;

  return `https://api.onedrive.com/v1.0/shares/u!${encoded}/root/content`;
}

export function resolveImageSrc(value: string): string {
  const input = String(value || "").trim();
  if (!input) return "";

  if (isHttpUrl(input)) {
    return toOneDriveDirectUrl(input);
  }

  const baseUrl = String(process.env.NEXT_PUBLIC_ONEDRIVE_IMAGES_BASE_URL || "").trim().replace(/\/+$/g, "");
  const normalizedPath = input.startsWith("/") ? input : `/${input}`;
  const decodedPath = decodeURI(normalizedPath);
  const fileName = decodedPath.split("/").filter(Boolean).pop() || "";
  const mappedUrl = oneDriveByFileName.get(normalizeLookup(fileName));
  if (mappedUrl) {
    return mappedUrl;
  }
  const encodedPath = encodeURI(normalizedPath);

  if (!baseUrl) {
    return encodedPath;
  }

  return `${baseUrl}${encodedPath}`;
}
