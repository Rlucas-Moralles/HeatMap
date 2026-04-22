import powerbi from "powerbi-visuals-api";

export interface TooltipItem {
  displayName: string;
  value: string;
}

export interface DataMapResult {
  dataMap: Map<string, number>;
  tooltipMap: Map<string, TooltipItem[]>;
  min: number;
  max: number;
}

export class DataMapper {
  process(dataView: powerbi.DataView): DataMapResult {
    const dataMap = new Map<string, number>();
    const tooltipMap = new Map<string, TooltipItem[]>();

    const categorical = dataView?.categorical;
    if (!categorical?.categories?.length || !categorical?.values?.length) {
      return { dataMap, tooltipMap, min: 0, max: 0 };
    }

    const categories = categorical.categories[0];
    const valueCol = categorical.values.find((v) => v.source?.roles?.["value"]);
    const tooltipCols = categorical.values.filter((v) => v.source?.roles?.["tooltips"]);

    if (!valueCol) {
      return { dataMap, tooltipMap, min: 0, max: 0 };
    }

    categories.values.forEach((addr, i) => {
      if (addr === null || addr === undefined) return;
      const id = String(addr);
      const raw = valueCol.values[i];
      if (raw === null || raw === undefined) return;
      const num = Number(raw);

      dataMap.set(id, num);

      const tips: TooltipItem[] = tooltipCols.map((col) => ({
        displayName: col.source.displayName,
        value: String(col.values[i] ?? ""),
      }));
      tooltipMap.set(id, tips);
    });

    const nums = Array.from(dataMap.values());
    const min = nums.length ? Math.min(...nums) : 0;
    const max = nums.length ? Math.max(...nums) : 0;

    return { dataMap, tooltipMap, min, max };
  }
}
