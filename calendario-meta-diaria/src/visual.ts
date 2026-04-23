import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { CalendarioFormattingSettingsModel } from "./formattingSettings";
import { VisualSettings } from "./settings";
import { DataMapper } from "./dataMapper";
import { CalendarRenderer } from "./components/CalendarRenderer";

import React from "react";
import ReactDOM from "react-dom";
import "./../style/visual.less";

export class Visual implements IVisual {
  private host: powerbi.extensibility.visual.IVisualHost;
  private container: HTMLElement;
  private formattingSettingsService: FormattingSettingsService;
  private formattingSettings: CalendarioFormattingSettingsModel;
  private dataMapper: DataMapper;

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.container = options.element;
    this.container.className = "calendario-meta";
    this.formattingSettingsService = new FormattingSettingsService();
    this.formattingSettings = new CalendarioFormattingSettingsModel();
    this.dataMapper = new DataMapper();
  }

  public update(options: VisualUpdateOptions): void {
    const dataView = options.dataViews?.[0];

    if (!dataView) {
      ReactDOM.render(
        React.createElement("div", { className: "cal-error" }, "Conecte os campos de dados."),
        this.container
      );
      return;
    }

    this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
      CalendarioFormattingSettingsModel,
      dataView
    );

    const settings = this.buildSettings();
    const { days, summary, weeks } = this.dataMapper.process(dataView);

    ReactDOM.render(
      React.createElement(CalendarRenderer, { days, summary, weeks, settings }),
      this.container
    );
  }

  public getFormattingModel(): powerbi.visuals.FormattingModel {
    return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
  }

  private buildSettings(): VisualSettings {
    const fs = this.formattingSettings;
    return {
      thresholds: {
        thresholdOk: fs.thresholdsCard.thresholdOk.value,
        thresholdWarn: fs.thresholdsCard.thresholdWarn.value,
      },
      colors: {
        colorOk: fs.colorsCard.colorOk.value.value,
        colorWarn: fs.colorsCard.colorWarn.value.value,
        colorBad: fs.colorsCard.colorBad.value.value,
      },
      typography: {
        valueFontSize: fs.typographyCard.valueFontSize.value,
        cellFontSize: fs.typographyCard.cellFontSize.value,
      },
      display: {
        showKpiCards: fs.displayCard.showKpiCards.value,
        showBorders: fs.displayCard.showBorders.value,
        highlightToday: fs.displayCard.highlightToday.value,
      },
    };
  }
}
