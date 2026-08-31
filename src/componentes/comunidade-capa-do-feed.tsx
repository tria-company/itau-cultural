"use client";

import { capaVigenteDe, nomeGerido } from "@/componentes/comunidade-estado";
import { usePontos } from "@/contexto/pontos";
import { comunidadePorId } from "@/dados/comunidade";
import { HEROIS } from "@/dados/heroi";

/**
 * comunidade-capa-do-feed.tsx — a capa do topo da aba Comunidade.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A CAPA DIZ DE QUEM É O QUE ESTÁ EMBAIXO (pedido de 31/08/2026). O feed mistura o que
 * várias comunidades publicaram, então pôr a foto de UMA delas ali em cima seria a tela
 * dizendo que tudo aquilo é da Brô MC's. A capa padrão é do app, e a de uma comunidade só
 * aparece quando a tela é de uma comunidade só: filtrada no menu, ou aberta por dentro.
 *
 * A FOTO PADRÃO VEM DE `HEROIS`, o acervo curado que a abertura de Descobrir já usa, com
 * `alt` e crédito conferidos contra o disco por portão. Não é a capa semeada da comunidade
 * da casa: aquela é de uma comunidade, e esta precisa não ser de nenhuma.
 *
 * A ESCOLHIDA É A PAREDE DE CARTAZES do Auditório Ibirapuera, e a razão é o que ela mostra:
 * muitas coisas ao mesmo tempo, de muita gente, que é exatamente o que um feed misturado é.
 * Buscada pelo arquivo e não por índice, com a primeira como reserva declarada.
 *
 * E QUANDO A CAPA É DE UMA COMUNIDADE, a foto vem de onde houver, na mesma ordem que a
 * galeria já usa: a que o produtor subiu pelo lápis, a semeada — que só a casa tem —, e a
 * foto da primeira publicação da própria comunidade. Sem a terceira, filtrar o feed numa das
 * vinte e duas abria uma capa sem foto nenhuma (medido, 31/08/2026).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ARQUIVO_PADRAO = "ed71328d4eadd832.jpeg";

function heroiDoApp() {
  return HEROIS.find((h) => h.arquivo === ARQUIVO_PADRAO) ?? HEROIS[0];
}

export function CapaDoFeed({
  /** A comunidade em foco, quando há uma só. `null` = a capa do app. */
  comunidadeId,
  /** O que contar embaixo do nome quando a capa é do app. */
  publicacoes,
  comunidades,
}: {
  comunidadeId: string | null;
  publicacoes: number;
  comunidades: number;
}) {
  const { motor } = usePontos();
  const comunidade = comunidadeId ? comunidadePorId(comunidadeId) : undefined;
  const propria = comunidadeId ? capaVigenteDe(comunidadeId) : null;
  const doFeed = comunidadeId
    ? motor.atual.publicacoes.find((p) => p.comunidadeId === comunidadeId)
    : undefined;
  const heroi = heroiDoApp();

  const uma = comunidade !== undefined;
  const imagem = uma
    ? (propria?.imagem ?? doFeed?.imagem ?? "")
    : `/acervo/${heroi.arquivo}`;
  const alt = uma ? (propria?.alt ?? doFeed?.imagemAlt ?? "") : heroi.alt;
  const credito = uma ? (propria?.credito ?? doFeed?.imagemCredito ?? "") : heroi.credito;
  const nome = uma ? (nomeGerido(comunidade.id) ?? comunidade.nome) : "Comunidades";

  return (
    <section className="prod-comunidade-capa" data-capa-do-feed={comunidadeId ?? "app"}>
      {imagem !== "" ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagem local do acervo;
        // `next/image` sob `output: export` exigiria loader e não acrescenta nada aqui.
        <img src={imagem} alt={alt} className="prod-comunidade-capa-foto" data-capa-foto />
      ) : null}
      <span className="prod-comunidade-capa-veu" aria-hidden />

      <div className="prod-comunidade-capa-texto">
        <p className="prod-hero-kicker">{uma ? "Comunidade" : "Itaú Cultural"}</p>
        <h1 className="prod-comunidade-capa-titulo" data-nome-da-capa>
          {nome}
        </h1>
        {uma ? (
          <p className="prod-comunidade-capa-linha">{comunidade.descricao}</p>
        ) : null}

        <div className="prod-hero-stats">
          {uma ? (
            <span className="prod-stat">
              <strong>{comunidade.assinantes.toLocaleString("pt-BR")}</strong>
              <span>pessoas</span>
            </span>
          ) : (
            <span className="prod-stat">
              <strong>{comunidades}</strong>
              <span>{comunidades === 1 ? "comunidade" : "comunidades"}</span>
            </span>
          )}
          <span className="prod-stat">
            <strong>{publicacoes}</strong>
            <span>{publicacoes === 1 ? "publicação" : "publicações"}</span>
          </span>
        </div>
      </div>

      {credito !== "" ? (
        <span className="prod-comunidade-capa-credito">{credito}</span>
      ) : null}
    </section>
  );
}
