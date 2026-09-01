# Nível 1 · Admin

> Governa o sistema e o vocabulário sobre o qual todos os outros escrevem. **Não produz conteúdo.**

| | |
|---|---|
| Superfície | Admin |
| Rota-raiz | `/admin` |
| Funcionalidades | 14 — de 87 a 100, mais a 169 |
| Telas | A1 a A10, **as 10 construídas** |
| Escreve | governança, território, papéis, limiares, chaves, suspensões |
| Nunca escreve | evento, verbete, aresta de sentido, trilha, matéria |
| Carimba | `procedencia` do que aprova, e o próprio nome na auditoria |

---

## 1. O que este nível é

O Admin é a única superfície que enxerga o sistema como sistema. Ele não decide se um evento
merece ficar no ar — isso é do Moderador — nem o que uma trilha significa — isso é do Editor.
Ele decide **quem pode decidir**, com que alcance, sobre qual território e sobre qual fila.

A consequência prática está em [ONTOLOGIA-E-ACESSOS §3](../../.planning/sessoes/ONTOLOGIA-E-ACESSOS.md):
níveis de acesso não são uma camada de segurança sobre a ontologia — **são o vocabulário de
procedência**. `Procedencia` tem hoje três valores (`ic`, `derivado`, `autorado`) e o PRD prevê
seis em produção. Cada papel humano concedido nesta tela é um valor de procedência que passa a
existir no grafo. Sem esta tela, os outros sete níveis não têm como carimbar quem escreveu.

A segunda regra que organiza o nível: **admin escreve, mas não apaga.** A trilha de auditoria é
imutável e o Admin é leitor dela, nunca editor. Suspender uma entidade a tira do ar e deixa
rastro; não existe caminho de exclusão silenciosa em nenhuma das dez telas.

## 2. O que ele escreve na ontologia

| Elemento | O que declara | Aprovação |
|---|---|---|
| `territorio` + centroide | a tabela de coordenadas e o `MetodoCoordenada` de cada registro | — |
| papel + escopo | a aresta que autoriza alguém a escrever | — |
| `linguagem` `tema` `termo` | **não escreve — aprova** o que o Editor propõe | é o aprovador |
| limiares do motor | dedupe, grau de hub, fanout, dose de serendipidade | — |
| chave de integração | por organização, com limite de uso | — |
| suspensão | tira do ar sem apagar | — |

`procedencia`, `chaveIdentidade` e `coordenada` continuam **campos de sistema, nunca digitáveis** —
nem pelo Admin.

## 3. As funcionalidades, uma a uma

### 87 · Concessão de papel como aresta com escopo
**Tela A1 —** `/admin/papeis`

Conceder papel não é marcar uma caixa num cadastro de usuário: é criar uma aresta com quatro
componentes — **papel + território + classe + fila**. "Moderador" sozinho não é uma concessão
válida; "moderador de agenda do Pará na fila de duplicatas" é. É o que torna o nível 4 possível.

### 88 · Vocabulário de procedência
**Tela A1 —** `/admin/papeis`

A tela mostra, ao lado de cada papel, **o valor de `procedencia` que ele carimba**. Conceder o
papel de produtor a alguém é o que faz `"produtor"` passar a existir como procedência no grafo.
A tela não deixa criar papel sem procedência correspondente.

### 89 · Territórios, bairros e centroides
**Tela A3 —** `/admin/territorio`

359 territórios no acervo. Cada coordenada carrega o método pelo qual foi obtida, e a tela
imprime esse método por registro — centroide de município é uma coisa, endereço geocodificado é
outra, e o mapa do público mente se as duas aparecerem com o mesmo peso. **25 das 27 unidades da
federação existem no acervo; Sergipe e Tocantins não.** A tela declara a ausência com denominador.

### 90 · Limiares do motor
**Tela A2 —** `/admin/motor`

Quatro parâmetros decidem o que o acervo produz: limiar de deduplicação, grau de hub, fanout da
caminhada no grafo e dose de serendipidade (funcionalidade 5). Mexer aqui muda o feed de todo
mundo — a tela mostra o efeito medido de cada parâmetro antes de aplicar, e registra a mudança
na auditoria com autor.

### 91 · Limites da IA (→ 86)
**Tela A5 —** `/admin/ia`

A IA propõe, **nunca publica, nunca destaca, nunca escreve verbete**. Esta tela é onde a regra
deixa de ser promessa de PRD e vira configuração inspecionável: cada capacidade da IA aparece
com o teto que não pode ultrapassar e com quem revisa o que ela produz. É a resposta direta à
pergunta do RFP sobre o limite da automação.

### 92 · Verificação de organização e de agente independente (→ 58)
**Tela A9 —** `/admin/governanca`

Quem é a instituição, quem responde por ela, o que foi conferido e por quem. Um agente
independente — produtor sem instituição — passa pelo mesmo rito.

### 93 · Trilha de auditoria completa e imutável
**Tela A7 —** `/admin/auditoria`

Toda escrita de todo nível, com autor, momento e o estado anterior. **Admin lê, admin não
apaga.** A tela não tem ação destrutiva: é o único lugar do produto onde a ausência de um botão
é a funcionalidade.

### 94 · LGPD — consentimento, exportação, exclusão, resposta ao titular (→ 57, 76)
**Tela A8 —** `/admin/titulares`

O pedido de quem é titular do dado chega aqui com prazo. Exportação e exclusão são atos com
registro; a exclusão de `pessoa-usuaria` e `repertorio` não pode derrubar o agregado que o
Observatório lê — por isso a anonimização (76) é do sistema, e a tela mostra o que sobra
depois dela.

### 95 · Reprocessamento do grafo e observabilidade (→ 77)
**Tela A6 —** `/admin/observabilidade`

Procedência, cobertura e frescor. Quantos nós são de máquina (hoje **78%**), quantos vêm do IC,
quantos são autorados. O reprocessamento é a ação que reconstrói arestas derivadas — e o painel
diz o que muda antes de rodar.

### 96 · Suspensão de entidade ou organização
**Tela A9 —** `/admin/governanca`

Sai do ar com rastro. Não existe apagar. Uma organização suspensa mantém o histórico dos
próprios registros e as decisões que a moderação tomou sobre eles.

### 97 · Chaves de integração e limites de uso
**Tela A9 —** `/admin/governanca`

Uma chave por organização, com teto. É o que sustenta a importação em lote do nível 6
(funcionalidade 150) sem que uma integração mal configurada inunde a fila de moderação.

### 98 · Autorização de envio em massa (→ 56)
**Tela A9 —** `/admin/governanca`

Quem pode disparar newsletter. A alçada é do Admin; a peça é do Editor (137). Separar os dois é
o que impede que quem escreve o texto seja também quem decide o alcance dele.

### 99 · Publicação e desligamento de superfícies
**Tela A9 —** `/admin/governanca`

Ligar e desligar app, seção e superfície de bastidor. Um dos quatro poderes operacionais da tela.

### 100 · Saúde do vocabulário
**Tela A4 —** `/admin/vocabulario`

Termos órfãos, sinônimos pendentes, linguagens candidatas — **sem escrever o tesauro**. A escrita
é do Editor (130). O Admin vê a doença e aprova o remédio; não formula.

### 169 · Desempenho da moderação por escopo
**Tela A10 —** `/admin/moderacao`

Tempo de fila e concordância entre moderadores, recortados por escopo. É o par do 124: se a fila
prioriza o vazio, esta tela é onde se vê se o vazio de fato subiu. Compartilhada com o nível 2
em `/observatorio/moderacao`, com leitura diferente — aqui é operação, lá é indicador.

## 4. As telas

| Código | Rota | O que resolve |
|---|---|---|
| A1 | `/admin/papeis` | 87, 88 |
| A2 | `/admin/motor` | 90 |
| A3 | `/admin/territorio` | 89 |
| A4 | `/admin/vocabulario` | 100 |
| A5 | `/admin/ia` | 91 |
| A6 | `/admin/observabilidade` | 95 |
| A7 | `/admin/auditoria` | 93 |
| A8 | `/admin/titulares` | 94 |
| A9 | `/admin/governanca` | 92, 96, 97, 98, 99 |
| A10 | `/admin/moderacao` | 169 |

As dez existem em `src/app/(bastidor)/admin/`. **A rota-raiz `/admin` não tem `page.tsx`** — o
Admin entra por uma das dez, sem página inicial.

## 5. As portas — o que chega e o que sai

| Chega de | O quê |
|---|---|
| Editor (130) | termo, linguagem ou tema proposto, aguardando aprovação |
| Moderador | escalonamento do que caiu fora do escopo (123) |
| Organização | pedido de verificação (141) |

O Admin **não devolve conteúdo** — devolve autorização. O que ele nega volta como decisão com
motivo, nunca como silêncio.

## 6. O que este nível nunca faz

- Não escreve `evento`, `temporada`, `ocorrencia` — é do Produtor.
- Não escreve `pessoa`, `coletivo`, `obra`, verbete — é do Editor, com aprovação do Moderador.
- Não escreve `influenciou`, `dialoga_com`, `deriva_de`, `curou` — sentido é do Editor.
- Não define destaque de feed — é do Editor (127), com autoria pública.
- Não apaga auditoria, e não apaga entidade: suspende.
- Não digita `procedencia`, `chaveIdentidade` nem `coordenada` — são de sistema.

## 7. O que este nível converte

| | Hoje | Depois |
|---|---|---|
| Valores de `Procedencia` | 3 (`ic`, `derivado`, `autorado`) | 6, um por papel humano |
| Papéis com escopo | nenhum | aresta com território + classe + fila |
| UFs no acervo | 25 de 27 | ausência de SE e TO **declarada**, não escondida |
| Método de coordenada | implícito | impresso por registro |
| Escrita sem autor | possível | impossível — inclusive a do Admin |
