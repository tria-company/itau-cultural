/**
 * sonda-admin-telefone.mjs, o Admin no telefone.
 *
 * O QUE ELA MEDE, e nenhum portão estático mede: se o conteúdo aparece na visão de app, se
 * nada transborda para o lado dentro dos 370px úteis da moldura, e se todo controle tem os
 * 44px de alvo de toque que a casa exige.
 *
 * TRANSBORDO HORIZONTAL É O DEFEITO TÍPICO de tabela em grade com trilho em `rem`: a coluna
 * não encolhe, o excedente sai da moldura, e nenhum `tsc` vê isso.
 *
 * Rode com `node scripts/sonda-admin-telefone.mjs`, com `out/` já construído.
 * Se travar sem imprimir nada, mate os Chrome com `--headless=new` órfãos.
 */

import { abrirNavegador, naPagina } from "./navegador.mjs";
import { servir } from "./servir-out.mjs";

const ROTAS = [
  "",
  // A EQUIPE É TELA DO ADMIN, e passou a ser medida como as outras: ela tem uma tabela de
  // cinco colunas, que é justamente a forma que mais transborda em 370px.
  "equipe",
  "pessoas",
  "coletivos",
  "instituicoes",
  "eventos",
  "espacos",
  "comunidades",
  "publicacoes",
  "loja",
];

/** A área útil dentro da moldura de 390px: 390 menos os dois bezéis de 10. */
const UTEIS = 370;
/** O alvo mínimo de toque, em px. */
const ALVO = 44;

let verdes = 0;
const falhas = [];

function exigir(condicao, nome, medida, esperado) {
  if (condicao) {
    verdes += 1;
    console.log(`  ok   ${nome}: ${medida}`);
    return;
  }
  console.log(`  FALHA ${nome}: medido ${medida} · esperado ${esperado}`);
  falhas.push(nome);
}

const servidor = await servir();
const base = servidor.url;
let cdp;

try {
  cdp = await abrirNavegador();
  console.log("\nsonda-admin-telefone, o Admin em 390x844\n");

  await cdp.navegar(`${base}/admin/`);
  await cdp.avaliar(
    `localStorage.setItem('agenda-cultural:papel', 'admin');
     localStorage.setItem('agenda-cultural:visao', 'mobile');
     localStorage.removeItem('admin.acoes.v1');`,
  );

  console.log("  rota                 conteúdo   transbordo   alvos curtos");
  console.log("  ---------------------------------------------------------");

  let semConteudo = 0;
  let transbordos = 0;
  let alvosCurtos = 0;

  for (const rota of ROTAS) {
    await cdp.navegar(`${base}/admin/${rota}${rota ? "/" : ""}`);

    // ESPERAR A PEÇA EXISTIR, e não só a página carregar. O painel e as listas do Admin só
    // aparecem depois de hidratar, porque antes disso o navegador não sabe qual perfil está
    // aberto. Medir antes disso mede o quadro vazio, e o transbordo que aparece é o do
    // conteúdo ainda posto no gabarito da web dentro de uma janela de 390px: um defeito de
    // relógio, não de tela. Confirmado à mão: com a espera, o mesmo painel mede zero.
    await cdp.avaliar(
      naPagina(`return new Promise((ok) => {
        let restam = 60;
        let anterior = -1;
        let iguais = 0;
        const olhar = () => {
          const el = document.querySelector('[data-admin-painel], [data-admin-lista], [data-admin-equipe]');
          const agora = el ? (el.innerText || '').length : -1;
          // Esperar o texto PARAR DE CRESCER, e não só a caixa existir: a peça monta em
          // etapas, e medir na primeira delas mede meia tela.
          if (agora > 0 && agora === anterior) iguais += 1;
          else iguais = 0;
          anterior = agora;
          if (iguais >= 3 || restam-- <= 0) ok(true);
          else setTimeout(olhar, 60);
        };
        olhar();
      });`),
    );

    const m = await cdp.avaliar(
      naPagina(`
        const raiz = document.querySelector('[data-admin-painel], [data-admin-lista], [data-admin-equipe]');
        if (!raiz) return { chars: 0, transborda: 0, curtos: 0, largura: 0 };

        // TRANSBORDO: qualquer elemento cuja largura de rolagem passe da largura visível.
        // Medir só o body deixaria passar uma tabela que rola dentro de um pai escondido.
        //
        // O DEFEITO É O EXCEDENTE QUE SAI, e é só ele. Três coisas o contêm, e nenhuma delas
        // é defeito: «auto» e «scroll», que é a regra da casa para conteúdo largo, e
        // «hidden»/«clip», que RECORTA. A regra antiga só perdoava as duas primeiras, e por
        // isso acusava 22 transbordos numa lista onde nada escapava: a capa gerada do
        // produto desenha uma textura maior que a caixa e a recorta com «overflow: hidden»,
        // que é o mecanismo dela desde que ela existe. Perdoar «hidden» não afrouxa o
        // portão: um elemento recortado não corta conteúdo do vizinho nem empurra a página
        // para o lado, que é o que este gate existe para pegar.
        const CONTEM = ['auto', 'scroll', 'hidden', 'clip'];
        let transborda = 0;
        for (const el of raiz.querySelectorAll('*')) {
          if (el.clientWidth === 0) continue;
          if (el.scrollWidth <= el.clientWidth + 1) continue;
          if (CONTEM.includes(getComputedStyle(el).overflowX)) continue;
          let contido = false;
          for (let p = el.parentElement; p && p !== raiz.parentElement; p = p.parentElement) {
            if (CONTEM.includes(getComputedStyle(p).overflowX)) { contido = true; break; }
          }
          if (!contido) transborda += 1;
        }

        // ALVO DE TOQUE: botão, link de porta e campo. Texto corrido não conta.
        let curtos = 0;
        for (const el of raiz.querySelectorAll('button, .adm-porta, input, select')) {
          const r = el.getBoundingClientRect();
          if (r.height > 0 && r.height < ${ALVO} - 0.5) curtos += 1;
        }

        return {
          chars: (raiz.innerText || '').trim().length,
          transborda,
          curtos,
          largura: Math.round(raiz.getBoundingClientRect().width),
        };
      `),
    );

    if (m.chars < 200) semConteudo += 1;
    transbordos += m.transborda;
    alvosCurtos += m.curtos;
    console.log(
      `  /admin/${rota.padEnd(13)}${String(m.chars).padStart(8)}${String(m.transborda).padStart(12)}${String(m.curtos).padStart(14)}`,
    );
  }

  console.log("  ---------------------------------------------------------");

  exigir(
    semConteudo === 0,
    `as ${ROTAS.length} telas do Admin APARECEM na visão de app`,
    `sem conteúdo: ${semConteudo} de ${ROTAS.length}`,
    "0 vazias",
  );
  exigir(
    transbordos === 0,
    `nada transborda dentro dos ${UTEIS}px úteis`,
    `elementos transbordando: ${transbordos}`,
    "0",
  );
  exigir(
    alvosCurtos === 0,
    `todo controle tem ${ALVO}px de alvo de toque`,
    `controles abaixo de ${ALVO}px: ${alvosCurtos}`,
    "0",
  );

  // O MAPA MUDOU DE ENDEREÇO. Ele saiu do painel do Admin e foi para a tela Mapa, que é
  // onde se procura um mapa; a aferição segue a peça, e não a rota antiga.
  await cdp.navegar(`${base}/mapa/`);
  const mapa = await cdp.avaliar(
    naPagina(`return {
      municipios: document.querySelectorAll('[data-municipio]').length,
      vazios: document.querySelectorAll('[data-municipio][data-faixa="vazio"]').length,
      externas: performance.getEntriesByType('resource')
        .map(e => e.name)
        .filter(u => !u.startsWith(location.origin) && !u.startsWith('data:') && !u.startsWith('blob:')).length,
    };`),
  );
  exigir(
    mapa.municipios === 645,
    "o mapa desenha os 645 municípios",
    `municípios: ${mapa.municipios}`,
    "645",
  );
  exigir(
    mapa.vazios === 312,
    "e os 312 sem nenhum equipamento aparecem vazados",
    `vazados: ${mapa.vazios}`,
    "312",
  );
  exigir(
    mapa.externas === 0,
    "o mapa não faz requisição para fora",
    `requisições externas: ${mapa.externas}`,
    "0",
  );

  console.log(
    falhas.length === 0
      ? `\n  ${verdes} gates verdes, 0 falhas.\n`
      : `\n  ${verdes} verdes · ${falhas.length} FALHA(S): ${falhas.join(" · ")}\n`,
  );
} finally {
  await cdp?.fechar?.();
  await servidor.fechar?.();
}

process.exitCode = falhas.length === 0 ? 0 : 1;
