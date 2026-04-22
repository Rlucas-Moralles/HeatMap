import powerbi from "powerbi-visuals-api";
import { RenderedShape } from "./svgRenderer";
import { TooltipItem } from "./dataMapper";

export class TooltipHandler {
  private tooltipService: powerbi.extensibility.ITooltipService;

  constructor(tooltipService: powerbi.extensibility.ITooltipService) {
    this.tooltipService = tooltipService;
  }

  bind(
    shapes: RenderedShape[],
    tooltipMap: Map<string, TooltipItem[]>
  ): void {
    shapes.forEach(({ element, id, value }) => {
      const extras = tooltipMap.get(id) ?? [];

      const tooltipData: powerbi.extensibility.VisualTooltipDataItem[] = [
        { displayName: "Endereço WMS", value: id },
        { displayName: "Valor", value: String(value) },
        ...extras.map((t) => ({ displayName: t.displayName, value: t.value })),
      ];

      element.addEventListener("mousemove", (e: MouseEvent) => {
        this.tooltipService.show({
          coordinates: [e.clientX, e.clientY],
          isTouchEvent: false,
          dataItems: tooltipData,
          identities: [],
        });
      });

      element.addEventListener("mouseleave", () => {
        this.tooltipService.hide({ immediately: false, isTouchEvent: false });
      });
    });
  }
}
