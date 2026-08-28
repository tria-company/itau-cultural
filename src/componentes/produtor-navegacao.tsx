"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ICONE_APPS,
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

/** Um filho do dropdown. `pronta: false` desenha o item apagado, com o motivo no title. */
interface FilhoDaLateral {
  href: string;
  rotulo: string;
  objetivo?: string;
  pronta?: boolean;
}

interface ItemDeTopo {
  href: string;
  rotulo: string;
  icone: React.ReactNode;
  /**
   * As telas irmãs que moram sob esta, num dropdown recuado.
   *
   * A Comunidade e a Carteira vieram do outro ramo em 2026-08-28 com sub-telas, e lá quem
   * dava entrada nelas era o menu lateral do app público. Aqui esse menu não existe: sem
   * estas linhas, «Guardadas», «Comunidades» e a própria vitrine ficariam construídas e
   * inalcançáveis, só por URL digitada.
   */
  filhos?: FilhoDaLateral[];
  /**
   * As ONZE PAUTAS entram aqui, e não como lista solta lá embaixo (pedido de 2026-08-28).
   *
   * Elas são o que o Studio é, e ficavam separadas do item que leva a ele por um grupo
   * inteiro de distância. Como são onze e dependem de quais fichas existem, não cabem numa
   * constante: quem monta a lista é o render, a partir de `prontas`.
   */
  pautas?: boolean;
}

const TELAS_DE_TOPO: ItemDeTopo[] = [
  { href: "/studio", rotulo: "Início", icone: ICONE_STUDIO_HOME },
  { href: "/studio/pautas", rotulo: "Studio", icone: ICONE_APPS, pautas: true },
  {
    href: "/studio/comunidade",
    rotulo: "Comunidade",
    icone: ICONE_COMUNIDADE,
    filhos: [
      { href: "/studio/comunidade/gerenciar", rotulo: "Quem está na comunidade" },
      { href: "/studio/comunidade/marketplace", rotulo: "Comunidades" },
      { href: "/studio/comunidade/guardadas", rotulo: "Guardadas" },
    ],
  },
  {
    // RÓTULO E DESTINO DIZEM A MESMA COISA: «Loja de pontos» abre a vitrine, e a carteira
    // fica logo abaixo. Ver a nota gêmea em produtor-barra.tsx.
    href: "/studio/pontos/loja",
    rotulo: "Loja de pontos",
    icone: ICONE_LOJA,
    filhos: [
      { href: "/studio/pontos", rotulo: "Carteira" },
      { href: "/studio/pontos/gestao", rotulo: "Gestão da loja" },
    ],
  },
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
  {
    // A PORTA DA ORGANIZAÇÃO, aberta em 2026-08-27 com a mudança de endereço das dez
    // telas institucionais. Elas moravam sob /studio/<tela>/, e cinco delas empilhadas
    // embaixo da pauta do Produtor que trata do mesmo assunto. Sem este item, a
    // superfície inteira só se alcançaria por URL digitada.
    id: "organizacao",
    rota: "/studio/organizacao/",
    rotulo: "Organização",
    objetivo: "As dez telas da instituição: ficha, equipe, acervo medido e conformidade.",
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

  /**
   * O DROPDOWN NASCE ABERTO NA SEÇÃO EM QUE SE ESTÁ, e fechado na raiz.
   *
   * Só as seções que a pessoa abriu ou fechou à mão entram neste mapa; o resto segue a
   * regra. Guardar o estado inteiro faria a coluna abrir do jeito que ficou na última
   * visita, e ninguém lembra da última visita.
   */
  const [alternados, setAlternados] = useState<Record<string, boolean>>({});
  const naRaiz = caminho === "/studio";
  const estaAberto = (href: string, daSecao: boolean) =>
    alternados[href] ?? (daSecao || !naRaiz);
  const alternar = (href: string, daSecao: boolean) =>
    setAlternados((antes) => ({ ...antes, [href]: !(antes[href] ?? (daSecao || !naRaiz)) }));

  /** As onze pautas, na forma de filho: as sem ficha entram desabilitadas, e dizem por quê. */
  const filhosDasPautas = PAUTAS.map((p) => {
    const d = DESCRICAO_DA_PAUTA[p];
    return {
      href: d.rota.replace(/\/$/, ""),
      rotulo: d.rotulo,
      objetivo: conjunto.has(p) ? d.objetivo : `${d.objetivo}, ficha ainda não construída`,
      pronta: conjunto.has(p),
    };
  });

  return (
    <nav className="prod-trilho prod-trilho-pautas" aria-label="a navegação do Studio">
      {/* ---- a marca ---- */}
      <Link href="/studio/" className="prod-lateral-marca">
        <span className="prod-lateral-kicker">Studio</span>
        <span className="prod-lateral-casa">Itaú Cultural</span>
      </Link>

      {/* ---- a ação primária da coluna ---- */}
      <CriarDaLateral pautasComFicha={prontas as readonly Pauta[]} imagens={imagens} />

      {/* ---- as telas de topo, cada uma com o seu dropdown ---- */}
      <ul className="prod-lateral-grupo">
        {TELAS_DE_TOPO.map((t) => {
          // O «você está aqui» vale para a seção inteira, e não só para a rota exata: em
          // /studio/comunidade/guardadas/ a lateral apagava tudo e a pessoa perdia a
          // referência. Início fica de fora porque `/studio` prefixa todas as outras.
          const secao = t.href === "/studio/pontos/loja" ? "/studio/pontos" : t.href;
          const daSecao = secao !== "/studio" && caminho.startsWith(`${secao}/`);
          const ativa = caminho === t.href || daSecao;
          const filhos: FilhoDaLateral[] = t.pautas ? filhosDasPautas : (t.filhos ?? []);
          const temFilhos = filhos.length > 0;
          const aberto = temFilhos && estaAberto(t.href, daSecao);

          return (
            <li key={t.href}>
              <div className="prod-lateral-linha">
                <Link
                  href={`${t.href}/`}
                  className="prod-pauta prod-lateral-item"
                  data-lateral={t.rotulo.toLowerCase()}
                  data-ativa={ativa ? "sim" : "nao"}
                  aria-current={caminho === t.href ? "page" : undefined}
                >
                  {t.icone}
                  {t.rotulo}
                </Link>
                {temFilhos ? (
                  <button
                    type="button"
                    className="prod-lateral-abrir"
                    onClick={() => alternar(t.href, daSecao)}
                    aria-expanded={aberto}
                    aria-label={`${aberto ? "Fechar" : "Abrir"} as telas de ${t.rotulo}`}
                    data-abrir-secao={t.rotulo.toLowerCase()}
                  >
                    <span aria-hidden>{aberto ? "\u2039" : "\u203a"}</span>
                  </button>
                ) : null}
              </div>

              {temFilhos && aberto ? (
                <ul className="prod-lateral-filhos">
                  {filhos.map((f) => (
                    <li key={f.href}>
                      {f.pronta === false ? (
                        <span
                          className="prod-pauta prod-lateral-item"
                          data-pronta="nao"
                          title={f.objetivo}
                        >
                          {f.rotulo}
                        </span>
                      ) : (
                        <Link
                          href={`${f.href}/`}
                          className="prod-pauta prod-lateral-item"
                          data-lateral={f.rotulo.toLowerCase()}
                          data-ativa={dentroDe(f.href) ? "sim" : "nao"}
                          aria-current={caminho === f.href ? "page" : undefined}
                          title={f.objetivo}
                        >
                          {f.rotulo}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* NA RAIZ A COLUNA ENCOLHE: o painel de início JÁ é a navegação das pautas, com
          os atalhos ilustrados, e a coluna repetir as onze ali seria a mesma escolha
          oferecida duas vezes na mesma tela (pedido de 2026-08-27). Os dropdowns nascem
          fechados lá, e a gestão só aparece nas telas internas. */}
      {caminho === "/studio" ? null : (
        <>
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
