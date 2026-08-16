// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HttpStatusCodesTool } from "./HttpStatusCodesTool";

afterEach(cleanup);

describe("HttpStatusCodesTool", () => {
  it("renders with default 404 selected and displays details", () => {
    render(<HttpStatusCodesTool />);
    expect(screen.getByRole("heading", { name: "HTTP Status Codes" })).toBeDefined();
    expect(screen.getAllByText("404").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: "Not Found" })).toBeDefined();
    expect(screen.getAllByText("Client Error").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("RFC 9110 §15.5.5").length).toBeGreaterThanOrEqual(1);
  });

  it("filters status codes via search input", () => {
    render(<HttpStatusCodesTool />);
    const searchInput = screen.getByRole("textbox", { name: "Search HTTP status codes" });

    fireEvent.change(searchInput, { target: { value: "teapot" } });
    expect(screen.getByText("418")).toBeDefined();
    expect(screen.getByText("I'm a teapot")).toBeDefined();

    // Selecting 418 updates the inspector
    fireEvent.click(screen.getByText("I'm a teapot"));
    expect(screen.getByRole("heading", { name: "I'm a teapot" })).toBeDefined();
  });

  it("switches category filter tabs", () => {
    render(<HttpStatusCodesTool />);
    fireEvent.click(screen.getByRole("button", { name: /5xx Server/ }));
    expect(screen.getAllByText("500").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Internal Server Error")).toBeDefined();
  });

  it("switches snippet tabs between wire, fetch, and express", () => {
    render(<HttpStatusCodesTool />);
    expect(screen.getByText(/HTTP\/1\.1 404 Not Found/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Fetch Client" }));
    expect(screen.getByText(/JavaScript Fetch Client/)).toBeDefined();
    expect(screen.getByText(/response\.status === 404/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Express Server" }));
    expect(screen.getByText(/Express \/ Node\.js/)).toBeDefined();
    expect(screen.getByText(/res\.status\(404\)\.json/)).toBeDefined();
  });

  it("resets to 404 sample on sample action click", () => {
    render(<HttpStatusCodesTool />);
    const searchInput = screen.getByRole("textbox", { name: "Search HTTP status codes" });
    fireEvent.change(searchInput, { target: { value: "200" } });

    fireEvent.click(screen.getByRole("button", { name: "Sample (404)" }));
    expect(screen.getAllByText("404").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: "Not Found" })).toBeDefined();
  });
});

