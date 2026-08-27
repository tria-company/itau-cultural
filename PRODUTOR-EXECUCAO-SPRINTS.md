# Perfil Produtor — execução em sprints

> **Nada é escrito no repositório `bid-itau`.** Este arquivo fica ao lado dele, fora do git.
>
> Documento irmão — a especificação (Etapas 1, 2 e 3):
> `C:\Users\luani\.claude\plans\vamos-criar-uma-nova-humble-lake.md`

Checklist de ações. Cada tarefa é um ato meu, com arquivo nomeado e critério de pronto.
**14 sprints · 239 tarefas.**

## O que estamos construindo

Um **perfil Produtor** que alimenta o produto inteiro — agenda, play, podcast, museu, cursos,
editorial, curadoria — dentro de um Studio **mobile-first**, com publicação direta ao ar, sem
banco, tudo em memória do navegador, seguindo o design system à risca.

| Decisão | Valor |
|---|---|
| Escopo | Produtor recebe tudo que alimenta o produto; Organização sai do Studio |
| Publicação | Direto ao ar; moderação vira fiscalização posterior |
| Acesso | `/entrar` com perfis; papel no navegador; gate de navegação, não de segurança |
| Persistência | `localStorage`, armazém único, com "reiniciar demonstração" |
| Estilo | Design system existente, zero token novo; mobile-first; web em sub-etapa |

## Restrições que valem em TODA tarefa

1. **Sem back-end.** Export estático, zero requisição em runtime.
2. **Sem relógio e sem sorteio.** `new Date()` e `Math.random()` fazem o HTML exportado
   divergir da página hidratada. Data vem de `DATA_DE_REFERENCIA = "2026-08-22"`.
3. **`localStorage` só em `useEffect`**, nunca no render.
4. **DP-F.** Componente `"use client"` importa módulo de dados **apenas por tipo**;
   `entidades.json` tem 9,4 MB.
5. **`fixed` só no `.canto`** de `casca.tsx`. Drawer, folha e scrim posicionam `absolute`
   contra a `.moldura`.
6. **Componente irmão por visão é proibido.** Divergência em CSS puro sob `[data-view]`.
7. **Zero hex novo**; `rem`/`ms` literais só em `tokens.css`; nenhum `text-[…rem]` em TSX.
8. **Ausência é declarada, com denominador.** Campo que o mock não sustenta diz que não
   sustenta.
9. **Não renomear as seis classes públicas de `studio.css`** (`studio-painel`, `studio-tabela`,
   `studio-lados`, `studio-nao-sustenta`, `studio-botao`, `studio-pastilha`) — são interface
   de outra sessão. Só acrescentar.
10. **Nunca mexer no repositório git.** Nem commit, nem push, nem arquivo novo dentro do repo
    sem ordem explícita.

---

# Sprint 0 · Especificação em disco e fundação do contrato

**Objetivo.** Criar o contrato de tipos e o armazém único antes de qualquer tela.
**Pronto quando.** Os documentos existem, `tsc --noEmit` limpo, e a semente carrega num
armazém só.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| S0-01 | ✅ | Gravar a especificação inteira | `plans/vamos-criar-uma-nova-humble-lake.md` |
| S0-02 | ✅ | Gravar este checklist de execução | este arquivo |
| S0-03 | ✅ | Conferir cada número dos documentos contra o disco (`meta.json`, constantes `*_ESPERADAS`, `find`) e corrigir o que divergir | os 2 docs |
| S0-04 | ✅ | Conferir cada rota citada contra `find src/app -name page.tsx`; marcar as 5 ausentes (P1, P7, E6, E7, E8) | os 2 docs |
| S0-05 | ✅ | Anexo de inconsistências herdadas: `docs/TELAS-DETALHADO.md`, `.planning/deferred-items.md`, `referencias/`, `dados/imagens/` citados e inexistentes; duas numerações D-xx homônimas; `telas.md` desatualizado | especificação |
| S0-06 | ✅ | Ler `tipos-acesso.ts` inteiro e listar o que já existe e **não precisa ser criado** (`Situacao`, `PORTAS`, `FAIXAS_ETARIAS`, `CANAIS_DE_INGRESSO`, `scoreDoRascunho`, as três funções de chave) | — |
| S0-07 | ✅ | Criar `src/dados/tipos-produtor.ts` — contrato do perfil unificado, **por extensão**, sem editar `tipos.ts` nem `tipos-acesso.ts` | novo |
| S0-08 | ✅ | Declarar `Pauta` = agenda · play · cast · museu · cursos · editorial · curadoria · programa · editais · espacos · midia, com rótulo e rota | `tipos-produtor.ts` |
| S0-09 | ✅ | Declarar `Registro` — o tipo guarda-chuva: `{id, pauta, situacao, visibilidade, titulo, …, carimbos}`, só primitivo, array e objeto literal (serializável) | `tipos-produtor.ts` |
| S0-10 | ✅ | Declarar `Visibilidade` = `publico \| privado \| agendado` + rótulo + explicação para a tela | `tipos-produtor.ts` |
| S0-11 | ✅ | Declarar `Modalidade` = `presencial \| online \| hibrido` + rótulo + a regra de qual campo cada uma exige | `tipos-produtor.ts` |
| S0-12 | ✅ | Declarar `FormatoDeEvento` (8 valores) e `ProgramacaoDoEvento` = `sessoes \| vigencia` | `tipos-produtor.ts` |
| S0-13 | ✅ | Estender a ocorrência com `fim`/`duracao`, `preco` estruturado (inteira, meia, faixa), `linkIngresso` | `tipos-produtor.ts` |
| S0-14 | ✅ | Declarar os tipos por pauta: `RegistroDePlay`, `RegistroDeCast`, `RegistroDeMuseu`, `RegistroDeCurso`, `RegistroEditorial`, `RegistroDeCuradoria`, `RegistroDePrograma`, `RegistroDeEdital`; reusar `CadastroDeEspaco` da organização | `tipos-produtor.ts` |
| S0-15 | ✅ | Escrever `impedimentosDe(registro)` — a função única que responde "pode publicar?" por pauta, reusando `scoreDoRascunho` para a agenda | `tipos-produtor.ts` |
| S0-16 | ✅ | Escrever `podePublicar(registro)` e `motivosDeNaoPublicar(registro)` — sem elas o botão promete o que não cumpre | `tipos-produtor.ts` |
| S0-17 | ✅ | Definir `CHAVE_DO_PRODUTOR = "produtor.v1"` e escrever a migração que absorve `studio.v1` e `studio.org.v1` **sem apagar as chaves antigas antes de ler** | `tipos-produtor.ts` |
| S0-18 | ✅ | Unificar o armazém: loja de módulo com `useSyncExternalStore`, no molde de `studio-estado.ts`, com `pareceEstado()` validando **na leitura** | `src/componentes/produtor-estado.ts` |
| S0-19 | ✅ | `reiniciar()` — apaga a chave e volta à semente. É o que faz a segunda apresentação valer tanto quanto a primeira | `produtor-estado.ts` |
| S0-20 | ✅ | Estender a semente determinística: além dos 5 registros de agenda, semear 1 de cada pauta a partir de registros **reais** do acervo (nenhum título inventado; o que é autorado é a situação) | `src/dados/mock/seed-produtor.ts` |
| S0-21 | ✅ | Provar o determinismo: gerar a semente duas vezes e comparar JSON byte a byte | script |
| S0-22 | ✅ | Rodar `npx tsc --noEmit` e `node scripts/verificar-ds.mjs`; registrar o estado (esperado: 40 verdes · 1 falha herdada em `cursos.css`) | — |

---

# Sprint 1 · Papel, acesso e a inversão de D-67

**Objetivo.** Entrar como produtor e chegar ao Studio, na visão app.
**Pronto quando.** `/entrar` → Produtor → `/studio` abre **dentro da moldura**, e Moderação,
Redação, Observatório e Admin continuam escondidos no app.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| S1-01 | ✅ | Criar `PapelProvider` no molde de `visao.tsx`: chave `agenda-cultural:papel`, leitura só em `useEffect`, sinalizador `hidratado` | `src/contexto/papel.tsx` |
| S1-02 | ✅ | Declarar `Papel` = `publico \| produtor \| moderacao \| observatorio \| admin`, com rótulo e rota de chegada | `papel.tsx` |
| S1-03 | ✅ | Valor desconhecido na chave cai em `publico`, nunca propaga (a lição de T-02-02 com persona) | `papel.tsx` |
| S1-04 | ✅ | Montar o provider na casca, ao lado de `ViewProvider` e `SessaoProvider` | `src/app/layout.tsx` |
| S1-05 | ✅ | Acrescentar o grupo "perfis de demonstração" em `/entrar`, abaixo das 3 personas, com o mesmo aviso de mock que já está na tela | `src/app/entrar/page.tsx` |
| S1-06 | ✅ | Componente de escolha de papel, no molde de `selecao-persona.tsx`; escolher grava e navega para a rota de chegada | `src/componentes/selecao-papel.tsx` |
| S1-07 | ✅ | Escrever na tela, com todas as letras, que **isto não é segurança**: a URL continua abrindo, porque num artefato estático não há como não abrir | `entrar/page.tsx` |
| S1-08 | ✅ | Tirar o `app:hidden` do layout de bastidor e passá-lo a ser por superfície | `src/app/(bastidor)/layout.tsx` |
| S1-09 | ✅ | Criar o layout do Studio, que **não** esconde no app e monta a navegação de pautas | `(bastidor)/studio/layout.tsx` |
| S1-10 | ✅ | Manter Moderação, Redação, Observatório e Admin escondidos no app, com o aviso de superfície intacto | `(bastidor)/layout.tsx` |
| S1-11 | ✅ | `superficieDe()` deixa de nomear o Studio | `src/componentes/aviso-desktop.tsx` |
| S1-12 | ✅ | Reescrever o gate que afirma `conteúdo de bastidor visível: false` para afirmar a regra nova: Moderação escondida, Studio visível | `scripts/verificar-fase4.mjs:1108` |
| S1-13 | ✅ | Idem no gate da Moderação | `scripts/verificar-moderacao.mjs:74` |
| S1-14 | ✅ | Menu lateral e `/apps`: o grupo de bastidor passa a listar só o que o papel abre | `menu-lateral.tsx` · `src/dados/apps.ts` |
| S1-15 | ✅ | Rota de chegada por papel: produtor → `/studio`, moderação → `/moderacao/fila`, observatório → `/observatorio`, admin → `/admin/papeis` | `papel.tsx` |
| S1-16 | ✅ | Trocar de papel sem passar por `/entrar`: item no menu da conta | `menu-lateral.tsx` |
| S1-17 | ✅ | Verificar por CDP: nas 4 superfícies web-only o conteúdo continua invisível na visão app; no Studio, visível | sonda |

---

# Sprint 2 · A casca do Studio, mobile-first

**Objetivo.** O Studio existe dentro do telefone, com navegação única e painel na raiz.
**Pronto quando.** As 10 pautas se alcançam entre si e `/studio` mostra a lista real.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| S2-01 | ✅ | Criar `src/estilos/produtor.css` e declarar o `@import` | `produtor.css` · `globals.css` |
| S2-02 | ✅ | Escrever o cabeçalho do arquivo com as regras que valem nele (tokens, sem hex, sem `fixed`, o que é público de `studio.css`) | `produtor.css` |
| S2-03 | ✅ | Casca da tela: `.prod-tela`, `.prod-cabecalho` (sticky), `.prod-corpo`, `.prod-rodape` | `produtor.css` |
| S2-04 | ✅ | Trilho de pautas horizontal, rolável, no padrão "chips de filtro" do design system (36px, `tipo-detalhe`, contorno `--cor-borda-forte`, selecionado preto cheio) | `produtor-navegacao.tsx` |
| S2-05 | ✅ | `BarraDeAcao` — ação primária no pé, `absolute` contra a moldura, com o conteúdo pagando o espaço em `padding-bottom` | `base/barra-de-acao.tsx` |
| S2-06 | ✅ | Criar a rota raiz `/studio` — a tela P1, que nunca existiu | `(bastidor)/studio/page.tsx` |
| S2-07 | ✅ | Painel: bloco "pendente de você", agrupado pelas três portas (obra/pessoa proposta, termo proposto, espaço a cadastrar) | `produtor-painel.tsx` |
| S2-08 | ✅ | Painel: lista única de registros — no app, cartão empilhado com capa 56px, título, pastilha de situação e alcance | `produtor-painel.tsx` |
| S2-09 | ✅ | Filtro por pauta e por situação, e busca por título | `produtor-painel.tsx` |
| S2-10 | ✅ | Menu `+ Criar` com as 10 pautas | `produtor-painel.tsx` |
| S2-11 | ✅ | Estado vazio com saída: "nenhum registro ainda — comece por um evento" | `produtor-painel.tsx` |
| S2-12 | ✅ | Rodapé com **reiniciar demonstração**, com confirmação | `produtor-painel.tsx` |
| S2-13 | ✅ | Pastilha de situação em cor neutra — **laranja é ação, situação é estado** | `produtor.css` |
| S2-14 | ✅ | Acrescentar a navegação de pautas às 18 telas de Studio que já existem, sem tocar no corpo delas | as 18 `page.tsx` |
| S2-15 | ✅ | Conferir por CDP que nada usa `position: fixed` dentro da moldura no Studio | sonda |
| S2-16 | ✅ | Medir a dobra: a ação primária cabe acima de 807px de altura útil | sonda |

---

# Sprint 3 · As primitivas de ficha

**Objetivo.** O maquinário que todas as 11 fichas reusam. Construído uma vez, no molde do
design system, sem componente irmão por visão.
**Pronto quando.** Uma ficha de brinquedo com 3 atos roda ponta a ponta usando só primitivas.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| S3-01 | ✅ | `FichaEmAtos` — trilho de progresso, navegação entre atos, salvamento automático em rascunho | `base/ficha-em-atos.tsx` |
| S3-02 | ✅ | Um ato por tela no app; trilho mostra `2/8` e acende em `--cor-acao` | idem |
| S3-03 | ✅ | Sair no meio não perde: cada mudança escreve no armazém | idem |
| S3-04 | ✅ | `SeletorDeCatalogo` — busca + multi-seleção + "criar novo" que vira proposta | `base/seletor-de-catalogo.tsx` |
| S3-05 | ✅ | No app abre como `Folha` (sheet inferior); na web, painel lateral — a primitiva `Folha` já prevê os dois | idem |
| S3-06 | ✅ | Nunca `<select>` nativo para catálogo longo: 94 temas precisam de busca | idem |
| S3-07 | ✅ | `CampoComProposta` — busca no acervo, achou vincula, não achou propõe e **segue sem travar** (`NENHUMA_PORTA_BLOQUEIA`) | `base/campo-com-proposta.tsx` |
| S3-08 | ✅ | A pendência criada aparece nomeada, com o nível responsável (117 moderação · 142 organização · 130 editor) | idem |
| S3-09 | ✅ | `AtoDeDeclarar` — botão de largura inteira, sem raio de pílula, com a frase completa | `base/ato-de-declarar.tsx` |
| S3-10 | ✅ | Marcar qualquer dimensão também declara a ficha; **desmarcar a última não devolve ao silêncio** — desfazer exige ato próprio com confirmação | idem |
| S3-11 | ✅ | `FichaDeAcessibilidade` editável: 8 dimensões + 5 recursos físicos quando presencial, num ato só | `base/ficha-de-acessibilidade.tsx` |
| S3-12 | ✅ | `Previa` — renderiza **o componente público real**, não uma imitação | `base/previa.tsx` |
| S3-13 | ✅ | Abas "Cartão" e "Página" na prévia, usando a primitiva `Abas` | idem |
| S3-14 | ✅ | `ListaDeImpedimentos` — o que falta, cada item com link para o ato que resolve | `base/lista-de-impedimentos.tsx` |
| S3-15 | ✅ | `SeletorDeVisibilidade` — público · privado por link · agendado para data | `base/seletor-de-visibilidade.tsx` |
| S3-16 | ✅ | `CampoDeImagem` — arquivo/URL + **crédito bloqueante** + alt; sem crédito não salva | `base/campo-de-imagem.tsx` |
| S3-17 | ✅ | `SeletorDeData` e `SeletorDeHora` sem biblioteca, aritmética em `Date.UTC` com leitores `getUTC*` — em fuso brasileiro a grade sai deslocada um dia sem nenhum portão ver | `base/seletores-de-tempo.tsx` |
| S3-18 | ✅ | Alvo de toque ≥44px em todos os controles novos | `produtor.css` |
| S3-19 | ✅ | Foco visível em `--cor-foco` em tudo que é focável | `produtor.css` |
| S3-20 | ✅ | Movimento: troca de ato `--dur-2` por View Transitions com `data-nav`; cabeçalho **nomeado para não viajar junto** | `produtor.css` |
| S3-21 | ✅ | Folha sobe em `--dur-3`, scrim em `--dur-2`; chip e toggle em `--dur-1` com escala 0.98 | `produtor.css` |
| S3-22 | ✅ | `prefers-reduced-motion` zera tudo | `produtor.css` |

---

# Sprint 4 · Ficha da AGENDA — o molde

**Objetivo.** O evento completo em 8 atos. É a ficha mais difícil e o molde das outras.
**Pronto quando.** Um evento nasce do zero, com sessões, ingresso e acessibilidade, e aparece
em `/acontece`, `/evento/[slug]` e `/mapa`.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| S4-01 | ✅ | Ato 1 · identidade: reusar a `/studio/publicar` que já existe, portada para `FichaEmAtos` | `studio-publicar.tsx` |
| S4-02 | ✅ | Chave viva: os três terços acendem em `--dur-1` conforme fecham (1/3 → 2/3 → 3/3) | idem |
| S4-03 | ✅ | Aviso de duplicata **antes de salvar**, e que **permanece** — aviso que pisca é aviso perdido | idem |
| S4-04 | ✅ | "Quem realiza" continua carimbo, não campo | idem |
| S4-05 | ✅ | Ato 2 · natureza — **tela nova**: modalidade, formato (8 valores), programação | `produtor-agenda-natureza.tsx` |
| S4-06 | ✅ | Modalidade `online` **dispensa espaço** e pede plataforma + link + ao vivo/sob demanda | idem |
| S4-07 | ✅ | Programação `vigência contínua` **dispensa o ato 5** e a temporada vira o período de visitação | idem |
| S4-08 | ✅ | Ato 3 · elenco: portar `/studio/elenco`, mantendo **papel antes da pessoa** | `studio-elenco.tsx` |
| S4-09 | ✅ | Papéis lidos das próprias arestas (artista 426 · colunista 76 · participante 6), com "+ novo papel" | idem |
| S4-10 | ✅ | Ato 4 · temporada: portar `/studio/temporada`, com **espaço antes do intervalo** | `studio-temporada.tsx` |
| S4-11 | ☐ | "Cadastrar espaço" abre a ficha do espaço **ali mesmo** e volta com ele selecionado | idem + S6 |
| S4-12 | ✅ | Remover temporada declara quantas sessões vão junto | idem |
| S4-13 | ✅ | Ato 5 · grade: portar `/studio/grade`, com gerador, prévia antes de aplicar e teto de 200 | `studio-grade.tsx` |
| S4-14 | ✅ | Detector de colisão continua valendo; provar **forçando** duas sessões iguais | idem |
| S4-15 | ✅ | Acrescentar **hora de término / duração** por sessão | idem |
| S4-16 | ✅ | No app a sessão é cartão agrupado por dia; na web vira tabela — mesma árvore | `produtor.css` |
| S4-17 | ✅ | Ato 6 · comercial — **a tela P7, que nunca existiu**; criar em `/studio/comercial`, a rota que `tipos-acesso.ts:643,650` já referencia | `studio/comercial/page.tsx` |
| S4-18 | ✅ | Cobrança: gratuito · pago · gratuito com retirada; preço inteira/meia/faixa | idem |
| S4-19 | ✅ | Canal de ingresso (os 3 do contrato) + link | idem |
| S4-20 | ✅ | Inscrição quando não há bilheteria: vagas, prazo, link | idem |
| S4-21 | ✅ | Faixa etária (os 6 do contrato) — **sem ela a disposição "vou com criança" mente** | idem |
| S4-22 | ✅ | Conferir que a rota morta do score deixou de ser morta | `tipos-acesso.ts` (só ler) |
| S4-23 | ✅ | Ato 7 · acessibilidade: portar `/studio/acessibilidade` para a primitiva, com os 5 recursos físicos quando presencial | `studio-acessibilidade.tsx` |
| S4-24 | ✅ | Pergunta "a acessibilidade varia entre sessões?" | idem |
| S4-25 | ✅ | Ato 8 · publicação: portar `/studio/revisar`, trocando "enviar para moderação" por **publicar** | `studio-revisar.tsx` |
| S4-26 | ✅ | Reescrever o texto do score: de "o que a moderação vai devolver" para "o que o público não vai ver" | idem |
| S4-27 | ✅ | Impedimentos duros continuam barrando o botão (título, crédito, temporada, sessões, ato de acessibilidade) | idem |
| S4-28 | ✅ | Seletor de visibilidade no ato 8 | idem |
| S4-29 | ☐ | Prévia com o cartão real do Acontece e a página real do evento | idem |
| S4-30 | ✅ | Publicar grava `situacao: publicado`, carimba `procedencia: produtor`, autor e data de referência | `produtor-estado.ts` |
| S4-31 | ✅ | Provar ponta a ponta por CDP: criar evento → publicar → abrir `/acontece` e ver o cartão | sonda |

---

# Sprint 5 · PLAY e CAST

**Objetivo.** Vídeo e podcast alimentados de verdade, com série/programa virando campo.
**Pronto quando.** Um episódio novo aparece na prateleira certa de `/cast` e a ficha abre em
`/play/[slug]`.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| S5-01 | ✅ | Rota `/studio/play` com a ficha de mídia audiovisual | novo |
| S5-02 | ✅ | Tipo: vídeo avulso · episódio de série · playlist | idem |
| S5-03 | ✅ | Série/coleção como **campo**, com "criar série" — hoje é derivado do nome repetido no título | idem |
| S5-04 | ✅ | Fonte YouTube: guardar só o id; **o iframe continua nascendo depois do clique** | idem |
| S5-05 | ✅ | Duração como campo novo | idem |
| S5-06 | ✅ | Direitos: titular, offline, incorporar (reusar `DireitoDeDistribuicao`) | idem |
| S5-07 | ✅ | Pontes: evento (`fala_sobre`) e matéria (`aprofunda`) — hoje 0 de 529 | idem |
| S5-08 | ✅ | Acessibilidade das 8 dimensões + ato | idem |
| S5-09 | ✅ | Prévia do cartaz 3:2 — e declarar que **4 das 325 capas são quadradas**, por isso o cartaz não é quadrado | idem |
| S5-10 | ✅ | Rota `/studio/cast` com a ficha de podcast | novo |
| S5-11 | ✅ | Programa como campo, escolhendo entre os 12 ou criando | idem |
| S5-12 | ✅ | Número do episódio e temporada do programa | idem |
| S5-13 | ✅ | Fonte Spotify: URL + espécie (show · episode · playlist) | idem |
| S5-14 | ✅ | **Participantes** com papel — campo novo; hoje é ausência declarada | idem |
| S5-15 | ✅ | **Transcrição** — campo novo; é o que torna podcast acessível, e hoje as 336 declaram zero | idem |
| S5-16 | ✅ | Acessibilidade de áudio: transcrição e legenda são as que contam | idem |
| S5-17 | ✅ | Ao criar programa novo, ele entra na régua de fileiras (destaque · trilho · compacta, por tamanho) | `prateleiras.ts` — ler |
| S5-18 | ✅ | Portar `/studio/midia` (O5) para a ficha de asset transversal | `studio-org-midia.tsx` |
| S5-19 | ✅ | Provar por CDP: publicar episódio → abrir `/cast` → ver na fileira certa | sonda |

---

# Sprint 6 · ESPAÇO e MUSEU

**Objetivo.** O lugar deixa de ser inferência, e as duas exposições permanentes saem do código.
**Pronto quando.** Um espaço cadastrado vira pino no mapa, e uma exposição permanente é criada
pela tela em vez de por `.ts`.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| S6-01 | ✅ | Portar `/studio/espacos` (O2) para o perfil, com a navegação nova | `studio-org-espacos.tsx` |
| S6-02 | ✅ | Acrescentar horário de funcionamento e entrada (gratuita/paga) | idem |
| S6-03 | ✅ | Fotos com **crédito e licença** — as 21 fachadas de hoje vêm da Wikimedia | idem |
| S6-04 | ✅ | Acessibilidade num ato só: 5 recursos físicos + 8 dimensões | idem |
| S6-05 | ✅ | Coordenada por **centroide de município**, carimbada derivada; latitude digitada não existe | idem |
| S6-06 | ☐ | Modo embutido: a ficha abre dentro de outra ficha e devolve o espaço selecionado | idem |
| S6-07 | ✅ | Rota `/studio/museu` com o seletor de três objetos | novo |
| S6-08 | ✅ | Espaço-museu → chama a ficha do espaço | idem |
| S6-09 | ✅ | Exposição em cartaz → chama a ficha do evento com formato e vigência pré-marcados | idem |
| S6-10 | ✅ | Ficha da exposição permanente: cabeçalho, espaço vinculado, visita | idem |
| S6-11 | ✅ | Galeria repetível: foto + alt + crédito | idem |
| S6-12 | ✅ | Vídeos repetíveis: id do YouTube + título | idem |
| S6-13 | ✅ | Textos assinados repetíveis: título, autor, cargo, parágrafos | idem |
| S6-14 | ✅ | Percurso repetível: título, texto opcional, imagem + alt + crédito | idem |
| S6-15 | ✅ | Migrar as 2 exposições de `exposicoes-permanentes.ts` para a semente, **sem perder uma linha** — 19 percursos, 12 fotos, 5 vídeos, 3 textos | `seed-produtor.ts` |
| S6-16 | ✅ | Provar que `/museu/[slug]` continua idêntica depois da migração, por captura antes e depois | sonda |
| S6-17 | ✅ | Portar `/studio/instituicao` (O1) — o que sobra dela no perfil, com a nota de que verificação é da Organização | `studio-org-instituicao.tsx` |

---

# Sprint 7 · CURSOS

**Objetivo.** Os três campos adivinhados por regex passam a ser declarados.
**Pronto quando.** Um curso novo declara formato, gratuidade e cancelamento sem que ninguém
leia o texto para adivinhar.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| S7-01 | ✅ | Portar `/studio/formacao` (O4) para a ficha nova | `studio-org-formacao.tsx` |
| S7-02 | ✅ | Formato como campo (5 valores) — hoje `classificarFormato()` adivinha por regex | idem |
| S7-03 | ✅ | Gratuito como campo — hoje `textoTemGratuito()` procura `/gratuit/` | idem |
| S7-04 | ✅ | Cancelado como campo + motivo — hoje `textoEstaCancelado()` procura `/cancelad/` | idem |
| S7-05 | ✅ | Manter a regex como **fallback declarado** para os 54 registros herdados, e dizer isso na tela | `cursos-wire.ts` |
| S7-06 | ✅ | Modalidade (presencial · online · híbrido) e local pelo espaço | idem |
| S7-07 | ✅ | Período, dias, horários e carga horária | idem |
| S7-08 | ✅ | Inscrição: aberta, vagas, prazo, link; cobrança e preço | idem |
| S7-09 | ✅ | Público-alvo, pré-requisitos, certificado | idem |
| S7-10 | ✅ | Material didático (arquivos) — a área do educador, func. 146 | idem |
| S7-11 | ✅ | Visita educativa: data, horário, nº de pessoas, escola, responsável | idem |
| S7-12 | ✅ | Acessibilidade + ato | idem |
| S7-13 | ☐ | Provar por CDP: publicar curso → `/cursos` mostra o formato declarado, não o adivinhado | sonda |

---

# Sprint 8 · EDITORIAL

**Objetivo.** Fechar a maior lacuna do produto: **53 corpos para 1.850 páginas**.
**Pronto quando.** Uma matéria nasce com corpo, autor e ligações ao acervo, e a página muda de
cara conforme a família.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| S8-01 | ✅ | Rota `/studio/editorial`, portando `/redacao/materia` (E5) | novo |
| S8-02 | ✅ | Família (5 valores) — e **a família muda a cara da página**: opinião abre com aspas e sem foto, publicação com capa de livro | idem |
| S8-03 | ✅ | Seção (4) e categoria (22) do catálogo editorial | idem |
| S8-04 | ☐ | Guarda: seção que ficaria vazia não pode ser criada — seção vazia derruba o build | idem |
| S8-05 | ✅ | Cabeçalho: chapéu, título, lead, capa + crédito, data | idem |
| S8-06 | ✅ | Autor: nome + descrição — hoje só existe quando o crawl achou `columnist: true` | idem |
| S8-07 | ✅ | `EditorDeBlocos` com os 6 tipos que `BlocoCorpo` já suporta | `base/editor-de-blocos.tsx` |
| S8-08 | ✅ | Bloco de imagem com crédito obrigatório dentro do corpo | idem |
| S8-09 | ✅ | Blocos de YouTube e Spotify, sem duplicar o que já está no cabeçalho | idem |
| S8-10 | ✅ | Ligações ao acervo com **motivo obrigatório** — o motivo é o selo que o público lê | idem |
| S8-11 | ☐ | Agendamento de publicação — o calendário editorial, a tela E8 que nunca existiu | idem |
| S8-12 | ☐ | Prévia nos 8 portes de cartão em que a matéria pode cair (capa, lateral, chamada, grade, lista, coluna, opinião, vitrine) | `base/previa.tsx` |
| S8-13 | ☐ | Provar por CDP: publicar matéria de opinião → `/noticias` mostra o porte certo e `/materia/[slug]` abre com aspas | sonda |

---

# Sprint 9 · CURADORIA, PROGRAMA, EDITAIS

**Objetivo.** As três pautas que faltam para o perfil estar completo.
**Pronto quando.** Uma trilha nova é percorrível em `/trilha/[slug]` e um edital dispara alerta.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| S9-01 | ✅ | Rota `/studio/curadoria` com o seletor de três objetos | novo |
| S9-02 | ✅ | Trilha: portar `/redacao/trilha` (E1), reusando `passosDaTrilha` e `trilhaCompletaPorSlug` — **não reimplementar a travessia** | `redacao-trilha.tsx` |
| S9-03 | ✅ | Passo sem motivo **impede publicar a trilha inteira**, e a tela diz qual passo | idem |
| S9-04 | ✅ | Destino final tem de ser evento com sessão datada; senão, "não publicável" com o motivo | idem |
| S9-05 | ✅ | Destaque: portar `/redacao/destaque` (E2), um por feed | `redacao-destaque.tsx` |
| S9-06 | ✅ | Pontes: portar `/redacao/pontes` (E3) com motivo e assinatura obrigatórios | `redacao-pontes.tsx` |
| S9-07 | ✅ | Rota `/studio/programa`, portando O3 — a classe com **0 instâncias** | `studio-org-programa.tsx` |
| S9-08 | ✅ | Edições do programa e vínculo com os eventos do produtor | idem |
| S9-09 | ✅ | Rota `/studio/editais`, portando O6 | `studio-org-editais.tsx` |
| S9-10 | ✅ | Estados do edital (4) e recorte por linguagem, território e público-alvo | idem |
| S9-11 | ☐ | O casamento com o perfil dispara o alerta no painel (func. 48, 166) | `produtor-painel.tsx` |

---

# Sprint 10 · CATÁLOGOS modeláveis

**Objetivo.** Tudo que é lista de escolha passa a ser dele.
**Pronto quando.** Criar, renomear, fundir e arquivar um termo funciona, com o alcance medido
antes de confirmar.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| S10-01 | ✅ | Rota `/studio/catalogos` | novo |
| S10-02 | ✅ | Listar os 16 catálogos, marcando os **três fechados** (8 dimensões, 5 recursos, território) e por quê | idem |
| S10-03 | ✅ | Linguagens: criar, renomear, fundir, arquivar — com a cor vinda do token, nunca hex | idem |
| S10-04 | ✅ | Temas (94), com contagem de uso | idem |
| S10-05 | ✅ | Categorias de mídia (9) — e a guarda: categoria sem rótulo quebraria a tela, então rótulo é obrigatório | idem |
| S10-06 | ✅ | Categorias editoriais (22) e seções (4) | idem |
| S10-07 | ✅ | Categorias do museu (3) e formatos de curso (5) | idem |
| S10-08 | ✅ | Séries do Cast (12) e papéis do elenco (3) | idem |
| S10-09 | ✅ | Faixas etárias, canais de ingresso e estados de edital — editáveis, com o aviso de que o público já lê esses rótulos | idem |
| S10-10 | ✅ | **Alcance medido antes de confirmar**: "este termo está em 68 registros; fundir move todos" | idem |
| S10-11 | ✅ | Termos propostos pelas fichas chegam aqui para aprovar ou fundir | idem |
| S10-12 | ✅ | Arquivar não apaga: some dos seletores, continua nos registros que já o usam | idem |

---

# Sprint 11 · Gestão pós-publicação

**Objetivo.** O que o produtor faz depois de publicar — que é a maior parte do trabalho real.
**Pronto quando.** Mudar o horário de uma sessão publicada dispara alerta em `/salvos`.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| S11-01 | ✅ | Editar registro publicado: abre a mesma ficha, com aviso de que está no ar | `ficha-em-atos.tsx` |
| S11-02 | ✅ | **Duplicar** — a ação mais usada: próxima temporada, próxima edição, próximo episódio | `produtor-painel.tsx` |
| S11-03 | ✅ | Duplicar limpa datas e situação, mantém identidade e ficha técnica | idem |
| S11-04 | ✅ | Despublicar → `suspenso`, com o histórico preservado | `produtor-estado.ts` |
| S11-05 | ✅ | Arquivar — some da lista principal, continua alcançável no filtro | idem |
| S11-06 | ✅ | Ações em massa: publicar, despublicar, marcar esgotado | `produtor-painel.tsx` |
| S11-07 | ✅ | "Ver como o público vê" abre a rota pública real numa aba | idem |
| S11-08 | ✅ | Portar `/studio/ocorrencias` (E1) para a gestão de sessões publicadas | `studio-ocorrencias.tsx` |
| S11-09 | ✅ | Mudança de horário mostra **quantas pessoas serão avisadas antes de confirmar** | idem |
| S11-10 | ✅ | Cancelamento exige motivo | idem |
| S11-11 | ✅ | Esgotado alterna sem passar por fila nenhuma | idem |
| S11-12 | ✅ | O alerta gerado entra em `/salvos` com de → para, quem informou e quando — ligando à mecânica que `alerta.ts` já tem | `src/dados/alerta.ts` |
| S11-13 | ✅ | Portar `/studio/duplicatas` (E2) — a máquina propõe, ele decide sobre os próprios registros | `studio-duplicatas.tsx` |
| S11-14 | ✅ | Portar `/studio/alcance` (O9) — com a declaração do que o mock não sustenta | `studio-org-alcance.tsx` |
| S11-15 | ✅ | Portar `/studio/conformidade` (O10) e `/studio/equipe` (O7), marcando o que passa à Organização | `studio-org-*.tsx` |
| S11-16 | ✅ | Portar `/studio/integracao` (O8) — importação em lote | `studio-org-integracao.tsx` |
| S11-17 | ✅ | Moderação vira fiscalização: a fila passa a listar **publicado recentemente**, amostragem e denúncia | `moderacao-fila.tsx` |
| S11-18 | ✅ | Ações da moderação passam a ser suspender, vetar e devolver — sobre o que já está no ar | `moderacao-item.tsx` |

---

# Sprint 12 · Sub-etapa web

**Objetivo.** A mesma árvore JSX, na janela do computador. **Sem componente irmão.**
**Pronto quando.** As mesmas telas rodam a 1440×960 com trilho lateral, tabela densa e coluna
colada — e o app não muda em nada.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| S12-01 | ✅ | Trilho lateral permanente de 240px sob `[data-view="web"]`, no padrão do menu lateral do DS | `produtor.css` |
| S12-02 | ✅ | Lista vira `studio-tabela` densa — mesma linha, outro CSS | idem |
| S12-03 | ✅ | Ficha em duas colunas | idem |
| S12-04 | ✅ | Coluna colada com chave viva, score, pendências e prévia, reusando `.web-coluna-fixa` | idem |
| S12-05 | ✅ | Medir **"cada painel chega inteiro à vista"**, não "a coluna cabe" — o defeito já aconteceu: 1.279px numa janela de 960, com 319px inalcançáveis | sonda |
| S12-06 | ✅ | Grade de sessões vira tabela | idem |
| S12-07 | ✅ | `Folha` vira painel lateral na web | `base/folha.tsx` |
| S12-08 | ✅ | Escala tipográfica e de espaço vêm dos tokens — nada escrito à mão | `produtor.css` |
| S12-09 | ✅ | Conferir que nenhuma regra nova sob `[data-view="web"]` vazou para o app, e vice-versa | sonda |
| S12-10 | ✅ | Medir a dobra da web: limite 960, trilho à esquerda, nada no pé | sonda |

---

# Sprint 13 · Portões, medidas e demonstração

**Objetivo.** Provar que está de pé, e deixar a demonstração pronta para rodar duas vezes.
**Pronto quando.** As suítes fecham, as capturas foram revisadas a olho, e há um roteiro do
produtor.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| S13-01 | ✅ | `npx tsc --noEmit` limpo | — |
| S13-02 | ✅ | `node scripts/verificar-ds.mjs` — 40 verdes · 1 falha herdada (`cursos.css`), sem regressão | — |
| S13-03 | ✅ | Acrescentar as telas do Studio a `scripts/medidas.mjs` — o PEDIDO-02 que ficou aberto | `scripts/medidas.mjs` |
| S13-04 | ✅ | Escrever `scripts/verificar-produtor.mjs` no molde de `verificar-moderacao.mjs` | novo |
| S13-05 | ✅ | Gate: nenhum `position: fixed` dentro da moldura no Studio | idem |
| S13-06 | ✅ | Gate: a ação primária cabe acima da dobra nas duas visões | idem |
| S13-07 | ✅ | Gate: publicar com impedimento é impossível — botão desabilitado **e** a função recusando por conta própria (duas travas, como o veto já faz) | idem |
| S13-08 | ✅ | Gate: a semente é determinística — duas leituras, mesmo JSON | idem |
| S13-09 | ✅ | Gate: reiniciar demonstração volta ao estado semeado | idem |
| S13-10 | ✅ | `--provar-ausencias`: injetar defeito em cada gate e conferir que ele fica vermelho. **Verde sobre caso que não aconteceu é verde falso** | idem |
| S13-11 | ✅ | Rodar `verificar-fase2/3/4/5` e conferir que só os dois gates de D-67 mudaram, e que mudaram para medir **mais**, não menos | — |
| S13-12 | ✅ | Rodar `verificar-admin`, `verificar-gestor`, `verificar-moderacao` | — |
| S13-13 | ☐ | Capturar as telas do Studio nas duas visões e **revisar a olho** — a lição das sete vezes | `scripts/capturar-telas.mjs` |
| S13-14 | ✅ | Acrescentar o Cenário 6 ao roteiro guiado: "o produtor publica um evento e ele aparece na agenda" | `src/dados/roteiro.ts` |
| S13-15 | ✅ | Conferir zero requisição externa em runtime nas telas novas | sonda |
| S13-16 | ✅ | Conferir console limpo: 0 erro, 0 aviso, em toda a navegação do Studio | sonda |
| S13-17 | ✅ | Atualizar `README.md` e `ESTADO.md` com o perfil novo e como demonstrá-lo | — |
| S13-18 | ✅ | Atualizar `docs/ARQUITETURA.md`: D-67 passa a ter exceção nomeada | — |

---

## Ordem e dependências

```
S0 contrato ──► S1 acesso ──► S2 casca ──► S3 primitivas ──┬─► S4 agenda ──┬─► S11 gestão
                                                            ├─► S5 play/cast│
                                                            ├─► S6 espaço/museu
                                                            ├─► S7 cursos   │
                                                            ├─► S8 editorial│
                                                            └─► S9 curadoria┘
                                            S10 catálogos (paralelo a S5–S9)
                                                                     └──► S12 web ──► S13 portões
```

**S4 é o molde:** as fichas de S5 a S9 só começam depois que o evento estiver de pé, porque
elas reusam o mesmo maquinário. **S6 antes de S4-11:** a ficha do espaço precisa existir para
o evento poder chamá-la — ou S4-11 fica pendente até S6 fechar.

## Riscos declarados

| Risco | Mitigação |
|---|---|
| A inversão de D-67 quebra gates de outras sessões | S1-12 e S1-13 reescrevem os dois; S13-11 confere que nada mais se moveu |
| Migrar as 2 exposições permanentes perde conteúdo | S6-15 migra linha a linha; S6-16 compara capturas antes e depois |
| Unificar os dois armazéns perde o que já está gravado | S0-17 escreve a migração; a chave antiga não é apagada sem ler |
| `next dev` reescreve `tsconfig.json` e suja o diff | já aconteceu e está declarado em `.planning/estado/S7.md`; não desfazer |
| Sprint 8 é grande demais para uma sessão | o `EditorDeBlocos` (S8-07 a S8-09) pode virar sprint próprio |
| `cursos.css` já está vermelho no portão | falha herdada, anterior a este trabalho; o critério é "40 verdes e só ela" |

## Contagem

| Sprint | Tarefas |
|---|---:|
| S0 · contrato e semente | 22 |
| S1 · papel e acesso | 17 |
| S2 · casca mobile | 16 |
| S3 · primitivas | 22 |
| S4 · agenda | 31 |
| S5 · play e cast | 19 |
| S6 · espaço e museu | 17 |
| S7 · cursos | 13 |
| S8 · editorial | 13 |
| S9 · curadoria, programa, editais | 11 |
| S10 · catálogos | 12 |
| S11 · gestão | 18 |
| S12 · web | 10 |
| S13 · portões e demonstração | 18 |
| **Total** | **239** |

---

# Notas de execução — o que divergiu do plano, e por quê

Escritas durante a execução. Cada uma é um lugar onde o disco discordou do documento.

## Nomes

| O plano dizia | O que foi feito | Por quê |
|---|---|---|
| `src/estilos/produtor.css` | **`src/estilos/studio-produtor.css`** | `produtor.css` já existe: é a folha da página pública `/produtor/[slug]`, com prefixo `.pr-*`, escrita pelo plano 05-03. Sobrescrevê-la apagaria uma tela pública. O prefixo daqui é `.prod-*` |
| «acrescentar a navegação às 18 telas» (S2-14) | **o layout de `/studio` monta o trilho** | Um layout aninhado dá a navegação às 19 rotas sem tocar em nenhuma delas. Editar 18 arquivos para pôr o mesmo componente seria 18 lugares para divergir |
| oito rotas, oito componentes (S4) | **oito rotas, UMA ficha** | Cada rota renderiza `produtor-agenda.tsx` com `atoInicial` diferente. É o que faz o `2/8` do trilho significar alguma coisa e o link de um impedimento levar ao ato que o resolve sem trocar de página |

## Números que o disco corrigiu

| Afirmação | Medida | O que foi feito |
|---|---|---|
| «4 das 325 capas do Play são quadradas» | **não mensurável sem ler os arquivos de imagem** | A afirmação saiu. A prévia mostra o cartaz real; nenhum número é afirmado sobre proporção de capa |
| «as 4 relações de sentido medem 0 arestas» | `influenciou` 0 · `dialoga_com` 31 · `contextualiza` 4 · `fala_sobre` 39 | A tela mostra os quatro números, medidos, um a um |
| «53 corpos para 1.850 páginas» | 53 arquivos coletados, espalhados por 5 classes; **25 casam com `conteudo`** | A tela declara o denominador dela: «25 de 1.805» |
| «linguagens: não usado no acervo» | `vocabulario.json` mede `ocorrencias` por termo | Estava lendo o campo errado. O alcance da tela de Catálogos passou a ser medido |

## Defeitos encontrados e corrigidos

| Onde | O defeito | Como apareceu |
|---|---|---|
| grade da web do Studio | `grid-row: 1 / -1` não resolve com linhas implícitas: o trilho ocupava só a primeira linha e abria **500px de vazio** entre o cabeçalho e o conteúdo | **captura de tela**. Nenhum número teria pego |
| trilho de pautas na web | as regras do trilho lateral vazavam para os chips de FILTRO do painel, que viravam uma barra laranja de largura inteira | **captura de tela** |
| cartão publicado | `<Cartao>` linka para `/evento/<id>/`, que não existe para um registro que só vive no navegador — e `next/link` **prefetcha**, então a página disparava 404 sozinha | portão de console limpo |
| `moderacao.ts:1311` | `rotaDoOutroLado: "/acervo/"` — rota que nunca existiu, prefetchada pelo histórico da Moderação | portão de console limpo. **Anterior a este trabalho** |
| `verificar-produtor.mjs` | a sonda media a barra de ação contra a borda EXTERNA da moldura (834) em vez da área útil (824), e reprovava uma barra no lugar certo | o próprio portão, na primeira execução |
| `verificar-produtor.mjs` | o gate do reinício lia como «semente» o estado que o gate anterior havia publicado | o próprio portão |

## O que ficou fora, e por quê

- **A forma nova da Organização.** O plano nomeia o que ela deixa de fazer; desenhá-la é
  trabalho de outra sessão. As cinco telas que sobraram declaram de que lado ficaram.
- **`exposicoes-permanentes.ts` não foi apagado.** A semente prova que a ficha COMPORTA as
  duas exposições — 19 percursos, 12 fotos, 5 vídeos, 3 textos, conferidos pelo portão —,
  mas o arquivo continua sendo a fonte de `/museu/[slug]`. Apagá-lo antes de trocar o
  consumo derrubaria duas páginas do produto.
- **O bloco de imagem no corpo editorial** é gravado e ainda não renderizado: `BlocoCorpo`
  tem cinco formas e a imagem não é uma delas. A tela declara isso em vez de prometer.

---

# O que a verificação encontrou — e o erro maior deste trabalho

## 1. O erro maior: «portar» não pode significar «apagar»

O sprint dizia **portar** seis telas herdadas. Eu li como **substituir**, e troquei o
conteúdo de `page.tsx` em seis rotas: `ocorrencias`, `espacos`, `midia`, `programa`,
`formacao` e `editais`.

**Cada uma carregava um contrato que outra suíte mede.** Não eram detalhes de layout:

| Tela | O que eu apaguei |
|---|---|
| `ocorrencias` | `[data-evento-imutavel]` — o bloco que prova, **por ausência de controles**, que mexer numa sessão nunca mexe no evento. Quatro asserções da fase 4 dependem dele, uma delas contando quantos `input`/`button`/`select`/`textarea` existem lá dentro. A resposta certa é zero |
| `espacos` | a ficha abrindo com as 13 dimensões em «não declarado»; o ATO explícito de declarar ausência; e o fato de que ele move as 13 para «declarado ausente» e **não** para «não declarado» — a distinção que D-43 existe para manter |
| `midia` | a fila do crédito abrindo nomeada e não vazia, e creditar tirando o item dela |
| `programa` | a tela que povoa a classe que mede zero instâncias |
| `formacao` | a visita educativa e a biblioteca de material |
| `editais` | o casamento entre edital e perfil de quem produz |

**Quem pegou:** `verificar-organizacao.mjs`, com **15 falhas**, todas nas cinco rotas que
eu havia trocado — e o bloco de D-67 da fase 4, com a sexta.

**A correção:** as duas convivem. A tela herdada volta ao topo, com o que ela prova; a ficha
nova entra abaixo, com o que ela acrescenta; e `SeparacaoDaOrganizacao` declara, na própria
tela, de quem ela passou a ser. Depois disso: **43 verdes · 0 falhas.**

## 2. `app:hidden` não funciona onde há classe sem camada

Medido no bundle exportado:

```
.app\:hidden  →  @layer utilities
.prod-tela    →  (SEM CAMADA)
```

**CSS sem camada vence `@layer`, independentemente da especificidade.** O `display: flex`
de `.prod-tela` ganhava do `display: none` do utilitário.

A descoberta veio de `--provar-ausencias`: o defeito que punha `app:hidden` no Studio
**não escondia nada**, e o portão ficava verde com razão. A leitura fácil seria «o gate não
mede o que promete»; a leitura certa é que o defeito nunca aconteceu.

**Consequência de produto:** o `app:hidden` das cinco superfícies web-only só funciona
porque a div que o carrega é NUA. Dar-lhe uma classe semântica que declare `display`
desligaria D-67 em silêncio. Anotado em `superficie-so-web.tsx` e na regra 8 de
`studio-produtor.css`. Quem protege é `verificar-produtor.mjs`, que mede a VISIBILIDADE do
envelope — medir a presença da classe deixaria passar exatamente este caso.

## 3. O estado herdado das quatro suítes de fase

`verificar-fase2/3/4/5` **abortam na primeira falha**, e a primeira é herdada:

| Falha | Medida | De quem |
|---|---|---|
| DP-F: cliente alcança `@/dados/grafo` | 6 componentes, todos `admin-*.tsx`, datados de **11:53** — antes deste trabalho | sessão do Admin |
| `globals.css` divergiu da âncora | 2 linhas de regra acrescentadas, 7 removidas — as variáveis de fonte | anterior |
| peso de `out/_next/static/chunks` | 22.434 KB contra teto de 1.600 | **19.748 KB num único chunk, carregado por exatamente as 6 páginas do Admin** |
| contagem de páginas | 5.282 contra o resíduo esperado | drift acumulado |

**Nenhuma é minha**, e a terceira é a prova das outras duas: o chunk de 19 MB é o grafo
inteiro — 47.265 arestas `semelhante_a` e 13.010 ocorrências — e ele está em seis páginas,
as mesmas seis que o gate DP-F acusa.

**O que as minhas páginas mandam para o cliente**, medido no mesmo artefato:

| rota | JS |
|---|---:|
| `/studio` | 657 KB |
| `/studio/publicar` | 722 KB |
| `/studio/editorial` | 708 KB |
| `/acontece` (herdada) | 866 KB |
| `/descobrir` (herdada) | 809 KB |
| `/admin/papeis` (herdada) | **20.362 KB** |

A DP-F segurou nos ~20 componentes de cliente que escrevi: nenhum aparece na lista de
violações.

**Como o bloco de D-67 foi verificado:** numa cópia descartável da suíte, com as falhas
herdadas neutralizadas, para o bloco poder rodar. Resultado: **6 de 6 verdes** — o Studio
abre no telefone, continua respondendo na web, e o roteiro continua declarando-se web-only.
A cópia foi apagada.

## 4. `verificar-gestor.mjs` não roda neste Windows

`spawnSync("npx", …)` sem `shell` não resolve `npx.cmd`: o processo não nasce, `status`
volta `null`, e o gate reprova com «tsx saiu com null: » — uma falha que parece do produto e
é do ambiente. Com `shell: true` o processo nasce e o shell corrompe o argumento multilinha
(DEP0190). A saída seria passar a sonda por arquivo; tentei, não consegui verificar aqui, e
**revertí o arquivo ao original byte a byte** — mudança não verificada em gate de outra
sessão é pior que incompatibilidade declarada.

## O placar, no fim

| Suíte | Estado |
|---|---|
| `verificar-produtor` | **42 verdes · 0 falhas** |
| `verificar-produtor --provar-ausencias` | 5 defeitos injetados |
| `verificar-organizacao` | **43 verdes · 0 falhas** |
| `verificar-moderacao` | **69 verdes · 0 falhas** (era 68 + 1; a falha era a rota morta `/acervo/`) |
| `verificar-ds` | 41 verdes · 1 falha herdada em `cursos.css` |
| `testar-semente-produtor` | verde |
| `tsc --noEmit` | limpo |
| `next build` | verde · 5.282 páginas |
| `verificar-fase2/3/4/5` | vermelhas por falha **herdada**, anterior a este trabalho |
| `verificar-gestor` | não roda neste Windows |
