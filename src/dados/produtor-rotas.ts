/**
 * produtor-rotas.ts, quais fichas do Studio já respondem, e quais telas ele tem.
 *
 * POR QUE ELE É UM ARQUIVO E NÃO UMA CONSTANTE DENTRO DO LAYOUT. Três consumidores leem
 * esta lista: o trilho de pautas, o menu `+ Criar` do painel, e o portão
 * `verificar-produtor.mjs`. Uma lista por consumidor divergiria no primeiro acréscimo, e o
 * sintoma seria o trilho oferecendo uma pauta que o menu não cria, sem que nenhum dos dois
 * esteja errado sobre si mesmo.
 *
 * CLIENTE-SEGURO (DP-F): nenhum import de dado. É constante de módulo e mais nada.
 *
 * A LISTA É DO QUE EXISTE, e ela encolhe e cresce com o disco. Uma pauta declarada pronta
 * sem `page.tsx` do outro lado dá 404 no meio da demonstração, que é pior que a pastilha
 * desabilitada, quem clicou já perdeu o lugar.
 */

import type { Pauta } from "./tipos-produtor";

/**
 * As pautas cuja ficha já responde. Conferida contra o disco por
 * `scripts/verificar-produtor.mjs`, que compara esta lista com `find src/app -name page.tsx`
 * e reprova nos dois sentidos: pauta declarada pronta sem rota, e rota sem declaração.
 */
export const PAUTAS_COM_FICHA: readonly Pauta[] = [
  // A ficha da agenda são as oito telas da jornada, já construídas pela S7.
  "agenda",
  // Play e Cast: fichas novas, sobre o casco compartilhado de `produtor-ficha.tsx`.
  "play",
  "cast",
  "museu",
  "editorial",
  "curadoria",
  // As cinco herdadas da Organização: as rotas existem e serão portadas para a ficha nova.
  "cursos",
  "programa",
  "editais",
  "espacos",
  "midia",
];

/**
 * As telas da jornada da agenda, na ordem dos atos.
 *
 * ELAS JÁ EXISTIAM, oito rotas construídas pela S7, sem navegação entre si. O que este
 * arquivo faz é dar nome à ordem delas, para o trilho de progresso da ficha e para o painel
 * poderem apontar «resolve-se aqui» sem cada um decidir por conta própria qual tela é qual.
 *
 * `/studio/comercial/` é a P7, a tela que `tipos-acesso.ts:643,650` já referenciava e que
 * nunca foi construída: dois itens do score apontavam para uma rota morta.
 */
export interface TelaDoStudio {
  id: string;
  rota: string;
  rotulo: string;
  /** O ato da ficha da agenda a que ela corresponde. `-1` quando não é da agenda. */
  ato: number;
}

export const TELAS_DA_AGENDA: readonly TelaDoStudio[] = [
  { id: "publicar", rota: "/studio/publicar/", rotulo: "Identidade", ato: 0 },
  { id: "natureza", rota: "/studio/natureza/", rotulo: "Natureza", ato: 1 },
  { id: "elenco", rota: "/studio/elenco/", rotulo: "Elenco", ato: 2 },
  { id: "temporada", rota: "/studio/temporada/", rotulo: "Local e temporada", ato: 3 },
  { id: "grade", rota: "/studio/grade/", rotulo: "Grade de sessões", ato: 4 },
  { id: "comercial", rota: "/studio/comercial/", rotulo: "Comercial", ato: 5 },
  { id: "acessibilidade", rota: "/studio/acessibilidade/", rotulo: "Acessibilidade", ato: 6 },
  { id: "revisar", rota: "/studio/revisar/", rotulo: "Publicação", ato: 7 },
];

/**
 * As telas de gestão do que já foi publicado, o que o produtor faz depois, que é a maior
 * parte do trabalho real.
 */
export const TELAS_DE_GESTAO: readonly TelaDoStudio[] = [
  { id: "ocorrencias", rota: "/studio/ocorrencias/", rotulo: "Sessões publicadas", ato: -1 },
  { id: "duplicatas", rota: "/studio/duplicatas/", rotulo: "Duplicatas", ato: -1 },
  { id: "catalogos", rota: "/studio/catalogos/", rotulo: "Catálogos", ato: -1 },
  // AS CINCO DA ORGANIZAÇÃO mudaram de endereço em 2026-08-27, para
  // `/studio/organizacao/<tela>/`. Elas continuam listadas aqui porque são telas que o
  // produtor alcança, mas quem responde por elas é a instituição.
  { id: "alcance", rota: "/studio/organizacao/alcance/", rotulo: "Alcance", ato: -1 },
  { id: "integracao", rota: "/studio/organizacao/integracao/", rotulo: "Importação em lote", ato: -1 },
  { id: "conformidade", rota: "/studio/organizacao/conformidade/", rotulo: "Conformidade", ato: -1 },
  { id: "instituicao", rota: "/studio/organizacao/instituicao/", rotulo: "Ficha da instituição", ato: -1 },
  { id: "equipe", rota: "/studio/organizacao/equipe/", rotulo: "Equipe", ato: -1 },
];

/** A rota do ato `n` da ficha da agenda. `null` fora da faixa, quem chama trata. */
export function rotaDoAto(ato: number): string | null {
  return TELAS_DA_AGENDA.find((t) => t.ato === ato)?.rota ?? null;
}
