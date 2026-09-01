# Nível 3 · Moderador

> Decide o que entra, com autor e motivo carimbados. **É o nível que dá resposta à pergunta do RFP sobre o limite da IA.**

| | |
|---|---|
| Superfície | Moderação |
| Rota-raiz | `/moderacao` |
| Funcionalidades | 14 — de 108 a 121 |
| Telas | M1 a M9, **as 9 construídas** |
| Escreve | decisões: aprovação, veto, devolução, reconciliação |
| Nunca escreve | o conteúdo em si — nem corrige o texto do produtor |
| Carimba | autor + motivo em **toda** decisão, sem exceção |

---

## 1. O que este nível é

O Moderador não escreve conteúdo: escreve **decisões sobre conteúdo**. A distinção é a espinha
do nível. Ele não conserta o evento mal cadastrado — devolve ao produtor com o pedido de
correção nomeado (110). Ele não escreve o verbete do artista — encaminha à Enciclopédia como
proposta de reconciliação (117). Ele não inventa termo — manda ao Editor como candidato (118).

Por que isso importa: **71% do grafo é `semelhante_a`** — 47.259 arestas de 66.563, todas
produzidas por máquina, todas com `motivo` obrigatório, **nenhuma revisada por humano**. Se a
moderação fosse item a item, essa fila nunca seria vencida. Por isso a M4 revisa similaridade
**por regra e por amostra**, num trilho próprio, e não pelo mesmo caminho do resto.

A segunda regra dura: **motivo obrigatório.** `situacaoApos()` e `decisaoCompleta()` em
`src/dados/tipos-acesso.ts` não deixam uma decisão fechar sem ele. Veto sem motivo é
indistinguível de silêncio, e silêncio é o que a plataforma se proibiu de interpretar.

## 2. O que ele escreve na ontologia

| Elemento | O que decide | Efeito |
|---|---|---|
| `Situacao` de qualquer entidade | rascunho · em-moderação · devolvido · publicado · suspenso | é o que faz existir jornada, não formulário |
| `atua_em` | aprova ou barra o elenco declarado | funcionalidade 116 |
| `duplicata_suspeita` | resolve entre organizações distintas | 40 arestas hoje |
| `semelhante_a` | aprova ou reprova **por regra**, não por aresta | 47.259 arestas |
| reconciliação | liga agente ingerido a verbete da Enciclopédia | funcionalidade 117 |

`Situacao` é a mais importante das lacunas fechadas pelo contrato: **sem ela não há jornada, só
formulário.**

## 3. As funcionalidades, uma a uma

### 108 · Fila com origem declarada por item (→ 65)
**Tela M1 —** `/moderacao/fila`

Cada item da fila diz de onde veio: **produtor, ingestão ou IA**. Três origens, três leituras
diferentes do mesmo card. Um item de IA sem o score ao lado é um item que o moderador aprova no
escuro — e é exatamente isso que o RFP pergunta se a plataforma evita.

### 109 · Aprovação e veto com motivo obrigatório e autoria carimbada (→ 67)
**Tela M2 —** `/moderacao/item`

Aprovar é um clique; vetar exige motivo escrito. Os dois carimbam autor. A decisão vai para a
auditoria do Admin (93) e para o histórico do próprio moderador (121) no mesmo ato.

### 110 · Devolução ao produtor com pedido de correção nomeado
**Tela M2 —** `/moderacao/item`

Não é "reprovado". É "falta o espaço da ocorrência" ou "a ficha de acessibilidade não foi
declarada". A devolução muda a `Situacao` para `devolvido` — um dos dois estados editáveis
(`SITUACOES_EDITAVEIS = ["rascunho", "devolvido"]`), o que devolve o registro ao Studio já
aberto para edição, sem que o produtor precise recriar nada.

### 111 · Revisão da IA item a item, com score e regra ao lado (→ 69, 82)
**Tela M3 —** `/moderacao/ia`

O score de confiança da extração e **a regra que o produziu**, lado a lado com a proposta. Sem a
regra, o score é um número sem argumento. É aqui que o *human-in-the-loop* deixa de ser slogan:
a IA propõe, um humano nomeado decide, e a decisão volta ao modelo pelo caminho do Editor (138).

### 112 · Revisão de `semelhante_a` por regra e por amostra (→ 84)
**Tela M4 —** `/moderacao/similaridade`

**47.259 arestas.** A tela não pede que se aprovem 47 mil linhas: mostra a regra que as gerou,
uma amostra do que ela produziu, e a decisão vale para a regra inteira. Similaridade sempre com
justificativa legível — o campo `motivo` é obrigatório quando `relacao === "semelhante_a"`, e a
tela recusa amostra sem motivo em português.

### 113 · Duplicata entre organizações distintas (→ 61, 83)
**Tela M7 —** `/moderacao/duplicatas`

40 arestas `duplicata_suspeita` hoje. Quando as duas pontas são da mesma organização, quem
decide é o produtor sobre os próprios registros (163). **Quando são de organizações diferentes,
nenhum produtor pode decidir pelo outro** — sobe para cá.

### 114 · Direitos e crédito de imagem
**Tela M2 —** `/moderacao/item`

Crédito é obrigatório no upload (165), mas obrigatório não é o mesmo que correto. Esta é a
conferência.

### 115 · Direito de distribuição e download offline (→ 30)
**Tela M2 —** `/moderacao/item`

Uma mídia pode estar liberada para exibir e não para baixar. O download offline do Play e do
Cast depende deste campo, item a item.

### 116 · Elenco declarado
**Tela M5 —** `/moderacao/elenco`

**A barreira ética do sistema.** O produtor declara `atua_em` com papel, ligando o evento a uma
`pessoa` real que nunca se cadastrou — são 575 pessoas no protótipo e **43.614 na base
completa**. Uma declaração falsa aqui é uma afirmação sobre uma pessoa real feita por terceiro.
Por isso o elenco passa por moderação antes de virar aresta pública, e um agente que não existe
recebe marca de **proposto** e vai para a M6 antes de qualquer decisão.

### 117 · Reconciliação de agente ingerido com verbete (→ 37)
**Tela M6 —** `/moderacao/reconciliacao`

O único caminho de escrita entre o Studio e a Enciclopédia. O Studio **lê e nunca edita**
`pessoa`, `coletivo` e `obra`; propõe, e a proposta chega aqui como controle de autoridade — é
a mesma pessoa que já tem verbete, ou é outra?

### 118 · Encaminhamento de termo livre ao Editor (→ 80)
**Tela M2 —** `/moderacao/item`

Um termo fora do vocabulário **não é decidido aqui.** O moderador encaminha ao Editor como
candidato, e o item fica com estado visível: *termo proposto, em análise*. É uma das três portas
entre níveis, e nenhuma delas pode virar beco sem saída.

### 119 · Conferência da classificação indicativa
**Tela M2 —** `/moderacao/item`

**Confere, não arbitra.** A classificação é declarada pelo produtor (158) sob responsabilidade
dele; a moderação verifica se o que foi declarado bate com o que o evento é. `FAIXAS_ETARIAS`
tem seis valores fechados — livre, 10, 12, 14, 16, 18.

### 120 · Recepção e decisão de denúncia do público
**Sem rota medida** em `src/app/(bastidor)/moderacao/`

A funcionalidade está no escopo do nível e **não tem tela construída no protótipo**. A denúncia
do público autenticado entraria na fila da M1 como quarta origem, ao lado de produtor, ingestão
e IA.

### 121 · Histórico das próprias decisões
**Tela M9 —** `/moderacao/historico`

O moderador vê o que decidiu, quando e com que motivo. É a contrapartida da E9 do Editor ("o que
eu assinei"): quem decide em nome da plataforma responde pelo que decidiu, e precisa conseguir
consultar isso sem pedir a ninguém.

## 4. As telas

| Código | Rota | O que resolve |
|---|---|---|
| M1 | `/moderacao/fila` | 108, 109, 122 |
| M2 | `/moderacao/item` | 109, 110, 114, 115, 118, 119 |
| M3 | `/moderacao/ia` | 111 |
| M4 | `/moderacao/similaridade` | 112 |
| M5 | `/moderacao/elenco` | 116 |
| M6 | `/moderacao/reconciliacao` | 117 |
| M7 | `/moderacao/duplicatas` | 113 |
| M8 | `/moderacao/escopo` | 122 a 125 — **é o nível 4** |
| M9 | `/moderacao/historico` | 121 |

As nove existem em `src/app/(bastidor)/moderacao/`. **A rota-raiz `/moderacao` não tem
`page.tsx`** — a entrada é pela fila.

## 5. As portas

| Falta | Vai para | Estado impresso na tela |
|---|---|---|
| pessoa ou obra não existe | Enciclopédia, via M6 (117) | *proposta aguardando reconciliação* |
| termo fora do vocabulário | Editor (130) | *termo proposto, em análise* |
| espaço não existe | Organização (142) | *aguardando cadastro do espaço* |
| item fora do escopo | Moderador de escopo maior (123) | *escalonado* |
| correção do conteúdo | Produtor (110) | *devolvido* — volta editável |

**Nenhuma porta é beco sem saída:** cada uma tem estado visível e caminho de volta.

## 6. O que este nível nunca faz

- Não corrige o conteúdo do produtor — devolve com o pedido nomeado.
- Não escreve verbete, nem edita `pessoa`, `coletivo` ou `obra`.
- Não cria termo, linguagem ou tema — encaminha ao Editor.
- Não arbitra classificação indicativa — confere a declarada.
- Não fecha decisão sem motivo: o tipo não deixa.
- Não decide duplicata dentro de uma mesma organização — é do produtor.
- Não apaga: muda `Situacao`, e a mudança fica na auditoria.

## 7. O que este nível converte

| | Hoje | Depois |
|---|---|---|
| `semelhante_a` revisada | 0 de 47.259 | revisada **por regra**, com amostra |
| `duplicata_suspeita` | 40 abertas | decididas, com autor |
| `atua_em` | 508 arestas, 0 em evento datado | elenco aprovado antes de virar público |
| Decisão sem autor | possível | impossível |
| `Situacao` | campo inexistente em `tipos.ts` | cinco estados, com jornada |
