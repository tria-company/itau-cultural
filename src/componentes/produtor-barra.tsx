"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ICONE_APPS,
  ICONE_COMUNIDADE,
  ICONE_LOJA,
  ICONE_MAIS,
  ICONE_STUDIO_HOME,
} from "@/componentes/base/icones";
import { FolhaDeCriacao } from "@/componentes/folha-de-criacao";
import type { ImagemDaCriacao } from "@/componentes/folha-de-criacao";
import type { Pauta } from "@/dados/tipos-produtor";

/**
 * produtor-barra.tsx, a barra flutuante do Studio na visão APP, no molde da do público.
 *
 * TRÊS ABAS numa pílula translúcida e o Criar redondo separado: mesma gramática da
 * barra do público, vista de trás do balcão. O redondo é AÇÃO, não aba, e o laranja é
 * legítimo por isso.
 *
 * NA WEB ELA NÃO EXISTE, por CSS: lá a casca é a coluna lateral
 * (`produtor-navegacao.tsx`), que carrega o mesmo Criar e as mesmas três telas. Duas
 * navegações visíveis ao mesmo tempo seriam a mesma escolha oferecida duas vezes.
 *
 * ELA NÃO CARREGA O ARMAZÉM: a folha de criação marca a intenção e navega, e a página
 * da pauta cria o registro quando hidrata (`consumirCriacaoDaPauta`).
 *
 * `absolute` CONTRA A MOLDURA, NUNCA `fixed` (D-03). Mantém `data-barra-acao` com UMA
 * ação primária, que é o que a sonda da dobra confere no app.
 */

/**
 * A LOJA APONTA PARA A LOJA. Até 2026-08-28 esta aba levava a `/studio/pontos/`, que era
 * uma tela chamada «Loja de pontos»; com o porte do outro ramo, esse endereço passou a
 * abrir a CARTEIRA, e a vitrine foi para `/studio/pontos/loja/`. Rótulo e destino voltaram
 * a dizer a mesma coisa; a carteira fica a um toque, no botão próprio da vitrine.
 */
const ABAS = [
  { href: "/studio", rotulo: "Início", icone: ICONE_STUDIO_HOME },
  { href: "/studio/pautas", rotulo: "Studio", icone: ICONE_APPS },
  { href: "/studio/comunidade", rotulo: "Comunidade", icone: ICONE_COMUNIDADE },
  { href: "/studio/pontos/loja", rotulo: "Loja", icone: ICONE_LOJA },
] as const;

export type { ImagemDaCriacao as ImagemDaBarra };

export function BarraDoStudio({
  pautasComFicha,
  imagens,
}: {
  pautasComFicha: readonly Pauta[];
  imagens: ImagemDaCriacao[];
}) {
  // Sem a barra final: `trailingSlash: true` publica `/studio/`, e a igualdade exata
  // contra os hrefs sem barra nunca acenderia.
  const caminho = (usePathname() ?? "").replace(/\/$/, "");
  const [criando, setCriando] = useState(false);

  return (
    <>
      <nav className="prod-barra-nav" aria-label="Navegação do Studio" data-barra-acao>
        <ul className="prod-abas">
          {ABAS.map((aba) => {
            // A SEÇÃO INTEIRA ACENDE, e não só a rota exata: a Comunidade e a Loja ganharam
            // sub-telas no porte de 2026-08-28, e com a comparação exata as quatro abas
            // apagavam juntas em /studio/comunidade/guardadas/ e irmãs. Início fica de fora
            // porque `/studio` prefixa todas as outras.
            // `caminho === secao` conta também: em `/studio/pontos/` (a Carteira) o
            // prefixo com barra não casa, e as quatro abas apagavam juntas, sem nenhum
            // `aria-current` na tela (medido no HTML exportado, 2026-08-28).
            const secao = aba.href === "/studio/pontos/loja" ? "/studio/pontos" : aba.href;
            const ativa =
              caminho === aba.href ||
              (secao !== "/studio" &&
                (caminho === secao || caminho.startsWith(`${secao}/`)));
            return (
              <li key={aba.href}>
                <Link
                  href={`${aba.href}/`}
                  className="prod-aba"
                  data-aba={aba.rotulo.toLowerCase()}
                  data-ativa={ativa ? "sim" : "nao"}
                  aria-current={ativa ? "page" : undefined}
                >
                  {aba.icone}
                  <span className="prod-aba-rotulo">{aba.rotulo}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="prod-criar-redondo"
          onClick={() => setCriando(true)}
          data-abrir-criar="sim"
          data-primaria="sim"
          aria-label="criar um registro"
        >
          {ICONE_MAIS}
          <span className="prod-criar-rotulo">Criar</span>
        </button>
      </nav>

      <FolhaDeCriacao
        aberta={criando}
        aoFechar={() => setCriando(false)}
        pautasComFicha={pautasComFicha}
        imagens={imagens}
      />
    </>
  );
}
