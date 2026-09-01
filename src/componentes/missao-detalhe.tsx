"use client";

import Link from "next/link";
import { Moeda, Painel } from "@/componentes/pontos-base";
import { MissaoEnvio } from "@/componentes/missao-envio";
import { usePontos } from "@/contexto/pontos";
import { comprovacoesDe, vagasRestantes } from "@/lib/pontos/comprovacoes";
import { faseDoCiclo, garantirEstado } from "@/lib/pontos/missoes";
import { meuValor, rankingDaMissao, unidadeDaMetrica } from "@/lib/pontos/ranking";
import { DIA_MS } from "@/lib/pontos/relogio";
import type { Comprovacao, MissaoDefinida } from "@/lib/pontos/tipos";

/**
 * missao-detalhe.tsx — a tela de uma missão.
 *
 * A ORDEM DOS BLOCOS É A ORDEM DA DÚVIDA de quem chega: o que é isso, até quando
 * vale, quanto paga, em que pé eu estou, o que exatamente conta, e só então o
 * botão. Pôr o botão antes das regras produziria exatamente o envio que a
 * análise recusa — e uma recusa que a tela poderia ter evitado é culpa da tela.
 */

function data(ms: number): string {
  return new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const ROTULO_DA_FASE: Record<Comprovacao["fase"], string> = {
  enviada: "enviada",
  analisando: "analisando",
  aprovada: "aprovada",
  "em-moderacao": "em moderação",
  recusada: "recusada",
};

export function MissaoDetalhe({ missaoId }: { missaoId: string }) {
  const { motor, hidratado } = usePontos();
  const missao = motor.catalogo.missoes.find((m) => m.id === missaoId);
  if (!missao) return null;

  const estado = motor.atual;
  const emCurso = garantirEstado(estado, missao);
  const concluida = hidratado && Boolean(emCurso.concluidaEm);
  const progresso = hidratado ? emCurso.progresso : 0;
  const cumulativa = missao.modelo === "cumulativa";
  const minhas = hidratado ? comprovacoesDe(estado, missao.id) : [];
  const restantes = hidratado ? vagasRestantes(estado, missao) : undefined;
  const fase = faseDoCiclo(missao, estado.agora);
  const emblema = missao.emblemaId
    ? motor.catalogo.emblemas.find((e) => e.id === missao.emblemaId)
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="cartao flex-col gap-3">
        <div className="missao-etiquetas">
          <span className="missao-etiqueta" data-cor="modelo">
            {cumulativa ? "Missão cumulativa" : "Missão única"}
          </span>
          <span className="missao-etiqueta" data-cor="prova">
            {missao.prova === "midia" ? "Prova externa · foto" : "Ação nativa do app"}
          </span>
          {restantes !== undefined && (
            <span className="missao-etiqueta" data-cor="vagas">
              {restantes.toLocaleString("pt-BR")} vagas restantes
            </span>
          )}
        </div>

        {emblema && (
          <span className="tipo-legenda text-tinta-2">
            Selo a ganhar: <strong className="text-tinta">{emblema.titulo}</strong>
          </span>
        )}

        <p className="tipo-detalhe text-tinta-2">{missao.descricao}</p>

        <div className="missao-quadros">
          <div className="missao-quadro">
            <span className="tipo-legenda text-tinta-3">PERÍODO</span>
            <span className="tipo-detalhe font-bold">
              {missao.ciclo
                ? `${data(missao.ciclo.comecaEm)} a ${data(missao.ciclo.fechaEm)}`
                : "Sem prazo"}
            </span>
            {missao.ciclo && fase === "aberto" && (
              <span className="tipo-legenda text-tinta-3">
                fecha em {Math.max(0, Math.ceil((missao.ciclo.fechaEm - estado.agora) / DIA_MS))} dias
              </span>
            )}
            {fase === "encerrado" && (
              <span className="tipo-legenda text-tinta-3">ciclo encerrado</span>
            )}
          </div>

          <div className="missao-quadro" data-tom="premio">
            <span className="tipo-legenda text-tinta-3">PONTUAÇÃO</span>
            <span className="tipo-detalhe font-bold">
              {missao.porEnvio
                ? `+${missao.porEnvio.percurso} por envio aprovado`
                : `+${missao.percurso} percurso na conclusão`}
            </span>
            <span className="tipo-legenda saldo-linha text-tinta-2">
              {missao.porEnvio ? (
                <>
                  <Moeda />+{missao.porEnvio.fichas} por envio · +{missao.fichas} ao concluir
                </>
              ) : (
                <>
                  <Moeda />+{missao.fichas} ao concluir
                </>
              )}
            </span>
            {missao.ranking && (
              <span className="tipo-legenda text-tinta-3">
                mais bônus de pódio no fechamento
              </span>
            )}
          </div>
        </div>
      </div>

      <MeuProgresso
        missao={missao}
        progresso={progresso}
        concluida={concluida}
        hidratado={hidratado}
      />

      {missao.regrasDeAceite && (
        <Painel titulo="O que a análise vai verificar">
          <p className="tipo-legenda text-tinta-3">
            É a mesma regra cadastrada pelo gestor: nada é analisado fora desta lista.
          </p>
          <div className="regras-duas">
            <ul className="regras-lista" data-lado="vale">
              <li className="tipo-legenda font-bold">O QUE VALE</li>
              {missao.regrasDeAceite.vale.map((item) => (
                <li key={item} className="tipo-legenda">
                  {item}
                </li>
              ))}
            </ul>
            <ul className="regras-lista" data-lado="nao-vale">
              <li className="tipo-legenda font-bold">O QUE NÃO VALE</li>
              {missao.regrasDeAceite.naoVale.map((item) => (
                <li key={item} className="tipo-legenda">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Painel>
      )}

      {missao.tagAoConcluir && (
        <div className="cartao">
          <span className="tipo-detalhe font-bold">
            Ao concluir, a tag {missao.tagAoConcluir} entra no seu perfil
          </span>
          <span className="tipo-legenda text-tinta-2">
            A tag é aplicada automaticamente e libera conteúdos exclusivos.
          </span>
        </div>
      )}

      {missao.prova === "midia" ? (
        <MissaoEnvio missao={missao} />
      ) : (
        !concluida && (
          <Link href={missao.rota} className="botao-acao no-underline">
            Fazer no app
          </Link>
        )
      )}

      {missao.prova === "midia" && minhas.length > 0 && (
        <Painel titulo="Minhas comprovações">
          <ul className="comprovacoes">
            {minhas.map((c) => (
              <li key={c.id} className="comprovacao">
                {c.arquivo.miniatura ? (
                  // eslint-disable-next-line @next/next/no-img-element -- dataURL
                  // gerado no aparelho: `next/image` só otimiza o que veio do build.
                  <img src={c.arquivo.miniatura} alt="" className="comprovacao-mini" />
                ) : (
                  <span className="comprovacao-mini" aria-hidden="true" />
                )}
                <span className="flex flex-col">
                  <span className="tipo-detalhe">{c.arquivo.nome}</span>
                  <span className="tipo-legenda text-tinta-3">
                    {data(c.enviadaEm)}
                    {c.confianca > 0 && ` · confiança ${c.confianca}%`}
                  </span>
                  {c.fase === "recusada" && c.motivo && (
                    <span className="tipo-legenda text-tinta-2">{c.motivo}</span>
                  )}
                </span>
                <span className="comprovacao-selo" data-fase={c.fase}>
                  {ROTULO_DA_FASE[c.fase]}
                </span>
              </li>
            ))}
          </ul>
        </Painel>
      )}

      {missao.ranking && (
        <Link href={`/desafios/${missao.id}/ranking/`} className="ranking-atalho no-underline">
          <span className="flex flex-col">
            <span className="tipo-detalhe font-bold">Ranking da missão</span>
            <span className="tipo-legenda">
              {hidratado ? <PosicaoResumo missaoId={missao.id} /> : "—"}
            </span>
          </span>
          <span aria-hidden="true">›</span>
        </Link>
      )}
    </div>
  );
}

function MeuProgresso({
  missao,
  progresso,
  concluida,
  hidratado,
}: {
  missao: MissaoDefinida;
  progresso: number;
  concluida: boolean;
  hidratado: boolean;
}) {
  const fracao = missao.alvo === 0 ? 0 : Math.min(1, progresso / missao.alvo);

  return (
    <div className="cartao">
      <span className="tipo-detalhe font-bold">
        {concluida ? "Missão concluída" : "Meu progresso"}
      </span>
      <span className="nivel-barra">
        <span className="nivel-preenchimento" style={{ width: `${fracao * 100}%` }} />
      </span>
      <span className="tipo-legenda text-tinta-2">
        {hidratado ? `${progresso} de ${missao.alvo}` : "—"}
        {missao.maxEnviosPorDia !== undefined &&
          ` · limite de ${missao.maxEnviosPorDia} ${missao.maxEnviosPorDia === 1 ? "envio" : "envios"} por dia`}
      </span>
    </div>
  );
}

/** O resumo que o atalho do placar mostra — a mesma conta da tela de ranking. */
function PosicaoResumo({ missaoId }: { missaoId: string }) {
  const { motor } = usePontos();
  const missao = motor.catalogo.missoes.find((m) => m.id === missaoId);
  if (!missao?.ranking) return null;

  const linhas = rankingDaMissao(motor.atual, missao, motor.catalogo.pessoas);
  const eu = linhas.find((l) => l.eu);
  const valor = meuValor(motor.atual, missao);

  return (
    <>
      {eu ? `Você está em ${eu.posicao}º entre ${linhas.length} participantes` : "Veja o placar"}
      {` · ${valor} ${unidadeDaMetrica(missao.ranking.metrica, valor)}`}
    </>
  );
}
