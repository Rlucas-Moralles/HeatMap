import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;

export interface ColorScaleSettings {
  minColor: string;
  maxColor: string;
  noMatchColor: string;
  invertScale: boolean;
}

export interface LabelSettings {
  show: boolean;
  fontSize: number;
  fontColor: string;
  format: "integer" | "decimal" | "auto";
}

export interface LegendSettings {
  show: boolean;
  position: "bottom" | "top" | "right";
  title: string;
}

export interface MapAppearanceSettings {
  heatOpacity: number;
  noMatchOpacity: number;
  showBorders: boolean;
}

export interface TracadoSettings {
  show: boolean;
  color: string;
  width: number;
}

export interface VisualSettings {
  svgContent: string;
  colorScale: ColorScaleSettings;
  labels: LabelSettings;
  legend: LegendSettings;
  mapAppearance: MapAppearanceSettings;
  tracado: TracadoSettings;
}

function getColor(objects: powerbi.DataViewObjects | undefined, objectName: string, propertyName: string, defaultValue: string): string {
  const obj = objects?.[objectName]?.[propertyName] as { solid?: { color?: string } } | undefined;
  return obj?.solid?.color ?? defaultValue;
}

function getValue<T>(objects: powerbi.DataViewObjects | undefined, objectName: string, propertyName: string, defaultValue: T): T {
  const obj = objects?.[objectName]?.[propertyName];
  return obj !== undefined && obj !== null ? (obj as T) : defaultValue;
}

export function parseSettings(dataView: DataView): VisualSettings {
  const objects = dataView.metadata?.objects;

  return {
    svgContent: getValue<string>(objects, "mapSettings", "svgContent", ""),
    colorScale: {
      minColor: getColor(objects, "colorScale", "minColor", "#ffffcc"),
      maxColor: getColor(objects, "colorScale", "maxColor", "#c00000"),
      noMatchColor: getColor(objects, "colorScale", "noMatchColor", "#cccccc"),
      invertScale: getValue<boolean>(objects, "colorScale", "invertScale", false),
    },
    labels: {
      show: getValue<boolean>(objects, "visual", "show", true),
      fontSize: getValue<number>(objects, "visual", "fontSize", 10),
      fontColor: getColor(objects, "visual", "fontColor", "#000000"),
      format: getValue<"integer" | "decimal" | "auto">(objects, "visual", "format", "integer"),
    },
    legend: {
      show: getValue<boolean>(objects, "legend", "show", true),
      position: getValue<"bottom" | "top" | "right">(objects, "legend", "position", "bottom"),
      title: getValue<string>(objects, "legend", "title", ""),
    },
    mapAppearance: {
      heatOpacity: getValue<number>(objects, "mapAppearance", "heatOpacity", 85),
      noMatchOpacity: getValue<number>(objects, "mapAppearance", "noMatchOpacity", 20),
      showBorders: getValue<boolean>(objects, "mapAppearance", "showBorders", true),
    },
    tracado: {
      show: getValue<boolean>(objects, "tracado", "show", true),
      color: getColor(objects, "tracado", "color", "#888888"),
      width: getValue<number>(objects, "tracado", "width", 1),
    },
  };
}
