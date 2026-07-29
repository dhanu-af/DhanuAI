import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary: "bg-zinc-100 text-zinc-900 hover:bg-white",
  secondary: "border border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]",
  ghost: "border border-transparent text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100",
  danger: "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/15",
  success: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15",
};

const SIZE: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-3.5 py-2 text-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...props}
    />
  );
});
