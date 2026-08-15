import {
  Base64Tool as SharedBase64Tool,
  type Base64ShareState,
} from "@kitland/ui/tools/Base64Tool";
import { useBase64Transform } from "@/hooks/useBase64Transform";
import {
  BASE64_SHARE_URL_MAX_LENGTH,
  createBase64ShareUrl,
  readBase64ShareState,
} from "@/lib/base64-share";
import { capabilitiesForWebTool } from "@/lib/tool-capabilities";
import { useCallback, useMemo } from "react";

/**
 * Web host wrap: shared Base64Tool component plus the Web-only share-link
 * contract and the worker-backed transform engine.
 */
export function Base64Tool() {
  const readState = useCallback((): Base64ShareState | null => {
    return readBase64ShareState(window.location.href);
  }, []);

  const createUrl = useCallback(async (state: Base64ShareState) => {
    const shareUrl = createBase64ShareUrl(
      { mode: state.mode, format: state.format, input: state.input },
      window.location.href,
    );
    if (shareUrl.length > BASE64_SHARE_URL_MAX_LENGTH) {
      throw new Error("Input is too large to share via URL fragment.");
    }
    try {
      window.history.replaceState(null, "", shareUrl);
    } catch {
      // Stale fragment handling
    }
    return shareUrl;
  }, []);

  const share = useMemo(() => ({ readState, createUrl }), [readState, createUrl]);

  return (
    <SharedBase64Tool
      useTransform={useBase64Transform}
      share={share}
      capabilities={capabilitiesForWebTool("base64")}
    />
  );
}
