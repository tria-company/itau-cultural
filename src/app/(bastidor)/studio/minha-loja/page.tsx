import { LojaEmGestao } from "@/componentes/loja-em-gestao";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { CONTEXTO_DO_PRODUTOR, catalogoComum } from "@/dados/mock/seed-produtor";

/**
 * Studio · Loja.
 *
 * O LADO DE QUEM ABASTECE, aberto em 29/08/2026. Cadastrar item, mexer no preço e no
 * estoque saíram da vitrine, que voltou a ser o lugar de gastar ficha. Mesmo corte da
 * Comunidade, e pela mesma razão: dentro do Studio fica tudo que ele mexe.
 *
 * PÁGINA DE SERVIDOR: o acervo de imagens é chamado aqui, por valor, no build, e atravessa
 * como DTO de primitivo. Componente de cliente nunca alcança o grafo (DP-F).
 */
export default function Pagina() {
  return (
    <div className="flex flex-col gap-5 px-1 py-4 desk:px-2 desk:py-6" data-margem-quase-nula>
      <LojaEmGestao
        hoje={CONTEXTO_DO_PRODUTOR.dataDeReferencia}
        imagens={catalogoComum().imagens}
      />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </div>
  );
}
