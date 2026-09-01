import { ModoCidade } from "@/componentes/modo-cidade";
import { cidadesComAcervo, precomputarCidade } from "@/dados/cidade";
import { limitarSlugs } from "@/dados/limite-paginas";

/**
 * `/cidade/[slug]` — o Modo Cidade, AGEN-05 e `docs/telas.md` tela 11.
 *
 * COMPONENTE DE SERVIDOR, e é aqui que a fronteira DP-F acontece: no BUILD, `precomputarCidade`
 * varre o grafo, resolve as coordenadas por `geo.ts` e calcula todos os roteiros que a tela
 * oferece — 2, 3, 4 e 5 dias — mais a fila de substitutos de cada posição. O que atravessa
 * para `<ModoCidade>` é um DTO de primitivos. Nenhum componente de cliente desta rota conhece
 * `@/dados/grafo` nem `@/dados/geo`.
 *
 * O PRECÔMPUTO COMBINATÓRIO É O PADRÃO QUE A 02-02 FIXOU, e aqui ele é obrigatório e não só
 * economia: `distanciaKm` mora em `geo.ts`, que importa o grafo. Sem o precômputo, o
 * navegador precisaria de uma segunda implementação da haversine — duas versões da mesma
 * conta que divergem na primeira correção.
 *
 * A ROTA É EXPORTADA PARA OS 15 MUNICÍPIOS COM 8 OU MAIS ENTIDADES, e para nenhum dos
 * outros 195. Uma página de roteiro com três itens seria tela vazia com moldura em volta, e
 * 195 delas encheriam o build de páginas que ninguém abre. O corte mora em
 * `cidadesComAcervo`, ao lado da contagem que o justifica.
 */
export function generateStaticParams() {
  const slugs = limitarSlugs(cidadesComAcervo().map((cidade) => cidade.slug));
  return slugs.map((slug) => ({ slug }));
}

export default async function PaginaCidade({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cidade = cidadesComAcervo().find((c) => c.slug === slug);

  // Sob `output: "export"` só chegam aqui os slugs que `generateStaticParams` devolveu, e
  // portanto este ramo não é alcançável no artefato. Ele existe para o `next dev`, onde
  // alguém pode digitar `/cidade/qualquer-coisa` durante a apresentação: melhor uma frase
  // do que uma exceção de renderização.
  if (!cidade) {
    return (
      <div className="flex flex-col gap-2 p-5">
        <h1 className="text-2xl leading-tight font-bold">Cidade fora do recorte</h1>
        <p className="max-w-prose text-sm leading-relaxed text-tinta-2">
          {`«${slug}» não é um dos ${cidadesComAcervo().length} municípios que o acervo documenta com pelo menos 8 registros. O Modo Cidade só existe onde há acervo para percorrer.`}
        </p>
      </div>
    );
  }

  return <ModoCidade dados={precomputarCidade(cidade.territorioId)} />;
}
