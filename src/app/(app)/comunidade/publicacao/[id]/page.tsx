import { notFound } from "next/navigation";
import { PublicacaoAberta } from "@/componentes/comunidade-publicacao";
import { PUBLICACOES } from "@/dados/comunidade";
import { PUBLICACOES_DO_ACERVO } from "@/dados/comunidade-feed";

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
    </div>
  );
}
