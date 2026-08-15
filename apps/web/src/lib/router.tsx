import type { AnchorHTMLAttributes, ReactNode } from "react";

export function Link({
  to,
  children,
  className,
  onClick,
  ...rest
}: {
  to: string;
  children: ReactNode;
  className?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <a href={to} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}
