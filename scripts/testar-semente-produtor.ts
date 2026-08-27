/**
 * testar-semente-produtor.ts — a semente do perfil Produtor é determinística?
 *
 * Rodado por `npm run testar-semente-produtor` (tsx). Não usar `node` puro: Node nativo
 * recusa importar JSON de dentro de um `.ts` sem import attribute.
 *
 * O QUE ELE PROVA, e por que isso não é paranoia. A semente é construída sobre o grafo, e
 * o grafo é lido de arquivos que a `gerar-grafo` reescreve. Um `Math.random()` ou um
 * `new Date()` escondido em qualquer degrau da cadeia faria a demonstração de hoje não bater
 * com a captura de tela de ontem — e o sintoma apareceria só na frente da banca, porque é o
 * único momento em que alguém compara as duas.
 *
 * DUAS LEITURAS, MESMO JSON, BYTE A BYTE. Não é «tem o mesmo número de registros»: é o
 * documento inteiro serializado e comparado caractere por caractere. Um campo que mudasse
 * de ordem entre duas execuções passaria por qualquer verificação mais frouxa.
 */

import {
  contagemDaSemente,
  medidasDaMigracaoDeMuseu,
  registrosSemeados,
} from "../src/dados/mock/seed-produtor";
import { impedimentosDe, podePublicar } from "../src/dados/tipos-produtor";
import { PAUTAS } from "../src/dados/tipos-produtor";

let falhas = 0;

function afirmar(condicao: boolean, oQue: string, detalhe = "") {
  if (condicao) {
    console.log(`  ok   ${oQue}`);
  } else {
    falhas += 1;
    console.error(`  FALHA ${oQue}${detalhe ? ` — ${detalhe}` : ""}`);
  }
}

console.log("\nsemente do produtor\n");

// ---------------------------------------------------------------------------
// 1. Determinismo — duas leituras, o mesmo JSON
// ---------------------------------------------------------------------------

const primeira = JSON.stringify(registrosSemeados());
const segunda = JSON.stringify(registrosSemeados());

afirmar(
  primeira === segunda,
  "duas leituras produzem o mesmo JSON, byte a byte",
  primeira === segunda ? "" : `${primeira.length} vs ${segunda.length} caracteres`,
);

if (primeira !== segunda) {
  // Onde divergiu — sem isto o diagnóstico seria «alguma coisa mudou».
  for (let i = 0; i < Math.min(primeira.length, segunda.length); i += 1) {
    if (primeira[i] !== segunda[i]) {
      console.error(`  primeiro caractere divergente na posição ${i}:`);
      console.error(`    A: …${primeira.slice(Math.max(0, i - 60), i + 60)}…`);
      console.error(`    B: …${segunda.slice(Math.max(0, i - 60), i + 60)}…`);
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Cobertura — as onze pautas nascem semeadas
// ---------------------------------------------------------------------------

const registros = registrosSemeados();
const contagem = contagemDaSemente();

console.log("");
for (const pauta of PAUTAS) {
  afirmar(
    (contagem[pauta] ?? 0) > 0,
    `pauta «${pauta}» tem registro semeado`,
    `${contagem[pauta] ?? 0}`,
  );
}

console.log(`\n  ${registros.length} registros no total:`);
for (const pauta of PAUTAS) {
  console.log(`    ${String(contagem[pauta] ?? 0).padStart(2)} · ${pauta}`);
}

// ---------------------------------------------------------------------------
// 3. Ids únicos — a colisão seria silenciosa
// ---------------------------------------------------------------------------

const ids = registros.map((r) => r.id);
afirmar(
  new Set(ids).size === ids.length,
  "todos os ids são únicos",
  `${ids.length} ids, ${new Set(ids).size} distintos`,
);

// ---------------------------------------------------------------------------
// 4. Nenhum título inventado — todo registro tem título não vazio
// ---------------------------------------------------------------------------

const semTitulo = registros.filter((r) => r.titulo.trim() === "");
afirmar(semTitulo.length === 0, "nenhum registro semeado sem título", `${semTitulo.length}`);

// ---------------------------------------------------------------------------
// 5. Coerência — o que está PUBLICADO na semente pode publicar
// ---------------------------------------------------------------------------
//
// Um registro semeado como `publicado` que `podePublicar` recusa é uma contradição que a
// primeira abertura do painel exibiria: o produto anunciando no ar algo que ele próprio
// diz que não pode ir ao ar.

const publicadosQueNaoPodem = registros
  .filter((r) => r.situacao === "publicado" && !podePublicar(r))
  .map((r) => ({ id: r.id, faltam: impedimentosDe(r).filter((i) => i.bloqueia).map((i) => i.texto) }));

console.log("");
afirmar(
  publicadosQueNaoPodem.length === 0,
  "nenhum registro semeado como «publicado» tem impedimento bloqueante",
  publicadosQueNaoPodem.length === 0
    ? ""
    : JSON.stringify(publicadosQueNaoPodem, null, 2),
);

// ---------------------------------------------------------------------------
// 6. A migração do museu carrega o conteúdo inteiro
// ---------------------------------------------------------------------------

const museu = medidasDaMigracaoDeMuseu();
console.log("");
console.log(
  `  museu migrado: ${museu.exposicoes} exposições · ${museu.percursos} percursos · ` +
    `${museu.fotos} fotos · ${museu.videos} vídeos · ${museu.textos} textos`,
);
afirmar(museu.exposicoes === 2, "as duas exposições permanentes migraram", `${museu.exposicoes}`);
afirmar(museu.percursos > 0, "os passos de percurso migraram", `${museu.percursos}`);
afirmar(museu.fotos > 0, "as fotos migraram", `${museu.fotos}`);
afirmar(museu.videos > 0, "os vídeos migraram", `${museu.videos}`);
afirmar(museu.textos > 0, "os textos assinados migraram", `${museu.textos}`);

// ---------------------------------------------------------------------------

console.log("");
if (falhas > 0) {
  console.error(`${falhas} falha(s).\n`);
  process.exit(1);
}
console.log("semente determinística e coerente.\n");
