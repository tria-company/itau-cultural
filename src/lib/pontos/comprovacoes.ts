/**
 * comprovacoes.ts — o fato pendente, e as travas que decidem se ele pode nascer.
 *
 * UMA COMPROVAÇÃO NÃO É PONTO. Enquanto ela está em `enviada`, `analisando` ou
 * `em-moderacao`, o saldo da pessoa é exatamente o mesmo de antes do envio: nada
 * entrou no livro. Só a aprovação emite `missao.prova.aprovada`, e é o motor —
 * pelo caminho de sempre — que credita. É o que impede o desenho em que o ponto
 * chega antes de ser merecido e depois some num estorno que a pessoa lê no
 * extrato como «−10 fichas» sem ter gasto nada.
 *
 * AS TRAVAS DEVOLVEM MOTIVO, nunca só `false`. O botão principal da tela da
 * missão desabilita com a legenda que sai daqui — «você já enviou hoje», «as
 * vagas acabaram», «o ciclo fechou». Botão cinza sem explicação é a forma mais
 * barata de fazer alguém achar que o aplicativo quebrou.
 */

import { faseDoCiclo } from "./missoes";
import { chaveDoDia } from "./relogio";
import type { Comprovacao, EstadoDoMotor, MissaoDefinida } from "./tipos";

export function comprovacoesDe(estado: EstadoDoMotor, missaoId: string): Comprovacao[] {
  return estado.comprovacoes.filter((c) => c.missaoId === missaoId);
}

export function aprovadasDe(estado: EstadoDoMotor, missaoId: string): Comprovacao[] {
  return comprovacoesDe(estado, missaoId).filter((c) => c.fase === "aprovada");
}

/**
 * Os hashes que já entraram nesta missão — o que a trava de duplicidade compara.
 *
 * Conta TODAS as fases, não só as aprovadas: reenviar a foto que acabou de ser
 * recusada, ou a que está esperando moderação, é exatamente a tentativa que a
 * trava existe para barrar.
 */
export function hashesDe(estado: EstadoDoMotor, missaoId: string): string[] {
  return comprovacoesDe(estado, missaoId).map((c) => c.arquivo.hash);
}

export function enviosNoDia(estado: EstadoDoMotor, missaoId: string, agora: number): number {
  const hoje = chaveDoDia(agora);
  return comprovacoesDe(estado, missaoId).filter((c) => chaveDoDia(c.enviadaEm) === hoje).length;
}

/**
 * Quantas participações ainda cabem.
 *
 * Vaga é POR PESSOA, não por envio — «limite de 1.500 participações, conferido a
 * cada entrada». Numa cumulativa de 21 dias, contar por envio faria o limite de
 * 1.500 acabar com 71 pessoas.
 */
export function vagasRestantes(estado: EstadoDoMotor, missao: MissaoDefinida): number | undefined {
  if (missao.vagas === undefined) return undefined;
  const euEntrei = comprovacoesDe(estado, missao.id).length > 0 ? 1 : 0;
  return Math.max(0, missao.vagas - (missao.vagasTomadas ?? 0) - euEntrei);
}

export interface Permissao {
  pode: boolean;
  /** A legenda do botão desabilitado. Presente sempre que `pode` é falso. */
  motivo?: string;
}

export function podeEnviar(
  estado: EstadoDoMotor,
  missao: MissaoDefinida,
  agora: number,
): Permissao {
  if (missao.prova !== "midia") {
    return { pode: false, motivo: "Esta missão fecha sozinha quando você faz a ação no app." };
  }

  const emCurso = estado.missoes[missao.id];
  if ((missao.modelo ?? "unica") === "unica" && emCurso?.concluidaEm) {
    return { pode: false, motivo: "Missão concluída. Ela aceita um envio aprovado só." };
  }

  const fase = faseDoCiclo(missao, agora);
  if (fase === "antes") return { pode: false, motivo: "O ciclo desta missão ainda não abriu." };
  if (fase === "encerrado") return { pode: false, motivo: "O ciclo desta missão fechou." };

  // Uma prova esperando decisão bloqueia a próxima. Sem isto, dá para empilhar
  // dez envios antes da primeira análise terminar e furar a trava diária inteira.
  const emAnalise = comprovacoesDe(estado, missao.id).some(
    (c) => c.fase === "enviada" || c.fase === "analisando",
  );
  if (emAnalise) return { pode: false, motivo: "Sua última prova ainda está em análise." };

  const restantes = vagasRestantes(estado, missao);
  if (restantes !== undefined && restantes <= 0 && comprovacoesDe(estado, missao.id).length === 0) {
    return { pode: false, motivo: "As vagas desta missão acabaram." };
  }

  if (missao.maxEnviosPorDia !== undefined) {
    const feitos = enviosNoDia(estado, missao.id, agora);
    if (feitos >= missao.maxEnviosPorDia) {
      const limite = missao.maxEnviosPorDia;
      return {
        pode: false,
        motivo:
          limite === 1
            ? "Você já enviou hoje. Volte amanhã para somar mais um dia."
            : `Você já fez os ${limite} envios de hoje.`,
      };
    }
  }

  return { pode: true };
}
