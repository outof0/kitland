import { cva } from "class-variance-authority";

/**
 * Shared Tailwind/CVA recipes for the fixed-dark marketing surface.
 *
 * Keep presentation composition here rather than reintroducing page-specific
 * `kit-*` CSS classes. Layout stays colocated with the caller; interaction and
 * visual variants stay consistent across Astro and React entry points.
 */
export const marketingButton = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md font-semibold transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marketing-primary-light motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.985]",
  {
    variants: {
      tone: {
        primary:
          "bg-marketing-primary text-white shadow-marketing-primary hover:bg-marketing-primary-hover hover:shadow-marketing-primary-hover",
        secondary:
          "border border-marketing-border-strong bg-marketing-surface text-marketing-foreground hover:border-marketing-border-hover",
      },
      size: {
        compact: "h-10 px-4 text-sm",
        default: "h-[52px] px-6 text-[15px]",
        large: "h-14 px-7 text-base",
      },
    },
    defaultVariants: {
      tone: "secondary",
      size: "default",
    },
  },
);

export const marketingLink =
  "rounded-sm transition-colors hover:text-marketing-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marketing-primary-light";

export const marketingNavLink =
  "relative rounded-sm text-sm font-medium text-marketing-text-secondary transition-colors hover:text-marketing-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marketing-primary-light after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-marketing-primary after:transition-transform motion-safe:hover:after:scale-x-100";

export const marketingCard =
  "rounded-xl border border-marketing-border-card bg-marketing-surface transition-[transform,box-shadow,border-color] duration-200 ease-out hover:border-marketing-border-hover hover:shadow-marketing-card motion-safe:hover:-translate-y-1";
