# Os oito níveis de acesso

Um documento por nível. Cada um responde a mesma pergunta na mesma ordem: **o que este nível é**,
**o que ele escreve na ontologia**, **as funcionalidades uma a uma com a tela de cada**, **as
telas**, **as portas para os outros níveis**, **o que ele nunca faz** e **o que ele converte**.

A pergunta que organiza o conjunto está em
[ONTOLOGIA-E-ACESSOS](../../.planning/sessoes/ONTOLOGIA-E-ACESSOS.md):

> **Nenhum elemento da ontologia pode existir sem exatamente um papel autorizado a autorá-lo.
> E nenhum papel escreve sem deixar autor — admin incluído.**

Níveis de acesso aqui não são uma camada de segurança sobre a ontologia. **São o vocabulário de
procedência**: cada papel humano é um valor de `procedencia`, e cada escrita carimba quem
escreveu.

## Os oito

| # | Nível | Superfície | Escreve | Funcionalidades | Documento |
|---|---|---|---|---|---|
| 1 | **Admin** | `/admin` | governança, vocabulário de sistema, papéis | 14 · 87–100 | [1-admin.md](1-admin.md) |
| 2 | **Gestor** | `/observatorio` | **nada** | 7 · 101–107 | [2-gestor.md](2-gestor.md) |
| 3 | **Moderador** | `/moderacao` | decisões, com autor e motivo | 14 · 108–121 | [3-moderador.md](3-moderador.md) |
| 4 | **Moderador com escopo** | `/moderacao/escopo` | o mesmo, recortado | 4 · 122–125 | [4-moderador-com-escopo.md](4-moderador-com-escopo.md) |
| 5 | **Editor / Curador** | `/redacao` | sentido, assinado | 13 · 126–138 | [5-editor.md](5-editor.md) |
| 6 | **Organização** | `/studio` | identidade estável | 14 · 139–152 | [6-organizacao.md](6-organizacao.md) |
| 7 | **Produtor cultural** | `/studio` | acontecimento | 15 · 153–167 | [7-produtor.md](7-produtor.md) |
| 8 | **Público autenticado** | `/apps` | repertório, salvos, sinais | 62 · 1–57, 78–86 | [8-publico.md](8-publico.md) |

**Studio ≠ Produtor.** Studio é a superfície; produtor é o papel. Dentro do Studio vivem dois
níveis: a Organização governa, o Produtor declara.

## A numeração

As **86 do catálogo original** ([funcionalidades.md](../funcionalidades.md)) são o nível 8. **A
numeração não se renumera.** As **81 de bastidor** vão de 87 a 167, mais duas achadas na
auditoria: **168** conformidade da equipe (nível 6) e **169** desempenho da moderação (níveis 1
e 2). Total: **167 no catálogo dos oito níveis, 169 com as duas de auditoria.**

Visão de uma página só, com todas as listas lado a lado:
[funcionalidades-por-frente.md](../funcionalidades-por-frente.md).

## Estado das telas, medido em `src/app/(bastidor)/`

| Nível | Telas previstas | Construídas | Ausentes |
|---|---:|---:|---|
| 1 · Admin | 10 | **10** | — |
| 2 · Gestor | 8 | **8** | — |
| 3 · Moderador | 9 | **9** | — |
| 4 · Escopo | 1 | **1** | — |
| 5 · Editor | 9 | 6 | E6 especiais · E7 motor editorial · E8 calendário |
| 6 · Organização | 10 | **10** | — |
| 7 · Produtor | 10 | 8 | P1 painel do produtor · P7 comercial e classificação |
| 8 · Público | os 10 apps | 10 | — |

As cinco ausentes são exatamente as que os PRDs das sessões marcaram como cortáveis sob prazo.
Uma sexta lacuna atravessa quatro níveis: **`/admin`, `/moderacao`, `/redacao` e `/studio` não
têm `page.tsx` de índice** — só `/observatorio` tem página inicial.

## As portas entre níveis

Em quatro pontos um nível depende de outro e não resolve sozinho. **Nenhuma pode virar beco sem
saída:** cada uma tem estado visível e caminho de volta.

| Falta | Sai de | Vai para | Estado impresso |
|---|---|---|---|
| pessoa ou obra não existe | 6, 7 | Moderador (117) | *proposta aguardando reconciliação* |
| espaço não existe | 7 | Organização (142) | *aguardando cadastro do espaço* |
| termo fora do vocabulário | 3, 6, 7 | Editor (130) | *termo proposto, em análise* |
| item fora do escopo | 4 | escopo maior (123) | *escalonado* |

E uma porta de volta: **duplicata** — a máquina propõe, o produtor decide sobre os próprios
registros (163), o moderador decide entre organizações distintas (113).

## O que os oito níveis convertem

O argumento da proposta, em números que mudam sozinhos assim que os níveis rodam:

| | Hoje | Depois | Quem move |
|---|---|---|---|
| `ocorrencia` | 2.425 `derivado` | `produtor` | 7 |
| Espaço declarado | 0 de 2.425 | declarado | 6, 7 |
| Ingresso declarado | 0 de 300 | declarado | 7 |
| Componentes da chave | 1 de 3 | 3 de 3 | 7 |
| Elenco em evento datado | 0 de 129 | declarado | 7 |
| Acessibilidade | 2.702 não declaram | declarada, inclusive a ausência | 6, 7 |
| Nós de máquina | **78%** | cai a cada publicação | 5, 6, 7 |
| `programa` | 0 instâncias | povoado | 6 |
| `influenciou` `deriva_de` `curou` | 0 arestas | autoradas e assinadas | 5 |
| `semelhante_a` revisada | 0 de 47.259 | revisada por regra | 3 |

**O bastidor é o mecanismo pelo qual a plataforma deixa de derivar e passa a saber.** Cada linha
acima é uma tela do Observatório mudando de valor sem ninguém tocar em código.
