import { jsonFormatterAdapter } from "../../src/adapters/json-formatter";

describe("JSON Formatter adapter", () => {
  it("declares a bounded text-inspect renderer with no replacement commands", () => {
    expect(jsonFormatterAdapter.descriptor.renderer).toEqual({
      kind: "text-inspect",
      operations: [
        { id: "beautify", label: "Beautify", actionLabel: "Beautify JSON" },
        { id: "minify", label: "Minify", actionLabel: "Minify JSON" },
      ],
      options: [
        { id: "indent-2", label: "2 spaces" },
        { id: "indent-4", label: "4 spaces" },
        { id: "indent-tab", label: "Tab" },
      ],
      optionLabel: "Indentation",
      defaultOperationId: "beautify",
      defaultOptionId: "indent-2",
    });
    expect(jsonFormatterAdapter.maxInputChars).toBe(100_000);
    expect(jsonFormatterAdapter.maxSelectionChars).toBe(100_000);
    expect(jsonFormatterAdapter.maxOutputChars).toBe(1_000_000);
    expect(jsonFormatterAdapter.selectionCommands).toEqual([]);
  });

  it("returns the structured core inspection and propagates exact errors", () => {
    expect(
      jsonFormatterAdapter.inspect({
        operationId: "beautify",
        optionId: "indent-4",
        input: '{"a":[true,null]}',
      }),
    ).toMatchObject({
      ok: true,
      value: {
        formatted: '{\n    "a": [\n        true,\n        null\n    ]\n}',
        rootType: "object",
        totalValues: 4,
        objectCount: 1,
        arrayCount: 1,
        booleanCount: 1,
        nullCount: 1,
        maxDepth: 2,
      },
    });
    expect(
      jsonFormatterAdapter.inspect({
        operationId: "beautify",
        optionId: "indent-tab",
        input: '{"a":[true,null]}',
      }),
    ).toMatchObject({
      ok: true,
      value: {
        formatted: '{\n\t"a": [\n\t\ttrue,\n\t\tnull\n\t]\n}',
      },
    });
    expect(
      jsonFormatterAdapter.inspect({
        operationId: "minify",
        optionId: "indent-2",
        input: '{"a": [1]}',
      }),
    ).toMatchObject({ ok: true, value: { formatted: '{"a":[1]}' } });
    expect(
      jsonFormatterAdapter.inspect({ operationId: "beautify", optionId: "indent-2", input: "{" }),
    ).toEqual({
      ok: false,
      error: { code: "INVALID_JSON", message: "JSON is invalid." },
    });
    expect(
      jsonFormatterAdapter.inspect({ operationId: "beautify", optionId: "other", input: "null" }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_OPTION" } });
    expect(
      jsonFormatterAdapter.inspect({ operationId: "other", optionId: "indent-2", input: "null" }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_OPERATION" } });
    expect(
      jsonFormatterAdapter.inspect({
        operationId: "beautify",
        optionId: "indent-2",
        input: "x".repeat(100_001),
      }),
    ).toMatchObject({ ok: false, error: { code: "INPUT_TOO_LARGE" } });
  });
});
