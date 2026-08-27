# Arquitetura

Como o protótipo funciona por dentro, e o que quebra se você mexer sem saber.

---

## 1. O formato

**Export estático.** `output: "export"` no `next.config.ts`. O artefato final é a pasta
`out/` com 2.463 páginas HTML que abrem em qualquer lugar — sem servidor de aplicação, sem
banco, sem API.

**Zero requisição de rede em execução.** Isso não é uma meta, é um invariante medido: as
suítes escutam `performance.getEntriesByType('resource')` e exigem que os 345 recursos
distintos sejam todos locais. Nenhum tile de mapa, nenhuma fonte remota, nenhuma chamada de
modelo. Se você adicionar uma, a suíte reprova.

Stack: **Next.js (App Router) + TypeScript + Tailwind 4**. Sem biblioteca de mapa, sem
biblioteca de busca, sem biblioteca de gráfico — o mapa é SVG próprio, a busca é filtro em
memória, os gráficos são HTML com largura calculada.

---

## 2. As duas visões

**A visão é estado da aplicação, não tamanho de janela.** Essa é a decisão mais estrutural
do projeto e a que mais confunde quem chega.

Um `ViewProvider` (`src/contexto/visao.tsx`) guarda `"mobile" | "web"` e escreve
`data-view` na raiz da casca. As variantes Tailwind `app:` e `desk:` respondem a esse
atributo.

```css
.desk\:grid-cols-2:is([data-view=web] *,[data-view=web]) { … }
```

**Por que não media query:** o alternador precisa funcionar numa telona de apresentação,
onde a janela é larga nas duas visões. Uma media query deixaria a demonstração refém do
tamanho do navegador do avaliador. Há exatamente **uma** `@media` no bundle inteiro, e ela
trata viewport realmente estreito.

**Três regras que decorrem disso:**

1. **Uma variante Tailwind só se aplica a classe utilitária.** `app:minha-classe-semantica`
   não funciona. Classe semântica precisa de CSS puro sob `[data-view="…"]`.
2. **Não existe componente irmão por visão.** Não há `ComponenteWeb` em lugar nenhum, de
   propósito. A divergência é de layout e densidade, dentro do mesmo componente. Criar um
   irmão duplica lógica que vai divergir na primeira correção.
3. **Na visão mobile, a moldura de celular é o contêiner de rolagem** — 390×844 fixos,
   `overflow-y: auto`, AMPLIADOS por `transform: scale(var(--escala-aparelho))` até o
   aparelho dominar a janela (fator medido contra o palco em `casca.tsx`, 26/08). Quem
   cresce é o objeto, nunca a medida: o app continua desenhado para 390 lógicos. Qualquer coisa ancorada na
   janela (`position: fixed`) escapa da moldura e ocupa a largura da tela inteira,
   destruindo a ilusão. Quem precisa grudar usa `sticky`, que resolve contra o contêiner de
   rolagem mais próximo.

**A régua de dobra**, medida e resolvida na fase 5: na visão app a barra de abas é
`sticky; bottom:0`, mede 60 px, e o limite útil é **807**. Na web é a mesma barra em
`top:0`, mede 59 px, limite **960**. Não subtraia altura — use o limite medido.

**No bastidor não há barra de abas**, e por isso a dobra do Studio é outra: a área útil da
moldura, **824** — 844 menos os 10 px de bezel de cada lado. Medir a barra de ação contra a
borda EXTERNA da moldura dá 834 e reprova uma barra que está exatamente no lugar certo,
encostada no fundo do vidro; a medida certa é contra `.moldura-rolagem`.

### D-67 e a exceção do Studio (2026-08)

**D-67 dizia: o bastidor só existe na visão web.** Ninguém resolve uma fila de mil
duplicatas em 390 px, e a tela declara isso em vez de espremer a tabela. Isso valia para as
52 rotas de bastidor, com um `app:hidden` só, em `(bastidor)/layout.tsx`.

**O perfil Produtor inverteu a regra para UMA superfície.** O Studio deixou de ser mesa de
trabalho densa e virou a ferramenta de quem alimenta o produto — e quem produz cultura no
Brasil produz do telefone. Uma ferramenta de publicação que só existe no computador não é
usada.

| Superfície | Visão | Onde a regra é aplicada |
|---|---|---|
| `/studio/*` | **mobile-first**, e também na web | `(bastidor)/studio/layout.tsx` — não monta `SuperficieSoWeb` |
| `/moderacao/*` | só web | `(bastidor)/moderacao/layout.tsx` |
| `/redacao/*` | só web | `(bastidor)/redacao/layout.tsx` |
| `/observatorio/*` | só web | `(bastidor)/observatorio/layout.tsx` |
| `/admin/*` | só web | `(bastidor)/admin/layout.tsx` |
| `/roteiro` | só web | `(bastidor)/roteiro/layout.tsx` |

**O `app:hidden` desceu do layout do grupo para o layout de cada superfície**, em
`SuperficieSoWeb` (`src/componentes/superficie-so-web.tsx`). A divergência continua sendo
CSS puro: o conteúdo já sai escondido no artefato estático e não depende de hidratação.

**Nenhum portão foi afrouxado — dois foram reescritos, e passaram a medir MAIS.**
`verificar-fase4.mjs` afirmava uma coisa («conteúdo de bastidor invisível no app») e agora
afirma duas: escondido onde a regra diz escondido, E VISÍVEL onde a regra diz visível. A
segunda metade é nova, e é ela que pega o defeito que a versão anterior não pegaria — um
`app:hidden` esquecido no Studio deixaria a superfície inteira invisível no telefone, e o
gate antigo daria verde. `verificar-moderacao.mjs` ganhou um bloco que MEDE a regra, onde
antes só a citava num comentário. Quem confere as duas metades nas seis superfícies é
`verificar-produtor.mjs`.

---

## 3. O grafo

### Do acervo à tela

```
dados/normalizado/*.json      ┐
dados/amostra/enciclopedia.jsonl ├──> scripts/gerar-grafo.mjs ──> src/dados/gerado/*.json
dados/taxonomia/*.json        ┘                                          │
dados/imagens/  ──────────────> public/acervo/                           │
                                                                          ▼
                                              src/dados/grafo.ts (travessia)
                                                                          │
                                                                          ▼
                                                        componentes e rotas
```

`npm run gerar-grafo` é **determinístico**: mesma entrada, mesma saída byte a byte. Rodar
duas vezes e comparar é um teste válido, e foi usado como tal.

O gerador tem uma função `conferir()` que valida invariantes e **sai com código diferente de
zero antes de escrever qualquer coisa**. Um grafo inválido nunca chega ao disco. Ela já
abortou duas vezes por razão legítima.

### As classes

19 classes, 7.810 entidades:

`ocorrencia` 2.425 · `conteudo` 1.805 · `pessoa` 575 · `midia` 529 · `termo` 481 ·
`territorio` 359 · `evento` 300 · `temporada` 287 · `instituicao` 246 · `obra` 239 ·
`coletivo` 217 · `espaco` 113 · `tema` 94 · `formacao` 54 · `publicacao` 46 · `linguagem` 33
· `pessoa-usuaria` 3 · `repertorio` 3 · `trilha` 1

Formato do id: `{classe}:{origem}:{idOrigem}` — por exemplo `evento:cms:13913`,
`pessoa:enc:26400`.

### As decisões de modelagem que carregam a proposta

**Evento ≠ Ocorrência.** Um evento é a entidade; uma ocorrência é uma sessão com início
exato num espaço. Critérios de identidade:

| Nível | Identidade |
|---|---|
| Evento | título normalizado + agente realizador + obra |
| Temporada | evento + espaço + intervalo |
| Ocorrência | temporada + início exato + espaço |

Essa separação resolve dois cenários do RFP com uma decisão só: mil duplicados colapsam
numa entidade com N ocorrências, e uma mudança de horário altera *uma ocorrência* sem
invalidar o evento nem avisar quem salvou outra sessão.

**Papel não é classe, é papel.** As classes de agente são `Pessoa`, `Coletivo`,
`Instituicao` e `EspacoCultural`. "Artista", "curador", "produtor" vivem na **aresta
`atua_em`**, nunca como campo do agente. A mesma pessoa é artista num evento e curadora em
outro. Modelar papel como classe gera duplicata estrutural — é exatamente o erro que o CMS
atual comete ao chamar de `participants` uma lista que só contém colunistas.

**Toda aresta `semelhante_a` carrega `motivo` legível em português.** Uma aresta sem motivo
é erro de geração, não item a preencher depois. É isso que permite a tela dizer *"parecido
porque os dois são eventos, de artes visuais, em São Paulo"* em vez de exibir um ranking
opaco.

**Toda entidade carrega `procedencia`.** `ic` quando veio do acervo, com a `fonte`;
`derivado` quando foi inferido deterministicamente; `autorado` quando foi escrito por nós.
Sem exceção — inclusive as autoradas.

### A API de travessia

`src/dados/grafo.ts` expõe nove funções: `porId`, `porSlug`, `vizinhos(id, relacao?)`,
`caminho(de, para, maxPassos)`, `porLinguagem`, `porTerritorio`, `ocorrenciasDe`,
`slugsPorTipo`, `contagens`.

**Nenhum componente importa `src/dados/gerado/*.json` diretamente.** Toda leitura passa pelo
grafo. O motivo é concreto: os JSON gerados somam 23 MB, e uma importação num componente de
cliente os arrastaria para o bundle. Há um portão que verifica isso — `DP-F`, transitivo,
sobre todos os arquivos com `"use client"`.

`GRAU_HUB = 60` é a trava de concentrador: nós com grau acima disso não servem de ponte na
caminhada, senão todo caminho passaria por "artes visuais" e nada significaria nada.

---

## 4. A cor como dado

Cada linguagem artística tem cor fixa, e **a cor vem do vocabulário gerado**, não do CSS nem
do componente. `vocabulario.json.linguagens[].cor` guarda o **nome do token**, que resolve
para uma custom property de `globals.css`.

Isso é deliberado e há um portão que o protege: **não existe mapa linguagem→cor em CSS nem
em TypeScript.** Duas fontes de verdade divergiriam na primeira edição. O efeito prático é
que a mesma linguagem tem a mesma cor no cartão, no mapa e no indicador — a cor vira
informação em vez de decoração.

---

## 5. Estilos

**Um bundle só.** As 21 folhas vivem em `src/estilos/` e são importadas por `@import` em
`src/app/globals.css`.

Isso já foi diferente e a mudança tem história: durante a fase 3, cada plano tinha seu CSS
importado do próprio componente, porque quatro executores corriam em paralelo e
`globals.css` era o único arquivo que os quatro tocariam. Funcionou para a paralelização e
cobrou o preço depois — importada do componente, cada folha virava um bundle por rota, e o
Next pré-carregava as três da barra de abas em toda tela, onde ficavam sem uso. O navegador
avisava em toda navegação, inclusive em telas que a fase 3 nunca tocou.

**Regra atual:** folha nova vai em `src/estilos/` **e** ganha uma linha de `@import` em
`globals.css`. `globals.css` só recebe `@import` e comentário — nunca uma regra. Há portão
para isso.

---

## 6. Verificação

Quatro suítes dirigindo Chrome headless sobre o `out/` estático a 1440×960 — largura
deliberada, para que nenhuma media query participe.

```bash
node scripts/verificar-fase2.mjs       #  67
node scripts/verificar-fase3.mjs       #  94
node scripts/verificar-fase4.mjs       #  99
node scripts/verificar-fase5.mjs       # 165
```

Duas suítes estáticas completam o conjunto e não precisam de `out/`:

```bash
node scripts/verificar-ds.mjs          # regras estruturais do design system
node scripts/verificar-tema.mjs        # contraste medido nos dois temas (contra `next dev`)
```

Elas medem **pixels e DOM vivo**, não HTML. Retângulos contra contêineres, cliques com
hit-test real, atributos lidos depois de dirigir a interação. Chrome ausente **reprova** o
script — verificação que se pula em silêncio produz relatório verde sobre nada.

### Sete armadilhas que já custaram caro

Estão documentadas porque cada uma passou despercebida uma vez:

1. **Grep de token de cor casa com prosa** — comentários que explicam o contrato disparavam
   o portão. Tire os comentários antes de grepar.
2. **`data-atributo` sem `="`** também conta o payload RSC que o Next embute no HTML. Um
   portão relatou 16 dimensões de acessibilidade onde a tela renderiza 8.
3. **`"use client"` aparece dentro de comentários** — 19 casamentos contra 14 diretivas
   reais.
4. **`import type` pode ocupar cinco linhas** e derrota casamento ingênuo.
5. **Atributos que só existem durante a interação medem 0 no HTML exportado.** O portão
   precisa dirigir a interação antes de medir.
6. **Comparar data como texto quebra** entre `DD.MM.AAAA` e ISO: `"27.06.1967" >
   "2026-08-22"` é verdadeiro. Compare anos extraídos.
7. **`visiveis()` falha em SVG** porque usa `offsetParent`, que só existe em `HTMLElement`.
   Os 88 pinos do mapa voltavam todos invisíveis.

### E a armadilha maior

**Sete vezes um portão passou com a tela visivelmente quebrada** — um índice fora do
viewport, uma primeira linha coberta pela barra, um mapa com o terço inferior abaixo da
dobra, um cartão borrado, uma grade fora de ordem, um formulário de veto abaixo da dobra, e
uma coluna sem largura mínima. **Todas as sete foram pegas por captura de tela, nenhuma por
número.**

Quando um portão afirma que algo é *usável* e não apenas *presente*, meça o retângulo
contra o contêiner — e olhe a imagem.

---

## 7. Onde a IA entra e onde não entra

O protótipo **não chama modelo nenhum**. Ele demonstra a *interface* de uma consulta
explicável: a frase vira critérios visíveis e editáveis, cada um removível com recálculo ao
vivo, e a tela diz que o casamento é por regra declarada. O portão de zero requisição
externa prova isso por processo, não por leitura de código.

Na Redação, itens de sugestão de IA aparecem marcados com `procedencia: ia` e score de
confiança visível. O rodapé declara os limites: não publica, não define destaque editorial,
não escreve verbete. **Vetar exige motivo escrito e o botão não conclui sem ele** — isso é
travado em dois lugares independentes, e o portão prova clicando no botão desabilitado,
forçando `Enter` e forçando `submit`.

---

## 8. Convenções

- **Português** em rotas, nomes de arquivo de componente, strings de interface e prosa de
  documentação. **Inglês** onde é idiomático em código.
- **Commits atômicos por tarefa**, em português, explicando o *porquê* e não só o *quê*.
- **`dados/` é somente leitura** para o código da aplicação. Só os scripts de coleta e
  geração escrevem lá.
- **A tela não fala do protótipo.** O modo comentado — o interruptor que ligava as
  anotações de spec sobre cada tela — foi removido do produto em 23/08. Selo de motivo,
  rótulo de procedência e declaração de ausência continuam sempre visíveis: eles são o
  argumento da proposta. Explicação sobre COMO a tela foi feita mora no comentário de
  código, não na interface.

---

## 9. O que está pendente

Registrado em `.planning/deferred-items.md` e em `ESTADO.md`:

- **`src/componentes/desertos.tsx`** dá ao `<title>` uma lista de filhos onde o React 19
  exige string única; o servidor emite `<title>` vazio e a camada perde a hidratação.
  Conserto de uma linha.
- **8 slugs de mídia** carregam caracteres fora de `[a-z0-9-]` — um traz o título inteiro
  emendado no meio, outro termina em espaço de largura zero. Corrigido na resolução da rota;
  o defeito de origem continua no gerador.
- **O contorno do Brasil** no mapa é traçado à mão e declarado como esquemático. Funciona,
  mas pode ler como desleixo numa apresentação.
- **"Parecido com" casa por texto, não por travessia de aresta** — das 856 arestas
  `semelhante_a` da Bienal, 322 ficam fora do alcance. A tela declara isso com número.
