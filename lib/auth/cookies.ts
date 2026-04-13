import type { NextResponse } from "next/server";

import { ACCESS_TTL_SECONDS, AUTH_ENV, COOKIE_NAMES } from "./env";

type CookieOpts = Parameters<NextResponse["cookies"]["set"]>[2];

const baseSecure = (): CookieOpts => ({
  httpOnly: true,
  secure: AUTH_ENV.isProduction,
  sameSite: "lax",
  path: "/",
});

export function setAuthCookies(
  res: NextResponse,
  args: {
    accessJwt: string;
    refreshToken: string;
    refreshExpiresAt: Date;
    csrfToken: string;
  },
) {
  res.cookies.set(COOKIE_NAMES.access, args.accessJwt, {
    ...baseSecure(),
    maxAge: ACCESS_TTL_SECONDS,
  });

  res.cookies.set(COOKIE_NAMES.refresh, args.refreshToken, {
    ...baseSecure(),
    sameSite: "strict",
    path: "/api/auth",
    expires: args.refreshExpiresAt,
  });

  res.cookies.set(COOKIE_NAMES.csrf, args.csrfToken, {
    httpOnly: false,
    secure: AUTH_ENV.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TTL_SECONDS,
  });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(COOKIE_NAMES.access, "", { ...baseSecure(), maxAge: 0 });
  res.cookies.set(COOKIE_NAMES.refresh, "", {
    ...baseSecure(),
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 0,
  });
  res.cookies.set(COOKIE_NAMES.csrf, "", {
    httpOnly: false,
    secure: AUTH_ENV.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
