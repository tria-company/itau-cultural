import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PautasDoStudio } from "@/componentes/produtor-pautas";
import { catalogoComum } from "@/dados/mock/seed-produtor";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";

/**
 * Studio · as pautas, a aba que responde «o que você publica».
 *
 * As imagens são do acervo, com crédito, e atravessam como DTO de primitivo (DP-F).
 */
export default function Pagina() {
  return (
    <>
      <PautasDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </>
  );
}
