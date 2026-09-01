# Nível 7 · Produtor cultural

> Declara **acontecimento**. É o nível que converte 2.425 ocorrências derivadas em dado que alguém afirmou.

| | |
|---|---|
| Superfície | Studio, a mesma da Organização |
| Rota-raiz | `/studio` |
| Funcionalidades | 15 — de 153 a 167 |
| Telas | P1 a P8 + E1 e E2 — **8 construídas, 2 ausentes** (P1, P7) |
| Escreve | `evento`, `temporada`, `ocorrencia`, `atua_em`, `realiza`, `ocorre_em` |
| Nunca escreve | `pessoa`, `coletivo`, `obra`, verbete, termo, território |
| Carimba | `procedencia: "produtor"` — o valor que hoje não existe |
| Escreve sempre | **sob a organização à qual pertence** |

---

## 1. O que este nível é

Este é o nível que prova a tese da proposta. O comentário do próprio tipo `Ocorrencia` diz por
quê: *"SEMPRE `derivado`: o campo `schedules` do CMS está vazio em 100% dos 100 eventos, então
nenhuma ocorrência existe em sistema nenhum do IC."* São **2.425 ocorrências que ninguém
declarou** — foram inferidas. Cada uma que passa por aqui deixa de ser inferência e vira
afirmação com autor.

A jornada tem uma ordem que não é preferência de UX, é a **cadeia de identidade da ontologia**:

```
evento      = título normalizado + agente realizador + obra
temporada   = evento + espaço + intervalo
ocorrência  = temporada + início exato + espaço
```

`COMPONENTES_DO_CRITERIO` mede que **só o título é sustentado**: agente realizador e obra estão
vazios em 300 de 300 eventos. **O produtor preenche os outros dois terços.** E qualquer
formulário que deixe criar sessão antes de temporada grava registro sem chave — e a fila de
duplicatas passa a acusar o próprio sistema.

O produtor **nunca escreve sozinho**: escreve sob a organização à qual pertence, com a alçada
que ela concedeu (139).

## 2. O que ele escreve na ontologia

| Elemento | O que declara | Aprovação |
|---|---|---|
| `evento` | título, agente realizador, obra | Moderador |
| `temporada` | espaço e intervalo | Moderador |
| `ocorrencia` | **data, hora, preço, esgotado** | — |
| `atua_em` + `papel` | o elenco — a ponte com a Enciclopédia | Moderador |
| `realiza` `ocorre_em` `situado_em` | os vínculos do acontecimento | Moderador |
| `pertence_a` | classificação, com o vocabulário do Editor | Moderador |

`ocorrencia` é a única linha da matriz inteira **sem aprovador**: mudar o horário de uma sessão
não pode esperar fila. Em compensação, a mudança dispara alerta a quem salvou (160).

## 3. As funcionalidades, uma a uma

### 153 · Publicação de evento com validação em tempo real (→ 59)
**Telas P2 e P8 —** `/studio/publicar` e `/studio/revisar`

A chave de identidade é calculada **ao vivo**, enquanto se digita, e o aviso de duplicata aparece
antes de salvar, não depois. `chaveDoEvento()`, `chaveDaTemporada()` e `chaveDaOcorrencia()` são
funções puras — sem relógio e sem sorteio — justamente para poder rodar a cada tecla sem fazer o
HTML exportado divergir da página hidratada.

### 154 · Ocorrências reais — data, hora e espaço (→ 10, 60)
**Telas P4 e P5 —** `/studio/temporada` e `/studio/grade`

**A tela onde 2.425 registros deixam de ser derivados.** A grade não é um formulário repetido: é
onde a temporada vira sessões concretas. O espaço vem do cadastro da Organização (142) — e se não
existir, a porta se abre com estado *aguardando cadastro do espaço*, sem travar o rascunho.

### 155 · Elenco com papel (→ 31)
**Tela P3 —** `/studio/elenco`

**A ponte entre a agenda e a Enciclopédia.** `atua_em` é a única relação com `papel` obrigatório,
e é o que faz um evento de teatro ligar-se à página da atriz. Hoje: 508 arestas `atua_em` e **0
eventos datados com artista vinculado, de 129**. Quando a pessoa não existe no acervo, o vínculo
sai marcado como **proposto** e vai à reconciliação do moderador (117) — o produtor **nunca**
edita o verbete.

### 156 · Preço, gratuidade e canal de ingresso (→ 10, 16)
**Tela P7 —** *ausente em `src/app/(bastidor)/studio/`*

Hoje só existe o booleano `gratuito`, e **0 de 300 eventos declaram ingresso**. `CanalIngresso` e
`CamposDeIngresso` já estão no contrato em `tipos-acesso.ts`; **a tela não foi construída.**

### 157 · Inscrição, quando não há bilheteria (→ 16)
**Tela P7 —** *ausente*

Oficina, roda de conversa, visita — o que não vende ingresso mas tem vaga limitada. Campo
`inscricao` previsto no contrato, **tela não construída.**

### 158 · Classificação indicativa e faixa etária (→ 11)
**Tela P7 —** *ausente*

`FAIXAS_ETARIAS` tem seis valores fechados — livre, 10, 12, 14, 16, 18 — e o campo **não existe
em `tipos.ts`**, só na extensão. Consequência medida: a disposição *"vou com criança"* está no ar
para o público com `campoLido: null`. **Tela não construída.**

### 159 · Ficha de acessibilidade com ato explícito de declarar ausência (→ 15)
**Tela P6 —** `/studio/acessibilidade`

**A tela que mais distingue a proposta.** `declaraAcessibilidade` registra *o ato de preencher a
ficha*, não o conteúdo dela — porque em `acessibilidade` um `false` significa "não oferece" e
"não declarou" ao mesmo tempo. Por isso a tela **não pode ter só caixas de marcar**: precisa de
um ato com o mesmo peso de salvar —

> **"Declaro que não oferece nenhum destes recursos."**

Sem esse botão, quem preenche gera silêncio, e silêncio é o que a plataforma se proibiu de
interpretar. Hoje **2.702 de 7.810 entidades não declaram.**

### 160 · Alteração e cancelamento que disparam alerta (→ 13)
**Tela E1 —** `/studio/ocorrencias`

Mudar horário não é editar um campo: é um evento que alcança quem salvou a sessão (12). A tela
mostra quantas pessoas serão avisadas **antes** de confirmar.

### 161 · Esgotado em tempo real
**Tela E1 —** `/studio/ocorrencias`

Um estado da ocorrência, não do evento. É o campo que o público mais consulta e o que menos
tolera atraso — por isso `ocorrencia` não tem aprovador.

### 162 · Evento de longa duração com vigência própria (→ 17)
**Tela P4 —** `/studio/temporada`

Exposição e ocupação não têm sessões: têm vigência. A temporada absorve os dois modelos sem que
a ocorrência precise virar uma linha por dia.

### 163 · Duplicata sobre os próprios registros (→ 61)
**Tela E2 —** `/studio/duplicatas`

A máquina propõe, o produtor decide — **sobre os próprios registros**. Quando as duas pontas são
de organizações distintas, nenhum produtor pode decidir pelo outro, e o caso sobe ao moderador
(113). 40 arestas `duplicata_suspeita` hoje.

### 164 · Score de qualidade do próprio cadastro
**Telas P1 e P8 —** P1 *ausente*; `/studio/revisar` construída

`scoreDoRascunho()` e `pendenciasDoRascunho()` devolvem, item a item, o que falta e quanto pesa.
Não é uma nota moral: é a lista do que a moderação vai devolver se for enviada assim. A metade
que existe está na P8; **o painel permanente (P1) não foi construído.**

### 165 · Imagem com crédito obrigatório
**Tela P2 —** `/studio/publicar`

Sem crédito não salva. A conferência de direitos é do moderador (114).

### 166 · Alerta de edital compatível com o perfil (→ 48, 49)
**Tela P1 —** *ausente*

O edital publicado pela Organização (149) encontra o produtor cujo perfil casa. **Tela não
construída.**

### 167 · Painel de alcance dos próprios eventos (→ 62)
**Tela P1 —** *ausente*

A devolutiva ao produtor — quantas pessoas salvaram, quantas foram. O consolidado da instituição
é a O9 (152). **Tela não construída.**

## 4. As telas

| Código | Rota | O que resolve | Estado |
|---|---|---|---|
| P1 | — | 164, 166, 167 | **ausente** |
| P2 | `/studio/publicar` | 153, 165 | construída |
| P3 | `/studio/elenco` | 155 | construída |
| P4 | `/studio/temporada` | 154, 162 | construída |
| P5 | `/studio/grade` | 154 | construída |
| P6 | `/studio/acessibilidade` | 159 | construída |
| P7 | — | 156, 157, 158 | **ausente** |
| P8 | `/studio/revisar` | 153, 164 | construída |
| E1 | `/studio/ocorrencias` | 160, 161 | construída |
| E2 | `/studio/duplicatas` | 163 | construída |

Oito de dez existem em `src/app/(bastidor)/studio/`. As duas ausentes — P1 e P7 — são exatamente
as que o PRD da sessão marcou como cortáveis: **P2, P5, P6 e P8 eram as que não se cortavam, e
as quatro estão de pé.**

## 5. A jornada, na ordem que a ontologia exige

```
P2 identidade ──► chave ao vivo · aviso de duplicata
   │
P3 obra e elenco ──► atua_em com papel · proposta ao moderador se não existe
   │
P4 espaço e temporada ──► vigência · porta para a Organização se falta espaço
   │
P5 grade ──► as ocorrências reais
   │
P6 acessibilidade ──► o ato explícito de declarar, inclusive a ausência
   │
P8 revisão e envio ──► score, pendências, e a Situacao vira "em-moderacao"
```

Pular etapa grava registro sem chave. É por isso que a ordem é do modelo, não da tela.

## 6. As portas

| Falta | Vai para | Estado impresso |
|---|---|---|
| pessoa ou obra não existe | Moderador → Enciclopédia (117) | *proposta aguardando reconciliação* |
| espaço não existe | Organização (142) | *aguardando cadastro do espaço* |
| termo fora do vocabulário | Editor (130) | *termo proposto, em análise* |
| duplicata entre organizações | Moderador (113) | *escalonado* |

**Nenhuma trava o rascunho.** `NENHUMA_PORTA_BLOQUEIA` está no contrato: o produtor segue
preenchendo com a pendência visível, e envia quando ela se resolver.

## 7. O que este nível nunca faz

- Não edita `pessoa`, `coletivo` nem `obra` — **referencia e propõe.** Um produtor editar o
  verbete de um artista real é a violação exata que o projeto se proibiu.
- Não cria termo, linguagem, tema nem território.
- Não escreve fora da organização à qual pertence.
- Não cria ocorrência antes de temporada — a chave não fecha.
- Não salva imagem sem crédito.
- Não marca acessibilidade sem o ato explícito.
- Não decide duplicata que envolva outra organização.

## 8. O que este nível converte

| | Hoje | Depois |
|---|---|---|
| `ocorrencia` | 2.425 **`derivado`** | `produtor` |
| Espaço declarado | 0 de 2.425 | declarado |
| Ingresso declarado | 0 de 300 | declarado |
| Componentes da chave | **1 de 3** | 3 de 3 |
| Elenco em evento datado | 0 de 129 | declarado, com papel |
| Ficha de acessibilidade | 2.702 não declaram | declarada, inclusive a ausência |
| `faixaEtaria` | campo inexistente | seis valores, e "vou com criança" para de mentir |

**É a maior conversão de procedência do produto inteiro.**
