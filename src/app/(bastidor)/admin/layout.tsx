/**
 * O ADMIN ABRE NO TELEFONE, e por isso ele NÃO monta `SuperficieSoWeb`.
 *
 * As outras superfícies de bastidor continuam sendo mesa de trabalho: ninguém resolve fila
 * de mil duplicatas em 370px. Esta deixou de ser console e virou o próprio aplicativo, com
 * poder em cima de cada item, e o aplicativo abre no telefone. Manter o envelope aqui
 * esconderia o Admin justamente na visão em que as pessoas usam o produto.
 *
 * A inversão é estreita e nomeada, como foi a do Studio: só o Admin muda de lado.
 */
export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
