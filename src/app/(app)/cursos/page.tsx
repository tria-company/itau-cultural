import type { Metadata } from "next";
import { Cursos } from "@/componentes/cursos";
import { PreferenciaFaixa } from "@/componentes/preferencia-faixa";
import { catalogoDeCursos } from "@/dados/cursos";

export const metadata: Metadata = {
  title: "Cursos — Itaú Cultural",
  description: "As formações da Escola Itaú Cultural — cursos, oficinas e pós-graduação.",
};

/**
 * Cursos — as formações do acervo (classe `formacao`) em vitrine de catálogo.
 *
 * COMPONENTE DE SERVIDOR (DP-F): `cursos.ts` varre o grafo no build. O cliente
 * recebe o DTO e recorta por busca, formato, linguagem e acessibilidade. Cada
 * cartão abre a ficha em `/cursos/[slug]`.
 */
const CATALOGO = catalogoDeCursos();

/* Quantas formações declaram alguma linguagem, contadas ITEM A ITEM.
 *
 * Somar as facetas devolvia 33 de 54 — uma formação que declara duas linguagens entra nas
 * duas. São 24, e a diferença não é detalhe: é o número que justifica esta faixa não ter
 * pergunta de linguagem. */

export default function PaginaCursos() {
  return (
    <>
      <PreferenciaFaixa
        app="cursos"
        pergunta="Em que formato você aprende?"
        opcoes={CATALOGO.formatos}
      />
      <Cursos catalogo={CATALOGO} />
    </>
  );
}
