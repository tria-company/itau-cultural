# Comunidade e Loja — refinamento em sprints

> Este arquivo fica **dentro** do repositório, ao lado de `PRODUTOR-EXECUCAO-SPRINTS.md`.
> O irmão mais velho abre dizendo que nada é escrito no repo, e está commitado no repo desde
> 26/08. A regra foi para o lixo na prática; aqui ela é dita como é: o documento mora junto
> do código que ele descreve.
>
> Documento de planejamento: `C:\Users\luani\.claude\plans\vamos-criar-uma-nova-humble-lake.md`
> Documento anterior, dos 14 sprints do Studio: `PRODUTOR-EXECUCAO-SPRINTS.md`

Checklist de ações. Cada tarefa é um ato meu, com arquivo nomeado e critério de pronto.
**6 sprints · 69 tarefas.** Numeração `R` de refinamento, para não colidir com os `S0`–`S13`.

## O que estamos construindo

Comunidade e Loja chegaram em 28/08 por um porte de outro ramo, e entraram como estavam: com
a gestão embutida na tela de consumo. A mesma tela atende duas pessoas ao mesmo tempo, quem lê
e quem publica, e a coluna do Studio ganhou três sub-menus que ninguém pediu.

O corte é de uma linha: **dentro do Studio fica tudo que ele mexe; Comunidade e Loja são o que
ele consome.** Um produtor pode manter mais de uma comunidade. E a loja ganha uma forma de
resgate que hoje não existe: link de afiliado com cupom que zera o carrinho, retirada feita
num e-commerce de fora.

| Decisão | Valor |
|---|---|
| Corte | Studio é gestão; Comunidade e Loja são consumo |
| Membros | A lista de quem está na comunidade **some de vez** |
| Guardadas | Some **inteiro**: tela, botão, evento do motor, regra de pontos e estado |
| Loja | **Uma só**, alimentada pelo produtor. Não pertence à comunidade |
| Resgate por link | Entrega cupom e endereço, e **acaba ali**. Sem as cinco fases |
| Comunidades do produtor | Mais de uma, criadas por ele, em slugs reservados no build |

## Restrições que valem em TODA tarefa

1. **Sem back-end.** Export estático, zero requisição em runtime. Âncora que a pessoa clica
   não é requisição que o protótipo faz, e isso já está decidido e escrito em
   `src/dados/ingressos.ts:13-16`.
2. **Sem relógio e sem sorteio.** `Date.now()`, `Math.random()` e `new Date()` sem argumento
   fazem o HTML exportado divergir da página hidratada. Id novo é maior sufixo mais um.
3. **`localStorage` só em `useEffect`**, nunca no render. `lerNoServidor` devolve `null`.
4. **DP-F.** Componente `"use client"` importa módulo de dados apenas por tipo. E constante
   exportada de módulo cliente **não chega ao `generateStaticParams`**: ela vira referência de
   cliente. Foi o que quebrou os 20 slugs de publicação.
5. **`fixed` só no `.canto`** na visão do aparelho. Na web o painel lateral é `fixed` de
   propósito, e a razão está escrita em `studio-produtor.css`.
6. **Componente irmão por visão é proibido.** Divergência em CSS puro sob `[data-view]`.
7. **Zero hex novo**; `rem`/`ms` literais só em `tokens.css`; nenhum `text-[…rem]` em TSX.
8. **Ausência é declarada, com denominador.**
9. **CSS sem camada vence `@layer`.** `studio-produtor.css` não tem camada, e `pontos.css` é
   importado depois dele.
10. **Nada de tela cheia de texto.** Cabeçalho é título mais o botão de voltar. Parágrafo
    explicativo em tela de gestão é dívida, não ajuda.
11. **Medir no `out/`, não no `next dev`.** Os dois brigam pela pasta `.next`, e o dev serve
    CSS obsoleto depois de um build.
12. **Portão não se afrouxa: se reescreve.** Verde sobre caso que não acontece é verde falso.

---

# Sprint R1 · O corte

**Objetivo.** Some Guardadas por inteiro, a lista de membros e o marketplace.
**Pronto quando.** Nenhum link aponta para rota que não existe, os dois portões de
`publicacoesSalvas` medem a ausência em vez de sumirem, e o `out/` não tem as três rotas.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| R1-01 | ✅ | Apagar a rota e o componente de Guardadas | `studio/comunidade/guardadas/page.tsx` · `comunidade-guardadas.tsx` |
| R1-02 | ✅ | Apagar a rota e o componente de membros — **decisão: some de vez** | `studio/comunidade/gerenciar/page.tsx` · `comunidade-gestao.tsx` |
| R1-03 | ✅ | Apagar o marketplace — «Visitar outras» no Seletor já faz o trabalho dele | `studio/comunidade/marketplace/page.tsx` · `comunidade-marketplace.tsx` |
| R1-04 | ✅ | Tirar os três filhos da seção Comunidade na coluna | `produtor-navegacao.tsx:78-80` |
| R1-05 | ✅ | Tirar os dois cartões mortos do Início do Studio | `produtor-painel.tsx:1183,1191` |
| R1-06 | ✅ | Tirar o botão 👤 do canto da capa, que levava aos membros | `comunidade-capa.tsx:114-122` |
| R1-07 | ✅ | Tirar a pastilha «guardar» do cartão do feed | `comunidade.tsx:163-173` |
| R1-08 | ✅ | Tirar a pastilha «guardar» da publicação aberta | `comunidade-publicacao.tsx:253-268` |
| R1-09 | ✅ | Tirar `publicacoesSalvas` do estado e do tipo | `tipos.ts:532-533` · `motor.ts:102` |
| R1-10 | ✅ | Tirar o `case` de salvar e a limpeza dele na retirada da publicação | `motor.ts:456-465,559` |
| R1-11 | ✅ | Tirar `comunidade.publicacao.salva` da união de eventos | `tipos.ts:55` |
| R1-12 | ✅ | Tirar a regra `r-guardar-publicacao` e **declarar** que a economia perde 5 de percurso por dia | `dados/pontos.ts:217-224` |
| R1-13 | ✅ | Tirar `"publicacoesSalvas"` de `LISTAS` e subir `VERSAO_DO_FORMATO` de 4 para 5, com a nota no histórico do cabeçalho | `contexto/pontos.tsx:59,85` |
| R1-14 | ✅ | **Reescrever** o portão que media o guardar: ele passa a exigir que o campo e o evento não existam mais | `scripts/verificar-pontos.ts:274-277` |
| R1-15 | ✅ | Tirar `"publicacoesSalvas"` da lista de campos que devem nascer como array | `scripts/verificar-pontos.ts:332` |
| R1-16 | ✅ | Limpar os quatro comentários órfãos que citam as rotas mortas pelo nome | `produtor-barra.tsx:69` · `produtor-navegacao.tsx:56,210` · `produtor-painel.tsx:1188` |
| R1-17 | ✅ | Provar: as três rotas não existem no `out/`, e `grep` no HTML exportado não acha link para elas em tela nenhuma | sonda |

---

# Sprint R2 · Posse de comunidade

**Objetivo.** «Esta comunidade é minha» deixa de ser uma constante string comparada em cinco
lugares e vira dado.
**Pronto quando.** O produtor tem mais de uma comunidade, e a pergunta da posse é feita ao
dado, não ao `COMUNIDADE_OFICIAL`.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| R2-01 | ✅ | `donoId: string \| null` em `ComunidadeDefinida`; `null` nas 22 do acervo, que são de gente real | `lib/pontos/tipos.ts:373-395` |
| R2-02 | ✅ | Declarar `PRODUTOR_DA_CASA` e marcar `ic` com ele | `dados/comunidade.ts:33-45` |
| R2-03 | ✅ | `ehMinha(id)` numa função só, e trocar por ela os 5 testes contra `COMUNIDADE_OFICIAL` | `dados/comunidade.ts` · `publicacao-no-studio.tsx:28` · as páginas |
| R2-04 | ✅ | `criadas: ComunidadeDefinida[]` no armazém, **espelhando `criados` da loja**, que é o padrão que já funciona | `comunidade-estado.ts:66-79` · modelo em `loja-estado.ts:117` |
| R2-05 | ✅ | `normalizarComunidade` na leitura: armazém é entrada externa e alguém edita à mão | idem · modelo em `loja-estado.ts:150` |
| R2-06 | ✅ | Slugs reservados `com-produtor-001` a `-008`, ao lado dos 20 de publicação — **fora do módulo cliente**, pela restrição 4 | `dados/comunidade-capas.ts:29-30` |
| R2-07 | ✅ | `generateStaticParams` das duas rotas de comunidade passa a incluir os 8 reservados | `studio/comunidade/[id]/page.tsx:28` |
| R2-08 | ✅ | `proximaComunidade()` determinística, maior sufixo mais um | `comunidade-estado.ts` |
| R2-09 | ✅ | `minhasComunidades()`: a da casa mais as criadas, na ordem em que nasceram | idem |
| R2-10 | ✅ | Provar por CDP: criar comunidade, recarregar, e ela continua lá com id reservado e capa própria | sonda |

---

# Sprint R3 · Studio › Comunidades

**Objetivo.** A gestão ganha endereço próprio dentro do Studio, e sai de cima da leitura.
**Pronto quando.** Ele cria a segunda comunidade, troca a capa e o nome dela, publica, edita e
apaga post, tudo sem sair do Studio.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| R3-01 | ✅ | Rota `/studio/minhas-comunidades/` — a lista. **Plural com «minhas» de propósito**: `/studio/comunidades/` fica a um caractere de `/studio/comunidade/`, e essa classe de armadilha já custou um defeito nesta semana | `studio/minhas-comunidades/page.tsx` novo |
| R3-02 | ✅ | Rota `/studio/minhas-comunidades/[id]/` — a gestão de uma | `.../[id]/page.tsx` novo |
| R3-03 | ✅ | `minhas-comunidades.tsx`: capa, nome, contagem de publicações e «+ Nova comunidade» | novo |
| R3-04 | ✅ | A folha de criação: nome, chamada, descrição e capa, reusando `CampoDeImagem` | idem |
| R3-05 | ✅ | `comunidade-em-gestao.tsx`: a capa com o lápis. `gerenciavel` já era prop; o que mudou é quem a passa — só a tela de gestão | `comunidade-em-gestao.tsx` |
| R3-06 | ✅ | Mover o compositor de publicação para cá, inteiro | de `comunidade-no-studio.tsx:250-367` |
| R3-07 | ✅ | Mover editar e apagar post para cá | de `comunidade-no-studio.tsx:203-247` |
| R3-08 | ✅ | `podeModerar` deixa de chegar sempre `true` nas 142 páginas de publicação e passa a perguntar `ehMinha` | `publicacao-no-studio.tsx:33` |
| R3-09 | ✅ | `comentariosAbertos` **passa a valer**: com ele desligado o campo de comentário some. Hoje é gravado e nunca lido, o que é a tela mentindo | `comunidade-publicacao.tsx:343-360` |
| R3-10 | ✅ | `quemPublica` sai do armazém: gravado, nunca lido, e a tela que o oferecia morreu em R1 | `comunidade-estado.ts:41-52` |
| R3-11 | ✅ | Duas entradas novas na seção Studio da coluna e no «+ Criar», **sem entrar na união `PAUTAS`** — ela é consumida por 12 arquivos e elas não são fichas em atos | `produtor-navegacao.tsx:71-93` · `criar-da-lateral.tsx` |
| R3-12 | ✅ | Provar por CDP: criar comunidade, publicar nela, editar, apagar, com recarregamento entre cada passo | sonda |

---

# Sprint R4 · A aba Comunidade vira leitura

**Objetivo.** A tela de consumo para de ser tela de gestão, e o Seletor passa a ser o único
jeito de trocar de comunidade.
**Pronto quando.** Trocar no Seletor troca a capa junto, e a URL acompanha.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| R4-01 | ✅ | `/studio/comunidade/` deixa de montar `ComunidadeNoStudio` e monta `<Comunidade>` cru, como `[id]` já faz | `studio/comunidade/page.tsx:53` |
| R4-02 | ✅ | A capa perde `gerenciavel` na aba de consumo: sem lápis, sem porta de gestão | `studio/comunidade/page.tsx:48` |
| R4-03 | ✅ | **O Seletor navega em vez de trocar estado.** Hoje `useState(comunidadeId)` troca o feed e deixa a capa na comunidade antiga: duas maneiras de trocar que não se conhecem | `comunidade.tsx:247,265` |
| R4-04 | ✅ | `/studio/comunidade/` cai na primeira que ele segue, e não na da casa por decreto | `studio/comunidade/page.tsx` |
| R4-05 | ✅ | **REVISTA NA EXECUÇÃO: `ic` FICA.** A tarefa mandava tirá-lo porque duplicava a raiz. Com R4-03 o seletor passou a navegar, e a casa virou um destino como qualquer outro: sem a página, escolher «Itaú Cultural» estando em outra comunidade daria 404 | `studio/comunidade/[id]/page.tsx:29` |
| R4-06 | ✅ | **REVISTA NA EXECUÇÃO: ela não some, muda de nome e de casa.** Apagar e reescrever um componente que já funcionava seria risco sem ganho; ela virou `comunidade-em-gestao.tsx` e passou a montar a capa gerenciável junto | `git mv` |
| R4-07 | ✅ | A aba Comunidade perde o chevron na coluna: sem filhos, não há sanfona a abrir | `produtor-navegacao.tsx:75-84` |
| R4-08 | ✅ | Provar por CDP: trocar de comunidade e conferir que capa, feed e endereço falam da mesma | sonda |

---

# Sprint R5 · Studio › Loja

**Objetivo.** Cadastrar e editar item saem da vitrine e vão para o Studio; a vitrine volta a
ser lugar de gastar ficha.
**Pronto quando.** A vitrine não tem lápis nem «+ Novo item», e o saldo no topo é a porta da
Carteira.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| R5-01 | ✅ | Rota `/studio/minha-loja/` — o catálogo do produtor | `studio/minha-loja/page.tsx` novo |
| R5-02 | ✅ | Rota `/studio/minha-loja/resgates/` — o que hoje é `/studio/pontos/gestao/` | `.../resgates/page.tsx` novo |
| R5-03 | ✅ | `loja-na-vitrine.tsx` vira `loja-em-gestao.tsx`: a lista de itens com o lápis e o botão de criar | renomear |
| R5-04 | ✅ | `recompensas.tsx` volta a ser vitrine pura: ninguém mais passa `acoesDoItem` nem `acaoDeCriar`. As props ficam, porque o arquivo é portado e a assinatura é o contrato com o outro ramo | `recompensas.tsx:203-212` |
| R5-05 | ✅ | O saldo em fichas no topo da vitrine, e **ele é o link** para a Carteira. Sem sub-menu, que foi o que o pedido reprovou na Comunidade | `studio/pontos/loja/page.tsx` |
| R5-06 | ✅ | A aba Loja perde os dois filhos na coluna | `produtor-navegacao.tsx:86-93` |
| R5-07 | ✅ | O «‹ Loja» do painel de resgates muda de destino | `loja-gestao.tsx:57` |
| R5-08 | ✅ | Provar por CDP: cadastrar item no Studio, vê-lo na vitrine, e conferir que a vitrine não tem `[data-editar-item]` | sonda |

---

# Sprint R6 · O item de link

**Objetivo.** O resgate que se retira num e-commerce de fora: o produtor cola o link de
afiliado e o cupom que zera o carrinho, e a pessoa termina a compra lá.
**Pronto quando.** Resgatar entrega cupom e endereço, debita as fichas, e o recibo sobrevive à
troca do cupom.

| # | ✔ | Tarefa | Arquivos |
|---|---|---|---|
| R6-01 | ✅ | `entrega` ganha o quinto valor, `"link"` | `lib/pontos/tipos.ts:464` |
| R6-02 | ✅ | `link`, `lojaDeFora` e `cupom` opcionais em `RecompensaDefinida` — aditivos, nenhum item existente deixa de tipar | idem `:452-465` |
| R6-03 | ✅ | `ROTULO_DA_ENTREGA` ganha a quinta linha **nos dois arquivos**: o mapa está duplicado | `recompensas.tsx:13-18` · `recompensa-item.tsx:10-15` |
| R6-04 | ✅ | No formulário, o campo de endereço **só aparece quando `entrega === "link"`**, e sem ele o item não grava. Espelha o canal de ingresso, que já faz exatamente isso | `loja-em-gestao.tsx` · modelo em `produtor-agenda.tsx:1050-1067` e `tipos-produtor.ts:1227-1231` |
| R6-05 | ✅ | `normalizarItem` aceita os três campos novos, para item gravado por versão antiga não quebrar | `loja-estado.ts:150-170` |
| R6-06 | ✅ | `Resgate` congela `link` e `cupom`, pela mesma razão que já congela `titulo` e `custoPago` | `lib/pontos/tipos.ts:474-487` |
| R6-07 | ✅ | O motor grava a fase `entregue` quando a entrega é link: não há esteira a andar, e quem já chegou ao fim não se move em `avancarDias` | `motor.ts:595-603` |
| R6-08 | ✅ | A folha de sucesso entrega cupom e botão **nos dois lugares**: a modal e a rota do item são a mesma tela escrita duas vezes | `recompensas.tsx:149-157` · `recompensa-item.tsx:98-110` |
| R6-09 | ✅ | A âncora segue o gesto do ingresso: `target="_blank" rel="noreferrer"`, seta `↗`, e legenda em itálico dizendo para onde a pessoa vai | modelo em `evento/[slug]/page.tsx:244-256` |
| R6-10 | ✅ | O recibo da Carteira não desenha as cinco etapas quando a entrega é link | `carteira.tsx:18-30,32-51` |
| R6-11 | ✅ | Um item de link na semente, com endereço de exemplo e não de conta de afiliado de ninguém, para a demonstração ter o que mostrar | `dados/recompensas.ts` |
| R6-12 | ✅ | O bloco de resgate do portão ganha o caso do link: debita, nasce `entregue`, e o cupom fica no resgate | `scripts/verificar-pontos.ts:221-256` |
| R6-13 | ✅ | As rotas novas entram no gate de rede, hoje com 9, e **a loja ganha o primeiro portão que já devia ter**: hoje não existe nenhum | `scripts/verificar-produtor.mjs:1096-1106` |
| R6-14 | ✅ | Provar por CDP: resgatar item de link, ler o cupom, trocar o cupom na gestão, e conferir que o recibo antigo não mudou. E que o gate de rede continua em 0 com a âncora na tela | sonda |

---

## Ordem e dependências

```
R1 corte ──► R2 posse ──► R3 Studio·Comunidades ──► R4 aba vira leitura
                                                          │
                          R5 Studio·Loja ──► R6 item de link
```

**R1 antes de tudo:** ele mexe no motor e sobe `VERSAO_DO_FORMATO`; fazer isso no meio do
caminho descartaria estado gravado durante o trabalho. **R2 antes de R3:** sem posse não há
«minhas comunidades» a listar. **R3 antes de R4:** a gestão precisa ter para onde ir antes de
sair da tela de leitura, ou o produto passa um sprint sem publicar. **R5 antes de R6:** o
campo novo precisa de uma tela onde ser preenchido. R5 e R6 não dependem de R2 nem de R3 e
podem correr em paralelo com eles, se houver duas mãos.

## Riscos declarados

| Risco | Mitigação |
|---|---|
| Arrancar `publicacoesSalvas` derruba dois portões | R1-14 e R1-15 **reescrevem** os dois para medir a ausência; afrouxar é proibido pela restrição 12 |
| Subir `VERSAO_DO_FORMATO` para 5 descarta livro, emblemas e resgates de todo navegador | É o preço declarado, e é a disciplina que o próprio `contexto/pontos.tsx:42-58` registra nas três vezes anteriores. Fazer em R1, antes de qualquer demonstração |
| `/studio/minhas-comunidades/` e `/studio/comunidade/` confundem quem lê o código | Por isso não é `/studio/comunidades/`. O «minhas» é o que separa, e a coluna mostra os dois em seções diferentes |
| Comunidade criada em runtime não existe no build estático | Slugs reservados, R2-06, que é a solução já provada para as 20 publicações |
| `entrega` é união fechada usada em dois mapas duplicados | R6-03 trata os dois no mesmo ato; o compilador acha o terceiro se houver |
| As cinco fases estão duplicadas entre `recompensas.ts:265` e `motor.ts:813` | R6 não acrescenta fase nenhuma, justamente para não pagar esse pedágio. Se um dia acrescentar, unificar antes |
| A vitrine é arquivo portado do outro ramo | R5-04 mantém a assinatura de `Recompensas` intacta: quem para de passar as props é quem monta |
| Remover a regra de guardar tira 5 de percurso por dia da economia | Declarado em R1-12. Nenhum portão afirma teto diário global, conferido por grep |

## Contagem

| Sprint | Tarefas |
|---|---:|
| R1 · o corte | 17 |
| R2 · posse de comunidade | 10 |
| R3 · Studio · Comunidades | 12 |
| R4 · a aba vira leitura | 8 |
| R5 · Studio · Loja | 8 |
| R6 · o item de link | 14 |
| **Total** | **69** |

## Como cada sprint fecha

1. `npx tsc --noEmit` e `npm run build` verdes.
2. **Medida no `out/`**, não no `next dev`: `grep` no HTML exportado para conferir quem acende
   na coluna e quais rotas existem. Foi assim que os três defeitos da sanfona apareceram.
3. **CDP dirigido** por `scripts/servir-out.mjs` e `scripts/navegador.mjs`, exercitando o
   caminho inteiro com recarregamento entre os passos.
4. **Portões**: `verificar-produtor.mjs` (49), `verificar-ds.mjs` (43), `verificar-pontos.ts`
   (100). O `--provar-ausencias` continua exigindo que cada gate fique vermelho quando o
   defeito é injetado.
5. **Captura a olho nas duas visões.** A lição de `docs/ARQUITETURA.md` §6: sete vezes um
   portão passou com a tela visivelmente quebrada, e as sete foram pegas por captura.

`verificar-fase2`, `verificar-fase3` e `testar-semente-produtor` continuam vermelhos por DP-F
nos `admin-*.tsx`. É defeito anterior e alheio a este trabalho, conferido com `git stash`.

---

## Notas de execução — o que o trabalho encontrou

Escrito em 29/08/2026, depois dos seis sprints. **69 de 69 tarefas.**

### Dois defeitos que só apareceram ao medir

**A capa da comunidade criada abria sem nome.** A página de `/studio/minhas-comunidades/[id]/`
é de servidor, e no build aquele endereço era um slug reservado e vazio: ela passava
`nome: ""`, e `vigenteDe` caía na semente vazia. O nome estava no armazém o tempo todo, em
`criadas`, e `aplicar` já o tinha posto no array vivo. A correção foi em `sementeDoPerfil`:
quando o servidor manda vazio, ela pergunta ao `COMUNIDADES` do cliente. Para as 23 do build
nada muda, porque o que o servidor manda continua vencendo quando existe.

**A foto do item de link não existia no disco.** O caminho inventado passou no `tsc` e no
`build` — imagem é string —, e teria virado um cartaz quebrado na demonstração. Trocada pela
foto do sebo que `rec-publicacao` já usa, com o `alt` e o crédito dela junto: alt que descreve
outra imagem é pior que alt nenhum.

### Duas tarefas que a execução corrigiu

R4-05 e R4-06 estão marcadas com o que aconteceu de fato. A primeira mandava apagar uma rota
que R4-03 tornou necessária; a segunda mandava apagar um componente que só precisava mudar de
nome e de casa. Ambas estão anotadas na própria linha, e não silenciosamente cumpridas de
outro jeito.

### O que mudou de tamanho

| Medida | Antes | Depois |
|---|---:|---:|
| Portões de `verificar-pontos.ts` | 100 | 105 |
| Rotas no gate de rede do Studio | 9 | 13 |
| Rotas sob `/studio/comunidade/` | 6 | 3 |
| `VERSAO_DO_FORMATO` do motor | 4 | 5 |
| Valores de `entrega` | 4 | 5 |
| Comunidades que o produtor pode manter | 1 | 9 |

### O que ficou como estava, e por quê

- **`removidos` saiu do armazém** junto com a tela de membros, que era a única a escrevê-lo.
- **`quemPublica` saiu**; `comentariosAbertos` ficou e passou a valer. Os dois eram gravados
  e nunca lidos: um controle que não faz nada é a tela mentindo, então ou valia ou saía.
- **`podeModerar` deixou de chegar sempre `true`** nas 142 páginas de publicação. Era um
  defeito silencioso: quem lia comunidade de gente real ganhava o botão de apagar comentário
  alheio, e ele funcionava.
- **A esteira continua duplicada** entre `recompensas.ts:265` e `motor.ts:813`. R6 não
  acrescentou fase nenhuma justamente para não pagar esse pedágio agora.
- `verificar-fase2`, `verificar-fase3` e `testar-semente-produtor` continuam vermelhos por
  DP-F nos `admin-*.tsx`. Defeito anterior e alheio a este trabalho.
