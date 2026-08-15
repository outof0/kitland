import { JsonFormatterTool as SharedJsonFormatterTool } from "@kitland/ui/tools/JsonFormatterTool";
import { useJsonFormatter } from "@/hooks/useJsonFormatter";
import {
  createJsonShareUrl,
  isJsonShareHash,
  JSON_SHARE_URL_MAX_LENGTH,
  readJsonShareState,
} from "@/lib/json-share";
import { capabilitiesForWebTool } from "@/lib/tool-capabilities";
import { useCallback, useMemo } from "react";

export function JsonFormatterTool() {
  const handleCreateUrl = useCallback(async (state: { input: string }) => {
    const shareUrl = createJsonShareUrl(state, window.location.href);
    if (shareUrl.length > JSON_SHARE_URL_MAX_LENGTH) {
      throw new Error("Input is too large to share via URL fragment.");
    }
    try {
      window.history.replaceState(window.history.state, "", shareUrl);
    } catch {
      // Stale fragment handling
    }
    return shareUrl;
  }, []);

  const handleReadState = useCallback(() => {
    if (typeof window === "undefined" || !isJsonShareHash(window.location.hash)) return null;
    return readJsonShareState(window.location.href);
  }, []);

  const share = useMemo(
    () => ({
      readState: handleReadState,
      createUrl: handleCreateUrl,
    }),
    [handleReadState, handleCreateUrl],
  );

  return (
    <SharedJsonFormatterTool
      useFormatter={useJsonFormatter}
      share={share}
      capabilities={{ ...capabilitiesForWebTool("json-formatter"), print: true }}
    />
  );
}
