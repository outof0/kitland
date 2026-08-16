// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MimeTypesTool } from "./MimeTypesTool";

afterEach(cleanup);

describe("MimeTypesTool", () => {
  it("renders with default .svg selected and displays details", () => {
    render(<MimeTypesTool />);
    expect(screen.getByRole("heading", { name: "MIME Types" })).toBeDefined();
    expect(screen.getAllByText("image/svg+xml").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(".svg").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("image").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/IANA Authority/).length).toBeGreaterThanOrEqual(1);
  });

  it("filters MIME types via search input", () => {
    render(<MimeTypesTool />);
    const searchInput = screen.getByRole("textbox", { name: "Search MIME types or extensions" });

    fireEvent.change(searchInput, { target: { value: "wasm" } });
    expect(screen.getAllByText("application/wasm").length).toBeGreaterThanOrEqual(1);

    // Selecting application/wasm updates the inspector
    fireEvent.click(screen.getByText("application/wasm"));
    expect(screen.getByRole("heading", { name: "application/wasm" })).toBeDefined();
  });

  it("selects MIME type via popular extension buttons", () => {
    render(<MimeTypesTool />);
    const jsonBtn = screen.getAllByRole("button", { name: ".json" })[0]!;
    fireEvent.click(jsonBtn);
    expect(screen.getAllByText("application/json").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: "application/json" })).toBeDefined();
  });

  it("switches snippet tabs between header, fetch, nginx, and apache", () => {
    render(<MimeTypesTool />);
    expect(screen.getByText(/Content-Type: image\/svg\+xml; charset=utf-8/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Fetch Response" }));
    expect(screen.getByText(/Standard Web Fetch \/ Response/)).toBeDefined();
    expect(screen.getByText(/Content-Type": "image\/svg\+xml; charset=utf-8/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Nginx Config" }));
    expect(screen.getByText(/Nginx mime\.types mapping/)).toBeDefined();
    expect(screen.getByText(/image\/svg\+xml svg svgz;/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Apache .htaccess" }));
    expect(screen.getAllByText(/Apache \.htaccess/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/AddType image\/svg\+xml \.svg \.svgz/)).toBeDefined();
  });

  it("resets to .svg sample on sample action click", () => {
    render(<MimeTypesTool />);
    const searchInput = screen.getByRole("textbox", { name: "Search MIME types or extensions" });
    fireEvent.change(searchInput, { target: { value: "pdf" } });

    fireEvent.click(screen.getByRole("button", { name: "Sample (.svg)" }));
    expect(screen.getAllByText("image/svg+xml").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: "image/svg+xml" })).toBeDefined();
  });
});
