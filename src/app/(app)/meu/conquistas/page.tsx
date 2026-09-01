import { Grafismo } from "@/componentes/grafismo";
import { Conquistas } from "@/componentes/conquistas";

export default function PaginaConquistas() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Conquistas</h1>
        </div>
        <p className="tipo-detalhe text-tinta-2">
          O que dá ficha, o que falta para cada emblema e as metas desta semana.
        </p>
      </header>

      <Conquistas />
    </div>
  );
}
