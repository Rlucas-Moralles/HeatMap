import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { WmsFormattingSettingsModel } from "./formattingSettings";
import { parseSettings } from "./settings";
import { VisualSettings } from "./settings";
import { DataMapper } from "./dataMapper";
import { ColorScale } from "./colorScale";
import { MapLoader } from "./mapLoader";
import { SvgRenderer } from "./svgRenderer";
import { TooltipHandler } from "./tooltipHandler";
import { LegendRenderer } from "./legendRenderer";

import "./../style/visual.less";

export class Visual implements IVisual {
  private host: powerbi.extensibility.visual.IVisualHost;
  private container: HTMLElement;
  private selectionManager: powerbi.extensibility.ISelectionManager;

  private formattingSettingsService: FormattingSettingsService;
  private formattingSettings: WmsFormattingSettingsModel;

  private dataMapper: DataMapper;
  private mapLoader: MapLoader;
  private svgRenderer: SvgRenderer;
  private tooltipHandler: TooltipHandler;
  private legendRenderer: LegendRenderer;

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.container = options.element;
    this.container.className = "wms-heatmap";
    this.selectionManager = this.host.createSelectionManager();

    this.formattingSettingsService = new FormattingSettingsService();
    this.formattingSettings = new WmsFormattingSettingsModel();

    this.dataMapper = new DataMapper();
    this.mapLoader = new MapLoader(this.host);
    this.svgRenderer = new SvgRenderer();
    this.tooltipHandler = new TooltipHandler(this.host.tooltipService);
    this.legendRenderer = new LegendRenderer();
  }

  public update(options: VisualUpdateOptions): void {
    const dataView = options.dataViews?.[0];
    if (!dataView) {
      // eslint-disable-next-line powerbi-visuals/no-inner-outer-html
      this.container.innerHTML = '<div class="wms-error">Conecte os campos de dados.</div>';
      return;
    }

    this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
      WmsFormattingSettingsModel,
      dataView
    );

    const settings = this.buildSettings(dataView);

    if (!settings.svgContent) {
      this.mapLoader.render(this.container);
      return;
    }

    const { dataMap, tooltipMap, min, max } = this.dataMapper.process(dataView);
    const colorScale = new ColorScale(
      min,
      max,
      settings.colorScale.minColor,
      settings.colorScale.maxColor,
      settings.colorScale.invertScale
    );

    // eslint-disable-next-line powerbi-visuals/no-inner-outer-html
    this.container.innerHTML = "";

    const legendContainer = document.createElement("div");
    legendContainer.className = "legend-container";

    const mapContainer = document.createElement("div");
    mapContainer.className = "map-container";

    if (settings.legend.position === "top") {
      this.container.appendChild(legendContainer);
      this.container.appendChild(mapContainer);
    } else if (settings.legend.position === "right") {
      const row = document.createElement("div");
      row.className = "wms-row";
      row.appendChild(mapContainer);
      row.appendChild(legendContainer);
      this.container.appendChild(row);
    } else {
      this.container.appendChild(mapContainer);
      this.container.appendChild(legendContainer);
    }

    const shapes = this.svgRenderer.render(
      mapContainer,
      settings.svgContent,
      dataMap,
      colorScale,
      settings
    );

    this.tooltipHandler.bind(shapes, tooltipMap);
    this.legendRenderer.render(legendContainer, min, max, settings.colorScale, settings.legend);

    shapes.forEach(({ element, id }) => {
      const index = this.getIndexForId(dataView, id);
      if (index < 0) return;

      const identity = this.host.createSelectionIdBuilder()
        .withCategory(dataView.categorical!.categories[0], index)
        .createSelectionId();

      element.style.cursor = "pointer";
      element.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        this.selectionManager.select(identity, e.ctrlKey);
      });
    });

    this.container.addEventListener("click", () => {
      this.selectionManager.clear();
    });
  }

  public getFormattingModel(): powerbi.visuals.FormattingModel {
    return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
  }

  private buildSettings(dataView: powerbi.DataView): VisualSettings {
    const base = parseSettings(dataView);
    const fs = this.formattingSettings;
    return {
      svgContent: base.svgContent,
      colorScale: {
        minColor: fs.colorScaleCard.minColor.value.value,
        maxColor: fs.colorScaleCard.maxColor.value.value,
        noMatchColor: fs.colorScaleCard.noMatchColor.value.value,
        invertScale: fs.colorScaleCard.invertScale.value,
      },
      labels: {
        show: fs.visualCard.show.value,
        fontSize: fs.visualCard.fontSize.value,
        fontColor: fs.visualCard.fontColor.value.value,
        format: fs.visualCard.format.value.value as "integer" | "decimal" | "auto",
      },
      legend: {
        show: fs.legendCard.show.value,
        position: fs.legendCard.position.value.value as "bottom" | "top" | "right",
        title: "",
      },
      mapAppearance: {
        heatOpacity: fs.mapAppearanceCard.heatOpacity.value,
        noMatchOpacity: fs.mapAppearanceCard.noMatchOpacity.value,
        showBorders: fs.tracadoCard.show.value,
      },
      tracado: {
        show: fs.tracadoCard.show.value,
        color: fs.tracadoCard.color.value.value,
        width: fs.tracadoCard.width.value,
      },
    };
  }

  private getIndexForId(dataView: powerbi.DataView, id: string): number {
    const cats = dataView.categorical?.categories?.[0]?.values ?? [];
    return cats.findIndex((v) => String(v) === id);
  }
}
