import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PasswordField } from "./PasswordField";

describe("PasswordField", () => {
  it("starts hidden", () => {
    render(<PasswordField label="Password" />);

    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toBeInTheDocument();
  });

  it("shows and hides the password", async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Password" />);

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("keeps what was typed when it is shown", async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Password" />);
    await user.type(screen.getByLabelText("Password"), "secret123");

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(screen.getByLabelText("Password")).toHaveValue("secret123");
  });

  it("does not submit the form when the button is used", async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const user = userEvent.setup();
    render(
      <form onSubmit={onSubmit}>
        <PasswordField label="Password" />
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("passes the field props through, with hint and error", () => {
    render(
      <PasswordField
        label="Password"
        name="coachPassword"
        hint="At least 8 characters"
        error="Enter a password"
        required
      />,
    );
    const input = screen.getByLabelText(/Password/);

    expect(input).toHaveAttribute("name", "coachPassword");
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription(
      "At least 8 characters Enter a password",
    );
  });
});
