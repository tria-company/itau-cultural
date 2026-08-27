"use client";

import Link from "next/link";
import { useMemo } from "react";
import { marcarAberturaDoDetalhe, useProdutor } from "@/componentes/produtor-estado";
import { DESEMPENHO_E_AUTORADO, comentariosDe } from "@/dados/desempenho-produtor";
import { DESCRICAO_DA_PAUTA, semTravessao } from "@/dados/tipos-produtor";
import type { ContextoDoProdutor, Registro } from "@/dados/tipos-produtor";

/**
 * produtor-comunidade.tsx, o outro lado do que você publica.
 *
 * A COMUNIDADE DE UM PRODUTOR É DUAS COISAS, e a tela mostra as duas. A primeira é quem
 * responde ao que ele publicou: um comentário sem resposta é a diferença entre um mural e
 * uma conversa, e ele chega espalhado por dez registros, que é onde se perde. Aqui os
 * comentários de tudo que está no ar aparecem juntos, em ordem de chegada, cada um com o
 * caminho de volta para o registro que o recebeu.
 *
 * A SEGUNDA É QUEM MAIS ALIMENTA O PRODUTO. Os agentes vêm do ACERVO REAL, com o resumo
 * que o CMS publica: são as instituições e coletivos que aparecem nas fichas como agente
 * realizador. Inventar uma rede social de produtores seria encenação; mostrar quem já está
 * no grafo é o que a casa faz.
 *
 * OS COMENTÁRIOS SÃO AUTORADOS, e a nota diz isso onde eles aparecem: não há usuários
 * neste protótipo, e o gerador é o mesmo da tela do registro, para o mesmo registro nunca
 * mostrar coisas diferentes em duas telas.
 */

export interface AgenteDaRede {
  id: string;
  titulo: string;
  classe: string;
  resumo: string;
}

function iniciaisDoNome(nome: string): string {
  const partes = nome.split(/\s+/).filter((p) => p.length > 0);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function Comunidade({
  semente,
  contexto,
  agentes,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  agentes: AgenteDaRede[];
}) {
  const armazem = useProdutor(semente, contexto);

  const conversas = useMemo(() => {
    const linhas = armazem.registros
      .filter((r) => r.situacao === "publicado")
      .flatMap((r) =>
        comentariosDe(r.id).map((c) => ({
          ...c,
          registro: r,
          chave: `${r.id}:${c.nome}:${c.haDias}`,
        })),
      );
    // Mais recentes primeiro. Empate pelo id, que é estável: sem o segundo critério a
    // ordem dependeria da implementação do `sort`, e mudaria entre dois navegadores.
    return linhas.sort((a, b) => a.haDias - b.haDias || a.registro.id.localeCompare(b.registro.id));
  }, [armazem.registros]);

  const daCasa = contexto.organizacao;
  const rede = agentes.filter((a) => a.titulo !== daCasa).slice(0, 6);

  if (!armazem.pronto) {
    return (
      <div className="prod-corpo">
        <p className="prod-nota">Lendo o que está gravado neste navegador…</p>
      </div>
    );
  }

  return (
    <>
      <header className="prod-cabecalho">
        <div className="prod-cabecalho-linha">
          <Link href="/studio/" className="prod-superficie prod-voltar" data-voltar-studio>
            ‹ Studio
          </Link>
          <span className="prod-contagem">
            {conversas.length} {conversas.length === 1 ? "comentário" : "comentários"}
          </span>
        </div>
        <h1 className="prod-titulo">Comunidade</h1>
      </header>

      <div className="prod-corpo prod-painel" data-comunidade>
        {/* ---- o que dizem do que você publicou ---- */}
        <section className="prod-secao" aria-labelledby="prod-comunidade-conversas">
          <h2 className="prod-secao-titulo" id="prod-comunidade-conversas">
            Dizem por aí
          </h2>

          {conversas.length === 0 ? (
            <div className="prod-vazio">
              <p className="prod-vazio-frase">
                Ninguém comentou ainda. Os comentários chegam no que está no ar, e nada seu
                está publicado neste navegador.
              </p>
            </div>
          ) : (
            conversas.slice(0, 8).map((c) => (
              <Link
                key={c.chave}
                href={DESCRICAO_DA_PAUTA[c.registro.pauta].rota}
                className="prod-conversa"
                data-conversa={c.registro.id}
                onClick={() => {
                  armazem.escolher(c.registro.id);
                  marcarAberturaDoDetalhe();
                }}
              >
                <span className="prod-comentario-avatar" aria-hidden>
                  {iniciaisDoNome(c.nome)}
                </span>
                <span className="prod-comentario-texto">
                  <span className="prod-comentario-meta">
                    {c.nome} · há {c.haDias} {c.haDias === 1 ? "dia" : "dias"}
                  </span>
                  {c.texto}
                  <span className="prod-conversa-onde">
                    em{" "}
                    {semTravessao(c.registro.titulo) ||
                      DESCRICAO_DA_PAUTA[c.registro.pauta].singular}
                  </span>
                </span>
                <span className="prod-melhor-numero" aria-hidden>
                  ▸
                </span>
              </Link>
            ))
          )}

          <p className="prod-grafico-legenda" title={DESEMPENHO_E_AUTORADO}>
            comentários autorados da demonstração
          </p>
        </section>

        {/* ---- quem mais alimenta o produto ---- */}
        {rede.length > 0 ? (
          <section className="prod-secao" aria-labelledby="prod-comunidade-rede">
            <h2 className="prod-secao-titulo" id="prod-comunidade-rede">
              Quem mais publica
            </h2>
            {rede.map((a) => (
              <div className="prod-agente" key={a.id} data-agente-da-rede={a.id}>
                <span className="prod-comentario-avatar" aria-hidden>
                  {iniciaisDoNome(a.titulo)}
                </span>
                <span className="prod-comentario-texto">
                  <span className="prod-comentario-meta">{a.classe}</span>
                  <strong>{a.titulo}</strong>
                  {a.resumo ? (
                    <span className="prod-agente-resumo">{semTravessao(a.resumo)}</span>
                  ) : null}
                </span>
              </div>
            ))}
            <p className="prod-grafico-legenda">
              agentes reais do acervo, com o resumo que o CMS publica
            </p>
          </section>
        ) : null}
      </div>
    </>
  );
}
