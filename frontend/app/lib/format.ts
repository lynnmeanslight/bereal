export function formatCompact(value: string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 4,
  }).format(num);
}
