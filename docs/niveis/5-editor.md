# Nível 5 · Editor / Curador

> Escreve **sentido**, e assina o que escreve. É o único nível autorizado a afirmar que uma coisa vem de outra.

| | |
|---|---|
| Superfície | Redação |
| Rota-raiz | `/redacao` |
| Funcionalidades | 13 — de 126 a 138 |
| Telas | E1 a E9 — **6 construídas, 3 ausentes** (E6, E7, E8) |
| Escreve | vocabulário, arestas de sentido, conteúdo editorial, trilha, destaque |
| Nunca escreve | acontecimento, ficha de instituição, decisão de moderação |
| Carimba | assinatura pública — o motivo que a tela do público imprime é o dele |

---

## 1. O que este nível é

Três relações estão declaradas no tipo, valem para o motor de caminhada e **ninguém as escreve**:
`influenciou`, `deriva_de`, `curou`. Zero arestas. Esse vazio é a descrição exata do que este
nível existe para preencher — e é o vazio mais caro do grafo, porque é dele que sai a diferença
entre um catálogo e uma leitura do campo cultural.

O Editor é também o dono da **camada 0 da ontologia** — `linguagem`, `tema`, `termo` — que hoje
não tem autor. São 481 termos, 94 temas e 33 linguagens no acervo, herdados da ingestão, sem
ninguém que os promova, funda ou hierarquize. O tesauro sem dono é o motivo pelo qual as facetas
de busca (80) refletem o que a máquina extraiu, não o que o campo reconhece.

A regra que atravessa o nível: **o motivo é público.** Quando o Editor assina uma trilha, o
mesmo texto que ele escreve como justificativa é o que a tela do público imprime — não há versão
interna e versão externa. A tela E9 (`/redacao/assinaturas`) existe para que ele consiga ver
tudo o que assinou, do mesmo jeito que o moderador vê o que decidiu.

## 2. O que ele escreve na ontologia

| Elemento | O que declara | Aprovação |
|---|---|---|
| `linguagem` `tema` `termo` | promove, funde, declara sinonímia e hierarquia | Admin |
| `pessoa` `coletivo` (Enciclopédia) | o verbete | Moderador |
| `obra` | ficha e expressões | Moderador |
| `conteudo` `publicacao` | matéria, coluna, entrevista, pesquisa | Moderador |
| `trilha` | a trilha curada, com motivo legível | — |
| `influenciou` `dialoga_com` `deriva_de` `curou` | **as arestas de sentido** | — |
| `aprofunda` `fala_sobre` `contextualiza` | a ligação editorial | — |
| `semelhante_a` autorada | similaridade humana, com motivo obrigatório | — |
| destaque de feed | 1 por feed, com autoria | — |

## 3. As funcionalidades, uma a uma

### 126 · Trilha curada assinada (→ 66)
**Tela E1 —** `/redacao/trilha`

Uma trilha é uma sequência com argumento. A tela obriga o motivo, e **o motivo que ela grava é o
mesmo que a tela pública imprime**. A visão web usa três colunas — acervo, sequência e prévia
mobile do selo — porque a curadoria precisa ver o resultado no formato em que ele será lido.
Hoje o acervo tem **1 instância de `trilha`**.

### 127 · Destaque que sobrepõe o algoritmo (→ 7, 67)
**Tela E2 —** `/redacao/destaque`

**Um por feed, com autoria.** É o único ponto do produto em que uma decisão humana passa na
frente do motor de recomendação, e por isso é limitado e assinado. Sem limite, curadoria vira
programação de grade; sem assinatura, vira interferência anônima. A IA, por regra do nível 1
(91), **nunca define destaque**.

### 128 · Arestas de sentido
**Tela E3 —** `/redacao/pontes`

`influenciou`, `dialoga_com`, `deriva_de`, `curou`. **Onde a curadoria afirma.** Três das quatro
estão vazias no grafo; `dialoga_com` tem 31 arestas. Cada aresta escrita aqui é uma afirmação
sobre o campo cultural, e o vocabulário é fechado — nada fora das 14 relações vira aresta.

### 129 · `semelhante_a` autorada, com motivo legível obrigatório (→ 84)
**Tela E3 —** `/redacao/pontes`

A máquina produziu 47.259 arestas de similaridade. O Editor produz as que a máquina não
alcança — e o campo `motivo` é obrigatório por tipo quando `relacao === "semelhante_a"`. A
diferença entre a aresta da máquina e a do Editor não está na estrutura: está em quem assina.

### 130 · Tesauro (→ 80)
**Tela E4 —** `/redacao/tesauro`

Promover um termo a linguagem, fundir dois termos, declarar sinonímia e hierarquia. **A camada 0
da ontologia, que hoje não tem dono.** É o destino de uma das três portas do sistema: termo livre
encaminhado pelo moderador (118) chega aqui como candidato, com estado *termo proposto, em
análise*, e o que o Editor promove ainda passa pela aprovação do Admin (100).

### 131 · Ligação editorial (→ 40)
**Tela E5 —** `/redacao/materia`

`aprofunda`, `fala_sobre`, `contextualiza` — 887, 39 e 4 arestas respectivamente. É o que faz o
"Aprofunda isto" do público funcionar a partir de qualquer evento ou obra, em vez de mandar para
uma busca.

### 132 · Notícia, coluna, entrevista, publicação e pesquisa (→ 38, 41)
**Tela E5 —** `/redacao/materia`

**As classes de conhecimento.** 1.805 `conteudo` e 46 `publicacao` no acervo. Escrever aqui não é
publicar um post: é criar uma entidade que se liga ao grafo pelas relações da 131.

### 133 · Especiais nomeados como trilha (→ 39)
**Tela E6 —** *ausente em `src/app/(bastidor)/redacao/`*

Ancestralidade, Arte e Acesso, Mekukradjá. Um especial é uma trilha com nome próprio e vida
longa. **Tela prevista no PRD da sessão e não construída** — o PRD a marcou como cortável se o
prazo apertasse, e ela foi cortada.

### 134 · Verbete e página de movimento (→ 33, 34)
**Tela E5 —** `/redacao/materia`

O verbete embutido no fluxo, não link para fora. É a autoridade da Enciclopédia: o Studio
referencia e propõe, **nunca edita**. Um produtor editar o verbete de um artista real seria a
violação exata que o projeto se proibiu.

### 135 · Disposições de entrada (→ 2)
**Tela E7 —** *ausente*

"Tenho 2h", "com criança", "de graça e perto", "quero algo que eu nunca vi". Criar a disposição,
**redigir a explicação** e **redigir o texto de ausência** — o que a tela diz quando a disposição
não encontra nada. A disposição "vou com criança" está no ar hoje com `campoLido: null`, porque
`faixaEtaria` não existe em `tipos.ts`. **Tela prevista e não construída.**

### 136 · Calendário editorial e agendamento (→ 70)
**Tela E8 —** *ausente*

O que sai quando. **Tela prevista e não construída.**

### 137 · Newsletter e comunicação editorial (→ 56)
**Tela E8 —** *ausente*

A peça é do Editor; **a alçada de disparo é do Admin** (98). Separar os dois impede que quem
escreve decida também o alcance. **Tela prevista e não construída.**

### 138 · Feedback que retroalimenta o modelo (→ 85)
**Tela E7 —** *ausente*

O fecho do ciclo do *human-in-the-loop*: o que o moderador reprovou na M3 e o que o Editor
corrigiu volta como sinal para o modelo. **Tela prevista e não construída.**

## 4. As telas

| Código | Rota | O que resolve | Estado |
|---|---|---|---|
| E1 | `/redacao/trilha` | 126 | construída |
| E2 | `/redacao/destaque` | 127 | construída |
| E3 | `/redacao/pontes` | 128, 129 | construída |
| E4 | `/redacao/tesauro` | 130 | construída |
| E5 | `/redacao/materia` | 131, 132, 134 | construída |
| E6 | — | 133 | **ausente** |
| E7 | — | 135, 138 | **ausente** |
| E8 | — | 136, 137 | **ausente** |
| E9 | `/redacao/assinaturas` | a contrapartida da M9 | construída |

Seis de nove existem em `src/app/(bastidor)/redacao/`. **A rota-raiz `/redacao` não tem
`page.tsx`.** As três ausentes são exatamente as que o PRD da sessão marcou como cortáveis —
E1, E2, E3 e E4 eram as que não se cortavam, e as quatro estão de pé.

## 5. As portas

| Chega de | O quê | Estado na tela |
|---|---|---|
| Moderador (118) | termo livre encaminhado | *termo proposto, em análise* |
| Studio (6 e 7) | proposta de `pessoa`, `coletivo` ou `obra` | via reconciliação do moderador (117) |

| Vai para | O quê |
|---|---|
| Admin (100) | termo promovido, aguardando aprovação |
| Moderador | verbete, matéria e obra, para publicação |
| Admin (98) | pedido de disparo de newsletter |

## 6. O que este nível nunca faz

- Não escreve `evento`, `temporada` nem `ocorrencia` — acontecimento é do Produtor.
- Não escreve `instituicao`, `espaco` nem `midia` — identidade é da Organização.
- Não modera: propõe e publica dentro do próprio domínio, mas quem aprova verbete, obra e
  matéria é o Moderador.
- Não cria termo sem passar pela aprovação do Admin.
- Não assina sem motivo legível — e o motivo é o texto público.
- Não define mais de um destaque por feed.

## 7. O que este nível converte

| | Hoje | Depois |
|---|---|---|
| `influenciou` | 0 arestas | autoradas e assinadas |
| `deriva_de` | 0 arestas | autoradas e assinadas |
| `curou` | 0 arestas | autoradas e assinadas |
| `contextualiza` | 4 arestas | leitura editorial do acervo |
| `trilha` | 1 instância | trilhas e especiais assinados |
| Camada 0 do vocabulário | sem dono | tesauro com autor e hierarquia |
| Nós `autorado` | 47 de 7.810 | cresce a cada verbete e matéria |
