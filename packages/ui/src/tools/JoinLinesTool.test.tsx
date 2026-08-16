import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JoinLinesTool } from "./JoinLinesTool";
import type { SplitJoinMode } from "./SplitToNewlinesTool";

afterEach(cleanup);

describe("JoinLinesTool", () => {
  it("renders the Join Lines route workflow and joins lines with a comma", async () => {
    render(<JoinLinesTool />);
    const input = screen.getByRole("textbox", {
      name: "Lines",
    }) as HTMLTextAreaElement;
    const output = screen.getByRole("textbox", {
      name: "Delimited text",
    }) as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "a\nb\nc" } });
    await waitFor(() => expect(output.value).toBe("a, b, c"));
  });

  it("navigates to the canonical Split route after a valid swap", async () => {
    const onModeNavigate = vi.fn<(slug: SplitJoinMode) => void>();
    render(<JoinLinesTool onModeNavigate={onModeNavigate} />);
    const input = screen.getByRole("textbox", {
      name: "Lines",
    }) as HTMLTextAreaElement;
    const output = screen.getByRole("textbox", {
      name: "Delimited text",
    }) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "a\nb\nc" } });
    await waitFor(() => expect(output.value).toBe("a, b, c"));

    fireEvent.click(screen.getByRole("button", { name: "Swap to Split → Newlines" }));
    expect(onModeNavigate).toHaveBeenCalledWith("split-to-newlines");
  });
});
