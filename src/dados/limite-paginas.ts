/**
 * limite-paginas.ts — o teto de páginas por rota `[slug]`, ligado por ambiente.
 *
 * POR QUE ELE EXISTE. O acervo gera 5.320 páginas estáticas, e `/materia`
 * sozinha responde por 1.851. Num builder de 2 núcleos isso vira um worker só
 * arrastando 23 minutos — quando não trava numa página que estoura o tempo e
 * consome as três tentativas antes de derrubar o build inteiro.
 *
 * POR QUE ATRÁS DE UMA VARIÁVEL, e não cravado. Cortar de vez mudaria o produto
 * para todo mundo: `npm run build` deixaria de exportar o acervo completo, e as
 * páginas cortadas passariam a responder 404 sem ninguém ter pedido isso. Sem a
 * variável NADA muda — o corte só existe onde alguém escreve `LIMITE_PAGINAS`,
 * que hoje é a pré-visualização na Vercel.
 *
 * O QUE ELE CUSTA quando está ligado: entidade fora do teto não tem página, e um
 * link para ela responde 404. É aceitável numa pré-visualização e não é aceitável
 * no artefato final — por isso a variável não tem valor padrão.
 */

const BRUTO = process.env.LIMITE_PAGINAS;

/** O teto em vigor, ou `null` quando não há corte nenhum. */
export const TETO_DE_PAGINAS: number | null = (() => {
  if (!BRUTO) return null;
  const n = Number(BRUTO);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
})();

/**
 * Corta a lista de slugs no teto, preservando a ORDEM de entrada — a mesma que o
 * grafo devolve. Ordem estável importa: com corte, duas builds da mesma revisão
 * precisam exportar exatamente as mesmas páginas, senão um link que funcionava
 * ontem passa a dar 404 hoje sem nada ter mudado no código.
 */
export function limitarSlugs(slugs: string[]): string[] {
  return TETO_DE_PAGINAS === null ? slugs : slugs.slice(0, TETO_DE_PAGINAS);
}
