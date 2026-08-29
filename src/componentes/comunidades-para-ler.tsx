"use client";

import Link from "next/link";
import { useMemo } from "react";
import { capaVigenteDe, nomeGerido } from "@/componentes/comunidade-estado";
import { usePontos } from "@/contexto/pontos";
import { COMUNIDADES, COMUNIDADE_OFICIAL } from "@/dados/comunidade";
import type { ComunidadeDefinida, PublicacaoDefinida } from "@/lib/pontos/tipos";

/**
 * comunidades-para-ler.tsx — a porta da aba Comunidade: escolha uma para ler.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ATÉ 29/08/2026 A ABA ABRIA DIRETO NO FEED DA CASA, e trocar de comunidade era um seletor
 * no topo dele. Funcionava, e escondia o produto: quem chegava via a comunidade do Itaú e
 * precisava descobrir que existiam mais vinte e duas dentro de um menu suspenso.
 *
 * Agora ela abre numa galeria. Cada comunidade é um cartaz com a capa, o nome DENTRO da
 * capa, e quantas publicações ela tem. Escolher uma é entrar nela como integrante: sem
 * lápis, sem publicar, sem apagar. Quem mantém comunidade faz isso no Studio.
 *
 * A CAPA VEM DE ONDE HOUVER, e a ordem é declarada. Primeiro a que o produtor subiu pelo
 * lápis; depois a semeada, que só a comunidade da casa tem; depois a foto da primeira
 * publicação da própria comunidade, que é foto do acervo, com crédito e texto alternativo
 * que o CMS publicou. Sem nenhuma das três, o cartaz fica sem foto e diz o nome do mesmo
 * jeito: cartaz sem foto é honesto, foto inventada não.
 *
 * AS QUE ELE SEGUE VÊM PRIMEIRO, e não misturadas. São duas perguntas diferentes: «para
 * onde eu volto» e «o que existe além». Misturadas, a segunda enterra a primeira.
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface Cartaz {
  comunidade: ComunidadeDefinida;
  nome: string;
  imagem: string;
  imagemAlt: string;
  imagemCredito: string;
  publicacoes: number;
}

function Tijolo({ cartaz }: { cartaz: Cartaz }) {
  const { comunidade, nome, imagem, imagemAlt, publicacoes } = cartaz;
  return (
    <Link
      href={`/studio/comunidade/${comunidade.id}/`}
      className="comunidade-tijolo"
      data-comunidade-cartaz={comunidade.id}
    >
      <span className="comunidade-tijolo-capa">
        {imagem !== "" ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagem local do acervo;
          // `next/image` sob `output: export` exigiria loader e não acrescenta nada aqui.
          <img src={imagem} alt={imagemAlt} loading="lazy" />
        ) : null}
        <span className="comunidade-tijolo-veu" aria-hidden />
        <span className="comunidade-tijolo-texto">
          <strong className="comunidade-tijolo-nome">{nome}</strong>
          <span className="comunidade-tijolo-meta">
            {publicacoes} {publicacoes === 1 ? "publicação" : "publicações"} ·{" "}
            {comunidade.assinantes.toLocaleString("pt-BR")} assinantes
          </span>
        </span>
      </span>
      {cartaz.imagemCredito !== "" ? (
        <span className="comunidade-tijolo-credito">{cartaz.imagemCredito}</span>
      ) : null}
    </Link>
  );
}

export function ComunidadesParaLer() {
  const { motor, hidratado } = usePontos();

  const publicacoes = motor.atual.publicacoes;

  const cartazes = useMemo(() => {
    /** A primeira publicação de cada comunidade, para servir de capa quando não houver. */
    const primeira = new Map<string, PublicacaoDefinida>();
    for (const p of publicacoes) if (!primeira.has(p.comunidadeId)) primeira.set(p.comunidadeId, p);

    const quantas = new Map<string, number>();
    for (const p of publicacoes) quantas.set(p.comunidadeId, (quantas.get(p.comunidadeId) ?? 0) + 1);

    return COMUNIDADES.map((c): Cartaz => {
      const propria = capaVigenteDe(c.id);
      const doFeed = primeira.get(c.id);
      return {
        comunidade: c,
        nome: nomeGerido(c.id) ?? c.nome,
        imagem: propria?.imagem ?? doFeed?.imagem ?? "",
        imagemAlt: propria?.alt ?? doFeed?.imagemAlt ?? "",
        imagemCredito: propria?.credito ?? doFeed?.imagemCredito ?? "",
        publicacoes: quantas.get(c.id) ?? 0,
      };
    });
  }, [publicacoes]);

  // Antes de hidratar vale o que o HTML do build traz: a casa, que toda persona assina.
  const seguidas = hidratado ? motor.atual.assinadas : [COMUNIDADE_OFICIAL];
  const minhas = cartazes.filter((c) => seguidas.includes(c.comunidade.id));
  const outras = cartazes.filter((c) => !seguidas.includes(c.comunidade.id));

  return (
    <div className="prod-corpo" data-comunidades-para-ler>
      <section className="prod-secao">
        <h2 className="prod-secao-titulo">Suas comunidades</h2>
        <div className="comunidade-galeria" data-galeria="minhas">
          {minhas.map((c) => (
            <Tijolo key={c.comunidade.id} cartaz={c} />
          ))}
        </div>
      </section>

      {outras.length > 0 ? (
        <section className="prod-secao">
          <h2 className="prod-secao-titulo">Para conhecer</h2>
          <div className="comunidade-galeria" data-galeria="outras">
            {outras.map((c) => (
              <Tijolo key={c.comunidade.id} cartaz={c} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
