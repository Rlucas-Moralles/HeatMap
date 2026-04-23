import powerbi from "powerbi-visuals-api";

export interface DayData {
  date: Date;
  day: number;
  weekday: number;
  weekOfMonth: number;
  faturado: number | null;
  objetivo: number | null;
  gap: number | null;
  pct: number | null;
  isPending: boolean;
}

export interface MonthSummary {
  mesLabel: string;
  faturadoMes: number;
  objetivoMes: number;
  pctAcum: number;
  gapMes: number;
  diasRealizados: number;
  projecaoMes: number;
  pctProjecao: number;
  objetivoTotal: number;
}

export type WeekGrid = (DayData | null)[][];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export class DataMapper {
  process(dataView: powerbi.DataView): { days: DayData[]; summary: MonthSummary; weeks: WeekGrid } {
    const categorical = dataView.categorical;
    if (!categorical?.categories?.[0] || !categorical.values?.[0]) {
      return this.empty();
    }

    const dateValues = categorical.categories[0].values as (Date | string)[];
    const faturadoValues = categorical.values[0].values as (number | null)[];
    const objetivoValues = (categorical.values[1]?.values ?? []) as (number | null)[];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: DayData[] = dateValues.map((rawDate, i) => {
      const date = new Date(rawDate);
      date.setHours(0, 0, 0, 0);

      const day = date.getDate();
      const weekday = date.getDay();
      const firstWeekday = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
      const weekOfMonth = Math.floor((day - 1 + firstWeekday) / 7);

      const faturado = faturadoValues[i] != null ? Number(faturadoValues[i]) : null;
      const objetivo = objetivoValues[i] != null ? Number(objetivoValues[i]) : null;
      const gap = faturado !== null && objetivo !== null ? faturado - objetivo : null;
      const pct =
        faturado !== null && objetivo !== null && objetivo > 0 ? faturado / objetivo : null;
      const isPending = date > today && faturado === null;

      return { date, day, weekday, weekOfMonth, faturado, objetivo, gap, pct, isPending };
    });

    days.sort((a, b) => a.date.getTime() - b.date.getTime());

    const summary = this.buildSummary(days);
    const weeks = this.buildWeeks(days);

    return { days, summary, weeks };
  }

  private buildSummary(days: DayData[]): MonthSummary {
    const realized = days.filter((d) => d.faturado !== null && d.faturado > 0);
    const faturadoMes = realized.reduce((s, d) => s + (d.faturado ?? 0), 0);
    const objetivoMes = realized.reduce((s, d) => s + (d.objetivo ?? 0), 0);
    const objetivoTotal = days.reduce((s, d) => s + (d.objetivo ?? 0), 0);
    const diasRealizados = realized.length;
    const pctAcum = objetivoMes > 0 ? faturadoMes / objetivoMes : 0;
    const gapMes = faturadoMes - objetivoMes;
    const ritmoMedio = diasRealizados > 0 ? faturadoMes / diasRealizados : 0;

    const refDate = days[0]?.date ?? new Date();
    const diasNoMes = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate();
    const projecaoMes = ritmoMedio * diasNoMes;
    const pctProjecao = objetivoTotal > 0 ? projecaoMes / objetivoTotal : 0;

    const mesLabel = days[0]
      ? `${MONTH_NAMES[days[0].date.getMonth()]} ${days[0].date.getFullYear()}`
      : "";

    return {
      mesLabel,
      faturadoMes,
      objetivoMes,
      pctAcum,
      gapMes,
      diasRealizados,
      projecaoMes,
      pctProjecao,
      objetivoTotal,
    };
  }

  private buildWeeks(days: DayData[]): WeekGrid {
    if (days.length === 0) return [];
    const maxWeek = Math.max(...days.map((d) => d.weekOfMonth));
    const grid: WeekGrid = Array.from({ length: maxWeek + 1 }, () => Array(7).fill(null));
    days.forEach((d) => {
      grid[d.weekOfMonth][d.weekday] = d;
    });
    return grid;
  }

  private empty(): { days: DayData[]; summary: MonthSummary; weeks: WeekGrid } {
    return {
      days: [],
      summary: {
        mesLabel: "",
        faturadoMes: 0,
        objetivoMes: 0,
        pctAcum: 0,
        gapMes: 0,
        diasRealizados: 0,
        projecaoMes: 0,
        pctProjecao: 0,
        objetivoTotal: 0,
      },
      weeks: [],
    };
  }
}
