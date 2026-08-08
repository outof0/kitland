import lockupPrimary from "@/assets/lockup-primary.svg";
import lockupReverse from "@/assets/lockup-reverse.svg";

type LogoProps = {
  variant?: "primary" | "reverse";
  className?: string;
};

export function Logo({ variant = "primary", className = "" }: LogoProps) {
  const src = variant === "reverse" ? lockupReverse : lockupPrimary;
  return (
    <img
      src={src}
      alt="Kitland"
      width={128}
      height={40}
      className={`h-10 w-auto ${className}`}
    />
  );
}
