import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { UnixTimestampTool } from "./UnixTimestampTool";

afterEach(cleanup);

describe("UnixTimestampTool", () => {
  it("renders with live timestamp and converts without initial error", () => {
    render(<UnixTimestampTool />);
    expect(screen.getByRole("heading", { name: "Unix Timestamp Converter" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Unix → Date" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Date → Unix" })).toBeDefined();
    expect(screen.getByText("Converted Date")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("switches direction between Unix → Date and Date → Unix smoothly without invalid date error", async () => {
    render(<UnixTimestampTool />);
    const input = screen.getByLabelText("Timestamp value") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1786695783" } });

    await waitFor(() =>
      expect(screen.getAllByText("2026-08-14T08:23:03.000Z").length).toBeGreaterThan(0),
    );
    expect(screen.queryByRole("alert")).toBeNull();

    // Switch to Date → Unix
    fireEvent.click(screen.getByRole("button", { name: "Date → Unix" }));
    const dateInput = screen.getByLabelText("ISO date string") as HTMLInputElement;
    expect(dateInput.value).toBe("2026-08-14T08:23:03.000Z");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getAllByText("2026-08-14T08:23:03.000Z").length).toBeGreaterThan(0);

    // Switch back to Unix → Date
    fireEvent.click(screen.getByRole("button", { name: "Unix → Date" }));
    const unixInput = screen.getByLabelText("Timestamp value") as HTMLInputElement;
    expect(unixInput.value).toBe("1786695783");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("changes resolution seamlessly in Unix mode", async () => {
    render(<UnixTimestampTool />);
    const input = screen.getByLabelText("Timestamp value") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1786695783" } });

    // Change to ms
    fireEvent.click(screen.getByRole("button", { name: "ms" }));
    expect(input.value).toBe("1786695783000");
    expect(screen.queryByRole("alert")).toBeNull();

    // Change to µs
    fireEvent.click(screen.getByRole("button", { name: "µs" }));
    expect(input.value).toBe("1786695783000000");
    expect(screen.queryByRole("alert")).toBeNull();

    // Change back to seconds
    fireEvent.click(screen.getByRole("button", { name: "seconds" }));
    expect(input.value).toBe("1786695783");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("uses the selected milliseconds resolution for early timestamps", async () => {
    render(<UnixTimestampTool />);
    const input = screen.getByLabelText("Timestamp value") as HTMLInputElement;
    fireEvent.click(screen.getByRole("button", { name: "ms" }));
    fireEvent.change(input, { target: { value: "86400000" } });

    await waitFor(() =>
      expect(screen.getAllByText("1970-01-02T00:00:00.000Z").length).toBeGreaterThan(0),
    );
  });

  it("handles Use Now in both Unix and Date modes", async () => {
    render(<UnixTimestampTool />);
    fireEvent.click(screen.getByRole("button", { name: "Use Now" }));
    expect(screen.queryByRole("alert")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Date → Unix" }));
    fireEvent.click(screen.getByRole("button", { name: "Use Now" }));
    const dateInput = screen.getByLabelText("ISO date string") as HTMLInputElement;
    expect(dateInput.value).toContain("T");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
