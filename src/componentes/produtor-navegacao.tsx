"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESCRICAO_DA_PAUTA, PAUTAS } from "@/dados/tipos-produtor";

/**
 * produtor-navegacao.tsx, o trilho de pautas do Studio.
 *
 * POR QUE ELE EXISTE. `/studio/` tinha dezoito telas e navegação para metade delas: as oito
 * da jornada do produtor não se alcançavam entre si, e `/studio` não tinha índice, quem
 * chegava digitava a URL. Digitar URL ao vivo, na frente de uma banca, é como se perde o
 * lugar numa demonstração.
 *
 * NO PADRÃO «CHIPS DE FILTRO» DO DESIGN SYSTEM, e não num menu novo. O vocabulário já
 * existe: pílula de 36px, `tipo-detalhe`, contorno em `--cor-borda-forte`, selecionado em
 * preto cheio. Inventar um controle aqui faria o Studio parecer outro produto, e ele é o
 * mesmo produto, visto de trás.
 *
 * A TELA ATIVA CONTINUA SENDO UM LINK, com `aria-current="page"`. Virar texto morto
 * economizaria um clique inútil e custaria a única forma de recarregar a tela em que se
 * está, e, no artefato estático, recarregar é o gesto que desfaz qualquer estado de
 * cliente que tenha ficado estranho. É a mesma decisão de `studio-org-navegacao.tsx`.
 *
 * A PAUTA QUE AINDA NÃO TEM FICHA APARECE, DESABILITADA. É a diferença entre uma superfície
 * que mostra o próprio tamanho e uma que esconde o que falta. Link para rota inexistente
 * daria 404 no meio da demonstração, que é pior que o item apagado, quem clicou já perdeu
 * o lugar.
 */

/** As rotas que EXISTEM hoje. Uma entrada fora desta lista vira pastilha inerte. */
export interface RotaDaPauta {
  rota: string;
  pronta: boolean;
}

export function ProdutorNavegacao({ prontas }: { prontas: readonly string[] }) {
  // Sem a barra final: `trailingSlash: true` faz o pathname canônico vir como `/studio/`,
  // e a comparação exata contra hrefs sem barra nunca acenderia.
  const caminho = (usePathname() ?? "").replace(/\/$/, "");
  const conjunto = new Set(prontas);

  // NA RAIZ O TRILHO NAO APARECE. O painel 2.0 traz os atalhos com imagem, e um trilho de
  // pastilhas acima deles seria a mesma navegacao duas vezes na mesma tela. Nas fichas o
  // trilho continua: ali ele e o unico caminho entre pautas.
  if (caminho === "/studio") return null;

  return (
    <nav className="prod-trilho prod-trilho-pautas" aria-label="as onze pautas do Studio">
      <Link
        href="/studio/"
        className="prod-pauta"
        data-ativa={caminho === "/studio" ? "sim" : "nao"}
        aria-current={caminho === "/studio" ? "page" : undefined}
      >
        Painel
      </Link>
      {PAUTAS.map((p) => {
        const d = DESCRICAO_DA_PAUTA[p];
        const rota = d.rota.replace(/\/$/, "");
        const ativa = caminho === rota || caminho.startsWith(`${rota}/`);
        if (!conjunto.has(p)) {
          return (
            <span
              key={p}
              className="prod-pauta"
              data-pronta="nao"
              title={`${d.objetivo}, ficha ainda não construída`}
            >
              {d.rotulo}
            </span>
          );
        }
        return (
          <Link
            key={p}
            href={d.rota}
            className="prod-pauta"
            data-pauta={p}
            data-ativa={ativa ? "sim" : "nao"}
            aria-current={ativa ? "page" : undefined}
            title={d.objetivo}
          >
            {d.rotulo}
          </Link>
        );
      })}

      {/* AS TELAS DE GESTÃO, no fim do trilho. Elas não são pautas, não se cria um
          «catálogo» como se cria um evento, mas são alcançáveis pelo mesmo trilho porque
          uma segunda navegação faria a superfície ter dois lugares onde procurar. O
          separador diz que a natureza mudou. */}
      <span className="prod-separador-trilho" aria-hidden />
      {GESTAO.map((g) => {
        const rota = g.rota.replace(/\/$/, "");
        const ativa = caminho === rota || caminho.startsWith(`${rota}/`);
        return (
          <Link
            key={g.rota}
            href={g.rota}
            className="prod-pauta"
            data-gestao={g.id}
            data-ativa={ativa ? "sim" : "nao"}
            aria-current={ativa ? "page" : undefined}
            title={g.objetivo}
          >
            {g.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * As telas que NÃO são pauta: o que se gere depois, e o vocabulário que as fichas usam.
 *
 * Elas ficam depois do separador porque a natureza é outra, não se CRIA um catálogo como
 * se cria um evento. A lista é curta de propósito: as demais telas herdadas da Organização
 * continuam alcançáveis por URL e pelo painel, e enchê-lo com dezoito itens faria o trilho
 * deixar de ser navegável em 370px.
 */
const GESTAO = [
  {
    id: "ocorrencias",
    rota: "/studio/ocorrencias/",
    rotulo: "Sessões",
    objetivo: "O que muda depois de publicar: horário, esgotado, cancelamento.",
  },
  {
    id: "comunidade",
    rota: "/studio/comunidade/",
    rotulo: "Comunidade",
    objetivo: "Quem responde ao que você publicou, e quem mais alimenta o produto.",
  },
  {
    id: "pontos",
    rota: "/studio/pontos/",
    rotulo: "Loja de pontos",
    objetivo: "O que o cuidado com o dado vale, e o que dá para resgatar.",
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
