import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

type Failure = { ok: false; error: string; email: string };

const wrongPassword = (email: string): Failure => ({
  ok: false,
  error: "Wrong email or password",
  email,
});

async function fillIn(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Email/), email);
  await user.type(screen.getByLabelText(/Password/), password);
  return user;
}

describe("LoginForm", () => {
  it("has labelled email and password fields and a login button", () => {
    render(<LoginForm action={vi.fn()} />);

    expect(screen.getByRole("form", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(/Password/)).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
  });

  it("has no sign-up or password reset link", () => {
    render(<LoginForm action={vi.fn()} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows no error before anything is sent", () => {
    render(<LoginForm action={vi.fn()} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("sends the email and password to the action", async () => {
    const action = vi.fn().mockResolvedValue(wrongPassword("anna@sk-atlas.se"));
    render(<LoginForm action={action} />);

    const user = await fillIn("anna@sk-atlas.se", "secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(action).toHaveBeenCalledTimes(1);
    const data = action.mock.calls[0][1] as FormData;
    expect(data.get("email")).toBe("anna@sk-atlas.se");
    expect(data.get("password")).toBe("secret123");
  });

  it("shows the error as an alert, keeps the email and clears the password", async () => {
    const action = vi.fn().mockResolvedValue(wrongPassword("anna@sk-atlas.se"));
    render(<LoginForm action={action} />);

    const user = await fillIn("anna@sk-atlas.se", "wrong");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Wrong email or password",
    );
    expect(screen.getByLabelText(/Email/)).toHaveValue("anna@sk-atlas.se");
    expect(screen.getByLabelText(/Password/)).toHaveValue("");
  });

  it("is disabled and says so while logging in, so a double tap sends once", async () => {
    let finish: (value: Failure) => void = () => {};
    const action = vi.fn(
      () => new Promise<Failure>((resolve) => (finish = resolve)),
    );
    render(<LoginForm action={action} />);

    const user = await fillIn("anna@sk-atlas.se", "secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    const busy = await screen.findByRole("button", { name: "Logging in…" });
    expect(busy).toBeDisabled();
    await user.click(busy);
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => finish(wrongPassword("anna@sk-atlas.se")));
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
  });

  it("does not submit the form when the password is shown or hidden", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm action={action} />);

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(action).not.toHaveBeenCalled();
  });
});
