/**
 * The palette's accessibility floor, checked against the tokens as written in
 * app/globals.css. If a token is retuned by eye, this fails before it ships.
 *
 * Run: bun test
 */
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(import.meta.dir, "..", "app", "globals.css"), "utf8");

function block(selector: string) {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`missing block: ${selector}`);
  const open = css.indexOf("{", start);
  const end = css.indexOf("\n}", open);
  return css.slice(open, end);
}

function token(scope: string, name: string) {
  const match = block(scope).match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`missing token --${name} in ${scope}`);
  return match[1];
}

function luminance(hex: string) {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function ratio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SCOPES = [":root {", 'html[data-theme="dark"] {'] as const;

// Body text and any text a sighted user must read at small sizes.
const BODY_PAIRS: [string, string][] = [
  ["ink", "stock"],
  ["ink", "stock-face"],
  ["ink", "stock-rack"],
  ["ink", "stock-sunk"],
  ["ink-2", "stock"],
  ["ink-2", "stock-face"],
  ["ink-2", "stock-rack"],
  ["ink-3", "stock"], // placeholders and dimmed values
  ["ink-3", "stock-face"],
  ["ink-3", "stock-rack"],
  ["ink-3", "stock-sunk"],
  ["secure-ink", "secure"], // legends printed on the intaglio band
  ["provisional-ink", "provisional"], // the visitor mark
  ["cancel", "stock-face"],
  ["provisional", "stock-face"],
];

for (const scope of SCOPES) {
  for (const [fg, bg] of BODY_PAIRS) {
    test(`${scope.trim()} ${fg} on ${bg} clears 4.5:1`, () => {
      const value = ratio(token(scope, fg), token(scope, bg));
      expect(value).toBeGreaterThanOrEqual(4.5);
    });
  }

  // The reader lamp is decorative reinforcement — it only needs to be
  // distinguishable from the stock it sits on, since every state also
  // carries a word.
  test(`${scope.trim()} lamp is visible on stock-face`, () => {
    expect(ratio(token(scope, "lamp"), token(scope, "stock-face"))).toBeGreaterThanOrEqual(3);
  });
}
