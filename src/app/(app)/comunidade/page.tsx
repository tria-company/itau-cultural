import { Grafismo } from "@/componentes/grafismo";
import { Comunidade } from "@/componentes/comunidade";
import { COMUNIDADE_OFICIAL } from "@/dados/comunidade";

export default function PaginaComunidade() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Comunidade</h1>
        </div>
      </header>

      <Comunidade comunidadeId={COMUNIDADE_OFICIAL} />
    </div>
  );
}
