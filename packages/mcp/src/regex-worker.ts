import { testRegex, type RegexTestResult, type ToolResult } from "@kitland/core";
import { parentPort, workerData } from "node:worker_threads";

type RegexWorkerData = {
  readonly pattern: string;
  readonly input: string;
  readonly flags: string;
};

const port = parentPort;
if (!port) {
  throw new Error("Regex worker requires a parent message port.");
}

const { pattern, input, flags } = workerData as RegexWorkerData;
const result: ToolResult<RegexTestResult> = testRegex(pattern, input, { flags });
port.postMessage(result);
