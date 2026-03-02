import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, sanitizeNextPath } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const nextPath = sanitizeNextPath(String(formData.get("next") || "/ingresar"), "/ingresar");

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
