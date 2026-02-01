"use client";

import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  label: string;
  onClick: () => void;
  size?: "sm" | "md";
  className?: string;
};

export function BackButton({
  label,
  onClick,
  size = "md",
  className = "",
}: BackButtonProps) {
  const sizeClasses =
    size === "sm"
      ? "px-3 py-1.5 text-xs"
      : "px-4 py-2 text-sm";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border border-(--bereal-border) bg-(--bereal-surface) ${sizeClasses} font-semibold text-(--bereal-text-secondary) transition-all hover:border-(--bereal-primary)/40 hover:bg-(--bereal-bg) hover:text-(--bereal-text-primary) ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
