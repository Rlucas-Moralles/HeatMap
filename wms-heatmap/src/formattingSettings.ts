import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

class ColorScaleCard extends formattingSettings.SimpleCard {
  name = "colorScale";
  displayName = "Escala de Cor";

  minColor = new formattingSettings.ColorPicker({
    name: "minColor",
    displayName: "Cor mínima",
    value: { value: "#ffffcc" },
  });
  maxColor = new formattingSettings.ColorPicker({
    name: "maxColor",
    displayName: "Cor máxima",
    value: { value: "#c00000" },
  });
  noMatchColor = new formattingSettings.ColorPicker({
    name: "noMatchColor",
    displayName: "Cor sem match",
    value: { value: "#cccccc" },
  });
  invertScale = new formattingSettings.ToggleSwitch({
    name: "invertScale",
    displayName: "Inverter escala",
    value: false,
  });

  slices = [this.minColor, this.maxColor, this.noMatchColor, this.invertScale];
}

class VisualCard extends formattingSettings.SimpleCard {
  name = "visual";
  displayName = "Visual";

  show = new formattingSettings.ToggleSwitch({
    name: "show",
    displayName: "Mostrar rótulos",
    value: true,
  });
  fontSize = new formattingSettings.NumUpDown({
    name: "fontSize",
    displayName: "Tamanho da fonte",
    value: 10,
  });
  fontColor = new formattingSettings.ColorPicker({
    name: "fontColor",
    displayName: "Cor da fonte",
    value: { value: "#000000" },
  });
  format = new formattingSettings.ItemDropdown({
    name: "format",
    displayName: "Formato numérico",
    value: { value: "integer", displayName: "Inteiro" },
    items: [
      { value: "integer", displayName: "Inteiro" },
      { value: "decimal", displayName: "Decimal" },
      { value: "auto", displayName: "Automático" },
    ],
  });

  slices = [this.show, this.fontSize, this.fontColor, this.format];
}

class TracadoCard extends formattingSettings.SimpleCard {
  name = "tracado";
  displayName = "Traçado";

  show = new formattingSettings.ToggleSwitch({
    name: "show",
    displayName: "Mostrar traçado",
    value: true,
  });
  color = new formattingSettings.ColorPicker({
    name: "color",
    displayName: "Cor do traçado",
    value: { value: "#888888" },
  });
  width = new formattingSettings.NumUpDown({
    name: "width",
    displayName: "Espessura (px)",
    value: 1,
  });

  slices = [this.show, this.color, this.width];
}

class LegendCard extends formattingSettings.SimpleCard {
  name = "legend";
  displayName = "Legenda";

  show = new formattingSettings.ToggleSwitch({
    name: "show",
    displayName: "Mostrar legenda",
    value: true,
  });
  position = new formattingSettings.ItemDropdown({
    name: "position",
    displayName: "Posição",
    value: { value: "bottom", displayName: "Inferior" },
    items: [
      { value: "bottom", displayName: "Inferior" },
      { value: "top", displayName: "Superior" },
      { value: "right", displayName: "Direita" },
    ],
  });

  slices = [this.show, this.position];
}

class MapAppearanceCard extends formattingSettings.SimpleCard {
  name = "mapAppearance";
  displayName = "Aparência do Mapa";

  heatOpacity = new formattingSettings.NumUpDown({
    name: "heatOpacity",
    displayName: "Intensidade do calor (%)",
    value: 85,
  });
  noMatchOpacity = new formattingSettings.NumUpDown({
    name: "noMatchOpacity",
    displayName: "Opacidade sem dado (%)",
    value: 20,
  });

  slices = [this.heatOpacity, this.noMatchOpacity];
}

export class WmsFormattingSettingsModel extends formattingSettings.Model {
  colorScaleCard = new ColorScaleCard();
  visualCard = new VisualCard();
  tracadoCard = new TracadoCard();
  legendCard = new LegendCard();
  mapAppearanceCard = new MapAppearanceCard();

  cards = [
    this.colorScaleCard,
    this.visualCard,
    this.tracadoCard,
    this.legendCard,
    this.mapAppearanceCard,
  ];
}
