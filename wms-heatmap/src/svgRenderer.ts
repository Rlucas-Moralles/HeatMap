import { ColorScale } from "./colorScale";
import { VisualSettings } from "./settings";

export interface RenderedShape {
  element: SVGElement;
  id: string;
  value: number;
}

export class SvgRenderer {
  render(
    container: HTMLElement,
    svgContent: string,
    dataMap: Map<string, number>,
    colorScale: ColorScale,
    settings: VisualSettings
  ): RenderedShape[] {
    container.innerHTML = "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, "image/svg+xml");
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      this.renderError(container, "SVG inválido. Reimporte o mapa.");
      return [];
    }

    const svgEl = doc.querySelector("svg");
    if (!svgEl) {
      this.renderError(container, "SVG inválido. Reimporte o mapa.");
      return [];
    }

    svgEl.setAttribute("width", "100%");
    svgEl.setAttribute("height", "100%");
    svgEl.style.display = "block";
    container.appendChild(document.importNode(svgEl, true));

    const injectedSvg = container.querySelector("svg")!;
    const shapes: RenderedShape[] = [];
    const { noMatchColor } = settings.colorScale;
    const { noMatchOpacity, showBorders, borderColor } = settings.mapAppearance;

    injectedSvg.querySelectorAll<SVGElement>("[id]").forEach((el) => {
      const id = el.getAttribute("id");
      if (!id || id === "Map") return;

      if (showBorders) {
        el.style.stroke = borderColor;
        el.style.strokeWidth = "1px";
      }

      if (dataMap.has(id)) {
        const value = dataMap.get(id)!;
        el.style.fill = colorScale.getColor(value);
        el.style.opacity = "1";
        shapes.push({ element: el, id, value });
      } else {
        el.style.fill = noMatchColor;
        el.style.opacity = String(noMatchOpacity / 100);
      }
    });

    if (settings.labels.show) {
      this.renderLabels(injectedSvg, shapes, settings);
    }

    return shapes;
  }

  private renderLabels(
    svgEl: SVGElement,
    shapes: RenderedShape[],
    settings: VisualSettings
  ): void {
    shapes.forEach(({ element, value }) => {
      const bbox = (element as SVGGraphicsElement).getBBox?.();
      if (!bbox) return;

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", String(bbox.x + bbox.width / 2));
      label.setAttribute("y", String(bbox.y + bbox.height / 2));
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "central");
      label.setAttribute("font-size", String(settings.labels.fontSize));
      label.setAttribute("fill", settings.labels.fontColor);
      label.setAttribute("pointer-events", "none");
      label.textContent = this.formatValue(value, settings.labels.format);
      svgEl.appendChild(label);
    });
  }

  private formatValue(value: number, format: "integer" | "decimal" | "auto"): string {
    if (format === "integer") return String(Math.round(value));
    if (format === "decimal") return value.toFixed(2);
    return value >= 1000
      ? (value / 1000).toFixed(1) + "k"
      : String(Math.round(value));
  }

  private renderError(container: HTMLElement, message: string): void {
    container.innerHTML = `<div class="wms-error">${message}</div>`;
  }
}
