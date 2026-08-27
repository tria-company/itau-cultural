import { PaginaDaAgenda } from "@/componentes/pagina-da-agenda";

/**
 * Studio · agenda, ato 5 de 8: grade de sessões.
 *
 * O gerador existe porque ninguém digita 261 sessões. A prévia vem ANTES de aplicar, com a contagem, o teto e as colisões, dita depois do clique, ela seria uma limpeza.
 *
 * A ficha é UMA SÓ (`produtor-agenda.tsx`); esta rota escolhe por qual ato ela abre. As
 * outras sete continuam existindo e continuam abrindo no ato delas, nenhum link de fora
 * quebrou, e o `rotaDoAto()` de `produtor-rotas.ts` aponta para cá.
 */
export default function Pagina() {
  return <PaginaDaAgenda ato={4} />;
}
