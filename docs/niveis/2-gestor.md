# Nível 2 · Gestor / Observatório

> Lê o que os outros sete níveis produzem. **Escrita: nenhuma.** É o único nível sem verbo.

| | |
|---|---|
| Superfície | Observatório |
| Rota-raiz | `/observatorio` |
| Funcionalidades | 7 — de 101 a 107, mais a 169 |
| Telas | G1 a G8, **as 8 construídas** |
| Escreve | **nada** |
| Lê | agregado de todas as classes, inclusive `repertorio` anonimizado |
| Carimba | nada — e é por isso que pode ler o que lê |

---

## 1. O que este nível é

O Gestor é a prova de que a plataforma sabe o que tem. Não é um painel de vaidade: cada tela
existe para responder uma pergunta que o RFP faz e que só um grafo com procedência consegue
responder — **quanto do acervo é máquina, quanto é instituição, quanto é gente**.

O nível não escreve nada, e isso é decisão de projeto, não limitação. Um leitor que também
edita contamina o próprio indicador. Como o Gestor não tem verbo, ele pode receber o agregado
de `pessoa-usuaria` e `repertorio` — os dados mais sensíveis do produto — sem que exista
caminho técnico entre ver o número e mexer na pessoa.

A regra que atravessa as oito telas é a mesma que atravessa o produto: **ausência é declarada,
com denominador.** Nunca "sem dados"; sempre "2.702 de 7.810 não declararam". Um painel que
esconde o que não sabe é o oposto do que o Observatório existe para fazer.

## 2. O que ele lê

| Camada | O que enxerga |
|---|---|
| Todas as 20 classes | contagem, cobertura, frescor |
| `procedencia` | as três fatias — `ic`, `derivado`, `autorado` — nós e arestas |
| `repertorio` | **agregado e anonimizado** (funcionalidade 76), nunca a pessoa |
| `situado_em` | densidade por UF, com `total` e `entidadesDistintas` em campos separados |
| Decisões de moderação | tempo de fila e concordância, por escopo |

## 3. As funcionalidades, uma a uma

### 101 · Dashboards por público (→ 71)
**Tela G1 —** `/observatorio`

Quatro leituras do mesmo grafo: editorial, produto, parceiro, institucional. A mesma medida
muda de sentido conforme quem pergunta — a tela não fabrica quatro números, ela recorta um.

### 102 · KPIs de produto (→ 72)
**Tela G2 —** `/observatorio/produto`

Aquisição, engajamento, descoberta e retenção. **Descoberta é o KPI próprio deste produto:**
quantas pessoas chegaram a algo que não procuraram e ficaram. É o que separa este painel de um
analytics genérico.

### 103 · Impacto cultural lido de `repertorio`, não de analytics (→ 73)
**Tela G3 —** `/observatorio/impacto`

Ampliação de repertório, novos artistas alcançados, diversidade de linguagem. A fonte é a classe
`repertorio` — o que a pessoa marcou como "eu fui" e o que atravessou —, não o clique. Hoje o
protótipo tem **3 instâncias de `repertorio`**, e a tela diz isso em vez de extrapolar.

### 104 · Indicadores territoriais e mapa de desertos (→ 74)
**Tela G4 —** `/observatorio/territorio`

Densidade por unidade da federação e a camada de deserto — onde não há oferta. O número que a
tela precisa dizer com cuidado: **59,2% de 773 registros de `situado_em` estão em 2 dos 27
estados**, e por trás desses 773 registros há **718 entidades distintas**, porque uma entidade
pode estar situada em mais de um território. Fundir os dois faria a tela afirmar mais
concentração do que o acervo tem. `densidadePorUf()` devolve `total` e `entidadesDistintas`
separados justamente para isso.

### 105 · Painel de procedência com as três fatias contadas
**Tela G5 —** `/observatorio/procedencia`

| | `ic` | `derivado` | `autorado` |
|---|---:|---:|---:|
| Nós | 4.826 | 2.937 | 47 |
| Arestas | 14.882 | 51.600 | 81 |

**78% do grafo é máquina.** Esta é a tela em que a proposta se mede: o número não é defeito do
protótipo, é a descrição exata do que os níveis 1 a 7 existem para inverter. Cada publicação de
produtor, cada aresta assinada por editor, cada decisão de moderador move esta tabela **sem
ninguém tocar em código**.

### 106 · Ausência declarada com denominador
**Tela G6 —** `/observatorio/ausencia`

| Medida | |
|---|---|
| Ficha de acessibilidade | 5.108 declaram · **2.702 não** |
| Eventos que declaram ingresso | **0 de 300** |
| Ocorrências com espaço declarado | **0 de 2.425** |
| Eventos datados com artista vinculado | **0 de 129** |
| Componentes da chave de identidade sustentados | **1 de 3** |
| Faixa etária | **campo não existe** no tipo |

Nenhuma dessas linhas é uma falha a esconder. São o mapa do trabalho dos níveis 6 e 7, e a
única tela do produto que fica **melhor** quanto pior for o número inicial.

### 107 · Exportação versionada e dados abertos (→ 75)
**Tela G7 —** `/observatorio/dados`

O recorte que sai leva versão e data. Dado aberto sem versão vira citação impossível de
reproduzir seis meses depois.

### 169 · Desempenho da moderação
**Tela G8 —** `/observatorio/moderacao`

Tempo de fila e concordância entre moderadores, por escopo. Aqui é indicador; em
`/admin/moderacao` a mesma medida é operação. O Gestor pergunta se a governança está funcionando;
o Admin pergunta quem precisa de reforço.

## 4. As telas

| Código | Rota | O que resolve |
|---|---|---|
| G1 | `/observatorio` | 101 |
| G2 | `/observatorio/produto` | 102 |
| G3 | `/observatorio/impacto` | 103 |
| G4 | `/observatorio/territorio` | 104 |
| G5 | `/observatorio/procedencia` | 105 |
| G6 | `/observatorio/ausencia` | 106 |
| G7 | `/observatorio/dados` | 107 |
| G8 | `/observatorio/moderacao` | 169 |

As oito existem em `src/app/(bastidor)/observatorio/`. **É a única superfície de bastidor com
página inicial construída.**

## 5. As portas

Nenhuma. O Gestor não recebe pendência e não devolve nada — se uma tela revela um problema, o
caminho é humano: falar com quem tem o papel. **Não existe botão que leve daqui a uma escrita.**
Isso é o desenho, não uma lacuna.

## 6. O que este nível nunca faz

- Não escreve. Em nenhuma classe, em nenhuma relação, em nenhum campo.
- Não vê pessoa identificada: `repertorio` chega agregado e anonimizado.
- Não exporta sem versão.
- Não apresenta medida sem denominador.
- Não funde `total` com `entidadesDistintas`.

## 7. O que este nível converte

Nada — e essa é a leitura certa. **O Observatório não converte; ele mede a conversão dos outros.**
Cada linha abaixo é uma tela deste nível mudando de valor porque outro nível trabalhou:

| | Hoje | Depois | Quem move |
|---|---|---|---|
| `ocorrencia` derivada | 2.425 | `produtor` | nível 7 |
| Espaço declarado | 0 de 2.425 | declarado | níveis 6 e 7 |
| Ingresso declarado | 0 de 300 | declarado | nível 7 |
| Nós de máquina | 78% | cai a cada publicação | 5, 6, 7 |
| `influenciou` `deriva_de` `curou` | 0 arestas | assinadas | nível 5 |
| `programa` | 0 instâncias | povoado | nível 6 |
