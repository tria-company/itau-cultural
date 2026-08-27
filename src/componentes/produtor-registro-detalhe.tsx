"use client";

import { useMemo } from "react";
import { BarraDeAcao, BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { GraficoDaSerie } from "@/componentes/base/grafico-da-serie";
import {
  DESEMPENHO_E_AUTORADO,
  comentariosDe,
  desempenhoDe,
  minutosLegiveis,
  variacaoSemanal,
} from "@/dados/desempenho-produtor";
import { DESCRICAO_DA_PAUTA, emReais, minutosEntre, semTravessao } from "@/dados/tipos-produtor";
import type { Registro } from "@/dados/tipos-produtor";

/**
 * produtor-registro-detalhe.tsx, a tela de UM registro publicado: como ele vai.
 *
 * ABRIR O QUE ESTÁ NO AR NÃO É ABRIR UM FORMULÁRIO. A revisão a olho (2026-08-26) pediu:
 * quem toca num evento publicado quer ver a capa, os números, o faturamento, o que o
 * público comenta, e só então decidir se edita. A ficha em etapas continua sendo o único
 * caminho de escrita, atrás do botão Editar.
 *
 * TUDO AQUI É AUTORADO E DETERMINÍSTICO, como o resto do desempenho: não há usuários nem
 * servidor neste protótipo. Comentários, interações e fotos saem do id do registro, sempre
 * iguais entre dois carregamentos, e a nota do rodapé declara isso.
 */

export interface ImagemDoDetalhe {
  caminho: string;
  credito: string;
  alt: string;
  de: string;
}

/** A soma ponderada dos caracteres do id, a mesma semente do resto do desempenho. */
function somaDe(texto: string): number {
  let soma = 0;
  for (let i = 0; i < texto.length; i += 1) soma += texto.charCodeAt(i) * (i + 1);
  return soma;
}

function iniciaisDoNome(nome: string): string {
  const partes = nome.split(/\s+/).filter((p) => p.length > 0);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function RegistroDetalhe({
  registro,
  dataDeReferencia,
  imagens,
  aoVoltar,
  aoEditar,
}: {
  registro: Registro;
  dataDeReferencia: string;
  imagens: ImagemDoDetalhe[];
  aoVoltar: () => void;
  aoEditar: () => void;
}) {
  const d = DESCRICAO_DA_PAUTA[registro.pauta];
  const numeros = useMemo(
    () => desempenhoDe(registro, dataDeReferencia),
    [registro, dataDeReferencia],
  );
  const soma = somaDe(registro.id);

  const heroi =
    numeros.familia === "evento"
      ? { valor: numeros.ingressos, rotulo: "ingressos" }
      : numeros.familia === "audiovisual"
        ? { valor: numeros.plays, rotulo: "plays" }
        : numeros.familia === "leitura"
          ? { valor: numeros.leituras, rotulo: "leituras" }
          : { valor: numeros.vistas, rotulo: "visualizações" };
  const delta = variacaoSemanal(numeros.serie);

  // Interações derivadas do total, por razão fixa: determinístico sem sorteio nenhum.
  const salvos =
    numeros.familia === "alcance" ? numeros.salvos : Math.round(heroi.valor * 0.09);
  const compartilhados =
    numeros.familia === "alcance"
      ? numeros.compartilhamentos
      : Math.round(heroi.valor * 0.03);

  const comentarios = comentariosDe(registro.id);

  const capa = registro.imagem?.caminho ?? imagens[soma % Math.max(1, imagens.length)]?.caminho ?? null;
  const creditoDaCapa = registro.imagem?.credito ?? null;
  const fotos = Array.from({ length: Math.min(3, imagens.length) }, (_, i) => {
    return imagens[(soma + i) % imagens.length];
  });

  const minutosNoAr = registro.publicadoEm
    ? minutosEntre(`${registro.publicadoEm.slice(0, 10)}T00:00`, `${dataDeReferencia}T00:00`)
    : null;
  const diasNoAr = minutosNoAr === null ? null : Math.floor(minutosNoAr / 1440);
  const quando =
    diasNoAr === null
      ? "no ar"
      : diasNoAr <= 0
        ? "publicado hoje"
        : diasNoAr === 1
          ? "publicado ontem"
          : `publicado há ${diasNoAr} dias`;

  return (
    <>
      <div className="prod-corpo prod-painel" data-registro-detalhe={registro.id}>
        {/* ---- o herói: a capa do registro, como no painel ---- */}
        <header className="prod-hero" data-hero-registro>
          <button
            type="button"
            className="prod-hero-voltar"
            onClick={aoVoltar}
            aria-label={`voltar para ${d.rotulo}`}
            data-voltar-pauta
          >
            ‹ {d.rotulo}
          </button>
          {capa ? (
            // eslint-disable-next-line @next/next/no-img-element -- capa local do acervo
            <img src={capa} alt="" className="prod-hero-foto" />
          ) : null}
          <span className="prod-hero-veu" aria-hidden />
          <p className="prod-hero-kicker">
            {d.rotulo} · {quando}
          </p>
          <h1 className="prod-hero-titulo prod-hero-titulo-registro">
            {semTravessao(registro.titulo) || d.singular}
          </h1>
          {creditoDaCapa ? <p className="prod-hero-sub">Foto: {creditoDaCapa}</p> : null}
          <div className="prod-hero-stats">
            <span className="prod-stat">
              <strong>{heroi.valor}</strong>
              <span>{heroi.rotulo}</span>
            </span>
            <span className="prod-stat">
              <strong>
                {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
              </strong>
              <span>na semana</span>
            </span>
            <span className="prod-stat">
              <strong>{salvos}</strong>
              <span>salvos</span>
            </span>
          </div>
        </header>

        {/* ---- a curva ---- */}
        <section className="prod-secao" aria-labelledby="prod-detalhe-curva">
          <h2 className="prod-secao-titulo" id="prod-detalhe-curva">
            Desempenho
          </h2>
          <GraficoDaSerie serie={numeros.serie} dataDeReferencia={dataDeReferencia} />
        </section>

        {/* ---- os números da pauta, com faturamento quando é evento ---- */}
        <section className="prod-secao" aria-labelledby="prod-detalhe-numeros">
          <h2 className="prod-secao-titulo" id="prod-detalhe-numeros">
            {numeros.familia === "evento" ? "Bilheteria" : "Números"}
          </h2>
          <div className="prod-conta">
            {numeros.familia === "evento" ? (
              <>
                <div className="prod-conta-linha">
                  <span className="prod-conta-rotulo">Receita</span>
                  <span className="prod-conta-valor">
                    {numeros.gratuito
                      ? "evento gratuito"
                      : numeros.receita === null
                        ? "a declarar"
                        : emReais(numeros.receita)}
                  </span>
                </div>
                <div className="prod-conta-linha">
                  <span className="prod-conta-rotulo">Ingressos</span>
                  <span className="prod-conta-valor">{numeros.ingressos}</span>
                </div>
                <div className="prod-conta-linha">
                  <span className="prod-conta-rotulo">Ocupação</span>
                  <span className="prod-conta-valor">{numeros.ocupacao}%</span>
                </div>
                <div className="prod-conta-linha">
                  <span className="prod-conta-rotulo">Próxima sessão</span>
                  <span className="prod-conta-valor">
                    {numeros.vigencia
                      ? "em cartaz, visita livre"
                      : numeros.proximaEmDias === null
                        ? "temporada encerrada"
                        : numeros.proximaEmDias === 0
                          ? "hoje"
                          : `em ${numeros.proximaEmDias} ${numeros.proximaEmDias === 1 ? "dia" : "dias"}`}
                  </span>
                </div>
              </>
            ) : numeros.familia === "audiovisual" ? (
              <>
                <div className="prod-conta-linha">
                  <span className="prod-conta-rotulo">Plays</span>
                  <span className="prod-conta-valor">{numeros.plays}</span>
                </div>
                <div className="prod-conta-linha">
                  <span className="prod-conta-rotulo">Tempo médio assistido</span>
                  <span className="prod-conta-valor">
                    {minutosLegiveis(numeros.tempoMedioMinutos)}
                  </span>
                </div>
                <div className="prod-conta-linha">
                  <span className="prod-conta-rotulo">Assistem até o fim</span>
                  <span className="prod-conta-valor">{numeros.conclusao}%</span>
                </div>
              </>
            ) : numeros.familia === "leitura" ? (
              <>
                <div className="prod-conta-linha">
                  <span className="prod-conta-rotulo">Leituras</span>
                  <span className="prod-conta-valor">{numeros.leituras}</span>
                </div>
                <div className="prod-conta-linha">
                  <span className="prod-conta-rotulo">Tempo médio de leitura</span>
                  <span className="prod-conta-valor">
                    {minutosLegiveis(numeros.tempoMedioMinutos)}
                  </span>
                </div>
                <div className="prod-conta-linha">
                  <span className="prod-conta-rotulo">Leem até o fim</span>
                  <span className="prod-conta-valor">{numeros.ateOFim}%</span>
                </div>
              </>
            ) : (
              <>
                <div className="prod-conta-linha">
                  <span className="prod-conta-rotulo">Visualizações</span>
                  <span className="prod-conta-valor">{numeros.vistas}</span>
                </div>
                <div className="prod-conta-linha">
                  <span className="prod-conta-rotulo">Salvos</span>
                  <span className="prod-conta-valor">{numeros.salvos}</span>
                </div>
                <div className="prod-conta-linha">
                  <span className="prod-conta-rotulo">Compartilhados</span>
                  <span className="prod-conta-valor">{numeros.compartilhamentos}</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ---- interações ---- */}
        <section className="prod-secao" aria-labelledby="prod-detalhe-interacoes">
          <h2 className="prod-secao-titulo" id="prod-detalhe-interacoes">
            Interações
          </h2>
          <div className="prod-inicio-stats">
            <span className="prod-inicio-stat">
              <strong>{salvos}</strong>
              <span>salvos</span>
            </span>
            <span className="prod-inicio-stat">
              <strong>{compartilhados}</strong>
              <span>compartilhados</span>
            </span>
            <span className="prod-inicio-stat">
              <strong>{comentarios.length}</strong>
              <span>comentários</span>
            </span>
          </div>
        </section>

        {/* ---- o que o público comenta ---- */}
        <section className="prod-secao" aria-labelledby="prod-detalhe-comentarios">
          <h2 className="prod-secao-titulo" id="prod-detalhe-comentarios">
            Comentários
          </h2>
          {comentarios.map((c) => (
            <div className="prod-comentario" key={`${c.nome}-${c.haDias}`}>
              <span className="prod-comentario-avatar" aria-hidden>
                {iniciaisDoNome(c.nome)}
              </span>
              <span className="prod-comentario-texto">
                <span className="prod-comentario-meta">
                  {c.nome} · há {c.haDias} {c.haDias === 1 ? "dia" : "dias"}
                </span>
                {c.texto}
              </span>
            </div>
          ))}
        </section>

        {/* ---- fotos ---- */}
        {fotos.length > 0 ? (
          <section className="prod-secao" aria-labelledby="prod-detalhe-fotos">
            <h2 className="prod-secao-titulo" id="prod-detalhe-fotos">
              Fotos
            </h2>
            <div className="prod-detalhe-fotos">
              {fotos.map((f) => (
                <span className="prod-detalhe-foto" key={f.caminho}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- foto local */}
                  <img src={f.caminho} alt={f.alt} loading="lazy" />
                  <span className="prod-atalho-credito">{f.credito}</span>
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <p className="prod-grafico-legenda" title={DESEMPENHO_E_AUTORADO}>
          números, comentários e interações autorados da demonstração
        </p>
      </div>

      <BarraDeAcao>
        <BotaoDoStudio curto aoClicar={aoVoltar}>
          Voltar
        </BotaoDoStudio>
        <BotaoDoStudio primaria aoClicar={aoEditar} data-acao="editar">
          Editar
        </BotaoDoStudio>
      </BarraDeAcao>
    </>
  );
}
