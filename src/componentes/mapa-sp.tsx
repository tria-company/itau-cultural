import { MALHA_SP, NUMEROS_DA_MALHA, VIEW_BOX_SP, FONTE_DA_MALHA } from "@/dados/malha-sp";

/**
 * mapa-sp.tsx, os equipamentos culturais de São Paulo por município.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COMPONENTE DE SERVIDOR, e é o que torna o mapa possível aqui. Os 645 caminhos pesam 167 KB;
 * eles saem no HTML do build e o navegador não busca nada. O mapa de origem era Leaflet com
 * tiles do Esri e um `fetch` de 1,06 MB, e nada disso atravessa: o polígono É o mapa (D-60).
 *
 * A ESCALA É RAIZ QUADRADA, e não linear nem logarítmica. Linear apagaria o interior inteiro,
 * porque São Paulo capital tem 519 equipamentos e a mediana do estado tem menos de um por 10
 * mil habitantes. Logarítmica achataria a concentração, que é justamente o que o mapa existe
 * para mostrar. É a mesma escolha que `desertos.tsx` já tinha feito, pelo mesmo motivo.
 *
 * OS 312 SEM NENHUM EQUIPAMENTO SÃO VAZADOS, e não um tom mais claro da mesma escala. A
 * diferença entre um e zero aqui é qualitativa: um é oferta magra, zero é um município que o
 * mapeamento não alcança. Quase metade do estado está nessa faixa, e é o achado da tela.
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

        {MALHA_SP.map((m) => {
          const faixa = m.equipamentos === 0 ? "vazio" : m.equipamentos === 1 ? "minimo" : "tem";
          return (
            <path
              key={m.id}
              d={m.d}
              className="msp-municipio"
              data-municipio={m.id}
              data-faixa={faixa}
              style={{ "--intensidade": intensidade(m.taxa).toFixed(3) } as React.CSSProperties}
            >
              <title>
                {m.nome}
                {": "}
                {m.equipamentos === 0
                  ? "nenhum equipamento mapeado"
                  : `${comSeparador(m.equipamentos)} equipamento${m.equipamentos === 1 ? "" : "s"}, ${m.taxa.toLocaleString("pt-BR")} por 10 mil habitantes`}
              </title>
            </path>
          );
        })}
      </svg>

      <ul className="msp-legenda" data-legenda-do-mapa>
        <li>
          <span className="msp-amostra" data-amostra="tem" />
          mais escuro, mais equipamento por habitante
        </li>
        <li>
          <span className="msp-amostra" data-amostra="vazio" />
          {comSeparador(n.semEquipamento)} de {comSeparador(n.municipios)} municípios sem nenhum
        </li>
      </ul>

      <p className="msp-leitura" data-leitura-do-mapa>
        São {comSeparador(n.equipamentos)} equipamentos culturais em{" "}
        {comSeparador(n.comEquipamento)} dos {comSeparador(n.municipios)} municípios de São
        Paulo, para {comSeparador(n.populacao)} habitantes. Os outros{" "}
        {comSeparador(n.semEquipamento)} aparecem vazados: quase metade do estado. O mapa mostra
        o que está mapeado, e não o que existe, que é uma diferença que ele não pode esconder.
      </p>

      <p className="msp-fonte">{FONTE_DA_MALHA}</p>
    </div>
  );
}
