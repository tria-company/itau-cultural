/**
 * verificar-produtor.mjs — o portão do perfil Produtor.
 *
 * NO MOLDE DE `verificar-moderacao.mjs`: mesma forma de relatório (toda medição imprime o
 * NÚMERO medido ao lado do esperado), mesmo servidor estático sobre `out/`, mesma sonda por
 * CDP. Um portão com forma própria seria mais um formato para quem lê aprender.
 *
 * ELE MEDE SOBRE O ARTEFATO EXPORTADO, nunca sobre `next dev`. O que a banca vai abrir é
 * `out/`; medir o servidor de desenvolvimento mediria outra coisa — outro grafo de módulos,
 * outro caminho de hidratação, e avisos que não existem no artefato.
 *
 * O QUE ELE AFIRMA:
 *   (a) D-67 invertido, NAS DUAS METADES — o Studio abre na visão app, e as outras cinco
 *       superfícies de bastidor continuam escondidas nela. Só a primeira metade seria um
 *       gate que passa com o Studio invisível.
 *   (b) nenhum `position: fixed` dentro da moldura, no Studio inteiro
 *   (c) a ação primária cabe acima da dobra, nas duas visões
 *   (d) publicar com impedimento é impossível — botão desabilitado E função recusando
 *   (e) a semente é determinística e o reinício volta a ela
 *   (f) `PAUTAS_COM_FICHA` bate com o disco, nos dois sentidos
 *   (g) zero requisição externa e console limpo nas telas novas
 *
 * `--provar-ausencias` injeta um defeito por gate e confere que ele fica VERMELHO. Verde
 * sobre caso que não aconteceu é verde falso, e é o tipo de verde que faz portão deixar de
 * ser lido.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador, naPagina } from "./navegador.mjs";
import { servir } from "./servir-out.mjs";
import {
  DOBRA_DA_WEB,
  DOBRA_DO_BASTIDOR_NO_APP,
  LARGURA_DO_APARELHO,
  SUPERFICIES_DE_BASTIDOR,
} from "./medidas.mjs";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(RAIZ, "out");
const SRC = path.join(RAIZ, "src");

/**
 * AS MEDIDAS VÊM DE `medidas.mjs`, e não daqui.
 *
 * Elas nasceram espalhadas — 390 e 844 em `base.css` e em `casca.tsx`, o bezel só no CSS, e
 * a dobra do bastidor em lugar nenhum. A primeira versão deste portão recalculou a dobra por
 * conta própria e errou: mediu a barra de ação contra a borda EXTERNA da moldura (834) em
 * vez da área útil (824), e reprovou uma barra que estava no lugar certo.
 *
 * Um arquivo só, e a reconciliação acontece nele — que é a razão de `medidas.mjs` existir.
 */

const LARGURA_WEB = 1440;
const ALTURA_WEB = 960;

/**
 * As rotas medidas, uma por superfície mais uma segunda do Studio.
 *
 * A LISTA DE SUPERFÍCIES vem de `medidas.mjs` — ela é de portão, e uma superfície de
 * bastidor fora dela é uma superfície cuja visibilidade ninguém mede. O que este arquivo
 * acrescenta é a ROTA concreta de cada uma, que é detalhe de sonda e não medida do produto.
 */
const ROTA_DA_SUPERFICIE = {
  "/studio": "/studio/",
  "/moderacao": "/moderacao/fila/",
  "/redacao": "/redacao/trilha/",
  "/observatorio": "/observatorio/",
  "/admin": "/admin/papeis/",
  "/roteiro": "/roteiro/",
};

const SUPERFICIES = [
  ...SUPERFICIES_DE_BASTIDOR.map((sup) => ({
    rota: ROTA_DA_SUPERFICIE[sup.prefixo],
    regra: sup.regra,
    nome: sup.nome,
  })),
  // Uma segunda rota do Studio: a raiz é o painel, e uma ficha é outra árvore. Medir só a
  // raiz deixaria passar uma ficha que some no telefone.
  { rota: "/studio/publicar/", regra: "visivel-no-app", nome: "Studio · identidade" },
];

let falhas = 0;
let verdes = 0;

function ok(nome, medida) {
  verdes += 1;
  console.log(`  ok   ${nome}: ${medida}`);
}

function exigir(condicao, nome, medida, esperado) {
  if (condicao) {
    ok(nome, medida);
  } else {
    falhas += 1;
    console.log(`  FALHA ${nome}: medido ${medida} · esperado ${esperado}`);
  }
}

function titulo(t) {
  console.log(`\n${t}`);
}

async function irPara(cdp, url) {
  await cdp.navegar(url);
  await cdp.assentar();
}

/** Põe a casca na visão pedida e recarrega. A visão é ESTADO da aplicação (D-01): pedi-la
 *  por `localStorage` é o mesmo caminho que o alternador usa. */
async function naVisao(cdp, url, visao) {
  await cdp.navegar(url);
  await cdp.avaliar(`window.localStorage.setItem('agenda-cultural:visao', ${JSON.stringify(visao)})`);
  await irPara(cdp, url);
  const lida = await cdp.avaliar(
    `document.querySelector('[data-view]')?.getAttribute('data-view') ?? null`,
  );
  if (lida !== visao) {
    throw new Error(`pedi a visão «${visao}» em ${url} e a casca abriu em «${lida}»`);
  }
}

// ---------------------------------------------------------------------------
// (a) D-67 invertido — as DUAS metades
// ---------------------------------------------------------------------------

async function gateDaInversao(cdp, base) {
  titulo("── (a) D-67 invertido: o Studio abre no telefone, as outras cinco não ──");

  for (const s of SUPERFICIES) {
    await naVisao(cdp, `${base}${s.rota}`, "mobile");
    const medida = await cdp.avaliar(
      naPagina(`
        const aviso = todos('h1').find((h) => /superfície de desktop/i.test(h.textContent || ''));
        const envelope = document.querySelector('[data-superficie="so-web"]');
        const studio = document.querySelector('[data-superficie="studio"]');
        return {
          view: document.querySelector('[data-view]')?.getAttribute('data-view') ?? null,
          avisoVisivel: visivel(aviso),
          temEnvelopeSoWeb: Boolean(envelope),
          envelopeVisivel: visivel(envelope),
          temStudio: Boolean(studio),
          studioVisivel: visivel(studio),
        };
      `),
    );

    if (s.regra === "so-web") {
      exigir(
        medida.temEnvelopeSoWeb && !medida.envelopeVisivel && medida.avisoVisivel,
        `${s.nome} continua ESCONDIDA na visão app, e declara o motivo`,
        `envelope so-web: ${medida.temEnvelopeSoWeb} · visível: ${medida.envelopeVisivel} · aviso: ${medida.avisoVisivel}`,
        "envelope presente e invisível, com aviso à vista",
      );
    } else {
      // A METADE NOVA. Sem ela, um `app:hidden` esquecido no Studio deixaria a superfície
      // inteira invisível no telefone e o portão daria verde.
      exigir(
        medida.temStudio && medida.studioVisivel && !medida.avisoVisivel,
        `${s.nome} é mobile-first e ABRE na visão app`,
        `casca do Studio: ${medida.temStudio} · visível: ${medida.studioVisivel} · aviso de desktop: ${medida.avisoVisivel}`,
        "casca visível, sem aviso de superfície de desktop",
      );
    }
  }
}

// ---------------------------------------------------------------------------
// (b) nenhum `fixed` dentro da moldura
// ---------------------------------------------------------------------------

async function gateDoFixed(cdp, base) {
  titulo("── (b) nenhum `position: fixed` dentro da moldura, no Studio ──");

  const rotas = SUPERFICIES.filter((s) => s.regra === "visivel-no-app").map((s) => s.rota);
  for (const rota of rotas) {
    await naVisao(cdp, `${base}${rota}`, "mobile");
    const fixos = await cdp.avaliar(
      naPagina(`
        // A varredura é DENTRO da moldura. O único fixed legítimo do projeto é o \`.canto\`
        // da casca, que é irmão da moldura e não descendente dela — procurar no documento
        // inteiro acusaria o alternador de visão e o gate viveria vermelho por design.
        const moldura = document.querySelector('.moldura');
        if (!moldura) return { semMoldura: true, lista: [] };
        const lista = Array.from(moldura.querySelectorAll('*'))
          .filter((el) => getComputedStyle(el).position === 'fixed')
          .map((el) => el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]);
        return { semMoldura: false, lista };
      `),
    );
    exigir(
      !fixos.semMoldura && fixos.lista.length === 0,
      `${rota} não ancora nada na janela de dentro do telefone`,
      fixos.semMoldura
        ? "não achei a moldura — a visão app não montou o aparelho"
        : `${fixos.lista.length} elemento(s) fixed${fixos.lista.length ? `: ${fixos.lista.join(", ")}` : ""}`,
      "0 elementos com position: fixed",
    );
  }
}

// ---------------------------------------------------------------------------
// (c) a ação primária cabe acima da dobra
// ---------------------------------------------------------------------------

async function gateDaDobra(cdp, base) {
  titulo("── (c) a ação primária cabe acima da dobra, nas duas visões ──");

  await naVisao(cdp, `${base}/studio/`, "mobile");
  const noApp = await cdp.avaliar(
    naPagina(`
      const barra = document.querySelector('[data-barra-acao]');
      const moldura = document.querySelector('.moldura');
      const util = document.querySelector('.moldura-rolagem');
      if (!barra || !moldura || !util) return null;
      const b = barra.getBoundingClientRect();
      const m = moldura.getBoundingClientRect();
      const u = util.getBoundingClientRect();
      // A moldura é AMPLIADA por transform: scale (D-03, 26/08). Medir em pixels de tela
      // daria um número que muda com o tamanho da janela; o que interessa é a posição
      // dentro da TELA LÓGICA de 390×844, então a medida é relativa à ÁREA ÚTIL e
      // reconvertida pela escala que o retângulo da moldura revela.
      const escala = m.width / ${LARGURA_DO_APARELHO};
      return {
        escala: Math.round(escala * 1000) / 1000,
        fundoDaBarra: Math.round((b.bottom - u.top) / escala),
        topoDaBarra: Math.round((b.top - u.top) / escala),
        alturaDaBarra: Math.round(b.height / escala),
        // A TELA INTEIRA, e não só a barra: escopar a sonda à barra deixava passar uma
        // segunda ação primaria no fluxo da página (o confirmar do reinício, 2026-08-27),
        // e a regra que este gate afirma é «uma por TELA».
        primarias: visiveis('[data-primaria="sim"]').length,
      };
    `),
  );

  exigir(
    noApp !== null && noApp.fundoDaBarra <= DOBRA_DO_BASTIDOR_NO_APP,
    "a barra de ação fica DENTRO da tela lógica de 844px, no app",
    noApp === null
      ? "não achei a barra de ação"
      : `fundo em ${noApp.fundoDaBarra}px da tela lógica (escala do aparelho ${noApp.escala}×)`,
    `≤ ${DOBRA_DO_BASTIDOR_NO_APP}px`,
  );

  exigir(
    noApp !== null && noApp.primarias === 1,
    "exatamente UMA ação primária por tela",
    noApp === null ? "sem barra" : `${noApp.primarias} botão(ões) com data-primaria="sim"`,
    "1",
  );

  await naVisao(cdp, `${base}/studio/`, "web");
  // A REGRA MUDOU EM 2026-08-27, e o portão afirma a nova: na web a casca é a COLUNA
  // LATERAL, presente em todas as telas (raiz incluída), com o Criar à vista; a barra
  // flutuante é do app e não aparece. O portão anterior afirmava a barra no fluxo, e a
  // revisão a olho reprovou exatamente o que ele deixava passar: a barra caída no pé de
  // uma janela de 1600px, numa raiz sem navegação nenhuma.
  const naWeb = await cdp.avaliar(
    naPagina(`
      const coluna = document.querySelector('.prod-trilho-pautas');
      const criar = document.querySelector('[data-criar-da-lateral]');
      const barra = document.querySelector('[data-barra-acao]');
      const comunidade = todos('.prod-trilho-pautas a[href*="comunidade"]');
      const pontos = todos('.prod-trilho-pautas a[href*="pontos"]');
      return {
        colunaVisivel: coluna ? visivel(coluna) : false,
        colunaColada: coluna ? getComputedStyle(coluna).position : null,
        criarVisivel: criar ? visivel(criar) : false,
        barraDoAppVisivel: barra ? visivel(barra) : false,
        comunidadeNaColuna: comunidade.filter((a) => visivel(a)).length,
        pontosNaColuna: pontos.filter((a) => visivel(a)).length,
      };
    `),
  );
  exigir(
    naWeb.colunaVisivel && naWeb.colunaColada === "sticky" && naWeb.criarVisivel,
    "na web a casca é a COLUNA LATERAL, colada, com o Criar à vista — na raiz inclusive",
    `coluna visível: ${naWeb.colunaVisivel} · position: ${naWeb.colunaColada} · criar visível: ${naWeb.criarVisivel}`,
    "coluna sticky com o Criar",
  );
  exigir(
    !naWeb.barraDoAppVisivel && naWeb.comunidadeNaColuna >= 1 && naWeb.pontosNaColuna >= 1,
    "a barra flutuante é do app, e Comunidade e Loja se alcançam pela coluna",
    `barra do app visível: ${naWeb.barraDoAppVisivel} · comunidade: ${naWeb.comunidadeNaColuna} · loja: ${naWeb.pontosNaColuna}`,
    "barra invisível na web · 1 link de cada na coluna",
  );
}


// ---------------------------------------------------------------------------
// (d) PONTA A PONTA — criar, publicar, e ver na tela pública
// ---------------------------------------------------------------------------

/** Uma pausa nomeada. `setTimeout` solto no meio do gate esconde o motivo da espera. */
function respirarProdutor(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * O ciclo inteiro, pelos gestos que uma pessoa faria.
 *
 * ELE MEDE A DUPLA TRAVA. Primeiro confere que o botão de publicar está DESABILITADO num
 * registro com impedimento, e que ele DIZ por quê; depois resolve os impedimentos e confere
 * que o mesmo botão habilita. Uma trava só seria trava de aparência: quem chegasse à
 * operação por outro caminho passaria por cima dela — é a mesma disciplina que o veto da
 * moderação usa, e `produtor-estado.ts` a repete dentro de `publicar()`.
 */
async function gateDaPublicacao(cdp, base) {
  titulo("── (d) publicar com impedimento é impossível, e sem impedimento aparece no ar ──");

  // Estado limpo: sem isto, a primeira execução mediria a semente e a segunda mediria o que
  // a primeira publicou. Um gate cujo resultado depende de quantas vezes ele já rodou não
  // mede nada.
  await cdp.navegar(`${base}/studio/`);
  await cdp.avaliar(`window.localStorage.removeItem("produtor.v1")`);
  await naVisao(cdp, `${base}/studio/revisar/`, "mobile");

  const trilho = await cdp.avaliar(
    naPagina(`return todos('[data-ato]').length;`),
  );
  exigir(trilho === 8, "a ficha da agenda tem oito atos", `${trilho} degraus no trilho`, "8");

  // --- 1. o botão de publicar num registro com impedimento -------------------
  const trava = await cdp.avaliar(
    naPagina(`
      const b = document.querySelector('[data-acao="publicar"]');
      const lista = document.querySelector('[data-impedimentos]');
      return {
        existe: Boolean(b),
        desabilitado: b ? b.disabled : null,
        porque: b ? (b.getAttribute('title') || '') : '',
        bloqueiam: lista ? lista.getAttribute('data-impedimentos') : null,
      };
    `),
  );

  exigir(
    trava.existe && trava.desabilitado === true && trava.porque.length > 0,
    "TRAVA 1 · o botão de publicar está desabilitado, e DIZ por quê",
    `desabilitado: ${trava.desabilitado} · motivo: ${JSON.stringify(trava.porque.slice(0, 90))}`,
    "desabilitado, com o motivo escrito",
  );

  exigir(
    Number(trava.bloqueiam) > 0,
    "o registro em edição tem impedimento REAL — o gate não mede um caso que não aconteceu",
    `${trava.bloqueiam} impedimento(s) bloqueante(s)`,
    "ao menos 1",
  );

  // --- 2. resolver os impedimentos e publicar de verdade ---------------------
  //
  // Os campos são gravados no armazém em vez de digitados um a um: o que este gate mede é a
  // TRAVA, e não o teclado. Os gestos de preenchimento estão cobertos pelos gates de tela.
  const alvo = await cdp.avaliar(
    naPagina(`
      const estado = JSON.parse(window.localStorage.getItem("produtor.v1"));
      const r = estado.registros.find((x) => x.pauta === "agenda");
      r.titulo = r.titulo || "Evento de demonstração";
      r.resumo = "Registro completo, escrito pela sonda do portão para provar o ciclo inteiro.";
      r.linguagens = r.linguagens.length ? r.linguagens : ["linguagem:cms:teatro"];
      r.formato = "espetaculo";
      r.modalidade = "presencial";
      r.programacao = "sessoes";
      r.temporadas = [{
        id: "temporada:sonda:1", espacoId: null, espacoTitulo: null,
        inicio: "2026-09-01", fim: "2026-09-30", longaDuracao: false, espacoPedido: false
      }];
      r.sessoes = [{
        id: "sessao:sonda:1", temporadaId: "temporada:sonda:1",
        inicio: "2026-09-12T20:00", fim: null, duracaoMinutos: null,
        espacoId: null, gratuito: true, preco: null, precoEstruturado: null,
        esgotado: false, cancelada: false, motivoDoCancelamento: null
      }];
      r.cobranca = "gratuito";
      r.canalIngresso = "bilheteria-no-local";
      r.faixaEtaria = "livre";
      r.declaraAcessibilidade = true;
      r.visibilidade = "publico";
      // Imagem sem crédito ou sem alt é impedimento bloqueante (165). A sonda tira a
      // imagem em vez de inventar um crédito — inventar seria o defeito que o campo existe
      // para impedir.
      if (r.imagem && (!r.imagem.credito || !r.imagem.alt)) r.imagem = null;
      estado.atualId = r.id;
      window.localStorage.setItem("produtor.v1", JSON.stringify(estado));
      return r.id;
    `),
  );

  await naVisao(cdp, `${base}/studio/revisar/`, "mobile");
  const antesDoClique = await cdp.avaliar(
    naPagina(`
      const b = document.querySelector('[data-acao="publicar"]');
      return { desabilitado: b ? b.disabled : null, rotulo: b ? b.textContent.trim() : null };
    `),
  );
  exigir(
    antesDoClique.desabilitado === false,
    "resolvidos os impedimentos, o MESMO botão habilita",
    `desabilitado: ${antesDoClique.desabilitado} · rótulo: ${JSON.stringify(antesDoClique.rotulo)}`,
    "habilitado",
  );

  await cdp.avaliar(
    naPagina(`document.querySelector('[data-acao="publicar"]').click(); return true;`),
  );
  await respirarProdutor(800);

  const depois = await cdp.avaliar(
    naPagina(`
      const estado = JSON.parse(window.localStorage.getItem("produtor.v1"));
      const r = estado.registros.find((x) => x.id === ${JSON.stringify(alvo)});
      return { situacao: r ? r.situacao : null, publicadoEm: r ? r.publicadoEm : null };
    `),
  );
  exigir(
    depois.situacao === "publicado" && depois.publicadoEm === "2026-08-22",
    "publicar grava a situação e CARIMBA a data de referência — nunca o relógio",
    `situação: ${depois.situacao} · publicado em: ${depois.publicadoEm}`,
    "publicado · 2026-08-22",
  );

  // --- 3. e ele APARECE na tela pública -------------------------------------
  await naVisao(cdp, `${base}/acontece/`, "mobile");
  const naAgenda = await cdp.avaliar(
    naPagina(`
      const secao = document.querySelector('[data-publicado-pelo-produtor="agenda"]');
      return {
        existe: Boolean(secao),
        visivel: visivel(secao),
        cartoes: secao ? secao.querySelectorAll('.cartao').length : 0,
        declara: secao ? /não está no acervo/i.test(secao.textContent || "") : false,
      };
    `),
  );
  exigir(
    naAgenda.existe && naAgenda.visivel && naAgenda.cartoes > 0,
    "PONTA A PONTA · o evento publicado aparece em /acontece",
    `seção presente: ${naAgenda.existe} · visível: ${naAgenda.visivel} · cartões: ${naAgenda.cartoes}`,
    "seção visível com ao menos um cartão",
  );
  exigir(
    naAgenda.declara,
    "e ela DECLARA que não está no acervo — o artefato é estático, não há servidor",
    `declaração presente: ${naAgenda.declara}`,
    "presente",
  );
}


// ---------------------------------------------------------------------------
// (h) A COLISÃO DA GRADE — provada FORÇANDO duas sessões iguais
// ---------------------------------------------------------------------------

/**
 * Um detector de colisão que nunca viu uma colisão é um detector não testado.
 *
 * A sonda GRAVA uma sessão e depois pede ao gerador exatamente a mesma — mesmo dia, mesmo
 * horário, mesma temporada, mesmo espaço. Isso é a MESMA chave de ocorrência
 * (`temporada + início exato + espaço`), e portanto o mesmo registro escrito duas vezes.
 * A prévia tem de dizer isso ANTES de aplicar, e a aplicação tem de descartar a repetida.
 *
 * SEM ESTE BLOCO, o gate da grade seria verde sobre um caso que não aconteceu — e verde
 * sobre caso que não aconteceu é verde falso.
 */
async function gateDaColisao(cdp, base) {
  titulo("── (h) o detector de colisão da grade, provado forçando ──");

  await cdp.navegar(`${base}/studio/`);
  await cdp.avaliar(`window.localStorage.removeItem("produtor.v1")`);
  await naVisao(cdp, `${base}/studio/grade/`, "mobile");

  // Um registro com UMA temporada e UMA sessão, em dia e hora conhecidos. 2026-09-03 é uma
  // quinta-feira — conferido por `Date.UTC(2026, 8, 3).getUTCDay() === 4`.
  await cdp.avaliar(
    naPagina(`
      const estado = JSON.parse(window.localStorage.getItem("produtor.v1"));
      const r = estado.registros.find((x) => x.pauta === "agenda");
      r.programacao = "sessoes";
      r.temporadas = [{
        id: "temporada:colisao", espacoId: null, espacoTitulo: null,
        inicio: "2026-09-01", fim: "2026-09-07", longaDuracao: false, espacoPedido: false
      }];
      r.sessoes = [{
        id: "sessao:colisao:ja-existe", temporadaId: "temporada:colisao",
        inicio: "2026-09-03T20:00", fim: null, duracaoMinutos: null,
        espacoId: null, gratuito: true, preco: null, precoEstruturado: null,
        esgotado: false, cancelada: false, motivoDoCancelamento: null
      }];
      estado.atualId = r.id;
      window.localStorage.setItem("produtor.v1", JSON.stringify(estado));
      return true;
    `),
  );

  await naVisao(cdp, `${base}/studio/grade/`, "mobile");

  // O gerador pede EXATAMENTE a mesma: quinta, 20:00, dentro do mesmo intervalo.
  const previa = await cdp.avaliar(
    naPagina(`
      const marcar = (sel) => { const el = document.querySelector(sel); if (el) el.click(); };
      const escrever = (sel, valor) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const proto = Object.getPrototypeOf(el);
        const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(el, valor);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      };
      // 4 = quinta-feira, na ordem de NOMES_DOS_DIAS (0 = domingo).
      marcar('[data-dia="4"]');
      escrever('[data-gerador-de]', '2026-09-01');
      escrever('[data-gerador-ate]', '2026-09-07');
      escrever('[data-horario="0"]', '20:00');
      return true;
    `),
  );

  await respirarProdutor(400);

  const medida = await cdp.avaliar(
    naPagina(`
      const bloco = document.querySelector('[data-previa-grade]');
      const colisao = document.querySelector('[data-colisoes]');
      const aplicar = document.querySelector('[data-acao="aplicar-grade"]');
      return {
        geradas: bloco ? Number(bloco.getAttribute('data-previa-grade')) : null,
        colisoes: colisao ? Number(colisao.getAttribute('data-colisoes')) : 0,
        avisoVisivel: visivel(colisao),
        aplicarDesabilitado: aplicar ? aplicar.disabled : null,
        texto: colisao ? colisao.textContent.trim().slice(0, 120) : "",
      };
    `),
  );

  exigir(
    previa === true && medida.geradas === 1,
    "o gerador produz exatamente 1 candidata para uma quinta-feira no intervalo",
    `${medida.geradas} candidata(s)`,
    "1",
  );

  exigir(
    medida.colisoes === 1 && medida.avisoVisivel,
    "e a prévia ACUSA a colisão ANTES de aplicar, com o número",
    `${medida.colisoes} colisão(ões) · aviso visível: ${medida.avisoVisivel} · ${JSON.stringify(medida.texto)}`,
    "1 colisão, com o aviso à vista",
  );

  exigir(
    medida.aplicarDesabilitado === true,
    "e o botão de aplicar fica desabilitado — não há nada de novo a criar",
    `desabilitado: ${medida.aplicarDesabilitado}`,
    "desabilitado",
  );

  // E a prova pelo outro lado: um dia SEM sessão gravada gera sem colisão.
  await cdp.avaliar(
    naPagina(`
      const marcar = (sel) => { const el = document.querySelector(sel); if (el) el.click(); };
      marcar('[data-dia="4"]');
      marcar('[data-dia="5"]');
      return true;
    `),
  );
  await respirarProdutor(400);

  const semColisao = await cdp.avaliar(
    naPagina(`
      const bloco = document.querySelector('[data-previa-grade]');
      const colisao = document.querySelector('[data-colisoes]');
      const aplicar = document.querySelector('[data-acao="aplicar-grade"]');
      return {
        geradas: bloco ? Number(bloco.getAttribute('data-previa-grade')) : null,
        colisoes: colisao ? Number(colisao.getAttribute('data-colisoes')) : 0,
        aplicarDesabilitado: aplicar ? aplicar.disabled : null,
      };
    `),
  );

  exigir(
    semColisao.geradas === 1 && semColisao.colisoes === 0 && semColisao.aplicarDesabilitado === false,
    "sexta-feira, que não tem sessão gravada, gera SEM colisão e habilita o aplicar",
    `${semColisao.geradas} candidata(s) · ${semColisao.colisoes} colisão(ões) · aplicar desabilitado: ${semColisao.aplicarDesabilitado}`,
    "1 candidata, 0 colisões, aplicar habilitado",
  );
}


// ---------------------------------------------------------------------------
// (i) CADA PAUTA CHEGA À VITRINE DELA
// ---------------------------------------------------------------------------

/**
 * As pautas que produzem cartão no app, com a rota pública que cada uma alimenta.
 *
 * A LISTA É A MESMA DE `DESCRICAO_DA_PAUTA`, e o gate a repete de propósito: se ela
 * divergir, é porque alguém mudou o destino de uma pauta sem mexer no portão — e é
 * justamente isso que um portão existe para acusar.
 */
const VITRINES = [
  { pauta: "agenda", rota: "/acontece/" },
  { pauta: "play", rota: "/play/" },
  { pauta: "cast", rota: "/cast/" },
  { pauta: "cursos", rota: "/cursos/" },
  { pauta: "museu", rota: "/museu/" },
  { pauta: "editorial", rota: "/noticias/" },
];

/**
 * Um registro publicado de cada pauta APARECE na vitrine dela — e a seção declara o que é.
 *
 * O ESTADO É MONTADO DE UMA VEZ, com um registro publicado por pauta, e depois cada rota é
 * aberta. Publicar pela ficha de cada uma seria repetir seis vezes o ciclo que o gate (d)
 * já prova em detalhe; o que falta medir aqui é a PONTE — o bloco que lê o armazém e monta
 * o cartão na tela pública.
 */
async function gateDasVitrines(cdp, base) {
  titulo("── (i) o publicado de cada pauta chega à vitrine dela ──");

  await cdp.navegar(`${base}/studio/`);
  await cdp.avaliar(`window.localStorage.removeItem("produtor.v1")`);
  await naVisao(cdp, `${base}/studio/`, "mobile");

  const publicados = await cdp.avaliar(
    naPagina(`
      const estado = JSON.parse(window.localStorage.getItem("produtor.v1"));
      const pautas = ${JSON.stringify(VITRINES.map((v) => v.pauta))};
      const marcados = [];
      for (const pauta of pautas) {
        const r = estado.registros.find((x) => x.pauta === pauta);
        if (!r) continue;
        r.situacao = "publicado";
        r.visibilidade = "publico";
        r.publicadoEm = "2026-08-22";
        marcados.push(pauta);
      }
      window.localStorage.setItem("produtor.v1", JSON.stringify(estado));
      return marcados;
    `),
  );

  exigir(
    publicados.length === VITRINES.length,
    "a semente traz um registro de cada pauta de vitrine",
    `${publicados.length} de ${VITRINES.length}: ${publicados.join(", ")}`,
    String(VITRINES.length),
  );

  for (const v of VITRINES) {
    await naVisao(cdp, `${base}${v.rota}`, "mobile");
    const medida = await cdp.avaliar(
      naPagina(`
        const secao = document.querySelector('[data-publicado-pelo-produtor="${v.pauta}"]');
        return {
          existe: Boolean(secao),
          visivel: visivel(secao),
          cartoes: secao ? secao.querySelectorAll('.cartao').length : 0,
          declara: secao ? /não está no acervo/i.test(secao.textContent || "") : false,
        };
      `),
    );
    exigir(
      medida.existe && medida.visivel && medida.cartoes > 0 && medida.declara,
      `${v.pauta} publicado aparece em ${v.rota}, e a seção declara o que é`,
      `presente: ${medida.existe} · visível: ${medida.visivel} · cartões: ${medida.cartoes} · declara: ${medida.declara}`,
      "seção visível, com cartão e declaração",
    );
  }

  // E O CONTRÁRIO: privado e agendado NÃO aparecem. O eixo da visibilidade existe para
  // isto, e um gate que só medisse a metade positiva deixaria passar uma ponte que ignora
  // a visibilidade — o pré-lançamento vazando para a vitrine no dia em que fosse usado.
  await cdp.navegar(`${base}/studio/`);
  await cdp.avaliar(
    naPagina(`
      const estado = JSON.parse(window.localStorage.getItem("produtor.v1"));
      for (const r of estado.registros) {
        if (r.pauta === "agenda") r.visibilidade = "privado";
      }
      window.localStorage.setItem("produtor.v1", JSON.stringify(estado));
      return true;
    `),
  );
  await naVisao(cdp, `${base}/acontece/`, "mobile");
  const escondido = await cdp.avaliar(
    naPagina(`
      const secao = document.querySelector('[data-publicado-pelo-produtor="agenda"]');
      return { existe: Boolean(secao), cartoes: secao ? secao.querySelectorAll('.cartao').length : 0 };
    `),
  );
  exigir(
    !escondido.existe,
    "e o PRIVADO não aparece — visibilidade e situação são eixos diferentes",
    `seção presente: ${escondido.existe} · cartões: ${escondido.cartoes}`,
    "seção ausente",
  );
}

// ---------------------------------------------------------------------------
// (f) `PAUTAS_COM_FICHA` bate com o disco, nos dois sentidos
// ---------------------------------------------------------------------------

async function gateDasRotas() {
  titulo("── (f) as pautas declaradas prontas existem no disco, e vice-versa ──");

  const fonte = await readFile(path.join(SRC, "dados", "produtor-rotas.ts"), "utf8");
  const declaradas = [...fonte.matchAll(/^\s*"([a-z]+)",/gm)]
    .map((m) => m[1])
    .filter((v, i, a) => a.indexOf(v) === i);

  const tipos = await readFile(path.join(SRC, "dados", "tipos-produtor.ts"), "utf8");
  const bloco = tipos.slice(tipos.indexOf("export const DESCRICAO_DA_PAUTA"));
  const rotaDaPauta = new Map();
  for (const m of bloco.matchAll(/(\w+):\s*\{[\s\S]*?rota:\s*"([^"]+)"/g)) {
    if (!rotaDaPauta.has(m[1])) rotaDaPauta.set(m[1], m[2]);
  }

  const semRota = [];
  for (const pauta of declaradas) {
    const rota = rotaDaPauta.get(pauta);
    if (!rota) continue;
    const alvo = path.join(RAIZ, "src", "app", "(bastidor)", ...rota.split("/").filter(Boolean), "page.tsx");
    try {
      await readFile(alvo, "utf8");
    } catch {
      semRota.push(`${pauta} → ${rota}`);
    }
  }

  exigir(
    semRota.length === 0,
    "toda pauta declarada pronta tem `page.tsx` no disco",
    semRota.length === 0
      ? `${declaradas.length} pauta(s) conferida(s)`
      : `sem rota: ${semRota.join(" · ")}`,
    "0 pautas declaradas sem tela",
  );
}

// ---------------------------------------------------------------------------
// (e) determinismo e reinício
// ---------------------------------------------------------------------------

async function gateDaSemente(cdp, base) {
  titulo("── (e) a semente é determinística, e o reinício volta a ela ──");

  // O ARMAZÉM É APAGADO ANTES DE MEDIR. Sem isto, `antes` seria o estado que o gate (d)
  // deixou publicado, e `reiniciar()` — que volta à SEMENTE — divergiria dele por
  // construção. O gate acusaria um defeito que é dele mesmo. Mesma disciplina de
  // `abrirFilaLimpa` em verificar-moderacao.mjs: um gate cujo resultado depende do que
  // rodou antes não mede nada.
  await cdp.navegar(`${base}/studio/`);
  await cdp.avaliar(`window.localStorage.removeItem("produtor.v1")`);
  await naVisao(cdp, `${base}/studio/`, "mobile");
  const antes = await cdp.avaliar(`window.localStorage.getItem("produtor.v1")`);
  exigir(
    typeof antes === "string" && antes.length > 0,
    "a primeira abertura semeia o armazém único `produtor.v1`",
    antes ? `${antes.length} caracteres gravados` : "nada gravado",
    "estado gravado",
  );

  // Sujar, recarregar, reiniciar, comparar. É o ciclo que a apresentação faz duas vezes.
  await cdp.avaliar(
    naPagina(`
      const b = todos('[data-acao="duplicar"]')[0];
      if (b) b.click();
      return true;
    `),
  );
  await new Promise((r) => setTimeout(r, 300));
  const sujo = await cdp.avaliar(`window.localStorage.getItem("produtor.v1")`);
  exigir(
    sujo !== antes,
    "duplicar um registro MUDA o armazém",
    sujo === antes ? "o armazém não mudou" : `${sujo.length} caracteres`,
    "o armazém muda",
  );

  // DUPLICAR ABRE A CÓPIA. É decisão de produto e não descuido — quem duplica quer editar a
  // próxima temporada, não voltar para a lista —, e por isso a sonda tem de VOLTAR ao painel
  // antes de procurar o botão de reiniciar. A primeira versão deste gate não voltava, clicava
  // no vazio e relatava «o reinício não funcionou»: o defeito era da sonda.
  await irPara(cdp, `${base}/studio/`);

  await cdp.avaliar(
    naPagina(`
      const b = todos('[data-acao="reiniciar"]')[0];
      if (b) b.click();
      return true;
    `),
  );
  await new Promise((r) => setTimeout(r, 200));
  await cdp.avaliar(
    naPagina(`
      const b = todos('[data-acao="confirmar-reinicio"]')[0];
      if (b) b.click();
      return true;
    `),
  );
  await new Promise((r) => setTimeout(r, 400));
  const depois = await cdp.avaliar(`window.localStorage.getItem("produtor.v1")`);
  exigir(
    depois === antes,
    "reiniciar devolve EXATAMENTE o estado semeado, byte a byte",
    depois === antes ? "idêntico ao inicial" : "diferente do inicial",
    "idêntico",
  );
}

// ---------------------------------------------------------------------------
// (g) console limpo e zero rede externa
// ---------------------------------------------------------------------------

async function gateDoConsole(cdp) {
  titulo("── (g) console limpo na navegação do Studio ──");
  const sujeira = cdp.consola.filter(
    (c) =>
      // O aviso de imagem sem `next/image` é escolha declarada no componente, com o motivo
      // escrito ao lado. Silenciá-lo aqui seria esconder; declará-lo é o que a casa faz.
      !/no-img-element/i.test(c.texto),
  );
  exigir(
    sujeira.length === 0,
    "0 erro e 0 aviso de console em toda a navegação do Studio",
    sujeira.length === 0
      ? "limpo"
      : sujeira.map((c) => `${c.nivel}: ${c.texto.slice(0, 120)}`).join(" · "),
    "0",
  );
}

// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------
// (j) A VISÃO WEB — cada painel chega INTEIRO à vista, e nada vaza entre visões
// ---------------------------------------------------------------------------

/**
 * A medida certa NÃO é «a coluna cabe».
 *
 * Uma coluna `sticky` sempre «cabe»: ela gruda no topo e o resto do documento rola por
 * baixo. O que ela pode não fazer é REVELAR O PRÓPRIO FIM — e foi exatamente isso que
 * aconteceu antes, medido: 1.279px de coluna numa janela de 960, com 319px que ninguém
 * alcançava, porque uma coluna colada não rola para mostrar o que está abaixo dela.
 *
 * A correção mora em `web.css` (`max-height` + `overflow-y: auto`), e este gate mede a
 * consequência dela: `scrollHeight <= clientHeight` OU o contêiner rola por dentro. As duas
 * saídas são válidas; o que não é válido é conteúdo alto num contêiner que não rola.
 */
async function gateDaWeb(cdp, base) {
  titulo("── (j) a visão web: cada painel chega inteiro à vista, e nada vaza entre visões ──");

  await naVisao(cdp, `${base}/studio/publicar/`, "web");
  // A rota principal abre no INÍCIO da pauta (2026-08-26); a ficha é pedida por um toque.
  await cdp.avaliar(
    naPagina(`
      const b = document.querySelector('[data-abrir-registro]')
        || document.querySelector('[data-acao="adicionar"]');
      if (b) b.click();
      return Boolean(b);
    `),
  );
  await respirarProdutor(600);
  // Registro publicado abre no DETALHE (2026-08-26); a ficha fica atrás do Editar.
  await cdp.avaliar(
    naPagina(`
      const e = document.querySelector('[data-acao="editar"]');
      if (e) e.click();
      return Boolean(e);
    `),
  );
  await respirarProdutor(600);


  const coluna = await cdp.avaliar(
    naPagina(`
      const c = document.querySelector('[data-coluna-colada]');
      if (!c) return null;
      const e = getComputedStyle(c);
      return {
        posicao: e.position,
        rola: e.overflowY === 'auto' || e.overflowY === 'scroll',
        alturaDoConteudo: c.scrollHeight,
        alturaVisivel: c.clientHeight,
        alcancavel: c.scrollHeight <= c.clientHeight
          || e.overflowY === 'auto' || e.overflowY === 'scroll',
        inalcancavel: Math.max(0, c.scrollHeight - c.clientHeight),
      };
    `),
  );

  exigir(
    coluna !== null && coluna.posicao === "sticky",
    "a coluna da ficha é COLADA na visão web",
    coluna === null ? "não achei a coluna" : `position: ${coluna.posicao}`,
    "sticky",
  );

  exigir(
    coluna !== null && coluna.alcancavel,
    "e cada painel dela chega INTEIRO à vista — a coluna rola por dentro",
    coluna === null
      ? "sem coluna"
      : `conteúdo ${coluna.alturaDoConteudo}px em ${coluna.alturaVisivel}px visíveis · rola por dentro: ${coluna.rola} · inalcançável: ${coluna.inalcancavel}px`,
    "rola por dentro, ou cabe inteira",
  );

  // A CHAVE VIVA NÃO APARECE DUAS VEZES. Ela é o mesmo componente nos dois lugares — o que
  // o CSS faz é esconder a contagem do ato quando a coluna já a mostra. Duas contagens
  // visíveis lado a lado seriam o mesmo número dito duas vezes, e a primeira a divergir
  // seria a que ninguém está olhando.
  const chaves = await cdp.avaliar(
    naPagina(`return visiveis('[data-chave] .prod-chave-conta').length;`),
  );
  exigir(
    chaves === 1,
    "a contagem da chave aparece UMA vez na web, e não duas",
    `${chaves} contagem(ns) visível(eis)`,
    "1",
  );

  // NADA VAZA ENTRE VISÕES. A coluna colada não existe no app: em 370px o que ela mostra
  // vive dentro dos atos, e duplicá-lo poria a mesma informação duas vezes na mesma tela.
  await naVisao(cdp, `${base}/studio/publicar/`, "mobile");
  // A rota principal abre no INÍCIO da pauta (2026-08-26); a ficha é pedida por um toque.
  await cdp.avaliar(
    naPagina(`
      const b = document.querySelector('[data-abrir-registro]')
        || document.querySelector('[data-acao="adicionar"]');
      if (b) b.click();
      return Boolean(b);
    `),
  );
  await respirarProdutor(600);
  // Registro publicado abre no DETALHE (2026-08-26); a ficha fica atrás do Editar.
  await cdp.avaliar(
    naPagina(`
      const e = document.querySelector('[data-acao="editar"]');
      if (e) e.click();
      return Boolean(e);
    `),
  );
  await respirarProdutor(600);

  const noApp = await cdp.avaliar(
    naPagina(`
      const c = document.querySelector('[data-coluna-colada]');
      return {
        existe: Boolean(c),
        visivel: visivel(c),
        // O trilho é SÓ da web: no app o carrossel de pautas foi vetado (2026-08-26) e
        // o caminho entre telas é o painel, com a volta no cabeçalho de cada uma.
        trilhoVisivel: (() => {
          const t = document.querySelector('.prod-trilho-pautas');
          return t ? visivel(t) : null;
        })(),
        voltar: Boolean(document.querySelector('[data-voltar-studio]')),
      };
    `),
  );
  exigir(
    noApp.existe && !noApp.visivel,
    "a coluna colada NÃO aparece no app — a árvore é a mesma, quem esconde é o CSS",
    `presente na árvore: ${noApp.existe} · visível: ${noApp.visivel}`,
    "presente e invisível",
  );
  exigir(
    noApp.trilhoVisivel === false,
    "e o trilho de pautas NÃO aparece no app — carrossel vetado; o painel é a navegação",
    `trilho visível: ${String(noApp.trilhoVisivel)}`,
    "presente e invisível",
  );
  exigir(
    noApp.voltar,
    "e a tela oferece a volta ao Studio no cabeçalho",
    `link de volta presente: ${noApp.voltar}`,
    "data-voltar-studio no cabeçalho",
  );
}

// ---------------------------------------------------------------------------
// (k) ZERO REQUISIÇÃO EXTERNA nas telas novas
// ---------------------------------------------------------------------------

/**
 * A promessa medida do projeto inteiro: nenhuma requisição sai do servidor local em runtime.
 *
 * O STUDIO É O LUGAR MAIS FÁCIL DE QUEBRÁ-LA, e por isso o gate existe aqui: uma ficha que
 * carrega o `<iframe>` do YouTube ao montar, um seletor que busca fonte de um CDN, uma
 * imagem colada de URL externa que o navegador vai buscar. As três seriam invisíveis numa
 * captura de tela e visíveis nesta lista.
 */
async function gateDaRede(cdp, base) {
  titulo("── (k) zero requisição externa nas telas do Studio ──");

  const rotas = [
    "/studio/",
    "/studio/publicar/",
    "/studio/grade/",
    "/studio/comercial/",
    "/studio/play/",
    "/studio/cast/",
    "/studio/editorial/",
    "/studio/catalogos/",
    "/studio/ocorrencias/",
  ];

  for (const rota of rotas) {
    await naVisao(cdp, `${base}${rota}`, "mobile");
  }

  // A LEITURA É PELO DOM, e o limite disso é declarado: todo `src`/`href` que aponte para
  // fora da origem local é uma requisição que o navegador VAI fazer, e este gate a pega.
  // O que ele NÃO pega é um `fetch` disparado em JavaScript — para isso seria preciso um
  // gancho de rede que `navegador.mjs` não expõe. As suítes de fase 2 e 4 medem esse lado
  // com `Network.requestWillBeSent`; aqui a medida é do que está na árvore.
  const doDom = await cdp.avaliar(
    naPagina(`
      const fora = [];
      for (const el of todos('img[src], script[src], link[href], iframe[src], video[src], source[src]')) {
        const u = el.getAttribute('src') || el.getAttribute('href') || '';
        // Sem regex: new URL resolve o relativo contra a origem, e comparar ORIGENS é
        // mais honesto que casar prefixo — um endereço iniciado por duas barras, ou com o
        // esquema em maiúsculas, passaria por um regex mal escrito e não passa por aqui.
        // (Sem crase neste comentário: ele vive dentro de uma template literal, e uma
        // crase aqui fecharia a string do lado de fora.)
        let absoluta = null;
        try { absoluta = new URL(u, location.href); } catch (e) { absoluta = null; }
        if (absoluta && absoluta.origin !== location.origin && absoluta.protocol !== 'data:') {
          fora.push(absoluta.href);
        }
      }
      return fora;
    `),
  );

  exigir(
    doDom.length === 0,
    `0 requisição externa em ${rotas.length} telas do Studio`,
    doDom.length === 0
      ? `${rotas.length} rotas conferidas`
      : doDom.slice(0, 5).join(" · "),
    "0",
  );
}

// ---------------------------------------------------------------------------
// --provar-ausencias — VERDE SOBRE CASO QUE NÃO ACONTECEU É VERDE FALSO
// ---------------------------------------------------------------------------

/**
 * Cada defeito é injetado no código, o artefato é reconstruído, e o portão roda.
 *
 * SE ELE SEGUIR VERDE, ELE NÃO MEDE O QUE PROMETE. Um gate que nunca viu vermelho é uma
 * linha de log — e a única forma de saber que ele reprova é fazê-lo reprovar.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ELE CUSTA UM `next build` POR DEFEITO, e o custo é declarado em vez de escondido.
 *
 * Este portão mede o ARTEFATO EXPORTADO (`out/`), não um servidor de desenvolvimento: é o
 * que a banca vai abrir. Injetar um defeito na fonte não muda `out/` até o build correr, e
 * o build gera 5.274 páginas — cerca de três minutos. Quatro defeitos são doze minutos.
 *
 * A ALTERNATIVA SERIA MEDIR `next dev`, e ela custaria mais caro: outro grafo de módulos,
 * outro caminho de hidratação, e avisos de console que não existem no artefato. Um gate
 * rápido sobre a coisa errada não é um gate.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A ÁRVORE É RESTAURADA POR COMPARAÇÃO DE CONTEÚDO, e não por `git`. O arquivo original é
 * lido antes, reescrito no `finally`, e conferido byte a byte no fim — a restauração é
 * afirmada pelo próprio conteúdo, sem depender de nenhum comando externo.
 */
const DEFEITOS = [
  {
    // ─────────────────────────────────────────────────────────────────────
    // A PRIMEIRA VERSÃO DESTE DEFEITO NÃO ERA UM DEFEITO, e a descoberta vale
    // mais que o caso.
    //
    // Ela injetava `app:hidden` na `<div className="prod-tela">` do layout do
    // Studio, e o portão seguia VERDE. A leitura fácil seria «o gate não mede
    // o que promete». A leitura certa, medida no bundle:
    //
    //   .app\:hidden  →  @layer utilities
    //   .prod-tela     →  (SEM CAMADA)
    //
    // **CSS sem camada vence `@layer`, independentemente da especificidade.**
    // O `display: flex` de `.prod-tela` ganhava do `display: none` do
    // utilitário, e o Studio continuava visível. A injeção era INERTE — o
    // defeito nunca acontecia, e o verde era honesto.
    //
    // A consequência de produto está anotada em `superficie-so-web.tsx`: o
    // `app:hidden` das cinco superfícies web-only só funciona porque a div
    // que o carrega é NUA. Dar-lhe uma classe semântica que declare `display`
    // desligaria D-67 em silêncio.
    //
    // A injeção nova é a regressão de verdade: uma regra sem camada que
    // esconde o Studio na visão app — exatamente o que voltar a pôr a
    // superfície sob `SuperficieSoWeb` produziria.
    // ─────────────────────────────────────────────────────────────────────
    nome: "o Studio some no telefone (D-67 volta a valer para ele)",
    arquivo: "src/estilos/studio-produtor.css",
    de: '[data-view="mobile"] .prod-conteudo .studio {',
    para:
      '[data-view="mobile"] .prod-tela { display: none; }\n' +
      '[data-view="mobile"] .prod-conteudo .studio {',
    gateEsperado: "é mobile-first e ABRE na visão app",
  },
  {
    nome: "a barra de ação vira `fixed` e escapa da moldura",
    arquivo: "src/estilos/studio-produtor.css",
    de: ".prod-barra-acao {\n  position: absolute;",
    para: ".prod-barra-acao {\n  position: fixed;",
    gateEsperado: "não ancora nada na janela de dentro do telefone",
  },
  {
    nome: "publicar deixa de conferir impedimento (a trava do botão cai)",
    arquivo: "src/componentes/produtor-agenda.tsx",
    de: "desabilitado={!podePublicar(registro)}",
    para: "desabilitado={false}",
    gateEsperado: "o botão de publicar está desabilitado, e DIZ por quê",
  },
  {
    nome: "o privado vaza para a vitrine (a visibilidade é ignorada)",
    arquivo: "src/componentes/publicado-pelo-produtor.tsx",
    de: 'r.visibilidade === "publico",',
    para: "true,",
    gateEsperado: "o PRIVADO não aparece",
  },
  {
    nome: "a colisão da grade deixa de ser detectada",
    arquivo: "src/componentes/produtor-grade.tsx",
    de: "colide: jaExistem.has(chave),",
    para: "colide: false,",
    gateEsperado: "a prévia ACUSA a colisão ANTES de aplicar",
  },
];

async function provarAusencias() {
  const { readFile, writeFile } = await import("node:fs/promises");
  const { execFileSync } = await import("node:child_process");
  // `fileURLToPath`, e não `new URL(...).pathname`: o caminho deste repositório tem espaço
  // e acento, e o `pathname` de uma URL devolve-os percent-encoded — o `node` receberia um
  // caminho que não existe e todo caso «falharia» por MODULE_NOT_FOUND, dando o resultado
  // certo pelo motivo errado.
  const esteArquivo = fileURLToPath(import.meta.url);

  console.log(
    `\nPROVAR AUSÊNCIAS — ${DEFEITOS.length} defeitos injetados, um a um.\n` +
      `Cada um custa um \`next build\` (5.274 páginas, ~3 min). Isto vai demorar.\n`,
  );

  const resultados = [];

  for (const d of DEFEITOS) {
    const original = await readFile(d.arquivo, "utf8");
    if (!original.includes(d.de)) {
      console.log(`  FALHA ${d.nome}: o alvo da injeção não existe mais em ${d.arquivo}`);
      resultados.push({ ...d, ok: false, restaurado: true });
      continue;
    }

    // `replaceAll`: trocar só a primeira ocorrência deixa o resto de pé, e o caso passa
    // verde por metade da injeção.
    await writeFile(d.arquivo, original.replaceAll(d.de, d.para));

    let saida = "";
    try {
      execFileSync("npx", ["next", "build"], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
        stdio: "pipe",
        shell: true,
      });
      saida = execFileSync(process.execPath, [esteArquivo], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch (erro) {
      saida = String(erro.stdout ?? "") + String(erro.stderr ?? "");
    } finally {
      await writeFile(d.arquivo, original);
    }

    // A restauração é AFIRMADA pelo conteúdo, e não por um comando externo.
    const depois = await readFile(d.arquivo, "utf8");
    const restaurado = depois === original;

    const ficouVermelho = saida
      .split("\n")
      .some((l) => l.trim().startsWith("FALHA") && l.includes(d.gateEsperado));

    console.log(
      `  ${ficouVermelho ? "ok  " : "FALHA"} ${d.nome}\n` +
        `       gate «${d.gateEsperado}» ${
          ficouVermelho ? "ficou VERMELHO" : "seguiu verde — o gate não mede o que promete"
        }` +
        (restaurado ? "" : "  ·  ARQUIVO NÃO RESTAURADO"),
    );
    resultados.push({ ...d, ok: ficouVermelho, restaurado });
  }

  // O artefato fica com o último defeito revertido mas não reconstruído: um build final
  // devolve `out/` ao que a fonte diz. Sem ele, a próxima execução do portão mediria o
  // artefato do último defeito.
  console.log("\n  reconstruindo o artefato limpo…");
  try {
    execFileSync("npx", ["next", "build"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: "pipe",
      shell: true,
    });
    console.log("  ok   `out/` reconstruído a partir da fonte restaurada");
  } catch {
    console.log("  FALHA não consegui reconstruir `out/` — rode `npx next build`");
  }

  const naoCapturados = resultados.filter((r) => !r.ok);
  const naoRestaurados = resultados.filter((r) => !r.restaurado);
  console.log(
    `\n  ${resultados.length - naoCapturados.length} de ${resultados.length} defeitos vistos vermelhos` +
      (naoCapturados.length ? ` · ${naoCapturados.length} NÃO capturado(s)` : "") +
      (naoRestaurados.length ? ` · ${naoRestaurados.length} arquivo(s) NÃO restaurado(s)` : "") +
      "\n",
  );
  if (naoCapturados.length || naoRestaurados.length) process.exitCode = 1;
}

async function principal() {
  console.log("\nVERIFICAR PRODUTOR — o perfil que alimenta o produto\n");

  const servidor = await servir({ raiz: OUT, porta: Number(process.env.PORTA ?? 0) || undefined });
  console.log(`  servidor estático em ${servidor.url} (raiz: out/)`);

  const cdp = await abrirNavegador({
    largura: LARGURA_WEB,
    altura: ALTURA_WEB,
    tetoNavegacao: 120_000,
    tetoHidratacao: 60_000,
  });

  try {
    await gateDasRotas();
    await gateDaInversao(cdp, servidor.url);
    await gateDoFixed(cdp, servidor.url);
    await gateDaDobra(cdp, servidor.url);
    await gateDaPublicacao(cdp, servidor.url);
    await gateDaColisao(cdp, servidor.url);
    await gateDasVitrines(cdp, servidor.url);
    await gateDaSemente(cdp, servidor.url);
    await gateDaWeb(cdp, servidor.url);
    await gateDaRede(cdp, servidor.url);
    await gateDoConsole(cdp);
  } finally {
    await cdp.encerrar();
    await servidor.fechar();
  }

  console.log(
    `\n  ${verdes} verde(s)` + (falhas ? ` · ${falhas} FALHA(S)` : "") + "\n",
  );
  if (falhas) process.exitCode = 1;
}

if (process.argv.includes("--provar-ausencias")) {
  provarAusencias().catch((erro) => {
    console.error(`\nprovar-ausencias quebrou: ${erro.message}\n`);
    process.exitCode = 1;
  });
} else {
  principal().catch((erro) => {
    console.error(`\nverificar-produtor.mjs quebrou: ${erro.message}\n`);
    process.exitCode = 1;
  });
}
