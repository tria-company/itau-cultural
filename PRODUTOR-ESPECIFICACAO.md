# Perfil Produtor — especificação

> **Nada é escrito no repositório `bid-itau`.** Este documento e o de execução vivem em
> `C:\Users\luani\.claude\plans\`, fora do git.
>
> Documento irmão: **`execucao-produtor-sprints.md`** — os 13 sprints e as 180 tarefas.

## Contexto

O `bid-itau` é o protótipo da Agenda Cultural BR (RFP Itaú Cultural): Next 16 com
`output: "export"`, **sem back-end**, 88 rotas, 2.463 páginas, estado no navegador.

O projeto já tem **oito níveis de acesso desenhados e 51 telas de bastidor construídas** —
mas isso vive só em `.planning/sessoes/ONTOLOGIA-E-ACESSOS.md` e no código
(`src/dados/admin.ts:510`). **Nenhum arquivo de `docs/` menciona os níveis.**

### Três fatos da varredura que a proposta trata de frente

1. **Não existe autenticação, papel efetivo ou gate de rota** — nem uma linha (D-25). O "quem
   sou eu" é constante de módulo por superfície, usada só para carimbar `autor`. As cinco
   alçadas de `tipos-organizacao.ts:478` são **conteúdo de tela**: nenhum arquivo as lê.
2. **`/studio/` mistura dois níveis** (6 e 7), com dois armazéns (`studio.v1`,
   `studio.org.v1`) e **navegação para metade das telas** — as 8 do Produtor não se alcançam
   entre si e `/studio` não tem índice.
3. **Boa parte do conteúdo de vitrine hoje é constante em `.ts`:** `exposicoes-permanentes.ts`
   (2 exposições inteiras, 381 linhas) · `capas-museu.ts` (21 fachadas) · `ingressos.ts` (**2
   links de ingresso para 300 eventos**) · `alerta.ts` · `heroi.ts` · `apps.ts` ·
   `disposicoes.ts` · `frase.ts` · `estrelinha.ts`. **É conteúdo editorial vestido de código.**

## Decisões do usuário

| Ponto | Decisão |
|---|---|
| Escopo | **O Produtor recebe tudo que alimenta o produto** |
| Organização | **Separada totalmente.** Sai do Studio; gestão nova a definir |
| Publicação | **Direto ao ar** (Sympla); moderação vira fiscalização posterior |
| Acesso | **`/entrar` com perfis**, papel gravado no navegador |
| Persistência | **Sem banco.** Demonstração local, em memória, com reinício |
| Estilo | **Design system à risca**, parte da aplicação · **mobile first**, web em sub-etapa |
| Arquivos | **Fora do repositório.** Nada é gravado no git |

---

# ETAPA 1 — mapeamento e perfil

## 1A · Mapa do sistema

| Parte | Conteúdo |
|---|---|
| 0 · Como ler | O que é medido, o que é projeto, e a regra da casa: *ausência é declarada, com denominador* |
| 1 · Números | 7.810 entidades · 66.563 arestas · 34 rotas públicas · 52 de bastidor · **78% do grafo é máquina** |
| 2 · Superfícies públicas | Por tela: o que mostra · campos · módulo que alimenta · procedência · **o que um manager preencheria** · **o que ninguém preenche** |
| 3 · O conteúdo que hoje é código | Os 9 arquivos, um a um |
| 4 · O bastidor de hoje | 5 famílias e as **5 telas ausentes**: P1, P7, E6, E7, E8 |
| 5 · Matriz de alimentação | Classe × superfície pública × quem escreve × quem aprova |
| 6 · Campos órfãos | Ingresso **0/300** · espaço da sessão **0/2.425** · preço **sempre null** · elenco em evento datado **0/129** · acessibilidade **2.702 não declaram** · `faixaEtaria` e duração **inexistentes** · `programa` **0 instâncias** · corpo de matéria **53/1.850** |
| 7 · O que não se sustenta | Player real, retomada, dado de uso, lembrete, download, busca por voz |

**Escala:** Descobrir (75 cartões, **27 sem resumo**) · Acontece (300 eventos, **129 com
sessão**, 2.425 sessões) · Play (**113 de streaming**, 529 fichas) · Cast (**336 podcasts**) ·
Museu (2 permanentes, 5 cartazes, 21 espaços) · Cursos (54) · Notícias (1.805, **só 53
corpos**) · Enciclopédia (792+239+481+359) · Trilha (**1**) · IA (360) · Buscar (5.092).

**Música não é superfície** — é id de linguagem (81 dos 336 podcasts a declaram).

## 1B · O perfil Produtor

> **O Produtor alimenta o produto inteiro. A plataforma governa e fiscaliza.**

`/studio/*` reúne **as 28 telas de alimentação** sob navegação única e painel na raiz.
**Fora dele:** o verbete de `pessoa`, `coletivo` e `obra` da Enciclopédia — ele referencia,
vincula com papel e propõe, mas não reescreve verbete de artista real. Regra ética.

**A Organização deixa de fazer:** espaço e acessibilidade (142) · mídia (147, 148) · programa
e formação (143–146) · editais (149) · lote e chave (150, 151) · alcance e conformidade (152,
168). **Fica com ela**, na forma nova a definir: ficha da instituição e verificação (141) ·
equipe, alçadas e sucessão (139, 140).

**Publicação direta:**

```
rascunho ──► publicado          (imediato, se não houver impedimento)
                │
     fiscalização posterior ──► suspenso · devolvido · vetado   (com motivo e autor)
```

Publicar direto não é publicar incompleto: os impedimentos continuam barrando o botão.
Alterar horário, preço, esgotado ou cancelar **dispara alerta a quem salvou**.

---

# ETAPA 2 — a estrutura de criação e gestão

Para cada pauta: **o fluxo do usuário, a ficha em atos, e a tela pública que cada campo
alimenta.**

## 2.0 · O caminho do usuário — o fluxo mestre

```
/entrar ─ "Entrar como" ▸ ○ Público  ● Produtor  ○ Moderação  ○ Observatório  ○ Admin
   │
   ▼
/studio · PAINEL ─────────────────────────────────────────────────────────┐
  · o que está pendente de você     · lista única do que você alimenta    │
  · alcance dos seus registros      · editais compatíveis                 │
  [ + Criar ▾ ]                     [ reiniciar demonstração ]            │
   │  escolhe a PAUTA                                                     │
 ┌─┴─────┬───────┬───────┬───────┬─────────┬──────────┬────────┬─────────┐│
 Agenda  Play   Cast   Museu   Cursos  Editorial Curadoria Editais  ...  ││
 └─┬─────┴───┬───┴───┬───┴───┬───┴────┬────┴─────┬────┴───┬────┴─────────┘│
   └─────────┴───────┴───────┴────────┴──────────┴────────┘               │
                    │  FICHA em atos — cada ato salva sozinho             │
                    ▼                                                     │
             PRÉVIA + impedimentos                                        │
                    │                                                     │
        ┌───────────┴───────────┐                                         │
        ▼                       ▼                                         │
   [ Publicar ]          [ Salvar rascunho ] ───────────────────────────────┘
        │
        ▼
  tela pública alimentada ──► alterou hora/preço/esgotado/cancelou?
                                   └──► alerta a quem salvou
```

## 2.1 · Os catálogos modeláveis — os seletores, com os valores de hoje

**Tudo que é lista de escolha é ele quem modela.** Tela **Catálogos** (`/studio/catalogos`),
com o mecanismo do tesauro que já existe: criar · renomear · fundir · arquivar, **com alcance
medido antes de confirmar** ("este termo está em 68 registros").

| Catálogo | Valores de hoje | Onde está hoje |
|---|---|---|
| **Linguagens** (33, com cor) | acervo · animação · arquitetura · Arte · arte e tecnologia · artes visuais · audiovisual · cidade · cinema · circo · culinária · cultura popular · curta-metragem · dança · dança contemporânea · documentário · feminismo · fotografia · Gestão cultural · instalação · jornalismo · lgbtqia+ · literatura · memória · música · oficinas · patrimônio · performance · pesquisa · poesia · Rádio · teatro · TV | `vocabulario.json` — a **cor é token CSS vinda do dado** |
| **Temas** (94) | institucional 150 · ic play 143 · efemérides 131 · questões indígenas 131 · filme 118 · edital 104 · acervos 84 · ocupação 80 · acessibilidade 68 · exposição 68 … | idem — tag livre do CMS |
| **Categorias de mídia** (9) | Podcast · Série · Vídeo · Notícia · Entrevista · Coluna · Playlist · Agenda cultural · Acervo | `play.ts:73` — **categoria sem rótulo quebra o build** |
| **Categorias editoriais** (22) | Notícia · Entrevista · Coluna · Opinião · Rumos · Agenda cultural · Acervo · IC Play · Formação · Publicação · Observatório · Vídeo · Fotografia · Libras · Série · Visita · Exposição · Infantil · Podcast · Arte e acesso · Ocupação · Sem categoria | `leituras.ts:27` |
| **Seções editoriais** (4) | Notícias · Colunas · Entrevistas · Opinião | `leituras.ts:103` — **seção vazia derruba o build** |
| **Categorias do museu** (3) | Ocupação · Exposição · Exposição virtual | `museu.ts:99` |
| **Formatos de curso** (5) | Curso · Oficina · Pós-graduação · Encontro · Formação | `cursos-wire.ts:18` — hoje **adivinhado por regex** |
| **Formatos de asset** (4) | áudio · vídeo · texto · imagem | `tipos-organizacao.ts:690` |
| **Séries do Cast** (12) | Mekukradjá 71 · Toca Brasil 65 · Paiol Literário 44 · Ficções IC 35 · Escritores-Leitores 27 · Ficções: crianças 20 · Observe 20 · Versões do tempo 19 · série +70 10 · Rumos Possíveis 7 · Tá no ar, produção! 6 · Outros podcasts 12 | `prateleiras.ts` — hoje **derivado do título** |
| **Papéis do elenco** (3) | artista 426 · colunista 76 · participante 6 | lidos **das próprias arestas** |
| **Faixas etárias** (6) | livre · 10 · 12 · 14 · 16 · 18 | `tipos-acesso.ts:202` — no contrato, **sem tela** |
| **Canais de ingresso** (3) | link externo · bilheteria no local · agendamento | `tipos-acesso.ts:218` — no contrato, **sem tela** |
| **Dimensões de acessibilidade** (8) | audiodescrição · Libras · legenda descritiva · closed caption · legenda aberta · tradução simultânea · estenotipia · legenda | `tipos-acesso.ts:259` — **fechado** |
| **Recursos físicos** (5) | rampa · elevador · banheiro adaptado · piso tátil · vaga reservada | `tipos-organizacao.ts:53` — **fechado** |
| **Estados do edital** (4) | aberto · encerrado · em julgamento · resultado publicado | `tipos-organizacao.ts:1029` |
| **Territórios** | 359 no acervo · 27 UFs (**faltam SE e TO**) | grafo — **só o Admin acrescenta município** |

Três catálogos são fechados, e a tela diz por quê: as 8 dimensões e os 5 recursos vêm do CMS e
da norma de acessibilidade; território é governança. Os outros treze ele modela.

## 2.2 · O esqueleto comum

```
① IDENTIDADE  →  ② ESPECÍFICO DA PAUTA  →  ③ CLASSIFICAÇÃO  →  ④ PUBLICAÇÃO
   título*          (2.3 a 2.13)             linguagens          visibilidade
   resumo                                     temas               prévia
   capa + crédito*                            faixa etária        impedimentos
                                              acessibilidade + ato   [ Publicar ]
```

`*` obrigatório para publicar · **imagem sem crédito não salva** · campo com vocabulário nunca
é texto livre (livre → termo proposto, visível, sem travar) · procedência, chave e coordenada
são carimbo do sistema.

## 2.3 · AGENDA · a ficha do EVENTO

**Alimenta:** `/acontece` · `/evento/[slug]` · `/evento/[slug]/sessoes` · `/mapa` · `/salvos`.

```
[ + Criar ▸ Evento ]
① IDENTIDADE
   título ───────────► chave viva 1/3 ──► ⚠ "3 eventos parecidos" (avisa ANTES de salvar)
   quem realiza ─────► carimbado: a sua organização (não é campo)          → 2/3
   obra ▸ buscar nas 239 ─┬─ achou ────────────────────────────────────────► 3/3
                          └─ não achou ▸ [propor obra] ┄┄► pendência, segue
   resumo · capa + crédito* · linguagens ▸[33] · temas ▸[94]
② NATUREZA
   modalidade ──┬─ ● presencial ──► exige ESPAÇO no ato ④
                ├─ ○ online     ──► pede plataforma + link; DISPENSA espaço
                └─ ○ híbrido    ──► pede os dois
   formato ▸ [espetáculo · exposição · ocupação · show · oficina · encontro · visita · sessão]
   programação ─┬─ ● por sessões       ──► ato ⑤ obrigatório
                └─ ○ vigência contínua ──► ato ⑤ dispensado (exposição tem vigência, não sessão)
③ ELENCO   papel ▸[artista · colunista · participante · +novo]   ← papel VEM ANTES
   pessoa ▸ buscar nos 792 ─┬─ achou ──► vínculo
                            └─ não achou ▸ [propor] ┄┄► pendência, marcado como proposto
④ LOCAL E TEMPORADA
   espaço ▸ buscar nos 113 ─┬─ achou
                            └─ não achou ▸ [cadastrar espaço] ──► abre a ficha 2.12 aqui mesmo
   início* · fim*   ·   [ + outra temporada ] ← turnê
   remover temporada ──► "isto remove também as 12 sessões dela"
⑤ GRADE DE SESSÕES
   gerador: dias ▸ horários ▸ intervalo ──► PRÉVIA "gera 261 · teto 200" · ⚠ 4 colidem
   por sessão: data* · início* · término/duração · espaço · preço · gratuito · esgotado
⑥ COMERCIAL
   cobrança ──┬─ ○ gratuito  ├─ ● pago ▸ inteira · meia · "de X a Y"
              └─ ○ gratuito com retirada de ingresso
   canal ▸ [link externo · bilheteria no local · agendamento] ▸ link
   sem bilheteria? ──► inscrição: vagas · prazo · link
   faixa etária* ▸ [livre · 10 · 12 · 14 · 16 · 18]
⑦ ACESSIBILIDADE
   8 dimensões + 5 recursos físicos (se presencial)
   nenhuma marcada? ──► [ Declaro que não oferece nenhum destes recursos ]  ← ATO
   "a acessibilidade varia entre sessões?"
⑧ PUBLICAÇÃO
   visibilidade ▸ [público · privado por link · agendado ▸ data] · prévia · [ Publicar ]
```

| Campo | Tela pública |
|---|---|
| título · capa · linguagens | cartão em `/acontece`, `/descobrir`, `/buscar` |
| resumo | página do evento e cartão — **27 dos 75 cartões hoje não têm** |
| sessões | `/evento/[slug]` e `/sessoes` |
| espaço + cidade | pino em `/mapa` e `/cidade/[slug]` — hoje **0 de 2.425** |
| elenco com papel | "quem atua" no evento e no artista — hoje **0 de 129** |
| preço, canal, link | bloco de ingresso — hoje **2 de 300**, hard-coded |
| faixa etária | filtro "vou com criança", hoje no ar mentindo |
| alteração de hora | **alerta em `/salvos`** |

## 2.4 · PLAY · vídeo, série, playlist → `/play`, `/play/[slug]`

```
① IDENTIDADE  título* · resumo* · capa* + crédito* · linguagens · temas
② TIPO ──┬─ ○ vídeo avulso
         ├─ ● episódio de série ──► série ▸ escolher ou [criar] · nº do episódio
         └─ ○ playlist          ──► itens, em ordem
③ FONTE ─┬─ ● YouTube ▸ id  ──► o iframe SÓ nasce depois do clique (zero rede em runtime)
         ├─ ○ Vimeo   └─ ○ link externo    ·  duração · data*
④ DIREITOS  titular* · ▢ offline · ▢ incorporar
⑤ PONTES  evento (fala_sobre) · matéria (aprofunda) — hoje 0 de 529
⑥ ACESSIBILIDADE  8 dimensões + ato   (hoje 3 das 529 declaram Libras)
⑦ PUBLICAÇÃO  prévia do cartaz 3:2 e da ficha · [ Publicar ]
```
Tipo + série definem **em qual prateleira** o item cai (hoje adivinhado do título).

## 2.5 · CAST · podcast → `/cast`, ficha em `/play/[slug]`

```
① PROGRAMA* ▸ os 12 ou [criar]        ← hoje derivado do título
② EPISÓDIO  título* · número · temporada · resumo* · capa + crédito · linguagens
③ ÁUDIO  ● Spotify ▸ URL + espécie [show · episode · playlist] │ ○ link · duração ←novo
④ PARTICIPANTES  papel ▸ pessoa do acervo      ← novo (hoje ausência declarada)
⑤ TRANSCRIÇÃO   texto ou arquivo               ← novo — e é o que torna podcast acessível
⑥ ACESSIBILIDADE  8 dimensões + ato   (hoje as 336 declaram ZERO)
⑦ PUBLICAÇÃO
```
O Cast agrupa por **tamanho do programa**: a maior vira painel de destaque, as de menos de 8
episódios viram lista compacta com data.

## 2.6 · MUSEU · três objetos

```
[ + Criar ▸ Museu ] ─┬─ ○ Espaço-museu         ──► ficha 2.12 + horário + entrada + licença
                     ├─ ○ Exposição permanente ──► ficha abaixo (hoje 381 linhas de .ts)
                     └─ ● Exposição em cartaz  ──► ficha 2.3, com formato = exposição|ocupação,
                                                    programação = vigência contínua,
                                                    modalidade = online ▸ "Exposição virtual"
```
**Exposição permanente:** ① kicker · título* · subtítulo · lead* ② espaço-museu* · visita
(andares · entrada · horário) ③ galeria [foto* · alt* · crédito*] ④ vídeos [id* · título]
⑤ textos [título* · autor · cargo · parágrafos*] ⑥ percurso [título* · texto · imagem]
⑦ prévia da página inteira.

## 2.7 · CURSOS · formação → `/cursos`, `/cursos/[slug]`

```
① IDENTIDADE  título* · resumo* · capa + crédito* · linguagens
② FORMATO* ▸ [Curso · Oficina · Pós-graduação · Encontro · Formação]  ← hoje: regex
③ MODALIDADE ─┬─ ● presencial ▸ espaço (2.12)  ├─ ○ online ▸ plataforma  └─ ○ híbrido
   período: início · fim · dias e horários · carga horária
④ INSCRIÇÃO  ▢ aberta · vagas · prazo · link
   cobrança ─┬─ ○ gratuito  ← hoje: regex /gratuit/   └─ ● pago ▸ preço
   público-alvo · pré-requisitos · ▢ certificado
⑤ EDUCATIVO  material didático [+arquivo] · ▢ aceita visita ▸ data · horário · nº · escola
⑥ ACESSIBILIDADE  8 dimensões + ato   (hoje 5 com Libras, 1 com legenda)
⑦ SITUAÇÃO  ▢ cancelado ▸ motivo*    ← hoje: regex /cancelad/
⑧ PUBLICAÇÃO
```

## 2.8 · EDITORIAL · matéria → `/noticias`, `/noticias/[secao]`, `/materia/[slug]`

**Hoje só 53 das 1.850 páginas têm corpo** — a maior lacuna de alimentação do produto.

```
① FAMÍLIA* ──► muda a CARA da página (data-familia já existe)
   ○ notícia · ○ entrevista · ○ coluna  ──► hero com foto
   ● opinião ──► abre com aspas “, SEM foto     ○ publicação ──► capa de livro
② SEÇÃO* ▸ [Notícias · Colunas · Entrevistas · Opinião]  ← seção vazia derruba o build
   categoria ▸ [as 22 do catálogo]
③ CABEÇALHO  chapéu · título* · lead* · capa + crédito* · data*
④ AUTOR  nome · descrição       ← hoje só quando o crawl achou columnist:true
⑤ CORPO — editor de blocos  [ + bloco ▾ ]
     ¶ parágrafo · H subtítulo · " citação · ▣ imagem+crédito* · ▶ YouTube · ♪ Spotify
⑥ LIGAÇÕES  relação ▸[aprofunda · fala sobre · contextualiza] ▸ entidade ▸ motivo*
     └─► o motivo é o SELO que o público lê; selo em branco não publica
⑦ PUBLICAÇÃO  visibilidade · **agendar para** ▸ data (o calendário editorial, tela E8)
```

## 2.9 · CURADORIA · trilha, destaque, pontes → `/descobrir`, `/trilha/[slug]`

```
TRILHA    ① título* · resumo · assinatura*
          ② passos [+] de ▸ para ▸ relação ▸ motivo*  ⚠ passo sem motivo IMPEDE publicar
          ③ destino final ▸ evento com sessão datada   ④ prévia da cadeia
DESTAQUE  item ▸ feed ▸ assinatura* ▸ vigência        └─► um por feed; o novo substitui
PONTE     de ▸ relação [influenciou · dialoga com · deriva de · curou] ▸ para ▸ motivo* ▸ assinatura*
          └─► as quatro medem 0 arestas hoje
```

## 2.10 · PROGRAMA
① título* · resumo · capa+crédito ② edições [nome* · período] ③ eventos por edição.
`programa` tem **0 instâncias**: a classe existe, o motor a percorre, nada a povoa.

## 2.11 · EDITAIS
① título* · resumo* · prazo* ② estado ▸[aberto · encerrado · em julgamento · resultado]
③ linguagens ▸[33] · territórios ▸[27 UFs] · público-alvo ④ link · anexos.

## 2.12 · ESPAÇO · usada por evento, museu e curso
① nome* · endereço* · bairro · cidade/UF* → **coordenada por centroide do município**,
carimbada como derivada (latitude digitada não existe) ② capacidade · horário · entrada
③ fotos [foto* · alt* · crédito* · licença] ④ **acessibilidade num ato só**: 5 recursos
físicos + 8 dimensões + [ Declaro que não oferece… ] ⑤ volta para a ficha que a chamou.

## 2.13 · MÍDIA / ASSET
① arquivo/URL · título* · crédito* · alt* ② formato ▸[áudio · vídeo · texto · imagem] ·
duração · capítulos ③ direitos: titular* · ▢ offline · ▢ incorporar. Subir uma vez, usar
em muitas.

## 2.14 · Como ele GERE o que já publicou

Painel com: **pendências** agrupadas pelas portas · **lista única** (título · pauta ·
situação · visibilidade · data · alcance) com filtro e busca · **por linha**: editar ·
**duplicar** · despublicar · arquivar · ver como o público vê · **em massa**: publicar ·
despublicar · marcar esgotado · **editais compatíveis** · **reiniciar demonstração**.

```
editar sessão ▸ mudar hora ──► "12 pessoas salvaram esta sessão e serão avisadas"
                                    └─ [ confirmar ] ──► alerta em /salvos, com de → para
```
**Duplicar** é a ação mais usada de um produtor real: a próxima temporada, a próxima edição,
o próximo episódio nascem da anterior com tudo preenchido.

## 2.15 · Campos novos que a demonstração precisa

`modalidade` · `visibilidade` · `fim`/`duracao` · `preco` estruturado · `canalIngresso` ·
`linkIngresso` · `inscricao` · `faixaEtaria` · `serie`/`programa` · `formato`/`gratuito`/
`cancelado` de curso · `cargaHoraria`/`vagas`/`prazo`/`publicoAlvo` ·
`horarioDeFuncionamento`/`entrada` · `transcricao`/`participantes` · `licenca` · `autor`.
Todos aditivos — nenhum quebra o que existe. Quatro já estão no contrato e só faltam telas.

---

# ETAPA 3 — estilo, diagramação e movimento

**O Studio deixa de parecer bastidor e passa a ser aplicação.**

## 3.0 · A decisão que muda — D-67 invertido, e só para o Studio

Hoje o bastidor inteiro é escondido na visão app:

| Onde | O que diz hoje |
|---|---|
| `src/app/(bastidor)/layout.tsx:16` | `<div className="app:hidden">` embrulha **as 52 rotas** |
| `src/componentes/aviso-desktop.tsx` | mostra "Studio é superfície de desktop" + botão que troca para web |
| `src/estilos/studio.css:9` | *"O Studio só existe na visão web (D-67)… não há aqui nenhuma regra sob `[data-view="mobile"]`"* |
| `scripts/verificar-fase4.mjs:1108` | **afirma** `conteúdo de bastidor visível: false` na visão app |
| `scripts/verificar-moderacao.mjs:74` | idem, para a Moderação |

Mobile-first **inverte isso para o Studio** — e não para o resto:

```
/studio/*        ──►  mobile-first, dentro da moldura, com web em segunda visão
/moderacao/*     ──┐
/redacao/*       ──┼─►  seguem web-only: ninguém resolve fila de mil duplicatas
/observatorio/*  ──┤     em 390px, e a tela continua declarando isso
/admin/*         ──┘
```

**O que muda em código, nomeado:** o `app:hidden` sai do layout de bastidor e passa a ser
aplicado por superfície (Studio fora dele) · `superficieDe()` em `aviso-desktop.tsx` deixa de
nomear o Studio · os dois gates acima passam a afirmar *"Moderação escondida no app; Studio
visível"*, com a mesma sonda. **Nenhum gate é afrouxado — dois são reescritos.**

## 3.1 · O que o Studio herda, sem inventar nada

| Camada | O que usa |
|---|---|
| **Cor** | `--cor-acao` (laranja **é ação**, nunca decoração nem data) · `--cor-tinta/2/3` · `--cor-superficie/2` · `--cor-borda/forte` · `--cor-foco`. **Zero hex novo** — `color-mix` sobre `--ic-*` |
| **Cor de linguagem** | vem do **dado** (`vocabulario.json` guarda o token) — nenhum mapa linguagem→cor |
| **Tipografia** | `tipo-micro` · `tipo-legenda` · `tipo-detalhe` · `tipo-corpo` · `tipo-destaque` · `tipo-titulo-3/2/1` · `tipo-cartaz`. Text ≤16 / Display ≥17 soldados no utilitário |
| **Espaço** | grade de 0.25rem · `--espaco-tela` **1rem no app** / 1.5rem web · `--espaco-secao` 2/3rem · `--espaco-cartao` 0.75/1.25rem · `--espaco-pilha` 0.5/0.75rem |
| **Raio** | `--raio-p` capa · `--raio-m` cartão · `--raio-g` painel e folha · `--raio-pilula` chip |
| **Sombra** | `--shadow-1` hover · `--shadow-2` sticky · `--shadow-3` folha |
| **Primitivas** | `Botao` · `Chip` · `CartaoBase` · `CabecalhoSecao` · `LinhaLista` · `CampoBusca` · `Abas` · **`Folha`** (sheet no app, painel na web) · `EstadoVazio` |
| **Classes públicas do Studio** | `studio-painel` · `studio-tabela` · `studio-lados` · `studio-nao-sustenta` · `studio-botao` · `studio-pastilha` — **só acrescentar, nunca renomear** |

**Fichas de padrão reusadas:** o **shelf** do Spotify vira o trilho de pautas; o **card do
Dice** vira a linha da lista; os **chips de filtro** viram o filtro de situação; o **menu
lateral** do Google Arts vira a navegação (drawer no app, trilho de 240px na web).

## 3.2 · A diagramação mobile — 390×844, 370 úteis

O Studio passa a viver **dentro da moldura**: `fixed` só no `.canto`; drawer, folha e scrim
`absolute` contra a `.moldura`; o que gruda usa `sticky` contra `.moldura-rolagem`. **A régua
de dobra do app é 807px de altura útil** com a barra de 60px.

```
PAINEL                          FICHA EM ATOS                  FOLHA DE SELEÇÃO
┌────────────────────────┐      ┌────────────────────────┐     ┌────────────────────────┐
│ \ Studio          (av) │◄stick│ ← Novo evento       ⋯  │     │░░░░░░ scrim ░░░░░░░░░░│
│ Itaú Cultural          │      │ ●━●━○━○━○━○━○━○   2/8  │◄ato │┌──────────────────────┐│
├────────────────────────┤      ├────────────────────────┤     ││ ══                   ││
│ ⚠ 3 pendências       › │      │ NATUREZA               │     ││ Linguagens        33 ││
├────────────────────────┤      │ Modalidade             │     ││ [ buscar…          ] ││
│◄Agenda│Play│Cast│Museu►│◄chips│ ┌──────┬──────┬──────┐ │     ││ ✓ teatro             ││
├────────────────────────┤      │ │Presen│Online│Híbrid│ │44px ││   dança              ││
│ ┌────────────────────┐ │      │ └──────┴──────┴──────┘ │     ││   música             ││
│ │[■] O veneno do…    │ │      │ Formato                │     ││ + criar "teatro fís."││
│ │    publicado · 12  │ │      │ [ Escolher formato   ▸ ]│─────►│ [ Confirmar (2) ]    ││
│ └────────────────────┘ │      │ Programação            │     │└──────────────────────┘│
│ ┌────────────────────┐ │      │ ○ por sessões          │     └────────────────────────┘
│ │[■] Mekukradjá #72  │ │      │ ● vigência contínua    │      sobe do pé · --dur-3
│ │    rascunho        │ │      │                        │      absolute contra .moldura
│ └────────────────────┘ │      ├────────────────────────┤
├────────────────────────┤      │ [ Voltar ] [ Continuar]│◄─ barra de ação, absolute no pé
│      [ + Criar ]       │◄─────┴────────────────────────┘     (nunca fixed — D-03)
└────────────────────────┘
```

```
GRADE DE SESSÕES (a mais difícil em 370px)       PRÉVIA E PUBLICAÇÃO
┌────────────────────────┐                       ┌────────────────────────┐
│ GERADOR                │                       │ [ Cartão ][ Página ]   │◄ Abas
│ Dias  S T Q Q S S D    │                       │ ┌────────────────────┐ │
│ Horários [20:00] [+]   │                       │ │ o COMPONENTE       │ │
│ De 01.09 até 30.11     │                       │ │ PÚBLICO de verdade │ │
│ ┌────────────────────┐ │                       │ │ renderizado aqui   │ │
│ │ Gera 39 sessões    │ │◄ prévia ANTES         │ └────────────────────┘ │
│ │ ⚠ 2 colidem        │ │   de aplicar          │ ✗ falta crédito da capa│
│ │     [ Aplicar ]    │ │                       │ ✓ acessibilidade       │
│ └────────────────────┘ │                       │ ✓ chave 3/3            │
│ ── SESSÕES · 39 ──     │                       ├────────────────────────┤
│ ┌ 12 set · qui ──────┐ │◄ cartão por DIA       │ visibilidade  público ▾│
│ │ 20:00–21:30        │ │  (na web vira tabela) │ [ Publicar ]  desabilit│
│ │ Sala Vermelha      │ │                       └────────────────────────┘
│ │ R$ 40 · ▢ esgotado⋯│ │
│ └────────────────────┘ │
└────────────────────────┘
```

**Sete regras de diagramação mobile:**

1. **Um ato por tela.** O trilho de progresso é a navegação, e cada ato cabe acima da dobra.
2. **Alvo de toque ≥44px** em tudo que se toca.
3. **Seleção longa vira `Folha`**, nunca `<select>` nativo: 94 temas precisam de busca.
4. **Ação primária no pé**, `absolute` contra a moldura, com o conteúdo pagando o espaço dela.
5. **Cabeçalho `sticky`** com título da tela + progresso.
6. **Tabela não existe no app.** O que na web é linha de tabela, no app é cartão empilhado —
   **mesma árvore JSX, CSS diferente**.
7. **Laranja só em ação.** Situação (`publicado`, `rascunho`) usa pastilha neutra.

## 3.3 · As primitivas novas — todas em `base/`, nenhuma irmã por visão

| Primitiva | O que faz |
|---|---|
| `FichaEmAtos` | trilho de progresso + navegação entre atos + salvamento automático |
| `SeletorDeCatalogo` | busca + multi-seleção + "criar novo" que vira proposta |
| `CampoComProposta` | busca no acervo → achou vincula, não achou propõe e segue |
| `BarraDeAcao` | ação primária no pé, `absolute`, com espaço pago pelo conteúdo |
| `AtoDeDeclarar` | botão de largura inteira, sem raio de pílula (pílula é forma de controle curto; isto é uma afirmação) |
| `GradeDeSessoes` | gerador + prévia + lista; cartão no app, tabela na web |
| `Previa` | renderiza **o componente público real**, não uma imitação |
| `ListaDeImpedimentos` | o que falta, com link para o ato que resolve |
| `EditorDeBlocos` | os 6 tipos que `BlocoCorpo` já suporta |

## 3.4 · O movimento — o vocabulário que já existe

Nada de mola, nada de blur. `--ease-padrao` `cubic-bezier(.2,0,0,1)` em tudo, e
**`prefers-reduced-motion` zera**.

| Gesto | Token | O que acontece |
|---|---|---|
| Troca de ato | `--dur-2` 200ms | deslize curto + fade por View Transitions, com `data-nav`; cabeçalho **nomeado para não viajar junto** |
| Folha de seleção | `--dur-3` 320ms | sobe do pé; scrim em `--dur-2` |
| Chip, toggle, segmentado | `--dur-1` 120ms | cor + escala 0.98 no toque |
| Chave de identidade | `--dur-1` | os três terços **acendem** conforme fecham |
| Prévia da grade | `--dur-2` | a contagem conta até o número |
| Aviso de duplicata | `--dur-2` | entra de cima e **permanece** — aviso que pisca é aviso perdido |
| "12 pessoas serão avisadas" | `--dur-2` | idem, e o número é medido |
| Publicar | `--dur-3` | o registro sobe para a lista com a pastilha mudando |

## 3.5 · A folha nova e o portão

- **Uma folha só:** `src/estilos/produtor.css`, importada por `@import` em `globals.css`.
- **`studio.css` não é reescrita.** As seis classes públicas: **só acrescentar**.
- **`verificar-ds.mjs` continua valendo:** hex só em `globals.css` · `rem`/`ms` só em
  `tokens.css` · nenhum `text-[…rem]` em TSX · nenhum `text-align: center` em bloco.
- **Sem `fixed` fora do `.canto`** — e agora a suíte passa a medi-lo também no Studio.

## 3.6 · Sub-etapa 3B — o web mode

Sem tocar na árvore JSX: a divergência é CSS puro sob `[data-view="web"]`.

```
PAINEL · WEB 1440                                   FICHA · WEB 1440
┌──────────┬──────────────────────────────┐  ┌──────────┬──────────────┬──────────────┐
│ TRILHO   │ Studio · Itaú Cultural       │  │ TRILHO   │ ← Novo evento│ ▓ COLUNA     │
│ 240px    ├──────────────────────────────┤  │ 240px    │ ●━●━○━○ 2/8  │   COLADA     │
│          │ [busca] [situação▾] [+Criar] │  │          │              │   sticky     │
│ Agenda   ├──────┬───────┬────────┬──────┤  │ Agenda   │ Modalidade   │              │
│ Play     │título│ pauta │situação│ data │  │ Play     │ ○ ● ○        │ chave 2/3    │
│ Cast     ├──────┼───────┼────────┼──────┤  │ Cast     │ Formato ▾    │ score 67%    │
│ Museu    │ O ve…│Agenda │public. │21.05 │  │ Museu    │ Programação  │ pendências 2 │
│ Cursos   │ Meku…│Cast   │rascunho│  —   │  │ …        │ ○ ●          │ ── prévia ── │
│ …        │ Ocup…│Museu  │public. │  —   │  │          │              │ [ cartão ]   │
│ Catálogos│      │       │        │      │  │          │              │              │
│ Operação │  ← tabela densa, não cartão  │  │          │ [Voltar][Cont│ [ Publicar ] │
└──────────┴──────────────────────────────┘  └──────────┴──────────────┴──────────────┘
```

**Cinco divergências, e só cinco:** ① trilho lateral de 240px em vez de drawer e chips ·
② `studio-tabela` densa em vez de cartão · ③ ficha em duas colunas com **coluna colada**
(chave, score, pendências, prévia), reusando `.web-coluna-fixa` — que existe **porque este
defeito já aconteceu**: 1.279px numa janela de 960, com 319px inalcançáveis; a medida certa é
*"cada painel chega inteiro à vista"* · ④ `Folha` vira painel lateral · ⑤ escala tipográfica e
de espaço, **vindas dos tokens**.

A régua de dobra na web é **960**, com o trilho à esquerda e nada no pé.

---

## Verificação

1. **Todo número tem origem no disco** — `meta.json`, as constantes `*_ESPERADAS`, `find`/`ls`.
2. **Toda tela citada existe** — conferida contra `find src/app -name page.tsx`, com as 5
   ausentes marcadas.
3. **Todo seletor lista o que o app lista hoje** — conferido contra `play.ts:73`,
   `leituras.ts:27`, `cursos-wire.ts:18`, `museu.ts:99`, `tipos-acesso.ts`,
   `tipos-organizacao.ts` e `vocabulario.json`.
4. **Toda ficha fecha nos dois lados** — cada campo aponta a classe/campo da ontologia (ou é
   **campo novo**) **e** a tela pública onde aparece.
5. **Todo token citado existe em `tokens.css`.**
6. **Os dois gates de D-67 são reescritos, não afrouxados.**
7. **Captura de tela revisada a olho, nas duas visões** — a lição de `docs/ARQUITETURA.md` §6:
   sete vezes um portão passou com a tela visivelmente quebrada, e **as sete foram pegas por
   captura, nenhuma por número**.

## Fora de escopo

- **Escrever qualquer coisa no repositório `bid-itau`.** Enquanto não houver ordem sua, os
  documentos vivem fora do git.
- **Desenhar a forma nova da Organização** — a especificação nomeia o que ela deixa de fazer.
- Corrigir as inconsistências herdadas (`docs/TELAS-DETALHADO.md`, `.planning/deferred-items.md`,
  `referencias/` e `dados/imagens/` citados e inexistentes; duas numerações D-xx homônimas;
  `docs/telas.md` desatualizado desde 08/2026). Ficam **registradas** num anexo.

---

# Anexo A — conferência contra o disco (S0-03, S0-04)

Feita em 2026-08-26, contra `src/dados/gerado/meta.json` e `find src/app -name page.tsx`.

| Afirmação do documento | Medida no disco | Veredito |
|---|---|---|
| 7.810 entidades | `totais.entidades` 7810 | ✅ |
| 66.563 arestas | `totais.arestas` 66563 | ✅ |
| 34 rotas públicas | `find src/app/(app) -name page.tsx` → 34 | ✅ |
| 52 rotas de bastidor | `find src/app/(bastidor) -name page.tsx` → 52 | ✅ |
| 18 telas de Studio | `find src/app/(bastidor)/studio` → 18 | ✅ |
| 300 eventos · 129 com sessão · 2.425 sessões | `porClasse.evento` 300 · `agenda.eventosComOcorrencia` 129 · `porClasse.ocorrencia` 2425 | ✅ |
| 113 espaços · 239 obras · 529 mídias | `porClasse` espaco 113 · obra 239 · midia 529 | ✅ |
| 1.805 conteúdos · 54 formações · 46 publicações | `porClasse` | ✅ |
| 33 linguagens · 94 temas · 481 termos · 359 territórios | `totais` + `porClasse` | ✅ |
| 792 agentes na busca de elenco | pessoa 575 + coletivo 217 = **792** | ✅ (é a soma, não uma classe) |
| 2.702 registros não declaram acessibilidade | `fichaDeAcessibilidade.naoDeclaram` 2702 | ✅ |
| 1 trilha | `porClasse.trilha` 1 | ✅ |
| 78% do grafo é máquina | `porProcedenciaDeAresta.derivado` 51.600 / 66.563 = **77,5%** | ✅ arredondado |
| `atua_em` 508 arestas | `porRelacao.atua_em` 508 | ✅ |
| as 4 arestas de sentido medem quase zero | contextualiza **4** · dialoga_com **31** · fala_sobre **39** · influenciou **0** (não existe em `porRelacao`) | ⚠️ corrigido abaixo |

**Correção 1 — «as quatro medem 0 arestas hoje» (§2.9).** Três medem pouco, não zero:
`contextualiza` 4, `dialoga_com` 31, `fala_sobre` 39. A quarta, `influenciou`, não aparece em
`porRelacao` — essa sim é 0. A frase certa é **«uma mede zero e três medem menos de 40»**.

**Correção 2 — libras no acervo.** `acessibilidade.libras` mede **56** declarações diretas e
180 incluindo derivadas; `audio_description`, `descriptive_subtitle`, `closed_caption`,
`simultaneous_translation` e `stenotypy` medem **0**; `open_caption` e `subtitle` medem **1**.
Onde o documento diz «as 336 do Cast declaram zero», o denominador é do Cast e continua certo —
mas o acervo inteiro não é zero.

## As 5 telas ausentes, confirmadas

| Tela | Rota | Estado no disco |
|---|---|---|
| P1 · painel do Studio | `/studio` | **ausente** — `src/app/(bastidor)/studio/page.tsx` não existe |
| P7 · comercial e ingresso | `/studio/comercial` | **ausente** — e `tipos-acesso.ts:643,650` já aponta para ela |
| E6 · calendário editorial | `/redacao/calendario` | ausente |
| E7 · fila de propostas de termo | `/redacao/propostas` | ausente |
| E8 · agendamento de publicação | — | ausente (absorvida pelo ato 7 de §2.8) |

## Inconsistências herdadas — registradas, não corrigidas

Estão **fora do escopo deste trabalho**. Ficam aqui para quem for consolidar a documentação.

| Item | Estado |
|---|---|
| `docs/TELAS-DETALHADO.md` | citado por outros documentos, **não existe** |
| `.planning/deferred-items.md` | citado pelo PAINEL, **não existe** |
| `referencias/` | citada pelo design system, **não existe** |
| `dados/imagens/` | declarada como fonte em `meta.json`, **não existe** no repo (as 2.382 imagens estão em `public/`) |
| duas numerações `D-xx` homônimas | duas decisões diferentes com o mesmo número, em `ARQUITETURA.md` e nos planos de fase |
| `docs/telas.md` | existe, mas desatualizado desde 08/2026 — não lista as telas de Organização nem as de Admin |
| `cursos.css` | 11 medidas fora da grade; `verificar-ds.mjs` reprova. **Anterior a este trabalho** |

## Anexo B — o que `tipos-acesso.ts` já entrega (S0-06)

Lido inteiro. **Não precisa ser criado** — o contrato do Produtor estende, não redeclara:

| Já existe | O quê |
|---|---|
| `Situacao` + `SITUACOES` + `ROTULO_DA_SITUACAO` + `EXPLICACAO_DA_SITUACAO` | os 6 estados, com ordem de jornada e frase por estado |
| `SITUACOES_EDITAVEIS` + `editavel()` | quem pode escrever |
| `ProcedenciaDePapel` + `PROCEDENCIA_DO_PRODUTOR` | `produtor \| parceiro \| curador \| ia` sobre `Procedencia` |
| `Porta` + `PORTAS` + `Pendencia` + `NENHUMA_PORTA_BLOQUEIA` | as três portas, com nível responsável e saída |
| `FAIXAS_ETARIAS` + `ROTULO_DA_FAIXA` | os 6 valores |
| `CANAIS_DE_INGRESSO` + `ROTULO_DO_CANAL` | os 3 valores |
| `DIMENSOES_DE_ACESSIBILIDADE` + `acessibilidadeVazia()` + `algumaDimensaoMarcada()` | as 8 dimensões, com rótulo |
| `FRASE_DO_ATO_DE_DECLARAR` | a frase do ato |
| `RascunhoDoProdutor` + `VinculoDeElenco` + `TemporadaDoRascunho` + `OcorrenciaDoRascunho` | a ficha da agenda inteira |
| `chaveDoEvento` · `chaveDaTemporada` · `chaveDaOcorrencia` · `partesDaChave` · `chaveDaSessao` | a cadeia de identidade |
| `scoreDoRascunho` + `pendenciasDoRascunho` + `comChavesRecalculadas` | o score de 12 itens e o recálculo |
| `comSeparador` | formatação de número sem locale |
| `conversaoDoEnvio` + `MedidasDoAcervo` | o quadro de conversão |
| `AcaoDeModeracao` + `DecisaoDeModeracao` + `situacaoApos` + `decisaoCompleta` | a decisão da moderação |
| `CHAVE_DE_ARMAZENAMENTO` = `"studio.v1"` | a chave que `produtor.v1` vai absorver |

**Falta criar:** `Pauta`, `Registro` guarda-chuva, `Visibilidade`, `Modalidade`,
`FormatoDeEvento`, `ProgramacaoDoEvento`, `preco` estruturado, `fim`/`duracao`,
os 8 tipos por pauta, `impedimentosDe`, `podePublicar`, `motivosDeNaoPublicar`,
`CHAVE_DO_PRODUTOR` e a migração.

## Anexo C — desvios de nome, e por quê

| O plano dizia | O que foi feito | Motivo |
|---|---|---|
| `src/estilos/produtor.css` | `src/estilos/studio-produtor.css` | **`produtor.css` já existe** — é a folha da página pública `/produtor/[slug]`, com o prefixo `.pr-*`, escrita pelo plano 05-03. Sobrescrevê-la apagaria uma tela pública |

---

# Anexo D — o que foi construído (2026-08-26)

A especificação acima é o que se pretendia. Isto é o que existe no disco.

## Os arquivos novos

| Arquivo | O que é |
|---|---|
| `src/dados/tipos-produtor.ts` | o contrato: 11 pautas em união discriminada, `impedimentosDe()` exaustiva, migração de `studio.v1` |
| `src/dados/produtor-rotas.ts` | quais pautas têm ficha, e as telas da jornada — lista única, três consumidores |
| `src/dados/mock/seed-produtor.ts` | a semente e os oito catálogos, todos lidos do grafo |
| `src/componentes/produtor-estado.ts` | o armazém `produtor.v1`, com dupla trava na publicação |
| `src/contexto/papel.tsx` | os cinco perfis, com a superfície de cada um |
| `src/componentes/superficie-so-web.tsx` | o `app:hidden` que desceu do grupo para cada superfície |
| `src/componentes/base/` | 13 primitivas: ficha em atos, folha, seletor de catálogo, campo com proposta, ato de declarar, ficha de acessibilidade, impedimentos, visibilidade, campo de imagem, seletores de tempo, prévia, editor de blocos, barra de ação |
| `src/componentes/produtor-*.tsx` | painel, navegação, agenda, grade, play, cast, museu, espaço, cursos, editorial, curadoria, programa, mídia, catálogos, sessões |
| `src/componentes/publicado-pelo-produtor.tsx` | a ponte do Studio para as seis vitrines |
| `src/estilos/studio-produtor.css` | a folha, prefixo `.prod-*` |
| `scripts/verificar-produtor.mjs` | o portão, com `--provar-ausencias` |
| `scripts/testar-semente-produtor.ts` | o determinismo da semente |

## As rotas novas

`/studio` · `/studio/natureza` · `/studio/comercial` · `/studio/play` · `/studio/cast` ·
`/studio/museu` · `/studio/editorial` · `/studio/curadoria` · `/studio/catalogos` — e cinco
rotas herdadas reescritas: `publicar`, `elenco`, `temporada`, `grade`, `revisar`,
`formacao`, `espacos`, `midia`, `programa`, `editais`, `ocorrencias`.

## O que a demonstração NÃO sustenta, e diz que não sustenta

| | |
|---|---|
| Banco | não há. Tudo em `localStorage`, chave `produtor.v1`, com reinício |
| Autenticação | não há. O papel é preferência de navegador, e a tela de entrada diz isso |
| Usuários | não há. «12 pessoas serão avisadas» é autorado e determinístico |
| Publicação real | não há servidor. O publicado aparece na vitrine numa seção que declara que está gravado neste navegador |
| Imagem no corpo editorial | gravada, ainda não renderizada — `BlocoCorpo` tem cinco formas |
| Exposições permanentes | migradas para a semente e conferidas (19 percursos, 12 fotos, 5 vídeos, 3 textos), mas `exposicoes-permanentes.ts` continua sendo a fonte de `/museu/[slug]` |
