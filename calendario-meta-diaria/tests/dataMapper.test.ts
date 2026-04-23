import { DataMapper } from "../src/dataMapper";

function mockDataView(
  dates: string[],
  faturados: (number | null)[],
  objetivos: (number | null)[]
) {
  return {
    categorical: {
      categories: [{ values: dates.map((d) => { const [y, m, day] = d.split("-").map(Number); return new Date(y, m - 1, day); }), source: { displayName: "Data" } }],
      values: [
        { values: faturados, source: { displayName: "Faturado" } },
        { values: objetivos, source: { displayName: "Objetivo" } },
      ],
    },
  };
}

describe("DataMapper", () => {
  const mapper = new DataMapper();

  it("returns empty result when no categorical categories", () => {
    const result = mapper.process({ categorical: { categories: [], values: [] } } as any);
    expect(result.days).toHaveLength(0);
    expect(result.weeks).toHaveLength(0);
    expect(result.summary.faturadoMes).toBe(0);
  });

  it("maps April 1 2026 (Wednesday) correctly", () => {
    const dv = mockDataView(["2026-04-01"], [466000], [538000]);
    const { days } = mapper.process(dv as any);
    expect(days[0].day).toBe(1);
    expect(days[0].weekday).toBe(3); // Wednesday = 3
    expect(days[0].faturado).toBe(466000);
    expect(days[0].objetivo).toBe(538000);
    expect(days[0].gap).toBe(-72000);
    expect(days[0].pct).toBeCloseTo(466000 / 538000, 5);
    expect(days[0].isPending).toBe(false);
  });

  it("computes weekOfMonth = 0 for April 1 (firstWeekday=3, day=1)", () => {
    // weekOfMonth = floor((1-1+3)/7) = floor(3/7) = 0
    const dv = mockDataView(["2026-04-01"], [100], [100]);
    const { days } = mapper.process(dv as any);
    expect(days[0].weekOfMonth).toBe(0);
  });

  it("computes weekOfMonth = 1 for April 7 (firstWeekday=3, day=7)", () => {
    // weekOfMonth = floor((7-1+3)/7) = floor(9/7) = 1
    const dv = mockDataView(["2026-04-07"], [100], [100]);
    const { days } = mapper.process(dv as any);
    expect(days[0].weekOfMonth).toBe(1);
  });

  it("marks future days without faturado as isPending", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const iso = future.toISOString().slice(0, 10);
    const dv = mockDataView([iso], [null], [500000]);
    const { days } = mapper.process(dv as any);
    expect(days[0].isPending).toBe(true);
    expect(days[0].faturado).toBeNull();
  });

  it("does not mark past days as isPending even with null faturado", () => {
    const dv = mockDataView(["2020-01-01"], [null], [100]);
    const { days } = mapper.process(dv as any);
    expect(days[0].isPending).toBe(false);
  });

  it("computes MonthSummary with two realized days", () => {
    const dv = mockDataView(
      ["2026-04-01", "2026-04-02"],
      [466000, 454000],
      [538000, 475000]
    );
    const { summary } = mapper.process(dv as any);
    expect(summary.faturadoMes).toBe(920000);
    expect(summary.objetivoMes).toBe(1013000);
    expect(summary.diasRealizados).toBe(2);
    expect(summary.gapMes).toBe(920000 - 1013000);
    expect(summary.mesLabel).toBe("Abril 2026");
  });

  it("builds WeekGrid with null for days not in dataset (April 2026 starts Wed)", () => {
    // April 1 = col 3 (Qua). Cols 0,1,2 (Dom,Seg,Ter) of week 0 must be null.
    const dv = mockDataView(["2026-04-01"], [466000], [538000]);
    const { weeks } = mapper.process(dv as any);
    expect(weeks[0][0]).toBeNull(); // Dom
    expect(weeks[0][1]).toBeNull(); // Seg
    expect(weeks[0][2]).toBeNull(); // Ter
    expect(weeks[0][3]).not.toBeNull(); // Qua = April 1
    expect(weeks[0][4]).toBeNull(); // Qui
  });

  it("computes projecaoMes as ritmoMedio * diasNoMes", () => {
    // April has 30 days. 2 days realized: 920000 total. Ritmo = 460000/day.
    // Projecao = 460000 * 30 = 13800000
    const dv = mockDataView(
      ["2026-04-01", "2026-04-02"],
      [466000, 454000],
      [538000, 475000]
    );
    const { summary } = mapper.process(dv as any);
    expect(summary.projecaoMes).toBeCloseTo((920000 / 2) * 30, 0);
  });
});
