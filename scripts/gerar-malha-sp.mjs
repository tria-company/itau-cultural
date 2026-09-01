/**
 * gerar-malha-sp.mjs, a malha municipal de São Paulo virando caminho SVG.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE ELE EXISTE. O mapa de origem é Leaflet: carrega a biblioteca de um CDN, os tiles
 * do Esri, e busca 1,06 MB de geojson em runtime. São três requisições de rede num projeto
 * cujos portões medem zero (D-60). O que se aproveita é o DADO e a LEITURA, nunca o
 * mecanismo.
 *
 * O POLÍGONO É O MAPA. Sem tile, sem base cartográfica de terceiro: 645 municípios
 * desenhados como `<path>`, projetados aqui no build. É o mesmo caminho que
 * `contorno-brasil.ts` já percorre, e a mesma função `caminhoDe` que o resto do produto usa.
 *
 * A SIMPLIFICAÇÃO É DECLARADA. Sem ela são 43.177 pontos, cerca de 506 KB de atributo `d`.
 * Douglas-Peucker a 0,02 grau derruba para perto de 6.400, uns 75 KB, e a essa escala a
 * silhueta de um município continua reconhecível. O número está no arquivo gerado.
 *
 * REEXECUTÁVEL, e é isso que prova que é transformação e não invenção (D-15). Rodar duas
 * vezes sobre a mesma fonte produz o mesmo arquivo.
 *
 * Rode com: node scripts/gerar-malha-sp.mjs <caminho-do-geojson>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const SAIDA = path.join(RAIZ, "src", "dados", "malha-sp.ts");

/** A tolerância da simplificação, em grau. Escrita aqui e repetida no arquivo gerado. */
const TOLERANCIA = 0.02;

/** Quantas casas decimais o caminho guarda. Uma é o que a escala do desenho sustenta. */
const CASAS = 1;

// ---------------------------------------------------------------------------
// Douglas-Peucker
// ---------------------------------------------------------------------------

function distanciaAoSegmento(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const m = dx * dx + dy * dy;
  if (m === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / m;
  const cx = a[0] + t * dx;
  const cy = a[1] + t * dy;
  return Math.hypot(p[0] - cx, p[1] - cy);
}

function simplificar(pontos, tolerancia) {
  if (pontos.length < 3) return pontos;
  let iMaior = 0;
  let maior = 0;
  for (let i = 1; i < pontos.length - 1; i += 1) {
    const d = distanciaAoSegmento(pontos[i], pontos[0], pontos[pontos.length - 1]);
    if (d > maior) {
      maior = d;
      iMaior = i;
    }
  }
  if (maior <= tolerancia) return [pontos[0], pontos[pontos.length - 1]];
  return [
    ...simplificar(pontos.slice(0, iMaior + 1), tolerancia).slice(0, -1),
    ...simplificar(pontos.slice(iMaior), tolerancia),
  ];
}

// ---------------------------------------------------------------------------
// A projeção, com a janela de São Paulo
// ---------------------------------------------------------------------------

/**
 * A JANELA É DE SÃO PAULO, e não a do Brasil.
 *
 * `geo.ts` projeta contra `LIMITES`, que enquadra o país inteiro. São Paulo dentro daquela
 * janela viraria um borrão de uns 60 por 40 pontos. Aqui a janela é o retângulo do estado,
 * calculado da própria malha, e a altura sai da largura pela razão real das coordenadas,
 * para o estado não achatar.
 */
function janelaDe(features) {
  let latMin = 90;
  let latMax = -90;
  let lonMin = 180;
  let lonMax = -180;
  const olhar = (o) => {
    if (typeof o[0] === "number") {
      const [lon, lat] = o;
      if (lat < latMin) latMin = lat;
      if (lat > latMax) latMax = lat;
      if (lon < lonMin) lonMin = lon;
      if (lon > lonMax) lonMax = lon;
      return;
    }
    for (const x of o) olhar(x);
  };
  for (const f of features) olhar(f.geometry.coordinates);
  return { latMin, latMax, lonMin, lonMax };
}

function projetorDe(janela, largura) {
  const grausLon = janela.lonMax - janela.lonMin;
  const grausLat = janela.latMax - janela.latMin;
  const unidades = largura / grausLon;
  const altura = Number((grausLat * unidades).toFixed(0));
  return {
    altura,
    // O y é invertido: latitude cresce para cima, e a coordenada de tela cresce para baixo.
    projetar: ([lon, lat]) => [
      Number(((lon - janela.lonMin) * unidades).toFixed(CASAS)),
      Number(((janela.latMax - lat) * unidades).toFixed(CASAS)),
    ],
  };
}

function caminhoDe(aneis, projetar) {
  const partes = [];
  for (const anel of aneis) {
    if (anel.length < 3) continue;
    const p = anel.map(projetar);
    partes.push(`M${p[0][0]} ${p[0][1]}` + p.slice(1).map((q) => `L${q[0]} ${q[1]}`).join("") + "Z");
  }
  return partes.join("");
}

/** Os anéis externos de um polígono ou multipolígono, já simplificados. */
function aneisDe(geometry, tolerancia) {
  const polis = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polis.map((poli) => simplificar(poli[0], tolerancia)).filter((a) => a.length >= 3);
}

// ---------------------------------------------------------------------------

const fonte = process.argv[2];
if (!fonte) {
  throw new Error("falta o caminho do geojson. Rode: node scripts/gerar-malha-sp.mjs <arquivo>");
}

const fc = JSON.parse(readFileSync(fonte, "utf8"));
if (!Array.isArray(fc.features) || fc.features.length === 0) {
  throw new Error("o geojson não tem feições");
}

const LARGURA = 600;
const janela = janelaDe(fc.features);
const { altura, projetar } = projetorDe(janela, LARGURA);

let pontosAntes = 0;
let pontosDepois = 0;
const contar = (o) => {
  if (typeof o[0] === "number") {
    pontosAntes += 1;
    return;
  }
  for (const x of o) contar(x);
};
for (const f of fc.features) contar(f.geometry.coordinates);

const municipios = fc.features
  .map((f) => {
    const p = f.properties;
    const aneis = aneisDe(f.geometry, TOLERANCIA);
    for (const a of aneis) pontosDepois += a.length;
    const [cx, cy] = projetar([p.lng, p.lat]);
    return {
      id: String(p.id),
      nome: String(p.nome),
      regiao: String(p.regiao ?? ""),
      populacao: Number(p.populacao ?? 0),
      equipamentos: Number(p.total ?? 0),
      taxa: Number(p.taxa_10k ?? 0),
      d: caminhoDe(aneis, projetar),
      cx,
      cy,
    };
  })
  .sort((a, b) => a.nome.localeCompare(b.nome, "pt"));

const comEquipamento = municipios.filter((m) => m.equipamentos > 0).length;
const totalDeEquipamentos = municipios.reduce((s, m) => s + m.equipamentos, 0);
const populacao = municipios.reduce((s, m) => s + m.populacao, 0);
const maiorTaxa = municipios.reduce((s, m) => (m.taxa > s ? m.taxa : s), 0);

const CABECA = `/**
 * malha-sp.ts, os ${municipios.length} municípios de São Paulo como caminho SVG.
 *
 * GERADO por \`scripts/gerar-malha-sp.mjs\`. Não edite à mão: rode o script de novo.
 *
 * A FONTE. Equipamentos culturais de OpenStreetMap sob ODbL, colhidos por Overpass; limites
 * municipais e população de 2024 do IBGE. Os números vieram medidos, e nenhum foi escrito
 * aqui à mão.
 *
 * O QUE ESTE ARQUIVO EVITA. O mapa de origem é Leaflet com tiles do Esri e um \`fetch\` de
 * 1,06 MB. Nada disso atravessa: o polígono É o mapa, projetado no build, e o navegador
 * recebe caminho pronto. Os dois portões de rede continuam medindo zero.
 *
 * A SIMPLIFICAÇÃO, declarada: Douglas-Peucker a ${TOLERANCIA} grau derrubou
 * ${pontosAntes.toLocaleString("pt-BR")} pontos para ${pontosDepois.toLocaleString("pt-BR")}.
 * A silhueta de um município continua reconhecível nesta escala; sem o corte seriam uns
 * 506 KB de atributo \`d\`.
 *
 * A JANELA É DO ESTADO, e não a do Brasil de \`geo.ts\`: São Paulo naquela projeção viraria
 * um borrão. A altura sai da largura pela razão real das coordenadas, para o estado não
 * achatar.
 */

export interface MunicipioDesenhado {
  id: string;
  nome: string;
  regiao: string;
  populacao: number;
  /** Equipamentos culturais mapeados: museu, galeria, teatro, cinema, biblioteca, centro. */
  equipamentos: number;
  /** Equipamentos por 10 mil habitantes. */
  taxa: number;
  /** O polígono já projetado, atributo \`d\` de \`<path>\`. */
  d: string;
  cx: number;
  cy: number;
}

export const VIEW_BOX_SP = "0 0 ${LARGURA} ${altura}";

/** O que a legenda declara, e o que os portões conferem. */
export const FONTE_DA_MALHA =
  "Equipamentos: OpenStreetMap, licença ODbL. Limites municipais e população 2024: IBGE.";

export const NUMEROS_DA_MALHA = {
  municipios: ${municipios.length},
  comEquipamento: ${comEquipamento},
  semEquipamento: ${municipios.length - comEquipamento},
  equipamentos: ${totalDeEquipamentos},
  populacao: ${populacao},
  maiorTaxa: ${maiorTaxa},
  tolerancia: ${TOLERANCIA},
  pontos: ${pontosDepois},
} as const;

export const MALHA_SP: readonly MunicipioDesenhado[] = `;

const corpo = JSON.stringify(municipios, null, 0).replace(/\},\{/g, "},\n  {").replace(/^\[/, "[\n  ").replace(/\]$/, ",\n]");

writeFileSync(SAIDA, CABECA + corpo + ";\n", "utf8");

console.log(`  municípios ....... ${municipios.length}`);
console.log(`  com equipamento .. ${comEquipamento}`);
console.log(`  sem equipamento .. ${municipios.length - comEquipamento}`);
console.log(`  equipamentos ..... ${totalDeEquipamentos}`);
console.log(`  população ........ ${populacao.toLocaleString("pt-BR")}`);
console.log(`  pontos ........... ${pontosAntes.toLocaleString("pt-BR")} para ${pontosDepois.toLocaleString("pt-BR")}`);
console.log(`  viewBox .......... 0 0 ${LARGURA} ${altura}`);
console.log(`  escrito em ....... ${path.relative(RAIZ, SAIDA)}`);
