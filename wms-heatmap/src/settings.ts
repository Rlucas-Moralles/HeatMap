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
  noMatchOpacity: number;
  showBorders: boolean;
  borderColor: string;
}

export interface VisualSettings {
  svgContent: string;
  colorScale: ColorScaleSettings;
  labels: LabelSettings;
  legend: LegendSettings;
  mapAppearance: MapAppearanceSettings;
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
      minColor: getColor(objects, "colorScale", "minColor", "#d4e9ff"),
      maxColor: getColor(objects, "colorScale", "maxColor", "#c00000"),
      noMatchColor: getColor(objects, "colorScale", "noMatchColor", "#cccccc"),
      invertScale: getValue<boolean>(objects, "colorScale", "invertScale", false),
    },
    labels: {
      show: getValue<boolean>(objects, "labels", "show", true),
      fontSize: getValue<number>(objects, "labels", "fontSize", 10),
      fontColor: getColor(objects, "labels", "fontColor", "#ffffff"),
      format: getValue<"integer" | "decimal" | "auto">(objects, "labels", "format", "integer"),
    },
    legend: {
      show: getValue<boolean>(objects, "legend", "show", true),
      position: getValue<"bottom" | "top" | "right">(objects, "legend", "position", "bottom"),
      title: getValue<string>(objects, "legend", "title", ""),
    },
    mapAppearance: {
      noMatchOpacity: getValue<number>(objects, "mapAppearance", "noMatchOpacity", 30),
      showBorders: getValue<boolean>(objects, "mapAppearance", "showBorders", true),
      borderColor: getColor(objects, "mapAppearance", "borderColor", "#ffffff"),
    },
  };
}
