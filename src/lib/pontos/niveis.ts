/**
 * niveis.ts — percurso acumulado vira nível e progresso até o próximo.
 *
 * PERCURSO NUNCA DIMINUI, e por isso o nível também não. É a diferença entre este
 * ativo e a ficha: a ficha é gasta nas recompensas, o percurso é histórico. Se resgatar
 * uma cortesia rebaixasse o nível, as recompensas passaria a punir exatamente o
 * comportamento que ela existe para premiar.
 */

export interface Nivel {
  /** 1-based — não existe nível 0. */
  numero: number;
  nome: string;
  /** Percurso já feito dentro do nível atual. */
  dentro: number;
  /** Quanto falta para o próximo. Zero no topo. */
  falta: number;
  /** Tamanho do nível atual. */
  vao: number;
  /** 0..1, para a barra. No topo é sempre 1. */
  fracao: number;
  /** Verdadeiro no último nível — a tela diz «nível máximo», não «faltam 0». */
  noTopo: boolean;
}

export function nivelPara(percurso: number, limiares: number[], nomes: string[]): Nivel {
  let numero = 1;
  for (let i = 0; i < limiares.length; i++) {
    if (percurso >= limiares[i]) numero = i + 1;
  }

  const base = limiares[numero - 1] ?? 0;
  const proximo = limiares[numero];
  const noTopo = proximo === undefined;
  const vao = noTopo ? 1 : proximo - base;
  const dentro = percurso - base;

  return {
    numero,
    nome: nomes[numero - 1] ?? "Nível " + numero,
    dentro,
    falta: noTopo ? 0 : proximo - percurso,
    vao,
    fracao: noTopo ? 1 : Math.min(1, dentro / vao),
    noTopo,
  };
}
