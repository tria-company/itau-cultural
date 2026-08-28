import { FichaDoPrograma } from "@/componentes/produtor-programa";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoDoPrograma,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";
import { numerosDosProgramas } from "@/dados/organizacao";

/**
 * Studio · Programa, a pauta do Produtor (funcionalidade 143).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A PAREDE DA ORGANIZAÇÃO SAIU DAQUI em 2026-08-27, e foi para
 * `/studio/organizacao/programa/`.
 *
 * Até então esta rota entregava duas telas empilhadas, e a de baixo ocupava 58% da altura
 * da página. Quem abria «Programa» para agrupar eventos numa temporada recebia junto o
 * ensaio sobre a classe vazia.
 *
 * NADA DO QUE ELA PROVAVA FOI PERDIDO: os contratos continuam medidos na rota própria,
 * numa tela visível.
 *
 * O ZERO CONTINUA DITO, e em uma linha: `programa` é a única das vinte classes da
 * ontologia sem nenhuma instância no acervo. O número atravessa como primitivo (DP-F),
 * medido no build, e não digitado na tela.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PÁGINA DE SERVIDOR: os módulos de dado são chamados aqui, por valor, no build.
 */
export default function Pagina() {
  const n = numerosDosProgramas();

  return (
    <FichaDoPrograma
      semente={registrosSemeados()}
      contexto={CONTEXTO_DO_PRODUTOR}
      catalogo={catalogoDoPrograma()}
      acervo={{
        programas: n.programas,
        eventos: n.eventos,
        eventosComRealizador: n.eventosComRealizador,
      }}
    />
  );
}
