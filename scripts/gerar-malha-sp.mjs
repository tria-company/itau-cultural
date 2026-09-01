/**
 * gerar-malha-sp.mjs, o mapa de equipamentos culturais de São Paulo virando desenho e dado.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE ELE EXISTE. O mapa de origem é Leaflet: carrega a biblioteca de um CDN, os tiles
 * do Esri, `leaflet.heat` de um segundo CDN, e busca 1,67 MB de geojson e pontos em runtime.
 * São cinco requisições de rede num projeto cujos portões medem zero (D-60). O que se
 * aproveita é o DADO e a LEITURA, nunca o mecanismo.
 *
 * ELE PRECISA ENTREGAR AS FUNÇÕES, e não só o desenho. O mapa de origem tem seis camadas
 * ligáveis, três filtros, uma linha do tempo de 2020 a 2026, o cálculo dos três equipamentos
 * mais próximos do cursor, e um ranking clicável. Tudo isso é aritmética sobre 2.503 pontos,
 * e aritmética roda no navegador sem pedir nada para ninguém. O que este script faz é deixar
 * o dado pronto para ela: projetado, indexado, e com as constantes que permitem desprojetar.
 *
 * O CICLO DE VIDA É REPRODUZIDO, NÃO REINVENTADO. O original inventa abertura e fechamento
 * de cada equipamento com um hash FNV-1a de `nome|lat|lng|tipo`, o que é determinístico: a
 * mesma entrada dá o mesmo ano, sempre. Reimplementar o mesmo hash aqui produz exatamente a
 * mesma série 2020 a 2026 que o mapa enviado mostra, e não uma parecida. Se fosse
 * `Math.random()` não daria para portar, porque o projeto proíbe (determinismo) e porque a
 * série mudaria a cada carga.
 *
 * A GRADE DO DESERTO VEM MEDIDA. O original varre células de 0,05 grau dentro do retângulo
 * de São Paulo, descarta as que caem fora do estado, e marca as que estão a 20 km ou mais do
 * equipamento mais próximo. O teste «está dentro do estado» é ponto-em-polígono contra 645
 * municípios e não muda com filtro nem com ano, então ele é feito aqui, uma vez, e vira uma
 * máscara de bits. O teste de distância depende do filtro e do ano, e fica no navegador.
 *
 * A SIMPLIFICAÇÃO É DECLARADA. Sem ela são 43.177 pontos de contorno, cerca de 506 KB de
 * atributo `d`. Douglas-Peucker a 0,02 grau derruba para perto de 6.400, uns 75 KB.
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

/** A partir de quantos km do equipamento mais próximo uma célula é deserto. */
const KM_DO_DESERTO = 20;

/** O passo da grade do deserto, em grau. 0,05 é cerca de 5,5 km, como no original. */
const PASSO_DA_GRADE = 0.05;

/**
 * O retângulo de São Paulo do original, `SP_BOUNDS` em `app.js:2`.
 *
 * ELE NÃO SAI DA MALHA. Usar o retângulo real dos polígonos deslocaria a grade e as células
 * não cairiam nos mesmos lugares. A grade tem que ser a mesma para o deserto ser o mesmo.
 */
const CAIXA_SP = { sul: -25.35, norte: -19.75, oeste: -53.15, leste: -44.12 };

/** Os anos da série do original, `YEAR_MIN` e `YEAR_MAX` em `app.js:4`. */
const ANO_MIN = 2020;
const ANO_MAX = 2026;

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
 * calculado da própria malha, e a altura sai da largura pela razão real das coordenadas.
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
    unidades,
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

/**
 * FNV-1a de 32 bits, o mesmo de `app.js:706`.
 *
 * ELE TEM QUE SER IDÊNTICO, byte a byte, senão a linha do tempo daria outra série. É por
 * causa dele que o ciclo de vida é reproduzível: mesma entrada, mesmo ano, sempre.
 */
function fnv1a(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Ponto dentro de um anel, por travessia de raio. Mesmo teste do original. */
function dentroDoAnel(lon, lat, anel) {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i, i += 1) {
    const [xi, yi] = anel[i];
    const [xj, yj] = anel[j];
    const cruza = yi > lat !== yj > lat;
    if (cruza && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
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
const { altura, unidades, projetar } = projetorDe(janela, LARGURA);

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

// ---------------------------------------------------------------------------
// Os municípios
// ---------------------------------------------------------------------------

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
      /** O índice de volume do original, de 0 a 100. É ele que tinge a camada de áreas. */
      indice: Number(p.indice ?? 0),
      d: caminhoDe(aneis, projetar),
      cx,
      cy,
      _aneis: aneis,
      _lat: p.lat,
      _lng: p.lng,
    };
  })
  .sort((a, b) => a.nome.localeCompare(b.nome, "pt"));

/** De id do IBGE para a posição na malha, que é como o ponto acha o município dele. */
const posicaoDoMunicipio = new Map(municipios.map((m, i) => [m.id, i]));

// ---------------------------------------------------------------------------
// Os equipamentos
// ---------------------------------------------------------------------------

/**
 * DOIS GRUPOS, E SÃO OS DO MAPA DE ORIGEM: `museu_teatro` reúne museu, teatro, cinema e
 * galeria; `biblioteca_centro` reúne biblioteca, centro cultural e centro comunitário.
 */
const GRUPO = { museu_teatro: 0, biblioteca_centro: 1 };

/** Os sete rótulos de tipo. Índice em vez do nome: repetido 2.503 vezes ele custaria caro. */
const TIPOS = [
  "Museu",
  "Cinema",
  "Biblioteca",
  "Teatro",
  "Centro comunitário",
  "Centro cultural",
  "Galeria",
];

/**
 * O ciclo de vida, reproduzido de `app.js:716`.
 *
 * A REGRA, LITERAL: com 52% de chance o equipamento já existia antes da série e abre entre
 * 2008 e 2019; senão ele abre dentro da série. Com 20% de chance ele fecha, nunca antes do
 * ano seguinte ao de abertura. As três «chances» saem de fatias do mesmo hash, então nada
 * disso é aleatório: é uma função do nome e da coordenada.
 */
function cicloDeVida(p) {
  const h = fnv1a(`${p.nome}|${p.lat}|${p.lng}|${p.tipo}`);
  const r1 = (h % 1000) / 1000;
  const r2 = ((h >>> 8) % 1000) / 1000;
  const r3 = ((h >>> 16) % 1000) / 1000;

  const anoInicio =
    r1 < 0.52
      ? 2008 + Math.floor(r2 * 12)
      : ANO_MIN + Math.floor(r2 * (ANO_MAX - ANO_MIN + 1));

  let anoFim = 0;
  if (r3 < 0.2) {
    const maisCedo = Math.max(anoInicio + 1, ANO_MIN);
    if (maisCedo <= ANO_MAX) {
      const vao = ANO_MAX - maisCedo + 1;
      anoFim = maisCedo + Math.floor((((h >>> 4) % 1000) / 1000) * vao);
    }
  }
  return { anoInicio, anoFim };
}

const equipamentos = hotspots
  .filter((h) => Number.isFinite(h.lat) && Number.isFinite(h.lng))
  .map((h) => {
    const [x, y] = projetar([h.lng, h.lat]);
    const { anoInicio, anoFim } = cicloDeVida(h);
    return {
      x,
      y,
      lat: h.lat,
      lon: h.lng,
      grupo: GRUPO[h.tipo] ?? 0,
      tipo: Math.max(0, TIPOS.indexOf(h.tipoLabel)),
      municipio: posicaoDoMunicipio.get(String(h.municipioId)) ?? -1,
      /** 0,55 para museu e teatro; 0,4 para o resto. Só dois valores, então cabe num bit. */
      forte: h.mag >= 0.5 ? 1 : 0,
      nome: String(h.nome),
      anoInicio,
      anoFim,
    };
  });

const porGrupo = [0, 0];
for (const e of equipamentos) porGrupo[e.grupo] += 1;

// ---------------------------------------------------------------------------
// A grade do deserto
// ---------------------------------------------------------------------------

/**
 * QUAIS CÉLULAS CAEM DENTRO DO ESTADO. Não depende de filtro nem de ano, então é medido uma
 * vez aqui. O teste de distância, esse sim depende, e fica no navegador.
 */
const colunas = Math.ceil((CAIXA_SP.leste - CAIXA_SP.oeste) / PASSO_DA_GRADE);
const linhas = Math.ceil((CAIXA_SP.norte - CAIXA_SP.sul) / PASSO_DA_GRADE);

// Uma caixa por município acelera o ponto-em-polígono de 645 testes para uns poucos.
const caixas = municipios.map((m) => {
  let lonMin = 180;
  let lonMax = -180;
  let latMin = 90;
  let latMax = -90;
  for (const anel of m._aneis) {
    for (const [lon, lat] of anel) {
      if (lon < lonMin) lonMin = lon;
      if (lon > lonMax) lonMax = lon;
      if (lat < latMin) latMin = lat;
      if (lat > latMax) latMax = lat;
    }
  }
  return { lonMin, lonMax, latMin, latMax, aneis: m._aneis };
});

function dentroDoEstado(lon, lat) {
  for (const c of caixas) {
    if (lon < c.lonMin || lon > c.lonMax || lat < c.latMin || lat > c.latMax) continue;
    for (const anel of c.aneis) if (dentroDoAnel(lon, lat, anel)) return true;
  }
  return false;
}

let mascara = "";
let celulasDentro = 0;
for (let i = 0; i < linhas; i += 1) {
  for (let j = 0; j < colunas; j += 1) {
    const lat = CAIXA_SP.sul + i * PASSO_DA_GRADE + PASSO_DA_GRADE / 2;
    const lon = CAIXA_SP.oeste + j * PASSO_DA_GRADE + PASSO_DA_GRADE / 2;
    const dentro = dentroDoEstado(lon, lat);
    if (dentro) celulasDentro += 1;
    mascara += dentro ? "1" : "0";
  }
}

// Quantas dessas células estão a 20 km ou mais de tudo, com o acervo inteiro. É o número que
// a tela declara antes de qualquer filtro, e ele é medido, não estimado.
let celulasDesertas = 0;
for (let i = 0; i < linhas; i += 1) {
  for (let j = 0; j < colunas; j += 1) {
    if (mascara[i * colunas + j] !== "1") continue;
    const lat = CAIXA_SP.sul + i * PASSO_DA_GRADE + PASSO_DA_GRADE / 2;
    const lon = CAIXA_SP.oeste + j * PASSO_DA_GRADE + PASSO_DA_GRADE / 2;
    let perto = Infinity;
    for (const e of equipamentos) {
      const d = km(lat, lon, e.lat, e.lon);
      if (d < perto) perto = d;
      if (perto < KM_DO_DESERTO) break;
    }
    if (perto >= KM_DO_DESERTO) celulasDesertas += 1;
  }
}

// ---------------------------------------------------------------------------
// Os números
// ---------------------------------------------------------------------------

const comEquipamento = municipios.filter((m) => m.equipamentos > 0).length;
const totalDeEquipamentos = municipios.reduce((s, m) => s + m.equipamentos, 0);
const populacao = municipios.reduce((s, m) => s + m.populacao, 0);
const maiorTaxa = municipios.reduce((s, m) => (m.taxa > s ? m.taxa : s), 0);
const maiorIndice = municipios.reduce((s, m) => (m.indice > s ? m.indice : s), 0);

/** Um vetor por campo, e não um objeto por ponto: o nome do campo repetido 2.503 vezes é o
 *  maior custo de um arranjo de objetos, e aqui ele aparece uma vez. */
const vetor = (f) => JSON.stringify(equipamentos.map(f));
const bits = (f) => JSON.stringify(equipamentos.map(f).join(""));

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
 * ELE CARREGA AS FUNÇÕES, e não só o desenho. Os vetores abaixo existem para o navegador
 * poder refazer, sem pedir nada a ninguém, o que o original faz: filtrar por tipo, andar na
 * linha do tempo, achar os três equipamentos mais próximos do cursor, e desenhar o deserto.
 *
 * O CICLO DE VIDA É O MESMO, e não um parecido: o original o deriva de um FNV-1a de
 * \`nome|lat|lng|tipo\`, que é determinístico, e o gerador reimplementa o mesmo hash.
 *
 * A SIMPLIFICAÇÃO, declarada: Douglas-Peucker a ${TOLERANCIA} grau derrubou
 * ${pontosAntes.toLocaleString("pt-BR")} pontos de contorno para ${pontosDepois.toLocaleString("pt-BR")}.
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
  /** O índice de volume do original, de 0 a 100. Tinge a camada de quantidade. */
  indice: number;
  /** O polígono já projetado, atributo \`d\` de \`<path>\`. */
  d: string;
  cx: number;
  cy: number;
}

export const VIEW_BOX_SP = "0 0 ${LARGURA} ${altura}";
export const LARGURA_SP = ${LARGURA};
export const ALTURA_SP = ${altura};

/**
 * Como desprojetar: \`lon = LON_MIN + x / UNIDADES\` e \`lat = LAT_MAX - y / UNIDADES\`.
 *
 * ELAS EXISTEM PARA O CURSOR. A distância que a tela mostra é em quilômetros, e quilômetro
 * exige latitude e longitude de verdade. Guardar lat e lon de cada ponto seria guardar duas
 * vezes a mesma informação, já que a projeção é linear e inversível com três números.
 */
export const LON_MIN = ${janela.lonMin};
export const LAT_MAX = ${janela.latMax};
export const UNIDADES = ${unidades};

/** O corte do deserto, em km, e o passo da grade, em grau. Do original. */
export const KM_DO_DESERTO = ${KM_DO_DESERTO};
export const PASSO_DA_GRADE = ${PASSO_DA_GRADE};
export const CAIXA_SP = ${JSON.stringify(CAIXA_SP)};
export const GRADE_COLUNAS = ${colunas};
export const GRADE_LINHAS = ${linhas};

/** Os anos da série da linha do tempo. */
export const ANO_MIN = ${ANO_MIN};
export const ANO_MAX = ${ANO_MAX};

/** Os sete rótulos de tipo, na ordem em que \`TIPO_DO_PONTO\` os indexa. */
export const TIPOS_DE_EQUIPAMENTO = ${JSON.stringify(TIPOS)} as const;

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
  maiorIndice: ${maiorIndice},
  /** Células da grade dentro do estado, e quantas delas ficam a ${KM_DO_DESERTO} km ou mais. */
  celulasDentro: ${celulasDentro},
  celulasDesertas: ${celulasDesertas},
  tolerancia: ${TOLERANCIA},
  pontos: ${pontosDepois},
} as const;

/**
 * A máscara da grade: um caractere por célula, '1' dentro do estado e '0' fora.
 *
 * ${linhas} linhas por ${colunas} colunas. Uma string de ${linhas * colunas} caracteres pesa o mesmo que
 * ${celulasDentro.toLocaleString("pt-BR")} índices numéricos e dispensa desempacotar.
 */
export const MASCARA_DA_GRADE =
  ${JSON.stringify(mascara)};

/** Os ${equipamentos.length} equipamentos, por campo. */
export const X_DO_PONTO: readonly number[] = ${vetor((e) => e.x)};
export const Y_DO_PONTO: readonly number[] = ${vetor((e) => e.y)};
/** '0' museu, teatro, cinema e galeria; '1' biblioteca e centro. */
export const GRUPO_DO_PONTO: string = ${bits((e) => e.grupo)};
/** Índice em \`TIPOS_DE_EQUIPAMENTO\`. */
export const TIPO_DO_PONTO: string = ${bits((e) => e.tipo)};
/** '1' quando o ponto pesa 0,55 no original, '0' quando pesa 0,4. */
export const FORTE_DO_PONTO: string = ${bits((e) => e.forte)};
/** Posição do município em \`MALHA_SP\`, ou -1. */
export const MUNICIPIO_DO_PONTO: readonly number[] = ${vetor((e) => e.municipio)};
export const ANO_INICIO_DO_PONTO: readonly number[] = ${vetor((e) => e.anoInicio)};
/** 0 quando nunca fechou. */
export const ANO_FIM_DO_PONTO: readonly number[] = ${vetor((e) => e.anoFim)};
export const NOME_DO_PONTO: readonly string[] = ${vetor((e) => e.nome)};

export const MALHA_SP: readonly MunicipioDesenhado[] = `;

const corpo = JSON.stringify(
  municipios.map(({ _aneis, _lat, _lng, ...resto }) => resto),
  null,
  0,
)
  .replace(/\},\{/g, "},\n  {")
  .replace(/^\[/, "[\n  ")
  .replace(/\]$/, ",\n]");

writeFileSync(SAIDA, CABECA + corpo + ";\n", "utf8");

console.log(`  municípios ........... ${municipios.length}`);
console.log(`  com equipamento ...... ${comEquipamento}`);
console.log(`  equipamentos ......... ${totalDeEquipamentos}`);
console.log(`    museus e teatros ... ${porGrupo[0]}`);
console.log(`    bibliotecas/centros  ${porGrupo[1]}`);
console.log(`  grade ................ ${linhas} x ${colunas} = ${(linhas * colunas).toLocaleString("pt-BR")} células`);
console.log(`    dentro do estado ... ${celulasDentro.toLocaleString("pt-BR")}`);
console.log(`    desertas (>= ${KM_DO_DESERTO} km)  ${celulasDesertas.toLocaleString("pt-BR")}`);
console.log(`  população ............ ${populacao.toLocaleString("pt-BR")}`);
console.log(`  maior taxa /10k ...... ${maiorTaxa}`);
console.log(`  contorno ............. ${pontosAntes.toLocaleString("pt-BR")} para ${pontosDepois.toLocaleString("pt-BR")}`);
console.log(`  viewBox .............. 0 0 ${LARGURA} ${altura}`);
console.log(`  escrito em ........... ${path.relative(RAIZ, SAIDA)}`);
