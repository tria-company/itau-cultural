"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarraDeAcao, BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import {
  BarrasVerticais,
  LegendaDaRosca,
  Medidor,
  Rosca,
} from "@/componentes/base/graficos";
import type { FatiaDaRosca } from "@/componentes/base/graficos";
import { Folha } from "@/componentes/base/folha";
import {
  DESEMPENHO_E_AUTORADO,
  desempenhoDe,
  heroiDe,
  metricasDe,
  milhar,
} from "@/dados/desempenho-produtor";
import { DESCRICAO_DA_PAUTA, semTravessao } from "@/dados/tipos-produtor";
import { ROTULO_DA_SITUACAO } from "@/dados/tipos-acesso";
import type { Pauta, Registro, Situacao } from "@/dados/tipos-produtor";

/**
 * produtor-pauta-inicio.tsx, o painel de uma pauta: o que se vê antes de editar.
 *
 * A ROTA DA PAUTA NÃO ABRE MAIS NUMA FICHA. Quem chega quer saber COMO A CATEGORIA VAI, e
 * cada linha publicada agora responde com AS MÉTRICAS DELA (pedido de 2026-08-27): plays,
 * tempo médio e conclusão para vídeo; ingressos, receita e ocupação para evento. No app,
 * onde 370px não comportam quatro colunas, fica o número principal; a web mostra tudo.
 *
 * O PLAY TEM GESTÃO PRÓPRIA (`extras`): os vídeos se agrupam em TRILHAS (a série de cada
 * um), qualquer vídeo entra numa playlist por um toque, e uma playlist nova nasce daqui,
 * SEM passar pela ficha e sem publicar nada: ela é um rascunho como outro qualquer, e
 * publicar continua sendo decisão para depois.
 *
 * OS NÚMEROS SÃO OS DE `desempenho-produtor.ts`, autorados e determinísticos, declarados
 * na nota do rodapé; a mesma fonte da tela do registro, para as duas nunca discordarem.
 */

export interface ImagemDoAcervo {
  caminho: string;
  credito: string;
  alt: string;
  de: string;
}

/**
 * O PANORAMA DE UMA PAUTA: os números que só ela tem, e a forma de mostrá-los.
 *
 * O painel genérico responde «quantos no ar, quanto de audiência, quantos em edição», e
 * para Play ou Eventos isso basta. Para as pautas de INSUMO não basta: espaço e ativo não
 * têm vitrine nem audiência, então dois dos três números abriam zerados e a tela dizia
 * nada. O que essas pautas têm de verdade é o ACERVO medido, e era justamente ele que
 * morava na parede da Organização empilhada embaixo (mudou de endereço em 2026-08-27).
 *
 * Tudo é opcional: as pautas que não passam panorama renderizam exatamente como antes.
 */
export interface PanoramaDaPauta {
  /** Os três números do topo, quando o trio genérico não serve. */
  numeros?: { valor: string; rotulo: string }[];
  /** Uma linha de cartões de gráfico, na grade de doze colunas do painel do Início. */
  cartoes?: CartaoDoPanorama[];
  /** Os registros agrupados por algo que a pauta sabe (a UF do espaço, o estado do edital). */
  grupos?: { nome: string; registros: Registro[] }[];
  tituloDosGrupos?: string;
  /** A legenda de cada linha, no lugar do «continue de onde parou» genérico. */
  subDe?: (r: Registro) => string | null;
  /** UMA linha sobre o recorte. Uma, e não um parágrafo. */
  frase?: string;
  /**
   * O que o cabeçalho conta, quando «no ar» não é a pergunta.
   *
   * Mídia e espaço não têm vitrine: o cabeçalho dizia «0 no ar» ao lado de «529 ativos
   * no acervo», e as duas frases pareciam se contradizer.
   */
  contagem?: string;
}

/** Um cartão do panorama: um gráfico e o título dele. */
export interface CartaoDoPanorama {
  titulo: string;
  /** Quantas das doze colunas ele ocupa na web. No aparelho todos ocupam a largura. */
  largura: 4 | 6 | 8 | 12;
  barras?: { rotulo: string; valor: number }[];
  medidor?: { porcento: number; rotulo: string };
  rosca?: { fatias: FatiaDaRosca[]; centroValor: string; centroRotulo: string };
  nota?: string;
}

/** O que a gestão do Play acrescenta ao painel da pauta. */
export interface ExtrasDoInicio {
  /** O nome da trilha de um registro; `null` tira o registro do agrupamento. */
  trilhaDe: (r: Registro) => string | null;
  playlists: { id: string; titulo: string; itens: number; situacao: Situacao }[];
  aoNovaPlaylist: (nome: string) => void;
  aoAdicionarAPlaylist: (playlistId: string, videoId: string) => void;
}

export function PautaInicio({
  pauta,
  registros,
  dataDeReferencia,
  imagens,
  aoAdicionar,
  aoAbrir,
  extras,
  panorama,
}: {
  pauta: Pauta;
  registros: Registro[];
  dataDeReferencia: string;
  imagens: ImagemDoAcervo[];
  aoAdicionar: () => void;
  aoAbrir: (id: string) => void;
  extras?: ExtrasDoInicio;
  panorama?: PanoramaDaPauta;
}) {
  const d = DESCRICAO_DA_PAUTA[pauta];
  const [movendo, setMovendo] = useState<string | null>(null);
  const [nomeDaPlaylist, setNomeDaPlaylist] = useState("");

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
      publicados.map((r) => {
        const desempenho = desempenhoDe(r, dataDeReferencia);
        return { r, desempenho, heroi: heroiDe(desempenho), metricas: metricasDe(desempenho) };
      }),
    [publicados, dataDeReferencia],
  );
  const ordenados = useMemo(
    () => [...medidos].sort((a, b) => b.heroi.valor - a.heroi.valor),
    [medidos],
  );

  const total = medidos.reduce((n, m) => n + m.heroi.valor, 0);
  const rotuloDoTotal = medidos[0]?.heroi.rotulo ?? "visualizações";

  const capaDe = (r: Registro): string | null =>
    r.imagem?.caminho ?? imagens[0]?.caminho ?? null;

  // As trilhas do Play: os registros agrupados pelo nome que `trilhaDe` responde.
  const trilhas = useMemo(() => {
    if (!extras) return null;
    const mapa = new Map<string, Registro[]>();
    for (const r of registros) {
      const nome = extras.trilhaDe(r);
      if (nome === null) continue;
      const lista = mapa.get(nome) ?? [];
      lista.push(r);
      mapa.set(nome, lista);
    }
    return [...mapa.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [extras, registros]);

  const medidaDe = (id: string) => medidos.find((m) => m.r.id === id);

  function LinhaDeRegistro({ r, posicao }: { r: Registro; posicao?: number }) {
    const medida = medidaDe(r.id);
    return (
      <div className="prod-melhor prod-melhor-linha" data-registro-da-pauta={r.id}>
        {posicao !== undefined ? (
          <span className="prod-posicao" aria-hidden>
            {posicao}
          </span>
        ) : null}
        <button
          type="button"
          className="prod-melhor prod-melhor-toque"
          data-abrir-registro={r.id}
          onClick={() => aoAbrir(r.id)}
        >
          {capaDe(r) ? (
            // eslint-disable-next-line @next/next/no-img-element -- capa local
            <img src={capaDe(r) ?? ""} alt="" className="prod-melhor-capa" loading="lazy" />
          ) : null}
          <span className="prod-melhor-texto">
            <span className="prod-melhor-nome">{semTravessao(r.titulo) || d.singular}</span>
            <span className="prod-melhor-sub">
              {panorama?.subDe?.(r) ??
                (r.situacao === "publicado" ? d.rotulo : "continue de onde parou")}
            </span>
          </span>
          {medida ? (
            <span className="prod-melhor-metricas">
              {medida.metricas.map((m) => (
                <span className="prod-metrica" key={m.rotulo} data-extra={m.extra ? "sim" : "nao"}>
                  <strong>{m.valor}</strong>
                  <span>{m.rotulo}</span>
                </span>
              ))}
            </span>
          ) : (
            <span className="prod-situacao" data-situacao={r.situacao}>
              {ROTULO_DA_SITUACAO[r.situacao]}
            </span>
          )}
        </button>
        {extras && extras.trilhaDe(r) !== null ? (
          <button
            type="button"
            className="prod-botao"
            data-porte="curto"
            onClick={() => setMovendo(r.id)}
            data-mover-para-playlist={r.id}
            title="adicionar a uma playlist"
          >
            + playlist
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <header className="prod-cabecalho">
        <div className="prod-cabecalho-linha">
          <Link href="/studio/" className="prod-superficie prod-voltar" data-voltar-studio>
            <span className="prod-voltar-texto">‹ Studio</span>
            <span className="prod-voltar-x" aria-hidden>
              ✕
            </span>
          </Link>
          <span className="prod-contagem">
            {panorama?.contagem ?? `${publicados.length} no ar`}
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
              {(panorama?.numeros ?? [
                { valor: String(publicados.length), rotulo: "no ar" },
                { valor: milhar(total), rotulo: rotuloDoTotal },
                { valor: String(emEdicao.length), rotulo: "em edição" },
              ]).map((num) => (
                <span className="prod-inicio-stat" key={num.rotulo}>
                  <strong>{num.valor}</strong>
                  <span>{num.rotulo}</span>
                </span>
              ))}
            </div>

            {panorama?.frase ? (
              <p className="prod-campo-nota" data-frase-do-panorama>
                {semTravessao(panorama.frase)}
              </p>
            ) : null}

            {/* ---- os graficos que so esta pauta tem ---- */}
            {panorama?.cartoes && panorama.cartoes.length > 0 ? (
              <div className="prod-grade-dash" data-panorama-da-pauta>
                {panorama.cartoes.map((c) => (
                  <section
                    className="prod-cartao-dash"
                    key={c.titulo}
                    data-largura={String(c.largura)}
                  >
                    <div className="prod-cartao-dash-topo">
                      <h2 className="prod-cartao-dash-titulo">{c.titulo}</h2>
                    </div>
                    {c.rosca ? (
                      <div className="prod-cartao-dash-rosca">
                        <Rosca
                          fatias={c.rosca.fatias}
                          centroValor={c.rosca.centroValor}
                          centroRotulo={c.rosca.centroRotulo}
                        />
                        <LegendaDaRosca fatias={c.rosca.fatias} />
                      </div>
                    ) : null}
                    {c.barras ? <BarrasVerticais barras={c.barras} /> : null}
                    {c.medidor ? (
                      <div className="prod-medidores">
                        <Medidor porcento={c.medidor.porcento} rotulo={c.medidor.rotulo} />
                      </div>
                    ) : null}
                    {c.nota ? (
                      <p className="prod-cartao-dash-nota">{semTravessao(c.nota)}</p>
                    ) : null}
                  </section>
                ))}
              </div>
            ) : null}

            {/* ---- os melhores, com as metricas de cada um ---- */}
            {ordenados.length > 0 ? (
              <section className="prod-secao" aria-labelledby="prod-melhores-titulo">
                <h2 className="prod-secao-titulo" id="prod-melhores-titulo">
                  Os melhores
                </h2>
                {ordenados.slice(0, 4).map((m, i) => (
                  <LinhaDeRegistro key={m.r.id} r={m.r} posicao={i + 1} />
                ))}
              </section>
            ) : null}

            {/* ---- os grupos que a pauta sabe formar ---- */}
            {panorama?.grupos && panorama.grupos.length > 0 ? (
              <section className="prod-secao" aria-labelledby="prod-grupos-titulo">
                <h2 className="prod-secao-titulo" id="prod-grupos-titulo">
                  {panorama.tituloDosGrupos ?? "Em edição"}
                </h2>
                {panorama.grupos.map((g) => (
                  <div className="prod-trilha-grupo" key={g.nome} data-grupo={g.nome}>
                    <p className="prod-trilha-nome">
                      {g.nome}
                      <span className="prod-trilha-conta">
                        {g.registros.length} {g.registros.length === 1 ? "item" : "itens"}
                      </span>
                    </p>
                    {g.registros.map((r) => (
                      <LinhaDeRegistro key={r.id} r={r} />
                    ))}
                  </div>
                ))}
              </section>
            ) : null}

            {/* ---- as trilhas do Play ---- */}
            {trilhas && trilhas.length > 0 ? (
              <section className="prod-secao" aria-labelledby="prod-trilhas-titulo">
                <h2 className="prod-secao-titulo" id="prod-trilhas-titulo">
                  Trilhas
                </h2>
                <p className="prod-campo-nota">
                  Os vídeos, agrupados pela série que cada um declara.
                </p>
                {trilhas.map(([nome, itens]) => (
                  <div className="prod-trilha-grupo" key={nome} data-trilha={nome}>
                    <p className="prod-trilha-nome">
                      {nome}
                      <span className="prod-trilha-conta">
                        {itens.length} {itens.length === 1 ? "vídeo" : "vídeos"}
                      </span>
                    </p>
                    {itens.map((r) => (
                      <LinhaDeRegistro key={r.id} r={r} />
                    ))}
                  </div>
                ))}
              </section>
            ) : null}

            {/* ---- as playlists ---- */}
            {extras ? (
              <section className="prod-secao" aria-labelledby="prod-playlists-titulo">
                <h2 className="prod-secao-titulo" id="prod-playlists-titulo">
                  Playlists
                </h2>
                {extras.playlists.length === 0 ? (
                  <p className="prod-campo-nota">Nenhuma playlist ainda.</p>
                ) : (
                  extras.playlists.map((pl) => (
                    <button
                      key={pl.id}
                      type="button"
                      className="prod-melhor"
                      data-abrir-registro={pl.id}
                      onClick={() => aoAbrir(pl.id)}
                    >
                      <span className="prod-melhor-texto">
                        <span className="prod-melhor-nome">
                          {semTravessao(pl.titulo) || "(sem título)"}
                        </span>
                        <span className="prod-melhor-sub">
                          {pl.itens} {pl.itens === 1 ? "item" : "itens"}
                        </span>
                      </span>
                      <span className="prod-situacao" data-situacao={pl.situacao}>
                        {ROTULO_DA_SITUACAO[pl.situacao]}
                      </span>
                    </button>
                  ))
                )}

                {/* A PLAYLIST NASCE AQUI, sem ficha e sem publicar: e um rascunho como
                    outro qualquer, e publicar e decisao para depois. */}
                <div className="prod-nova-playlist">
                  <input
                    type="text"
                    value={nomeDaPlaylist}
                    onChange={(e) => setNomeDaPlaylist(e.target.value)}
                    placeholder="nome da playlist nova"
                    className="prod-campo-entrada"
                    data-nome-da-playlist
                  />
                  <BotaoDoStudio
                    curto
                    desabilitado={nomeDaPlaylist.trim() === ""}
                    porQueDesabilitado="Uma playlist precisa de nome."
                    aoClicar={() => {
                      extras.aoNovaPlaylist(nomeDaPlaylist.trim());
                      setNomeDaPlaylist("");
                    }}
                    data-acao="criar-playlist"
                  >
                    Criar playlist
                  </BotaoDoStudio>
                </div>
              </section>
            ) : null}

            {/* ---- o que esta em edicao ---- */}
            {emEdicao.length > 0 && !trilhas && !panorama?.grupos ? (
              <section className="prod-secao" aria-labelledby="prod-em-edicao-titulo">
                <h2 className="prod-secao-titulo" id="prod-em-edicao-titulo">
                  Em edição
                </h2>
                {emEdicao.map((r) => (
                  <LinhaDeRegistro key={r.id} r={r} />
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

      {/* ---- mover para uma playlist ---- */}
      {extras ? (
        <Folha
          aberta={movendo !== null}
          titulo="Adicionar à playlist"
          descricao="O vídeo entra no fim da playlist escolhida."
          aoFechar={() => setMovendo(null)}
        >
          {extras.playlists.length === 0 ? (
            <p className="prod-nota">
              Nenhuma playlist ainda. Crie uma na seção Playlists, ali embaixo.
            </p>
          ) : (
            extras.playlists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                className="prod-melhor"
                data-escolher-playlist={pl.id}
                onClick={() => {
                  if (movendo) extras.aoAdicionarAPlaylist(pl.id, movendo);
                  setMovendo(null);
                }}
              >
                <span className="prod-melhor-texto">
                  <span className="prod-melhor-nome">
                    {semTravessao(pl.titulo) || "(sem título)"}
                  </span>
                  <span className="prod-melhor-sub">
                    {pl.itens} {pl.itens === 1 ? "item" : "itens"}
                  </span>
                </span>
                <span aria-hidden>▸</span>
              </button>
            ))
          )}
        </Folha>
      ) : null}
    </>
  );
}
