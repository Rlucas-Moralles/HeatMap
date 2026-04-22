import { LegendSettings, ColorScaleSettings } from "./settings";

export class LegendRenderer {
  render(
    container: HTMLElement,
    min: number,
    max: number,
    colorScale: ColorScaleSettings,
    legend: LegendSettings
  ): void {
    container.innerHTML = "";
    if (!legend.show) return;

    const { minColor, maxColor, invertScale } = colorScale;
    const [from, to] = invertScale ? [maxColor, minColor] : [minColor, maxColor];

    const wrapper = document.createElement("div");
    wrapper.className = `wms-legend wms-legend--${legend.position}`;

    if (legend.title) {
      const title = document.createElement("div");
      title.className = "legend-title";
      title.textContent = legend.title;
      wrapper.appendChild(title);
    }

    const bar = document.createElement("div");
    bar.className = "legend-bar";
    bar.style.background = `linear-gradient(to right, ${from}, ${to})`;
    wrapper.appendChild(bar);

    const labels = document.createElement("div");
    labels.className = "legend-labels";
    labels.innerHTML = `<span>${Math.round(min)}</span><span>${Math.round(max)}</span>`;
    wrapper.appendChild(labels);

    container.appendChild(wrapper);
  }
}
