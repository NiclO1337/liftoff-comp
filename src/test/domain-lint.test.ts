// @vitest-environment node
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({ overrideConfigFile: "eslint.config.mjs" });

async function ruleIds(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((message) => message.ruleId ?? "parse-error");
}

const DOMAIN_FILE = "src/domain/example.ts";

describe("lint rules for src/domain", () => {
  const forbidden: [description: string, code: string, ruleId: string][] = [
    [
      "React",
      'import { useState } from "react";\nexport const s = useState;',
      "no-restricted-imports",
    ],
    [
      "react-dom",
      'import { createRoot } from "react-dom/client";\nexport const r = createRoot;',
      "no-restricted-imports",
    ],
    [
      "Next.js",
      'import { redirect } from "next/navigation";\nexport const r = redirect;',
      "no-restricted-imports",
    ],
    [
      "the Prisma client",
      'import { PrismaClient } from "@prisma/client";\nexport const p = PrismaClient;',
      "no-restricted-imports",
    ],
    [
      "another src folder through the alias",
      'import { db } from "@/server/db";\nexport const d = db;',
      "no-restricted-imports",
    ],
    [
      "another src folder through a relative path",
      'import { db } from "../server/db";\nexport const d = db;',
      "no-restricted-imports",
    ],
    [
      "Date.now()",
      "export const now = Date.now();",
      "no-restricted-properties",
    ],
    [
      "new Date() without arguments",
      "export const now = new Date();",
      "no-restricted-syntax",
    ],
  ];

  it.each(forbidden)("forbids %s", async (_description, code, ruleId) => {
    expect(await ruleIds(code, DOMAIN_FILE)).toContain(ruleId);
  });

  const allowed: [description: string, code: string][] = [
    [
      "a relative import inside src/domain",
      'import type { Sex } from "./types";\nexport type S = Sex;',
    ],
    ["new Date(value)", "export const at = (ms: number) => new Date(ms);"],
    ['new Date("...")', 'export const at = new Date("2026-10-18T14:00:00Z");'],
  ];

  it.each(allowed)("allows %s", async (_description, code) => {
    expect(await ruleIds(code, DOMAIN_FILE)).toEqual([]);
  });

  describe("only applies to src/domain", () => {
    it("allows the clock and the alias in other folders", async () => {
      const code =
        'import { db } from "@/server/db";\nexport const now = [db, Date.now(), new Date()];';

      expect(await ruleIds(code, "src/server/example.ts")).toEqual([]);
    });

    it("allows domain tests to import test helpers", async () => {
      const code =
        'import { makeEntry } from "@/test/factories";\nexport const e = makeEntry;';

      expect(await ruleIds(code, "src/domain/example.test.ts")).toEqual([]);
    });
  });
});
