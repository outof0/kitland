import { useCallback, useEffect, useRef, useState } from "react";
import { copyText, type CopyTextResult } from "@/lib/clipboard";

export const COPY_CONFIRMATION_MS = 1500;

export type CopyFeedbackOptions = {
  duration?: number;
};

/**
 * Standardized copy-feedback hook across all Kitland tools.
 * Aligns with Base64Tool (golden path):
 * - 900ms confirmation duration
 * - Supports targeted copying (e.g., "input", "output", "share", or item ID)
 * - Cleans up active timers on unmount or on new copy
 */
export function useCopyFeedback(options?: CopyFeedbackOptions) {
  const duration = options?.duration ?? COPY_CONFIRMATION_MS;
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (targetId: string, text: string): Promise<CopyTextResult> => {
      if (!text) return { ok: false, message: "No content to copy" };
      const res = await copyText(text);
      if (res.ok) {
        if (timerRef.current !== undefined) {
          window.clearTimeout(timerRef.current);
        }
        setCopiedTarget(targetId);
        timerRef.current = window.setTimeout(() => {
          setCopiedTarget((current) => (current === targetId ? null : current));
          timerRef.current = undefined;
        }, duration);
      }
      return res;
    },
    [duration],
  );

  const isCopied = useCallback((targetId: string) => copiedTarget === targetId, [copiedTarget]);

  const clearCopy = useCallback(() => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    setCopiedTarget(null);
  }, []);

  return { copiedTarget, isCopied, copy, clearCopy };
}
