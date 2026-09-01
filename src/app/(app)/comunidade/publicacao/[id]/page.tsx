import { notFound } from "next/navigation";
import { PublicacaoComAdmin } from "@/componentes/publicacao-com-admin";
import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { COMUNIDADES, PUBLICACOES } from "@/dados/comunidade";
import { PUBLICACOES_DO_ACERVO } from "@/dados/comunidade-feed";

const TODAS = [...PUBLICACOES, ...PUBLICACOES_DO_ACERVO];

export function generateStaticParams() {
  return TODAS.map((p) => ({ id: p.id }));
}

/**
 * A publicação, e o que a administração pode nela.
 *
 * O QUE ATRAVESSA É PRIMITIVO: o título para o registro não depender do dado continuar
 * existindo, a lista de comunidades para o seletor de mover, e a data de referência para o
 * carimbo. Nada de grafo do lado do cliente.
 */
export default async function PaginaPublicacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const publicacao = TODAS.find((p) => p.id === id);
  if (!publicacao) notFound();

  const comunidades = COMUNIDADES.map((c) => ({ id: c.id, nome: c.nome }));

  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <PublicacaoComAdmin
        id={id}
        titulo={publicacao.titulo}
        comunidades={comunidades}
        carimbo={DATA_DE_REFERENCIA}
      />
    </div>
  );
}
