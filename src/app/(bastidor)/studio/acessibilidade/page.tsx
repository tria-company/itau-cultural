import { PaginaDaAgenda } from "@/componentes/pagina-da-agenda";

/**
 * Studio · agenda, ato 7 de 8: acessibilidade.
 *
 * As 8 dimensões e os 5 recursos físicos, num ato só, e o ATO de declarar ausência, sem o qual oito caixas desmarcadas seriam lidas como silêncio (D-43).
 *
 * A ficha é UMA SÓ (`produtor-agenda.tsx`); esta rota escolhe por qual ato ela abre. As
 * outras sete continuam existindo e continuam abrindo no ato delas, nenhum link de fora
 * quebrou, e o `rotaDoAto()` de `produtor-rotas.ts` aponta para cá.
 */
export default function Pagina() {
  return <PaginaDaAgenda ato={6} />;
}
