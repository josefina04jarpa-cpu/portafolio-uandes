import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  getConfiguredTeamPassword,
  isAuthorizedTeamEmail,
  sanitizeNextPath,
} from "../../../../lib/auth";

function errorRedirect(request: NextRequest, nextPath: string, message: string) {
  const encoded = encodeURIComponent(message);
  return NextResponse.redirect(new URL(`/ingresar?next=${encodeURIComponent(nextPath)}&error=${encoded}`, request.url));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const nextPath = sanitizeNextPath(String(formData.get("next") || "/indicadores"));

  if (!isAuthorizedTeamEmail(email)) {
    return errorRedirect(request, nextPath, "Correo no autorizado para el acceso de indicadores");
  }

  const configuredPassword = getConfiguredTeamPassword();
  if (password !== configuredPassword) {
    return errorRedirect(request, nextPath, "Contraseña inválida");
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  response.cookies.set(AUTH_COOKIE_NAME, createSessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
