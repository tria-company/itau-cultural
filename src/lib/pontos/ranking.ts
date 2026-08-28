/**
 * ranking.ts — o placar de uma missão cumulativa.
 *
 * O PLACAR É DA MISSÃO, e não da comunidade. Ele não entra no nível, não entra
 * no percurso e não reordena ninguém fora daqui: o que ele ordena é uma janela
 * de 21 dias, e no fechamento ele paga o bônus de pódio. Misturar o dois faria
 * quem entrou depois nascer perdendo uma corrida que nunca viu começar.
 *
 * OS ADVERSÁRIOS SÃO AS PESSOAS DE DEMONSTRAÇÃO que o projeto já declara
 * (`dados/comunidade.ts`), não gente nova inventada para encher o pódio. Elas
 * chegam por parâmetro — este módulo não importa `@/dados` (DP-F) — e o valor de
 * cada uma é derivado do id da missão, então o mesmo placar sai igual toda vez
 * que a demonstração for ensaiada.
 */

import { aprovadasDe } from "./comprovacoes";
import { chaveDoDia } from "./relogio";
import type {
  EstadoDoMotor,
  MetricaDeRanking,
  MissaoDefinida,
  PessoaDaComunidade,
} from "./tipos";

export interface PosicaoNoRanking {
  posicao: number;
  pessoa: PessoaDaComunidade;
  valor: number;
  eu: boolean;
  /** Bônus que esta posição recebe no fechamento, quando houver. */
  bonus?: number;
}

const UNIDADE: Record<MetricaDeRanking, { curta: string; uma: string }> = {
  frequencia: { curta: "dias", uma: "dia" },
  volume: { curta: "envios", uma: "envio" },
  territorios: { curta: "estados", uma: "estado" },
};

export function unidadeDaMetrica(metrica: MetricaDeRanking, valor: number): string {
  const u = UNIDADE[metrica];
  return valor === 1 ? u.uma : u.curta;
}

export function explicarMetrica(metrica: MetricaDeRanking): string {
  switch (metrica) {
    case "frequencia":
      return "Conta os dias diferentes em que você teve pelo menos uma prova aprovada. Premia constância, não volume: dez envios num domingo valem um dia.";
    case "volume":
      return "Conta o total de provas aprovadas na janela. Quem produz mais no ciclo sobe.";
    case "territorios":
      return "Conta as unidades da federação diferentes que você alcançou. O placar mede o quanto você saiu do seu canto, não o quanto enviou.";
  }
}

/**
 * O valor da persona ativa na métrica da missão.
 *
 * MISSÃO NATIVA NÃO TEM COMPROVAÇÃO, e ler as aprovadas dela devolveria zero para
 * sempre — um placar em que a pessoa nunca sai do último lugar por mais que jogue.
 * Nessas, o valor é o progresso da própria missão, que é o número que a barra da
 * tela já mostra: as duas leituras não podem discordar.
 */
export function meuValor(estado: EstadoDoMotor, missao: MissaoDefinida): number {
  if (missao.prova !== "midia") return estado.missoes[missao.id]?.progresso ?? 0;

  const aprovadas = aprovadasDe(estado, missao.id);
  const metrica = missao.ranking?.metrica ?? "volume";

  if (metrica === "volume") return aprovadas.length;
  if (metrica === "frequencia") {
    return new Set(aprovadas.map((c) => chaveDoDia(c.enviadaEm))).size;
  }
  return new Set(aprovadas.map((c) => c.uf).filter(Boolean)).size;
}

/** FNV-1a — o mesmo de `validacao.ts`, pelo mesmo motivo: estabilidade da demo. */
function digito(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * O teto de cada métrica, e por que ele não é um número redondo qualquer.
 *
 * `frequencia` não pode passar dos dias do ciclo — um placar de ofensiva com 30
 * dias validados numa janela de 21 é um placar que se desmente sozinho na tela.
 * `territorios` para em 27, que é quantas unidades da federação existem.
 */
function teto(missao: MissaoDefinida): number {
  const metrica = missao.ranking?.metrica ?? "volume";
  if (metrica === "territorios") return 27;
  if (missao.ciclo) {
    const dias = Math.ceil((missao.ciclo.fechaEm - missao.ciclo.comecaEm) / 86_400_000);
    return Math.max(1, dias);
  }
  return 30;
}

export function rankingDaMissao(
  estado: EstadoDoMotor,
  missao: MissaoDefinida,
  pessoas: readonly PessoaDaComunidade[],
): PosicaoNoRanking[] {
  const limite = teto(missao);

  const adversarios = pessoas
    .filter((p) => p.id !== "eu" && p.id !== "p-ic")
    .map((p) => ({
      pessoa: p,
      // Faixa de 40% a 100% do teto: um pódio em que todo mundo tem quase o
      // mesmo número não comunica disputa, e um em que o primeiro tem dez vezes
      // o último faz quem chega desistir de olhar.
      valor: Math.max(1, Math.round(limite * (0.4 + (digito(missao.id + p.id) % 61) / 100))),
      eu: false,
    }));

  const eu = pessoas.find((p) => p.id === "eu");
  const linhas = [...adversarios];
  if (eu) linhas.push({ pessoa: eu, valor: meuValor(estado, missao), eu: true });

  linhas.sort((a, b) => {
    if (b.valor !== a.valor) return b.valor - a.valor;
    // Empate resolvido por nome, e não pela ordem de entrada: sem critério
    // estável, duas renderizações do mesmo estado trocam as posições entre si.
    return a.pessoa.nome.localeCompare(b.pessoa.nome, "pt-BR");
  });

  const bonus = missao.ranking?.bonus;
  return linhas.map((linha, i) => ({
    ...linha,
    posicao: i + 1,
    bonus: bonus && i < 3 ? bonus[i] : undefined,
  }));
}
