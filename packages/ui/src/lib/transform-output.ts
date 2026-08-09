/**
 * Authoritative output resolution for live local transforms.
 *
 * Derived panes must never show a previous success while input/options are
 * processing, invalid, empty, or over limit.
 */

export type TransformResultLike =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly error: { readonly code: string; readonly message: string } };

export type TransformOutputDecision = {
  readonly output: string;
  readonly isAuthoritative: boolean;
  readonly reason: "empty" | "processing" | "error" | "success";
};

export function resolveLiveTransformOutput(
  source: string,
  isProcessing: boolean,
  result: TransformResultLike,
  options: { readonly treatWhitespaceAsEmpty?: boolean } = {},
): TransformOutputDecision {
  const hasInput = options.treatWhitespaceAsEmpty ? source.trim().length > 0 : source.length > 0;
  if (!hasInput) {
    return { output: "", isAuthoritative: true, reason: "empty" };
  }
  if (isProcessing) {
    return { output: "", isAuthoritative: false, reason: "processing" };
  }
  if (!result.ok) {
    return { output: "", isAuthoritative: true, reason: "error" };
  }
  return { output: result.value, isAuthoritative: true, reason: "success" };
}
