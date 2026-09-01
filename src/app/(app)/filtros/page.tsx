import { Filtros } from "@/componentes/filtros";
import {
  CRITERIOS_SEM_LASTRO,
  dimensoesComIndice,
  montarAcessibilidade,
  numerosDosFiltros,
  RESUMO_DA_FICHA,
  TRILHAS_RELACIONADAS,
} from "@/dados/filtros";
import { porSlug, slugsPorTipo, vizinhos } from "@/dados/grafo";
import { montarIndice } from "@/dados/indice";
import { estadosParaFiltro } from "@/dados/localizacao";

/**
 * /filtros — os filtros ontológicos (`docs/telas.md` tela 9, APPX-01, D-91, D-90, D-43).
 *
 * COMPONENTE DE SERVIDOR, E É AQUI QUE A FRONTEIRA É SEGURADA. Sob `output: "export"`
 * (D-24) «servidor» quer dizer build: `montarIndice` e `montarAcessibilidade` rodam no
 * momento em que este módulo é carregado, atravessam o acervo pelas funções públicas de
 * `grafo.ts` (D-47 — nenhuma varredura de array cru) e devolvem dois DTOs de primitivos.
 *
 * `filtros.ts` importa `grafo.ts` POR VALOR — `entidades.json` tem 9,4 MB e `arestas.json`
 * 13,6 MB, e nenhum dos dois pode chegar ao navegador. `filtros.tsx` é `"use client"` e
 * importa de `@/dados/filtros` SÓ TIPO; o que atravessa a fronteira RSC são os 12,7 KB de
 * contagens que `montarAcessibilidade` mede e limita.
 *
 * O ÍNDICE E O DTO DE ACESSIBILIDADE SÃO ALINHADOS POR CONSTRUÇÃO, e não por coincidência:
 * `montarAcessibilidade` recebe o índice já montado e lê as entradas dele, em vez de
 * repetir a enumeração e torcer para as duas ordens continuarem iguais.
 *
 * DUAS ROTAS APONTAM PARA CÁ e não a alcançavam antes deste plano: 05-01 pôs um link para
 * `/filtros/` em `/acontece/` e 05-02 pôs outro em `/buscar/`. O export estático não valida
 * href interno e nenhum build falha por isso — quem prova que os dois resolvem é o gate de
 * 05-08. O caminho da rota é contrato: tem de ser exatamente `/filtros/`.
 */
export default function PaginaFiltros() {
  const indice = montarIndice({ slugsPorTipo, porSlug, vizinhos });
  const acessibilidade = montarAcessibilidade(indice);

  return (
    <Filtros
      estados={estadosParaFiltro()}
      indice={indice}
      acessibilidade={acessibilidade}
      dimensoes={dimensoesComIndice(acessibilidade)}
      ficha={RESUMO_DA_FICHA}
      semLastro={CRITERIOS_SEM_LASTRO}
      trilhas={TRILHAS_RELACIONADAS}
      numeros={numerosDosFiltros()}
    />
  );
}
