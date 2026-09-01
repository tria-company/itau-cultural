import { Grafismo } from "@/componentes/grafismo";
import { Recompensas } from "@/componentes/recompensas";
import { CONTEXTO_DO_PRODUTOR } from "@/dados/mock/seed-produtor";

export default function PaginaRecompensas() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Recompensas</h1>
        </div>
      </header>

      {/* `hoje` É OBRIGATÓRIO desde que a loja ganhou item com prazo: sem a data, o cartão
          não sabe dizer se a retirada ainda vale. Vem da data de referência do build, nunca
          do relógio de quem abre, e é a mesma que a tela do Studio passa. */}
      <Recompensas hoje={CONTEXTO_DO_PRODUTOR.dataDeReferencia} />
    </div>
  );
}
