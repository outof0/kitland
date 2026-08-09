import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RegexTesterTool } from "./RegexTesterTool";

afterEach(cleanup);

function patternInput(): HTMLInputElement {
  const el = screen.getByRole("textbox", { name: "Pattern" });
  if (!(el instanceof HTMLInputElement)) throw new Error("Pattern is not an input");
  return el;
}

function flagsInput(): HTMLInputElement {
  const el = screen.getByRole("textbox", { name: "Flags" });
  if (!(el instanceof HTMLInputElement)) throw new Error("Flags is not an input");
  return el;
}

function testTextInput(): HTMLTextAreaElement {
  const el = screen.getByRole("textbox", { name: "Test text" });
  if (!(el instanceof HTMLTextAreaElement)) throw new Error("Test text is not a textarea");
  return el;
}

describe("RegexTesterTool", () => {
  it("renders with empty initial state (no sample auto-loaded)", () => {
    render(<RegexTesterTool />);
    expect(screen.getByRole("heading", { name: "Regex Tester" })).toBeDefined();
    expect(patternInput().value).toBe("");
    expect(flagsInput().value).toBe("gu");
    expect(testTextInput().value).toBe("");
    expect(screen.getByLabelText("Regex matches").textContent).toContain(
      "Enter a regular expression and test string to view matches",
    );
    expect(screen.getByLabelText("Regex Tester status").textContent).toContain("Waiting");
  });

  it("loads sample data when Sample button is clicked", async () => {
    render(<RegexTesterTool />);
    fireEvent.click(screen.getByRole("button", { name: "Sample" }));
    await waitFor(() => expect(patternInput().value).toContain("?<word>"));
    expect(testTextInput().value).toContain("Tea, bánh, and 🍵");
    await waitFor(() =>
      expect(screen.getByLabelText("Regex matches").textContent).toContain("8 matches"),
    );
    expect(screen.getByLabelText("Regex Tester status").textContent).toContain("Matched");
  });

  it("matches custom pattern and text", async () => {
    render(<RegexTesterTool />);
    fireEvent.change(patternInput(), { target: { value: "\\d+" } });
    fireEvent.change(testTextInput(), { target: { value: "order 123 item 456" } });
    await waitFor(() =>
      expect(screen.getByLabelText("Regex matches").textContent).toContain("2 matches"),
    );
    expect(screen.getByLabelText("Regex matches").textContent).toContain('"123"');
    expect(screen.getByLabelText("Regex matches").textContent).toContain('"456"');
  });

  it("reports invalid regular expression syntax in alert", async () => {
    render(<RegexTesterTool />);
    fireEvent.change(patternInput(), { target: { value: "[" } });
    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert.textContent).toContain("Invalid regular expression");
    });
  });

  it("toggles flags when clicking flag buttons", async () => {
    render(<RegexTesterTool />);
    expect(flagsInput().value).toBe("gu");
    const iFlagBtn = screen.getByRole("button", { name: "i" });
    fireEvent.click(iFlagBtn);
    expect(flagsInput().value).toBe("gui");
    fireEvent.click(iFlagBtn);
    expect(flagsInput().value).toBe("gu");
  });

  it("clears test string when clicking clear button", async () => {
    render(<RegexTesterTool />);
    fireEvent.change(testTextInput(), { target: { value: "some text" } });
    expect(testTextInput().value).toBe("some text");
    fireEvent.click(screen.getByRole("button", { name: "Clear test string" }));
    expect(testTextInput().value).toBe("");
  });
});
