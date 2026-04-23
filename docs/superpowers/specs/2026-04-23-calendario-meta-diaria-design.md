# Calendário de Meta Diária — Design Spec

## Visão geral

Custom Visual Power BI (pbiviz) que exibe um calendário mensal de acompanhamento de meta diária. Cada dia mostra faturado, objetivo, gap e % de atingimento com cores dinâmicas (verde/amarelo/vermelho). O topo exibe 4 KPI cards com acumulados e projeção de fim de mês.

## Localização do projeto

```
C:\Users\lucas.pereira\OneDrive\2_Programas\HeatMap\calendario-meta-diaria\
```

Mesmo repositório git do WMS Heatmap (`HeatMap/`), em subpasta separada. Scaffolding: `pbiviz new calendario-meta-diaria --template react`.

---

## Tokens de design

### Paleta

| Token | Hex | Uso |
|---|---|---|
| Ink | #1A1A1A | Texto principal, bordas fortes |
| Ink Muted | #6B6B68 | Labels, secundário |
| Ink Subtle | #9A9A95 | Pendente, rodapé |
| Border | #ECECEA | Divisores sutis |
| Grid Stroke | #555555 | Traçado do calendário |
| Surface | #FAFAF9 | Fundo KPI cards |
| Empty Cell | #3A3A3A | Dias fora do mês |
| OK | #16A34A | ≥ threshold bom |
| OK Soft | #F0FDF4 | Fundo célula verde |
| Warn | #D97706 | Entre thresholds |
| Warn Soft | #FFFBEB | Fundo célula amarelo |
| Bad | #DC2626 | < threshold alerta |
| Bad Soft | #FEF2F2 | Fundo célula vermelho |

### Tipografia (Segoe UI)

| Elemento | Tamanho | Peso | Cor |
|---|---|---|---|
| KPI label | 11px | 500 | Ink Muted, UPPERCASE |
| KPI valor | 30px | 600 | Ink |
| KPI sub | 12px | 400 | Ink Muted |
| Célula — dia | 15px | 600 | Ink |
| Célula — chip % | 12px | 700 | OK/Warn/Bad |
| Célula — faturado | 30px | 600 | Ink |
| Célula — obj/gap | 12px | 500/600 | Ink Muted / OK/Warn/Bad |
| Header semana | 11px | 500 | Ink Muted, UPPERCASE |

### Espaçamento

- Padding célula: `12px 14px 14px`
- Padding KPI cards: `18px 20px`
- Gap entre KPI cards: `12px`
- Border radius: KPI cards `10px`, calendário `10px`, chip % `999px`
- Altura mínima célula: `128px`
- Borda dia atual: `2px solid #1A1A1A`

---

## Data roles

| Nome | Kind | DisplayName | Descrição |
|---|---|---|---|
| `data` | Grouping | Data | Campo de data — um registro por dia |
| `faturado` | Measure | Faturado | Valor realizado do dia |
| `objetivo` | Measure | Objetivo | Meta do dia |

`dataViewMappings`: categorical, `data` como category, `faturado` e `objetivo` como values. `dataReductionAlgorithm: top 500` (suficiente para ~16 meses).

---

## Modelo de dados interno

### DayData

```ts
interface DayData {
  date: Date;
  day: number;          // 1–31
  weekday: number;      // 0=Dom … 6=Sáb
  weekOfMonth: number;  // 0-based, para indexar linhas do grid
  faturado: number | null;
  objetivo: number | null;
  gap: number | null;   // faturado - objetivo
  pct: number | null;   // faturado / objetivo (null se objetivo = 0)
  isPending: boolean;   // dia futuro sem faturado
}
```

### MonthSummary

```ts
interface MonthSummary {
  mesLabel: string;        // "Abril 2026"
  faturadoMes: number;     // soma dos dias realizados
  objetivoMes: number;     // soma dos dias realizados
  pctAcum: number;         // faturadoMes / objetivoMes
  gapMes: number;          // faturadoMes - objetivoMes
  diasRealizados: number;  // dias com faturado > 0
  projecaoMes: number;     // (faturadoMes / diasRealizados) × diasNoMes
  pctProjecao: number;     // projecaoMes / objetivoTotal
  objetivoTotal: number;   // soma de TODOS os dias do mês (incluindo futuros)
}
```

### Lógica de grid

```ts
// Primeiro dia da semana do mês (0=Dom)
const firstWeekday = new Date(year, month, 1).getDay();
// Semana do mês para um dado dia (0-based)
weekOfMonth = Math.floor((day - 1 + firstWeekday) / 7);
```

Grid tem sempre 7 colunas (Dom→Sáb). Células sem dia do mês renderizam como bloco escuro (`#3A3A3A`).

---

## Arquitetura de arquivos

```
calendario-meta-diaria/
├── src/
│   ├── visual.ts               # Entry point IVisual
│   ├── dataMapper.ts           # DataView → DayData[] + MonthSummary
│   ├── settings.ts             # Interfaces VisualSettings + parseSettings
│   ├── formattingSettings.ts   # FormattingSettingsService cards
│   ├── colorUtils.ts           # getCellBg, getChipColor, getKpiBg
│   └── components/
│       ├── CalendarRenderer.tsx  # Componente raiz React
│       ├── KPISection.tsx        # 4 cards do topo
│       ├── CalendarGrid.tsx      # Grid semanas × dias
│       └── CalendarCell.tsx      # Célula individual
├── style/
│   └── visual.less
├── capabilities.json
├── pbiviz.json
└── package.json
```

---

## Componentes React

### CalendarRenderer

Componente raiz. Recebe `days: DayData[]`, `summary: MonthSummary`, `settings: VisualSettings`. Renderiza:

```
┌─────────────────────────────────────────┐
│ KPISection (height ~110px)              │
├─────────────────────────────────────────┤
│ CalendarGrid (flex: 1, overflow hidden) │
└─────────────────────────────────────────┘
```

### KPISection

4 cards em flex-row com gap 12px:

| # | Label | Valor | Sub | Fundo |
|---|---|---|---|---|
| 1 | FATURADO NO MÊS | R$ XXXk | `X/Y dias bateram` | #FAFAF9 |
| 2 | OBJETIVO ACUMULADO | R$ XXXk | `gap ±Xk` (colorido) | #FAFAF9 |
| 3 | % ATINGIMENTO | XX% | `no mês até DD/M` | dinâmico via `getKpiBg(pct)` |
| 4 | PROJEÇÃO FIM DE MÊS | R$ XXXk | `XX% do objetivo total` | #FAFAF9 |

### CalendarGrid

```tsx
<table>
  <thead>
    <tr> DOM SEG TER QUA QUI SEX SÁB </tr>
  </thead>
  <tbody>
    {weeks.map(week => (
      <tr>
        {[0,1,2,3,4,5,6].map(wd => (
          week[wd]
            ? <CalendarCell day={week[wd]} settings={settings} />
            : <td className="empty-cell" />
        ))}
      </tr>
    ))}
  </tbody>
</table>
```

`weeks` é um array de 7-elementos por semana, construído no `DataMapper` a partir de `weekOfMonth`.

### CalendarCell

Layout interno (flex-column):

```
┌──────────────────────────────┐
│ [27]              [108% ●]   │  top row: dia + chip
│                              │
│         R$ 492               │  middle: faturado grande
│                              │
│ obj 456              +36     │  bottom: obj + gap colorido
└──────────────────────────────┘
```

Estados:
- **Realizado** (`faturado != null`): layout completo acima
- **Pendente** (`isPending = true`): dia + "PENDENTE" em Ink Subtle + "obj XXX" em Ink Subtle
- **Vazio** (sem dado, não futuro): dia + "—"
- **Hoje** (`date === today`): borda `2px solid #1A1A1A`

---

## colorUtils.ts

```ts
function getCellBg(pct: number | null, thresholdOk: number, thresholdWarn: number): string
// null → "#FFFFFF", ≥ thresholdOk → "#F0FDF4", ≥ thresholdWarn → "#FFFBEB", else → "#FEF2F2"

function getChipColor(pct: number | null, thresholdOk: number, thresholdWarn: number): string
// null → "#9A9A95", ≥ ok → "#16A34A", ≥ warn → "#D97706", else → "#DC2626"

function getKpiBg(pct: number | null, thresholdOk: number, thresholdWarn: number): string
// Retorna cor de fundo sólida (não-soft) para o card KPI de % atingimento

function formatValue(value: number): string
// value ≥ 1000 → "R$ Xk" (1 casa decimal, ex: "R$ 12,3k"), else → "R$ X" (inteiro)

function formatGap(gap: number): string
// gap > 0 → "+X", gap < 0 → "-X", gap = 0 → "+0"
```

---

## Formatação (painel Power BI)

### ThresholdsCard (`thresholds`)
- `thresholdOk`: NumUpDown, default 100 (usuário digita 100 → internamente usado como 1.0)
- `thresholdWarn`: NumUpDown, default 90 (usuário digita 90 → internamente 0.9)

> `colorUtils` converte: `pct >= thresholdOk / 100` e `pct >= thresholdWarn / 100`.

### ColorsCard (`colors`)
- `colorOk`: ColorPicker, default #16A34A
- `colorWarn`: ColorPicker, default #D97706
- `colorBad`: ColorPicker, default #DC2626

### TypographyCard (`typography`)
- `valueFontSize`: NumUpDown, default 30 (tamanho do faturado na célula)
- `cellFontSize`: NumUpDown, default 11 (obj/gap/label)

### DisplayCard (`display`)
- `showKpiCards`: ToggleSwitch, default true
- `showBorders`: ToggleSwitch, default true (grade do calendário)
- `highlightToday`: ToggleSwitch, default true

---

## Interações

- **Sem cross-filter** — visual é somente leitura, não emite seleções
- **Tooltip nativo** Power BI habilitado via `supportsHighlight: false`, `privileges: []`
- **Sem persistProperties** — nenhum estado salvo no .pbix além das configurações de formatação

---

## Tema JSON (meta-diaria-theme.json)

Arquivo entregue junto com o `.pbiviz` para o usuário importar em View → Themes:

```json
{
  "name": "Meta Diaria",
  "dataColors": ["#16A34A", "#D97706", "#DC2626", "#1A1A1A", "#6B6B68", "#9A9A95"],
  "background": "#FFFFFF",
  "foreground": "#1A1A1A",
  "tableAccent": "#555555",
  "good": "#16A34A",
  "neutral": "#D97706",
  "bad": "#DC2626"
}
```

---

## Limitações conhecidas

- **Múltiplos meses simultâneos**: o visual renderiza sempre o mês do contexto de filtro. Se não houver filtro de mês, renderiza o mês mais recente nos dados.
- **Locale**: valores formatados em pt-BR hardcoded (`R$`, `obj`, `PENDENTE`). Sem suporte a múltiplos idiomas.
- **Máximo de dados**: `dataReductionAlgorithm top 500` cobre ~16 meses de dados diários. Para datasets maiores, o usuário deve filtrar por mês/ano antes de conectar.
