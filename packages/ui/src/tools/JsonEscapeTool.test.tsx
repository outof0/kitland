import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JsonEscapeTool } from "./JsonEscapeTool";

afterEach(cleanup);

describe("JsonEscapeTool", () => {
  it("renders live escape editor and escapes text as a JSON string literal", async () => {
    render(<JsonEscapeTool initialInput={'Hello "world"\nNew line'} />);
    expect(screen.getByRole("heading", { name: "JSON Escape" })).toBeDefined();

    const input = screen.getByRole("textbox", { name: "Plain text / JSON" }) as HTMLTextAreaElement;
    const output = screen.getByRole("textbox", {
      name: 'JSON string literal ("...")',
    }) as HTMLTextAreaElement;

    expect(input.value).toBe('Hello "world"\nNew line');
    await waitFor(() => expect(output.value).toBe('"Hello \\"world\\"\\nNew line"'));
  });

  it("toggles options: Quotes, Escape /, and ASCII only", async () => {
    render(<JsonEscapeTool initialInput="<script>/api/cà phê 🍵</script>" />);

    const quotesBtn = screen.getByRole("button", { name: /Quotes/i });
    const slashesBtn = screen.getByRole("button", { name: /Escape \//i });
    const unicodeBtn = screen.getByRole("button", { name: /ASCII only/i });

    // Toggle Quotes off
    fireEvent.click(quotesBtn);
    const unquotedOutput = screen.getByRole("textbox", {
      name: "Escaped string",
    }) as HTMLTextAreaElement;
    await waitFor(() => expect(unquotedOutput.value).toBe("<script>/api/cà phê 🍵</script>"));

    // Toggle Escape / on
    fireEvent.click(slashesBtn);
    await waitFor(() => expect(unquotedOutput.value).toBe("<script>\\/api\\/cà phê 🍵<\\/script>"));

    // Toggle ASCII only on
    fireEvent.click(unicodeBtn);
    await waitFor(() =>
      expect(unquotedOutput.value).toBe(
        "<script>\\/api\\/c\\u00e0 ph\\u00ea \\ud83c\\udf75<\\/script>",
      ),
    );
  });

  it("switches to unescape mode and unescapes unquoted escaped JSON", async () => {
    render(<JsonEscapeTool />);

    const unescapeModeBtn = screen.getByRole("button", { name: "Unescape" });
    fireEvent.click(unescapeModeBtn);

    const input = screen.getByRole("textbox", {
      name: "Escaped text / JSON",
    }) as HTMLTextAreaElement;
    const output = screen.getByRole("textbox", {
      name: "Unescaped text / JSON",
    }) as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: '{\\"name\\": \\"Alice\\", \\"count\\": 42}' } });
    await waitFor(() => expect(output.value).toBe('{"name": "Alice", "count": 42}'));
  });

  it("swaps input and output while toggling mode", async () => {
    render(<JsonEscapeTool initialInput={'Line 1\n"quoted"'} />);

    const swapBtn = screen.getByRole("button", { name: /Swap/i });
    await waitFor(() => {
      const output = screen.getByRole("textbox", {
        name: 'JSON string literal ("...")',
      }) as HTMLTextAreaElement;
      expect(output.value).toBe('"Line 1\\n\\"quoted\\""');
    });

    fireEvent.click(swapBtn);

    const swappedInput = screen.getByRole("textbox", {
      name: "Escaped text / JSON",
    }) as HTMLTextAreaElement;
    expect(swappedInput.value).toBe('"Line 1\\n\\"quoted\\""');

    const swappedOutput = screen.getByRole("textbox", {
      name: "Unescaped text / JSON",
    }) as HTMLTextAreaElement;
    await waitFor(() => expect(swappedOutput.value).toBe('Line 1\n"quoted"'));
  });
});
