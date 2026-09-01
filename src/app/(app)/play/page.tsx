import type { Metadata } from "next";
import { Play } from "@/componentes/play";
import {
  catalogoNoFioStreaming,
  destaqueDoStreaming,
  dimensoesDoStreaming,
} from "@/dados/play";

export const metadata: Metadata = { title: "Play — Itaú Cultural" };

/**
 * Página do Play (D-92, revisada na reformulação de 2026-08 por decisão do
 * cliente): a vitrine passa a ser SÓ STREAMING — vídeo, série e playlist —
 * porque podcast tem porta própria em /cast e o editorial em /noticias. O
 * catálogo unificado continua inteiro em `catalogoDoPlay()` e nas 529 rotas do
 * player; o que mudou foi o recorte da vitrine, e as dimensões de
 * acessibilidade acompanham o denominador do recorte.
 *
 * 23/08: a tela virou VITRINE no molde de Netflix e Apple TV (decisão da
 * reunião). O destaque entra por propriedade, do servidor — a mais recente do
 * recorte, escolhida por ordem e não por curadoria. Ver o cabeçalho de
 * `src/componentes/play.tsx`.
 *
 * É ELA que toca `@/dados/play` — o módulo alcança o grafo de 23 MB e por DP-F
 * nenhum `"use client"` pode importá-lo por valor.
 */
const CATALOGO = catalogoNoFioStreaming();

/* As categorias que o acervo DECLARA neste recorte. Podcast não entra: ele tem porta
 * própria em /cast, e oferecê-lo aqui mandaria a pessoa para uma prateleira que esta tela
 * não mostra. */
const CATEGORIAS = CATALOGO.categorias.filter((c) => c.valor !== "podcasts");

/* Os dois denominadores são DIFERENTES e a primeira escrita desta tela trocou um pelo
 * outro: `CATALOGO.total` é o total do RECORTE de streaming, não do acervo. A frase saía
 * «das 113 mídias do acervo, aqui são 113», que é tautologia com cara de medição. */

export default function PaginaPlay() {
  return (
      <Play
        catalogo={CATALOGO}
        destaque={destaqueDoStreaming()}
        dimensoes={dimensoesDoStreaming()}
      />
  );
}
