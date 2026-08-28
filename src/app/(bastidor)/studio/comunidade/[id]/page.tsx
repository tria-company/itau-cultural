import { notFound } from "next/navigation";
import { Grafismo } from "@/componentes/grafismo";
import { Comunidade } from "@/componentes/comunidade";
import { COMUNIDADES, comunidadePorId } from "@/dados/comunidade";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { catalogoComum } from "@/dados/mock/seed-produtor";

/**
 * Studio · Comunidade, uma comunidade do acervo.
 *
 * PORTADA DO OUTRO RAMO em 2026-08-28, do repositorio Apogeunexus/bid-itau, onde estas
 * telas foram construidas. O corpo e o de la, palavra por palavra: o pedido foi que
 * ficassem EXATAMENTE iguais. O que muda e o endereco, porque aqui elas vivem na visao do
 * Produtor, sob /studio/, e nao no app publico.
 *
 * Por isso a BarraDoStudio no fim: e ela que da as abas do aparelho a qualquer tela do
 * Studio, e sem ela esta rota seria a unica sem saida na visao app.
 */

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

      <Comunidade comunidadeId={id} />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </div>
  );
}
