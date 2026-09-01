# Nível 4 · Moderador com escopo

> O nível 3 recortado em três eixos. **Não é um papel menor — é o que impede que a governança reproduza o deserto que o mapa denuncia.**

| | |
|---|---|
| Superfície | Moderação, a mesma |
| Rota | `/moderacao/escopo` — mais as nove telas do nível 3, filtradas |
| Funcionalidades | 4 próprias — de 122 a 125 — mais as 14 do nível 3, recortadas |
| Telas | M8, **construída** |
| Escreve | as mesmas decisões do nível 3, dentro do recorte |
| Nunca escreve | fora do escopo — o que cai fora, escala |

---

## 1. O que este nível é

Este nível existe por um número: **59,2% dos registros do acervo estão em 2 dos 27 estados**, e
dois estados — Sergipe e Tocantins — não existem nele. Uma fila de moderação centralizada em São
Paulo decidiria sobre o Pará com o repertório de quem mora em São Paulo, e reproduziria na
governança exatamente a concentração que o mapa de desertos (104) denuncia na oferta.

A resposta não é criar um papel novo com poderes menores. É **recortar o papel existente**. O
moderador com escopo tem as mesmas 14 funcionalidades do nível 3, os mesmos motivos obrigatórios,
o mesmo carimbo de autoria. Só o alcance muda — e o alcance vem da concessão feita no
`/admin/papeis` (87), que é uma aresta com **papel + território + classe + fila**.

Foi por isso que a sessão que construiria este nível foi dissolvida na do nível 3: o escopo não
é uma tela paralela, é uma propriedade de todas as telas de moderação. `ESCOPOS_DE_CURADORIA` e
`itemNoEscopo` já vivem no módulo de moderação.

## 2. Os três eixos, combináveis

| Eixo | Exemplo | O que resolve |
|---|---|---|
| **Território** | agenda do Pará | curadoria regional decide sobre a própria região (→ 68) |
| **Tipo de conteúdo** | só mídia · só agenda · só editorial · só agentes | direitos de imagem exigem outro olho que agenda |
| **Fila** | só duplicatas · só revisão de IA · só direitos de imagem | 47.259 arestas de similaridade não se revisam com o mesmo perfil que aprova evento |

Combináveis significa que "mídia do Pará na fila de direitos de imagem" é uma concessão válida,
e que a interseção vazia é um erro que a tela de concessão precisa recusar antes de salvar.

## 3. As funcionalidades, uma a uma

### 122 · Escopo impresso na própria tela
**Telas M1 e M8 —** `/moderacao/fila` e `/moderacao/escopo`

**Sabe o que não está vendo.** A fila não mostra só o que cabe no recorte: mostra o recorte. Um
moderador que ignora que está vendo apenas o Pará conclui que a fila está vazia quando ela está
apenas filtrada. A tela imprime os três eixos ativos e o volume que ficou fora.

Esta é a versão de moderação da regra que atravessa o produto: **ausência declarada, com
denominador.** "12 itens na sua fila, de 340 no total" é informação; "12 itens" sozinho é
armadilha.

### 123 · Escalonamento do que cai fora do escopo
**Tela M8 —** `/moderacao/escopo`

Um item que chega e não cabe no recorte não pode sumir nem travar. Escala para quem tem escopo
maior, com estado visível — *escalonado* — e com o motivo do escalonamento. É a quarta porta do
sistema, e obedece à mesma regra das outras três: **caminho de volta, sempre.**

### 124 · Fila priorizada por vazio, não por volume (→ 68)
**Tela M8 —** `/moderacao/escopo`

**O deserto sobe.** A ordenação padrão da fila não é a mais antiga nem a maior: é a que vem do
território com menos oferta. Um evento em Sergipe — estado que hoje não tem uma linha no acervo —
vale mais na fila que o quadragésimo evento de São Paulo, porque a primeira publicação de um
território muda a cobertura e a quadragésima não.

É a única funcionalidade do bastidor que **inverte deliberadamente a ordem que a eficiência
pediria**, e o par dela é a A10/G8 (169): se a fila prioriza o vazio, o desempenho por escopo é
onde se verifica se o vazio de fato subiu.

### 125 · Delegação temporária de escopo
**Tela M8 —** `/moderacao/escopo`

Férias, licença, pico de demanda. A delegação tem prazo, e o prazo é parte da concessão — não
um lembrete. Quem delegou continua respondendo pelo escopo; quem recebeu decide com o próprio
nome. As duas coisas aparecem na auditoria (93) e no histórico dos dois moderadores (121).

## 4. As 14 do nível 3, recortadas

Todas continuam valendo, com o escopo aplicado:

| # | Funcionalidade | Como o escopo a afeta |
|---|---|---|
| 108 | Fila com origem declarada | filtrada pelos três eixos, com o denominador impresso |
| 109 | Aprovação e veto com motivo | idêntica — motivo obrigatório, autoria carimbada |
| 110 | Devolução ao produtor | idêntica |
| 111 | Revisão da IA | só a fatia de IA, se a fila for o eixo |
| 112 | Revisão de similaridade | por regra, dentro do recorte |
| 113 | Duplicata entre organizações | **escala** se uma das pontas estiver fora do escopo |
| 114 | Direitos de imagem | eixo próprio de fila |
| 115 | Distribuição e offline | acompanha o item |
| 116 | Elenco declarado | **nunca se recorta por território** — a barreira ética vale inteira |
| 117 | Reconciliação | escala se o verbete for de outro escopo |
| 118 | Encaminhamento de termo | idêntica — vai ao Editor de qualquer escopo |
| 119 | Classificação indicativa | confere, dentro do recorte |
| 120 | Denúncia do público | sem tela construída |
| 121 | Histórico próprio | só as próprias decisões, escopo incluído no registro |

Duas linhas merecem atenção: **116 não se recorta** — uma afirmação falsa sobre uma pessoa real
é grave em qualquer território — e **113 escala por definição**, porque uma duplicata entre
organizações de escopos diferentes não tem, por construção, um moderador com alcance sobre as
duas pontas.

## 5. As telas

| Código | Rota | O que resolve |
|---|---|---|
| M8 | `/moderacao/escopo` | 122, 123, 124, 125 |
| M1 a M9 | as do nível 3 | as 14, filtradas |

`/moderacao/escopo` existe em `src/app/(bastidor)/moderacao/escopo/page.tsx`.

## 6. As portas

| Falta | Vai para | Estado |
|---|---|---|
| item fora do escopo | moderador de escopo maior, ou Admin | *escalonado* |
| duplicata entre escopos | Moderador sem recorte | *escalonado* |
| escopo vago por ausência | delegação temporária (125) | *delegado até ⟨data⟩* |

## 7. O que este nível nunca faz

- Não decide fora do recorte — e não esconde que existe um fora.
- Não recorta o elenco declarado (116) por território.
- Não herda escopo por conveniência: a concessão vem do Admin (87), com os três eixos.
- Não deixa item escalonado sem estado visível.
- Não delega sem prazo.

## 8. O que este nível converte

| | Hoje | Depois |
|---|---|---|
| Concentração da decisão | uma fila única | recorte por território, tipo e fila |
| Ordem da fila | por volume | **por vazio** — o deserto sobe |
| Item fora de alcance | sem caminho | escalonado, com estado e motivo |
| Ausência em SE e TO | invisível na governança | prioridade máxima na fila |
