import { cva } from "class-variance-authority";

/**
 * Shared Tailwind/CVA recipes for the fixed-dark marketing surface.
 *
 * Keep presentation composition here rather than reintroducing page-specific
 * `kit-*` CSS classes. Layout stays colocated with the caller; interaction and
 * visual variants stay consistent across Astro and React entry points.
 */
export const marketingButton = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out hover:-translate-y-px active:scale-[0.985]",
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

export const marketingLink = "transition-colors hover:text-marketing-foreground";

export const marketingNavLink =
  "relative text-sm font-medium text-marketing-text-secondary transition-colors hover:text-marketing-foreground after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-marketing-primary after:transition-transform hover:after:scale-x-100";

export const marketingCard =
  "rounded-xl border border-marketing-border-card bg-marketing-surface transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-marketing-border-hover hover:shadow-marketing-card";
