import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button as a button", () => {
  it("renders a button that does not submit a form by default", () => {
    render(<Button>Add lifter</Button>);

    expect(screen.getByRole("button", { name: "Add lifter" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("can be a submit button", () => {
    render(<Button type="submit">Log in</Button>);

    expect(screen.getByRole("button", { name: "Log in" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("calls onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Retry</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does nothing while disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Logging in…
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Logging in…" });

    await userEvent.click(button);

    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("passes other button attributes through", () => {
    render(<Button aria-label="Menu for Anna">…</Button>);

    expect(
      screen.getByRole("button", { name: "Menu for Anna" }),
    ).toBeInTheDocument();
  });
});

describe("Button as a link", () => {
  it("renders a link when it has an href", () => {
    render(<Button href="/competitions/new">New competition</Button>);

    expect(
      screen.getByRole("link", { name: "New competition" }),
    ).toHaveAttribute("href", "/competitions/new");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("works for both variants", () => {
    render(
      <>
        <Button href="/a" variant="primary">
          First
        </Button>
        <Button href="/b" variant="secondary">
          Second
        </Button>
      </>,
    );

    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
