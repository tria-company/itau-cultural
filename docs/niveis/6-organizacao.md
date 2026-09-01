# Nível 6 · Organização

> Escreve **identidade estável** — o que continua existindo depois que a pessoa que cadastrou sai. Governa o Studio; não declara acontecimento.

| | |
|---|---|
| Superfície | Studio |
| Rota-raiz | `/studio` |
| Funcionalidades | 14 — de 139 a 152, mais a 168 |
| Telas | O1 a O10, **as 10 construídas** |
| Escreve | `instituicao`, `espaco`, `midia`, `formacao`, `programa`, edital |
| Nunca escreve | `evento`, `temporada`, `ocorrencia` — é do Produtor |
| Carimba | `procedencia` da instituição em tudo que sai dela |

---

## 1. O que este nível é

Studio é a superfície; Organização e Produtor são dois níveis dentro dela. A divisão não é
hierárquica, é temporal: **a Organização escreve o que dura, o Produtor escreve o que acontece.**
Um espaço, uma instituição, uma ficha de acessibilidade de sala continuam verdadeiros no ano que
vem; uma ocorrência de terça-feira às 20h não.

Daí a funcionalidade mais sutil do nível, a 140: **sucessão de titularidade.** A pessoa que
cadastrou a instituição sai da instituição, e a instituição fica. Sem isso, todo acervo
institucional fica preso à conta de quem clicou primeiro — que é como acervos institucionais
morrem.

O número que mede este nível: **`programa` tem zero instâncias.** A classe existe no tipo, o
motor de caminhada a percorre, e nada no acervo a popula. É a camada acima do evento — a
temporada de uma companhia, o ciclo de uma instituição — e só a Organização pode escrevê-la.

## 2. O que ele escreve na ontologia

| Elemento | O que declara | Aprovação |
|---|---|---|
| `instituicao` | a ficha e o processo de verificação | Moderador |
| `espaco` + ficha de acessibilidade | endereço, bairro, recursos do espaço | Moderador |
| `programa` | a camada acima do evento | Moderador |
| `formacao` | cursos, formações, biblioteca | Moderador |
| `midia` + crédito | as 8 dimensões e a ficha técnica | Moderador |
| edital | critérios, prazos e publicação | Moderador |
| papel e alçada | quem, na organização, pode o quê | — |

`pertence_a` é **classificação, não hierarquia**: a Organização a escreve ao criar a entidade,
usando o vocabulário do Editor. A relação organizacional de verdade é `realiza` —
instituição→evento, 527 arestas.

## 3. As funcionalidades, uma a uma

### 139 · Convite, alçada e remoção de colaborador
**Tela O7 —** `/studio/equipe`

Quem entra, o que pode e quando sai. A alçada é local — vale dentro da organização — e é
diferente da concessão de papel do Admin (87), que vale no sistema. Um produtor convidado aqui
escreve **sempre sob a organização**, e a procedência carimbada leva as duas identidades.

### 140 · Sucessão de titularidade
**Tela O7 —** `/studio/equipe`

**A pessoa sai, a instituição fica.** A transferência é um ato com registro, não um campo de
e-mail trocado no cadastro. Sem esta funcionalidade, a saída de um funcionário órfã todo o acervo
que ele publicou.

### 141 · Ficha da instituição e verificação (→ 58)
**Tela O1 —** `/studio/instituicao`

246 instituições no acervo, herdadas da ingestão. A ficha é o que uma delas afirma sobre si — e a
verificação, feita pelo Admin (92), é o que separa a afirmação do carimbo.

### 142 · Espaços próprios, com ficha de acessibilidade (→ 15, 22)
**Tela O2 —** `/studio/espacos`

**A maior conversão de procedência deste nível.** 113 espaços no acervo, e **0 das 2.425
ocorrências declaram espaço**. Cada espaço cadastrado aqui é o que permite ao produtor apontar a
ocorrência para um lugar real, com bairro — e bairro, não só município, é o que o recorte
territorial do público (22) exige.

A ficha de acessibilidade **do espaço** é diferente da do evento: uma rampa é do prédio, um
intérprete de libras é da sessão. As duas usam o mesmo ato explícito de declarar ausência.

### 143 · `programa` — a camada acima do evento
**Tela O3 —** `/studio/programa`

**Zero instâncias hoje.** É a classe que agrupa eventos sob um mesmo argumento institucional — o
ciclo, a temporada da casa, o programa anual. O motor percorre a classe e não encontra nada;
povoá-la muda o que a caminhada no grafo consegue oferecer ao público.

### 144 · `formacao` — cursos, formações e biblioteca (→ 42, 43)
**Tela O4 —** `/studio/formacao`

54 instâncias de `formacao` no acervo. É o que alimenta o app Cursos.

### 145 · Agendamento de visita educativa (→ 44)
**Tela O4 —** `/studio/formacao`

Agenda, vagas e confirmação. A visita educativa é o ponto em que a instituição assume compromisso
com uma data — e por isso vive no nível que responde pela instituição, não no do produtor.

### 146 · Material didático e área do educador (→ 45)
**Tela O4 —** `/studio/formacao`

### 147 · Mídia: upload, crédito obrigatório, ficha técnica e as 8 dimensões (→ 25, 29)
**Tela O5 —** `/studio/midia`

529 `midia` no acervo. **Crédito é obrigatório** — não existe upload sem ele. As oito dimensões
de acessibilidade (legenda, libras, audiodescrição e as demais de
`DIMENSOES_DE_ACESSIBILIDADE`) são o que faz o filtro do Play e do Cast (29) funcionar; sem elas
declaradas, o filtro devolve vazio e o público conclui que não existe conteúdo acessível.

### 148 · Direito de distribuição e offline, item a item (→ 30)
**Tela O5 —** `/studio/midia`

Uma mídia pode estar liberada para exibir e não para baixar. O download offline — requisito de
baixa banda e escala nacional — depende deste campo por item, e a moderação confere (115).

### 149 · Editais e oportunidades (→ 46, 48)
**Tela O6 —** `/studio/editais`

Publicação, critérios e prazos. É a ponta de escrita do que o público autenticado recebe como
alerta (48) e do que faz um produtor novo entrar no grafo (49): **o edital é a porta de entrada
de agente que o produto tem.**

### 150 · Importação em lote por iCal, JSON ou API (→ 63)
**Tela O8 —** `/studio/integracao`

Instituição grande não cadastra evento a evento. A importação traz em lote — e o que entra por
aqui chega à fila de moderação com origem declarada como *ingestão* (108), nunca como publicação
direta.

### 151 · Chave de integração da organização
**Tela O8 —** `/studio/integracao`

A chave é emitida pelo Admin (97), com teto de uso. Esta tela é onde a organização a administra
e vê o consumo.

### 152 · Painel de alcance consolidado (→ 62)
**Tela O9 —** `/studio/alcance`

O alcance de tudo que a instituição publicou, somado. O produtor vê o dos próprios eventos (167);
a organização vê o conjunto.

### 168 · Painel de conformidade da equipe
**Tela O10 —** `/studio/conformidade`

A organização vê a fila dos próprios produtores: o que está em moderação, o que foi devolvido e
por quê, quem tem registro com score baixo (164). É o instrumento que permite à instituição
corrigir antes de a moderação devolver — e o par institucional do 164.

## 4. As telas

| Código | Rota | O que resolve |
|---|---|---|
| O1 | `/studio/instituicao` | 141 |
| O2 | `/studio/espacos` | 142 |
| O3 | `/studio/programa` | 143 |
| O4 | `/studio/formacao` | 144, 145, 146 |
| O5 | `/studio/midia` | 147, 148 |
| O6 | `/studio/editais` | 149 |
| O7 | `/studio/equipe` | 139, 140 |
| O8 | `/studio/integracao` | 150, 151 |
| O9 | `/studio/alcance` | 152 |
| O10 | `/studio/conformidade` | 168 |

As dez existem em `src/app/(bastidor)/studio/`. **A rota-raiz `/studio` não tem `page.tsx`** — é
a P1, painel do produtor, prevista e não construída.

## 5. As portas

| Chega de | O quê | Estado |
|---|---|---|
| Produtor (154) | espaço que não existe | *aguardando cadastro do espaço* |
| Admin (97) | chave de integração emitida | — |

| Vai para | O quê |
|---|---|
| Moderador | instituição, espaço, mídia, programa, formação, edital |
| Admin (92) | pedido de verificação da instituição |
| Editor | proposta de termo para classificar o próprio acervo |

## 6. O que este nível nunca faz

- Não publica evento, temporada ou ocorrência — é do Produtor.
- Não edita `pessoa`, `coletivo` nem `obra`: a Enciclopédia é autoridade, o Studio **referencia e
  propõe**.
- Não cria termo, linguagem ou tema — escolhe do vocabulário do Editor e propõe o que falta.
- Não modera os próprios registros: a 168 mostra a fila, não decide nela.
- Não sobe mídia sem crédito.
- Não marca acessibilidade só com caixas: exige o ato explícito de declarar ausência.

## 7. O que este nível converte

| | Hoje | Depois |
|---|---|---|
| `programa` | **0 instâncias** | povoado |
| Espaço declarado em ocorrência | 0 de 2.425 | espaço real, com bairro |
| Ficha de acessibilidade | 2.702 de 7.810 não declaram | declarada, **inclusive a ausência** |
| `instituicao` verificada | nenhuma | ficha + carimbo do Admin |
| `midia` com crédito conferido | não medido | obrigatório no upload |
| Titularidade | presa a quem cadastrou | sucessível |
