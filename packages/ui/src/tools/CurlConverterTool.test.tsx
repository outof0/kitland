import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CurlConverterTool } from "./CurlConverterTool";

afterEach(cleanup);

function input(): HTMLTextAreaElement {
  const el = screen.getByRole("textbox", { name: "cURL command" });
  if (!(el instanceof HTMLTextAreaElement)) throw new Error("Input is not a textarea");
  return el;
}

function output(): HTMLTextAreaElement {
  const el = screen.getByRole("textbox", { name: "Fetch result" });
  if (!(el instanceof HTMLTextAreaElement)) throw new Error("Output is not a textarea");
  return el;
}

describe("CurlConverterTool", () => {
  it("renders the shared shell with header, direction segments, and status bar", () => {
    render(<CurlConverterTool />);
    expect(screen.getByRole("heading", { name: "cURL to Fetch Converter" })).toBeDefined();
    expect(input()).toBeDefined();
    expect(output()).toBeDefined();
    expect(screen.getByRole("button", { name: "To fetch" })).toBeDefined();
    expect(screen.getByRole("button", { name: "To curl" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Sample" })).toBeDefined();
    expect(screen.getByLabelText("cURL to Fetch Converter status").textContent).toContain("cURL");
  });

  it("converts live through the shared core and reports errors accessibly", async () => {
    render(<CurlConverterTool />);
    fireEvent.change(input(), { target: { value: "curl https://example.test" } });
    await waitFor(() => expect(output().value).toContain('method: "GET"'));

    fireEvent.change(input(), { target: { value: "not curl" } });
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("Start the command with curl"),
    );
    await waitFor(() => expect(output().value).toBe(""));
  });

  it("fills the sample and clears the panes", async () => {
    render(<CurlConverterTool />);
    fireEvent.click(screen.getByRole("button", { name: "Sample" }));
    await waitFor(() => expect(input().value).toContain("curl -X POST"));
    await waitFor(() => expect(output().value).toContain('method: "POST"'));

    fireEvent.click(screen.getByRole("button", { name: "Clear input" }));
    await waitFor(() => expect(input().value).toBe(""));
    await waitFor(() => expect(output().value).toBe(""));
  });

  it("swaps direction and converts fetch back to curl", async () => {
    render(<CurlConverterTool />);
    fireEvent.click(screen.getByRole("button", { name: "To curl" }));
    const fetchInput = screen.getByRole("textbox", { name: "Fetch request" });
    const curlOutput = screen.getByRole("textbox", {
      name: "cURL command",
    }) as HTMLTextAreaElement;
    fireEvent.change(fetchInput, {
      target: { value: "await fetch('https://example.test', { method: 'POST' })" },
    });
    await waitFor(() => expect(curlOutput.value).toContain("-X POST"));
  });
});
