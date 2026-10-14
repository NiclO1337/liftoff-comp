import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // §9: src/domain is pure TypeScript. No UI, framework or database code, no
  // other src folders, and no reading the clock: the time is passed in.
  {
    files: ["src/domain/**/*.ts"],
    ignores: ["src/domain/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react/*", "react-dom", "react-dom/*"],
              message: "src/domain must not import React.",
            },
            {
              group: ["next", "next/*"],
              message: "src/domain must not import Next.js.",
            },
            {
              group: ["@prisma/*", "prisma", ".prisma/*"],
              message: "src/domain must not import Prisma.",
            },
            {
              group: ["@/*", "../*"],
              message:
                "src/domain imports nothing from other src folders. Only relative imports inside src/domain.",
            },
          ],
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Date",
          property: "now",
          message: "src/domain must not read the clock. Pass the time in.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: "src/domain must not read the clock. Pass the time in.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
