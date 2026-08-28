"use client";

import { useId } from "react";

/**
 * base/graficos.tsx, as formas que o painel usa para mostrar número.
 *
 * SVG À MÃO, SEM BIBLIOTECA. Um pacote de gráficos traria seu próprio vocabulário de cor,
 * de fonte e de animação, e o primeiro gráfico desenhado por ele destoaria de todo o
 * resto: a régua deste produto é o design system, não o tema padrão de uma dependência.
 * São três formas, e três bastam para o que o Studio mede.
 *
 * NENHUMA COR NOVA, E NENHUM LARANJA EM DADO. As fatias são a mesma tinta em opacidades
 * decrescentes; laranja é ação, e uma pauta não é uma ação. A única exceção deliberada é
 * o medidor de qualidade, onde o arco cheio usa `--cor-acao` porque ali o número É a
 * ação que falta fazer, a mesma razão do trilho de progresso da ficha.
 *
 * DETERMINÍSTICO: só aritmética sobre os valores recebidos. Sem relógio, sem sorteio.
 */

/** Uma fatia da rosca. `valor` em unidades absolutas; a rosca normaliza. */
export interface FatiaDaRosca {
  rotulo: string;
  valor: number;
}

/**
 * A ROSCA, para composição: o que é parte de um todo (o alcance repartido entre as
 * pautas). Barras respondem «quanto», rosca responde «que fatia» — e é essa a pergunta
 * quando o total importa.
 */
export function Rosca({
  fatias,
  centroValor,
  centroRotulo,
}: {
  fatias: FatiaDaRosca[];
  centroValor: string;
  centroRotulo: string;
}) {
  const total = Math.max(1, fatias.reduce((n, f) => n + f.valor, 0));
  // Circunferência de raio 15,9155 é ~100: cada fatia vira o próprio percentual, e o
  // dasharray é lido direto, sem multiplicar por π em lugar nenhum.
  const raio = 15.9155;
  let acumulado = 0;

  return (
    <div className="prod-rosca">
      <svg viewBox="0 0 42 42" role="img" aria-label={`${centroValor} ${centroRotulo}`}>
        <circle className="prod-rosca-trilho" cx="21" cy="21" r={raio} />
        {fatias.map((f, i) => {
          const parte = (f.valor / total) * 100;
          const deslocamento = 25 - acumulado;
          acumulado += parte;
          return (
            <circle
              key={f.rotulo}
              className="prod-rosca-fatia"
              data-tom={String(Math.min(i, 5))}
              cx="21"
              cy="21"
              r={raio}
              strokeDasharray={`${Math.max(0, parte)} ${Math.max(0, 100 - parte)}`}
              strokeDashoffset={String(deslocamento)}
            />
          );
        })}
      </svg>
      <span className="prod-rosca-centro">
        <strong>{centroValor}</strong>
        <span>{centroRotulo}</span>
      </span>
    </div>
  );
}

/** A legenda da rosca, com o mesmo tom de cada fatia. */
export function LegendaDaRosca({ fatias }: { fatias: FatiaDaRosca[] }) {
  const total = Math.max(1, fatias.reduce((n, f) => n + f.valor, 0));
  return (
    <ul className="prod-rosca-legenda">
      {fatias.map((f, i) => (
        <li key={f.rotulo}>
          <span className="prod-vg-ponto" data-tom={String(Math.min(i, 5))} aria-hidden />
          <span className="prod-rosca-legenda-rotulo">{f.rotulo}</span>
          <span className="prod-rosca-legenda-valor">
            {Math.round((f.valor / total) * 100)}%
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * BARRAS VERTICAIS, para comparação em escala pequena (o alcance por dia da semana).
 * A barra mais alta acende em tinta cheia: é a leitura que a pessoa procura primeiro.
 */
export function BarrasVerticais({ barras }: { barras: { rotulo: string; valor: number }[] }) {
  const maximo = Math.max(1, ...barras.map((b) => b.valor));
  return (
    <div className="prod-barras-v" role="img" aria-label="alcance por dia da semana">
      {barras.map((b) => (
        <span className="prod-barra-v" key={b.rotulo}>
          <span
            className="prod-barra-v-cheia"
            data-maior={b.valor === maximo ? "sim" : "nao"}
            style={{ height: `${Math.max(4, Math.round((b.valor / maximo) * 100))}%` }}
          />
          <span className="prod-barra-v-rotulo">{b.rotulo}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * O MEDIDOR: um arco de 0 a 100 com o número no meio. Ele mede o que a pessoa pode
 * mudar escrevendo, e por isso o arco cheio é laranja: é ação que falta, não estado.
 */
export function Medidor({ porcento, rotulo }: { porcento: number; rotulo: string }) {
  const bruto = useId();
  const id = `medidor-${bruto.replace(/[^a-zA-Z0-9]/g, "")}`;
  const raio = 15.9155;
  const preenchido = Math.max(0, Math.min(100, porcento));

  return (
    <div className="prod-medidor">
      <svg viewBox="0 0 42 42" role="img" aria-labelledby={id}>
        <title id={id}>{`${preenchido}% ${rotulo}`}</title>
        <circle className="prod-medidor-trilho" cx="21" cy="21" r={raio} />
        {/* ZERO NAO DESENHA NADA. Com `stroke-linecap: round`, um arco de comprimento 0
            ainda pinta as duas pontas arredondadas uma sobre a outra, e o resultado era
            um ponto laranja solto no anel vazio, que se le como resto de progresso
            (reprovado a olho, 2026-08-27). Zero por cento e o trilho limpo. */}
        {preenchido > 0 ? (
          <circle
            className="prod-medidor-arco"
            cx="21"
            cy="21"
            r={raio}
            strokeDasharray={`${preenchido} ${100 - preenchido}`}
            strokeDashoffset="25"
          />
        ) : null}
      </svg>
      <span className="prod-medidor-centro">{preenchido}%</span>
      <span className="prod-medidor-rotulo">{rotulo}</span>
    </div>
  );
}
