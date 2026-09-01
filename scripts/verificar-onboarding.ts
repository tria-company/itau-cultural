/**
 * verificar-onboarding.ts — os portões da S8, sobre o GRAFO REAL.
 *
 * Sem mock e sem fixture: 7.810 entidades e 66.563 arestas, as mesmas que a tela usa. Os
 * defeitos que esta sessão encontrou — feed monoclasse, desempate alfabético e cinco
 * temas engolidos por casamento de slug — passaram todos pelo `tsc` sem um aviso. Suíte
 * que roda sobre dado inventado não teria pego nenhum.
 *
 * Rode com `npm run verificar-onboarding`.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  catalogoDeSementes,
  precomputoDeSementes,
  temasDeLeitura,
} from "../src/dados/sementes";
import {
  ampliacaoDeRepertorio,
  comporFeed,
  ROTACAO_DE_CLASSE,
  TETO_POR_SEMENTE,
} from "../src/dados/sementes-wire";
import { LIMITE_FEED, PRECOMPUTO } from "../src/dados/feeds";

const RAIZ = join(import.meta.dirname, "..");
const ler = (caminho: string): string => readFileSync(join(RAIZ, caminho), "utf8");

let falhas = 0;

function assercao(nome: string, corpo: () => void): void {
  try {
    corpo();
    console.log(`  ok   ${nome}`);
  } catch (erro) {
    falhas++;
    console.log(`  FALHA ${nome}`);
    console.log(`        ${erro instanceof Error ? erro.message : String(erro)}`);
  }
}

function exigir(condicao: boolean, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(mensagem);
}

const catalogo = catalogoDeSementes();
const precomputo = precomputoDeSementes();

console.log("\nPORTÃO 1 — nenhum passo do onboarding é porteiro");

assercao("«pular» existe em todos os passos e leva a Descobrir", () => {
  const rodape = ler("src/componentes/onboarding-rodape.tsx");
  exigir(rodape.includes('href="/descobrir/"'), "o rodapé não oferece saída para /descobrir");
  exigir(/onb-pular/.test(rodape), "o rodapé não tem o botão de pular");
  const pagina = ler("src/app/onboarding/[passo]/page.tsx");
  exigir(
    pagina.includes("<OnboardingRodape"),
    "a página do onboarding não usa o rodapé com as duas saídas",
  );
});

assercao("a grade de rostos tem a saída «não conheço nenhum destes»", () => {
  const tela = ler("src/componentes/onboarding-sementes.tsx");
  exigir(
    /não conheço nenhum destes/i.test(tela),
    "sem essa saída a tela vira teste de erudição para quem não reconhece a grade",
  );
});

assercao("o feed sem semente nenhuma devolve lista vazia, e não erro", () => {
  const vazio = comporFeed(precomputo, [], LIMITE_FEED);
  exigir(Array.isArray(vazio) && vazio.length === 0, "perfil vazio deveria compor lista vazia");
});

assercao("o feed sem semente DIZ que está genérico", () => {
  const feed = ler("src/componentes/feed.tsx");
  exigir(
    /feed base do acervo/.test(feed) && /onboarding\/2/.test(feed),
    "o feed sem semente precisa dizer que é o feed base e oferecer o caminho para semear",
  );
});

console.log("\nPORTÃO 2 — todo número de acervo na tela vem do build");

assercao("nenhum literal de acervo escrito à mão nas telas da S8", () => {
  // `\b` só no COMEÇO do padrão: com ele no fim, «336 podcasts» escaparia porque depois
  // do dígito vem espaço. É a classe de defeito do PROTOCOLO §9.1.
  const suspeito = /\b(?:1[0-9]{2,}|[2-9][0-9]{2,})/;
  // Medida de layout não é número de acervo. `width`/`height` de imagem, tamanho de
  // viewport e código de tecla passam — o alvo é o dígito que a pessoa LÊ na tela.
  const layout = /(?:width|height|sizes|quality|maxLength|size)\s*=|\bpx\b|\brem\b/;
  const telas = [
    "src/componentes/onboarding-linguagens.tsx",
    "src/componentes/onboarding-sementes.tsx",
    "src/componentes/preferencia-faixa.tsx",
    "src/componentes/museu-reentrada.tsx",
    "src/componentes/repertorio-do-perfil.tsx",
  ];
  for (const caminho of telas) {
    for (const linha of ler(caminho).split("\n")) {
      // Comentário é onde a medição fica registrada e explicada — o gate mira no que
      // chega à pessoa, que é JSX e string.
      const limpa = linha.trim();
      if (limpa.startsWith("*") || limpa.startsWith("//") || limpa.startsWith("/*")) continue;
      if (layout.test(limpa)) continue;
      exigir(
        !suspeito.test(limpa),
        `${caminho}: número de acervo escrito à mão fora de comentário → ${limpa}`,
      );
    }
  }
});

console.log("\nPORTÃO 3 — DP-F: nenhum cliente alcança o grafo");

assercao("nenhum «use client» importa grafo, caminhada ou sementes.ts", () => {
  const clientes = [
    "src/componentes/onboarding-linguagens.tsx",
    "src/componentes/onboarding-sementes.tsx",
    "src/componentes/onboarding-rodape.tsx",
    "src/componentes/preferencia-faixa.tsx",
    "src/componentes/museu-reentrada.tsx",
    "src/componentes/repertorio-do-perfil.tsx",
    "src/componentes/feed.tsx",
    "src/contexto/sessao.tsx",
  ];
  for (const caminho of clientes) {
    const fonte = ler(caminho);
    exigir(fonte.includes('"use client"'), `${caminho} deveria ser componente de cliente`);
    // Só as linhas de IMPORT. Ler o arquivo inteiro reprovava `feed.tsx` pelo comentário
    // que afirma justamente que ele não conhece o grafo — gate que falha sobre a própria
    // documentação da regra é gate que ninguém mantém.
    const imports = fonte
      .split("\n")
      .filter((l) => /^\s*import\b/.test(l) || /\bfrom\s+"@\/dados/.test(l));
    for (const proibido of ["@/dados/grafo", "@/dados/caminhada"]) {
      exigir(
        !imports.some((l) => l.includes(proibido)),
        `${caminho} importa ${proibido} — 23 MB no navegador`,
      );
    }
    // `sementes.ts` alcança o grafo; `sementes-wire.ts` não. Importar o primeiro por VALOR
    // arrastaria o acervo inteiro, e a diferença entre os dois é uma letra no caminho.
    exigir(
      !imports.some((l) => /from "@\/dados\/sementes"/.test(l)),
      `${caminho} importa @/dados/sementes por valor — use @/dados/sementes-wire`,
    );
  }
});

console.log("\nPORTÃO 4 — o payload cabe no teto compartilhado");

const TETO = 1_500_000;

assercao(`precômputo de sementes + feeds abaixo de ${(TETO / 1_048_576).toFixed(2)} MB`, () => {
  const sementes = Buffer.byteLength(JSON.stringify(precomputo), "utf8");
  const feeds = Buffer.byteLength(JSON.stringify(PRECOMPUTO), "utf8");
  const total = sementes + feeds;
  console.log(
    `       sementes ${(sementes / 1_048_576).toFixed(2)} MB + feeds ${(feeds / 1_048_576).toFixed(2)} MB` +
      ` = ${(total / 1_048_576).toFixed(2)} MB (${((total / TETO) * 100).toFixed(0)}% do teto)`,
  );
  exigir(
    total <= TETO,
    `payload em ${(total / 1_048_576).toFixed(2)} MB. Reduza TETO_POR_SEMENTE em ` +
      `sementes-wire.ts, hoje em ${TETO_POR_SEMENTE} — nunca o universo de sementes: ` +
      `semente sem lista é uma escolha que o feed ignora em silêncio.`,
  );
});

console.log("\nPORTÃO 5 — dois perfis distintos, dois feeds distintos");

assercao("perfis diferentes não devolvem o mesmo feed", () => {
  const a = [catalogo.linguagens[0].chave, catalogo.grade[0].chave, catalogo.grade[1].chave];
  const b = [catalogo.linguagens[5].chave, catalogo.grade[60].chave, catalogo.grade[61].chave];
  const fa = comporFeed(precomputo, a, LIMITE_FEED).map((c) => c.cartao.id);
  const fb = comporFeed(precomputo, b, LIMITE_FEED).map((c) => c.cartao.id);
  exigir(fa.length > 0 && fb.length > 0, "algum dos dois perfis compôs feed vazio");
  exigir(
    JSON.stringify(fa) !== JSON.stringify(fb),
    "dois perfis distintos devolveram o MESMO feed — o onboarding não está mudando nada",
  );
});

assercao("o mesmo perfil devolve sempre a mesma ordem", () => {
  const perfil = [catalogo.linguagens[2].chave, catalogo.grade[10].chave];
  const uma = comporFeed(precomputo, perfil, LIMITE_FEED).map((c) => c.cartao.id);
  const outra = comporFeed(precomputo, perfil, LIMITE_FEED).map((c) => c.cartao.id);
  exigir(JSON.stringify(uma) === JSON.stringify(outra), "a composição não é determinística");
});

assercao("o feed NÃO é monoclasse — M-1", () => {
  // O defeito real desta sessão: sem rodízio, as sete primeiras posições vinham todas
  // «pessoa», porque 47.258 das 47.259 arestas semelhante_a ligam a mesma classe.
  const perfil = [catalogo.linguagens[0].chave, catalogo.grade[0].chave, catalogo.grade[1].chave];
  const feed = comporFeed(precomputo, perfil, LIMITE_FEED);
  const classes = new Set(feed.map((c) => c.cartao.classe));
  exigir(classes.size >= 3, `o feed veio com ${classes.size} classe(s): ${[...classes].join(", ")}`);
  for (let i = 1; i < feed.length; i++) {
    const anterior = feed[i - 1].cartao.classe;
    const atual = feed[i].cartao.classe;
    if (anterior !== atual) continue;
    // Repetir só é aceitável quando não havia alternativa (D-27): nenhuma outra classe da
    // rotação tinha candidato sobrando naquele ponto.
    const restantes = new Set(feed.slice(i).map((c) => c.cartao.classe));
    exigir(
      restantes.size === 1,
      `duas «${atual}» seguidas na posição ${i} com ${restantes.size} classes disponíveis`,
    );
  }
});

assercao("a ordem de classes do wire é a mesma de caminhada.ts", () => {
  const fonte = ler("src/dados/caminhada.ts");
  const marca = "const ROTACAO: readonly ClasseEntidade[] = [";
  const inicio = fonte.indexOf(marca);
  exigir(inicio >= 0, "não achei ROTACAO em caminhada.ts — o nome mudou?");
  const bloco = fonte.slice(inicio + marca.length);
  const lista = bloco.slice(0, bloco.indexOf("]")).match(/"([a-z-]+)"/g) ?? [];
  const daCaminhada = lista.map((s) => s.replaceAll('"', ""));
  exigir(
    JSON.stringify(daCaminhada) === JSON.stringify([...ROTACAO_DE_CLASSE]),
    `a cópia envelheceu: caminhada.ts tem [${daCaminhada}] e o wire tem [${ROTACAO_DE_CLASSE}]`,
  );
});

console.log("\nPORTÃO 6 — o catálogo não oferece o que não alcança");

assercao("nenhuma semente da grade ou da busca tem alcance zero", () => {
  const ilhas = [...catalogo.grade, ...catalogo.busca].filter((r) => r.alcance === 0);
  exigir(
    ilhas.length === 0,
    `${ilhas.length} semente(s) sem alcance foram oferecidas — elas entregariam feed vazio`,
  );
});

assercao("toda semente oferecida tem lista no precômputo", () => {
  const oferecidas = [
    ...catalogo.linguagens.map((l) => l.chave),
    ...catalogo.busca.map((r) => r.chave),
  ];
  const semLista = oferecidas.filter((c) => !precomputo.travessias[c]?.length);
  exigir(
    semLista.length === 0,
    `${semLista.length} semente(s) oferecidas sem lista: ${semLista.slice(0, 3).join(", ")}`,
  );
});

assercao("os temas do Notícias casam com o acervo, todos", () => {
  const temas = temasDeLeitura();
  // Cinco dos oito sumiam em silêncio quando o casamento era por slug — «questões
  // raciais» é `questoes-raciais` no acervo, e trocar espaço por hífen não tira acento.
  exigir(temas.length === 8, `${temas.length} de 8 temas casaram com o acervo`);
  for (const t of temas) exigir(t.n > 0, `o tema «${t.rotulo}» casou com contagem zero`);
});

console.log("\nPORTÃO 7 — as seções existem no HTML estático");

assercao("as seções de perfil existem no HTML de quem ainda não semeou", () => {
  // Devolver `null` até o localStorage ser lido tira a seção do HTML estático: ela passa
  // a existir só com JavaScript e some de qualquer verificação que leia o build. O Museu
  // caiu nisso e a faixa não apareceu em nenhuma das 2.463 páginas geradas.
  for (const tela of [
    "src/componentes/museu-reentrada.tsx",
    "src/componentes/repertorio-do-perfil.tsx",
  ]) {
    exigir(
      !/if \(!hidratado\) return null;/.test(ler(tela)),
      `${tela}: return null antes de hidratar tira a seção do HTML estático`,
    );
  }

  // A mesma classe de defeito com outra forma: `hidratado && algo` num ramo de JSX some
  // do HTML pelo mesmo motivo. O aviso do feed sem semente caiu nisso e não existia em
  // nenhuma das 5.475 páginas exportadas.
  exigir(
    !/\{hidratado && /.test(ler("src/componentes/feed.tsx")),
    "feed.tsx: `hidratado &&` num ramo de JSX tira o conteúdo do HTML estático",
  );
});

console.log("\nPORTÃO 8 — a ampliação de repertório é exata");

assercao("a métrica não é calculada sobre o teto do payload", () => {
  const perfil = [catalogo.linguagens[3].chave];
  const ampliacao = ampliacaoDeRepertorio(precomputo, perfil);
  const noFeed = new Set(
    comporFeed(precomputo, perfil, TETO_POR_SEMENTE).flatMap((c) => c.cartao.linguagens),
  );
  exigir(ampliacao.alcancadas > 0, "o perfil não alcançou linguagem nenhuma");
  exigir(
    ampliacao.alcancadas >= noFeed.size,
    "a ampliação está medindo só o que coube no feed — ela precisa do alcance inteiro",
  );
});

console.log(
  falhas === 0
    ? `\n  TUDO VERDE — ${catalogo.medidas.universo} sementes, ${catalogo.medidas.ilhadas} ilhadas, ` +
        `grade de ${catalogo.grade.length}, busca de ${catalogo.busca.length}\n`
    : `\n  ${falhas} FALHA(S)\n`,
);

process.exit(falhas === 0 ? 0 : 1);
