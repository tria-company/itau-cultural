/**
 * verificar-organizacao.mjs — a suíte do nível 6 · Organização (S6).
 *
 * ARQUIVO NOVO E DESTA SESSÃO. O §6 do protocolo das seis sessões proíbe editar as suítes
 * `verificar-fase*.mjs` que já existem; cada sessão cria a sua. Esta não toca em nenhuma
 * delas, e nenhuma delas precisa saber que esta existe.
 *
 * ELA MEDE OS OITO PORTÕES DO §8 DO PRD, e mede em vez de afirmar. A diferença importa: um
 * portão que lê o código-fonte procurando a frase certa passa quando alguém escreve a frase;
 * um portão que abre a tela e conta nó passa quando a tela faz a coisa.
 *
 * DUAS ARMADILHAS DE MÉTODO QUE ESTA SUÍTE JÁ NASCE EVITANDO, as duas pagas em falso
 * negativo durante a construção das dez telas:
 *
 *  1. **Nunca `innerText` de string montada.** React separa `Capítulos (` · `{n}` · `)` em
 *     nós de texto vizinhos, e `innerText` — que é baseado em layout — não os junta como
 *     `textContent`. `innerText.includes('Capítulos (1)')` devolve `false` sobre uma tela
 *     correta. Pior: pode devolver `true` por acaso sobre uma tela quebrada. Aqui se mede
 *     por `textContent` de elemento e por CONTAGEM DE NÓ.
 *  2. **A primeira navegação nunca é para a raiz.** Com a máquina carregada, o `next dev`
 *     levou 26 s só para responder `/`, contra o teto de 30 s do cliente CDP — e o smoke
 *     morria em `tempo esgotado em Page.navigate` sem nada a ver com a tela. O teto aqui é
 *     folgado e a navegação vai direto para a rota medida.
 *
 * COMO RODAR. Ela precisa de um servidor de pé, porque `npm run build` é fila compartilhada
 * entre seis sessões:
 *
 *     NEXT_SESSAO=s6 npx next dev -p 3006
 *     node scripts/verificar-organizacao.mjs
 *
 * `--base` troca o endereço, para rodar contra `out/` servido quando houver build.
 *
 * `--provar-ausencias` roda o modo do §9.1 do protocolo: **teste de ausência só vale depois
 * de ser visto VERMELHO com o defeito injetado.** Sete portões desta suíte afirmam que algo
 * NÃO existe — campo de latitude, escrita de «verificada», função de emitir chave, literal
 * de procedência, import por valor, segunda ficha, relógio. Um `grep` mal escrito passa
 * verde sobre todos eles, e um portão verde sobre o defeito é pior do que portão nenhum:
 * a tela ganha uma garantia que ninguém confere.
 *
 * O modo injeta cada defeito, confere que o portão correspondente acusa, e RESTAURA do
 * conteúdo que guardou em memória — nunca com `git checkout`, que apagaria trabalho não
 * commitado. Ele escreve em arquivo-fonte por milissegundos: **não rode com um build em
 * curso.**
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { abrirNavegador } from "./navegador.mjs";

const RAIZ = path.resolve(import.meta.dirname, "..");
const SRC = path.join(RAIZ, "src");
const BASE =
  process.argv.find((a) => a.startsWith("--base="))?.slice("--base=".length) ??
  "http://localhost:3006";

/** As dez rotas da sessão, na ordem em que a navegação as percorre. */
const TELAS = [
  "instituicao",
  "espacos",
  "equipe",
  "midia",
  "programa",
  "formacao",
  "editais",
  "integracao",
  "alcance",
  "conformidade",
];

/** Os arquivos que esta sessão escreveu. Os portões estáticos só valem sobre eles: medir o
 *  código de outra sessão faria esta suíte falhar por trabalho que não é dela. */
const MEUS = [
  "src/dados/tipos-organizacao.ts",
  "src/dados/organizacao.ts",
  "src/componentes/studio-org-estado.ts",
  "src/componentes/studio-org-acessibilidade.tsx",
  "src/componentes/studio-org-navegacao.tsx",
  "src/componentes/studio-org-espacos.tsx",
  "src/componentes/studio-org-instituicao.tsx",
  "src/componentes/studio-org-equipe.tsx",
  "src/componentes/studio-org-midia.tsx",
  "src/componentes/studio-org-programa.tsx",
  "src/componentes/studio-org-formacao.tsx",
  "src/componentes/studio-org-editais.tsx",
  "src/componentes/studio-org-integracao.tsx",
  "src/componentes/studio-org-alcance.tsx",
  "src/componentes/studio-org-conformidade.tsx",
];

/** As telas desta sessão que coletam entrada. Cada uma é uma FONTE do portão de latitude:
 *  se qualquer uma delas parar de contribuir atributo, o portão falha em vez de deixar as
 *  outras sustentarem o piso. */
const TELAS_COM_FORMULARIO = [
  "studio-org-espacos.tsx",
  "studio-org-instituicao.tsx",
  "studio-org-equipe.tsx",
  "studio-org-midia.tsx",
  "studio-org-programa.tsx",
  "studio-org-formacao.tsx",
  "studio-org-editais.tsx",
  "studio-org-integracao.tsx",
];

let verdes = 0;
const falhas = [];

function exigir(condicao, nome, medida, esperado = "") {
  if (condicao) {
    verdes += 1;
    console.log(`  ok   ${nome}: ${medida}`);
    return;
  }
  console.log(`  FALHA ${nome}: medido ${medida}${esperado ? ` · esperado ${esperado}` : ""}`);
  falhas.push(nome);
}

/**
 * Asserção de AUSÊNCIA, com piso — §9.1 do protocolo.
 *
 * «Nenhum X» sozinho é uma frase que fica verde quando o universo virar zero: basta alguém
 * renomear o seletor, mover o arquivo ou trocar o atributo, e o gate passa a atestar a
 * ausência de um defeito num conjunto vazio. Aconteceu no projeto: `.web-alternador` deixou
 * de existir numa reforma do design system e quatro telas ficaram com a classe morta sem
 * portão nenhum acusar.
 *
 * Aqui a ausência só vale acompanhada do tamanho do universo medido, e o gate FALHA quando
 * esse universo é zero — porque universo vazio significa que o portão parou de medir, e não
 * que o defeito sumiu. A linha de evidência sempre diz «nenhum X entre N», nunca «nenhum X».
 */
function exigirAusencia(nome, { fontes, achados, esperado = "0" }) {
  // O PISO É POR FONTE, NUNCA SOBRE A UNIÃO DELAS. Um gate que varre duas coleções — os
  // módulos e as telas, por exemplo — e põe o piso na SOMA continua verde quando uma das
  // duas zera: a outra sustenta o número sozinha, e a asserção segue afirmando sobre um
  // conjunto que deixou de ser varrido. É o buraco que o piso existia para fechar, e ele
  // só aparece quando se injeta a renomeação que esvazia UMA das fontes.
  const vazias = fontes.filter((f) => f.tamanho === 0);
  if (vazias.length > 0) {
    console.log(
      `  FALHA ${nome}: fonte VAZIA — ${vazias
        .map((f) => f.nome)
        .join(", ")} · o portão parou de varrer, e ausência sobre zero não é ausência`,
    );
    falhas.push(nome);
    return;
  }
  const conta = fontes.map((f) => `${f.tamanho} ${f.nome}`).join(" + ");
  exigir(
    achados.length === 0,
    nome,
    achados.length === 0 ? `0 entre ${conta}` : `${achados.length} de ${conta}: ${achados.slice(0, 4).join(" | ")}`,
    esperado,
  );
}

function titulo(t) {
  console.log(`\n${t}`);
}

const semComentarios = (codigo) =>
  codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

async function lerMeus() {
  const saida = [];
  for (const rel of MEUS) {
    saida.push({ rel, cru: await readFile(path.join(RAIZ, rel), "utf8") });
  }
  return saida;
}

// ===========================================================================
// (a) PORTÕES ESTÁTICOS — o que se mede sem abrir o navegador
// ===========================================================================

async function portoesEstaticos() {
  titulo("── (a) portões estáticos ──");
  const meus = await lerMeus();
  const limpos = meus.map((m) => ({ ...m, limpo: semComentarios(m.cru) }));

  // 1. Nenhuma SEGUNDA ficha de acessibilidade.
  //
  // O portão do PRD é «componentes da S7 reusados, não duplicados». A medida é a lista das
  // oito dimensões: se ela aparecer escrita mais de uma vez nos meus arquivos, existe uma
  // segunda ficha — porque quem redesenha a ficha redigita as oito.
  //
  // O piso é o EDITOR: ele precisa existir e consumir `DIMENSOES_DE_ACESSIBILIDADE` do
  // contrato da S7. Sem esse piso, apagar o editor faria o portão ficar verde — «nenhuma
  // segunda ficha» é trivialmente verdadeiro quando não há nem a primeira.
  {
    const editor = limpos.find((m) => m.rel.endsWith("studio-org-acessibilidade.tsx"));
    const editorConsomeOContrato = Boolean(
      editor && /\bDIMENSOES_DE_ACESSIBILIDADE\b/.test(editor.limpo),
    );
    const redigitam = limpos
      .filter((m) => /closed_caption/.test(m.limpo) && /descriptive_subtitle/.test(m.limpo))
      // `organizacao.ts` conta as oito no servidor para medir o acervo: é medida, não ficha.
      .filter((m) => !m.rel.endsWith("dados/organizacao.ts"))
      .map((m) => path.basename(m.rel));
    exigirAusencia("nenhuma segunda ficha de acessibilidade", {
      fontes: [
        {
          nome: "editor de ficha consumindo as 8 do contrato",
          tamanho: editorConsomeOContrato ? 1 : 0,
        },
        { nome: "arquivos desta sessão varridos", tamanho: limpos.length },
      ],
      achados: redigitam,
      esperado: "0 arquivos redigitando as 8",
    });
  }

  // 2. O editor da ficha é UM, e as telas que coletam acessibilidade o importam.
  {
    const coletam = ["studio-org-espacos.tsx", "studio-org-instituicao.tsx", "studio-org-midia.tsx"];
    const semImportar = coletam.filter((nome) => {
      const m = limpos.find((x) => x.rel.endsWith(nome));
      return !m || !/EditorDeAcessibilidade/.test(m.limpo);
    });
    exigir(
      semImportar.length === 0,
      "as três telas que coletam acessibilidade usam o MESMO editor",
      semImportar.length === 0 ? "3 de 3" : `sem importar: ${semImportar.join(", ")}`,
      "3 de 3",
    );
  }

  // 3. Não existe campo de latitude em lugar nenhum.
  //
  // `coordenada.procedencia` é o literal `"derivado"` no tipo. Um campo de lat/lon no
  // formulário produziria coordenada autorada, que o tipo proíbe — e a proibição do tipo não
  // aparece como erro se ninguém tentar atribuir; ela aparece como tela que mente.
  //
  // O PADRÃO MEDE O CAMPO INTEIRO, e não um atributo com aspas duplas. A forma estreita
  // — `(?:name|id|placeholder)="…lat…"` — deixa passar `id={campoLat}` em JSX,
  // `aria-label="Latitude"` e qualquer rótulo associado. Aqui a unidade é a tag `<input>`
  // com tudo o que ela carrega, e o piso é o número de campos que existem: zero campo
  // significaria que a tela de cadastro perdeu o formulário, não que ela ficou honesta.
  {
    // A UNIDADE É O ATRIBUTO, e não a tag. Tentar capturar `<input …>` com `[^>]*` trunca no
    // primeiro `>` — e em JSX o primeiro `>` costuma ser a seta de um `onChange={(e) => …}`,
    // então tudo o que vem depois dela fica fora da medição. O padrão estreito dava verde
    // sobre um `placeholder="latitude"` escrito depois do `onChange`.
    // O PISO CONTA CAMPOS; a varredura mede ATRIBUTOS. Separar os dois papéis é o que faz o
    // piso sobreviver a uma tela cujo campo é rotulado por `<label>` em volta, sem atributo
    // nenhum — a de integração é assim, e contá-la por atributo daria fonte vazia sobre uma
    // tela que está lá, inteira e acessível. Contar só o token de abertura também escapa da
    // armadilha do `[^>]*`, que trunca no `=>` de qualquer `onChange`.
    const camposPorTela = new Map();
    const hits = [];
    const PADRAO = /(placeholder|aria-label|name|id|htmlFor|title)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g;
    for (const m of limpos.filter((x) => x.rel.endsWith(".tsx"))) {
      const nome = path.basename(m.rel);
      camposPorTela.set(nome, [...m.limpo.matchAll(/<(?:input|textarea|select)\b/g)].length);
      for (const achado of m.limpo.matchAll(PADRAO)) {
        const valor = achado[2] ?? achado[3] ?? achado[4] ?? "";
        if (/\b(lat|lon|latitude|longitude)\b/i.test(valor)) {
          hits.push(`${nome}: ${achado[0].slice(0, 50)}`);
        }
      }
    }
    // UMA FONTE POR TELA DE FORMULÁRIO. Somar os atributos das oito num número só deixaria
    // uma tela perder o formulário inteiro sem o portão notar — as outras sete sustentariam
    // o piso, e a ausência de latitude passaria a ser afirmada sobre uma tela não varrida.
    exigirAusencia("nenhum campo de latitude ou longitude", {
      fontes: TELAS_COM_FORMULARIO.map((nome) => ({
        nome: `campos em ${nome}`,
        tamanho: camposPorTela.get(nome) ?? 0,
      })),
      achados: hits,
    });
  }

  // 4. Sem relógio e sem sorteio: o HTML exportado e a página hidratada precisam coincidir.
  //
  // `Date.now()` entra junto com `new Date()`: é a OUTRA forma de ler o relógio, produz o
  // mesmo defeito de hidratação, e a primeira versão deste portão não a via.
  {
    const hits = [];
    for (const m of limpos) {
      for (const forma of [/new Date\(/, /Date\.now\(/, /Math\.random\(/]) {
        if (forma.test(m.limpo)) hits.push(`${path.basename(m.rel)}: ${String(forma).slice(1, -1)}`);
      }
    }
    exigirAusencia("sem relógio e sem sorteio", {
      fontes: [{ nome: "arquivos desta sessão", tamanho: limpos.length }],
      achados: hits,
    });
  }

  // 5. As três segregações moram no CÓDIGO, e não num aviso.
  //
  // A Organização não se verifica, não emite chave de integração e não declara fato de
  // evento. A medida é a ausência do verbo: nenhum módulo desta sessão sabe escrever
  // `"verificada"`, nem tem função de emitir chave.
  //
  // O PADRÃO NÃO PERSEGUE A FORMA DA ATRIBUIÇÃO, porque há muitas: objeto literal,
  // `estado.verificacao = …`, uma constante intermediária. Ele proíbe a STRING inteira
  // fora do contrato — `tipos-organizacao.ts` declara o vocabulário e é o único lugar onde
  // «verificada» pode aparecer. O piso é a existência do próprio conceito: se
  // `EstadoDaVerificacao` sumir do contrato, o portão não tem mais o que guardar.
  {
    const contrato = limpos.find((m) => m.rel.endsWith("tipos-organizacao.ts"));
    const conceitoExiste = Boolean(contrato && /\bEstadoDaVerificacao\b/.test(contrato.limpo));
    const foraDoContrato = limpos.filter((m) => !m.rel.endsWith("tipos-organizacao.ts"));
    const escreveVerificada = foraDoContrato
      .filter((m) => /"verificada"|'verificada'/.test(m.limpo))
      .map((m) => path.basename(m.rel));
    exigirAusencia(
      "nenhum módulo da Organização escreve «verificada» — quem verifica é o Admin (92)",
      {
        fontes: [
          { nome: "declaração de EstadoDaVerificacao no contrato", tamanho: conceitoExiste ? 1 : 0 },
          { nome: "arquivos fora do contrato varridos", tamanho: foraDoContrato.length },
        ],
        achados: escreveVerificada,
      },
    );

    // O piso da chave é o verbo que a organização TEM: se `revogarChave` sumir, não existe
    // mais chave nesta sessão, e afirmar que ninguém a emite deixa de significar algo.
    const revoga = limpos.filter((m) => /\brevogarChave\b/.test(m.limpo));
    const emiteChave = limpos
      .filter((m) => /emitirChave|emitir_chave|criarChave/.test(m.limpo))
      .map((m) => path.basename(m.rel));
    exigirAusencia("nenhuma função de emitir chave — quem emite é o Admin (97)", {
      fontes: [
        { nome: "arquivos que conhecem a chave (revogarChave)", tamanho: revoga.length },
        { nome: "arquivos desta sessão varridos", tamanho: limpos.length },
      ],
      achados: emiteChave,
    });
  }

  // 6. A procedência de chegada é UMA constante, e nenhuma tela a digita.
  {
    const telas = limpos.filter((m) => m.rel.endsWith(".tsx"));
    // O piso é o uso da constante: se nenhuma tela a importa, «nenhuma tela digita o
    // literal» ficaria verde sobre uma sessão que parou de carimbar procedência.
    const usamAConstante = telas.filter((m) => /\bPROCEDENCIA_DA_ORGANIZACAO\b/.test(m.limpo));
    const literais = telas
      .filter((m) => /"parceiro"|'parceiro'/.test(m.limpo))
      .map((m) => path.basename(m.rel));
    exigirAusencia("nenhuma tela digita a procedência — ela sai de PROCEDENCIA_DA_ORGANIZACAO", {
      fontes: [
        { nome: "telas que carimbam pela constante", tamanho: usamAConstante.length },
        { nome: "telas varridas", tamanho: telas.length },
      ],
      achados: literais,
    });
  }

  // 7. DP-F: componente de cliente não importa o módulo de dado POR VALOR.
  {
    const clientes = limpos.filter((x) => x.rel.endsWith(".tsx") || x.rel.endsWith("estado.ts"));
    // O piso é o import POR TIPO: se ninguém mais importa o módulo de dado nem como tipo, a
    // fronteira que este portão guarda deixou de existir — e o verde passa a ser sobre nada.
    const importamPorTipo = clientes.filter((m) =>
      /^import\s+type[^;]*?from\s+"@\/dados\/organizacao"/m.test(m.limpo),
    );
    const hits = [];
    for (const m of clientes) {
      for (const achado of m.limpo.matchAll(/^import\s+(?!type)([^;]*?)from\s+"@\/dados\/organizacao"/gm)) {
        hits.push(`${path.basename(m.rel)}: ${achado[1].trim()}`);
      }
    }
    exigirAusencia("nenhum componente de cliente importa @/dados/organizacao por valor (DP-F)", {
      fontes: [
        { nome: "clientes que importam por tipo", tamanho: importamPorTipo.length },
        { nome: "clientes varridos", tamanho: clientes.length },
      ],
      achados: hits,
    });
  }

  // 8. As dez telas existem como rota, e a navegação não promete o que não existe.
  {
    const dir = path.join(SRC, "app", "(bastidor)", "studio", "organizacao");
    const rotas = new Set(
      (await readdir(dir, { withFileTypes: true }))
        .filter((e) => e.isDirectory())
        .map((e) => e.name),
    );
    const faltando = TELAS.filter((t) => !rotas.has(t));
    exigir(
      faltando.length === 0,
      "as dez rotas da Organização existem no disco",
      faltando.length === 0 ? `${TELAS.length} de ${TELAS.length}` : `faltam ${faltando.join(", ")}`,
      "10 de 10",
    );

    const contrato = await readFile(path.join(SRC, "dados", "tipos-organizacao.ts"), "utf8");
    const prontas = [...contrato.matchAll(/id:\s*"([a-z]+)",[\s\S]{0,400}?pronta:\s*(true|false)/g)]
      .filter(([, id]) => TELAS.includes(id))
      .map(([, id, pronta]) => ({ id, pronta: pronta === "true" }));
    const mentindo = prontas.filter((p) => p.pronta && !rotas.has(p.id));
    exigirAusencia("nenhuma tela marcada «pronta» sem rota no disco", {
      fontes: [
        { nome: "telas marcadas prontas no contrato", tamanho: prontas.filter((p) => p.pronta).length },
        { nome: "rotas no disco", tamanho: rotas.size },
      ],
      achados: mentindo.map((p) => p.id),
    });
  }
}

// ===========================================================================
// (b) PORTÕES DE NAVEGADOR — o que só a tela aberta mostra
// ===========================================================================

const esperar = (cdp, texto, voltas = 160) =>
  cdp.avaliar(
    `(async()=>{for(let i=0;i<${voltas};i++){if(document.body.textContent.includes(${JSON.stringify(texto)}))return true;await new Promise(r=>setTimeout(r,250));}return false;})()`,
  );
const pausa = (cdp) => cdp.avaliar(`new Promise(r=>setTimeout(r,400))`);
const clicar = (cdp, re) =>
  cdp.avaliar(
    `(()=>{const b=[...document.querySelectorAll('button')].find(x=>${re}.test(x.textContent.trim()));if(!b)return false;b.click();return true;})()`,
  );
const digitar = (cdp, seletor, valor) =>
  cdp.avaliar(
    `(()=>{const c=document.querySelector(${JSON.stringify(seletor)});if(!c)return false;
      const p=c.tagName==='TEXTAREA'?window.HTMLTextAreaElement:window.HTMLInputElement;
      Object.getOwnPropertyDescriptor(p.prototype,'value').set.call(c,${JSON.stringify(valor)});
      c.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`,
  );
/** Um denominador, lido pelos FILHOS e não por `innerText`. Ver o cabeçalho do arquivo. */
const denominador = (cdp, re) =>
  cdp.avaliar(
    `[...document.querySelectorAll('.web-denominador')].map(n=>[...n.children].map(c=>c.textContent.trim()).join(' ')).find(t=>${re}.test(t)) ?? '—'`,
  );

async function portoesDeNavegador(cdp) {
  // ---- O2 · espaços: conversão, ato explícito, coordenada -----------------
  titulo("── (b) O2 · espaços ──");
  await cdp.navegar(`${BASE}/studio/organizacao/espacos/`);
  await cdp.avaliar(`localStorage.setItem('agenda-cultural:visao','web')`);
  await cdp.avaliar(`localStorage.removeItem('studio.org.v1')`);
  await cdp.navegar(`${BASE}/studio/organizacao/espacos/`);
  exigir(await esperar(cdp, "Cadastro"), "a tela de espaços hidrata", "sim");

  const naoDeclarado = await cdp.avaliar(
    `document.querySelectorAll('.org-caixa[data-estado="nao-declarado"]').length`,
  );
  exigir(naoDeclarado === 13, "a ficha do espaço abre com as 13 em «não declarado»", `${naoDeclarado}`, "13");

  exigir(
    (await cdp.avaliar(`document.querySelectorAll('.org-ato').length`)) >= 1,
    "existe o ato explícito de declarar ausência",
    "1",
  );
  await clicar(cdp, /^Declaro que não oferece/);
  await pausa(cdp);
  const ausentes = await cdp.avaliar(
    `document.querySelectorAll('.org-caixa[data-estado="declarado-ausente"]').length`,
  );
  exigir(
    ausentes === 13,
    "o ato move as 13 para «declarado ausente», e NÃO para «não declarado»",
    `${ausentes}`,
    "13",
  );

  const de = await cdp.avaliar(`document.querySelector('.org-conversao-de')?.textContent ?? '—'`);
  exigir(de === "derivado", "o selo mostra a procedência de saída", de, "derivado");
  await digitar(cdp, 'input[placeholder="Rua, número"]', "Rua Leopoldo Couto de Magalhães Jr., 110");
  await pausa(cdp);
  const para = await cdp.avaliar(`document.querySelector('.org-conversao-para')?.textContent ?? '—'`);
  exigir(para !== "aguardando cadastro" && para !== "derivado", "o cadastro converte a procedência", para);
  {
    const campos = await cdp.avaliar(`document.querySelectorAll('input, textarea, select').length`);
    const suspeitos = await cdp.avaliar(
      `[...document.querySelectorAll('input, textarea, select')]
        .filter(i=>/\\b(lat|lon|latitude|longitude)\\b/i.test(i.outerHTML + ' ' + (i.getAttribute('aria-label')??'')))
        .map(i=>i.outerHTML.slice(0,60))`,
    );
    exigirAusencia("nenhum campo de latitude na tela", {
      fontes: [{ nome: "campos na tela de espaços", tamanho: campos }],
      achados: suspeitos,
    });
  }
  exigir(
    (await cdp.avaliar(`document.body.textContent.includes('centroide-municipio')`)) === true,
    "a coordenada troca de MÉTODO e continua derivada",
    "centroide-municipio",
  );

  // ---- O5 · mídia: nenhuma publica sem crédito ---------------------------
  titulo("── (b) O5 · mídia ──");
  await cdp.navegar(`${BASE}/studio/organizacao/midia/`);
  exigir(await esperar(cdp, "Direito de distribuição"), "a tela de mídia hidrata", "sim");
  const fila = await denominador(cdp, /na fila, sem publicar/);
  const naFila = Number(fila.split(" ")[0]);
  exigir(naFila > 0, "a fila do crédito abre nomeada e não vazia", fila);
  const semCredito = await cdp.avaliar(
    `document.querySelectorAll('.web-lista-densa li').length`,
  );
  exigir(
    semCredito === naFila,
    "a lista abre NA fila — os itens sem crédito, e só eles",
    `${semCredito} linhas para ${naFila} na fila`,
  );
  await digitar(cdp, 'aside input[placeholder="Foto de …"]', "Foto de Fulano/Itaú Cultural");
  await pausa(cdp);
  const filaDepois = await denominador(cdp, /na fila, sem publicar/);
  exigir(
    Number(filaDepois.split(" ")[0]) === naFila - 1,
    "creditar tira o item da fila — o crédito é a condição de publicar",
    `${fila} → ${filaDepois}`,
  );

  // ---- O7 · equipe: sucessão com autor e carimbo -------------------------
  titulo("── (b) O7 · equipe ──");
  await cdp.navegar(`${BASE}/studio/organizacao/equipe/`);
  exigir(await esperar(cdp, "Sucessão de titularidade"), "a tela de equipe hidrata", "sim");
  await clicar(cdp, /^Transferir para/);
  await pausa(cdp);
  const historico = await cdp.avaliar(
    `[...document.querySelectorAll('.org-falta-item')].map(n=>n.textContent).find(t=>/transferiu a titularidade/.test(t)) ?? '—'`,
  );
  exigir(/transferiu a titularidade/.test(historico), "a sucessão grava linha de histórico", "sim");
  exigir(
    /Gestão institucional/.test(historico) && /\d{4}-\d{2}-\d{2}/.test(historico),
    "e a linha carrega autor E carimbo de data",
    historico.slice(-60),
  );

  // ---- O8 · integração: nada grava sem chave de identidade ---------------
  titulo("── (b) O8 · integração ──");
  await cdp.navegar(`${BASE}/studio/organizacao/integracao/`);
  exigir(await esperar(cdp, "Prévia do lote"), "a tela de integração hidrata", "sim");
  await digitar(
    cdp,
    "textarea",
    "BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART:20261002T140000\nEND:VEVENT\nEND:VCALENDAR",
  );
  await pausa(cdp);
  const semTitulo = await denominador(cdp, /sem título, não gravam/);
  exigir(/^1 /.test(semTitulo), "linha sem título é contada como não gravável", semTitulo);
  exigir(
    (await cdp.avaliar(
      `[...document.querySelectorAll('button')].find(b=>/Guardar esta prévia/.test(b.textContent))?.disabled`,
    )) === true,
    "e o lote inteiro não grava — a chave de identidade começa no título",
    "desabilitado",
  );

  // ---- O9 · alcance: nenhum número que o acervo não sustenta -------------
  titulo("── (b) O9 · alcance ──");
  await cdp.navegar(`${BASE}/studio/organizacao/alcance/`);
  exigir(await esperar(cdp, "O que este painel não exibe"), "a tela de alcance hidrata", "sim");
  const recusadas = await cdp.avaliar(`document.querySelectorAll('aside .org-falta-item').length`);
  exigir(recusadas >= 5, "as medidas recusadas aparecem nomeadas, com motivo", `${recusadas}`, "≥ 5");
  // O portão certo NÃO é «não aparece a palavra público»: a tela precisa citar «público
  // presente» para dizer que se recusa a medi-lo, e cita «3 pessoas-usuárias» como o número
  // medido que explica outra recusa. Uma varredura de texto acusaria as duas declarações
  // honestas e passaria por um indicador chamado «alcance» com número ao lado.
  //
  // A medida certa é o RÓTULO DOS INDICADORES: o que a tela exibe como número é o que está
  // sob `.web-denominador`, e nenhum deles pode prometer público.
  {
    const rotulos = await cdp.avaliar(
      `[...document.querySelectorAll('.web-denominador-rotulo')].map(n=>n.textContent.trim()).join(' | ')`,
    );
    const quantos = await cdp.avaliar(
      `document.querySelectorAll('.web-denominador-rotulo').length`,
    );
    const prometem = rotulos
      .split(" | ")
      .filter((r) => /p[úu]blico|audi[êe]ncia|alcance|espectador|visualiza|acesso|engajamento/i.test(r));
    // O PISO É O QUE FALTAVA AQUI. Se `.web-denominador-rotulo` deixar de casar — uma
    // renomeação no design system basta —, `rotulos` vira string vazia, o padrão não acha
    // nada e o portão passa a atestar que uma tela cheia de indicadores de alcance não tem
    // nenhum. `.web-alternador` já desapareceu assim neste projeto, sem portão acusar.
    exigirAusencia("nenhum indicador com número promete público", {
      fontes: [{ nome: `indicadores medidos (${rotulos})`, tamanho: quantos }],
      achados: prometem,
      esperado: "só contagens de grafo",
    });

    const recusadas = await cdp.avaliar(
      `[...document.querySelectorAll('aside .org-falta-item strong')].map(n=>n.textContent.trim()).join(' | ')`,
    );
    exigir(
      recusadas.length > 0 && /p[úu]blico presente/.test(recusadas),
      "«público presente» aparece como medida RECUSADA, e não como indicador",
      recusadas || "(nenhuma medida recusada listada — o portão parou de medir)",
      "a lista de recusas, com «público presente» nela",
    );
  }

  // ---- Navegação completa: medida de pixel e zero erro de console --------
  //
  // O PORTÃO 4 DO PRD PEDE MEDIDA DE PIXEL, e `scripts/medidas.mjs` é arquivo compartilhado
  // que esta sessão não edita (PEDIDO-S6-07). A medida mora aqui, e mede as duas coisas que
  // quebram numa tela de bastidor larga: transbordo horizontal — que faz a página inteira
  // rolar para o lado e some com a coluna da direita —, e coluna colada mais alta que a
  // janela, que nunca rola até o próprio fim.
  titulo("── (b) as dez telas, em sequência: medida e console ──");
  for (const tela of TELAS) {
    await cdp.navegar(`${BASE}/studio/organizacao/${tela}/`);
    await esperar(cdp, "Studio · Organização", 40);
    const medida = await cdp.avaliar(`(() => {
      const colada = document.querySelector('.org-colada, .web-colada');
      return {
        nav: document.querySelectorAll('.org-telas .org-tela').length,
        transbordo: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        alturaColada: colada ? Math.round(colada.getBoundingClientRect().height) : 0,
        rolaPorDentro: colada ? getComputedStyle(colada).overflowY === 'auto' : true,
        janela: window.innerHeight,
      };
    })()`);

    // A coluna colada precisa CABER ou ROLAR POR DENTRO. Sticky mais alto que a janela
    // gruda no topo e nunca revela o próprio pé — e o pé é justamente onde mora «o que
    // falta», que é o motivo de o padrão existir.
    const coladaOk =
      medida.alturaColada === 0 || medida.alturaColada <= medida.janela || medida.rolaPorDentro;
    const ok = medida.nav === 10 && medida.transbordo <= 0 && coladaOk;

    if (!ok) {
      exigir(
        false,
        `${tela}: dez telas, sem transbordo, coluna colada alcançável`,
        `nav ${medida.nav} · transbordo ${medida.transbordo}px · colada ${medida.alturaColada}px em janela de ${medida.janela}px · rola por dentro: ${medida.rolaPorDentro}`,
        "nav 10 · transbordo ≤ 0 · colada cabe ou rola",
      );
    } else {
      verdes += 1;
      console.log(
        `  ok   ${tela}: nav 10 · transbordo ${medida.transbordo}px · colada ${medida.alturaColada}px ${medida.rolaPorDentro ? "com rolagem própria" : "cabendo na janela"}`,
      );
    }
  }

  const erros = cdp.consola.filter((c) => c.nivel === "erro");
  exigir(
    erros.length === 0,
    "zero erro de console numa navegação completa pelas dez telas",
    erros.length === 0 ? "0" : erros.slice(0, 3).map((e) => e.texto).join(" | "),
    "0",
  );
}

// ===========================================================================
// (c) A PROVA DOS PORTÕES DE AUSÊNCIA — §9.1 do protocolo
// ===========================================================================

/** Cada caso é um defeito real, na âncora exata onde ele nasceria. */
const DEFEITOS = [
  {
    portao: "nenhum campo de latitude ou longitude",
    arquivo: "src/componentes/studio-org-espacos.tsx",
    de: 'placeholder="Rua, número"',
    para: 'placeholder="latitude"',
  },
  {
    portao: "nenhum módulo da Organização escreve «verificada»",
    arquivo: "src/componentes/studio-org-estado.ts",
    de: 'comFicha(id, (c) => ({ ...c, verificacao: "solicitada" }));',
    para: 'comFicha(id, (c) => ({ ...c, verificacao: "verificada" }));',
  },
  {
    portao: "nenhuma função de emitir chave",
    arquivo: "src/componentes/studio-org-estado.ts",
    de: "  const revogarChave = useCallback((id: string) => {",
    para: "  const emitirChave = (r: string) => r;\n  const revogarChave = useCallback((id: string) => {",
  },
  {
    portao: "nenhuma tela digita a procedência",
    arquivo: "src/componentes/studio-org-espacos.tsx",
    de: '{foiCadastrado ? PROCEDENCIA_DA_ORGANIZACAO : "aguardando cadastro"}',
    para: '{foiCadastrado ? "parceiro" : "aguardando cadastro"}',
  },
  {
    portao: "nenhum componente de cliente importa @/dados/organizacao por valor",
    arquivo: "src/componentes/studio-org-alcance.tsx",
    de: 'import type { EventoParaPrograma, InstituicaoDoAcervo } from "@/dados/organizacao";',
    para:
      'import { UNIDADES_DA_FEDERACAO } from "@/dados/organizacao";\n' +
      'import type { EventoParaPrograma, InstituicaoDoAcervo } from "@/dados/organizacao";',
  },
  {
    portao: "nenhuma segunda ficha de acessibilidade",
    arquivo: "src/componentes/studio-org-espacos.tsx",
    de: "export function StudioOrgEspacos({",
    para:
      "const SEGUNDA_FICHA = ['audio_description','descriptive_subtitle','closed_caption'];\n" +
      "void SEGUNDA_FICHA;\nexport function StudioOrgEspacos({",
  },
  {
    portao: "sem relógio e sem sorteio",
    arquivo: "src/componentes/studio-org-equipe.tsx",
    de: "  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);",
    para:
      "  const agora = new Date();\n  void agora;\n" +
      "  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);",
  },

  // --- as formas que a versão ESTREITA de cada padrão deixava passar -------
  //
  // Estes três existem porque a primeira versão desta suíte dava VERDE sobre eles. Não eram
  // defeito vivo; eram a porta pela qual o defeito entraria na próxima renomeação.
  {
    portao: "sem relógio e sem sorteio",
    nome: "sem relógio — a forma `Date.now()`, que o padrão estreito não via",
    arquivo: "src/componentes/studio-org-equipe.tsx",
    de: "  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);",
    para: "  const agora = Date.now();\n  void agora;\n  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);",
  },
  {
    portao: "nenhum campo de latitude ou longitude",
    nome: "campo de latitude — a forma `aria-label`, sem o nome do atributo esperado",
    arquivo: "src/componentes/studio-org-espacos.tsx",
    de: '                    placeholder="Rua, número"',
    para: '                    aria-label="Latitude"\n                    placeholder="Rua, número"',
  },
  {
    portao: "nenhum módulo da Organização escreve «verificada»",
    nome: "«verificada» — a forma de atribuição, e não de objeto literal",
    arquivo: "src/componentes/studio-org-estado.ts",
    de: "  const revogarChave = useCallback((id: string) => {",
    para: '  const marcar = (c: { verificacao: string }) => { c.verificacao = "verificada"; };\n  void marcar;\n  const revogarChave = useCallback((id: string) => {',
  },

  // --- e os PISOS: sumir com o universo tem de deixar o portão VERMELHO ----
  //
  // É o que o modo sozinho não pegava, e é o achado que motivou a §9.1 ganhar a regra do
  // piso. Os defeitos acima provam que o portão acusa HOJE, com os seletores atuais; estes
  // três provam que ele acusa também quando alguém renomeia o seletor e o universo medido
  // vira zero — que é exatamente como um portão de ausência morre em silêncio.
  {
    portao: "nenhum módulo da Organização escreve «verificada»",
    nome: "piso: o conceito de verificação some do contrato",
    arquivo: "src/dados/tipos-organizacao.ts",
    // O identificador NU, e não a linha da declaração: `EstadoDaVerificacao` aparece também
    // no `Record` do rótulo e no campo do cadastro, e renomear só a declaração deixaria o
    // piso satisfeito pelas outras ocorrências — a injeção pela metade daria falso verde.
    de: "EstadoDaVerificacao",
    para: "EstadoDaVerificacaoRenomeado",
  },
  {
    portao: "nenhuma tela digita a procedência",
    nome: "piso: nenhuma tela carimba mais pela constante",
    arquivo: "src/componentes/studio-org-espacos.tsx",
    de: "PROCEDENCIA_DA_ORGANIZACAO",
    para: "PROCEDENCIA_RENOMEADA",
  },
  {
    portao: "nenhuma segunda ficha de acessibilidade",
    nome: "piso: o editor deixa de consumir as 8 dimensões do contrato",
    arquivo: "src/componentes/studio-org-acessibilidade.tsx",
    de: "DIMENSOES_DE_ACESSIBILIDADE",
    para: "DIMENSOES_RENOMEADAS",
  },


  // --- e o piso POR FONTE, que o piso sobre a união deixava passar ---------
  //
  // Esvaziar UMA tela enquanto as outras sete continuam cheias: sob um piso somado, as
  // sete sustentariam o número e o portão seguiria verde afirmando ausência de latitude
  // numa tela que deixou de ser varrida. Sob piso por fonte, ele fica vermelho e DIZ qual
  // fonte esvaziou.
  {
    portao: "nenhum campo de latitude ou longitude",
    nome: "piso por fonte: uma tela perde o formulário e as outras sete não a cobrem",
    arquivo: "src/componentes/studio-org-integracao.tsx",
    de: "<textarea",
    para: "<div data-era-textarea",
  },

];

/** Roda só os portões estáticos e devolve a saída, sem tocar no navegador. */
async function saidaDosEstaticos() {
  const linhas = [];
  const console_log = console.log;
  const verdesAntes = verdes;
  const falhasAntes = falhas.length;
  console.log = (...args) => linhas.push(args.join(" "));
  try {
    await portoesEstaticos();
  } finally {
    console.log = console_log;
    verdes = verdesAntes;
    falhas.length = falhasAntes;
  }
  return linhas.join("\n");
}

async function provarAusencias() {
  titulo("── (c) prova dos portões de ausência (§9.1) ──");
  for (const d of DEFEITOS) {
    const rotulo = d.nome ?? d.portao;
    const caminho = path.join(RAIZ, d.arquivo);
    const original = await readFile(caminho, "utf8");
    if (!original.includes(d.de)) {
      exigir(false, `prova: ${rotulo}`, `âncora não encontrada em ${d.arquivo}`, "âncora presente");
      continue;
    }
    // `replaceAll`, e não `replace`: trocar só a primeira ocorrência deixaria o identificador
    // vivo nas outras e o piso de pé — o caso do piso passaria verde por metade da injeção.
    await writeFile(caminho, original.replaceAll(d.de, d.para));
    let saida = "";
    try {
      saida = await saidaDosEstaticos();
    } finally {
      await writeFile(caminho, original);
    }
    const restaurado = await readFile(caminho, "utf8");
    const linha = saida.split("\n").find((l) => l.includes(d.portao));
    const vermelho = Boolean(linha && linha.trim().startsWith("FALHA"));
    exigir(
      vermelho && restaurado === original,
      `prova: ${rotulo}`,
      vermelho
        ? restaurado === original
          ? "vermelho com o defeito, e o arquivo voltou byte a byte"
          : "vermelho, mas o arquivo NÃO voltou igual"
        : `verde com o defeito injetado — o portão não vale (${(linha ?? "sem linha").trim()})`,
      "vermelho e restaurado",
    );
  }
}

// ===========================================================================

console.log("\nverificar-organizacao — os portões do nível 6");
console.log(`base: ${BASE}`);

await portoesEstaticos();

if (process.argv.includes("--provar-ausencias")) {
  await provarAusencias();
}

let cdp = null;
try {
  cdp = await abrirNavegador({ tetoNavegacao: 240_000, tetoHidratacao: 120_000 });
  await portoesDeNavegador(cdp);
} catch (erro) {
  console.log(`\n  FALHA navegador: ${erro instanceof Error ? erro.message : String(erro)}`);
  console.log("  (a suíte precisa de um servidor de pé: NEXT_SESSAO=s6 npx next dev -p 3006)");
  falhas.push("navegador");
} finally {
  if (cdp) await cdp.encerrar();
}

console.log(
  `\n  ${verdes} verdes · ${falhas.length} FALHA(S)${falhas.length ? `: ${falhas.join(", ")}` : ""}\n`,
);
process.exit(falhas.length ? 1 : 0);
