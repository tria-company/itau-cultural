import { Grafismo } from "@/componentes/grafismo";
import { Carteira } from "@/componentes/carteira";

export default function PaginaCarteira() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Carteira</h1>
        </div>
        <p className="tipo-detalhe text-tinta-2">
          O que você juntou atravessando o acervo, e o que já resgatou com isso.
        </p>
      </header>

      <Carteira />
    </div>
  );
}
