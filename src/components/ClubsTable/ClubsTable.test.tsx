import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClubsTable } from "./ClubsTable";

const clubs = [
  { id: "club-1", name: "SK Atlas", coachCount: 3, lifterCount: 19 },
  { id: "club-2", name: "IK Vasa", coachCount: 1, lifterCount: 8 },
  { id: "club-3", name: "Hammar AK", coachCount: 2, lifterCount: 12 },
];

describe("ClubsTable", () => {
  it("is a table with a caption and column headers", () => {
    render(<ClubsTable clubs={clubs} activeClubId={null} />);

    expect(
      screen.getByRole("table", { name: "All clubs" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(["Club", "Coaches", "Lifters"]);
  });

  it("has a row for each club, with the club name as the row header", () => {
    render(<ClubsTable clubs={clubs} activeClubId={null} />);

    expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3 clubs
    expect(
      screen.getByRole("rowheader", { name: "IK Vasa" }),
    ).toBeInTheDocument();
  });

  it("shows the coach and lifter counts", () => {
    render(<ClubsTable clubs={clubs} activeClubId={null} />);

    const row = screen.getByRole("row", { name: /SK Atlas/ });
    expect(
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["3", "19"]);
  });

  it("marks only the active club", () => {
    render(<ClubsTable clubs={clubs} activeClubId="club-2" />);

    expect(screen.getAllByText("Active")).toHaveLength(1);
    expect(
      within(screen.getByRole("row", { name: /IK Vasa/ })).getByText("Active"),
    ).toBeInTheDocument();
  });

  it("marks no club when none is active", () => {
    render(<ClubsTable clubs={clubs} activeClubId={null} />);

    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("says so when there are no clubs, instead of an empty table", () => {
    render(<ClubsTable clubs={[]} activeClubId={null} />);

    expect(screen.getByText("No clubs yet.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
