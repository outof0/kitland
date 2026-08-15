import {
  createWebCryptoHostRuntime,
  getHostTransformSpec,
  HOST_TRANSFORM_SLUGS,
  type HostTransformSpec,
  type ToolResult,
} from "@kitland/core";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GenericTransformTool } from "./GenericTransformTool";

const getRuntime = () => createWebCryptoHostRuntime(globalThis.crypto);

afterEach(cleanup);

function mount(
  slug: string,
  props: Partial<React.ComponentProps<typeof GenericTransformTool>> = {},
) {
  const spec = props.spec ?? getHostTransformSpec(slug);
  if (!spec) throw new Error(`No spec for ${slug}`);
  return render(
    <GenericTransformTool slug={slug} spec={spec} getRuntime={getRuntime} {...props} />,
  );
}

function textarea(label: string | RegExp): HTMLTextAreaElement {
  const el = screen.getByRole("textbox", { name: label }) as HTMLTextAreaElement;
  if (!(el instanceof HTMLTextAreaElement)) throw new Error(`Not a textarea: ${label}`);
  return el;
}

async function flush(ms = 220) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

describe("GenericTransformTool", () => {
  it("transforms single input live and renders the shared editor", async () => {
    const { container } = mount("case-converter");
    expect(container.querySelector(".tool-editor")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toMatch(/Case/i);

    const snake = screen.queryByRole("button", { name: /snake/i });
    if (snake) fireEvent.click(snake);
    fireEvent.input(textarea("Input"), { target: { value: "HelloWorld" } });
    await flush();

    expect(textarea("Result").value).toBe("hello_world");
  });

  it("renders diff layout, passes secondaryInput to the transform, and swaps panes", async () => {
    const transform = vi.fn<
      (
        { input, secondaryInput }: { input: string; secondaryInput?: string },
        runtime: unknown,
      ) => Promise<ToolResult<string>>
    >(
      async ({
        input,
        secondaryInput,
      }: {
        input: string;
        secondaryInput?: string;
      }): Promise<ToolResult<string>> => ({ ok: true, value: `${input} <=> ${secondaryInput}` }),
    );
    const spec: HostTransformSpec = {
      slug: "text-diff",
      maxInputChars: 10000,
      operations: [{ id: "diff", label: "Diff", actionLabel: "Diff" }],
      options: [],
      optionLabel: "",
      defaultOperationId: "diff",
      defaultOptionId: "",
      secondaryInput: { label: "Changed (B)" },
      transform,
    };

    const { container } = mount("text-diff", { spec });

    expect(textarea("Original (A)")).toBeTruthy();
    expect(textarea("Changed (B)")).toBeTruthy();
    expect(container.querySelector(".tool-rail")).toBeTruthy();

    fireEvent.input(textarea("Original (A)"), { target: { value: "Hello World" } });
    fireEvent.input(textarea("Changed (B)"), { target: { value: "Hello Kitland" } });
    await flush();

    expect(transform).toHaveBeenCalledWith(
      expect.objectContaining({ input: "Hello World", secondaryInput: "Hello Kitland" }),
      expect.anything(),
    );
    expect(textarea("Result").value).toBe("Hello World <=> Hello Kitland");

    fireEvent.click(screen.getByRole("button", { name: "Swap Original and Changed" }));
    expect(textarea("Original (A)").value).toBe("Hello Kitland");
    expect(textarea("Changed (B)").value).toBe("Hello World");
  });

  it("generate tools commit output on the run button", async () => {
    mount("uuid-id");
    await flush();
    fireEvent.click(screen.getByTitle(/ctrl\+enter/i));
    await flush();
    expect(textarea("Result").value.length).toBeGreaterThan(0);
  });

  it("hides upload and download when capabilities say no file powers", () => {
    mount("case-converter", { capabilities: { fileOpen: false, fileSave: false } });
    expect(screen.queryByTitle("Upload file")).toBeNull();
    expect(screen.queryByTitle("Save result")).toBeNull();
  });

  it("hides upload and download by default (local-only capabilities)", () => {
    mount("case-converter");
    expect(screen.queryByTitle("Upload file")).toBeNull();
    expect(screen.queryByTitle("Save result")).toBeNull();
  });

  it("shows upload and download only when the host grants file powers", () => {
    mount("case-converter", { capabilities: { fileOpen: true, fileSave: true } });
    expect(screen.getByTitle("Upload file")).toBeTruthy();
    expect(screen.getByTitle("Save result")).toBeTruthy();
  });

  it("mounts every host transform tool and sample populates its panes", async () => {
    expect(HOST_TRANSFORM_SLUGS.length).toBeGreaterThanOrEqual(60);

    for (const slug of HOST_TRANSFORM_SLUGS) {
      const { container, unmount } = mount(slug);
      expect(container.querySelector(".tool-editor"), `Tool ${slug} renders editor`).toBeTruthy();
      expect(screen.getByRole("heading", { level: 2 }).textContent).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: /sample/i }));

      const isDiff = Boolean(getHostTransformSpec(slug)?.secondaryInput);
      const textareas = [...container.querySelectorAll("textarea")];
      expect(textareas.length, `Tool ${slug} pane count`).toBe(isDiff ? 3 : 2);
      const populated = textareas.filter((t) => t.value.length >= 1);
      expect(populated.length, `Tool ${slug} sample populates its panes`).toBeGreaterThanOrEqual(
        isDiff ? 2 : 1,
      );

      unmount();
    }
  });
});
