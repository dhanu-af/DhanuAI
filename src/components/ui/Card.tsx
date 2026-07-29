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
      className={`card-shadow rounded-xl border border-border bg-surface ${PADDING[padding]} ${className}`}
      {...props}
    />
  );
}
