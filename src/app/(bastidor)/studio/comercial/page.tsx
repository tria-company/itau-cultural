import { PaginaDaAgenda } from "@/componentes/pagina-da-agenda";

/**
 * Studio · agenda, ato 6 de 8: comercial e ingresso.
 *
 * A TELA P7, QUE NUNCA EXISTIU. `tipos-acesso.ts:643,650` já apontava para esta rota: dois
 *   itens do score de qualidade endereçavam uma tela que não estava no disco. Cobrança, preço
 *   estruturado, canal de ingresso, inscrição e faixa etária.
 *
 * A ficha é UMA SÓ (`produtor-agenda.tsx`); esta rota escolhe por qual ato ela abre. As
 * outras sete continuam existindo e continuam abrindo no ato delas, nenhum link de fora
 * quebrou, e o `rotaDoAto()` de `produtor-rotas.ts` aponta para cá.
 */
export default function Pagina() {
  return <PaginaDaAgenda ato={5} />;
}
