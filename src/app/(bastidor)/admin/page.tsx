import { AdminPainel } from "@/componentes/admin-painel";
import { MapaSP } from "@/componentes/mapa-sp";
import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { aArea, oPainel } from "@/dados/admin-area";

/**
 * `/admin`, o painel da plataforma e a porta para administrar.
 *
 * Ela substituiu dez telas de governança que explicavam o sistema em vez de deixar mexer
 * nele. O que ficou é como a plataforma está, onde ela chega, e as portas para agir.
 *
 * PÁGINA DE SERVIDOR: a contagem e o mapa atravessam o acervo no build, e ao cliente vai
 * primitivo mais os caminhos SVG já projetados.
 */
export const metadata = {
  title: "Administração",
  description: "Como a plataforma está, onde ela chega, e o que administrar.",
};

export default function PaginaDaArea() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Administração</h1>
      </header>
      <AdminPainel
        painel={oPainel()}
        area={aArea()}
        carimbo={DATA_DE_REFERENCIA}
        mapa={<MapaSP />}
      />
    </div>
  );
}
