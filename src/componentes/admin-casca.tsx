"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_PELO_ADMIN, SECOES_DO_ADMIN } from "@/dados/admin-secoes";

/**
 * admin-casca.tsx, o cabeçalho da administração.
 *
 * ELE ERA UMA SEGUNDA COLUNA, e virou header. O trilho lateral da plataforma já ocupa 15rem
 * na visão web; um segundo trilho de 13rem ao lado dele comia 28rem de navegação antes de
 * qualquer conteúdo aparecer, e a tela sobrava para o resto. Deitado no topo, ele custa duas
 * linhas de altura e devolve a largura inteira ao painel.
 *
 * SÃO DUAS FILEIRAS. Em cima, a marca da superfície e as saídas para o app: o poder do
 * administrador mora em cima do item, na tela de verdade, então ele precisa de porta de
 * saída para elas. Embaixo, as abas das oito listas.
 *
 * AS ABAS ROLAM NO PRÓPRIO EIXO nas duas visões, que é a regra da casa para conteúdo largo.
 * Nove abas não cabem em 370px, e não deviam encolher a ponto de o rótulo sumir.
 *
 * NO TELEFONE AS SAÍDAS SOMEM: a barra inferior já é essa porta, e repetir a mesma árvore
 * roubaria metade da largura útil do aparelho.
 */
export function CascaDoAdmin({ children }: { children: React.ReactNode }) {
  // Sem a barra final: `trailingSlash: true` faz o pathname canônico vir como `/admin/`,
  // e a igualdade exata nunca acenderia contra os hrefs sem barra.
  const caminho = (usePathname() ?? "").replace(/\/$/, "");

  return (
    <div className="adm-casca" data-admin-casca data-superficie="admin">
      <header className="adm-cabecalho">
        <div className="adm-cabecalho-cima">
          <p className="adm-cabecalho-marca">Administração</p>
          <div className="adm-saidas" data-grupo="app">
            <span className="adm-saidas-rotulo">Ver no app</span>
            <ul className="adm-saidas-lista">
              {APP_PELO_ADMIN.map((s) => (
                <li key={s.slug}>
                  <Link href={s.slug} className="adm-saida" data-saida={s.slug}>
                    {s.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <nav className="adm-abas" aria-label="Seções da administração">
          <ul className="adm-abas-lista">
            <li>
              <Link
                href="/admin/"
                className="adm-aba"
                data-secao="painel"
                aria-current={caminho === "/admin" ? "page" : undefined}
              >
                Visão geral
              </Link>
            </li>
            <li>
              <Link
                href="/admin/equipe/"
                className="adm-aba"
                data-secao="equipe"
                aria-current={caminho === "/admin/equipe" ? "page" : undefined}
              >
                Equipe
              </Link>
            </li>
            {SECOES_DO_ADMIN.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/admin/${s.slug}/`}
                  className="adm-aba"
                  data-secao={s.slug}
                  aria-current={caminho === `/admin/${s.slug}` ? "page" : undefined}
                >
                  {s.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="adm-conteudo">{children}</main>
    </div>
  );
}
