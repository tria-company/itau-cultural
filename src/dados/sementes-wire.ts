/**
 * sementes-wire.ts — o contrato da fronteira do onboarding cultural (S8).
 *
 * MÓDULO SÓ-DE-TIPOS E DE FUNÇÃO PURA. Os dois lados importam: `sementes.ts` roda no
 * build e alcança o grafo; o componente do feed roda no navegador e não pode alcançar
 * nada (DP-F). Nada aqui importa `grafo.ts`, `caminhada.ts` ou qualquer coisa que os
 * alcance — é isso que faz este arquivo poder ser importado dos dois lados.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * O FORMATO, E POR QUE ELE É ESTE. Medido em `scripts/medir-sementes.ts` (tarefa 1 do
 * PRD), sobre as 847 sementes do universo:
 *
 *   cartão inteiro por semente ............. 22,49 MB
 *   tabela + índices + caminhos ............ 14,86 MB
 *   tabela + índices + passos como ids ......  2,87 MB
 *   ESTE, com teto de 24 ....................  0,76 MB   ← 53% do teto
 *
 * `caminho` sozinho era 56% do peso e `motivo` 18%. Nenhuma compressão salvaria três
 * quartos do payload — o que salvou foi parar de guardar o repetido: **366 textos de
 * motivo distintos explicam 17.005 travessias**, e a tabela deles pesa 15 KB.
 *
 * POR QUE O TEXTO, E NÃO A REGRA QUE O GERA. Remontar a frase no cliente exigiria
 * duplicar os compositores de `motivo.ts` — uma regra escrita dos dois lados da fronteira
 * diverge na primeira edição, e o sintoma seria um selo que diz uma coisa no build e
 * outra no navegador. É a mesma lição que fez `ordemDisposicoes` viajar como DADO em
 * `feeds.ts`, e não como função repetida.
 * ------------------------------------------------------------------------------------ */

import type { Cartao, MotivoCartao } from "./cartao";
import type { ClasseEntidade } from "./tipos";

// ---------------------------------------------------------------------------
// Chave de semente
// ---------------------------------------------------------------------------

/**
 * A chave de uma semente. `l:<slug>` para linguagem, `e:<id>` para entidade.
 *
 * Prefixo e não campo separado porque a chave é usada como chave de objeto no fio e como
 * item de array em `localStorage`: um par `{tipo, valor}` custaria o dobro em 709
 * entradas e exigiria uma função de comparação em vez de igualdade de string.
 */
export type ChaveSemente = string;

export const chaveDeLinguagem = (slug: string): ChaveSemente => `l:${slug}`;
export const chaveDeEntidade = (id: string): ChaveSemente => `e:${id}`;

export const ehLinguagem = (chave: ChaveSemente): boolean => chave.startsWith("l:");

// ---------------------------------------------------------------------------
// Catálogo — o que as telas de escolha mostram
// ---------------------------------------------------------------------------

/**
 * Uma linguagem oferecível.
 *
 * `entidades` e `alcance` são DUAS coisas, e confundi-las custou uma justificativa errada
 * neste arquivo: `entidades` é o tamanho do acervo daquela linguagem (TV tem 2), e
 * `alcance` é quantos cartões a caminhada tira dela (TV alcança 42). MEDIDO: a menor de
 * todas, «culinária», tem 2 entidades e alcança 15 cartões — **nenhuma das 33 linguagens
 * produz um feed vazio**. O que produz feed vazio são 138 sementes de ENTIDADE, e é sobre
 * elas que o corte de `alcance` age.
 *
 * A contagem continua colada no rótulo na tela, mas pelo que ela é de verdade: o tamanho
 * do acervo daquela linguagem, para a escolha ser informada — não um aviso de risco.
 */
export interface LinguagemDeSemente {
  chave: ChaveSemente;
  slug: string;
  rotulo: string;
  /** Token de cor do vocabulário (`--ic-azul`), o mesmo do selo de linguagem no cartão. */
  cor: string;
  entidades: number;
  /** Quantos cartões esta semente alcança de fato. Zero não é oferecível. */
  alcance: number;
  /**
   * A capa da carta, e ela é AMOSTRA do acervo daquela linguagem — não ilustração dela.
   *
   * Mesmo princípio dos cartazes do hub de apps: a foto mostra o que tem dentro, e por
   * isso sai de uma entidade real que pertence à linguagem. Ausente quando o acervo
   * daquela linguagem não tem nenhuma imagem local — e aí a carta cai no gradiente da
   * cor, sem foto emprestada de outra linguagem.
   */
  capa?: CapaDeSemente;
}

export interface CapaDeSemente {
  arquivo: string;
  /** Texto alternativo em pt-BR, dizendo de onde a amostra veio. */
  alt: string;
  /** Quem fez a foto, quando o acervo declara. */
  credito?: string;
}

/** Uma pessoa ou obra oferecível como semente. */
export interface RostoDeSemente {
  chave: ChaveSemente;
  id: string;
  titulo: string;
  classe: Extract<ClasseEntidade, "pessoa" | "obra">;
  /** Caminho da imagem local. Ausente em quem só aparece pela busca. */
  imagem?: string;
  /** Ids de linguagem, para ordenar a grade pelo que a pessoa marcou no passo 2. */
  linguagens: string[];
  alcance: number;
}

/** O cartão sem o que é derivável por índice: `motivo` e `caminho` moram nas tabelas. */
export type CartaoEnxuto = Omit<Cartao, "motivo" | "caminho">;

/**
 * Uma travessia: qual cartão, com que motivo, passando por qual nó.
 *
 * Tupla posicional e não objeto — são 17.005 delas, e nome de campo repetido 17 mil vezes
 * é o mesmo problema que fez as 529 mídias do Play virarem tupla em `play-wire.ts`.
 *
 * `-1` no nó do meio é ausência declarada: a travessia foi de um salto e não passou por
 * ninguém. Nunca zero, que é um índice válido.
 */
export type TravessiaNoFio = readonly [cartao: number, motivo: number, noDoMeio: number];

export interface PrecomputoDeSementes {
  cartoes: CartaoEnxuto[];
  /** 366 distintos explicam 17.005 travessias. */
  motivos: MotivoCartao[];
  /** `[id, titulo]` dos nós intermediários, para a tela «por que isto apareceu». */
  nos: [string, string][];
  /** Por chave de semente, na ordem em que a caminhada as ranqueou. */
  travessias: Record<ChaveSemente, TravessiaNoFio[]>;
  /**
   * As linguagens que cada semente declara, e as que ela ALCANÇA a um salto.
   *
   * Guardadas à parte das travessias e sem teto nenhum, porque delas sai o indicador de
   * ampliação de repertório que o RFP pede — e uma métrica de impacto calculada sobre os
   * 24 cartões que couberam no payload seria uma amostra apresentada como medida. São 33
   * ids no total: a lista completa por semente custa dezenas de KB e é exata.
   */
  linguagensDe: Record<ChaveSemente, string[]>;
  linguagensAUmSalto: Record<ChaveSemente, string[]>;
}

export interface CatalogoDeSementes {
  linguagens: LinguagemDeSemente[];
  /** Só quem tem rosto E alcança alguma coisa — é a grade do passo 3. */
  grade: RostoDeSemente[];
  /** Todas as sementes de entidade oferecíveis, para a busca. Inclui as sem rosto. */
  busca: RostoDeSemente[];
  /** Denominadores para as declarações de ausência da tela. */
  medidas: MedidasDeSementes;
}

/**
 * Os números que as telas declaram. Todos contados no build — a suíte de verificação
 * reprova dígito de acervo escrito à mão em TSX.
 */
export interface MedidasDeSementes {
  /** 847: 33 linguagens + 814 entidades. */
  universo: number;
  /** 138: sementes que não alcançam nada em 1 ou 2 saltos. */
  ilhadas: number;
  /** 51: das ilhadas, quantas têm imagem — as que a grade perderia se não olhasse. */
  ilhadasComRosto: number;
  /** Quantas linguagens têm 50 entidades ou mais. Abrem a grade do passo 2. */
  linguagensFortes: number;
  /** Cartões distintos no precômputo inteiro. */
  cartoesDistintos: number;
}

// ---------------------------------------------------------------------------
// Composição — roda NO CLIENTE, sobre o fio
// ---------------------------------------------------------------------------

/**
 * O corte de cima da grade do passo 2: com este lastro ou mais, a linguagem abre a grade;
 * abaixo dele ela fica atrás de «ver todas», com a contagem à vista.
 *
 * É ordem de apresentação, NÃO proteção contra feed vazio — as fracas alcançam de 15 a
 * 492 cartões, medido. O que elas não têm é acervo próprio grande, e é isso que a
 * contagem no rótulo conta.
 */
export const LASTRO_FORTE = 50;

/**
 * Cartões por semente no precômputo.
 *
 * Desceu de 24 para 18 quando o teto passou a ser distribuído POR CLASSE (ver
 * `comCotaPorClasse` em `sementes.ts`). A cota resgatou as classes raras que o corte por
 * mérito matava, mas cada classe nova traz cartões distintos para a tabela e o payload
 * foi a 102% do limite.
 *
 * As quatro combinações foram medidas, e a escolhida não é a mais folgada: cota 3 com
 * teto 18 cabia em 93% e deixava Cursos com 3 cartões; cota 2 com teto 18 cabe em 92% e
 * deixa Cursos com 6. Baixar a cota e manter o teto cobre melhor que o contrário, porque
 * a presença já está garantida com 2 e o resto do orçamento volta para o mérito.
 *
 * É este número que se mexe quando o payload apertar — nunca o universo de sementes, que
 * é o que o portão 4 diz na mensagem de falha.
 */
export const TETO_POR_SEMENTE = 18;

/**
 * A ordem do rodízio de classe, a MESMA de `caminhada.ts`.
 *
 * Ela está repetida aqui e não importada de lá porque `caminhada.ts` arrasta o grafo
 * (DP-F) e este módulo roda no navegador. A duplicação é de DADO, não de regra — e a
 * suíte de verificação confere que as duas listas são iguais, que é o que impede a cópia
 * de envelhecer sozinha.
 *
 * POR QUE O RODÍZIO EXISTE, e a primeira prova deste módulo mostrou o que acontece sem
 * ele: as sete primeiras posições vieram todas `pessoa`. É a medição M-1 de
 * `caminhada.ts` reencenada — 47.258 das 47.259 arestas `semelhante_a` ligam duas
 * entidades da MESMA classe, então caminhada sem rodízio é monoclasse por construção.
 * Um feed cultural que devolve doze pessoas em fila não amplia repertório nenhum.
 */
export const ROTACAO_DE_CLASSE: readonly ClasseEntidade[] = [
  "evento",
  "conteudo",
  "pessoa",
  "obra",
  "termo",
  "midia",
  "coletivo",
  "instituicao",
  "trilha",
  "formacao",
  "publicacao",
  "espaco",
];

/**
 * FNV-1a, o mesmo de `caminhada.ts`. Repetido aqui e não importado de lá porque este
 * módulo atravessa a fronteira e `caminhada.ts` arrasta o grafo inteiro (DP-F).
 */
function hash32(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface CartaoComposto {
  cartao: CartaoEnxuto;
  motivo: MotivoCartao;
  /** `[id, titulo]` do nó do meio, quando a travessia teve dois saltos. */
  noDoMeio?: [string, string];
  /** Quantas das sementes marcadas alcançam este cartão. É o ranqueamento. */
  sementes: number;
  /** As chaves que o alcançaram, para a tela poder dizer «porque você marcou X». */
  porSementes: ChaveSemente[];
}

/**
 * A composição do feed a partir das sementes marcadas.
 *
 * O RANQUEAMENTO É A INTERSEÇÃO, e ela é a única coisa que o feed de sementes sabe fazer
 * que o de persona não sabia: um cartão alcançado por cinco das suas dez sementes está
 * mais perto de você do que um alcançado por uma só. Popularidade continua não entrando
 * em lugar nenhum — a contagem é sobre as SUAS sementes, não sobre as de todo mundo.
 *
 * Desempates, na ordem: mais sementes, depois posição média melhor na lista de cada
 * semente (a caminhada já ordenou por salto e concentrador), depois ter imagem, e por
 * último um hash SEMEADO PELO PERFIL.
 *
 * O último não é ornamento: sem ele o empate cai na ordem de inserção do mapa, que é a
 * ordem em que as travessias foram geradas — alfabética por id. A primeira prova deste
 * módulo devolveu «Adolfo Celi · Adriana Rocha · Aluísio Azevedo» no topo, que é a falha
 * M-4 de `caminhada.ts` reencenada num arquivo novo. O hash é semeado pelo CONJUNTO de
 * sementes para a ordem ser estável no mesmo perfil e diferente entre perfis.
 */
export function comporFeed(
  precomputo: PrecomputoDeSementes,
  marcadas: readonly ChaveSemente[],
  limite: number,
): CartaoComposto[] {
  const acumulado = new Map<
    number,
    { motivo: number; noDoMeio: number; chaves: ChaveSemente[]; soma: number }
  >();

  for (const chave of marcadas) {
    const lista = precomputo.travessias[chave];
    if (!lista) continue;
    for (let posicao = 0; posicao < lista.length; posicao++) {
      const [cartao, motivo, noDoMeio] = lista[posicao];
      const atual = acumulado.get(cartao);
      if (atual) {
        atual.chaves.push(chave);
        atual.soma += posicao;
      } else {
        acumulado.set(cartao, { motivo, noDoMeio, chaves: [chave], soma: posicao });
      }
    }
  }

  const compostos: CartaoComposto[] = [];
  /** Posição média nas listas das sementes que alcançaram o cartão. Menor é melhor. */
  const media = new Map<CartaoComposto, number>();

  for (const [indice, dados] of acumulado) {
    const cartao = precomputo.cartoes[indice];
    const motivo = precomputo.motivos[dados.motivo];
    if (!cartao || !motivo) continue;
    const composto: CartaoComposto = {
      cartao,
      motivo,
      sementes: dados.chaves.length,
      porSementes: dados.chaves,
    };
    const no = dados.noDoMeio >= 0 ? precomputo.nos[dados.noDoMeio] : undefined;
    if (no) composto.noDoMeio = no;
    compostos.push(composto);
    media.set(composto, dados.soma / dados.chaves.length);
  }

  // A semente do desempate é o PERFIL inteiro, ordenado — o mesmo conjunto de escolhas
  // devolve sempre a mesma ordem, e dois perfis diferentes não compartilham o topo.
  const semente = [...marcadas].sort().join("|");

  compostos.sort((a, b) => {
    if (a.sementes !== b.sementes) return b.sementes - a.sementes;
    const ma = media.get(a) ?? 0;
    const mb = media.get(b) ?? 0;
    if (ma !== mb) return ma - mb;
    const ia = a.cartao.imagem ? 0 : 1;
    const ib = b.cartao.imagem ? 0 : 1;
    if (ia !== ib) return ia - ib;
    return hash32(`${semente}|${a.cartao.id}`) - hash32(`${semente}|${b.cartao.id}`);
  });

  return rodiziar(compostos, Math.max(0, limite));
}

/**
 * Intercala as classes sobre a lista já ranqueada, na forma de `rodiziar` de
 * `caminhada.ts`: nunca dois vizinhos da mesma classe QUANDO HOUVER ALTERNATIVA (D-27),
 * com o mesmo relaxamento em duas etapas — tenta respeitar os dois lados, depois só o
 * anterior, e só então repete.
 *
 * O ranqueamento por interseção decide quem entra e em que ordem DENTRO da classe; o
 * rodízio decide a vizinhança. Trocar a ordem dos dois faria a heterogeneidade mandar no
 * mérito, e aí a semente marcada deixaria de significar alguma coisa.
 */
function rodiziar(compostos: CartaoComposto[], limite: number): CartaoComposto[] {
  const baldes = new Map<ClasseEntidade, CartaoComposto[]>();
  for (const classe of ROTACAO_DE_CLASSE) baldes.set(classe, []);
  const foraDaRotacao: CartaoComposto[] = [];
  for (const c of compostos) {
    const balde = baldes.get(c.cartao.classe);
    if (balde) balde.push(c);
    else foraDaRotacao.push(c);
  }

  const saida: CartaoComposto[] = [];
  let cursor = 0;

  // A PRIMEIRA POSIÇÃO É DO MAIOR CASAMENTO, e não do rodízio. É a promessa do
  // onboarding — «marque quem te interessa e o que aparece se parece com você» — e ela
  // se paga na abertura da tela ou não se paga. Só vale quando há interseção de verdade:
  // com uma semente só, todo mundo empata em 1 e a posição volta a ser do rodízio.
  const melhor = compostos.find((c) => c.sementes > 1);
  if (melhor && limite > 0) {
    const balde = baldes.get(melhor.cartao.classe);
    const i = balde?.indexOf(melhor) ?? -1;
    if (balde && i >= 0) balde.splice(i, 1);
    saida.push(melhor);
  }

  const escolher = (proibidas: Set<ClasseEntidade>): CartaoComposto | undefined => {
    for (let k = 0; k < ROTACAO_DE_CLASSE.length; k++) {
      const idx = (cursor + k) % ROTACAO_DE_CLASSE.length;
      const classe = ROTACAO_DE_CLASSE[idx];
      if (proibidas.has(classe)) continue;
      const balde = baldes.get(classe);
      if (!balde?.length) continue;
      cursor = idx + 1;
      return balde.shift();
    }
    return undefined;
  };

  while (saida.length < limite) {
    const anterior = saida[saida.length - 1]?.cartao.classe;
    const proibidas = anterior ? new Set<ClasseEntidade>([anterior]) : new Set<ClasseEntidade>();
    const escolhido = escolher(proibidas) ?? escolher(new Set<ClasseEntidade>());
    if (!escolhido) break;
    saida.push(escolhido);
  }

  // Classe fora da rotação não some: ela é apresentada no fim, e só se sobrar espaço.
  for (const c of foraDaRotacao) {
    if (saida.length >= limite) break;
    saida.push(c);
  }
  return saida;
}

// ---------------------------------------------------------------------------
// Ampliação de repertório
// ---------------------------------------------------------------------------

export interface AmpliacaoDeRepertorio {
  /** As linguagens que as sementes marcadas já declaram. */
  atravessadas: string[];
  /** As que estão a um passo delas e ainda não foram atravessadas. */
  novas: string[];
  /** Quantas linguagens o perfil alcança ao todo. */
  alcancadas: number;
}

/**
 * O quanto o perfil se amplia a UM passo — a mesma pergunta de `repertorio.ts`, feita
 * sobre as sementes escolhidas em vez das três personas.
 *
 * Um salto, e não os dois da caminhada do feed: são perguntas diferentes. O feed responde
 * «o que te interessaria ver agora» e vai a dois; aqui é «o que está encostado no que você
 * já atravessou», e a promessa é literal — adjacente a um passo, nunca a dez.
 */
export function ampliacaoDeRepertorio(
  precomputo: PrecomputoDeSementes,
  marcadas: readonly ChaveSemente[],
): AmpliacaoDeRepertorio {
  const atravessadas = new Set<string>();
  const alcancadas = new Set<string>();

  for (const chave of marcadas) {
    for (const l of precomputo.linguagensDe[chave] ?? []) atravessadas.add(l);
    for (const l of precomputo.linguagensAUmSalto[chave] ?? []) alcancadas.add(l);
  }

  const novas = [...alcancadas].filter((l) => !atravessadas.has(l));
  return {
    atravessadas: [...atravessadas].sort(),
    novas: novas.sort(),
    alcancadas: alcancadas.size,
  };
}
