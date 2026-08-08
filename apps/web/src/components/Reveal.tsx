import { useReveal } from "@/hooks/useReveal";
import type { ElementType, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  variant?: "up" | "scale";
  as?: ElementType;
};

export function Reveal({
  children,
  className = "",
  delay,
  variant = "up",
  as: Tag = "div",
}: RevealProps) {
  const ref = useReveal<HTMLElement>();
  const base = variant === "scale" ? "kit-reveal-scale" : "kit-reveal";

  return (
    <Tag
      ref={ref}
      className={`${base} ${className}`.trim()}
      data-delay={delay != null ? String(delay) : undefined}
    >
      {children}
    </Tag>
  );
}
