/**
 * localizacao.ts — estado e município, para o primeiro filtro da tela.
 *
 * POR QUE UM MÓDULO PRÓPRIO. `filtros.ts` tem 953 linhas e responde por outra pergunta —
 * o que o acervo recorta e o que ele não recorta. Localização é escolha de produto, não
 * diagnóstico de cobertura, e misturar as duas faria a segunda crescer sobre a primeira.
 *
 * O QUE ELE LÊ. Os 359 territórios do grafo trazem `extra.nivel` (`estado`, `municipio`
 * ou `pais`) e `extra.estado` com o nome por extenso. Deste conjunto saem os 25 estados
 * brasileiros e os 118 municípios, agrupados pelo estado a que pertencem.
 *
 * DP-F: roda NO BUILD. O DTO que atravessa é só primitivo — dois níveis de `{ slug,
 * titulo }` —, e mede alguns kB contra os 23 MB do grafo.
 */

import { porSlug, slugsPorTipo } from "./grafo";
import type { Entidade } from "./tipos";

export interface MunicipioDeFiltro {
  slug: string;
  titulo: string;
}

export interface EstadoDeFiltro {
  slug: string;
  titulo: string;
  municipios: MunicipioDeFiltro[];
}

interface ExtraDeTerritorio {
  nivel?: string;
  estado?: string;
  pais?: string;
}

const PAIS = "Brasil";

function extra(e: Entidade): ExtraDeTerritorio {
  return (e.extra ?? {}) as ExtraDeTerritorio;
}

/** Ordem alfabética por rótulo, com as regras do português — «Á» antes de «B». */
const porRotulo = (a: { titulo: string }, b: { titulo: string }) =>
  a.titulo.localeCompare(b.titulo, "pt-BR");

let memo: EstadoDeFiltro[] | null = null;

/**
 * Os estados brasileiros do acervo, cada um com os municípios que ele tem.
 *
 * **Estado sem município continua na lista.** A alternativa seria escondê-lo, e aí o
 * seletor afirmaria que o estado não existe no acervo quando o que ele não tem é
 * município catalogado — duas coisas diferentes, e confundi-las é o erro que esta obra
 * recusa. Quem escolhe um estado sem município vê o campo seguinte vazio e desabilitado.
 */
export function estadosParaFiltro(): EstadoDeFiltro[] {
  if (memo) return memo;

  const territorios = slugsPorTipo("territorio")
    .map((slug) => porSlug("territorio", slug))
    .filter((e): e is Entidade => Boolean(e));

  const municipiosPorEstado = new Map<string, MunicipioDeFiltro[]>();
  for (const t of territorios) {
    const x = extra(t);
    if (x.pais !== PAIS || x.nivel !== "municipio" || !x.estado) continue;
    const lista = municipiosPorEstado.get(x.estado) ?? [];
    lista.push({ slug: t.slug, titulo: t.titulo });
    municipiosPorEstado.set(x.estado, lista);
  }

  const estados: EstadoDeFiltro[] = [];
  for (const t of territorios) {
    const x = extra(t);
    if (x.pais !== PAIS || x.nivel !== "estado") continue;
    estados.push({
      slug: t.slug,
      titulo: t.titulo,
      municipios: (municipiosPorEstado.get(t.titulo) ?? []).sort(porRotulo),
    });
  }

  memo = estados.sort(porRotulo);
  return memo;
}
