/**
 * admin-secoes.ts, para onde o administrador vai.
 *
 * ZERO IMPORT, e é a razão do arquivo existir. A casca do Admin é componente de cliente
 * porque acende o item pelo `usePathname`, e `admin-area.ts` alcanca o grafo de 24 MB.
 * Importar de la por valor mandaria o acervo inteiro para o navegador (DP-F). Aqui so ha
 * rotulo e rota, que e o que a navegacao precisa saber.
 *
 * OS ROTULOS SAO OS MESMOS de `CONFIG` em `admin-area.ts`. Duas listas que divergem sao um
 * defeito, entao `scripts/sonda-admin.mjs` confere que as oito seccoes batem nos dois lados.
 */

export interface SecaoDoAdmin {
  /** O segmento da rota, `/admin/<slug>`. */
  slug: string;
  rotulo: string;
}

/** As oito coisas que o administrador lista, filtra e edita. */
export const SECOES_DO_ADMIN: readonly SecaoDoAdmin[] = [
  { slug: "pessoas", rotulo: "Pessoas" },
  { slug: "coletivos", rotulo: "Coletivos" },
  { slug: "instituicoes", rotulo: "Instituições" },
  { slug: "eventos", rotulo: "Eventos" },
  { slug: "espacos", rotulo: "Espaços" },
  { slug: "comunidades", rotulo: "Comunidades" },
  { slug: "publicacoes", rotulo: "Publicações" },
  { slug: "loja", rotulo: "Loja" },
];

/**
 * O APP, visto de dentro da administração.
 *
 * O administrador usa o mesmo aplicativo de todo mundo, e o poder dele mora em cima dos
 * itens, nas telas de verdade. O trilho leva ate elas: e por aqui que ele sai da lista e
 * vai ver a coisa no lugar onde ela vive.
 */
export const APP_PELO_ADMIN: readonly SecaoDoAdmin[] = [
  { slug: "/descobrir/", rotulo: "Descobrir" },
  { slug: "/acontece/", rotulo: "Acontece" },
  { slug: "/comunidade/", rotulo: "Comunidade" },
  { slug: "/play/", rotulo: "Play" },
  { slug: "/meu/", rotulo: "Meu" },
];
