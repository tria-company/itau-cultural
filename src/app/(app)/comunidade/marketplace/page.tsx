import { Grafismo } from "@/componentes/grafismo";
import { Marketplace } from "@/componentes/comunidade-marketplace";

export default function PaginaMarketplace() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Comunidades</h1>
        </div>
        <p className="tipo-detalhe text-tinta-2">
          Produtores e organizações do acervo, por território.
        </p>
      </header>

      <Marketplace />
    </div>
  );
}
