/**
 * gerar-malha-sp.mjs, o mapa de equipamentos culturais de São Paulo virando desenho.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE ELE EXISTE. O mapa de origem é Leaflet: carrega a biblioteca de um CDN, os tiles
 * do Esri, `leaflet.heat` de um segundo CDN, e busca 1,06 MB de geojson mais 614 KB de
 * pontos em runtime. São cinco requisições de rede num projeto cujos portões medem zero
 * (D-60). O que se aproveita é o DADO e a LEITURA, nunca o mecanismo.
 *
 * O POLÍGONO É O MAPA. Sem tile, sem base cartográfica de terceiro: 645 municípios
 * desenhados como `<path>`, projetados aqui no build. É o mesmo caminho que
 * `contorno-brasil.ts` já percorre, e a mesma função `caminhoDe` que o resto do produto usa.
 *
 * OS PONTOS SÃO A METADE QUE FALTAVA. A primeira porta deste script trouxe só o coroplético,
 * e coroplético sozinho não é aquele mapa: o que se vê nele é a NUVEM DE EQUIPAMENTOS, em
 * duas cores, adensando na capital e rareando no interior. São 2.503 pontos, e eles cabem:
 * projetados e arredondados, saem como tupla e viram `<circle>` no HTML do build.
 *
 * O DESERTO CULTURAL É CALCULADO AQUI, e não escrito à mão. Para cada município, a distância
 * do centro ao equipamento mais próximo, por Haversine; a partir de 20 km ele é deserto, que
 * é o corte que o mapa de origem usa. É transformação, e reexecutar reproduz o mesmo número.
 *
 * A SIMPLIFICAÇÃO É DECLARADA. Sem ela são 43.177 pontos de contorno, cerca de 506 KB de
 * atributo `d`. Douglas-Peucker a 0,02 grau derruba para perto de 6.400, uns 75 KB, e a essa
 * escala a silhueta de um município continua reconhecível. O número está no arquivo gerado.
 *
 * REEXECUTÁVEL, e é isso que prova que é transformação e não invenção (D-15). Rodar duas
 * vezes sobre a mesma fonte produz o mesmo arquivo.
 *
 * Rode com: node scripts/gerar-malha-sp.mjs <sp-municipios.geojson> <hotspots.json>
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

/** A partir de quantos quilômetros do equipamento mais próximo o município é deserto. */
const KM_DO_DESERTO = 20;

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
    partes.push(
      `M${p[0][0]} ${p[0][1]}` + p.slice(1).map((q) => `L${q[0]} ${q[1]}`).join("") + "Z",
    );
  }
  return partes.join("");
}

/** Os anéis externos de um polígono ou multipolígono, já simplificados. */
function aneisDe(geometry, tolerancia) {
  const polis = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polis.map((poli) => simplificar(poli[0], tolerancia)).filter((a) => a.length >= 3);
}

/** Distância em quilômetros entre dois pares lat/lon, por Haversine. */
function km(latA, lonA, latB, lonB) {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (latB - latA) * rad;
  const dLon = (lonB - lonA) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latA * rad) * Math.cos(latB * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

// ---------------------------------------------------------------------------

const fonte = process.argv[2];
const fontePontos = process.argv[3];
if (!fonte || !fontePontos) {
  throw new Error(
    "faltam os caminhos. Rode: node scripts/gerar-malha-sp.mjs <geojson> <hotspots.json>",
  );
}

const fc = JSON.parse(readFileSync(fonte, "utf8"));
if (!Array.isArray(fc.features) || fc.features.length === 0) {
  throw new Error("o geojson não tem feições");
}

const hotspots = JSON.parse(readFileSync(fontePontos, "utf8"));
if (!Array.isArray(hotspots) || hotspots.length === 0) {
  throw new Error("hotspots.json não tem pontos");
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

// ---- Os equipamentos ----
//
// DOIS GRUPOS, E SÃO OS DO MAPA DE ORIGEM: `museu_teatro` reúne museu, teatro, cinema e
// galeria; `biblioteca_centro` reúne biblioteca, centro cultural e centro comunitário. O
// grupo vira 0 ou 1 na tupla, porque o nome inteiro repetido 2.503 vezes seria o maior
// custo do arquivo sem acrescentar nada que o índice não diga.
const GRUPO = { museu_teatro: 0, biblioteca_centro: 1 };

const equipamentos = hotspots
  .filter((h) => Number.isFinite(h.lat) && Number.isFinite(h.lng))
  .map((h) => ({ lat: h.lat, lon: h.lng, grupo: GRUPO[h.tipo] ?? 0 }));

const porGrupo = [0, 0];
for (const e of equipamentos) porGrupo[e.grupo] += 1;

const pontosProjetados = equipamentos.map((e) => {
  const [x, y] = projetar([e.lon, e.lat]);
  return [x, y, e.grupo];
});

// ---- Os municípios ----

const municipios = fc.features
  .map((f) => {
    const p = f.properties;
    const aneis = aneisDe(f.geometry, TOLERANCIA);
    for (const a of aneis) pontosDepois += a.length;
    const [cx, cy] = projetar([p.lng, p.lat]);

    // A DISTÂNCIA AO EQUIPAMENTO MAIS PRÓXIMO, do centro do município. Com equipamento
    // dentro, ela é quase sempre zero; sem, ela é a medida que interessa.
    let perto = Infinity;
    for (const e of equipamentos) {
      const d = km(p.lat, p.lng, e.lat, e.lon);
      if (d < perto) perto = d;
    }

    return {
      id: String(p.id),
      nome: String(p.nome),
      regiao: String(p.regiao ?? ""),
      populacao: Number(p.populacao ?? 0),
      equipamentos: Number(p.total ?? 0),
      taxa: Number(p.taxa_10k ?? 0),
      kmAteOProximo: Number(perto.toFixed(1)),
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
const desertos = municipios.filter((m) => m.kmAteOProximo >= KM_DO_DESERTO).length;
const noDeserto = municipios
  .filter((m) => m.kmAteOProximo >= KM_DO_DESERTO)
  .reduce((s, m) => s + m.populacao, 0);

/** O topo por equipamento por 10 mil habitantes, que é o ranking do mapa de origem. */
const TOPO = 8;
const topoPorTaxa = [...municipios]
  .filter((m) => m.equipamentos > 0)
  .sort((a, b) => b.taxa - a.taxa || a.nome.localeCompare(b.nome, "pt"))
  .slice(0, TOPO)
  .map((m) => ({ nome: m.nome, taxa: m.taxa, equipamentos: m.equipamentos }));

const CABECA = `/**
 * malha-sp.ts, o mapa de equipamentos culturais de São Paulo.
 *
 * GERADO por \`scripts/gerar-malha-sp.mjs\`. Não edite à mão: rode o script de novo.
 *
 * A FONTE. Equipamentos culturais de OpenStreetMap sob ODbL, colhidos por Overpass; limites
 * municipais e população de 2024 do IBGE. Os números vieram medidos, e nenhum foi escrito
 * aqui à mão.
 *
 * O QUE ESTE ARQUIVO EVITA. O mapa de origem é Leaflet com tiles do Esri, \`leaflet.heat\` de
 * um segundo CDN e 1,67 MB de dado buscado em runtime. Nada disso atravessa: o polígono É o
 * mapa e o ponto É o equipamento, projetados no build. Os portões de rede medem zero.
 *
 * SÃO DUAS CAMADAS, e a segunda é a que faltava. O coroplético mostra a taxa por 10 mil
 * habitantes; a nuvem de ${pontosProjetados.length.toLocaleString("pt-BR")} pontos mostra onde
 * os equipamentos estão de fato, em dois grupos, como no mapa de origem.
 *
 * O DESERTO CULTURAL É MEDIDO, e não escrito: distância do centro do município ao
 * equipamento mais próximo, por Haversine, com corte em ${KM_DO_DESERTO} km. Deu
 * ${desertos} municípios.
 *
 * A SIMPLIFICAÇÃO, declarada: Douglas-Peucker a ${TOLERANCIA} grau derrubou
 * ${pontosAntes.toLocaleString("pt-BR")} pontos de contorno para ${pontosDepois.toLocaleString("pt-BR")}.
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
  /** Quilômetros do centro do município ao equipamento mais próximo, em qualquer município. */
  kmAteOProximo: number;
  /** O polígono já projetado, atributo \`d\` de \`<path>\`. */
  d: string;
  cx: number;
  cy: number;
}

/**
 * Um equipamento projetado: \`[x, y, grupo]\`.
 *
 * O GRUPO É ÍNDICE, e não nome: 0 é museu, teatro, cinema e galeria; 1 é biblioteca, centro
 * cultural e centro comunitário. São os dois grupos do mapa de origem, e repetir o nome
 * ${pontosProjetados.length.toLocaleString("pt-BR")} vezes seria o maior custo do arquivo.
 */
export type PontoDeEquipamento = readonly [number, number, 0 | 1];

export const VIEW_BOX_SP = "0 0 ${LARGURA} ${altura}";

/** A partir de quantos km do equipamento mais próximo o município conta como deserto. */
export const KM_DO_DESERTO = ${KM_DO_DESERTO};

/** O que a legenda declara, e o que os portões conferem. */
export const FONTE_DA_MALHA =
  "Equipamentos: OpenStreetMap, licença ODbL. Limites municipais e população 2024: IBGE.";

export const NUMEROS_DA_MALHA = {
  municipios: ${municipios.length},
  comEquipamento: ${comEquipamento},
  semEquipamento: ${municipios.length - comEquipamento},
  equipamentos: ${totalDeEquipamentos},
  /** Museu, teatro, cinema e galeria. */
  museusETeatros: ${porGrupo[0]},
  /** Biblioteca, centro cultural e centro comunitário. */
  bibliotecasECentros: ${porGrupo[1]},
  populacao: ${populacao},
  maiorTaxa: ${maiorTaxa},
  desertos: ${desertos},
  populacaoNoDeserto: ${noDeserto},
  tolerancia: ${TOLERANCIA},
  pontos: ${pontosDepois},
} as const;

/** O topo por equipamento por 10 mil habitantes. */
export const TOPO_POR_TAXA = ${JSON.stringify(topoPorTaxa, null, 2)} as const;

/** Os ${pontosProjetados.length.toLocaleString("pt-BR")} equipamentos, já projetados. */
export const PONTOS_SP: readonly PontoDeEquipamento[] = ${JSON.stringify(pontosProjetados)
  .replace(/\],\[/g, "],\n  [")
  .replace(/^\[/, "[\n  ")
  .replace(/\]$/, ",\n]")};

export const MALHA_SP: readonly MunicipioDesenhado[] = `;

const corpo = JSON.stringify(municipios, null, 0)
  .replace(/\},\{/g, "},\n  {")
  .replace(/^\[/, "[\n  ")
  .replace(/\]$/, ",\n]");

writeFileSync(SAIDA, CABECA + corpo + ";\n", "utf8");

console.log(`  municípios ........... ${municipios.length}`);
console.log(`  com equipamento ...... ${comEquipamento}`);
console.log(`  sem equipamento ...... ${municipios.length - comEquipamento}`);
console.log(`  equipamentos ......... ${totalDeEquipamentos}`);
console.log(`  pontos desenhados .... ${pontosProjetados.length}`);
console.log(`    museus e teatros ... ${porGrupo[0]}`);
console.log(`    bibliotecas/centros  ${porGrupo[1]}`);
console.log(`  desertos (>= ${KM_DO_DESERTO} km) ... ${desertos}`);
console.log(`  gente no deserto ..... ${noDeserto.toLocaleString("pt-BR")}`);
console.log(`  população ............ ${populacao.toLocaleString("pt-BR")}`);
console.log(`  contorno ............. ${pontosAntes.toLocaleString("pt-BR")} para ${pontosDepois.toLocaleString("pt-BR")}`);
console.log(`  viewBox .............. 0 0 ${LARGURA} ${altura}`);
console.log(`  escrito em ........... ${path.relative(RAIZ, SAIDA)}`);
