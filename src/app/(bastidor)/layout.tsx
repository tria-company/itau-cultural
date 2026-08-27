import { TransicaoDeTela } from "@/componentes/transicao-de-tela";

/**
 * Layout das superfícies de bastidor, Studio, Moderação, Redação, Observatório,
 * Administração e o roteiro guiado.
 *
 * ESTAS ROTAS NÃO RECEBEM A BARRA DE ABAS: elas não são o app.
 *
 * O `app:hidden` SAIU DAQUI em 2026-08, e a saída é a decisão mais delicada deste trabalho.
 * Ele escondia as 52 rotas de uma vez, e isso deixou de estar certo quando o Studio virou
 * mobile-first: o perfil Produtor alimenta as onze pautas do produto, e quem produz cultura
 * no Brasil produz do telefone. A regra continua valendo para as outras cinco superfícies,
 * ela só passou a ser aplicada POR SUPERFÍCIE, em `SuperficieSoWeb`, montada no layout de
 * cada uma. Nenhuma superfície perdeu a declaração; o Studio ganhou o telefone.
 *
 * Quem confere: `scripts/verificar-produtor.mjs` afirma as duas metades da regra, o Studio
 * visível no app, as outras cinco escondidas, e `verificar-fase4` e `verificar-moderacao`
 * foram reescritos para medir a regra nova em vez da antiga.
 */
export default function LayoutBastidor({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <TransicaoDeTela>{children}</TransicaoDeTela>
    </div>
  );
}
