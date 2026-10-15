import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/Button/Button";
import { Banner } from "./Banner";

describe("Banner", () => {
  it("announces an error as an alert", () => {
    render(<Banner variant="error">Wrong email or password</Banner>);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Wrong email or password",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("announces offline politely, as a status", () => {
    render(
      <Banner variant="offline">Offline · showing data from 13:52</Banner>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Offline · showing data from 13:52",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the decorative icon out of the accessible text", () => {
    const { container } = render(<Banner variant="error">Oops</Banner>);

    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("shows an action, such as Retry", () => {
    render(
      <Banner variant="offline" action={<Button>Retry</Button>}>
        Offline
      </Banner>,
    );

    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("has no action area without an action", () => {
    render(<Banner variant="error">Oops</Banner>);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
