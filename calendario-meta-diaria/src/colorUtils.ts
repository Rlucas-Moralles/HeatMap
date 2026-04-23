export function getCellBg(pct: number | null, thresholdOk: number, thresholdWarn: number): string {
  if (pct === null) return "#FFFFFF";
  if (pct >= thresholdOk / 100) return "#F0FDF4";
  if (pct >= thresholdWarn / 100) return "#FFFBEB";
  return "#FEF2F2";
}

export function getChipColor(pct: number | null, thresholdOk: number, thresholdWarn: number): string {
  if (pct === null) return "#9A9A95";
  if (pct >= thresholdOk / 100) return "#16A34A";
  if (pct >= thresholdWarn / 100) return "#D97706";
  return "#DC2626";
}

export function getKpiBg(pct: number | null, thresholdOk: number, thresholdWarn: number): string {
  if (pct === null) return "#FAFAF9";
  if (pct >= thresholdOk / 100) return "#16A34A";
  if (pct >= thresholdWarn / 100) return "#D97706";
  return "#DC2626";
}

export function formatValue(value: number): string {
  if (value >= 1000) {
    return "R$ " + (value / 1000).toFixed(1).replace(".", ",") + "k";
  }
  return "R$ " + Math.round(value).toString();
}

export function formatGap(gap: number): string {
  const abs = Math.abs(gap);
  const formatted =
    abs >= 1000
      ? (abs / 1000).toFixed(1).replace(".", ",") + "k"
      : Math.round(abs).toString();
  return (gap >= 0 ? "+" : "-") + formatted;
}
