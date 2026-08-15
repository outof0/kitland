import { Base64Tool } from "@kitland/ui/tools/Base64Tool";
import type { ToolComponentProps } from "../toolRegistry";

/**
 * VSCode wrapper for Base64Tool. Uses the default synchronous core transform
 * (no worker, no share link, no file open/save). The webview CSP allows
 * in-process crypto; base64 is lightweight enough to run synchronously.
 */
export default function Base64Wrapper({ initialInput }: ToolComponentProps) {
  return (
    <Base64Tool
      capabilities={{ fileOpen: false, fileSave: false }}
      {...(initialInput !== undefined ? { initialInput } : {})}
    />
  );
}
