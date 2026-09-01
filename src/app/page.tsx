import { redirect } from "next/navigation";

/**
 * A raiz não é tela: ela leva para `/apps`, o hub.
 *
 * Até 23/08 a porta era Descobrir. Abrir direto no feed mostra UMA das pontas do
 * produto e esconde as outras onze — quem chega pela primeira vez não tem como
 * saber que existem Play, Cursos, Notícias, Cast. O hub abre com o produto
 * inteiro à vista, e Descobrir continua a um toque, na primeira aba da barra.
 *
 * Sob `output: "export"` (D-24) o redirecionamento é resolvido no build e sai no
 * artefato estático — não há servidor para emitir um 307. Confira em `out/index.html`.
 */
export default function Home() {
  redirect("/descobrir");
}
