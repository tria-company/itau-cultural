import { MapaDaTela } from "@/componentes/mapa-da-tela";
import type { DadosDoMapa } from "@/componentes/mapa";
import type { DadosDesertos } from "@/componentes/desertos";
import {
  CONTORNO_BRASIL,
  ROTULO_UNIDADES_FEDERATIVAS,
  UNIDADES_FEDERATIVAS,
} from "@/dados/contorno-brasil";
import {
  acervoSituadoNoBrasil,
  caminhoDe,
  densidadePorUf,
  indiceDePinos,
  LIMITES,
  METODOS_INDEXADOS,
  projetar,
  RAIO_AGRUPAMENTO,
  UNIDADES_POR_GRAU,
  VIAS_INDEXADAS,
} from "@/dados/geo";
import { dadosDePerto } from "@/dados/mapa-perto";

/**
 * Mapa NÃO é aba (D-14) e NÃO é porta de entrada (D-59). É LENTE sobre um conjunto de
 * resultados, alcançada de dentro de Acontece e de Buscar — e por isso esta página carrega
 * as duas voltas explícitas em vez de um destino de primeiro nível na barra. Elas são a
 * ALTERNATIVA: quando o hash traz um endereço de volta válido, quem manda é ele.
 *
 * ESTA PÁGINA É DE SERVIDOR E É ELA QUE TOCA O GRAFO. Toda a travessia e toda a projeção
 * acontecem aqui, no build (D-24); o componente de cliente recebe o resultado por
 * propriedade e não alcança `@/dados/grafo` nem transitivamente (DP-F).
 */
/**
 * A camada de desertos, montada no build: a CONTAGEM vem da travessia do grafo e o
 * POLÍGONO vem da geografia autorada, e os dois se encontram aqui pelo título do estado.
 * `densidadePorUf` já falha alto se a tabela de centroides e os polígonos divergirem, então
 * a junção abaixo não pode silenciosamente perder um estado.
 */
function montarDesertos(): DadosDesertos {
  const d = densidadePorUf();
  const poligonos = new Map(UNIDADES_FEDERATIVAS.map((u) => [u.sigla, u.contorno]));
  return {
    ufs: d.ufs.map((uf) => {
      const centro = projetar(uf.coordenada);
      return {
        sigla: uf.sigla,
        titulo: uf.titulo,
        registros: uf.registros,
        entidades: uf.entidades,
        noGrafo: uf.noGrafo,
        d: caminhoDe(poligonos.get(uf.sigla) ?? []),
        cx: Number(centro.x.toFixed(1)),
        cy: Number(centro.y.toFixed(1)),
      };
    }),
    total: d.total,
    doisMaiores: d.doisMaiores,
    percentual: Math.round((d.doisMaiores / d.total) * 100),
    maximo: d.maximo,
    mediana: d.mediana,
    entidadesDistintas: d.entidadesDistintas,
    comUmRegistro: d.comUmRegistro.map((u) => u.titulo),
    semRegistro: d.semRegistro.map((u) => u.titulo),
    rotulo: ROTULO_UNIDADES_FEDERATIVAS,
  };
}

export default function PaginaMapa() {
  const dados: DadosDoMapa = {
    viewBox: LIMITES.viewBox,
    contorno: caminhoDe(CONTORNO_BRASIL),
    pinos: indiceDePinos(),
    padrao: acervoSituadoNoBrasil(),
    metodos: METODOS_INDEXADOS,
    vias: VIAS_INDEXADAS,
    raio: RAIO_AGRUPAMENTO,
    // 1 grau de latitude ≈ 111 km. A conversão é arredondada de propósito: a precisão do
    // agrupamento é a da grade, não a da esfera.
    raioKm: Math.round((RAIO_AGRUPAMENTO / UNIDADES_POR_GRAU) * 111),
    voltas: [
      { href: "/acontece", rotulo: "Voltar para Acontece" },
      { href: "/buscar", rotulo: "Voltar para Buscar" },
    ],
    desertos: montarDesertos(),
    // A descoberta por distância, montada no build pela mesma razão do resto desta página:
    // `distanciaKm` mora em `geo.ts`, que importa o grafo, e o cliente não o alcança (DP-F).
    perto: dadosDePerto(),
  };

  // O MAPA DE EQUIPAMENTOS É O QUE ABRE ESTA TELA. A lente do acervo continua respondendo
  // quando o endereço traz recorte, que é como Acontece e Buscar chegam aqui; quem escolhe
  // é `MapaDaTela`, e o porquê está escrito lá.
  return <MapaDaTela dados={dados} />;
}
