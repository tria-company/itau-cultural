import Link from "next/link";
import { Grafismo } from "@/componentes/grafismo";
import { Niveis } from "@/componentes/niveis";

/**
 * `/desafios/niveis` — a escada inteira, com o que cada degrau pede.
 *
 * MORA DENTRO DE DESAFIOS, e não em `/meu`, porque é ali que a pessoa está quando
 * a pergunta aparece: ela vê o selo no topo da tela de missões e quer saber o que
 * vem depois. Uma rota em outra família obrigaria a atravessar o app para
 * responder uma dúvida nascida aqui.
 */
export default function PaginaNiveis() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <Link href="/desafios/" className="tipo-legenda text-tinta-2 no-underline">
          ← Desafios
        </Link>
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Os 18 níveis</h1>
        </div>
        <p className="tipo-detalhe text-tinta-2">
          Como o percurso vira nível, e o que falta para o próximo.
        </p>
      </header>

      <Niveis />
    </div>
  );
}
