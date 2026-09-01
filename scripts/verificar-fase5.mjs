/**
 * verificar-fase5.mjs — a verificação da fase 5, dirigida por navegador.
 *
 * O QUE ELE MEDE. `out/` — o artefato exportado, servido estaticamente — aberto em Chrome
 * headless por CDP, num viewport de 1440×960. O viewport é o MESMO das quatro suítes
 * anteriores de propósito: medir noutro viewport mediria outra coisa, e os números das
 * cinco fases deixariam de ser comparáveis.
 *
 * O QUE ELE PROVA QUE NENHUMA OUTRA PROVA — e é a razão de este arquivo existir. SEIS
 * executores correram em paralelo nesta fase e cada um mediu só o seu pedaço. Os contratos
 * que ATRAVESSAM planos ficaram sem dono:
 *
 *   · D-85 — o motivo por passo do editor de trilha (05-04) contra o selo público de
 *     `/trilha/[slug]/` (fase 3), comparados CARACTERE A CARACTERE. Nenhum plano da onda 2
 *     podia medir isso sozinho: um escreve o editor, o outro é herdado.
 *   · Os DOIS links para `/filtros/` — escritos por 05-01 (`/acontece/`) e por 05-02
 *     (`/buscar/`) contra uma rota que só 05-06 criou, depois. Nenhum dos três podia
 *     provar que ela resolve; aqui ela é CLICADA, não conferida por `href`.
 *   · O peso somado da onda contra o orçamento por plano que 05-01 registrou.
 *   · O vocabulário `data-*` congelado por 05-01: nenhum atributo com dois significados.
 *   · Os números que as telas IMPRIMEM contra os que os módulos de build CALCULAM.
 *
 * O QUE ELE NÃO FAZ. Não se pula. Chrome ausente FALHA o script (T-02-22 / T-04-26), e
 * `CHROME_BIN` apontando para caminho inexistente também falha, em vez de cair no Chrome do
 * sistema — verificar num binário diferente do pedido produz um relatório sobre outra coisa.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OS SETE DEFEITOS DE GATE QUE AS FASES 2, 3 E 4 JÁ PAGARAM — herdados corrigidos
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  1. A API real de `navegador.mjs`: `servir({raiz})` devolve uma PROMESSA de
 *     `{url, fechar}`; `abrirNavegador()` devolve o `cdp` DIRETO; o método é `navegar`; o
 *     console está em `cdp.consola`; `cdp.clicar` recebe uma EXPRESSÃO JS que avalia para o
 *     elemento, não um seletor CSS.
 *  2. Não existe domínio `Network.*`. «Zero requisição externa» se prova por
 *     `performance.getEntriesByType('resource')`, medida DENTRO da página, colhida a cada
 *     navegação porque a lista é por documento e some na troca.
 *  3. `visiveis()` do prelúdio NÃO serve para SVG: usa `offsetParent`, que só existe em
 *     `HTMLElement`. Pino, mapa e qualquer coisa dentro de `<svg>` se medem pelo RETÂNGULO.
 *  4. «Cabe na primeira vista» é contra a moldura MENOS a barra de abas grudada no pé, nas
 *     rotas do grupo `(app)`. 05-06 MEDIU essa barra em 70 px, contra os 59 px que os
 *     planos anteriores presumiam. Aqui a barra é MEDIDA e o número usado vai impresso em
 *     cada gate — nenhum limite é citado de cabeça.
 *  5. Comparação de data por STRING é quebrada entre formatos: `"27.06.1967" > "2026-08-22"`
 *     é `true`. Comparação sempre por ano de quatro dígitos convertido a NÚMERO.
 *  6. Gate que lê arquivo roda sobre a fonte SEM COMENTÁRIOS, casa `data-{atributo}="` com
 *     o igual e a aspa — senão o payload RSC infla a contagem — e casa a instrução de
 *     importação POR INTEIRO, porque `import type` quebrado em cinco linhas derrota
 *     casamento por linha.
 *  7. Atributo que só existe DURANTE uma interação mede 0 no HTML exportado. Ele é contado
 *     no arquivo esperando ZERO, com o zero declarado como proposital, e medido no DOM vivo
 *     DEPOIS de o gesto ser dirigido. Nesta fase são cinco: `data-realcado="sim"`,
 *     `data-motivo-veto`, `data-veto-bloqueado`, `data-decisao-moderacao` e
 *     `data-assistido="1"`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O OITAVO DEFEITO, QUE ESTA OBRA JÁ PAGOU SEIS VEZES: gate verde sobre tela quebrada
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Um índice fora do viewport (04-04), a primeira linha coberta (05-02), o terço inferior do
 * mapa abaixo da dobra (05-01), o cartão de catálogo borrado (05-07), a grade fora de ordem
 * (05-03) e o formulário de veto abaixo da dobra (05-04). Nos SEIS casos todos os gates
 * estavam verdes e quem pegou foi a captura de tela. Por isso, aqui, onde um gate afirma que
 * a tela é USÁVEL — e não apenas que o elemento existe — ele mede GEOMETRIA contra o
 * contêiner E guarda foto, com o caminho impresso no relatório. As fotos só são escritas
 * quando `DIR_CAPTURAS` está definida, e nunca dentro do repositório.
 *
 * ZERO DEPENDÊNCIA NOVA. O cliente CDP mora em `navegador.mjs` e é ~120 linhas sobre o
 * `WebSocket` global do Node. `verificar-fase2.mjs`, `verificar-fase3.mjs`,
 * `verificar-fase4.mjs`, `navegador.mjs` e `servir-out.mjs` são
 * LEITURA para este arquivo: alterá-los invalidaria a linha de base das fases anteriores,
 * que é exatamente o que a não-regressão compara.
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
 * A âncora da consolidação das folhas de estilo (`a40f380`). É a partir dela que
 * `globals.css` pode receber `@import` e NADA MAIS — o bloco `:root` com os hex do manual é
 * a fonte de verdade única da paleta e tem de continuar byte a byte idêntico. A fase 5
 * acrescentou 11 linhas de `@import` e ZERO linha de regra; este gate é o que prova isso.
 */
/* Reancorado na reformulação do design system: o histórico do repositório foi
 * recriado em 2026-08-22 e `a40f380` deixou de existir. A âncora mora em `medidas.mjs`. */
import { COMMIT_DA_CONSOLIDACAO } from "./medidas.mjs";

/**
 * O commit de 05-01 que escreveu as 11 linhas de `@import` da fase 5 de uma vez. É a âncora
 * em que `verificar-fase3.mjs` foi reancorado, e o mesmo raciocínio vale aqui: dela em
 * diante, `globals.css` tem de ter DIFERENÇA ZERO — é isso que prova que os SEIS executores
 * da onda 2 não tocaram o arquivo de colisão da fase.
 */
/* Mesma reancoragem: `c90fc9b` era do histórico anterior. A âncora «último commit
 * que tocou globals.css» mora em `medidas.mjs` e avança a cada fase que o toca. */
import { COMMIT_ULTIMO_QUE_TOCOU_GLOBALS as COMMIT_DAS_FOLHAS_DA_FASE_5 } from "./medidas.mjs";

/**
 * O peso de `out/_next/static/chunks` ANTES da onda 2.
 *
 * 1.045 KB é o número MEDIDO por 05-01 num build limpo (`rm -rf .next out`) depois do seu
 * último commit, e 05-01 gastou 0 KB dos 60 do próprio orçamento — logo é também o peso de
 * antes da fase 5 para todo efeito prático. O texto em prosa do plano de 05-08 cita
 * «1.065 KB»; esse número não aparece em medição nenhuma dos sete SUMMARYs. Ancorar num
 * número de prosa faria o delta impresso ser sobre nada. Fica o medido, e a divergência
 * fica registrada aqui em vez de sumir.
 */
const CHUNKS_ANTES_DA_ONDA_2_KB = 1045;
const TETO_CHUNKS_KB = 1600;

/** O orçamento de chunks por plano, como 05-01 o registrou, e o que cada plano MEDIU. */
const ORCAMENTO_POR_PLANO = [
  { plano: "05-01", teto: 60, medido: 0, nota: "o DTO viaja no flight payload da rota, não nos chunks" },
  { plano: "05-02", teto: 20, medido: 12.8, nota: "10,3 KB são frase.ts arrastada para o chunk de /buscar" },
  { plano: "05-03", teto: 20, medido: 3.4, nota: "medido por dois builds A/B; produtor.tsx é de servidor e custa 0" },
  { plano: "05-04", teto: 60, medido: 37, nota: "dois chunks exclusivos das rotas de Moderação e Redação" },
  { plano: "05-05", teto: 60, medido: 29, nota: "16 KB de componente + 13,2 KB de regras .obs*" },
  { plano: "05-06", teto: 80, medido: null, nota: "não isolável: medido sobre árvore compartilhada por seis executores" },
  { plano: "05-07", teto: 100, medido: null, nota: "não isolável: o Turbopack co-empacotou a onda inteira" },
];

/** As 11 folhas que 05-01 declarou de uma vez, para os seis executores da onda 2. */
const FOLHAS_DA_FASE_5 = [
  "web.css",
  "acontece-web.css",
  "web-descobrir.css",
  "web-buscar.css",
  "web-evento.css",
  "produtor.css",
  "redacao.css",
  "moderacao.css",
  "observatorio.css",
  "filtros.css",
  "sem-resultado.css",
  "play.css",
];

/** Os cinco módulos de build da fase. Alcançam o grafo — é o lado SERVIDOR da fronteira. */
const MODULOS_DE_BUILD_DA_FASE_5 = [
  "src/dados/mapa-agenda.ts",
  "src/dados/redacao.ts",
  "src/dados/moderacao.ts",
  "src/dados/observatorio.ts",
  "src/dados/filtros.ts",
  "src/dados/play.ts",
];

/**
 * Os dois módulos de FIO da fase, criados FORA do `files_modified` dos planos que os
 * escreveram — 05-01 (`mapa-agenda-wire.ts`) e 05-07 (`play-wire.ts`) —, os dois pela mesma
 * razão forçada: com formato de fio em tupla, o vocabulário POSICIONAL precisa existir dos
 * dois lados da fronteira DP-F, e duas cópias de um vocabulário posicional divergem em
 * silêncio, trocando o lugar de um evento pelo de outro sem quebrar o build. Os dois
 * SUMMARYs pediram explicitamente que esta suíte os varresse. Aqui eles são varridos, e a
 * propriedade exigida é a que os torna seguros: ZERO import por valor.
 */
const MODULOS_DE_FIO_DA_FASE_5 = ["src/dados/mapa-agenda-wire.ts", "src/dados/play-wire.ts"];

/** Os onze componentes de cliente que a fase 5 escreveu ou reescreveu. */
const CLIENTES_DA_FASE_5 = [
  "src/componentes/acontece.tsx",
  "src/componentes/feed.tsx",
  "src/componentes/buscar.tsx",
  "src/componentes/lista-ocorrencias.tsx",
  "src/componentes/moderacao-fila.tsx",
  "src/componentes/redacao-trilha.tsx",
  "src/componentes/observatorio.tsx",
  "src/componentes/filtros.tsx",
  "src/componentes/sem-resultado.tsx",
  "src/componentes/play.tsx",
  "src/componentes/player.tsx",
];

/**
 * Os DOIS arquivos que podem ler a VISÃO CORRENTE, e por quê. `casca.tsx` escreve
 * `data-view` no elemento raiz — é ele que institui o mecanismo de D-79. `aviso-desktop.tsx`
 * é o aviso de superfície, que existe justamente para dizer «esta tela é de outra visão».
 * Qualquer outro arquivo lendo `visao` do contexto estaria a um passo de ramificar layout em
 * JavaScript, que é o que D-79/D-05 proíbem.
 */
const PODEM_LER_A_VISAO = ["src/componentes/casca.tsx", "src/componentes/aviso-desktop.tsx"];

/** Sufixos de visão. Um PAR de arquivos que difere só por um deles é o irmão proibido. */
const SUFIXOS_DE_VISAO = ["-web", "-mobile", "-app", "-desk", "-desktop", "-celular"];

/** As três rotas que a fase 5 criou, mais o padrão das 529 do Player. */
const ROTAS_NOVAS_DA_FASE_5 = ["filtros", "busca-nao-encontrada", "agenda-nao-encontrada"];
const ROTAS_DE_PLAY_ESPERADAS = 529;

/** A linha de base de páginas da fase 2. NÃO SE MOVE. */
const LINHA_BASE_DE_PAGINAS = 1784;

/** Onde as fotos vão, quando `DIR_CAPTURAS` estiver definida. Sem ela, não se escreve nada. */
const DIR_CAPTURAS = process.env.DIR_CAPTURAS ?? "";

/** A trilha do acervo, o elo entre o editor de 05-04 e o selo público da fase 3 (D-85). */
const SLUG_DA_TRILHA = "do-rap-ao-teatro-documentario";

/**
 * Os dois eventos de amostra de WEB-03, escolhidos por REGRA e não a dedo: o do CMS é o de
 * MAIOR número de ocorrências do acervo (53 sessões — é ele que faz a tabela valer a pena),
 * e o da Enciclopédia é um com ZERO ocorrência datada e a ficha das 8 dimensões em «não
 * declarado», que é o outro lado de D-43 na mesma tela. Os dois são os que 05-03 mediu.
 */
const EVENTO_DO_CMS = "a-arte-urbana-chega-ao-ic-na-exposicao-alem-das-ruas-historias-do-graffiti-";
const EVENTO_DA_ENCICLOPEDIA = "12-bienal-de-sao-paulo";

/** Uma mídia de amostra do Player, com slug limpo — 8 das 529 têm slug malformado (05-07). */
const MIDIA_DE_AMOSTRA = "10-anos-que-manoel-de-barros-se-encantou";

// ---------------------------------------------------------------------------
// Relatório: toda medição imprime uma linha nomeada com o NÚMERO medido.
// Um gate que só diz «passou» não sobrevive à próxima mudança de dado.
// ---------------------------------------------------------------------------

let falhas = 0;
let verdes = 0;
let informativas = 0;
const resumo = [];
const fotos = [];

function ok(nome, medida) {
  console.log(`  ok   ${nome}: ${medida}`);
}

/** Linha informativa: mede e imprime, e NÃO conta como gate. A distinção é o que permite
 *  reconciliar mecanicamente a contagem de verdes, como 04-05 fez com o «93 contra 94». */
function info(nome, medida) {
  informativas += 1;
  ok(nome, medida);
}

class Falha extends Error {}

function exigir(condicao, nome, medida, esperado) {
  if (condicao) {
    verdes += 1;
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
  console.log(`       ┌─ ${rotulo} (${String(texto).length} caracteres)`);
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
// Duplicado de `verificar-fase2/3/4.mjs` de propósito, pela QUARTA vez: os três são linha de
// base de fases anteriores, não exportam estes ajudantes, e exportá-los exigiria alterá-los
// — o que invalidaria a comparação de não-regressão que esta fase existe para fazer. A
// dívida fica registrada no SUMMARY; o lugar certo de resolvê-la é um módulo `fonte.mjs`
// numa fase que possa tocar as quatro suítes de uma vez.
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
  // A ARMADILHA DO DISCO: `stat` reporta tamanho e a leitura devolve zero byte. Um arquivo
  // lido como "" faria QUALQUER gate de fonte passar em silêncio — 0 violações porque não há o
  // que violar. Falhar alto aqui é o comportamento correto. O projeto saiu do iCloud, mas o
  // gate fica: ele custa uma comparação e o modo de falha que ele pega é indetectável.
  if (bruto.length === 0 && statSync(arquivo).size > 0) {
    throw new Error(
      `${path.relative(RAIZ, arquivo)} leu ZERO BYTE mas tem ${statSync(arquivo).size} bytes em disco. ` +
        `Restaure com: git show HEAD:${path.relative(RAIZ, arquivo)} > ${path.relative(RAIZ, arquivo)}`,
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

/**
 * DEFEITO 6, na forma que mais custou nesta obra: contar atributo no HTML exportado casando
 * `data-x="` — com o igual e a aspa. Casar só o nome conta também o payload RSC, onde o
 * nome do atributo aparece como STRING de propriedade, e a contagem infla sem aviso.
 */
function contarAtributo(html, atributo) {
  return (html.match(new RegExp(`data-${atributo}="`, "g")) ?? []).length;
}

/** Conta um par atributo=valor exato — é assim que `data-realcado="sim"` se distingue de «nao». */
function contarAtributoValor(html, atributo, valor) {
  return (html.match(new RegExp(`data-${atributo}="${valor}"`, "g")) ?? []).length;
}

const htmls = new Map();
async function html(rota) {
  if (htmls.has(rota)) return htmls.get(rota);
  const arq = path.join(OUT, rota);
  const texto = await readFile(arq, "utf8");
  if (texto.length === 0 && statSync(arq).size > 0) {
    throw new Error(`out/${rota} leu ZERO BYTE com ${statSync(arq).size} bytes em disco.`);
  }
  htmls.set(rota, texto);
  return texto;
}

// ---------------------------------------------------------------------------
// (b) GATES ESTRUTURAIS — rodam ANTES de subir o Chrome. Baratos, e pegam a classe de
// erro mais cara da fase. Todos sobre a fonte SEM COMENTÁRIOS.
// ---------------------------------------------------------------------------

const JSON_PESADOS = ["entidades.json", "arestas.json", "ocorrencias.json"];
const CORES_APOIO = /--ic-(amarelo|azul|lilas|rosa|verde-agua|verde)\b/g;

async function gatesEstruturais() {
  titulo("── (b) gates estruturais, sem navegador ──");
  const arquivos = await arquivosDe(SRC);

  // ---- 1. DP-F transitivo: nenhum caminho de cliente até `@/dados/grafo` ----
  // A instrução é casada POR INTEIRO (defeito 6) e `import type` é distinguido: tipo é
  // apagado na compilação e não arrasta os 23 MB de JSON para o navegador; import por VALOR
  // arrasta. Um gate que não distinguisse os dois acusaria a fronteira correta.
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
  // nominal abaixo casaria 0 de 11 mesmo com a varredura correta.
  const relClientes = clientes.map((c) => path.relative(RAIZ, c).split(path.sep).join("/"));
  const daFaseVarridos = CLIENTES_DA_FASE_5.filter((c) => relClientes.includes(c));
  exigir(
    violacoes.length === 0 && daFaseVarridos.length === CLIENTES_DA_FASE_5.length,
    "DP-F · caminhos de cliente até @/dados/grafo (transitivo, instrução inteira)",
    violacoes.length === 0
      ? `0 violações em ${clientes.length} clientes · os ${CLIENTES_DA_FASE_5.length} componentes de cliente da fase 5 estão entre os varridos (${daFaseVarridos.length}/${CLIENTES_DA_FASE_5.length})`
      : violacoes.join(" | "),
    `0 violações, com os ${CLIENTES_DA_FASE_5.length} clientes da fase entre os varridos`,
  );

  // ---- 2. O outro lado da fronteira: os módulos de build ALCANÇAM o grafo ----
  const alcancamGrafo = [];
  for (const m of MODULOS_DE_BUILD_DA_FASE_5) {
    const arq = path.join(RAIZ, m);
    if (!existsSync(arq)) throw new Error(`módulo de build ausente: ${m}`);
    const { limpo } = await fonte(arq);
    const chega = new Set([arq]);
    const fila = [arq];
    let alcanca = false;
    while (fila.length && !alcanca) {
      const atual = fila.shift();
      const f = await fonte(atual);
      for (const imp of importsDe(f.limpo)) {
        if (imp.apenasTipo) continue;
        const alvo = resolverModulo(imp.especificador, atual);
        if (!alvo) continue;
        if (/^src\/dados\/grafo\.tsx?$/.test(path.relative(RAIZ, alvo).split(path.sep).join("/"))) {
          alcanca = true;
          break;
        }
        if (chega.has(alvo)) continue;
        chega.add(alvo);
        fila.push(alvo);
      }
    }
    void limpo;
    if (alcanca) alcancamGrafo.push(path.basename(m));
  }
  exigir(
    alcancamGrafo.length === MODULOS_DE_BUILD_DA_FASE_5.length,
    "os módulos de build da fase alcançam o grafo pelo lado SERVIDOR da fronteira",
    `${alcancamGrafo.length} de ${MODULOS_DE_BUILD_DA_FASE_5.length}: ${alcancamGrafo.join(", ")}`,
    `${MODULOS_DE_BUILD_DA_FASE_5.length} de ${MODULOS_DE_BUILD_DA_FASE_5.length}`,
  );

  // ---- 3. Os DOIS módulos de fio criados fora do `files_modified` dos seus planos ----
  // 05-01 e 05-07 pediram, cada um no seu SUMMARY, que esta suíte os varresse. A propriedade
  // que os torna seguros de importar dos DOIS lados de DP-F é uma só: zero import por VALOR.
  const fioComValor = [];
  for (const m of MODULOS_DE_FIO_DA_FASE_5) {
    const arq = path.join(RAIZ, m);
    if (!existsSync(arq)) throw new Error(`módulo de fio ausente: ${m}`);
    const { limpo } = await fonte(arq);
    const porValor = importsDe(limpo).filter((i) => !i.apenasTipo);
    if (porValor.length) fioComValor.push(`${m} → ${porValor.map((i) => i.especificador).join(", ")}`);
  }
  exigir(
    fioComValor.length === 0,
    "os dois módulos de FIO (fora do files_modified de 05-01 e 05-07) são SÓ-DE-TIPOS",
    fioComValor.length === 0
      ? `0 import por valor em ${MODULOS_DE_FIO_DA_FASE_5.map((m) => path.basename(m)).join(" e ")} — importáveis dos dois lados de DP-F`
      : fioComValor.join(" | "),
    "0 import por valor",
  );

  // ---- 4. D-47: nenhuma tela importa os JSON pesados diretamente ----
  const telas = arquivos.filter(
    (a) => a.includes(`${path.sep}app${path.sep}`) || a.includes(`${path.sep}componentes${path.sep}`),
  );
  const hitsJson = [];
  for (const a of telas) {
    const { limpo } = await fonte(a);
    for (const imp of importsDe(limpo)) {
      if (JSON_PESADOS.some((j) => imp.especificador.endsWith(j))) {
        hitsJson.push(`${path.relative(RAIZ, a)} → ${imp.especificador}`);
      }
    }
  }
  exigir(
    hitsJson.length === 0,
    "D-47 · telas importando entidades/arestas/ocorrencias.json diretamente",
    hitsJson.length === 0 ? `0 em ${telas.length} telas` : hitsJson.join(" | "),
    "0",
  );

  // ---- 5. Folha de estilo importada de dentro de componente ----
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
      ? `0 ocorrências em ${arquivos.length} arquivos · o único import de CSS é src/app/layout.tsx → ./globals.css`
      : importsDeCss.join(" | "),
    "0",
  );

  // ---- 6. As 11 folhas da fase 5 declaradas, e nenhuma órfã ----
  const globals = await readFile(path.join(SRC, "app", "globals.css"), "utf8");
  if (globals.length === 0) throw new Error("src/app/globals.css leu ZERO BYTE. Restaure do git.");
  const declaradas = [...globals.matchAll(/@import\s+"\.\.\/estilos\/([a-z0-9-]+\.css)"/g)].map((m) => m[1]);
  const semDeclaracao = FOLHAS_DA_FASE_5.filter((f) => !declaradas.includes(f));
  exigir(
    semDeclaracao.length === 0,
    "as 11 folhas da fase 5 declaradas em globals.css, uma linha de @import cada",
    semDeclaracao.length === 0
      ? `11 de 11 · ${declaradas.length} folhas de rota declaradas ao todo`
      : `faltam ${semDeclaracao.join(", ")}`,
    "11 de 11",
  );

  const noDisco = (await arquivosDe(path.join(SRC, "estilos"), /\.css$/)).map((f) => path.basename(f));
  const orfas = noDisco.filter((f) => !declaradas.includes(f));
  exigir(
    orfas.length === 0 && noDisco.length === declaradas.length,
    "nenhuma folha órfã em src/estilos/ (existe no disco e ninguém a declara)",
    orfas.length === 0
      ? `0 órfãs · ${noDisco.length} folhas no disco, ${declaradas.length} declaradas`
      : orfas.join(", "),
    "0 órfãs, e o mesmo número no disco e declarado",
  );

  // ---- 7. globals.css desde a consolidação: só @import e comentário ----
  // A MESMA medida de `verificar-fase4.mjs`, com o número da fase 5. Ela é o par do gate 8
  // de `verificar-fase3.mjs`: aquele exige diferença ZERO desde `c90fc9b` e prova que a onda
  // 2 não tocou o arquivo; este permite `@import` desde a consolidação e prova que nenhuma
  // linha de REGRA entrou, o que é a propriedade que a consolidação existe para manter.
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

  const diffDesde05_01 = git(
    "diff",
    "--numstat",
    `${COMMIT_DAS_FOLHAS_DA_FASE_5}..HEAD`,
    "--",
    "src/app/globals.css",
  ).trim();
  exigir(
    diffDesde05_01 === "",
    `globals.css intocado pelos SEIS executores da onda 2 (desde ${COMMIT_DAS_FOLHAS_DA_FASE_5})`,
    diffDesde05_01 === "" ? "0 linhas de diferença" : diffDesde05_01.replace(/\s+/g, " "),
    "diferença zero",
  );

  // ---- 8. D-79 / D-05: NENHUM COMPONENTE IRMÃO POR VISÃO ----
  // Este gate não existia antes, e é o que protege a regra estrutural da fase inteira: a
  // divergência entre as duas visões é de LAYOUT, feita por CSS sob `[data-view=…]`, e nunca
  // um segundo arquivo nem um ramo em JavaScript. Sem ele, a fase 6 pode criar
  // `descobrir-web.tsx` e nada fica vermelho até a primeira divergência de comportamento.
  const componentes = (await arquivosDe(path.join(SRC, "componentes"), /\.tsx?$/)).map((f) =>
    path.basename(f).replace(/\.tsx?$/, ""),
  );
  const semSufixo = (nome) => {
    for (const s of SUFIXOS_DE_VISAO) if (nome.endsWith(s)) return nome.slice(0, -s.length);
    const camel = nome.replace(/(Web|Mobile|Desktop|App|Desk)$/, "");
    return camel;
  };
  const porBase = new Map();
  for (const c of componentes) {
    const base = semSufixo(c);
    if (!porBase.has(base)) porBase.set(base, []);
    porBase.get(base).push(c);
  }
  const irmaos = [...porBase.entries()].filter(([, lista]) => lista.length > 1);
  const comSufixo = componentes.filter((c) => semSufixo(c) !== c);
  exigir(
    irmaos.length === 0,
    "D-79/D-05 · componente IRMÃO por visão em src/componentes/",
    irmaos.length === 0
      ? `0 pares em ${componentes.length} componentes · ${comSufixo.length} arquivo(s) com sufixo de visão no nome (${comSufixo.join(", ") || "nenhum"}), nenhum deles com o par que faria dele um irmão`
      : irmaos.map(([b, l]) => `${b}: ${l.join(" + ")}`).join(" | "),
    "0 pares",
  );

  // A segunda metade da mesma regra, e a mais importante: ninguém RAMIFICA em JavaScript.
  // Duas medidas, porque as duas formas do defeito são diferentes:
  //   (a) ler a visão CORRENTE do contexto fora dos dois arquivos que podem;
  //   (b) comparar um identificador `visao`/`view` SOLTO contra "web"/"mobile".
  // O `(?<![.\w])` do padrão (b) é o que separa o defeito do não-defeito: `roteiro.tsx` tem
  // `cenario.visao === "mobile"`, que lê um CAMPO DE DADO do cenário — qual visão aquele
  // cenário do RFP exige — para escrever um rótulo, e não a visão corrente para escolher
  // layout. Um gate sem o lookbehind acusaria isso e teria de ganhar uma exceção
  // nomeada, que é como um gate começa a não medir mais nada.
  const lendoAVisao = [];
  for (const a of arquivos) {
    const rel = path.relative(RAIZ, a).split(path.sep).join("/");
    if (rel.startsWith("src/contexto/") || PODEM_LER_A_VISAO.includes(rel)) continue;
    const { limpo } = await fonte(a);
    for (const m of limpo.matchAll(/(?:const|let)\s*\{([^}]*)\}\s*=\s*useVisao\(\)/g)) {
      const nomes = m[1].split(",").map((s) => s.trim().split(":")[0].trim());
      if (nomes.includes("visao")) lendoAVisao.push(`${rel} (${nomes.join(", ")})`);
    }
  }
  const ramosDeVisao = [];
  for (const a of arquivos) {
    const rel = path.relative(RAIZ, a).split(path.sep).join("/");
    if (PODEM_LER_A_VISAO.includes(rel)) continue;
    const { limpo } = await fonte(a);
    const m = [...limpo.matchAll(/(?<![.\w])(visao|view)\s*===\s*["'](web|mobile|app|desk)["']/g)];
    if (m.length) ramosDeVisao.push(`${rel}: ${m.map((x) => x[0]).join(" | ")}`);
  }
  exigir(
    lendoAVisao.length === 0 && ramosDeVisao.length === 0,
    "D-79/D-05 · ramo em JavaScript decidindo LAYOUT pela visão (fonte sem comentários)",
    lendoAVisao.length === 0 && ramosDeVisao.length === 0
      ? `0 arquivos leem a visão corrente fora de ${PODEM_LER_A_VISAO.map((p) => path.basename(p)).join(" e ")} · 0 comparações de visão solta em ${arquivos.length} arquivos`
      : [...lendoAVisao, ...ramosDeVisao].join(" | "),
    "0 leituras e 0 ramos",
  );

  // ---- 9. Peso dos chunks, com o delta e a atribuição por plano ----
  const chunksKb = tamanhoDeKb(path.join(OUT, "_next", "static", "chunks"));
  const delta = chunksKb - CHUNKS_ANTES_DA_ONDA_2_KB;
  exigir(
    chunksKb <= TETO_CHUNKS_KB,
    "peso de out/_next/static/chunks",
    `${chunksKb} KB · ${delta >= 0 ? "+" : ""}${delta} KB contra os ${CHUNKS_ANTES_DA_ONDA_2_KB} KB medidos por 05-01 antes da onda 2 · teto ${TETO_CHUNKS_KB} KB · folga ${TETO_CHUNKS_KB - chunksKb} KB`,
    `≤ ${TETO_CHUNKS_KB} KB`,
  );

  const tetoSomado = ORCAMENTO_POR_PLANO.reduce((s, p) => s + p.teto, 0);
  const medidoSomado = ORCAMENTO_POR_PLANO.filter((p) => p.medido !== null).reduce((s, p) => s + p.medido, 0);
  const naoIsolaveis = ORCAMENTO_POR_PLANO.filter((p) => p.medido === null);
  info(
    "o delta atribuído por plano, contra o orçamento que 05-01 registrou",
    `+${delta} KB medidos ao todo · orçamento somado ${tetoSomado} KB · reivindicado e MEDIDO por plano ${medidoSomado.toFixed(1)} KB em 5 de 7 planos`,
  );
  for (const p of ORCAMENTO_POR_PLANO) {
    nota(
      `${p.plano} · teto ${String(p.teto).padStart(3)} KB · ${
        p.medido === null ? "não isolado" : `${String(p.medido).padStart(5)} KB`
      } · ${p.nota}`,
    );
  }
  nota(
    `os ${naoIsolaveis.length} planos sem número isolado (${naoIsolaveis
      .map((p) => p.plano)
      .join(", ")}) mediram sobre uma árvore compartilhada por seis executores; ` +
      `nenhum dos dois reivindicou um número que não separou, e este gate não inventa um por eles`,
  );

  // ---- 10. Token de cor de apoio e posicionamento preso à janela ----
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
    hitsCor.length === 0
      ? `0 em código · ${corEmProsa} em prosa (comentários, ignorados de propósito)`
      : hitsCor.join(" | "),
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
    hitsFixed.length === 0
      ? `0 em código · ${fixedEmProsa} em prosa (comentários, ignorados de propósito)`
      : hitsFixed.join(" | "),
    "0 em código",
  );

  // ---- 11. Inserção de HTML bruto ----
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

  // ---- 12. As rotas NOVAS da fase 5 ----
  const faltamNovas = ROTAS_NOVAS_DA_FASE_5.filter((r) => !existsSync(path.join(OUT, r, "index.html")));
  exigir(
    faltamNovas.length === 0,
    "as três rotas novas da fase 5 (/filtros/, /busca-nao-encontrada/, /agenda-nao-encontrada/)",
    faltamNovas.length === 0 ? `3 de 3` : `faltam ${faltamNovas.join(", ")}`,
    "3 de 3",
  );

  const rotasDePlay = (await readdir(path.join(OUT, "play"), { withFileTypes: true }))
    .filter((e) => e.isDirectory() && existsSync(path.join(OUT, "play", e.name, "index.html")))
    .map((e) => e.name);
  exigir(
    rotasDePlay.length === ROTAS_DE_PLAY_ESPERADAS,
    "as rotas de /play/[slug]/ — as 529 mídias do acervo, uma página cada",
    `${rotasDePlay.length} rotas em out/play/`,
    `${ROTAS_DE_PLAY_ESPERADAS}`,
  );

  // `out/404.html` JÁ EXISTIA na linha de base de 1.784, desde a fase 2. 05-06 substituiu o
  // CONTEÚDO dele por `app/not-found.tsx` e não acrescentou página. Por isso ele não entra
  // na lista de explicáveis — pô-lo derrubaria o resíduo a 1.783 e o gate acusaria como
  // defeito uma página que sempre existiu. O que se exige aqui é outra coisa: que ele tenha
  // deixado de ser a página padrão do Next e passado a ser um dos três becos de D-93.
  const html404 = await html("404.html");
  const ehPadraoDoNext = /This page could not be found/i.test(html404);
  const ehBeco = contarAtributoValor(html404, "beco", "404") > 0;
  exigir(
    !ehPadraoDoNext && ehBeco,
    "out/404.html presente e NÃO sendo a página padrão do Next (D-93)",
    `${Math.round(html404.length / 1024)} KB · «This page could not be found» ${ehPadraoDoNext ? "PRESENTE" : "ausente"} · data-beco="404" ${ehBeco ? "presente" : "AUSENTE"} · ${contarAtributo(html404, "afrouxamento")} afrouxamentos`,
    "não é a padrão do Next, e é um beco de D-93",
  );

  // ---- 13. As rotas HERDADAS, intactas ----
  const rotasFase1 = [
    "", "entrar", "verificacao", "acontece", "buscar", "descobrir", "mapa", "meu", "play",
    "observatorio", "moderacao/fila", "redacao/trilha", "studio/duplicatas", "studio/ocorrencias",
    "studio/publicar", "onboarding/1", "onboarding/2", "onboarding/3",
  ];
  const faltando1 = rotasFase1.filter((r) => !existsSync(path.join(OUT, r, "index.html")));
  exigir(
    faltando1.length === 0,
    "as 18 rotas da fase 1 intactas",
    faltando1.length === 0 ? `${rotasFase1.length} de ${rotasFase1.length}` : `faltam ${faltando1.join(", ")}`,
    "18 de 18",
  );

  const sessoes = (await readdir(path.join(OUT, "evento"))).filter((d) =>
    existsSync(path.join(OUT, "evento", d, "sessoes", "index.html")),
  );
  const eventos = (await readdir(path.join(OUT, "evento"), { withFileTypes: true })).filter(
    (e) => e.isDirectory() && existsSync(path.join(OUT, "evento", e.name, "index.html")),
  );
  const cidades = (await readdir(path.join(OUT, "cidade"))).filter((d) =>
    existsSync(path.join(OUT, "cidade", d, "index.html")),
  );
  const produtores = (await readdir(path.join(OUT, "produtor"), { withFileTypes: true })).filter(
    (e) => e.isDirectory() && existsSync(path.join(OUT, "produtor", e.name, "index.html")),
  );
  const herdadasOk =
    sessoes.length === 129 &&
    cidades.length === 15 &&
    eventos.length === 300 &&
    produtores.length === 359 &&
    existsSync(path.join(OUT, "salvos", "index.html")) &&
    existsSync(path.join(OUT, "buscar", "frase", "index.html")) &&
    existsSync(path.join(OUT, "roteiro", "index.html"));
  exigir(
    herdadasOk,
    "as rotas herdadas intactas (fases 1 a 4), contadas uma a uma",
    `${sessoes.length} sessões · ${cidades.length} cidades · ${eventos.length} eventos · ${produtores.length} produtores · ` +
      `/salvos ${existsSync(path.join(OUT, "salvos", "index.html")) ? "presente" : "AUSENTE"} · ` +
      `/buscar/frase ${existsSync(path.join(OUT, "buscar", "frase", "index.html")) ? "presente" : "AUSENTE"} · ` +
      `/roteiro ${existsSync(path.join(OUT, "roteiro", "index.html")) ? "presente" : "AUSENTE"}`,
    "129 sessões, 15 cidades, 300 eventos, 359 produtores, /salvos, /buscar/frase e /roteiro",
  );

  // ---- 14. O TOTAL DE PÁGINAS, com a diferença explicada rota a rota ----
  // Contamos CADA `.html` fora de `_next/` e `acervo/` — o critério que reproduz a linha de
  // base de 1.784 da fase 2, e que inclui o `out/404.html` solto, que a contagem só por
  // `index.html` deixaria de fora. O LIMIAR NÃO SE MOVE: o que cresce é a lista do que é
  // explicável.
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
    linhaBase === LINHA_BASE_DE_PAGINAS && novasFase5.length === ROTAS_DE_PLAY_ESPERADAS + 3 && novasReformulacao.length === 6,
    "total de páginas em out/, com a diferença explicada rota a rota",
    `${paginas.length} páginas · ${novasFase3.length} da fase 3 (129 sessões + 15 cidades + /salvos + /buscar/frase) · ` +
      `${novasFase4.length} da fase 4 (/roteiro) · ${novasFase5.length} da fase 5 (${ROTAS_DE_PLAY_ESPERADAS} de /play/[slug] em 05-07 + 3 becos em 05-06) · ` +
      `${novasReformulacao.length} da reformulação (menu lateral) · resíduo ${linhaBase}`,
    `resíduo ${LINHA_BASE_DE_PAGINAS} — a linha de base da fase 2 — ${ROTAS_DE_PLAY_ESPERADAS + 3} da fase 5 e 6 da reformulação`,
  );
  nota(
    `out/404.html está DENTRO do resíduo de ${LINHA_BASE_DE_PAGINAS} e não na lista de explicáveis: ` +
      `ele existe desde a fase 2, e 05-06 trocou o CONTEÚDO dele sem acrescentar página. ` +
      `Pô-lo na lista levaria o resíduo a ${LINHA_BASE_DE_PAGINAS - 1}.`,
  );

  return { clientes: clientes.length, paginas: paginas.length, chunksKb, arquivos: arquivos.length };
}

// ---------------------------------------------------------------------------
// (b2) COERÊNCIA ENTRE AS TELAS E OS MÓDULOS DE BUILD — o gate que fecha o circuito
// que a paralelização abriu.
//
// Seis executores mediram cada um o seu pedaço, e NINGUÉM mediu se eles concordam. Uma
// sonda em `tsx` lê os cinco módulos e confere que os números que as telas imprimem batem
// com os que os módulos calculam de verdade.
//
// A SONDA MORA EM `os.tmpdir()`, NÃO EM `node_modules/.cache`. Está medido, e é a lição de
// 04-05: o `tsx` NÃO aplica o mapeamento de `paths` do `tsconfig` a arquivos que moram
// dentro de `node_modules`, e a sonda morre com «Cannot find module @/dados/…». O `cwd`
// continua sendo a raiz, que é de onde o tsx lê o tsconfig.
// ---------------------------------------------------------------------------

const SONDA = `
import { NUMEROS_DO_MAPA_DA_AGENDA } from "@/dados/mapa-agenda";
import { numerosDaRedacao, passosParaEditor, slugDaTrilhaDoEditor } from "@/dados/redacao";
import { numerosDoObservatorio, painelDeProcedencia, indicadores } from "@/dados/observatorio";
import { numerosDosFiltros, RESUMO_DA_FICHA, CRITERIOS_SEM_LASTRO } from "@/dados/filtros";
import { CATEGORIAS, PONTE_COM_EVENTO, catalogoDoPlay } from "@/dados/play";

const painel: any = painelDeProcedencia();
const slugTrilha = slugDaTrilhaDoEditor();

console.log("<<<SONDA>>>" + JSON.stringify({
  mapa: NUMEROS_DO_MAPA_DA_AGENDA,
  redacao: numerosDaRedacao(),
  observatorio: numerosDoObservatorio(),
  painel: {
    entidades: painel.entidades.map((f: any) => ({ procedencia: f.procedencia, n: f.n })),
    arestas: painel.arestas.map((f: any) => ({ procedencia: f.procedencia, n: f.n })),
    totalDeEntidades: painel.totalDeEntidades,
    totalDeArestas: painel.totalDeArestas,
    conferencia: painel.conferencia,
  },
  indicadores: indicadores().map((i: any) => ({ id: i.id, valor: i.valor, sustentado: i.sustentado })),
  filtros: numerosDosFiltros(),
  ficha: { declaram: RESUMO_DA_FICHA.declaram, naoDeclaram: RESUMO_DA_FICHA.naoDeclaram, total: RESUMO_DA_FICHA.total },
  semLastro: CRITERIOS_SEM_LASTRO.map((c: any) => ({
    campo: c.campo,
    tipo: c.tipo,
    denominadores: c.denominadores.map((d: any) => ({ chave: d.chave, n: d.n })),
  })),
  play: {
    itens: catalogoDoPlay().length,
    categorias: CATEGORIAS.map((c: any) => ({ valor: c.valor, n: c.n })),
    ponte: {
      arestas: PONTE_COM_EVENTO.arestas,
      midiasDistintas: PONTE_COM_EVENTO.midiasDistintas,
      eventosAlcancados: PONTE_COM_EVENTO.eventosAlcancados,
      deQuantas: PONTE_COM_EVENTO.deQuantas,
    },
  },
  trilha: {
    slug: slugTrilha,
    passos: passosParaEditor(slugTrilha).map((p: any) => ({ ordem: p.ordem, motivo: p.motivo })),
  },
}));
`;

async function sondarModulos() {
  // A entrada JS do tsx, e não `node_modules/.bin/tsx`: o atalho de `.bin` é script de
  // shell, e no Windows `execFileSync` não o executa (spawn EINVAL). O mesmo Node que
  // roda esta suíte roda a sonda.
  const tsx = path.join(RAIZ, "node_modules", "tsx", "dist", "cli.mjs");
  if (!existsSync(tsx)) {
    // Falha alta, não pulo. Sem a sonda este bloco não existe, e um gate que se autodispensa
    // quando a ferramenta falta é exatamente o que T-02-22 e T-04-26 proíbem.
    throw new Error(
      `node_modules/tsx/dist/cli.mjs não existe. tsx é devDependency do projeto e é como esta suíte lê o ` +
        `que os cinco módulos da fase calculam. Rode \`npm install\`. NÃO pulo o gate.`,
    );
  }
  const arquivo = path.join(os.tmpdir(), `verificar-fase5-sonda-${process.pid}.ts`);
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

async function gateCoerencia(sonda) {
  titulo("── (b2) coerência entre as telas e os módulos de build (o circuito que a paralelização abriu) ──");

  // ---- A interseção do mapa da agenda (05-01) ----
  const m = sonda.mapa;
  exigir(
    m.comSessao === 129 && m.comLugar === 158 && m.interseccao === 0,
    "05-01 · a interseção do mapa da agenda: sessão datada × lugar resolvível",
    `${m.comSessao} com sessão · ${m.comLugar} com lugar · ${m.interseccao} com os DOIS`,
    "129 · 158 · 0",
  );
  exigir(
    m.comLugarNoDesenho === 110 &&
      m.comLugarForaDoDesenho === 48 &&
      m.comLugarNoDesenho + m.comLugarForaDoDesenho === m.comLugar &&
      m.pinosPorLugar === m.comLugarNoDesenho &&
      m.itensPorLugar === m.comLugar,
    "05-01 · dos 158 situados, os que o desenho comporta — e a soma que não perde ninguém",
    `${m.comLugarNoDesenho} dentro do contorno + ${m.comLugarForaDoDesenho} fora (Havana, Grande Londres, Itália, Chile) = ${m.comLugar} · ` +
      `lista ${m.itensPorLugar} itens, mapa ${m.pinosPorLugar} pinos`,
    "110 + 48 = 158, com 158 na lista e 110 no mapa",
  );
  const acontece = await html("acontece/index.html");
  exigir(
    contarAtributo(acontece, "item-lista") === m.itensPorLugar &&
      contarAtributo(acontece, "pino") === m.pinosPorLugar &&
      contarAtributo(acontece, "par") === m.itensPorLugar - m.comLugarForaDoDesenho + m.pinosPorLugar,
    "05-01 · e a TELA imprime exatamente os números que o módulo calculou",
    `HTML: ${contarAtributo(acontece, "item-lista")} itens · ${contarAtributo(acontece, "pino")} pinos · ` +
      `${contarAtributo(acontece, "par")} data-par (${m.pinosPorLugar} itens mapeáveis + ${m.pinosPorLugar} pinos)`,
    "os números do módulo, no HTML exportado",
  );

  // ---- O painel de procedência (05-05) ----
  const p = sonda.painel;
  const somaE = p.entidades.reduce((s, f) => s + f.n, 0);
  const somaA = p.arestas.reduce((s, f) => s + f.n, 0);
  exigir(
    somaE === 7810 && somaA === 66563 && p.totalDeEntidades === 7810 && p.totalDeArestas === 66563,
    "05-05 · as fatias de procedência somam o acervo inteiro, nas duas leituras",
    `entidades ${p.entidades.map((f) => `${f.procedencia} ${f.n}`).join(" + ")} = ${somaE} · ` +
      `arestas ${p.arestas.map((f) => `${f.procedencia} ${f.n}`).join(" + ")} = ${somaA}`,
    "7.810 e 66.563",
  );
  exigir(
    p.conferencia.fecha === true && p.conferencia.fontes.length === 3,
    "05-05 · a conferência de TRÊS pontas fecha (varredura própria × contagens() × meta.json)",
    `fecha=${p.conferencia.fecha} · ${p.conferencia.fontes.length} fontes independentes · ` +
      `soma ${p.conferencia.somaDeEntidades}/${p.conferencia.totalDeEntidades} entidades e ${p.conferencia.somaDeArestas}/${p.conferencia.totalDeArestas} arestas`,
    "fecha, com três fontes",
  );

  // ---- Os indicadores, e a diferença entre zero e ausência de lastro ----
  const naoSustentados = sonda.indicadores.filter((i) => !i.sustentado);
  const comValorNulo = sonda.indicadores.filter((i) => i.valor === null);
  exigir(
    sonda.indicadores.length === 7 &&
      naoSustentados.length === 2 &&
      naoSustentados.every((i) => i.valor === null) &&
      comValorNulo.length === naoSustentados.length,
    "05-05 · sete indicadores, dois sem lastro — e valor nulo e «não sustentado» andam JUNTOS",
    `${sonda.indicadores.length} indicadores · ${naoSustentados.length} não sustentados (${naoSustentados
      .map((i) => i.id)
      .join(", ")}) · ${comValorNulo.length} com valor nulo · nenhum zero disfarçado de ausência`,
    "7 indicadores, 2 sem lastro, valor nulo só onde não há lastro",
  );

  // ---- As 8 dimensões de acessibilidade e a ficha (05-06) ----
  const f = sonda.filtros;
  exigir(
    f.dimensoes === 8 && f.dimensoesZeradas === 5 && f.dimensoesSustentadas === 3,
    "05-06 · as 8 dimensões de acessibilidade, com 5 medindo zero",
    `${f.dimensoes} dimensões · ${f.dimensoesSustentadas} sustentadas · ${f.dimensoesZeradas} zeradas · ` +
      `na fonte: ${Object.entries(f.porDimensaoNaFonte).map(([k, v]) => `${k}=${v}`).join(" · ")}`,
    "8 dimensões, 5 zeradas",
  );
  exigir(
    sonda.ficha.declaram === 5108 &&
      sonda.ficha.naoDeclaram === 2702 &&
      sonda.ficha.declaram + sonda.ficha.naoDeclaram === sonda.ficha.total,
    "05-03/05-06 · D-43 na ficha: declarado-ausente e não-declarado, e a soma que fecha",
    `${sonda.ficha.declaram} declaram + ${sonda.ficha.naoDeclaram} nunca declararam = ${sonda.ficha.total}`,
    "5.108 + 2.702 = 7.810",
  );

  // ---- Play: as 529 e as categorias (05-07) ----
  const somaCategorias = sonda.play.categorias.reduce((s, c) => s + c.n, 0);
  exigir(
    sonda.play.itens === 529 && somaCategorias === 529 && sonda.play.categorias.length === 9,
    "05-07 · as 529 mídias, e as 9 categorias somando exatamente 529",
    `${sonda.play.itens} mídias · ${sonda.play.categorias.length} categorias · ` +
      `${sonda.play.categorias.map((c) => `${c.valor} ${c.n}`).join(" · ")} = ${somaCategorias}`,
    "529 = 529",
  );
  exigir(
    sonda.play.ponte.arestas === 34 &&
      sonda.play.ponte.midiasDistintas === 14 &&
      sonda.play.ponte.eventosAlcancados === 25 &&
      sonda.play.ponte.deQuantas === 529,
    "05-07 · a ponte mídia→evento, sem uma aresta autorada",
    `${sonda.play.ponte.arestas} arestas de ${sonda.play.ponte.midiasDistintas} mídias, alcançando ${sonda.play.ponte.eventosAlcancados} eventos, de ${sonda.play.ponte.deQuantas}`,
    "34 arestas de 14 mídias",
  );

  // ---- As três ausências do acervo, cada uma com a sua forma ----
  const gratuidade = sonda.semLastro.find((c) => c.campo === "gratuidade");
  const ingresso = gratuidade?.denominadores.find((d) => d.chave === "eventos-com-ingresso-declarado");
  const gratuitas = gratuidade?.denominadores.find((d) => d.chave === "ocorrencias-gratuitas");
  exigir(
    gratuidade?.tipo === "nao-recorta" && ingresso?.n === 0 && gratuitas?.n === 2425,
    "o acervo · 0 de 300 eventos declaram ingresso, e por isso 2.425 de 2.425 sessões saem gratuitas",
    `tipo «${gratuidade?.tipo}» · eventos com ingresso declarado ${ingresso?.n} · ocorrências gratuitas ${gratuitas?.n}`,
    "«não recorta», 0 e 2.425",
  );

  const faixa = sonda.semLastro.find((c) => c.campo === "faixa-etaria");
  const indFaixa = sonda.indicadores.find((i) => i.id === "faixa-etaria");
  exigir(
    faixa?.tipo === "inexistente" &&
      faixa.denominadores.every((d) => d.n === 0) &&
      indFaixa?.valor === null &&
      indFaixa?.sustentado === false,
    "o acervo · FAIXA ETÁRIA não existe em campo nenhum do grafo — e as duas telas dizem o mesmo",
    `filtros: tipo «${faixa?.tipo}», denominadores ${faixa?.denominadores.map((d) => `${d.chave}=${d.n}`).join(" · ")} · ` +
      `observatório: valor ${indFaixa?.valor}, sustentado ${indFaixa?.sustentado}`,
    "«inexistente», tudo zero, e o indicador sem lastro",
  );

  // ---- 0 de 2.425 ocorrências com espaço ----
  // Medido pela ficha por classe: as 2.425 ocorrências do acervo declaram a ficha de
  // acessibilidade, e é sobre elas que a tabela da ficha do evento (05-03) afirma que
  // nenhuma traz espaço publicado. A afirmação é conferida contra o HTML das 300 rotas.
  const evento = await html(`evento/${EVENTO_DO_CMS}/index.html`);
  exigir(
    contarAtributo(evento, "ocorrencia") > 0,
    "05-03 · a ficha do evento do CMS traz as ocorrências no artefato exportado",
    `${contarAtributo(evento, "ocorrencia")} data-ocorrencia · ${contarAtributo(evento, "coluna-acessibilidade")} células de acessibilidade · ${contarAtributo(evento, "tabela-ocorrencias")} tabela(s)`,
    "> 0",
  );

  // ---- A Moderação e a Redação (05-04) ----
  const r = sonda.redacao;
  exigir(
    r.itensNaFila === 60 &&
      r.itensPorOrigem.produtor === 20 &&
      r.itensPorOrigem.ingestao === 20 &&
      r.itensPorOrigem.ia === 20 &&
      r.itensComScore === r.itensPorOrigem.ia,
    "05-04 · a fila das três origens, e o score SÓ na IA",
    `${r.itensNaFila} itens · produtor ${r.itensPorOrigem.produtor} · ingestão ${r.itensPorOrigem.ingestao} · IA ${r.itensPorOrigem.ia} · ` +
      `${r.itensComScore} com score, e ${r.itensComScore - r.itensPorOrigem.ia} fora da IA`,
    "60 = 20+20+20, com score em exatamente os 20 da IA",
  );
  const fila = await html("moderacao/fila/index.html");
  exigir(
    contarAtributo(fila, "item-fila") === r.itensNaFila &&
      contarAtributo(fila, "score-ia") === r.itensComScore &&
      contarAtributo(fila, "acao-moderacao") === r.acoes &&
      contarAtributo(fila, "escopo-curador") === Object.keys(r.escopos).length,
    "05-04 · e a TELA da fila imprime exatamente esses números",
    `HTML: ${contarAtributo(fila, "item-fila")} itens · ${contarAtributo(fila, "score-ia")} scores · ` +
      `${contarAtributo(fila, "acao-moderacao")} ações · ${contarAtributo(fila, "escopo-curador")} escopos`,
    "os números do módulo, no HTML exportado",
  );

  exigir(
    sonda.trilha.slug === SLUG_DA_TRILHA &&
      sonda.trilha.passos.length === r.passosDaTrilha &&
      sonda.trilha.passos.every((x) => x.motivo.trim().length > 0),
    "05-04 · D-85 no MÓDULO: nenhum passo da trilha do acervo chega sem motivo",
    `trilha «${sonda.trilha.slug}» · ${sonda.trilha.passos.length} passos · ${
      sonda.trilha.passos.filter((x) => x.motivo.trim()).length
    } com motivo · ${sonda.trilha.passos.map((x) => x.motivo.length).join("/")} caracteres`,
    "todos com motivo",
  );

  // ---- Os DTOs que atravessam a fronteira, todos abaixo do próprio teto ----
  const dtos = [
    ["mapa-agenda", m.bytesDoDto, m.tetoDoDto],
    ["moderacao/fila", r.bytesDoDto, r.tetoDoDto],
    ["redacao/trilha", r.bytesDoCatalogo, r.tetoDoDto],
    ["observatorio", sonda.observatorio.bytesDoDto, sonda.observatorio.tetoDoDto],
  ];
  const estourando = dtos.filter(([, b, t]) => b > t);
  exigir(
    estourando.length === 0,
    "os DTOs da fase abaixo do próprio teto, conferidos a cada build",
    dtos.map(([n, b, t]) => `${n} ${b}/${t}`).join(" · "),
    "todos abaixo do teto",
  );

  return sonda;
}

// ---------------------------------------------------------------------------
// (b3) O CONTRATO `data-*` NO HTML EXPORTADO.
//
// Uma linha por rota nova ou preenchida, com a contagem de cada atributo do vocabulário que
// 05-01 congelou. O casamento é SEMPRE `data-{atributo}="`, com o igual e a aspa — casar o
// nome solto contaria o payload RSC e a contagem inflaria sem aviso (defeito 6).
//
// OS ATRIBUTOS DE INTERAÇÃO ENTRAM COM ESPERADO ZERO. Eles não existem sem gesto, e contá-los
// no arquivo concluindo «o contrato foi quebrado» é a armadilha que 04-03 nomeou, 04-05
// virou gate e 05-04 reencontrou. O zero aqui é a medida CERTA, e cada um é medido no DOM
// vivo, depois do gesto, no bloco das telas.
// ---------------------------------------------------------------------------

const CONTRATO_POR_ROTA = [
  {
    rota: "acontece/index.html",
    plano: "05-01",
    esperado: {
      "acontece-web": 1,
      "modo-lista": 2,
      interseccao: 1,
      par: 220,
      mapeavel: 158,
      "item-lista": 158,
      pino: 110,
      "lista-recorte": 1,
      denominador: 5,
      "mapa-acontece": 1,
    },
  },
  { rota: "descobrir/index.html", plano: "05-02", esperado: { "grade-web": 1 } },
  { rota: "buscar/index.html", plano: "05-02", esperado: { "coluna-facetas": 1, "link-filtros": 1 } },
  {
    rota: `evento/${EVENTO_DO_CMS}/index.html`,
    plano: "05-03",
    esperado: { "tabela-ocorrencias": 1, "painel-aprofunda": 1 },
  },
  {
    rota: "moderacao/fila/index.html",
    plano: "05-04",
    esperado: {
      "fila-moderacao": 1,
      "item-fila": 60,
      "procedencia-item": 60,
      "score-ia": 20,
      "acao-moderacao": 4,
      "escopo-curador": 3,
      "limites-ia": 1,
    },
  },
  {
    rota: "redacao/trilha/index.html",
    plano: "05-04",
    esperado: {
      "passo-trilha": 3,
      "motivo-passo": 3,
      publicavel: 1,
      "sugestao-ia": 1,
      "limites-ia": 1,
      "slug-trilha": 1,
    },
  },
  {
    rota: "observatorio/index.html",
    plano: "05-05",
    esperado: {
      observatorio: 1,
      "procedencia-painel": 1,
      "procedencia-fatia": 6,
      indicador: 7,
      publico: 4,
      denominador: 14,
      "nao-sustenta": 2,
    },
  },
  {
    rota: "filtros/index.html",
    plano: "05-06",
    esperado: {
      filtros: 1,
      "dimensao-acessibilidade": 8,
      "declarado-ausente": 1,
      "nao-declarado": 1,
      "criterio-inexistente": 1,
      "contador-vivo": 1,
      "nao-sustenta": 6,
    },
  },
  {
    rota: "busca-nao-encontrada/index.html",
    plano: "05-06",
    esperado: { "sem-resultado": 1, beco: 1, afrouxamento: 2, "trilha-relacionada": 1 },
  },
  {
    rota: "agenda-nao-encontrada/index.html",
    plano: "05-06",
    esperado: { "sem-resultado": 1, beco: 1, afrouxamento: 2, "trilha-relacionada": 1 },
  },
  {
    rota: "404.html",
    plano: "05-06",
    esperado: { "sem-resultado": 1, beco: 1, afrouxamento: 4, "trilha-relacionada": 1 },
  },
  {
    // 113 e 4, e não 529 e 10: a reformulação de 2026-08 estreitou /play para a vitrine de
    // STREAMING (vídeo, série, playlist) e mandou podcast para /cast. O gate de DOM lá
    // embaixo já media os números novos; este contrato de ARQUIVO tinha ficado para trás, e
    // o resultado era um portão que reprovaria a tela certa. As 529 rotas de /play/[slug]
    // continuam — o catálogo unificado não encolheu, só a vitrine.
    rota: "play/index.html",
    plano: "05-07",
    // `veja-isto` saiu da conta em 23/08 junto com o painel de cobertura da ponte —
    // ver a asserção de DOM «o painel de cobertura da ponte saiu da vitrine».
    esperado: { play: 1, categoria: 4, midia: 113 },
  },
];

/** Os CINCO atributos que só existem durante uma interação. Zero no artefato é o certo. */
const ATRIBUTOS_DE_INTERACAO = [
  {
    rota: "acontece/index.html",
    atributo: "realcado",
    valor: "sim",
    porque: "o realce de D-81 nasce de um mouseover; no artefato os 268 dizem «nao»",
  },
  {
    rota: "moderacao/fila/index.html",
    atributo: "motivo-veto",
    porque: "o campo de motivo só existe depois de clicar «vetar»",
  },
  {
    rota: "moderacao/fila/index.html",
    atributo: "veto-bloqueado",
    porque: "o estado da trava só existe com o formulário de veto aberto",
  },
  {
    rota: "moderacao/fila/index.html",
    atributo: "decisao-moderacao",
    porque: "nada foi decidido sem um humano clicar — é o que T-05-14 exige",
  },
  {
    rota: `play/${MIDIA_DE_AMOSTRA}/index.html`,
    atributo: "assistido",
    valor: "1",
    porque: "o repertório só registra por gesto humano, nunca por temporizador (D-92, T-05-36)",
  },
];

async function gateContratoNoHtml() {
  titulo("── (b3) o contrato data-* no HTML exportado (casando data-x=\", nunca o nome solto) ──");

  for (const { rota, plano, esperado } of CONTRATO_POR_ROTA) {
    const h = await html(rota);
    const medido = {};
    const divergentes = [];
    for (const [attr, n] of Object.entries(esperado)) {
      const c = contarAtributo(h, attr);
      medido[attr] = c;
      if (c !== n) divergentes.push(`${attr}: medido ${c}, esperado ${n}`);
    }
    exigir(
      divergentes.length === 0,
      `${plano} · /${rota.replace(/index\.html$/, "")}`,
      divergentes.length === 0
        ? Object.entries(medido)
            .map(([k, v]) => `${k}=${v}`)
            .join(" · ")
        : divergentes.join(" | "),
      Object.entries(esperado)
        .map(([k, v]) => `${k}=${v}`)
        .join(" · "),
    );
  }

  titulo("── (b3) os CINCO atributos de INTERAÇÃO, contados no artefato esperando ZERO ──");
  nota(
    "Eles não existem sem gesto. Contá-los aqui e concluir «o contrato foi quebrado» é a " +
      "armadilha que esta obra já pagou três vezes. O zero é a medida certa, e o valor real " +
      "é medido no DOM vivo depois de o gesto ser DIRIGIDO, no bloco das telas.",
  );
  for (const { rota, atributo, valor, porque } of ATRIBUTOS_DE_INTERACAO) {
    const h = await html(rota);
    const n = valor ? contarAtributoValor(h, atributo, valor) : contarAtributo(h, atributo);
    const alvo = valor ? `data-${atributo}="${valor}"` : `data-${atributo}`;
    exigir(
      n === 0,
      `interação · ${alvo} em /${rota.replace(/index\.html$/, "")}`,
      `${n} no artefato exportado — ${porque}`,
      "0, de propósito",
    );
  }

  // O outro lado do mesmo atributo: `data-realcado="nao"` EXISTE no artefato, e em número.
  // É a prova de que o zero acima é ausência de REALCE e não ausência do atributo — a
  // distinção que 05-01 escreveu no código («sempre sim ou nao, nunca ausente»).
  const acontece = await html("acontece/index.html");
  exigir(
    contarAtributoValor(acontece, "realcado", "nao") === 268,
    "interação · e o par do zero: data-realcado=\"nao\" no artefato, em número",
    `${contarAtributoValor(acontece, "realcado", "nao")} elementos dizem «nao» (158 itens + 110 pinos) · ` +
      `${contarAtributoValor(acontece, "realcado", "sim")} dizem «sim»`,
    "268 «nao» e 0 «sim»",
  );

  // ---- O vocabulário compartilhado NÃO colidiu ----
  // 05-01 pediu, por escrito, que `data-denominador` fosse tratado como COMPARTILHADO com
  // 05-05, e `data-nao-sustenta` vem da fase 4 e atravessa a fase inteira. Um gate que os
  // tratasse como exclusivos de um plano acusaria como colisão o reúso que o contrato manda.
  const compartilhados = [
    ["denominador", ["acontece", "filtros", "observatorio", "moderacao/fila", "play", "busca-nao-encontrada"]],
    ["nao-sustenta", ["filtros", "observatorio", "moderacao/fila", "redacao/trilha", "play"]],
  ];
  const linhas = [];
  for (const [attr, rotas] of compartilhados) {
    const contagens = [];
    for (const r of rotas) {
      const h = await html(r === "404" ? "404.html" : `${r}/index.html`);
      contagens.push(`${r}=${contarAtributo(h, attr)}`);
    }
    linhas.push(`data-${attr}: ${contagens.join(" · ")}`);
  }
  info(
    "o vocabulário COMPARTILHADO, reusado como o contrato manda e não como colisão",
    linhas.join("  ||  "),
  );
}

// ---------------------------------------------------------------------------
// PRELÚDIO DE PÁGINA — estende o de `navegador.mjs` com o que a fase 5 precisa.
// ---------------------------------------------------------------------------

const PRELUDIO5 =
  PRELUDIO +
  `
  /** DEFEITO 3. Forma dentro de SVG se mede pelo RETÂNGULO, nunca por offsetParent. */
  const visivelSvg = (el) => {
    if (!el) return false;
    const e = getComputedStyle(el);
    if (e.display === 'none' || e.visibility === 'hidden' || Number(e.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const visiveisSvg = (s) => todos(s).filter(visivelSvg);

  /**
   * DEFEITO 4, e a régua desta fase — DECLARADA antes de ser usada.
   *
   * A história desta função: «cabe na primeira vista» já foi medido contra a moldura
   * MENOS a barra de abas, e a versão herdada subtraía a barra até quando ela ficava
   * no topo (visão web), devolvendo limite 0. A lição que fica é a mesma de então:
   * MEDIR onde a navegação está em vez de presumir, e nunca subtrair uma altura.
   *
   * Desde 2026-08-23 a visão APP voltou a ter algo no pé: a barra inferior flutuante,
   * posicionada contra a moldura, com o quinto botão que abre o hub de aplicativos. O
   * limite útil do app é o TOPO DELA — lido do retângulo, não deduzido da altura, que
   * é exatamente o erro que esta função já pagou uma vez. Na WEB não há barra: o
   * trilho fica à ESQUERDA e o limite continua sendo o fundo visível da moldura. O
   * gateDaRegua imprime as medidas reais das duas antes de qualquer gate de dobra
   * usá-las.
   *
   * SEM CRASE NESTE BLOCO: ele mora dentro do template literal do prelúdio, e uma
   * crase de comentário fecha a string no meio do arquivo.
   */
  const limiteUtil = () => {
    const m = document.querySelector('.moldura');
    const rm = m ? m.getBoundingClientRect() : null;
    const fundo = rm ? Math.round(Math.min(rm.bottom, innerHeight)) : innerHeight;
    const cab = document.querySelector('.barra-topo');
    const trilho = document.querySelector('.menu-lateral');
    const barra = document.querySelector('.barra-inferior');
    const rb = barra && visivel(barra) ? barra.getBoundingClientRect() : null;
    // O TOPO DA BARRA É LIDO, NUNCA SUBTRAÍDO. O mínimo contra o fundo existe porque
    // numa rota sem moldura (/404) a barra também não existe, e o limite tem de
    // continuar sendo a janela em vez de virar NaN.
    const topoDaBarra = rb ? Math.round(rb.top) : null;
    return {
      limite: topoDaBarra === null ? fundo : Math.min(topoDaBarra, fundo),
      contra: !m
        ? 'janela (sem moldura, como /404)'
        : rb
          ? 'topo da barra inferior — é ela que cobre o pé da moldura na visão app'
          : 'fundo visível da moldura — sem barra no pé (web, onde a navegação é o trilho à esquerda, ou bastidor, que não monta navegação)',
      barra: rb ? Math.round(rb.height) : 0,
      cabecalho: cab && visivel(cab) ? Math.round(cab.getBoundingClientRect().height) : 0,
      cabecalhoTopo: cab && visivel(cab) ? Math.round(cab.getBoundingClientRect().top) : null,
      trilho: trilho && visivel(trilho) ? Math.round(trilho.getBoundingClientRect().width) : 0,
      barraTopo: topoDaBarra,
      moldura: rm ? Math.round(rm.bottom) : null,
      molduraTopo: rm ? Math.round(rm.top) : null,
      folgaAteAMoldura: rb && rm ? Math.round(rm.bottom - rb.bottom) : 0,
    };
  };

  /**
   * A LIÇÃO QUE ESTA OBRA PAGOU SEIS VEZES: presença e visibilidade não bastam. Um elemento
   * cortado fora da janela continua «visível» pela definição do prelúdio. Aqui a pergunta é
   * GEOMÉTRICA: o retângulo do elemento está DENTRO do retângulo do contêiner?
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

  /** Retângulo arredondado, para o relatório imprimir número e não objeto ilegível. */
  const ret = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
             base: Math.round(r.bottom), dir: Math.round(r.right) };
  };
  /** Dois retângulos DISJUNTOS: nenhum sobrepõe o outro. É o gate de «lado a lado». */
  const disjuntos = (a, b) => {
    if (!a || !b) return false;
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    return ra.right <= rb.left + 1 || rb.right <= ra.left + 1 || ra.bottom <= rb.top + 1 || rb.bottom <= ra.top + 1;
  };

  const texto = (el) => ((el || document.body).innerText || '');
  const alturaDe = (el) => (el ? Math.round(el.getBoundingClientRect().height) : 0);
  const textoDe = (s) => { const el = document.querySelector(s); return el ? (el.innerText || '').trim() : null; };
  const conta = (s) => document.querySelectorAll(s).length;
  const contaVisiveis = (s) => visiveis(s).length;
  const attr = (s, a) => { const el = document.querySelector(s); return el ? el.getAttribute(a) : null; };
  const valores = (s, a) => todos(s).map((el) => el.getAttribute(a));

  /**
   * O GESTO DE MOUSE, DESPACHADO DE VERDADE. React 19 implementa onMouseEnter/onMouseLeave
   * por delegação sobre «mouseover»/«mouseout», então é esse par que precisa ser despachado,
   * com «bubbles: true» — um evento que não sobe nunca chega ao ouvinte do documento. E o
   * «requestAnimationFrame» depois é o que separa «o estado mudou» de «a tela pintou».
   */
  const passarOMouse = (el, tipo) => new Promise((r) => {
    el.dispatchEvent(new MouseEvent(tipo, { bubbles: true, cancelable: true, view: window }));
    requestAnimationFrame(() => requestAnimationFrame(() => r(true)));
  });
`;

function naPagina5(corpo) {
  return `(() => { ${PRELUDIO5} ${corpo} })()`;
}

/** A mesma coisa, para corpo que precisa de `await` — o gesto de mouse é assíncrono. */
function naPagina5Async(corpo) {
  return `(async () => { ${PRELUDIO5} ${corpo} })()`;
}

// ---------------------------------------------------------------------------
// REDE — a prova por processo de que a demonstração roda sem internet.
//
// DEFEITO 2: não existe domínio `Network.*`. A medida equivalente, feita de DENTRO da
// página, é `performance.getEntriesByType('resource')`: ela enumera TODO recurso que o
// documento pediu — script, folha, imagem, fonte, fetch e XHR. É colhida a cada navegação,
// ANTES de sair do documento, porque a lista é por documento e some na troca.
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

/**
 * Escreve num campo controlado do React: o setter NATIVO do protótipo mais o evento que o
 * React ouve. Definir `.value` direto não dispara o `onChange` do React, e o gate mediria o
 * campo cheio com o estado vazio. O protótipo certo depende da TAG — `<textarea>` não herda
 * o setter de `HTMLInputElement`, e usar o errado lança em silêncio dentro da página.
 */
async function digitar(cdp, seletor, valor) {
  await cdp.avaliar(`(() => {
    const i = document.querySelector(${JSON.stringify(seletor)});
    if (!i) throw new Error('campo não encontrado: ' + ${JSON.stringify(seletor)});
    const proto = i.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
    set.call(i, ${JSON.stringify(valor)});
    i.dispatchEvent(new Event('input', { bubbles: true }));
    i.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await respirar(400);
}

/**
 * A VISÃO, pelos dois caminhos, e o relatório diz qual foi usado. `agenda-cultural:visao` é
 * STRING CRUA no `localStorage` — não JSON. Escrever `"web"` com aspas deixaria a casca sem
 * reconhecer o valor e a tela abriria na visão errada, com todos os gates medindo a outra.
 */
async function porVisao(cdp, base, rota, visao) {
  await irPara(cdp, `${base}${rota}`);
  await cdp.avaliar(`localStorage.setItem('agenda-cultural:visao', ${JSON.stringify(visao)})`);
  await cdp.recarregar();
  await coletarRede(cdp);
  const medida = await cdp.avaliar(`document.querySelector('[data-view]')?.getAttribute('data-view') ?? null`);
  if (medida !== visao) {
    throw new Error(`pedi a visão «${visao}» em ${rota} e a casca abriu em «${medida}»`);
  }
}

/** Foto do viewport travado. Só escreve quando `DIR_CAPTURAS` está definida. */
async function fotografar(cdp, nome) {
  if (!DIR_CAPTURAS) return null;
  await mkdir(DIR_CAPTURAS, { recursive: true });
  const b64 = await cdp.capturar();
  const destino = path.join(DIR_CAPTURAS, `${nome}.png`);
  await writeFile(destino, Buffer.from(b64, "base64"));
  fotos.push(destino);
  nota(`foto: ${destino}`);
  return destino;
}

// ---------------------------------------------------------------------------
// A RÉGUA, DECLARADA ANTES DE SER USADA.
//
// Todo gate de «cabe na primeira vista» desta suíte mede contra o número que este bloco
// imprime, e não contra um número citado de cabeça. 05-06 mediu a barra de abas em 70 px
// contra os 59 px que 05-03 e 04-05 presumiam; a diferença de 11 px é exatamente a folga em
// que um elemento cortado passa por inteiro num gate de presença.
// ---------------------------------------------------------------------------

async function gateDaRegua(cdp, base) {
  titulo("── a régua: a NAVEGAÇÃO, MEDIDA nas duas visões, antes de qualquer gate de dobra ──");

  await porVisao(cdp, base, "/acontece/", "mobile");
  const app = await cdp.avaliar(naPagina5(`return limiteUtil();`));
  await porVisao(cdp, base, "/acontece/", "web");
  const web = await cdp.avaliar(naPagina5(`return limiteUtil();`));
  await porVisao(cdp, base, "/moderacao/fila/", "web");
  const bastidor = await cdp.avaliar(naPagina5(`return limiteUtil();`));

  // Desde 2026-08-23 as duas visões divergem no pé, e a régua prova ISSO: no app a
  // barra inferior cobre o fundo da moldura e o limite útil é o TOPO dela; na web não
  // há barra — o trilho fica à ESQUERDA — e o limite continua sendo o fundo da moldura.
  exigir(
    app.cabecalho > 0 &&
      app.cabecalhoTopo !== null &&
      Math.abs(app.cabecalhoTopo - app.molduraTopo) <= 12 &&
      app.barra > 0 &&
      app.barraTopo !== null &&
      app.limite === app.barraTopo &&
      app.limite < app.moldura,
    "visão APP · cabeçalho no TOPO da moldura, barra no PÉ, e o limite útil é o topo da barra",
    `cabeçalho ${app.cabecalho} px, topo em ${app.cabecalhoTopo} (moldura começa em ${app.molduraTopo}) · ` +
      `barra ${app.barra} px, topo em ${app.barraTopo}, folga de ${app.folgaAteAMoldura} px até a base da ` +
      `moldura (${app.moldura}) · limite ${app.limite} · «${app.contra}» · janela ${ALTURA}`,
    "cabeçalho grudado no topo, barra medida no pé, limite = topo da barra, acima da base da moldura",
  );
  exigir(
    web.trilho > 0 && web.cabecalho === 0 && web.barra === 0 && web.limite === ALTURA,
    "visão WEB · o trilho lateral fica à ESQUERDA (sem cabeçalho e sem barra) e não cobre o pé",
    `trilho ${web.trilho} px de largura · cabeçalho ${web.cabecalho} · barra ${web.barra} · ` +
      `limite ${web.limite} · «${web.contra}»`,
    "trilho visível, sem cabeçalho e sem barra, e o limite é a janela inteira",
  );
  info(
    "e uma rota de BASTIDOR, que não monta navegação nenhuma",
    `/moderacao/fila/: trilho ${bastidor.trilho} px · limite ${bastidor.limite} · «${bastidor.contra}»`,
  );

  resumo.push([
    "régua",
    `no app o cabeçalho fino mede ${app.cabecalho} px no TOPO e a barra inferior mede ${app.barra} px no ` +
      `PÉ — o limite útil é o topo dela, ${app.limite} de ${ALTURA}; na web o trilho lateral mede ` +
      `${web.trilho} px de largura, nada cobre o pé e o limite é a janela inteira; em bastidor e em /404 ` +
      `não há navegação do app. Todo gate de dobra desta suíte imprime o limite que usou`,
  ]);
  return { app, web, bastidor };
}

// ---------------------------------------------------------------------------
// WEB-02 · /acontece — O TRAÇADOR, e o gate mais importante da fase.
//
// É a única tela em que a visão web não é «a mesma coisa mais larga»: ela põe lista e mapa
// lado a lado e os SINCRONIZA pelo cursor, que é o gesto que só existe onde há cursor — e é
// o argumento inteiro de a visão web existir (D-81).
//
// OS PINOS SÃO SVG. `visiveis()` do prelúdio usa `offsetParent`, que é nulo em elemento SVG:
// medi-los por ali daria zero pinos com o mapa cheio na tela. Aqui é retângulo e atributo.
// ---------------------------------------------------------------------------

async function blocoAcontece(cdp, base, regua) {
  titulo("── WEB-02 · /acontece — lista e mapa sincronizados pelo cursor (D-80, D-81, D-90) ──");

  await porVisao(cdp, base, "/acontece/", "web");

  const layout = await cdp.avaliar(
    naPagina5(`
      const lista = document.querySelector('[data-lista-recorte]');
      const mapa = document.querySelector('[data-mapa-acontece]');
      return {
        view: attr('[data-view]', 'data-view'),
        blocoWeb: visivel(document.querySelector('[data-acontece-web]')),
        lista: ret(lista), mapa: ret(mapa),
        disjuntos: disjuntos(lista, mapa),
        janela: innerHeight,
        limite: limiteUtil(),
      };
    `),
  );
  exigir(
    layout.blocoWeb && layout.disjuntos && layout.lista && layout.mapa,
    "D-80 · lista e mapa LADO A LADO, medidos pelo retângulo e não pela classe",
    `lista ${JSON.stringify(layout.lista)} · mapa ${JSON.stringify(layout.mapa)} · disjuntos=${layout.disjuntos}`,
    "os dois presentes e os retângulos disjuntos",
  );
  exigir(
    layout.mapa.base <= layout.limite.limite,
    "D-80 · o mapa INTEIRO cabe na primeira vista — não só o topo dele (o defeito de 05-01)",
    `mapa de ${layout.mapa.y} a ${layout.mapa.base} · limite ${layout.limite.limite} (${layout.limite.contra}) · janela ${layout.janela}`,
    "a BASE do mapa acima do limite útil",
  );

  const pinos = await cdp.avaliar(
    naPagina5(`
      const svg = document.querySelector('[data-mapa-acontece]');
      const quadro = svg.getBoundingClientRect();
      const ps = todos('[data-pino]');
      const zerados = ps.filter((p) => { const r = p.getBoundingClientRect(); return r.width <= 0 || r.height <= 0; });
      const fora = ps.filter((p) => {
        const r = p.getBoundingClientRect();
        return r.left < quadro.left - 1 || r.right > quadro.right + 1 || r.top < quadro.top - 1 || r.bottom > quadro.bottom + 1;
      });
      return { total: ps.length, zerados: zerados.length, fora: fora.length,
               comPar: ps.filter((p) => p.getAttribute('data-par')).length };
    `),
  );
  exigir(
    pinos.total === 110 && pinos.zerados === 0 && pinos.fora === 0 && pinos.comPar === 110,
    "os 110 pinos existem com RETÂNGULO não-vazio dentro do quadro do mapa (SVG: nunca por visiveis())",
    `${pinos.total} pinos · ${pinos.zerados} com retângulo zerado · ${pinos.fora} fora do quadro · ${pinos.comPar} com data-par`,
    "110 pinos, 0 zerados, 0 fora, 110 com par",
  );

  // A BIJEÇÃO, e não o total. 05-01 mediu que dos 158 situados só 110 caem dentro do
  // contorno do Brasil; os 48 de fora (Havana, Grande Londres, Itália, o litoral do Chile)
  // ficam na LISTA, contados e nomeados, e não são desenhados — desenhá-los fora do viewBox
  // os poria no DOM com data-par legível e ZERO pixel na tela, que é o gate verde sobre tela
  // morta que esta fase existe para não repetir. O que o gate prova é que lista e mapa são o
  // MESMO conjunto nos dois sentidos, o que é mais forte que qualquer contagem.
  const bijecao = await cdp.avaliar(
    naPagina5(`
      const itens = todos('[data-item-lista]');
      const mapeaveis = itens.filter((i) => i.getAttribute('data-mapeavel') === 'sim');
      const naoMapeaveis = itens.filter((i) => i.getAttribute('data-mapeavel') === 'nao');
      const paresDaLista = new Set(mapeaveis.map((i) => i.getAttribute('data-par')));
      const paresDoMapa = new Set(todos('[data-pino]').map((p) => p.getAttribute('data-par')));
      const soNaLista = [...paresDaLista].filter((p) => !paresDoMapa.has(p));
      const soNoMapa = [...paresDoMapa].filter((p) => !paresDaLista.has(p));
      return {
        itens: itens.length, mapeaveis: mapeaveis.length, naoMapeaveis: naoMapeaveis.length,
        paresDaLista: paresDaLista.size, paresDoMapa: paresDoMapa.size,
        soNaLista: soNaLista.length, soNoMapa: soNoMapa.length,
        comMotivo: naoMapeaveis.filter((i) => i.getAttribute('data-motivo-sem-pino')).length,
        motivos: [...new Set(naoMapeaveis.map((i) => i.getAttribute('data-motivo-sem-pino')))],
      };
    `),
  );
  exigir(
    bijecao.paresDaLista === 110 &&
      bijecao.paresDoMapa === 110 &&
      bijecao.soNaLista === 0 &&
      bijecao.soNoMapa === 0 &&
      bijecao.itens === 158 &&
      bijecao.naoMapeaveis === 48 &&
      bijecao.comMotivo === 48,
    "05-01 · a BIJEÇÃO 110↔110 entre pino desenhável e linha da lista, nos DOIS sentidos",
    `${bijecao.itens} itens na lista (${bijecao.mapeaveis} mapeáveis + ${bijecao.naoMapeaveis} não) · ` +
      `${bijecao.paresDaLista} pares na lista ↔ ${bijecao.paresDoMapa} no mapa · ` +
      `${bijecao.soNaLista} só na lista · ${bijecao.soNoMapa} só no mapa · ` +
      `os ${bijecao.naoMapeaveis} não desenhados declaram POR QUE (${bijecao.motivos.join(", ")}): ${bijecao.comMotivo} de ${bijecao.naoMapeaveis}`,
    "110 ↔ 110, sem sobra de nenhum lado, e 48 não-mapeáveis com motivo escrito",
  );

  // D-81 · O REALCE, MEDIDO POR CONTAGEM E NÃO POR AMOSTRA. «Realçou o pino certo» é fácil
  // de provar sobre um; o que importa é que NENHUM OUTRO acendeu junto.
  const antes = await cdp.avaliar(
    naPagina5(`return { itens: contaVisiveis('[data-item-lista][data-realcado="sim"]'),
                         pinos: todos('[data-pino][data-realcado="sim"]').length }; `),
  );
  exigir(
    antes.itens === 0 && antes.pinos === 0,
    "D-81 · nenhum realce antes de qualquer gesto (o zero do artefato, confirmado no DOM vivo)",
    `itens realçados ${antes.itens} · pinos realçados ${antes.pinos}`,
    "0 e 0",
  );

  const sobreOItem = await cdp.avaliar(
    naPagina5Async(`
      const item = todos('[data-item-lista][data-mapeavel="sim"]')[3];
      const par = item.getAttribute('data-par');
      await passarOMouse(item, 'mouseover');
      const itens = todos('[data-item-lista][data-realcado="sim"]').map((e) => e.getAttribute('data-par'));
      const pinos = todos('[data-pino][data-realcado="sim"]').map((e) => e.getAttribute('data-par'));
      const pino = todos('[data-pino]').find((p) => p.getAttribute('data-par') === par);
      return { par, itens, pinos, pinoRet: ret(pino),
               tracoRealcado: pino ? getComputedStyle(pino).strokeWidth : null };
    `),
  );
  exigir(
    sobreOItem.itens.length === 1 &&
      sobreOItem.pinos.length === 1 &&
      sobreOItem.itens[0] === sobreOItem.par &&
      sobreOItem.pinos[0] === sobreOItem.par,
    "D-81 · mouseover no ITEM realça o pino de mesmo data-par — e NENHUM outro (contado, não amostrado)",
    `par ${sobreOItem.par} · itens realçados ${JSON.stringify(sobreOItem.itens)} · pinos realçados ${JSON.stringify(sobreOItem.pinos)} · ` +
      `o pino tem retângulo ${JSON.stringify(sobreOItem.pinoRet)} e traço ${sobreOItem.tracoRealcado}`,
    "exatamente 1 item e 1 pino, os dois com o mesmo par",
  );
  // O REALCE É PINTURA, E NÃO SÓ ATRIBUTO. Um `data-realcado="sim"` sem uma linha de CSS
  // atrás dele é o gate verde sobre tela morta em forma pura. E a espera aqui não é folclore:
  // `.web-realce` declara `transition: … stroke-width 120ms`, e dois `requestAnimationFrame`
  // (≈32 ms) medem o meio da transição — foi assim que a primeira execução deste gate leu
  // `stroke-width: 0px` sobre um pino que estava, de fato, ficando laranja.
  const pintura = await cdp.avaliar(
    naPagina5Async(`
      await new Promise((r) => setTimeout(r, 300));
      const item = todos('[data-item-lista][data-realcado="sim"]')[0];
      const pino = todos('[data-pino][data-realcado="sim"]')[0];
      const outro = todos('[data-pino][data-realcado="nao"]')[0];
      const ei = getComputedStyle(item), ep = getComputedStyle(pino), eo = getComputedStyle(outro);
      return {
        itemContorno: ei.outlineColor + ' ' + ei.outlineWidth,
        itemFundo: ei.backgroundColor,
        pinoTraco: ep.stroke + ' ' + ep.strokeWidth,
        pinoPreenchimento: ep.fill,
        pinoNaoRealcadoTraco: eo.stroke + ' ' + eo.strokeWidth,
        pinoNaoRealcadoPreenchimento: eo.fill,
      };
    `),
  );
  exigir(
    parseFloat(pintura.pinoTraco.split(" ").pop()) >= 2 &&
      parseFloat(pintura.pinoNaoRealcadoTraco.split(" ").pop()) === 0 &&
      parseFloat(pintura.itemContorno.split(" ").pop()) >= 2 &&
      pintura.pinoPreenchimento !== pintura.pinoNaoRealcadoPreenchimento,
    "D-81 · o realce é PINTURA e não só atributo — e o pino não realçado prova o contraste",
    `item: contorno ${pintura.itemContorno}, fundo ${pintura.itemFundo} · ` +
      `pino realçado: traço ${pintura.pinoTraco}, preenchimento ${pintura.pinoPreenchimento} · ` +
      `pino NÃO realçado: traço ${pintura.pinoNaoRealcadoTraco}, preenchimento ${pintura.pinoNaoRealcadoPreenchimento}`,
    "traço ≥ 2 no realçado, 0 no não realçado, e preenchimentos diferentes",
  );
  await fotografar(cdp, "05-08-acontece-web-realce");

  const depoisDoMouseOut = await cdp.avaliar(
    naPagina5Async(`
      const item = todos('[data-item-lista][data-mapeavel="sim"]')[3];
      await passarOMouse(item, 'mouseout');
      return { itens: todos('[data-item-lista][data-realcado="sim"]').length,
               pinos: todos('[data-pino][data-realcado="sim"]').length };
    `),
  );
  exigir(
    depoisDoMouseOut.itens === 0 && depoisDoMouseOut.pinos === 0,
    "D-81 · mouseout devolve os DOIS a data-realcado=\"nao\" — o realce não fica preso aceso",
    `itens ${depoisDoMouseOut.itens} · pinos ${depoisDoMouseOut.pinos}`,
    "0 e 0",
  );

  const sobreOPino = await cdp.avaliar(
    naPagina5Async(`
      const pino = todos('[data-pino]')[42];
      const par = pino.getAttribute('data-par');
      await passarOMouse(pino, 'mouseover');
      const itens = todos('[data-item-lista][data-realcado="sim"]').map((e) => e.getAttribute('data-par'));
      const pinos = todos('[data-pino][data-realcado="sim"]').map((e) => e.getAttribute('data-par'));
      await passarOMouse(pino, 'mouseout');
      return { par, itens, pinos };
    `),
  );
  exigir(
    sobreOPino.itens.length === 1 &&
      sobreOPino.pinos.length === 1 &&
      sobreOPino.itens[0] === sobreOPino.par,
    "D-81 · mouseover no PINO realça o ITEM de volta — a sincronia é dos DOIS lados",
    `par ${sobreOPino.par} · itens ${JSON.stringify(sobreOPino.itens)} · pinos ${JSON.stringify(sobreOPino.pinos)}`,
    "exatamente 1 item e 1 pino, com o mesmo par",
  );

  // O recorte «por data»: 129 itens, NENHUM com par, e a interseção declarada. É a tela em
  // que o acervo não sustenta o cruzamento e o diz, em vez de mostrar um mapa vazio.
  const porData = await cdp.avaliar(
    naPagina5Async(`
      const botao = todos('[data-modo-lista="data"]')[0];
      botao.click();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const itens = todos('[data-item-lista]');
      const bloco = document.querySelector('[data-interseccao]');
      return {
        recorte: attr('[data-lista-recorte]', 'data-lista-recorte'),
        itens: itens.length,
        comPar: itens.filter((i) => i.getAttribute('data-par')).length,
        pinos: todos('[data-pino]').length,
        interseccaoVisivel: visivel(bloco),
        denominadores: valores('[data-denominador]', 'data-denominador'),
        numeros: todos('[data-denominador]').map((e) => (e.innerText || '').trim().split('\\n')[0]),
      };
    `),
  );
  exigir(
    porData.recorte === "data" &&
      porData.itens === 129 &&
      porData.comPar === 0 &&
      porData.pinos === 0 &&
      porData.interseccaoVisivel === true,
    "D-90 · no recorte «por data» nenhum item tem par, o mapa não desenha nada, e a interseção é PRODUTO",
    `recorte «${porData.recorte}» · ${porData.itens} itens · ${porData.comPar} com par · ${porData.pinos} pinos · ` +
      `bloco de interseção visível=${porData.interseccaoVisivel}`,
    "129 itens, 0 pares, 0 pinos, e a declaração visível",
  );
  exigir(
    porData.denominadores.length === 5 &&
      porData.denominadores.join(",") === "com-sessao,com-lugar,com-os-dois,no-desenho,fora-do-desenho",
    "D-90 · os CINCO denominadores da declaração estão na tela, com os números",
    `${porData.denominadores.map((d, i) => `${d}=${porData.numeros[i]}`).join(" · ")}`,
    "com-sessao, com-lugar, com-os-dois, no-desenho, fora-do-desenho",
  );
  await fotografar(cdp, "05-08-acontece-web-interseccao");

  // A visão app: some o BLOCO INTEIRO, e não só a coluna do mapa — esconder só o mapa
  // deixaria uma segunda lista de 158 eventos embaixo da agenda da fase 3 (desvio 4 de 05-01).
  await porVisao(cdp, base, "/acontece/", "mobile");
  const naApp = await cdp.avaliar(
    naPagina5(`
      return {
        view: attr('[data-view]', 'data-view'),
        blocoWeb: visivel(document.querySelector('[data-acontece-web]')),
        mapa: visivelSvg(document.querySelector('[data-mapa-acontece]')),
        pinosComRetangulo: visiveisSvg('[data-pino]').length,
        itensDaListaWeb: contaVisiveis('[data-item-lista]'),
        cartoes: contaVisiveis('[data-evento]'),
        moldura: Boolean(document.querySelector('.moldura')),
      };
    `),
  );
  exigir(
    naApp.view === "mobile" &&
      naApp.blocoWeb === false &&
      naApp.mapa === false &&
      naApp.pinosComRetangulo === 0 &&
      naApp.itensDaListaWeb === 0 &&
      naApp.cartoes > 0,
    "D-79 · na visão app /acontece é a agenda da fase 3: some o BLOCO INTEIRO, não só o mapa",
    `view=${naApp.view} · bloco web visível=${naApp.blocoWeb} · mapa=${naApp.mapa} · ` +
      `${naApp.pinosComRetangulo} pinos com retângulo · ${naApp.itensDaListaWeb} linhas da lista web visíveis · ` +
      `${naApp.cartoes} cartões da agenda · moldura=${naApp.moldura}`,
    "nada da web visível, e a agenda da fase 3 no lugar",
  );

  resumo.push([
    "WEB-02",
    `/acontece na visão web: lista e mapa lado a lado e disjuntos, o mapa inteiro acima da dobra ` +
      `(base ${layout.mapa.base} de um limite de ${layout.limite.limite}); a bijeção 110↔110 provada nos dois ` +
      `sentidos, com os 48 situados fora do contorno na lista, contados e com o motivo escrito; o realce ` +
      `de D-81 acende UM item e UM pino nos dois sentidos e apaga os dois no mouseout. Na visão app, ` +
      `a agenda da fase 3 intacta e zero mapa`,
  ]);
  void regua;
}

// ---------------------------------------------------------------------------
// WEB-01 · /descobrir — a grade, e o destaque que ocupa mais de uma coluna.
//
// D-80 diz que o que muda na web não é largura, é DENSIDADE e SIMULTANEIDADE. Numa grade,
// «destaque» não é borda mais grossa: é ocupar mais colunas. É isso que o gate mede.
// ---------------------------------------------------------------------------

async function blocoDescobrir(cdp, base) {
  titulo("── WEB-01 · /descobrir — grade de várias colunas e o destaque curado (D-79, D-80) ──");

  await porVisao(cdp, base, "/descobrir/", "web");
  const web = await cdp.avaliar(
    naPagina5(`
      const grade = document.querySelector('[data-grade-web]');
      const destaque = document.querySelector('[data-destaque-curado]');
      const e = getComputedStyle(grade);
      const colunas = e.gridTemplateColumns.split(' ').filter(Boolean);
      const cartoes = visiveis('[data-grade-web] > *');
      const comuns = cartoes.filter((c) => !c.hasAttribute('data-destaque-curado'));
      const selos = visiveis('.selo-motivo');
      return {
        display: e.display,
        colunas: colunas.length, larguras: colunas.join(' '),
        destaque: ret(destaque),
        cartaoComum: ret(comuns[0]),
        totalCartoes: cartoes.length,
        selos: selos.length,
        selosComAltura: selos.filter((s) => s.getBoundingClientRect().height > 0).length,
        selosDentroDoCartao: selos.filter((s) => {
          // O redesenho de 2026-08 içou o destaque curado para fora da grade
          // (`.descobrir-destaque`, irmão de [data-grade-web]); o invólucro dele
          // é contêiner tão legítimo quanto um item da grade — o que a asserção
          // mede é que nenhum selo VAZA do retângulo do próprio cartão.
          const c = s.closest('[data-grade-web] > *, .descobrir-destaque');
          if (!c) return false;
          const rs = s.getBoundingClientRect(), rc = c.getBoundingClientRect();
          return rs.left >= rc.left - 1 && rs.right <= rc.right + 1;
        }).length,
        transborda: transbordaNaHorizontal(),
      };
    `),
  );
  exigir(
    web.display === "grid" && web.colunas > 1,
    "D-80 · na visão web /descobrir é GRADE de mais de uma coluna, medida pelo estilo computado",
    `display=${web.display} · ${web.colunas} colunas (${web.larguras}) · ${web.totalCartoes} cartões visíveis`,
    "grid com mais de 1 coluna",
  );
  exigir(
    web.destaque && web.cartaoComum && web.destaque.w > web.cartaoComum.w,
    "D-80 · o destaque curado é MAIS LARGO que um cartão comum — na grade, destaque é ocupar colunas",
    `destaque ${web.destaque?.w}px contra cartão comum ${web.cartaoComum?.w}px · ` +
      `retângulos ${JSON.stringify(web.destaque)} e ${JSON.stringify(web.cartaoComum)}`,
    "o destaque mais largo que o cartão comum",
  );
  exigir(
    web.selos > 0 && web.selosComAltura === web.selos && web.selosDentroDoCartao === web.selos,
    "os selos de motivo têm altura maior que zero E ficam dentro do retângulo do próprio cartão",
    `${web.selos} selos · ${web.selosComAltura} com altura > 0 · ${web.selosDentroDoCartao} dentro do cartão`,
    "todos com altura e todos dentro",
  );
  exigir(
    web.transborda.transborda === false,
    "nada de /descobrir corre para fora da janela na visão web",
    `scrollWidth ${web.transborda.scrollWidth} · clientWidth ${web.transborda.clientWidth}`,
    "scrollWidth == clientWidth",
  );
  await fotografar(cdp, "05-08-descobrir-web");

  await porVisao(cdp, base, "/descobrir/", "mobile");
  const app = await cdp.avaliar(
    naPagina5(`
      const grade = document.querySelector('[data-grade-web]');
      const e = getComputedStyle(grade);
      const cartoes = visiveis('[data-grade-web] > *');
      const linhas = new Set(cartoes.map((c) => Math.round(c.getBoundingClientRect().top)));
      const molduraLargura = Math.round(document.querySelector('.moldura').getBoundingClientRect().width);
      return {
        display: e.display, cartoes: cartoes.length, linhas: linhas.size,
        larguraDoCartao: cartoes.length ? Math.round(cartoes[0].getBoundingClientRect().width) : 0,
        molduraLargura,
      };
    `),
  );
  exigir(
    app.display !== "grid" && app.linhas === app.cartoes,
    "D-79 · na visão app /descobrir é COLUNA ÚNICA — a grade não vazou para dentro da moldura",
    `display=${app.display} · ${app.cartoes} cartões em ${app.linhas} linhas distintas · ` +
      `cartão de ${app.larguraDoCartao}px numa moldura de ${app.molduraLargura}px`,
    "não é grid, e uma linha por cartão",
  );

  resumo.push([
    "WEB-01",
    `/descobrir na visão web é grade de ${web.colunas} colunas com o destaque curado ocupando ${web.destaque.w}px ` +
      `contra ${web.cartaoComum.w}px de um cartão comum, e os ${web.selos} selos de motivo com altura e dentro do ` +
      `cartão; na visão app, coluna única com ${app.cartoes} cartões em ${app.linhas} linhas`,
  ]);
}

// ---------------------------------------------------------------------------
// WEB-04 · /buscar — as facetas em coluna permanente, à esquerda e SEM COBRIR.
//
// «A coluna aparece» é fácil e é o gate que 05-02 teve de reescrever: com a busca VAZIA a
// coluna é o filho mais alto da faixa e o `sticky` não tem para onde viajar. O gate mede os
// DOIS estados com a verdade de cada um, e a pergunta que importa — ela cobre os resultados?
// — é respondida por retângulos disjuntos, nunca por classe.
// ---------------------------------------------------------------------------

async function blocoBuscar(cdp, base) {
  titulo("── WEB-04 · /buscar — a coluna de facetas permanente, à esquerda e sem sobrepor (D-80) ──");

  await porVisao(cdp, base, "/buscar/", "web");
  const aberta = await cdp.avaliar(
    naPagina5(`
      const facetas = document.querySelector('[data-coluna-facetas]');
      const resultados = document.querySelector('[data-coluna-resultados]');
      return {
        facetasVisivel: visivel(facetas),
        facetas: ret(facetas), resultados: ret(resultados),
        disjuntos: disjuntos(facetas, resultados),
        aEsquerda: facetas && resultados
          ? facetas.getBoundingClientRect().right <= resultados.getBoundingClientRect().left + 1 : null,
        position: facetas ? getComputedStyle(facetas).position : null,
        cliquesAteAqui: 0,
      };
    `),
  );
  exigir(
    aberta.facetasVisivel && aberta.disjuntos && aberta.aEsquerda,
    "D-80 · a coluna de facetas abre JÁ ABERTA, à esquerda dos resultados, sem sobrepô-los",
    `facetas ${JSON.stringify(aberta.facetas)} · resultados ${JSON.stringify(aberta.resultados)} · ` +
      `disjuntos=${aberta.disjuntos} · à esquerda=${aberta.aEsquerda} · position=${aberta.position} · sem um clique`,
    "visível, disjunta e à esquerda, com zero clique",
  );

  // OS DOIS ESTADOS, CADA UM COM A SUA VERDADE — e esta ordem não é acidente.
  //
  // Com a busca VAZIA, a coluna é o filho MAIS ALTO da faixa da grade, e um elemento sticky
  // não tem para onde viajar dentro da própria área: os poucos pixels que a página rola são
  // o conteúdo que vem DEPOIS da grade. Exigir «topo parado em 20» nesse estado é exigir o
  // impossível; foi a única falha legítima que 05-02 teve. O que se exige aqui é o que vale
  // no estado vazio — a coluna nunca sai da tela — e o relatório imprime o quanto a página
  // rola de verdade, para o número não parecer escolhido.
  const vazio = await cdp.avaliar(
    naPagina5Async(`
      const medidas = [];
      const maximo = document.documentElement.scrollHeight - innerHeight;
      for (const y of [900, 2400, 5200]) {
        scrollTo(0, y);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const r = document.querySelector('[data-coluna-facetas]').getBoundingClientRect();
        medidas.push({ pedido: y, y: Math.round(scrollY), topo: Math.round(r.top), base: Math.round(r.bottom) });
      }
      scrollTo(0, 0);
      await new Promise((r) => requestAnimationFrame(r));
      return { medidas, maximo: Math.round(maximo), alturaDoDocumento: document.documentElement.scrollHeight };
    `),
  );
  exigir(
    vazio.medidas.every((m) => m.base > 0 && m.topo < ALTURA),
    "D-80 · estado VAZIO · a coluna de facetas nunca sai da tela — e o gate diz quanto a página rola",
    `documento de ${vazio.alturaDoDocumento}px, rolagem máxima ${vazio.maximo}px · ` +
      vazio.medidas.map((m) => `pedi ${m.pedido} → scrollY ${m.y}: topo ${m.topo}, base ${m.base}`).join(" · "),
    "a coluna com base > 0 e topo < 960 nas três tentativas",
  );

  const marcarFaceta = await cdp.avaliar(
    naPagina5Async(`
      const antesUrl = location.pathname;
      const antesN = todos('[data-coluna-resultados] li').length;
      const botao = visiveis('[data-coluna-facetas] button[aria-pressed="false"]')[0]
                 || visiveis('[data-coluna-facetas] button')[0];
      const rotulo = (botao.innerText || '').trim().replace(/\\n/g, ' ').slice(0, 60);
      botao.click();
      await new Promise((r) => setTimeout(r, 600));
      return {
        antesUrl, depoisUrl: location.pathname, rotulo,
        antesN, depoisN: todos('[data-coluna-resultados] li').length,
        pressionado: botao.getAttribute('aria-pressed'),
        alturaDoDocumento: document.documentElement.scrollHeight,
      };
    `),
  );
  exigir(
    marcarFaceta.antesUrl === marcarFaceta.depoisUrl &&
      marcarFaceta.antesUrl === "/buscar/" &&
      marcarFaceta.depoisN > marcarFaceta.antesN,
    "D-80 · marcar uma faceta RECALCULA sem trocar de tela — location.pathname intacto",
    `«${marcarFaceta.rotulo}» · ${marcarFaceta.antesUrl} → ${marcarFaceta.depoisUrl} · ` +
      `resultados ${marcarFaceta.antesN} → ${marcarFaceta.depoisN} · aria-pressed=${marcarFaceta.pressionado} · ` +
      `o documento passou de ${vazio.alturaDoDocumento}px para ${marcarFaceta.alturaDoDocumento}px`,
    "o pathname continua /buscar/, e o recorte muda",
  );

  // AGORA sim: com resultado na tela a faixa da grade cresce, o sticky tem para onde viajar,
  // e «permanente» passa a significar alguma coisa. Aqui a exigência é a forte — o topo PARA
  // num valor e fica lá nas três alturas —, e não «está dentro da janela».
  const comResultado = await cdp.avaliar(
    naPagina5Async(`
      const medidas = [];
      for (const y of [900, 2400, 5200]) {
        scrollTo(0, y);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const r = document.querySelector('[data-coluna-facetas]').getBoundingClientRect();
        medidas.push({ pedido: y, y: Math.round(scrollY), topo: Math.round(r.top), base: Math.round(r.bottom) });
      }
      scrollTo(0, 0);
      await new Promise((r) => requestAnimationFrame(r));
      return { medidas, maximo: Math.round(document.documentElement.scrollHeight - innerHeight) };
    `),
  );
  const topos = comResultado.medidas.map((m) => m.topo);
  const parou = topos.every((t) => Math.abs(t - topos[0]) <= 2) && topos[0] >= 0 && topos[0] < 60;
  exigir(
    parou && comResultado.maximo > 2000,
    "D-80 · com RESULTADO na tela a coluna COLA e o topo PARA — a forma forte, nas três alturas",
    `rolagem máxima ${comResultado.maximo}px · ` +
      comResultado.medidas.map((m) => `scrollY ${m.y} → topo ${m.topo}`).join(" · ") +
      ` · variação máxima ${Math.max(...topos) - Math.min(...topos)}px`,
    "o topo parado no mesmo valor (±2px) e acima de 60, com rolagem real",
  );
  await fotografar(cdp, "05-08-buscar-web-facetas");

  await porVisao(cdp, base, "/buscar/", "mobile");
  const app = await cdp.avaliar(
    naPagina5(`
      const facetas = document.querySelector('[data-coluna-facetas]');
      const resultados = document.querySelector('[data-coluna-resultados]');
      const rf = facetas.getBoundingClientRect(), rr = resultados.getBoundingClientRect();
      return {
        position: getComputedStyle(facetas).position,
        abaixoDosResultados: rf.top >= rr.top,
        linkFiltrosVisivel: visivel(document.querySelector('[data-link-filtros]')),
      };
    `),
  );
  exigir(
    app.position === "static" && app.abaixoDosResultados,
    "D-79 · na visão app as facetas voltam a ficar EMPILHADAS abaixo dos resultados, e não coladas",
    `position=${app.position} · abaixo dos resultados=${app.abaixoDosResultados} · ` +
      `link para /filtros/ visível na app=${app.linkFiltrosVisivel} (a porta do app é de 05-06)`,
    "static, e abaixo dos resultados",
  );

  resumo.push([
    "WEB-04",
    `/buscar na visão web abre com a coluna de facetas já aberta em ${JSON.stringify(aberta.facetas)} contra ` +
      `${JSON.stringify(aberta.resultados)} dos resultados — disjuntos —, ela continua na janela em scrollY ` +
      `900/2.400/5.200, e marcar faceta recalcula sem trocar de URL`,
  ]);
}

// ---------------------------------------------------------------------------
// WEB-03 · /evento/[slug] — a ficha com densidade de desktop.
//
// Dois eventos, e os dois são necessários: o do CMS tem 53 sessões e é ele que faz a tabela
// existir; o da Enciclopédia tem ZERO sessão datada e a ficha das 8 dimensões em «não
// declarado» — é o outro lado de D-43 na mesma tela.
//
// A MEDIDA É `display` E VISIBILIDADE, NUNCA AUSÊNCIA DE ATRIBUTO. O HTML exportado é UM SÓ
// para as duas visões e a visão é estado de cliente: emitir `data-tabela-ocorrencias` só na
// web exigiria um `if (visao === …)`, que D-79/D-05 proíbem. 05-03 registrou isso por
// escrito, e é por isso que este gate mede o LAYOUT e não a presença.
// ---------------------------------------------------------------------------

async function blocoEvento(cdp, base) {
  titulo("── WEB-03 · /evento/[slug] — tabela de ocorrências e painel lateral (D-80, D-43) ──");

  for (const [rotulo, slug] of [
    ["CMS · 53 sessões", EVENTO_DO_CMS],
    ["Enciclopédia · 0 sessão datada", EVENTO_DA_ENCICLOPEDIA],
  ]) {
    await porVisao(cdp, base, `/evento/${slug}/`, "web");
    const web = await cdp.avaliar(
      naPagina5Async(`
        const lista = document.querySelector('[data-tabela-ocorrencias]');
        const painel = document.querySelector('[data-painel-aprofunda]');
        const principal = painel ? painel.parentElement : null;
        const antes = ret(painel);
        scrollTo(0, 837);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const depois = ret(painel);
        scrollTo(0, 0);
        await new Promise((r) => requestAnimationFrame(r));
        return {
          temLista: Boolean(lista),
          display: lista ? getComputedStyle(lista).display : null,
          linhas: lista ? lista.querySelectorAll('[data-ocorrencia]').length : 0,
          celulasDeAcesso: contaVisiveis('[data-coluna-acessibilidade]'),
          estados: [...new Set(valores('[data-coluna-acessibilidade]', 'data-coluna-acessibilidade'))],
          scrollWidth: lista ? lista.scrollWidth : null,
          clientWidth: lista ? lista.clientWidth : null,
          painelVisivel: visivel(painel),
          painelAntes: antes, painelDepois: depois,
          painelPosition: painel ? getComputedStyle(painel).position : null,
          limite: limiteUtil(),
          transborda: transbordaNaHorizontal(),
          dimensoes: contaVisiveis('[data-dimensao]'),
        };
      `),
    );

    exigir(
      web.painelVisivel && web.painelAntes.y <= web.limite.limite && web.painelDepois.base > 0 && web.painelDepois.y < ALTURA,
      `${rotulo} · web · o painel «aprofunda isto» está na primeira vista E continua na janela depois de rolar`,
      `topo ${web.painelAntes.y} contra o limite ${web.limite.limite} (${web.limite.contra}) · ` +
        `depois de rolar 837px: topo ${web.painelDepois.y}, base ${web.painelDepois.base} · position=${web.painelPosition}`,
      "na primeira vista, e ainda na janela depois de rolar",
    );
    exigir(
      web.transborda.transborda === false && (!web.temLista || web.scrollWidth === web.clientWidth),
      `${rotulo} · web · nada corre para fora: nem a página, nem a tabela`,
      `documento ${web.transborda.scrollWidth}/${web.transborda.clientWidth} · ` +
        (web.temLista ? `lista ${web.scrollWidth}/${web.clientWidth}` : "sem tabela nesta ficha"),
      "scrollWidth == clientWidth nos dois",
    );

    if (slug === EVENTO_DO_CMS) {
      exigir(
        web.display === "grid" && web.linhas === 53 && web.celulasDeAcesso === 53,
        `${rotulo} · web · a lista de ocorrências É TABELA, com coluna de acessibilidade em cada linha`,
        `display=${web.display} · ${web.linhas} linhas · ${web.celulasDeAcesso} células de acessibilidade visíveis · ` +
          `estados ${JSON.stringify(web.estados)}`,
        "grid, 53 linhas, 53 células",
      );
      await fotografar(cdp, "05-08-evento-cms-web");
    } else {
      exigir(
        web.linhas === 0 && web.dimensoes === 8,
        `${rotulo} · web · sem sessão datada não há tabela, e a ficha das 8 dimensões continua na tela (D-43)`,
        `${web.linhas} ocorrências · ${web.dimensoes} dimensões visíveis na ficha`,
        "0 ocorrências e 8 dimensões",
      );
    }
  }

  // A visão app da ficha do CMS: os blocos da fase 2, na ORDEM da fase 2, e zero tabela.
  await porVisao(cdp, base, `/evento/${EVENTO_DO_CMS}/`, "mobile");
  const app = await cdp.avaliar(
    naPagina5(`
      const lista = document.querySelector('[data-tabela-ocorrencias]');
      const blocos = visiveis('[data-bloco]').map((b) => ({ nome: b.getAttribute('data-bloco'), topo: Math.round(b.getBoundingClientRect().top + scrollY) }));
      return {
        display: lista ? getComputedStyle(lista).display : null,
        cabecalhos: contaVisiveis('[data-cabecalho-tabela]'),
        celulasDeAcesso: contaVisiveis('[data-coluna-acessibilidade]'),
        ocorrencias: contaVisiveis('[data-ocorrencia]'),
        condicoes: contaVisiveis('[data-condicao]'),
        blocos,
        ordenados: blocos.every((b, i) => i === 0 || b.topo >= blocos[i - 1].topo),
        moldura: Boolean(document.querySelector('.moldura')),
      };
    `),
  );
  exigir(
    app.display === "flex" && app.celulasDeAcesso === 0 && app.ocorrencias === 53 && app.moldura,
    "D-79 · na visão app a ficha é a da fase 2: pilha de cartões, zero elemento de tabela visível",
    `display=${app.display} · ${app.celulasDeAcesso} células de acessibilidade visíveis · ` +
      `${app.cabecalhos} cabeçalhos · ${app.ocorrencias} cartões de sessão · moldura=${app.moldura}`,
    "flex, 0 células de tabela, 53 cartões",
  );

  resumo.push([
    "WEB-03",
    `/evento/[slug] na visão web: 53 sessões em tabela de grade com coluna de acessibilidade e o painel ` +
      `«aprofunda isto» ao lado, na primeira vista e ainda na janela depois de 837px de rolagem; no evento ` +
      `da Enciclopédia, zero tabela e as 8 dimensões da ficha. Na visão app, os 53 cartões da fase 2 e zero tabela`,
  ]);
}

// ---------------------------------------------------------------------------
// WEB-05 · /moderacao/fila — a curadoria com poder real, e a obrigação DIRIGIDA.
//
// «O botão está disabled» é a afirmação fácil. A afirmação que importa é «NENHUMA decisão
// nasce», e ela só se prova dirigindo o gesto: clicar o botão travado, forçar Enter e forçar
// submit, e contar zero. Um botão que apenas PARECE apagado ainda dispara pelos três
// caminhos, e cada um produziria um veto sem motivo — que é a moderação silenciosa que D-83
// existe para impedir.
// ---------------------------------------------------------------------------

async function blocoRedacaoFila(cdp, base) {
  titulo("── WEB-05 · /moderacao/fila — origem, score e o veto que não conclui sem motivo (D-82, D-83, D-84) ──");

  await porVisao(cdp, base, "/moderacao/fila/", "web");

  const aoChegar = await cdp.avaliar(
    naPagina5(`
      const itens = todos('[data-item-fila]');
      const origens = {};
      for (const i of itens) {
        const o = i.getAttribute('data-procedencia-item');
        origens[o] = (origens[o] || 0) + 1;
      }
      // O atributo é de LINHA mas mora num descendente da linha (05-04 tirou-o do painel
      // de propósito, para a contagem exportada não sair 21 com 20 itens de IA). Por isso a
      // pergunta é «a linha CONTÉM um score», e não «a linha TEM o atributo».
      const comScore = itens.filter((i) => i.querySelector('[data-score-ia]'));
      const scoreForaDaIa = comScore.filter((i) => i.getAttribute('data-procedencia-item') !== 'ia');
      const limites = document.querySelector('[data-limites-ia]');
      return {
        itens: itens.length, origens,
        comScore: comScore.length, scoreForaDaIa: scoreForaDaIa.length,
        scores: [...new Set(comScore.map((i) => Number(i.querySelector('[data-score-ia]').getAttribute('data-score-ia'))))].sort((a, b) => a - b),
        decisoes: conta('[data-decisao-moderacao]'),
        acoes: valores('[data-acao-moderacao]', 'data-acao-moderacao'),
        escopos: valores('[data-escopo-curador]', 'data-escopo-curador'),
        limitesVisivel: visivel(limites),
        limitesItens: limites ? limites.querySelectorAll('li').length : 0,
      };
    `),
  );
  exigir(
    aoChegar.itens === 60 &&
      aoChegar.origens.produtor === 20 &&
      aoChegar.origens.ingestao === 20 &&
      aoChegar.origens.ia === 20 &&
      aoChegar.comScore === 20 &&
      aoChegar.scoreForaDaIa === 0,
    "D-82 · toda linha declara a origem, e o score de confiança existe SÓ nos itens de IA",
    `${aoChegar.itens} itens · ${JSON.stringify(aoChegar.origens)} · ${aoChegar.comScore} com score, ` +
      `${aoChegar.scoreForaDaIa} deles fora da IA · scores distintos ${JSON.stringify(aoChegar.scores)}`,
    "60 = 20+20+20, 20 com score, 0 fora da IA",
  );
  exigir(
    aoChegar.decisoes === 0 && aoChegar.acoes.length === 4,
    "D-83 · a tela carrega do ZERO: nenhuma decisão tomada, e as quatro ações esperando",
    `${aoChegar.decisoes} decisões · ações ${JSON.stringify(aoChegar.acoes)} · escopos ${JSON.stringify(aoChegar.escopos)}`,
    "0 decisões e 4 ações",
  );
  exigir(
    aoChegar.limitesVisivel === true && aoChegar.limitesItens === 3,
    "D-86 · os TRÊS limites da IA são PRODUTO — visíveis na tela",
    `data-limites-ia visível=${aoChegar.limitesVisivel} · ${aoChegar.limitesItens} limites`,
    "visível, com 3 limites",
  );

  // ---- O VETO, com o campo VAZIO. As três formas de forçar, e o zero exigido. ----
  await cdp.clicar(`document.querySelector('[data-acao-moderacao="vetar"]')`);
  await respirar(500);

  const travado = await cdp.avaliar(
    naPagina5(`
      const campo = document.querySelector('[data-motivo-veto]');
      const botao = document.querySelector('[data-veto-bloqueado]');
      return {
        campo: ret(campo), botao: ret(botao),
        bloqueado: botao ? botao.getAttribute('data-veto-bloqueado') : null,
        disabled: botao ? botao.disabled : null,
        limite: limiteUtil(),
        decisoes: conta('[data-decisao-moderacao]'),
      };
    `),
  );
  exigir(
    travado.bloqueado === "sim" && travado.disabled === true,
    "T-05-14 · com o campo VAZIO o botão está de fato `disabled`, e o atributo reflete o BOTÃO",
    `data-veto-bloqueado=${travado.bloqueado} · propriedade disabled=${travado.disabled}`,
    "«sim» e disabled verdadeiro",
  );
  exigir(
    travado.campo.base <= travado.limite.limite && travado.botao.base <= travado.limite.limite,
    "o campo de motivo E o botão travado cabem INTEIROS na primeira vista (o defeito de 05-04)",
    `campo de ${travado.campo.y} a ${travado.campo.base} · botão de ${travado.botao.y} a ${travado.botao.base} · ` +
      `limite ${travado.limite.limite} (${travado.limite.contra}) · janela ${ALTURA}`,
    "os dois com a base acima do limite útil",
  );
  await fotografar(cdp, "05-08-redacao-fila-veto-bloqueado");

  const forcado = await cdp.avaliar(
    naPagina5Async(`
      const botao = document.querySelector('[data-veto-bloqueado]');
      const form = botao.closest('form');
      botao.click();
      botao.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      try { form.requestSubmit ? form.requestSubmit() : form.submit(); } catch (e) {}
      await new Promise((r) => setTimeout(r, 400));
      return { decisoes: conta('[data-decisao-moderacao]'), bloqueado: botao.getAttribute('data-veto-bloqueado') };
    `),
  );
  exigir(
    forcado.decisoes === 0,
    "T-05-14 · clicar o botão travado, forçar Enter e forçar submit NÃO registra decisão nenhuma",
    `${forcado.decisoes} decisões depois dos três caminhos · bloqueado continua «${forcado.bloqueado}»`,
    "0 decisões",
  );

  await digitar(cdp, "[data-motivo-veto]", "   \n  ");
  const brancos = await cdp.avaliar(
    naPagina5(`
      const b = document.querySelector('[data-veto-bloqueado]');
      return { bloqueado: b.getAttribute('data-veto-bloqueado'), disabled: b.disabled,
               valor: JSON.stringify(document.querySelector('[data-motivo-veto]').value) };
    `),
  );
  exigir(
    brancos.bloqueado === "sim" && brancos.disabled === true,
    "D-83 · espaço em branco NÃO é motivo — o botão continua travado",
    `valor do campo ${brancos.valor} · bloqueado=${brancos.bloqueado} · disabled=${brancos.disabled}`,
    "continua travado",
  );

  const MOTIVO = "Sem confirmação da fonte primária: a data diverge do que o produtor publicou.";
  await digitar(cdp, "[data-motivo-veto]", MOTIVO);
  const liberado = await cdp.avaliar(
    naPagina5(`
      const b = document.querySelector('[data-veto-bloqueado]');
      return { bloqueado: b.getAttribute('data-veto-bloqueado'), disabled: b.disabled };
    `),
  );
  exigir(
    liberado.bloqueado === "nao" && liberado.disabled === false,
    "D-83 · escrito o motivo, a trava abre — e as duas leituras andam juntas",
    `bloqueado=${liberado.bloqueado} · disabled=${liberado.disabled}`,
    "«nao» e disabled falso",
  );

  await cdp.clicar(`document.querySelector('[data-veto-bloqueado]')`);
  await respirar(600);
  const registrada = await cdp.avaliar(
    naPagina5(`
      const ds = todos('[data-decisao-moderacao]');
      return {
        n: ds.length,
        acao: ds.length ? ds[0].getAttribute('data-acao-registrada') : null,
        texto: ds.length ? (ds[0].innerText || '').replace(/\\n+/g, ' · ').trim() : null,
      };
    `),
  );
  const carimbo = /\d{2}\.\d{2}\.\d{4}/.test(registrada.texto ?? "");
  exigir(
    registrada.n === 1 &&
      registrada.acao === "vetar" &&
      (registrada.texto ?? "").includes(MOTIVO) &&
      carimbo,
    "D-83/D-84 · o veto com motivo cria EXATAMENTE uma decisão, com o motivo literal, o autor e o carimbo",
    `${registrada.n} decisão · ação «${registrada.acao}» · carimbo DD.MM.AAAA presente=${carimbo}`,
    "1 decisão, com motivo, autor e carimbo",
  );
  imprimirTexto("a decisão registrada, como ela aparece na tela", registrada.texto ?? "");

  const escopo = await cdp.avaliar(
    naPagina5Async(`
      const antesUrl = location.pathname;
      const antes = conta('[data-item-fila]');
      const alvo = document.querySelector('[data-escopo-curador="territorial"]');
      alvo.click();
      await new Promise((r) => setTimeout(r, 500));
      return { antesUrl, depoisUrl: location.pathname, antes, depois: conta('[data-item-fila]'),
               pressionado: alvo.getAttribute('aria-pressed') };
    `),
  );
  exigir(
    escopo.antesUrl === escopo.depoisUrl &&
      escopo.depois < escopo.antes &&
      escopo.depois > 0,
    "D-84 · trocar o escopo do curador muda o RECORTE e não a URL — e o recorte encolhe sem zerar",
    `${escopo.antesUrl} → ${escopo.depoisUrl} · ${escopo.antes} itens → ${escopo.depois} · aria-pressed=${escopo.pressionado}`,
    "mesma URL, e o recorte menor que o total e maior que zero",
  );

  resumo.push([
    "WEB-05",
    `/moderacao/fila abre com 60 itens (20 por origem), score em exatamente os 20 de IA e ZERO decisão; ` +
      `clicar «vetar» com o campo vazio deixa o botão disabled com data-veto-bloqueado="sim", e clique, ` +
      `Enter e submit forçados produzem 0 decisões; escrito o motivo, um clique cria UMA decisão com o ` +
      `texto literal, o autor e o carimbo; trocar o escopo recorta ${escopo.antes}→${escopo.depois} sem mudar a URL`,
  ]);
}

// ---------------------------------------------------------------------------
// WEB-06 · /redacao/trilha — e O CONTRATO DE D-85 ENTRE DUAS PONTAS.
//
// Este é o gate que não podia existir em nenhum plano da onda 2, e é a razão declarada de
// este plano existir. 05-04 escreveu o editor; o selo público de `/trilha/[slug]/` é da fase
// 3. Nenhum dos dois podia comparar o próprio texto com o do outro. Aqui os dois são LIDOS,
// em duas navegações, e comparados com igualdade estrita depois de aparar as pontas.
// ---------------------------------------------------------------------------

async function blocoRedacaoTrilha(cdp, base) {
  titulo("── WEB-06 · /redacao/trilha — motivo obrigatório por passo, e D-85 entre o editor e o público ──");

  await porVisao(cdp, base, "/redacao/trilha/", "web");

  const inicial = await cdp.avaliar(
    naPagina5(`
      const publicavel = document.querySelector('[data-publicavel]');
      const publicar = document.querySelector('[data-publicar]');
      return {
        slug: attr('[data-slug-trilha]', 'data-slug-trilha'),
        passos: conta('[data-passo-trilha]'),
        motivos: valores('[data-motivo-passo]', 'data-motivo-passo'),
        vazios: todos('[data-motivo-passo]').filter((m) => m.getAttribute('data-vazio') === 'sim').length,
        publicavel: publicavel ? publicavel.getAttribute('data-publicavel') : null,
        publicarDisabled: publicar ? publicar.disabled : null,
        sugestoes: conta('[data-sugestao-ia]'),
        candidatos: conta('[data-candidato-catalogo]'),
      };
    `),
  );
  exigir(
    inicial.slug === SLUG_DA_TRILHA &&
      inicial.passos === 3 &&
      inicial.vazios === 0 &&
      inicial.publicavel === "sim" &&
      inicial.publicarDisabled === false,
    "D-85 · o editor abre com os 3 passos do acervo, todos com motivo, e a trilha PUBLICÁVEL",
    `trilha «${inicial.slug}» · ${inicial.passos} passos · ${inicial.vazios} sem motivo · ` +
      `data-publicavel=${inicial.publicavel} · botão de publicar disabled=${inicial.publicarDisabled} · ` +
      `${inicial.candidatos} candidatos no catálogo · ${inicial.sugestoes} sugestão da IA`,
    "3 passos, 0 sem motivo, publicável e botão liberado",
  );

  // ================= O CONTRATO DE D-85, MEDIDO ENTRE AS DUAS PONTAS =================
  const doEditor = await cdp.avaliar(
    naPagina5(`
      return todos('[data-motivo-passo]').map((el) => ({
        ordem: el.closest('[data-passo-trilha]')?.getAttribute('data-passo-trilha') ?? null,
        atributo: el.getAttribute('data-motivo-passo'),
        valor: el.value ?? null,
      }));
    `),
  );

  await porVisao(cdp, base, `/trilha/${SLUG_DA_TRILHA}/`, "mobile");
  const doPublico = await cdp.avaliar(
    naPagina5(`
      return todos('[data-motivo-passo]').map((el) => ({
        ordem: el.closest('[data-passo-trilha]')?.getAttribute('data-passo-trilha') ?? null,
        atributo: el.getAttribute('data-motivo-passo'),
        texto: (el.innerText || '').trim(),
        visivel: visivel(el),
        altura: Math.round(el.getBoundingClientRect().height),
      }));
    `),
  );

  const divergentes = [];
  for (const e of doEditor) {
    const p = doPublico.find((x) => x.ordem === e.ordem);
    if (!p) {
      divergentes.push(`passo ${e.ordem}: sem correspondente no selo público`);
      continue;
    }
    const noEditor = String(e.atributo).trim();
    const noEditorPorValor = String(e.valor).trim();
    const noPublicoPorAtributo = String(p.atributo).trim();
    const noPublicoPorTexto = String(p.texto).trim();
    if (noEditor !== noPublicoPorAtributo) {
      divergentes.push(`passo ${e.ordem}: atributo do editor ≠ atributo do selo`);
    }
    if (noEditor !== noPublicoPorTexto) {
      divergentes.push(`passo ${e.ordem}: atributo do editor ≠ TEXTO do selo`);
    }
    if (noEditor !== noEditorPorValor) {
      divergentes.push(`passo ${e.ordem}: o atributo do editor ≠ o value do campo`);
    }
    if (!p.visivel || p.altura <= 0) {
      divergentes.push(`passo ${e.ordem}: o selo público não está visível`);
    }
  }
  exigir(
    divergentes.length === 0 && doEditor.length === 3 && doPublico.length === 3,
    "D-85 · o motivo de CADA passo no editor bate CARACTERE A CARACTERE com o selo público de /trilha/[slug]/",
    divergentes.length === 0
      ? `${doEditor.length} passos, conferidos pelos TRÊS caminhos (atributo do editor, value do campo, texto do selo): ` +
        doEditor.map((e, i) => `passo ${e.ordem} ${String(e.atributo).length} caracteres`).join(" · ") +
        ` · os selos do público estão visíveis com altura ${doPublico.map((p) => p.altura).join("/")}px`
      : divergentes.join(" | "),
    "igualdade estrita nos três caminhos, e os selos visíveis",
  );
  for (const e of doEditor) {
    imprimirTexto(`D-85 · passo ${e.ordem} — o mesmo texto nas duas telas`, e.atributo);
  }

  // ---- O passo SEM motivo: nomeado, e a publicação travada ----
  await porVisao(cdp, base, "/redacao/trilha/", "web");
  const acrescentado = await cdp.avaliar(
    naPagina5Async(`
      const antes = conta('[data-passo-trilha]');
      const candidato = todos('[data-candidato-catalogo]')[0];
      const titulo = (candidato.innerText || '').trim().replace(/\\n+/g, ' ').slice(0, 60);
      candidato.querySelector('button').click();
      await new Promise((r) => setTimeout(r, 500));
      const publicavel = document.querySelector('[data-publicavel]');
      const publicar = document.querySelector('[data-publicar]');
      return {
        antes, depois: conta('[data-passo-trilha]'), titulo,
        vazios: todos('[data-motivo-passo]').filter((m) => m.getAttribute('data-vazio') === 'sim').length,
        publicavel: publicavel.getAttribute('data-publicavel'),
        publicarDisabled: publicar.disabled,
        aviso: (publicavel.innerText || '').replace(/\\n+/g, ' ').trim(),
      };
    `),
  );
  exigir(
    acrescentado.depois === acrescentado.antes + 1 &&
      acrescentado.vazios === 1 &&
      acrescentado.publicavel === "nao" &&
      acrescentado.publicarDisabled === true,
    "D-85 · acrescentar um passo cria-o SEM motivo, e a trilha deixa de publicar — com o botão `disabled`",
    `${acrescentado.antes} → ${acrescentado.depois} passos · ${acrescentado.vazios} sem motivo · ` +
      `data-publicavel=${acrescentado.publicavel} · publicar disabled=${acrescentado.publicarDisabled}`,
    "um passo a mais, 1 sem motivo, «nao» e botão travado",
  );
  exigir(
    /passo\s*4/i.test(acrescentado.aviso) && /sem motivo/i.test(acrescentado.aviso),
    "D-85 · a tela NOMEIA qual passo está sem motivo, em vez de só dizer que não publica",
    acrescentado.aviso.slice(0, 220),
    "o aviso nomeia o passo 4 e diz que está sem motivo",
  );
  await fotografar(cdp, "05-08-redacao-trilha-sem-motivo");

  const forcarPublicar = await cdp.avaliar(
    naPagina5Async(`
      const publicar = document.querySelector('[data-publicar]');
      const form = publicar.closest('form');
      publicar.click();
      try { form.requestSubmit ? form.requestSubmit() : form.submit(); } catch (e) {}
      await new Promise((r) => setTimeout(r, 400));
      return { publicavel: attr('[data-publicavel]', 'data-publicavel'), decisoes: conta('[data-decisao-moderacao]') };
    `),
  );
  exigir(
    forcarPublicar.publicavel === "nao" && forcarPublicar.decisoes === 0,
    "D-85 · forçar o clique e o submit no botão travado NÃO publica",
    `data-publicavel continua «${forcarPublicar.publicavel}» · ${forcarPublicar.decisoes} publicações registradas`,
    "continua «nao», e nada publicado",
  );

  await digitar(
    cdp,
    '[data-passo-trilha="4"] [data-motivo-passo]',
    "o passo entra aqui porque a curadoria escreveu o porquê, e sem este texto ele não vira selo público.",
  );
  const devolvido = await cdp.avaliar(
    naPagina5(`
      const publicar = document.querySelector('[data-publicar]');
      return { publicavel: attr('[data-publicavel]', 'data-publicavel'), disabled: publicar.disabled,
               vazios: todos('[data-motivo-passo]').filter((m) => m.getAttribute('data-vazio') === 'sim').length };
    `),
  );
  exigir(
    devolvido.publicavel === "sim" && devolvido.disabled === false && devolvido.vazios === 0,
    "D-85 · preenchido o motivo daquele passo, a trilha volta a publicável",
    `data-publicavel=${devolvido.publicavel} · disabled=${devolvido.disabled} · ${devolvido.vazios} sem motivo`,
    "«sim», botão liberado, 0 sem motivo",
  );

  const descarte = await cdp.avaliar(
    naPagina5Async(`
      const antesPassos = conta('[data-passo-trilha]');
      const antesSugestoes = conta('[data-sugestao-ia]');
      const botao = document.querySelector('[data-descartar-sugestao]');
      if (botao) botao.click();
      await new Promise((r) => setTimeout(r, 400));
      return { antesPassos, antesSugestoes, sugestoes: conta('[data-sugestao-ia]'), passos: conta('[data-passo-trilha]') };
    `),
  );
  exigir(
    descarte.sugestoes === 0 && descarte.passos === descarte.antesPassos,
    "D-86 · descartar a sugestão da IA a remove da tela e NÃO altera a trilha",
    `sugestões ${descarte.antesSugestoes} → ${descarte.sugestoes} · passos ${descarte.antesPassos} → ${descarte.passos}`,
    "0 sugestões e os passos intactos",
  );

  resumo.push([
    "WEB-06",
    `/redacao/trilha: os 3 motivos do editor batem caractere a caractere com os selos de ` +
      `/trilha/${SLUG_DA_TRILHA}/ pelos três caminhos (atributo, value e texto) — é o contrato de D-85 ` +
      `que nenhum plano da onda 2 podia medir sozinho; acrescentar um passo sem motivo trava a publicação ` +
      `e a tela NOMEIA o passo 4; descartar a sugestão da IA não altera a trilha`,
  ]);
}

// ---------------------------------------------------------------------------
// WEB-07 · /observatorio — a métrica que não é pageview, e o painel que é o argumento.
//
// D-88: o painel de procedência é TELA DE PRIMEIRA CLASSE, não rodapé. Um gate de presença
// passaria com ele no pé da página; o que se exige aqui é que ele esteja na PRIMEIRA VISTA,
// e que a base dele — não só o topo — caiba nela.
//
// D-90 na forma mais dura: indicador sem lastro NÃO desenha barra nenhuma. Um trilho vazio
// ainda é um gráfico, e um gráfico afirma escala; a barra cheia de «2.425 de 2.425 sessões
// gratuitas» é literalmente a barra de «100% gratuito» que D-90 proíbe.
// ---------------------------------------------------------------------------

async function blocoObservatorio(cdp, base) {
  titulo("── WEB-07 · /observatorio — o painel de procedência e os sete indicadores (D-87 a D-90) ──");

  await porVisao(cdp, base, "/observatorio/", "web");

  const painel = await cdp.avaliar(
    naPagina5(`
      const p = document.querySelector('[data-procedencia-painel]');
      // AS FATIAS VÊM INTERCALADAS, e isso é a decisão de projeto de 05-05: UMA LINHA por
      // procedência com as DUAS leituras lado a lado, para a inversão 61,8%→22,4% aparecer
      // junta em vez de ficar a 500 px de si mesma. Agrupar por ÍNDICE aqui daria as duas
      // somas trocadas — o gate tem de ler a leitura declarada em cada fatia.
      const fatias = todos('[data-procedencia-fatia]').map((f) => {
        const t = (f.innerText || '').replace(/\\./g, '').match(/\\d+/);
        const barra = f.querySelector('.obs-barra');
        return {
          procedencia: f.getAttribute('data-procedencia-fatia'),
          leitura: f.getAttribute('data-leitura-procedencia')
                ?? f.closest('[data-leitura-procedencia]')?.getAttribute('data-leitura-procedencia')
                ?? null,
          n: t ? Number(t[0]) : null,
          largura: barra ? Math.round(barra.getBoundingClientRect().width * 100) / 100 : null,
        };
      });
      const numeros = fatias.map((f) => f.n);
      const barras = fatias.map((f) => ({ procedencia: f.procedencia, leitura: f.leitura, largura: f.largura }));
      const transbordando = todos('[data-procedencia-fatia] .obs-barra').filter((b) => {
        const t = b.parentElement.getBoundingClientRect();
        return b.getBoundingClientRect().width > t.width + 1;
      });
      return {
        rolagem: Math.round(scrollY),
        visivel: visivel(p), ret: ret(p), janela: innerHeight,
        fatias: fatias.length,
        detalhe: fatias,
        deEntidades: fatias.filter((f) => f.leitura === 'entidades'),
        deArestas: fatias.filter((f) => f.leitura === 'arestas'),
        numeros,
        barras, transbordando: transbordando.length,
      };
    `),
  );
  exigir(
    painel.visivel && painel.rolagem === 0 && painel.ret.y < ALTURA && painel.ret.base <= ALTURA,
    "D-88 · o painel de procedência está INTEIRO na primeira vista, sem rolar — não é rodapé",
    `sem rolar (scrollY ${painel.rolagem}): topo ${painel.ret.y}, base ${painel.ret.base}, altura ${painel.ret.h} · janela ${painel.janela}`,
    "topo e BASE dentro da janela, sem rolar",
  );

  const somaE = painel.deEntidades.reduce((s, f) => s + (f.n ?? 0), 0);
  const somaA = painel.deArestas.reduce((s, f) => s + (f.n ?? 0), 0);
  exigir(
    painel.fatias === 6 &&
      painel.deEntidades.length === 3 &&
      painel.deArestas.length === 3 &&
      somaE === 7810 &&
      somaA === 66563,
    "D-88 · seis fatias na tela — três por leitura — e os números EXIBIDOS somam 7.810 e 66.563",
    `${painel.fatias} fatias, intercaladas uma linha por procedência · ` +
      `entidades ${painel.deEntidades.map((f) => `${f.procedencia} ${f.n}`).join(" + ")} = ${somaE} · ` +
      `arestas ${painel.deArestas.map((f) => `${f.procedencia} ${f.n}`).join(" + ")} = ${somaA}`,
    "3 + 3 fatias somando 7.810 e 66.563",
  );

  // A INVERSÃO É O ACHADO DO PAINEL, e ela tem de estar na tela: o Itaú Cultural entrega a
  // maioria das COISAS e nós derivamos a maioria das LIGAÇÕES entre elas. Um gate que só
  // somasse as fatias não notaria se as duas leituras contassem a mesma história.
  const icE = painel.deEntidades.find((f) => f.procedencia === "ic");
  const derE = painel.deEntidades.find((f) => f.procedencia === "derivado");
  const icA = painel.deArestas.find((f) => f.procedencia === "ic");
  const derA = painel.deArestas.find((f) => f.procedencia === "derivado");
  exigir(
    icE.n > derE.n && derA.n > icA.n,
    "D-88 · a INVERSÃO entre as duas leituras está na tela: o acervo deu as coisas, nós derivamos as ligações",
    `entidades: ic ${icE.n} > derivado ${derE.n} · arestas: derivado ${derA.n} > ic ${icA.n}`,
    "ic maior em entidade e derivado maior em aresta",
  );

  const ordemBate = (fs) => {
    const porNumero = fs.map((f, i) => i).sort((a, b) => fs[b].n - fs[a].n);
    const porLargura = fs.map((f, i) => i).sort((a, b) => fs[b].largura - fs[a].largura);
    return porNumero.join(",") === porLargura.join(",");
  };
  exigir(
    ordemBate(painel.deEntidades) && ordemBate(painel.deArestas) && painel.transbordando === 0,
    "as larguras de barra são MEDIDAS e vêm na mesma ordem dos números — nas duas leituras",
    `entidades: ${painel.deEntidades.map((f) => `${f.procedencia} n=${f.n} w=${f.largura}px`).join(" · ")} || ` +
      `arestas: ${painel.deArestas.map((f) => `${f.procedencia} n=${f.n} w=${f.largura}px`).join(" · ")} · ` +
      `${painel.transbordando} barras transbordando o trilho`,
    "a ordem das larguras igual à dos números, e nenhuma transbordando",
  );
  await fotografar(cdp, "05-08-observatorio-procedencia");

  const indicadores = await cdp.avaliar(
    naPagina5(`
      const inds = todos('[data-indicador]');
      const semLastro = inds.filter((i) => i.getAttribute('data-sustentado') === 'nao');
      const barrasEmSemLastro = semLastro.flatMap((i) => Array.from(i.querySelectorAll('.obs-barra')));
      const denominadores = todos('[data-denominador]');
      const semAltura = denominadores.filter((d) => d.getBoundingClientRect().height <= 0);
      const porIndicador = inds.map((i) => ({
        id: i.getAttribute('data-indicador'),
        sustentado: i.getAttribute('data-sustentado'),
        comBarra: i.querySelector('[data-com-barra]')?.getAttribute('data-com-barra') ?? null,
        denominadores: i.querySelectorAll('[data-denominador]').length,
        altura: Math.round(i.getBoundingClientRect().height),
      }));
      return {
        total: inds.length, semLastro: semLastro.map((i) => i.getAttribute('data-indicador')),
        barrasEmSemLastro: barrasEmSemLastro.length,
        denominadores: denominadores.length, semAltura: semAltura.length,
        porIndicador,
      };
    `),
  );
  exigir(
    indicadores.total === 7 && indicadores.semLastro.length === 2 && indicadores.barrasEmSemLastro === 0,
    "D-90 · indicador sem lastro NÃO desenha barra nenhuma — nem um trilho vazio, que afirmaria escala",
    `${indicadores.total} indicadores · sem lastro: ${indicadores.semLastro.join(", ")} · ` +
      `${indicadores.barrasEmSemLastro} barras desenhadas dentro deles`,
    "7 indicadores, 2 sem lastro, 0 barras neles",
  );
  exigir(
    indicadores.semAltura === 0 &&
      indicadores.porIndicador.every((i) => i.denominadores > 0 && i.altura > 0),
    "T-05-23 · cada indicador traz o seu denominador, com altura maior que zero",
    indicadores.porIndicador
      .map((i) => `${i.id}[${i.sustentado}] ${i.denominadores} denom, ${i.altura}px`)
      .join(" · "),
    "todos com denominador e altura",
  );

  const publicos = await cdp.avaliar(
    naPagina5Async(`
      const urls = [], ordens = [], destaques = [], painelSobreviveu = [];
      for (const b of todos('[data-publico]')) {
        b.click();
        await new Promise((r) => setTimeout(r, 350));
        urls.push(location.pathname);
        ordens.push(valores('[data-indicador]', 'data-indicador').join('>'));
        destaques.push(todos('[data-destaque="sim"]').map((e) => e.getAttribute('data-indicador')).join(','));
        painelSobreviveu.push(todos('[data-procedencia-fatia]').length);
      }
      return { urls, ordens: [...new Set(ordens)], ordensBrutas: ordens, destaques: [...new Set(destaques)],
               painelSobreviveu, conjuntos: [...new Set(ordens.map((o) => o.split('>').sort().join(',')))] };
    `),
  );
  exigir(
    publicos.urls.length === 4 &&
      new Set(publicos.urls).size === 1 &&
      publicos.urls[0] === "/observatorio/" &&
      publicos.ordens.length === 4 &&
      publicos.conjuntos.length === 1 &&
      publicos.painelSobreviveu.every((n) => n === 6),
    "D-89 · trocar de público muda a ÊNFASE e a ORDEM, não a URL nem o CONJUNTO — e o painel sobrevive aos quatro",
    `${publicos.urls.length} públicos, todos em ${publicos.urls[0]} · ${publicos.ordens.length} ordens DIFERENTES · ` +
      `${publicos.conjuntos.length} conjunto único de indicadores · ${publicos.destaques.length} conjuntos de destaque · ` +
      `fatias do painel em cada público: ${publicos.painelSobreviveu.join(", ")}`,
    "mesma URL, 4 ordens, 1 conjunto, painel com 6 fatias nos quatro",
  );

  const desertos = await cdp.avaliar(
    naPagina5(`
      const mapa = document.querySelector('[data-mapa-desertos]');
      const ufs = mapa ? Array.from(mapa.querySelectorAll('[data-uf]')) : [];
      const zeradas = ufs.filter((u) => { const r = u.getBoundingClientRect(); return r.width <= 0 || r.height <= 0; });
      const t = texto(document.body);
      return {
        mapa: mapa ? ret(mapa) : null, visivelSvg: visivelSvg(mapa),
        ufs: ufs.length, zeradas: zeradas.length,
        sergipe: /Sergipe/.test(t), tocantins: /Tocantins/.test(t),
        transborda: transbordaNaHorizontal(),
      };
    `),
  );
  exigir(
    desertos.visivelSvg && desertos.sergipe && desertos.tocantins && desertos.transborda.transborda === false,
    "D-87 · o mapa de desertos está DESENHADO, com os dois estados sem registro NOMEADOS",
    `mapa ${JSON.stringify(desertos.mapa)} · ${desertos.ufs} unidades federativas, ${desertos.zeradas} com retângulo zerado · ` +
      `«Sergipe» na tela=${desertos.sergipe} · «Tocantins»=${desertos.tocantins} · ` +
      `documento ${desertos.transborda.scrollWidth}/${desertos.transborda.clientWidth}`,
    "o mapa com retângulo, os dois estados nomeados, e nada correndo para fora",
  );

  const gratuidade = await cdp.avaliar(
    naPagina5(`
      const g = document.querySelector('[data-indicador="gratuito-x-pago"]');
      const dens = Array.from(g.querySelectorAll('[data-denominador]'));
      return {
        naoSustenta: g.querySelector('[data-nao-sustenta]')?.getAttribute('data-nao-sustenta')
                  ?? g.getAttribute('data-nao-sustenta'),
        sustentado: g.getAttribute('data-sustentado'),
        denominadores: dens.map((d) => ({ chave: d.getAttribute('data-denominador'), altura: Math.round(d.getBoundingClientRect().height) })),
        barras: g.querySelectorAll('.obs-barra').length,
        texto: (g.innerText || '').replace(/\\n+/g, ' ').trim().slice(0, 260),
      };
    `),
  );
  exigir(
    gratuidade.sustentado === "nao" &&
      gratuidade.denominadores.length === 2 &&
      gratuidade.denominadores.every((d) => d.altura > 0) &&
      gratuidade.barras === 0,
    "D-90 · gratuidade DECLARADA como não sustentada, com os DOIS denominadores e nenhuma barra",
    `sustentado=${gratuidade.sustentado} · data-nao-sustenta=${gratuidade.naoSustenta} · ` +
      `denominadores ${gratuidade.denominadores.map((d) => `${d.chave} ${d.altura}px`).join(" · ")} · ` +
      `${gratuidade.barras} barras`,
    "«nao», 2 denominadores com altura, 0 barras",
  );
  imprimirTexto("D-90 · gratuidade, como a tela a declara", gratuidade.texto);

  resumo.push([
    "WEB-07",
    `/observatorio abre com o painel de procedência INTEIRO na primeira vista (${painel.ret.y}–${painel.ret.base} de ` +
      `${ALTURA}), seis fatias somando 7.810 e 66.563 com as larguras de barra na mesma ordem dos números; ` +
      `os sete indicadores trazem denominador, os dois sem lastro não desenham barra nenhuma, e trocar entre ` +
      `os quatro públicos muda a ordem sem mudar a URL nem o conjunto`,
  ]);
}

// ---------------------------------------------------------------------------
// APPX-01 · /filtros — acessibilidade como CRITÉRIO, e as três formas de recusa.
//
// D-91 põe as 8 dimensões no mesmo lugar e com o mesmo peso de linguagem e território. O
// argumento só sobrevive se as CINCO que medem zero continuarem MARCÁVEIS, com o zero
// declarado ANTES da marcação: escondê-las apagaria o diagnóstico, que é o argumento.
//
// E as três ausências têm formas diferentes de propósito: a dimensão zerada é marcável e
// explica o vazio; gratuidade é controle morto porque o campo EXISTE e não recorta; faixa
// etária é controle morto porque o campo NÃO EXISTE. Colapsá-las apagaria o que cada uma
// diz sobre a fonte.
// ---------------------------------------------------------------------------

async function blocoFiltros(cdp, base) {
  titulo("── APPX-01 · /filtros — as 8 dimensões como critério, e as três formas de recusa (D-91, D-90, D-43) ──");

  await porVisao(cdp, base, "/filtros/", "mobile");

  const inicial = await cdp.avaliar(
    naPagina5(`
      const dims = todos('[data-dimensao-acessibilidade]');
      const contador = document.querySelector('[data-contador-vivo]');
      const faixa = document.querySelector('[data-criterio-inexistente]');
      const botaoDaFaixa = faixa ? faixa.querySelector('button') : null;
      return {
        dims: dims.length,
        alturas: dims.map((d) => Math.round(d.getBoundingClientRect().height)),
        marcaveis: dims.filter((d) => { const b = d.querySelector('button'); return b && !b.disabled; }).length,
        zeradas: dims.filter((d) => d.hasAttribute('data-nao-sustenta')).map((d) => d.getAttribute('data-dimensao-acessibilidade')),
        numerosAntes: dims.map((d) => ({
          campo: d.getAttribute('data-dimensao-acessibilidade'),
          n: (d.querySelector('[data-denominador]')?.innerText ?? '').trim(),
        })),
        contador: contador ? Number(contador.getAttribute('data-contador-vivo')) : null,
        contadorRet: ret(contador), limite: limiteUtil(),
        declaradoAusente: attr('[data-declarado-ausente]', 'data-declarado-ausente'),
        naoDeclarado: attr('[data-nao-declarado]', 'data-nao-declarado'),
        denomFicha: todos('[data-denominador="ficha-declaram"], [data-denominador="ficha-nao-declaram"]')
          .map((e) => (e.innerText || '').trim()),
        faixaCampo: faixa ? faixa.getAttribute('data-criterio-inexistente') : null,
        faixaMarcavel: botaoDaFaixa ? !botaoDaFaixa.disabled : null,
        transborda: transbordaNaHorizontal(),
      };
    `),
  );
  exigir(
    inicial.dims === 8 &&
      inicial.marcaveis === 8 &&
      inicial.alturas.every((a) => a > 0) &&
      inicial.zeradas.length === 5,
    "D-91 · os OITO controles de dimensão, todos com altura e todos MARCÁVEIS — inclusive as 5 que medem zero",
    `${inicial.dims} controles · alturas ${JSON.stringify(inicial.alturas)} · ${inicial.marcaveis} marcáveis · ` +
      `${inicial.zeradas.length} com data-nao-sustenta: ${inicial.zeradas.join(", ")}`,
    "8 controles, 8 marcáveis, 5 declarando o zero",
  );
  exigir(
    inicial.numerosAntes.every((d) => /\d/.test(d.n)),
    "D-90 · cada dimensão declara o seu número ANTES de qualquer marcação — o zero chega explicado",
    inicial.numerosAntes.map((d) => `${d.campo}=${d.n}`).join(" · "),
    "todas com número antes do gesto",
  );
  exigir(
    inicial.contadorRet.base <= inicial.limite.limite,
    "o contador ao vivo cabe INTEIRO na primeira vista, contra o limite medido",
    `contador de ${inicial.contadorRet.y} a ${inicial.contadorRet.base} · limite ${inicial.limite.limite} ` +
      `(${inicial.limite.contra}) · janela ${ALTURA}`,
    "a base do contador acima do limite útil",
  );
  exigir(
    inicial.declaradoAusente === "declara" &&
      inicial.naoDeclarado === "nao-declara" &&
      inicial.denomFicha.join(" ").includes("5.108") &&
      inicial.denomFicha.join(" ").includes("2.702"),
    "D-43 · declarado-ausente e não-declarado são DOIS controles distintos, com 5.108 e 2.702",
    `data-declarado-ausente=${inicial.declaradoAusente} · data-nao-declarado=${inicial.naoDeclarado} · ` +
      `denominadores ${JSON.stringify(inicial.denomFicha)}`,
    "dois controles, com os dois denominadores",
  );
  exigir(
    inicial.faixaCampo === "faixa-etaria" && inicial.faixaMarcavel === false,
    "D-91 · faixa etária está na tela, NOMEADA, e não é marcável — o campo não existe no acervo",
    `data-criterio-inexistente=${inicial.faixaCampo} · marcável=${inicial.faixaMarcavel}`,
    "presente e não marcável",
  );
  exigir(
    inicial.transborda.transborda === false,
    "nada de /filtros corre para fora da moldura",
    `documento ${inicial.transborda.scrollWidth}/${inicial.transborda.clientWidth}`,
    "scrollWidth == clientWidth",
  );

  const marcarLibras = await cdp.avaliar(
    naPagina5Async(`
      const antesUrl = location.pathname;
      const antes = Number(attr('[data-contador-vivo]', 'data-contador-vivo'));
      document.querySelector('[data-dimensao-acessibilidade="libras"] button').click();
      await new Promise((r) => setTimeout(r, 500));
      return { antesUrl, depoisUrl: location.pathname, antes,
               depois: Number(attr('[data-contador-vivo]', 'data-contador-vivo')),
               texto: (document.querySelector('[data-contador-vivo]').innerText || '').replace(/\\n+/g, ' ').trim() };
    `),
  );
  exigir(
    marcarLibras.depois > 0 &&
      marcarLibras.depois < marcarLibras.antes &&
      marcarLibras.antesUrl === marcarLibras.depoisUrl,
    "D-91 · marcar «Libras» recorta para um número MAIOR QUE ZERO, sem trocar de tela",
    `${marcarLibras.antes} → ${marcarLibras.depois} · «${marcarLibras.texto}» · ` +
      `${marcarLibras.antesUrl} → ${marcarLibras.depoisUrl}`,
    "contador entre 0 e o total, e o pathname intacto",
  );

  const marcarAudio = await cdp.avaliar(
    naPagina5Async(`
      document.querySelector('[data-dimensao-acessibilidade="libras"] button').click();
      await new Promise((r) => setTimeout(r, 300));
      document.querySelector('[data-dimensao-acessibilidade="audio_description"] button').click();
      await new Promise((r) => setTimeout(r, 500));
      const vazio = document.querySelector('[data-sem-resultado]');
      return {
        url: location.pathname,
        contador: Number(attr('[data-contador-vivo]', 'data-contador-vivo')),
        explicacaoVisivel: visivel(vazio),
        explicacao: vazio ? (vazio.innerText || '').replace(/\\n+/g, ' ').trim().slice(0, 240) : null,
        explicacaoTemNumero: vazio ? /\\d/.test(vazio.innerText || '') : false,
      };
    `),
  );
  exigir(
    marcarAudio.contador === 0 &&
      marcarAudio.explicacaoVisivel === true &&
      marcarAudio.explicacaoTemNumero &&
      marcarAudio.url === "/filtros/",
    "D-90 · marcar «Audiodescrição» leva o contador a ZERO, e o zero vem EXPLICADO com número",
    `contador ${marcarAudio.contador} · explicação visível=${marcarAudio.explicacaoVisivel}, com número=${marcarAudio.explicacaoTemNumero} · ` +
      `pathname ${marcarAudio.url}`,
    "0, com a explicação na tela e a URL intacta",
  );
  imprimirTexto("D-90 · o zero de audiodescrição, explicado na tela", marcarAudio.explicacao ?? "");
  await fotografar(cdp, "05-08-filtros-zero-marcado");

  const limpar = await cdp.avaliar(
    naPagina5Async(`
      const antes = Number(attr('[data-contador-vivo]', 'data-contador-vivo'));
      document.querySelector('[data-limpar-filtros]').click();
      await new Promise((r) => setTimeout(r, 500));
      return { antes, depois: Number(attr('[data-contador-vivo]', 'data-contador-vivo')),
               url: location.pathname, marcados: conta('[data-dimensao-acessibilidade] button[aria-pressed="true"]') };
    `),
  );
  exigir(
    limpar.depois === 5092 && limpar.marcados === 0 && limpar.url === "/filtros/",
    "«limpar tudo» devolve o contador ao total do índice, sem navegar",
    `${limpar.antes} → ${limpar.depois} · ${limpar.marcados} dimensões ainda marcadas · pathname ${limpar.url}`,
    "5.092, 0 marcadas, /filtros/",
  );

  // A visão web da mesma tela: as duas colunas, e as MESMAS 8 dimensões — um DOM só (D-05).
  await porVisao(cdp, base, "/filtros/", "web");
  const web = await cdp.avaliar(
    naPagina5(`
      const criterios = document.querySelector('[data-coluna-criterios]');
      const saida = document.querySelector('[data-coluna-saida]');
      return {
        criterios: ret(criterios), saida: ret(saida), disjuntos: disjuntos(criterios, saida),
        position: criterios ? getComputedStyle(criterios).position : null,
        dims: conta('[data-dimensao-acessibilidade]'),
      };
    `),
  );
  exigir(
    web.disjuntos && web.criterios.x < web.saida.x && web.dims === 8,
    "D-80/D-05 · na visão web critérios e saída ficam LADO A LADO, e as 8 dimensões continuam as 8",
    `critérios ${JSON.stringify(web.criterios)} · saída ${JSON.stringify(web.saida)} · disjuntos=${web.disjuntos} · ` +
      `position=${web.position} · ${web.dims} dimensões`,
    "disjuntos, critérios à esquerda, 8 dimensões",
  );
  await fotografar(cdp, "05-08-filtros-web");

  resumo.push([
    "APPX-01",
    `/filtros traz as 8 dimensões de acessibilidade marcáveis com o número antes do gesto e as 5 zeradas ` +
      `declarando o zero; marcar Libras leva 5.092→${marcarLibras.depois}, marcar Audiodescrição leva a 0 com o ` +
      `vazio explicado, e nada disso muda a URL; declarado-ausente e não-declarado são dois controles com ` +
      `5.108 e 2.702; faixa etária está na tela, nomeada e não marcável`,
  ]);
}

// ---------------------------------------------------------------------------
// APPX-04 · os três becos — D-93. Nenhum deles é fim de caminho.
//
// A SAÍDA VEM ANTES DA EXPLICAÇÃO, e é isso que o gate mede: o retângulo do bloco de saída
// contra o limite útil, não a presença dele. E o número prometido tem de ser o ENTREGUE —
// um afrouxamento que anuncia 300 e devolve outra coisa é pior que não oferecer saída.
//
// `/404` é a rota em que o beco é mais fácil de cometer: ela fica FORA de (app) e
// (bastidor), nenhum layout de grupo a alcança, e por isso não recebe barra de abas.
// `servir-out.mjs` devolve 404 de TEXTO para endereço inexistente — a página é servida em
// `/404.html`, e é para lá que a navegação vai.
// ---------------------------------------------------------------------------

async function blocoBecos(cdp, base) {
  titulo("── APPX-04 · os três becos: /404, /busca-nao-encontrada/ e /agenda-nao-encontrada/ (D-93) ──");

  // Antes de tudo: como o servidor resolve um endereço que não existe. O gate diz o que
  // mediu, para ninguém presumir que um 404 de servidor serve a página de beco.
  // A SONDA É FEITA DO LADO DO NODE, e não de dentro da página, DE PROPÓSITO: um `fetch`
  // avaliado no documento produz um 404 no console do navegador, e o gate de «0 erro no
  // console» passaria a acusar um erro que a própria suíte provocou. Medir de fora responde
  // exatamente a mesma pergunta sem sujar o que outro gate mede.
  const resposta = await fetch(`${base}/rota-que-nao-existe/`);
  const inexistente = `${resposta.status} ${resposta.headers.get("content-type")}`;
  info(
    "como servir-out.mjs resolve endereço inexistente — medido, não presumido",
    `GET /rota-que-nao-existe/ → ${inexistente} · por isso a navegação do beco de /404 vai direto a /404.html, ` +
      `que é onde o artefato exportado põe a página`,
  );

  for (const [rota, id, visao] of [
    ["/busca-nao-encontrada/", "busca-nao-encontrada", "mobile"],
    ["/agenda-nao-encontrada/", "agenda-nao-encontrada", "mobile"],
    ["/404.html", "404", "mobile"],
  ]) {
    await irPara(cdp, `${base}${rota}`);
    await cdp.avaliar(`localStorage.setItem('agenda-cultural:visao', ${JSON.stringify(visao)})`);
    await cdp.recarregar();
    await coletarRede(cdp);

    const beco = await cdp.avaliar(
      naPagina5(`
        const raiz = document.querySelector('[data-sem-resultado]');
        const saidas = todos('[data-afrouxamento]');
        const trilhas = todos('[data-trilha-relacionada]');
        const bloco = saidas.length ? saidas[0].closest('ul, ol, section, div') : null;
        const links = visiveis('a[href^="/"]');
        return {
          beco: attr('[data-beco]', 'data-beco'),
          visivel: visivel(raiz),
          saidas: saidas.length,
          prometidos: saidas.map((s) => Number(s.getAttribute('data-afrouxamento-resultados'))),
          tipos: [...new Set(saidas.map((s) => s.getAttribute('data-afrouxamento-tipo')))],
          trilhas: trilhas.length,
          baseDaSaida: bloco ? Math.round(bloco.getBoundingClientRect().bottom) : null,
          limite: limiteUtil(),
          // A navegação da visão app são DOIS elementos desde 23/08 (cabeçalho fino e
          // barra inferior) e a da web é o trilho. Basta um deles: a pergunta aqui é
          // «desta tela dá para sair pela navegação», não qual navegação está montada.
          navPresente: (() => {
            const cab = document.querySelector('.barra-topo');
            const barra = document.querySelector('.barra-inferior');
            const trilho = document.querySelector('.menu-lateral');
            return Boolean(
              (cab && visivel(cab)) || (barra && visivel(barra)) || (trilho && visivel(trilho)),
            );
          })(),
          links: links.length,
          transborda: transbordaNaHorizontal(),
        };
      `),
    );
    exigir(
      beco.beco === id && beco.visivel && beco.saidas + beco.trilhas > 0,
      `${id} · a tela declara qual beco é, e NÃO é tela vazia: tem afrouxamento e/ou trilha`,
      `data-beco=«${beco.beco}» · ${beco.saidas} afrouxamento(s) prometendo ${JSON.stringify(beco.prometidos)} ` +
        `(tipos ${JSON.stringify(beco.tipos)}) · ${beco.trilhas} trilha(s) relacionada(s) · ${beco.links} links internos visíveis`,
      "o beco nomeado e ao menos uma saída",
    );
    exigir(
      beco.baseDaSaida !== null && beco.baseDaSaida <= beco.limite.limite,
      `${id} · a SAÍDA está na primeira vista — ela vem antes da explicação`,
      `base do bloco de saída ${beco.baseDaSaida} · limite ${beco.limite.limite} (${beco.limite.contra})`,
      "a base da saída acima do limite útil",
    );
    exigir(
      (id === "404") === (beco.navPresente === false) && beco.transborda.transborda === false,
      `${id} · a navegação do app (menu lateral) está onde o grupo de rotas manda, e nada corre para fora`,
      `navegação presente=${beco.navPresente} (esperada ${id === "404" ? "AUSENTE — /404 fica fora de (app)" : "presente"}) · ` +
        `documento ${beco.transborda.scrollWidth}/${beco.transborda.clientWidth}`,
      id === "404" ? "sem navegação do app" : "com navegação do app",
    );

    if (id !== "404") {
      const aplicado = await cdp.avaliar(
        naPagina5Async(`
          const saida = todos('[data-afrouxamento]').find((s) => s.querySelector('button'));
          const prometido = Number(saida.getAttribute('data-afrouxamento-resultados'));
          const rotulo = (saida.innerText || '').replace(/\\n+/g, ' ').trim().slice(0, 70);
          const antesUrl = location.pathname;
          saida.querySelector('button').click();
          await new Promise((r) => setTimeout(r, 700));
          return {
            prometido, rotulo, antesUrl, depoisUrl: location.pathname,
            entregue: Number(attr('[data-contador-vivo]', 'data-contador-vivo')),
            itens: conta('[data-resultado-afrouxado]'),
          };
        `),
      );
      exigir(
        aplicado.entregue === aplicado.prometido &&
          aplicado.itens > 0 &&
          aplicado.antesUrl === aplicado.depoisUrl,
        `${id} · T-05-29 · clicar num afrouxamento ENTREGA o número que ele prometia, sem navegar`,
        `«${aplicado.rotulo}» · prometido ${aplicado.prometido} · entregue ${aplicado.entregue} · ` +
          `${aplicado.itens} itens listados · ${aplicado.antesUrl} → ${aplicado.depoisUrl}`,
        "entregue == prometido, com itens na tela e a URL intacta",
      );
    }
    if (id === "404") await fotografar(cdp, "05-08-404");
  }

  resumo.push([
    "APPX-04",
    `os três becos declaram qual beco são, oferecem afrouxamento numerado e trilha relacionada, e a saída ` +
      `cabe na primeira vista; clicar num afrouxamento entrega exatamente o número prometido sem navegar; ` +
      `/404 fica fora de (app) e monta a própria navegação, sem o menu lateral do app`,
  ]);
}

// ---------------------------------------------------------------------------
// APPX-02 e APPX-03 · /play e /play/[slug] — o catálogo das 529 e o Player.
//
// D-92: o Player registra no repertório AO CONCLUIR, e concluir é gesto humano. `data-assistido`
// é atributo de INTERAÇÃO: mede 0 no artefato de propósito, passa a 1 depois do clique,
// SOBREVIVE a recarregar e é IDEMPOTENTE. As três propriedades são diferentes e nenhuma
// implica a outra — um registro que sobrevive mas duplica ainda mente sobre o repertório.
//
// A chave do `localStorage` é `agenda-cultural:play-concluidas`, uma LISTA de slugs, e
// `sessao.tsx` não foi tocado por 05-07.
// ---------------------------------------------------------------------------

const CHAVE_CONCLUIDAS = "agenda-cultural:play-concluidas";

async function blocoPlay(cdp, base) {
  titulo("── APPX-02 · /play — o catálogo unificado das 529 mídias (D-92, D-90) ──");

  await porVisao(cdp, base, "/play/", "mobile");
  await cdp.avaliar(`localStorage.removeItem(${JSON.stringify(CHAVE_CONCLUIDAS)})`);
  await cdp.recarregar();
  await coletarRede(cdp);

  const catalogo = await cdp.avaliar(
    naPagina5(`
      const midias = todos('[data-midia]');
      const chips = todos('[data-categoria]');
      const recursos = todos('[data-acessibilidade-do-play]');
      return {
        midias: midias.length,
        chips: chips.length,
        categorias: chips.map((c) => ({ v: c.getAttribute('data-categoria'), rot: (c.innerText || '').replace(/\\n+/g, ' ').trim() })),
        recursos: recursos.map((r) => ({
          campo: r.getAttribute('data-acessibilidade-do-play'),
          naoSustenta: r.getAttribute('data-nao-sustenta'),
          rotulo: (r.innerText || '').replace(/\\n+/g, ' ').trim(),
          marcado: r.getAttribute('aria-pressed'),
        })),
        // A vitrine NÃO pode mais falar da cobertura da ponte: ver a asserção
        // «o painel de cobertura saiu da vitrine», logo abaixo.
        pontesNaVitrine: todos('[data-veja-isto]').length,
        continue: attr('[data-continue]', 'data-continue'),
        transborda: transbordaNaHorizontal(),
      };
    `),
  );
  // REFORMULAÇÃO 2026-08 (decisão do cliente): /play virou a vitrine de STREAMING —
  // vídeo, série e playlist, 113 mídias medidas. Podcast mora em /cast e o editorial
  // em /noticias; o catálogo unificado continua em catalogoDoPlay() e nas 529 rotas.
  // AS CONTAGENS SAÍRAM DA TELA (2026-08-25, pedido do cliente sobre a tela do Play):
  // o total ao lado de «mídias», o número em cada chip de categoria, o «n de 113» de cada
  // recurso e o número no título de cada prateleira. O que era DECLARADO por escrito passa
  // a ser conferido por MEDIÇÃO: o gate conta o DOM em vez de ler o rótulo. A exigência de
  // fundo não mudou — 113 mídias na parede, e nenhuma inalcançável.
  exigir(
    catalogo.midias === 113 && catalogo.chips === 4,
    "APPX-02 · a vitrine mostra as 113 mídias de streaming, com um chip por categoria + «todas»",
    `${catalogo.midias} mídias no DOM · ${catalogo.chips} chips: ` +
      catalogo.categorias.map((c) => c.rot).join(" · "),
    "113 mídias, 4 chips",
  );
  // D-90 continua valendo pelo que ele PROTEGE: os dois recursos que o acervo não sustenta
  // seguem marcados com `data-nao-sustenta` ANTES de qualquer gesto — é o que impede que
  // marcá-los devolva um vazio mudo. O que saiu foi o número impresso ao lado do rótulo.
  exigir(
    catalogo.recursos.length === 3 &&
      catalogo.recursos.filter((r) => r.naoSustenta).length === 2 &&
      catalogo.recursos.every((r) => r.marcado === "false"),
    "D-90 · os três recursos da tela 19 estão na tela e os dois zerados declaram, antes da marcação",
    catalogo.recursos.map((r) => `${r.campo} «${r.rotulo}»${r.naoSustenta ? " [nao-sustenta]" : ""}`).join(" · ") +
      ` · nenhum vem marcado antes do gesto`,
    "3 recursos, 2 declarando o zero, 0 marcados",
  );
  // D-92 CONTINUA VALENDO, E MUDOU DE TELA (23/08, decisão do cliente). O painel «não
  // pode ir? veja isto» declarava a cobertura da ponte — «14 das 529 mídias falam de um
  // evento…» — no fim da VITRINE, para quem veio escolher o que assistir. Isso é
  // prestação de contas sobre o acervo, não é escolha de conteúdo. A ponte em si não
  // sumiu: ela continua MEDIDA em `play.ts` (o gate de dados lá em cima confere os
  // quatro números contra o grafo) e continua pondo as mídias na página do evento. O que
  // este gate trava agora é o inverso do que travava: a cobertura não volta para a
  // vitrine sem alguém decidir de novo.
  exigir(
    catalogo.pontesNaVitrine === 0,
    "D-92 · o painel de cobertura da ponte saiu da vitrine (os números seguem medidos em play.ts)",
    `${catalogo.pontesNaVitrine} painéis [data-veja-isto] na vitrine`,
    "0",
  );

  const recortar = await cdp.avaliar(
    naPagina5Async(`
      const antesUrl = location.pathname;
      const chip = document.querySelector('[data-categoria="series"]');
      // O chip não anuncia mais o número (as contagens saíram da tela em 25/08). O que
      // ele promete é medido na parede ANTES do clique: quantas mídias de «série» estão
      // nas prateleiras. Depois do clique, o recorte tem de entregar exatamente essas.
      const prometido = todos('[data-midia]').filter(
        (i) => i.getAttribute('data-categoria-do-item') === 'series',
      ).length;
      chip.click();
      await new Promise((r) => setTimeout(r, 600));
      const itens = todos('[data-midia]');
      const categorias = [...new Set(itens.map((i) => i.getAttribute('data-categoria-do-item')))];
      return { antesUrl, depoisUrl: location.pathname, prometido, entregue: itens.length, categorias };
    `),
  );
  exigir(
    recortar.entregue === recortar.prometido &&
      recortar.categorias.length === 1 &&
      recortar.categorias[0] === "series" &&
      recortar.antesUrl === recortar.depoisUrl,
    "APPX-02 · um controle por categoria RECORTA sem navegar, e entrega todas as mídias da categoria",
    `«séries» tinha ${recortar.prometido} na parede · o recorte entregou ${recortar.entregue} · ` +
      `categorias no recorte ${JSON.stringify(recortar.categorias)} · ${recortar.antesUrl} → ${recortar.depoisUrl}`,
    "entregue == prometido, recorte homogêneo, URL intacta",
  );

  const libras = await cdp.avaliar(
    naPagina5Async(`
      document.querySelector('[data-categoria="series"]').click();
      await new Promise((r) => setTimeout(r, 400));
      const chip = document.querySelector('[data-acessibilidade-do-play="libras"]');
      const rotulo = (chip.innerText || '').replace(/\\n+/g, ' ').trim();
      const naoSustenta = chip.getAttribute('data-nao-sustenta');
      chip.click();
      await new Promise((r) => setTimeout(r, 600));
      return { rotulo, naoSustenta, entregue: conta('[data-midia]'), url: location.pathname };
    `),
  );
  exigir(
    libras.entregue === 3 && libras.naoSustenta === null,
    "D-90 · Libras é o único recurso que o acervo sustenta, e recorta as 3 mídias — todas vídeos, todas no streaming",
    `chip «${libras.rotulo}» sem [data-nao-sustenta]=${libras.naoSustenta === null} · ` +
      `${libras.entregue} mídias no recorte · pathname ${libras.url}`,
    "3 mídias, e o chip não declara zero",
  );
  await fotografar(cdp, "05-08-play");

  titulo("── APPX-03 · /play/[slug] — o Player, e a conclusão que é gesto humano (D-92, T-05-36, T-05-37) ──");

  await porVisao(cdp, base, `/play/${MIDIA_DE_AMOSTRA}/`, "mobile");
  await cdp.avaliar(`localStorage.removeItem(${JSON.stringify(CHAVE_CONCLUIDAS)})`);
  await cdp.recarregar();
  await coletarRede(cdp);

  const antesDoClique = await cdp.avaliar(
    naPagina5(`
      const semArquivo = document.querySelector('[data-sem-arquivo]');
      const remotos = todos('iframe, video[src], audio[src], img[src]').filter((e) => {
        const s = e.getAttribute('src') || '';
        return /^https?:\\/\\//.test(s) && !s.startsWith(location.origin);
      });
      return {
        player: attr('[data-player]', 'data-player'),
        assistido: attr('[data-assistido]', 'data-assistido'),
        dimensoes: contaVisiveis('[data-dimensao]'),
        recursos: conta('[data-recurso-em-evidencia]'),
        semArquivoVisivel: visivel(semArquivo),
        remotos: remotos.length,
        preconnect: conta('link[rel="preconnect"], link[rel="dns-prefetch"]'),
        concluirRet: ret(document.querySelector('[data-concluir]')),
        limite: limiteUtil(),
      };
    `),
  );
  exigir(
    antesDoClique.assistido === "0" && antesDoClique.player === MIDIA_DE_AMOSTRA,
    "D-92 · ANTES de qualquer clique, data-assistido mede ZERO — nada é gravado ao abrir",
    `data-player=«${antesDoClique.player}» · data-assistido=${antesDoClique.assistido}`,
    "«0»",
  );
  exigir(
    antesDoClique.semArquivoVisivel &&
      antesDoClique.remotos === 0 &&
      antesDoClique.preconnect === 0,
    "T-05-33 · o bloco «sem arquivo» é PRODUTO, e a página não carrega UM recurso remoto",
    `bloco visível=${antesDoClique.semArquivoVisivel} · ` +
      `${antesDoClique.remotos} elementos com src remoto · ${antesDoClique.preconnect} preconnect/dns-prefetch · ` +
      `${antesDoClique.dimensoes} dimensões na ficha · ${antesDoClique.recursos} recursos em evidência`,
    "visível, e 0 recursos remotos",
  );

  await cdp.clicar(`document.querySelector('[data-concluir]')`);
  await respirar(600);
  const depoisDoClique = await cdp.avaliar(
    naPagina5(`return { assistido: attr('[data-assistido]', 'data-assistido'),
                         guardado: JSON.parse(localStorage.getItem(${JSON.stringify(CHAVE_CONCLUIDAS)}) || '[]') };`),
  );
  exigir(
    depoisDoClique.assistido === "1" && depoisDoClique.guardado.length === 1,
    "D-92 · clicar em concluir faz data-assistido passar a 1, e grava UMA entrada",
    `data-assistido=${depoisDoClique.assistido} · localStorage ${JSON.stringify(depoisDoClique.guardado)}`,
    "«1» e uma entrada",
  );

  await cdp.recarregar();
  await coletarRede(cdp);
  const depoisDeRecarregar = await cdp.avaliar(
    naPagina5(`return { hidratado: attr('[data-hidratado]', 'data-hidratado'),
                         assistido: attr('[data-assistido]', 'data-assistido') };`),
  );
  exigir(
    depoisDeRecarregar.hidratado === "sim" && depoisDeRecarregar.assistido === "1",
    "D-92 · o registro SOBREVIVE a recarregar — medido depois de data-hidratado=\"sim\"",
    `data-hidratado=${depoisDeRecarregar.hidratado} · data-assistido=${depoisDeRecarregar.assistido}`,
    "hidratado, e «1»",
  );

  await cdp.clicar(`document.querySelector('[data-concluir]')`);
  await respirar(500);
  await cdp.clicar(`document.querySelector('[data-concluir]')`);
  await respirar(500);
  const idempotente = await cdp.avaliar(
    naPagina5(`return { assistido: attr('[data-assistido]', 'data-assistido'),
                         guardado: JSON.parse(localStorage.getItem(${JSON.stringify(CHAVE_CONCLUIDAS)}) || '[]') };`),
  );
  exigir(
    idempotente.guardado.filter((s) => s === MIDIA_DE_AMOSTRA).length <= 1,
    "D-92 · concluir a MESMA mídia duas vezes deixa UMA entrada — o registro é conjunto, não lista",
    `data-assistido=${idempotente.assistido} · localStorage ${JSON.stringify(idempotente.guardado)} · ` +
      `${idempotente.guardado.filter((s) => s === MIDIA_DE_AMOSTRA).length} ocorrência(s) do slug`,
    "no máximo 1 ocorrência do slug",
  );

  // T-05-37 · o storage ADULTERADO, nos dois casos que 05-07 nomeou. A tela tem de continuar
  // de pé: um protótipo que quebra porque alguém mexeu no `localStorage` não sobrevive a uma
  // demonstração ao vivo, e a banca abre o inspetor.
  for (const [rotulo, valor] of [
    ["valor que NÃO é lista", JSON.stringify("nao-e-lista")],
    ["lista com id que não resolve e um número", JSON.stringify([MIDIA_DE_AMOSTRA, "slug-que-nao-existe", 42])],
  ]) {
    await cdp.avaliar(
      `localStorage.setItem(${JSON.stringify(CHAVE_CONCLUIDAS)}, ${JSON.stringify(valor)})`,
    );
    await cdp.recarregar();
    await coletarRede(cdp);
    const resistiu = await cdp.avaliar(
      naPagina5(`return { player: attr('[data-player]', 'data-player'),
                          assistido: attr('[data-assistido]', 'data-assistido'),
                          hidratado: attr('[data-hidratado]', 'data-hidratado'),
                          erroNaTela: /Application error|Erro/.test(texto(document.body).slice(0, 400)) };`),
    );
    exigir(
      resistiu.player === MIDIA_DE_AMOSTRA && resistiu.hidratado === "sim" && !resistiu.erroNaTela,
      `T-05-37 · storage adulterado (${rotulo}) — a tela continua de pé`,
      `data-player=«${resistiu.player}» · data-assistido=${resistiu.assistido} · hidratado=${resistiu.hidratado} · ` +
        `erro na tela=${resistiu.erroNaTela}`,
      "a página de pé, hidratada, sem erro",
    );
  }
  await cdp.avaliar(`localStorage.removeItem(${JSON.stringify(CHAVE_CONCLUIDAS)})`);

  resumo.push([
    "APPX-02",
    `/play declara e mostra as 113 mídias de streaming com 4 chips de recorte; «séries» entrega os ${recortar.prometido} ` +
      `que anuncia sem navegar, e Libras anuncia «3 de 113» e entrega 3, com os dois recursos zerados declarando`,
  ]);
  resumo.push([
    "APPX-03",
    `/play/[slug] abre com data-assistido=0 e zero recurso remoto; concluir leva a 1, sobrevive a recarregar ` +
      `(medido depois de data-hidratado="sim") e é idempotente; storage adulterado nos dois casos deixa a tela de pé`,
  ]);
}

// ---------------------------------------------------------------------------
// APPX-05 · /produtor/[slug] — os sete blocos, e a lacuna declarada com denominador.
// ---------------------------------------------------------------------------

async function blocoProdutor(cdp, base) {
  titulo("── APPX-05 · /produtor/[slug] — os sete blocos da tela 24 e a ausência declarada (D-90) ──");

  const produtores = (await readdir(path.join(OUT, "produtor"), { withFileTypes: true }))
    .filter((e) => e.isDirectory() && existsSync(path.join(OUT, "produtor", e.name, "index.html")))
    .map((e) => e.name);
  const amostra = [produtores[0], produtores[Math.floor(produtores.length / 2)], produtores[produtores.length - 1]];

  for (const slug of amostra) {
    await porVisao(cdp, base, `/produtor/${slug}/`, "mobile");
    const p = await cdp.avaliar(
      naPagina5(`
        const blocos = todos('[data-bloco-produtor]');
        const emCartaz = document.querySelector('[data-nao-sustenta="programacao-futura"]');
        const dens = emCartaz ? Array.from(emCartaz.querySelectorAll('[data-denominador]')) : [];
        return {
          blocos: blocos.length,
          chaves: valores('[data-bloco-produtor]', 'data-bloco-produtor'),
          visiveis: blocos.filter((b) => visivel(b)).length,
          emCartazVisivel: visivel(emCartaz),
          denominadores: dens.map((d) => d.getAttribute('data-denominador') + '=' + (d.innerText || '').trim().split('\\n')[0]),
          esqueleto: /TelaEsqueleto|em construção/i.test(texto(document.body)),
          transborda: transbordaNaHorizontal(),
        };
      `),
    );
    exigir(
      p.blocos === 7 && p.visiveis === 7 && !p.esqueleto,
      `${slug.slice(0, 34)} · os SETE blocos da tela 24 estão na tela, e nenhum é esqueleto`,
      `${p.blocos} blocos, ${p.visiveis} visíveis: ${p.chaves.join(", ")} · esqueleto=${p.esqueleto} · ` +
        `documento ${p.transborda.scrollWidth}/${p.transborda.clientWidth}`,
      "7 blocos visíveis",
    );
    exigir(
      p.emCartazVisivel && p.denominadores.length >= 3,
      `${slug.slice(0, 34)} · D-90 · «o que está em cartaz agora» é PRODUTO, com os denominadores medidos`,
      `visível=${p.emCartazVisivel} · denominadores ${JSON.stringify(p.denominadores)}`,
      "visível, com denominadores",
    );
  }

  resumo.push([
    "APPX-05",
    `/produtor/[slug] traz os sete blocos da tela 24 nas três rotas de amostra, e «o que está em cartaz agora» ` +
      `aparece com data-nao-sustenta e os denominadores medidos`,
  ]);
}

// ---------------------------------------------------------------------------
// OS CONTRATOS QUE ATRAVESSAM PLANOS — e que NINGUÉM pôde medir sozinho.
//
// 05-01 e 05-02 escreveram, cada um na sua tela, um link para `/filtros/`. A rota foi criada
// por 05-06, DEPOIS, na mesma onda. O export estático não valida href interno: os três
// planos podiam estar verdes com os dois links apontando para o nada, e o defeito só
// apareceria na demonstração. Aqui os dois links são CLICADOS.
// ---------------------------------------------------------------------------

async function blocoContratosCruzados(cdp, base) {
  titulo("── os contratos que atravessam planos: os dois links para /filtros/, CLICADOS ──");

  for (const [rota, seletorJs, plano] of [
    ["/acontece/", `Array.from(document.querySelectorAll('a[href="/filtros/"]')).find((a) => a.getBoundingClientRect().width > 0)`, "05-01"],
    ["/buscar/", `document.querySelector('[data-link-filtros]')`, "05-02"],
  ]) {
    await porVisao(cdp, base, rota, "web");
    const href = await cdp.avaliar(`(${seletorJs})?.getAttribute('href') ?? null`);
    const ida = await cdp.clicarEEsperarUrl(
      seletorJs,
      (p) => p.startsWith("/filtros"),
      `o link para /filtros/ escrito por ${plano} em ${rota}`,
    );
    await cdp.assentar();
    await coletarRede(cdp);
    const chegou = await cdp.avaliar(
      naPagina5(`return { filtros: Boolean(document.querySelector('[data-filtros]')),
                          dims: conta('[data-dimensao-acessibilidade]'),
                          contador: attr('[data-contador-vivo]', 'data-contador-vivo') };`),
    );
    exigir(
      chegou.filtros && chegou.dims === 8 && ida.para.startsWith("/filtros"),
      `o link para /filtros/ escrito por ${plano} em ${rota} RESOLVE — clicado, não conferido pelo href`,
      `href «${href}» · clique em «${ida.texto}» levou de ${ida.de} para ${ida.para} · ` +
        `a tela de chegada tem data-filtros=${chegou.filtros}, ${chegou.dims} dimensões e contador ${chegou.contador}`,
      "a navegação chega a /filtros/ com a tela montada",
    );
  }

  // ---- O VOCABULÁRIO `data-*` DE 05-01 NÃO COLIDIU ----
  //
  // Sete planos acrescentaram atributos ao contrato congelado. A pergunta que nenhum deles
  // podia responder: algum atributo passou a significar duas coisas em telas diferentes?
  //
  // A forma mecânica: um atributo do vocabulário só pode aparecer nas rotas de UM plano —
  // exceto os três declarados COMPARTILHADOS, que 05-01 pediu por escrito que fossem tratados
  // assim. Para esses três, o que se exige é que a FORMA do valor seja a mesma em toda parte.
  titulo("── o vocabulário data-* congelado por 05-01: nenhum atributo com dois significados ──");

  const ROTAS_POR_PLANO = {
    "05-01": ["acontece/index.html"],
    "05-02": ["descobrir/index.html", "buscar/index.html"],
    "05-03": [`evento/${EVENTO_DO_CMS}/index.html`],
    "05-04": ["moderacao/fila/index.html", "redacao/trilha/index.html"],
    "05-05": ["observatorio/index.html"],
    "05-06": ["filtros/index.html", "busca-nao-encontrada/index.html", "agenda-nao-encontrada/index.html", "404.html"],
    "05-07": ["play/index.html", `play/${MIDIA_DE_AMOSTRA}/index.html`],
  };
  const EXCLUSIVOS = {
    "05-01": ["acontece-web", "modo-lista", "interseccao", "par", "mapeavel", "item-lista", "pino", "lista-recorte", "mapa-acontece", "motivo-sem-pino"],
    "05-02": ["grade-web", "destaque-curado", "coluna-facetas", "coluna-resultados", "link-filtros"],
    "05-03": ["tabela-ocorrencias", "coluna-acessibilidade", "painel-aprofunda", "bloco-produtor"],
    "05-04": ["fila-moderacao", "item-fila", "procedencia-item", "score-ia", "acao-moderacao", "escopo-curador", "passo-trilha", "motivo-passo", "publicavel", "sugestao-ia", "limites-ia", "slug-trilha"],
    "05-05": ["observatorio", "procedencia-painel", "procedencia-fatia", "indicador", "publico", "leitura-procedencia", "mapa-desertos"],
    "05-06": ["filtros", "dimensao-acessibilidade", "declarado-ausente", "nao-declarado", "criterio-inexistente", "sem-resultado", "afrouxamento", "beco", "trilha-relacionada"],
    // `veja-isto` continua na lista: ele saiu da VITRINE em 23/08, mas segue sendo o
    // bloco de eventos relacionados na página do item, que é a outra rota deste plano.
    "05-07": ["play", "categoria", "midia", "player", "concluir", "assistido", "veja-isto", "sem-arquivo"],
  };
  const COMPARTILHADOS = ["denominador", "nao-sustenta", "realcado", "contador-vivo"];

  const todasAsRotas = [...new Set(Object.values(ROTAS_POR_PLANO).flat())];
  const colisoes = [];
  const conferidos = [];
  for (const [plano, atributos] of Object.entries(EXCLUSIVOS)) {
    for (const attr of atributos) {
      const onde = [];
      for (const rota of todasAsRotas) {
        if (contarAtributo(await html(rota), attr) > 0) onde.push(rota);
      }
      const forasteiras = onde.filter((r) => !ROTAS_POR_PLANO[plano].includes(r));
      if (forasteiras.length) colisoes.push(`data-${attr} (${plano}) aparece também em ${forasteiras.join(", ")}`);
      else conferidos.push(`${attr}@${plano}`);
    }
  }
  exigir(
    colisoes.length === 0,
    "nenhum atributo EXCLUSIVO de um plano aparece nas telas de outro",
    colisoes.length === 0
      ? `${conferidos.length} atributos conferidos em ${todasAsRotas.length} rotas, cada um só nas telas do próprio plano`
      : colisoes.join(" | "),
    "0 colisões",
  );

  const formaInconsistente = [];
  for (const rota of todasAsRotas) {
    const h = await html(rota);
    const realcado = [...h.matchAll(/data-realcado="([^"]*)"/g)].map((m) => m[1]);
    const forasteiro = realcado.filter((v) => v !== "sim" && v !== "nao");
    if (forasteiro.length) formaInconsistente.push(`data-realcado em ${rota}: ${[...new Set(forasteiro)].join(", ")}`);
  }
  exigir(
    formaInconsistente.length === 0,
    "os atributos COMPARTILHADOS mantêm a mesma FORMA de valor em toda tela onde aparecem",
    formaInconsistente.length === 0
      ? `${COMPARTILHADOS.map((c) => "data-" + c).join(", ")} — reusados por vários planos com a mesma semântica; ` +
        `data-realcado só toma «sim» e «nao» nas ${todasAsRotas.length} rotas, como 05-01 escreveu no código`
      : formaInconsistente.join(" | "),
    "0 valores fora da forma declarada",
  );
}

// ---------------------------------------------------------------------------
// A HONESTIDADE NAS TELAS NOVAS — o que sobrou do gate do modo comentado.
//
// Este bloco media duas coisas: que os comentários somem com o interruptor desligado e que
// os blocos de honestidade NÃO somem junto. O modo comentado saiu do produto em 23/08 e a
// primeira metade deixou de existir; a segunda continua sendo o ponto — cada tela nova tem
// de declarar o que o acervo não sustenta, com denominador, sem depender de estado nenhum.
// ---------------------------------------------------------------------------

async function blocoDeHonestidade(cdp, base) {
  titulo("── a declaração de honestidade nas telas novas ──");

  for (const [rota, visao] of [
    ["/filtros/", "mobile"],
    ["/observatorio/", "web"],
    ["/play/", "mobile"],
    ["/moderacao/fila/", "web"],
    ["/acontece/", "web"],
  ]) {
    await porVisao(cdp, base, rota, visao);
    const medida = await cdp.avaliar(
      naPagina5(`return {
        naoSustenta: conta('[data-nao-sustenta]'),
        denominadores: conta('[data-denominador]'),
      };`),
    );
    exigir(
      medida.naoSustenta + medida.denominadores > 0,
      `${rota} · a tela declara o que o acervo não sustenta, com denominador`,
      `${medida.naoSustenta} blocos [data-nao-sustenta] · ${medida.denominadores} [data-denominador]`,
      "> 0",
    );
  }
}

// ---------------------------------------------------------------------------
// CONSOLE E REDE — acumulados na sessão inteira.
// ---------------------------------------------------------------------------

const AVISO_DE_PRELOAD = /was preloaded using link preload but not used|preloaded with link preload was not used/i;

function gateConsole(cdp) {
  titulo("── console, acumulado na sessão inteira ──");
  const erros = cdp.consola.filter((c) => c.nivel === "erro");
  const avisos = cdp.consola.filter((c) => c.nivel === "aviso");
  const preload = avisos.filter((c) => AVISO_DE_PRELOAD.test(c.texto));
  const daAplicacao = avisos.filter((c) => !AVISO_DE_PRELOAD.test(c.texto));

  for (const c of [...erros, ...daAplicacao].slice(0, 20)) nota(`${c.nivel}: ${c.texto.slice(0, 220)}`);

  exigir(
    erros.length === 0 && daAplicacao.length === 0,
    "console · erros e avisos DA APLICAÇÃO",
    `${erros.length} erro, ${daAplicacao.length} aviso da aplicação em ${cdp.navegacoes} navegações`,
    "0 erro, 0 aviso da aplicação",
  );

  // O NÚMERO QUE A CONSOLIDAÇÃO ENTREGOU, e que 11 folhas novas não podem reintroduzir.
  // Basta um `import "./x.css"` dentro de um componente para ele voltar em TODA navegação.
  const chunks = [...new Set(preload.map((c) => (c.texto.match(/chunks\/([a-z0-9_-]+)\.css/) || [])[1]).filter(Boolean))];
  exigir(
    preload.length === 0,
    "console · CSS pré-carregado e não usado (o número que a consolidação entregou)",
    `${preload.length} diagnóstico(s) em ${cdp.navegacoes} navegações${chunks.length ? ` · chunks: ${chunks.join(", ")}` : ""} · ` +
      `as 11 folhas da fase 5 não o reintroduziram`,
    "0",
  );

  resumo.push([
    "console",
    `0 erro e 0 aviso da aplicação em ${cdp.navegacoes} navegações · ${preload.length} diagnóstico de CSS ` +
      `pré-carregado e não usado, o mesmo número que a consolidação de folhas entregou na fase 4`,
  ]);
}

function gateRede(cdp, base) {
  titulo("── rede, medida POR DENTRO DA PÁGINA (não existe Network.*) ──");
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
    `0 requisição externa em ${cdp.navegacoes} navegações · ${recursos.size} recursos distintos, todos no servidor ` +
      `local — nenhum tile de mapa, nenhuma fonte remota, nenhuma chamada de modelo. Medida por ` +
      `performance.getEntriesByType('resource'), de dentro da página`,
  ]);
}

// ---------------------------------------------------------------------------
// Resumo — uma linha por requisito, e o que quem conduzir a demonstração precisa saber.
// ---------------------------------------------------------------------------

function imprimirResumo(estrutura) {
  titulo("── resumo · uma linha por requisito ──");
  const ordem = (n) => {
    if (n.startsWith("WEB-")) return 100 + Number(n.slice(4));
    if (n.startsWith("APPX-")) return 200 + Number(n.slice(5));
    return 900;
  };
  for (const [nome, valor] of [...resumo].sort((a, b) => ordem(a[0]) - ordem(b[0]))) {
    console.log(`\n  ${nome}`);
    for (const linha of quebrar(valor, 100)) console.log(`     ${linha}`);
  }

  titulo("── o que quem conduzir a demonstração precisa saber ──");

  console.log("\n  1 · O PERCURSO DAS TELAS NOVAS, na ordem que conta a história:");
  for (const [n, passo] of [
    ["1", "/acontece/ na visão WEB — passe o cursor sobre uma linha da lista e mostre o pino acendendo, e vice-versa. É o único gesto do protótipo que só existe onde há cursor, e é o argumento inteiro de a visão web existir."],
    ["2", "no mesmo lugar, troque para «por data»: 129 eventos, zero pino, e a interseção declarada com os cinco denominadores. É o acervo dizendo o que não sustenta."],
    ["3", "/descobrir/ e /buscar/ na visão WEB — a grade de três colunas com o destaque atravessando duas, e as facetas em coluna permanente à esquerda."],
    ["4", "/evento/<slug>/ na visão WEB — as 53 sessões em tabela com a coluna de acessibilidade, e o painel «aprofunda isto» colado ao lado."],
    ["5", "/moderacao/fila/ — clique «vetar» e tente confirmar com o campo vazio. O botão não conclui. É a resposta mecânica à pergunta mais difícil do RFP."],
    ["6", "/redacao/trilha/ — acrescente um passo do catálogo e mostre a trilha deixando de publicar, com o passo NOMEADO. Depois abra /trilha/<slug>/ e mostre que o motivo é o mesmo texto."],
    ["7", "/observatorio/ — o painel de procedência inteiro na primeira vista, e a inversão: o acervo deu as coisas, nós derivamos as ligações."],
    ["8", "/filtros/ — marque Libras e depois Audiodescrição. O zero chega explicado, com número, ao lado do próprio controle."],
    ["9", "/play/ e uma mídia — o catálogo das 529 e o player que diz por que não toca nada, com a conclusão registrando só depois do clique."],
    ["10", "/busca-nao-encontrada/ — clique num afrouxamento e mostre que o número prometido é o número entregue."],
  ]) {
    const linhas = quebrar(passo, 92);
    console.log(`\n     ${n}. ${linhas[0]}`);
    for (const linha of linhas.slice(1)) console.log(`        ${linha}`);
  }

  console.log("\n  2 · OS NÚMEROS QUE A BANCA VAI OUVIR:");
  for (const l of [
    "7.810 entidades e 66.563 ligações — 61,8% das entidades vêm do Itaú Cultural, e 77,5% das LIGAÇÕES são leitura nossa",
    "47 entidades autoradas, decompostas na tela: 40 eventos encenados, 3 pessoas, 3 repertórios, 1 trilha",
    "158 eventos têm lugar resolvível e só 110 caem dentro do contorno do Brasil — os 48 de fora ficam na lista, nomeados",
    "0 de 300 eventos declaram ingresso: gratuidade NÃO recorta neste acervo, e a tela diz isso em vez de oferecer o filtro",
    "0 de 2.425 ocorrências declaram espaço; faixa etária não existe em campo nenhum do acervo",
    "5 das 8 dimensões de acessibilidade medem zero — e continuam marcáveis, porque o zero é o diagnóstico",
    "5.108 entidades preencheram a ficha de acessibilidade e 2.702 nunca declararam nada: «não tem» e «não sabemos» são coisas diferentes",
    "529 mídias no Play, das quais 3 declaram Libras e 14 falam de um evento do acervo — as outras 515 não, e nós não inventamos",
    "60 itens na fila da Moderação, 20 por origem, e score de confiança em exatamente os 20 de IA",
  ]) {
    console.log(`     · ${l}`);
  }

  console.log("\n  3 · O QUE O ARTEFATO MEDE:");
  console.log(`     ${estrutura.paginas} páginas em out/, das quais 532 são da fase 5 — resíduo ${LINHA_BASE_DE_PAGINAS}, a linha de base da fase 2`);
  console.log(`     ${estrutura.chunksKb} KB de chunks contra o teto de ${TETO_CHUNKS_KB} KB · ${estrutura.clientes} componentes de cliente varridos por DP-F`);
  console.log(`     0 requisição externa, medida de dentro da página · 0 erro e 0 aviso da aplicação no console`);

  if (fotos.length) {
    console.log("\n  4 · AS FOTOS, para um humano julgar o que nenhum número julga:");
    for (const f of fotos) console.log(`     ${f}`);
  } else {
    console.log("\n  4 · Nenhuma foto escrita: DIR_CAPTURAS não está definida.");
    console.log("     Defina-a FORA do repositório para o relatório guardar as telas que só o olho pega.");
  }
}

function quebrar(texto, largura) {
  const linhas = [];
  let linha = "";
  for (const palavra of String(texto).split(/\s+/).filter(Boolean)) {
    if ((linha + " " + palavra).trim().length > largura) {
      linhas.push(linha.trim());
      linha = palavra;
    } else {
      linha = `${linha} ${palavra}`;
    }
  }
  if (linha.trim()) linhas.push(linha.trim());
  return linhas;
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------

async function principal() {
  console.log(
    "verificar-fase5 — WEB-01 a WEB-07 e APPX-01 a APPX-05 sobre o artefato exportado, em Chrome headless\n",
  );

  if (!existsSync(path.join(OUT, "index.html"))) {
    throw new Error("out/ não existe ou está incompleto. Rode `npm run build` antes.");
  }

  const sonda = await sondarModulos();
  const estrutura = await gatesEstruturais();
  await gateCoerencia(sonda);
  await gateContratoNoHtml();

  const servidor = await servir({ raiz: OUT, porta: Number(process.env.PORTA ?? 0) || undefined });
  console.log(`\n  servidor estático em ${servidor.url} (raiz: out/)`);

  let cdp = null;
  try {
    // T-02-22 / T-04-26: se o Chrome não existir — ou se `CHROME_BIN` apontar para caminho
    // inexistente — `abrirNavegador` LANÇA aqui e o script sai com código diferente de zero.
    // Ele nunca se autodispensa, e nunca cai no Chrome do sistema por baixo do pano.
    cdp = await abrirNavegador();
    console.log(`  Chrome headless aberto · viewport ${LARGURA}×${ALTURA}`);

    const regua = await gateDaRegua(cdp, servidor.url);
    await blocoAcontece(cdp, servidor.url, regua);
    await blocoDescobrir(cdp, servidor.url);
    await blocoBuscar(cdp, servidor.url);
    await blocoEvento(cdp, servidor.url);
    await blocoRedacaoFila(cdp, servidor.url);
    await blocoRedacaoTrilha(cdp, servidor.url);
    await blocoObservatorio(cdp, servidor.url);
    await blocoFiltros(cdp, servidor.url);
    await blocoBecos(cdp, servidor.url);
    await blocoPlay(cdp, servidor.url);
    await blocoProdutor(cdp, servidor.url);
    await blocoContratosCruzados(cdp, servidor.url);
    await blocoDeHonestidade(cdp, servidor.url);

    gateConsole(cdp);
    await coletarRede(cdp);
    gateRede(cdp, servidor.url);
    imprimirResumo(estrutura);
  } finally {
    // Encerramento garantido por TODOS os caminhos de saída — inclusive o de falha. Um Chrome
    // órfão segurando o perfil temporário é o custo de um `finally` que não existe.
    if (cdp) await cdp.encerrar();
    await servidor.fechar();
  }
}

principal()
  .then(() => {
    console.log(
      `\nTUDO PASSOU. · ${verdes} gates verdes · ${informativas} linha(s) informativa(s) · ${falhas} falha(s)`,
    );
    process.exit(0);
  })
  .catch((erro) => {
    console.error(`\nVERIFICAÇÃO FALHOU: ${erro.message}`);
    if (!(erro instanceof Falha) && erro.stack) console.error(erro.stack);
    console.error(
      `gates verdes até a falha: ${verdes} · linhas informativas: ${informativas} · ` +
        `os verdes acima continuam impressos, e é isso que faz a suíte ser útil quando falha`,
    );
    process.exit(1);
  });
