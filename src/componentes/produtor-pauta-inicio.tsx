"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BarraDeAcao, BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { DESEMPENHO_E_AUTORADO, desempenhoDe } from "@/dados/desempenho-produtor";
import type { Desempenho } from "@/dados/desempenho-produtor";
import { DESCRICAO_DA_PAUTA, semTravessao } from "@/dados/tipos-produtor";
import { ROTULO_DA_SITUACAO } from "@/dados/tipos-acesso";
import type { Pauta, Registro } from "@/dados/tipos-produtor";

/**
 * produtor-pauta-inicio.tsx, o PAINEL de uma pauta: o que se vê antes de editar.
 *
 * A ROTA DA PAUTA NÃO ABRE MAIS NUMA FICHA. Cair direto num formulário no meio, com um
 * registro que a pessoa não escolheu, foi reprovado a olho: quem chega quer saber COMO A
 * CATEGORIA VAI (quantos no ar, quanto público, quais os melhores) e então decidir se
 * adiciona ou edita. As etapas continuam sendo o único caminho de escrita, atrás do
 * botão «Adicionar» e do toque em qualquer linha.
 *
 * OS NÚMEROS SÃO OS DA PAUTA: ingresso para evento, play para audiovisual, leitura para
 * matéria, visualização para o resto, os mesmos de desempenho-produtor.ts, autorados e
 * determinísticos, declarados na nota do rodapé.
 */

function heroiDe(d: Desempenho): { valor: number; rotulo: string } {
  if (d.familia === "evento") return { valor: d.ingressos, rotulo: "ingressos" };
  if (d.familia === "audiovisual") return { valor: d.plays, rotulo: "plays" };
  if (d.familia === "leitura") return { valor: d.leituras, rotulo: "leituras" };
  return { valor: d.vistas, rotulo: "visualizações" };
}

function milhar(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export interface ImagemDoAcervo {
  caminho: string;
  credito: string;
  alt: string;
  de: string;
}

export function PautaInicio({
  pauta,
  registros,
  dataDeReferencia,
  imagens,
  aoAdicionar,
  aoAbrir,
}: {
  pauta: Pauta;
  registros: Registro[];
  dataDeReferencia: string;
  imagens: ImagemDoAcervo[];
  aoAdicionar: () => void;
  aoAbrir: (id: string) => void;
}) {
  const d = DESCRICAO_DA_PAUTA[pauta];

  const publicados = useMemo(
    () => registros.filter((r) => r.situacao === "publicado"),
    [registros],
  );
  const emEdicao = useMemo(
    () => registros.filter((r) => r.situacao === "rascunho" || r.situacao === "devolvido"),
    [registros],
  );

  const medidos = useMemo(
    () =>
      publicados
        .map((r) => ({ r, heroi: heroiDe(desempenhoDe(r, dataDeReferencia)) }))
        .sort((a, b) => b.heroi.valor - a.heroi.valor),
    [publicados, dataDeReferencia],
  );

  const total = medidos.reduce((n, m) => n + m.heroi.valor, 0);
  const rotuloDoTotal = medidos[0]?.heroi.rotulo ?? heroiDe(desempenhoDe(registroExemplo(pauta), dataDeReferencia)).rotulo;

  const capaDe = (r: Registro): string | null =>
    r.imagem?.caminho ?? imagens[0]?.caminho ?? null;

  return (
    <>
      <header className="prod-cabecalho">
        <div className="prod-cabecalho-linha">
          <Link href="/studio/" className="prod-superficie prod-voltar" data-voltar-studio>
            ‹ Studio
          </Link>
          <span className="prod-contagem">
            {publicados.length} no ar
          </span>
        </div>
        <h1 className="prod-titulo">{d.rotulo}</h1>
      </header>

      <div className="prod-corpo" data-inicio-da-pauta={pauta}>
        {registros.length === 0 ? (
          <div className="prod-vazio">
            <p className="prod-vazio-frase">{semTravessao(d.objetivo)}</p>
          </div>
        ) : (
          <>
            {/* ---- os tres numeros da categoria ---- */}
            <div className="prod-inicio-stats" data-numeros-da-pauta>
              <span className="prod-inicio-stat">
                <strong>{publicados.length}</strong>
                <span>no ar</span>
              </span>
              <span className="prod-inicio-stat">
                <strong>{milhar(total)}</strong>
                <span>{rotuloDoTotal}</span>
              </span>
              <span className="prod-inicio-stat">
                <strong>{emEdicao.length}</strong>
                <span>em edição</span>
              </span>
            </div>

            {/* ---- os melhores, com imagem ---- */}
            {medidos.length > 0 ? (
              <section className="prod-secao" aria-labelledby="prod-melhores-titulo">
                <h2 className="prod-secao-titulo" id="prod-melhores-titulo">
                  Os melhores
                </h2>
                {medidos.slice(0, 4).map((m, i) => (
                  <button
                    key={m.r.id}
                    type="button"
                    className="prod-melhor"
                    data-abrir-registro={m.r.id}
                    onClick={() => aoAbrir(m.r.id)}
                  >
                    <span className="prod-posicao" aria-hidden>
                      {i + 1}
                    </span>
                    {capaDe(m.r) ? (
                      // eslint-disable-next-line @next/next/no-img-element -- capa local
                      <img src={capaDe(m.r) ?? ""} alt="" className="prod-melhor-capa" loading="lazy" />
                    ) : null}
                    <span className="prod-melhor-texto">
                      <span className="prod-melhor-nome">
                        {semTravessao(m.r.titulo) || d.singular}
                      </span>
                      <span className="prod-melhor-sub">{d.rotulo}</span>
                    </span>
                    <span className="prod-melhor-numero">
                      <strong>{milhar(m.heroi.valor)}</strong>
                      <span>{m.heroi.rotulo}</span>
                    </span>
                  </button>
                ))}
              </section>
            ) : null}

            {/* ---- o que esta em edicao ---- */}
            {emEdicao.length > 0 ? (
              <section className="prod-secao" aria-labelledby="prod-em-edicao-titulo">
                <h2 className="prod-secao-titulo" id="prod-em-edicao-titulo">
                  Em edição
                </h2>
                {emEdicao.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="prod-melhor"
                    data-abrir-registro={r.id}
                    onClick={() => aoAbrir(r.id)}
                  >
                    {capaDe(r) ? (
                      // eslint-disable-next-line @next/next/no-img-element -- capa local
                      <img src={capaDe(r) ?? ""} alt="" className="prod-melhor-capa" loading="lazy" />
                    ) : null}
                    <span className="prod-melhor-texto">
                      <span className="prod-melhor-nome">
                        {semTravessao(r.titulo) || "(sem título)"}
                      </span>
                      <span className="prod-melhor-sub">continue de onde parou</span>
                    </span>
                    <span className="prod-situacao" data-situacao={r.situacao}>
                      {ROTULO_DA_SITUACAO[r.situacao]}
                    </span>
                  </button>
                ))}
              </section>
            ) : null}

            <p className="prod-grafico-legenda" title={DESEMPENHO_E_AUTORADO}>
              números autorados da demonstração
            </p>
          </>
        )}
      </div>

      <BarraDeAcao>
        <BotaoDoStudio primaria aoClicar={aoAdicionar} data-acao="adicionar">
          Adicionar
        </BotaoDoStudio>
      </BarraDeAcao>
    </>
  );
}

/**
 * Um registro descartável só para descobrir o RÓTULO da métrica quando não há nenhum
 * publicado (0 plays ainda é «plays»). Não entra em lista nenhuma.
 */
function registroExemplo(pauta: Pauta): Registro {
  return { pauta, id: "exemplo", situacao: "rascunho" } as unknown as Registro;
}
