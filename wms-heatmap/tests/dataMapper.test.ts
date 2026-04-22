import { DataMapper } from "../src/dataMapper";

function buildMockDataView(
  addresses: string[],
  values: number[],
  tooltipValues: string[][] = []
) {
  return {
    categorical: {
      categories: [
        {
          values: addresses,
          source: { roles: { codendereco: true } },
          identity: addresses.map((a) => ({ key: a })),
        },
      ],
      values: [
        {
          values,
          source: { roles: { value: true }, displayName: "Qtd" },
        },
        ...(tooltipValues.length > 0
          ? [
              {
                values: tooltipValues[0],
                source: { roles: { tooltips: true }, displayName: "Info" },
              },
            ]
          : []),
      ],
    },
  } as any;
}

describe("DataMapper", () => {
  it("mapeia endereços para valores corretamente", () => {
    const dv = buildMockDataView(["48248", "48244"], [100, 50]);
    const result = new DataMapper().process(dv);
    expect(result.dataMap.get("48248")).toBe(100);
    expect(result.dataMap.get("48244")).toBe(50);
  });

  it("calcula min e max corretamente", () => {
    const dv = buildMockDataView(["A", "B", "C"], [10, 5, 20]);
    const result = new DataMapper().process(dv);
    expect(result.min).toBe(5);
    expect(result.max).toBe(20);
  });

  it("ignora valores nulos", () => {
    const dv = buildMockDataView(["A", "B"], [null as any, 30]);
    const result = new DataMapper().process(dv);
    expect(result.dataMap.has("A")).toBe(false);
    expect(result.dataMap.get("B")).toBe(30);
  });

  it("converte endereço numérico para string", () => {
    const dv = buildMockDataView([48248 as any], [100]);
    const result = new DataMapper().process(dv);
    expect(result.dataMap.get("48248")).toBe(100);
  });

  it("retorna tooltipMap com campos extras", () => {
    const dv = buildMockDataView(["X"], [5], [["Detalhe X"]]);
    const result = new DataMapper().process(dv);
    expect(result.tooltipMap.get("X")).toEqual([{ displayName: "Info", value: "Detalhe X" }]);
  });

  it("retorna min=0 max=0 quando não há dados", () => {
    const dv = buildMockDataView([], []);
    const result = new DataMapper().process(dv);
    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
  });
});
