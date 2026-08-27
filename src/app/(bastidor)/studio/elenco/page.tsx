import { PaginaDaAgenda } from "@/componentes/pagina-da-agenda";

/**
 * Studio · agenda, ato 3 de 8: elenco.
 *
 * O papel vem ANTES da pessoa: a aresta `atua_em` o exige, e um vínculo montado sem papel teria
 *   de ser recusado depois de pronto. Os papéis são lidos das próprias arestas do acervo,
 *   artista 426, colunista 76, participante 6, e não de uma lista escrita à mão.
 *
 * A ficha é UMA SÓ (`produtor-agenda.tsx`); esta rota escolhe por qual ato ela abre. As
 * outras sete continuam existindo e continuam abrindo no ato delas, nenhum link de fora
 * quebrou, e o `rotaDoAto()` de `produtor-rotas.ts` aponta para cá.
 */
export default function Pagina() {
  return <PaginaDaAgenda ato={2} />;
}
