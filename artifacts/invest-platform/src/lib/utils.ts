import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number | undefined | null): string {
  if (value == null) return "0";
  return value.toLocaleString("en-KE");
}

export function formatKSH(value: number | undefined | null): string {
  if (value == null) return "KSH 0";
  return `KSH ${value.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number | undefined | null): string {
  if (value == null) return "0%";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}
