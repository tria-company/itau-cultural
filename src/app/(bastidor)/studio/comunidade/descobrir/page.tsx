import { AbaComunidade } from "@/componentes/aba-comunidade";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { catalogoComum } from "@/dados/mock/seed-produtor";

/**
 * Studio · Comunidade · descobrir.
 *
 * A MESMA CASCA, COM A TERCEIRA ABA JÁ ABERTA. Desde 31/08/2026 «Descobrir» é uma das três
 * abas de `/studio/comunidade/`, e não uma tela à parte: quem chega por este endereço vê
 * exatamente o que veria tocando na aba, com as outras duas a um toque.
 *
 * O endereço fica porque endereço se copia e se guarda, e porque era daqui que a pastilha
 * antiga apontava. Duas portas, uma sala: é a mesma casca montada nas duas.
 */
export default function Pagina() {
  return (
    <div
      className="flex flex-col gap-5 px-1 py-4 desk:px-2 desk:py-6"
      data-margem-quase-nula
    >
      <AbaComunidade inicial="descobrir" />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </div>
  );
}
