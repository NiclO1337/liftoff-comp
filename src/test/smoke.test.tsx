import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("test setup", () => {
  it("renders a component through the @ alias with jest-dom matchers", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "LiftOff Comp" }),
    ).toBeInTheDocument();
  });
});
