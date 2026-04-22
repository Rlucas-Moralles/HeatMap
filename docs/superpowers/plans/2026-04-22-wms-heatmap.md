# WMS Heatmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um Power BI Custom Visual que importa um SVG de planta de armazém e colore cada shape pelo valor da medida configurada, funcionando como um heatmap de endereços WMS.

**Architecture:** O visual usa a API Power BI Custom Visual v5. O SVG é importado via `<input type="file">` dentro do visual e persistido no `.pbix` via `host.persistProperties()`. A cada `update()`, o `DataMapper` lê o DataView categórico, o `ColorScale` (D3) calcula o gradiente, e o `SvgRenderer` aplica o `fill` em cada shape cujo `id` bate com um endereço WMS. Cross-filter via `selectionManager`.

**Tech Stack:** TypeScript 4.x, Power BI Custom Visuals API 5.x, D3 v7, powerbi-visuals-tools CLI, Jest para testes unitários de funções puras.

---

## Mapa de Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `capabilities.json` | Data roles + formatting objects |
| `src/settings.ts` | Interfaces TypeScript + parser de `dataView.metadata.objects` |
| `src/dataMapper.ts` | DataView categórico → `Map<id, valor>` + tooltips |
| `src/colorScale.ts` | D3 `scaleLinear`, min/max, `getColor(value)` |
| `src/mapLoader.ts` | Botão "+ Add Map", FileReader, `persistProperties` |
| `src/svgRenderer.ts` | Parse SVG string, colorir shapes, labels de valor |
| `src/tooltipHandler.ts` | Bind hover events, formatar tooltip PBI |
| `src/legendRenderer.ts` | Barra gradiente CSS + labels min/max |
| `src/visual.ts` | `IVisual`, orquestra `update()`, `selectionManager` |
| `src/visual.less` | Estilos do container, botão, legenda |
| `tests/dataMapper.test.ts` | Testes unitários do DataMapper |
| `tests/colorScale.test.ts` | Testes unitários do ColorScale |

---

## Task 0: Ambiente e Scaffold

**Files:**
- Create: `wms-heatmap/` (diretório raiz do visual)

- [ ] **Step 1: Instalar dependências globais**

```bash
npm install -g powerbi-visuals-tools
```

Verificar instalação:
```bash
pbiviz --version
```
Expected: versão `5.x.x` ou superior.

- [ ] **Step 2: Criar o projeto scaffold**

```bash
cd C:\Users\lucas.pereira\OneDrive\2_Programas\HeatMap
pbiviz new wms-heatmap
cd wms-heatmap
```

Expected: diretório `wms-heatmap/` criado com `package.json`, `tsconfig.json`, `capabilities.json`, `src/visual.ts`, `src/settings.ts`.

- [ ] **Step 3: Instalar dependências do projeto**

```bash
npm install d3@7 @types/d3@7
npm install powerbi-visuals-utils-dataviewutils powerbi-visuals-utils-tooltiputils
npm install --save-dev jest @types/jest ts-jest
```

- [ ] **Step 4: Configurar Jest no package.json**

Adicionar ao `package.json` (mantendo o conteúdo existente, apenas adicionando a chave `jest`):

```json
"jest": {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "testMatch": ["**/tests/**/*.test.ts"],
  "moduleNameMapper": {
    "powerbi-visuals-api": "<rootDir>/tests/__mocks__/powerbi-visuals-api.ts"
  }
},
"scripts": {
  "test": "jest"
}
```

- [ ] **Step 5: Criar mock da API do Power BI para Jest**

Criar `tests/__mocks__/powerbi-visuals-api.ts`:

```ts
export default {};
```

- [ ] **Step 6: Commit inicial**

```bash
git add .
git commit -m "chore: scaffold wms-heatmap power bi custom visual"
```

---

## Task 1: capabilities.json

**Files:**
- Modify: `wms-heatmap/capabilities.json`

- [ ] **Step 1: Substituir capabilities.json pelo conteúdo completo**

```json
{
  "dataRoles": [
    {
      "name": "codendereco",
      "kind": "Grouping",
      "displayName": "Endereço WMS",
      "description": "Campo cujo valor bate com o id dos shapes no SVG"
    },
    {
      "name": "value",
      "kind": "Measure",
      "displayName": "Valor",
      "description": "Medida numérica que define a intensidade da cor"
    },
    {
      "name": "tooltips",
      "kind": "GroupingOrMeasure",
      "displayName": "Tooltips",
      "description": "Campos extras exibidos no hover"
    }
  ],
  "dataViewMappings": [
    {
      "conditions": [
        {
          "codendereco": { "max": 1 },
          "value": { "max": 1 }
        }
      ],
      "categorical": {
        "categories": {
          "for": { "in": "codendereco" },
          "dataReductionAlgorithm": { "top": { "count": 10000 } }
        },
        "values": {
          "select": [
            { "bind": { "to": "value" } },
            { "bind": { "to": "tooltips" } }
          ]
        }
      }
    }
  ],
  "objects": {
    "mapSettings": {
      "displayName": "Mapa SVG",
      "properties": {
        "svgContent": {
          "type": { "text": true }
        }
      }
    },
    "colorScale": {
      "displayName": "Escala de Cor",
      "properties": {
        "minColor": {
          "displayName": "Cor mínima",
          "type": { "fill": { "solid": { "color": true } } }
        },
        "maxColor": {
          "displayName": "Cor máxima",
          "type": { "fill": { "solid": { "color": true } } }
        },
        "noMatchColor": {
          "displayName": "Cor sem match",
          "type": { "fill": { "solid": { "color": true } } }
        },
        "invertScale": {
          "displayName": "Inverter escala",
          "type": { "bool": true }
        }
      }
    },
    "labels": {
      "displayName": "Rótulos",
      "properties": {
        "show": {
          "displayName": "Mostrar rótulos",
          "type": { "bool": true }
        },
        "fontSize": {
          "displayName": "Tamanho da fonte",
          "type": { "numeric": true }
        },
        "fontColor": {
          "displayName": "Cor da fonte",
          "type": { "fill": { "solid": { "color": true } } }
        },
        "format": {
          "displayName": "Formato numérico",
          "type": {
            "enumeration": [
              { "value": "integer", "displayName": "Inteiro" },
              { "value": "decimal", "displayName": "Decimal" },
              { "value": "auto", "displayName": "Automático" }
            ]
          }
        }
      }
    },
    "legend": {
      "displayName": "Legenda",
      "properties": {
        "show": {
          "displayName": "Mostrar legenda",
          "type": { "bool": true }
        },
        "position": {
          "displayName": "Posição",
          "type": {
            "enumeration": [
              { "value": "bottom", "displayName": "Inferior" },
              { "value": "top", "displayName": "Superior" },
              { "value": "right", "displayName": "Direita" }
            ]
          }
        },
        "title": {
          "displayName": "Título",
          "type": { "text": true }
        }
      }
    },
    "mapAppearance": {
      "displayName": "Aparência do Mapa",
      "properties": {
        "noMatchOpacity": {
          "displayName": "Opacidade sem dado (%)",
          "type": { "numeric": true }
        },
        "showBorders": {
          "displayName": "Bordas visíveis",
          "type": { "bool": true }
        },
        "borderColor": {
          "displayName": "Cor da borda",
          "type": { "fill": { "solid": { "color": true } } }
        }
      }
    }
  },
  "supportsHighlight": true,
  "suppressDefaultTitle": true
}
```

- [ ] **Step 2: Verificar que o arquivo é JSON válido**

```bash
node -e "require('./capabilities.json'); console.log('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add capabilities.json
git commit -m "feat: define data roles and formatting objects in capabilities.json"
```

---

## Task 2: settings.ts

**Files:**
- Modify: `wms-heatmap/src/settings.ts`

- [ ] **Step 1: Substituir settings.ts pelo conteúdo completo**

```ts
import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;

export interface ColorScaleSettings {
  minColor: string;
  maxColor: string;
  noMatchColor: string;
  invertScale: boolean;
}

export interface LabelSettings {
  show: boolean;
  fontSize: number;
  fontColor: string;
  format: "integer" | "decimal" | "auto";
}

export interface LegendSettings {
  show: boolean;
  position: "bottom" | "top" | "right";
  title: string;
}

export interface MapAppearanceSettings {
  noMatchOpacity: number;
  showBorders: boolean;
  borderColor: string;
}

export interface VisualSettings {
  svgContent: string;
  colorScale: ColorScaleSettings;
  labels: LabelSettings;
  legend: LegendSettings;
  mapAppearance: MapAppearanceSettings;
}

function getColor(objects: powerbi.DataViewObjects | undefined, objectName: string, propertyName: string, defaultValue: string): string {
  const obj = objects?.[objectName]?.[propertyName] as { solid?: { color?: string } } | undefined;
  return obj?.solid?.color ?? defaultValue;
}

function getValue<T>(objects: powerbi.DataViewObjects | undefined, objectName: string, propertyName: string, defaultValue: T): T {
  const obj = objects?.[objectName]?.[propertyName];
  return obj !== undefined && obj !== null ? (obj as T) : defaultValue;
}

export function parseSettings(dataView: DataView): VisualSettings {
  const objects = dataView.metadata?.objects;

  return {
    svgContent: getValue<string>(objects, "mapSettings", "svgContent", ""),
    colorScale: {
      minColor: getColor(objects, "colorScale", "minColor", "#d4e9ff"),
      maxColor: getColor(objects, "colorScale", "maxColor", "#c00000"),
      noMatchColor: getColor(objects, "colorScale", "noMatchColor", "#cccccc"),
      invertScale: getValue<boolean>(objects, "colorScale", "invertScale", false),
    },
    labels: {
      show: getValue<boolean>(objects, "labels", "show", true),
      fontSize: getValue<number>(objects, "labels", "fontSize", 10),
      fontColor: getColor(objects, "labels", "fontColor", "#ffffff"),
      format: getValue<"integer" | "decimal" | "auto">(objects, "labels", "format", "integer"),
    },
    legend: {
      show: getValue<boolean>(objects, "legend", "show", true),
      position: getValue<"bottom" | "top" | "right">(objects, "legend", "position", "bottom"),
      title: getValue<string>(objects, "legend", "title", ""),
    },
    mapAppearance: {
      noMatchOpacity: getValue<number>(objects, "mapAppearance", "noMatchOpacity", 30),
      showBorders: getValue<boolean>(objects, "mapAppearance", "showBorders", true),
      borderColor: getColor(objects, "mapAppearance", "borderColor", "#ffffff"),
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/settings.ts
git commit -m "feat: add VisualSettings interfaces and parseSettings parser"
```

---

## Task 3: colorScale.ts + testes

**Files:**
- Create: `wms-heatmap/src/colorScale.ts`
- Create: `wms-heatmap/tests/colorScale.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/colorScale.test.ts`:

```ts
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
```

- [ ] **Step 2: Executar o teste para confirmar que falha**

```bash
npx jest tests/colorScale.test.ts
```
Expected: FAIL — `Cannot find module '../src/colorScale'`

- [ ] **Step 3: Implementar colorScale.ts**

Criar `src/colorScale.ts`:

```ts
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
```

- [ ] **Step 4: Executar testes para confirmar que passam**

```bash
npx jest tests/colorScale.test.ts
```
Expected: PASS (5 testes)

- [ ] **Step 5: Commit**

```bash
git add src/colorScale.ts tests/colorScale.test.ts
git commit -m "feat: add ColorScale with D3 scaleLinear and invert support"
```

---

## Task 4: dataMapper.ts + testes

**Files:**
- Create: `wms-heatmap/src/dataMapper.ts`
- Create: `wms-heatmap/tests/dataMapper.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/dataMapper.test.ts`:

```ts
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
```

- [ ] **Step 2: Executar o teste para confirmar que falha**

```bash
npx jest tests/dataMapper.test.ts
```
Expected: FAIL — `Cannot find module '../src/dataMapper'`

- [ ] **Step 3: Implementar dataMapper.ts**

Criar `src/dataMapper.ts`:

```ts
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
```

- [ ] **Step 4: Executar testes**

```bash
npx jest tests/dataMapper.test.ts
```
Expected: PASS (6 testes)

- [ ] **Step 5: Commit**

```bash
git add src/dataMapper.ts tests/dataMapper.test.ts
git commit -m "feat: add DataMapper to convert Power BI DataView to id->value map"
```

---

## Task 5: mapLoader.ts

**Files:**
- Create: `wms-heatmap/src/mapLoader.ts`

> Nota: `mapLoader` interage diretamente com o DOM e a API do Power BI — não possui testes unitários. Testado manualmente no Step final.

- [ ] **Step 1: Criar mapLoader.ts**

```ts
import powerbi from "powerbi-visuals-api";

export class MapLoader {
  private host: powerbi.extensibility.visual.IVisualHost;

  constructor(host: powerbi.extensibility.visual.IVisualHost) {
    this.host = host;
  }

  render(container: HTMLElement): void {
    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "add-map-wrapper";

    const btn = document.createElement("button");
    btn.className = "add-map-btn";
    btn.textContent = "+ Add Map";
    btn.addEventListener("click", () => this.openFilePicker());

    const hint = document.createElement("p");
    hint.className = "add-map-hint";
    hint.textContent = "Importe um SVG criado no Synoptic Designer";

    wrapper.appendChild(btn);
    wrapper.appendChild(hint);
    container.appendChild(wrapper);
  }

  private openFilePicker(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svg,image/svg+xml";

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const svgText = ev.target?.result as string;
        if (!svgText?.includes("<svg")) {
          alert("Arquivo inválido. Selecione um SVG gerado pelo Synoptic Designer.");
          return;
        }
        this.host.persistProperties({
          merge: [
            {
              objectName: "mapSettings",
              selector: null,
              properties: { svgContent: svgText },
            },
          ],
        });
      };
      reader.readAsText(file);
    });

    input.click();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/mapLoader.ts
git commit -m "feat: add MapLoader with file picker and persistProperties"
```

---

## Task 6: svgRenderer.ts

**Files:**
- Create: `wms-heatmap/src/svgRenderer.ts`

- [ ] **Step 1: Criar svgRenderer.ts**

```ts
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
    const { noMatchColor, } = settings.colorScale;
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
```

- [ ] **Step 2: Commit**

```bash
git add src/svgRenderer.ts
git commit -m "feat: add SvgRenderer — parse SVG, colorize shapes, render value labels"
```

---

## Task 7: tooltipHandler.ts

**Files:**
- Create: `wms-heatmap/src/tooltipHandler.ts`

- [ ] **Step 1: Criar tooltipHandler.ts**

```ts
import powerbi from "powerbi-visuals-api";
import { RenderedShape } from "./svgRenderer";
import { TooltipItem } from "./dataMapper";

export class TooltipHandler {
  private tooltipService: powerbi.extensibility.ITooltipService;

  constructor(tooltipService: powerbi.extensibility.ITooltipService) {
    this.tooltipService = tooltipService;
  }

  bind(
    shapes: RenderedShape[],
    tooltipMap: Map<string, TooltipItem[]>
  ): void {
    shapes.forEach(({ element, id, value }) => {
      const extras = tooltipMap.get(id) ?? [];

      const tooltipData: powerbi.extensibility.VisualTooltipDataItem[] = [
        { displayName: "Endereço WMS", value: id },
        { displayName: "Valor", value: String(value) },
        ...extras.map((t) => ({ displayName: t.displayName, value: t.value })),
      ];

      element.addEventListener("mousemove", (e: MouseEvent) => {
        this.tooltipService.show({
          coordinates: [e.clientX, e.clientY],
          isTouchEvent: false,
          dataItems: tooltipData,
          identities: [],
        });
      });

      element.addEventListener("mouseleave", () => {
        this.tooltipService.hide({ immediately: false, isTouchEvent: false });
      });
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/tooltipHandler.ts
git commit -m "feat: add TooltipHandler with Power BI native tooltip service"
```

---

## Task 8: legendRenderer.ts

**Files:**
- Create: `wms-heatmap/src/legendRenderer.ts`

- [ ] **Step 1: Criar legendRenderer.ts**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/legendRenderer.ts
git commit -m "feat: add LegendRenderer with gradient bar and min/max labels"
```

---

## Task 9: visual.ts principal

**Files:**
- Modify: `wms-heatmap/src/visual.ts`

- [ ] **Step 1: Substituir visual.ts pelo conteúdo completo**

```ts
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

import { parseSettings } from "./settings";
import { DataMapper } from "./dataMapper";
import { ColorScale } from "./colorScale";
import { MapLoader } from "./mapLoader";
import { SvgRenderer } from "./svgRenderer";
import { TooltipHandler } from "./tooltipHandler";
import { LegendRenderer } from "./legendRenderer";

import "./../style/visual.less";

export class Visual implements IVisual {
  private host: powerbi.extensibility.visual.IVisualHost;
  private container: HTMLElement;
  private selectionManager: powerbi.extensibility.ISelectionManager;

  private dataMapper: DataMapper;
  private mapLoader: MapLoader;
  private svgRenderer: SvgRenderer;
  private tooltipHandler: TooltipHandler;
  private legendRenderer: LegendRenderer;

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.container = options.element;
    this.container.className = "wms-heatmap";
    this.selectionManager = this.host.createSelectionManager();

    this.dataMapper = new DataMapper();
    this.mapLoader = new MapLoader(this.host);
    this.svgRenderer = new SvgRenderer();
    this.tooltipHandler = new TooltipHandler(this.host.tooltipService);
    this.legendRenderer = new LegendRenderer();
  }

  public update(options: VisualUpdateOptions): void {
    const dataView = options.dataViews?.[0];
    if (!dataView) {
      this.container.innerHTML = '<div class="wms-error">Conecte os campos de dados.</div>';
      return;
    }

    const settings = parseSettings(dataView);

    if (!settings.svgContent) {
      this.mapLoader.render(this.container);
      return;
    }

    const { dataMap, tooltipMap, min, max } = this.dataMapper.process(dataView);
    const colorScale = new ColorScale(
      min,
      max,
      settings.colorScale.minColor,
      settings.colorScale.maxColor,
      settings.colorScale.invertScale
    );

    this.container.innerHTML = "";

    // Legenda superior ou direita: renderiza antes do mapa
    const legendContainer = document.createElement("div");
    legendContainer.className = "legend-container";

    const mapContainer = document.createElement("div");
    mapContainer.className = "map-container";

    if (settings.legend.position === "top") {
      this.container.appendChild(legendContainer);
      this.container.appendChild(mapContainer);
    } else if (settings.legend.position === "right") {
      const row = document.createElement("div");
      row.className = "wms-row";
      row.appendChild(mapContainer);
      row.appendChild(legendContainer);
      this.container.appendChild(row);
    } else {
      this.container.appendChild(mapContainer);
      this.container.appendChild(legendContainer);
    }

    const shapes = this.svgRenderer.render(
      mapContainer,
      settings.svgContent,
      dataMap,
      colorScale,
      settings
    );

    this.tooltipHandler.bind(shapes, tooltipMap);
    this.legendRenderer.render(legendContainer, min, max, settings.colorScale, settings.legend);

    // Cross-filter: clique em shape
    shapes.forEach(({ element, id }) => {
      const identity = this.host.createSelectionIdBuilder()
        .withCategory(dataView.categorical!.categories[0], this.getIndexForId(dataView, id))
        .createSelectionId();

      element.style.cursor = "pointer";
      element.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        this.selectionManager.select(identity, e.ctrlKey);
      });
    });

    // Clique no fundo limpa seleção
    this.container.addEventListener("click", () => {
      this.selectionManager.clear();
    });
  }

  private getIndexForId(dataView: powerbi.DataView, id: string): number {
    const cats = dataView.categorical?.categories?.[0]?.values ?? [];
    return cats.findIndex((v) => String(v) === id);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/visual.ts
git commit -m "feat: implement main Visual class orchestrating update() cycle"
```

---

## Task 10: Estilos CSS (visual.less)

**Files:**
- Modify: `wms-heatmap/style/visual.less`

- [ ] **Step 1: Substituir visual.less**

```less
.wms-heatmap {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: "Segoe UI", sans-serif;
  overflow: hidden;
  box-sizing: border-box;

  .wms-row {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
  }

  .map-container {
    flex: 1;
    overflow: hidden;
    position: relative;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  .legend-container {
    flex-shrink: 0;
  }

  .wms-legend {
    padding: 4px 8px;

    &--bottom, &--top {
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }

    &--right {
      display: flex;
      flex-direction: column;
      width: 40px;
      align-items: center;
      justify-content: center;
    }

    .legend-title {
      font-size: 11px;
      color: #333;
      margin-bottom: 2px;
    }

    .legend-bar {
      height: 12px;
      width: 100%;
      min-width: 80px;
      border-radius: 2px;
    }

    .legend-labels {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #555;
      margin-top: 2px;
    }
  }

  .add-map-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .add-map-btn {
    background: #217346;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    font-size: 14px;
    cursor: pointer;

    &:hover {
      background: #1a5c38;
    }
  }

  .add-map-hint {
    font-size: 12px;
    color: #888;
    margin: 0;
  }

  .wms-error {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c00000;
    font-size: 13px;
    text-align: center;
    padding: 16px;
    box-sizing: border-box;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add style/visual.less
git commit -m "feat: add visual styles for heatmap, legend, add-map button and error states"
```

---

## Task 11: Build e Teste Manual

- [ ] **Step 1: Executar todos os testes unitários**

```bash
npx jest
```
Expected: PASS — todos os testes de `colorScale` e `dataMapper`.

- [ ] **Step 2: Build do visual**

```bash
npm run build
```
Expected: sem erros TypeScript. Gera `dist/` com o `.pbiviz`.

- [ ] **Step 3: Iniciar servidor de desenvolvimento**

```bash
pbiviz start
```
Expected: `Server listening on port 8080`. Certificado SSL necessário na primeira vez — seguir instruções do `pbiviz` para instalar.

- [ ] **Step 4: Testar no Power BI Desktop**

1. Abrir Power BI Desktop
2. Ir em **Visualizações → (...)  → Importar visual de arquivo** → selecionar o `.pbiviz` gerado em `dist/`
3. Inserir o visual no relatório
4. Arrastar `codendereco` para o campo **Endereço WMS**
5. Arrastar uma medida para **Valor**
6. Clicar em **+ Add Map** dentro do visual
7. Selecionar o arquivo `Mapa Loja atual (2).svg`

Expected:
- Mapa renderizado com shapes coloridos pelo gradiente
- Shapes sem dados em cinza com opacidade reduzida
- Hover mostra tooltip com endereço e valor
- Legenda exibe barra de gradiente com min e max

- [ ] **Step 5: Validar cross-filter**

Clicar em um shape → outros visuais do relatório devem filtrar pelos dados daquele endereço.

- [ ] **Step 6: Gerar pacote final**

```bash
pbiviz package
```
Expected: arquivo `.pbiviz` em `dist/` pronto para publicação ou importação no Power BI Service.

- [ ] **Step 7: Commit final**

```bash
git add .
git commit -m "feat: complete wms-heatmap power bi custom visual MVP"
```

---

## Melhorias Futuras (fora de escopo do MVP)

- Escala por quantis
- Múltiplos mapas selecionáveis (Map Selector)
- SVG via URL como alternativa ao import
- Camadas por categoria
- Animação de transição entre filtros
- Suporte a SVG > 500KB via campo DAX
