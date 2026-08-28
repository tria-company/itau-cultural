/**
 * missoes.ts — missões com reset por período no relógio virtual.
 *
 * O QUE UMA MISSÃO É AQUI: um convite com porta. Toda missão carrega `rota`, e
 * isso não é conveniência — é a regra de não deixar beco. Uma missão que diz
 * «ouça um episódio» sem levar a lugar nenhum transfere para a pessoa o trabalho
 * de descobrir onde fica o Cast, e o custo desse trabalho é maior que a
 * recompensa que a missão oferece.
 *
 * O RESET É POR CHAVE DE PERÍODO, não por temporizador. `MissaoEmCurso` guarda a
 * chave em que o progresso vale; quando o relógio passa para outra chave, o
 * progresso simplesmente deixa de valer e um estado novo nasce zerado. Não há
 * varredura noturna para escrever, não há missão que «esquece» de resetar porque
 * ninguém abriu o app naquele dia.
 */

import { chaveDaSemana, chaveDoDia } from "./relogio";
import type { EstadoDoMotor, MissaoDefinida, MissaoEmCurso, NomeDeEvento } from "./tipos";

export function chaveDePeriodo(missao: MissaoDefinida, agora: number): string {
  if (missao.expiraEm === "dia") return chaveDoDia(agora);
  if (missao.expiraEm === "semana") return chaveDaSemana(agora);
  // `nunca` e `ciclo` NÃO resetam, e por motivos opostos: a missão de estreia não
  // tem período nenhum, e a cumulativa tem UM período que vale do início ao
  // fechamento. As duas devolvem chave constante — se a do ciclo variasse com o
  // relógio, o progresso de 12 turnos zeraria no meio da janela.
  if (missao.expiraEm === "nunca") return "sempre";
  if (missao.expiraEm === "ciclo") return "ciclo:" + missao.id;
  return "temporada";
}

/** Em que ponto da janela a missão cumulativa está. Sem ciclo, está sempre aberta. */
export function faseDoCiclo(
  missao: MissaoDefinida,
  agora: number,
): "antes" | "aberto" | "encerrado" {
  if (!missao.ciclo) return "aberto";
  if (agora < missao.ciclo.comecaEm) return "antes";
  if (agora > missao.ciclo.fechaEm) return "encerrado";
  return "aberto";
}

/** Garante um estado válido para o período corrente, criando um zerado na virada. */
export function garantirEstado(estado: EstadoDoMotor, missao: MissaoDefinida): MissaoEmCurso {
  const chave = chaveDePeriodo(missao, estado.agora);
  const atual = estado.missoes[missao.id];
  if (atual && atual.chaveDoPeriodo === chave) return atual;

  const novo: MissaoEmCurso = { missaoId: missao.id, progresso: 0, chaveDoPeriodo: chave };
  estado.missoes[missao.id] = novo;
  return novo;
}

export interface AvancoDeMissao {
  missao: MissaoDefinida;
  concluiu: boolean;
}

/**
 * Avança toda missão cujo `avancaCom` casa com o evento.
 *
 * `restrita` EXISTE POR CAUSA DAS PROVAS. Todas as missões de mídia escutam o
 * mesmo `missao.prova.aprovada`, então sem escopo uma foto aprovada na «Sua
 * primeira exposição» avançaria junto «Arte fora do museu», «Leve alguém» e o
 * resto do catálogo — um envio pagaria oito missões. Quando o evento nasce
 * amarrado a uma missão, só ela anda.
 */
export function avancarMissoes(
  estado: EstadoDoMotor,
  definidas: MissaoDefinida[],
  nomeDoEvento: NomeDeEvento,
  passos = 1,
  restrita?: string,
): AvancoDeMissao[] {
  const avancos: AvancoDeMissao[] = [];

  for (const missao of definidas) {
    if (restrita !== undefined && missao.id !== restrita) continue;
    if (!missao.avancaCom.includes(nomeDoEvento)) continue;

    const emCurso = garantirEstado(estado, missao);
    if (emCurso.concluidaEm) continue;

    emCurso.progresso = Math.min(missao.alvo, emCurso.progresso + passos);

    if (emCurso.progresso >= missao.alvo) {
      emCurso.concluidaEm = estado.agora;
      avancos.push({ missao, concluiu: true });
    } else {
      avancos.push({ missao, concluiu: false });
    }
  }

  return avancos;
}

/**
 * A meta da semana — o «faltam 2 para fechar a semana» da tela inicial.
 *
 * Conta as missões SEMANAIS e SOCIAIS concluídas no período corrente, com teto de
 * 3. O teto existe porque uma meta que cresce com o catálogo pune quem chega
 * quando o catálogo está grande: com 12 missões na semana, «feche todas» é uma
 * meta que ninguém fecha, e meta que ninguém fecha some da tela em duas semanas.
 */
export function metaDaSemana(estado: EstadoDoMotor, definidas: MissaoDefinida[]) {
  const doPeriodo = definidas.filter((m) => m.tipo === "semanal" || m.tipo === "social");
  const chave = chaveDaSemana(estado.agora);

  const feitas = doPeriodo.filter((m) => {
    const emCurso = estado.missoes[m.id];
    return emCurso && emCurso.chaveDoPeriodo === chave && emCurso.concluidaEm;
  }).length;

  return { feitas, alvo: Math.min(3, doPeriodo.length) };
}
