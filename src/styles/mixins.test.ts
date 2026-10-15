// @vitest-environment node
import { describe, expect, it } from "vitest";
import { compileString } from "sass";

function compile(scss: string): string {
  return compileString(`@use "mixins" as *;\n${scss}`, {
    loadPaths: [__dirname],
  }).css;
}

describe("from()", () => {
  it.each([
    ["tablet", "48em"],
    ["desktop", "75em"],
  ])("opens a min-width query for %s at %s", (name, width) => {
    const css = compile(`.a { @include from(${name}) { color: red; } }`);

    expect(css).toContain(`@media (min-width: ${width})`);
  });

  it("refuses an unknown breakpoint", () => {
    expect(() =>
      compile(".a { @include from(phone) { color: red; } }"),
    ).toThrow(/Unknown breakpoint `phone`/);
  });
});

describe("tabular", () => {
  it("turns on tabular numerals", () => {
    expect(compile(".a { @include tabular; }")).toContain(
      "font-variant-numeric: tabular-nums",
    );
  });
});

describe("visually-hidden", () => {
  it("hides the element visually but keeps it in the page", () => {
    const css = compile(".a { @include visually-hidden; }");

    expect(css).toContain("position: absolute");
    expect(css).toContain("clip-path: inset(50%)");
    expect(css).not.toContain("display: none");
  });
});
