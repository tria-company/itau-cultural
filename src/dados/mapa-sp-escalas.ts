/**
 * mapa-sp-escalas.ts, as cores e as contas do mapa de equipamentos culturais.
 *
 * ELAS SÃO CÓPIA FIEL, e essa é a razão do arquivo. Cada função aqui reproduz, número por
 * número, a função de mesmo nome no `js/app.js` do mapa enviado. Aproximar «mais ou menos»
 * daria outro mapa: a rampa do coroplético é linear e a da distância é raiz quadrada, e
 * trocar uma pela outra muda qual metade do estado parece atendida.
 *
 * ZERO IMPORT, de propósito. São funções puras sobre número, e é isso que permite ao
 * componente de cliente usá-las sem arrastar dado nenhum atrás (DP-F).
 *
 * A PALETA É A DA MARCA, e o original já a usava: laranja, ciano, rosa e verde do manual do
 * Itaú Cultural. Uma armadilha do original merece nota: a classe da legenda se chama
 * `legend__dot--pink`, mas o CSS dela pinta `--itau-orange`. Quem confia no nome da classe
 * pinta museu de rosa; quem confia no valor pinta de laranja, que é o que o mapa mostra.
 */

/** A paleta do manual, com os valores exatos do mapa enviado. */
export const COR = {
  laranja: "#ff7800",
  /** O contorno claro do ponto de museu, `soft` em app.js:892. */
  laranjaSuave: "#ffb366",
  ciano: "#30c5f4",
  cianoSuave: "#7ad8f8",
  rosa: "#e04b9b",
  verde: "#a6ce39",
  /** O fundo do mapa, `--bg` em style.css. */
  fundo: "#111111",
  branco: "#ffffff",
} as const;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function preso(v: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * A cor do coroplético, por equipamento por 10 mil habitantes.
 *
 * RAMPA LINEAR, de rosa clarinho a rosa da marca, com a opacidade subindo junto. Cópia de
 * `taxaColor` em app.js:596.
 */
export function corDaTaxa(taxa: number, taxaMax: number, alfa = 0.72): string {
  const t = preso(taxa / (taxaMax || 1));
  const r = Math.round(lerp(255, 224, t));
  const g = Math.round(lerp(228, 75, t));
  const b = Math.round(lerp(240, 155, t));
  const a = lerp(0.22, alfa, Math.max(0.3, t));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * A cor da camada de quantidade, pelo índice de volume de 0 a 100.
 *
 * Laranja clarinho a laranja da marca. Cópia de `indexColor` em app.js:293.
 */
export function corDoIndice(indice: number, alfa = 0.45): string {
  const t = preso(indice / 100);
  const g = Math.round(lerp(212, 120, t));
  const b = Math.round(lerp(179, 0, t));
  return `rgba(255, ${g}, ${b}, ${alfa})`;
}

/** A opacidade da camada de quantidade cresce com o índice. app.js:311. */
export function alfaDoIndice(indice: number, selecionado: boolean): number {
  return selecionado ? 0.55 : 0.18 + (indice / 100) * 0.48;
}

/**
 * A cor da distância, de verde (perto) a rosa (longe).
 *
 * RAIZ QUADRADA ATÉ 12 KM, e não linear: a diferença entre 200 m e 1 km importa muito mais
 * para quem anda do que a diferença entre 10 km e 11 km, e a raiz é o que dá essa
 * sensibilidade no começo da escala. Cópia de `distanceColor` em app.js:110.
 */
export function corDaDistancia(km: number): { hex: string; r: number; g: number; b: number } {
  const t = preso(Math.sqrt(km / 12));
  let r: number;
  let g: number;
  let b: number;
  if (t < 0.5) {
    const u = t / 0.5;
    r = Math.round(lerp(166, 249, u));
    g = Math.round(lerp(206, 223, u));
    b = Math.round(lerp(57, 77, u));
  } else {
    const u = (t - 0.5) / 0.5;
    r = Math.round(lerp(249, 224, u));
    g = Math.round(lerp(223, 75, u));
    b = Math.round(lerp(77, 155, u));
  }
  const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  return { hex, r, g, b };
}

/**
 * O veredicto de acesso, pelos mesmos quatro limiares do original (app.js:130).
 *
 * O TEXTO FOI REESCRITO SEM TRAVESSÃO, que é regra desta casa. Os limiares, esses são os
 * mesmos: 400 m, 1,2 km, 4 km e 12 km.
 */
export function veredictoDaDistancia(mediaKm: number): { texto: string; faixa: string } {
  if (mediaKm < 0.4) return { texto: "Muito perto, cultura ao alcance a pé", faixa: "perto" };
  if (mediaKm < 1.2) return { texto: "Perto, poucos minutos de deslocamento", faixa: "perto" };
  if (mediaKm < 4) return { texto: "Moderado, vale planejar o trajeto", faixa: "medio" };
  if (mediaKm < 12) return { texto: "Longe, acesso cultural mais escasso", faixa: "longe" };
  return { texto: "Muito longe, desertificação cultural relativa", faixa: "longe" };
}

/** Metro abaixo de 1 km, uma casa até 10 km, inteiro acima. Cópia de app.js:95. */
export function distanciaEmTexto(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1).replace(".", ",")} km`;
  return `${Math.round(km)} km`;
}

/** Distância em quilômetros entre dois pares lat/lon, por Haversine. app.js:85. */
export function kmEntre(latA: number, lonA: number, latB: number, lonB: number): number {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (latB - latA) * rad;
  const dLon = (lonB - lonA) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latA * rad) * Math.cos(latB * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * A rampa da camada de calor, do original (app.js:972).
 *
 * Quatro paradas, de marrom escuro a laranja da marca. A camada de calor do original vem de
 * `leaflet.heat`, que é um CDN; o algoritmo dela é público e curto, e está reimplementado no
 * componente. A rampa é esta.
 */
export const RAMPA_DO_CALOR: readonly { parada: number; cor: string }[] = [
  { parada: 0.2, cor: "#3a1800" },
  { parada: 0.45, cor: "#a04a00" },
  { parada: 0.7, cor: "#ff9a3d" },
  { parada: 1.0, cor: "#ff7800" },
];

/** A opacidade mínima da camada de calor, `minOpacity` em app.js:971. */
export const OPACIDADE_MINIMA_DO_CALOR = 0.32;

/** População com separador, como `formatPop` do original. */
export function populacaoEmTexto(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (n >= 1000) return `${Math.round(n / 1000)} mil`;
  return String(n);
}
