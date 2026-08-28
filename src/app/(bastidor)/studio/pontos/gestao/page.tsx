import { GestaoDaLoja } from "@/componentes/loja-gestao";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { catalogoComum } from "@/dados/mock/seed-produtor";

/**
 * Studio · Resgates.
 *
 * QUEM RESGATOU O QUÊ, QUANDO, E EM QUE PÉ ESTÁ A ENTREGA. O catálogo saiu daqui no mesmo
 * dia em que chegou: criar item, mexer no preço e no estoque acontecem na própria vitrine,
 * em `/studio/pontos/loja/`, olhando para o item. Sobrou aqui o que é lista.
 *
 * PÁGINA DE SERVIDOR: o acervo de imagens é chamado aqui, por valor, no build, e
 * atravessa como DTO de primitivo. Componente de cliente nunca alcança o grafo (DP-F).
 */
export default function Pagina() {
  return (
    <>
      <GestaoDaLoja />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </>
  );
}
