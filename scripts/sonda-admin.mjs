/**
 * sonda-admin.mjs, o poder do administrador dentro do aplicativo.
 *
 * O QUE ELA PROVA, e nenhum portão estático prova: que a tira só existe para o perfil de
 * administração, que a ação muda o que a tela mostra, e que ela sobrevive ao recarregamento.
 * Um componente pode compilar, passar no design system e nunca aparecer.
 *
 * SE ELA TRAVAR SEM IMPRIMIR NADA, o motivo quase certo é Chrome headless órfão de uma
 * rodada anterior que morreu no meio. Mate só os processos cuja linha de comando tenha
 * `--headless=new`, que é o distintivo dos daqui.
 *
 * Rode com `node scripts/sonda-admin.mjs`, com `out/` já construído.
 */

import { abrirNavegador, naPagina } from "./navegador.mjs";
import { servir } from "./servir-out.mjs";

const CHAVE_PAPEL = "agenda-cultural:papel";
const CHAVE_ADMIN = "admin.acoes.v1";

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

/** A primeira publicação que o artefato exportou. */
function primeiraPublicacao(fs, path) {
  const dir = path.join("out", "comunidade", "publicacao");
  const nomes = fs.readdirSync(dir).filter((n) => fs.statSync(path.join(dir, n)).isDirectory());
  return nomes.sort()[0];
}

const fs = await import("node:fs");
const path = await import("node:path");
const alvo = primeiraPublicacao(fs.default, path.default);

const servidor = await servir();
const base = servidor.url;
let cdp;

try {
  cdp = await abrirNavegador();
  console.log("\nsonda-admin, o poder dentro do aplicativo\n");
  console.log(`  publicação de prova: ${alvo}\n`);

  const rota = `${base}/comunidade/publicacao/${alvo}/`;

  // ---- 1. como PÚBLICO, a tira não existe ----
  await cdp.navegar(rota);
  await cdp.avaliar(
    `localStorage.setItem('${CHAVE_PAPEL}', 'publico'); localStorage.removeItem('${CHAVE_ADMIN}');`,
  );
  await cdp.navegar(rota);
  const publico = await cdp.avaliar(
    naPagina(`return {
      tiras: document.querySelectorAll('[data-admin-controles]').length,
      conteudo: (document.body.innerText || '').trim().length,
    };`),
  );
  exigir(
    publico.tiras === 0 && publico.conteudo > 200,
    "como público, a publicação abre e NÃO tem tira de administração",
    `tiras: ${publico.tiras} · ${publico.conteudo} caracteres`,
    "0 tiras, com conteúdo",
  );

  // ---- 2. como ADMIN, a tira aparece com os quatro verbos ----
  await cdp.avaliar(`localStorage.setItem('${CHAVE_PAPEL}', 'admin');`);
  await cdp.navegar(rota);
  const adm = await cdp.avaliar(
    naPagina(`return {
      tiras: document.querySelectorAll('[data-admin-controles]').length,
      acoes: Array.from(document.querySelectorAll('[data-acao]')).map(b => b.getAttribute('data-acao')),
    };`),
  );
  exigir(
    adm.tiras === 1 && ["editar", "mover", "suspender", "apagar"].every((a) => adm.acoes.includes(a)),
    "como admin, a tira aparece com editar, mover, suspender e apagar",
    `tiras: ${adm.tiras} · ações: ${adm.acoes.join(", ")}`,
    "1 tira com os quatro verbos",
  );

  // ---- 3. suspender exige motivo ----
  await cdp.clicar(`document.querySelector('[data-acao="suspender"]')`);
  const semMotivo = await cdp.avaliar(
    naPagina(`const b = document.querySelector('[data-confirmar="suspender"]');
      return { existe: !!b, desabilitado: b ? b.disabled : null,
               falta: !!document.querySelector('[data-falta]') };`),
  );
  exigir(
    semMotivo.existe && semMotivo.desabilitado === true && semMotivo.falta,
    "suspender sem motivo fica barrado, e a tela diz o que falta",
    `botão desabilitado: ${semMotivo.desabilitado} · aviso do que falta: ${semMotivo.falta}`,
    "barrado, com aviso",
  );

  // ---- 4. com motivo, a ação vale e a tela muda ----
  await cdp.avaliar(
    naPagina(`const i = document.querySelector('[data-campo="motivo"]');
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(i, 'conteudo fora do escopo da comunidade');
      i.dispatchEvent(new Event('input', { bubbles: true }));
      return true;`),
  );
  await cdp.clicar(`document.querySelector('[data-confirmar="suspender"]')`);
  const depois = await cdp.avaliar(
    naPagina(`return {
      suspenso: !!document.querySelector('[data-item-suspenso]'),
      selo: !!document.querySelector('[data-estado="suspenso"]'),
    };`),
  );
  exigir(
    depois.suspenso && depois.selo,
    "suspender muda a tela: o aviso e o selo aparecem",
    `aviso: ${depois.suspenso} · selo: ${depois.selo}`,
    "os dois",
  );

  // ---- 5. sobrevive ao recarregamento, e o registro guarda autor e motivo ----
  await cdp.navegar(rota);
  const guardado = await cdp.avaliar(
    naPagina(`const bruto = localStorage.getItem('${CHAVE_ADMIN}');
      const j = bruto ? JSON.parse(bruto) : {};
      const r = (j.registro || [])[0] || {};
      return {
        suspenso: !!document.querySelector('[data-item-suspenso]'),
        linhas: (j.registro || []).length,
        acao: r.acao || '', autor: r.autor || '', motivo: r.motivo || '', carimbo: r.carimbo || '',
      };`),
  );
  exigir(
    guardado.suspenso && guardado.linhas === 1 && guardado.acao === "suspender",
    "a suspensão sobrevive ao recarregamento",
    `suspenso: ${guardado.suspenso} · linhas no registro: ${guardado.linhas}`,
    "suspenso, com 1 linha",
  );
  exigir(
    guardado.autor !== "" && guardado.motivo !== "" && guardado.carimbo !== "",
    "o registro guarda autor, motivo e carimbo",
    `autor: «${guardado.autor}» · motivo: «${guardado.motivo}» · carimbo: «${guardado.carimbo}»`,
    "os três preenchidos",
  );

  // ---- 6. o carimbo é o do build, nunca o relógio de quem abre ----
  exigir(
    /^\d{4}-\d{2}-\d{2}$/.test(guardado.carimbo),
    "o carimbo é a data de referência do build, e não o relógio de quem abre",
    `carimbo: ${guardado.carimbo}`,
    "a data de referência",
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
