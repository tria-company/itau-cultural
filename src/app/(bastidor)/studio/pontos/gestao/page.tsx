import { GestaoDaLoja } from "@/componentes/loja-gestao";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { CONTEXTO_DO_PRODUTOR, catalogoComum } from "@/dados/mock/seed-produtor";

/**
 * Studio · Gestão da loja.
 *
 * A LOJA PELO LADO DE QUEM A OPERA, aberta em 2026-08-28: o catálogo, o estoque, e o
 * painel de quem resgatou o quê e quando. A vitrine em `/studio/pontos/loja/` continua
 * sendo a tela de quem gasta as fichas; esta é a de quem decide o que está à venda.
 *
 * PÁGINA DE SERVIDOR: o acervo de imagens é chamado aqui, por valor, no build, e
 * atravessa como DTO de primitivo. Componente de cliente nunca alcança o grafo (DP-F).
 */
export default function Pagina() {
  return (
    <>
      <GestaoDaLoja
        hoje={CONTEXTO_DO_PRODUTOR.dataDeReferencia}
        imagens={catalogoComum().imagens}
      />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </>
  );
}
