"use client";

const CSRF_COOKIE = "paircode_csrf";

function readCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${CSRF_COOKIE}=`));
  if (!match) return "";
  return decodeURIComponent(match.slice(CSRF_COOKIE.length + 1));
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = readCsrfToken();
    if (csrf) headers.set("x-csrf-token", csrf);
  }
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
}

export type AuthErrorPayload = {
  code: string;
  detail?: string;
  status: number;
};

export async function readJsonError(response: Response): Promise<AuthErrorPayload> {
  try {
    const data = (await response.json()) as { error?: string; detail?: string };
    return {
      code: data.error ?? `http_${response.status}`,
      detail: data.detail,
      status: response.status,
    };
  } catch {
    return {
      code: `http_${response.status}`,
      status: response.status,
    };
  }
}
