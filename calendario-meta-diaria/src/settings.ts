export interface VisualSettings {
  thresholds: {
    thresholdOk: number;
    thresholdWarn: number;
  };
  colors: {
    colorOk: string;
    colorWarn: string;
    colorBad: string;
  };
  typography: {
    valueFontSize: number;
    cellFontSize: number;
  };
  display: {
    showKpiCards: boolean;
    showBorders: boolean;
    highlightToday: boolean;
  };
}
