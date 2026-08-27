/**
 * verificar-moderacao.mjs — a suíte da S3 · Moderação.
 *
 * O QUE ELA MEDE, E POR QUE NÃO DÁ PARA MEDIR NO ARQUIVO. As afirmações desta sessão são
 * sobre COMPORTAMENTO: que o botão de vetar não conclui com o campo vazio, que a ordem por
 * vazio sobe quem o acervo menos documenta, que a decisão sobrevive ao recarregamento. Um
 * gate estático leria o código e concluiria que o código diz isso — que é a mesma coisa que
 * ler a promessa em vez do resultado. Aqui a tela é aberta num navegador de verdade, os
 * gestos são feitos, e o que se mede é o que sobrou na página.
 *
 * ELA NÃO TOCA NENHUMA SUÍTE EXISTENTE. `verificar-fase*.mjs` é território de outra sessão
 * (PROTOCOLO §6); o cliente CDP vem de `navegador.mjs`, que é compartilhado e só é LIDO.
 *
 * COMO RODAR. Ela mede o que o navegador mostra, então precisa de um servidor. Por padrão
 * usa o dev da S3 na porta 3003 (`NEXT_SESSAO=s3 npx next dev -p 3003`); com `--base` mede
 * qualquer outro, inclusive o `out/` servido por `scripts/servir-out.mjs`.
 *
 *     node scripts/verificar-moderacao.mjs
 *     node scripts/verificar-moderacao.mjs --base http://localhost:4000
 *
 * NENHUM PADRÃO SOBRE TEXTO, E A RAZÃO CUSTOU TRÊS VERMELHOS FALSOS.
 *
 * Tudo que esta suíte avalia na página viaja dentro de um template literal, e ali a barra
 * invertida de um padrão COLAPSA: `\d` vira `d`, `\D` vira `D`. `replace(/\D/g, "")` sobre
 * «47.259» deixa de remover o ponto, `Number` lê 47,259, e o gate reprova um número certo.
 * Pior: quando o número é pequeno — «68», «49» — o mesmo código funciona por acidente, e o
 * gate fica verde até o dia em que o dado passa de mil.
 *
 * Por isso **todo número e toda data que esta suíte confere viajam como atributo**:
 * `data-valor`, `data-carimbo`, `data-inicio`, `data-arestas`. O atributo carrega o valor
 * exato e não depende de escape nenhum sobreviver a duas camadas de string.
 *
 * O CÓDIGO DE SAÍDA É O RESULTADO: 0 com tudo verde, 1 com qualquer falha. Sem isso a
 * suíte vira relatório que ninguém lê, e um portão que não reprova não é portão.
 */

import { abrirNavegador, naPagina } from "./navegador.mjs";

const BASE = (() => {
  const i = process.argv.indexOf("--base");
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : "http://localhost:3003";
})();

const ROTA_DA_FILA = `${BASE}/moderacao/fila/`;

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

function titulo(t) {
  console.log(`\n${t}`);
}

/**
 * Abre a fila num estado limpo.
 *
 * O armazém é apagado ANTES de navegar e a página é recarregada: sem isso, a primeira
 * execução mediria a fila vazia e a segunda mediria a fila decidida pela primeira, e as
 * duas relatariam coisas diferentes sobre o mesmo código. Um gate cujo resultado depende de
 * quantas vezes ele já rodou não mede nada.
 */
async function abrirFilaLimpa(cdp) {
  await cdp.navegar(ROTA_DA_FILA);
  await cdp.avaliar(`window.localStorage.removeItem("moderacao.v1")`);
  // A VISÃO PRECISA SER PEDIDA, e é a lição de D-67: a Moderação vive sob `app:hidden`, e
  // na visão de app a tela existe no HTML com retângulo zerado. Um clique ali falha com
  // «elemento sem área» e o relatório culparia o botão, quando a causa é a casca ter aberto
  // na visão errada. A casca guarda a escolha no mesmo armazém do produto, e é por ele que
  // se pede.
  //
  // «A MODERAÇÃO», E NÃO MAIS «O BASTIDOR INTEIRO». Em 2026-08 o `app:hidden` saiu do
  // layout do grupo e passou a ser aplicado por superfície: o Studio virou mobile-first
  // com o perfil Produtor, e as outras cinco continuam web-only. A frase acima dizia
  // «o bastidor inteiro» e teria virado uma explicação errada — o gate continuaria verde
  // e o comentário mentiria sobre o motivo. Quem confere a regra nova, nas duas metades, é
  // `verificar-produtor.mjs`; aqui a afirmação é só sobre a Moderação, e ela é MAIS
  // precisa do que era.
  await cdp.avaliar(`window.localStorage.setItem('agenda-cultural:visao', 'web')`);
  await cdp.navegar(ROTA_DA_FILA);
  await cdp.assentar();

  const visao = await cdp.avaliar(
    `document.querySelector('[data-view]')?.getAttribute('data-view') ?? null`,
  );
  if (visao !== "web") {
    // Falha ALTA e nomeada. Seguir medindo numa visão que esconde a tela produziria uma
    // sequência de falhas sobre elementos ausentes, e nenhuma delas seria a causa.
    throw new Error(
      `pedi a visão «web» em /moderacao/fila/ e a casca abriu em «${visao}». ` +
        "A Moderação só existe na web (D-67) — na visão de app o layout de `/moderacao` " +
        "monta `SuperficieSoWeb`, que a esconde, e todo clique falha por retângulo zerado.",
    );
  }
}

async function principal() {
  console.log(`\nVERIFICAR MODERAÇÃO — S3\nmedindo ${ROTA_DA_FILA}\n`);

  // O TETO DE NAVEGAÇÃO É MAIOR QUE O PADRÃO, e o motivo está medido.
  //
  // O padrão de `navegador.mjs` são 30 s, calibrados numa máquina que compila sozinha.
  // Esta suíte roda com seis sessões trabalhando no mesmo repositório, e o servidor de
  // desenvolvimento chegou a 44 s numa página que costuma levar 2 s. Um teto apertado
  // transformaria contenção de CPU em «FALHA: tempo esgotado», e a leitura seria de que a
  // tela quebrou — que é o tipo de vermelho falso que faz gate deixar de ser lido.
  const cdp = await abrirNavegador({ tetoNavegacao: 120_000, tetoHidratacao: 60_000 });
  try {
    // -----------------------------------------------------------------------
    titulo("── D-67 · a Moderação continua sendo superfície de desktop ──");
    // -----------------------------------------------------------------------
    //
    // ESTE BLOCO É NOVO, e ele é a metade que a inversão de D-67 obriga a afirmar.
    //
    // Até 2026-08 nada aqui MEDIA a regra: ela era herdada do layout do grupo, que
    // escondia as 52 rotas de bastidor de uma vez, e a suíte só a citava num comentário e
    // numa mensagem de erro. Quando o `app:hidden` desceu para o layout de cada superfície
    // — porque o Studio virou mobile-first com o perfil Produtor —, a regra passou a
    // depender de um arquivo por superfície, e um arquivo esquecido é um defeito silencioso:
    // a Moderação apareceria espremida em 390px e nenhum número acusaria.
    //
    // O gate mede MAIS do que media. Antes, zero afirmações; agora, duas.
    await cdp.navegar(ROTA_DA_FILA);
    await cdp.avaliar(`window.localStorage.setItem('agenda-cultural:visao', 'mobile')`);
    await cdp.navegar(ROTA_DA_FILA);
    await cdp.assentar();

    const naApp = await cdp.avaliar(
      naPagina(`
        const aviso = Array.from(document.querySelectorAll('h1'))
          .find((h) => /superfície de desktop/i.test(h.textContent || ''));
        const escondido = document.querySelector('[data-superficie="so-web"]');
        const r = escondido ? escondido.getBoundingClientRect() : null;
        return {
          view: document.querySelector('[data-view]')?.getAttribute('data-view') ?? null,
          avisoVisivel: Boolean(aviso && aviso.getBoundingClientRect().height > 0),
          envelopeExiste: Boolean(escondido),
          conteudoVisivel: Boolean(r && r.height > 0 && r.width > 0),
        };
      `),
    );

    exigir(
      naApp.view === "mobile" && naApp.envelopeExiste && !naApp.conteudoVisivel,
      "D-67 · /moderacao/fila/ continua ESCONDIDA na visão app, pelo layout da própria superfície",
      `view=${naApp.view} · envelope so-web presente: ${naApp.envelopeExiste} · conteúdo visível: ${naApp.conteudoVisivel}`,
      "envelope presente, conteúdo com retângulo zerado",
    );
    exigir(
      naApp.avisoVisivel,
      "D-67 · e ela DECLARA o motivo em vez de dar tela branca",
      `aviso de superfície de desktop visível: ${naApp.avisoVisivel}`,
      "visível",
    );

    // -----------------------------------------------------------------------
    titulo("── M1 · a fila: quatro origens, score só na IA, ordem por vazio ──");
    // -----------------------------------------------------------------------
    await abrirFilaLimpa(cdp);

    const fila = await cdp.avaliar(
      naPagina(`
        const itens = todos('[data-item-fila]');
        const origens = itens.map((el) => el.getAttribute('data-procedencia-item'));
        const conta = {};
        for (const o of origens) conta[o] = (conta[o] || 0) + 1;
        return {
          itens: itens.length,
          conta,
          scores: todos('[data-score-ia]').length,
          acoes: todos('[data-acao-moderacao]').length,
          escopos: todos('[data-escopo-curador]').length,
          ordenacoes: todos('[data-ordenacao-fila]').length,
          limites: todos('[data-limites-ia]').length,
          decisoes: todos('[data-decisao-moderacao]').length,
        };
      `),
    );

    exigir(
      fila.conta.produtor === 20 &&
        fila.conta.ingestao === 20 &&
        fila.conta.ia === 20 &&
        fila.conta.denuncia === 8 &&
        fila.itens === 68,
      "as QUATRO origens na fila, cada uma com a sua contagem",
      `${fila.itens} itens · ${JSON.stringify(fila.conta)}`,
      "68 = 20 produtor + 20 ingestão + 20 IA + 8 denúncia",
    );

    // O portão central da sessão: score é a marca de «estimou», e produtor, ingestão e
    // denúncia AFIRMAM. Um score fora da IA achataria a distinção que a tela existe para
    // fazer, e é a única coisa que a fila não pode deixar acontecer em silêncio.
    exigir(
      fila.scores === fila.conta.ia,
      "score em EXATAMENTE os itens de IA, e em nenhum outro",
      `${fila.scores} com score · ${fila.conta.ia} de IA · ${fila.scores - fila.conta.ia} fora`,
      "score === itens de IA",
    );

    exigir(
      fila.acoes === 4 && fila.escopos === 3 && fila.ordenacoes === 2 && fila.limites === 1,
      "as ações, os escopos, as ordens e o rodapé de limites",
      `${fila.acoes} ações · ${fila.escopos} escopos · ${fila.ordenacoes} ordens · ${fila.limites} rodapé`,
      "4 · 3 · 2 · 1",
    );

    exigir(
      fila.decisoes === 0,
      "a fila abre com ZERO decisão — nada avança sem gesto humano",
      `${fila.decisoes} decisões no carregamento`,
      "0",
    );

    // -----------------------------------------------------------------------
    titulo("── 124 · a ordem por vazio sobe quem o acervo menos documenta ──");
    // -----------------------------------------------------------------------

    const ordem = await cdp.avaliar(
      naPagina(`
        const registros = todos('[data-item-fila]')
          .map((el) => el.getAttribute('data-registros-uf'))
          .map((v) => (v === null || v === '' ? null : Number(v)));
        const comUf = registros.filter((r) => r !== null);
        const semUf = registros.filter((r) => r === null);
        // Os que têm UF vêm antes dos que não têm, e em ordem crescente de registro.
        const primeiroSemUf = registros.findIndex((r) => r === null);
        const ultimoComUf = registros.map((r, i) => (r !== null ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
        let crescente = true;
        for (let i = 1; i < comUf.length; i++) if (comUf[i] < comUf[i - 1]) crescente = false;
        return {
          total: registros.length,
          comUf: comUf.length,
          semUf: semUf.length,
          crescente,
          blocosSeparados: primeiroSemUf === -1 || primeiroSemUf > ultimoComUf,
          topo: comUf.slice(0, 5),
          fundo: comUf.slice(-3),
        };
      `),
    );

    exigir(
      ordem.crescente,
      "os itens com UF saem em ordem CRESCENTE de registros no acervo",
      `topo ${JSON.stringify(ordem.topo)} · fundo ${JSON.stringify(ordem.fundo)}`,
      "não decrescente",
    );

    // «Não sei onde isto fica» não é «isto fica num lugar bem documentado». Empurrar os
    // sem-UF para qualquer uma das pontas afirmaria uma das duas coisas; eles vão para um
    // bloco próprio, depois dos que têm, e o número está declarado na tela.
    exigir(
      ordem.blocosSeparados,
      "os itens SEM UF ficam num bloco próprio, depois dos que têm",
      `${ordem.comUf} com UF · ${ordem.semUf} sem`,
      "nenhum item sem UF antes de um item com UF",
    );

    const declaraSemUf = await cdp.avaliar(
      naPagina(`
        const t = document.body.textContent || '';
        return t.includes('não têm nenhuma');
      `),
    );
    exigir(
      declaraSemUf,
      "e a tela DECLARA quantos não têm UF, com denominador",
      `frase presente: ${declaraSemUf}`,
      "presente",
    );

    // -----------------------------------------------------------------------
    titulo("── 122 · o escopo impresso: o moderador vê o que NÃO está vendo ──");
    // -----------------------------------------------------------------------

    const escopoNacional = await cdp.avaliar(
      naPagina(`return Number(document.querySelector('[data-escopo-fora]').getAttribute('data-escopo-fora'));`),
    );
    exigir(
      escopoNacional === 0,
      "no escopo nacional, nada fica fora do corte",
      `${escopoNacional} itens fora`,
      "0",
    );

    await cdp.clicar(`document.querySelector('[data-escopo-curador="territorial"]')`);
    await cdp.assentar();

    const escopoTerritorial = await cdp.avaliar(
      naPagina(`
        return {
          fora: Number(document.querySelector('[data-escopo-fora]').getAttribute('data-escopo-fora')),
          itens: todos('[data-item-fila]').length,
        };
      `),
    );
    exigir(
      escopoTerritorial.fora > 0 &&
        escopoTerritorial.fora + escopoTerritorial.itens === fila.itens,
      "o territorial declara o que deixou de fora, e as duas partes fecham o total",
      `${escopoTerritorial.itens} na lista + ${escopoTerritorial.fora} fora = ${
        escopoTerritorial.itens + escopoTerritorial.fora
      } de ${fila.itens}`,
      `soma === ${fila.itens}`,
    );

    // Trocar de escopo NÃO troca de URL: é a mesma superfície servindo recortes
    // diferentes, e é o que D-84 pede.
    const url = await cdp.avaliar("location.pathname");
    exigir(
      url === "/moderacao/fila/" || url === "/moderacao/fila",
      "trocar de escopo NÃO troca a URL",
      url,
      "/moderacao/fila/",
    );

    await cdp.clicar(`document.querySelector('[data-escopo-curador="nacional"]')`);
    await cdp.assentar();

    // -----------------------------------------------------------------------
    titulo("── 120 · a denúncia: já publicada, e com destino declarado ──");
    // -----------------------------------------------------------------------

    const denuncia = await cdp.avaliar(
      naPagina(`
        const alvo = todos('[data-item-fila]').find(
          (el) => el.getAttribute('data-procedencia-item') === 'denuncia',
        );
        if (!alvo) return { achou: false };
        alvo.querySelector('button').click();
        return { achou: true };
      `),
    );
    exigir(denuncia.achou, "há item de denúncia clicável na fila", `${denuncia.achou}`, "true");
    await cdp.assentar();

    const painelDenuncia = await cdp.avaliar(
      naPagina(`
        const bloco = document.querySelector('[data-denuncia]');
        const painel = document.querySelector('[data-item-escolhido]');
        if (!bloco) return { presente: false };
        const t = bloco.textContent || '';
        return {
          presente: true,
          motivo: bloco.getAttribute('data-denuncia'),
          dizQueJaPublicado: t.includes('já está publicado'),
          temEncaminhamento: t.includes('se procede, vai para'),
          // ASSERÇÃO DE AUSÊNCIA COM PISO. Medir «nenhum score aqui dentro» sem antes
          // provar que o «aqui dentro» existe é uma frase que fica VERDE no dia em que o
          // seletor for renomeado: o conjunto vira vazio, o gate para de medir e continua
          // reportando sucesso. O piso é o painel; a ausência é medida dentro dele.
          // O piso é sobre A FONTE VARRIDA, e o seletor descendente sai: ele esconde o
          // desaparecimento do primeiro atributo dentro do resultado do segundo, e não há
          // como pôr piso num conjunto que já veio filtrado.
          painelExiste: Boolean(painel),
          scoresNoPainel: painel ? painel.querySelectorAll('[data-score-ia]').length : -1,
        };
      `),
    );
    exigir(
      painelDenuncia.presente &&
        painelDenuncia.dizQueJaPublicado &&
        painelDenuncia.temEncaminhamento,
      "o painel da denúncia diz que o item JÁ ESTÁ PUBLICADO e para onde ela vai",
      `motivo «${painelDenuncia.motivo}» · já publicado: ${painelDenuncia.dizQueJaPublicado} · encaminha: ${painelDenuncia.temEncaminhamento}`,
      "as duas frases presentes",
    );
    exigir(
      painelDenuncia.painelExiste && painelDenuncia.scoresNoPainel === 0,
      "e a denúncia NÃO tem score — não há estimativa, há afirmação a conferir",
      `painel presente: ${painelDenuncia.painelExiste} · ${painelDenuncia.scoresNoPainel} scores dentro dele`,
      "painel existe E zero scores — a ausência medida sobre um piso, não sobre o vazio",
    );

    // -----------------------------------------------------------------------
    titulo("── 109 · o veto não conclui com o motivo vazio, e as DUAS travas ──");
    // -----------------------------------------------------------------------

    await cdp.clicar(`document.querySelector('[data-acao-moderacao="vetar"]')`);
    await cdp.assentar();

    const vetoVazio = await cdp.avaliar(
      naPagina(`
        const botao = document.querySelector('[data-veto-bloqueado]');
        // A PRIMEIRA trava é o atributo; a SEGUNDA é a função, que recusa por conta
        // própria. Um clique programático passa por cima de \`disabled\` em vários
        // caminhos, e é exatamente esse caminho que se mede aqui.
        botao.click();
        const form = botao.closest('form');
        if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        return {
          bloqueado: botao.getAttribute('data-veto-bloqueado'),
          desabilitado: botao.disabled,
          decisoes: todos('[data-decisao-moderacao]').length,
        };
      `),
    );
    exigir(
      vetoVazio.bloqueado === "sim" && vetoVazio.desabilitado && vetoVazio.decisoes === 0,
      "veto com campo VAZIO: bloqueado, desabilitado, e ZERO decisão mesmo com clique forçado",
      `data-veto-bloqueado=${vetoVazio.bloqueado} · disabled=${vetoVazio.desabilitado} · ${vetoVazio.decisoes} decisões`,
      "sim · true · 0",
    );

    // Espaço em branco NÃO é motivo, e o aparo acontece antes de avaliar.
    const soEspaco = await cdp.avaliar(
      naPagina(`
        const campo = document.querySelector('[data-motivo-veto]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(campo, '     ');
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      `),
    );
    await cdp.assentar();
    const aposEspaco = await cdp.avaliar(
      naPagina(`
        const botao = document.querySelector('[data-veto-bloqueado]');
        botao.click();
        return { bloqueado: botao.getAttribute('data-veto-bloqueado'), decisoes: todos('[data-decisao-moderacao]').length };
      `),
    );
    exigir(
      soEspaco && aposEspaco.bloqueado === "sim" && aposEspaco.decisoes === 0,
      "espaço em branco não conta como motivo",
      `data-veto-bloqueado=${aposEspaco.bloqueado} · ${aposEspaco.decisoes} decisões`,
      "sim · 0",
    );

    // Com motivo escrito, o veto conclui — e a decisão nasce com autor e carimbo.
    await cdp.avaliar(
      naPagina(`
        const campo = document.querySelector('[data-motivo-veto]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(campo, 'Sem crédito de imagem declarado, e o acervo não sustenta a autoria.');
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      `),
    );
    await cdp.assentar();
    await cdp.clicar(`document.querySelector('[data-veto-bloqueado]')`);
    await cdp.assentar();

    const aposVeto = await cdp.avaliar(
      naPagina(`
        const ds = todos('[data-decisao-moderacao]');
        const primeira = ds[0];
        const t = primeira ? (primeira.textContent || '') : '';
        return {
          decisoes: ds.length,
          acao: primeira ? primeira.getAttribute('data-acao-registrada') : null,
          temMotivo: t.includes('Sem crédito de imagem declarado'),
          temAutor: Boolean(primeira && primeira.querySelector('[data-autor]')),
          temCarimbo: Boolean(primeira && primeira.querySelector('[data-carimbo]')),
        };
      `),
    );
    exigir(
      aposVeto.decisoes === 1 &&
        aposVeto.acao === "vetar" &&
        aposVeto.temMotivo &&
        aposVeto.temAutor &&
        aposVeto.temCarimbo,
      "com motivo escrito o veto conclui, e a decisão traz motivo, autor e carimbo",
      `${aposVeto.decisoes} decisão «${aposVeto.acao}» · motivo ${aposVeto.temMotivo} · autor ${aposVeto.temAutor} · carimbo ${aposVeto.temCarimbo}`,
      "1 · vetar · tudo presente",
    );

    // -----------------------------------------------------------------------
    titulo("── o registro sobrevive ao recarregamento, e o reinício o apaga ──");
    // -----------------------------------------------------------------------

    await cdp.navegar(ROTA_DA_FILA);
    await cdp.assentar();

    const aposRecarregar = await cdp.avaliar(
      naPagina(`
        const ds = todos('[data-decisao-moderacao]');
        return {
          decisoes: ds.length,
          motivo: ds[0] ? (ds[0].textContent || '').includes('Sem crédito de imagem declarado') : false,
          itens: todos('[data-item-fila]').length,
        };
      `),
    );
    exigir(
      aposRecarregar.decisoes === 1 && aposRecarregar.motivo,
      "recarregar PRESERVA a decisão, com o motivo por extenso",
      `${aposRecarregar.decisoes} decisão · motivo preservado: ${aposRecarregar.motivo}`,
      "1 · true",
    );
    exigir(
      aposRecarregar.itens === fila.itens - 1,
      "e o item decidido sai da fila de pendentes",
      `${aposRecarregar.itens} pendentes, de ${fila.itens}`,
      `${fila.itens - 1}`,
    );

    await cdp.clicar(`document.querySelector('[data-reiniciar-demonstracao]')`);
    await cdp.assentar();
    await cdp.clicar(`document.querySelector('[data-reiniciar-confirmado]')`);
    await cdp.assentar();

    const aposReinicio = await cdp.avaliar(
      naPagina(`
        return {
          decisoes: todos('[data-decisao-moderacao]').length,
          itens: todos('[data-item-fila]').length,
          armazem: window.localStorage.getItem('moderacao.v1'),
        };
      `),
    );
    exigir(
      aposReinicio.decisoes === 0 &&
        aposReinicio.itens === fila.itens &&
        aposReinicio.armazem === "[]",
      "reiniciar apaga o armazém e devolve a fila inteira",
      `${aposReinicio.decisoes} decisões · ${aposReinicio.itens} itens · armazém ${aposReinicio.armazem}`,
      `0 · ${fila.itens} · []`,
    );

    // -----------------------------------------------------------------------
    titulo("── a segunda fonte da fila, declarada mesmo vazia ──");
    // -----------------------------------------------------------------------

    const segundaFonte = await cdp.avaliar(
      naPagina(`
        const el = document.querySelector('[data-registros-vivos]');
        if (!el) return { presente: false };
        const t = el.textContent || '';
        return {
          presente: true,
          valor: el.getAttribute('data-registros-vivos'),
          dizPorQue: t.includes('ainda não foi construída'),
          dizQueNaoEhFaltaDeEnvio: t.includes('não porque nenhum'),
        };
      `),
    );
    exigir(
      segundaFonte.presente && segundaFonte.dizPorQue && segundaFonte.dizQueNaoEhFaltaDeEnvio,
      "a fonte vazia é DECLARADA, com o número e com a causa — não omitida",
      `valor=${segundaFonte.valor} · explica a causa: ${segundaFonte.dizPorQue}`,
      "presente, com causa",
    );

    // =======================================================================
    titulo("── M2 · a ficha: conferir campo a campo, e a barreira explicada ──");
    // =======================================================================

    // Entra pela FILA, como quem opera entra: o link leva o item aberto no endereço.
    await abrirFilaLimpa(cdp);
    const alvo = await cdp.avaliar(
      naPagina(`
        // Um item COM imagem e SEM crédito — é o caso que a barreira de 114 existe para
        // pegar, e medir a barreira num item que não a dispara não mede nada.
        const link = document.querySelector('[data-abrir-ficha]');
        return link ? link.getAttribute('href') : null;
      `),
    );
    exigir(Boolean(alvo), "a fila leva à ficha, com o item no endereço", String(alvo), "um href");

    await cdp.navegar(`${BASE}${alvo}`);
    await cdp.assentar();

    const ficha = await cdp.avaliar(
      naPagina(`
        const raiz = document.querySelector('[data-ficha-moderacao]');
        return {
          abriu: Boolean(raiz),
          item: raiz ? raiz.getAttribute('data-item-aberto') : null,
          campos: todos('[data-ficha-campos] .studio-linha').length,
          chave: document.querySelector('[data-chave-identidade]')?.getAttribute('data-chave-identidade') ?? null,
          componentes: todos('[data-chave-componente]').length,
          conferencias: todos('[data-conferencia]').length,
          acoes: todos('[data-acao-moderacao]').length,
        };
      `),
    );

    // O `?item=` precisa ABRIR NO ITEM PEDIDO. Sob export estático o HTML é o mesmo para
    // todos, e quem escolhe é o cliente — se isto falhar, todo link copiado da fila cai
    // sempre no mesmo registro e a ficha vira uma tela só.
    exigir(
      ficha.abriu && decodeURIComponent(String(alvo)).includes(String(ficha.item)),
      "a ficha abre NO ITEM que o endereço pediu",
      `href «${alvo}» · abriu em «${ficha.item}»`,
      "o mesmo item",
    );
    exigir(
      ficha.campos >= 10 && ficha.componentes === 3 && ficha.conferencias === 4,
      "a ficha traz os campos, os três componentes da chave e as quatro conferências",
      `${ficha.campos} campos · ${ficha.componentes} componentes · ${ficha.conferencias} conferências`,
      "≥10 · 3 · 4",
    );

    // A chave é a de §6, e o acervo sustenta só o título na maioria dos itens. O gate mede
    // que a marcação BATE com os bits — uma tela que marcasse os três sempre seria pior que
    // não marcar nenhum, porque afirmaria uma identidade que o registro não tem.
    const chaveConfere = await cdp.avaliar(
      naPagina(`
        const bits = document.querySelector('[data-chave-identidade]').getAttribute('data-chave-identidade');
        const marcados = todos('[data-chave-componente]').map((el) => el.getAttribute('data-atende'));
        const esperado = bits.split('').map((b) => (b === '1' ? 'sim' : 'nao'));
        return { bits, marcados, bate: JSON.stringify(marcados) === JSON.stringify(esperado) };
      `),
    );
    exigir(
      chaveConfere.bate,
      "os componentes marcados na tela batem com os bits da chave, um a um",
      `bits «${chaveConfere.bits}» · marcados ${JSON.stringify(chaveConfere.marcados)}`,
      "marcação idêntica aos bits",
    );

    // ---- 114 · a barreira: aprovar trava, o resto não ----
    const barreira = await cdp.avaliar(
      naPagina(`
        const bloqueio = document.querySelector('[data-bloqueio-publicacao]');
        const aprovar = document.querySelector('[data-acao-moderacao="aprovar"]');
        const vetar = document.querySelector('[data-acao-moderacao="vetar"]');
        const devolver = document.querySelector('[data-acao-moderacao="devolver"]');
        return {
          temBloqueio: Boolean(bloqueio),
          explica: bloqueio ? (bloqueio.textContent || '').includes('não entra no acervo público') : false,
          dizDeQuem: bloqueio ? (bloqueio.textContent || '').includes('Organização') : false,
          aprovarBarrado: aprovar ? aprovar.disabled : null,
          vetarLivre: vetar ? !vetar.disabled : null,
          devolverLivre: devolver ? !devolver.disabled : null,
        };
      `),
    );
    if (barreira.temBloqueio) {
      exigir(
        barreira.explica && barreira.dizDeQuem,
        "a barreira EXPLICA por que impede e de quem é a responsabilidade",
        `explica: ${barreira.explica} · nomeia o responsável: ${barreira.dizDeQuem}`,
        "as duas coisas",
      );
      // Uma tela que trava TUDO obriga quem modera a abandonar o item, e item abandonado
      // fica na fila para sempre. Só aprovar trava.
      exigir(
        barreira.aprovarBarrado === true &&
          barreira.vetarLivre === true &&
          barreira.devolverLivre === true,
        "com a barreira, SÓ aprovar trava — vetar e devolver seguem disponíveis",
        `aprovar ${barreira.aprovarBarrado} · vetar livre ${barreira.vetarLivre} · devolver livre ${barreira.devolverLivre}`,
        "true · true · true",
      );
    } else {
      exigir(
        barreira.aprovarBarrado === false,
        "sem barreira, aprovar está disponível",
        `aprovar barrado: ${barreira.aprovarBarrado}`,
        "false",
      );
    }

    // ---- 118 · o termo se ENCAMINHA, e o botão nunca oferece «criar» ----
    const termo = await cdp.avaliar(
      naPagina(`
        const bloco = document.querySelector('[data-conferencia="termo"]');
        const botao = document.querySelector('[data-encaminhar-termo]');
        const t = bloco ? (bloco.textContent || '') : '';
        return {
          existe: Boolean(bloco),
          diz: t.includes('ENCAMINHA ao Editor e não decide'),
          ofereceCriar: t.toLowerCase().includes('criar termo'),
          rotulo: botao ? (botao.textContent || '').trim() : null,
        };
      `),
    );
    exigir(
      termo.existe && termo.diz && termo.rotulo === "encaminhar ao Editor",
      "o termo se ENCAMINHA ao Editor — o botão não oferece criar",
      `rótulo «${termo.rotulo}» · declara o limite: ${termo.diz}`,
      "«encaminhar ao Editor»",
    );

    // ---- 119 · a classificação se CONFERE, não se arbitra ----
    const classificacao = await cdp.avaliar(
      naPagina(`
        const bloco = document.querySelector('[data-conferencia="classificacao"]');
        const t = bloco ? (bloco.textContent || '') : '';
        return {
          existe: Boolean(bloco),
          confereNaoArbitra: t.includes('CONFERE O DECLARADO, não arbitra'),
          dizDeQuem: t.includes('quem realiza o evento responde'),
        };
      `),
    );
    exigir(
      classificacao.existe && classificacao.confereNaoArbitra && classificacao.dizDeQuem,
      "a classificação indicativa é CONFERIDA, e a tela diz de quem é a responsabilidade",
      `confere e não arbitra: ${classificacao.confereNaoArbitra} · nomeia o responsável: ${classificacao.dizDeQuem}`,
      "as duas coisas",
    );

    // ---- o veto da ficha tem as mesmas três travas ----
    await cdp.clicar(`document.querySelector('[data-acao-moderacao="vetar"]')`);
    await cdp.assentar();
    const vetoNaFicha = await cdp.avaliar(
      naPagina(`
        const botao = document.querySelector('[data-veto-bloqueado]');
        botao.click();
        const form = botao.closest('form');
        if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        return {
          bloqueado: botao.getAttribute('data-veto-bloqueado'),
          desabilitado: botao.disabled,
          decisoes: todos('[data-decisao-moderacao]').length,
        };
      `),
    );
    exigir(
      vetoNaFicha.bloqueado === "sim" && vetoNaFicha.desabilitado && vetoNaFicha.decisoes === 0,
      "o veto DA FICHA também não conclui com o campo vazio",
      `bloqueado=${vetoNaFicha.bloqueado} · disabled=${vetoNaFicha.desabilitado} · ${vetoNaFicha.decisoes} decisões`,
      "sim · true · 0",
    );

    // ---- devolver NÃO exige motivo: a assimetria, exercida ----
    await cdp.avaliar(
      naPagina(`
        const cancelar = todos('.moderacao-veto button').find((b) => (b.textContent || '').includes('Cancelar'));
        if (cancelar) cancelar.click();
        return true;
      `),
    );
    await cdp.assentar();
    await cdp.clicar(`document.querySelector('[data-acao-moderacao="devolver"]')`);
    await cdp.assentar();

    const aposDevolver = await cdp.avaliar(
      naPagina(`
        const d = document.querySelector('[data-decisao-moderacao]');
        const t = d ? (d.textContent || '') : '';
        return {
          registrou: Boolean(d),
          acao: d ? d.getAttribute('data-acao-registrada') : null,
          temSituacao: t.includes('devolvido'),
          temAutor: t.includes('Moderação'),
        };
      `),
    );
    // A ASSIMETRIA, exercida e não descrita: devolver concluiu com o comentário VAZIO. Se
    // este gate ficasse vermelho, a tela estaria cobrando explicação de quem devolve a
    // palavra — e a distinção que a sessão inteira defende teria sumido do produto.
    exigir(
      aposDevolver.registrou &&
        aposDevolver.acao === "devolver" &&
        aposDevolver.temSituacao &&
        aposDevolver.temAutor,
      "DEVOLVER conclui com o comentário vazio — a assimetria exercida, não descrita",
      `ação «${aposDevolver.acao}» · situação na tela: ${aposDevolver.temSituacao} · autor: ${aposDevolver.temAutor}`,
      "devolver · registrado com situação e autor",
    );

    // ---- DEFEITOS DE FORMA, que gesto não pega ----
    //
    // Os dois vieram de olhar a tela, não de rodar a suíte: um controle desabilitado com
    // desenho de ativo, e uma lista que dizia «68 pendentes» mostrando oito. Viraram gate
    // para não voltarem na próxima tela.
    const forma = await cdp.avaliar(
      naPagina(`
        const desabilitados = todos('.moderacao [disabled]');
        const opacidades = desabilitados.map((el) => Number(getComputedStyle(el).opacity));
        const truncada = document.querySelector('[data-lista-truncada]');
        const t = truncada ? (truncada.textContent || '') : '';
        return {
          desabilitados: desabilitados.length,
          // Um controle desabilitado tem de PARECER desabilitado. Sem isso quem opera
          // clica, nada acontece, e só então lê o texto que explica o porquê.
          todosApagados: opacidades.every((o) => o < 0.7),
          declaraTruncagem: Boolean(truncada),
          // Por atributo, e nunca por padrão sobre o texto: dentro deste template a
          // barra invertida de um padrão colapsa, e o gate mente nas duas direções.
          diseQuantosFaltam: Number(truncada?.getAttribute('data-lista-truncada') ?? 0) > 0,
        };
      `),
    );
    exigir(
      forma.desabilitados === 0 || forma.todosApagados,
      "todo controle desabilitado PARECE desabilitado",
      `${forma.desabilitados} desabilitado(s) · todos apagados: ${forma.todosApagados}`,
      "nenhum com desenho de ativo",
    );
    exigir(
      forma.declaraTruncagem && forma.diseQuantosFaltam,
      "a lista de atalho DECLARA quantos pendentes ela não mostra",
      `declara: ${forma.declaraTruncagem} · com número: ${forma.diseQuantosFaltam}`,
      "lista truncada nunca em silêncio",
    );

    // ---- e a decisão tomada na ficha aparece na FILA: um armazém só ----
    await cdp.navegar(ROTA_DA_FILA);
    await cdp.assentar();
    const naFila = await cdp.avaliar(
      naPagina(`
        const ds = todos('[data-decisao-moderacao]');
        return { decisoes: ds.length, acao: ds[0] ? ds[0].getAttribute('data-acao-registrada') : null };
      `),
    );
    exigir(
      naFila.decisoes === 1 && naFila.acao === "devolver",
      "a decisão tomada na FICHA aparece na FILA — as duas telas escrevem no mesmo armazém",
      `${naFila.decisoes} decisão «${naFila.acao}» na fila`,
      "1 · devolver",
    );

    // =======================================================================
    titulo("── M9 · o histórico: auditável, com destino, e com o limite dito ──");
    // =======================================================================

    // Chega com UMA decisão de devolver já registrada, vinda da M2. O histórico é a tela
    // que prova que a decisão sobrevive à tela em que foi tomada.
    await cdp.navegar(`${BASE}/moderacao/historico/`);
    await cdp.assentar();

    const hist = await cdp.avaliar(
      naPagina(`
        const linhas = todos('[data-tabela-historico] [data-decisao-moderacao]');
        const primeira = linhas[0];
        const t = primeira ? (primeira.textContent || '') : '';
        return {
          decisoes: linhas.length,
          acao: primeira ? primeira.getAttribute('data-acao-registrada') : null,
          temAutor: Boolean(primeira && primeira.querySelector('[data-autor]')),
          // POR ATRIBUTO, e não por regex sobre o texto: dentro de um template literal
          // JS a barra invertida de um padrão colapsa e ele passa a não casar nada, o que
          // deixa o gate verde por acidente ou vermelho sem causa. O atributo traz o valor
          // exato, e não depende de escape nenhum sobreviver a duas camadas de string.
          temCarimbo: Boolean(primeira && primeira.querySelector('[data-carimbo]')?.getAttribute('data-carimbo')),
          temDestino: Boolean(primeira && primeira.querySelector('[data-destino]')),
          destinoDiz: primeira ? (primeira.querySelector('[data-destino]')?.textContent || '') : '',
          filtrosAcao: todos('[data-filtro-acao]').length,
          filtrosOrigem: todos('[data-filtro-origem]').length,
          filtrosEscopo: todos('[data-filtro-escopo]').length,
        };
      `),
    );

    exigir(
      hist.decisoes === 1 && hist.acao === "devolver" && hist.temAutor && hist.temCarimbo,
      "a decisão da M2 aparece no histórico, com autor e carimbo",
      `${hist.decisoes} decisão «${hist.acao}» · autor ${hist.temAutor} · carimbo ${hist.temCarimbo}`,
      "1 · devolver · os dois presentes",
    );

    // `rotaDoOutroLado`: sem isto o histórico mostra «devolvido» e ninguém sabe onde
    // procurar o que foi devolvido.
    exigir(
      hist.temDestino && hist.destinoDiz.includes("volta ao Studio"),
      "cada decisão diz PARA ONDE foi, do lado de quem recebeu",
      `destino presente: ${hist.temDestino} · «${hist.destinoDiz.slice(0, 60)}…»`,
      "o destino nomeado",
    );

    exigir(
      hist.filtrosAcao === 5 && hist.filtrosOrigem === 5 && hist.filtrosEscopo === 4,
      "os três filtros: ação, origem e escopo, cada um com a opção «todas»",
      `${hist.filtrosAcao} ação · ${hist.filtrosOrigem} origem · ${hist.filtrosEscopo} escopo`,
      "5 · 5 · 4",
    );

    // ---- o filtro RECORTA, e o que sai não some: volta ao trocar ----
    await cdp.clicar(`document.querySelector('[data-filtro-acao="vetar"]')`);
    await cdp.assentar();
    const filtrado = await cdp.avaliar(
      naPagina(`
        return {
          linhas: todos('[data-tabela-historico] [data-decisao-moderacao]').length,
          vazio: Boolean(document.querySelector('[data-historico-vazio]')),
          diz: (document.querySelector('[data-historico-vazio]')?.textContent || ''),
        };
      `),
    );
    // Filtrar por «vetar» com só uma devolução registrada tem de dar vazio — e o vazio
    // precisa DIZER que as outras continuam lá, senão lê-se como perda.
    exigir(
      filtrado.linhas === 0 && filtrado.vazio && filtrado.diz.includes("continuam registradas"),
      "filtro sem resultado DIZ que as outras decisões continuam registradas",
      `${filtrado.linhas} linhas · declara: ${filtrado.diz.slice(0, 50)}…`,
      "vazio explicado, nunca em branco",
    );

    await cdp.clicar(`document.querySelector('[data-filtro-acao="todas"]')`);
    await cdp.assentar();

    // ---- o painel de vetos e o limite da tela ----
    const limite = await cdp.avaliar(
      naPagina(`
        const vetos = document.querySelector('[data-painel-vetos]');
        const lim = document.querySelector('[data-limite-do-historico]');
        const t = lim ? (lim.textContent || '') : '';
        return {
          temPainelDeVetos: Boolean(vetos),
          // 169 é do Admin. Uma tela que mede desempenho entre moderadores tem outro dono
          // e outras salvaguardas — e esta diz isso em vez de apenas não fazer.
          dizQueNaoCompara: t.includes("NÃO compara moderadores"),
          nomeiaA169: t.includes("169"),
          dizQueEDoAdmin: t.includes("é do Admin"),
        };
      `),
    );
    exigir(
      limite.temPainelDeVetos &&
        limite.dizQueNaoCompara &&
        limite.nomeiaA169 &&
        limite.dizQueEDoAdmin,
      "a tela DIZ o que não é: não compara moderadores, e nomeia a 169 como do Admin",
      `painel de vetos: ${limite.temPainelDeVetos} · declara o limite: ${limite.dizQueNaoCompara} · nomeia 169: ${limite.nomeiaA169}`,
      "tudo presente",
    );

    // ---- desfazer no histórico volta o item à fila ----
    await cdp.clicar(`document.querySelector('[data-desfazer-decisao]')`);
    await cdp.assentar();
    const aposDesfazer = await cdp.avaliar(
      naPagina(`return { decisoes: todos('[data-decisao-moderacao]').length };`),
    );
    await cdp.navegar(ROTA_DA_FILA);
    await cdp.assentar();
    const filaDepois = await cdp.avaliar(
      naPagina(`return { itens: todos('[data-item-fila]').length };`),
    );
    exigir(
      aposDesfazer.decisoes === 0 && filaDepois.itens === fila.itens,
      "desfazer no histórico devolve o item à fila — as três telas leem o mesmo armazém",
      `${aposDesfazer.decisoes} decisões · ${filaDepois.itens} itens na fila`,
      `0 · ${fila.itens}`,
    );

    // =======================================================================
    titulo("── M3 · a IA: o score conferível, e aprovar como única porta ──");
    // =======================================================================

    await cdp.avaliar(`window.localStorage.removeItem("moderacao.v1")`);
    await cdp.navegar(`${BASE}/moderacao/ia/`);
    await cdp.assentar();

    const ia = await cdp.avaliar(
      naPagina(`
        const comp = todos('[data-componente-score]');
        const marcados = comp.filter((el) => el.getAttribute('data-atende') === 'sim');
        const bloco = document.querySelector('[data-score-do-item]');
        const conta = document.querySelector('[data-conta-conferida]');
        return {
          sugestoes: todos('[data-sugestao-ia]').length,
          componentes: comp.length,
          marcados: marcados.length,
          scoreExibido: bloco ? Number(bloco.getAttribute('data-score-do-item')) : null,
          contaConferida: conta ? Number(conta.getAttribute('data-conta-conferida')) : null,
          contaBate: conta ? (conta.textContent || '').includes('As duas contas batem') : false,
          faixas: todos('[data-faixa-score]').length,
          limites: todos('[data-limites-ia] li').length,
          declaraOrdem: Boolean(document.querySelector('[data-ordem-declarada]')),
        };
      `),
    );

    exigir(
      ia.sugestoes === 20 && ia.componentes === 5,
      "a tela recebe as 20 sugestões de IA e mostra os cinco componentes do score",
      `${ia.sugestoes} sugestões · ${ia.componentes} componentes`,
      "20 · 5",
    );

    // O PORTÃO CENTRAL DA SESSÃO INTEIRA: o score exibido é a soma dos componentes
    // marcados. Se um dia deixar de ser, o número volta a ser opaco — e um score opaco é
    // exatamente o recomendador que esta proposta recusa. A conta é refeita na tela e a
    // suíte confere que as duas batem, em vez de acreditar na frase que diz que batem.
    exigir(
      ia.contaConferida !== null &&
        ia.scoreExibido !== null &&
        Math.abs(ia.contaConferida - ia.scoreExibido) < 0.005 &&
        Math.abs(ia.marcados * 0.2 - ia.scoreExibido) < 0.005 &&
        ia.contaBate,
      "o score exibido É a soma dos componentes marcados — conferido, não afirmado",
      `${ia.marcados} de 5 marcados × 0,2 = ${(ia.marcados * 0.2).toFixed(2)} · conta na tela ${ia.contaConferida} · score ${ia.scoreExibido}`,
      "os três números iguais",
    );

    exigir(
      ia.faixas > 0 && ia.limites === 3 && ia.declaraOrdem,
      "a distribuição por faixa, os três limites da IA e a ordem declarada",
      `${ia.faixas} faixas · ${ia.limites} limites · ordem declarada: ${ia.declaraOrdem}`,
      "faixas > 0 · 3 · true",
    );

    // ---- descartar é vetar: exige motivo, com as mesmas travas ----
    await cdp.clicar(`document.querySelector('[data-acao-ia="descartar"]')`);
    await cdp.assentar();
    const descarte = await cdp.avaliar(
      naPagina(`
        const botao = document.querySelector('[data-veto-bloqueado]');
        botao.click();
        const form = botao.closest('form');
        if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        return {
          bloqueado: botao.getAttribute('data-veto-bloqueado'),
          desabilitado: botao.disabled,
          sugestoes: todos('[data-sugestao-ia]').length,
        };
      `),
    );
    exigir(
      descarte.bloqueado === "sim" && descarte.desabilitado && descarte.sugestoes === 20,
      "descartar uma sugestão EXIGE motivo — sem ele nada sai da lista",
      `bloqueado=${descarte.bloqueado} · disabled=${descarte.desabilitado} · ${descarte.sugestoes} sugestões intactas`,
      "sim · true · 20",
    );

    // ---- aprovar é a única porta, e ela deixa registro ----
    await cdp.avaliar(
      naPagina(`
        const cancelar = todos('.moderacao-veto button').find((b) => (b.textContent || '').includes('Cancelar'));
        if (cancelar) cancelar.click();
        return true;
      `),
    );
    await cdp.assentar();
    await cdp.clicar(`document.querySelector('[data-acao-ia="aprovar"]')`);
    await cdp.assentar();

    const aposAprovar = await cdp.avaliar(
      naPagina(`return { sugestoes: todos('[data-sugestao-ia]').length };`),
    );
    await cdp.navegar(`${BASE}/moderacao/historico/`);
    await cdp.assentar();
    const noHistorico = await cdp.avaliar(
      naPagina(`
        const d = document.querySelector('[data-decisao-moderacao]');
        return {
          registrou: Boolean(d),
          acao: d ? d.getAttribute('data-acao-registrada') : null,
          temCarimbo: Boolean(d && d.querySelector('[data-carimbo]')),
          origem: d ? (d.querySelector('[data-origem]')?.getAttribute('data-origem') ?? null) : null,
        };
      `),
    );
    // Aprovar é a ÚNICA porta pela qual uma sugestão vira dado público — e ela deixa rastro
    // no histórico, com autor e carimbo. Uma porta sem registro seria uma porta sem
    // responsável.
    exigir(
      aposAprovar.sugestoes === 19 &&
        noHistorico.registrou &&
        noHistorico.acao === "aprovar" &&
        noHistorico.temCarimbo &&
        noHistorico.origem === "ia",
      "aprovar tira da lista e deixa registro no histórico, com origem «ia» e carimbo",
      `${aposAprovar.sugestoes} pendentes · «${noHistorico.acao}» de origem «${noHistorico.origem}» · carimbo ${noHistorico.temCarimbo}`,
      "19 · aprovar · ia · true",
    );

    // =======================================================================
    titulo("── M8 · escopo impresso, escalonamento nomeado, delegação com fim ──");
    // =======================================================================

    await cdp.navegar(`${BASE}/moderacao/escopo/`);
    await cdp.assentar();

    const esc = await cdp.avaliar(
      naPagina(`
        const dentro = document.querySelector('[data-alcance="dentro"]');
        const fora = document.querySelector('[data-alcance="fora"]');
        const semUf = document.querySelector('[data-sem-uf]');
        return {
          escopos: todos('[data-escopo-curador]').length,
          dentro: dentro ? Number(dentro.getAttribute('data-valor')) : null,
          fora: fora ? Number(fora.getAttribute('data-valor')) : null,
          ufs: todos('[data-uf-na-fila]').length,
          semUf: semUf ? Number(semUf.getAttribute('data-sem-uf')) : null,
          escalonamentos: todos('[data-escalonamento]').length,
          destinatarios: todos('[data-destinatario]').map((el) => (el.textContent || '').trim()),
          delegacoes: todos('[data-delegacao]').length,
          vigentes: todos('[data-delegacao][data-vigente="sim"]').length,
        };
      `),
    );

    // 122 — as duas metades da mesma informação, com o mesmo peso. No nacional o «fora» é
    // zero; a soma tem de fechar a fila em qualquer escopo.
    exigir(
      esc.dentro !== null && esc.fora !== null && esc.dentro + esc.fora === fila.itens,
      "o escopo IMPRIME o que alcança e o que não alcança, e a soma fecha a fila",
      `${esc.dentro} dentro + ${esc.fora} fora = ${(esc.dentro ?? 0) + (esc.fora ?? 0)} de ${fila.itens}`,
      `soma === ${fila.itens}`,
    );

    // ---- trocar de escopo muda os dois números, e continua fechando ----
    await cdp.clicar(`document.querySelector('[data-escopo-curador="territorial"]')`);
    await cdp.assentar();
    const territorial = await cdp.avaliar(
      naPagina(`
        const d = Number(document.querySelector('[data-alcance="dentro"]').getAttribute('data-valor'));
        const f = Number(document.querySelector('[data-alcance="fora"]').getAttribute('data-valor'));
        return { dentro: d, fora: f, url: location.pathname };
      `),
    );
    exigir(
      territorial.fora > 0 &&
        territorial.dentro + territorial.fora === fila.itens &&
        territorial.url.startsWith("/moderacao/escopo"),
      "no territorial o «fora» deixa de ser zero, a soma fecha, e a URL não muda",
      `${territorial.dentro} dentro + ${territorial.fora} fora · URL ${territorial.url}`,
      `soma ${fila.itens} · mesma rota`,
    );

    // 123 — o destinatário é NOMEADO. «A equipe» é o mesmo que ninguém.
    const semGenerico = esc.destinatarios.every(
      (d) => d.length > 0 && !/^a equipe$/i.test(d) && !/^equipe$/i.test(d),
    );
    exigir(
      esc.escalonamentos === 4 && semGenerico,
      "cada escalonamento nomeia um destinatário — nunca «a equipe»",
      `${esc.escalonamentos} caminhos · ${JSON.stringify(esc.destinatarios)}`,
      "4 · todos nomeados",
    );

    // A linha que existe para os itens que NENHUM escopo territorial alcança. Sem ela,
    // 53 itens ficariam parados sem ninguém responsável — e a fila nacional é feita
    // justamente do que está fora do escopo de quase todo mundo.
    exigir(
      esc.semUf !== null && esc.semUf > 0 && esc.ufs > 0,
      "os itens sem UF são contados, e a cobertura por UF é medida sobre a fila",
      `${esc.ufs} UFs na fila · ${esc.semUf} itens sem UF`,
      "ambos > 0",
    );

    // 125 — delegação com início E fim. Sem fim é transferência sem data de volta.
    const deleg = await cdp.avaliar(
      naPagina(`
        return todos('[data-delegacao]').map((el) => {
          // POR ATRIBUTO. Garimpar data no texto com padrão dentro de template literal já
          // deu dois vermelhos sem causa nesta suíte: a barra invertida colapsa e o padrão
          // deixa de casar. O atributo traz o valor exato e não depende de escape nenhum.
          const p = el.querySelector('.moderacao-delegacao-periodo');
          const inicio = p ? p.getAttribute('data-inicio') : null;
          const fim = p ? p.getAttribute('data-fim') : null;
          return {
            id: el.getAttribute('data-delegacao'),
            vigente: el.getAttribute('data-vigente'),
            inicio,
            fim,
            datas: [inicio, fim].filter(Boolean).length,
          };
        });
      `),
    );
    exigir(
      deleg.length === 2 && deleg.every((d) => d.datas === 2),
      "toda delegação declara início E fim",
      deleg.map((d) => `${d.id}: ${d.inicio}→${d.fim}, vigente ${d.vigente}`).join(" · "),
      "2 delegações, 2 datas cada",
    );

    // A encerrada CONTINUA listada: «quem respondia por isto naquela semana» é a pergunta
    // que uma auditoria faz, e sumir seria não ter resposta.
    exigir(
      esc.vigentes === 1 && esc.delegacoes === 2,
      "a delegação encerrada continua listada ao lado da vigente",
      `${esc.delegacoes} delegações · ${esc.vigentes} vigente`,
      "2 · 1",
    );

    // =======================================================================
    titulo("── M5 · elenco: a afirmação sobre pessoa real, conferida ──");
    // =======================================================================

    await cdp.avaliar(`window.localStorage.removeItem("moderacao.v1")`);
    await cdp.navegar(`${BASE}/moderacao/elenco/`);
    await cdp.assentar();

    const el = await cdp.avaliar(
      naPagina(`
        const linhas = todos('[data-vinculo-elenco]');
        const propostos = linhas.filter((x) => x.getAttribute('data-proposto') === 'sim');
        const conf = document.querySelector('[data-acao-elenco="confirmar"]');
        const verbete = document.querySelector('[data-verbete]');
        const decl = document.querySelector('[data-nao-autoramos]');
        return {
          vinculos: linhas.length,
          propostos: propostos.length,
          confirmarBarrado: conf ? conf.disabled : null,
          temVerbete: Boolean(verbete && verbete.getAttribute('data-verbete')),
          declaraNaoAutorar: decl ? (decl.textContent || '').includes('afirmação factual') : false,
        };
      `),
    );
    exigir(
      el.vinculos === 10 && el.propostos === 3,
      "os vínculos de elenco, com os propostos marcados na lista",
      `${el.vinculos} vínculos · ${el.propostos} sem verbete`,
      "10 · 3",
    );
    exigir(
      el.declaraNaoAutorar,
      "a tela declara por que nenhum elenco foi autorado neste protótipo",
      `declara: ${el.declaraNaoAutorar}`,
      "true",
    );

    // ---- confirmar NÃO existe para vínculo sem verbete ----
    const semVerbete = await cdp.avaliar(
      naPagina(`
        const alvo = todos('[data-vinculo-elenco]').find((x) => x.getAttribute('data-proposto') === 'sim');
        if (!alvo) return { achou: false };
        alvo.querySelector('button').click();
        return { achou: true };
      `),
    );
    await cdp.assentar();
    const travado = await cdp.avaliar(
      naPagina(`
        const conf = document.querySelector('[data-acao-elenco="confirmar"]');
        // Trava também na função, não só no atributo: confirmar um vínculo cujo agente não
        // tem verbete criaria a pessoa pela porta dos fundos.
        if (conf) conf.click();
        const verbete = document.querySelector('[data-verbete]');
        return {
          barrado: conf ? conf.getAttribute('data-acao-barrada') : null,
          desabilitado: conf ? conf.disabled : null,
          decisoes: todos('[data-decisao-moderacao]').length,
          dizPorQue: verbete ? (verbete.textContent || '').includes('porta dos fundos') : false,
        };
      `),
    );
    exigir(
      semVerbete.achou &&
        travado.barrado === "sim" &&
        travado.desabilitado === true &&
        travado.decisoes === 0 &&
        travado.dizPorQue,
      "vínculo SEM verbete não se confirma, e a tela diz por quê",
      `barrado=${travado.barrado} · disabled=${travado.desabilitado} · ${travado.decisoes} decisões · explica: ${travado.dizPorQue}`,
      "sim · true · 0 · true",
    );

    // ---- recusar uma afirmação sobre pessoa real exige motivo ----
    await cdp.clicar(`document.querySelector('[data-acao-elenco="recusar"]')`);
    await cdp.assentar();
    const recusa = await cdp.avaliar(
      naPagina(`
        const b = document.querySelector('[data-veto-bloqueado]');
        b.click();
        const f = b.closest('form');
        if (f) f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        return { bloqueado: b.getAttribute('data-veto-bloqueado'), decisoes: todos('[data-decisao-moderacao]').length };
      `),
    );
    exigir(
      recusa.bloqueado === "sim" && recusa.decisoes === 0,
      "recusar uma afirmação sobre pessoa real EXIGE motivo escrito",
      `bloqueado=${recusa.bloqueado} · ${recusa.decisoes} decisões`,
      "sim · 0",
    );

    // =======================================================================
    titulo("── M6 · reconciliação: a moderação liga, e nunca edita verbete ──");
    // =======================================================================

    await cdp.navegar(`${BASE}/moderacao/reconciliacao/`);
    await cdp.assentar();

    const rec = await cdp.avaliar(
      naPagina(`
        const aviso = document.querySelector('[data-aviso-enciclopedia]');
        const t = aviso ? (aviso.textContent || '') : '';
        const cands = todos('[data-candidato]');
        const porque = cands[0] ? (cands[0].textContent || '') : '';
        return {
          propostas: todos('[data-proposta]').length,
          temAviso: Boolean(aviso),
          dizQueLiga: t.includes('LIGA a proposta') || t.includes('nunca edita'),
          candidatos: cands.length,
          // NUNCA «similaridade 0,87». Se aparecer número de parecença, a tela virou o
          // recomendador opaco que a sessão recusa.
          // SEM PADRÃO. Aqui a barra invertida colapsa e o teste vira sempre verdadeiro —
          // foi o que a injeção provou: o gate afirmava «sem pontuação» sobre um texto que
          // exibia «similaridade: 0,94». A verificação passa a ser por conteúdo literal,
          // que é o que uma pontuação de parecença sempre traz.
          semPontuacao:
            !porque.toLowerCase().includes('similaridade') &&
            !porque.toLowerCase().includes('confiança') &&
            !/[0-9][.,][0-9]/.test(porque.replace(/[0-9]+\u002E[0-9]{3}/g, '')),
          dizPorqueApareceu: porque.includes('normalizado'),
          temEncaminhar: Boolean(document.querySelector('[data-encaminhar-criacao]')),
          temReconciliar: Boolean(document.querySelector('[data-reconciliar]')),
        };
      `),
    );
    exigir(
      rec.temAviso && rec.dizQueLiga,
      "o aviso de que o verbete é autoridade da Enciclopédia é PERMANENTE, acima da decisão",
      `presente: ${rec.temAviso} · diz que liga e não edita: ${rec.dizQueLiga}`,
      "as duas coisas",
    );
    exigir(
      rec.candidatos > 0 && rec.semPontuacao && rec.dizPorqueApareceu,
      "o candidato diz POR QUE apareceu, e não traz pontuação de similaridade",
      `${rec.candidatos} candidato(s) · sem pontuação: ${rec.semPontuacao} · explica: ${rec.dizPorqueApareceu}`,
      "regra por extenso, nenhum número de parecença",
    );
    exigir(
      rec.temReconciliar && rec.temEncaminhar,
      "os dois caminhos existem: reconciliar com verbete, ou encaminhar a criação ao Editor",
      `reconciliar: ${rec.temReconciliar} · encaminhar: ${rec.temEncaminhar}`,
      "ambos",
    );

    // ---- reconciliar registra, e o registro diz com qual verbete ----
    await cdp.clicar(`document.querySelector('[data-reconciliar]')`);
    await cdp.assentar();
    await cdp.navegar(`${BASE}/moderacao/historico/`);
    await cdp.assentar();
    const noHist = await cdp.avaliar(
      naPagina(`
        const d = document.querySelector('[data-decisao-moderacao]');
        return {
          registrou: Boolean(d),
          titulo: d ? (d.querySelector('.moderacao-decisao-titulo')?.textContent || '') : '',
          temCarimbo: Boolean(d && d.querySelector('[data-carimbo]')),
        };
      `),
    );
    exigir(
      noHist.registrou && noHist.titulo.includes("reconciliado com") && noHist.temCarimbo,
      "reconciliar deixa registro nomeando o verbete ligado",
      `«${noHist.titulo.slice(0, 60)}» · carimbo ${noHist.temCarimbo}`,
      "o nome do verbete no registro",
    );

    // =======================================================================
    titulo("── M4 · similaridade: governar 47.259 sem fingir que revisou ──");
    // =======================================================================

    await cdp.avaliar(`window.localStorage.removeItem("moderacao.v1")`);
    await cdp.navegar(`${BASE}/moderacao/similaridade/`);
    await cdp.assentar();

    const sim = await cdp.avaliar(
      naPagina(`
        const alc = document.querySelector('[data-revisao="alcancada"]');
        const sem = document.querySelector('[data-revisao="sem-revisao"]');
        const cauda = document.querySelector('[data-cauda]');
        const fams = todos('[data-familia]');
        const soma = fams.reduce((s, el) => s + Number(el.getAttribute('data-arestas') || 0), 0);
        return {
          familias: fams.length,
          somaDasFamilias: soma,
          alcancadas: alc ? Number(alc.getAttribute('data-valor')) : null,
          semRevisao: sem ? Number(sem.getAttribute('data-valor')) : null,
          arestasNaCauda: cauda ? Number(cauda.getAttribute('data-cauda')) : null,
          pendentes: fams.filter((el) => el.getAttribute('data-veredito') === 'pendente').length,
        };
      `),
    );

    // O CONTADOR HONESTO, e ele tem de fechar: alcançadas + sem revisão = o total. Com
    // zero decisões, TUDO está sem revisão — e a tela abre dizendo isso.
    exigir(
      sim.alcancadas === 0 && sim.semRevisao === 47259,
      "sem decisão nenhuma, a tela declara as 47.259 arestas como SEM revisão",
      `${sim.alcancadas} alcançadas · ${sim.semRevisao} sem revisão`,
      "0 · 47259",
    );

    // A cauda entra no denominador em vez de sumir: 12 famílias mostradas + a cauda têm
    // de somar o total, senão as 12 pareceriam o conjunto inteiro.
    exigir(
      sim.familias === 12 &&
        sim.arestasNaCauda !== null &&
        sim.somaDasFamilias + sim.arestasNaCauda === 47259,
      "as 12 famílias mostradas mais a cauda declarada somam as 47.259",
      `${sim.familias} famílias = ${sim.somaDasFamilias} + cauda ${sim.arestasNaCauda} = ${sim.somaDasFamilias + (sim.arestasNaCauda ?? 0)}`,
      "soma === 47259",
    );

    // ---- aprovar uma família move o contador pelo NÚMERO DE ARESTAS DELA ----
    const antesDeAprovar = await cdp.avaliar(
      naPagina(`return Number(document.querySelector('[data-familia]').getAttribute('data-arestas'));`),
    );
    await cdp.clicar(`document.querySelector('[data-veredito-familia="aprovada"]')`);
    await cdp.assentar();
    const depois = await cdp.avaliar(
      naPagina(`
        const alc = document.querySelector('[data-revisao="alcancada"]');
        const sem = document.querySelector('[data-revisao="sem-revisao"]');
        return {
          alcancadas: Number(alc.getAttribute('data-valor')),
          semRevisao: Number(sem.getAttribute('data-valor')),
        };
      `),
    );
    exigir(
      depois.alcancadas === antesDeAprovar &&
        depois.alcancadas + depois.semRevisao === 47259,
      "aprovar a família move o contador pelas arestas DELA, e a soma continua fechando",
      `família de ${antesDeAprovar} arestas → ${depois.alcancadas} alcançadas + ${depois.semRevisao} sem revisão = ${depois.alcancadas + depois.semRevisao}`,
      `${antesDeAprovar} · soma 47259`,
    );

    // ---- reprovar milhares de arestas de uma vez EXIGE motivo ----
    await cdp.avaliar(
      naPagina(`
        const outra = todos('[data-familia]').find((el) => el.getAttribute('data-veredito') === 'pendente');
        if (outra) outra.querySelector('button').click();
        return true;
      `),
    );
    await cdp.assentar();
    await cdp.clicar(`document.querySelector('[data-veredito-familia="reprovada"]')`);
    await cdp.assentar();
    const repr = await cdp.avaliar(
      naPagina(`
        const b = document.querySelector('[data-veto-bloqueado]');
        b.click();
        const f = b.closest('form');
        if (f) f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        const alc = document.querySelector('[data-revisao="alcancada"]');
        return {
          bloqueado: b.getAttribute('data-veto-bloqueado'),
          alcancadas: Number(alc.getAttribute('data-valor')),
        };
      `),
    );
    exigir(
      repr.bloqueado === "sim" && repr.alcancadas === antesDeAprovar,
      "reprovar milhares de arestas de uma vez EXIGE motivo — o contador não se mexe sem ele",
      `bloqueado=${repr.bloqueado} · contador parado em ${repr.alcancadas}`,
      `sim · ${antesDeAprovar}`,
    );

    // ---- a tela declara o que NÃO faz ----
    const declara = await cdp.avaliar(
      naPagina(`
        const d = document.querySelector('[data-declaracao-revisao]');
        const t = d ? (d.textContent || '') : '';
        return {
          existe: Boolean(d),
          dizQueNaoRevisaUmaAUma: t.includes('não revisa aresta a aresta'),
          declaraAusencia: t.includes('declarado como ausência'),
        };
      `),
    );
    exigir(
      declara.existe && declara.dizQueNaoRevisaUmaAUma && declara.declaraAusencia,
      "a tela declara que NÃO revisa uma a uma, e o que falta entra como ausência",
      `diz que não revisa: ${declara.dizQueNaoRevisaUmaAUma} · declara a ausência: ${declara.declaraAusencia}`,
      "as duas coisas",
    );

    // =======================================================================
    titulo("── M7 · duplicatas: a competência, e a ausência declarada ──");
    // =======================================================================

    await cdp.navegar(`${BASE}/moderacao/duplicatas/`);
    await cdp.assentar();

    const dup = await cdp.avaliar(
      naPagina(`
        const mod = document.querySelector('[data-lado="moderacao"]');
        const prod = document.querySelector('[data-lado="produtor"]');
        const aviso = document.querySelector('[data-sem-caso-cruzado]');
        const grupos = todos('[data-grupo-duplicata]');
        const semAcao = document.querySelector('[data-sem-acao]');
        const comparacao = document.querySelector('[data-comparacao]');
        return {
          // Piso por fonte: cada conjunto é provado antes de ser medido.
          temDenominadores: Boolean(mod && prod),
          daModeracao: mod ? Number(mod.getAttribute('data-valor')) : null,
          doProdutor: prod ? Number(prod.getAttribute('data-valor')) : null,
          declaraAusencia: Boolean(aviso),
          grupos: grupos.length,
          temComparacao: Boolean(comparacao),
          campos: comparacao ? comparacao.querySelectorAll('[data-campo]').length : -1,
          // A ausência de botão é o conteúdo: oferecer decisão sobre grupo de competência
          // alheia desfaria, na interface, a regra que a tela existe para afirmar.
          semBotaoDeDecisao: Boolean(semAcao),
          botoesDeDecisao: document.querySelectorAll('[data-veredito-familia], [data-acao-moderacao]').length,
        };
      `),
    );

    exigir(
      dup.temDenominadores && dup.daModeracao === 0 && dup.doProdutor === 84,
      "a competência é declarada com os dois números: 0 desta mesa, 84 do produtor",
      `moderação ${dup.daModeracao} · produtor ${dup.doProdutor}`,
      "0 · 84",
    );

    // A tela NÃO abre vazia mesmo sem caso: tela vazia não distingue «não há caso» de «a
    // busca não rodou», e a diferença é tudo o que ela tem para dizer hoje.
    exigir(
      dup.declaraAusencia && dup.grupos > 0,
      "sem caso cruzado, a tela DECLARA a ausência e mostra os grupos que existem",
      `declara: ${dup.declaraAusencia} · ${dup.grupos} grupos listados`,
      "declara, e não abre vazia",
    );

    exigir(
      dup.temComparacao && dup.campos > 0,
      "a comparação campo a campo continua, herdada da fase 4",
      `${dup.campos} campos comparados`,
      "> 0",
    );

    exigir(
      dup.semBotaoDeDecisao && dup.botoesDeDecisao === 0,
      "não há botão de decisão sobre grupo de competência do produtor",
      `declara por quê: ${dup.semBotaoDeDecisao} · ${dup.botoesDeDecisao} botões de decisão`,
      "true · 0",
    );

    // -----------------------------------------------------------------------
    titulo("── zero erro de console na navegação inteira ──");
    // -----------------------------------------------------------------------

    const erros = cdp.consola.filter((c) => c.nivel === "erro");
    exigir(
      erros.length === 0,
      "console limpo",
      `${erros.length} erro(s)${erros.length ? ": " + erros.map((e) => e.texto).join(" | ").slice(0, 300) : ""}`,
      "0",
    );
  } finally {
    await cdp.encerrar();
  }

  console.log(
    `\n  ${verdes} verdes${falhas.length ? ` · ${falhas.length} FALHA(S): ${falhas.join(", ")}` : ""}\n`,
  );
  if (falhas.length) process.exitCode = 1;
}

/**
 * `--provar-ausencias` — o teste do teste.
 *
 * UM GATE VERDE SÓ SIGNIFICA ALGO SE ELE JÁ FOI VISTO VERMELHO. Sem isso, «nenhum X» é uma
 * frase que continua verde no dia em que o conjunto medido virar vazio — o gate para de
 * medir e segue reportando sucesso, que é o pior defeito possível numa ferramenta de
 * verificação.
 *
 * Cada caso abaixo injeta UM defeito, roda a suíte inteira, e exige que o gate nomeado
 * fique vermelho. O arquivo é restaurado byte a byte depois de cada um, e a árvore é
 * conferida no fim.
 *
 * TRÊS ARMADILHAS APRENDIDAS DE OUTRAS SESSÕES, e cada uma produziu falso verde em alguém:
 *
 * 1. `replaceAll`, nunca a primeira ocorrência. Um identificador aparece na declaração, no
 *    rótulo e no uso; trocar só o primeiro deixa o piso de pé nos outros e o caso passa
 *    verde por metade da injeção.
 * 2. Substituição por texto exato, nunca por padrão de tag: `<input[^>]*>` para de casar no
 *    primeiro `=>` de qualquer `onChange`, e fica cego para todo atributo depois dele.
 * 3. Restaurar do conteúdo original em memória, e conferir com `git diff` depois.
 */
const DEFEITOS = [
  {
    nome: "score de modelo",
    arquivo: "src/dados/moderacao.ts",
    de: "return Math.round((atendidos.length / COMPONENTES_DO_SCORE.length) * 100) / 100;",
    para: "return 0.8;",
    gateEsperado: "o score exibido É a soma dos componentes marcados",
  },
  {
    // O VETO TEM TRÊS TRAVAS, e a primeira injeção provou que elas são independentes:
    // derrubar `registrarVeto` sozinha não mudou nada, porque `disabled` e
    // `decisaoCompleta` continuavam barrando. Não é falha do gate — é a defesa em
    // profundidade funcionando. A injeção honesta derruba as três de uma vez.
    nome: "veto sem motivo passa (as três travas derrubadas)",
    arquivo: "src/componentes/moderacao-fila.tsx",
    de: "disabled={!motivoAparado}",
    para: "disabled={false}",
    tambem: [
      { de: "if (!motivoAparado) return;", para: "if (false) return;" },
      { de: "if (!decisaoCompleta(decisao)) return;", para: "if (false) return;" },
    ],
    gateEsperado: "veto com campo VAZIO",
  },
  {
    nome: "escopo esconde o que não alcança",
    arquivo: "src/componentes/moderacao-escopo.tsx",
    de: "data-valor={fora}",
    para: "data-valor={0}",
    // O gate do NACIONAL não exerce este defeito: lá o «fora» verdadeiro já é zero, e
    // zerá-lo não muda a soma. Quem o exerce é o do territorial, onde ele vale 49.
    gateEsperado: "no territorial o «fora» deixa de ser zero",
  },
  {
    nome: "similaridade infla o revisado",
    arquivo: "src/componentes/moderacao-similaridade.tsx",
    de: "const semRevisao = panorama.totalDeArestas - alcancadas;",
    para: "const semRevisao = 0;",
    gateEsperado: "sem decisão nenhuma, a tela declara as 47.259 arestas como SEM revisão",
  },
  {
    nome: "elenco confirma sem verbete",
    arquivo: "src/componentes/moderacao-elenco.tsx",
    de: "disabled={vinculo.proposto}",
    para: "disabled={false}",
    gateEsperado: "vínculo SEM verbete não se confirma",
  },
  {
    nome: "reconciliação exibe pontuação de similaridade",
    arquivo: "src/dados/moderacao.ts",
    de: "`O nome digitado, normalizado, é idêntico ao título deste verbete ` +",
    para: "`similaridade: 0,94 — ` +",
    gateEsperado: "o candidato diz POR QUE apareceu",
  },
  {
    nome: "duplicatas oferecem decisão de competência alheia",
    arquivo: "src/componentes/moderacao-duplicatas.tsx",
    de: '<div className="studio-nao-sustenta" data-nao-sustenta data-sem-acao>',
    para: '<div className="studio-nao-sustenta" data-nao-sustenta data-sem-acao-REMOVIDO>',
    gateEsperado: "não há botão de decisão sobre grupo de competência do produtor",
  },
];

async function provarAusencias() {
  const { readFile, writeFile } = await import("node:fs/promises");
  const { execFileSync } = await import("node:child_process");
  // `fileURLToPath`, e não `new URL(...).pathname`: o caminho deste repositório tem acento
  // («bid-itaú»), e o `pathname` de uma URL devolve-o percent-encoded — o `node` receberia
  // um caminho que não existe e todo caso «falharia» por MODULE_NOT_FOUND, dando o
  // resultado certo pelo motivo errado.
  const { fileURLToPath } = await import("node:url");
  const esteArquivo = fileURLToPath(import.meta.url);

  console.log(`\nPROVAR AUSÊNCIAS — ${DEFEITOS.length} defeitos injetados, um a um\n`);
  const resultados = [];

  for (const d of DEFEITOS) {
    const original = await readFile(d.arquivo, "utf8");
    if (!original.includes(d.de)) {
      console.log(`  FALHA ${d.nome}: o alvo da injeção não existe mais em ${d.arquivo}`);
      resultados.push({ ...d, ok: false, motivo: "alvo ausente" });
      continue;
    }
    // `replaceAll`: trocar só a primeira ocorrência deixa o resto de pé e o caso passa
    // verde por metade da injeção.
    let comDefeito = original.replaceAll(d.de, d.para);
    // Alguns defeitos só aparecem com mais de uma trava derrubada. Cada troca extra é
    // conferida: um alvo ausente faria o caso passar por metade da injeção.
    for (const extra of d.tambem ?? []) {
      if (!comDefeito.includes(extra.de)) {
        console.log(`  FALHA ${d.nome}: alvo extra ausente — «${extra.de.slice(0, 40)}»`);
        comDefeito = original;
        break;
      }
      comDefeito = comDefeito.replaceAll(extra.de, extra.para);
    }
    await writeFile(d.arquivo, comDefeito);
    let saida = "";
    try {
      saida = execFileSync(process.execPath, [esteArquivo, "--base", BASE], {
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
      });
    } catch (erro) {
      saida = String(erro.stdout ?? "") + String(erro.stderr ?? "");
    } finally {
      await writeFile(d.arquivo, original);
    }
    const ficouVermelho = saida
      .split("\n")
      .some((l) => l.startsWith("  FALHA") && l.includes(d.gateEsperado));
    console.log(
      `  ${ficouVermelho ? "ok  " : "FALHA"} ${d.nome}: gate «${d.gateEsperado}» ${
        ficouVermelho ? "ficou VERMELHO" : "seguiu verde — o gate não mede o que promete"
      }`,
    );
    resultados.push({ ...d, ok: ficouVermelho });
  }

  const sujo = execFileSync("git", ["status", "--porcelain", ...DEFEITOS.map((d) => d.arquivo)], {
    encoding: "utf8",
  }).trim();
  console.log(`\n  árvore restaurada: ${sujo === "" ? "sim, git status limpo" : "NÃO — " + sujo}`);

  const falharam = resultados.filter((r) => !r.ok);
  console.log(
    `\n  ${resultados.length - falharam.length} de ${resultados.length} defeitos vistos vermelhos` +
      (falharam.length ? ` · ${falharam.length} NÃO capturado(s)` : "") +
      "\n",
  );
  if (falharam.length || sujo !== "") process.exitCode = 1;
}

if (process.argv.includes("--provar-ausencias")) {
  provarAusencias().catch((erro) => {
    console.error(`\nprovar-ausencias quebrou: ${erro.message}\n`);
    process.exitCode = 1;
  });
} else {
  principal().catch((erro) => {
    console.error(`\nverificar-moderacao.mjs quebrou: ${erro.message}\n`);
    process.exitCode = 1;
  });
}
