"use client";

import { usePontos } from "@/contexto/pontos";
import { faseDoCiclo } from "@/lib/pontos/missoes";
import { explicarMetrica, rankingDaMissao, unidadeDaMetrica } from "@/lib/pontos/ranking";

/**
 * missao-ranking.tsx — o placar de uma missão cumulativa.
 *
 * O PLACAR SE EXPLICA ANTES DE ORDENAR. Um pódio sem a métrica escrita faz quem
 * está em quarto achar que enviou pouco quando o que faltou foi constância — e
 * quem não entende por que perdeu não joga a próxima rodada.
 *
 * A TELA DECLARA QUE OS ADVERSÁRIOS SÃO DE DEMONSTRAÇÃO. São as mesmas pessoas
 * que o resto do protótipo já usa, com monograma em vez de foto, e dizer isso é a
 * mesma regra que a comunidade e a moderação seguem: número inventado que se
 * apresenta como real é a única coisa que este projeto não faz.
 */
export function MissaoRanking({ missaoId }: { missaoId: string }) {
  const { motor, hidratado } = usePontos();
  const missao = motor.catalogo.missoes.find((m) => m.id === missaoId);
  if (!missao?.ranking) return null;

  const linhas = rankingDaMissao(motor.atual, missao, motor.catalogo.pessoas);
  const fase = faseDoCiclo(missao, motor.atual.agora);
  const [primeiro, segundo, terceiro] = missao.ranking.bonus;

  return (
    <div className="flex flex-col gap-4">
      <div className="cartao">
        <span className="tipo-detalhe font-bold">{missao.titulo}</span>
        <p className="tipo-legenda text-tinta-2">{explicarMetrica(missao.ranking.metrica)}</p>
        <p className="tipo-legenda text-tinta-3">
          Vale só dentro desta missão: o placar não entra no seu nível nem na pontuação geral
          da comunidade.
        </p>
      </div>

      <div className="cartao" data-tom="premio">
        <span className="tipo-detalhe font-bold">
          {fase === "encerrado" ? "Bônus pagos no fechamento" : "Bônus de pódio no fechamento"}
        </span>
        <span className="tipo-legenda text-tinta-2">
          1º = {primeiro} · 2º = {segundo} · 3º = {terceiro} fichas, somadas ao que você já
          ganhou por envio.
        </span>
      </div>

      <ol className="placar">
        {linhas.map((linha) => (
          <li
            key={linha.pessoa.id}
            className="placar-linha"
            data-eu={linha.eu ? "sim" : "nao"}
            data-podio={linha.posicao <= 3 ? "sim" : "nao"}
          >
            <span className="placar-posicao">{linha.posicao}</span>
            <span className="placar-monograma" aria-hidden="true">
              {linha.pessoa.monograma}
            </span>
            <span className="flex flex-col">
              <span className="tipo-detalhe font-bold">
                {linha.pessoa.nome}
                {linha.eu && " (você)"}
              </span>
              <span className="tipo-legenda text-tinta-3">
                {linha.pessoa.cidade}, {linha.pessoa.uf}
              </span>
            </span>
            {linha.bonus !== undefined && (
              <span className="placar-bonus">+{linha.bonus}</span>
            )}
            <span className="placar-valor">
              {hidratado || !linha.eu ? linha.valor : 0}{" "}
              <span className="tipo-legenda text-tinta-3">
                {unidadeDaMetrica(missao.ranking!.metrica, linha.valor)}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <p className="tipo-legenda text-tinta-3">
        Protótipo: as outras pessoas do placar são as personas de demonstração do aplicativo,
        com monograma no lugar de foto. Só a sua linha vem dos seus envios de verdade.
      </p>
    </div>
  );
}
