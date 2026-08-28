import { FichaDoEdital } from "@/componentes/produtor-programa";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoDoEdital,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";
import { vocabularioDoEdital } from "@/dados/organizacao";

/**
 * Studio · Editais, a pauta do Produtor (funcionalidade 149).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A PAREDE DA ORGANIZAÇÃO SAIU DAQUI em 2026-08-27, e foi para
 * `/studio/organizacao/editais/`.
 *
 * Até então esta rota entregava duas telas empilhadas, e a de baixo ocupava 60% da altura
 * da página. Quem abria «Editais» para publicar uma chamada recebia junto o histórico de
 * como a forma nasceu sem classe na ontologia.
 *
 * NADA DO QUE ELA PROVAVA FOI PERDIDO: os contratos continuam medidos na rota própria,
 * numa tela visível.
 *
 * O QUE FICOU: o tamanho do vocabulário do recorte, que é o que decide se o alerta de
 * edital compatível vale alguma coisa. Atravessa como primitivo (DP-F).
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PÁGINA DE SERVIDOR: os módulos de dado são chamados aqui, por valor, no build.
 */
export default function Pagina() {
  const v = vocabularioDoEdital();

  return (
    <FichaDoEdital
      semente={registrosSemeados()}
      contexto={CONTEXTO_DO_PRODUTOR}
      catalogo={catalogoDoEdital()}
      acervo={{
        linguagens: v.linguagens.length,
        ufsComAcervo: v.territorios.filter((t) => t.noAcervo).length,
        ufs: v.territorios.length,
      }}
    />
  );
}
