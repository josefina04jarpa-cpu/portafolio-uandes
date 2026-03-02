import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_COOKIE_NAME = "uandes_indicadores_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type TeamAccount = { name: string; email: string; role: string };

export const TEAM_ACCOUNTS: TeamAccount[] = [
  {
    name: "Anil Sadarangani",
    email: "asadaran@gmail.com",
    role: "Director of Innovation / Ph.D. Biological Sciences, P.U.C.",
  },
  { name: "Ariel Véliz", email: "aveliz@uandes.cl", role: "Jefe Financiero" },
  { name: "Claudio Arriaza", email: "carriaza@uandes.cl", role: "Agente de Comercialización" },
  { name: "Daniela Sánchez", email: "dsanchezr@uandes.cl", role: "Jefa de Asuntos Jurídicos" },
  { name: "Danilo Segovia", email: "dsegovia@uandes.cl", role: "Subdirector de Proyectos y Fondos Públicos" },
  { name: "María Fernanda Gana", email: "mfgana@uandes.cl", role: "Jefa de Comunicaciones de Innovación" },
  { name: "María Isabel González", email: "migonzalezm@uandes.cl", role: "Coordinadora Iniciativa BiCI" },
  { name: "Josefina Jarpa", email: "jjarpal@uandes.cl", role: "Content Manager" },
  { name: "Karen Márquez", email: "kmarquez@uandes.cl", role: "Gestora Tecnológica" },
  {
    name: "Silvana Becerra",
    email: "sbecerra@uandes.cl",
    role: "Subdirectora Desarrollo Tecnológico y Comercialización",
  },
  { name: "Ricardo Cacciuttolo", email: "rcacciuttolo@uandes.cl", role: "Ingeniero de Proyectos" },
  { name: "Camila Adonis", email: "cadonisr@uandes.cl", role: "Coordinadora de Proyectos de Innovación" },
  { name: "Vicente Meza", email: "ext_vmeza@uandes.cl", role: "Asistente Open Lab" },
  { name: "Pamela Inostroza", email: "pinostroza@uandes.cl", role: "Data Scientist" },
];

export const TEAM_PROJECT_ASSIGNMENTS: Record<string, string[]> = {
  "rcacciuttolo@uandes.cl": [],
  "kmarquez@uandes.cl": [],
  "cadonisr@uandes.cl": [],
  "carriaza@uandes.cl": [],
};

function authSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-only-secret-change-me"
  );
}

export function getConfiguredTeamPassword(): string {
  return (
    process.env.INDICADORES_TEAM_PASSWORD ||
    process.env.INDICADORES_PASSWORD ||
    "Innovacion2026"
  );
}

export function isAuthorizedTeamEmail(email: string): boolean {
  const value = String(email || "").trim().toLowerCase();
  return TEAM_ACCOUNTS.some((member) => member.email.toLowerCase() === value);
}

export function getTeamMemberByEmail(email: string): TeamAccount | null {
  const value = String(email || "").trim().toLowerCase();
  return TEAM_ACCOUNTS.find((member) => member.email.toLowerCase() === value) || null;
}

export function getAssignedProjectIdsForEmail(email: string): string[] {
  const key = String(email || "").trim().toLowerCase();
  return TEAM_PROJECT_ASSIGNMENTS[key] || [];
}

function sign(value: string): string {
  return createHmac("sha256", authSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function createSessionToken(email: string): string {
  const payload = {
    email: String(email || "").trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function getSessionEmailFromToken(token: string): string | null {
  const value = String(token || "").trim();
  if (!value || !value.includes(".")) return null;

  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  const expectedSignature = sign(body);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      email?: string;
      exp?: number;
    };
    const exp = Number(decoded.exp || 0);
    if (!exp || Math.floor(Date.now() / 1000) >= exp) return null;

    const email = String(decoded.email || "").trim().toLowerCase();
    if (!isAuthorizedTeamEmail(email)) return null;
    return email;
  } catch {
    return null;
  }
}

export function sanitizeNextPath(nextPath: string, fallback = "/indicadores"): string {
  const value = String(nextPath || "").trim();
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
