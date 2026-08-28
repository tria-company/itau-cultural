/**
 * sequencia.ts — a máquina de estados da sequência, e a razão dela ser SEMANAL.
 *
 * POR QUE SEMANAL, E NÃO DIÁRIA. Um app de consumo cultural não se abre todo dia
 * e não deve pedir isso: ninguém vai ao teatro na terça e ao cinema na quarta, e
 * uma sequência diária transformaria a cultura numa obrigação de comparecimento.
 * Basta UM gesto válido na semana — o modelo do Strava. Os dias distintos dentro
 * da semana continuam sendo marcados (`marcas`), porque «voltei em três dias
 * diferentes» é informação boa de mostrar; ela só não é o que MANTÉM a sequência.
 *
 * A ESCADA DE PROTEÇÃO, que é o pedaço que vale de verdade. O fluxo de perda nunca
 * é «faltou → zero»:
 *
 *   segura → em risco → carência → congelada (se houver proteção) → quebrada
 *
 * São três chances antes de perder, e um gesto válido em qualquer degrau devolve
 * a sequência para «segura» sem perder a contagem. Zerar no primeiro tropeço é o
 * desenho que faz alguém desistir na primeira semana ruim — e semana ruim é a
 * regra, não a exceção.
 */

import { diaDaSemana } from "./relogio";
import type { Sequencia } from "./tipos";

/**
 * A sequência inicial NÃO começa em zero, e isso é escolha de demonstração: o
 * protótipo abre com hábito já formado (3 semanas), porque a tela que importa
 * mostrar é a da escada agindo, e uma sequência zerada não tem o que proteger.
 */
export function sequenciaInicial(): Sequencia {
  return {
    ritmo: "semanal",
    contagem: 3,
    melhor: 5,
    fase: "segura",
    protecoes: 2,
    marcas: [false, false, false, false, false, false, false],
    valeuNestePeriodo: false,
    historico: [
      { chaveDoPeriodo: "s-3", manteve: true },
      { chaveDoPeriodo: "s-2", manteve: true },
      { chaveDoPeriodo: "s-1", manteve: true },
    ],
  };
}

export interface ResultadoDeEvento {
  sequencia: Sequencia;
  /** Primeiro gesto válido do período — é este que estende a contagem. */
  estendeu?: boolean;
  /** A contagem cruzou um marco de 4 semanas. */
  marco?: number;
}

/** Um gesto válido aconteceu agora. */
export function aoGestoValido(anterior: Sequencia, agora: number): ResultadoDeEvento {
  const s: Sequencia = { ...anterior, marcas: [...anterior.marcas] };
  s.marcas[diaDaSemana(agora)] = true;

  // Segundo gesto da mesma semana marca o dia e para por aí: a sequência conta
  // semanas, não ações. Contar cada ação faria uma maratona de domingo valer o
  // mesmo que sete semanas de hábito.
  if (s.valeuNestePeriodo) return { sequencia: s };

  s.valeuNestePeriodo = true;

  // Recuperação: um gesto válido em qualquer degrau da escada volta para segura
  // COM A CONTAGEM INTACTA. É o que torna a escada uma proteção de verdade em vez
  // de um adiamento do castigo.
  if (s.fase === "carencia" || s.fase === "em-risco" || s.fase === "congelada") {
    s.fase = "segura";
  }
  if (s.fase === "quebrada") {
    s.contagem = 0;
    s.fase = "segura";
  }

  s.contagem += 1;
  s.melhor = Math.max(s.melhor, s.contagem);

  return {
    sequencia: s,
    estendeu: true,
    marco: s.contagem % 4 === 0 ? s.contagem : undefined,
  };
}

export interface ResultadoDeVirada {
  sequencia: Sequencia;
  emRisco?: boolean;
  congelou?: boolean;
  /** A contagem que se perdeu. Só vem quando quebrou de verdade. */
  quebrou?: number;
}

/** Virada de semana. Chamada uma vez por fronteira que o relógio cruzar. */
export function aoVirarPeriodo(anterior: Sequencia, chave: string): ResultadoDeVirada {
  const s: Sequencia = {
    ...anterior,
    marcas: [false, false, false, false, false, false, false],
    historico: [...anterior.historico],
    valeuNestePeriodo: false,
  };

  if (anterior.valeuNestePeriodo) {
    s.historico.push({ chaveDoPeriodo: chave, manteve: true });
    s.fase = "segura";
    return { sequencia: s };
  }

  // Semana vazia: a escada, um degrau por vez.
  if (anterior.fase === "segura" || anterior.fase === "em-risco") {
    s.fase = "carencia";
    s.historico.push({ chaveDoPeriodo: chave, manteve: false });
    return { sequencia: s, emRisco: true };
  }

  if (anterior.fase === "carencia") {
    if (s.protecoes > 0) {
      s.protecoes -= 1;
      s.fase = "congelada";
      s.historico.push({ chaveDoPeriodo: chave, manteve: false, congelada: true });
      return { sequencia: s, congelou: true };
    }
    const perdida = s.contagem;
    s.fase = "quebrada";
    s.contagem = 0;
    s.historico.push({ chaveDoPeriodo: chave, manteve: false });
    return { sequencia: s, quebrou: perdida };
  }

  if (anterior.fase === "congelada") {
    // A proteção segura UM período. A falta seguinte quebra — e é isso que impede
    // o congelamento de virar uma sequência infinita sem nenhum gesto.
    const perdida = s.contagem;
    s.fase = "quebrada";
    s.contagem = 0;
    s.historico.push({ chaveDoPeriodo: chave, manteve: false });
    return { sequencia: s, quebrou: perdida };
  }

  s.historico.push({ chaveDoPeriodo: chave, manteve: false });
  return { sequencia: s };
}

/**
 * Fim de semana chegando sem nenhum gesto → «em risco». É o gancho do aviso, e
 * ele existe para o aviso ser ÚTIL: avisar na segunda que a semana está vazia é
 * ruído; avisar no sábado é a última chance de fazer alguma coisa.
 */
export function marcarRiscoSePreciso(
  s: Sequencia,
  agora: number,
): { sequencia: Sequencia; virou?: boolean } {
  if (s.valeuNestePeriodo || s.fase !== "segura") return { sequencia: s };
  if (diaDaSemana(agora) < 5) return { sequencia: s };
  return { sequencia: { ...s, fase: "em-risco" }, virou: true };
}

/** Quantos dias distintos da semana corrente já têm marca. */
export function diasMarcados(s: Sequencia): number {
  return s.marcas.filter(Boolean).length;
}
