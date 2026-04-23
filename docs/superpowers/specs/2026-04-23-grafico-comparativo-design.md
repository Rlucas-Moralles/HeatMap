# Gráfico Comparativo Mensal — Design Spec

## Visão geral

Custom Visual Power BI (pbiviz, template React) que compara **Ano Atual** vs **Ano Anterior** em uma série mensal, com alternância entre modo **Mês a mês** e **Acumulado**. Exibe colunas para Ano Atual, linha com marcadores para Ano Anterior, rótulos de valor em ambas as séries, pílula de % de crescimento por mês e destaques automáticos de melhor/pior mês.

Renderização SVG via componentes React. D3 é usado apenas para escalas e geometria (`scaleBand`, `scaleLinear`) — nunca para manipular o DOM. Toda a lógica de cálculo (% de crescimento, acumulado, destaques) fica em funções puras testáveis em `src/utils/`.

## Localização do projeto

```
C:\Users\lucas.pereira\OneDrive\2_Programas\HeatMap\graficocomparativo\
```

Mesmo repositório git dos demais visuais (`HeatMap/`), em subpasta separada. Scaffolding:

```bash
pbiviz new graficocomparativo --template react
```

---

## Decisões de escopo (MVP)

**No MVP:**

- Gráfico: colunas (Ano Atual) + linha com marcadores (Ano Anterior), com rótulos de valor em ambas as séries.
- Alternância **Mês a mês ↔ Acumulado** via segmented control no topo.
- Switch **Destaques** (liga selo "★ MELHOR MÊS" e "▼ PIOR MÊS" por `% de crescimento`).
- Entrada de dados: **Período** (coluna de data) + 2 medidas DAX pré-calculadas (**Ano Atual**, **Ano Anterior**).
- Eixo X cronológico único: label `"jan"` quando há 1 ano selecionado, `"jan/25"` quando há 2+ anos.
- Multi-ano com separador visual entre anos (linha vertical tracejada + faixa do ano abaixo).
- Acumulado **reinicia em janeiro** de cada ano.
- Tratamento robusto de casos especiais (÷ 0, sem base, meses faltantes, valores negativos) com defaults sensatos.
- Painel de formatação completo: cores, fontes/tamanhos individuais, grade on/off, legenda configurável.
- Localização pt-BR: vírgula decimal, ponto milhar, abreviações "mil/mi/bi".
- Tooltip via `host.tooltipService` (nativo do Power BI).
- Cross-filter via `host.selectionManager`.

**Fora do escopo (v2+):**

- Modo de eixo alternativo "agrupado por mês" (jan/25 ao lado de jan/26).
- Toggle de acumulado contínuo multi-ano (sem reiniciar em janeiro).
- Linha de tendência.
- Resumo executivo no topo/rodapé (totais, melhor mês, último disponível).
- Modos executivo/analítico.
- Tema claro/escuro customizado (além do padrão Power BI).
- Exportação para PDF / imagem (além do export nativo do Power BI).
- Estilos alternativos do Ano Anterior (área, tracejada) configuráveis pelo usuário final — ficam fixos como linha com marcadores.

---

## Data roles

| Nome interno | Kind | DisplayName | Descrição |
|---|---|---|---|
| `periodo` | Grouping | Período | Coluna de data (obrigatório). Extraímos ano/mês. |
| `valorAtual` | Measure | Ano Atual | Medida DAX do ano corrente. |
| `valorAnterior` | Measure | Ano Anterior | Medida DAX do ano anterior (típico: `SAMEPERIODLASTYEAR`). |

**`dataViewMappings`**: categorical — `periodo` como `categories`, `valorAtual` e `valorAnterior` como `values`.
**`dataReductionAlgorithm`**: `{ top: { count: 120 } }` (suporta até 10 anos = 120 meses).

---

## Modelo de dados interno

**`src/types.ts`**

```ts
// Um período = um mês de um ano
export interface PeriodData {
  date: Date;                  // 1º dia do mês (ex.: 2026-01-01)
  year: number;                // 2026
  month: number;               // 0-11 (jan = 0)
  monthName: string;           // "jan"
  anoMes: string;              // "jan/26"
  ordem: number;               // year * 12 + month → ordenação cronológica
  valorAtual: number | null;
  valorAnterior: number | null;
  selectionId: powerbi.extensibility.ISelectionId;
}

export type ChartMode = "monthly" | "accumulated";

export type GrowthStatus =
  | "positive"    // % > 0
  | "negative"    // % < 0
  | "zero"        // atual = anterior, ambos ≠ 0
  | "bothZero"    // ambos = 0
  | "new"         // anterior = 0, atual > 0 → regra configurável
  | "dropped"     // atual = 0, anterior > 0 → -100%
  | "noBase";     // anterior = null → "sem base"

export interface GrowthInfo {
  percent: number | null;      // número bruto (null quando não aplicável)
  label: string;               // texto final ("+21,8%", "Novo", "N/A", "sem base")
  status: GrowthStatus;
  tooltipNote?: string;        // mensagem amigável (quando caso especial)
}

export interface ChartRow extends PeriodData {
  displayAtual: number | null;      // = valorAtual (mensal) OU acumulado (accumulated)
  displayAnterior: number | null;   // idem
  growth: GrowthInfo;
  isBest?: boolean;
  isWorst?: boolean;
}

export interface VisualState {
  rows: ChartRow[];
  mode: ChartMode;
  showHighlights: boolean;
  years: number[];              // anos distintos presentes
  hasMultipleYears: boolean;
  hasValidData: boolean;
  errorMessage?: string;
}
```

**Decisões de modelagem:**

1. **`calcGrowth` é função pura** (`utils/growth.ts`): recebe `(atual, anterior, regraNovo)` e retorna `GrowthInfo`. Toda a lógica das 7 regras (+, -, 0, bothZero, new, dropped, noBase) concentrada em um único lugar testável.
2. **Acumulado reseta por ano** — o reducer em `useAccumulator` detecta mudança de `year` entre linhas consecutivas e zera o acumulador. Sem condicionais espalhados.
3. **`ordem = year * 12 + month`** — chave inteira de ordenação, evita parsing de string ou `Date` em hot path.
4. **`selectionId` propagado até cada `<rect>`/`<circle>`** — cross-filter funciona ao clicar na coluna ou no marcador.
5. **`errorMessage` decidido em `useChartData`** e renderizado como overlay amigável por `<App>`.

---

## Arquitetura e estrutura de arquivos

```
graficocomparativo/
├── assets/
│   └── icon.png
├── src/
│   ├── visual.tsx              # Visual class (entry Power BI); monta React root
│   ├── settings.ts             # FormattingSettings (cores, fontes, toggles)
│   ├── types.ts                # PeriodData, ChartMode, ChartRow, etc.
│   │
│   ├── components/
│   │   ├── App.tsx             # Componente raiz; orquestra tudo
│   │   ├── Header.tsx          # Título + subtítulo
│   │   ├── Controls.tsx        # Segmented "Mês/Acumulado" + Switch "Destaques"
│   │   ├── Chart.tsx           # Container SVG; calcula scales; delega children
│   │   ├── ChartAxes.tsx       # Grid + eixo X (labels) + eixo Y (ticks)
│   │   ├── ChartColumns.tsx    # <rect> Ano Atual
│   │   ├── ChartLine.tsx       # <polyline> + <circle> Ano Anterior
│   │   ├── ChartLabels.tsx     # Rótulos valor Atual + Anterior + pílula %
│   │   ├── Highlights.tsx      # Selos ★ / ▼
│   │   ├── YearDivider.tsx     # Linha tracejada + faixa de ano (multi-ano)
│   │   ├── Legend.tsx          # Legenda configurável
│   │   └── EmptyState.tsx      # Mensagens amigáveis (sem dados, faltam campos)
│   │
│   ├── hooks/
│   │   ├── useChartData.ts     # DataView → PeriodData[] + validação
│   │   ├── useAccumulator.ts   # Aplica acumulado (reset por ano)
│   │   ├── useHighlights.ts    # Identifica best/worst
│   │   └── useTooltip.ts       # Registra listeners hover com tooltipService
│   │
│   └── utils/
│       ├── growth.ts           # calcGrowth(atual, anterior, regra)
│       ├── formatters.ts       # Formatação pt-BR (mil/mi/bi, moeda, %, decimais)
│       ├── dateUtils.ts        # Parser data, hasMultipleYears, labels
│       └── scales.ts           # Helpers D3 (bandScale, linearScale)
│
├── style/
│   └── visual.less
├── tests/
│   ├── fixtures/
│   │   └── sampleData.ts       # Factories pra dados de teste
│   ├── growth.test.ts
│   ├── accumulator.test.ts
│   ├── highlights.test.ts
│   ├── formatters.test.ts
│   └── dateUtils.test.ts
├── capabilities.json
├── package.json
├── pbiviz.json
├── tsconfig.json
├── jest.config.js
└── eslint.config.mjs
```

**Princípios:**

1. **Camadas claras:** `utils/` (lógica pura) → `hooks/` (composição de estado) → `components/` (renderização) → `visual.tsx` (boundary Power BI).
2. **Componentes pequenos e focados:** cada `ChartX.tsx` renderiza uma camada SVG e é substituível isoladamente.
3. **Pure functions em `utils/`:** `calcGrowth`, `accumulate`, `formatNumber`, `parseDate`, `detectHighlights` — todos testáveis sem Power BI.
4. **D3 só pra escalas e geometria:** nada de `d3.select`/`d3.append`. React é dono do DOM.
5. **SVG pai único** em `<Chart>`; todos os filhos retornam `<g>` ou fragments.

---

## Componentes — árvore e responsabilidades

```
visual.tsx  (Power BI boundary)
│   recebe: dataView, host, formattingSettings
│   ↓ renderiza React root via ReactDOM.render
│
└── <App dataView host settings />
    │
    │   Estado local:
    │   - mode: ChartMode ← inicial do settings.controles.modoInicial
    │   - showHighlights: bool ← inicial do settings.destaques.ativar
    │
    │   Hooks (ordem):
    │   1. useChartData(dataView, settings.regraNovo) → PeriodData[]
    │   2. useMemo → useAccumulator + calcGrowth → ChartRow[] base
    │   3. useHighlights(rows, showHighlights, settings) → rows com isBest/isWorst
    │   4. useTooltip(host.tooltipService) → handlers reutilizáveis
    │
    ├── <EmptyState />                                ← se !hasValidData
    │
    ├── <Header       title subtitle settings />
    ├── <Controls     mode onModeChange showHighlights onHighlightsChange settings />
    │
    ├── <Chart rows mode scales hasMultipleYears settings>
    │   ├── <ChartAxes          scales settings rows hasMultipleYears />
    │   ├── <YearDivider        rows scales />              ← só se hasMultipleYears
    │   ├── <ChartColumns       rows scales settings
    │   │                        onClick={selectionManager} onHover={tooltipService} />
    │   ├── <ChartLine          rows scales settings onHover />
    │   ├── <ChartLabels        rows scales settings />
    │   └── <Highlights         rows scales settings />     ← só se showHighlights
    │
    └── <Legend settings mode />
```

**Estado (mode, showHighlights) vive no `App`**, não no `Controls`. Se o usuário ocultar o Controls via setting, o estado persiste com os defaults do painel. Se o Controls estiver visível, ele é um controlled component.

---

## Fluxo de dados

**Descendente (Power BI → SVG):**

```
Power BI update()
     │
     ▼
visual.tsx atualiza state { dataView, settings }
     │
     ▼
<App> recalcula hooks:
  (dataView + settings.regraNovo) → useChartData  → PeriodData[]
  (PeriodData + mode)              → useAccumulator → ChartRow[] com display*
  (ChartRow[] + settings.regraNovo)→ calcGrowth     → growth populado
  (ChartRow[] + showHighlights)    → useHighlights  → isBest / isWorst
     │
     ▼
  Calcula escalas D3 (x: bandScale de anoMes, y: linearScale de max display)
     │
     ▼
  Passa rows + scales pros filhos do <Chart>
     │
     ▼
  Cada <ChartX /> renderiza SUA camada SVG a partir de rows + scales
```

**Ascendente (eventos):**

| Evento | Origem | Destino | Ação |
|---|---|---|---|
| Clique segmented "Mês/Acumulado" | `<Controls>` | `<App>` `setMode` | `useMemo` recalcula display + growth |
| Toggle "Destaques" | `<Controls>` | `<App>` `setShowHighlights` | re-render adiciona/remove selos |
| Hover em coluna | `<ChartColumns>` | `host.tooltipService.show()` | exibe tooltip |
| Hover em marcador | `<ChartLine>` | `host.tooltipService.show()` | mesmo tooltip |
| Clique em coluna | `<ChartColumns>` | `host.selectionManager.select(id, multi)` | cross-filter |
| Clique em área vazia | `<Chart>` | `host.selectionManager.clear()` | limpa seleção |

**Re-render otimizado:**

- `useMemo` em `useAccumulator`, `useHighlights` e cálculo de escalas (depende de `rows` + `mode` + `settings.regraNovo`).
- `React.memo` em `<ChartColumns>`, `<ChartLine>`, `<ChartLabels>`, `<Highlights>` com comparação shallow de props.
- Nada recalculado em `mousemove` — tooltip recebe objeto `DataPoint` pré-construído.

---

## Tooltip — conteúdo

Via `host.tooltipService.show({ coordinates, dataItems, identities, isTouchEvent })`.

`dataItems` montado por mês, contendo:

| Campo | Origem | Formatação |
|---|---|---|
| Período | `row.anoMes` | "jan/26" ou "jan" |
| Ano Atual | `row.valorAtual` | abrev. auto (mi/bi) + pt-BR |
| Ano Anterior | `row.valorAnterior` | idem |
| Diferença absoluta | `valorAtual - valorAnterior` | com sinal |
| Crescimento | `row.growth.label` | já formatado |
| Acumulado Ano Atual | `row.displayAtual` | só se `mode === "accumulated"` |
| Acumulado Ano Anterior | `row.displayAnterior` | só se `mode === "accumulated"` |
| Observação | `row.growth.tooltipNote` | só se presente (caso especial) |

---

## Capabilities — painel de formatação

14 cards em 3 abas:

### Aba "Visual"

1. **Título** — texto, fonte, tamanho, cor, peso (normal/negrito), alinhamento (esq/centro/dir)
2. **Subtítulo** — texto, fonte, tamanho, cor, alinhamento
3. **Controles superiores**
   - Mostrar seletor "Mês a mês | Acumulado" (toggle, default `true`)
   - Modo inicial (enum: "Mês a mês" | "Acumulado", default "Mês a mês")
   - Mostrar switch "Destaques" (toggle, default `true`)
4. **Série — Ano Atual** — cor (default `#2563EB`), raio dos cantos (0-8px, default 3), largura relativa (0.4-0.9, default 0.7)
5. **Série — Ano Anterior** — cor (default `#94A3B8`), espessura da linha (1-4px, default 2), tamanho do marcador (2-8px, default 4), opacidade (0-1, default 1)
6. **Rótulos de valor**
   - Mostrar Atual (toggle, default `true`)
   - Mostrar Anterior (toggle, default `true`)
   - Fonte + tamanho Atual (default 13px / 700)
   - Cor rótulo Atual (default `#1E3A8A`)
   - Fonte + tamanho Anterior (default 11px / 500)
   - Cor rótulo Anterior (default `#6B6B68`)
   - Casas decimais (0-4, default 1)
   - Abreviação (enum: "nenhuma" | "mil" | "mi" | "bi" | "auto", default "auto")
7. **% de crescimento**
   - Mostrar (toggle, default `true`)
   - Estilo (enum: "pílula" | "texto", default "pílula")
   - Cor positiva (default `#047857`) — sobre fundo `#D1FAE5`
   - Cor negativa (default `#B91C1C`) — sobre fundo `#FEE2E2`
   - Cor neutra (default `#6B6B68`) — sobre fundo `#E5E7EB`
   - Cor sem base (default `#9A9A95`)
   - Fonte + tamanho (default 11px / 700)
   - Casas decimais (0-2, default 1)

   **Mapeamento `GrowthStatus` → cor:**

   | Status | Cor usada |
   |---|---|
   | `positive` | Cor positiva |
   | `negative`, `dropped` | Cor negativa |
   | `zero`, `bothZero` | Cor neutra |
   | `new`, `noBase` | Cor sem base |
8. **Destaques**
   - Ativar (toggle, default `false`)
   - Cor melhor (default `#F59E0B`)
   - Cor pior (default `#DC2626`)
   - Estilo (enum: "borda tracejada" | "fundo suave" | "selo com ícone", default "borda tracejada")
9. **Legenda** — mostrar (default `true`), posição (topo/base/esq/dir, default "base"), fonte + tamanho, cor

### Aba "Eixos e grade"

10. **Eixo X** — mostrar (default `true`), fonte + tamanho (default 11px), cor (default `#4B5563`)
11. **Eixo Y** — mostrar (default `true`), mínimo (auto/número, default "auto"), máximo (auto/número, default "auto"), unidade (enum: "nenhuma" | "mil" | "mi" | "bi" | "auto", default "auto"), fonte + tamanho, cor (default `#9A9A95`)
12. **Grade** — linhas horizontais (toggle, default `true`), linhas verticais (toggle, default `false`), cor (default `#ECECEA`), estilo (sólida/tracejada, default "tracejada"), espessura (0.5-2px, default 1)

### Aba "Geral"

13. **Fundo** — cor (default transparente)
14. **Regra para Ano Anterior = 0** — enum: "Novo" (default) | "N/A" | "100%+" | "Ocultar"

**Observações técnicas:**

- Todos os valores `color` usam `colorPicker` do Power BI (respeita temas).
- Todos os `font` + `fontSize` usam controle padrão (família + tamanho + peso num único composite).
- Cards seguem API `powerbi-visuals-utils-formattingmodel` v6.x.
- `settings.ts` oculta sub-configurações de "Destaques" quando `ativar: false` (padrão do Power BI).

---

## Tratamento de casos especiais

### Cálculo do % — `calcGrowth(atual, anterior, regraNovo)`

| Condição | Status | Label | `tooltipNote` |
|---|---|---|---|
| `atual > 0` e `anterior > 0` e `atual > anterior` | `positive` | `"+X,X%"` | — |
| `atual < anterior` (ambos não-zero) | `negative` | `"-X,X%"` | — |
| `atual === anterior` (ambos não-zero) | `zero` | `"0%"` | — |
| `atual === 0` e `anterior === 0` | `bothZero` | `"0%"` | — |
| `anterior === 0` e `atual > 0`, regra = "Novo" | `new` | `"Novo"` | `"Sem base no ano anterior"` |
| `anterior === 0` e `atual > 0`, regra = "N/A" | `new` | `"N/A"` | `"Sem base no ano anterior"` |
| `anterior === 0` e `atual > 0`, regra = "100%+" | `new` | `"100%+"` | `"Sem base no ano anterior"` |
| `anterior === 0` e `atual > 0`, regra = "Ocultar" | `new` | `""` | `"Sem base no ano anterior"` |
| `atual === 0` e `anterior > 0` | `dropped` | `"-100,0%"` | — |
| `anterior === null/undefined` | `noBase` | `"sem base"` | `"Comparação indisponível"` |
| Valores negativos | calcula normal com sinal | ex.: `"+50,0%"` (perda reduziu) | — |

### Meses faltantes

- Mês presente em uma série e ausente em outra → renderiza o que existe. Rótulo do que falta é omitido; pílula do % recebe status `noBase`.
- Valores `null` no acumulado: tratados como 0 para somatório, mas o rótulo de exibição permanece `null` (não aparece).
- Agrupa múltiplos registros do mesmo (ano, mês) somando os valores (assume-se que medida não duplica; se duplicar, soma é o comportamento seguro).

### Acumulado multi-ano

Reseta o acumulador quando `row.year !== previousRow.year`. Primeiro mês de cada ano = valor bruto daquele mês.

---

## Estados de erro e vazios — `<EmptyState />`

```tsx
interface EmptyStateProps {
  variant: "missing-fields" | "empty-data" | "partial-fields" | "invalid-data" | "too-small";
  message: string;
}
```

| Variant | Quando | Mensagem |
|---|---|---|
| `missing-fields` | Nenhum campo arrastado | "Arraste os campos **Período**, **Ano Atual** e **Ano Anterior** para começar." |
| `partial-fields` | Faltam 1 ou 2 campos | "Arraste também **[campos faltantes]** para comparar." |
| `empty-data` | DataView vem vazio após filtro | "Sem dados no período selecionado. Ajuste os filtros do relatório." |
| `invalid-data` | Período não é data ou valores não numéricos | "Os campos não estão em formato válido. Verifique: Período = coluna de data, Valores = medidas numéricas." |
| `too-small` | Largura < 240px ou altura < 160px | "Amplie o visual para ver o gráfico." |

**Container estreito (240-400px):** renderiza gráfico normalmente, mas **auto-oculta rótulos de valor e % de crescimento**. Tooltip continua funcionando. Sem mensagem de erro.

**Estilo do `<EmptyState />`:**

- Centralizado vertical e horizontal no container.
- Texto cor `#6B6B68`, fonte 13px, `max-width: 280px`, `text-align: center`.
- Ícone SVG pequeno acima do texto (estilo line, não filled).
- Sem botões de ação — é informativo apenas.

---

## Testes

**Framework:** Jest + ts-jest (mesmo preset do wms-heatmap).

**Filosofia:** testar funções puras em `utils/` e transformações em `hooks/` com alta cobertura. Componentes React renderizadores não têm testes automatizados — validação visual no browser e no Power BI Desktop.

### `tests/growth.test.ts`

| Caso | Input | Esperado |
|---|---|---|
| Crescimento | (120, 100) | `percent: 0.2, status: "positive", label: "+20,0%"` |
| Queda | (80, 100) | `percent: -0.2, status: "negative", label: "-20,0%"` |
| Estável | (100, 100) | `status: "zero", label: "0%"` |
| Ambos zero | (0, 0) | `status: "bothZero", label: "0%"` |
| Novo (regra="Novo") | (50, 0) + "Novo" | `status: "new", label: "Novo"` |
| Novo (regra="N/A") | (50, 0) + "N/A" | `label: "N/A"` |
| Novo (regra="100%+") | (50, 0) + "100%+" | `label: "100%+"` |
| Novo (regra="Ocultar") | (50, 0) + "Ocultar" | `label: ""` |
| Caiu a zero | (0, 50) | `percent: -1, status: "dropped", label: "-100,0%"` |
| Sem base | (50, null) | `status: "noBase", label: "sem base"` |
| Negativos ambos | (-10, -20) | `percent: 0.5, status: "positive"` |

### `tests/accumulator.test.ts`

- Single-year 6 meses → 6º valor = Σ (6 meses)
- Multi-year completo → reinicia em janeiro de cada ano
- Ano parcial (jan-jun) → acumula apenas meses presentes
- Mês faltante (jan, fev, abr; sem mar) → acumulado em abr = jan+fev+abr
- `null` tratado como 0 no cálculo, mas rótulo permanece `null`

### `tests/highlights.test.ts`

- Melhor por %: máximo `growth.percent` entre status `positive | negative | zero`
- Pior por %: mínimo nas mesmas categorias
- Ignora `noBase` e `new` (entram como null → não comparam)
- Empate: marca todos (`isBest` pode ser true em múltiplas linhas)
- Array vazio ou 1 item → não quebra, não marca

### `tests/formatters.test.ts`

- `formatNumber(24_600_000, { abbr: "mi", decimals: 1 })` → `"24,6 Mi"`
- `formatNumber(2_300_000_000, { abbr: "bi", decimals: 1 })` → `"2,3 Bi"`
- `formatNumber(1234, { abbr: "auto" })` → `"1,23 Mil"`
- `formatPercent(0.298, { decimals: 1, sign: "always" })` → `"+29,8%"`
- `formatPercent(-0.15)` → `"-15,0%"`
- Separador decimal `","`, milhar `"."` (padrão pt-BR do CLAUDE.md)

### `tests/dateUtils.test.ts`

- Ordenação: `[mar/26, jan/25, fev/26]` → `[jan/25, fev/26, mar/26]` por `ordem`
- Label 1 ano selecionado → `"jan"`, `"fev"`...
- Label 2+ anos → `"jan/25"`, `"fev/25"`, `"jan/26"`
- `hasMultipleYears`: `Set(row.year).size > 1`

**Cobertura alvo:**

- `utils/*` → **≥ 95%**
- `hooks/*` → **≥ 80%**
- `components/*` → **0%** (não testado)

**Setup:**

- `jest.config.js` copiado do wms-heatmap, ajustando `testMatch`.
- Fixtures em `tests/fixtures/sampleData.ts` com factories (gera DataView mock ou PeriodData[] direto).

---

## Tokens de design visual (referência)

Para manter consistência visual com o mockup aprovado:

| Token | Hex | Uso |
|---|---|---|
| Ink | `#1A1A1A` | Texto principal, títulos |
| Ink Muted | `#6B6B68` | Labels secundárias, eixos |
| Ink Subtle | `#9A9A95` | Ticks do eixo Y, rodapé |
| Border | `#ECECEA` | Grade horizontal |
| Grid Stroke | `#D1D5DB` | Linha base do eixo X |
| Surface | `#FAFAF9` | Fundo de card |
| Ano Atual | `#2563EB` | Colunas Ano Atual |
| Ano Atual Dark | `#1E3A8A` | Rótulos de valor Ano Atual |
| Ano Anterior | `#94A3B8` | Linha e marcadores Ano Anterior |
| OK | `#047857` | % positivo (texto) |
| OK Soft | `#D1FAE5` | % positivo (fundo da pílula) |
| Bad | `#B91C1C` | % negativo (texto) |
| Bad Soft | `#FEE2E2` | % negativo (fundo da pílula) |
| Highlight Best | `#F59E0B` | Borda destaque melhor mês |
| Highlight Worst | `#DC2626` | Borda destaque pior mês |
| Year Divider | `#9A9A95` | Linha tracejada entre anos |

**Tipografia (Segoe UI):**

| Elemento | Tamanho | Peso | Cor |
|---|---|---|---|
| Título | 18px | 700 | Ink |
| Subtítulo | 12px | 400 | Ink Muted |
| Rótulo valor Atual | 13px | 700 | Ano Atual Dark |
| Rótulo valor Anterior | 11px | 500 | Ink Muted |
| Pílula % | 11px | 700 | OK / Bad / Ink Muted |
| Selo destaque | 9px | 700 | Highlight Best/Worst |
| Eixo X | 11px | 500 | `#4B5563` |
| Eixo Y | 10px | 400 | Ink Subtle |
| Legenda | 12px | 400 | Ink Muted |
| Faixa de ano | 11px | 700 | Ink |

**Espaçamento:**

- Padding container: `24px`
- Padding entre controls: `14px`
- Altura mínima de renderização: `160px`
- Largura mínima de renderização: `240px`
- Border radius: cards/container `10px`, colunas `3px` (configurável), pílula `999px`

---

## Localização pt-BR

Padrão do CLAUDE.md:

- Decimal: vírgula `,`
- Milhar: ponto `.`
- Datas no tooltip: `dd/mm/aaaa` ou nome do mês/ano (`"jan/26"`)
- Labels e mensagens em português

---

## Dependências

```json
{
  "dependencies": {
    "d3": "^7.9.0",
    "powerbi-visuals-api": "~5.3.0",
    "powerbi-visuals-utils-dataviewutils": "^6.1.0",
    "powerbi-visuals-utils-formattingmodel": "6.0.4",
    "powerbi-visuals-utils-tooltiputils": "^6.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/d3": "^7.4.3",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.2",
    "typescript": "^5.0.0"
  }
}
```

D3 só é usado em `utils/scales.ts` (wrappers de `scaleBand` / `scaleLinear`) — não é dependência crítica, mas evita reinventar escalas.
