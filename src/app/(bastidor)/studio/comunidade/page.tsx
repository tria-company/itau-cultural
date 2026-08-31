import { AbaComunidade } from "@/componentes/aba-comunidade";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { catalogoComum } from "@/dados/mock/seed-produtor";

/**
 * Studio · Comunidade, a porta.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ELA ERA O FEED DA CASA, e virou a ESCOLHA (pedido de 29/08/2026). Abrir direto numa
 * comunidade e oferecer as outras dentro de um menu suspenso escondia o produto: quem
 * chegava via uma comunidade e precisava descobrir que existiam vinte e duas.
 *
 * E VIROU DUAS TELAS NUM ENDEREÇO SÓ. Sem seguir ninguém, ela é a galeria de cartazes, cada
 * um com a capa, o nome dentro da capa e quantas publicações a comunidade tem. Seguindo uma
 * que seja, ela é o FEED PRÓPRIO, com o que essas comunidades publicaram, misturado e do
 * mais novo para o mais velho, que é o contrato de qualquer rede. Quem decide é
 * `aba-comunidade.tsx`, no cliente, porque quem sabe é o `localStorage`.
 *
 * Entrar numa comunidade leva a `/studio/comunidade/[id]/`, como integrante: sem lápis, sem
 * publicar, sem apagar. Quem MANTÉM comunidade faz isso em `/studio/minhas-comunidades/`,
 * que é a bancada dele no Studio.
 *
 * A PÁGINA É MAGRA DE PROPÓSITO. As capas e as contagens vêm do motor, que já tem as 122
 * publicações no cliente; passar tudo por prop do servidor duplicaria o mesmo dado no HTML.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function PaginaComunidade() {
  return (
    <div
      className="flex flex-col gap-5 px-1 py-4 desk:px-2 desk:py-6"
      data-margem-quase-nula
    >
      <AbaComunidade />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </div>
  );
}
