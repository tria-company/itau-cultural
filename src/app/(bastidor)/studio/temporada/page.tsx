import { PaginaDaAgenda } from "@/componentes/pagina-da-agenda";

/**
 * Studio · agenda, ato 4 de 8: local e temporada.
 *
 * O espaço vem ANTES do intervalo, e a ordem é da ontologia: `temporada = evento + espaço +
 *   intervalo`. Remover uma temporada declara quantas sessões vão junto, as sessões são
 *   montadas SOBRE a chave dela, e órfãs gravariam chave de duas partes em vez de três.
 *
 * A ficha é UMA SÓ (`produtor-agenda.tsx`); esta rota escolhe por qual ato ela abre. As
 * outras sete continuam existindo e continuam abrindo no ato delas, nenhum link de fora
 * quebrou, e o `rotaDoAto()` de `produtor-rotas.ts` aponta para cá.
 */
export default function Pagina() {
  return <PaginaDaAgenda ato={3} />;
}
