/**
 * emblemas.ts — os critérios de emblema, avaliados sobre o estado derivado.
 *
 * TODO EMBLEMA DIZ COMO SE GANHA (`comoGanhar` em `EmblemaDefinido`), inclusive
 * antes de ser ganho. Emblema misterioso é enfeite: a pessoa vê um cadeado, não
 * entende o que fazer e ele deixa de ser meta. Dito na tela, ele vira o mapa do
 * que o produto quer que aconteça.
 *
 * O CRITÉRIO É UMA STRING (`"linguagens_8"`) e não uma função, para o mesmo
 * catálogo servir a tela «Conquistas» e ao painel do Observatório sem que os dois
 * precisem importar código executável. A tradução mora aqui, num lugar só.
 */

import { saldo } from "./livro";
import { nivelPara } from "./niveis";
import type { ConfiguracaoDoPrograma, EmblemaDefinido, EstadoDoMotor } from "./tipos";

/** Quanto do critério já foi cumprido — alimenta a barra do emblema ainda fechado. */
export function progressoDoCriterio(
  estado: EstadoDoMotor,
  config: ConfiguracaoDoPrograma,
  criterio: string,
): { atual: number; alvo: number } {
  const [tipo, bruto] = criterio.split("_");
  const alvo = Number(bruto) || 1;

  switch (tipo) {
    case "sequencia":
      return { atual: estado.sequencia.contagem, alvo };
    case "nivel":
      return {
        atual: nivelPara(saldo(estado, "percurso"), config.limiaresDeNivel, config.nomesDeNivel)
          .numero,
        alvo,
      };
    case "linguagens":
      return { atual: estado.linguagensAlcancadas.length, alvo };
    case "territorios":
      return { atual: estado.ufsAlcancadas.length, alvo };
    case "presencas":
      return { atual: estado.presencas.length, alvo };
    case "reputacao":
      return { atual: saldo(estado, "reputacao"), alvo };
    case "comunidades":
      return { atual: estado.assinadas.length, alvo };
    /**
     * `missao_<id>` — o selo que uma missão entrega ao fechar.
     *
     * O sufixo aqui é um ID, não um número, e é o único critério em que isso
     * acontece: `Number("m-primeira-exposicao")` é `NaN`, então `alvo` cai no 1
     * por si só. Sem este caso o selo cairia no `default` e a tela de conquistas
     * mostraria «0 de 1» para sempre, inclusive depois de ganho — um selo que se
     * contradiz é pior que um selo ausente.
     */
    case "missao":
      return { atual: estado.missoes[bruto]?.concluidaEm ? 1 : 0, alvo: 1 };
    default:
      // Critério desconhecido nunca cumpre, e nunca derruba a tela. Um emblema
      // com critério errado fica visivelmente fechado em vez de sumir em silêncio.
      return { atual: 0, alvo };
  }
}

export function criterioCumprido(
  estado: EstadoDoMotor,
  config: ConfiguracaoDoPrograma,
  emblema: EmblemaDefinido,
): boolean {
  const { atual, alvo } = progressoDoCriterio(estado, config, emblema.criterio);
  return atual >= alvo;
}

export function emblemasPendentes(
  estado: EstadoDoMotor,
  definidos: EmblemaDefinido[],
): EmblemaDefinido[] {
  const ganhos = new Set(estado.emblemas.map((e) => e.emblemaId));
  return definidos.filter((e) => !ganhos.has(e.id));
}
