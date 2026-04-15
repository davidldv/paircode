import { NextRequest, NextResponse } from "next/server";

import { COOKIE_NAMES } from "@/lib/auth/env";
import { CSRF_HEADER, constantTimeEquals } from "@/lib/auth/csrf";
import { verifyAccessToken } from "@/lib/auth/jwt";

const PUBLIC_PAGE_PREFIXES = ["/sign-in", "/sign-up", "/brand"];
const PUBLIC_API_ROUTES = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/guest",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/health",
]);
const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function applySecurityHeaders(res: NextResponse, wsOrigin: string) {
  const isVercelPreview = process.env.VERCEL_ENV === "preview";
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      isVercelPreview
        ? "script-src 'self' 'unsafe-inline' https://vercel.live"
        : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      isVercelPreview
        ? `connect-src 'self' ${wsOrigin} https://vercel.live wss://ws-us3.pusher.com`
        : `connect-src 'self' ${wsOrigin}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  );
}

function stripInternalHeaders(req: NextRequest) {
  const cleanedHeaders = new Headers(req.headers);
  cleanedHeaders.delete("x-user-id");
  cleanedHeaders.delete("x-session-id");
  return cleanedHeaders;
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_API_ROUTES.has(pathname)) return true;
  return PUBLIC_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(req: NextRequest) {
  const wsPublic = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";
  const wsOrigin = (() => {
    try {
      const u = new URL(wsPublic);
      const httpProto = u.protocol === "wss:" ? "https:" : "http:";
      return `${u.protocol}//${u.host} ${httpProto}//${u.host}`;
    } catch {
      return wsPublic;
    }
  })();

  const cleanHeaders = stripInternalHeaders(req);
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    const res = NextResponse.next({ request: { headers: cleanHeaders } });
    applySecurityHeaders(res, wsOrigin);
    return res;
  }

  const isApi = pathname.startsWith("/api/");

  if (isApi && !CSRF_SAFE_METHODS.has(req.method)) {
    const csrfCookie = req.cookies.get(COOKIE_NAMES.csrf)?.value;
    const csrfHeader = req.headers.get(CSRF_HEADER);
    if (!csrfCookie || !csrfHeader || !constantTimeEquals(csrfCookie, csrfHeader)) {
      const res = NextResponse.json({ error: "csrf_failed" }, { status: 403 });
      applySecurityHeaders(res, wsOrigin);
      return res;
    }
  }

  const accessCookie = req.cookies.get(COOKIE_NAMES.access)?.value;

  if (!accessCookie) {
    if (isApi) {
      const res = NextResponse.json({ error: "unauthenticated" }, { status: 401 });
      applySecurityHeaders(res, wsOrigin);
      return res;
    }
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("next", pathname);
    const res = NextResponse.redirect(signIn);
    applySecurityHeaders(res, wsOrigin);
    return res;
  }

  try {
    const claims = await verifyAccessToken(accessCookie);
    cleanHeaders.set("x-user-id", claims.sub);
    cleanHeaders.set("x-session-id", claims.sid);
    const res = NextResponse.next({ request: { headers: cleanHeaders } });
    applySecurityHeaders(res, wsOrigin);
    return res;
  } catch {
    if (isApi) {
      const res = NextResponse.json({ error: "invalid_token" }, { status: 401 });
      applySecurityHeaders(res, wsOrigin);
      return res;
    }
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("next", pathname);
    const res = NextResponse.redirect(signIn);
    applySecurityHeaders(res, wsOrigin);
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|brand|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)",
  ],
};
