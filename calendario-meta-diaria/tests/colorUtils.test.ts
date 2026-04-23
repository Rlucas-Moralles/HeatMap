import { getCellBg, getChipColor, getKpiBg, formatValue, formatGap } from "../src/colorUtils";

describe("getCellBg", () => {
  it("returns white for null pct", () => {
    expect(getCellBg(null, 100, 90)).toBe("#FFFFFF");
  });
  it("returns green soft when pct >= thresholdOk/100", () => {
    expect(getCellBg(1.0, 100, 90)).toBe("#F0FDF4");
    expect(getCellBg(1.08, 100, 90)).toBe("#F0FDF4");
  });
  it("returns yellow soft when pct >= thresholdWarn/100 and < thresholdOk/100", () => {
    expect(getCellBg(0.95, 100, 90)).toBe("#FFFBEB");
  });
  it("returns red soft when pct < thresholdWarn/100", () => {
    expect(getCellBg(0.85, 100, 90)).toBe("#FEF2F2");
  });
});

describe("getChipColor", () => {
  it("returns gray for null pct", () => {
    expect(getChipColor(null, 100, 90)).toBe("#9A9A95");
  });
  it("returns green when pct >= thresholdOk/100", () => {
    expect(getChipColor(1.0, 100, 90)).toBe("#16A34A");
  });
  it("returns yellow when between thresholds", () => {
    expect(getChipColor(0.92, 100, 90)).toBe("#D97706");
  });
  it("returns red when pct < thresholdWarn/100", () => {
    expect(getChipColor(0.80, 100, 90)).toBe("#DC2626");
  });
});

describe("getKpiBg", () => {
  it("returns surface when pct is null", () => {
    expect(getKpiBg(null, 100, 90)).toBe("#FAFAF9");
  });
  it("returns solid green when pct >= thresholdOk/100", () => {
    expect(getKpiBg(1.0, 100, 90)).toBe("#16A34A");
  });
  it("returns solid yellow when between thresholds", () => {
    expect(getKpiBg(0.97, 100, 90)).toBe("#D97706");
  });
  it("returns solid red when pct < thresholdWarn/100", () => {
    expect(getKpiBg(0.85, 100, 90)).toBe("#DC2626");
  });
});

describe("formatValue", () => {
  it("formats values >= 1000 with k suffix and comma decimal", () => {
    expect(formatValue(1000)).toBe("R$ 1,0k");
    expect(formatValue(12345)).toBe("R$ 12,3k");
    expect(formatValue(492000)).toBe("R$ 492,0k");
  });
  it("formats values < 1000 as integer", () => {
    expect(formatValue(466)).toBe("R$ 466");
    expect(formatValue(50)).toBe("R$ 50");
  });
});

describe("formatGap", () => {
  it("prefixes positive gap with +", () => {
    expect(formatGap(36)).toBe("+36");
  });
  it("prefixes negative gap with -", () => {
    expect(formatGap(-72)).toBe("-72");
  });
  it("formats zero as +0", () => {
    expect(formatGap(0)).toBe("+0");
  });
  it("formats large positive gaps with k suffix", () => {
    expect(formatGap(1500)).toBe("+1,5k");
  });
  it("formats large negative gaps with k suffix", () => {
    expect(formatGap(-2000)).toBe("-2,0k");
  });
});
