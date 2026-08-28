/**
 * CAPTURA DE TELAS — o complemento humano das suítes numéricas.
 *
 * A lição registrada em ARQUITETURA §6: sete vezes um portão passou com a tela
 * visivelmente quebrada, e todas as sete quem pegou foi a captura. Este script
 * fotografa as rotas-chave nas DUAS visões e escreve os PNG em
 * `verificacao/capturas/` — fora do git (.gitignore): a revisão a olho acontece
 * no fechamento da onda, não no histórico.
 *
 * Uso: `node scripts/capturar-telas.mjs` (exige `out/` de um build recente).
 */

import { writeFile, mkdir } from "node:fs/promises";
import { readdirSync } from "node:fs";
import path from "node:path";
import { servir } from "./servir-out.mjs";
import { abrirNavegador } from "./navegador.mjs";

const RAIZ = path.resolve(import.meta.dirname, "..");
const OUT = path.join(RAIZ, "out");
const DESTINO = path.join(RAIZ, "verificacao", "capturas");

/** Rotas-chave: as superfícies que o cliente vê primeiro + uma por família. */
const ROTAS = [
  "/descobrir/",
  // O hub do quinto botão da barra: na visão app é a porta para tudo que não é uma das
  // quatro abas, então é superfície de primeira ordem e não «mais uma rota».
  "/apps/",
  "/acontece/",
  "/play/",
  "/cursos/",
  "/buscar/",
  "/mapa/",
  "/meu/",
  "/salvos/",
  "/filtros/",
  "/entrar/",
  "/onboarding/1/",
  // Um evento qualquer do acervo, descoberto no out/ do build — slug fixo aqui
  // apodreceria junto com o grafo.
  `/evento/${readdirSync(path.join(RAIZ, "out", "evento"))[0]}/`,
  "/studio/duplicatas/",
  "/moderacao/fila/",
  "/observatorio/",
  "/roteiro/",
  // AS QUATRO PAUTAS REFEITAS em 2026-08-27, quando a parede da Organização saiu de cima
  // delas: são as que a revisão a olho reprovou, e por isso são as que ela reconfere.
  "/studio/programa/",
  "/studio/espacos/",
  "/studio/editais/",
  "/studio/midia/",
  // E a superfície nova onde a parede foi morar, mais uma das dez.
  "/studio/organizacao/",
  "/studio/organizacao/midia/",
];

const VISOES = ["mobile", "web"];

const servidor = await servir({ raiz: OUT, porta: Number(process.env.PORTA ?? 0) || undefined });
const cdp = await abrirNavegador();
await mkdir(DESTINO, { recursive: true });

let escritas = 0;
try {
  // NÃO HÁ MAIS ESTADO AVULSO A FOTOGRAFAR. Até 23/08 existia aqui uma foto extra da
  // gaveta do menu ABERTA na visão app — o único estado que nenhuma rota capturava
  // sozinha, porque dependia de um clique no hambúrguer. A visão app passou a usar a
  // barra inferior, que está sempre na tela, e o que a gaveta escondia virou a rota
  // `/apps/`, já na lista acima. Na web o menu é trilho permanente e nunca esteve
  // fechado. Sem clique nenhum, o roteiro é só o laço.
  for (const visao of VISOES) {
    for (const rota of ROTAS) {
      await cdp.navegar(`${servidor.url}${rota}`);
      // A visão é estado persistido: escreve a chave e recarrega para o
      // ViewProvider ler no boot — o mesmo caminho que um usuário real faz.
      await cdp.avaliar(`localStorage.setItem("agenda-cultural:visao", ${JSON.stringify(visao)})`);
      await cdp.recarregar();
      await cdp.avaliar(
        `new Promise((r) => { const t = () => document.querySelector('[data-hidratado="sim"]') ? r(1) : setTimeout(t, 50); t(); })`,
      );
      const nome = `${visao}-${rota.replaceAll("/", "-").replace(/^-|-$/g, "") || "raiz"}.png`;
      const png = await cdp.capturar();
      await writeFile(path.join(DESTINO, nome), Buffer.from(png, "base64"));
      escritas += 1;
      console.log(`  foto  ${nome}`);
    }
  }
} finally {
  await cdp.encerrar();
  await servidor.fechar();
}

console.log(`\n  ${escritas} capturas em ${path.relative(RAIZ, DESTINO)}\n`);
