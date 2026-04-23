import React from "react";
import { DayData, MonthSummary, WeekGrid } from "../dataMapper";
import { VisualSettings } from "../settings";
import { KPISection } from "./KPISection";
import { CalendarGrid } from "./CalendarGrid";

interface Props {
  days: DayData[];
  summary: MonthSummary;
  weeks: WeekGrid;
  settings: VisualSettings;
}

export const CalendarRenderer: React.FC<Props> = ({ days, summary, weeks, settings }) => {
  if (days.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          fontFamily: "Segoe UI, sans-serif",
          color: "#9A9A95",
          fontSize: 13,
        }}
      >
        Sem dados para exibir.
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Segoe UI, sans-serif",
        padding: 12,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {settings.display.showKpiCards && (
        <KPISection summary={summary} settings={settings} />
      )}
      <CalendarGrid weeks={weeks} settings={settings} />
    </div>
  );
};
