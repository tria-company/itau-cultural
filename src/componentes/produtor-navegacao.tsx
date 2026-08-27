"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ICONE_COMUNIDADE,
  ICONE_LOJA,
  ICONE_STUDIO_HOME,
} from "@/componentes/base/icones";
import { CriarDaLateral } from "@/componentes/criar-da-lateral";
import type { ImagemDaCriacao } from "@/componentes/folha-de-criacao";
import { DESCRICAO_DA_PAUTA, PAUTAS } from "@/dados/tipos-produtor";
import type { Pauta } from "@/dados/tipos-produtor";

/**
 * produtor-navegacao.tsx, a coluna lateral do Studio na visão web.
 *
 * ELA É A CASCA DA WEB, e existe em TODAS as telas, raiz incluída. A versão anterior era
 * um trilho de pastilhas que sumia na raiz («o painel é a navegação»), e a revisão a olho
 * reprovou o resultado: numa janela de 1600px a raiz virava uma coluna estreita boiando
 * num vazio, com a barra do app caída no rodapé como uma tira solta. Numa janela de
 * desktop, quem organiza a tela é a coluna: marca em cima, o Criar como ação primária, e
 * os três grupos que o Studio tem — as telas de topo, as pautas, a gestão.
 *
 * NO APP ELA NÃO EXISTE, por CSS (`[data-view="mobile"] .prod-trilho-pautas`): lá o
 * painel é a navegação e a barra flutuante leva a Início, Comunidade e Loja. O portão
 * mede as duas metades: coluna visível na web com o Criar à vista, invisível no app.
 *
 * A TELA ATIVA CONTINUA SENDO UM LINK, com `aria-current="page"`: virar texto morto
 * custaria a única forma de recarregar a tela em que se está, e no artefato estático
 * recarregar é o gesto que desfaz estado de cliente que tenha ficado estranho.
 *
 * A PAUTA SEM FICHA APARECE, DESABILITADA: link para rota inexistente daria 404 no meio
 * da demonstração, e o item apagado mostra o tamanho real da superfície.
 */

interface ItemDeTopo {
  href: string;
  rotulo: string;
  icone: React.ReactNode;
}

const TELAS_DE_TOPO: ItemDeTopo[] = [
  { href: "/studio", rotulo: "Início", icone: ICONE_STUDIO_HOME },
  { href: "/studio/comunidade", rotulo: "Comunidade", icone: ICONE_COMUNIDADE },
  { href: "/studio/pontos", rotulo: "Loja de pontos", icone: ICONE_LOJA },
];

const GESTAO = [
  {
    id: "ocorrencias",
    rota: "/studio/ocorrencias/",
    rotulo: "Sessões",
    objetivo: "O que muda depois de publicar: horário, esgotado, cancelamento.",
  },
  {
    id: "catalogos",
    rota: "/studio/catalogos/",
    rotulo: "Catálogos",
    objetivo: "Tudo o que é lista de escolha nas fichas.",
  },
  {
    id: "perfil",
    rota: "/studio/perfil/",
    rotulo: "Perfil",
    objetivo: "Seus dados pessoais e o estado da conta.",
  },
] as const;

export function ProdutorNavegacao({
  prontas,
  imagens,
}: {
  prontas: readonly string[];
  imagens: ImagemDaCriacao[];
}) {
  // Sem a barra final: `trailingSlash: true` faz o pathname canônico vir como `/studio/`,
  // e a comparação exata contra hrefs sem barra nunca acenderia.
  const caminho = (usePathname() ?? "").replace(/\/$/, "");
  const conjunto = new Set(prontas);

  const dentroDe = (rota: string) => {
    const semBarra = rota.replace(/\/$/, "");
    return caminho === semBarra || caminho.startsWith(`${semBarra}/`);
  };

  return (
    <nav className="prod-trilho prod-trilho-pautas" aria-label="a navegação do Studio">
      {/* ---- a marca ---- */}
      <Link href="/studio/" className="prod-lateral-marca">
        <span className="prod-lateral-kicker">Studio</span>
        <span className="prod-lateral-casa">Itaú Cultural</span>
      </Link>

      {/* ---- a ação primária da coluna ---- */}
      <CriarDaLateral pautasComFicha={prontas as readonly Pauta[]} imagens={imagens} />

      {/* ---- as telas de topo ---- */}
      <ul className="prod-lateral-grupo">
        {TELAS_DE_TOPO.map((t) => {
          const ativa = caminho === t.href;
          return (
            <li key={t.href}>
              <Link
                href={`${t.href}/`}
                className="prod-pauta prod-lateral-item"
                data-lateral={t.rotulo.toLowerCase()}
                data-ativa={ativa ? "sim" : "nao"}
                aria-current={ativa ? "page" : undefined}
              >
                {t.icone}
                {t.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* NA RAIZ A COLUNA ENCOLHE: o painel de início JÁ é a navegação das pautas, com
          os atalhos ilustrados, e a coluna repetir as onze ali seria a mesma escolha
          oferecida duas vezes na mesma tela (pedido de 2026-08-27). Nas telas internas,
          onde o painel não está à vista, a lista completa volta. */}
      {caminho === "/studio" ? null : (
        <>
      {/* ---- as onze pautas ---- */}
      <p className="prod-lateral-rotulo" aria-hidden>
        Publicar
      </p>
      <ul className="prod-lateral-grupo">
        {PAUTAS.map((p) => {
          const d = DESCRICAO_DA_PAUTA[p];
          if (!conjunto.has(p)) {
            return (
              <li key={p}>
                <span
                  className="prod-pauta prod-lateral-item"
                  data-pronta="nao"
                  title={`${d.objetivo}, ficha ainda não construída`}
                >
                  {d.rotulo}
                </span>
              </li>
            );
          }
          const ativa = dentroDe(d.rota);
          return (
            <li key={p}>
              <Link
                href={d.rota}
                className="prod-pauta prod-lateral-item"
                data-pauta={p}
                data-ativa={ativa ? "sim" : "nao"}
                aria-current={ativa ? "page" : undefined}
                title={d.objetivo}
              >
                {d.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* ---- a gestão ---- */}
      <p className="prod-lateral-rotulo" aria-hidden>
        Gerenciar
      </p>
      <ul className="prod-lateral-grupo">
        {GESTAO.map((g) => {
          const ativa = dentroDe(g.rota);
          return (
            <li key={g.rota}>
              <Link
                href={g.rota}
                className="prod-pauta prod-lateral-item"
                data-gestao={g.id}
                data-ativa={ativa ? "sim" : "nao"}
                aria-current={ativa ? "page" : undefined}
                title={g.objetivo}
              >
                {g.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
        </>
      )}
    </nav>
  );
}
