import React from "react";
import { WeekGrid } from "../dataMapper";
import { VisualSettings } from "../settings";
import { CalendarCell } from "./CalendarCell";

interface Props {
  weeks: WeekGrid;
  settings: VisualSettings;
}

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export const CalendarGrid: React.FC<Props> = ({ weeks, settings }) => {
  const headerCellStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: "#6B6B68",
    textTransform: "uppercase",
    textAlign: "center",
    padding: "6px 0",
    fontFamily: "Segoe UI, sans-serif",
    borderBottom: "1px solid #555555",
    letterSpacing: "0.04em",
  };

  const emptyCellStyle: React.CSSProperties = {
    backgroundColor: "#3A3A3A",
    border: settings.display.showBorders ? "1px solid #555555" : "none",
    minHeight: 128,
    verticalAlign: "top",
  };

  return (
    <div
      style={{
        flex: 1,
        overflow: "hidden",
        borderRadius: 10,
        border: "1px solid #555555",
      }}
    >
      <table
        style={{
          width: "100%",
          height: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr>
            {WEEKDAYS.map((wd) => (
              <th key={wd} style={headerCellStyle}>
                {wd}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) =>
                day ? (
                  <CalendarCell key={di} day={day} settings={settings} />
                ) : (
                  <td key={di} style={emptyCellStyle} />
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
