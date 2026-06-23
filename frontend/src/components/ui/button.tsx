import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "panel";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-aqaar-lime disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-aqaar-lime text-aqaar-dark hover:bg-[#e7f23d]",
        variant === "ghost" && "border border-aqaar-line text-white hover:bg-white/10",
        variant === "panel" && "bg-white/[0.08] text-white hover:bg-white/[0.12]",
        className,
      )}
      {...props}
    />
  );
}
