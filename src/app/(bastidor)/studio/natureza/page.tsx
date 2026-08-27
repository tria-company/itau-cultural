import { PaginaDaAgenda } from "@/componentes/pagina-da-agenda";

/**
 * Studio · agenda, ato 2 de 8: natureza.
 *
 * TELA NOVA. Modalidade, formato e programação, os três campos que decidem quais atos seguintes a ficha vai pedir. Modalidade online dispensa espaço; programação por vigência dispensa a grade inteira.
 *
 * A ficha é UMA SÓ (`produtor-agenda.tsx`); esta rota escolhe por qual ato ela abre. As
 * outras sete continuam existindo e continuam abrindo no ato delas, nenhum link de fora
 * quebrou, e o `rotaDoAto()` de `produtor-rotas.ts` aponta para cá.
 */
export default function Pagina() {
  return <PaginaDaAgenda ato={1} />;
}
