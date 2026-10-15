// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Theme = "dark" | "light";
type Colours = Record<string, string>;

const source = readFileSync(join(__dirname, "tokens.scss"), "utf8");

function coloursFor(theme: Theme): Colours {
  const block = source.match(
    new RegExp(`:root\\[data-theme="${theme}"\\]\\s*\\{([^}]*)\\}`),
  )?.[1];
  if (!block) throw new Error(`No ${theme} block in tokens.scss`);

  return Object.fromEntries(
    [...block.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6});/gi)].map(
      ([, name, hex]) => [name, hex],
    ),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// [colour, the backgrounds it is drawn on]
const textPairs: [string, string[]][] = [
  [
    "text",
    ["bg", "surface", "surface-2", "accent-bg", "blue-bg", "good-bg", "bad-bg"],
  ],
  ["text-muted", ["bg", "surface", "surface-2", "accent-bg", "blue-bg"]],
  ["accent-text", ["bg", "surface", "surface-2", "accent-bg"]],
  ["blue", ["bg", "surface", "surface-2", "accent-bg", "blue-bg"]],
  ["good-text", ["surface", "good-bg"]],
  ["bad-text", ["bg", "surface", "bad-bg"]],
  ["on-accent", ["accent"]],
  ["on-blue", ["blue"]],
  ["on-flag-red", ["flag-red"]],
];

// Borders, outlines and controls need 3:1 against what they sit on.
const outlinePairs: [string, string[]][] = [
  ["border-strong", ["bg", "surface", "surface-2"]],
  ["accent", ["bg", "surface", "surface-2", "accent-bg"]],
  ["focus", ["bg", "surface", "surface-2", "accent-bg", "blue-bg"]],
  ["good-border", ["surface", "good-bg"]],
  ["bad-border", ["surface", "surface-2", "bad-bg"]],
  ["flag-red", ["surface", "surface-2"]],
];

function cases(pairs: [string, string[]][]) {
  return pairs.flatMap(([fg, backgrounds]) =>
    backgrounds.map((bg): [string, string] => [fg, bg]),
  );
}

describe.each<Theme>(["dark", "light"])("%s theme colours", (theme) => {
  const colours = coloursFor(theme);

  it.each(cases(textPairs))("text: %s on %s is at least 4.5:1", (fg, bg) => {
    expect(contrast(colours[fg], colours[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(cases(outlinePairs))(
    "outline: %s against %s is at least 3:1",
    (fg, bg) => {
      expect(contrast(colours[fg], colours[bg])).toBeGreaterThanOrEqual(3);
    },
  );
});

describe("tokens.scss", () => {
  it("defines the same colours in both themes", () => {
    expect(Object.keys(coloursFor("light")).sort()).toEqual(
      Object.keys(coloursFor("dark")).sort(),
    );
  });

  it("has every colour the pairs refer to", () => {
    const names = new Set(Object.keys(coloursFor("dark")));
    const used = [...cases(textPairs), ...cases(outlinePairs)].flat();

    expect(used.filter((name) => !names.has(name))).toEqual([]);
  });
});
