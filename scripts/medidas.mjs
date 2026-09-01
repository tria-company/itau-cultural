/**
 * MEDIDAS COMPARTILHADAS DAS SUÍTES DE VERIFICAÇÃO.
 *
 * Este arquivo nasceu na reformulação do design system (2026-08) com um
 * propósito: quando uma medida do produto muda de verdade — altura de barra,
 * âncora de git, limite de dobra — a reconciliação acontece AQUI, num arquivo
 * só, em vez de caçar constantes espalhadas por cinco suítes.
 *
 * REGRA DAS ÂNCORAS DE GIT: o histórico deste repositório foi recriado em
 * 2026-08-22 (commit inicial 158b646, o estado consolidado das 5 fases).
 * As âncoras antigas (`a40f380`, `c90fc9b`) apontavam para o histórico
 * anterior e deixaram de existir — os portões que as usavam quebrariam em
 * qualquer verificação. As duas âncoras abaixo assumem o papel:
 *
 * - `COMMIT_DA_CONSOLIDACAO`: desde ele, `globals.css` só pode receber linha
 *   de `@import` e comentário, e o bloco `:root` com os hex do manual tem de
 *   continuar byte a byte idêntico.
 * - `COMMIT_ULTIMO_QUE_TOCOU_GLOBALS`: desde ele, `globals.css` tem diferença
 *   ZERO. Toda fase que legitimamente acrescentar um `@import` atualiza esta
 *   âncora NO COMMIT SEGUINTE ao que tocou o arquivo (o sha só existe depois
 *   do commit) — é o que mantém o invariante «o último a tocar é o declarado».
 */

export const COMMIT_DA_CONSOLIDACAO = "ca6bd52";
export const COMMIT_ULTIMO_QUE_TOCOU_GLOBALS = "0d8d037"; // fase B: +@import menu-lateral.css

/* ---------------------------------------------------------------------------
 * AS MEDIDAS DO STUDIO (2026-08, perfil Produtor) — o PEDIDO-02, atendido.
 *
 * Elas nasceram espalhadas: 390 e 844 em `base.css` e em `casca.tsx`, o bezel
 * de 10px só no CSS, e a dobra do bastidor em lugar nenhum — cada sonda a
 * recalculava, e a primeira versão de `verificar-produtor.mjs` errou por isso,
 * medindo a barra de ação contra a borda EXTERNA da moldura.
 * ------------------------------------------------------------------------- */

/** A tela lógica do aparelho (D-03). O app é desenhado para estas medidas e
 *  AMPLIADO por `transform: scale()`; quem cresce é o objeto, nunca a medida. */
export const LARGURA_DO_APARELHO = 390;
export const ALTURA_DO_APARELHO = 844;

/** A borda do aparelho, de cada lado. `box-sizing: border-box` em `.moldura`:
 *  o retângulo mede 390×844 e a caixa de conteúdo mede 370×824. */
export const BEZEL = 10;

/** A largura útil dentro do telefone: 390 − 2×10. É contra ela que todo layout
 *  do app é desenhado, e é ela que decide se dois campos cabem lado a lado. */
export const LARGURA_UTIL_DO_APP = LARGURA_DO_APARELHO - 2 * BEZEL;

/**
 * A DOBRA DO BASTIDOR: 824, e não 807.
 *
 * 807 é a dobra do PRODUTO, onde a barra de abas de 60px desconta da altura. O
 * layout de bastidor não monta barra de abas — o Studio não é o app —, então a
 * dobra dele é a área útil inteira da moldura.
 *
 * MEDIR CONTRA A BORDA EXTERNA DÁ 834 e reprova uma barra de ação que está
 * exatamente no lugar certo, encostada no fundo do vidro. A medida é contra
 * `.moldura-rolagem`, que é a caixa de conteúdo.
 */
export const DOBRA_DO_BASTIDOR_NO_APP = ALTURA_DO_APARELHO - 2 * BEZEL;

/** A dobra da visão web: a altura do viewport travado de todos os gates de tela. */
export const DOBRA_DA_WEB = 960;

/** O alvo de toque mínimo, em px. Vale para todo controle do Studio. */
export const ALVO_DE_TOQUE = 44;

/** A chave do armazém do perfil Produtor, e as duas que ela absorve sem apagar. */
export const CHAVE_DO_PRODUTOR = "produtor.v1";
export const CHAVES_HERDADAS_DO_STUDIO = ["studio.v1", "studio.org.v1"];

/**
 * As seis superfícies de bastidor, com a metade da regra de D-67 que cada uma
 * representa depois da inversão de 2026-08.
 *
 * A LISTA É DE PORTÃO, e por isso ela é exaustiva: uma superfície de bastidor
 * fora dela é uma superfície cuja visibilidade ninguém mede.
 */
export const SUPERFICIES_DE_BASTIDOR = [
  { prefixo: "/studio", regra: "visivel-no-app", nome: "Studio" },
  { prefixo: "/moderacao", regra: "so-web", nome: "Moderação" },
  { prefixo: "/redacao", regra: "so-web", nome: "Redação" },
  { prefixo: "/observatorio", regra: "so-web", nome: "Observatório" },
  // O ADMIN VIROU MOBILE-FIRST em 01/09/2026, e é a segunda inversão de D-67 depois do
  // Studio. Ele deixou de ser console de governança e virou o próprio aplicativo, com poder
  // em cima de cada item; o aplicativo abre no telefone, e esconder o Admin ali o esconderia
  // justamente na visão em que as pessoas usam o produto. A inversão é estreita: as outras
  // quatro superfícies continuam sendo mesa de trabalho.
  { prefixo: "/admin", regra: "visivel-no-app", nome: "Administração" },
  { prefixo: "/roteiro", regra: "so-web", nome: "roteiro guiado" },
];
