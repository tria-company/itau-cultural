# Nível 8 · Público autenticado

> Escreve **repertório, salvos e sinais** — os únicos dados do produto que pertencem a quem os gerou. Dez apps e a Conta.

| | |
|---|---|
| Superfície | App — `/apps` |
| Rota-raiz | `/descobrir` |
| Funcionalidades | **62 do catálogo**, em 68 entradas |
| Faixa | 1 a 57, 78 a 81, 84, 86 |
| Escreve | `pessoa-usuaria`, `repertorio`, `trilha` própria, salvos, "eu fui" |
| Nunca escreve | qualquer classe pública do grafo |
| Lê | tudo que está publicado |

---

## 1. O que este nível é

É o nível para o qual os outros sete existem. As 86 funcionalidades do catálogo original
([funcionalidades.md](../funcionalidades.md)) são deste nível, e **a numeração não se renumera**:
uma funcionalidade citada em dois apps é a mesma funcionalidade vista de dois lugares.

Das 86, **62 chegam ao público**. As outras 24 — 37, 58 a 77, 82, 83 e 85 — só existem no
bastidor. Isso não é um recorte de permissão: é a descrição de quanta máquina e quanta redação
sustentam cada tela pública.

O que este nível escreve é pequeno e é o mais sensível do produto: 3 `pessoa-usuaria`, 3
`repertorio` e 1 `trilha` no protótipo. `repertorio` é a fonte do indicador de impacto cultural
(103) — **lido do que a pessoa marcou, não do clique** — e chega ao Gestor apenas agregado e
anonimizado (76).

Cada app tem documento próprio em [docs/apps/](../apps/), com o estado verificado no código.
Aqui está o que o **nível** tem; lá está o que **cada app** entrega hoje.

## 2. Os dez apps e a Conta

| App | Rota | Funcionalidades | Documento |
|---|---|---|---|
| Descobrir | `/descobrir` | 1 a 8 | [descobrir.md](../apps/descobrir.md) |
| Acontece | `/acontece` | 9 a 18 | [acontece.md](../apps/acontece.md) |
| Mapa | `/mapa` | 19 a 24 | [mapa.md](../apps/mapa.md) |
| Play | `/play` | 25, 26, 28, 29, 30 | [play.md](../apps/play.md) |
| Cast | `/cast` | 25, 26, 30, 38 | [cast.md](../apps/cast.md) |
| Museu virtual | `/museu` | 27, 31 a 36 | [museu.md](../apps/museu.md) |
| Notícias | `/noticias` | 38 a 41 | [noticias.md](../apps/noticias.md) |
| Cursos | `/cursos` | 42 a 45 | [cursos.md](../apps/cursos.md) |
| Buscar | `/buscar` | 78 a 81, 84 | [buscar.md](../apps/buscar.md) |
| Roteiros com IA | `/ia` | 21, 79, 86 | [ia.md](../apps/ia.md) |
| **Conta** | `/meu`, `/salvos` | 46 a 57 | — |

Onze blocos para dez apps: **a Conta não é um app.** É a área transversal da identidade, e por
isso a acessibilidade declarada nela (55) vale em todos os outros dez.

---

## 3. Descobrir — 8 funcionalidades

**Rota:** `/descobrir` · `/descobrir/porque/[id]`

1. **Feed por caminhada no grafo, não por popularidade** (1) — o que aparece vem de percorrer
   arestas a partir do repertório, não de um ranking. É a diferença entre descobrir e receber o
   mais visto.
2. **Entrada por disposição, não por categoria** (2) — "tenho 2h", "com criança", "de graça e
   perto", "quero algo que eu nunca vi". As disposições são escritas pelo Editor (135), com
   explicação e com o texto de ausência. *"Vou com criança"* hoje roda com `campoLido: null`,
   porque `faixaEtaria` não existe no tipo — depende do nível 7.
3. **Trilha de primeira vez** (3) — sequência guiada para quem nunca experimentou aquela
   linguagem.
4. **Fios de conexão navegáveis** (4) — "isto vem daquilo", clicável.
5. **Serendipidade dosada** (5) — injeção controlada de itens fora do perfil. A dose é um dos
   quatro parâmetros do Admin (90).
6. **Explicação de toda recomendação** (6) — `/descobrir/porque/[id]`. Nenhum item aparece sem
   ter como perguntar por quê.
7. **Destaque curado que sobrepõe o algoritmo** (7) — um por feed, assinado pelo Editor (127).
8. **Adjacência de repertório** (8) — um passo além do conhecido, nunca dez.

## 4. Acontece — 10 funcionalidades

**Rota:** `/acontece` · `/evento/[slug]` · `/evento/[slug]/sessoes` · `/filtros`

9. **Evento como entidade única, com N ocorrências** (9) — 300 eventos, 2.425 ocorrências.
10. **Lista de ocorrências: data, hora, espaço, preço** (10) — hoje **0 das 2.425 declaram
    espaço**, e a tela diz isso em vez de inventar.
11. **Filtros ontológicos** (11) — linguagem, gratuidade, acessibilidade, faixa etária,
    território. A faixa etária depende do campo que o nível 7 vai declarar.
12. **Salvar ocorrência e criar lembrete** (12).
13. **Alerta de alteração ou cancelamento** (13) — disparado pelo produtor (160).
14. **"Eu fui"** (14) — o registro de repertório. É esta marcação, e não o clique, que alimenta
    o indicador de impacto cultural do Gestor.
15. **Ficha de acessibilidade do evento e do espaço** (15) — duas fichas distintas: o espaço é da
    Organização (142), a sessão é do Produtor (159). Um `false` na ficha significa "não oferece"
    e nunca "não sabemos".
16. **Ingresso ou inscrição** (16) — hoje **0 de 300 eventos declaram ingresso**.
17. **Evento de longa duração** (17) — exposição e ocupação, com vigência em vez de sessões.
18. **Compartilhar evento ou trilha** (18).

## 5. Mapa — 6 funcionalidades

**Rota:** `/mapa` · `/cidade/[slug]`

19. **Mapa como lente sobre qualquer resultado, nunca como home** (19).
20. **Modo Cidade** (20) — planejar estadia de N dias em território desconhecido.
21. **Roteiro do dia** (21) — equilibra deslocamento e densidade. Compartilhada com o app de IA.
22. **Recorte por bairro e região** (22) — depende do bairro que a Organização declara no espaço.
23. **Camada de desertos culturais** (23) — onde não há oferta. **Sergipe e Tocantins não existem
    no acervo**, e o mapa mostra isso como ausência, não como área vazia.
24. **"Perto de mim agora"** (24) — por raio e por tempo.

## 6. Play — 5 funcionalidades

**Rota:** `/play` · `/play/[slug]`

25. **Catálogo de vídeo, série e playlist** (25) — 529 `midia`, subidas pela Organização (147).
26. **Player com retomada** (26).
27. **Play conectado ao evento** (28) — "não pode ir? veja isto".
28. **Legenda, libras e audiodescrição como filtro** (29) — funciona na proporção em que as oito
    dimensões foram declaradas no upload.
29. **Download e modo offline** (30) — baixa banda, escala nacional. Depende do direito de
    distribuição item a item (148), conferido pela moderação (115).

## 7. Cast — 4 funcionalidades

**Rota:** `/cast`

30. **Catálogo de áudio e podcast** (25).
31. **Retomada de episódio** (26).
32. **Offline** (30).
33. **Episódio ligado ao grafo** (38) — o episódio é uma entidade, não um arquivo solto.

## 8. Museu virtual — 7 funcionalidades

**Rota:** `/museu` · `/museu/exposicoes` · `/artista/[slug]` · `/obra/[slug]` · `/verbete/[slug]`

34. **Exposição e tour virtual** (27).
35. **Página de Artista** (31) — papéis, obras, movimentos, eventos vinculados. 575 pessoas no
    protótipo, **43.614 na base completa** — pessoas reais que nunca se cadastraram. É a razão de
    a Enciclopédia ser autoridade e o Studio só poder propor.
36. **Página de Obra** (32) — com expressões e montagens. 239 obras.
37. **Página de Movimento e Linguagem** (33).
38. **Verbete embutido no fluxo, não link para fora** (34).
39. **Acervo e coleção com mídia** (35).
40. **Linha do tempo e mapa de influências** (36) — depende de `influenciou`, que hoje tem **0
    arestas** e espera o Editor (128).

## 9. Notícias — 4 funcionalidades

**Rota:** `/noticias` · `/noticias/[secao]` · `/materia/[slug]`

41. **Matéria, coluna e entrevista ligadas ao grafo** (38) — 1.805 `conteudo`.
42. **Especiais como trilha curada** (39) — Ancestralidade, Arte e Acesso, Mekukradjá. A tela de
    escrita (E6) não foi construída.
43. **"Aprofunda isto"** (40) — a partir de qualquer evento ou obra, via `aprofunda` (887 arestas).
44. **Publicações e pesquisas com leitor próprio** (41) — 46 `publicacao`.

## 10. Cursos — 4 funcionalidades

**Rota:** `/cursos` · `/cursos/[slug]`

45. **Cursos e formações** (42) — 54 `formacao`.
46. **Biblioteca** (43).
47. **Agendamento de visita educativa** (44) — a agenda e as vagas são da Organização (145).
48. **Área do educador com material didático** (45).

## 11. Buscar — 5 funcionalidades

**Rota:** `/buscar` · `/buscar/frase`

49. **Busca unificada sobre o grafo** (78) — agenda, acervo, editorial e verbetes num só índice.
50. **Linguagem natural traduzida em consulta estruturada e explicada** (79) — a tradução é
    mostrada, não escondida. Se a busca entendeu errado, dá para ver onde.
51. **Facetas derivadas da ontologia** (80) — refletem o tesauro, que espera dono no nível 5.
52. **Zero-resultado vira descoberta** (81) — nunca beco sem saída.
53. **Similaridade com justificativa legível** (84) — o `motivo` é obrigatório por tipo, e são
    **47.259 arestas** de similaridade, nenhuma revisada por humano até o nível 3 rodar.

## 12. Roteiros com IA — 3 funcionalidades

**Rota:** `/ia` · `/ia/roteiro/[combinacao]`

54. **Roteiro do dia** (21).
55. **Tradução da pergunta, mostrada** (79).
56. **Limites explícitos da IA** (86) — **não publica, não destaca, não escreve verbete.** A regra
    é configurada no Admin (91) e é a resposta direta do produto à pergunta do RFP sobre o limite
    da automação.

## 13. Conta — 12 funcionalidades

**Rota:** `/meu` · `/meu/repertorio` · `/salvos` · `/trilha/[slug]`

57. **Identidade única em todo o ecossistema** (50).
58. **Onboarding por disposição, não formulário de gostos** (51).
59. **Salvos, agenda pessoal e histórico** (52).
60. **Mapa de repertório** (53) — o que atravessou e o que fica adjacente. A classe `repertorio`
    é o dado mais valioso do produto e o mais protegido: o Gestor só a vê agregada.
61. **Trilhas próprias e compartilháveis** (54) — a única classe pública que o nível 8 escreve.
62. **Preferências de acessibilidade aplicadas a todo o app** (55) — declaradas uma vez na Conta,
    valem nos dez apps.
63. **Notificações e newsletter** (56) — a peça é do Editor (137), a alçada de disparo é do Admin
    (98).
64. **Privacidade LGPD: consentimento, exportação, exclusão** (57) — o pedido chega ao Admin
    (94), com prazo.
65. **Editais e oportunidades filtrados por perfil** (46) — publicados pela Organização (149).
66. **Inscrição e acompanhamento de edital** (47).
67. **Alerta de edital compatível** (48).
68. **Onboarding de produtor a partir do edital** (49) — **a porta de entrada de agente que o
    produto tem**: quem se inscreve num edital vira agente no grafo e pode ser convidado a uma
    organização (139).

---

## 14. O que este nível escreve

| Classe | O que é | Quem lê |
|---|---|---|
| `pessoa-usuaria` | a identidade | ninguém além dela e do Admin, sob pedido LGPD |
| `repertorio` | "eu fui", o que atravessou | Gestor, **agregado e anonimizado** |
| `trilha` própria | sequência montada pela pessoa | quem ela compartilhar |
| salvos e alertas | estado local | ela |

## 15. O que este nível nunca faz

- Não escreve nenhuma classe pública do grafo — nem evento, nem verbete, nem termo.
- Não vê fila de moderação, procedência por item nem auditoria.
- Não tem acesso ao repertório de outra pessoa.
- Denúncia é o único canal de escrita dele para o bastidor (120) — e a tela do moderador que a
  receberia não foi construída.

## 16. O que este nível recebe dos outros sete

| Vem de | O que muda na tela pública |
|---|---|
| Produtor (7) | espaço, ingresso, elenco e acessibilidade deixam de ser vazios |
| Organização (6) | espaços com bairro, mídia com crédito, `programa` povoado |
| Editor (5) | fios de conexão, verbete, destaque, disposições e facetas com dono |
| Moderador (3) | similaridade revisada, elenco conferido, duplicata resolvida |
| Escopo (4) | o deserto sobe na fila, e o Pará chega ao mapa antes do quadragésimo evento de SP |
| Gestor (2) | nada — ele só lê |
| Admin (1) | centroides corretos, limites da IA, e o carimbo de quem escreveu cada coisa |

**Hoje 78% do grafo é máquina.** Cada linha desta tabela é o público vendo esse número cair.
