/**
 * livro.ts — o livro-razão. Append-only, e é essa a única regra que importa aqui.
 *
 * Saldo NUNCA é um campo mutável: é `soma(créditos) − soma(débitos)` sobre as
 * linhas. Guardar um `saldo: number` ao lado do livro criaria duas fontes para o
 * mesmo número, e a pergunta «qual das duas está certa?» não tem resposta boa —
 * a que a tela mostra ou a que o extrato soma. Com uma fonte só, a divergência
 * é impossível por construção, e a tela de extrato não precisa de nenhum dado
 * novo para existir: ela É o livro.
 */

import type { Ativo, EstadoDoMotor, LinhaDoLivro } from "./tipos";

export function saldo(estado: EstadoDoMotor, ativo: Ativo): number {
  let soma = 0;
  for (const linha of estado.livro) {
    if (linha.ativo !== ativo) continue;
    soma += linha.sentido === "credito" ? linha.valor : -linha.valor;
  }
  return soma;
}

/** As linhas de um ativo, da mais nova para a mais velha — a ordem do extrato. */
export function extrato(estado: EstadoDoMotor, ativo?: Ativo): LinhaDoLivro[] {
  const linhas = ativo ? estado.livro.filter((l) => l.ativo === ativo) : estado.livro;
  return [...linhas].reverse();
}

export function novaLinha(
  estado: EstadoDoMotor,
  parcial: Omit<LinhaDoLivro, "id" | "personaId" | "criadoEm">,
): LinhaDoLivro {
  return {
    id: "liv_" + estado.personaId + "_" + estado.livro.length,
    personaId: estado.personaId,
    criadoEm: estado.agora,
    ...parcial,
  };
}
