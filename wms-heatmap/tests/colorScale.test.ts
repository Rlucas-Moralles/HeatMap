import { ColorScale } from "../src/colorScale";

describe("ColorScale", () => {
  it("retorna a cor mínima para o menor valor", () => {
    const scale = new ColorScale(0, 100, "#0000ff", "#ff0000", false);
    expect(scale.getColor(0)).toBe("rgb(0, 0, 255)");
  });

  it("retorna a cor máxima para o maior valor", () => {
    const scale = new ColorScale(0, 100, "#0000ff", "#ff0000", false);
    expect(scale.getColor(100)).toBe("rgb(255, 0, 0)");
  });

  it("retorna cor intermediária para valor no meio", () => {
    const scale = new ColorScale(0, 100, "#000000", "#ffffff", false);
    const mid = scale.getColor(50);
    expect(mid).toBe("rgb(128, 128, 128)");
  });

  it("inverte a escala quando invertScale=true", () => {
    const scale = new ColorScale(0, 100, "#0000ff", "#ff0000", true);
    expect(scale.getColor(0)).toBe("rgb(255, 0, 0)");
    expect(scale.getColor(100)).toBe("rgb(0, 0, 255)");
  });

  it("retorna minColor quando min === max (sem divisão por zero)", () => {
    const scale = new ColorScale(50, 50, "#0000ff", "#ff0000", false);
    expect(scale.getColor(50)).toBe("rgb(0, 0, 255)");
  });
});
