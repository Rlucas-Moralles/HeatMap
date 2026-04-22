# Prompt — Criar Visual Customizado para Power BI estilo Synoptic com Mapa de Calor por Endereço WMS

Quero que você atue como um **desenvolvedor sênior de visuais customizados para Power BI**, com domínio em:

* **Power BI Custom Visual SDK**
* **TypeScript**
* **D3.js / SVG / Canvas**
* **Renderização de mapas e layouts interativos**
* **UX/UI para dashboards analíticos**
* **Performance para grandes volumes de dados**
* **Boas práticas de cross-filter, tooltips e seleção no Power BI**
* **Modelagem de dados para operações logísticas e WMS**

## Objetivo do projeto

Criar um **visual customizado para Power BI**, inspirado conceitualmente no **Synoptic Panel**, porém com foco em **endereços WMS numéricos**.

O visual deverá funcionar como um **mapa de calor por posições logísticas**, onde:

* o usuário irá informar uma **coluna de endereço WMS**
* o usuário irá informar uma **medida ou coluna numérica de quantidade**
* o visual deverá posicionar cada endereço dentro de um **layout de mapa/armazém**
* o visual deverá exibir um **ponto, célula ou posição visual para cada endereço WMS**
* sobre cada posição deverá aparecer o **valor da quantidade**
* cada endereço deverá receber uma **cor em degradê**, baseada na intensidade do valor
* o degradê deve ser calculado automaticamente com base no **menor e maior valor da seleção atual**
* o comportamento visual deve remeter a um **heatmap**, mas mantendo cada endereço individualmente identificado

---

## Conceito funcional esperado

O visual deve unir a lógica de:

* **leitura de endereços WMS numéricos**
* **mapeamento visual das posições do armazém**
* **plotagem de pontos, células ou blocos por endereço**
* **rotulagem com valor**
* **escala de cor contínua**
* **interatividade típica do Power BI**

A ideia é que o usuário veja claramente:

1. **quais endereços WMS existem na seleção**
2. **qual é a quantidade de cada endereço**
3. **quais endereços têm valores mais baixos ou mais altos**
4. **um gradiente visual do menor para o maior valor**
5. **a distribuição da ocupação, estoque, separação ou movimentação dentro do layout logístico**

---

## Estrutura mínima dos dados

O visual deverá aceitar, no mínimo, os seguintes campos:

### Campo obrigatório 1: Endereço WMS

Campo textual ou numérico contendo o endereço logístico.

Exemplos:

* `010101`
* `010102`
* `020305`
* `030110`
* `040215`

Esses endereços representam posições internas do WMS, e **não endereços geográficos/postais**.

O visual deve tratar esse campo como uma **localização lógica no armazém**, normalmente composta por códigos numéricos que podem representar, por exemplo:

* rua
* módulo
* nível
* apartamento
* bloco
* coluna
* posição

### Campo obrigatório 2: Quantidade

Campo numérico ou medida agregada.

Exemplos:

* quantidade em estoque
* quantidade de caixas
* quantidade de pallets
* número de SKUs
* número de movimentações
* volume expedido
* quantidade separada
* qualquer métrica numérica

### Campo opcional 3: Categoria

Campo textual para segmentação, legenda ou agrupamento futuro.

Exemplos:

* tipo de produto
* zona do armazém
* curva ABC
* status do endereço
* família logística

### Campo opcional 4: Tooltip adicional

Campos extras para aparecer no tooltip.

Exemplos:

* descrição do produto
* ocupação
* rua
* nível
* setor
* operador
* status da posição

---

## Regras de negócio

### 1. Interpretação do endereço WMS

O visual deve tratar o endereço WMS como uma **chave de posição interna**.

Regras:

* não usar geocodificação de endereço postal
* não depender de mapa geográfico externo
* o posicionamento visual será baseado em **layout lógico ou grade interna**
* o sistema deve permitir interpretar o endereço numérico para definir posição visual
* se necessário, decompor o endereço em partes para montagem do layout

Exemplo conceitual:

* `01 01 01` → Rua 01 / Módulo 01 / Nível 01
* `02 03 05` → Rua 02 / Módulo 03 / Nível 05

Se o padrão do endereço não puder ser decomposto automaticamente, prever uma forma de usar o endereço bruto como chave de posicionamento.

### 2. Agregação

Se houver múltiplos registros para o mesmo endereço WMS:

* agrupar por endereço
* somar a quantidade, salvo se a medida do Power BI já vier agregada
* garantir consistência entre posição exibida e valor mostrado

### 3. Escala de cor

O visual deve calcular automaticamente:

* menor valor da seleção atual
* maior valor da seleção atual

A partir disso, aplicar uma escala contínua de cor em degradê.

Exemplo:

* menor valor = cor mais fria / clara
* maior valor = cor mais quente / intensa

A escala deve ser dinâmica conforme:

* filtros
* segmentações
* cross-filter do Power BI

### 4. Exibição do valor

Cada posição do mapa deve mostrar visualmente o valor da quantidade.

Regras:

* exibir o valor sobre a célula, bloco ou ponto
* evitar sobreposição excessiva
* permitir configuração de tamanho da fonte
* permitir ligar/desligar rótulos
* se houver muitos endereços, prever estratégia de zoom, redução de labels ou exibição inteligente

### 5. Interatividade

O visual deve suportar:

* clique na posição
* seleção de uma ou múltiplas posições
* cross-filter com outros visuais do relatório
* hover com tooltip
* destaque visual da posição selecionada

### 6. Tooltip

Ao passar o mouse em uma posição, mostrar:

* endereço WMS
* quantidade
* decomposição do endereço, se aplicável
* outros campos opcionais enviados ao visual

### 7. Legenda

O visual deve exibir legenda da escala de cor:

* valor mínimo
* valor máximo
* faixa intermediária
* indicação visual clara do degradê

---

## Comportamento visual esperado

Quero um visual com aparência profissional, limpa e analítica.

### O layout deve:

* representar visualmente o armazém, grade logística ou mapa de posições
* organizar os endereços de forma coerente
* permitir visualização rápida das zonas quentes e frias
* ajustar automaticamente a distribuição visual conforme os dados disponíveis
* permitir zoom manual, se viável

### As posições devem:

* ter cor baseada na intensidade do valor
* ter tamanho configurável
* ter borda configurável
* ter opacidade configurável
* exibir o número da quantidade

### O degradê deve:

* ser calculado automaticamente
* funcionar com escala linear
* opcionalmente permitir escala por quantis ou faixa personalizada no futuro

---

## Painel de formatação esperado no Power BI

Criar opções de formatação para o usuário configurar:

### Layout

* tipo de disposição visual
* grade automática on/off
* orientação horizontal/vertical
* espaçamento entre células
* cor do fundo
* mostrar ou ocultar linhas/guias

### Posições

* tamanho mínimo
* tamanho máximo
* transparência
* borda
* cor padrão de fallback
* raio da célula/bloco/ponto

### Escala de cor

* cor mínima
* cor intermediária
* cor máxima
* modo linear
* modo por faixas
* inverter escala

### Rótulos

* mostrar rótulos sim/não
* tamanho da fonte
* cor da fonte
* posição do rótulo
* formato numérico
* casas decimais

### Tooltip

* habilitar/desabilitar
* customizar campos exibidos

### Legenda

* mostrar legenda
* posição da legenda
* título da legenda
* formatação de texto

---

## Requisitos técnicos

### Plataforma

Desenvolver como **Power BI Custom Visual**.

### Linguagem

* TypeScript

### Bibliotecas sugeridas

* D3.js para manipulação visual
* SVG para renderização principal
* Canvas como alternativa para grandes volumes, se necessário

### Estrutura

Gerar:

* `capabilities.json`
* `pbiviz.json`
* `settings.ts`
* `visual.ts`
* classes auxiliares organizadas
* comentários no código
* arquitetura clara e escalável

---

## Requisitos de performance

O visual deve ser pensado para uso corporativo.

### Considerações:

* evitar processamento repetido do mesmo endereço WMS
* implementar cache de parsing/interpretação do endereço
* minimizar rerenderizações desnecessárias
* tratar volumes maiores de dados
* prever estratégia para muitos endereços na tela
* evitar travamentos no Power BI Desktop e Service

---

## Tratamento de erros

O visual deve tratar corretamente:

* endereço WMS vazio
* quantidade nula
* endereço em formato inválido
* padrão não reconhecido
* ausência de dados
* excesso de registros
* duplicidades

Em vez de quebrar, o visual deve exibir mensagens amigáveis como:

* “Nenhum dado encontrado”
* “Endereços WMS insuficientes para montagem do layout”
* “Parte dos endereços não pôde ser interpretada”
* “Reduza a quantidade de posições ou aplique filtros”

---

## Requisitos de UX

Quero um visual com experiência semelhante a produto de mercado.

### O visual deve ser:

* intuitivo
* limpo
* responsivo ao tamanho do container
* agradável visualmente
* fácil de configurar no painel de formatação
* aderente ao padrão de navegação do Power BI

---

## Entregáveis esperados da sua resposta

Quero que você entregue:

### 1. Arquitetura da solução

Explique como o visual será construído.

### 2. Estrutura dos arquivos

Mostre a organização completa do projeto.

### 3. Código inicial funcional

Gere o código-base do visual.

### 4. `capabilities.json`

Defina corretamente os data roles:

* endereço WMS
* quantidade
* categoria opcional
* tooltip opcional

### 5. Lógica de renderização

Implemente a lógica para:

* ler dados do Power BI
* processar endereços WMS
* interpretar e posicionar cada endereço
* calcular mínimo e máximo
* gerar escala de cor
* renderizar posições
* exibir quantidade em cada posição

### 6. Configurações formatáveis

Implemente as principais opções de formatação.

### 7. Estratégia de cache

Explique e implemente um modelo de cache simples para endereços WMS.

### 8. Melhorias futuras

Liste evoluções futuras, como:

* clustering visual
* heatmap real por densidade
* suporte a múltiplas zonas
* leitura de layout externo
* uso de SVG de planta do armazém
* camadas por categoria
* animações
* filtros por faixa de valor

---

## Diretrizes importantes

* Não entregue resposta superficial
* Não simplifique demais
* Não foque só em teoria
* Gere uma solução técnica com profundidade
* Comente os trechos importantes do código
* Pense em algo utilizável em ambiente corporativo
* Caso existam limitações do Power BI Custom Visual, deixe isso explícito
* Se necessário, proponha alternativas técnicas realistas

---

## Observações importantes de negócio

Esse visual deve ser pensado para usuários de negócio que querem:

* jogar uma coluna de endereço WMS
* jogar uma medida de quantidade
* ver as posições automaticamente
* identificar rapidamente os locais com maior e menor intensidade
* enxergar o valor diretamente sobre cada posição
* usar esse visual em dashboards operacionais, logísticos e de armazenagem

---

## Resultado final esperado

O resultado esperado é um **visual customizado de Power BI**, no estilo de uso simples do Synoptic Panel, porém orientado a **endereços WMS numéricos**, com:

* posições em layout logístico
* valor exibido por posição
* cor por intensidade
* degradê entre mínimo e máximo
* legenda
* tooltip
* seleção e integração com o Power BI
