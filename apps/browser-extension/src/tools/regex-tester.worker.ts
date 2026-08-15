import { err, testRegex } from "@kitland/core";
import {
  isRegexTesterWorkerRequest,
  type RegexTesterWorkerResponse,
} from "./regex-tester.worker-protocol";

globalThis.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (!isRegexTesterWorkerRequest(event.data)) return;
  const { id, pattern, input, flags } = event.data;
  let result;
  try {
    result = testRegex(pattern, input, { flags });
  } catch {
    result = err("REGEX_TEST_FAILED", "The regular expression could not be evaluated.");
  }
  const response: RegexTesterWorkerResponse = { type: "result", id, result };
  (
    globalThis as unknown as { postMessage(message: RegexTesterWorkerResponse): void }
  ).postMessage(response);
});
