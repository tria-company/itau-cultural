import { MinhasComunidades } from "@/componentes/minhas-comunidades";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { CONTEXTO_DO_PRODUTOR, catalogoComum } from "@/dados/mock/seed-produtor";

/**
 * Studio · Comunidades.
 *
 * O LADO DE QUEM MANTÉM, aberto em 29/08/2026. O corte foi pedido em uma linha: dentro do
 * Studio fica tudo que ele mexe; a aba Comunidade, irmã de Início e Loja, é o que ele lê.
 * Antes as duas coisas moravam na mesma tela, com um lápis flutuando sobre a capa.
 *
 * PÁGINA DE SERVIDOR: a data de referência é lida aqui, no build, e atravessa como DTO de
 * primitivo. Componente de cliente nunca alcança o grafo (DP-F).
 */
export default function Pagina() {
  return (
    <>
      <MinhasComunidades hoje={CONTEXTO_DO_PRODUTOR.dataDeReferencia} />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </>
  );
}
