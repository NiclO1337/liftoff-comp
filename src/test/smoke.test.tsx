import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Dashboard from "@/app/(app)/page";

describe("test setup", () => {
  it("renders a component through the @ alias with jest-dom matchers", () => {
    render(<Dashboard />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeInTheDocument();
  });
});
