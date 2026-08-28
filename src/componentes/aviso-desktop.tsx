"use client";

import { usePathname } from "next/navigation";
import { useVisao } from "@/contexto/visao";

/**
 * Qual das superfícies de bastidor a pessoa tentou abrir. O layout do grupo não sabe qual
 * rota filha está montada, e um aviso genérico («Bastidor») deixaria a pessoa sem saber o
 * que ela vai encontrar do outro lado da troca de visão.
 *
 * O STUDIO SAIU DESTA LISTA em 2026-08, e a ausência é a inversão de D-67 tomando forma. O
 * Studio passou a ser mobile-first: ele existe dentro da moldura, com trilho de pautas e
 * ficha em atos, e este componente não é montado no layout dele. Se o nome continuasse
 * aqui, ele seria uma linha morta, e, pior, uma linha morta que diz o contrário do que o
 * produto faz.
 */
function superficieDe(caminho: string): string {
  // A Organização mora sob /studio/ desde 2026-08-27, e vem ANTES da checagem de
  // /studio: sem esta linha o aviso dizia «Esta superfície» numa rota que tem nome.
  if (caminho.startsWith("/studio/organizacao")) return "A Organização";
  if (caminho.startsWith("/moderacao")) return "Moderação";
  if (caminho.startsWith("/redacao")) return "Redação";
  if (caminho.startsWith("/observatorio")) return "Observatório";
  if (caminho.startsWith("/admin")) return "Administração";
  if (caminho.startsWith("/roteiro")) return "O roteiro da demonstração";
  return "Esta superfície";
}

/**
 * Aviso das superfícies de bastidor na visão app.
 *
 * Moderação, Redação, Observatório, Administração e o roteiro existem só na web, é a única
 * exceção que D-05 permite à regra de um componente para as duas visões. Mas rota bloqueada
 * e tela branca são coisas diferentes de superfície de desktop: aqui a pessoa entende o
 * motivo e resolve num clique, usando o mesmo contexto de visão do alternador (D-01, D-04).
 *
 * O STUDIO NÃO PASSA MAIS POR AQUI. Ele é mobile-first desde o perfil Produtor, e o layout
 * dele não monta este componente.
 */
export function AvisoDesktop() {
  const { definirVisao } = useVisao();
  const superficie = superficieDe(usePathname() ?? "");

  return (
    <div className="flex flex-col gap-3 p-6 desk:hidden">
      <h1 className="text-xl font-bold">{superficie} é superfície de desktop</h1>
      <p className="text-sm text-tinta-2">
        Moderação, Redação, Observatório, Administração e o roteiro da demonstração são
        feitos para tela grande e densa: uma fila de mil duplicatas e uma tabela de
        procedência não cabem em 390px, e espremê-las seria pior do que dizer isto. A rota
        existe e responde; só precisa da outra visão. O <strong>Studio</strong> é a
        exceção, ele foi desenhado para o telefone e abre na visão app.
      </p>
      <button
        type="button"
        onClick={() => definirVisao("web")}
        className="w-fit cursor-pointer rounded-full bg-acao px-5 py-2.5 font-semibold text-sobre-acao transition-opacity hover:opacity-90"
      >
        Trocar para a visão Web
      </button>
    </div>
  );
}
