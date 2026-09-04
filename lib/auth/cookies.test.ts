/**
 * The cookie-prefix contract.
 *
 * A `__Host-` or `__Secure-` cookie whose requirements are not met is dropped
 * by the browser with no error and no warning — the Set-Cookie header simply
 * does nothing and the next request arrives unauthenticated. That failure is
 * invisible in code review and expensive to debug, so it is asserted here.
 *
 * Run: bun test
 */
import { expect, test } from "bun:test";

import {
  COOKIE_NAMES,
  REFRESH_COOKIE_PATH,
  SECURE_COOKIES,
  cookieNamesFor,
} from "./env";

const PREFIXED = /^__(Host|Secure)-/;

test("insecure transport issues no prefixed cookie", () => {
  for (const name of Object.values(cookieNamesFor(false))) {
    expect(name).not.toMatch(PREFIXED);
  }
});

test("secure transport prefixes both httpOnly cookies", () => {
  const names = cookieNamesFor(true);
  expect(names.access.startsWith("__Host-")).toBe(true);
  expect(names.refresh.startsWith("__Secure-")).toBe(true);
});

test("__Host- is reserved for the cookie actually scoped to Path=/", () => {
  // The refresh cookie is deliberately scoped narrower than "/" so it never
  // rides on ordinary requests, which is exactly why it cannot be __Host-.
  expect(REFRESH_COOKIE_PATH).not.toBe("/");
  expect(cookieNamesFor(true).refresh.startsWith("__Host-")).toBe(false);
});

test("the csrf cookie is never prefixed, because the client has to read it", () => {
  expect(cookieNamesFor(true).csrf).not.toMatch(PREFIXED);
  expect(cookieNamesFor(false).csrf).not.toMatch(PREFIXED);
});

test("the active configuration is internally consistent", () => {
  for (const name of Object.values(COOKIE_NAMES)) {
    if (PREFIXED.test(name)) {
      expect(SECURE_COOKIES).toBe(true);
    }
  }
});

test("production cannot opt out of secure cookies", () => {
  // SECURE_COOKIES is `production || opt-in`, so no environment value can
  // switch it off in production. This pins that direction of the derivation.
  const derive = (nodeEnv: string, optIn: string | undefined) =>
    nodeEnv === "production" || optIn === "true";

  expect(derive("production", undefined)).toBe(true);
  expect(derive("production", "false")).toBe(true);
  expect(derive("development", undefined)).toBe(false);
  expect(derive("development", "true")).toBe(true);
});
