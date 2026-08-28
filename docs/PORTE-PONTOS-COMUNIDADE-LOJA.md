# Porte: pontos, comunidade e loja

O que veio de `~/Suvinil` (`noz-app`, o Community OS white-label), o que foi
traduzido, o que foi corrigido no caminho e o que ficou para trás.

Escrito em 26/08/2026, depois da camada de lógica passar em 58/58 portões.

---

## A regra do porte

**Lê de lá, escreve limpo aqui.** Nenhum arquivo foi copiado. A lógica foi
traduzida para pt-BR no padrão deste projeto (nome de arquivo, vocabulário de
domínio, comentário que explica *por quê*); as telas serão reescritas, porque a
origem é um mockup de iPhone de 393px fixos sem nenhum breakpoint e aqui o
produto é responsivo nas duas visões.

---

## O que atravessou

| Origem | Destino | O que mudou |
|---|---|---|
| `lib/engine/clock.ts` | [src/lib/pontos/relogio.ts](../src/lib/pontos/relogio.ts) | Traduzido. Âncora fixa mantida — é o que permite a viagem no tempo e o que evita divergência de hidratação sob `output: "export"` |
| `lib/engine/ledger.ts` | [src/lib/pontos/livro.ts](../src/lib/pontos/livro.ts) | Traduzido. Ganhou `extrato()`, que a origem não tinha |
| `lib/engine/levels.ts` | [src/lib/pontos/niveis.ts](../src/lib/pontos/niveis.ts) | Traduzido. Ganhou `noTopo`, para a tela dizer «nível máximo» em vez de «faltam 0» |
| `lib/engine/streak.ts` | [src/lib/pontos/sequencia.ts](../src/lib/pontos/sequencia.ts) | Traduzido. Só semanal — ver «Decisões» |
| `lib/engine/missions.ts` | [src/lib/pontos/missoes.ts](../src/lib/pontos/missoes.ts) | Traduzido |
| `lib/engine/badges.ts` | [src/lib/pontos/emblemas.ts](../src/lib/pontos/emblemas.ts) | Traduzido. Todo emblema agora carrega `comoGanhar`, dito na tela antes de ser ganho |
| `lib/engine/engine.ts` (880 linhas) | [src/lib/pontos/motor.ts](../src/lib/pontos/motor.ts) | Reescrito. Perdeu ranking, desafios, dupla, notificações, dormência e aprendizado; ganhou o bônus de travessia |
| `lib/engine/types.ts` | [src/lib/pontos/tipos.ts](../src/lib/pontos/tipos.ts) | Reescrito. Domínio cultural em vez de tenant |
| `lib/engine/store.tsx` | [src/contexto/pontos.tsx](../src/contexto/pontos.tsx) | Reescrito no molde de `contexto/sessao.tsx`: espelho em `localStorage`, sinalizador `hidratado`, escopo por persona |
| `lib/tenants/pintores/game.ts` | [src/dados/pontos.ts](../src/dados/pontos.ts) | Regras novas, domínio cultural |
| `screens/Loja.tsx` + `Wallet.tsx` | [src/dados/loja.ts](../src/dados/loja.ts) | Só o catálogo por enquanto. As telas vêm depois |
| `lib/tenants/pintores/content.ts` | [src/dados/comunidade.ts](../src/dados/comunidade.ts) | Feed novo. As comunidades são entidades REAIS do grafo |

## O que ficou para trás, e por quê

- **`lib/nav/nav.tsx`** — pilha em `useState` sincronizada com `window.location.hash`. Existe porque a origem precisa demonstrar deep link dentro de um aparelho desenhado na tela. Aqui há App Router.
- **`components/app/PostMedia.tsx`** (366 linhas) — a maior parte é ilustração SVG desenhada à mão para quando não há foto. Aqui há acervo com 2.382 capas reais e crédito.
- **`components/fx/FxProvider.tsx`** — fila de efeitos em quatro níveis. Complexidade que estas features não pedem.
- **`components/shell/DeviceFrame.tsx`, `DemoDeck`, `RankInsignia`, `SeasonCrest`, `TriggerArt`, `NozLogo`** — moldura e cromo da origem.
- **`lib/tenants/{fitness,devs}`** — o mecanismo white-label inteiro. Aqui há um cliente só.
- **`lib/engine/{leaderboard,challenges,nba,notifications}.ts`** — ver «Decisões».
- **`screens/{Learn,Lesson,Course,Mentor,Buddies}.tsx`** — o destino já tem `/cursos`.

---

## Três defeitos da origem que NÃO foram copiados

**1. O botão «Resgatar» da vitrine não fazia nada.** Em `screens/Loja.tsx` ele
liga e desliga conforme o saldo e não tem `onClick`. A lógica de resgate de
verdade morava numa aba de `Wallet.tsx`. Aqui há um caminho só, e ele passa pelo
motor.

**2. O estoque não decrementava.** `wallet.reward.redeemed` revalidava saldo e
criava a entrega, mas nunca mexia em `stock` — uma loja que aceita mais resgates
do que tem itens. Corrigido em `motor.ts`, com portão que confere.

**3. Duas escalas de preço incompatíveis.** A vitrine ia de 4.800 a 120.000; a
carteira, de 120 a 700. O mesmo saldo destravava uma tela e travava a outra. Aqui
há uma escala só, de 90 a 520, ancorada em ~140 fichas de um mês engajado.

## E um bug que o porte criou e o portão pegou

O freio de «este item já pontuou» morava dentro de `Regra`. A regra era barrada,
mas a **missão continuava avançando**: reassistir o mesmo documentário três vezes
fechava sozinho a missão de temporada, que pede três itens. O freio subiu para o
nível do evento (`UMA_VEZ_POR_ITEM`, em `motor.ts`): item repetido não dispara
regra, não avança missão, não estende sequência e não confirma commit.

---

## Decisões que se pode reverter

**1. Sem ranking e sem desafio de time.** A origem tem `leaderboard.ts` e
`challenges.ts` funcionando. Competir por quem consome mais cultura é o incentivo
errado num produto do Itaú Cultural — premia volume onde a proposta inteira
defende travessia. Os emblemas ficaram; a comparação com outras pessoas, não.

**2. Sequência semanal, nunca diária.** A origem tem as duas. Ninguém vai ao
teatro toda semana, e uma sequência diária transformaria cultura em obrigação de
comparecimento. Os dias distintos continuam marcados na semana — só não são o que
mantém a sequência.

**3. As 17 comunidades do marketplace são de fora do eixo Rio–São Paulo.** O
acervo tem instituição ou coletivo em 19 UFs; SP e RJ somam 140 das 220. Escolher
as outras 17 é o que faz o marketplace ser argumento em vez de vitrine.

**4. Três ativos, não um.** `ficha` gasta na loja, `percurso` nunca gasta e define
o nível, `reputacao` abre poder dentro do produto. Se resgatar rebaixasse o nível,
a loja puniria quem a usa.

---

## Estado

```
npm run verificar-pontos     58/58 portões  ·  verde
```

Falta: as ~14 telas, os tokens de CSS e a costura na navegação. A colisão com as
sessões paralelas é a pasta `(bastidor)/studio/` (check-in do produtor), que
espera S6/S7 desocuparem.
