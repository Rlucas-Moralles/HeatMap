# WMS Heatmap — Power BI Custom Visual
**Data:** 2026-04-22
**Projeto:** HeatMap (`C:\Users\lucas.pereira\OneDrive\2_Programas\HeatMap`)

---

## Objetivo

Criar um visual customizado para Power BI que funciona como o Synoptic Panel, porém focado em **endereços WMS**. O usuário importa um SVG (planta do armazém/loja criada no Synoptic Designer) diretamente dentro do visual. Cada shape SVG cujo `id` bate com um endereço WMS recebe uma cor em degradê baseada no valor da medida configurada.

---

## Campos de Dados (capabilities)

| Campo | Nome interno | Tipo | Obrigatório | Descrição |
|---|---|---|---|---|
| Endereço | `codendereco` | Categórico | Sim | Chave que bate com o `id` dos shapes no SVG. Aceita string ou numérico (até 8 chars). |
| Valor | `value` | Medida numérica | Sim | Define a cor do shape na escala de gradiente. |
| Tooltips | `tooltips` | Categórico/Numérico | Não | Campos extras exibidos no hover. |

---

## Arquitetura

### Fluxo de renderização

```
update(options)
  │
  ├─ dataMapper.process()     → Map<svgId, valor>
  ├─ svgRenderer.render()     → injeta SVG, localiza shapes por id
  ├─ colorScale.apply()       → calcula min/max, aplica fill em cada shape matched
  ├─ legendRenderer.draw()    → barra de gradiente + rótulos min/max
  └─ tooltipHandler.bind()    → eventos de hover nos shapes
```

### Armazenamento do SVG

O SVG é salvo dentro do `.pbix` via `host.persistProperties()`:

```ts
host.persistProperties({
  merge: [{
    objectName: "mapSettings",
    properties: { svgContent: svgText }
  }]
});
```

Limite prático: ~500KB de SVG. SVGs maiores precisam ser simplificados no Synoptic Designer antes da importação.

### Botão "+ Add Map"

Quando `svgContent` está vazio, o visual exibe o botão. Ao clicar:
1. Cria `<input type="file" accept=".svg">` programaticamente
2. `FileReader.readAsText()` lê o arquivo localmente (sem upload para servidor)
3. Conteúdo salvo via `persistProperties` → Power BI chama `update()` automaticamente

---

## Estrutura de Arquivos

```
wms-heatmap/
├── capabilities.json
├── pbiviz.json
├── package.json
├── tsconfig.json
└── src/
    ├── visual.ts           # Classe principal, orquestra update()
    ├── settings.ts         # Interfaces das opções de formatação
    ├── dataMapper.ts       # DataView → Map<id, valor>
    ├── colorScale.ts       # D3 scaleLinear, min/max, cor por valor
    ├── svgRenderer.ts      # Parse SVG, inject no DOM, colorir shapes
    ├── tooltipHandler.ts   # Hover events, formatar tooltip PBI
    ├── legendRenderer.ts   # Barra de gradiente + labels
    └── mapLoader.ts        # Botão Add Map, FileReader, persistProperties
```

---

## Painel de Formatação

### Escala de Cor
- **Cor mínima** (Color): `#d4e9ff` (azul claro)
- **Cor máxima** (Color): `#c00000` (vermelho)
- **Cor sem match** (Color): `#cccccc` (cinza)
- **Inverter escala** (Toggle): Off

### Rótulos
- **Mostrar rótulos** (Toggle): On
- **Tamanho da fonte** (Número): 10
- **Cor da fonte** (Color): `#ffffff`
- **Formato numérico** (Enum): Inteiro | Decimal | Automático

### Legenda
- **Mostrar legenda** (Toggle): On
- **Posição** (Enum): Inferior | Superior | Direita
- **Título** (Texto): vazio por padrão

### Mapa
- **Opacidade shapes sem dado** (0–100%): 30%
- **Bordas visíveis** (Toggle): On
- **Cor da borda** (Color): `#ffffff`

---

## Comportamento Visual

| Situação | Comportamento |
|---|---|
| Shape com id que bate nos dados | Recebe `fill` da escala + rótulo com valor |
| Shape sem match nos dados | Cor de fallback com opacidade reduzida |
| Clique em shape | Cross-filter via `selectionManager.select()` |
| Ctrl+clique | Seleção múltipla |
| Hover | Tooltip: endereço + valor + campos extras |
| Redimensionamento do container | SVG escala via `viewBox`, proporções preservadas |

---

## Tratamento de Erros

| Situação | Mensagem exibida |
|---|---|
| Sem SVG importado | Botão "+ Add Map" |
| Sem dados (dataView vazio) | SVG renderizado com todos shapes em fallback |
| SVG inválido/corrompido | "SVG inválido. Reimporte o mapa." |
| ID no SVG sem nenhum match | Shape fica em fallback silenciosamente |

---

## Melhorias Futuras (fora de escopo do MVP)

- Escala por quantis ou faixas personalizadas
- Múltiplos mapas selecionáveis (Map Selector)
- SVG via URL pública como alternativa ao import
- Clustering visual para muitos endereços
- Camadas por categoria (zonas do armazém)
- Animação de transição ao mudar filtros
- Suporte a SVG maior que 500KB via campo de dado DAX
