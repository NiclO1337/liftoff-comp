import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreateClubForm } from "./CreateClubForm";

type Failure = Awaited<
  ReturnType<Parameters<typeof CreateClubForm>[0]["action"]>
>;

const failure = (overrides: Partial<Failure> = {}): Failure => ({
  ok: false,
  error: "Fix 2 fields to create the club",
  fieldErrors: {
    name: "Enter the club name",
    coachPassword: "Enter a password",
  },
  values: { name: "", coachName: "Eva Karlsson", coachEmail: "eva@hammar.se" },
  ...overrides,
});

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Create club" }));

describe("CreateClubForm", () => {
  it("has a required club name and optional coach fields", () => {
    render(<CreateClubForm action={vi.fn()} />);

    expect(screen.getByLabelText(/Club name/)).toBeRequired();
    expect(screen.getByLabelText("Name")).not.toBeRequired();
    expect(screen.getByLabelText("Email")).not.toBeRequired();
    expect(screen.getByLabelText("Password")).not.toBeRequired();
  });

  it("groups the first coach fields under a legend that says they are optional", () => {
    render(<CreateClubForm action={vi.fn()} />);

    const group = screen.getByRole("group", { name: "First coach" });
    expect(group).toHaveTextContent("Optional.");
    expect(group).toContainElement(screen.getByLabelText("Email"));
  });

  it("describes the password rule", () => {
    render(<CreateClubForm action={vi.fn()} />);

    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "At least 8 characters. Tell the coach in person.",
    );
  });

  it("has a Cancel link back to the club list", () => {
    render(<CreateClubForm action={vi.fn()} />);

    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      "/admin/clubs",
    );
  });

  it("shows no error before anything is sent", () => {
    render(<CreateClubForm action={vi.fn()} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("sends the club and the coach to the action", async () => {
    const action = vi.fn().mockResolvedValue(failure());
    const user = userEvent.setup();
    render(<CreateClubForm action={action} />);

    await user.type(screen.getByLabelText(/Club name/), "Hammar AK");
    await user.type(screen.getByLabelText("Name"), "Eva Karlsson");
    await user.type(screen.getByLabelText("Email"), "eva@hammar.se");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await submit(user);

    const data = action.mock.calls[0][1] as FormData;
    expect(data.get("name")).toBe("Hammar AK");
    expect(data.get("coachName")).toBe("Eva Karlsson");
    expect(data.get("coachEmail")).toBe("eva@hammar.se");
    expect(data.get("coachPassword")).toBe("secret123");
  });

  it("lets the server judge an empty form, instead of the browser stopping it", async () => {
    const action = vi.fn().mockResolvedValue(failure());
    const user = userEvent.setup();
    render(<CreateClubForm action={action} />);

    await submit(user);

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("shows a summary as an alert and a message next to each field", async () => {
    const user = userEvent.setup();
    render(<CreateClubForm action={vi.fn().mockResolvedValue(failure())} />);

    await submit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Fix 2 fields to create the club",
    );
    expect(screen.getByLabelText(/Club name/)).toBeInvalid();
    expect(screen.getByLabelText(/Club name/)).toHaveAccessibleDescription(
      "Enter the club name",
    );
    expect(screen.getByLabelText("Password")).toBeInvalid();
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "At least 8 characters. Tell the coach in person. Enter a password",
    );
    expect(screen.getByLabelText("Email")).toBeValid();
  });

  it("moves focus to the first field with an error", async () => {
    const user = userEvent.setup();
    render(<CreateClubForm action={vi.fn().mockResolvedValue(failure())} />);

    await submit(user);

    await screen.findByRole("alert");
    expect(screen.getByLabelText(/Club name/)).toHaveFocus();
  });

  it("focuses the coach field when the club name is fine", async () => {
    const user = userEvent.setup();
    const result = failure({
      fieldErrors: { coachEmail: "That email is already in use" },
      values: {
        name: "Hammar AK",
        coachName: "Eva",
        coachEmail: "eva@hammar.se",
      },
    });
    render(<CreateClubForm action={vi.fn().mockResolvedValue(result)} />);

    await submit(user);

    await screen.findByRole("alert");
    expect(screen.getByLabelText("Email")).toHaveFocus();
  });

  it("keeps what was typed and clears the password", async () => {
    const user = userEvent.setup();
    render(<CreateClubForm action={vi.fn().mockResolvedValue(failure())} />);
    await user.type(screen.getByLabelText("Password"), "secret123");

    await submit(user);

    await screen.findByRole("alert");
    expect(screen.getByLabelText("Name")).toHaveValue("Eva Karlsson");
    expect(screen.getByLabelText("Email")).toHaveValue("eva@hammar.se");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("is disabled and says so while creating, so a double tap makes one club", async () => {
    let finish: (value: Failure) => void = () => {};
    const action = vi.fn(
      () => new Promise<Failure>((resolve) => (finish = resolve)),
    );
    const user = userEvent.setup();
    render(<CreateClubForm action={action} />);

    await submit(user);

    const busy = await screen.findByRole("button", { name: "Creating club…" });
    expect(busy).toBeDisabled();
    await user.click(busy);
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => finish(failure()));
    expect(screen.getByRole("button", { name: "Create club" })).toBeEnabled();
  });
});
