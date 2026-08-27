import { PaginaDaAgenda } from "@/componentes/pagina-da-agenda";

/**
 * Studio · agenda, ato 1 de 8: identidade.
 *
 * A chave de identidade antes de qualquer outra coisa: título normalizado, agente realizador e obra. É ela que faz duas linhas serem a mesma coisa no mundo, e é por isso que temporada e sessão só existem depois dela.
 *
 * A ficha é UMA SÓ (`produtor-agenda.tsx`); esta rota escolhe por qual ato ela abre. As
 * outras sete continuam existindo e continuam abrindo no ato delas, nenhum link de fora
 * quebrou, e o `rotaDoAto()` de `produtor-rotas.ts` aponta para cá.
 */
export default function Pagina() {
  return <PaginaDaAgenda ato={0} inicio />;
}
