import { PaginaDaAgenda } from "@/componentes/pagina-da-agenda";

/**
 * Studio · agenda, ato 8 de 8: publicação.
 *
 * O que falta é O QUE O PÚBLICO NÃO VAI VER, não o que uma fila vai devolver. Com a publicação direta, quem lê a lacuna é o público, e a moderação virou fiscalização posterior.
 *
 * A ficha é UMA SÓ (`produtor-agenda.tsx`); esta rota escolhe por qual ato ela abre. As
 * outras sete continuam existindo e continuam abrindo no ato delas, nenhum link de fora
 * quebrou, e o `rotaDoAto()` de `produtor-rotas.ts` aponta para cá.
 */
export default function Pagina() {
  return <PaginaDaAgenda ato={7} />;
}
