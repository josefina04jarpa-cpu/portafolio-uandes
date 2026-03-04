import { createHmac, timingSafeEqual } from "crypto";
import { getAllEquipoMembers, getEquipoMemberByEmail as getEquipoByEmail } from "./equipoInnovacion";

export const AUTH_COOKIE_NAME = "uandes_indicadores_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type TeamAccount = { name: string; email: string; role: string; area: string };

export function getAllTeamAccounts(): TeamAccount[] {
  const equipo = getAllEquipoMembers();
  return equipo.map((member) => ({
    name: member.nombre,
    email: member.correo,
    role: member.cargo,
    area: member.area,
  }));
}

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
  const teamAccounts = getAllTeamAccounts();
  return teamAccounts.some((member) => member.email.toLowerCase() === value);
}

export function getTeamMemberByEmail(email: string): TeamAccount | null {
  const value = String(email || "").trim().toLowerCase();
  const member = getEquipoByEmail(value);
  if (!member) return null;
  
  return {
    name: member.nombre,
    email: member.correo,
    role: member.cargo,
    area: member.area,
  };
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
