# Calendário de Meta Diária — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um Power BI Custom Visual React (pbiviz) que exibe um calendário mensal de meta diária com KPI cards no topo e células coloridas por % de atingimento.

**Architecture:** Novo projeto pbiviz com template React em `HeatMap/calendario-meta-diaria/`. O `DataMapper` transforma o `dataView` em `DayData[]` e `WeekGrid`. O `CalendarRenderer` (React) orquestra `KPISection` + `CalendarGrid` + `CalendarCell`. Estilos inline no React, `.less` apenas para o container root.

**Tech Stack:** TypeScript 4.x, React 17, Power BI Visuals API 5.x, pbiviz 7.0.2, powerbi-visuals-utils-formattingmodel 6.x, Jest 29 + ts-jest 29.

---

### Task 1: Scaffold do projeto e configuração do package.json

**Files:**
- Create: `calendario-meta-diaria/` (via pbiviz new)
- Modify: `calendario-meta-diaria/package.json`
- Create: `calendario-meta-diaria/jest.config.js`
- Create: `calendario-meta-diaria/tests/__mocks__/powerbi-visuals-api.ts`
- Create: `calendario-meta-diaria/tests/__mocks__/style.ts`

- [ ] **Step 1: Criar o projeto com pbiviz**

No terminal, dentro de `C:\Users\lucas.pereira\OneDrive\2_Programas\HeatMap\`:

```bash
pbiviz new calendario-meta-diaria --template react
cd calendario-meta-diaria
```

Esperado: pasta `calendario-meta-diaria/` criada com `src/visual.tsx`, `capabilities.json`, `package.json` etc.

- [ ] **Step 2: Instalar dependências adicionais**

```bash
npm install powerbi-visuals-utils-formattingmodel@6.0.4
npm install --save-dev jest@^29.7.0 ts-jest@^29.2.6 @types/jest@^29.5.12
```

Esperado: `node_modules/` atualizado sem erros.

- [ ] **Step 3: Adicionar script de test no package.json**

Abra `package.json` e adicione dentro de `"scripts"`:

```json
"test": "jest"
```

- [ ] **Step 4: Criar jest.config.js**

Crie `calendario-meta-diaria/jest.config.js`:

```js
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }]
  },
  moduleNameMapper: {
    "powerbi-visuals-api": "<rootDir>/tests/__mocks__/powerbi-visuals-api.ts",
    "powerbi-visuals-utils-formattingmodel": "<rootDir>/tests/__mocks__/powerbi-visuals-utils-formattingmodel.ts",
    "\\.less$": "<rootDir>/tests/__mocks__/style.ts"
  },
  testMatch: ["**/tests/**/*.test.ts"]
};
```

- [ ] **Step 5: Criar mocks para jest**

Crie `calendario-meta-diaria/tests/__mocks__/powerbi-visuals-api.ts`:

```typescript
export default {};
module.exports = {};
```

Crie `calendario-meta-diaria/tests/__mocks__/style.ts`:

```typescript
module.exports = {};
```

- [ ] **Step 6: Verificar que o projeto compila**

```bash
pbiviz package
```

Esperado: `Build completed successfully` (o visual gerado ainda é o template padrão — ok).

- [ ] **Step 7: Commit**

```bash
git add calendario-meta-diaria/
git commit -m "feat: scaffold calendario-meta-diaria pbiviz react project"
```

---

### Task 2: capabilities.json

**Files:**
- Modify: `calendario-meta-diaria/capabilities.json`

- [ ] **Step 1: Substituir capabilities.json completo**

Sobrescreva `calendario-meta-diaria/capabilities.json` com:

```json
{
  "dataRoles": [
    {
      "name": "data",
      "kind": "Grouping",
      "displayName": "Data",
      "description": "Campo de data — um registro por dia"
    },
    {
      "name": "faturado",
      "kind": "Measure",
      "displayName": "Faturado",
      "description": "Valor realizado do dia"
    },
    {
      "name": "objetivo",
      "kind": "Measure",
      "displayName": "Objetivo",
      "description": "Meta do dia"
    }
  ],
  "dataViewMappings": [
    {
      "conditions": [
        {
          "data": { "max": 1 },
          "faturado": { "max": 1 },
          "objetivo": { "max": 1 }
        }
      ],
      "categorical": {
        "categories": {
          "for": { "in": "data" },
          "dataReductionAlgorithm": { "top": { "count": 500 } }
        },
        "values": {
          "select": [
            { "bind": { "to": "faturado" } },
            { "bind": { "to": "objetivo" } }
          ]
        }
      }
    }
  ],
  "objects": {
    "thresholds": {
      "displayName": "Thresholds",
      "properties": {
        "thresholdOk":   { "displayName": "% Bom (≥)",    "type": { "numeric": true } },
        "thresholdWarn": { "displayName": "% Alerta (≥)", "type": { "numeric": true } }
      }
    },
    "colors": {
      "displayName": "Cores",
      "properties": {
        "colorOk":   { "displayName": "Cor OK",    "type": { "fill": { "solid": { "color": true } } } },
        "colorWarn": { "displayName": "Cor Alerta","type": { "fill": { "solid": { "color": true } } } },
        "colorBad":  { "displayName": "Cor Ruim",  "type": { "fill": { "solid": { "color": true } } } }
      }
    },
    "typography": {
      "displayName": "Tipografia",
      "properties": {
        "valueFontSize": { "displayName": "Tamanho valor (px)",  "type": { "numeric": true } },
        "cellFontSize":  { "displayName": "Tamanho célula (px)", "type": { "numeric": true } }
      }
    },
    "display": {
      "displayName": "Exibição",
      "properties": {
        "showKpiCards":   { "displayName": "Mostrar KPI cards", "type": { "bool": true } },
        "showBorders":    { "displayName": "Mostrar bordas",    "type": { "bool": true } },
        "highlightToday": { "displayName": "Destacar hoje",     "type": { "bool": true } }
      }
    }
  },
  "supportsHighlight": false,
  "suppressDefaultTitle": true,
  "privileges": []
}
```

- [ ] **Step 2: Verificar JSON válido**

```bash
node -e "require('./capabilities.json'); console.log('OK')"
```

Esperado: `OK`

- [ ] **Step 3: Commit**

```bash
git add calendario-meta-diaria/capabilities.json
git commit -m "feat: configure capabilities for calendario-meta-diaria"
```

---

### Task 3: colorUtils.ts com testes

**Files:**
- Create: `calendario-meta-diaria/src/colorUtils.ts`
- Create: `calendario-meta-diaria/tests/colorUtils.test.ts`

- [ ] **Step 1: Escrever os testes (TDD — falharão pois colorUtils não existe)**

Crie `calendario-meta-diaria/tests/colorUtils.test.ts`:

```typescript
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
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

```bash
npx jest tests/colorUtils.test.ts
```

Esperado: FAIL — "Cannot find module '../src/colorUtils'"

- [ ] **Step 3: Implementar colorUtils.ts**

Crie `calendario-meta-diaria/src/colorUtils.ts`:

```typescript
export function getCellBg(pct: number | null, thresholdOk: number, thresholdWarn: number): string {
  if (pct === null) return "#FFFFFF";
  if (pct >= thresholdOk / 100) return "#F0FDF4";
  if (pct >= thresholdWarn / 100) return "#FFFBEB";
  return "#FEF2F2";
}

export function getChipColor(pct: number | null, thresholdOk: number, thresholdWarn: number): string {
  if (pct === null) return "#9A9A95";
  if (pct >= thresholdOk / 100) return "#16A34A";
  if (pct >= thresholdWarn / 100) return "#D97706";
  return "#DC2626";
}

export function getKpiBg(pct: number | null, thresholdOk: number, thresholdWarn: number): string {
  if (pct === null) return "#FAFAF9";
  if (pct >= thresholdOk / 100) return "#16A34A";
  if (pct >= thresholdWarn / 100) return "#D97706";
  return "#DC2626";
}

export function formatValue(value: number): string {
  if (value >= 1000) {
    return "R$ " + (value / 1000).toFixed(1).replace(".", ",") + "k";
  }
  return "R$ " + Math.round(value).toString();
}

export function formatGap(gap: number): string {
  const abs = Math.abs(gap);
  const formatted =
    abs >= 1000
      ? (abs / 1000).toFixed(1).replace(".", ",") + "k"
      : Math.round(abs).toString();
  return (gap >= 0 ? "+" : "-") + formatted;
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

```bash
npx jest tests/colorUtils.test.ts
```

Esperado: PASS — 5 suites, todos os testes verdes.

- [ ] **Step 5: Commit**

```bash
git add calendario-meta-diaria/src/colorUtils.ts calendario-meta-diaria/tests/colorUtils.test.ts calendario-meta-diaria/jest.config.js calendario-meta-diaria/tests/__mocks__/
git commit -m "feat: add colorUtils with full test coverage"
```

---

### Task 4: dataMapper.ts com testes

**Files:**
- Create: `calendario-meta-diaria/src/dataMapper.ts`
- Create: `calendario-meta-diaria/tests/dataMapper.test.ts`

- [ ] **Step 1: Escrever os testes**

Crie `calendario-meta-diaria/tests/dataMapper.test.ts`:

```typescript
import { DataMapper } from "../src/dataMapper";

function mockDataView(
  dates: string[],
  faturados: (number | null)[],
  objetivos: (number | null)[]
) {
  return {
    categorical: {
      categories: [{ values: dates.map((d) => new Date(d)), source: { displayName: "Data" } }],
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
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

```bash
npx jest tests/dataMapper.test.ts
```

Esperado: FAIL — "Cannot find module '../src/dataMapper'"

- [ ] **Step 3: Implementar dataMapper.ts**

Crie `calendario-meta-diaria/src/dataMapper.ts`:

```typescript
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
      const date = rawDate instanceof Date ? new Date(rawDate) : new Date(rawDate);
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
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

```bash
npx jest tests/dataMapper.test.ts
```

Esperado: PASS — todos os testes verdes.

- [ ] **Step 5: Rodar todos os testes**

```bash
npx jest
```

Esperado: PASS — colorUtils + dataMapper, sem falhas.

- [ ] **Step 6: Commit**

```bash
git add calendario-meta-diaria/src/dataMapper.ts calendario-meta-diaria/tests/dataMapper.test.ts
git commit -m "feat: add DataMapper with full test coverage"
```

---

### Task 5: settings.ts e formattingSettings.ts

**Files:**
- Create: `calendario-meta-diaria/src/settings.ts`
- Create: `calendario-meta-diaria/src/formattingSettings.ts`

- [ ] **Step 1: Criar settings.ts**

Crie `calendario-meta-diaria/src/settings.ts`:

```typescript
export interface VisualSettings {
  thresholds: {
    thresholdOk: number;
    thresholdWarn: number;
  };
  colors: {
    colorOk: string;
    colorWarn: string;
    colorBad: string;
  };
  typography: {
    valueFontSize: number;
    cellFontSize: number;
  };
  display: {
    showKpiCards: boolean;
    showBorders: boolean;
    highlightToday: boolean;
  };
}
```

- [ ] **Step 2: Criar formattingSettings.ts**

Crie `calendario-meta-diaria/src/formattingSettings.ts`:

```typescript
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

class ThresholdsCard extends formattingSettings.SimpleCard {
  name = "thresholds";
  displayName = "Thresholds";

  thresholdOk = new formattingSettings.NumUpDown({
    name: "thresholdOk",
    displayName: "% Bom (≥)",
    value: 100,
  });
  thresholdWarn = new formattingSettings.NumUpDown({
    name: "thresholdWarn",
    displayName: "% Alerta (≥)",
    value: 90,
  });

  slices = [this.thresholdOk, this.thresholdWarn];
}

class ColorsCard extends formattingSettings.SimpleCard {
  name = "colors";
  displayName = "Cores";

  colorOk = new formattingSettings.ColorPicker({
    name: "colorOk",
    displayName: "Cor OK",
    value: { value: "#16A34A" },
  });
  colorWarn = new formattingSettings.ColorPicker({
    name: "colorWarn",
    displayName: "Cor Alerta",
    value: { value: "#D97706" },
  });
  colorBad = new formattingSettings.ColorPicker({
    name: "colorBad",
    displayName: "Cor Ruim",
    value: { value: "#DC2626" },
  });

  slices = [this.colorOk, this.colorWarn, this.colorBad];
}

class TypographyCard extends formattingSettings.SimpleCard {
  name = "typography";
  displayName = "Tipografia";

  valueFontSize = new formattingSettings.NumUpDown({
    name: "valueFontSize",
    displayName: "Tamanho valor (px)",
    value: 30,
  });
  cellFontSize = new formattingSettings.NumUpDown({
    name: "cellFontSize",
    displayName: "Tamanho célula (px)",
    value: 11,
  });

  slices = [this.valueFontSize, this.cellFontSize];
}

class DisplayCard extends formattingSettings.SimpleCard {
  name = "display";
  displayName = "Exibição";

  showKpiCards = new formattingSettings.ToggleSwitch({
    name: "showKpiCards",
    displayName: "Mostrar KPI cards",
    value: true,
  });
  showBorders = new formattingSettings.ToggleSwitch({
    name: "showBorders",
    displayName: "Mostrar bordas",
    value: true,
  });
  highlightToday = new formattingSettings.ToggleSwitch({
    name: "highlightToday",
    displayName: "Destacar hoje",
    value: true,
  });

  slices = [this.showKpiCards, this.showBorders, this.highlightToday];
}

export class CalendarioFormattingSettingsModel extends formattingSettings.Model {
  thresholdsCard = new ThresholdsCard();
  colorsCard = new ColorsCard();
  typographyCard = new TypographyCard();
  displayCard = new DisplayCard();

  cards = [this.thresholdsCard, this.colorsCard, this.typographyCard, this.displayCard];
}
```

- [ ] **Step 3: Verificar compilação TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros de tipo.

- [ ] **Step 4: Commit**

```bash
git add calendario-meta-diaria/src/settings.ts calendario-meta-diaria/src/formattingSettings.ts
git commit -m "feat: add settings interfaces and FormattingSettingsModel"
```

---

### Task 6: visual.less

**Files:**
- Modify: `calendario-meta-diaria/style/visual.less`

- [ ] **Step 1: Substituir visual.less**

Sobrescreva `calendario-meta-diaria/style/visual.less`:

```less
.calendario-meta {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: "Segoe UI", sans-serif;
  box-sizing: border-box;

  .cal-error {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #DC2626;
    font-size: 13px;
    text-align: center;
    padding: 16px;
    box-sizing: border-box;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add calendario-meta-diaria/style/visual.less
git commit -m "feat: add visual.less for calendario-meta-diaria"
```

---

### Task 7: CalendarCell.tsx

**Files:**
- Create: `calendario-meta-diaria/src/components/CalendarCell.tsx`

- [ ] **Step 1: Criar a pasta components**

Execute dentro de `calendario-meta-diaria/`:

```bash
mkdir -p src/components
```

- [ ] **Step 2: Criar CalendarCell.tsx**

Crie `calendario-meta-diaria/src/components/CalendarCell.tsx`:

```tsx
import React from "react";
import { DayData } from "../dataMapper";
import { VisualSettings } from "../settings";
import { getCellBg, getChipColor, formatValue, formatGap } from "../colorUtils";

interface Props {
  day: DayData;
  settings: VisualSettings;
}

export const CalendarCell: React.FC<Props> = ({ day, settings }) => {
  const { thresholds, typography, display } = settings;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = display.highlightToday && day.date.getTime() === today.getTime();

  const bg = getCellBg(day.pct, thresholds.thresholdOk, thresholds.thresholdWarn);
  const chipColor = getChipColor(day.pct, thresholds.thresholdOk, thresholds.thresholdWarn);
  const gapColor = day.gap !== null && day.gap >= 0 ? "#16A34A" : "#DC2626";

  const cellStyle: React.CSSProperties = {
    backgroundColor: bg,
    border: isToday
      ? "2px solid #1A1A1A"
      : display.showBorders
      ? "1px solid #555555"
      : "1px solid #ECECEA",
    padding: "12px 14px 14px",
    minHeight: 128,
    display: "flex",
    flexDirection: "column",
    fontFamily: "Segoe UI, sans-serif",
    boxSizing: "border-box",
    verticalAlign: "top",
  };

  const dayNumStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: "#1A1A1A",
    lineHeight: 1,
  };

  // Pending state: future day without faturado
  if (day.isPending) {
    return (
      <td style={cellStyle}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={dayNumStyle}>{day.day}</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, marginTop: 8 }}>
          <span style={{ fontSize: typography.cellFontSize, color: "#9A9A95", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            PENDENTE
          </span>
          {day.objetivo !== null && (
            <span style={{ fontSize: typography.cellFontSize, color: "#9A9A95" }}>
              obj {formatValue(day.objetivo)}
            </span>
          )}
        </div>
      </td>
    );
  }

  // Empty state: no data, not future
  if (day.faturado === null) {
    return (
      <td style={cellStyle}>
        <span style={dayNumStyle}>{day.day}</span>
        <div style={{ flex: 1, display: "flex", alignItems: "center", marginTop: 8 }}>
          <span style={{ color: "#9A9A95", fontSize: 18 }}>—</span>
        </div>
      </td>
    );
  }

  // Realized state: has faturado
  return (
    <td style={cellStyle}>
      {/* Top row: day number + % chip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={dayNumStyle}>{day.day}</span>
        {day.pct !== null && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: chipColor,
              border: `1px solid ${chipColor}`,
              borderRadius: 999,
              padding: "1px 7px",
              lineHeight: 1.4,
            }}
          >
            {Math.round(day.pct * 100)}%
          </span>
        )}
      </div>

      {/* Middle: faturado value */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: typography.valueFontSize, fontWeight: 600, color: "#1A1A1A", lineHeight: 1 }}>
          {formatValue(day.faturado)}
        </span>
      </div>

      {/* Bottom: obj + gap */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6 }}>
        <span style={{ fontSize: typography.cellFontSize, fontWeight: 500, color: "#6B6B68" }}>
          obj {day.objetivo !== null ? formatValue(day.objetivo) : "—"}
        </span>
        {day.gap !== null && (
          <span style={{ fontSize: typography.cellFontSize, fontWeight: 600, color: gapColor }}>
            {formatGap(day.gap)}
          </span>
        )}
      </div>
    </td>
  );
};
```

- [ ] **Step 3: Verificar compilação**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add calendario-meta-diaria/src/components/CalendarCell.tsx
git commit -m "feat: add CalendarCell React component"
```

---

### Task 8: CalendarGrid.tsx

**Files:**
- Create: `calendario-meta-diaria/src/components/CalendarGrid.tsx`

- [ ] **Step 1: Criar CalendarGrid.tsx**

Crie `calendario-meta-diaria/src/components/CalendarGrid.tsx`:

```tsx
import React from "react";
import { WeekGrid } from "../dataMapper";
import { VisualSettings } from "../settings";
import { CalendarCell } from "./CalendarCell";

interface Props {
  weeks: WeekGrid;
  settings: VisualSettings;
}

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export const CalendarGrid: React.FC<Props> = ({ weeks, settings }) => {
  const headerCellStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: "#6B6B68",
    textTransform: "uppercase",
    textAlign: "center",
    padding: "6px 0",
    fontFamily: "Segoe UI, sans-serif",
    borderBottom: "1px solid #555555",
    letterSpacing: "0.04em",
  };

  const emptyCellStyle: React.CSSProperties = {
    backgroundColor: "#3A3A3A",
    border: settings.display.showBorders ? "1px solid #555555" : "none",
    minHeight: 128,
    verticalAlign: "top",
  };

  return (
    <div
      style={{
        flex: 1,
        overflow: "hidden",
        borderRadius: 10,
        border: "1px solid #555555",
      }}
    >
      <table
        style={{
          width: "100%",
          height: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr>
            {WEEKDAYS.map((wd) => (
              <th key={wd} style={headerCellStyle}>
                {wd}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) =>
                day ? (
                  <CalendarCell key={di} day={day} settings={settings} />
                ) : (
                  <td key={di} style={emptyCellStyle} />
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add calendario-meta-diaria/src/components/CalendarGrid.tsx
git commit -m "feat: add CalendarGrid React component"
```

---

### Task 9: KPISection.tsx

**Files:**
- Create: `calendario-meta-diaria/src/components/KPISection.tsx`

- [ ] **Step 1: Criar KPISection.tsx**

Crie `calendario-meta-diaria/src/components/KPISection.tsx`:

```tsx
import React from "react";
import { MonthSummary } from "../dataMapper";
import { VisualSettings } from "../settings";
import { formatValue, formatGap, getKpiBg, getChipColor } from "../colorUtils";

interface KPICardProps {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  bg: string;
  onDarkBg?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  sub,
  subColor,
  bg,
  onDarkBg = false,
}) => {
  const inkColor = onDarkBg ? "#FFFFFF" : "#1A1A1A";
  const mutedColor = onDarkBg ? "rgba(255,255,255,0.75)" : "#6B6B68";

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: bg,
        border: onDarkBg ? "none" : "1px solid #ECECEA",
        borderRadius: 10,
        padding: "18px 20px",
        fontFamily: "Segoe UI, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: mutedColor,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 30,
          fontWeight: 600,
          color: inkColor,
          lineHeight: 1.1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 12,
          color: subColor ?? mutedColor,
          whiteSpace: "nowrap",
        }}
      >
        {sub}
      </span>
    </div>
  );
};

interface Props {
  summary: MonthSummary;
  settings: VisualSettings;
}

export const KPISection: React.FC<Props> = ({ summary, settings }) => {
  const { thresholds } = settings;
  const kpiBg = getKpiBg(summary.pctAcum, thresholds.thresholdOk, thresholds.thresholdWarn);
  const kpiOnDark = summary.pctAcum !== null;

  const gapColor =
    summary.gapMes >= 0
      ? getChipColor(1.0, thresholds.thresholdOk, thresholds.thresholdWarn)
      : getChipColor(0, thresholds.thresholdOk, thresholds.thresholdWarn);

  const today = new Date();

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginBottom: 12,
        flexShrink: 0,
      }}
    >
      <KPICard
        label="Faturado no Mês"
        value={formatValue(summary.faturadoMes)}
        sub={`${summary.diasRealizados} dias bateram`}
        bg="#FAFAF9"
      />
      <KPICard
        label="Objetivo Acumulado"
        value={formatValue(summary.objetivoMes)}
        sub={`gap ${formatGap(summary.gapMes)}`}
        subColor={gapColor}
        bg="#FAFAF9"
      />
      <KPICard
        label="% Atingimento"
        value={`${Math.round(summary.pctAcum * 100)}%`}
        sub={`no mês até ${today.getDate()}/${today.getMonth() + 1}`}
        bg={kpiBg}
        onDarkBg={kpiOnDark}
      />
      <KPICard
        label="Projeção Fim de Mês"
        value={formatValue(summary.projecaoMes)}
        sub={`${Math.round(summary.pctProjecao * 100)}% do obj total`}
        bg="#FAFAF9"
      />
    </div>
  );
};
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add calendario-meta-diaria/src/components/KPISection.tsx
git commit -m "feat: add KPISection React component"
```

---

### Task 10: CalendarRenderer.tsx

**Files:**
- Create: `calendario-meta-diaria/src/components/CalendarRenderer.tsx`

- [ ] **Step 1: Criar CalendarRenderer.tsx**

Crie `calendario-meta-diaria/src/components/CalendarRenderer.tsx`:

```tsx
import React from "react";
import { DayData, MonthSummary, WeekGrid } from "../dataMapper";
import { VisualSettings } from "../settings";
import { KPISection } from "./KPISection";
import { CalendarGrid } from "./CalendarGrid";

interface Props {
  days: DayData[];
  summary: MonthSummary;
  weeks: WeekGrid;
  settings: VisualSettings;
}

export const CalendarRenderer: React.FC<Props> = ({ days, summary, weeks, settings }) => {
  if (days.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          fontFamily: "Segoe UI, sans-serif",
          color: "#9A9A95",
          fontSize: 13,
        }}
      >
        Sem dados para exibir.
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Segoe UI, sans-serif",
        padding: 12,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {settings.display.showKpiCards && (
        <KPISection summary={summary} settings={settings} />
      )}
      <CalendarGrid weeks={weeks} settings={settings} />
    </div>
  );
};
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add calendario-meta-diaria/src/components/CalendarRenderer.tsx
git commit -m "feat: add CalendarRenderer root React component"
```

---

### Task 11: visual.ts — entry point

**Files:**
- Modify: `calendario-meta-diaria/src/visual.tsx` (arquivo criado pelo scaffold — substituir conteúdo)

> O scaffold do `pbiviz --template react` cria `src/visual.tsx`. Vamos substituir todo o conteúdo mantendo o nome do arquivo.

- [ ] **Step 1: Substituir src/visual.tsx**

Sobrescreva `calendario-meta-diaria/src/visual.tsx` com:

```tsx
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { CalendarioFormattingSettingsModel } from "./formattingSettings";
import { VisualSettings } from "./settings";
import { DataMapper } from "./dataMapper";
import { CalendarRenderer } from "./components/CalendarRenderer";

import React from "react";
import ReactDOM from "react-dom/client";
import "./../style/visual.less";

export class Visual implements IVisual {
  private host: powerbi.extensibility.visual.IVisualHost;
  private container: HTMLElement;
  private formattingSettingsService: FormattingSettingsService;
  private formattingSettings: CalendarioFormattingSettingsModel;
  private dataMapper: DataMapper;
  private root: ReturnType<typeof ReactDOM.createRoot> | null = null;

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.container = options.element;
    this.container.className = "calendario-meta";
    this.formattingSettingsService = new FormattingSettingsService();
    this.formattingSettings = new CalendarioFormattingSettingsModel();
    this.dataMapper = new DataMapper();
    this.root = ReactDOM.createRoot(this.container);
  }

  public update(options: VisualUpdateOptions): void {
    const dataView = options.dataViews?.[0];

    if (!dataView) {
      this.root?.render(
        React.createElement("div", { className: "cal-error" }, "Conecte os campos de dados.")
      );
      return;
    }

    this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
      CalendarioFormattingSettingsModel,
      dataView
    );

    const settings = this.buildSettings();
    const { days, summary, weeks } = this.dataMapper.process(dataView);

    this.root?.render(
      React.createElement(CalendarRenderer, { days, summary, weeks, settings })
    );
  }

  public getFormattingModel(): powerbi.visuals.FormattingModel {
    return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
  }

  private buildSettings(): VisualSettings {
    const fs = this.formattingSettings;
    return {
      thresholds: {
        thresholdOk: fs.thresholdsCard.thresholdOk.value,
        thresholdWarn: fs.thresholdsCard.thresholdWarn.value,
      },
      colors: {
        colorOk: fs.colorsCard.colorOk.value.value,
        colorWarn: fs.colorsCard.colorWarn.value.value,
        colorBad: fs.colorsCard.colorBad.value.value,
      },
      typography: {
        valueFontSize: fs.typographyCard.valueFontSize.value,
        cellFontSize: fs.typographyCard.cellFontSize.value,
      },
      display: {
        showKpiCards: fs.displayCard.showKpiCards.value,
        showBorders: fs.displayCard.showBorders.value,
        highlightToday: fs.displayCard.highlightToday.value,
      },
    };
  }
}
```

- [ ] **Step 2: Rodar todos os testes para garantir nenhuma regressão**

```bash
npx jest
```

Esperado: PASS — todos os testes verdes.

- [ ] **Step 3: Commit**

```bash
git add calendario-meta-diaria/src/visual.tsx
git commit -m "feat: implement Visual entry point with React rendering"
```

---

### Task 12: Build final + tema JSON

**Files:**
- Build: `calendario-meta-diaria/dist/calendarioMetaDiaria.pbiviz`
- Create: `calendario-meta-diaria/meta-diaria-theme.json`

- [ ] **Step 1: Gerar o pacote pbiviz**

```bash
cd calendario-meta-diaria
pbiviz package
```

Esperado: `Build completed successfully` e arquivo `.pbiviz` em `dist/`.

- [ ] **Step 2: Verificar se o arquivo foi gerado**

```bash
ls dist/
```

Esperado: arquivo `*.pbiviz` listado com data atual.

- [ ] **Step 3: Criar meta-diaria-theme.json**

Crie `calendario-meta-diaria/meta-diaria-theme.json`:

```json
{
  "name": "Meta Diaria",
  "dataColors": [
    "#16A34A", "#D97706", "#DC2626",
    "#1A1A1A", "#6B6B68", "#9A9A95"
  ],
  "background": "#FFFFFF",
  "foreground": "#1A1A1A",
  "tableAccent": "#555555",
  "good": "#16A34A",
  "neutral": "#D97706",
  "bad": "#DC2626",
  "textClasses": {
    "title":      { "fontFace": "Segoe UI", "fontSize": 26, "color": "#1A1A1A" },
    "header":     { "fontFace": "Segoe UI Semibold", "fontSize": 14, "color": "#1A1A1A" },
    "label":      { "fontFace": "Segoe UI", "fontSize": 11, "color": "#6B6B68" },
    "callout":    { "fontFace": "Segoe UI Semibold", "fontSize": 30, "color": "#1A1A1A" },
    "smallLabel": { "fontFace": "Segoe UI", "fontSize": 10, "color": "#9A9A95" }
  }
}
```

- [ ] **Step 4: Commit final**

```bash
git add calendario-meta-diaria/meta-diaria-theme.json
git commit -m "feat: add meta-diaria-theme.json and finalize pbiviz build"
```

---

## Instruções de uso no Power BI

1. **Importar o visual:** Home → Import visual from file → selecionar `dist/*.pbiviz`
2. **Importar o tema:** View → Themes → Browse for themes → selecionar `meta-diaria-theme.json`
3. **Conectar campos:**
   - **Data** → campo de data diária (ex: `dCalendario[Date]` ou `fVendas[Data]`)
   - **Faturado** → medida `SUM(fVendas[Faturado])`
   - **Objetivo** → medida `SUM(fVendas[Objetivo])`
4. **Filtrar por mês** com um slicer de mês/ano para exibir um mês por vez
5. **Ajustar thresholds** no painel de formatação → Thresholds (default: 100% bom, 90% alerta)
