# S8 · Onboarding cultural — o perfil que substitui a persona

> Sessão do **app público**. É a primeira que trabalha em `src/app/(app)/`, território que o
> `PROTOCOLO.md` §6 declara intocável para as seis sessões de bastidor. A regra continua
> valendo para elas; esta sessão existe porque o escopo dela **é** esse território, e foi
> autorizada em 27.08.2026.
>
> Contexto compartilhado: [`ONTOLOGIA-E-ACESSOS.md`](ONTOLOGIA-E-ACESSOS.md) ·
> Protocolo: [`PROTOCOLO.md`](PROTOCOLO.md)

---

## 1. Objetivo e critério de pronto

**Objetivo.** Trocar a fonte do algoritmo cultural: hoje o feed de Descobrir sai de uma
escolha entre três personas de demonstração; ao fim desta sessão ele sai das **sementes que
a própria pessoa escolheu** no onboarding — linguagens e entidades do acervo — e cinco apps
ganham um recorte próprio de preferência, ancorado só no que o acervo declara.

**Critério de pronto.** Não é "as telas existem". É:

1. Duas pessoas com sementes diferentes veem **feeds diferentes** em `/descobrir`, e cada
   cartão continua explicando a travessia que o trouxe — o motivo aponta para a semente que
   a pessoa marcou, não para uma persona.
2. `/meu/repertorio` calcula a ampliação de repertório sobre as sementes escolhidas, e não
   sobre `PERSONAS`. É o indicador de impacto que o RFP pede; ele não pode continuar preso
   a três perfis fictícios.
3. Nenhuma tela do onboarding é porteiro. **Pular está disponível em todos os passos**, e o
   feed sem semente nenhuma funciona e diz por que está genérico.
4. `npm run checar` verde, com a falha conhecida de `cursos.css` (PROTOCOLO §5) como única
   exceção aceita.
5. `npm run verificar-onboarding` verde — a suíte nova desta sessão, descrita em §9.

---

## 2. Análise ontológica — o que o acervo sustenta como preferência

Tudo nesta seção foi **contado** contra `src/dados/gerado/` em 27.08.2026, não estimado.
É esta seção que decide quais perguntas existem, e ela é a parte do documento que a sessão
executora não pode renegociar sem recontar.

### 2.1 · Semente é linguagem ou entidade. Tema não é.

| classe | declara linguagem | declara tema |
|---|---|---|
| pessoa (575) | 423 | **0** |
| obra (239) | 239 | **0** |
| evento (300) | 225 | 81 |
| mídia (529) | 352 | 242 |
| conteúdo (1.805) | 1.064 | 1.162 |
| formação (54) | 24 | 39 |

**Nenhuma das 575 pessoas e nenhuma das 239 obras declara tema.** Uma pergunta de tema no
onboarding compartilhado produziria um perfil por onde a caminhada não anda: as duas classes
que a pessoa reconhece pelo nome são exatamente as duas que o tema não alcança. Tema só é
askável dentro do Notícias, onde 1.162 dos 1.805 conteúdos declaram — e lá ele é o eixo
certo.

### 2.2 · As 33 linguagens não valem o mesmo, e a tela mostra isso

Entidades por linguagem, contadas sobre `arestas.json` (relação `pertence_a`):

> artes visuais 2.623 · teatro 799 · literatura 736 · música 569 · cinema 324 ·
> audiovisual 280 · fotografia 225 · memória 198 · cidade 195 · dança 169 · pesquisa 161 ·
> arquitetura 160 · oficinas 140 · patrimônio 112 · poesia 95 · documentário 85 ·
> cultura popular 74 · acervo 64

São **18 com 50 ou mais**. As outras 15 vão de `arte e tecnologia` (49) até **culinária 1,
instalação 1, Rádio 1 e TV 1**. Marcar "TV" e receber um feed de um item é a falha que mata
a demonstração ao vivo. Por isso a grade abre com as 18, **a contagem fica colada no
rótulo**, e as 15 restantes ficam atrás de «ver todas» — visíveis, com o número à vista, e
nunca escondidas.

### 2.3 · Só 244 entidades têm rosto

151 das 575 pessoas e 93 das 239 obras têm imagem local. Uma grade de reconhecimento tem
**244 cartas**, não 814. O restante existe e continua alcançável **pela busca**, com carta
de iniciais no lugar da foto — o que não pode acontecer é uma grade onde três de cada quatro
cartas são um retângulo com um nome que ninguém reconhece.

### 2.4 · O Play não tem gênero, e "documentário" é uma armadilha

O acervo **não declara tipo nem formato de mídia** (`play.ts:28`). O que existe é
`extra.categoria`, e as 529 se dividem em: podcasts 336 · séries 63 · vídeos 46 · notícias
45 · entrevista 25 · colunistas 7 · playlists 4 · agenda-cultural 2 · acervos 1. Descontados
os podcasts, que moram no Cast, **o Play tem 193 mídias de assistir**.

"Documentário" *existe* — mas como **linguagem**, com 85 entidades no acervo inteiro. Dessas,
**4 são mídias não-podcast**. Cinema tem 15, curta-metragem 5. Uma tela do Play que oferece
"documentário" como preferência entrega quatro itens.

**Isto é uma trava, não uma observação:** a pergunta do Play é por categoria. Se a sessão
executora sentir vontade de "melhorar" a tela acrescentando gênero, o número acima é a
resposta.

### 2.5 · Os temas mais numerosos do editorial são operacionais

Dos 88 temas com conteúdo atrás, os maiores são `institucional` 147, `ic play` 118,
`filme` 108, `efemérides` 99, `edital` 97. Ninguém escolhe "edital" como interesse de
leitura. Então a lista do Notícias é **curada e marcada `procedencia: "autorado"`**, no mesmo
padrão que `disposicoes.ts` já usa para o vocabulário autorado — e a tela diz que é autorada.

Os temas de leitura com lastro: filme 108 · questões raciais 69 · ocupação 59 · questões
indígenas 54 · coronavírus 53 · debate 50 · políticas culturais 47 · acessibilidade 47.

### 2.6 · Não existe autor no acervo

Contado: **zero dos 1.805 conteúdos traz campo de autor**. "Seguir um colunista" não é
implementável, e a tela do Notícias declara essa ausência em vez de oferecer o filtro.

---

## 3. Restrições herdadas — o que não se negocia

**R1 · Não há servidor.** `output: "export"` (D-24): sem rota dinâmica, sem server action,
**sem chamada de rede em runtime**. O artefato é uma pasta que abre em qualquer lugar. Isso
proíbe buscar as sementes escolhidas por `fetch` — de `file://` a chamada morre em CORS, e
o motivo declarado da regra é a apresentação onde a rede falha (D-23).

**R2 · O grafo não vai ao navegador.** `entidades.json` 9,4 MB + `arestas.json` 13,6 MB.
Nenhum arquivo `"use client"` importa `grafo.ts`, `caminhada.ts` ou este precômputo por
valor (DP-F). O que atravessa a fronteira é DTO.

**R3 · Camada 3 nunca é porteiro de Camada 1** (D-19). Vale para o onboarding inteiro:
nenhum dos quatro passos bloqueia `/descobrir`.

**R4 · Ausência é declarada, com denominador. Nunca escondida, nunca preenchida com valor
plausível.** É a regra que atravessa o produto (`docs/apps/README.md`) e é o que separa
estas telas de um questionário genérico.

**R5 · O teto de payload já existe e é lei:** `TETO_PRECOMPUTO_BYTES = 1_500_000` em
`feeds.ts`. Estourar derruba o build com a instrução do que reduzir. O precômputo de
sementes entra **debaixo do mesmo teto**, somado ao que já existe.

**R6 · Cinco sessões de bastidor estão rodando** (S1, S2, S3, S5, S7). `globals.css` é o
arquivo de colisão: a linha de `@import` da folha nova é a primeira tarefa e **commita
sozinha**.

---

## 4. Escopo — funcionalidades numeradas

| # | funcionalidade | onde |
|---|---|---|
| S8-01 | Vocabulário de sementes: 847 no total — linguagem (33, com lastro contado) e entidade (814, das quais 244 com rosto entram na grade) | `src/dados/sementes.ts` |
| S8-02 | Precômputo: caminhada pelas 847 sementes, teto de 40 cartões por semente, tabela única de cartões, listas de índices | `src/dados/sementes-precomputo.ts` |
| S8-03 | Perfil na sessão: sementes marcadas em `localStorage`, `perfilId` derivado | `src/contexto/sessao.tsx` |
| S8-04 | Composição no cliente: união das sementes, ranqueamento por quantas alcançam, disposição por cima | `src/componentes/feed.tsx` |
| S8-05 | Onboarding passo 2 — linguagens | `src/componentes/onboarding-linguagens.tsx` |
| S8-06 | Onboarding passo 3 — rostos e obras, com busca e com as duas saídas | `src/componentes/onboarding-sementes.tsx` |
| S8-07 | Recorte do Play — categoria | `src/componentes/play-preferencia.tsx` |
| S8-08 | Recorte do Cast — fileiras | `src/componentes/cast-preferencia.tsx` |
| S8-09 | Recorte dos Cursos — formato | `src/componentes/cursos-preferencia.tsx` |
| S8-10 | Recorte do Museu — reentrada por obra | `src/componentes/museu-preferencia.tsx` |
| S8-11 | Recorte do Notícias — tema autorado | `src/componentes/noticias-preferencia.tsx` |
| S8-12 | Repertório lendo sementes em vez de `PERSONAS` | `src/dados/repertorio.ts` |
| S8-13 | Saída da troca de persona | `selecao-persona.tsx`, `troca-persona.tsx`, `/entrar` |

---

## 5. As telas, uma a uma

### 5.1 · Onboarding passo 1 — disposição · JÁ EXISTE, NÃO SE TOCA

`onboarding-disposicao.tsx`, entregue em DESC-01. *«O que te move hoje?»*, múltipla, sem
obrigatoriedade. Esta sessão **não mexe** — só herda o `useSessao` que ela já grava.

O rodapé passa de «passo 1 de 3» para «passo 1 de 4».

---

### 5.2 · Onboarding passo 2 — linguagens · NOVA

**Pergunta:** «Por onde você entra?»
**Subtítulo:** «Escolha quantas quiser. Dá para mudar depois.»

**Corpo.** Grade de 18 cartões, cada um com o rótulo e a contagem colada
(«artes visuais · 2.623»), pintado com a cor que a linguagem já declara no vocabulário —
a mesma cor que o selo de linguagem usa hoje, para a pessoa reconhecer a mesma linguagem
nos cartões do feed depois.

Abaixo, um botão de texto: **«ver as 33»**. Expande as 15 restantes na mesma grade, com a
contagem igualmente visível — inclusive as de contagem 1. Não há corte silencioso: quem
quiser marcar `Rádio` marca, e a contagem ao lado é o aviso.

**Seleção.** Múltipla. Sugere 3 («três já dão um bom começo»), aceita 1, não trava em
nenhum número.

**Rodapé.** «Avançar» e «Pular» — os dois sempre ativos (R3).

**Grava:** semente de linguagem em `useSessao`.

**Estado vazio:** não existe. A grade nunca está vazia — 33 linguagens são dado do build.

---

### 5.3 · Onboarding passo 3 — rostos e obras · NOVA · é aqui que o algoritmo nasce

**Pergunta:** «Escolha quem já te interessa.»
**Subtítulo:** «Artistas e obras do acervo. Quanto mais você marcar, mais o que aparece
depois se parece com você.»

**Corpo.** Grade de cartas com foto: **151 pessoas e 93 obras**. Ordenada pelas linguagens
do passo 2 — quem marcou música vê músicos primeiro. Sem linguagem marcada, a ordem é a do
desempate do produto (imagem local, depois hash semeado — nunca ordem alfabética de id, que
é a falha M-4 registrada em `caminhada.ts`).

**Busca.** Campo no topo, alcança as **814** pessoas e obras. Quem não tem foto aparece como
carta de iniciais, e só pela busca — nunca na grade. As 814 têm lista pré-computada (L2):
uma semente que a busca alcança e o build não calculou seria uma escolha que o feed ignora
sem dizer.

**Seleção.** Sugere 3, teto sugerido 12, sem travar.

**As duas saídas, e elas são obrigatórias.** Reconhecer 151 nomes do acervo do Itaú Cultural
não é garantido nem para quem trabalha com cultura:

- **«não conheço nenhum destes»** — rerola a grade por outra linguagem, sem sair da tela.
  É o botão que impede a tela de virar um teste de erudição.
- **«pular»** — segue adiante. O feed então caminha só pelas linguagens do passo 2, e
  `/descobrir` **diz isso na tela**: «este feed está vindo das linguagens que você marcou.
  Marque alguns artistas para ele ficar mais seu.»

**Grava:** semente de entidade em `useSessao`.

---

### 5.4 · Onboarding passo 4 — território e acessibilidade · FUNDE OS DOIS QUE JÁ EXISTEM

Os passos 2 e 3 de hoje são esqueleto rotulado e os dois são Camada 3. Viram **um** passo,
com duas seções na mesma rolagem: cidade + raio em tempo + «estou de viagem» na primeira,
as 8 dimensões de acessibilidade na segunda.

Continuam esqueleto onde são esqueleto, e continuam **sem poder bloquear** (R3). A fusão é
só para o onboarding não ter cinco passos — o que aumenta o abandono antes do passo 3, que é
o passo que alimenta o motor.

---

### 5.5 · Play — recorte de categoria

**Onde:** faixa dentro de `/play`, acima do catálogo. **Não é rota nova e não é modal.**
Aparece enquanto não há preferência de Play gravada; depois vira uma linha discreta
(«mostrando séries e vídeos · mudar»).

**Pergunta:** «O que você quer ver primeiro?»

**Opções, com contagem:** Séries 63 · Vídeos 46 · Notícias em vídeo 45 · Entrevistas 25 ·
Colunistas 7 · Playlists 4.

**A declaração de ausência, na própria faixa, em texto normal e não em nota de rodapé:**

> O acervo não declara gênero de filme. O que ele declara é a categoria acima — e das 529
> mídias, 336 são podcast e ficam no Cast. Aqui são 193 para assistir.

---

### 5.6 · Cast — recorte de fileira

**Onde:** faixa dentro de `/cast`, mesmo comportamento da do Play.

**Pergunta:** «Que programa você quer ouvir?»

**Opções — as 12 fileiras, que somam 336 exatos:** Mekukradjá 71 · Toca Brasil 65 · Paiol
Literário 44 · Ficções Itaú Cultural 35 · Escritores-Leitores 27 · Ficções: crianças 20 ·
Observe 20 · Versões do tempo 19 · série +70 10 · Rumos Possíveis 7 · Tá no ar, produção! 6 ·
Outros podcasts 12.

**Segunda pergunta, opcional, na mesma faixa:** linguagem. Com o aviso:

> 100 dos 336 podcasts não declaram linguagem. Eles continuam aparecendo — filtrar por
> linguagem aqui ordena, não corta.

---

### 5.7 · Cursos — recorte de formato

**Onde:** faixa dentro de `/cursos`.

**Pergunta:** «Em que formato você aprende?»

**Opções:** Curso · Oficina · Pós-graduação · Encontro · Formação — os cinco de
`ROTULOS_DE_FORMATO`, com a contagem de cada um contada no build.

**Sem pergunta de linguagem**, e a tela diz por quê:

> Das 54 formações, 24 declaram linguagem. Filtrar por ela esconderia 30 — então ela não
> filtra aqui. O acervo também não traz nota, preço nem instrutor.

---

### 5.8 · Museu — reentrada por obra

**Onde:** faixa dentro de `/museu`.

**Pergunta:** «Escolha 3 obras que te param.»

**Corpo:** grade grande das **93 obras com imagem**. É a mesma operação do passo 3 do
onboarding e grava a mesma semente — e é isso que ela é: **reentrada**, para quem pulou o
onboarding e chegou aqui. Se a pessoa já tem 3 ou mais sementes de entidade, a faixa não
aparece.

**A declaração, na faixa:**

> O museu virtual é a coleção e os 22 espaços. Exposições permanentes são 2, e eventos
> expositivos únicos, 5 — não é uma agenda de exposições.

---

### 5.9 · Notícias — recorte de tema

**Onde:** faixa dentro de `/noticias`.

**Pergunta:** «Sobre o que você quer ler?»

**Opções — lista autorada, `procedencia: "autorado"`, com contagem:** filme 108 · questões
raciais 69 · ocupação 59 · questões indígenas 54 · coronavírus 53 · debate 50 · políticas
culturais 47 · acessibilidade 47.

**Duas declarações, e as duas são obrigatórias:**

> Esta lista é nossa, não do acervo: dos 88 temas com matéria atrás, os maiores são
> operacionais — «institucional» tem 147 e «edital», 97.

> Não dá para seguir um colunista: nenhum dos 1.805 conteúdos traz o nome de quem assina.

---

## 6. Responsividade

Telefone é o alvo primário; web é onde a banca abre.

- **Grades de escolha (passos 2 e 3, Museu):** 2 colunas no telefone, 3 no tablet, 4 a 6 na
  web. Alvo de toque mínimo de 44px, e a contagem nunca some no menor porte — se não couber
  ao lado do rótulo, desce para a segunda linha do cartão.
- **Faixas de preferência nos cinco apps:** rolagem horizontal com pastilhas no telefone,
  linha única na web. A declaração de ausência **não vira tooltip no telefone** — ela é
  texto na faixa, nos dois portes. Esconder a ausência atrás de um toque é escondê-la.
- **Busca do passo 3:** teclado aberto não pode cobrir a grade — a lista de resultados
  rola sob o campo fixo.
- Medidas na grade de 0.25rem, tokens do DS, zero literal — `verificar-ds.mjs` reprova.

---

## 7. Lacunas de contrato — o que esta sessão precisa e não é dela

**L1 · `personaId` é usado por três sessões que estão rodando agora.** Medido:
`studio-ocorrencias.tsx` (S7) importa `PERSONAS` e `personaPorId` direto;
`redacao-destaque.tsx` (S5) chaveia destaques guardados por `feed.personaId`;
`contexto/pontos.tsx` chaveia o `localStorage` de pontos por `personaId`.

**Decisão que evita quebrar as três: `personaId` não é removido — ele muda de fonte.**
`sessao.tsx` deixa de expor uma escolha entre três personas e passa a expor um `perfilId`
derivado das sementes, mantendo `personaId` como alias enquanto S5 e S7 rodarem. Quem usa o
valor só como **chave** (pontos, destaques) continua compilando sem tocar em nada. Quem usa
como **seletor** (`selecao-persona`, `troca-persona`) sai.

A remoção do alias é a última tarefa e **exige S5 e S7 encerradas**. Se ainda estiverem
rodando, o alias fica e vira `PEDIDO` no arquivo de estado.

**L2 · O payload não está medido, e o PRD não vai chutá-lo.**

**São 847 sementes, não 277.** O universo é 33 linguagens + 814 entidades (575 pessoas +
239 obras) — porque a busca do passo 3 alcança as 814, e semente marcada sem lista
pré-computada é um perfil que o feed ignora em silêncio. **As 244 com rosto são o recorte
VISUAL da grade, nunca o universo do precômputo.**

O precedente é `feeds.ts`: 96 feeds inteiros dão 1,14 MB e caem para 0,23 MB com tabela de
listas distintas — cerca de 900 bytes por cartão serializado. Teto inicial de **40 cartões
por semente**; se as 847 sementes alcançarem a maior parte dos ~4.606 candidatos, a tabela
sozinha passa de 4 MB e **estoura o teto de 1,5 MB**.

Por isso a **tarefa 1 é uma medição**, e as válvulas estão em ordem: (a) tupla posicional
para o cartão, no padrão que `play-wire.ts` já usa para as 529 mídias; (b) teto por semente
de 40 para 24; (c) o campo `caminho` guarda ids e a frase é montada na tela; (d) por último,
reduzir o universo de sementes visuais. **Nenhuma tela é desenhada em cima de um número que
ainda não foi medido.**

**L3 · `globals.css`.** Uma linha de `@import` para `onboarding.css`. Primeira tarefa,
commit sozinha (PROTOCOLO §7).

---

## 8. Fora de escopo

- **Os outros 8 apps não ganham pergunta.** Descobrir e Roteiros com IA *consomem* o perfil;
  Buscar é intenção explícita e não preferência; Acontece e Mapa precisam de território, que
  é o passo 4 e não gosto; Comunidade, Desafios e Recompensas são consequência de uso —
  declarar preferência antes de usar inventa dado.
- Território e acessibilidade continuam esqueleto. Esta sessão os funde, não os implementa.
- Nada de conta, login ou sincronização entre aparelhos. `localStorage`, como D-25.
- Nenhuma tela de bastidor. Nenhum arquivo com prefixo `studio-`, `moderacao-`, `redacao-`,
  `admin-`, `observatorio-`.

---

## 9. Portões de verificação

`npm run checar` a cada tela. `npm run build` **só com a vez concedida** pela sessão de
controle (PROTOCOLO §4).

Suíte nova, `scripts/verificar-onboarding.mjs` → `npm run verificar-onboarding`:

1. **Nenhum porteiro.** Os quatro passos têm saída: «Pular» presente em todos, e
   `/descobrir` renderiza com zero semente.
2. **Toda contagem na tela vem do build.** Nenhum número literal de acervo em TSX — a
   suíte reprova dígito solto onde deveria haver valor contado. Regex de ausência **com
   `\b` só no começo**, nunca no fim (PROTOCOLO §9.1: `\bautor\b` não pega
   `autorDaDecisao`).
3. **As declarações de ausência existem, nas cinco faixas.** Play sem gênero, Cast com os
   100 sem linguagem, Cursos com os 30, Museu com 2 e 5, Notícias com a lista autorada e a
   ausência de autor. Faixa sem a sua declaração reprova.
4. **DP-F:** nenhum `"use client"` importa `grafo.ts`, `caminhada.ts`, `sementes-precomputo.ts`.
5. **Teto de payload:** o precômputo somado ao de `feeds.ts` continua abaixo de
   `TETO_PRECOMPUTO_BYTES`.
6. **Feeds diferentes:** dois conjuntos de sementes distintos produzem listas distintas.
   É o critério 1 de §1, e sem esse teste ele é uma promessa não conferida.

---

## 10. Ordem de execução — e o que não se corta

| # | tarefa | destrava |
|---|---|---|
| 1 | **Medição do precômputo** — rodar a caminhada pelas 847 sementes (33 linguagens + 814 entidades), serializar, medir. Escolher as válvulas de L2 antes de desenhar qualquer tela | tudo |
| 2 | `@import` de `onboarding.css` em `globals.css`, commit sozinho | — |
| 3 | `sementes.ts` — vocabulário, contagens, curadoria de tema do Notícias marcada `autorado` | 4, 5, 6 |
| 4 | `sementes-precomputo.ts` — tabela de cartões + listas de índices, sob o teto | 6 |
| 5 | `sessao.tsx` — sementes gravadas, `perfilId` derivado, `personaId` como alias (L1) | 6, 7 |
| 6 | `feed.tsx` — composição no cliente e ranqueamento por interseção | critério 1 |
| 7 | Onboarding passos 2 e 3 | critério 1 |
| 8 | Onboarding passo 4 — fusão de território e acessibilidade | — |
| 9 | As cinco faixas: Play, Cast, Cursos, Museu, Notícias | — |
| 10 | `repertorio.ts` lendo sementes | critério 2 |
| 11 | Saída da troca de persona — **só com S5 e S7 encerradas** (L1) | — |
| 12 | `verificar-onboarding.mjs` e a suíte verde | critério 5 |

**O que não se corta, em nenhuma hipótese:**

- **A tarefa 1 antes de qualquer tela.** Desenhar em cima de um payload não medido é como
  este PRD falharia inteiro.
- **As duas saídas do passo 3** (§5.3). Sem elas a tela vira teste de erudição e a pessoa
  que não reconhece ninguém fica presa.
- **As cinco declarações de ausência** (§5.5 a §5.9). São o que distingue estas telas de um
  questionário genérico, e o portão 3 existe para que elas não sumam num refinamento.
- **`personaId` como alias até S5 e S7 encerrarem** (L1). Removê-lo antes quebra duas
  sessões em voo.
- **A contagem colada no rótulo da linguagem** (§5.2). É ela que impede alguém de marcar
  «TV» e receber um feed de um item.
