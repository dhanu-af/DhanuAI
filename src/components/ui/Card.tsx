import { HTMLAttributes } from "react";

const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
} as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof PADDING;
}

export function Card({ padding = "md", className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-white/[0.08] bg-white/[0.04] ${PADDING[padding]} ${className}`}
      {...props}
    />
  );
}
