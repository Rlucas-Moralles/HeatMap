import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

class ThresholdsCard extends formattingSettings.SimpleCard {
  name = "thresholds";
  displayName = "Thresholds";

  thresholdOk = new formattingSettings.NumUpDown({
    name: "thresholdOk",
    displayName: "% Bom (≥)",
    value: 100,
  });
  thresholdWarn = new formattingSettings.NumUpDown({
    name: "thresholdWarn",
    displayName: "% Alerta (≥)",
    value: 90,
  });

  slices = [this.thresholdOk, this.thresholdWarn];
}

class ColorsCard extends formattingSettings.SimpleCard {
  name = "colors";
  displayName = "Cores";

  colorOk = new formattingSettings.ColorPicker({
    name: "colorOk",
    displayName: "Cor OK",
    value: { value: "#16A34A" },
  });
  colorWarn = new formattingSettings.ColorPicker({
    name: "colorWarn",
    displayName: "Cor Alerta",
    value: { value: "#D97706" },
  });
  colorBad = new formattingSettings.ColorPicker({
    name: "colorBad",
    displayName: "Cor Ruim",
    value: { value: "#DC2626" },
  });

  slices = [this.colorOk, this.colorWarn, this.colorBad];
}

class TypographyCard extends formattingSettings.SimpleCard {
  name = "typography";
  displayName = "Tipografia";

  valueFontSize = new formattingSettings.NumUpDown({
    name: "valueFontSize",
    displayName: "Tamanho valor (px)",
    value: 30,
  });
  cellFontSize = new formattingSettings.NumUpDown({
    name: "cellFontSize",
    displayName: "Tamanho célula (px)",
    value: 11,
  });

  slices = [this.valueFontSize, this.cellFontSize];
}

class DisplayCard extends formattingSettings.SimpleCard {
  name = "display";
  displayName = "Exibição";

  showKpiCards = new formattingSettings.ToggleSwitch({
    name: "showKpiCards",
    displayName: "Mostrar KPI cards",
    value: true,
  });
  showBorders = new formattingSettings.ToggleSwitch({
    name: "showBorders",
    displayName: "Mostrar bordas",
    value: true,
  });
  highlightToday = new formattingSettings.ToggleSwitch({
    name: "highlightToday",
    displayName: "Destacar hoje",
    value: true,
  });

  slices = [this.showKpiCards, this.showBorders, this.highlightToday];
}

export class CalendarioFormattingSettingsModel extends formattingSettings.Model {
  thresholdsCard = new ThresholdsCard();
  colorsCard = new ColorsCard();
  typographyCard = new TypographyCard();
  displayCard = new DisplayCard();

  cards = [this.thresholdsCard, this.colorsCard, this.typographyCard, this.displayCard];
}
