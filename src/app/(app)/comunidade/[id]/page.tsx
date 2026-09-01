import { notFound } from "next/navigation";
import { Grafismo } from "@/componentes/grafismo";
import { Comunidade } from "@/componentes/comunidade";
import { ItemComAdmin } from "@/componentes/item-com-admin";
import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { COMUNIDADES, comunidadePorId } from "@/dados/comunidade";

export function generateStaticParams() {
  return COMUNIDADES.map((c) => ({ id: c.id }));
}

export default async function PaginaDeComunidade({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comunidade = comunidadePorId(id);
  if (!comunidade) notFound();

  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">{comunidade.nome}</h1>
        </div>
      </header>

      <ItemComAdmin
        alvo={{ tipo: "comunidade", id, titulo: comunidade.nome }}
        carimbo={DATA_DE_REFERENCIA}
        volta="/comunidade/"
      >
        <Comunidade comunidadeId={id} />
      </ItemComAdmin>
    </div>
  );
}
