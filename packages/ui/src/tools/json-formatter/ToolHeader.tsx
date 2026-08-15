import { Braces, Check, FileInput, Share2 } from "lucide-react";

/** Standardized header for JSON Formatter matching design.pen and all tools */
export function ToolHeader({
  onSample,
  shareDisabled,
  onShare,
  isShared,
  showShare = true,
  shareDisclosure,
}: {
  onSample: () => void;
  shareDisabled?: boolean | undefined;
  onShare?: (() => void) | undefined;
  isShared?: boolean | undefined;
  showShare?: boolean | undefined;
  shareDisclosure?: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-1 pb-1 min-w-0 max-w-full">
      <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            className="size-9 sm:size-11 bg-primary-soft border border-primary/30 rounded-[9px] sm:rounded-[11px] text-primary flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <Braces className="size-4.5 sm:size-[22px]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-[20px] font-bold font-display text-on-surface tracking-tight m-0 truncate">
              JSON Formatter
            </h2>
            <p className="text-[13px] text-on-muted m-0 mt-0.5 max-sm:hidden">
              Format, validate, minify and convert JSON — entirely in your browser
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onSample}
            className="h-8 sm:h-[34px] px-2 sm:px-3 bg-surface-low border border-outline rounded-lg text-xs sm:text-[13px] font-semibold text-on-surface hover:bg-surface hover:border-outline-strong transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer"
          >
            <FileInput className="size-3.5 sm:size-[15px] text-on-muted" aria-hidden="true" />
            <span>Sample</span>
          </button>
          {showShare && onShare && (
            <button
              type="button"
              onClick={onShare}
              disabled={shareDisabled}
              aria-label={isShared ? "Link copied" : "Share input link"}
              title={
                isShared
                  ? "Link copied"
                  : !shareDisabled
                    ? "Share input link (includes current input, do not share secrets)"
                    : "Enter input before creating a share link"
              }
              className={`h-8 sm:h-[34px] px-2 sm:px-3 rounded-lg text-xs sm:text-[13px] font-semibold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isShared
                  ? "border border-success/40 bg-success-soft text-success shadow-none"
                  : "border border-outline-strong bg-surface-low text-on-muted hover:text-on-surface hover:bg-surface"
              }`}
            >
              {isShared ? (
                <Check className="size-3.5 sm:size-[15px] text-success" aria-hidden="true" />
              ) : (
                <Share2 className="size-3.5 sm:size-[15px]" aria-hidden="true" />
              )}
              <span>Share</span>
            </button>
          )}
        </div>
      </div>
      {showShare && shareDisclosure && (
        <p className="max-w-[340px] text-left sm:text-right sm:self-end text-[11px] leading-snug text-on-faint m-0 mt-0.5">
          {shareDisclosure}
        </p>
      )}
    </div>
  );
}
