import {
  convertCase,
  dedupeLines,
  diffText,
  err,
  getTextStats,
  ok,
  reverseText,
  sortLines,
  splitToNewlines,
  joinLines,
  type CaseFormat,
  type RegexTestResult,
  type SplitDelimiter,
  type JoinLinesDelimiter,
  type TextDiffResult,
  type TextReverseCase,
  type TextReverseMode,
  type TextStats,
  type ToolResult,
} from "@kitland/core";
import { Worker } from "node:worker_threads";
import {
  buildAdvertisedOutputSchema,
  DEFAULT_MCP_LIMITS,
  DEFAULT_MCP_SAFETY,
  type McpExposure,
} from "../contracts.ts";
import { createMcpError, type McpErrorPayload } from "../errors.ts";

function mapError(code: string, _message: string): McpErrorPayload {
  if (code === "INPUT_TOO_LARGE") {
    return createMcpError("INPUT_TOO_LARGE", "Input text exceeds the maximum allowed size.");
  }
  if (code === "DEADLINE_EXCEEDED") {
    return createMcpError("DEADLINE_EXCEEDED", "Operation timed out before completion.");
  }
  // Do not quote the pattern/text in errors (MCP contract). Use stable messages.
  if (code === "INVALID_REGEX" || code === "INVALID_PATTERN") {
    return createMcpError("INVALID_INPUT", "Invalid regular expression pattern.");
  }
  return createMcpError(
    "INVALID_INPUT",
    "The text operation could not be completed. Check the input format.",
  );
}

type TextOnlyInput = { readonly input: string };
type TextOnlyOutput = { readonly output: string };

const TEXT_ONLY_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "Text content to process." },
  },
} as const;

const TEXT_ONLY_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["output"],
  properties: {
    output: { type: "string", description: "Transformed text output." },
  },
} as const;

// ---------------------------------------------------------------------------
// Case Converter
// ---------------------------------------------------------------------------

type CaseConvertInput = {
  readonly input: string;
  readonly targetCase: "camel" | "pascal" | "snake" | "kebab" | "constant" | "title" | "sentence";
};

type CaseConvertOutput = {
  readonly output: string;
  readonly targetCase: string;
};

const CASE_CONVERT_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input", "targetCase"],
  properties: {
    input: { type: "string", description: "Text to convert case." },
    targetCase: {
      type: "string",
      enum: ["camel", "pascal", "snake", "kebab", "constant", "title", "sentence"],
      description: "Target naming convention.",
    },
  },
} as const;

const CASE_CONVERT_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["output", "targetCase"],
  properties: {
    output: { type: "string", description: "Case-converted text." },
    targetCase: { type: "string" },
  },
} as const;

export const kitlandCaseConvertExposure: McpExposure<CaseConvertInput, CaseConvertOutput> = {
  mcpName: "kitland_case_convert",
  operationId: "case_convert",
  contractVersion: 1,
  registryToolId: "case-converter",
  title: "Case Converter",
  description:
    "Convert text between camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, and Sentence case.",
  inputSchema: CASE_CONVERT_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(CASE_CONVERT_SUCCESS_SCHEMA),
  successSchema: CASE_CONVERT_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: CaseConvertInput): ToolResult<CaseConvertOutput> => {
    const res = convertCase(args.input, args.targetCase as CaseFormat);
    if (!res.ok) return res;
    return ok({ output: res.value, targetCase: args.targetCase });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Sort Lines
// ---------------------------------------------------------------------------

type SortLinesInput = {
  readonly input: string;
  readonly direction?: "ascending" | "descending";
  readonly caseSensitive?: boolean;
  readonly numeric?: boolean;
};

const SORT_LINES_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "Lines of text to sort." },
    direction: {
      type: "string",
      enum: ["ascending", "descending"],
      description: "Sort direction (default 'ascending').",
    },
    caseSensitive: { type: "boolean", description: "Case-sensitive ordering (default false)." },
    numeric: { type: "boolean", description: "Natural numeric sorting (default false)." },
  },
} as const;

export const kitlandSortLinesExposure: McpExposure<SortLinesInput, TextOnlyOutput> = {
  mcpName: "kitland_sort_lines",
  operationId: "sort_lines",
  contractVersion: 1,
  registryToolId: "sort-lines",
  title: "Sort Lines",
  description: "Sort lines deterministically with direction, numeric, and case options.",
  inputSchema: SORT_LINES_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: SortLinesInput): ToolResult<TextOnlyOutput> => {
    const res = sortLines(args.input, {
      direction: args.direction ?? "ascending",
      caseSensitive: args.caseSensitive ?? false,
      numeric: args.numeric ?? false,
    });
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Dedupe Lines
// ---------------------------------------------------------------------------

type DedupeLinesInput = {
  readonly input: string;
  readonly mode?: "exact" | "trim";
  readonly caseSensitive?: boolean;
};

const DEDUPE_LINES_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "Lines of text to deduplicate." },
    mode: {
      type: "string",
      enum: ["exact", "trim"],
      description: "Comparison mode: 'exact' match or 'trim' whitespace (default 'exact').",
    },
    caseSensitive: { type: "boolean", description: "Case-sensitive uniqueness (default true)." },
  },
} as const;

export const kitlandDedupeLinesExposure: McpExposure<DedupeLinesInput, TextOnlyOutput> = {
  mcpName: "kitland_dedupe_lines",
  operationId: "dedupe_lines",
  contractVersion: 1,
  registryToolId: "dedupe-lines",
  title: "Dedupe Lines",
  description: "Remove duplicate lines while preserving first-seen order and line endings.",
  inputSchema: DEDUPE_LINES_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: DedupeLinesInput): ToolResult<TextOnlyOutput> => {
    const res = dedupeLines(args.input, {
      mode: args.mode ?? "exact",
      caseSensitive: args.caseSensitive ?? true,
    });
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Text Reverser
// ---------------------------------------------------------------------------

type TextReverseInput = {
  readonly input: string;
  readonly mode?: "characters" | "word-order" | "word-characters" | "line-order";
  readonly case?: "keep" | "upper" | "lower";
};

type TextReverseOutput = {
  readonly output: string;
  readonly mode: string;
};

const TEXT_REVERSE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "Text to reverse." },
    mode: {
      type: "string",
      enum: ["characters", "word-order", "word-characters", "line-order"],
      description: "Reversal mode (default 'characters').",
    },
    case: {
      type: "string",
      enum: ["keep", "upper", "lower"],
      description: "Case treatment (default 'keep').",
    },
  },
} as const;

const TEXT_REVERSE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["output", "mode"],
  properties: {
    output: { type: "string", description: "Reversed text output." },
    mode: { type: "string" },
  },
} as const;

export const kitlandTextReverseExposure: McpExposure<TextReverseInput, TextReverseOutput> = {
  mcpName: "kitland_text_reverse",
  operationId: "text_reverse",
  contractVersion: 1,
  registryToolId: "text-reverser",
  title: "Text Reverser",
  description: "Reverse characters, words, or lines with safe Unicode grapheme preservation.",
  inputSchema: TEXT_REVERSE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_REVERSE_SUCCESS_SCHEMA),
  successSchema: TEXT_REVERSE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextReverseInput): ToolResult<TextReverseOutput> => {
    const mode: TextReverseMode = args.mode ?? "characters";
    const textCase: TextReverseCase = args.case ?? "keep";
    const res = reverseText(args.input, { mode, case: textCase });
    if (!res.ok) return res;
    return ok({ output: res.value, mode });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Text Stats
// ---------------------------------------------------------------------------

const TEXT_STATS_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "graphemes",
    "codePoints",
    "words",
    "lines",
    "charactersWithWhitespace",
    "charactersWithoutWhitespace",
    "utf8Bytes",
  ],
  properties: {
    graphemes: { type: "integer", description: "Perceived visual characters (grapheme clusters)." },
    codePoints: { type: "integer", description: "Unicode scalar values." },
    words: { type: "integer", description: "Word count." },
    lines: { type: "integer", description: "Logical line count." },
    charactersWithWhitespace: { type: "integer" },
    charactersWithoutWhitespace: { type: "integer" },
    utf8Bytes: { type: "integer" },
  },
} as const;

export const kitlandTextStatsExposure: McpExposure<TextOnlyInput, TextStats> = {
  mcpName: "kitland_text_stats",
  operationId: "text_stats",
  contractVersion: 1,
  registryToolId: "text-stats",
  title: "Text Stats",
  description:
    "Calculate detailed text metrics (graphemes, words, lines, code points, UTF-8 bytes).",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_STATS_SUCCESS_SCHEMA),
  successSchema: TEXT_STATS_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextStats> => {
    return getTextStats(args.input);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Text Diff
// ---------------------------------------------------------------------------

type TextDiffInput = {
  readonly original: string;
  readonly modified: string;
};

const TEXT_DIFF_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["original", "modified"],
  properties: {
    original: { type: "string", description: "Original text before changes." },
    modified: { type: "string", description: "Modified text after changes." },
  },
} as const;

const TEXT_DIFF_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["equal", "added", "removed", "unchanged", "lines"],
  properties: {
    equal: { type: "boolean" },
    added: { type: "integer" },
    removed: { type: "integer" },
    unchanged: { type: "integer" },
    lines: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "value", "oldLine", "newLine"],
        properties: {
          kind: { type: "string", enum: ["equal", "added", "removed"] },
          value: { type: "string" },
          oldLine: { type: ["integer", "null"] },
          newLine: { type: ["integer", "null"] },
        },
      },
    },
  },
} as const;

export const kitlandTextDiffExposure: McpExposure<TextDiffInput, TextDiffResult> = {
  mcpName: "kitland_text_diff",
  operationId: "text_diff",
  contractVersion: 1,
  registryToolId: "text-diff",
  title: "Text Diff",
  description: "Compare two text documents with line-level longest common subsequence diffing.",
  inputSchema: TEXT_DIFF_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_DIFF_SUCCESS_SCHEMA),
  successSchema: TEXT_DIFF_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextDiffInput): ToolResult<TextDiffResult> => {
    return diffText(args.original, args.modified);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Regex Tester
// ---------------------------------------------------------------------------

type RegexTestInput = {
  readonly pattern: string;
  readonly text: string;
  readonly flags?: string;
};

const REGEX_TEST_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["pattern", "text"],
  properties: {
    pattern: { type: "string", description: "Regular expression pattern." },
    text: { type: "string", description: "Input text to search." },
    flags: { type: "string", description: "RegExp flags (e.g. 'g', 'i', 'm', default 'g')." },
  },
} as const;

const REGEX_TEST_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["matches", "truncated"],
  properties: {
    matches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["value", "index", "end", "captures", "namedCaptures"],
        properties: {
          value: { type: "string" },
          index: { type: "integer" },
          end: { type: "integer" },
          captures: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["index", "value"],
              properties: {
                index: { type: "integer" },
                value: { type: ["string", "null"] },
              },
            },
          },
          namedCaptures: { type: "object", additionalProperties: { type: ["string", "null"] } },
        },
      },
    },
    truncated: { type: "boolean" },
  },
} as const;

function runRegexWorker(
  pattern: string,
  input: string,
  flags: string,
  timeoutMs: number,
): Promise<ToolResult<RegexTestResult>> {
  return new Promise((resolve) => {
    let settled = false;
    let worker: Worker | null = null;
    try {
      const workerEntry = import.meta.url.endsWith("/dist/cli.js")
        ? new URL("./regex-worker.js", import.meta.url)
        : new URL("../../dist/regex-worker.js", import.meta.url);
      worker = new Worker(workerEntry, {
        workerData: { pattern, input, flags },
      });
    } catch {
      return resolve(err("INTERNAL_ERROR", "Regex worker could not be started."));
    }

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        void worker?.terminate();
        resolve(err("DEADLINE_EXCEEDED", "Operation timed out before completion."));
      }
    }, timeoutMs);

    worker.on("message", (msg: ToolResult<RegexTestResult>) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        void worker?.terminate();
        resolve(msg);
      }
    });

    worker.on("error", (workerErr) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        void worker?.terminate();
        const message = workerErr instanceof Error ? workerErr.message : "Regex worker failed.";
        resolve(err("INVALID_REGEX", message));
      }
    });

    worker.on("exit", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        if (code !== 0) {
          resolve(err("INTERNAL_ERROR", `Worker thread terminated with code ${code}`));
        } else {
          // Clean exit without a message indicates a bug (e.g., race after fix should not happen);
          // surface as internal error rather than hanging until deadline.
          resolve(err("INTERNAL_ERROR", "Regex worker terminated without result."));
        }
      }
    });
  });
}

export const kitlandRegexTestExposure: McpExposure<RegexTestInput, RegexTestResult> = {
  mcpName: "kitland_regex_test",
  operationId: "regex_test",
  contractVersion: 1,
  registryToolId: "regex-tester",
  title: "Regex Tester",
  description:
    "Test regular expressions against text and extract capture groups and match indices.",
  inputSchema: REGEX_TEST_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(REGEX_TEST_SUCCESS_SCHEMA),
  successSchema: REGEX_TEST_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: RegexTestInput): Promise<ToolResult<RegexTestResult>> => {
    return runRegexWorker(args.pattern, args.text, args.flags ?? "g", DEFAULT_MCP_LIMITS.timeoutMs);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Split to Newlines
// ---------------------------------------------------------------------------

type SplitToNewlinesInput = {
  readonly input: string;
  readonly delimiter?: "comma" | "semicolon" | "whitespace" | "pipe" | "custom";
  readonly customDelimiter?: string;
  readonly trimItems?: boolean;
  readonly dropEmpty?: boolean;
};

const SPLIT_TO_NEWLINES_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "Delimited text to split." },
    delimiter: {
      type: "string",
      enum: ["comma", "semicolon", "whitespace", "pipe", "custom"],
      description: "Delimiter type (default 'comma').",
    },
    customDelimiter: {
      type: "string",
      description: "Custom delimiter string when delimiter is 'custom'.",
    },
    trimItems: { type: "boolean", description: "Trim whitespace from items (default true)." },
    dropEmpty: { type: "boolean", description: "Drop empty items (default true)." },
  },
} as const;

export const kitlandSplitToNewlinesExposure: McpExposure<SplitToNewlinesInput, TextOnlyOutput> = {
  mcpName: "kitland_split_to_newlines",
  operationId: "split_to_newlines",
  contractVersion: 1,
  registryToolId: "split-to-newlines",
  title: "Split to Newlines",
  description:
    "Split delimited text (comma, semicolon, whitespace, pipe, custom) into newline-separated lines.",
  inputSchema: SPLIT_TO_NEWLINES_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: SplitToNewlinesInput): ToolResult<TextOnlyOutput> => {
    const res = splitToNewlines(args.input, {
      delimiter: (args.delimiter as SplitDelimiter) ?? "comma",
      ...(args.customDelimiter !== undefined ? { customDelimiter: args.customDelimiter } : {}),
      trimItems: args.trimItems ?? true,
      dropEmpty: args.dropEmpty ?? true,
    });
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

type JoinLinesInput = {
  readonly input: string;
  readonly delimiter?: "comma" | "semicolon" | "whitespace" | "pipe" | "custom";
  readonly customDelimiter?: string;
  readonly trimItems?: boolean;
  readonly dropEmpty?: boolean;
};

const JOIN_LINES_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "Lines to join into delimited text." },
    delimiter: {
      type: "string",
      enum: ["comma", "semicolon", "whitespace", "pipe", "custom"],
      description: "Delimiter type (default 'comma').",
    },
    customDelimiter: {
      type: "string",
      description: "Custom delimiter string when delimiter is 'custom'.",
    },
    trimItems: { type: "boolean", description: "Trim whitespace from items (default true)." },
    dropEmpty: { type: "boolean", description: "Drop empty items (default true)." },
  },
} as const;

export const kitlandJoinLinesExposure: McpExposure<JoinLinesInput, TextOnlyOutput> = {
  mcpName: "kitland_join_lines",
  operationId: "join_lines",
  contractVersion: 1,
  registryToolId: "join-lines",
  title: "Join Lines",
  description:
    "Join newline-separated lines into delimited text (comma, semicolon, whitespace, pipe, custom).",
  inputSchema: JOIN_LINES_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: JoinLinesInput): ToolResult<TextOnlyOutput> => {
    const res = joinLines(args.input, {
      delimiter: (args.delimiter as JoinLinesDelimiter) ?? "comma",
      ...(args.customDelimiter !== undefined ? { customDelimiter: args.customDelimiter } : {}),
      trimItems: args.trimItems ?? true,
      dropEmpty: args.dropEmpty ?? true,
    });
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

export const TEXT_REGEX_EXPOSURES = [
  kitlandCaseConvertExposure,
  kitlandSortLinesExposure,
  kitlandDedupeLinesExposure,
  kitlandTextReverseExposure,
  kitlandTextStatsExposure,
  kitlandTextDiffExposure,
  kitlandRegexTestExposure,
  kitlandSplitToNewlinesExposure,
  kitlandJoinLinesExposure,
] as const;
