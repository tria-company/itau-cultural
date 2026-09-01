import {
  FONTE_DA_MALHA,
  KM_DO_DESERTO,
  MALHA_SP,
  NUMEROS_DA_MALHA,
  PONTOS_SP,
  TOPO_POR_TAXA,
  VIEW_BOX_SP,
} from "@/dados/malha-sp";

/**
 * mapa-sp.tsx, os equipamentos culturais de São Paulo.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COMPONENTE DE SERVIDOR, e é o que torna o mapa possível aqui. O desenho inteiro é
 * resolvido no build e o navegador NÃO BUSCA NADA: nem biblioteca, nem tile, nem geojson.
 * O mapa de origem é Leaflet com tiles do Esri, `leaflet.heat` de um segundo CDN e 1,67 MB
 * de dado em runtime, e nada disso atravessa: o polígono É o mapa e o ponto É o
 * equipamento (D-60).
 *
 * ELE NÃO SAI NO HTML, e sim no payload RSC, e a razão é o consumidor: `AdminPainel` é
 * componente de cliente e devolve `null` enquanto não sabe se quem abriu é administrador.
 * Passar o mapa como `children` mantém o custo no build, mas quem monta os nós é o
 * navegador, depois de hidratar. Medido: 3.148 nós, e a página fecha em 492 KB. A regra de
 * rede continua valendo inteira; o que não vale é dizer que ele chega pronto no HTML.
 *
 * SÃO TRÊS CAMADAS, e a do meio era a que faltava. A primeira porta trouxe só o
 * coroplético, e coroplético sozinho não é aquele mapa: o que se vê nele é a NUVEM DE
 * EQUIPAMENTOS adensando na capital e rareando no interior. São 2.503 pontos em dois
 * grupos, as mesmas duas cores do original.
 *
 * A BASE FICOU NEUTRA por causa disso. Ela era laranja, e laranja embaixo de rosa e ciano
 * dá três matizes brigando pela mesma leitura. Agora a base é tinta lavada e a cor está
 * onde ela informa: no ponto.
 *
 * A ESCALA É RAIZ QUADRADA, e não linear nem logarítmica. Linear apagaria o interior
 * inteiro, porque São Paulo capital tem 519 equipamentos e a mediana do estado tem menos de
 * um por 10 mil habitantes. Logarítmica achataria a concentração, que é justamente o que o
 * mapa existe para mostrar.
 *
 * O DESERTO CULTURAL É MEDIDO no build, por Haversine, com o corte de 20 km do mapa de
 * origem. São 96 municípios, e é a leitura mais dura da tela.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** O que a taxa por 10 mil habitantes vira de intensidade, de 0 a 1. */
function intensidade(taxa: number): number {
  if (taxa <= 0) return 0;
  return Math.min(1, Math.sqrt(taxa / NUMEROS_DA_MALHA.maiorTaxa));
}

function comSeparador(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function MapaSP() {
  const n = NUMEROS_DA_MALHA;

  return (
    <div className="msp" data-mapa-sp>
      <div className="msp-quadro">
        <svg
          viewBox={VIEW_BOX_SP}
          role="img"
          aria-label={`Equipamentos culturais nos ${n.municipios} municípios de São Paulo`}
          className="msp-desenho"
        >
          <defs>
            <pattern
              id="msp-hachura"
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="4" className="msp-hachura-traco" />
            </pattern>
          </defs>

          {/* Camada 1: a taxa por 10 mil habitantes. */}
          <g className="msp-camada-base">
            {MALHA_SP.map((m) => {
              const faixa =
                m.equipamentos === 0 ? "vazio" : m.equipamentos === 1 ? "minimo" : "tem";
              return (
                <path
                  key={m.id}
                  d={m.d}
                  className="msp-municipio"
                  data-municipio={m.id}
                  data-faixa={faixa}
                  data-deserto={m.kmAteOProximo >= KM_DO_DESERTO ? "sim" : "nao"}
                  style={{ "--intensidade": intensidade(m.taxa).toFixed(3) } as React.CSSProperties}
                >
                  <title>
                    {m.nome}
                    {": "}
                    {m.equipamentos === 0
                      ? `nenhum equipamento mapeado, ${m.kmAteOProximo.toLocaleString("pt-BR")} km até o mais próximo`
                      : `${comSeparador(m.equipamentos)} equipamento${m.equipamentos === 1 ? "" : "s"}, ${m.taxa.toLocaleString("pt-BR")} por 10 mil habitantes`}
                  </title>
                </path>
              );
            })}
          </g>

          {/* Camada 2: onde os equipamentos estão de fato.
              O CÍRCULO SAI NU, e o grupo é quem carrega a cor. Uma `class` e um `data-grupo`
              em cada um dos 2.503 pesavam 200 KB no HTML do build, mais que os próprios
              pontos; dois `<g>` dizem a mesma coisa uma vez cada. O `r` mora na folha pelo
              mesmo motivo: é a mesma medida para todos. */}
          <g className="msp-camada-pontos" aria-hidden="true">
            <g data-grupo="1">
              {PONTOS_SP.filter((p) => p[2] === 1).map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} />
              ))}
            </g>
            <g data-grupo="0">
              {PONTOS_SP.filter((p) => p[2] === 0).map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} />
              ))}
            </g>
          </g>
        </svg>
      </div>

      <div className="msp-leitura-caixa">
        <ul className="msp-numeros">
          <li>
            <span className="msp-numero-valor">{comSeparador(n.equipamentos)}</span>
            <span className="msp-numero-rotulo">Equipamentos</span>
          </li>
          <li>
            <span className="msp-numero-valor">{comSeparador(n.comEquipamento)}</span>
            <span className="msp-numero-rotulo">Municípios com algum</span>
          </li>
          <li>
            <span className="msp-numero-valor">{comSeparador(n.desertos)}</span>
            <span className="msp-numero-rotulo">Em deserto cultural</span>
          </li>
        </ul>

        <ul className="msp-legenda" data-legenda-do-mapa>
          <li>
            <span className="msp-amostra" data-amostra="museu" />
            Museus, teatros, cinemas e galerias
            <em>{comSeparador(n.museusETeatros)}</em>
          </li>
          <li>
            <span className="msp-amostra" data-amostra="biblioteca" />
            Bibliotecas e centros culturais
            <em>{comSeparador(n.bibliotecasECentros)}</em>
          </li>
          <li>
            <span className="msp-amostra" data-amostra="vazio" />
            Municípios sem nenhum equipamento
            <em>{comSeparador(n.semEquipamento)}</em>
          </li>
        </ul>

        <div className="msp-escala">
          <span>baixo</span>
          <span className="msp-escala-barra" aria-hidden="true" />
          <span>alto por 10 mil</span>
        </div>

        <section className="msp-ranking">
          <h3 className="msp-ranking-titulo">Por 10 mil habitantes</h3>
          <ol className="msp-ranking-lista">
            {TOPO_POR_TAXA.map((m) => (
              <li key={m.nome}>
                <span className="msp-ranking-nome">{m.nome}</span>
                <span className="msp-ranking-taxa">{m.taxa.toLocaleString("pt-BR")}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <p className="msp-leitura" data-leitura-do-mapa>
        São {comSeparador(n.equipamentos)} equipamentos culturais em {comSeparador(n.comEquipamento)}{" "}
        dos {comSeparador(n.municipios)} municípios de São Paulo, para{" "}
        {comSeparador(n.populacao)} habitantes. Os outros {comSeparador(n.semEquipamento)} aparecem
        vazados: quase metade do estado. Em {comSeparador(n.desertos)} deles o equipamento mais
        próximo fica a {KM_DO_DESERTO} km ou mais, e é onde vivem{" "}
        {comSeparador(n.populacaoNoDeserto)} pessoas. O mapa mostra o que está mapeado, e não o
        que existe, que é uma diferença que ele não pode esconder.
      </p>

      <p className="msp-fonte">{FONTE_DA_MALHA}</p>
    </div>
  );
}
