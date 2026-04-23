import React from "react";
import { DayData } from "../dataMapper";
import { VisualSettings } from "../settings";
import { getCellBg, getChipColor, formatValue, formatGap } from "../colorUtils";

interface Props {
  day: DayData;
  settings: VisualSettings;
}

export const CalendarCell: React.FC<Props> = ({ day, settings }) => {
  const { thresholds, typography, display } = settings;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = display.highlightToday && day.date.getTime() === today.getTime();

  const bg = getCellBg(day.pct, thresholds.thresholdOk, thresholds.thresholdWarn);
  const chipColor = getChipColor(day.pct, thresholds.thresholdOk, thresholds.thresholdWarn);
  const gapColor = day.gap !== null && day.gap >= 0 ? "#16A34A" : "#DC2626";

  const cellStyle: React.CSSProperties = {
    backgroundColor: bg,
    border: isToday
      ? "2px solid #1A1A1A"
      : display.showBorders
      ? "1px solid #555555"
      : "1px solid #ECECEA",
    padding: "12px 14px 14px",
    minHeight: 128,
    display: "flex",
    flexDirection: "column",
    fontFamily: "Segoe UI, sans-serif",
    boxSizing: "border-box",
    verticalAlign: "top",
  };

  const dayNumStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: "#1A1A1A",
    lineHeight: 1,
  };

  if (day.isPending) {
    return (
      <td style={cellStyle}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={dayNumStyle}>{day.day}</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, marginTop: 8 }}>
          <span style={{ fontSize: typography.cellFontSize, color: "#9A9A95", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            PENDENTE
          </span>
          {day.objetivo !== null && (
            <span style={{ fontSize: typography.cellFontSize, color: "#9A9A95" }}>
              obj {formatValue(day.objetivo)}
            </span>
          )}
        </div>
      </td>
    );
  }

  if (day.faturado === null) {
    return (
      <td style={cellStyle}>
        <span style={dayNumStyle}>{day.day}</span>
        <div style={{ flex: 1, display: "flex", alignItems: "center", marginTop: 8 }}>
          <span style={{ color: "#9A9A95", fontSize: 18 }}>—</span>
        </div>
      </td>
    );
  }

  return (
    <td style={cellStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={dayNumStyle}>{day.day}</span>
        {day.pct !== null && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: chipColor,
              border: `1px solid ${chipColor}`,
              borderRadius: 999,
              padding: "1px 7px",
              lineHeight: 1.4,
            }}
          >
            {Math.round(day.pct * 100)}%
          </span>
        )}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: typography.valueFontSize, fontWeight: 600, color: "#1A1A1A", lineHeight: 1 }}>
          {formatValue(day.faturado)}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6 }}>
        <span style={{ fontSize: typography.cellFontSize, fontWeight: 500, color: "#6B6B68" }}>
          obj {day.objetivo !== null ? formatValue(day.objetivo) : "—"}
        </span>
        {day.gap !== null && (
          <span style={{ fontSize: typography.cellFontSize, fontWeight: 600, color: gapColor }}>
            {formatGap(day.gap)}
          </span>
        )}
      </div>
    </td>
  );
};
