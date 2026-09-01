import { notFound } from "next/navigation";
import { Grafismo } from "@/componentes/grafismo";
import { RecompensaItem } from "@/componentes/recompensa-item";
import { RECOMPENSAS, recompensaPorId } from "@/dados/recompensas";

export function generateStaticParams() {
  return RECOMPENSAS.map((r) => ({ id: r.id }));
}

export default async function PaginaRecompensa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recompensa = recompensaPorId(id);
  if (!recompensa) notFound();

  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">{recompensa.titulo}</h1>
        </div>
      </header>

      <RecompensaItem recompensa={recompensa} />
    </div>
  );
}
