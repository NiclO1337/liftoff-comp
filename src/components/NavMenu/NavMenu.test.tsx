import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NavMenu } from "./NavMenu";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

const items = [
  { href: "/competitions", label: "Competitions" },
  { href: "/members", label: "Members" },
];

describe("NavMenu", () => {
  beforeEach(() => {
    nav.pathname = "/";
  });

  it("is a labelled navigation landmark with a link for each item", () => {
    render(<NavMenu items={items} />);

    const navigation = screen.getByRole("navigation", { name: "Main" });
    expect(navigation).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Competitions" })).toHaveAttribute(
      "href",
      "/competitions",
    );
    expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute(
      "href",
      "/members",
    );
  });

  it("shows extra content after the links", () => {
    render(
      <NavMenu items={items}>
        <p>anna@sk-atlas.se</p>
      </NavMenu>,
    );

    expect(screen.getByText("anna@sk-atlas.se")).toBeInTheDocument();
  });

  it("marks the current page", () => {
    nav.pathname = "/members";
    render(<NavMenu items={items} />);

    expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Competitions" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("marks a section while inside one of its pages", () => {
    nav.pathname = "/competitions/c1/groups/g1";
    render(<NavMenu items={items} />);

    expect(screen.getByRole("link", { name: "Competitions" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("does not mark a link that only starts with the same letters", () => {
    nav.pathname = "/members-old";
    render(<NavMenu items={items} />);

    expect(screen.getByRole("link", { name: "Members" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("opens and closes with the Menu button", async () => {
    const user = userEvent.setup();
    render(<NavMenu items={items} />);
    const button = screen.getByRole("button", { name: "Menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("controls the panel that holds the links", () => {
    render(<NavMenu items={items} />);
    const button = screen.getByRole("button", { name: "Menu" });
    const panel = document.getElementById(
      button.getAttribute("aria-controls") ?? "",
    );

    expect(panel).toContainElement(
      screen.getByRole("link", { name: "Competitions" }),
    );
  });

  it("closes on Escape and puts focus back on the button", async () => {
    const user = userEvent.setup();
    render(<NavMenu items={items} />);
    const button = screen.getByRole("button", { name: "Menu" });
    await user.click(button);
    screen.getByRole("link", { name: "Members" }).focus();

    await user.keyboard("{Escape}");

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("closes after a link is chosen", async () => {
    const user = userEvent.setup();
    render(<NavMenu items={items} />);
    const button = screen.getByRole("button", { name: "Menu" });
    await user.click(button);

    await user.click(screen.getByRole("link", { name: "Members" }));

    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});
