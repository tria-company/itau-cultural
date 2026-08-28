import { Grafismo } from "@/componentes/grafismo";
import { Guardadas } from "@/componentes/comunidade-guardadas";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { catalogoComum } from "@/dados/mock/seed-produtor";

/**
 * Studio · Comunidade, as publicacoes guardadas.
 *
 * PORTADA DO OUTRO RAMO em 2026-08-28, do repositorio Apogeunexus/bid-itau, onde estas
 * telas foram construidas. O corpo e o de la, palavra por palavra: o pedido foi que
 * ficassem EXATAMENTE iguais. O que muda e o endereco, porque aqui elas vivem na visao do
 * Produtor, sob /studio/, e nao no app publico.
 *
 * Por isso a BarraDoStudio no fim: e ela que da as abas do aparelho a qualquer tela do
 * Studio, e sem ela esta rota seria a unica sem saida na visao app.
 */

export default function PaginaGuardadas() {
  return (
    <div
      className="flex flex-col gap-5 px-1 py-4 desk:px-2 desk:py-6"
      data-margem-quase-nula
    >
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Guardadas</h1>
        </div>
        <p className="tipo-detalhe text-tinta-2">
          As publicações que você guardou, de todas as comunidades.
        </p>
      </header>

      <Guardadas />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </div>
  );
}
