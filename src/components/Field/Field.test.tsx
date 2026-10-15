import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Field } from "./Field";

describe("Field", () => {
  it("connects the label to the input", () => {
    render(<Field label="Email" />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("passes input attributes through and lets the user type", async () => {
    const onChange = vi.fn();
    render(
      <Field
        label="Email"
        type="email"
        name="email"
        autoComplete="username"
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText("Email");

    await userEvent.type(input, "anna@sk-atlas.se");

    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("autocomplete", "username");
    expect(input).toHaveValue("anna@sk-atlas.se");
    expect(onChange).toHaveBeenCalled();
  });

  it("marks a required field, without adding the star to its name", () => {
    render(<Field label="Name" required />);

    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).toBeRequired();
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no star when the field is optional", () => {
    render(<Field label="Bodyweight (kg)" />);

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("is valid and has no description by default", () => {
    render(<Field label="Email" />);
    const input = screen.getByLabelText("Email");

    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("describes the input with the hint", () => {
    render(<Field label="Lot number" hint="Next free number: 8" />);

    expect(screen.getByLabelText("Lot number")).toHaveAccessibleDescription(
      "Next free number: 8",
    );
  });

  it("marks the input invalid and describes it with the error", () => {
    render(<Field label="Birth year" error="Enter a year, like 1996" />);
    const input = screen.getByLabelText("Birth year");

    expect(input).toBeInvalid();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a year, like 1996");
  });

  it("describes the input with both the hint and the error", () => {
    render(
      <Field
        label="Birth year"
        hint="Needed for age classes"
        error="Enter a year, like 1996"
      />,
    );

    expect(screen.getByLabelText("Birth year")).toHaveAccessibleDescription(
      "Needed for age classes Enter a year, like 1996",
    );
  });

  it("gives each field its own id", () => {
    render(
      <>
        <Field label="First" />
        <Field label="Second" />
      </>,
    );

    expect(screen.getByLabelText("First").id).not.toBe(
      screen.getByLabelText("Second").id,
    );
  });
});
