/**
 * gerar-feed-comunidades.mjs — monta o feed das comunidades a partir do acervo.
 *
 * NENHUM TEXTO AQUI É ESCRITO POR NÓS. Título e categoria vêm do CMS, a imagem
 * vem do disco com o `imagemAlt` e o `creditoImagem` que o Itaú Cultural
 * publica, e `fonte` é o endereço da matéria. Escrever 110 publicações à mão
 * seriam 110 afirmações nossas sobre cultura brasileira, apresentadas como se
 * fossem do acervo — exatamente o que este projeto não faz.
 *
 * A SELEÇÃO É DETERMINÍSTICA: cada comunidade tem uma semente derivada do
 * próprio id, e a mesma revisão do gerador produz sempre o mesmo feed. Sem isso,
 * duas gerações dariam feeds diferentes e a conferência a olho não valeria nada.
 *
 * Rodar: node scripts/gerar-feed-comunidades.mjs
 */

import fs from "node:fs";

const ENTIDADES = "src/dados/gerado/entidades.json";
const SAIDA = "src/dados/comunidade-feed.ts";
const POR_COMUNIDADE = 5;

const bruto = JSON.parse(fs.readFileSync(ENTIDADES, "utf8"));
const entidades = Array.isArray(bruto) ? bruto : bruto.entidades || [];
const emDisco = new Set(fs.readdirSync("public/acervo"));

const utilizaveis = entidades.filter(
  (e) =>
    e.titulo &&
    e.imagem &&
    emDisco.has(String(e.imagem).replace("/acervo/", "")) &&
    e.extra?.imagemAlt &&
    (e.creditoImagem || e.extra?.creditoImagem) &&
    e.fonte,
);

/** Rótulos das categorias do CMS. Espelha `ROTULOS` de `leituras.ts`. */
const CATEGORIA = {
  noticias: "Notícia",
  entrevista: "Entrevista",
  colunistas: "Coluna",
  opiniao: "Opinião",
  rumos: "Rumos",
  "agenda-cultural": "Agenda",
  acervos: "Acervo",
  icplay: "IC Play",
  formacao: "Formação",
  publicacoes: "Publicação",
  videos: "Vídeo",
  fotografia: "Fotografia",
  libras: "Libras",
  series: "Série",
  visitas: "Visita",
  exposicoes: "Exposição",
  podcasts: "Podcast",
};

/** FNV-1a — a mesma função de desempate que `caminhada.ts` usa. Nunca sorteio. */
function semear(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Quem COMENTA — o público. Quem PUBLICA é sempre a própria comunidade. */
const COMENTARISTAS = ["p-maria", "p-carlos", "p-joana", "p-rita", "p-tiago"];

/**
 * Comentários de demonstração. São reações genéricas de pessoas FICTÍCIAS sobre
 * o gesto de ler ou guardar — nunca afirmações sobre a obra, o artista ou o
 * fato. Um comentário que opinasse sobre o conteúdo seria texto nosso passando
 * por leitura de outra pessoa.
 */
const FALAS = [
  "Guardei para ler com calma.",
  "Vim parar aqui por causa de outra publicação e não me arrependi.",
  "Mandei para um amigo que ia gostar.",
  "Não conhecia. Fui atrás depois de ver por aqui.",
  "Já tinha lido e voltei.",
  "Essa eu levo para a roda de conversa de sábado.",
];

const comunidades = JSON.parse(
  fs.readFileSync("src/dados/comunidades-para-o-feed.json", "utf8"),
);

const usados = new Set();
const publicacoes = [];

for (const c of comunidades) {
  const semente = semear(c.id);

  // Prefere quem casa com a linguagem da comunidade; completa com o resto.
  const casam = utilizaveis.filter(
    (e) => !usados.has(e.id) && (e.linguagens || []).some((g) => c.linguagens.includes(g)),
  );
  const resto = utilizaveis.filter((e) => !usados.has(e.id));
  const fila = casam.length >= POR_COMUNIDADE ? casam : [...casam, ...resto];

  for (let i = 0; i < POR_COMUNIDADE; i++) {
    const indice = (semente + i * 7919) % fila.length;
    let escolhida = fila[indice];
    // Colisão: anda para a frente até achar uma livre.
    let passos = 0;
    while (escolhida && usados.has(escolhida.id) && passos < fila.length) {
      escolhida = fila[(indice + ++passos) % fila.length];
    }
    if (!escolhida || usados.has(escolhida.id)) continue;
    usados.add(escolhida.id);

    const s = semear(escolhida.id);
    const quantosComentarios = s % 3;

    publicacoes.push({
      // `ac` de acervo. O prefixo existe porque `pub-${c.id}-${i}` colidia com
      // as publicações escritas à mão: a comunidade `ic` gerava `pub-ic-1`, que
      // já era o id de uma delas. Chave repetida quebra a reconciliação do
      // React — a publicação antiga fica na tela mesmo depois de trocar de
      // comunidade, e nada no código parece errado.
      id: `pub-ac-${c.id}-${i}`,
      comunidadeId: c.id,
      // A comunidade assina. Publicação de terceiro numa comunidade que leva o
      // nome de uma instituição faz ela parecer emprestada.
      autorId: c.id,
      titulo: escolhida.titulo,
      corpo: "",
      etiqueta: CATEGORIA[escolhida.extra?.categoria] ?? "Do acervo",
      imagem: escolhida.imagem,
      imagemAlt: escolhida.extra.imagemAlt,
      imagemCredito: escolhida.creditoImagem || escolhida.extra?.creditoImagem,
      fonte: escolhida.fonte,
      reacoes: 40 + (s % 900),
      comentarios: Array.from({ length: quantosComentarios }, (_, k) => ({
        autorId: COMENTARISTAS[(s + k + 1) % COMENTARISTAS.length],
        corpo: FALAS[(s + k) % FALAS.length],
        reacoes: s % 40,
        quandoRotulo: `${1 + ((s + k) % 6)}d`,
      })),
      diasAtras: 1 + ((s + i) % 12),
    });
  }
}

const cabecalho = `/**
 * comunidade-feed.ts — GERADO por \`scripts/gerar-feed-comunidades.mjs\`. Não editar à mão.
 *
 * ${publicacoes.length} publicações montadas a partir de ${utilizaveis.length} entidades do acervo que têm,
 * ao mesmo tempo, título, arquivo de imagem em disco, \`imagemAlt\`, \`creditoImagem\`
 * e \`fonte\`. Título, categoria, imagem, descrição da imagem e crédito são do
 * Itaú Cultural; nenhum deles foi escrito por nós.
 *
 * Os comentários são de pessoas FICTÍCIAS e falam do gesto de ler ou guardar,
 * nunca da obra — opinião sobre o conteúdo seria texto nosso passando por
 * leitura de outra pessoa.
 */

import type { PublicacaoDefinida } from "@/lib/pontos/tipos";

export const PUBLICACOES_DO_ACERVO: PublicacaoDefinida[] = `;

fs.writeFileSync(SAIDA, cabecalho + JSON.stringify(publicacoes, null, 2) + ";\n");
console.log(`${publicacoes.length} publicações escritas em ${SAIDA}`);
console.log(`base utilizável: ${utilizaveis.length} entidades`);
