import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RocketIcon } from "./RocketIcon";

describe("RocketIcon", () => {
  it("is decorative: hidden from screen readers and not focusable", () => {
    const { container } = render(<RocketIcon />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
  });
});
