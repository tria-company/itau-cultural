import { notFound } from "next/navigation";
import { PublicacaoAberta } from "@/componentes/comunidade-publicacao";
import { PUBLICACOES } from "@/dados/comunidade";
import { PUBLICACOES_DO_ACERVO } from "@/dados/comunidade-feed";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { catalogoComum } from "@/dados/mock/seed-produtor";

/**
 * Studio · Comunidade, uma publicacao aberta.
 *
 * PORTADA DO OUTRO RAMO em 2026-08-28, do repositorio Apogeunexus/bid-itau, onde estas
 * telas foram construidas. O corpo e o de la, palavra por palavra: o pedido foi que
 * ficassem EXATAMENTE iguais. O que muda e o endereco, porque aqui elas vivem na visao do
 * Produtor, sob /studio/, e nao no app publico.
 *
 * Por isso a BarraDoStudio no fim: e ela que da as abas do aparelho a qualquer tela do
 * Studio, e sem ela esta rota seria a unica sem saida na visao app.
 */

const TODAS = [...PUBLICACOES, ...PUBLICACOES_DO_ACERVO];

export function generateStaticParams() {
  return TODAS.map((p) => ({ id: p.id }));
}

export default async function PaginaPublicacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!TODAS.some((p) => p.id === id)) notFound();

  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <PublicacaoAberta id={id} />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </div>
  );
}
