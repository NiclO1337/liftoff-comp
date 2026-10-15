import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function renderShell(props: Partial<Parameters<typeof AppShell>[0]> = {}) {
  return render(
    <AppShell
      email="anna@sk-atlas.se"
      role="COACH"
      clubName="SK Atlas"
      logoutAction={vi.fn()}
      {...props}
    >
      <h1>Dashboard</h1>
    </AppShell>,
  );
}

describe("AppShell", () => {
  it("has the page landmarks", () => {
    renderShell();

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Main" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("puts the page content in main", () => {
    renderShell();

    expect(
      within(screen.getByRole("main")).getByRole("heading", {
        name: "Dashboard",
      }),
    ).toBeInTheDocument();
  });

  it("has a skip link that is the first thing to tab to and leads to main", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.tab();

    const skip = screen.getByRole("link", { name: "Skip to main content" });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("links the name to the dashboard", () => {
    renderShell();

    expect(screen.getByRole("link", { name: "LiftOff Comp" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("shows who is signed in, with role and club", () => {
    renderShell();

    expect(screen.getByText("anna@sk-atlas.se")).toBeInTheDocument();
    expect(screen.getByText("Coach · SK Atlas")).toBeInTheDocument();
  });

  it("shows the club name in the top bar", () => {
    renderShell();

    const banner = screen.getByRole("banner");
    expect(within(banner).getAllByText(/SK Atlas/).length).toBeGreaterThan(0);
  });

  it("shows no club for an admin who has not picked one", () => {
    renderShell({ role: "ADMIN", clubName: null });

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(
      screen.queryByText(/·/, { selector: "span" }),
    ).not.toBeInTheDocument();
  });

  it("shows Competitions and Members to a coach, but not Clubs", () => {
    renderShell();

    expect(
      screen.getByRole("link", { name: "Competitions" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Members" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Clubs" }),
    ).not.toBeInTheDocument();
  });

  it("shows Clubs to an admin", () => {
    renderShell({ role: "ADMIN" });

    expect(screen.getByRole("link", { name: "Clubs" })).toHaveAttribute(
      "href",
      "/admin/clubs",
    );
  });

  it("does not show a Lifters link yet", () => {
    renderShell();

    expect(
      screen.queryByRole("link", { name: "Lifters" }),
    ).not.toBeInTheDocument();
  });

  it("has the theme toggle", () => {
    renderShell();

    expect(
      screen.getByRole("button", { name: "Light mode" }),
    ).toBeInTheDocument();
  });

  it("logs out through the action", async () => {
    const logoutAction = vi.fn();
    const user = userEvent.setup();
    renderShell({ logoutAction });

    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(logoutAction).toHaveBeenCalledTimes(1);
  });
});
