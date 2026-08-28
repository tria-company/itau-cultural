"use client";

import Link from "next/link";
import { sementeDoPerfil, useComunidadeGerida } from "@/componentes/comunidade-estado";

/**
 * comunidade-capa.tsx — a foto grande com o nome da comunidade dentro.
 *
 * É a abertura da comunidade, no mesmo gesto do herói de Descobrir: a foto ocupa o topo,
 * um véu escuro sobe do pé para o texto ter contraste, e o nome vive dentro da imagem.
 *
 * O QUE ELA MOSTRA É O VIGENTE, não o semeado: se o produtor trocou o nome ou a capa na
 * gestão, é o dele que aparece aqui, no cartão de cada publicação e nas guardadas. Antes
 * de o armazém hidratar, vale a semente — que é exatamente o que o HTML do build traz, e
 * é por isso que a hidratação não diverge.
 *
 * A foto entra como `<img>` e não como `background-image` porque aqui existe UMA imagem,
 * e ela é conteúdo: leva `alt` e leva crédito. O herói de Descobrir usa fundo pelo motivo
 * oposto, oito slides dos quais sete estão escondidos e não devem ser baixados.
 */
export function CapaDaComunidade({
  comunidadeId,
  nome,
  descricao,
  hoje,
  publicacoes,
  assinantes,
  /** A gestão só existe para a comunidade da casa: as outras são de gente real. */
  gerenciavel = false,
}: {
  comunidadeId: string;
  nome: string;
  descricao: string;
  hoje: string;
  publicacoes: number;
  assinantes: number;
  gerenciavel?: boolean;
}) {
  const semente = sementeDoPerfil(comunidadeId, nome, descricao);
  const { vigente } = useComunidadeGerida(comunidadeId, semente, hoje);

  return (
    <section className="prod-comunidade-capa" data-capa-da-comunidade={comunidadeId}>
      {vigente.imagem !== "" ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagem local ou data:;
        // `next/image` sob `output: export` exigiria loader e não acrescenta nada aqui.
        <img
          src={vigente.imagem}
          alt={vigente.imagemAlt}
          className="prod-comunidade-capa-foto"
          data-capa-foto
        />
      ) : null}
      <span className="prod-comunidade-capa-veu" aria-hidden />

      <div className="prod-comunidade-capa-texto">
        <p className="prod-hero-kicker">Comunidade</p>
        <h1 className="prod-comunidade-capa-titulo" data-nome-da-comunidade>
          {vigente.nome}
        </h1>
        {vigente.chamada !== "" ? (
          <p className="prod-comunidade-capa-linha">{vigente.chamada}</p>
        ) : null}

        <div className="prod-hero-stats">
          <span className="prod-stat">
            <strong>{assinantes.toLocaleString("pt-BR")}</strong>
            <span>assinantes</span>
          </span>
          <span className="prod-stat">
            <strong>{publicacoes}</strong>
            <span>publicações</span>
          </span>
        </div>

        {gerenciavel ? (
          <div className="prod-comunidade-capa-acoes">
            <Link
              href="/studio/comunidade/gerenciar/"
              className="prod-botao"
              data-porte="curto"
              data-gerenciar-comunidade
            >
              Gerenciar
            </Link>
          </div>
        ) : null}
      </div>

      {vigente.imagemCredito !== "" ? (
        <span className="prod-comunidade-capa-credito">{vigente.imagemCredito}</span>
      ) : null}
    </section>
  );
}
