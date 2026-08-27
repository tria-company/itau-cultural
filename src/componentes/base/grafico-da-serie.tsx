"use client";

import { useId } from "react";
import { dataLegivel } from "@/componentes/base/seletores-de-tempo";
import { DIAS_DA_SERIE } from "@/dados/desempenho-produtor";
import { somarMinutos } from "@/dados/tipos-produtor";

/**
 * base/grafico-da-serie.tsx, a curva de área dos últimos catorze dias.
 *
 * UM SÓ DESENHO PARA TODO LUGAR QUE MOSTRA SÉRIE: o painel raiz e a tela do registro
 * renderizam a mesma curva, e extraí-la é o que impede as duas de divergirem no primeiro
 * ajuste. A curva é NEUTRA, em tinta com véu de gradiente: laranja é ação, nunca dado.
 *
 * O id do gradiente vem de `useId`, que é estável entre o HTML exportado e a hidratação;
 * um id fixo colidiria quando duas curvas dividissem a mesma página.
 */
export function GraficoDaSerie({
  serie,
  dataDeReferencia,
}: {
  serie: number[];
  dataDeReferencia: string;
}) {
  const bruto = useId();
  const idDoVeu = `prod-veu-${bruto.replace(/[^a-zA-Z0-9]/g, "")}`;

  const maximo = Math.max(1, ...serie);
  const passos = Math.max(1, serie.length - 1);
  const pontos = serie.map((v, i) => {
    const x = Math.round((i * 1000) / passos) / 10;
    const y = Math.round((42 - (v / maximo) * 38) * 10) / 10;
    return `${x},${y}`;
  });
  const linha = `M ${pontos.join(" L ")}`;
  const area = `${linha} L 100,44 L 0,44 Z`;

  const primeiroDia = somarMinutos(
    `${dataDeReferencia}T00:00`,
    -(DIAS_DA_SERIE - 1) * 24 * 60,
  ).slice(0, 10);

  return (
    <>
      <svg
        className="prod-grafico"
        viewBox="0 0 100 44"
        preserveAspectRatio="none"
        role="img"
        aria-label={`a curva dos últimos ${DIAS_DA_SERIE} dias`}
      >
        <defs>
          <linearGradient id={idDoVeu} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${idDoVeu})`} stroke="none" />
        <path
          d={linha}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="prod-grafico-eixo" aria-hidden>
        <span>{dataLegivel(primeiroDia).slice(0, 5)}</span>
        <span>hoje</span>
      </div>
    </>
  );
}
