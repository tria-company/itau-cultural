/**
 * programa.ts — junta as quatro peças num catálogo só, que é o que o motor recebe.
 *
 * Existe para o motor ter UMA dependência de dado em vez de quatro, e para a
 * fronteira ficar explícita: tudo que o motor sabe sobre o mundo entra por aqui.
 * Nenhum destes quatro arquivos alcança `grafo.ts` (DP-F), então este também não.
 */

import { COMUNIDADES, PESSOAS, PUBLICACOES } from "./comunidade";
import { PUBLICACOES_DO_ACERVO } from "./comunidade-feed";
import { RECOMPENSAS } from "./recompensas";
import { CONFIG, EMBLEMAS, MISSOES, REGRAS } from "./pontos";
import type { DadosDoPrograma } from "@/lib/pontos/tipos";

export const PROGRAMA: DadosDoPrograma = {
  config: CONFIG,
  regras: REGRAS,
  missoes: MISSOES,
  emblemas: EMBLEMAS,
  recompensas: RECOMPENSAS,
  comunidades: COMUNIDADES,
  /**
   * As escritas à mão vêm PRIMEIRO — são as que abrem cada comunidade e contam
   * o que ela é. As geradas do acervo vêm em seguida e dão volume: sem elas,
   * uma comunidade com uma publicação só parece abandonada.
   */
  publicacoes: [...PUBLICACOES, ...PUBLICACOES_DO_ACERVO],
  pessoas: PESSOAS,
};
