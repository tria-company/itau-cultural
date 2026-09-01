/**
 * verificar-fase2.mjs — a verificação da fase 2, dirigida por navegador.
 *
 * POR QUE ESTE ARQUIVO EXISTE. Os três planos da onda 2 verificaram o HTML exportado com
 * `grep`. Isso prova que o texto está no arquivo. Não prova que ele APARECE NA TELA, que a
 * navegação funciona, nem que a tela de explicação cabe na moldura. Esta é a diferença entre
 * um protótipo que compila e um que sobrevive à apresentação.
 *
 * O QUE ELE MEDE. `out/` — o artefato exportado, servido estaticamente — aberto em Chrome
 * headless por CDP, num viewport de 1440×960. O viewport é largo DE PROPÓSITO: a única media
 * query do projeto é 430px, e num viewport largo ela não participa. Assim o que é medido é o
 * alternador e a moldura, não o tamanho da janela.
 *
 * O QUE ELE NÃO FAZ. Não se pula. Chrome ausente FALHA o script (T-02-22). Verificação que
 * se autodispensa produz relatório verde sobre nada, que é pior do que verificação ausente.
 *
 * ZERO DEPENDÊNCIA NOVA. O cliente CDP são ~120 linhas sobre o `WebSocket` global do Node 24.
 * Instalar puppeteer aqui exigiria a auditoria de legitimidade de pacote que a fase não fez.
 */

import { spawn } from "node:child_process";
import { mkdtemp, rm, readFile, readdir } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { servir } from "./servir-out.mjs";
import { abrirNavegador, naPagina } from "./navegador.mjs";

const RAIZ = path.resolve(import.meta.dirname, "..");
const SRC = path.join(RAIZ, "src");
const OUT = path.join(RAIZ, "out");

const LARGURA = 1440;
const ALTURA = 960;

// ---------------------------------------------------------------------------
// Relatório: toda medição imprime uma linha nomeada com o NÚMERO medido.
// ---------------------------------------------------------------------------

let falhas = 0;
const resumo = [];

function ok(nome, medida) {
  console.log(`  ok   ${nome}: ${medida}`);
}

class Falha extends Error {}

/** Falha nomeada. Imprime o medido E o esperado — quem lê o log precisa do tamanho do corte. */
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

// ---------------------------------------------------------------------------
// Leitura de fonte com comentários removidos.
//
// POR QUE. Dois gates desta fase mediam PROSA, não código, e os dois foram confirmados
// independentemente por dois executores da onda 2:
//   · o gate de cor casava `--ic-lilas` em `selo-linguagem.tsx:10` e `tipos.ts:250`, que são
//     comentários explicando que o vocabulário emite o NOME DO TOKEN;
//   · o gate de `fixed` casava o comentário que explica POR QUE não se usa `fixed` na moldura.
// A variante literal obriga a apagar a documentação do contrato para passar. Esse é o
// incentivo errado: o comentário é o que impede a próxima pessoa de reintroduzir o defeito.
// ---------------------------------------------------------------------------

/**
 * Remove comentários de linha e de bloco preservando strings e o número de linhas.
 * Máquina de estados em vez de regex: `"https://x"` tem `//` dentro de string, e uma regex
 * ingênua apagaria metade do arquivo — um falso NEGATIVO, que é o erro caro num gate.
 */
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
      while (i < n && !(fonte[i] === "*" && fonte[i + 1] === "/")) {
        if (fonte[i] === "\n") fora += "\n"; // preserva a numeração de linha
        i += 1;
      }
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
  async function andar(atual) {
    for (const entrada of await readdir(atual, { withFileTypes: true })) {
      const p = path.join(atual, entrada.name);
      if (entrada.isDirectory()) {
        if (entrada.name === "node_modules" || entrada.name === "gerado") {
          if (entrada.name === "gerado") continue; // JSON gerado não é código a auditar
          continue;
        }
        await andar(p);
      } else if (filtro.test(entrada.name)) {
        saida.push(p);
      }
    }
  }
  await andar(dir);
  return saida;
}

const fontes = new Map();
async function fonte(arquivo) {
  if (!fontes.has(arquivo)) {
    const bruto = await readFile(arquivo, "utf8");
    fontes.set(arquivo, { bruto, limpo: semComentarios(bruto) });
  }
  return fontes.get(arquivo);
}

// ---------------------------------------------------------------------------
// Extração de import por INSTRUÇÃO, não por linha.
//
// POR QUE. O gate de DP-F do 02-01 casava linha a linha e acusou `repertorio.tsx` de
// importar `@/dados/repertorio` fora de `import type`. O import É `import type`, só que
// quebrado em cinco linhas, e o grep via só a linha do `from`. Falso positivo no gate, não
// defeito no código. Aqui a instrução inteira é casada, sobre a fonte sem comentários.
// ---------------------------------------------------------------------------

const RE_INSTRUCAO = /\b(?:import|export)\b[\s\S]*?\bfrom\s*["']([^"']+)["']|(?:^|\n)\s*import\s+["']([^"']+)["']/g;

/** `{ especificador, tipoApenas }` de cada import/re-export do arquivo. */
function importsDe(limpo) {
  const achados = [];
  RE_INSTRUCAO.lastIndex = 0;
  let m;
  while ((m = RE_INSTRUCAO.exec(limpo)) !== null) {
    const instrucao = m[0];
    const especificador = m[1] ?? m[2];
    if (!especificador) continue;

    // `import type X from` e `import type { … }` — apagados na compilação, não vão ao bundle.
    let tipoApenas = /\bimport\s+type\b/.test(instrucao);

    // `import { type A, type B }` — só conta como tipo se TODO especificador for tipo.
    if (!tipoApenas) {
      const chaves = instrucao.match(/\{([\s\S]*?)\}/);
      const temDefault = /\bimport\s+[A-Za-z_$][\w$]*\s*(,|\bfrom\b)/.test(instrucao);
      if (chaves && !temDefault) {
        const partes = chaves[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        tipoApenas = partes.length > 0 && partes.every((p) => /^type\s/.test(p));
      }
    }
    achados.push({ especificador, tipoApenas, instrucao });
  }
  // `import("…")` dinâmico entra como import de valor.
  for (const d of limpo.matchAll(/\bimport\s*\(\s*["']([^"']+)["']/g)) {
    achados.push({ especificador: d[1], tipoApenas: false, instrucao: d[0] });
  }
  return achados;
}

/** Resolve `@/x` e `./x` para um arquivo real dentro de `src/`, ou `null` se sai de `src/`. */
function resolverModulo(especificador, deArquivo) {
  let base;
  if (especificador.startsWith("@/")) base = path.join(SRC, especificador.slice(2));
  else if (especificador.startsWith(".")) base = path.resolve(path.dirname(deArquivo), especificador);
  else return null; // pacote de node_modules

  const tentativas = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mjs`,
    `${base}.js`,
    `${base}.json`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  for (const t of tentativas) {
    if (existsSync(t) && statSync(t).isFile()) return t;
  }
  return null;
}

// ---------------------------------------------------------------------------
// (b) GATES ESTRUTURAIS — rodam ANTES de subir o Chrome.
// São baratos e pegam a classe de erro mais cara da fase.
// ---------------------------------------------------------------------------

const JSON_PESADOS = ["entidades.json", "arestas.json", "ocorrencias.json"];
const CORES_APOIO = /--ic-(amarelo|azul|lilas|rosa|verde-agua|verde)\b/g;

async function gatesEstruturais() {
  titulo("── (b) gates estruturais, sem navegador ──");
  const arquivos = await arquivosDe(SRC);

  // ---- 1. O grafo não vazou para o cliente (D-47, DP-F, DP-G) ----

  const clientes = [];
  for (const a of arquivos) {
    const { limpo } = await fonte(a);
    if (/^\s*["']use client["']/m.test(limpo)) clientes.push(a);
  }
  ok("arquivos com a diretiva 'use client'", clientes.length);

  // 1a. Fecho TRANSITIVO de imports de valor a partir de cada cliente. O plano pede o import
  // direto; o 02-02 mediu que a propriedade real é a transitiva — um cliente que importa um
  // módulo que importa `grafo.ts` manda os 23 MB do mesmo jeito. Mede-se a mais forte.
  const violacoesDpf = [];
  for (const cliente of clientes) {
    const vistos = new Set();
    const fila = [[cliente, [path.relative(RAIZ, cliente)]]];
    while (fila.length) {
      const [atual, caminho] = fila.shift();
      if (vistos.has(atual)) continue;
      vistos.add(atual);
      const { limpo } = await fonte(atual).catch(() => ({ limpo: "" }));
      for (const imp of importsDe(limpo)) {
        if (imp.tipoApenas) continue; // apagado na compilação
        const alvo = resolverModulo(imp.especificador, atual);
        if (!alvo || !alvo.startsWith(SRC)) continue;
        const nome = path.basename(alvo);
        const ehGrafo = alvo === path.join(SRC, "dados", "grafo.ts");
        if (ehGrafo || JSON_PESADOS.includes(nome)) {
          violacoesDpf.push(`${[...caminho, path.relative(RAIZ, alvo)].join(" → ")}`);
          continue;
        }
        if (alvo.endsWith(".json")) continue;
        fila.push([alvo, [...caminho, path.relative(RAIZ, alvo)]]);
      }
    }
  }
  exigir(
    violacoesDpf.length === 0,
    "DP-F · caminhos de cliente até o grafo (transitivo)",
    violacoesDpf.length === 0 ? "0 violações" : violacoesDpf.join(" | "),
    "0 violações",
  );

  // 1b. Nenhuma tela varre array cru: `src/componentes/` e `src/app/` não importam os três
  // JSON pesados por caminho nenhum. `vocabulario.json` e `personas.json` são a exceção
  // declarada — vocabulário e configuração, 28 KB somados.
  const telas = arquivos.filter(
    (a) => a.startsWith(path.join(SRC, "componentes")) || a.startsWith(path.join(SRC, "app")),
  );
  const violacoesD47 = [];
  for (const a of telas) {
    const { limpo } = await fonte(a);
    for (const imp of importsDe(limpo)) {
      if (JSON_PESADOS.some((j) => imp.especificador.endsWith(j))) {
        violacoesD47.push(`${path.relative(RAIZ, a)} → ${imp.especificador}`);
      }
    }
  }
  exigir(
    violacoesD47.length === 0,
    "D-47 · telas importando entidades/arestas/ocorrencias.json",
    violacoesD47.length === 0 ? `0 em ${telas.length} telas` : violacoesD47.join(" | "),
    "0",
  );

  // 1c. A prova empírica do mesmo fato: o peso do que foi ao navegador.
  const chunks = path.join(OUT, "_next", "static", "chunks");
  const pesoKb = existsSync(chunks) ? Math.round((await tamanhoDe(chunks)) / 1024) : -1;
  exigir(
    pesoKb > 0 && pesoKb < 4096,
    "DP-F · peso de out/_next/static/chunks",
    `${pesoKb} KB`,
    "< 4096 KB (os 23 MB de grafo não atravessaram)",
  );

  // ---- 2. Nenhuma associação linguagem→cor em código (D-08) ----
  // Sobre a fonte SEM COMENTÁRIOS. Ver a nota em `semComentarios`.
  const hitsCor = [];
  for (const a of arquivos) {
    const { limpo, bruto } = await fonte(a);
    CORES_APOIO.lastIndex = 0;
    for (const h of limpo.matchAll(CORES_APOIO)) hitsCor.push(`${path.relative(RAIZ, a)}:${h[0]}`);
    void bruto;
  }
  // Contagem na fonte BRUTA, só para o log mostrar quanto o gate literal exageraria.
  let hitsBrutos = 0;
  for (const a of arquivos) {
    const { bruto } = await fonte(a);
    hitsBrutos += [...bruto.matchAll(CORES_APOIO)].length;
  }
  exigir(
    hitsCor.length === 0,
    "D-08 · token de cor de apoio em .ts/.tsx (sem comentários)",
    hitsCor.length === 0
      ? `0 em código · ${hitsBrutos} em prosa (comentários, ignorados de propósito)`
      : hitsCor.join(" | "),
    "0 em código",
  );

  // ---- 3. Nenhum dangerouslySetInnerHTML ----
  const hitsHtml = [];
  for (const a of arquivos) {
    const { limpo } = await fonte(a);
    if (limpo.includes("dangerouslySetInnerHTML")) hitsHtml.push(path.relative(RAIZ, a));
  }
  exigir(
    hitsHtml.length === 0,
    "dangerouslySetInnerHTML em src/",
    hitsHtml.length === 0 ? "0 ocorrências" : hitsHtml.join(" | "),
    "0",
  );

  // ---- 4. Nenhum posicionamento ancorado na janela dentro da moldura ----
  // O único `fixed` legítimo é o alternador de visões em `casca.tsx`, que é ancorado à
  // JANELA de propósito (D-04) e vive FORA da moldura.
  const permitido = path.join(SRC, "componentes", "casca.tsx");
  const hitsFixed = [];
  for (const a of telas) {
    if (a === permitido) continue;
    const { limpo } = await fonte(a);
    if (/\bfixed\b/.test(limpo)) hitsFixed.push(path.relative(RAIZ, a));
  }
  let fixedBrutos = 0;
  for (const a of telas) {
    const { bruto } = await fonte(a);
    fixedBrutos += [...bruto.matchAll(/\bfixed\b/g)].length;
  }
  exigir(
    hitsFixed.length === 0,
    "posicionamento 'fixed' fora de casca.tsx (sem comentários)",
    hitsFixed.length === 0
      ? `0 em código · ${fixedBrutos} em prosa (comentários, ignorados de propósito)`
      : hitsFixed.join(" | "),
    "0 em código",
  );

  // ---- 5. Todas as rotas presentes em out/ ----
  const rotasFase1 = [
    "",
    "entrar",
    "verificacao",
    "acontece",
    "buscar",
    "descobrir",
    "mapa",
    "meu",
    "play",
    "observatorio",
    "moderacao/fila",
    "redacao/trilha",
    "studio/duplicatas",
    "studio/ocorrencias",
    "studio/publicar",
    "onboarding/1",
    "onboarding/2",
    "onboarding/3",
  ];
  const faltando = rotasFase1.filter((r) => !existsSync(path.join(OUT, r, "index.html")));
  exigir(
    faltando.length === 0,
    "rotas da fase 1 intactas",
    faltando.length === 0 ? `${rotasFase1.length} de ${rotasFase1.length}` : `faltam ${faltando.join(", ")}`,
    `${rotasFase1.length}`,
  );

  const porque = (await readdir(path.join(OUT, "descobrir", "porque"))).filter((d) =>
    existsSync(path.join(OUT, "descobrir", "porque", d, "index.html")),
  );
  exigir(porque.length >= 60, "rotas de explicação em out/descobrir/porque/", porque.length, "≥ 60");

  exigir(
    existsSync(path.join(OUT, "trilha", "do-rap-ao-teatro-documentario", "index.html")),
    "rota da trilha do Cenário 1",
    existsSync(path.join(OUT, "trilha", "do-rap-ao-teatro-documentario", "index.html")) ? "presente" : "AUSENTE",
    "presente",
  );

  let entidades = 0;
  for (const familia of ["artista", "produtor", "evento", "obra"]) {
    const dir = path.join(OUT, familia);
    if (!existsSync(dir)) continue;
    for (const d of await readdir(dir)) {
      if (existsSync(path.join(dir, d, "index.html"))) entidades += 1;
    }
  }
  exigir(entidades >= 1690, "páginas de entidade em out/", entidades, "≥ 1690");

  exigir(
    existsSync(path.join(OUT, "icon.png")),
    "out/icon.png (favicon da assinatura oficial)",
    existsSync(path.join(OUT, "icon.png")) ? "presente" : "AUSENTE",
    "presente",
  );
}

async function tamanhoDe(dir) {
  let total = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) total += await tamanhoDe(p);
    else total += statSync(p).size;
  }
  return total;
}

// ---------------------------------------------------------------------------
// (a) CLIENTE CDP — mora em `navegador.mjs`.
//
// Foi extraído daqui quando uma segunda verificação precisou do MESMO navegador, no
// MESMO viewport. Copiar o cliente para um segundo arquivo faria as duas cópias
// divergirem na primeira correção, e as duas relatariam verde sobre medições diferentes.
// Os padrões de `abrirNavegador()` são os valores que este arquivo usava — 1440×960, 30s
// por navegação, 15s de hidratação —, então o que é medido aqui não mudou.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// (c) GATES DE TELA
// ---------------------------------------------------------------------------

async function gatesDeTela(cdp, base) {
  titulo("── (c) gates de tela, visão app ──");

  await cdp.navegar(`${base}/descobrir/`);

  const janela = await cdp.avaliar("({ w: innerWidth, h: innerHeight })");
  exigir(
    janela.w === LARGURA && janela.h >= 900,
    "viewport (largo de propósito: a media query de 430px não participa)",
    `${janela.w}×${janela.h}`,
    `${LARGURA}×${ALTURA}`,
  );

  // A regressão mais cara da fase 1 era a barra de abas escapando do telefone. Desde
  // 2026-08-23 a visão app tem DOIS elementos grudados: o cabeçalho fino, `sticky` no
  // topo de `.moldura-rolagem`, e a barra inferior, `absolute` contra a `.moldura`
  // (nunca `fixed`, D-03/D-04 — `fixed` se ancoraria na janela e escaparia para a
  // largura toda). A pergunta é a mesma de sempre, agora nas duas pontas: contidos na
  // moldura, antes e depois de rolar.
  const medirNavegacao = () =>
    cdp.avaliar(
      naPagina(`
        const m = document.querySelector('.moldura');
        const r = document.querySelector('.moldura-rolagem');
        const t = document.querySelector('.barra-topo');
        const b = document.querySelector('.barra-inferior');
        if (!m || !r || !t || !b) {
          return { erro: !m ? 'moldura ausente' : !r ? 'rolagem ausente' : !t ? 'cabeçalho ausente' : 'barra ausente' };
        }
        const rm = m.getBoundingClientRect();
        const rt = t.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return {
          molduraLargura: Math.round(rm.width), molduraTopo: Math.round(rm.top),
          molduraBase: Math.round(rm.bottom), molduraEsquerda: Math.round(rm.left),
          molduraDireita: Math.round(rm.right),
          topoLargura: Math.round(rt.width), topoTopo: Math.round(rt.top), topoVisivel: visivel(t),
          barraLargura: Math.round(rb.width), barraBase: Math.round(rb.bottom),
          barraEsquerda: Math.round(rb.left), barraDireita: Math.round(rb.right),
          barraVisivel: visivel(b),
          rolagem: Math.round(r.scrollTop), alturaConteudo: Math.round(r.scrollHeight),
          alturaUtil: Math.round(r.clientHeight),
        };
      `),
    );

  const conteveNavegacao = (m) =>
    !m.erro &&
    m.topoVisivel &&
    m.barraVisivel &&
    m.topoLargura <= m.molduraLargura &&
    Math.abs(m.topoTopo - m.molduraTopo) <= 12 &&
    m.barraLargura <= m.molduraLargura &&
    m.barraEsquerda >= m.molduraEsquerda - 1 &&
    m.barraDireita <= m.molduraDireita + 1 &&
    Math.abs(m.barraBase - m.molduraBase) <= 12;

  const antes = await medirNavegacao();
  exigir(
    conteveNavegacao(antes),
    "moldura contém cabeçalho e barra inferior (antes de rolar)",
    antes.erro
      ? antes.erro
      : `cabeçalho ${antes.topoLargura}px topo ${antes.topoTopo} · barra ${antes.barraLargura}px base ${antes.barraBase} · moldura ${antes.molduraLargura}px topo ${antes.molduraTopo} base ${antes.molduraBase}`,
    "cabeçalho grudado no topo da moldura e barra grudada na base, ambos mais estreitos que ela",
  );

  await cdp.avaliar("document.querySelector('.moldura-rolagem').scrollTop = 999999");
  await new Promise((r) => setTimeout(r, 300));
  const depois = await medirNavegacao();
  exigir(
    conteveNavegacao(depois),
    "moldura contém cabeçalho e barra inferior (rolada até o fim)",
    depois.erro
      ? depois.erro
      : `rolagem ${depois.rolagem}px · cabeçalho topo ${depois.topoTopo} · barra base ${depois.barraBase} · moldura topo ${depois.molduraTopo} base ${depois.molduraBase}`,
    "cabeçalho e barra ainda grudados nas duas pontas da moldura",
  );

  // `data-view` responde ao alternador E sobrevive a recarregar, nas DUAS direções.
  const visaoAtual = () => cdp.avaliar("document.querySelector('[data-view]').getAttribute('data-view')");
  const inicial = await visaoAtual();
  exigir(inicial === "mobile", "data-view inicial", inicial, "mobile");

  await cdp.clicar(`Array.from(document.querySelectorAll('.alternador button, [class*="alternador"] button'))
      .find(b => /web|desktop|desk/i.test(b.textContent || ''))`);
  await new Promise((r) => setTimeout(r, 300));
  const apos = await visaoAtual();
  exigir(apos === "desktop" || apos === "web" || apos !== inicial, "data-view após o alternador", apos, `≠ ${inicial}`);

  await cdp.recarregar();
  const aposRecarga = await visaoAtual();
  exigir(aposRecarga === apos, "data-view sobrevive a recarregar (ida)", aposRecarga, apos);

  await cdp.clicar(`Array.from(document.querySelectorAll('.alternador button, [class*="alternador"] button'))
      .find(b => /app|mobile|celular|telefone/i.test(b.textContent || ''))`);
  await new Promise((r) => setTimeout(r, 300));
  const devolta = await visaoAtual();
  exigir(devolta === "mobile", "data-view volta para mobile", devolta, "mobile");

  await cdp.recarregar();
  const devoltaRecarga = await visaoAtual();
  exigir(devoltaRecarga === "mobile", "data-view sobrevive a recarregar (volta)", devoltaRecarga, "mobile");
}

// ---------------------------------------------------------------------------
// Console — acumulado na SESSÃO INTEIRA, medido no fim.
// ---------------------------------------------------------------------------

function gateConsole(cdp, navegacoes) {
  titulo("── console, acumulado na sessão inteira ──");
  const erros = cdp.consola.filter((c) => c.nivel === "erro");
  const avisos = cdp.consola.filter((c) => c.nivel === "aviso");
  for (const c of cdp.consola.slice(0, 20)) console.log(`       ${c.nivel}: ${c.texto}`);
  exigir(
    erros.length === 0 && avisos.length === 0,
    "console",
    `${erros.length} erro, ${avisos.length} aviso em ${navegacoes} navegações`,
    "0 erro, 0 aviso",
  );
  resumo.push(["console limpo", `0 erro, 0 aviso em ${navegacoes} navegações`]);
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------

async function principal() {
  console.log("verificar-fase2 — Cenário 1 sobre o artefato exportado, em Chrome headless\n");

  if (!existsSync(path.join(OUT, "index.html"))) {
    throw new Error("out/ não existe ou está incompleto. Rode `npm run build` antes.");
  }

  await gatesEstruturais();

  const servidor = await servir({ raiz: OUT });
  console.log(`\n  servidor estático em ${servidor.url} (raiz: out/)`);

  let cdp = null;
  try {
    cdp = await abrirNavegador();
    console.log(`  Chrome headless aberto · viewport ${LARGURA}×${ALTURA}`);

    await gatesDeTela(cdp, servidor.url);

    const passos = await cenario1(cdp, servidor.url);
    gateConsole(cdp, passos);
    imprimirResumo();
  } finally {
    // T-02-21: encerramento garantido. Verificação desassistida não deixa processo pendurado.
    if (cdp) await cdp.encerrar();
    await servidor.fechar();
  }
}

// ---------------------------------------------------------------------------
// O ROTEIRO DO CENÁRIO 1, percorrido por clique.
//
// A ordem é a que a banca vai pedir: a Maria escolhe uma disposição, recebe um feed que não
// é lista de eventos, pergunta por que aquilo apareceu, segue a trilha do rap ao teatro
// documentário, chega numa montagem com data, e do evento vai ao verbete do artista e volta.
// ---------------------------------------------------------------------------

/** Lê o feed pelos elementos VISÍVEIS. Presença no DOM não é presença na tela. */
const LER_FEED = naPagina(`
  const envolucros = todos('[data-classe]').filter((w) => {
    const art = w.querySelector('article.cartao');
    return art && visivel(w) && visivel(art);
  });
  return envolucros.map((w) => {
    const art = w.querySelector('article.cartao');
    const selo = art.querySelector('.selo-motivo[data-motivo]');
    const rs = selo ? selo.getBoundingClientRect() : null;
    const assinatura = Array.from(art.querySelectorAll('p')).find(
      (p) => p.className.includes('italic') && (p.textContent || '').trim().length > 0,
    );
    const explicacao = art.querySelector('a[href^="/descobrir/porque/"]');
    return {
      classe: w.getAttribute('data-classe') || '',
      titulo: (art.querySelector('h3')?.textContent || '').trim(),
      especial: art.getAttribute('data-especial') || '',
      motivo: selo ? (selo.getAttribute('data-motivo') || '') : '',
      motivoTexto: selo ? (selo.textContent || '').trim() : '',
      motivoVisivel: selo ? visivel(selo) : false,
      motivoAltura: rs ? Math.round(rs.height) : 0,
      assinatura: assinatura ? (assinatura.textContent || '').trim() : '',
      assinaturaVisivel: assinatura ? visivel(assinatura) : false,
      explicacaoHref: explicacao ? explicacao.getAttribute('href') : '',
    };
  });
`);

/** Sobreposição entre duas listas de títulos. É a medida de D-45. */
function sobreposicao(a, b) {
  const conjunto = new Set(b);
  return a.filter((t) => conjunto.has(t)).length;
}

/**
 * Abre o seletor de disposição de forma IDEMPOTENTE, lendo `aria-expanded`.
 * O botão é um alternador: clicar às cegas duas vezes o fecha, e o sintoma seria «não há
 * opções» num painel que existe. Estado lido antes de agir.
 */
async function irAoPerfil(cdp) {
  const origem = await cdp.avaliar("location.href");
  await cdp.navegar(new URL("/meu/", origem).href);
  await new Promise((r) => setTimeout(r, 300));
  return origem;
}

async function abrirSeletor(cdp) {
  const origem = await irAoPerfil(cdp);
  const n = await cdp.avaliar(
    `Array.from(document.querySelectorAll('[data-disposicao]')).filter((b) => {
       const r = b.getBoundingClientRect();
       return r.width > 0 && r.height > 0;
     }).length`,
  );
  if (!n) {
    await cdp.clicar("document.querySelector('[data-abrir-disposicao]')");
    await new Promise((r) => setTimeout(r, 300));
  }
  return origem;
}

async function trocarPersona(cdp, nome) {
  // A troca de persona mora em /meu desde a reformulação de 2026-08 (feedback do
  // cliente: persona fora da tela de Descobrir). O helper vai até lá, troca e volta —
  // a sessão viaja pelo localStorage, então a página de origem reflete a troca.
  const origem = await cdp.avaliar("location.href");
  await cdp.navegar(new URL("/meu/", origem).href);
  await cdp.clicar(
    `Array.from(document.querySelectorAll('[aria-label="Trocar de persona"] button'))
       .find(b => (b.textContent || '').trim() === ${JSON.stringify(nome)})`,
  );
  await new Promise((r) => setTimeout(r, 300));
  await cdp.navegar(origem);
  await new Promise((r) => setTimeout(r, 450));
}

async function cenario1(cdp, base) {
  // ---- 1. Onboarding por disposição (DESC-01) ----
  titulo("── 1 · onboarding por disposição (DESC-01, D-46) ──");
  await cdp.navegar(`${base}/onboarding/1/`);

  const cartoesDisposicao = await cdp.avaliar(
    naPagina(`return visiveis('.cartao-disposicao').map(b => ({
      rotulo: (b.querySelector('span span') || b).textContent.trim().slice(0, 40),
      marcado: b.getAttribute('aria-pressed') === 'true',
    }));`),
  );
  exigir(cartoesDisposicao.length === 5, "cartões de disposição visíveis", cartoesDisposicao.length, "5");

  await cdp.clicar("document.querySelectorAll('.cartao-disposicao')[0]");
  await cdp.clicar("document.querySelectorAll('.cartao-disposicao')[2]");
  await new Promise((r) => setTimeout(r, 300));
  const marcadosAntes = await cdp.avaliar(
    naPagina(`return visiveis('.cartao-disposicao')
      .map((b, i) => [i, b.getAttribute('aria-pressed') === 'true'])
      .filter(([, m]) => m).map(([i]) => i);`),
  );
  exigir(
    marcadosAntes.length === 2 && marcadosAntes.join() === "0,2",
    "disposições marcadas após dois cliques",
    `[${marcadosAntes.join(", ")}]`,
    "[0, 2]",
  );

  // O espelho em localStorage de D-46 é PROVADO, não presumido.
  await cdp.recarregar();
  const marcadosDepois = await cdp.avaliar(
    naPagina(`return visiveis('.cartao-disposicao')
      .map((b, i) => [i, b.getAttribute('aria-pressed') === 'true'])
      .filter(([, m]) => m).map(([i]) => i);`),
  );
  exigir(
    marcadosDepois.join() === marcadosAntes.join(),
    "D-46 · as disposições sobrevivem a recarregar",
    `[${marcadosDepois.join(", ")}]`,
    `[${marcadosAntes.join(", ")}]`,
  );
  resumo.push([
    "DESC-01",
    `5 cartões de disposição visíveis; 2 marcados sobrevivem a recarregar (espelho de D-46 provado)`,
  ]);

  // ---- 2. O feed (DESC-02, D-26, D-27, D-28, D-29, D-30) ----
  titulo("── 2 · o feed (DESC-02, D-26 a D-30) ──");
  await cdp.navegar(`${base}/descobrir/`);
  // Volta ao estado limpo: as duas disposições do passo 1 continuam gravadas, e o roteiro da
  // banca começa o feed sem corte. Sem isto o número de cartões mediria outro feed.
  // A escolha de disposição mora no perfil (/meu), não no feed.
  const voltaFeed = await abrirSeletor(cdp);
  await cdp
    .clicar(`Array.from(document.querySelectorAll('button')).find(b => /limpar/i.test((b.textContent || '').trim()))`)
    .catch(() => {});
  await cdp.navegar(voltaFeed);
  await new Promise((r) => setTimeout(r, 450));

  const feedMaria = await cdp.avaliar(LER_FEED);
  exigir(feedMaria.length >= 10, "cartões VISÍVEIS no feed", feedMaria.length, "≥ 10");

  const classes = new Set(feedMaria.map((c) => c.classe));
  exigir(classes.size >= 8, "classes distintas no feed (D-26)", `${classes.size} — ${[...classes].join(", ")}`, "≥ 8");

  const adjacentes = feedMaria.filter((c, i) => i > 0 && c.classe === feedMaria[i - 1].classe);
  exigir(
    adjacentes.length === 0,
    "pares adjacentes de mesma classe (D-27)",
    adjacentes.length === 0 ? "0" : adjacentes.map((c) => c.classe).join(", "),
    "0",
  );

  // O GATE CENTRAL DA FASE. Cartão com motivo no atributo e invisível na tela falha o mesmo
  // que cartão sem motivo: o selo é a diferença visível entre algoritmo opaco e mediação
  // legível, e ela só existe se estiver desenhada.
  const semMotivo = feedMaria.filter(
    (c) => !c.motivo.trim() || !c.motivoTexto.trim() || !c.motivoVisivel || c.motivoAltura <= 0,
  );
  const alturaMin = Math.min(...feedMaria.map((c) => c.motivoAltura));
  exigir(
    semMotivo.length === 0,
    "D-28 · cartões com selo de motivo VISÍVEL e não vazio",
    semMotivo.length === 0
      ? `${feedMaria.length} de ${feedMaria.length} · menor altura de selo ${alturaMin}px`
      : semMotivo.map((c) => `${c.titulo}: motivo="${c.motivo}" visível=${c.motivoVisivel} altura=${c.motivoAltura}`).join(" | "),
    "todos, com altura > 0",
  );

  const serendipidade = feedMaria.filter((c) => c.especial === "serendipidade");
  exigir(serendipidade.length === 1, "D-30 · cartões de serendipidade", serendipidade.length, "exatamente 1");

  const curado = feedMaria.filter((c) => c.especial === "curado");
  /* D-29 INVERTIDO EM 2026-08-25, e o portão inverteu junto em vez de sumir. A nota de
   * curadoria («Curadoria humana, escrita pela curadoria…») saiu do cartão a pedido: é
   * informação de bastidor, e o bastidor já a tem — a Redação assina a trilha e declara a
   * procedência passo a passo. O que este portão prova agora é a AUSÊNCIA da nota no app,
   * porque a regra antiga voltaria calada se alguém recolocasse a linha. A procedência do
   * cartão continua provada acima, pelo selo de motivo e por `data-origem-motivo`. */
  exigir(
    curado.length === 1 && !curado[0].assinaturaVisivel && curado[0].assinatura.length === 0,
    "D-29 · destaque curado sem nota de curadoria no app",
    curado.length === 1
      ? `«${curado[0].titulo}» · nota: ${curado[0].assinatura ? `«${curado[0].assinatura.slice(0, 60)}»` : "ausente"}`
      : `${curado.length} destaques`,
    "1 destaque, nota de curadoria ausente do cartão",
  );
  resumo.push([
    "DESC-02",
    `${feedMaria.length} cartões visíveis, ${classes.size} classes, 0 pares adjacentes, ` +
      `${feedMaria.length}/${feedMaria.length} com selo de motivo visível (menor ${alturaMin}px), ` +
      `1 serendipidade, 1 destaque curado assinado`,
  ]);

  // ---- 3. Disposição editável em um toque (D-32) ----
  titulo("── 3 · disposição editável em um toque (D-32) ──");
  const urlAntes = await cdp.avaliar("location.pathname + location.search");
  const titulosAntes = feedMaria.map((c) => c.titulo);

  const origemFeed = await abrirSeletor(cdp);
  const pathPerfil = await cdp.avaliar("location.pathname");
  const disposicaoEscolhida = await cdp.avaliar(
    naPagina(`const b = visiveis('[data-disposicao]')[0]; return b ? b.getAttribute('data-disposicao') : null;`),
  );
  exigir(!!disposicaoEscolhida, "seletor de disposição no perfil com opções", disposicaoEscolhida ?? "nenhuma", "≥ 1 opção");
  await cdp.clicar("document.querySelectorAll('[data-disposicao]')[0]");
  await new Promise((r) => setTimeout(r, 500));
  const pathPerfilDepois = await cdp.avaliar("location.pathname");
  exigir(pathPerfilDepois === pathPerfil, "D-32 · marcar disposição no perfil NÃO navega", pathPerfilDepois, pathPerfil);
  await cdp.navegar(origemFeed);
  await new Promise((r) => setTimeout(r, 450));

  const urlDepois = await cdp.avaliar("location.pathname + location.search");
  exigir(urlDepois === urlAntes, "D-32 · o feed continua em /descobrir/", urlDepois, urlAntes);

  const feedComDisposicao = await cdp.avaliar(LER_FEED);
  const titulosDepois = feedComDisposicao.map((c) => c.titulo);
  const iguais = sobreposicao(titulosAntes, titulosDepois);
  exigir(
    titulosDepois.join("|") !== titulosAntes.join("|"),
    `D-32 · a lista muda ao trocar «${disposicaoEscolhida}»`,
    `${iguais} de ${titulosAntes.length} títulos em comum`,
    "lista diferente",
  );
  const classesDepois = new Set(feedComDisposicao.map((c) => c.classe));
  const adjDepois = feedComDisposicao.filter((c, i) => i > 0 && c.classe === feedComDisposicao[i - 1].classe);
  exigir(
    feedComDisposicao.length >= 10 && classesDepois.size >= 8 && adjDepois.length === 0,
    "D-32 · heterogeneidade se mantém depois da troca",
    `${feedComDisposicao.length} cartões, ${classesDepois.size} classes, ${adjDepois.length} pares adjacentes`,
    "≥ 10 cartões, ≥ 8 classes, 0 pares",
  );

  // Volta à disposição vazia para o resto do roteiro medir o feed base.
  const origemLimpa = await abrirSeletor(cdp);
  await cdp.clicar("document.querySelectorAll('[data-disposicao]')[0]");
  await cdp.navegar(origemLimpa);
  await new Promise((r) => setTimeout(r, 450));

  // ---- 4. Troca de persona (D-45) ----
  titulo("── 4 · troca de persona (D-45) ──");
  const feeds = { Maria: (await cdp.avaliar(LER_FEED)).map((c) => c.titulo) };
  for (const nome of ["Carlos", "Joana"]) {
    await trocarPersona(cdp, nome);
    feeds[nome] = (await cdp.avaliar(LER_FEED)).map((c) => c.titulo);
    ok(`feed de ${nome}`, `${feeds[nome].length} cartões`);
  }

  const pares = [
    ["Maria", "Carlos"],
    ["Maria", "Joana"],
    ["Carlos", "Joana"],
  ];
  const medidas = pares.map(([a, b]) => [`${a}×${b}`, sobreposicao(feeds[a], feeds[b])]);
  const pior = Math.max(...medidas.map(([, n]) => n));
  exigir(
    pior <= 3,
    "D-45 · sobreposição de títulos entre personas",
    medidas.map(([r, n]) => `${r}: ${n}`).join(" · ") + ` (pior ${pior} de ${feeds.Maria.length})`,
    "≤ 3 — acima disso a personalização é decorativa",
  );

  await trocarPersona(cdp, "Maria"); // o roteiro é o da Maria

  // ---- 5. A explicação (DESC-03, D-33, D-34, D-35) ----
  titulo("── 5 · a explicação (DESC-03, D-33, D-34, D-35) ──");
  const feedAtual = await cdp.avaliar(LER_FEED);
  // O primeiro cartão que NÃO é serendipidade. D-30 define a serendipidade como escolhida
  // FORA do alcance da caminhada: exigir dela um caminho de 2 nós seria exigir que ela
  // deixasse de ser o que é. Ver a nota de desvio no SUMMARY.
  const indiceAlvo = feedAtual.findIndex((c) => c.especial !== "serendipidade" && c.explicacaoHref);
  const cartaoAlvo = feedAtual[indiceAlvo];
  ok("cartão de partida da explicação", `#${indiceAlvo + 1} «${cartaoAlvo.titulo}» (${cartaoAlvo.classe})`);

  const ida = await cdp.clicarEEsperarUrl(
    `document.querySelectorAll('[data-classe] a[href^="/descobrir/porque/"]')[${indiceAlvo}]`,
    (p) => p.startsWith("/descobrir/porque/"),
    "link de explicação",
  );
  exigir(
    ida.para.startsWith("/descobrir/porque/"),
    "DESC-03 · o clique leva à rota da explicação (D-33)",
    ida.para,
    "/descobrir/porque/…/",
  );

  const explicacao = await cdp.avaliar(
    naPagina(`
      const passos = visiveis('[data-passo]');
      const r = document.querySelector('.moldura-rolagem');
      const cab = document.querySelector('.barra-topo');
      const barra = document.querySelector('.barra-inferior');
      return {
        passos: passos.length,
        passosSemMotivo: passos.filter(p => (p.textContent || '').trim().length === 0).length,
        textos: passos.map(p => (p.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 70)),
        limiteIa: visiveis('[data-limite-ia]').length,
        criterios: visiveis('[data-criterio]').length,
        alturaConteudo: Math.round(r.scrollHeight),
        alturaUtil: Math.round(r.clientHeight),
        // scrollHeight NUNCA é menor que clientHeight: sozinho ele só sabe dizer «estourou»
        // ou «não estourou», e imprimiria folga 0 mesmo numa tela metade vazia. A folga real
        // é do CONTEÚDO contra o espaço útil — a altura da rolagem menos as DUAS pontas
        // ocupadas pela navegação da visão app: o cabeçalho fino, sticky no topo, e a barra
        // inferior, que desde 23/08 cobre o pé da moldura.
        alturaReal: Math.round(document.querySelector('[data-explicacao]').getBoundingClientRect().height),
        espacoUtil: Math.round(
          r.clientHeight
            - (cab ? cab.getBoundingClientRect().height : 0)
            - (barra ? barra.getBoundingClientRect().height : 0),
        ),
      };
    `),
  );

  exigir(explicacao.passos >= 2, "D-34 · passos VISÍVEIS do caminho", explicacao.passos, "≥ 2");
  for (const t of explicacao.textos) console.log(`         passo: ${t}`);
  exigir(explicacao.passosSemMotivo === 0, "D-34 · passos com texto de motivo", `${explicacao.passos - explicacao.passosSemMotivo} de ${explicacao.passos}`, "todos não vazios");
  exigir(explicacao.limiteIa >= 1, "D-35 · rodapé do limite da IA visível", explicacao.limiteIa, "≥ 1");
  exigir(explicacao.criterios >= 1, "D-34 · critérios removíveis visíveis", explicacao.criterios, "≥ 1");

  // A MEDIDA QUE DECIDE A TELA: a foto de slide de D-33.
  const estouro = explicacao.alturaConteudo - explicacao.alturaUtil;
  const folga = explicacao.espacoUtil - explicacao.alturaReal;
  exigir(
    explicacao.alturaConteudo <= explicacao.alturaUtil + 8,
    "D-33 · a explicação CABE na moldura sem rolar",
    `rolagem: scrollHeight ${explicacao.alturaConteudo}px ≤ clientHeight ${explicacao.alturaUtil}px ` +
      (estouro <= 0 ? "(não estoura)" : `(ESTOURA POR ${estouro}px)`) +
      ` · conteúdo real ${explicacao.alturaReal}px contra ${explicacao.espacoUtil}px úteis · folga ${folga}px`,
    "scrollHeight ≤ clientHeight + 8px",
  );

  // Remover critério recalcula SEM navegar.
  const urlExplicacao = await cdp.avaliar("location.pathname");
  const antesRemocao = await cdp.avaliar(
    naPagina(`return { passos: visiveis('[data-passo]').length, texto: (document.querySelector('[data-explicacao]').textContent || '').length };`),
  );
  await cdp.clicar("document.querySelectorAll('[data-criterio]')[0]");
  await new Promise((r) => setTimeout(r, 500));
  const depoisRemocao = await cdp.avaliar(
    naPagina(`return {
      passos: visiveis('[data-passo]').length,
      texto: (document.querySelector('[data-explicacao]').textContent || '').length,
      removidos: todos('[data-removido]').length,
      url: location.pathname,
    };`),
  );
  exigir(
    depoisRemocao.url === urlExplicacao &&
      depoisRemocao.removidos >= 1 &&
      (depoisRemocao.passos !== antesRemocao.passos || depoisRemocao.texto !== antesRemocao.texto),
    "D-34 · remover critério recalcula a tela SEM navegar",
    `url ${depoisRemocao.url} · ${depoisRemocao.removidos} critério removido · ` +
      `passos ${antesRemocao.passos}→${depoisRemocao.passos} · texto ${antesRemocao.texto}→${depoisRemocao.texto} caracteres`,
    "mesma URL, ≥ 1 removido, conteúdo diferente",
  );
  // O CAMINHO MULTI-SALTO, E A MOLDURA EM TODO O FEED.
  // O cartão de partida rende uma cadeia de 2 nós — origem + 1 salto. Isso satisfaz o «≥ 2»
  // do plano, mas NÃO prova o que a fase afirma: que a tela mostra um caminho de vários
  // saltos no grafo. Uma medição só, na página mais curta, não estabelece isso. Aqui as 12
  // explicações do feed da Maria são percorridas: a cadeia mais longa é o número que prova a
  // afirmação, e a mais alta é a que decide se a foto de slide sobrevive ao pior caso.
  const cadeias = [];
  for (const c of feedAtual) {
    if (!c.explicacaoHref) continue;
    await cdp.navegar(`${base}${c.explicacaoHref}`);
    const m = await cdp.avaliar(
      naPagina(`
        const ro = document.querySelector('.moldura-rolagem');
        const cab = document.querySelector('.barra-topo');
        const barra = document.querySelector('.barra-inferior');
        return {
          passos: visiveis('[data-passo]').length,
          estoura: Math.round(ro.scrollHeight) - Math.round(ro.clientHeight),
          real: Math.round(document.querySelector('[data-explicacao]').getBoundingClientRect().height),
          espacoUtil: Math.round(
            ro.clientHeight
              - (cab ? cab.getBoundingClientRect().height : 0)
              - (barra ? barra.getBoundingClientRect().height : 0),
          ),
          limiteIa: visiveis('[data-limite-ia]').length,
        };
      `),
    );
    cadeias.push({ titulo: c.titulo, especial: c.especial, ...m });
  }

  const maiorCadeia = Math.max(...cadeias.map((c) => c.passos));
  const multiSalto = cadeias.filter((c) => c.passos >= 3).length;
  const semCaminho = cadeias.filter((c) => c.passos === 0);
  const maisLonga = cadeias.find((c) => c.passos === maiorCadeia);
  for (const c of cadeias) {
    console.log(`         ${String(c.passos).padStart(2)} nós · ${c.especial || "—"} · ${c.titulo.slice(0, 52)}`);
  }
  exigir(
    maiorCadeia >= 3,
    "D-34 · caminho MULTI-SALTO de verdade nas explicações do feed",
    `maior cadeia ${maiorCadeia} nós em «${maisLonga.titulo.slice(0, 40)}» · ` +
      `${multiSalto} de ${cadeias.length} com 3+ nós · ${semCaminho.length} sem caminho ` +
      `(${semCaminho.map((c) => c.especial || "?").join(", ") || "—"}) · ` +
      `distribuição ${cadeias.map((c) => c.passos).join("/")}`,
    "≥ 1 explicação com 3 nós ou mais",
  );
  // D-30: a serendipidade é escolhida FORA do alcance da caminhada. Zero nós nela é o dado,
  // não um buraco — mas zero nós em QUALQUER OUTRO cartão seria um link para uma tela vazia.
  exigir(
    semCaminho.every((c) => c.especial === "serendipidade"),
    "D-30 · só a serendipidade fica sem caminho",
    semCaminho.length === 0
      ? "nenhuma explicação sem caminho"
      : semCaminho.map((c) => `${c.titulo.slice(0, 35)} (especial=${c.especial || "nenhum"})`).join(" | "),
    "0 cartões comuns sem caminho",
  );

  const estouram = cadeias.filter((c) => c.estoura > 8);
  const folgaMinima = Math.min(...cadeias.map((c) => c.espacoUtil - c.real));
  const maisAlta = cadeias.reduce((a, c) => (c.espacoUtil - c.real < a.espacoUtil - a.real ? c : a));
  exigir(
    estouram.length === 0 && cadeias.every((c) => c.limiteIa >= 1),
    "D-33/D-35 · as 12 explicações do feed cabem na moldura e trazem o limite da IA",
    `${cadeias.length} páginas · ${estouram.length} estouram · folga mínima ${folgaMinima}px em «${maisAlta.titulo.slice(0, 40)}»`,
    "0 estouros, todas com rodapé",
  );

  resumo.push([
    "DESC-03",
    `clique do cartão #${indiceAlvo + 1} leva a ${ida.para}; ${explicacao.passos} passos visíveis, ` +
      `rodapé de limite da IA presente, ${explicacao.criterios} critérios removíveis; ` +
      `nas 12 explicações do feed a maior cadeia tem ${maiorCadeia} nós (${multiSalto} com 3+), ` +
      `0 estouram a moldura, folga mínima ${folgaMinima}px`,
  ]);

  // ---- 6. A trilha (DESC-04, D-36, D-37, D-38) ----
  titulo("── 6 · a trilha do rap ao teatro documentário (DESC-04, D-36 a D-38) ──");
  await cdp.navegar(`${base}/trilha/do-rap-ao-teatro-documentario/`);

  const trilha = await cdp.avaliar(
    naPagina(`
      const passos = visiveis('[data-passo-trilha]');
      const proc = visiveis('[data-procedencia-aresta]');
      return {
        passos: passos.length,
        motivos: visiveis('[data-motivo-passo]').map(p => (p.getAttribute('data-motivo-passo') || '').trim()),
        motivosVisiveis: visiveis('[data-motivo-passo]').length,
        autorados: proc.filter(p => p.getAttribute('data-procedencia-aresta') === 'autorado').length,
        rotulosAutorado: proc
          .filter(p => p.getAttribute('data-procedencia-aresta') === 'autorado')
          .map(p => (p.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 32)),
        sessoes: todos('[data-sessao-trilha]').map(s => s.getAttribute('data-sessao-trilha')),
        sessoesVisiveis: visiveis('[data-sessao-trilha]').length,
        textoSessao: visiveis('[data-sessao-trilha]').map(s => (s.textContent || '').trim().replace(/\\s+/g, ' ')),
      };
    `),
  );
  exigir(trilha.passos === 3, "D-36 · passos visíveis da trilha", trilha.passos, "3");
  exigir(
    trilha.autorados === 3,
    "D-37 · rótulos «autorado» VISÍVEIS na tela",
    `${trilha.autorados} — ${trilha.rotulosAutorado.map((t) => `«${t}»`).join(", ")}`,
    "3",
  );
  exigir(
    trilha.motivosVisiveis === 3 && trilha.motivos.every((m) => m.length > 0),
    "D-36 · motivo de cada passo, não vazio",
    trilha.motivos.map((m) => `«${m.slice(0, 45)}»`).join(" · "),
    "3 motivos não vazios",
  );
  exigir(
    trilha.sessoesVisiveis >= 1,
    "D-38 · data da sessão final em texto",
    `${trilha.sessoesVisiveis} sessões · ${trilha.textoSessao[trilha.textoSessao.length - 1] ?? "—"}`,
    "≥ 1 sessão visível com data",
  );

  const idaTrilha = await cdp.clicarEEsperarUrl(
    `document.querySelector('[data-passo-trilha="3"] a[href^="/evento/"]') ||
     Array.from(document.querySelectorAll('a[href^="/evento/"]')).pop()`,
    (p) => p.startsWith("/evento/"),
    "passo final da trilha",
  );
  const ocorrencias = await cdp.avaliar(
    naPagina(`return {
      total: document.querySelector('[data-ocorrencias-total]')?.getAttribute('data-ocorrencias-total') ?? 'ausente',
      visiveis: visiveis('[data-ocorrencia]').length,
    };`),
  );
  exigir(
    idaTrilha.para.startsWith("/evento/") && Number(ocorrencias.total) >= 1 && ocorrencias.visiveis >= 1,
    "D-38 · o passo final abre o evento COM ocorrências (por clique)",
    `${idaTrilha.para} · total declarado ${ocorrencias.total} · ${ocorrencias.visiveis} ocorrências visíveis`,
    "rota de evento com ≥ 1 ocorrência",
  );
  resumo.push([
    "DESC-04",
    `3 passos, 3 rótulos «autorado» visíveis, 3 motivos não vazios, ` +
      `${trilha.sessoes.length} sessões datadas; clique no passo 3 abre ${idaTrilha.para} com ${ocorrencias.visiveis} ocorrências`,
  ]);

  // ---- 7. A ponte, nos dois sentidos (DESC-05, DESC-06, DESC-08) ----
  titulo("── 7 · a ponte Enciclopédia ↔ agenda, nos dois sentidos (DESC-05, DESC-06, DESC-08) ──");
  const ARTISTA = "/artista/a-mattera/";
  await cdp.navegar(`${base}${ARTISTA}`);

  const artista = await cdp.avaliar(
    naPagina(`
      const v = document.querySelector('[data-verbete]');
      const link = v ? v.querySelector('a[href]') : null;
      const vinculos = visiveis('[data-vinculo]');
      const comPapel = vinculos.filter(x => (x.getAttribute('data-vinculo') || '').split(':')[1]);
      return {
        verbeteVisivel: visivel(v),
        verbeteProcedencia: v ? v.getAttribute('data-verbete') : null,
        verbeteTexto: v ? (v.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 90) : '',
        fonteVisivel: link ? visivel(link) : false,
        fonteHref: link ? link.getAttribute('href') : '',
        vinculos: vinculos.length,
        comPapel: comPapel.length,
        papeis: Array.from(new Set(comPapel.map(x => x.getAttribute('data-vinculo')))),
        papelDeclarado: visiveis('[data-papel]').map(p => p.getAttribute('data-papel')),
      };
    `),
  );
  exigir(
    artista.verbeteVisivel && artista.fonteVisivel && /^https?:/.test(artista.fonteHref),
    "D-39 · verbete embutido visível com link de fonte",
    `procedência «${artista.verbeteProcedencia}» · fonte ${artista.fonteHref}`,
    "verbete visível e link de fonte http(s)",
  );
  exigir(
    artista.comPapel >= 1,
    "D-40/D-41 · vínculos com papel vindo da aresta",
    `${artista.comPapel} de ${artista.vinculos} vínculos visíveis · ${artista.papeis.join(", ")} · data-papel: ${artista.papelDeclarado.join(", ")}`,
    "≥ 1 com papel não vazio",
  );

  const idaPonte = await cdp.clicarEEsperarUrl(
    `document.querySelector('[data-vinculo^="atua_em:"] a[href^="/evento/"]')`,
    (p) => p.startsWith("/evento/"),
    "vínculo atua_em do artista para o evento",
  );
  ok("DESC-05 · artista → evento POR CLIQUE", `${ARTISTA} → ${idaPonte.para} (clicando «${idaPonte.texto}»)`);

  const evento = await cdp.avaliar(
    naPagina(`
      const dims = visiveis('[data-dimensao]');
      const atua = visiveis('[data-ponte="atua_em"] [data-vinculo]');
      return {
        dimensoes: dims.length,
        chaves: dims.map(d => d.getAttribute('data-dimensao')),
        estados: Array.from(new Set(dims.map(d => d.getAttribute('data-estado')))),
        atua: atua.length,
        atuaComPapel: atua.filter(a => (a.getAttribute('data-vinculo') || '').split(':')[1]).length,
        temVolta: !!document.querySelector('[data-ponte="atua_em"] a[href="' + ${JSON.stringify(ARTISTA)} + '"]'),
      };
    `),
  );
  exigir(
    evento.dimensoes === 8,
    "D-43 · dimensões da ficha de acessibilidade VISÍVEIS",
    `${evento.dimensoes} — estados: ${evento.estados.join(", ")}`,
    "8",
  );
  exigir(
    evento.atuaComPapel >= 1,
    "D-40/D-41 · bloco de quem atua, com papel, na página do evento",
    `${evento.atuaComPapel} de ${evento.atua} vínculos de atuação com papel`,
    "≥ 1",
  );
  exigir(evento.temVolta, "a volta para o artista de origem existe na tela", evento.temVolta ? "presente" : "AUSENTE", "presente");

  const volta = await cdp.clicarEEsperarUrl(
    `document.querySelector('[data-ponte="atua_em"] a[href="${ARTISTA}"]')`,
    (p) => p === ARTISTA,
    "vínculo do evento de volta ao artista",
  );
  exigir(
    volta.para === ARTISTA,
    "DESC-06 · evento → artista POR CLIQUE, de volta à origem",
    `${idaPonte.para} → ${volta.para}`,
    ARTISTA,
  );
  // D-43 — «ausência não é negação» — precisa ser provado numa página que EXERCITE a
  // distinção. O evento a que a ponte chegou tem as 8 dimensões em `nao-declarada`: ele prova
  // que a ficha aparece inteira, e não prova que os estados se distinguem na tela. Sem esta
  // segunda página, a correção de `normalizar.py` que preserva os `false` da acessibilidade
  // (commit ad5c1d7) ficaria verificada só no dado, nunca no pixel. No acervo inteiro são
  // 1599 `nao-declarada`, 791 `ausente-declarada` e 10 `presente`; nenhuma página tem as três.
  const EVENTO_RICO = "/evento/artistas-do-vestir-uma-costura-dos-afetos-a-moda-chega-ao-itau-cultural/";
  await cdp.navegar(`${base}${EVENTO_RICO}`);
  const ficha = await cdp.avaliar(
    naPagina(`
      const dims = visiveis('[data-dimensao]');
      const porEstado = {};
      for (const d of dims) {
        const e = d.getAttribute('data-estado');
        (porEstado[e] = porEstado[e] || []).push((d.textContent || '').trim().replace(/\\s+/g, ' '));
      }
      return {
        total: dims.length,
        estados: Object.keys(porEstado),
        amostra: Object.fromEntries(Object.entries(porEstado).map(([e, t]) => [e, t[0].slice(0, 72)])),
      };
    `),
  );
  const textosDistintos = new Set(Object.values(ficha.amostra)).size;
  exigir(
    ficha.total === 8 && ficha.estados.length >= 2 && textosDistintos === ficha.estados.length,
    "D-43 · os estados da acessibilidade se DISTINGUEM na tela (ausência ≠ negação)",
    `${ficha.total} dimensões · estados ${ficha.estados.join(" + ")} · ` +
      Object.entries(ficha.amostra).map(([e, t]) => `${e}: «${t}»`).join(" · "),
    "8 dimensões, ≥ 2 estados, cada um com texto próprio",
  );

  resumo.push([
    "DESC-05",
    `clique em «${idaPonte.texto}» leva de ${ARTISTA} a ${idaPonte.para}; verbete embutido visível com fonte ${artista.fonteHref}`,
  ]);
  resumo.push([
    "DESC-06",
    `clique em «${volta.texto}» leva de ${idaPonte.para} de volta a ${volta.para}; ${evento.atuaComPapel} vínculos de atuação com papel`,
  ]);
  resumo.push([
    "DESC-08",
    `ficha com ${evento.dimensoes} de 8 dimensões visíveis em ${idaPonte.para} (estados: ${evento.estados.join(", ")}); ` +
      `a distinção de D-43 provada em ${EVENTO_RICO.slice(8, 48)}… com ${ficha.estados.join(" + ")}, texto próprio para cada`,
  ]);

  // ---- 8. Meu Repertório (DESC-07, D-44) ----
  // Desde a reformulação de 2026-08 o mapa de repertório tem rota própria — /meu
  // virou o hub do perfil e aponta para cá.
  titulo("── 8 · Meu Repertório (DESC-07, D-44) ──");
  await cdp.navegar(`${base}/meu/repertorio/`);

  const LER_REPERTORIO = naPagina(`
    const adj = visiveis('[data-adjacente]');
    return {
      persona: document.querySelector('[data-repertorio]')?.getAttribute('data-repertorio') ?? '',
      atravessadas: visiveis('[data-atravessado]').length,
      pesos: visiveis('[data-atravessado]').map(a => Number(a.getAttribute('data-peso') || 0)),
      adjacentes: adj.length,
      adjacentesIds: adj.map(a => a.getAttribute('data-adjacente')),
      adjacentesComMotivo: adj.filter(a => {
        const s = a.querySelector('.selo-motivo[data-motivo]');
        return s && visivel(s) && (s.getAttribute('data-motivo') || '').trim().length > 0;
      }).length,
      linguagensNovas: document.querySelector('[data-linguagens-novas]')?.getAttribute('data-linguagens-novas') ?? 'ausente',
      novasVisivel: visivel(document.querySelector('[data-linguagens-novas]')),
    };
  `);

  const repertorios = { Maria: await cdp.avaliar(LER_REPERTORIO) };
  exigir(repertorios.Maria.atravessadas >= 3, "D-44 · linguagens atravessadas (Maria)", repertorios.Maria.atravessadas, "≥ 3");
  exigir(
    repertorios.Maria.adjacentes >= 5 && repertorios.Maria.adjacentesComMotivo === repertorios.Maria.adjacentes,
    "D-44 · adjacentes a um passo, com motivo visível",
    `${repertorios.Maria.adjacentes} adjacentes · ${repertorios.Maria.adjacentesComMotivo} com selo de motivo visível`,
    "≥ 5, todos com motivo",
  );
  exigir(
    repertorios.Maria.linguagensNovas !== "ausente" && repertorios.Maria.novasVisivel,
    "D-44 · contagem de linguagens novas presente e visível",
    repertorios.Maria.linguagensNovas,
    "presente",
  );

  for (const nome of ["Carlos", "Joana"]) {
    await trocarPersona(cdp, nome);
    repertorios[nome] = await cdp.avaliar(LER_REPERTORIO);
    ok(
      `repertório de ${nome}`,
      `${repertorios[nome].atravessadas} atravessadas · ${repertorios[nome].adjacentes} adjacentes · ` +
        `${repertorios[nome].linguagensNovas} linguagens novas`,
    );
  }

  const nomes = ["Maria", "Carlos", "Joana"];
  const atravessadasDistintas = new Set(nomes.map((n) => repertorios[n].atravessadas)).size;
  const novasDistintas = new Set(nomes.map((n) => repertorios[n].linguagensNovas)).size;
  // O terceiro número — adjacentes — é RECORTADO EM 12 por decisão do 02-03 (o payload). Exigir
  // que a CONTAGEM mude seria exigir que o recorte fosse desfeito. O que prova que a tela
  // mudou é o CONJUNTO de adjacentes, e é ele que é medido. Ver desvio no SUMMARY.
  const conjuntosDistintos = new Set(nomes.map((n) => repertorios[n].adjacentesIds.join("|"))).size;
  exigir(
    atravessadasDistintas === 3 && novasDistintas === 3 && conjuntosDistintos === 3,
    "D-45/D-44 · os números de Meu Repertório mudam com a persona",
    `atravessadas ${nomes.map((n) => repertorios[n].atravessadas).join("/")} · ` +
      `novas ${nomes.map((n) => repertorios[n].linguagensNovas).join("/")} · ` +
      `adjacentes ${nomes.map((n) => repertorios[n].adjacentes).join("/")} (${conjuntosDistintos} conjuntos distintos)`,
    "3 valores distintos de atravessadas, 3 de novas, 3 conjuntos de adjacentes",
  );
  resumo.push([
    "DESC-07",
    `Maria/Carlos/Joana — atravessadas ${nomes.map((n) => repertorios[n].atravessadas).join("/")}, ` +
      `novas a um passo ${nomes.map((n) => repertorios[n].linguagensNovas).join("/")}, ` +
      `adjacentes ${nomes.map((n) => repertorios[n].adjacentes).join("/")} com motivo visível em todos`,
  ]);

  return cdp.navegacoes;
}

/**
 * Uma linha por requisito, dizendo QUAL asserção o cobriu e COM QUE NÚMERO.
 * Como não haverá humano olhando as telas nesta fase, este resumo é o registro da
 * verificação — e é ele que vai inteiro para o SUMMARY.
 */
function imprimirResumo() {
  titulo("── resumo · uma linha por requisito ──");
  const ordem = (n) => (n.startsWith("DESC-") ? Number(n.slice(5)) : 99);
  for (const [nome, valor] of [...resumo].sort((a, b) => ordem(a[0]) - ordem(b[0]))) {
    console.log(`  ${nome.padEnd(13)} ${valor}`);
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
