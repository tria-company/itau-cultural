import vocabularioJson from "./gerado/vocabulario.json";
import { expandir, paraCartao, type Candidato } from "./caminhada";
import { porId, porLinguagem, porSlug, slugsPorTipo } from "./grafo";
import { capaDe } from "./imagem";
import type { Persona } from "./personas";
import {
  chaveDeEntidade,
  chaveDeLinguagem,
  type CapaDeSemente,
  LASTRO_FORTE,
  TETO_POR_SEMENTE,
  type CartaoEnxuto,
  type CatalogoDeSementes,
  type ChaveSemente,
  type LinguagemDeSemente,
  type PrecomputoDeSementes,
  type RostoDeSemente,
  type TravessiaNoFio,
} from "./sementes-wire";
import type { MotivoCartao } from "./cartao";
import type { Entidade, Vocabulario } from "./tipos";

/**
 * sementes.ts — o precômputo do onboarding cultural (S8).
 *
 * MÓDULO DE BUILD. Alcança `caminhada.ts`, que alcança o grafo: por DP-F nenhum
 * `"use client"` pode importá-lo por valor. O que atravessa a fronteira é
 * `precomputoDeSementes()` e `catalogoDeSementes()`, no formato de `sementes-wire.ts`.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * O QUE FOI MEDIDO CONTRA O ACERVO, e cada número desta tela é CONTADO:
 *
 * **O universo é 847 sementes**: 33 linguagens + 575 pessoas + 239 obras.
 *
 * **138 delas não alcançam nada** em 1 ou 2 saltos — são ilhas no grafo — e **51 dessas
 * têm imagem local**. Sem esta contagem, a grade de reconhecimento do passo 3 ofereceria
 * 51 cartas com foto bonita que entregam um feed VAZIO. É por isso que `alcance` é campo
 * do catálogo e não detalhe interno: `alcance === 0` não é oferecível, e a tela mostra o
 * denominador do que sobrou.
 *
 * **O alcance varia 200 vezes entre sementes**: mediana 320, mínimo 0, máximo 2.988. O
 * teto de 24 por semente corta a cauda alta e não toca a baixa — a cauda baixa não é
 * «pouco», é zero, e quem trata disso é o corte de `alcance`.
 *
 * **Nenhum dos motivos é escrito no acervo.** Nas travessias de semente, os 17.005
 * motivos são todos COMPOSTOS por `motivo.ts` a partir de relação e títulos; nenhuma
 * aresta atravessada carregava texto próprio. É um fato sobre estas travessias, não sobre
 * o grafo inteiro — e é o que faz 366 textos distintos explicarem as 17.005.
 *
 * **A grade abre com as linguagens de 50 entidades ou mais.** São 19: artes visuais
 * 2.623, teatro 799, literatura 736, música 569… e a cauda desce até culinária, Rádio e
 * TV, com 2 cada. As 14 fracas continuam oferecíveis atrás de «ver todas», com a
 * contagem à vista.
 *
 * **CORREÇÃO DE UMA JUSTIFICATIVA ERRADA**, que este arquivo carregou até a prova: não é
 * verdade que semear uma linguagem fraca devolva um feed de um item. MEDIDO: «culinária»
 * tem 2 entidades e alcança 15 cartões; «TV» tem 2 e alcança 42; «curta-metragem» tem 39
 * e alcança 492. Tamanho de acervo e alcance são coisas diferentes, e a caminhada
 * atravessa a linguagem para fora dela. O corte de `alcance` continua existindo e
 * continua necessário — só que quem ele protege são as 138 sementes de ENTIDADE que não
 * alcançam nada, nunca as linguagens.
 * ------------------------------------------------------------------------------------ */

const VOCABULARIO = vocabularioJson as Vocabulario;

/** Quem pode ser semente de entidade. Pessoa e obra são as classes que se reconhece pelo nome. */
const CLASSES_DE_SEMENTE = ["pessoa", "obra"] as const;

type ClasseDeSemente = (typeof CLASSES_DE_SEMENTE)[number];

// ---------------------------------------------------------------------------
// A persona sintética de uma semente
// ---------------------------------------------------------------------------

/**
 * `expandir` recebe uma `Persona` e lê só o repertório dela — é isso que permite semear a
 * caminhada com UMA linguagem ou UMA entidade sem inventar persona no JSON.
 *
 * O `id` precisa ser único por semente: `CACHE_EXPANSAO`, em `caminhada.ts`, é chaveado
 * por ele, e id repetido devolveria a expansão da semente anterior — o precômputo inteiro
 * ficaria plausível e errado.
 */
function personaDaSemente(chave: ChaveSemente, linguagem?: string, entidade?: string): Persona {
  return {
    id: `semente:${chave}`,
    nome: chave,
    resumo: "",
    procedencia: "autorado",
    repertorio: {
      id: `repertorio:${chave}`,
      pessoaUsuariaId: `semente:${chave}`,
      linguagens: linguagem ? [linguagem] : [],
      entidades: entidade ? [entidade] : [],
      ocorrenciasSalvas: [],
      procedencia: "autorado",
    },
  };
}

function hash32(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * A ordem dentro de UMA semente. Mesmo critério de `ordenarBalde`: salto primeiro, depois
 * fugir do concentrador, depois ter imagem, e o desempate por hash SEMEADO pela chave.
 *
 * O hash é semeado e não global porque, sem isso, a mesma entidade encabeçaria a lista de
 * todas as sementes — é a falha M-4 de `caminhada.ts`, onde «Ademar Manarini» foi o
 * primeiro cartão de pessoa das três personas por ordem alfabética de id.
 */
function ordenarDaSemente(lista: Candidato[], chave: ChaveSemente): Candidato[] {
  return [...lista].sort((a, b) => {
    if (a.saltos !== b.saltos) return a.saltos - b.saltos;
    if (a.viaConcentrador !== b.viaConcentrador) return a.viaConcentrador ? 1 : -1;
    const ia = a.entidade.imagem ? 0 : 1;
    const ib = b.entidade.imagem ? 0 : 1;
    if (ia !== ib) return ia - ib;
    return hash32(`${chave}|${a.entidade.id}`) - hash32(`${chave}|${b.entidade.id}`);
  });
}

/**
 * Distribui o teto POR CLASSE, em vez de cortar os 24 melhores no geral.
 *
 * ISTO CORRIGE UM DEFEITO QUE ESVAZIAVA APPS INTEIROS. Medido nos dois lados: sem teto,
 * das 33 linguagens, 29 alcançam conteúdo, 27 alcançam evento, 24 alcançam mídia e 15
 * alcançam formação. Depois de cortar os 24 melhores por mérito, sobrava mídia em 3% das
 * sementes e formação em 1% — porque a ordenação (salto → concentrador → imagem) empurra
 * pessoa e obra para o topo e as classes raras morrem no corte.
 *
 * O sintoma era um feed que nunca recomendava um curso. E o rodízio de `comporFeed` não
 * salvava: ele intercala o que sobreviveu, e não havia sobrevivente para intercalar.
 *
 * A cota não é igualitária: cada classe leva no máximo `COTA_POR_CLASSE`, e o que sobrar
 * do orçamento vai para os melhores no geral. Assim as classes raras têm PRESENÇA
 * garantida sem que o mérito deixe de mandar no resto.
 *
 * DOIS, e não três: com cota 3 o Cursos ficava com 3 cartões no perfil de teste e o
 * payload em 93% do teto; com cota 2 ele fica com 6 e o payload em 92%. Presença já está
 * garantida com dois, e o orçamento que sobra volta para o mérito.
 */
const COTA_POR_CLASSE = 2;

function comCotaPorClasse(ordenados: Candidato[]): Candidato[] {
  const porClasse = new Map<string, number>();
  const escolhidos: Candidato[] = [];
  const sobra: Candidato[] = [];

  for (const c of ordenados) {
    const classe = c.entidade.classe;
    const n = porClasse.get(classe) ?? 0;
    if (n < COTA_POR_CLASSE && escolhidos.length < TETO_POR_SEMENTE) {
      porClasse.set(classe, n + 1);
      escolhidos.push(c);
    } else {
      sobra.push(c);
    }
  }
  for (const c of sobra) {
    if (escolhidos.length >= TETO_POR_SEMENTE) break;
    escolhidos.push(c);
  }
  return escolhidos;
}

// ---------------------------------------------------------------------------
// O precômputo
// ---------------------------------------------------------------------------

interface Semeadura {
  precomputo: PrecomputoDeSementes;
  catalogo: CatalogoDeSementes;
}

let memo: Semeadura | undefined;

/**
 * Roda a caminhada pelas 847 sementes uma vez por processo de build.
 *
 * As 2.463 páginas do export chamam isto muitas vezes; sem o memo, seriam 2.463 × 847
 * caminhadas. Com ele, 847 — medidas em ~1 segundo no total.
 */
function semear(): Semeadura {
  if (memo) return memo;

  // --- tabelas de deduplicação ---
  const idxCartao = new Map<string, number>();
  const cartoes: CartaoEnxuto[] = [];
  const idxMotivo = new Map<string, number>();
  const motivos: MotivoCartao[] = [];
  const idxNo = new Map<string, number>();
  const nos: [string, string][] = [];
  const travessias: Record<ChaveSemente, TravessiaNoFio[]> = {};
  const linguagensDe: Record<ChaveSemente, string[]> = {};
  const linguagensAUmSalto: Record<ChaveSemente, string[]> = {};

  const guardarCartao = (cartaoCompleto: ReturnType<typeof paraCartao>): number => {
    const existente = idxCartao.get(cartaoCompleto.id);
    if (existente !== undefined) return existente;
    const { motivo: _motivo, caminho: _caminho, ...enxuto } = cartaoCompleto;
    const i = cartoes.push(enxuto) - 1;
    idxCartao.set(cartaoCompleto.id, i);
    return i;
  };

  const guardarMotivo = (motivo: MotivoCartao): number => {
    // A chave inclui a origem e a relação: dois motivos com o mesmo texto e procedências
    // diferentes não são o mesmo motivo, e o selo mostra a procedência.
    const chave = `${motivo.texto}|${motivo.origemMotivo}|${motivo.relacao}|${motivo.procedenciaAresta}`;
    const existente = idxMotivo.get(chave);
    if (existente !== undefined) return existente;
    const i = motivos.push(motivo) - 1;
    idxMotivo.set(chave, i);
    return i;
  };

  const guardarNo = (id: string, titulo: string): number => {
    const existente = idxNo.get(id);
    if (existente !== undefined) return existente;
    const i = nos.push([id, titulo]) - 1;
    idxNo.set(id, i);
    return i;
  };

  /** Alcance por chave, antes do teto. É o que separa semente oferecível de ilha. */
  const alcancePorChave = new Map<ChaveSemente, number>();

  const semearUma = (chave: ChaveSemente, persona: Persona, idProprio: string): void => {
    const expansao = expandir(persona);
    // A própria semente nunca é cartão de si mesma.
    const candidatos = expansao.candidatos.filter((c) => c.entidade.id !== idProprio);
    alcancePorChave.set(chave, candidatos.length);

    // As linguagens SEM TETO, e antes do corte de vazio: a métrica de ampliação de
    // repertório se calcula sobre o alcance inteiro, não sobre os 24 que couberam no
    // payload. São 33 ids no total — a lista completa por semente é barata e exata.
    const proprias = porId(idProprio)?.linguagens ?? [];
    const aUmSalto = new Set<string>();
    for (const c of candidatos) {
      if (c.saltos !== 1) continue;
      for (const l of c.entidade.linguagens) aUmSalto.add(l);
    }
    if (proprias.length) linguagensDe[chave] = [...proprias];
    if (aUmSalto.size) linguagensAUmSalto[chave] = [...aUmSalto].sort();

    if (candidatos.length === 0) return;

    const linhas: TravessiaNoFio[] = [];
    for (const c of comCotaPorClasse(ordenarDaSemente(candidatos, chave))) {
      const cartao = paraCartao(c);
      const meio = c.caminho.length > 1 ? c.caminho[0] : undefined;
      linhas.push([
        guardarCartao(cartao),
        guardarMotivo(cartao.motivo),
        meio ? guardarNo(meio.paraId, meio.paraTitulo) : -1,
      ]);
    }
    travessias[chave] = linhas;
  };

  // --- linguagens ---
  const linguagens: LinguagemDeSemente[] = [];
  for (const slug of slugsPorTipo("linguagem")) {
    const entidade = porSlug("linguagem", slug);
    if (!entidade) continue;
    const chave = chaveDeLinguagem(slug);
    semearUma(chave, personaDaSemente(chave, slug), entidade.id);
    // A entidade de linguagem não declara linguagem nenhuma no grafo; quem a atravessa
    // atravessou ELA. Sem esta linha, marcar «música» apareceria como zero linguagem
    // atravessada e toda a música contaria como ampliação.
    linguagensDe[chave] = [slug];
    const doVocabulario = VOCABULARIO.linguagens.find((l) => l.id === slug);
    const rotulo = doVocabulario?.rotulo ?? entidade.titulo;
    const linguagem: LinguagemDeSemente = {
      chave,
      slug,
      rotulo,
      cor: doVocabulario?.cor ?? "--ic-cinza",
      entidades: porLinguagem(slug).length,
      alcance: alcancePorChave.get(chave) ?? 0,
    };
    const capa = capaDaLinguagem(slug, rotulo);
    if (capa) linguagem.capa = capa;
    linguagens.push(linguagem);
  }

  // --- pessoas e obras ---
  const entidades: RostoDeSemente[] = [];
  for (const classe of CLASSES_DE_SEMENTE) {
    for (const slug of slugsPorTipo(classe)) {
      const e = porSlug(classe, slug);
      if (!e) continue;
      const chave = chaveDeEntidade(e.id);
      semearUma(chave, personaDaSemente(chave, undefined, e.id), e.id);
      entidades.push(rostoDe(e, classe, alcancePorChave.get(chave) ?? 0));
    }
  }

  // --- medidas, todas contadas ---
  const ilhadasEntidade = entidades.filter((r) => r.alcance === 0);
  const ilhadasLinguagem = linguagens.filter((l) => l.alcance === 0);

  const catalogo: CatalogoDeSementes = {
    // A cauda fraca fica no fim, mas continua na lista: quem corta é a tela, com o
    // número à vista, e não este módulo em silêncio.
    linguagens: [...linguagens]
      .filter((l) => l.alcance > 0)
      .sort((a, b) => b.entidades - a.entidades),
    grade: entidades
      .filter((r) => r.alcance > 0 && r.imagem)
      .sort((a, b) => b.alcance - a.alcance),
    busca: entidades
      .filter((r) => r.alcance > 0)
      .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR")),
    medidas: {
      universo: linguagens.length + entidades.length,
      ilhadas: ilhadasEntidade.length + ilhadasLinguagem.length,
      ilhadasComRosto: ilhadasEntidade.filter((r) => r.imagem).length,
      linguagensFortes: linguagens.filter(
        (l) => l.entidades >= LASTRO_FORTE && l.alcance > 0,
      ).length,
      cartoesDistintos: cartoes.length,
    },
  };

  memo = {
    precomputo: { cartoes, motivos, nos, travessias, linguagensDe, linguagensAUmSalto },
    catalogo,
  };
  return memo;
}

/**
 * A capa de uma linguagem: uma AMOSTRA do acervo dela, não uma ilustração.
 *
 * É o mesmo princípio dos cartazes do hub de apps — a foto mostra o que tem dentro. Por
 * isso ela sai de uma entidade que REALMENTE pertence à linguagem, e por isso não há
 * empréstimo: linguagem cujo acervo não tem imagem local nenhuma fica sem capa e a carta
 * cai no gradiente da cor. Pegar a foto de outra linguagem seria prometer um acervo que
 * não está ali.
 *
 * A escolha é determinística e semeada pelo slug: sem isso, a mesma entidade encabeçaria
 * várias linguagens por ordem de id, que é a falha M-4 de `caminhada.ts`. Preferência para
 * obra e pessoa — uma reprodução ou um retrato diz «artes visuais» melhor que a foto de
 * uma reportagem sobre artes visuais.
 */
function capaDaLinguagem(slug: string, rotulo: string): CapaDeSemente | undefined {
  const PESO_DA_CLASSE: Record<string, number> = { obra: 0, pessoa: 1, evento: 2, midia: 3 };

  const candidatas = porLinguagem(slug)
    .map((e) => ({ e, foto: capaDe(e) }))
    .filter((c) => Boolean(c.foto.imagem))
    .sort((a, b) => {
      const pa = PESO_DA_CLASSE[a.e.classe] ?? 9;
      const pb = PESO_DA_CLASSE[b.e.classe] ?? 9;
      if (pa !== pb) return pa - pb;
      return hash32(`${slug}|${a.e.id}`) - hash32(`${slug}|${b.e.id}`);
    });

  const escolhida = candidatas[0];
  if (!escolhida?.foto.imagem) return undefined;

  const capa: CapaDeSemente = {
    arquivo: escolhida.foto.imagem,
    alt: `Amostra do acervo de ${rotulo}: ${escolhida.e.titulo}`,
  };
  if (escolhida.foto.creditoImagem) capa.credito = escolhida.foto.creditoImagem;
  return capa;
}

function rostoDe(e: Entidade, classe: ClasseDeSemente, alcance: number): RostoDeSemente {
  const rosto: RostoDeSemente = {
    chave: chaveDeEntidade(e.id),
    id: e.id,
    titulo: e.titulo,
    classe,
    linguagens: e.linguagens,
    alcance,
  };
  if (e.imagem) rosto.imagem = e.imagem;
  return rosto;
}

/** O precômputo inteiro, no fio. Medido em 0,76 MB com o teto de 24. */
export function precomputoDeSementes(): PrecomputoDeSementes {
  return semear().precomputo;
}

/** O que as telas de escolha mostram, já sem as ilhas. */
export function catalogoDeSementes(): CatalogoDeSementes {
  return semear().catalogo;
}

// ---------------------------------------------------------------------------
// Temas de leitura — a lista AUTORADA do Notícias
// ---------------------------------------------------------------------------

/**
 * Os temas que o Notícias oferece, e por que esta lista é nossa e não do acervo.
 *
 * CONTADO: 88 temas têm conteúdo editorial atrás. Os cinco maiores são `institucional`
 * 147, `ic play` 118, `filme` 108, `efemérides` 99 e `edital` 97 — e três deles são
 * classificação operacional do CMS, não interesse de leitura. Uma lista ordenada por
 * tamanho ofereceria «edital» como preferência de leitura na primeira posição.
 *
 * Por isso a lista é autorada, `procedencia: "autorado"`, exatamente como o vocabulário
 * de disposição em `disposicoes.ts` — e a tela DIZ que é autorada, com o denominador dos
 * 88. A contagem de cada um continua vindo do acervo: o que é nosso é a escolha de quais
 * entram, nunca o número ao lado.
 */
/**
 * Casa o tema curado com o do acervo pelo TÍTULO, não pelo slug.
 *
 * Pela primeira escrita isto casava por slug, e cinco dos oito temas silenciosamente
 * sumiam da tela: «questões raciais» vira `questoes-raciais` no acervo, e trocar espaço
 * por hífen não tira o acento. O sintoma era uma lista de três itens onde deveriam estar
 * oito — sem erro, sem aviso, com os números certos nos três que sobraram.
 */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

const TEMAS_DE_LEITURA: readonly string[] = [
  "filme",
  "questões raciais",
  "ocupação",
  "questões indígenas",
  "coronavírus",
  "debate",
  "políticas culturais",
  "acessibilidade",
];

/**
 * Os temas de leitura com a contagem de matérias de cada um, contada no grafo.
 *
 * O que é nosso é a ESCOLHA de quais entram; o número ao lado é do acervo, sempre. Tema
 * curado que não existir mais no grafo simplesmente não aparece — a lista encolhe em
 * silêncio em vez de mostrar um recorte que devolveria zero.
 */
export function temasDeLeitura(): { valor: string; rotulo: string; n: number }[] {
  const porTitulo = new Map<string, string>();
  for (const slug of slugsPorTipo("tema")) {
    const tema = porSlug("tema", slug);
    if (tema) porTitulo.set(normalizar(tema.titulo), tema.id);
  }
  return TEMAS_DE_LEITURA.map((rotulo) => {
    const id = porTitulo.get(normalizar(rotulo));
    const n = id ? porLinguagem(id, "conteudo").length : 0;
    return { valor: id ?? rotulo, rotulo, n };
  }).filter((t) => t.n > 0);
}

