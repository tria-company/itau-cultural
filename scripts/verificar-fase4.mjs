/**
 * verificar-fase4.mjs — a verificação da fase 4, dirigida por navegador.
 *
 * O QUE ELE MEDE. `out/` — o artefato exportado, servido estaticamente — aberto em Chrome
 * headless por CDP, num viewport de 1440×960. O viewport é o MESMO das três suítes
 * anteriores de propósito: medir noutro viewport mediria outra coisa e os números das
 * quatro fases deixariam de ser comparáveis.
 *
 * O QUE ELE PROVA que nenhuma das outras prova: que a banca pede um cenário FORA DE ORDEM
 * e ele abre. Os cinco cenários do RFP são percorridos POR CLIQUE a partir de `/roteiro`,
 * na ordem 4 → 1 → 5 → 2 → 3. Navegar por endereço digitado prova que a página existe;
 * clicar prova que o PERCURSO existe, e é o percurso que a demonstração é.
 *
 * O QUE ELE NÃO FAZ. Não se pula. Chrome ausente FALHA o script (T-02-22 / T-04-26).
 * Verificação que se autodispensa produz relatório verde sobre nada. E `CHROME_BIN`
 * apontando para caminho inexistente também falha, em vez de cair no Chrome do sistema —
 * verificar num binário diferente do pedido produz relatório sobre outra coisa.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OS SEIS DEFEITOS DE GATE QUE AS FASES 2 E 3 JÁ PAGARAM — herdados corrigidos
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  1. A gramática da lente é `/mapa/#…` COM a barra final. `trailingSlash: true` normaliza
 *     `/mapa#` para `/mapa/#`, e a forma sem barra redireciona ANTES de o fragmento ser
 *     lido. Todo casamento aqui é `/\/mapa\/?#/`.
 *  2. A API real de `navegador.mjs`, que os planos costumam presumir errada: `servir({raiz})`
 *     → `{url, fechar}`; `abrirNavegador()` devolve o `cdp` DIRETO; o método é `navegar`; o
 *     console está em `cdp.consola`; `cdp.clicar` recebe uma EXPRESSÃO JS que avalia para o
 *     elemento, não um seletor CSS. `Network.*` não é acessível de fora — a prova de «zero
 *     requisição externa» é `performance.getEntriesByType('resource')`, medida DENTRO da
 *     página, que enumera todo recurso que o documento pediu.
 *  3. `visiveis()` do prelúdio NÃO serve para SVG: usa `offsetParent`, que só existe em
 *     `HTMLElement`. Forma dentro de SVG se mede pelo RETÂNGULO (`visivelSvg`).
 *  4. «Cabe na primeira vista» é contra a moldura MENOS a barra de abas, sticky no pé,
 *     que cobre os últimos ~59px. AS TRÊS TELAS DESTA FASE SÃO WEB E NÃO TÊM BARRA DE
 *     ABAS — o layout de bastidor não a monta. Aqui a medida é declarada em cada gate:
 *     `limiteUtil` devolve o topo da barra quando ela existe e a base da moldura quando
 *     não existe, e o relatório imprime QUAL das duas foi usada.
 *  5. Comparação de data por STRING é quebrada entre formatos: `"27.06.1967" > "2026-08-22"`
 *     é `true`, porque compara `DD.MM.AAAA` contra ISO caractere a caractere. A comparação
 *     aqui é sempre por ANO de quatro dígitos extraído e convertido a número.
 *  6. Gate que lê arquivo roda sobre a fonte SEM COMENTÁRIOS, casa `data-{atributo}="` com
 *     o igual e a aspa — senão conta o payload RSC —, e casa a instrução de importação POR
 *     INTEIRO, porque `import type` quebrado em cinco linhas derrota casamento por linha.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O SÉTIMO, QUE A FASE 4 PAGOU: gate verde sobre tela quebrada
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 04-04 fechou um gate verde enquanto o índice do roteiro corria PARA FORA da janela. O
 * gate media presença e visibilidade, e um elemento cortado continua «visível» pela
 * definição do prelúdio — quem pegou foi a foto. A lição está aplicada: onde um gate afirma
 * que algo é USÁVEL, e não apenas presente, ele mede GEOMETRIA contra o contêiner —
 * `scrollWidth` contra `clientWidth`, e o retângulo do elemento contra o retângulo da
 * janela. E o script tira fotos das três telas quando `DIR_CAPTURAS` está definida, para um
 * humano julgar o que nenhum gate julga.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O CONTRATO `data-*` DA FASE, E A ARMADILHA QUE ELE ESCONDE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * CINCO dos onze atributos de 04-03 — `data-editando`, `data-impacto`,
 * `data-impacto-fonte`, `data-confirmar`, `data-cancelar` — só existem enquanto uma linha
 * está EM EDIÇÃO, e nada abre uma linha sem clique. No HTML exportado eles medem 0, e um
 * gate que os procurasse por grep concluiria que o contrato foi quebrado quando ele está
 * intacto. Aqui eles são medidos no DOM DEPOIS do clique em «alterar horário». Mesma
 * natureza de `data-decisao` em 04-02, que nasce em 0 e é isso que T-04-07 exige.
 *
 * E o que a onda 2 mudou de lugar, e este arquivo casa como está e não como estava:
 * `data-campo` usa `chave-identidade` COM HÍFEN; `data-grupo` desceu do painel para as 84
 * linhas da fila e o painel ficou com `data-grupo-escolhido`, então `[data-grupo]` é 84 e
 * não 85 — e continua 84 depois de uma decisão, porque o grupo decidido migra para
 * «decisões tomadas» em vez de sumir; `data-nao-sustenta` são TRÊS blocos na tela de
 * duplicatas, não um; e o índice do roteiro usa `data-cenario-atalho`, distinto de
 * `data-cenario-abrir`, que continua em exatamente 5.
 *
 * ZERO DEPENDÊNCIA NOVA. O cliente CDP mora em `navegador.mjs` e é ~120 linhas sobre o
 * `WebSocket` global do Node. `verificar-fase2.mjs`, `navegador.mjs` e `servir-out.mjs`
 * são LEITURA para este arquivo: alterá-los invalidaria
 * a linha de base das fases anteriores, que é o que a não-regressão compara.
 */

import { readFile, readdir, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync, statSync, readdirSync } from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { servir } from "./servir-out.mjs";
import { abrirNavegador, PRELUDIO } from "./navegador.mjs";

const RAIZ = path.resolve(import.meta.dirname, "..");
const SRC = path.join(RAIZ, "src");
const OUT = path.join(RAIZ, "out");

const LARGURA = 1440;
const ALTURA = 960;

/** A data que o build usa como «hoje». Vem de `src/dados/alerta.ts`, não do relógio. */
const DATA_DE_REFERENCIA = "2026-08-22";

/**
 * A âncora da consolidação das folhas de estilo (`a40f380`, «as seis folhas de estilo num
 * bundle só»). É a partir dela que `globals.css` pode receber `@import` e NADA MAIS — o
 * bloco `:root` com os hex do manual é a fonte de verdade única da paleta e tem de
 * continuar byte a byte idêntico.
 */
/* Reancorado na reformulação do design system: o histórico do repositório foi
 * recriado em 2026-08-22 e `a40f380` deixou de existir. A âncora mora em `medidas.mjs`. */
import { COMMIT_DA_CONSOLIDACAO } from "./medidas.mjs";

/** O peso de `out/_next/static/chunks` medido antes da fase 4, e o teto fixado pela fase 3. */
const CHUNKS_ANTES_DA_FASE_4_KB = 1124;
const TETO_CHUNKS_KB = 1600;

/** As quatro folhas que a fase 4 acrescentou, declaradas de uma vez por 04-01. */
const FOLHAS_DA_FASE_4 = [
  "studio.css",
  "studio-duplicatas.css",
  "studio-ocorrencias.css",
  "roteiro.css",
];

/** As três rotas que esta fase preencheu ou criou. Todas de superfície WEB (D-67, D-78). */
const ROTAS_DA_FASE_4 = ["/studio/duplicatas/", "/studio/ocorrencias/", "/roteiro/"];

/** O par do Cenário 4, fixado em `alerta.ts` e reexportado por `ocorrencias-studio.ts`. */
const OCORRENCIA_ATINGIDA = "ocorrencia:derivado:13845-t1-o0028";
const OCORRENCIA_IRMA = "ocorrencia:derivado:13845-t1-o0029";

/** Onde as fotos vão, quando `DIR_CAPTURAS` estiver definida. Sem ela, não se escreve nada. */
const DIR_CAPTURAS = process.env.DIR_CAPTURAS ?? "";

// ---------------------------------------------------------------------------
// Relatório: toda medição imprime uma linha nomeada com o NÚMERO medido.
// Um gate que só diz «passou» não sobrevive à próxima mudança de dado.
// ---------------------------------------------------------------------------

let falhas = 0;
const resumo = [];

function ok(nome, medida) {
  console.log(`  ok   ${nome}: ${medida}`);
}

class Falha extends Error {}

function exigir(condicao, nome, medida, esperado) {
  if (condicao) {
    ok(nome, medida);
    return;
  }
  console.log(`  FALHA ${nome}: medido ${medida} · esperado ${esperado}`);
  falhas += 1;
  throw new Falha(`${nome} — medido ${medida}, esperado ${esperado}`);
}

function titulo(t) {
  console.log(`\n${t}`);
}

function nota(t) {
  console.log(`       ${t}`);
}

/** Texto longo que vai ser LIDO EM VOZ ALTA: impresso por inteiro, quebrado em linhas. */
function imprimirTexto(rotulo, texto, largura = 92) {
  console.log(`       ┌─ ${rotulo} (${texto.length} caracteres)`);
  for (const paragrafo of String(texto).split("\n")) {
    let linha = "";
    for (const palavra of paragrafo.split(/\s+/).filter(Boolean)) {
      if ((linha + " " + palavra).trim().length > largura) {
        console.log(`       │ ${linha.trim()}`);
        linha = palavra;
      } else {
        linha = `${linha} ${palavra}`;
      }
    }
    if (linha.trim()) console.log(`       │ ${linha.trim()}`);
  }
  console.log(`       └─`);
}

// ---------------------------------------------------------------------------
// Leitura de fonte SEM COMENTÁRIOS.
//
// Duplicado de `verificar-fase2.mjs` e `verificar-fase3.mjs` de propósito: os dois são
// linha de base de fases anteriores e não exportam estes ajudantes; exportá-los exigiria
// alterá-los, o que a disciplina desta fase proíbe. A duplicação está registrada no SUMMARY
// como dívida conhecida, pela terceira vez — o lugar certo de resolvê-la é um módulo
// `fonte.mjs` numa fase que possa tocar as três suítes de uma vez.
//
// Máquina de estados em vez de regex: `"https://x"` tem `//` dentro de string, e uma regex
// ingênua apagaria metade do arquivo — um falso NEGATIVO, que é o erro caro num gate.
// ---------------------------------------------------------------------------

function semComentarios(fonte) {
  let fora = "";
  let i = 0;
  const n = fonte.length;
  while (i < n) {
    const c = fonte[i];
    const d = fonte[i + 1];
    if (c === "/" && d === "/") {
      while (i < n && fonte[i] !== "\n") i += 1;
      continue;
    }
    if (c === "/" && d === "*") {
      i += 2;
      while (i < n && !(fonte[i] === "*" && fonte[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const aspa = c;
      fora += c;
      i += 1;
      while (i < n) {
        if (fonte[i] === "\\") {
          fora += fonte[i] + (fonte[i + 1] ?? "");
          i += 2;
          continue;
        }
        fora += fonte[i];
        if (fonte[i] === aspa) {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }
    // JSX admite `{/* … */}`, já coberto acima; comentário de linha dentro de JSX não existe.
    fora += c;
    i += 1;
  }
  return fora;
}

async function arquivosDe(dir, filtro = /\.(ts|tsx)$/) {
  const saida = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) saida.push(...(await arquivosDe(p, filtro)));
    else if (filtro.test(e.name)) saida.push(p);
  }
  return saida;
}

const fontes = new Map();
async function fonte(arquivo) {
  if (fontes.has(arquivo)) return fontes.get(arquivo);
  const bruto = await readFile(arquivo, "utf8");
  // A ARMADILHA DO DISCO (iCloud a 96%): `stat` reporta tamanho e a leitura devolve zero
  // byte. Um arquivo despejado lido como "" faria TODO gate de fonte passar em silêncio —
  // 0 violações porque não há o que violar. Falhar alto aqui é o comportamento correto.
  if (bruto.length === 0 && statSync(arquivo).size > 0) {
    throw new Error(
      `${path.relative(RAIZ, arquivo)} leu ZERO BYTE mas tem ${statSync(arquivo).size} bytes em disco. ` +
        `É o despejo do iCloud. Restaure com: git show HEAD:${path.relative(RAIZ, arquivo)} > ${path.relative(RAIZ, arquivo)}`,
    );
  }
  const v = { bruto, limpo: semComentarios(bruto) };
  fontes.set(arquivo, v);
  return v;
}

/**
 * A instrução de importação INTEIRA, não a linha. `import type {\n  A,\n  B,\n} from "x"`
 * quebrado em cinco linhas derrota qualquer casamento por linha, e o resultado seria um
 * gate de fronteira que não vê a fronteira sendo atravessada.
 */
const RE_INSTRUCAO =
  /\bimport\s+(type\s+)?(?:[\s\S]*?\sfrom\s+)?["']([^"']+)["']|\brequire\(\s*["']([^"']+)["']\s*\)/g;

function importsDe(limpo) {
  const saida = [];
  for (const m of limpo.matchAll(RE_INSTRUCAO)) {
    const especificador = m[2] ?? m[3];
    if (!especificador) continue;
    saida.push({ especificador, apenasTipo: Boolean(m[1]) });
  }
  return saida;
}

function resolverModulo(especificador, deArquivo) {
  let base;
  if (especificador.startsWith("@/")) base = path.join(SRC, especificador.slice(2));
  else if (especificador.startsWith(".")) base = path.resolve(path.dirname(deArquivo), especificador);
  else return null;
  for (const s of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    if (existsSync(base + s) && statSync(base + s).isFile()) return base + s;
  }
  return null;
}

function tamanhoDeKb(dir) {
  let total = 0;
  (function andar(d) {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) andar(p);
      else total += statSync(p).size;
    }
  })(dir);
  return Math.round(total / 1024);
}

function git(...args) {
  return execFileSync("git", args, { cwd: RAIZ, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

/** Ano de quatro dígitos como NÚMERO — defeito 5. Nunca comparar data por string. */
function anosDoTexto(texto) {
  return [...String(texto).matchAll(/\b(1[89]\d{2}|20\d{2})\b/g)].map((m) => Number(m[1]));
}

// ---------------------------------------------------------------------------
// PRELÚDIO DE PÁGINA — estende o de `navegador.mjs` com o que a fase 4 precisa.
// ---------------------------------------------------------------------------

const PRELUDIO4 =
  PRELUDIO +
  `
  /** DEFEITO 3. Forma dentro de SVG se mede pelo retângulo, não por offsetParent. */
  const visivelSvg = (el) => {
    if (!el) return false;
    const e = getComputedStyle(el);
    if (e.display === 'none' || e.visibility === 'hidden' || Number(e.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const visiveisSvg = (s) => todos(s).filter(visivelSvg);

  /**
   * DEFEITO 4, na forma que a visão WEB exige. As três telas desta fase são de bastidor e
   * NÃO têm barra de abas — o layout de bastidor não a monta. A função declara qual limite
   * usou, para o relatório imprimir a medida em vez de reaproveitar a da visão app.
   */
  const limiteUtil = () => {
    // Desde a reformulação do design system (menu lateral, 2026-08) nenhuma navegação
    // cobre o pé — cabeçalho no topo (app), trilho à esquerda (web). O limite útil é
    // o fundo visível da moldura; as três telas desta fase são de bastidor e nunca
    // montaram navegação nenhuma.
    const m = document.querySelector('.moldura');
    if (m) {
      const rm = m.getBoundingClientRect();
      return { limite: Math.round(Math.min(rm.bottom, innerHeight)), contra: 'fundo visível da moldura', barra: 0 };
    }
    return { limite: innerHeight, contra: 'janela (sem moldura)', barra: 0 };
  };

  /**
   * A LIÇÃO DE 04-04: presença e visibilidade não bastam. Um elemento cortado fora da
   * janela continua «visível» pela definição do prelúdio — foi assim que o quinto atalho
   * do índice passou num gate verde estando fora da tela. Aqui a pergunta é GEOMÉTRICA:
   * o retângulo do elemento está DENTRO do retângulo do contêiner?
   */
  const dentroDaJanela = (el, folga = 1) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.left >= -folga && r.right <= innerWidth + folga && r.width > 0 && r.height > 0;
  };
  const transbordaNaHorizontal = () => {
    const d = document.documentElement;
    return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, transborda: d.scrollWidth > d.clientWidth + 1 };
  };

  const texto = (el) => ((el || document.body).innerText || '');
  const alturaDe = (el) => (el ? Math.round(el.getBoundingClientRect().height) : 0);
  const textoDe = (s) => { const el = document.querySelector(s); return el ? (el.innerText || '').trim() : null; };
  const conta = (s) => document.querySelectorAll(s).length;
  const contaVisiveis = (s) => visiveis(s).length;
`;

function naPagina4(corpo) {
  return `(() => { ${PRELUDIO4} ${corpo} })()`;
}

// ---------------------------------------------------------------------------
// REDE — a prova por processo de que a demonstração roda sem internet.
//
// DEFEITO 2: `Network.*` não é acessível — `abrirNavegador` não expõe `ao`/`enviar`. A
// medida equivalente, e feita de DENTRO da página, é
// `performance.getEntriesByType('resource')`: ela enumera TODO recurso que o documento
// pediu — script, folha, imagem, fonte, fetch e XHR. É colhida a cada navegação, antes de
// sair do documento, porque a lista é por documento e some na troca.
// ---------------------------------------------------------------------------

const recursos = new Set();

async function coletarRede(cdp) {
  const lista = await cdp.avaliar(`performance.getEntriesByType('resource').map((e) => e.name)`);
  for (const u of lista) recursos.add(u);
}

async function irPara(cdp, url) {
  await coletarRede(cdp).catch(() => {});
  await cdp.navegar(url);
  await coletarRede(cdp);
}

const respirar = (ms = 400) => new Promise((r) => setTimeout(r, ms));

/** Escreve num campo controlado do React: o setter nativo mais o evento que o React ouve. */
async function digitar(cdp, seletor, valor) {
  await cdp.avaliar(`(() => {
    const i = document.querySelector(${JSON.stringify(seletor)});
    if (!i) throw new Error('campo não encontrado: ' + ${JSON.stringify(seletor)});
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(i, ${JSON.stringify(valor)});
    i.dispatchEvent(new Event('input', { bubbles: true }));
    i.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await respirar(500);
}

/**
 * A VISÃO WEB, pelos dois caminhos, e o relatório diz qual foi usado em cada momento.
 * `agenda-cultural:visao` é STRING CRUA no `localStorage` — não JSON. Escrever `"web"`
 * com aspas deixaria a casca sem reconhecer o valor e a tela abriria na visão errada.
 */
async function porVisaoWebPorStorage(cdp, base, rota) {
  await irPara(cdp, `${base}${rota}`);
  await cdp.avaliar(`localStorage.setItem('agenda-cultural:visao', 'web')`);
  await cdp.recarregar();
  await coletarRede(cdp);
}

/** Foto do viewport travado. Só escreve quando `DIR_CAPTURAS` está definida. */
async function fotografar(cdp, nome) {
  if (!DIR_CAPTURAS) return null;
  await mkdir(DIR_CAPTURAS, { recursive: true });
  const b64 = await cdp.capturar();
  const destino = path.join(DIR_CAPTURAS, `${nome}.png`);
  await writeFile(destino, Buffer.from(b64, "base64"));
  nota(`foto: ${destino}`);
  return destino;
}

// ---------------------------------------------------------------------------
// (b) GATES ESTRUTURAIS — rodam ANTES de subir o Chrome. Baratos, e pegam a classe de
// erro mais cara da fase. Todos sobre a fonte SEM COMENTÁRIOS.
// ---------------------------------------------------------------------------

const JSON_PESADOS = ["entidades.json", "arestas.json", "ocorrencias.json"];
const CORES_APOIO = /--ic-(amarelo|azul|lilas|rosa|verde-agua|verde)\b/g;

/** Os quatro módulos de dado e os três componentes de cliente que a fase 4 criou. */
const MODULOS_NOVOS_DA_FASE_4 = [
  "src/dados/duplicatas.ts",
  "src/dados/ocorrencias-studio.ts",
  "src/dados/roteiro.ts",
  "src/dados/alerta.ts",
];
const CLIENTES_NOVOS_DA_FASE_4 = [
  "src/componentes/studio-duplicatas.tsx",
  "src/componentes/studio-ocorrencias.tsx",
  "src/componentes/roteiro.tsx",
];

/** Extrai um bloco `seletor { … }` equilibrando as chaves. Regex não equilibra chave. */
function blocoDe(css, seletor) {
  const i = css.indexOf(seletor);
  if (i < 0) return null;
  let j = css.indexOf("{", i);
  if (j < 0) return null;
  let nivel = 0;
  for (let k = j; k < css.length; k += 1) {
    if (css[k] === "{") nivel += 1;
    else if (css[k] === "}") {
      nivel -= 1;
      if (nivel === 0) return css.slice(i, k + 1);
    }
  }
  return null;
}

async function gatesEstruturais() {
  titulo("── (b) gates estruturais, sem navegador ──");
  const arquivos = await arquivosDe(SRC);

  // ---- 1. DP-F transitivo: nenhum caminho de cliente até `@/dados/grafo` ----
  // A instrução é casada POR INTEIRO (defeito 6) e `import type` é distinguido: tipo é
  // apagado na compilação e não arrasta os 23 MB de JSON para o navegador; import por
  // VALOR arrasta. Um gate que não distinguisse os dois acusaria a fronteira correta.
  const clientes = [];
  for (const a of arquivos) {
    const { limpo } = await fonte(a);
    if (/^\s*["']use client["']/.test(limpo)) clientes.push(a);
  }

  const violacoes = [];
  for (const cliente of clientes) {
    const vistos = new Set([cliente]);
    const fila = [[cliente, [path.relative(RAIZ, cliente)]]];
    while (fila.length) {
      const [atual, caminho] = fila.shift();
      const { limpo } = await fonte(atual);
      for (const imp of importsDe(limpo)) {
        if (imp.apenasTipo) continue;
        const alvo = resolverModulo(imp.especificador, atual);
        if (!alvo) continue;
        const rel = path.relative(RAIZ, alvo).split(path.sep).join("/");
        if (/^src\/dados\/grafo\.tsx?$/.test(rel)) {
          violacoes.push([...caminho, rel].join(" → "));
          continue;
        }
        if (vistos.has(alvo)) continue;
        vistos.add(alvo);
        fila.push([alvo, [...caminho, rel]]);
      }
    }
  }
  // Separador normalizado para "/": no Windows `path.relative` devolve "\" e a chamada
  // nominal abaixo casaria 0 de 3 mesmo com a varredura correta.
  const relClientes = clientes.map((c) => path.relative(RAIZ, c).split(path.sep).join("/"));
  const clientesNovosVarridos = CLIENTES_NOVOS_DA_FASE_4.filter((c) => relClientes.includes(c));
  exigir(
    violacoes.length === 0 && clientesNovosVarridos.length === CLIENTES_NOVOS_DA_FASE_4.length,
    "DP-F · caminhos de cliente até @/dados/grafo (transitivo, instrução inteira)",
    violacoes.length === 0
      ? `0 violações em ${clientes.length} clientes · os 3 componentes de cliente da fase 4 estão entre os varridos (${clientesNovosVarridos.length}/3)`
      : violacoes.join(" | "),
    "0 violações, com os 3 clientes da fase entre os varridos",
  );

  // Os quatro módulos de build da fase alcançam `grafo.ts` de propósito — é o lado
  // servidor da fronteira. O gate acima prova que NENHUM deles é alcançado por valor de um
  // cliente; este imprime o outro lado, para o relatório dizer o que a fronteira separa.
  const alcancamGrafo = [];
  for (const m of MODULOS_NOVOS_DA_FASE_4) {
    const arq = path.join(RAIZ, m);
    if (!existsSync(arq)) continue;
    const { limpo } = await fonte(arq);
    if (importsDe(limpo).some((i) => !i.apenasTipo && /grafo/.test(i.especificador))) alcancamGrafo.push(m);
  }
  ok(
    "os módulos de build da fase alcançam o grafo (o lado servidor da fronteira)",
    `${alcancamGrafo.length} de ${MODULOS_NOVOS_DA_FASE_4.length} importam grafo por VALOR e rodam só no build: ${alcancamGrafo
      .map((m) => path.basename(m))
      .join(", ")}`,
  );

  // ---- 2. D-47: nenhuma tela importa os JSON pesados diretamente ----
  const telas = arquivos.filter((a) => a.includes(`${path.sep}app${path.sep}`) || a.includes(`${path.sep}componentes${path.sep}`));
  const hitsJson = [];
  for (const a of telas) {
    const { limpo } = await fonte(a);
    for (const imp of importsDe(limpo)) {
      if (JSON_PESADOS.some((j) => imp.especificador.endsWith(j))) hitsJson.push(`${path.relative(RAIZ, a)} → ${imp.especificador}`);
    }
  }
  exigir(
    hitsJson.length === 0,
    "D-47 · telas importando entidades/arestas/ocorrencias.json diretamente",
    hitsJson.length === 0 ? `0 em ${telas.length} telas` : hitsJson.join(" | "),
    "0",
  );

  // ---- 3. Folha de estilo importada de dentro de componente ----
  // É a regra que a consolidação (`a40f380`) instituiu para acabar com o aviso de CSS
  // pré-carregado e não usado. Reintroduzi-la traria o aviso de volta em TODA navegação —
  // é a regressão que a fase 4 mais facilmente causaria, e basta um `import "./x.css"`.
  const importsDeCss = [];
  for (const a of arquivos) {
    const { limpo } = await fonte(a);
    for (const imp of importsDe(limpo)) {
      if (!imp.especificador.endsWith(".css")) continue;
      const rel = path.relative(RAIZ, a).split(path.sep).join("/");
      if (rel === "src/app/layout.tsx" && imp.especificador === "./globals.css") continue;
      importsDeCss.push(`${rel} → ${imp.especificador}`);
    }
  }
  exigir(
    importsDeCss.length === 0,
    "folha de estilo importada de componente (a regra que a consolidação instituiu)",
    importsDeCss.length === 0
      ? `0 ocorrências em ${arquivos.length} arquivos · o único import de CSS é src/app/layout.tsx → ./globals.css, o ponto de entrada único`
      : importsDeCss.join(" | "),
    "0",
  );

  // ---- 4. As quatro folhas da fase declaradas, e nenhuma órfã ----
  const globals = await readFile(path.join(SRC, "app", "globals.css"), "utf8");
  if (globals.length === 0) throw new Error("src/app/globals.css leu ZERO BYTE — é o despejo do iCloud. Restaure do git.");
  const declaradas = [...globals.matchAll(/@import\s+"\.\.\/estilos\/([a-z0-9-]+\.css)"/g)].map((m) => m[1]);
  const semDeclaracao = FOLHAS_DA_FASE_4.filter((f) => !declaradas.includes(f));
  exigir(
    semDeclaracao.length === 0,
    "as quatro folhas da fase 4 declaradas em globals.css, uma linha de @import cada",
    semDeclaracao.length === 0
      ? `4 de 4 (${FOLHAS_DA_FASE_4.join(", ")}) · ${declaradas.length} folhas de rota declaradas ao todo`
      : `faltam ${semDeclaracao.join(", ")}`,
    "4 de 4",
  );

  const noDisco = (await arquivosDe(path.join(SRC, "estilos"), /\.css$/)).map((f) => path.basename(f));
  const orfas = noDisco.filter((f) => !declaradas.includes(f));
  exigir(
    orfas.length === 0,
    "nenhuma folha órfã em src/estilos/ (existe no disco e ninguém a declara)",
    orfas.length === 0 ? `0 órfãs · ${noDisco.length} folhas no disco, ${declaradas.length} declaradas` : orfas.join(", "),
    "0 órfãs",
  );

  // ---- 5. globals.css desde a consolidação: só @import e comentário ----
  // O gate 8 de `verificar-fase3.mjs` foi reancorado em `c03f627` e exige diferença ZERO —
  // ele prova que a ONDA 2 não tocou o arquivo. Este aqui é o outro lado da mesma moeda, e
  // é o que o gate original protegia de fato: desde a CONSOLIDAÇÃO, o arquivo só pode ter
  // ganhado linhas de @import e de comentário, e o bloco `:root` com os hex do manual — a
  // fonte de verdade única da paleta — tem de estar byte a byte idêntico.
  const diffBruto = git("diff", "-U0", `${COMMIT_DA_CONSOLIDACAO}..HEAD`, "--", "src/app/globals.css");
  const acrescentadas = diffBruto
    .split("\n")
    .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
    .map((l) => l.slice(1));
  const removidas = diffBruto.split("\n").filter((l) => l.startsWith("-") && !l.startsWith("---"));
  let emComentario = false;
  const deImport = [];
  const deRegra = [];
  for (const l of acrescentadas) {
    const t = l.trim();
    if (t === "") continue;
    if (emComentario) {
      if (t.includes("*/")) emComentario = false;
      continue;
    }
    if (t.startsWith("/*")) {
      if (!t.includes("*/")) emComentario = true;
      continue;
    }
    if (t.startsWith("*")) continue;
    if (t.startsWith("@import ")) {
      deImport.push(t);
      continue;
    }
    deRegra.push(t);
  }
  exigir(
    deRegra.length === 0 && removidas.length === 0,
    `globals.css desde a consolidação (${COMMIT_DA_CONSOLIDACAO}): só @import e comentário`,
    `${deImport.length} linha(s) de @import acrescentada(s) · ${deRegra.length} linha(s) de REGRA acrescentada(s) · ${removidas.length} removida(s)` +
      (deRegra.length ? ` — ${deRegra.join(" | ")}` : ""),
    "0 linhas de regra e 0 removidas",
  );

  const globaisNaAncora = git("show", `${COMMIT_DA_CONSOLIDACAO}:src/app/globals.css`);
  const rootAntes = blocoDe(globaisNaAncora, ":root");
  const rootAgora = blocoDe(globals, ":root");
  exigir(
    rootAntes !== null && rootAgora !== null && rootAntes === rootAgora,
    "o bloco :root com os hex do manual, byte a byte desde a consolidação",
    rootAntes === rootAgora
      ? `${rootAgora.length} bytes idênticos · ${(rootAgora.match(/#[0-9a-f]{3,8}\b/gi) ?? []).length} hex declarados`
      : `antes ${rootAntes?.length ?? "ausente"} bytes · agora ${rootAgora?.length ?? "ausente"} bytes`,
    "idêntico byte a byte",
  );

  // Desde a consolidação do design system (2026-08) as variantes moram em
  // `src/estilos/tokens.css`, importado por globals.css, mesmo bundle. O gate segue
  // provando a EXISTÊNCIA; só o endereço mudou junto com a arquitetura
  // (docs/DESIGN-SYSTEM.md §5). A regra do modo comentado que este gate media junto
  // deixou de existir em 23/08 — o modo saiu do produto.
  const tokensCss = await readFile(path.join(SRC, "estilos", "tokens.css"), "utf8");
  const variantes = ["@custom-variant app", "@custom-variant desk"];
  const faltamVariantes = variantes.filter((v) => !tokensCss.includes(v));
  exigir(
    faltamVariantes.length === 0,
    "as variantes app:/desk: presentes em tokens.css",
    faltamVariantes.length === 0 ? "app: e desk: presentes" : `faltam ${faltamVariantes.join(", ")}`,
    "as duas variantes presentes",
  );

  // ---- 6. Peso dos chunks ----
  const chunksKb = tamanhoDeKb(path.join(OUT, "_next", "static", "chunks"));
  const delta = chunksKb - CHUNKS_ANTES_DA_FASE_4_KB;
  exigir(
    chunksKb <= TETO_CHUNKS_KB,
    "peso de out/_next/static/chunks",
    `${chunksKb} KB · ${delta >= 0 ? "+" : ""}${delta} KB contra os ${CHUNKS_ANTES_DA_FASE_4_KB} KB de antes da fase 4 · teto ${TETO_CHUNKS_KB} KB`,
    `≤ ${TETO_CHUNKS_KB} KB`,
  );

  // ---- 7. Token de cor de apoio e posicionamento preso à janela ----
  // As DUAS contagens, em código e em prosa: um gate que só imprimisse a de código não
  // deixaria ninguém conferir que a varredura sem comentários está de fato funcionando.
  const hitsCor = [];
  let corEmProsa = 0;
  for (const a of arquivos) {
    const { limpo, bruto } = await fonte(a);
    const emCodigo = [...limpo.matchAll(CORES_APOIO)];
    if (emCodigo.length) hitsCor.push(`${path.relative(RAIZ, a)} (${emCodigo.map((m) => m[0]).join(",")})`);
    corEmProsa += [...bruto.matchAll(CORES_APOIO)].length - emCodigo.length;
  }
  exigir(
    hitsCor.length === 0,
    "D-08 · token de cor de apoio em .ts/.tsx (sem comentários)",
    hitsCor.length === 0 ? `0 em código · ${corEmProsa} em prosa (comentários, ignorados de propósito)` : hitsCor.join(" | "),
    "0 em código",
  );

  const hitsFixed = [];
  let fixedEmProsa = 0;
  for (const a of arquivos) {
    const { limpo, bruto } = await fonte(a);
    if (path.basename(a) === "casca.tsx") continue;
    const emCodigo = [...limpo.matchAll(/\bfixed\b/g)];
    if (emCodigo.length) hitsFixed.push(`${path.relative(RAIZ, a)} ×${emCodigo.length}`);
    fixedEmProsa += [...bruto.matchAll(/\bfixed\b/g)].length - emCodigo.length;
  }
  exigir(
    hitsFixed.length === 0,
    "posicionamento preso à janela fora de casca.tsx (sem comentários)",
    hitsFixed.length === 0 ? `0 em código · ${fixedEmProsa} em prosa (comentários, ignorados de propósito)` : hitsFixed.join(" | "),
    "0 em código",
  );

  // ---- 8. Inserção de HTML bruto ----
  const hitsHtml = [];
  for (const a of arquivos) {
    const { limpo } = await fonte(a);
    if (limpo.includes("dangerouslySetInnerHTML")) hitsHtml.push(path.relative(RAIZ, a));
  }
  exigir(
    hitsHtml.length === 0,
    "inserção de HTML bruto em src/",
    hitsHtml.length === 0 ? `0 ocorrências em ${arquivos.length} arquivos` : hitsHtml.join(" | "),
    "0",
  );

  // ---- 9. Rotas exportadas, e o total com a diferença explicada rota a rota ----
  const rotasFase1 = [
    "", "entrar", "verificacao", "acontece", "buscar", "descobrir", "mapa", "meu", "play",
    "observatorio", "moderacao/fila", "redacao/trilha", "studio/duplicatas", "studio/ocorrencias",
    "studio/publicar", "onboarding/1", "onboarding/2", "onboarding/3",
  ];
  const faltando1 = rotasFase1.filter((r) => !existsSync(path.join(OUT, r, "index.html")));
  exigir(
    faltando1.length === 0,
    "as 18 rotas da fase 1 intactas (as três do Studio entre elas, agora preenchidas)",
    faltando1.length === 0 ? `${rotasFase1.length} de ${rotasFase1.length}` : `faltam ${faltando1.join(", ")}`,
    "18 de 18",
  );

  const sessoes = (await readdir(path.join(OUT, "evento"))).filter((d) =>
    existsSync(path.join(OUT, "evento", d, "sessoes", "index.html")),
  );
  const cidades = (await readdir(path.join(OUT, "cidade"))).filter((d) => existsSync(path.join(OUT, "cidade", d, "index.html")));
  const fase3Intacta =
    sessoes.length === 129 &&
    cidades.length === 15 &&
    existsSync(path.join(OUT, "salvos", "index.html")) &&
    existsSync(path.join(OUT, "buscar", "frase", "index.html"));
  exigir(
    fase3Intacta,
    "as rotas da fase 3 intactas",
    `${sessoes.length} sessões · ${cidades.length} cidades · /salvos ${existsSync(path.join(OUT, "salvos", "index.html")) ? "presente" : "AUSENTE"} · /buscar/frase ${existsSync(path.join(OUT, "buscar", "frase", "index.html")) ? "presente" : "AUSENTE"}`,
    "129 sessões, 15 cidades, /salvos e /buscar/frase",
  );

  exigir(
    existsSync(path.join(OUT, "roteiro", "index.html")),
    "rota /roteiro (STUD-03, STUD-04) — a única página que a fase 4 acrescenta",
    existsSync(path.join(OUT, "roteiro", "index.html")) ? "presente" : "AUSENTE",
    "presente",
  );

  const paginas = [];
  (function andar(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (p === path.join(OUT, "_next") || p === path.join(OUT, "acervo")) continue;
        andar(p);
      } else if (e.name.endsWith(".html")) {
        // Separador normalizado para "/" — no Windows `path.relative` devolve "\" e
        // nenhuma das regexes de rota abaixo casaria (medido: 0 novas, resíduo 2463).
        paginas.push(path.relative(OUT, p).split(path.sep).join("/"));
      }
    }
  })(OUT);
  const novasFase3 = paginas.filter(
    (r) =>
      /^evento\/[^/]+\/sessoes\/index\.html$/.test(r) ||
      /^cidade\/[^/]+\/index\.html$/.test(r) ||
      r === "salvos/index.html" ||
      r === "buscar/frase/index.html",
  );
  const novasFase4 = paginas.filter((r) => r === "roteiro/index.html");
  // As rotas que a FASE 5 acrescentou, listadas aqui pelo mesmo motivo pelo qual as da fase
  // 3 e da fase 4 já estavam: o LIMIAR NÃO SE MOVE — o resíduo continua sendo 1.784, a linha
  // de base da fase 2 — e o que cresce é a lista do que é EXPLICÁVEL. Sem estas linhas o
  // resíduo iria a 2.316 e o gate acusaria como defeito 532 páginas que a fase 5 criou de
  // propósito: 529 do Player (05-07, uma por mídia do acervo), `/filtros/` e os dois becos
  // de D-93 (05-06).
  //
  // `out/404.html` — o TERCEIRO beco — NÃO entra nesta lista: ele existe na linha de base
  // desde a fase 2, e 05-06 trocou o CONTEÚDO dele por `app/not-found.tsx` sem acrescentar
  // página. Pô-lo aqui levaria o resíduo a 1.783, e o gate acusaria como defeito uma página
  // que sempre existiu.
  const novasFase5 = paginas.filter(
    (r) =>
      r === "filtros/index.html" ||
      r === "busca-nao-encontrada/index.html" ||
      r === "agenda-nao-encontrada/index.html" ||
      /^play\/[^/]+\/index\.html$/.test(r),
  );
  // As 6 rotas da REFORMULAÇÃO do design system (2026-08): a árvore de menu fixada
  // pelo cliente, nascidas como esqueleto rotulado junto com o menu lateral.
  const novasReformulacao = paginas.filter((r) =>
    ["cast", "noticias", "museu", "museu/exposicoes", "ia", "cursos"].some(
      (rota) => r === `${rota}/index.html`,
    ),
  );
  const linhaBase =
    paginas.length - novasFase3.length - novasFase4.length - novasFase5.length - novasReformulacao.length;
  exigir(
    linhaBase === 1784 && novasFase4.length === 1,
    "total de páginas em out/, com a diferença explicada rota a rota",
    `${paginas.length} páginas · ${novasFase3.length} da fase 3 (129 sessões + 15 cidades + /salvos + /buscar/frase) · ` +
      `${novasFase4.length} da fase 4 (/roteiro) · ${novasFase5.length} da fase 5 (529 de /play/[slug] + /filtros + os 2 becos de D-93) · ` +
      `${novasReformulacao.length} da reformulação (menu lateral) · resíduo ${linhaBase}`,
    "resíduo 1784 e exatamente 1 página nova na fase 4",
  );

  return { clientes: clientes.length, paginas: paginas.length, chunksKb };
}

// ---------------------------------------------------------------------------
// (b2) COERÊNCIA ENTRE O ROTEIRO E OS MÓDULOS — o gate mais valioso desta suíte.
//
// 04-04 escreveu `/roteiro` sem importar `duplicatas.ts` nem `ocorrencias-studio.ts`: os
// três planos da onda 2 corriam em paralelo e um `import` os teria serializado. Os números
// entraram como `CONSTANTES_DA_ONDA`, cada uma com o arquivo de origem NOMEADO ao lado.
//
// É o único ponto de toda a fase onde a paralelização poderia ter produzido DUAS VERDADES:
// o roteiro dizendo «33 grupos» enquanto o motor calcula outro número, e as duas telas
// abertas na mesma demonstração, uma ao lado da outra, na frente de quem avalia. Este gate
// fecha o circuito — lê o que os módulos calculam DE VERDADE e exige que batam.
// ---------------------------------------------------------------------------

const SONDA = `
import { numerosDaDeduplicacao, LIMIAR_PROBABILISTICO, CRITERIO_DE_IDENTIDADE } from "@/dados/duplicatas";
import { numerosDoAcervo, EVENTO_PADRAO_DO_STUDIO, historicoAutorado, parDoCenario4 } from "@/dados/ocorrencias-studio";
import { CONSTANTES_DA_ONDA } from "@/dados/roteiro";
console.log("<<<SONDA>>>" + JSON.stringify({
  dedup: numerosDaDeduplicacao(),
  limiar: LIMIAR_PROBABILISTICO,
  criterio: CRITERIO_DE_IDENTIDADE,
  acervo: numerosDoAcervo(),
  eventoDoStudio: EVENTO_PADRAO_DO_STUDIO,
  historicoAutorado: historicoAutorado().map((h) => ({ ocorrencia: h.ocorrenciaId, evento: h.eventoId, de: h.de, para: h.para })),
  par: parDoCenario4(),
  onda: CONSTANTES_DA_ONDA,
}));
`;

async function sondarModulos() {
  // A entrada JS do tsx, e não `node_modules/.bin/tsx`: o atalho de `.bin` é script de
  // shell, e no Windows `execFileSync` não o executa (spawn EINVAL). O mesmo Node que
  // roda esta suíte roda a sonda.
  const tsx = path.join(RAIZ, "node_modules", "tsx", "dist", "cli.mjs");
  if (!existsSync(tsx)) {
    // Falha alta, não pulo. Sem a sonda este gate não existe, e um gate que se autodispensa
    // quando a ferramenta falta é exatamente o que T-04-26 proíbe.
    throw new Error(
      `node_modules/tsx/dist/cli.mjs não existe. tsx é devDependency do projeto e é como esta suíte lê ` +
        `o que duplicatas.ts e ocorrencias-studio.ts calculam. Rode \`npm install\`. NÃO pulo o gate.`,
    );
  }
  // FORA do repositório e FORA de `node_modules`. Fora do repositório porque a disciplina
  // desta fase limita a escrita a três arquivos, e um `.ts` de sonda em `src/` seria um
  // quarto; fora de `node_modules` porque o tsx NÃO aplica o mapeamento de `paths` do
  // tsconfig a arquivos que moram lá dentro — medido: `Cannot find module '@/dados/duplicatas'`.
  // O `cwd` continua sendo a raiz, que é de onde o tsx lê o tsconfig.
  const arquivo = path.join(os.tmpdir(), `verificar-fase4-sonda-${process.pid}.ts`);
  await mkdir(path.dirname(arquivo), { recursive: true });
  await writeFile(arquivo, SONDA, "utf8");
  let saida;
  try {
    saida = execFileSync(process.execPath, [tsx, arquivo], { cwd: RAIZ, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } finally {
    await rm(arquivo, { force: true }).catch(() => {});
  }
  const marca = saida.indexOf("<<<SONDA>>>");
  if (marca < 0) throw new Error(`a sonda não imprimiu o marcador. Saída:\n${saida.slice(0, 2000)}`);
  return JSON.parse(saida.slice(marca + "<<<SONDA>>>".length));
}

function gateCoerencia(sonda) {
  titulo("── (b2) coerência entre o roteiro e os módulos da onda 2 (T-04-32) ──");

  const doModulo = {
    gruposPorChave: sonda.dedup.gruposPorChave,
    gruposPorChaveEncenados: sonda.dedup.gruposPorChaveEncenados,
    gruposPorChaveDoAcervo: sonda.dedup.gruposPorChaveDoAcervo,
    paresProbabilisticos: sonda.dedup.paresProbabilisticos,
    paresProbabilisticosNaoEncenados: sonda.dedup.paresProbabilisticosNaoEncenados,
    limiarProbabilistico: sonda.limiar,
    registrosEncenados: sonda.dedup.registrosEncenados,
    ocorrenciasEncenadas: sonda.dedup.ocorrenciasEncenadas,
  };

  const divergentes = [];
  const conferidas = [];
  for (const c of sonda.onda) {
    if (!(c.chave in doModulo)) {
      divergentes.push(`${c.chave}: declarada no roteiro e SEM correspondente no módulo`);
      continue;
    }
    if (doModulo[c.chave] !== c.valor) {
      divergentes.push(`${c.chave}: roteiro declara ${c.valor}, o módulo calcula ${doModulo[c.chave]} (origem: ${c.origem})`);
      continue;
    }
    conferidas.push(`${c.chave}=${c.valor}`);
  }
  exigir(
    divergentes.length === 0 && conferidas.length === sonda.onda.length,
    "CONSTANTES_DA_ONDA do roteiro contra o que duplicatas.ts calcula de verdade",
    divergentes.length === 0
      ? `${conferidas.length} de ${sonda.onda.length} constantes batem: ${conferidas.join(" · ")}`
      : divergentes.join(" | "),
    "todas batem",
  );

  // A soma que decompõe a fila. Se ela deixar de fechar, a tela declara 84 e tem outra coisa.
  const soma = sonda.dedup.gruposEncenadosNaFila + sonda.dedup.gruposDoAcervoNaFila + sonda.dedup.gruposCruzadosNaFila;
  exigir(
    soma === sonda.dedup.filaTotal && sonda.dedup.filaTotal === sonda.dedup.gruposPorChave + sonda.dedup.paresProbabilisticos,
    "a decomposição da fila fecha nos dois sentidos",
    `${sonda.dedup.gruposEncenadosNaFila} encenados + ${sonda.dedup.gruposDoAcervoNaFila} do acervo + ${sonda.dedup.gruposCruzadosNaFila} cruzados = ${soma} · ` +
      `e ${sonda.dedup.gruposPorChave} por chave + ${sonda.dedup.paresProbabilisticos} probabilísticos = ${sonda.dedup.filaTotal}`,
    "as duas somas em 84",
  );

  exigir(
    sonda.acervo.ocorrencias === 2425 &&
      sonda.acervo.ocorrenciasComEspaco === 0 &&
      sonda.acervo.eventosQueDeclaramIngresso === 0 &&
      sonda.acervo.eventosComSessao === 129 &&
      sonda.acervo.eventos === 300,
    "os números que ocorrencias-studio.ts calcula, contra os riscos herdados de 4-CONTEXT",
    `${sonda.acervo.ocorrencias} ocorrências · ${sonda.acervo.ocorrenciasComEspaco} com espaço · ` +
      `${sonda.acervo.eventosQueDeclaramIngresso} de ${sonda.acervo.eventos} declaram ingresso · ${sonda.acervo.eventosComSessao} eventos com sessão`,
    "2425 / 0 / 0 de 300 / 129",
  );

  return doModulo;
}

// ---------------------------------------------------------------------------
// (b3) O CONTRATO `data-*` NO HTML EXPORTADO.
//
// Sobre o arquivo, com a forma `data-{atributo}="` — com o igual e a aspa. Sem ela o gate
// conta o payload RSC, onde o mesmo nome aparece escapado, e o número sai inflado.
//
// A ARMADILHA, e é por isso que este gate tem uma coluna de esperado ZERO: cinco atributos
// de 04-03 e um de 04-02 são de INTERAÇÃO, não de documento. Eles medem 0 aqui e é correto.
// São conferidos no DOM, depois do clique que os cria, nos blocos de tela.
// ---------------------------------------------------------------------------

const CONTRATO_NO_HTML = {
  "studio/duplicatas": {
    "data-fila-duplicatas": 1,
    "data-grupo": 84,
    "data-grupo-escolhido": 1,
    "data-estagio": 86,
    "data-score": 52,
    "data-origem": 85,
    "data-acao": 3,
    "data-reversivel": 1,
    "data-nao-sustenta": 3,
    "data-criterio": 1,
    "data-lado": 2,
    "data-campo": 6,
    "data-divergente": 6,
    "data-componente": 3,
    "data-sustentado": 3,
    "data-falso-positivo": 1,
    "data-decisao": 0,
  },
  "studio/ocorrencias": {
    "data-evento-imutavel": 1,
    "data-ocorrencia": 53,
    "data-historico": 1,
    "data-historico-item": 1,
    "data-semear-cenario-4-studio": 1,
    "data-nao-sustenta": 4,
    "data-editando": 0,
    "data-impacto": 0,
    "data-impacto-fonte": 0,
    "data-confirmar": 0,
    "data-cancelar": 0,
  },
  roteiro: {
    "data-roteiro": 1,
    "data-cenario": 5,
    "data-cenario-visao": 5,
    "data-cenario-rota": 13,
    "data-cenario-abrir": 5,
    "data-cenario-sustenta": 5,
    "data-cenario-nao-sustenta": 5,
    "data-cenario-atalho": 5,
  },
};

/** Os que nascem em 0 no documento e só existem depois de um clique. */
const SO_COM_INTERACAO = [
  "data-decisao",
  "data-editando",
  "data-impacto",
  "data-impacto-fonte",
  "data-confirmar",
  "data-cancelar",
];

async function gateContratoNoHtml() {
  titulo("── (b3) o contrato data-* no HTML exportado (forma `atributo=\"`, nunca o payload RSC) ──");
  for (const [rota, esperado] of Object.entries(CONTRATO_NO_HTML)) {
    const arquivo = path.join(OUT, rota, "index.html");
    const html = await readFile(arquivo, "utf8");
    if (html.length === 0) throw new Error(`out/${rota}/index.html leu ZERO BYTE. Refaça o build.`);
    const divergentes = [];
    const medidos = [];
    for (const [atributo, n] of Object.entries(esperado)) {
      const medido = (html.match(new RegExp(`${atributo}="`, "g")) ?? []).length;
      medidos.push(`${atributo}=${medido}`);
      if (medido !== n) divergentes.push(`${atributo}: medido ${medido}, esperado ${n}`);
    }
    exigir(
      divergentes.length === 0,
      `contrato data-* em out/${rota}/index.html (${Math.round(html.length / 1024)} KB)`,
      divergentes.length === 0 ? medidos.join(" · ") : divergentes.join(" | "),
      Object.entries(esperado)
        .map(([a, n]) => `${a}=${n}`)
        .join(" · "),
    );
  }
  nota(
    `os ${SO_COM_INTERACAO.length} atributos de INTERAÇÃO — ${SO_COM_INTERACAO.join(", ")} — medem 0 no documento ` +
      `de propósito: nada os cria sem clique. São conferidos no DOM vivo, nos blocos de tela.`,
  );

  // `data-campo` usa `chave-identidade` COM HÍFEN. É a grafia que 04-01 congelou e 04-02
  // conferiu; casar `chaveIdentidade` aqui acusaria contrato quebrado que não está.
  const htmlDup = await readFile(path.join(OUT, "studio", "duplicatas", "index.html"), "utf8");
  const campos = [...htmlDup.matchAll(/data-campo="([a-z-]+)"/g)].map((m) => m[1]);
  exigir(
    campos.includes("chave-identidade") && !htmlDup.includes('data-campo="chaveIdentidade"'),
    "data-campo usa `chave-identidade`, com hífen (a grafia que 04-01 congelou)",
    `${campos.length} campos: ${campos.join(", ")}`,
    "chave-identidade entre eles, e nenhum camelCase",
  );
}

// ---------------------------------------------------------------------------
// (c) A CASCA NA VISÃO WEB — D-67 e D-78, REESCRITO EM 2026-08.
//
// O QUE MUDOU, E POR QUE NÃO É AFROUXAMENTO. Até aqui este bloco afirmava uma coisa só:
// «nas três rotas da fase, na visão app, o conteúdo de bastidor está invisível». Isso valia
// enquanto `(bastidor)/layout.tsx` escondia as 52 rotas com um `app:hidden` só.
//
// O perfil Produtor inverteu a regra para UMA superfície. O Studio passou a ser
// mobile-first — quem produz cultura no Brasil produz do telefone, e uma ferramenta de
// publicação que só existe no computador não é usada. Moderação, Redação, Observatório,
// Administração e o roteiro continuam web-only.
//
// ENTÃO O PORTÃO PASSA A MEDIR AS DUAS METADES, e é por isso que ele mede MAIS do que
// media: onde havia uma afirmação («escondido»), agora há duas — «escondido onde a regra
// diz escondido» E «visível onde a regra diz visível». A segunda metade é nova, e é ela que
// pega o defeito que a versão anterior não pegaria: um `app:hidden` esquecido no Studio
// deixaria a superfície inteira invisível no telefone, e o gate antigo daria verde.
//
// O botão que troca a visão continua exercitado POR CLIQUE nas rotas que o têm — não por
// escrita em `localStorage`. Um botão que existe e não funciona é a forma de defeito que só
// o clique pega.
// ---------------------------------------------------------------------------

async function gatesDaCasca(cdp, base) {
  titulo("── (c) a casca na visão web, e o aviso de superfície de desktop nas três rotas ──");

  await irPara(cdp, `${base}/roteiro/`);
  const janela = await cdp.avaliar("({ w: innerWidth, h: innerHeight })");
  exigir(
    janela.w === LARGURA && janela.h >= 900,
    "viewport travado por Emulation.setDeviceMetricsOverride (não por tamanho de janela)",
    `${janela.w}×${janela.h}`,
    `${LARGURA}×${ALTURA}`,
  );

  const medida = await cdp.avaliar(naPagina4(`const u = limiteUtil(); return u;`));
  ok(
    "a medida de «cabe na primeira vista» declarada, e não reaproveitada da visão app",
    `limite ${medida.limite}px, contra ${medida.contra} · barra de abas: ${medida.barra}px ` +
      `(o layout de bastidor não monta barra de abas — as três telas da fase são web)`,
  );

  const visaoAtual = () => cdp.avaliar("document.querySelector('[data-view]').getAttribute('data-view')");

  // Cada rota da fase declara qual metade da regra ela representa. A lista mora aqui e
  // não em `ROTAS_DA_FASE_4` porque a constante é lida por outros blocos, que não têm nada
  // a ver com D-67.
  const REGRA_DE_SUPERFICIE = {
    "/studio/duplicatas/": "visivel-no-app",
    "/studio/ocorrencias/": "visivel-no-app",
    "/roteiro/": "so-web",
  };

  for (const rota of ROTAS_DA_FASE_4) {
    const regra = REGRA_DE_SUPERFICIE[rota];
    await cdp.avaliar(`localStorage.setItem('agenda-cultural:visao', 'mobile')`);
    await irPara(cdp, `${base}${rota}`);
    const naApp = await cdp.avaliar(
      naPagina4(`
        const aviso = Array.from(document.querySelectorAll('h1')).find(h => /superfície de desktop/i.test(h.textContent || ''));
        const botao = Array.from(document.querySelectorAll('button')).find(b => /Trocar para a visão Web/i.test(b.textContent || ''));
        return {
          view: document.querySelector('[data-view]').getAttribute('data-view'),
          aviso: aviso ? aviso.textContent.trim() : null,
          avisoVisivel: visivel(aviso),
          botaoVisivel: visivel(botao),
          conteudoVisivel: contaVisiveis('[data-fila-duplicatas], [data-evento-imutavel], [data-roteiro]') > 0,
        };
      `),
    );

    if (regra === "so-web") {
      // A METADE ANTIGA, intacta: a superfície declara que o trabalho é de tela grande, e
      // o conteúdo denso não aparece espremido em 390px.
      exigir(
        naApp.view === "mobile" && naApp.avisoVisivel && naApp.botaoVisivel && !naApp.conteudoVisivel,
        `D-67/D-78 · ${rota} continua web-only e DECLARA isso na visão app`,
        `view=${naApp.view} · «${naApp.aviso}» · botão visível: ${naApp.botaoVisivel} · conteúdo de bastidor visível: ${naApp.conteudoVisivel}`,
        "aviso e botão visíveis, conteúdo escondido",
      );

      await cdp.clicar(
        `Array.from(document.querySelectorAll('button')).find(b => /Trocar para a visão Web/i.test(b.textContent || ''))`,
      );
      await respirar(500);
      const depois = await cdp.avaliar(
        naPagina4(`return {
          view: document.querySelector('[data-view]').getAttribute('data-view'),
          conteudoVisivel: contaVisiveis('[data-fila-duplicatas], [data-evento-imutavel], [data-roteiro]') > 0,
        };`),
      );
      exigir(
        depois.view === "web" && depois.conteudoVisivel,
        `o botão do aviso troca a visão POR CLIQUE em ${rota}`,
        `view=${depois.view} · conteúdo de bastidor visível: ${depois.conteudoVisivel}`,
        "web, com o conteúdo aparecendo",
      );
      continue;
    }

    // A METADE NOVA. O Studio é mobile-first: na visão app o conteúdo APARECE, e o aviso
    // de superfície de desktop NÃO existe — o layout dele não monta `SuperficieSoWeb`.
    //
    // As duas condições são afirmadas juntas de propósito. Só «conteúdo visível» deixaria
    // passar uma tela que mostra o conteúdo E o aviso ao mesmo tempo, que é contraditório;
    // só «sem aviso» deixaria passar uma tela invisível por outro motivo.
    exigir(
      naApp.view === "mobile" && naApp.conteudoVisivel && !naApp.avisoVisivel,
      `D-67 invertido · ${rota} é mobile-first e ABRE na visão app`,
      `view=${naApp.view} · conteúdo visível: ${naApp.conteudoVisivel} · aviso de desktop visível: ${naApp.avisoVisivel}`,
      "conteúdo visível, sem aviso de superfície de desktop",
    );

    // E ele continua funcionando na web: a inversão não trocou uma visão pela outra.
    await cdp.avaliar(`localStorage.setItem('agenda-cultural:visao', 'web')`);
    await irPara(cdp, `${base}${rota}`);
    const naWeb = await cdp.avaliar(
      naPagina4(`return {
        view: document.querySelector('[data-view]').getAttribute('data-view'),
        conteudoVisivel: contaVisiveis('[data-fila-duplicatas], [data-evento-imutavel], [data-roteiro]') > 0,
      };`),
    );
    exigir(
      naWeb.view === "web" && naWeb.conteudoVisivel,
      `${rota} continua respondendo na visão web — a inversão não trocou uma pela outra`,
      `view=${naWeb.view} · conteúdo visível: ${naWeb.conteudoVisivel}`,
      "web, com o conteúdo aparecendo",
    );
  }

  // Sobrevivencia a recarregar, nos dois sentidos.
  await cdp.recarregar();
  await coletarRede(cdp);
  exigir((await visaoAtual()) === "web", "data-view sobrevive a recarregar (ida: web)", await visaoAtual(), "web");

  await cdp.avaliar(`localStorage.setItem('agenda-cultural:visao', 'mobile')`);
  await cdp.recarregar();
  await coletarRede(cdp);
  exigir((await visaoAtual()) === "mobile", "data-view sobrevive a recarregar (volta: mobile)", await visaoAtual(), "mobile");
}

// ---------------------------------------------------------------------------
// (d) STUD-01 · /studio/duplicatas — a fila, o critério, as três ações, a decisão humana.
// ---------------------------------------------------------------------------

const relatorio = { criterioDeIdentidade: null, naoSustentaDuplicatas: [], cenarios: [], parDoCenario4: null, textosDosCenarios: [] };

async function blocoDuplicatas(cdp, base) {
  titulo("── (d) STUD-01 · /studio/duplicatas: 84 grupos, dois estágios, decisão humana ──");
  await porVisaoWebPorStorage(cdp, base, "/studio/duplicatas/");
  nota("visão web posta por localStorage + recarregar (a troca por clique foi exercitada no bloco (c), nas três rotas)");

  const fila = await cdp.avaliar(
    naPagina4(`
      const declarado = Number(document.querySelector('[data-fila-duplicatas]').getAttribute('data-fila-duplicatas'));
      const linhas = visiveis('[data-grupo]');
      const porEstagio = {};
      const porOrigem = {};
      let comScore = 0, chaveComScore = 0;
      const origemDosDeterministicos = {};
      for (const l of linhas) {
        const e = l.getAttribute('data-estagio');
        porEstagio[e] = (porEstagio[e] || 0) + 1;
        // A origem mora num <span> DENTRO da linha, não na linha: ler o atributo da própria
        // linha devolveria null nas 84 e o gate contaria «null: 84» achando que mediu algo.
        const o = l.querySelector('[data-origem]')?.getAttribute('data-origem') ?? null;
        porOrigem[o] = (porOrigem[o] || 0) + 1;
        if (l.hasAttribute('data-score')) { comScore += 1; if (e === 'chave') chaveComScore += 1; }
        if (e === "chave") origemDosDeterministicos[o] = (origemDosDeterministicos[o] || 0) + 1;
      }
      return { declarado, linhas: linhas.length, porEstagio, porOrigem, comScore, chaveComScore, origemDosDeterministicos };
    `),
  );
  exigir(
    fila.declarado === 84 && fila.linhas === 84 && fila.porEstagio.chave === 33 && fila.porEstagio.probabilistico === 51,
    "a fila declara 84 grupos e TEM 84 linhas visíveis, nos dois estágios",
    `declarado ${fila.declarado} · ${fila.linhas} linhas visíveis · ${fila.porEstagio.chave} do estágio determinístico + ${fila.porEstagio.probabilistico} do probabilístico`,
    "84 = 84, com 33 + 51",
  );
  exigir(
    fila.comScore === 51 && fila.chaveComScore === 0,
    "só o estágio probabilístico carrega score — a chave não estima, ela afirma",
    `${fila.comScore} linhas com data-score, e ${fila.chaveComScore} delas no estágio determinístico`,
    "51 com score, 0 no determinístico",
  );
  exigir(
    fila.origemDosDeterministicos.acervo === 6 && fila.origemDosDeterministicos.encenado === 27,
    "dos 33 determinísticos, a tela distingue os 6 REAIS do acervo dos 27 encenados",
    `${JSON.stringify(fila.origemDosDeterministicos)} · na fila inteira: ${JSON.stringify(fila.porOrigem)}`,
    "6 do acervo e 27 encenados",
  );

  // O critério de identidade, VISÍVEL na tela, e impresso por inteiro: ele vai ser lido
  // em voz alta, e o relatório é onde quem apresenta o encontra.
  const criterio = await cdp.avaliar(
    naPagina4(`
      const bloco = document.querySelector('[data-criterio]');
      const comps = todos('[data-componente]').map(c => ({
        campo: c.getAttribute('data-componente'),
        sustentado: c.getAttribute('data-sustentado'),
      }));
      return {
        visivel: visivel(bloco),
        altura: alturaDe(bloco),
        texto: bloco ? bloco.innerText.trim() : null,
        comps,
      };
    `),
  );
  exigir(
    criterio.visivel && criterio.altura > 0 && criterio.comps.length === 3,
    "D-68 · o critério de identidade VISÍVEL na tela",
    `${criterio.altura}px · ${criterio.comps.length} componentes: ` +
      criterio.comps.map((c) => `${c.campo}=${c.sustentado}`).join(", "),
    "visível, com os 3 componentes marcados",
  );
  relatorio.criterioDeIdentidade = criterio.texto;
  imprimirTexto("o critério de identidade, como ele aparece na tela", criterio.texto);

  const sustentados = criterio.comps.filter((c) => c.sustentado === "sim");
  exigir(
    sustentados.length === 1 && sustentados[0].campo === "titulo",
    "o acervo sustenta UM dos três componentes do critério, e a tela diz qual",
    `${sustentados.length} sustentado (${sustentados.map((c) => c.campo).join(",")}) de 3`,
    "1 de 3, o título",
  );

  // ---- escolher um grupo troca o painel SEM mudar a URL ----
  const antesDaEscolha = await cdp.avaliar(
    `({ url: location.pathname, escolhido: document.querySelector('[data-grupo-escolhido]').getAttribute('data-grupo-escolhido'), score: document.querySelectorAll('[data-score]').length })`,
  );
  await cdp.clicar(`document.querySelector('[data-grupo][data-estagio="probabilistico"]')`);
  await respirar(500);
  const aposEscolha = await cdp.avaliar(
    naPagina4(`
      const painel = document.querySelector('[data-grupo-escolhido]');
      return {
        url: location.pathname,
        escolhido: painel.getAttribute('data-grupo-escolhido'),
        score: conta('[data-score]'),
        campos: todos('[data-campo]').map(c => c.getAttribute('data-campo')),
        divergentes: todos('[data-divergente="sim"]').length,
        lados: conta('[data-lado]'),
      };
    `),
  );
  exigir(
    aposEscolha.url === antesDaEscolha.url && aposEscolha.escolhido !== antesDaEscolha.escolhido,
    "escolher um grupo troca o painel SEM mudar a URL",
    `${antesDaEscolha.escolhido} → ${aposEscolha.escolhido} · URL ${aposEscolha.url} (era ${antesDaEscolha.url})`,
    "painel trocado, URL intacta",
  );
  exigir(
    aposEscolha.campos.length >= 5 && aposEscolha.divergentes >= 1 && aposEscolha.campos.includes("chave-identidade"),
    "D-70 · ao menos 5 campos comparados por grupo, com os divergentes marcados",
    `${aposEscolha.campos.length} campos (${aposEscolha.campos.join(", ")}) · ${aposEscolha.divergentes} marcados divergentes · ${aposEscolha.lados} lados`,
    "≥5 campos, ≥1 divergente marcado",
  );
  // A correção honesta da tabela de 04-02: no DOCUMENTO são 52 `data-score` (as 51 linhas
  // mais o selo do falso positivo), porque o grupo inicial é determinístico e não tem score.
  // Escolhido um probabilístico, o selo do painel entra e o número vai a 53. 04-02 anotou 53
  // nas duas colunas; o 53 é do DOM depois do clique, não do arquivo.
  exigir(
    antesDaEscolha.score === 52 && aposEscolha.score === 53,
    "data-score: 52 no documento e 53 no DOM depois de escolher um grupo probabilístico",
    `${antesDaEscolha.score} → ${aposEscolha.score} (as 51 linhas + o selo do falso positivo, mais o selo do painel quando ele tem score)`,
    "52 → 53",
  );

  // ---- as três ações, a decisão humana, e a fila que não encolhe ----
  const antesDoClique = await cdp.avaliar(
    naPagina4(`return {
      acoes: visiveis('[data-acao]').map(b => b.getAttribute('data-acao')),
      decisoes: conta('[data-decisao]'),
      grupos: conta('[data-grupo]'),
    };`),
  );
  exigir(
    antesDoClique.acoes.length === 3 &&
      ["fundir", "separar", "adiar"].every((a) => antesDoClique.acoes.includes(a)) &&
      antesDoClique.decisoes === 0,
    "D-71/T-04-07 · as três ações visíveis e ZERO decisão antes de qualquer clique",
    `ações: ${antesDoClique.acoes.join(", ")} · ${antesDoClique.decisoes} decisões · ${antesDoClique.grupos} grupos na fila`,
    "3 ações e 0 decisão",
  );

  await cdp.clicar(`document.querySelector('[data-acao="fundir"]')`);
  await respirar(600);
  const aposDecisao = await cdp.avaliar(
    naPagina4(`
      const d = document.querySelector('[data-decisao]');
      return {
        decisoes: conta('[data-decisao]'),
        texto: d ? d.innerText.trim() : null,
        grupos: conta('[data-grupo]'),
        fila: Number(document.querySelector('[data-fila-duplicatas]').getAttribute('data-fila-duplicatas')),
      };
    `),
  );
  const temQuem = /por\s+\S+/i.test(aposDecisao.texto ?? "");
  const temQuando = /\b\d{2}\.\d{2}\.\d{4}\b/.test(aposDecisao.texto ?? "");
  exigir(
    aposDecisao.decisoes === 1 && temQuem && temQuando,
    "D-72 · 1 decisão registrada depois do clique, com QUEM decidiu e QUANDO",
    `${aposDecisao.decisoes} decisão · quem: ${temQuem} · quando: ${temQuando} · «${(aposDecisao.texto ?? "").replace(/\n/g, " · ")}»`,
    "1 decisão, com autor e carimbo",
  );
  exigir(
    aposDecisao.grupos === 84 && aposDecisao.fila === 84,
    "[data-grupo] continua em 84 DEPOIS da decisão — o grupo decidido migra, não some",
    `${aposDecisao.grupos} linhas · a tela continua declarando ${aposDecisao.fila}`,
    "84 = 84",
  );

  const carimbo = anosDoTexto(aposDecisao.texto ?? "");
  exigir(
    carimbo.length > 0 && carimbo.every((a) => a <= 2026),
    "o carimbo da decisão vem da DATA DE REFERÊNCIA do build, não do relógio do runtime",
    `anos lidos no registro: ${carimbo.join(", ")} · a data de referência é ${DATA_DE_REFERENCIA} (comparação por ano convertido a número, nunca por string)`,
    "nenhum ano acima de 2026",
  );

  // ---- reversibilidade, e os números do colapso ----
  const reversivel = await cdp.avaliar(
    naPagina4(`
      const b = document.querySelector('[data-reversivel]');
      return { visivel: visivel(b), altura: alturaDe(b), texto: b ? b.innerText.trim() : null };
    `),
  );
  const citaProcedencia = /proced[êe]ncia/i.test(reversivel.texto ?? "");
  const citaDuplicataDe = /duplicata_de/.test(reversivel.texto ?? "");
  exigir(
    reversivel.visivel && citaProcedencia && citaDuplicataDe,
    "D-71 · o bloco de reversibilidade cita procedência preservada e a relação duplicata_de",
    `${reversivel.altura}px · procedência: ${citaProcedencia} · duplicata_de: ${citaDuplicataDe} · ${(reversivel.texto ?? "").length} caracteres`,
    "visível, citando as duas coisas",
  );

  const colapso = await cdp.avaliar(naPagina4(`return texto(document.body);`));
  const temColapso = ["80", "40", "1.304"].every((n) => colapso.includes(n));
  exigir(
    temColapso,
    "os números do colapso NA TELA: 80 registros, 40 eventos, 1.304 ocorrências",
    `80: ${colapso.includes("80")} · 40: ${colapso.includes("40")} · 1.304: ${colapso.includes("1.304")}`,
    "os três presentes no texto renderizado",
  );

  const naoSustenta = await cdp.avaliar(
    naPagina4(`return visiveis('[data-nao-sustenta]').map(b => b.innerText.trim());`),
  );
  exigir(
    naoSustenta.length === 3 && naoSustenta.every((t) => /\d/.test(t)),
    "os TRÊS blocos do que o acervo não sustenta, visíveis, cada um com número",
    `${naoSustenta.length} blocos · ${naoSustenta.map((t) => `${t.length} car.`).join(" · ")}`,
    "3 blocos, todos com dígito",
  );
  relatorio.naoSustentaDuplicatas = naoSustenta;

  // ---- geometria: a lição de 04-04 aplicada onde o gate afirma que a tela é USÁVEL ----
  const geo = await cdp.avaliar(
    naPagina4(`
      const t = transbordaNaHorizontal();
      const painel = document.querySelector('[data-grupo-escolhido]');
      const linha = document.querySelector('[data-grupo]');
      const acoes = todos('[data-acao]');
      return {
        ...t,
        painelDentro: dentroDaJanela(painel),
        linhaDentro: dentroDaJanela(linha),
        acoesDentro: acoes.filter(a => dentroDaJanela(a)).length,
        acoes: acoes.length,
      };
    `),
  );
  exigir(
    !geo.transborda && geo.painelDentro && geo.linhaDentro && geo.acoesDentro === geo.acoes,
    "geometria: nada da tela de duplicatas corre para fora da janela (a lição que 04-04 pagou)",
    `scrollWidth ${geo.scrollWidth} contra clientWidth ${geo.clientWidth} · painel dentro: ${geo.painelDentro} · linha dentro: ${geo.linhaDentro} · ` +
      `${geo.acoesDentro} de ${geo.acoes} botões de ação dentro da janela`,
    "sem transbordo horizontal e tudo dentro da janela",
  );

  await fotografar(cdp, "f4-duplicatas");

  resumo.push([
    "STUD-01",
    `Duplicatas: 84 grupos declarados e 84 na tela (33 determinísticos, dos quais 6 REAIS do acervo, + 51 probabilísticos com score); ` +
      `critério de identidade visível, 1 de 3 componentes sustentado; escolher grupo troca o painel sem mudar a URL; ` +
      `${aposEscolha.campos.length} campos comparados com ${aposEscolha.divergentes} divergentes marcados; 3 ações, 0 decisão antes do clique e 1 depois, com autor e carimbo; ` +
      `colapso 80 registros → 40 eventos com 1.304 ocorrências preservadas`,
  ]);
}

// ---------------------------------------------------------------------------
// (e) STUD-02 · /studio/ocorrencias — a ficha imutável, a prévia de impacto que MUDA, e
// a alteração que toca uma linha de 53.
//
// O gate que carrega esta tela é o da prévia 0 → 1: sem ele, D-74 é afirmação de slide.
// Um número que fica em 1 tanto faz o storage ter a sessão como não ter é constante
// escrita na tela, e nenhuma quantidade de prosa ao lado o transforma em medida.
// ---------------------------------------------------------------------------

/** Abre a edição da linha, por CLIQUE no botão «alterar horário» dela. */
async function abrirEdicao(cdp, ocorrenciaId) {
  await cdp.clicar(
    `Array.from(document.querySelector('[data-ocorrencia="${ocorrenciaId}"]').querySelectorAll('button'))
       .find(b => /alterar horário/i.test(b.textContent || ''))`,
  );
  await respirar(600);
}

async function lerImpacto(cdp) {
  return cdp.avaliar(
    naPagina4(`
      const i = document.querySelector('[data-impacto]');
      const f = document.querySelector('[data-impacto-fonte]');
      return {
        editando: conta('[data-editando]'),
        impacto: i ? Number(i.getAttribute('data-impacto')) : null,
        impactoVisivel: visivel(i),
        fonte: f ? f.innerText.trim() : null,
        confirmar: conta('[data-confirmar]'),
        confirmarVisivel: contaVisiveis('[data-confirmar]'),
        confirmarDesabilitado: document.querySelector('[data-confirmar]')?.disabled ?? null,
        cancelar: conta('[data-cancelar]'),
      };
    `),
  );
}

async function blocoOcorrencias(cdp, base, sonda) {
  titulo("── (e) STUD-02 · /studio/ocorrencias: ficha imutável, prévia de impacto 0 → 1, 1 de 53 ──");

  // Sessão limpa: sem isto a prévia poderia começar em 1 por resíduo de outro bloco, e o
  // gate 0 → 1 mediria o resíduo em vez do mecanismo.
  await porVisaoWebPorStorage(cdp, base, "/studio/ocorrencias/");
  await cdp.avaliar(`localStorage.removeItem('agenda-cultural:salvos')`);
  await cdp.recarregar();
  await coletarRede(cdp);

  const topo = await cdp.avaliar(
    naPagina4(`
      const ficha = document.querySelector('[data-evento-imutavel]');
      return {
        evento: ficha ? ficha.getAttribute('data-evento-imutavel') : null,
        visivel: visivel(ficha),
        texto: ficha ? ficha.innerText.trim() : null,
        selo: /imut[áa]vel/i.test(ficha ? ficha.innerText : ''),
        controlesNaFicha: ficha ? ficha.querySelectorAll('input, button, select, textarea').length : -1,
        linhas: contaVisiveis('[data-ocorrencia]'),
      };
    `),
  );
  exigir(
    topo.evento === sonda.eventoDoStudio && topo.visivel && topo.selo && topo.linhas === 53,
    "D-73 · o evento imutável no topo e as 53 sessões dele na tabela",
    `${topo.evento} (o módulo declara ${sonda.eventoDoStudio}) · selo «imutável»: ${topo.selo} · ${topo.linhas} sessões visíveis · ficha com ${topo.texto.length} caracteres`,
    "evento:cms:13845 com selo, 53 sessões",
  );
  exigir(
    topo.controlesNaFicha === 0,
    "D-73/T-04-15 · a ficha do evento não tem CAMINHO DE ESCRITA — a ausência é o conteúdo",
    `${topo.controlesNaFicha} input/button/select/textarea dentro de [data-evento-imutavel]`,
    "0 controles",
  );

  // ---- a prévia de impacto, com o storage VAZIO ----
  await abrirEdicao(cdp, OCORRENCIA_ATINGIDA);
  const semSalvo = await lerImpacto(cdp);
  exigir(
    semSalvo.editando === 1 && semSalvo.impacto === 0 && semSalvo.impactoVisivel && (semSalvo.fonte ?? "").length > 50,
    "D-74 · com o storage vazio, a prévia de impacto é 0 — e a tela diz de onde o 0 vem",
    `data-editando=${semSalvo.editando} · data-impacto=${semSalvo.impacto} · fonte com ${(semSalvo.fonte ?? "").length} caracteres`,
    "0, com a origem em texto",
  );
  imprimirTexto("a procedência do número, com o storage vazio", semSalvo.fonte);

  // Os CINCO atributos de interação de 04-03, medidos onde eles existem. No HTML exportado
  // medem 0 (gate (b3)); aqui, depois do clique, medem 1. Um gate por grep concluiria que o
  // contrato está quebrado quando ele está intacto.
  exigir(
    semSalvo.editando === 1 && semSalvo.confirmar === 1 && semSalvo.cancelar === 1 && semSalvo.impacto !== null,
    "os 5 atributos de INTERAÇÃO de 04-03 existem no DOM depois do clique em «alterar horário»",
    `data-editando=${semSalvo.editando} · data-impacto=${semSalvo.impacto !== null ? 1 : 0} · data-impacto-fonte=${semSalvo.fonte ? 1 : 0} · ` +
      `data-confirmar=${semSalvo.confirmar} · data-cancelar=${semSalvo.cancelar} — os mesmos que medem 0 no HTML exportado`,
    "1 de cada",
  );

  // ---- salvar aquela sessão NESTE navegador e reeditar: o número tem de subir ----
  await cdp.avaliar(
    `localStorage.setItem('agenda-cultural:salvos', ${JSON.stringify(JSON.stringify([OCORRENCIA_ATINGIDA]))})`,
  );
  await cdp.recarregar();
  await coletarRede(cdp);
  await abrirEdicao(cdp, OCORRENCIA_ATINGIDA);
  const comSalvo = await lerImpacto(cdp);
  exigir(
    comSalvo.impacto === 1,
    "D-74 · O GATE QUE CARREGA A TELA: salva a sessão neste navegador, a prévia vai a 1",
    `0 → ${comSalvo.impacto} · o número vem do estado salvo, e não é constante escrita na tela`,
    "1",
  );
  imprimirTexto("a procedência do número, com a sessão salva", comSalvo.fonte);

  // E o contraexemplo que fecha o argumento: só a IRMÃ salva mantém o número em 0. Sem ele,
  // «1» poderia significar «alguém salvou algo deste evento», que é outra coisa.
  await cdp.avaliar(`localStorage.setItem('agenda-cultural:salvos', ${JSON.stringify(JSON.stringify([OCORRENCIA_IRMA]))})`);
  await cdp.recarregar();
  await coletarRede(cdp);
  await abrirEdicao(cdp, OCORRENCIA_ATINGIDA);
  const soIrma = await lerImpacto(cdp);
  exigir(
    soIrma.impacto === 0,
    "D-74 · com só a sessão IRMÃ salva, a prévia volta a 0 — o número é desta sessão, não do evento",
    `data-impacto=${soIrma.impacto} com ${OCORRENCIA_IRMA} salva e ${OCORRENCIA_ATINGIDA} não`,
    "0",
  );

  // ---- confirmar: 1 de 53 muda, a ficha não muda, o histórico cresce em 1 ----
  await cdp.avaliar(`localStorage.setItem('agenda-cultural:salvos', ${JSON.stringify(JSON.stringify([OCORRENCIA_ATINGIDA]))})`);
  await cdp.recarregar();
  await coletarRede(cdp);

  const antes = await cdp.avaliar(
    naPagina4(`return {
      ficha: document.querySelector('[data-evento-imutavel]').innerText,
      linhas: todos('[data-ocorrencia]').map(l => l.innerText),
      historico: conta('[data-historico-item]'),
    };`),
  );

  await abrirEdicao(cdp, OCORRENCIA_ATINGIDA);
  const preConfirmar = await lerImpacto(cdp);
  exigir(
    preConfirmar.confirmarVisivel === 1 && preConfirmar.confirmarDesabilitado === false,
    "o botão de confirmar está visível e HABILITADO quando o horário proposto difere do vigente",
    `visível: ${preConfirmar.confirmarVisivel} · desabilitado: ${preConfirmar.confirmarDesabilitado}`,
    "visível e habilitado",
  );

  await cdp.clicar(`document.querySelector('[data-confirmar]')`);
  await respirar(700);

  const depois = await cdp.avaliar(
    naPagina4(`return {
      ficha: document.querySelector('[data-evento-imutavel]').innerText,
      linhas: todos('[data-ocorrencia]').map(l => l.innerText),
      historico: conta('[data-historico-item]'),
      ultimo: document.querySelectorAll('[data-historico-item]')[0]?.innerText.trim() ?? null,
    };`),
  );

  const mudaram = antes.linhas.map((t, i) => (t !== depois.linhas[i] ? i : -1)).filter((i) => i >= 0);
  exigir(
    mudaram.length === 1 && depois.linhas.length === 53,
    "D-73/T-04-15 · confirmar altera EXATAMENTE 1 de 53 linhas",
    `${mudaram.length} de ${depois.linhas.length} linhas mudaram (índice ${mudaram.join(",")})`,
    "exatamente 1 de 53",
  );
  exigir(
    antes.ficha === depois.ficha,
    "T-04-15 · a ficha do evento fica com o texto IDÊNTICO ao de antes",
    `${antes.ficha.length} caracteres antes, ${depois.ficha.length} depois · idênticos: ${antes.ficha === depois.ficha}`,
    "idêntico caractere a caractere",
  );
  exigir(
    depois.historico === antes.historico + 1,
    "D-75 · o histórico ganha +1 por confirmação, com quem alterou e quando",
    `${antes.historico} → ${depois.historico} · última entrada: «${(depois.ultimo ?? "").replace(/\n/g, " · ").slice(0, 160)}»`,
    `${antes.historico + 1}`,
  );

  // O histórico NÃO nasce vazio: ele já traz a alteração autorada de `alerta.ts` — a mesma
  // que `/salvos` exibe do outro lado. As DUAS de `alerta.ts` existem no módulo, uma por
  // evento; a tela mostra a do evento aberto, e por isso o número na tela é 1, não 2.
  exigir(
    antes.historico === 1 && sonda.historicoAutorado.length === 2,
    "D-75 · o histórico nasce com a alteração AUTORADA do evento aberto (as duas de alerta.ts, uma por evento)",
    `na tela de ${sonda.eventoDoStudio}: ${antes.historico} entrada ao abrir · no módulo: ${sonda.historicoAutorado.length} alterações autoradas, ` +
      `em ${[...new Set(sonda.historicoAutorado.map((h) => h.evento))].join(" e ")}`,
    "1 na tela do evento aberto, 2 no módulo",
  );

  // ---- as quatro declarações honestas, com os quatro números ----
  const honestas = await cdp.avaliar(
    naPagina4(`return visiveis('[data-nao-sustenta]').map(b => ({ chave: b.getAttribute('data-nao-sustenta'), texto: b.innerText.trim() }));`),
  );
  const juntas = honestas.map((h) => h.texto).join(" ");
  const numeros = ["2.425", "129", "300"];
  const faltamNumeros = numeros.filter((n) => !juntas.includes(n));
  exigir(
    honestas.length === 4 && faltamNumeros.length === 0 && /\b0\b/.test(juntas),
    "as QUATRO declarações honestas visíveis, com 2.425, 0, 129 e 300",
    `${honestas.length} blocos (${honestas.map((h) => h.chave).join(", ")}) · números presentes: 2.425, 0, 129, 300 · ` +
      honestas.map((h) => `${h.chave}=${h.texto.length} car.`).join(" · "),
    "4 blocos com os quatro números",
  );

  const geo = await cdp.avaliar(
    naPagina4(`
      const t = transbordaNaHorizontal();
      const ficha = document.querySelector('[data-evento-imutavel]');
      const linhas = todos('[data-ocorrencia]');
      return { ...t, fichaDentro: dentroDaJanela(ficha), linhasDentro: linhas.filter(l => dentroDaJanela(l)).length, linhas: linhas.length };
    `),
  );
  exigir(
    !geo.transborda && geo.fichaDentro && geo.linhasDentro === geo.linhas,
    "geometria: a tabela de 53 sessões não corre para fora da janela",
    `scrollWidth ${geo.scrollWidth} contra clientWidth ${geo.clientWidth} · ficha dentro: ${geo.fichaDentro} · ${geo.linhasDentro} de ${geo.linhas} linhas dentro da janela`,
    "sem transbordo e tudo dentro",
  );

  await fotografar(cdp, "f4-ocorrencias");

  relatorio.parDoCenario4 = sonda.par;

  resumo.push([
    "STUD-02",
    `Ocorrências: ${sonda.eventoDoStudio} imutável no topo (ficha sem um único controle de escrita) com 53 sessões; ` +
      `prévia de impacto medida nos três estados — 0 sem salvo, 1 com a sessão salva, 0 com só a irmã salva, provando que o número vem do estado e não da tela; ` +
      `confirmar alterou 1 de 53, deixou a ficha idêntica caractere a caractere e levou o histórico de ${antes.historico} a ${depois.historico}; ` +
      `4 declarações honestas com 2.425 ocorrências sem espaço, 0 de 300 declarando ingresso e 129 eventos com sessão`,
  ]);
}

// ---------------------------------------------------------------------------
// (f) STUD-03 e STUD-04 · /roteiro e os cinco cenários POR CLIQUE, fora de ordem.
//
// É o bloco mais importante desta suíte, e a única prova de STUD-03 e STUD-04 que não é
// afirmação de slide. A ordem é 4 → 1 → 5 → 2 → 3, DELIBERADAMENTE fora de ordem: cada
// entrada tem de ficar de pé sozinha, porque é assim que a banca vai pedir.
// ---------------------------------------------------------------------------

const ORDEM_DOS_CENARIOS = [4, 1, 5, 2, 3];

/** Volta ao roteiro pelo caminho que quem apresenta usa de verdade. */
async function voltarAoRoteiro(cdp, base) {
  await irPara(cdp, `${base}/roteiro/`);
  const visao = await cdp.avaliar("document.querySelector('[data-view]').getAttribute('data-view')");
  let precisouDeClique = false;
  if (visao !== "web") {
    // O roteiro é superfície de desktop (D-78). Depois de um cenário que exige a visão app,
    // voltar a ele custa UM clique no botão do aviso. É um fato do percurso, não um defeito
    // — e quem conduzir a demonstração precisa saber disso antes de estar na frente da banca.
    await cdp.clicar(
      `Array.from(document.querySelectorAll('button')).find(b => /Trocar para a visão Web/i.test(b.textContent || ''))`,
    );
    await respirar(500);
    precisouDeClique = true;
  }
  const prontos = await cdp.avaliar(
    naPagina4(`return { abrir: contaVisiveis('[data-cenario-abrir]'), view: document.querySelector('[data-view]').getAttribute('data-view') };`),
  );
  return { precisouDeClique, ...prontos };
}

/** Clica na entrada do cenário e espera a navegação de cliente. `router.push` não dá loadEvent. */
async function abrirCenario(cdp, numero) {
  const de = await cdp.avaliar("location.pathname");
  await cdp.clicar(`document.querySelector('[data-cenario-abrir="${numero}"]')`);
  const limite = Date.now() + 30_000;
  for (;;) {
    const agora = await cdp.avaliar("location.pathname");
    if (agora !== de) {
      cdp.navegacoes += 1;
      await cdp.assentar();
      await coletarRede(cdp);
      return { de, para: agora };
    }
    if (Date.now() > limite) throw new Error(`o Cenário ${numero} não navegou: a URL ficou em ${agora}`);
    await respirar(120);
  }
}

const estadoDoNavegador = () =>
  `(() => ({
     visao: localStorage.getItem('agenda-cultural:visao'),
     persona: localStorage.getItem('agenda-cultural:persona'),
     salvos: JSON.parse(localStorage.getItem('agenda-cultural:salvos') || '[]'),
     url: location.pathname,
   }))()`;

async function blocoRoteiro(cdp, base) {
  titulo("── (f) STUD-03 e STUD-04 · /roteiro: os cinco cenários por clique, na ordem 4 → 1 → 5 → 2 → 3 ──");

  await porVisaoWebPorStorage(cdp, base, "/roteiro/");

  const tela = await cdp.avaliar(
    naPagina4(`
      const raiz = document.querySelector('[data-roteiro]');
      const cen = todos('[data-cenario]');
      const primeirasRotas = {};
      for (const c of cen) {
        const n = c.getAttribute('data-cenario');
        const r = c.querySelector('[data-cenario-rota]');
        primeirasRotas[n] = r ? r.getAttribute('data-cenario-rota') : null;
      }
      const visoes = {};
      for (const c of todos('[data-cenario-visao]')) visoes[c.getAttribute('data-cenario')] = c.getAttribute('data-cenario-visao');
      return {
        declarado: Number(raiz.getAttribute('data-roteiro')),
        cenarios: cen.length,
        abrir: contaVisiveis('[data-cenario-abrir]'),
        atalhos: contaVisiveis('[data-cenario-atalho]'),
        rotas: conta('[data-cenario-rota]'),
        primeirasRotas, visoes,
      };
    `),
  );
  exigir(
    tela.declarado === 5 && tela.cenarios === 5 && tela.abrir === 5 && tela.rotas === 13,
    "D-76 · o roteiro declara 5 cenários, tem 5 blocos, 5 entradas diretas e 13 rotas escritas",
    `data-roteiro=${tela.declarado} · ${tela.cenarios} blocos · ${tela.abrir} botões data-cenario-abrir · ${tela.rotas} rotas · ${tela.atalhos} atalhos de índice`,
    "5 / 5 / 5 / 13",
  );
  exigir(
    tela.abrir === 5 && tela.atalhos === 5,
    "os atalhos do índice são data-cenario-atalho e NÃO inflam data-cenario-abrir, que fica em 5",
    `data-cenario-abrir=${tela.abrir} · data-cenario-atalho=${tela.atalhos} — dois vocabulários, 5 cada, e não 10 num só`,
    "5 e 5",
  );

  // GEOMETRIA DO ÍNDICE — o gate que 04-04 não tinha e que a foto teve de fazer por ele.
  // Presença e visibilidade davam verde com o quinto atalho cortado fora da janela.
  const indiceAntes = await cdp.avaliar(
    naPagina4(`
      const t = transbordaNaHorizontal();
      const atalhos = todos('[data-cenario-atalho]');
      const fora = atalhos.filter(a => !dentroDaJanela(a)).map(a => a.getAttribute('data-cenario-atalho'));
      const quinto = atalhos[atalhos.length - 1];
      const r = quinto.getBoundingClientRect();
      const indice = document.querySelector('.rot-indice');
      return { ...t, fora, quintoDireita: Math.round(r.right), janela: innerWidth,
               indiceTopo: Math.round(indice.getBoundingClientRect().top), altura: document.documentElement.scrollHeight };
    `),
  );
  exigir(
    !indiceAntes.transborda && indiceAntes.fora.length === 0,
    "STUD-04 · os CINCO atalhos do índice cabem na janela — medido por geometria, não por visibilidade",
    `scrollWidth ${indiceAntes.scrollWidth} = clientWidth ${indiceAntes.clientWidth} · 0 atalhos fora da janela · ` +
      `o quinto termina em ${indiceAntes.quintoDireita}px de ${indiceAntes.janela}px · página com ${indiceAntes.altura}px`,
    "sem transbordo e nenhum atalho fora",
  );

  await cdp.avaliar("window.scrollTo(0, 3490)");
  await respirar(400);
  const indiceRolado = await cdp.avaliar(
    naPagina4(`
      const indice = document.querySelector('.rot-indice');
      const atalhos = todos('[data-cenario-atalho]');
      return {
        topo: Math.round(indice.getBoundingClientRect().top),
        rolagem: Math.round(window.scrollY),
        dentro: atalhos.filter(a => dentroDaJanela(a)).length,
        total: atalhos.length,
      };
    `),
  );
  exigir(
    indiceRolado.topo <= 1 && indiceRolado.dentro === indiceRolado.total,
    "STUD-04 · o índice fica grudado no topo depois de rolar, com os cinco alcançáveis",
    `rolagem ${indiceRolado.rolagem}px · índice em top=${indiceRolado.topo} · ${indiceRolado.dentro} de ${indiceRolado.total} atalhos dentro da janela`,
    "top ≈ 0 e os 5 alcançáveis",
  );
  await cdp.avaliar("window.scrollTo(0, 0)");
  await respirar(300);

  // ---- os cinco blocos do que o acervo NÃO sustenta ----
  const naoSustentam = await cdp.avaliar(
    naPagina4(`
      return {
        blocos: visiveis('[data-cenario-nao-sustenta]').map(b => ({ n: b.getAttribute('data-cenario-nao-sustenta'), texto: b.innerText.trim() })),
      };
    `),
  );
  exigir(
    naoSustentam.blocos.length === 5 && naoSustentam.blocos.every((b) => /\d/.test(b.texto)),
    "D-77 · os CINCO blocos do que o acervo não sustenta, visíveis, cada um com número",
    `${naoSustentam.blocos.length} blocos · ` +
      naoSustentam.blocos.map((b) => `Cenário ${b.n}: ${b.texto.length} car.`).join(" · "),
    "5 blocos, todos com dígito",
  );
  for (const b of naoSustentam.blocos) imprimirTexto(`Cenário ${b.n} — o que o acervo NÃO sustenta`, b.texto);
  relatorio.textosDosCenarios = naoSustentam.blocos;

  // ---- OS CINCO CENÁRIOS, POR CLIQUE, FORA DE ORDEM ----
  titulo("  os cinco cenários, POR CLIQUE, na ordem 4 → 1 → 5 → 2 → 3 (fora de ordem de propósito)");
  const percurso = [];

  for (const n of ORDEM_DOS_CENARIOS) {
    const volta = await voltarAoRoteiro(cdp, base);
    exigir(
      volta.abrir === 5 && volta.view === "web",
      `antes do Cenário ${n}: o roteiro está de pé e as 5 entradas estão clicáveis`,
      `${volta.abrir} entradas visíveis · visão ${volta.view}` +
        (volta.precisouDeClique ? " · foi preciso 1 clique em «Trocar para a visão Web» (o cenário anterior exigia a visão app)" : ""),
      "5 entradas na visão web",
    );

    const visaoDeclarada = tela.visoes[String(n)];
    const rotaDeclarada = tela.primeirasRotas[String(n)];
    const salto = await abrirCenario(cdp, n);
    const estado = await cdp.avaliar(estadoDoNavegador());

    exigir(
      estado.url === rotaDeclarada && estado.visao === visaoDeclarada,
      `Cenário ${n} · o clique põe a visão declarada e leva à primeira rota do percurso`,
      `${salto.de} → ${salto.para} (a tela declara ${rotaDeclarada}) · visão ${estado.visao} (declarada ${visaoDeclarada}) · ${estado.salvos.length} salvos`,
      `${rotaDeclarada} na visão ${visaoDeclarada}`,
    );
    percurso.push({ n, de: salto.de, para: salto.para, visao: estado.visao, salvos: estado.salvos.length, persona: estado.persona });

    // ---- a prova específica de cada cenário, na tela em que ele desemboca ----
    if (n === 4) {
      await irPara(cdp, `${base}/salvos/`);
      const salvos = await cdp.avaliar(
        naPagina4(`
          const linhas = todos('[data-salvo]');
          return {
            declarado: Number(document.querySelector('[data-salvos]').getAttribute('data-salvos')),
            linhas: linhas.length,
            alertados: linhas.filter(l => l.getAttribute('data-salvo-alertado') === 'sim').length,
            ids: linhas.map(l => l.getAttribute('data-salvo')),
            alerta: textoDe('[data-alerta]'),
          };
        `),
      );
      exigir(
        salvos.declarado === 2 && salvos.linhas === 2 && salvos.alertados === 1,
        "Cenário 4 · /salvos mostra 2 salvos e EXATAMENTE 1 alertado — a medida da fase 3, chegando por outro caminho",
        `${salvos.declarado} declarados · ${salvos.linhas} linhas · ${salvos.alertados} alertado · ids ${salvos.ids.join(", ")}`,
        "2 salvos, 1 alertado",
      );
      relatorio.parDoCenario4 = { ...(relatorio.parDoCenario4 ?? {}), alerta: salvos.alerta, ids: salvos.ids };
    }

    if (n === 1) {
      const persona = await cdp.avaliar(estadoDoNavegador());
      await irPara(cdp, `${base}/descobrir/`);
      const descobrir = await cdp.avaliar(
        naPagina4(`return { itens: contaVisiveis('[data-motivo], article, [data-cartao]'), texto: texto(document.body).slice(0, 200) };`),
      );
      exigir(
        /maria/i.test(persona.persona ?? "") && descobrir.itens > 0,
        "Cenário 1 · a persona ativa é Maria e /descobrir/ responde",
        `persona=${persona.persona} · ${descobrir.itens} itens visíveis em /descobrir/`,
        "Maria, com /descobrir respondendo",
      );
    }

    if (n === 5) {
      const frase = await cdp.avaliar(
        naPagina4(`
          return {
            fichas: visiveis('[data-criterio]').map(f => f.getAttribute('data-criterio')),
            frase: textoDe('[data-frase]'),
            resultados: Number(document.querySelector('[data-resultados-exibidos]')?.getAttribute('data-resultados-exibidos') ?? -1),
          };
        `),
      );
      exigir(
        frase.fichas.length >= 3 && frase.resultados > 0,
        "Cenário 5 · /buscar/frase abre com a frase JÁ TRADUZIDA em fichas",
        `${frase.fichas.length} fichas (${frase.fichas.join(", ")}) · ${frase.resultados} resultados`,
        "≥3 fichas e resultados > 0",
      );
    }

    if (n === 2) {
      const cidade = await cdp.avaliar(
        naPagina4(`
          const links = todos('a[href]').map(a => a.getAttribute('href')).filter(h => /\\/mapa\\/?#/.test(h));
          return { links: links.length, primeiro: links[0] ?? null, comBarra: links.filter(h => h.startsWith('/mapa/#')).length };
        `),
      );
      exigir(
        cidade.links > 0 && cidade.comBarra === cidade.links,
        "Cenário 2 · /cidade/belem-para abre e a lente do mapa usa a gramática /mapa/# COM a barra final",
        `${cidade.links} links de lente, ${cidade.comBarra} deles com a barra · «${(cidade.primeiro ?? "").slice(0, 80)}…»`,
        "todos com /mapa/#",
      );
    }

    if (n === 3) {
      const dup = await cdp.avaliar(
        naPagina4(`return {
          view: document.querySelector('[data-view]').getAttribute('data-view'),
          fila: Number(document.querySelector('[data-fila-duplicatas]')?.getAttribute('data-fila-duplicatas') ?? -1),
          visivel: contaVisiveis('[data-grupo]'),
        };`),
      );
      exigir(
        dup.view === "web" && dup.fila === 84 && dup.visivel === 84,
        "Cenário 3 · /studio/duplicatas abre na visão web, com os 84 grupos na tela",
        `visão ${dup.view} · fila declara ${dup.fila} · ${dup.visivel} grupos visíveis`,
        "web, 84 e 84",
      );
    }
  }

  const salvosPorCenario = percurso.map((p) => p.salvos);
  exigir(
    salvosPorCenario.every((s) => s === 2),
    "STUD-04 · o conjunto de salvos fica em 2 nas CINCO passagens fora de ordem — a semeadura não se desfaz",
    `salvos após cada clique, na ordem ${ORDEM_DOS_CENARIOS.join(" → ")}: ${salvosPorCenario.join(", ")}`,
    "2 em todas",
  );

  // ---- idempotência: clicar duas vezes no mesmo cenário deixa o mesmo estado (T-04-21) ----
  await voltarAoRoteiro(cdp, base);
  await abrirCenario(cdp, 4);
  const primeira = await cdp.avaliar(estadoDoNavegador());
  await voltarAoRoteiro(cdp, base);
  await abrirCenario(cdp, 4);
  const segunda = await cdp.avaliar(estadoDoNavegador());
  const iguais = JSON.stringify([...primeira.salvos].sort()) === JSON.stringify([...segunda.salvos].sort());
  exigir(
    iguais && segunda.salvos.length === 2,
    "T-04-21 · clicar DUAS VEZES no mesmo cenário deixa o mesmo estado — a semeadura é idempotente",
    `1ª: ${primeira.salvos.length} salvos ${JSON.stringify(primeira.salvos)} · 2ª: ${segunda.salvos.length} salvos · conjuntos iguais: ${iguais}`,
    "o mesmo conjunto, 2 salvos",
  );

  await voltarAoRoteiro(cdp, base);
  await fotografar(cdp, "f4-roteiro");

  relatorio.cenarios = percurso;
  titulo("  o percurso, na ordem em que foi clicado:");
  for (const p of percurso) nota(`Cenário ${p.n}: ${p.de} → ${p.para} · visão ${p.visao} · ${p.salvos} salvos`);

  resumo.push([
    "STUD-03",
    `Roteiro: 5 cenários declarados e 5 na tela, 13 rotas escritas, os 5 blocos do que o acervo NÃO sustenta visíveis ` +
      `(${naoSustentam.blocos.map((b) => `${b.texto.length}`).join("/")} caracteres, todos com número), índice grudado no topo com os 5 atalhos dentro da janela`,
  ]);
  resumo.push([
    "STUD-04",
    `Os cinco cenários andaram POR CLIQUE fora de ordem — ${percurso.map((p) => `${p.n}→${p.para}`).join(" · ")} — ` +
      `cada um pondo a visão declarada e semeando o estado; salvos em 2 nas cinco passagens e idempotente ao clicar duas vezes no mesmo cenário`,
  ]);
}

// ---------------------------------------------------------------------------
// (g) A DECLARAÇÃO DE HONESTIDADE nas três telas novas.
//
// Este bloco media o modo comentado — os comentários somem, o argumento fica. O modo saiu
// do produto em 23/08 e a primeira metade deixou de existir; a SEGUNDA continua sendo o
// que importava: cada uma das três telas do bastidor tem de mostrar, sem depender de
// interruptor nenhum, o que o acervo NÃO sustenta. Uma tela que perde esse bloco vira
// exatamente o painel opaco contra o qual a proposta argumenta.
// ---------------------------------------------------------------------------

const HONESTIDADE_POR_ROTA = {
  "/studio/duplicatas/": "[data-nao-sustenta], [data-criterio], [data-reversivel]",
  "/studio/ocorrencias/": "[data-nao-sustenta], [data-evento-imutavel]",
  "/roteiro/": "[data-cenario-nao-sustenta], [data-cenario-sustenta]",
};

async function blocoDeHonestidade(cdp, base) {
  titulo("── (g) a declaração de honestidade nas três telas novas ──");

  for (const [rota, seletorHonesto] of Object.entries(HONESTIDADE_POR_ROTA)) {
    await cdp.avaliar(`localStorage.setItem('agenda-cultural:visao', 'web')`);
    await irPara(cdp, `${base}${rota}`);

    const honestos = await cdp.avaliar(
      naPagina4(`return contaVisiveis(${JSON.stringify(seletorHonesto)});`),
    );
    exigir(
      honestos > 0,
      `${rota} · o que o acervo NÃO sustenta está na tela`,
      `${honestos} blocos de honestidade/procedência visíveis · seletor ${seletorHonesto}`,
      "> 0",
    );
  }
}

// ---------------------------------------------------------------------------
// (h) AMEAÇAS EXERCITADAS, não declaradas.
//
// A 02-05 encontrou três defeitos nas próprias mitigações, e os três só apareceram porque
// foram testados. Uma mitigação declarada e não exercitada é uma mitigação que não existe.
// ---------------------------------------------------------------------------

async function gatesDeAmeaca(cdp, base) {
  titulo("── (h) ameaças exercitadas (não declaradas) ──");

  // T-04-13 · storage adulterado: id que o índice do build não resolve, e valor que não é lista.
  await cdp.avaliar(`localStorage.setItem('agenda-cultural:visao', 'web')`);
  await cdp.avaliar(
    `localStorage.setItem('agenda-cultural:salvos', ${JSON.stringify(JSON.stringify([OCORRENCIA_ATINGIDA, "ocorrencia:derivado:nao-existe-0000"]))})`,
  );
  await irPara(cdp, `${base}/studio/ocorrencias/`);
  await abrirEdicao(cdp, OCORRENCIA_ATINGIDA);
  const comLixo = await lerImpacto(cdp);
  exigir(
    comLixo.impacto === 1 && (comLixo.fonte ?? "").length > 0,
    "T-04-13 · id inexistente no storage NÃO incrementa a prévia, e a tela não quebra",
    `data-impacto=${comLixo.impacto} com 1 id válido + 1 inexistente · o descarte é declarado em ${(comLixo.fonte ?? "").length} caracteres de procedência`,
    "1 — o número não cresce com id que o acervo não tem",
  );

  await cdp.avaliar(`localStorage.setItem('agenda-cultural:salvos', 'isto-nao-e-lista')`);
  await cdp.recarregar();
  await coletarRede(cdp);
  await abrirEdicao(cdp, OCORRENCIA_ATINGIDA);
  const naoLista = await lerImpacto(cdp);
  exigir(
    naoLista.impacto === 0 && naoLista.editando === 1,
    "T-04-13 · valor que NÃO é lista no storage: a prévia cai a 0 e a tela continua de pé",
    `storage = "isto-nao-e-lista" · data-impacto=${naoLista.impacto} · a linha continua editável (data-editando=${naoLista.editando})`,
    "0, sem quebrar",
  );
  await cdp.avaliar(`localStorage.removeItem('agenda-cultural:salvos')`);

  // T-04-20 · persona desconhecida antes de abrir um cenário: a tela cai no padrão e o
  // cenário abre mesmo assim. Uma demonstração que trava porque o storage tem lixo de uma
  // sessão anterior trava na frente da banca, que é o único lugar onde isso importa.
  await cdp.avaliar(`localStorage.setItem('agenda-cultural:persona', 'pessoa-usuaria:nao-existe:fulano')`);
  await irPara(cdp, `${base}/roteiro/`);
  const comPersonaTorta = await cdp.avaliar(
    naPagina4(`return { abrir: contaVisiveis('[data-cenario-abrir]'), view: document.querySelector('[data-view]').getAttribute('data-view') };`),
  );
  exigir(
    comPersonaTorta.abrir === 5,
    "T-04-20 · persona desconhecida em agenda-cultural:persona: o roteiro abre mesmo assim",
    `persona = «pessoa-usuaria:nao-existe:fulano» · ${comPersonaTorta.abrir} entradas visíveis · visão ${comPersonaTorta.view}`,
    "5 entradas",
  );
  const saltoTorto = await abrirCenario(cdp, 1);
  const estadoTorto = await cdp.avaliar(estadoDoNavegador());
  exigir(
    saltoTorto.para === "/onboarding/1/" && /maria/i.test(estadoTorto.persona ?? ""),
    "T-04-20 · e o cenário abre CORRIGINDO a persona para a que ele declara",
    `${saltoTorto.de} → ${saltoTorto.para} · persona ${estadoTorto.persona}`,
    "/onboarding/1/ com a persona do cenário",
  );

  // T-04-07 · a tela de duplicatas carregada do zero: 0 decisões antes de qualquer clique.
  // Repetido aqui, em carga limpa, porque é o gate que separa «a fusão é humana» de slogan.
  await cdp.avaliar(`localStorage.setItem('agenda-cultural:visao', 'web')`);
  await irPara(cdp, `${base}/studio/duplicatas/`);
  const semDecisao = await cdp.avaliar(naPagina4(`return { decisoes: conta('[data-decisao]'), acoes: contaVisiveis('[data-acao]') };`));
  exigir(
    semDecisao.decisoes === 0 && semDecisao.acoes === 3,
    "T-04-07 · /studio/duplicatas carregada do zero: 0 decisões, e as 3 ações esperando um humano",
    `${semDecisao.decisoes} decisões · ${semDecisao.acoes} ações visíveis`,
    "0 decisões e 3 ações",
  );
}

// ---------------------------------------------------------------------------
// Console e rede — acumulados na SESSÃO INTEIRA.
// ---------------------------------------------------------------------------

const AVISO_DE_PRELOAD = /was preloaded using link preload but not used/;

function gateConsole(cdp) {
  titulo("── console, acumulado na sessão inteira ──");
  const erros = cdp.consola.filter((c) => c.nivel === "erro");
  const avisos = cdp.consola.filter((c) => c.nivel === "aviso");
  const preload = avisos.filter((c) => AVISO_DE_PRELOAD.test(c.texto));
  const daAplicacao = avisos.filter((c) => !AVISO_DE_PRELOAD.test(c.texto));

  for (const c of [...erros, ...daAplicacao].slice(0, 20)) nota(`${c.nivel}: ${c.texto.slice(0, 200)}`);

  exigir(
    erros.length === 0 && daAplicacao.length === 0,
    "console · erros e avisos DA APLICAÇÃO",
    `${erros.length} erro, ${daAplicacao.length} aviso da aplicação em ${cdp.navegacoes} navegações`,
    "0 erro, 0 aviso da aplicação",
  );

  // O número que a consolidação entregou. É a regressão que a fase 4 mais facilmente
  // reintroduziria — basta uma folha importada de dentro de um componente.
  const chunks = [...new Set(preload.map((c) => (c.texto.match(/chunks\/([a-z0-9_-]+)\.css/) || [])[1]).filter(Boolean))];
  exigir(
    preload.length === 0,
    "console · CSS pré-carregado e não usado (o número que a consolidação entregou)",
    `${preload.length} diagnóstico(s) em ${cdp.navegacoes} navegações${chunks.length ? ` · chunks: ${chunks.join(", ")}` : ""}`,
    "0",
  );

  resumo.push([
    "console",
    `0 erro, 0 aviso da aplicação em ${cdp.navegacoes} navegações · ${preload.length} diagnóstico de CSS pré-carregado e não usado`,
  ]);
  return { navegacoes: cdp.navegacoes, preload: preload.length };
}

function gateRede(cdp, base) {
  titulo("── rede, medida POR DENTRO DA PÁGINA (T-03-17, T-04-30) ──");
  const externos = [...recursos].filter((u) => !u.startsWith(base) && !u.startsWith("data:") && !u.startsWith("blob:"));
  for (const u of externos.slice(0, 20)) nota(`EXTERNO: ${u}`);
  exigir(
    externos.length === 0,
    "requisição para fora do servidor local",
    `0 requisição externa · ${recursos.size} recursos distintos, todos em ${base}, em ${cdp.navegacoes} navegações`,
    "0",
  );
  resumo.push([
    "rede",
    `0 requisição externa em ${cdp.navegacoes} navegações · ${recursos.size} recursos distintos, todos no servidor local — ` +
      `nenhum tile, nenhuma fonte remota, nenhuma chamada de modelo. Medida por performance.getEntriesByType('resource'), de dentro da página`,
  ]);
}

// ---------------------------------------------------------------------------
// Resumo — uma linha por requisito, e o que quem conduzir a demonstração precisa saber.
// ---------------------------------------------------------------------------

function imprimirResumo() {
  titulo("── resumo · uma linha por requisito ──");
  const ordem = (n) => (n.startsWith("STUD-") ? Number(n.slice(5)) : 90);
  for (const [nome, valor] of [...resumo].sort((a, b) => ordem(a[0]) - ordem(b[0]))) {
    console.log(`  ${nome.padEnd(10)} ${valor}`);
  }

  titulo("── o que quem conduzir a demonstração precisa saber ──");
  console.log("\n  1 · O PERCURSO DOS CINCO CENÁRIOS, na ordem em que foram clicados e provados:");
  for (const p of relatorio.cenarios) {
    console.log(`     Cenário ${p.n}: clique em /roteiro/ → ${p.para} · visão ${p.visao} · ${p.salvos} salvos semeados`);
  }
  console.log(
    "     Depois de um cenário de visão APP (1, 2 e 5), voltar ao /roteiro/ custa UM clique em\n" +
      "     «Trocar para a visão Web» — o roteiro é superfície de desktop (D-78). Não é defeito;\n" +
      "     é um passo do percurso, e é melhor sabê-lo agora do que ao vivo.",
  );

  console.log("\n  2 · O CRITÉRIO DE IDENTIDADE da tela de duplicatas, para ser lido em voz alta:");
  imprimirTexto("critério", relatorio.criterioDeIdentidade ?? "(não medido)");

  console.log("\n  3 · OS CINCO TEXTOS do que o acervo NÃO sustenta (um por cenário) estão impressos por\n     inteiro no bloco (f), acima.");

  console.log("\n  4 · O PAR DE SESSÕES DO CENÁRIO 4, com data e hora:");
  const par = relatorio.parDoCenario4;
  if (par?.atingida) {
    console.log(`     atingida: ${par.atingida.id} — ${par.atingida.dataCurta} às ${par.atingida.hora}`);
    console.log(`     intacta : ${par.intacta.id} — ${par.intacta.dataCurta} às ${par.intacta.hora}`);
    console.log(`     evento  : ${par.eventoId} — ${par.eventoTitulo}`);
  }

  console.log("\n  5 · OS NÚMEROS QUE A BANCA VAI OUVIR:");
  console.log("     84 grupos na fila (33 determinísticos + 51 probabilísticos)");
  console.log("     6 deles são duplicatas REAIS do acervo, que ninguém plantou");
  console.log("     80 registros colapsam em 40 eventos, com 1.304 ocorrências preservadas");
  console.log("     2.425 ocorrências e NENHUMA declara espaço — 0 de 2.425");
  console.log("     0 de 300 eventos declaram ingresso — gratuidade não recorta neste acervo");
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------

async function principal() {
  console.log(
    "verificar-fase4 — STUD-01 a STUD-04 e os cinco cenários do RFP sobre o artefato exportado, em Chrome headless\n",
  );

  if (!existsSync(path.join(OUT, "index.html"))) {
    throw new Error("out/ não existe ou está incompleto. Rode `npm run build` antes.");
  }

  const sonda = await sondarModulos();
  await gatesEstruturais();
  gateCoerencia(sonda);
  await gateContratoNoHtml();

  const servidor = await servir({ raiz: OUT, porta: Number(process.env.PORTA ?? 0) || undefined });
  console.log(`\n  servidor estático em ${servidor.url} (raiz: out/)`);

  let cdp = null;
  try {
    // T-04-26 / T-02-22: se o Chrome não existir — ou se `CHROME_BIN` apontar para caminho
    // inexistente — `abrirNavegador` LANÇA aqui e o script sai com código diferente de zero.
    // Ele nunca se autodispensa, e nunca cai no Chrome do sistema por baixo do pano.
    cdp = await abrirNavegador();
    console.log(`  Chrome headless aberto · viewport ${LARGURA}×${ALTURA}`);

    await gatesDaCasca(cdp, servidor.url);
    await blocoDuplicatas(cdp, servidor.url);
    await blocoOcorrencias(cdp, servidor.url, sonda);
    await blocoRoteiro(cdp, servidor.url);
    await blocoDeHonestidade(cdp, servidor.url);
    await gatesDeAmeaca(cdp, servidor.url);

    gateConsole(cdp);
    await coletarRede(cdp);
    gateRede(cdp, servidor.url);
    imprimirResumo();
  } finally {
    // T-04-29 / T-02-21: encerramento garantido por todos os caminhos de saída.
    if (cdp) await cdp.encerrar();
    await servidor.fechar();
  }
}

principal()
  .then(() => {
    console.log("\nTUDO PASSOU.");
    process.exit(0);
  })
  .catch((erro) => {
    console.error(`\nVERIFICAÇÃO FALHOU: ${erro.message}`);
    if (!(erro instanceof Falha) && erro.stack) console.error(erro.stack);
    process.exit(1);
  });
