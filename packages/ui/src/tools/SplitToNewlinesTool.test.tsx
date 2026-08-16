import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SplitToNewlinesTool } from "./SplitToNewlinesTool";

afterEach(cleanup);

describe("SplitToNewlinesTool", () => {
  it("renders live split editor and splits comma-separated items", async () => {
    render(<SplitToNewlinesTool />);
    expect(screen.getByRole("heading", { name: "Split → Newlines" })).toBeDefined();

    const input = screen.getByRole("textbox", { name: "Delimited text" }) as HTMLTextAreaElement;
    const output = screen.getByRole("textbox", { name: "Lines" }) as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "a, b, c" } });
    await waitFor(() => expect(output.value).toBe("a\nb\nc"));
  });

  it("selects delimiter from the Action Rail menu", async () => {
    render(<SplitToNewlinesTool />);
    const input = screen.getByRole("textbox", { name: "Delimited text" }) as HTMLTextAreaElement;
    const output = screen.getByRole("textbox", { name: "Lines" }) as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "1; 2; 3" } });

    // Click delimiter menu button in Action Rail
    const delimiterTrigger = screen.getByRole("button", {
      name: /Delimiter: Comma/i,
    });
    fireEvent.click(delimiterTrigger);

    // Click Semicolon menu item
    const semicolonItem = screen.getByRole("menuitemradio", { name: /Semicolon/i });
    fireEvent.click(semicolonItem);

    await waitFor(() => expect(output.value).toBe("1\n2\n3"));
  });

  it("swaps input and output while staying within the Split route workflow", async () => {
    render(<SplitToNewlinesTool />);
    const input = screen.getByRole("textbox", { name: "Delimited text" }) as HTMLTextAreaElement;
    const output = screen.getByRole("textbox", { name: "Lines" }) as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "x, y, z" } });
    await waitFor(() => expect(output.value).toBe("x\ny\nz"));

    const swapButton = screen.getByRole("button", { name: "Swap to Join Lines" });
    fireEvent.click(swapButton);

    expect(input.value).toBe("x\ny\nz");
    expect(screen.getByRole("heading", { name: "Join Lines" })).toBeDefined();
    await waitFor(() => expect(output.value).toBe("x, y, z"));
  });

  it("switches mode via header button and preserves converted output as input", async () => {
    render(<SplitToNewlinesTool />);
    const input = screen.getByRole("textbox", { name: "Delimited text" }) as HTMLTextAreaElement;
    const output = screen.getByRole("textbox", { name: "Lines" }) as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "1, 2, 3" } });
    await waitFor(() => expect(output.value).toBe("1\n2\n3"));

    const joinModeBtn = screen.getByRole("button", { name: "Join Lines" });
    fireEvent.click(joinModeBtn);

    expect(input.value).toBe("1\n2\n3");
    expect(screen.getByRole("heading", { name: "Join Lines" })).toBeDefined();
    await waitFor(() => expect(output.value).toBe("1, 2, 3"));
  });

  it("uses radio-menu semantics and arrow-key navigation for delimiters", () => {
    render(<SplitToNewlinesTool />);
    const trigger = screen.getByRole("button", { name: /Delimiter: Comma/i });
    fireEvent.click(trigger);

    const comma = screen.getByRole("menuitemradio", { name: /Comma/i });
    expect(comma.getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(comma);

    fireEvent.keyDown(comma, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("menuitemradio", { name: /Semicolon/i }));
  });
});
