import {
  err,
  formatCode,
  formatSql,
  formatXml,
  jsonToCsv,
  jsonToToml,
  jsonToYaml,
  yamlToJson,
  type ToolResult,
} from "@kitland/core";
import {
  isStructuredTextWorkerRequest,
  STRUCTURED_TEXT_WORKER_MAX_OUTPUT_CHARS,
  type StructuredTextWorkerRequest,
  type StructuredTextWorkerResponse,
} from "@/lib/structured-text-worker-protocol";

type WorkerScope = {
  addEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
  postMessage(message: StructuredTextWorkerResponse): void;
};

const workerScope = self as unknown as WorkerScope;

workerScope.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (!isStructuredTextWorkerRequest(event.data)) return;

  let result: ToolResult<string>;
  try {
    result = runTransform(event.data);
  } catch {
    result = err("TRANSFORM_FAILED", "The local transformation could not be completed.");
  }

  workerScope.postMessage({
    type: "result",
    id: event.data.id,
    result: boundedResult(result),
  });
});

function runTransform(request: StructuredTextWorkerRequest): ToolResult<string> {
  switch (request.tool) {
    case "beautify-minify": {
      const res = formatCode(request.source, request.language ?? "auto", request.mode, {
        indent: request.indent,
      });
      return res.ok ? { ok: true, value: res.value.output } : res;
    }
    case "json-to-yaml":
      return jsonToYaml(request.source, request.indent);
    case "yaml-to-json":
      return yamlToJson(request.source, request.indent);
    case "json-to-csv":
      return jsonToCsv(request.source, { escapeFormulae: request.escapeFormulae });
    case "json-to-toml":
      return jsonToToml(request.source);
    case "xml-formatter": {
      const formatted = formatXml(request.source, request.indent);
      return formatted.ok ? { ok: true, value: formatted.value.output } : formatted;
    }
    case "sql-formatter":
      return formatSql(request.source, {
        indent: request.indent,
        keywordCase: request.keywordCase,
      });
  }
}

/** Keep every user-derived wire value within the UI's validated boundary. */
function boundedResult(result: ToolResult<string>): ToolResult<string> {
  if (result.ok) {
    return result.value.length <= STRUCTURED_TEXT_WORKER_MAX_OUTPUT_CHARS
      ? result
      : err("OUTPUT_TOO_LARGE", "The converted result exceeds this tool's output safety limit.");
  }
  return err(
    result.error.code.slice(0, 64) || "TRANSFORM_FAILED",
    result.error.message.slice(0, 320) || "The local transformation could not be completed.",
  );
}
