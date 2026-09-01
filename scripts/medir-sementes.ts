/**
 * medir-sementes.ts — a TAREFA 1 da S8, e ela é uma medição, não uma tela.
 *
 * O PRD (`.planning/sessoes/S8-ONBOARDING-CULTURAL.md` §7 L2) proíbe desenhar qualquer
 * tela em cima de um payload que ninguém contou. Este script conta: roda a caminhada
 * a partir de CADA uma das sementes que o onboarding pode oferecer, serializa o
 * resultado em três formatos e diz qual deles cabe debaixo de `TETO_PRECOMPUTO_BYTES`.
 *
 * O que ele NÃO faz: escrever arquivo de precômputo. Ele mede e reporta — a escolha do
 * formato é a tarefa 4, e ela precisa deste número primeiro.
 *
 * Rode com `npm run medir-sementes`.
 */

import { expandir, paraCartao, type Candidato } from "../src/dados/caminhada";
import type { Cartao } from "../src/dados/cartao";
import { porId, porSlug, slugsPorTipo } from "../src/dados/grafo";
import type { Persona } from "../src/dados/personas";

/** Teto por semente, valor inicial do PRD §4 (S8-02). A válvula (b) baixa para 24. */
const TETO_POR_SEMENTE = Number(process.env.TETO ?? 40);

/** O mesmo teto que `feeds.ts` já impõe ao precômputo de Descobrir. */
const TETO_PRECOMPUTO_BYTES = 1_500_000;

/** Amostra para ensaio rápido: `AMOSTRA=20 npm run medir-sementes`. */
const AMOSTRA = process.env.AMOSTRA ? Number(process.env.AMOSTRA) : 0;

// ---------------------------------------------------------------------------
// O universo de sementes
// ---------------------------------------------------------------------------

interface Semente {
  chave: string;
  tipo: "linguagem" | "entidade";
  /** O que vai para o repertório da persona sintética. */
  valor: string;
}

function universo(): Semente[] {
  const linguagens = slugsPorTipo("linguagem").map<Semente>((slug) => ({
    chave: `l:${slug}`,
    tipo: "linguagem",
    valor: slug,
  }));

  const entidades: Semente[] = [];
  for (const classe of ["pessoa", "obra"] as const) {
    for (const slug of slugsPorTipo(classe)) {
      const e = porSlug(classe, slug);
      if (e) entidades.push({ chave: `e:${e.id}`, tipo: "entidade", valor: e.id });
    }
  }
  return [...linguagens, ...entidades];
}

/**
 * A persona sintética de UMA semente. `expandir` recebe o objeto e usa só o repertório —
 * é por isso que dá para medir sem inventar persona no JSON.
 *
 * O `id` é único por semente porque `CACHE_EXPANSAO` é chaveado por ele: id repetido
 * devolveria a expansão da semente anterior e a medição inteira seria falsa.
 */
function personaDe(s: Semente): Persona {
  return {
    id: `semente:${s.chave}`,
    nome: s.chave,
    resumo: "",
    procedencia: "autorado",
    repertorio: {
      id: `repertorio:${s.chave}`,
      pessoaUsuariaId: `semente:${s.chave}`,
      linguagens: s.tipo === "linguagem" ? [s.valor] : [],
      entidades: s.tipo === "entidade" ? [s.valor] : [],
      ocorrenciasSalvas: [],
      procedencia: "autorado",
    },
  };
}

// ---------------------------------------------------------------------------
// Ordenação dentro da semente
// ---------------------------------------------------------------------------

function hash32(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * O mesmo critério de `ordenarBalde`, na ordem que M-6 fixou: salto primeiro, depois
 * fugir do concentrador, depois ter imagem, e o desempate por hash SEMEADO pela semente —
 * nunca `id.localeCompare`, que é a falha M-4 registrada em `caminhada.ts`.
 */
function ordenar(lista: Candidato[], chave: string): Candidato[] {
  return [...lista].sort((a, b) => {
    if (a.saltos !== b.saltos) return a.saltos - b.saltos;
    if (a.viaConcentrador !== b.viaConcentrador) return a.viaConcentrador ? 1 : -1;
    const ia = a.entidade.imagem ? 0 : 1;
    const ib = b.entidade.imagem ? 0 : 1;
    if (ia !== ib) return ia - ib;
    return hash32(`${chave}|${a.entidade.id}`) - hash32(`${chave}|${b.entidade.id}`);
  });
}

// ---------------------------------------------------------------------------
// Os três formatos medidos
// ---------------------------------------------------------------------------

/** Formato A — cartão inteiro, com `caminho`, repetido em cada semente que o alcança. */
function formatoA(porSemente: Map<string, Cartao[]>): unknown {
  return Object.fromEntries(porSemente);
}

/**
 * Formato B — tabela única de cartões SEM `caminho`, listas de índices por semente, e o
 * caminho guardado à parte por par (semente, cartão).
 *
 * O `caminho` não cabe na tabela única: o mesmo cartão alcançado por duas sementes tem
 * dois caminhos diferentes, e é o caminho que carrega a frase do motivo.
 */
function formatoB(porSemente: Map<string, Cartao[]>): {
  cartoes: unknown[];
  listas: Record<string, number[]>;
  caminhos: Record<string, unknown[]>;
} {
  const indice = new Map<string, number>();
  const cartoes: unknown[] = [];
  const listas: Record<string, number[]> = {};
  const caminhos: Record<string, unknown[]> = {};

  for (const [chave, lista] of porSemente) {
    const ids: number[] = [];
    const cams: unknown[] = [];
    for (const c of lista) {
      let i = indice.get(c.id);
      if (i === undefined) {
        const { caminho: _caminho, motivo: _motivo, ...semCaminho } = c;
        i = cartoes.push(semCaminho) - 1;
        indice.set(c.id, i);
      }
      ids.push(i);
      cams.push({ motivo: c.motivo, caminho: c.caminho });
    }
    listas[chave] = ids;
    caminhos[chave] = cams;
  }
  return { cartoes, listas, caminhos };
}

/**
 * Formato C — igual ao B, mas o caminho vira só os IDS dos passos: a frase é remontada
 * na tela a partir do vocabulário de relação. É a válvula (c) do PRD.
 */
function formatoC(porSemente: Map<string, Cartao[]>): {
  cartoes: unknown[];
  listas: Record<string, number[]>;
  passos: Record<string, string[][]>;
} {
  const indice = new Map<string, number>();
  const cartoes: unknown[] = [];
  const listas: Record<string, number[]> = {};
  const passos: Record<string, string[][]> = {};

  for (const [chave, lista] of porSemente) {
    const ids: number[] = [];
    const ps: string[][] = [];
    for (const c of lista) {
      let i = indice.get(c.id);
      if (i === undefined) {
        const { caminho: _caminho, motivo: _motivo, ...semCaminho } = c;
        i = cartoes.push(semCaminho) - 1;
        indice.set(c.id, i);
      }
      ids.push(i);
      ps.push(c.caminho.map((p) => `${p.deId}>${p.relacao}>${p.paraId}`));
    }
    listas[chave] = ids;
    passos[chave] = ps;
  }
  return { cartoes, listas, passos };
}

/**
 * Formato D — o que o formato C não viu: `caminho` é 56% do peso e `motivo` 18%, medidos.
 *
 * O truque não é comprimir, é NÃO GUARDAR O QUE SE DERIVA. Um passo composto é
 * `relacao` + os títulos das duas pontas — e os dois títulos já estão no dicionário de
 * nós. Só o passo ESCRITO carrega texto do acervo, que não se deriva de nada e por isso
 * é o único que viaja como string, deduplicado numa tabela à parte.
 *
 * Por par (semente, cartão): [idxCartao, codRelacao, idxNoIntermediario, idxTexto].
 * `-1` em qualquer posição é ausência declarada, não zero.
 */
function formatoD(porSemente: Map<string, Cartao[]>): {
  cartoes: unknown[];
  nos: [string, string][];
  textos: string[];
  relacoes: string[];
  listas: Record<string, number[][]>;
  escritos: number;
  compostos: number;
} {
  const idxCartao = new Map<string, number>();
  const cartoes: unknown[] = [];
  const idxNo = new Map<string, number>();
  const nos: [string, string][] = [];
  const idxTexto = new Map<string, number>();
  const textos: string[] = [];
  const idxRelacao = new Map<string, number>();
  const relacoes: string[] = [];
  const listas: Record<string, number[][]> = {};
  let escritos = 0;
  let compostos = 0;

  const no = (id: string, titulo: string): number => {
    let i = idxNo.get(id);
    if (i === undefined) {
      i = nos.push([id, titulo]) - 1;
      idxNo.set(id, i);
    }
    return i;
  };
  const texto = (t: string): number => {
    let i = idxTexto.get(t);
    if (i === undefined) {
      i = textos.push(t) - 1;
      idxTexto.set(t, i);
    }
    return i;
  };
  const relacao = (r: string): number => {
    let i = idxRelacao.get(r);
    if (i === undefined) {
      i = relacoes.push(r) - 1;
      idxRelacao.set(r, i);
    }
    return i;
  };

  for (const [chave, lista] of porSemente) {
    const linhas: number[][] = [];
    for (const c of lista) {
      let ic = idxCartao.get(c.id);
      if (ic === undefined) {
        const { caminho: _caminho, motivo: _motivo, ...enxuto } = c;
        ic = cartoes.push(enxuto) - 1;
        idxCartao.set(c.id, ic);
      }
      // O nó do meio: em 2 saltos é a ponta de chegada do primeiro passo.
      const meio = c.caminho.length > 1 ? c.caminho[0] : undefined;
      const iMeio = meio ? no(meio.paraId, meio.paraTitulo) : -1;
      const iRel = c.motivo.relacao ? relacao(c.motivo.relacao) : -1;
      const iTexto = c.motivo.origemMotivo === "escrito" ? texto(c.motivo.texto) : -1;
      if (c.motivo.origemMotivo === "escrito") escritos++;
      else compostos++;
      linhas.push([ic, iRel, iMeio, iTexto]);
    }
    listas[chave] = linhas;
  }
  return { cartoes, nos, textos, relacoes, listas, escritos, compostos };
}

function kb(n: number): string {
  return `${(n / 1024).toFixed(0)} KB`;
}

function mb(n: number): string {
  return `${(n / 1_048_576).toFixed(2)} MB`;
}

function pesar(valor: unknown): number {
  return Buffer.byteLength(JSON.stringify(valor), "utf8");
}

// ---------------------------------------------------------------------------
// Medição
// ---------------------------------------------------------------------------

const todas = universo();
const sementes = AMOSTRA > 0 ? todas.slice(0, AMOSTRA) : todas;

console.log(`\nUNIVERSO: ${todas.length} sementes`);
console.log(
  `  linguagens ${todas.filter((s) => s.tipo === "linguagem").length} · ` +
    `entidades ${todas.filter((s) => s.tipo === "entidade").length}`,
);
if (AMOSTRA > 0) console.log(`  MEDINDO AMOSTRA DE ${sementes.length}`);
console.log(`  teto por semente: ${TETO_POR_SEMENTE} cartões\n`);

const inicio = Date.now();
const porSemente = new Map<string, Cartao[]>();
const alcance: number[] = [];
let vazias = 0;

for (let i = 0; i < sementes.length; i++) {
  const s = sementes[i];
  const expansao = expandir(personaDe(s));
  const candidatos = expansao.candidatos.filter((c) => c.entidade.id !== s.valor);
  alcance.push(candidatos.length);
  if (candidatos.length === 0) vazias++;
  const escolhidos = ordenar(candidatos, s.chave).slice(0, TETO_POR_SEMENTE);
  porSemente.set(
    s.chave,
    escolhidos.map((c) => paraCartao(c)),
  );
  if ((i + 1) % 100 === 0) {
    const mem = process.memoryUsage().heapUsed;
    console.log(
      `  ${i + 1}/${sementes.length} · ${((Date.now() - inicio) / 1000).toFixed(0)}s · heap ${mb(mem)}`,
    );
  }
}

const segundos = (Date.now() - inicio) / 1000;

// --- alcance ---
alcance.sort((a, b) => a - b);
const mediana = alcance[Math.floor(alcance.length / 2)] ?? 0;
const distintos = new Set<string>();
for (const lista of porSemente.values()) for (const c of lista) distintos.add(c.id);

console.log(`\nALCANCE (candidatos de 1 e 2 saltos, antes do teto)`);
console.log(`  mediana ${mediana} · mínimo ${alcance[0]} · máximo ${alcance[alcance.length - 1]}`);
console.log(`  sementes que não alcançam nada: ${vazias}`);
console.log(`  cartões DISTINTOS no conjunto todo: ${distintos.size}`);
console.log(`  tempo da caminhada: ${segundos.toFixed(0)}s`);

// --- payload ---
const a = pesar(formatoA(porSemente));
const b = formatoB(porSemente);
const c = formatoC(porSemente);
const bTotal = pesar(b);
const cTotal = pesar(c);

console.log(`\nPAYLOAD SERIALIZADO`);
console.log(`  A · cartão inteiro por semente ............ ${mb(a)}`);
console.log(
  `  B · tabela + índices + caminhos .......... ${mb(bTotal)}` +
    `   (cartões ${kb(pesar(b.cartoes))} · índices ${kb(pesar(b.listas))} · caminhos ${kb(pesar(b.caminhos))})`,
);
console.log(
  `  C · tabela + índices + passos como ids ... ${mb(cTotal)}` +
    `   (cartões ${kb(pesar(c.cartoes))} · índices ${kb(pesar(c.listas))} · passos ${kb(pesar(c.passos))})`,
);


const d = formatoD(porSemente);
const dTotal = pesar({
  cartoes: d.cartoes,
  nos: d.nos,
  textos: d.textos,
  relacoes: d.relacoes,
  listas: d.listas,
});
console.log(
  `  D · tabela + nós + textos escritos ....... ${mb(dTotal)}` +
    `   (cartões ${kb(pesar(d.cartoes))} · nós ${kb(pesar(d.nos))} · textos ${kb(pesar(d.textos))} · listas ${kb(pesar(d.listas))})`,
);
console.log(
  `      motivos: escritos ${d.escritos} · compostos ${d.compostos} · textos distintos ${d.textos.length} · nós distintos ${d.nos.length}`,
);


// --- Formato E: guardar o TEXTO do motivo, deduplicado. Duplicar COMPOSITORES no
// cliente seria a regra escrita duas vezes, que diverge na primeira edição.
{
  const textos = new Map<string, number>();
  const linhas: number[][] = [];
  const idxC = new Map<string, number>();
  const cartoesE: unknown[] = [];
  for (const [, lista] of porSemente) {
    for (const c of lista) {
      let ic = idxC.get(c.id);
      if (ic === undefined) {
        const { caminho: _cam, motivo: _mot, ...enxuto } = c;
        ic = cartoesE.push(enxuto) - 1;
        idxC.set(c.id, ic);
      }
      let it = textos.get(c.motivo.texto);
      if (it === undefined) {
        it = textos.size;
        textos.set(c.motivo.texto, it);
      }
      linhas.push([ic, it]);
    }
  }
  const tabela = [...textos.keys()];
  console.log(
    `  E · tabela + textos de motivo dedup ...... ` +
      `${mb(pesar({ cartoes: cartoesE, textos: tabela, listas: linhas }))}` +
      `   (textos distintos ${tabela.length} de ${linhas.length} · ${kb(pesar(tabela))})`,
  );
}

console.log(`\nTETO: ${mb(TETO_PRECOMPUTO_BYTES)} (compartilhado com o precômputo de feeds.ts)`);
for (const [nome, peso] of [
  ["A", a],
  ["B", bTotal],
  ["C", cTotal],
  ["D", dTotal],
] as const) {
  const veredito = peso <= TETO_PRECOMPUTO_BYTES ? "CABE" : "ESTOURA";
  console.log(`  ${nome}: ${veredito} (${((peso / TETO_PRECOMPUTO_BYTES) * 100).toFixed(0)}% do teto)`);
}
console.log("");

// ---------------------------------------------------------------------------
// Composição do cartão — de onde vem o peso
// ---------------------------------------------------------------------------

const amostraCartoes: Cartao[] = [];
for (const lista of porSemente.values()) for (const c of lista) amostraCartoes.push(c);
const campos: Record<string, number> = {};
for (const c of amostraCartoes) {
  for (const [k, v] of Object.entries(c)) {
    campos[k] = (campos[k] ?? 0) + Buffer.byteLength(JSON.stringify(v), "utf8");
  }
}
console.log("PESO POR CAMPO DO CARTÃO (somado sobre todas as ocorrências)");
for (const [k, v] of Object.entries(campos).sort((x, y) => y[1] - x[1])) {
  console.log(`  ${k.padEnd(16)} ${kb(v)}`);
}

// Quantas sementes VAZIAS têm rosto — elas não podem entrar na grade.
const semRosto = { comRosto: 0, semRosto: 0 };
for (const s of sementes) {
  if ((porSemente.get(s.chave) ?? []).length > 0) continue;
  const e = s.tipo === "entidade" ? porId(s.valor) : undefined;
  if (e?.imagem) semRosto.comRosto++;
  else semRosto.semRosto++;
}
console.log(
  `\nSEMENTES QUE NÃO ALCANÇAM NADA: ${vazias} — com rosto ${semRosto.comRosto} · sem rosto ${semRosto.semRosto}`,
);
console.log("");
