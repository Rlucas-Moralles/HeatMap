import * as d3 from "d3";

export class ColorScale {
  private scale: d3.ScaleLinear<string, string, never>;

  constructor(
    min: number,
    max: number,
    minColor: string,
    maxColor: string,
    invert: boolean
  ) {
    const [from, to] = invert ? [maxColor, minColor] : [minColor, maxColor];
    const domain = min === max ? [min, min + 1] : [min, max];
    this.scale = d3
      .scaleLinear<string>()
      .domain(domain)
      .range([from, to])
      .interpolate(d3.interpolateRgb);
  }

  getColor(value: number): string {
    return this.scale(value);
  }
}
