/**
 * moderacao.ts — o dado da superfície de Moderação (funcionalidades 108 a 125).
 *
 * SEPARADO DE `redacao.ts` NA TAREFA 1 DA S3, e a separação é de território, não de
 * arrumação. A fila de moderação e o editor de trilha curada dividiam um módulo só porque
 * nasceram na mesma tela da fase 5; são de níveis de acesso diferentes — o moderador
 * decide o que entra, o editor escreve sentido —, e duas sessões editando o mesmo arquivo
 * é a colisão que o merge não resolve. `redacao.ts` fica com a trilha e o catálogo de
 * arrasto, que são da S5, e REEXPORTA daqui o que ela ainda consome.
 *
 * A PERGUNTA QUE ESTE MÓDULO EXISTE PARA RESPONDER é a mais difícil do RFP: onde a IA
 * **não** deve ser utilizada. A resposta não é uma frase de rodapé — é a forma do dado.
 * Um item de fila tem `origem`, e só os de `origem: "ia"` têm `score`. Um score tem uma
 * regra escrita ao lado, e a regra é conferível item a item. Nada aqui é número solto.
 *
 * DP-F: roda NO BUILD. Alcança `grafo.ts` (23 MB de JSON) diretamente e por `motivo.ts`.
 * NENHUM arquivo `"use client"` pode importar este módulo por valor — o que atravessa a
 * fronteira são os DTOs abaixo, que são só primitivo, e o teto está medido em
 * `TETO_DO_DTO`. D-47: toda leitura do acervo passa por `grafo.ts`, nunca por
 * `entidades.json`.
 *
 * O QUE ESTE MÓDULO NÃO FAZ, E É O PONTO.
 *
 * 1. Ele NÃO inventa item de fila. Cada item aponta para uma ENTIDADE REAL do acervo e
 *    mostra os campos dela. O que é autorado — e a tela diz que é, por
 *    `PROCEDENCIA_DA_ATRIBUICAO` — é a ATRIBUIÇÃO de origem e o score. A fila é encenada no
 *    mesmo sentido em que as 40 duplicatas da fase 4 são: o cenário é nosso, o dado não.
 *
 * 2. Ele NÃO sorteia score. `pontuar()` é uma função de cinco perguntas sobre a própria
 *    ficha da entidade, todas conferíveis a olho na tela. Um score sem regra auditável é o
 *    recomendador opaco contra o qual a proposta inteira se posiciona; publicar um número
 *    de confiança sem dizer de onde ele veio seria fazer, no protótipo, a coisa que o
 *    protótipo critica.
 *
 * 3. Ele NÃO reescreve a frase da aresta. A justificativa de uma sugestão de IA é lida por
 *    `motivoDaAresta`, o MESMO gerador que o cartão público usa. Uma frase escrita aqui
 *    para a ocasião seria a IA «escrevendo verbete», que é o terceiro limite de D-86.
 */

import { contagens, porId, porSlug, porTerritorio, slugsPorTipo, vizinhos } from "./grafo";
import { densidadePorUf } from "./geo";
import { motivoDaAresta } from "./motivo";
import { DATA_DE_REFERENCIA } from "./alerta";
import type { OrigemMotivo } from "./cartao";
import { ROTA_POR_CLASSE } from "./rotas";
import { normalizar } from "./indice";
import { filaDeDuplicatas } from "./duplicatas";
import type { ClasseEntidade, Entidade, Procedencia, Relacao } from "./tipos";
import type { AcaoDeModeracao, DecisaoDeModeracao, Situacao } from "./tipos-acesso";
import metaJson from "./gerado/meta.json";

/**
 * As contagens de aresta por relação, de `meta.json`.
 *
 * `contagens()` conta ENTIDADES e não arestas. `meta.json` é escrito por
 * `scripts/gerar-grafo.mjs` na mesma passada que produziu o grafo, e é a mesma fonte que o
 * Observatório usa como testemunha independente das próprias contas.
 */
const META_DAS_ARESTAS = (metaJson as unknown as { porRelacao: Record<string, number> })
  .porRelacao;

// ---------------------------------------------------------------------------
// Autoria e carimbo — D-84, e o mesmo padrão de `ocorrencias-studio.ts`
// ---------------------------------------------------------------------------

/** A data de referência do build, reexportada. NUNCA o relógio do runtime (T-03-10). */
export const DATA_DE_REFERENCIA_DA_MODERACAO = DATA_DE_REFERENCIA;

/**
 * A hora autorada do carimbo. Fixa pelo mesmo motivo que a data: ler `new Date()` no
 * cliente faria o HTML exportado divergir da página hidratada na primeira renderização, e
 * o carimbo ainda exporia o fuso horário de quem avalia a proposta.
 */
const HORA_DO_CARIMBO = "11:20";

/** "2026-08-22" → "22.08.2026". A mesma regra de `alerta.ts`, pelo mesmo motivo. */
function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}.${mes}.${ano}` : iso;
}

/**
 * Quem decide. D-25: **não há autenticação neste protótipo**. O nome é autorado e a tela
 * diz que é — ele está aqui para mostrar que a decisão FICA REGISTRADA com autor e
 * carimbo (D-84), não para simular um login que o protótipo não tem.
 */
export const MODERADOR_AUTORADO = "Moderação · mesa de decisão (perfil autorado)";

export const MODERADOR_E_AUTORADO =
  "Não há autenticação neste protótipo. O nome de quem decide é autorado e aparece " +
  "rotulado, em vez de simular um login: o que esta tela precisa provar é que toda decisão " +
  "fica registrada com autor e carimbo, e não que sabemos quem está do outro lado. O " +
  `carimbo é derivado da data de referência do build (${dataCurta(DATA_DE_REFERENCIA)}), ` +
  "nunca do " +
  "relógio de quem abre a página.";

/** O carimbo que uma decisão tomada AGORA na Moderação recebe (D-84). */
export const CARIMBO_DA_DECISAO = `${dataCurta(DATA_DE_REFERENCIA)}, ${HORA_DO_CARIMBO.replace(
  ":",
  "h",
)}`;

// ---------------------------------------------------------------------------
// D-86 — os três limites da IA, por extenso
// ---------------------------------------------------------------------------

/**
 * Os três limites, escritos como produto e não como nota de rodapé: são a resposta do
 * produto à pergunta do RFP, e não um comentário sobre o protótipo.
 */
export const LIMITES_DA_IA: readonly string[] = [
  "A IA não publica. Nenhuma sugestão vira dado público sem um humano aprovar, e a " +
    "aprovação fica registrada com nome e carimbo.",
  "A IA não define destaque editorial. O que ocupa a primeira posição de Descobrir é " +
    "escolha de curadoria assinada, nunca resultado de score.",
  "A IA não escreve verbete. Ela sugere um verbete que JÁ EXISTE no acervo, com a " +
    "procedência dele à vista; o texto continua sendo de quem o escreveu.",
];

// ---------------------------------------------------------------------------
// A regra do score — declarada, conferível, e a mesma para todos os itens de IA
// ---------------------------------------------------------------------------

export interface ComponenteDoScore {
  id: string;
  rotulo: string;
  /** O que a pergunta observa na ficha, em texto, para a tela imprimir ao lado. */
  observa: string;
  /** Cada componente vale o mesmo: 1/5. Peso desigual sem justificativa é score opaco. */
  peso: number;
}

/**
 * As cinco perguntas. Todas são sobre a FICHA DA PRÓPRIA ENTIDADE — nada de sinal de
 * comportamento, nada de popularidade, nada de modelo. É por isso que o número é
 * conferível a olho: quem abre o item vê os cinco componentes marcados ou não, e o score
 * é a fração deles.
 */
export const COMPONENTES_DO_SCORE: readonly ComponenteDoScore[] = [
  {
    id: "resumo",
    rotulo: "resumo com pelo menos 120 caracteres",
    observa: "campo `resumo` da entidade",
    peso: 0.2,
  },
  {
    id: "imagem",
    rotulo: "imagem declarada",
    observa: "campo `imagem` da entidade",
    peso: 0.2,
  },
  {
    id: "credito",
    rotulo: "crédito da imagem declarado",
    observa: "campo `creditoImagem` — imagem sem crédito não publica",
    peso: 0.2,
  },
  {
    id: "linguagens",
    rotulo: "pelo menos duas linguagens classificadas",
    observa: "campo `linguagens`, do vocabulário controlado",
    peso: 0.2,
  },
  {
    id: "fonte",
    rotulo: "URL de origem declarada",
    observa: "campo `fonte` — a procedência conferível do item",
    peso: 0.2,
  },
];

export const REGRA_DO_SCORE =
  "O score de confiança NÃO vem de modelo, de popularidade nem de sorteio: é a fração de " +
  "cinco perguntas objetivas respondidas pela própria ficha da entidade — resumo com pelo " +
  "menos 120 caracteres, imagem declarada, crédito da imagem declarado, pelo menos duas " +
  "linguagens classificadas e URL de origem declarada. Cada uma vale 0,2. O item abre com " +
  "as cinco marcadas ou não, e quem confere a conta chega ao mesmo número. Um score sem " +
  "regra à vista é o recomendador opaco que esta proposta recusa; por isso a regra vem " +
  "junto do número, e não numa documentação à parte.";

/** As cinco perguntas, aplicadas. Determinística e sem estado. */
function componentesAtendidos(e: Entidade): string[] {
  const atende: Record<string, boolean> = {
    resumo: (e.resumo ?? "").length >= 120,
    imagem: Boolean(e.imagem),
    credito: Boolean(e.creditoImagem),
    linguagens: e.linguagens.length >= 2,
    fonte: Boolean(e.fonte),
  };
  return COMPONENTES_DO_SCORE.filter((c) => atende[c.id]).map((c) => c.id);
}

function pontuar(e: Entidade): number {
  const atendidos = componentesAtendidos(e);
  // Arredondado a duas casas porque 3/5 em ponto flutuante é 0.6000000000000001, e um
  // score que imprime dezesseis dígitos na tela é ruído, não precisão.
  return Math.round((atendidos.length / COMPONENTES_DO_SCORE.length) * 100) / 100;
}

// ---------------------------------------------------------------------------
// DTO da fila
// ---------------------------------------------------------------------------

/**
 * As quatro origens: as três de D-82 e a denúncia do público, da funcionalidade 120.
 *
 * `score` existe **só** em `"ia"`, e nas outras três é `null`. Não é economia de campo: é
 * a distinção que a tela existe para fazer. Produtor e ingestão **afirmam** — um produtor
 * declara que o evento é dele, o lote de ingestão declara de que sistema veio. A IA
 * **estima**, e estimativa sem intervalo de confiança à vista é a coisa que esta tela
 * recusa. Pôr um score nas quatro achataria as afirmações na estimativa e apagaria
 * justamente o argumento.
 *
 * `denuncia` entra pelo outro lado e é a que mais muda a fila: as três primeiras chegam de
 * quem QUER PUBLICAR, e ela chega de quem já leu o que foi publicado. Não é uma quarta
 * fonte de submissão — é a única em que o item já está no ar e alguém de fora afirma que
 * não deveria estar. Por isso ela não tem score também, e por um motivo diferente do das
 * outras duas: não há nada a estimar sobre uma reclamação, há uma afirmação a conferir.
 */
export type OrigemDoItem = "produtor" | "ingestao" | "ia" | "denuncia";

/**
 * A procedência da ATRIBUIÇÃO de origem e do score — de TODOS os itens, sem exceção.
 *
 * Constante de módulo e não campo por item de propósito. Como valor repetido, ela custava
 * 2,2 KB do orçamento de 60 KB para afirmar sessenta vezes a mesma coisa; como constante,
 * a tela a imprime UMA vez, no alto, onde a afirmação vale para a fila inteira. O que ela
 * afirma continua indispensável: a regra que atribuiu a origem e calculou o score foi
 * escrita por nós, e confundi-la com a procedência da entidade seria passar texto nosso
 * pelo crachá do Itaú Cultural — a mentira de procedência que T-02-10 existe para impedir.
 */
export const PROCEDENCIA_DA_ATRIBUICAO: Procedencia = "autorado";

export const FRASE_DA_ATRIBUICAO =
  "A fila é encenada: as entidades são reais e vêm do acervo, mas a ATRIBUIÇÃO de origem " +
  "— produtor, ingestão ou IA — e o score de confiança são autorados para o protótipo, por " +
  "regra determinística escrita ao lado de cada um. O acervo do Itaú Cultural não publica " +
  "quem submeteu um registro nem pontuação de confiança; inventar esses campos e exibi-los " +
  "sem rótulo seria vestir texto nosso com o crachá do IC.";

export interface OrigemDeclarada {
  id: OrigemDoItem;
  rotulo: string;
  /** A regra determinística que atribuiu esta origem. Vai para a tela, por extenso. */
  regra: string;
  /** `true` só na IA — é o único caso em que existe score. */
  temScore: boolean;
}

export const ORIGENS_DECLARADAS: readonly OrigemDeclarada[] = [
  {
    id: "produtor",
    rotulo: "produtor",
    regra:
      "Evento com id `evento:cms:*` — registrado pelo próprio produtor no CMS da agenda. " +
      "Ele afirma o que é dele; não há estimativa a pontuar.",
    temScore: false,
  },
  {
    id: "ingestao",
    rotulo: "ingestão automática",
    regra:
      "Evento com id `evento:enc:*` — entrou por lote automático da Enciclopédia Itaú " +
      "Cultural. A fonte declara de onde veio; também não há estimativa a pontuar.",
    temScore: false,
  },
  {
    id: "ia",
    rotulo: "sugestão de IA",
    regra:
      "Entidade de outra classe alcançada, a partir de um evento já na fila, por aresta " +
      "editorial (`aprofunda`, `fala_sobre`, `dialoga_com` ou `semelhante_a`). A IA " +
      "propõe publicá-la como aprofundamento daquele evento — e por ser proposta, e não " +
      "afirmação, ela vem com score de confiança visível.",
    temScore: true,
  },
  {
    id: "denuncia",
    rotulo: "denúncia do público",
    regra:
      "Entidade JÁ PUBLICADA sobre a qual chegou reclamação pelo app (funcionalidade 120). " +
      "Diferente das outras três, ela não pede para entrar: já está no ar, e alguém de fora " +
      "afirma que não deveria estar. O que a moderação decide aqui não é publicar — é se a " +
      "afirmação de quem denunciou procede.",
    temScore: false,
  },
];

export interface SugestaoDaIa {
  /** De qual item da fila a travessia partiu. */
  deId: string;
  deTitulo: string;
  relacao: Relacao;
  /**
   * O texto da aresta, lido por `motivoDaAresta` — o MESMO gerador de frase que o cartão
   * público usa. Não é frase escrita aqui para a ocasião.
   */
  motivo: string;
  origemMotivo: OrigemMotivo;
  procedenciaAresta: Procedencia;
}

// ---------------------------------------------------------------------------
// 120 — a denúncia do público, e o vocabulário fechado dos motivos
// ---------------------------------------------------------------------------

/**
 * Por que alguém denuncia. **Vocabulário fechado, e é dado — não texto livre.**
 *
 * Campo aberto aqui pareceria mais generoso e seria pior: a moderação precisa AGRUPAR
 * denúncias sobre o mesmo item para saber se três pessoas reclamaram da mesma coisa ou de
 * três coisas diferentes, e cinquenta redações do mesmo problema não agrupam. O relato em
 * texto continua existindo do lado de quem denuncia; o que viaja para a fila é a categoria,
 * que é o que a decisão observa.
 *
 * Cada motivo diz também A QUEM a denúncia pertence quando procede — porque «procede» não
 * é o fim do caminho, é o começo do encaminhamento, e uma fila que confirma sem encaminhar
 * devolve razão a quem reclamou e não conserta nada.
 */
export interface MotivoDeDenuncia {
  id: string;
  rotulo: string;
  /** O que a moderação confere para decidir se procede. */
  confere: string;
  /** Para onde vai quando procede. Nunca «para lugar nenhum». */
  encaminha: string;
}

export const MOTIVOS_DE_DENUNCIA: readonly MotivoDeDenuncia[] = [
  {
    id: "data-ou-local",
    rotulo: "data ou local errado",
    confere: "a ficha da ocorrência contra a fonte declarada",
    encaminha: "devolução ao produtor, que é quem declara data e local",
  },
  {
    id: "credito",
    rotulo: "imagem sem crédito ou uso indevido",
    confere: "o campo `creditoImagem` e a procedência da mídia",
    encaminha: "Organização, que responde por mídia e crédito",
  },
  {
    id: "nao-aconteceu",
    rotulo: "o evento não aconteceu",
    confere: "se há ocorrência datada e se a fonte ainda a publica",
    encaminha: "devolução ao produtor, com o registro suspenso enquanto isso",
  },
  {
    id: "pessoa-citada",
    rotulo: "pessoa citada sem consentimento",
    confere: "a aresta `atua_em` e o verbete da Enciclopédia",
    encaminha: "Moderação decide sozinha — é afirmação sobre pessoa real (M5)",
  },
  {
    id: "conteudo-ofensivo",
    rotulo: "conteúdo ofensivo",
    confere: "o texto publicado, na íntegra",
    encaminha: "Editor, que responde pelo texto — a moderação não reescreve verbete",
  },
];

/** Quantas denúncias a fila encena. Ver `REGRA_DA_DENUNCIA`. */
export const DENUNCIAS_NA_FILA = 8;

export const REGRA_DA_DENUNCIA =
  "As denúncias são ENCENADAS, e por regra determinística: as entidades já publicadas do " +
  "acervo são ordenadas pelo `id` — chave estável, nunca `localeCompare` — e as primeiras " +
  `${DENUNCIAS_NA_FILA} recebem um motivo do vocabulário fechado, em rodízio, com a ` +
  "quantidade derivada da posição. O acervo do Itaú Cultural NÃO publica denúncia do " +
  "público: não existe esse campo em entidade nenhuma. Exibir reclamações reais seria " +
  "inventá-las; exibi-las sem rótulo seria pôr texto nosso sob o crachá do IC. São oito e " +
  "não vinte porque denúncia não chega no volume de uma fila de submissão — uma fila com " +
  "tantas denúncias quanto submissões descreveria uma plataforma em crise, não esta.";

export interface DenunciaDeclarada {
  motivo: string;
  rotulo: string;
  /** Quantas pessoas denunciaram o MESMO item pelo mesmo motivo. */
  quantas: number;
}

// ---------------------------------------------------------------------------
// A cadeia de identidade — §6 da ontologia, conferida item a item
// ---------------------------------------------------------------------------

/**
 * Os três componentes da chave de um evento, na ordem da ontologia.
 *
 * CONSTANTE DE MÓDULO, e o item manda só os bits — o precedente é
 * `PROCEDENCIA_DA_ATRIBUICAO`, que virou constante porque, como campo por item, custava
 * 2,2 KB para afirmar sessenta vezes a mesma coisa. Aqui o rótulo e a explicação de cada
 * componente são idênticos nos 68 itens; o que varia é se cada um está sustentado, e isso
 * cabe em três caracteres.
 */
export interface ComponenteDaChave {
  id: string;
  rotulo: string;
  /** O que o acervo precisa ter para este componente se sustentar. */
  observa: string;
  /** De quem é a responsabilidade de preencher, quando falta. */
  dequem: string;
}

export const COMPONENTES_DA_CHAVE: readonly ComponenteDaChave[] = [
  {
    id: "titulo",
    rotulo: "título normalizado",
    observa: "o campo `titulo` da entidade, normalizado",
    dequem: "existe em todos — é o único dos três que o acervo sustenta hoje",
  },
  {
    id: "agente",
    rotulo: "agente realizador",
    observa: "uma aresta para `pessoa`, `coletivo` ou `instituicao`",
    dequem: "o produtor declara quem realiza (matriz da §5)",
  },
  {
    id: "obra",
    rotulo: "obra",
    observa: "uma aresta para `obra`",
    dequem: "o produtor vincula, e o verbete da obra é da Enciclopédia",
  },
];

export const REGRA_DA_CHAVE =
  "A identidade de um evento é título normalizado + agente realizador + obra — é o " +
  "critério da ONTOLOGIA, não uma medida de parecença entre textos: ele afirma o que faz " +
  "duas linhas serem a mesma coisa no mundo. Um registro sem os três não tem chave, e a " +
  "fila de duplicatas passa a acusar o próprio sistema. A ficha marca cada componente como " +
  "sustentado ou não, item a item, porque «1 de 3» dito sobre o acervo inteiro não diz a " +
  "quem modera qual dos três falta NESTE registro.";

export interface ItemDaFila {
  /** Chave estável do item na fila: `fila:{origem}:{entidadeId}`. */
  id: string;
  entidadeId: string;
  titulo: string;
  classe: ClasseEntidade;
  resumo: string | null;
  origem: OrigemDoItem;
  /** A procedência DA ENTIDADE — `ic`, `derivado` ou `autorado`. Nunca a da atribuição. */
  procedencia: Procedencia;
  fonte: string | null;
  linguagens: string[];
  /** `null` fora da IA, por decisão declarada em `OrigemDoItem`. */
  score: number | null;
  /** Ids de `COMPONENTES_DO_SCORE` atendidos. `null` fora da IA. */
  componentes: string[] | null;
  /** `null` fora da IA. */
  sugestao: SugestaoDaIa | null;
  /** Título do território que alcança este item, ou `null`. Alimenta o escopo territorial. */
  territorio: string | null;
  /**
   * A sigla da unidade federativa que contém o território deste item, ou `null`.
   *
   * É o que a PRIORIDADE POR VAZIO (124) observa. Vem da descida da hierarquia territorial
   * por `porTerritorio()`, de `grafo.ts` — a mesma travessia que o Observatório usa, e não
   * uma segunda escrita aqui. `null` não é falha: 45 dos 60 itens não têm território
   * algum, e o número está declarado ao lado da ordenação.
   */
  uf: string | null;
  /**
   * Quantos registros de lugar o acervo inteiro tem na UF deste item. **Medido, nunca
   * digitado.** É o denominador que torna a ordenação por vazio conferível a olho: um item
   * do Ceará traz 17 e um de São Paulo traz 274, e quem lê a fila vê por que o primeiro
   * subiu. `null` quando não há UF.
   */
  registrosNaUf: number | null;
  /** `null` fora da origem `denuncia`. */
  denuncia: DenunciaDeclarada | null;
  /** A imagem declarada da entidade, ou `null`. Alimenta os direitos de imagem (114). */
  imagem: string | null;
  /**
   * O crédito da imagem. `null` quando o acervo não o declara — e é o caso que a ficha
   * existe para barrar: **imagem sem crédito não publica**. 26 dos 68 itens estão assim.
   */
  creditoImagem: string | null;
  /**
   * Os três componentes da chave, como bits na ordem de `COMPONENTES_DA_CHAVE`:
   * `"100"` é título sustentado, agente e obra não.
   *
   * ACHATADO de propósito. Como três campos nomeados por item custaria 2,2 KB para dizer
   * o que cabe em três caracteres, e o vocabulário que os lê é constante de módulo. O
   * precedente é `PROCEDENCIA_DA_ATRIBUICAO`.
   */
  chave: string;
  /**
   * Termos do vocabulário controlado vinculados ao item, até três.
   *
   * É o que a porta 118 observa: termo fora do vocabulário vai para o Editor, e a
   * moderação **encaminha, não decide**. Um item da fila tem termo — o acervo quase não os
   * vincula, e a ficha declara isso com denominador em vez de deixar o campo em branco.
   */
  termos: string[];
  /** A rota pública da entidade, quando a classe tem uma nesta fase. */
  rota: string | null;
}

// ---------------------------------------------------------------------------
// Escopo do curador — D-84 e D-89
// ---------------------------------------------------------------------------

export type IdDoEscopo = "nacional" | "territorial" | "linguagem";

export interface Escopo {
  id: IdDoEscopo;
  rotulo: string;
  /** O que este recorte é, em texto de produto. */
  descricao: string;
  /**
   * O CAMPO do item que este escopo observa. É DADO, e não código, de propósito: o
   * componente de cliente não pode importar `itemNoEscopo` por valor (DP-F — este módulo
   * alcança o grafo), e reescrever a regra lá seria criar a segunda cópia que diverge em
   * silêncio. Mandando o NOME DO CAMPO, os dois lados despacham sobre a mesma decisão e
   * não há regra duplicada: há um despachante de três linhas de cada lado.
   */
  campo: "todos" | "territorio" | "linguagens";
  /** Quantos itens da fila este escopo alcança. MEDIDO, nunca estimado. */
  alcance: number;
}



/** As classes que contam como agente realizador na chave de identidade (§6). */
const AGENTES_REALIZADORES: readonly ClasseEntidade[] = ["pessoa", "coletivo", "instituicao"];

function rotaDe(e: Entidade): string | null {
  const base = ROTA_POR_CLASSE[e.classe];
  return base ? `${base}/${e.slug}/` : null;
}

/**
 * O território que SITUA esta entidade.
 *
 * A travessia é DIRIGIDA e filtrada por relação, como `geo.ts` faz — e não um `find()` sobre
 * a adjacência inteira. `situado_em` aponta do contido para o continente: sem o filtro de
 * direção, um território que aponta para esta entidade seria lido como se ela estivesse
 * dentro dele, e a ordenação por vazio passaria a subir o item errado. Sem o filtro de
 * relação, qualquer aresta que alcance um território serviria — inclusive `semelhante_a`,
 * que é 71% do grafo e não afirma localização nenhuma.
 *
 * Medido hoje, nenhum dos 68 itens é afetado pela diferença: nenhum tem dois territórios,
 * nenhum chega a um por outra relação. Está escrito assim mesmo assim, porque «certo por
 * acidente do dado» deixa de ser certo na primeira vez que o acervo crescer — e o sintoma
 * seria uma fila ordenada por um território que ninguém declarou.
 */
function territorioDe(e: Entidade): string | null {
  const t = vizinhos(e.id, "situado_em")
    .filter((v) => v.aresta.de === e.id)
    .find((v) => v.entidade.classe === "territorio");
  return t ? t.entidade.titulo : null;
}

// ---------------------------------------------------------------------------
// 124 — a prioridade por vazio, e o dado que a torna conferível
// ---------------------------------------------------------------------------

/**
 * `entidadeId` → sigla da UF que a contém.
 *
 * CONSTRUÍDO SOBRE `porTerritorio()`, de `grafo.ts`, que é a MESMA descida de hierarquia
 * que o Observatório usa em `densidadePorUf()`. Uma segunda travessia escrita aqui daria a
 * mesma resposta hoje e uma resposta diferente no dia em que alguém corrigisse só uma das
 * duas — e o sintoma seria a fila ordenando por um mapa e o Observatório denunciando por
 * outro, sem nenhum dos dois quebrar.
 *
 * A lista das 27 vem de `densidadePorUf()`, que a lê da tabela de centroides e não do
 * grafo: é assim que Sergipe e Tocantins continuam existindo como AUSÊNCIA em vez de
 * simplesmente não aparecerem.
 */
let ufPorEntidadeMemo: Map<string, string> | null = null;

function ufPorEntidade(): Map<string, string> {
  if (ufPorEntidadeMemo) return ufPorEntidadeMemo;
  const porTitulo = new Map(densidadePorUf().ufs.map((u) => [u.titulo, u.sigla]));
  const mapa = new Map<string, string>();
  for (const slug of slugsPorTipo("territorio")) {
    const t = porSlug("territorio", slug);
    // `centroide-estado` é o que marca um território como unidade federativa. O mesmo
    // critério de `densidadePorUf()`, e de propósito: dois critérios para «isto é um
    // estado» divergiriam na primeira cidade que ganhasse centroide próprio.
    if (t?.coordenada?.metodo !== "centroide-estado") continue;
    const sigla = porTitulo.get(t.titulo);
    if (!sigla) continue;
    for (const e of porTerritorio(t.id)) {
      if (!mapa.has(e.id)) mapa.set(e.id, sigla);
    }
  }
  ufPorEntidadeMemo = mapa;
  return mapa;
}

/** Registros de lugar por sigla, do Observatório. Medido sobre o grafo, nunca digitado. */
let registrosPorUfMemo: Map<string, number> | null = null;

function registrosPorUf(): Map<string, number> {
  if (registrosPorUfMemo) return registrosPorUfMemo;
  registrosPorUfMemo = new Map(densidadePorUf().ufs.map((u) => [u.sigla, u.registros]));
  return registrosPorUfMemo;
}

export type IdDaOrdenacao = "vazio" | "origem";

export interface Ordenacao {
  id: IdDaOrdenacao;
  rotulo: string;
  /**
   * O CAMPO do item que esta ordenação observa — dado, e não função, pela mesma razão que
   * `Escopo.campo`: o componente de cliente não pode importar este módulo por valor, e
   * reescrever o critério lá criaria a segunda cópia que diverge em silêncio.
   */
  campo: "registrosNaUf" | "origem";
  /** Por que esta ordem existe. Vai para a tela, por extenso. */
  porque: string;
}

/**
 * A concentração, medida. É o denominador da frase que justifica a ordenação por vazio, e
 * sai da mesma função que alimenta o Observatório — um número digitado aqui passaria a
 * mentir na primeira regeração do grafo.
 */
export interface ConcentracaoMedida {
  /** Registros de lugar somados nas 27. */
  total: number;
  /** Quantos deles estão nos dois estados maiores. */
  doisMaiores: number;
  /** Quantas unidades federativas existem na tabela. Sempre 27. */
  unidades: number;
  /** Quantas o acervo alcança. */
  comRegistro: number;
  /** Siglas que o acervo não alcança de forma alguma. */
  semRegistro: string[];
  /** Siglas com um único registro. */
  comUmRegistro: string[];
}

let concentracaoMemo: ConcentracaoMedida | null = null;

export function concentracaoDoAcervo(): ConcentracaoMedida {
  if (concentracaoMemo) return concentracaoMemo;
  const d = densidadePorUf();
  concentracaoMemo = {
    total: d.total,
    doisMaiores: d.doisMaiores,
    unidades: d.ufs.length,
    comRegistro: d.ufs.filter((u) => u.registros > 0).length,
    semRegistro: d.semRegistro.map((u) => u.sigla),
    comUmRegistro: d.comUmRegistro.map((u) => u.sigla),
  };
  return concentracaoMemo;
}

export function ordenacoesDaFila(): Ordenacao[] {
  const c = concentracaoDoAcervo();
  const pct = Math.round((c.doisMaiores / c.total) * 100);
  return [
    {
      id: "vazio",
      rotulo: "por vazio",
      campo: "registrosNaUf",
      porque:
        `Sobe primeiro o item da unidade federativa que o acervo menos documenta. ` +
        `${c.doisMaiores} dos ${c.total} registros de lugar estão em dois dos ` +
        `${c.unidades} estados — ${pct}% —, ${c.semRegistro.length} não aparecem em lugar ` +
        `nenhum (${c.semRegistro.join(" e ")}) e ${c.comUmRegistro.length} têm um registro ` +
        `só. Ordenar por volume poria São Paulo no alto de toda fila e reproduziria na ` +
        "governança o deserto que o mapa denuncia: quem tem mais acervo receberia mais " +
        "atenção de moderação, e quem não tem nenhum continuaria sem. O número ao lado de " +
        "cada item é o registro do estado dele, para a ordem ser conferível a olho.",
    },
    {
      id: "origem",
      rotulo: "por origem",
      campo: "origem",
      porque:
        "Agrupa por de onde o item veio — produtor, ingestão, IA, denúncia — na ordem em " +
        "que as origens estão declaradas. É a ordem de quem quer varrer uma origem de cada " +
        "vez; ela NÃO prioriza nada, e por isso não é a padrão.",
    },
  ];
}

/** Congelada como `readonly` para o componente não poder reordenar o que a tela declara. */
export const ORDENACOES_DA_FILA: readonly Ordenacao[] = ordenacoesDaFila();

// ---------------------------------------------------------------------------
// A escolha dos itens — determinística, por chave estável, e declarada
// ---------------------------------------------------------------------------

/** Quantos itens por origem. Declarado, e citado na tela. */
export const ITENS_POR_ORIGEM = 20;

/**
 * O tamanho total da fila: as três origens de submissão mais as denúncias.
 *
 * Não é `ITENS_POR_ORIGEM * 4`, e a assimetria é o conteúdo: denúncia não chega no volume
 * de uma fila de submissão. Ver `REGRA_DA_DENUNCIA`.
 */
export const TAMANHO_DA_FILA = ITENS_POR_ORIGEM * 3 + DENUNCIAS_NA_FILA;

/**
 * O que a IA nunca propõe publicar, por mais que o grafo alcance.
 *
 * `repertorio` é a lista de salvos de uma pessoa e `pessoa-usuaria` é a própria pessoa —
 * as duas são alcançáveis por aresta editorial e nenhuma das duas é conteúdo editorial.
 * A distinção não é de gosto: é a fronteira entre o que o acervo publica e o que pertence
 * a alguém, e uma fila de moderação que a apaga já errou antes de qualquer decisão.
 */
const CLASSES_QUE_NAO_SE_PUBLICAM: readonly ClasseEntidade[] = [
  "repertorio",
  "pessoa-usuaria",
];

/** As relações que contam como SUGESTÃO EDITORIAL, e as que não contam. */
const RELACOES_EDITORIAIS: readonly Relacao[] = [
  "aprofunda",
  "fala_sobre",
  "dialoga_com",
  "semelhante_a",
];

export const REGRA_DA_AMOSTRAGEM =
  "Os candidatos de cada origem são ordenados pelo `id` da entidade — chave estável do " +
  "acervo, não `localeCompare` e não índice de array. Produtor e ingestão tomam um a cada N " +
  "com passo fixo sobre essa ordem. A IA usa RODÍZIO ENTRE AS FAIXAS DE SCORE: as faixas " +
  "são percorridas em ordem crescente e cada volta tira de cada faixa o próximo candidato " +
  "por id, até completar a cota. Duas gerações do acervo com o mesmo dado produzem a mesma " +
  "fila.";

export const POR_QUE_RODIZIO_NA_IA =
  "Amostragem proporcional traria a fila que a população tem — quase toda entre 0,6 e 1,0 — " +
  "e a tela nunca mostraria um item de confiança baixa, que é justamente o caso em que a " +
  "decisão humana pesa. O rodízio garante pelo menos um item de cada faixa, e a " +
  "distribuição da POPULAÇÃO INTEIRA fica declarada ao lado: quem lê a fila vê o recorte e " +
  "vê de onde ele foi tirado, em vez de tomar o recorte pela população.";

/** Comparação por ponto de código, estável entre plataformas — nunca `localeCompare`. */
function porIdEstavel(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Rodízio entre as faixas de score. Ver `POR_QUE_RODIZIO_NA_IA`.
 *
 * As faixas saem em ordem crescente de score e cada volta tira de cada uma o próximo
 * candidato por id. Determinístico e sem estado: a mesma lista devolve sempre a mesma
 * seleção, na mesma ordem.
 */
function rodizioPorFaixaDeScore<T extends { entidade: Entidade }>(
  ordenados: readonly T[],
  n: number,
): T[] {
  const faixas = new Map<number, T[]>();
  for (const c of ordenados) {
    const s = pontuar(c.entidade);
    const faixa = faixas.get(s);
    if (faixa) faixa.push(c);
    else faixas.set(s, [c]);
  }
  const chaves = [...faixas.keys()].sort((a, b) => a - b);
  const saida: T[] = [];
  let volta = 0;
  while (saida.length < n) {
    let tirouAlgo = false;
    for (const k of chaves) {
      if (saida.length >= n) break;
      const faixa = faixas.get(k) as T[];
      if (volta < faixa.length) {
        saida.push(faixa[volta]);
        tirouAlgo = true;
      }
    }
    // Sem isto, uma cota maior que a população inteira giraria para sempre.
    if (!tirouAlgo) break;
    volta += 1;
  }
  return saida;
}

/** Amostra com passo fixo. `n >= lista.length` devolve a lista inteira. */
function amostrar<T>(lista: readonly T[], n: number): T[] {
  if (lista.length <= n) return [...lista];
  const passo = Math.floor(lista.length / n);
  const saida: T[] = [];
  for (let i = 0; i < n; i++) saida.push(lista[i * passo]);
  return saida;
}

/**
 * Os eventos que o acervo publica, sem os 40 clones encenados da fase 4.
 *
 * Os clones são `procedencia: "autorado"` e existem para o Cenário 3 do Studio; deixá-los
 * entrar aqui poria o MESMO evento duas vezes na fila de Moderação com origens diferentes, e
 * a tela passaria a demonstrar o problema da fase 4 em vez do desta.
 */
function eventosDoAcervo(): Entidade[] {
  const saida: Entidade[] = [];
  for (const slug of slugsPorTipo("evento")) {
    const e = porSlug("evento", slug);
    if (e && e.procedencia !== "autorado") saida.push(e);
  }
  return saida.sort(porIdEstavel);
}

function paraItem(
  e: Entidade,
  origem: OrigemDoItem,
  sugestao: SugestaoDaIa | null,
  denuncia: DenunciaDeclarada | null = null,
): ItemDaFila {
  const ehIa = origem === "ia";
  const uf = ufPorEntidade().get(e.id) ?? null;
  const vs = vizinhos(e.id);
  // Os bits da chave, na ordem de `COMPONENTES_DA_CHAVE`. O título sempre se sustenta —
  // uma entidade sem título não existe no acervo; os outros dois são medidos na aresta.
  const chave = [
    "1",
    vs.some((v) => AGENTES_REALIZADORES.includes(v.entidade.classe)) ? "1" : "0",
    vs.some((v) => v.entidade.classe === "obra") ? "1" : "0",
  ].join("");
  return {
    id: `fila:${origem}:${e.id}`,
    entidadeId: e.id,
    titulo: e.titulo,
    classe: e.classe,
    resumo: e.resumo ?? null,
    origem,
    procedencia: e.procedencia,
    fonte: e.fonte ?? null,
    linguagens: e.linguagens,
    score: ehIa ? pontuar(e) : null,
    componentes: ehIa ? componentesAtendidos(e) : null,
    sugestao,
    territorio: territorioDe(e),
    uf,
    registrosNaUf: uf ? (registrosPorUf().get(uf) ?? 0) : null,
    denuncia,
    imagem: e.imagem ?? null,
    creditoImagem: e.creditoImagem ?? null,
    chave,
    // Até três: o que a ficha precisa é saber SE há termo e quais, não listar um
    // vocabulário inteiro por item — e cada termo a mais come do teto do DTO.
    termos: vs
      .filter((v) => v.entidade.classe === "termo")
      .slice(0, 3)
      .map((v) => v.entidade.titulo),
    rota: rotaDe(e),
  };
}

/**
 * As entidades que a fila encena como denunciadas.
 *
 * São `conteudo` e `midia` — as classes que o público de fato LÊ e sobre as quais faz
 * sentido reclamar. Um evento futuro não recebe denúncia de «não aconteceu», e é a
 * ordenação por `id` que torna a escolha reproduzível entre duas gerações do acervo.
 */
function candidatosDeDenuncia(): Entidade[] {
  const saida: Entidade[] = [];
  for (const classe of ["conteudo", "midia"] as const) {
    for (const slug of slugsPorTipo(classe)) {
      const e = porSlug(classe, slug);
      // Só o que o acervo publica de fato: sem resumo não há o que ler, e sem nada para
      // ler não há sobre o que reclamar.
      if (e && e.procedencia !== "autorado" && (e.resumo ?? "").length >= 60) saida.push(e);
    }
  }
  return saida.sort(porIdEstavel);
}

function denunciasDaFila(): ItemDaFila[] {
  const candidatos = amostrar(candidatosDeDenuncia(), DENUNCIAS_NA_FILA);
  return candidatos.map((e, i) => {
    const motivo = MOTIVOS_DE_DENUNCIA[i % MOTIVOS_DE_DENUNCIA.length];
    return paraItem(e, "denuncia", null, {
      motivo: motivo.id,
      rotulo: motivo.rotulo,
      // Derivada da posição, nunca sorteada: 1, 2, 3, 1, 2, 3… Duas gerações do acervo
      // com o mesmo dado produzem a mesma fila, que é o que `REGRA_DA_AMOSTRAGEM` promete.
      quantas: (i % 3) + 1,
    });
  });
}

let filaMemo: ItemDaFila[] | null = null;

/**
 * A fila de moderação (D-82). Sessenta itens: 20 de produtor, 20 de ingestão automática e
 * 20 de sugestão de IA — e o número está declarado em `ITENS_POR_ORIGEM`, na tela.
 */
interface CandidatoDeIa {
  entidade: Entidade;
  sugestao: SugestaoDaIa;
}

let candidatosIaMemo: CandidatoDeIa[] | null = null;

/**
 * Os candidatos da IA: travessia real, a partir dos eventos que já estão na fila.
 *
 * A IA não inventa entidade — ela alcança uma que JÁ EXISTE, por uma aresta que JÁ EXISTE,
 * e a frase que justifica a sugestão é a frase DA ARESTA, lida por `motivoDaAresta`, o
 * mesmo gerador que o cartão público usa. Uma frase escrita aqui para a ocasião seria a IA
 * «escrevendo verbete», que é exatamente o terceiro limite de D-86.
 */
function candidatosDeIa(): CandidatoDeIa[] {
  if (candidatosIaMemo) return candidatosIaMemo;

  const candidatos = new Map<string, CandidatoDeIa>();
  for (const evento of eventosDoAcervo()) {
    for (const v of vizinhos(evento.id)) {
      if (!RELACOES_EDITORIAIS.includes(v.aresta.relacao)) continue;
      // Um evento alcançado por aresta editorial já entra pela própria origem; deixá-lo
      // entrar de novo como sugestão de IA poria o mesmo item duas vezes na fila.
      if (v.entidade.classe === "evento") continue;
      // `repertorio` e `pessoa-usuaria` NÃO são candidatos a publicação. Um repertório é
      // a lista de salvos de uma pessoa; propor «publicar o Repertório de Carlos» numa
      // fila editorial é sugerir tornar público o que é de alguém. O grafo alcança os
      // dois por aresta editorial, e é aqui que a fila diz que alcance não é candidatura.
      if (CLASSES_QUE_NAO_SE_PUBLICAM.includes(v.entidade.classe)) continue;
      if (candidatos.has(v.entidade.id)) continue;

      const ladoDe = porId(v.aresta.de) ?? evento;
      const ladoPara = porId(v.aresta.para) ?? v.entidade;
      const m = motivoDaAresta(v.aresta, ladoDe, ladoPara);

      candidatos.set(v.entidade.id, {
        entidade: v.entidade,
        sugestao: {
          deId: evento.id,
          deTitulo: evento.titulo,
          relacao: v.aresta.relacao,
          motivo: m.texto,
          origemMotivo: m.origemMotivo,
          procedenciaAresta: v.aresta.procedencia,
        },
      });
    }
  }
  candidatosIaMemo = [...candidatos.values()].sort((a, b) =>
    porIdEstavel(a.entidade, b.entidade),
  );
  return candidatosIaMemo;
}

export interface FaixaDeScore {
  score: number;
  /** Quantos candidatos da POPULAÇÃO inteira caem nesta faixa. */
  naPopulacao: number;
  /** Quantos deles a fila mostra. */
  naFila: number;
}

/**
 * A distribuição de score da população inteira de candidatos da IA, ao lado da que a fila
 * mostra. As duas juntas, e nunca só a segunda: publicar o recorte sem a população é
 * deixar quem lê tomar um pelo outro.
 */
export function distribuicaoDeScore(): FaixaDeScore[] {
  const populacao = new Map<number, number>();
  for (const c of candidatosDeIa()) {
    const s = pontuar(c.entidade);
    populacao.set(s, (populacao.get(s) ?? 0) + 1);
  }
  const naFila = new Map<number, number>();
  for (const i of filaDaModeracao()) {
    if (i.score === null) continue;
    naFila.set(i.score, (naFila.get(i.score) ?? 0) + 1);
  }
  return [...populacao.keys()]
    .sort((a, b) => a - b)
    .map((score) => ({
      score,
      naPopulacao: populacao.get(score) ?? 0,
      naFila: naFila.get(score) ?? 0,
    }));
}

export function filaDaModeracao(): ItemDaFila[] {
  if (filaMemo) return filaMemo;

  const eventos = eventosDoAcervo();
  const produtores = eventos.filter((e) => e.id.includes(":cms:"));
  const ingeridos = eventos.filter((e) => e.id.includes(":enc:"));
  const ordenadosIa = candidatosDeIa();

  const fila = [
    ...amostrar(produtores, ITENS_POR_ORIGEM).map((e) => paraItem(e, "produtor", null)),
    ...amostrar(ingeridos, ITENS_POR_ORIGEM).map((e) => paraItem(e, "ingestao", null)),
    ...rodizioPorFaixaDeScore(ordenadosIa, ITENS_POR_ORIGEM).map((c) =>
      paraItem(c.entidade, "ia", c.sugestao),
    ),
    ...denunciasDaFila(),
  ];

  // --- Conferências que derrubam o build (falha alta e nomeada) ---
  const contadas = fila.reduce<Record<string, number>>((a, i) => {
    a[i.origem] = (a[i.origem] ?? 0) + 1;
    return a;
  }, {});
  for (const o of ORIGENS_DECLARADAS) {
    if (!contadas[o.id]) {
      throw new Error(
        `moderacao.ts: a fila ficou SEM nenhum item de origem «${o.id}». A tela 34 existe ` +
          "para mostrar as três origens lado a lado; com uma faltando ela deixa de " +
          "demonstrar D-82 e passa a demonstrar duas. REVEJA a regra de atribuição de " +
          `origem — a contagem medida foi ${JSON.stringify(contadas)}.`,
      );
    }
  }
  const comScore = fila.filter((i) => i.score !== null);
  if (comScore.length !== (contadas.ia ?? 0)) {
    throw new Error(
      `moderacao.ts: ${comScore.length} itens têm score e ${contadas.ia} são de IA. Score ` +
        "fora da IA achata a distinção entre afirmar e estimar, que é o argumento inteiro " +
        "de D-82.",
    );
  }
  if (comScore.some((i) => i.score === null || i.score < 0 || i.score > 1)) {
    throw new Error("moderacao.ts: score fora da faixa 0..1.");
  }

  filaMemo = fila;
  return fila;
}

/**
 * Só os itens de origem `ia`.
 *
 * O RECORTE É FEITO NO SERVIDOR e não no cliente: mandar os 68 e filtrar lá pagaria 53 KB
 * de DTO para exibir 20 itens. É o mesmo raciocínio que fez o Observatório recortar por
 * tela em vez de mandar tudo para todas.
 */
export function sugestoesDaIa(): ItemDaFila[] {
  return filaDaModeracao().filter((i) => i.origem === "ia");
}

export function itemDaFilaPorId(id: string): ItemDaFila | undefined {
  return filaDaModeracao().find((i) => i.id === id);
}

/**
 * O item em que a tela ABRE. Fixado por regra, nunca sorteado a cada build.
 *
 * É o item de IA de MENOR score, com empate desfeito pelo `id`. Abrir num item de produtor
 * mostraria uma ficha correta e nenhuma das perguntas que a tela existe para fazer: sem
 * score, sem os cinco componentes, sem a frase da aresta que justificou a sugestão. O caso
 * de confiança baixa é justamente aquele em que a decisão humana pesa, e é com ele à vista
 * que a tela responde «onde a IA não deve ser utilizada» sem precisar de legenda.
 */
export function itemInicialDaFila(): string {
  const candidatos = filaDaModeracao().filter((i) => i.score !== null);
  const escolhido = candidatos
    .slice()
    .sort((a, b) => (a.score as number) - (b.score as number) || porIdEstavel(a, b))[0];
  return (escolhido ?? filaDaModeracao()[0]).id;
}

/**
 * Os três escopos de D-84, com o ALCANCE MEDIDO sobre a fila que existe.
 *
 * Eles são a resposta ao «como crescer sem reescrever» do RFP: a superfície é uma só e o
 * que muda é o recorte. Por isso o alcance é contado aqui, sobre o dado, e não escrito à
 * mão na tela — um número digitado passaria a mentir na primeira regeração do grafo.
 */
export function escoposDeCuradoria(): Escopo[] {
  const fila = filaDaModeracao();
  return [
    {
      id: "nacional",
      rotulo: "nacional",
      descricao:
        "A fila inteira, sem recorte. É o escopo de quem responde pela agenda do país.",
      campo: "todos",
      alcance: fila.length,
    },
    {
      id: "territorial",
      rotulo: "territorial",
      descricao:
        "Só os itens que o acervo situa em algum território. É o escopo de quem responde " +
        "por uma praça, e o recorte que permite uma redação regional operar a mesma tela.",
      campo: "territorio",
      alcance: fila.filter((i) => i.territorio !== null).length,
    },
    {
      id: "linguagem",
      rotulo: "por linguagem",
      descricao:
        "Só os itens com linguagem classificada no vocabulário controlado. É o escopo de " +
        "quem responde por uma área — música, artes visuais, literatura.",
      campo: "linguagens",
      alcance: fila.filter((i) => i.linguagens.length > 0).length,
    },
  ];
}

/** Congelada como `readonly` para o componente não poder reordenar o que a tela declara. */
export const ESCOPOS_DE_CURADORIA: readonly Escopo[] = escoposDeCuradoria();

/**
 * O recorte de um escopo, despachado sobre `Escopo.campo` — a MESMA decisão que o
 * componente de cliente despacha, porque o campo vem no DTO em vez de a regra ser copiada.
 */
export function itemNoEscopo(item: ItemDaFila, campo: Escopo["campo"]): boolean {
  if (campo === "territorio") return item.territorio !== null;
  if (campo === "linguagens") return item.linguagens.length > 0;
  return true;
}

// ---------------------------------------------------------------------------
// D-83 — as quatro ações, e a assimetria que É o conteúdo
// ---------------------------------------------------------------------------

/**
 * As quatro ações DA FILA, das seis do contrato.
 *
 * `AcaoDeModeracao` mora em `tipos-acesso.ts` porque atravessa dois níveis — a S3 escreve a
 * decisão e o Studio a lê para mostrar ao produtor o que aconteceu com o registro dele. As
 * outras duas do contrato não aparecem aqui: `suspender` age sobre o que JÁ FOI PUBLICADO e
 * não está mais na fila, e `adiar` não decide nada. Este subconjunto é o que a ficha de um
 * item pendente oferece.
 *
 * O tipo é ESTREITADO e não redeclarado: uma segunda união com os mesmos quatro nomes
 * compilaria hoje e divergiria no dia em que o contrato ganhasse a sétima ação.
 */
export type AcaoDaModeracao = Extract<
  AcaoDeModeracao,
  "aprovar" | "editar" | "vetar" | "devolver"
>;

export interface AcaoDeclarada {
  id: AcaoDaModeracao;
  rotulo: string;
  /** `"obrigatorio"` só no veto. É essa assimetria que separa curadoria de moderação. */
  motivo: "obrigatorio" | "opcional" | "nenhum";
  nota: string;
}

export const ACOES_DA_MODERACAO: readonly AcaoDeclarada[] = [
  {
    id: "aprovar",
    rotulo: "Aprovar",
    motivo: "nenhum",
    nota:
      "O item entra no acervo público com o nome de quem aprovou e o carimbo do momento. " +
      "Aprovar é a única porta pela qual uma sugestão de IA vira dado público.",
  },
  {
    id: "editar",
    rotulo: "Editar",
    motivo: "nenhum",
    nota:
      "Abre a ficha para correção antes de publicar. A edição fica registrada com autor e " +
      "carimbo, como qualquer outra decisão.",
  },
  {
    id: "vetar",
    rotulo: "Vetar",
    motivo: "obrigatorio",
    nota:
      "Barra o item, e EXIGE motivo escrito — o botão de confirmar não conclui com o campo " +
      "vazio. Um veto sem motivo registrado é moderação silenciosa: some da fila e ninguém " +
      "consegue dizer por quê. É a única ação em que o campo é obrigatório, e a diferença " +
      "é o argumento.",
  },
  {
    id: "devolver",
    rotulo: "Devolver",
    motivo: "opcional",
    nota:
      "Manda de volta a quem submeteu, com comentário OPCIONAL. Opcional aqui e " +
      "obrigatório no veto de propósito: devolver mantém a conversa aberta, vetar a " +
      "encerra — e só quem encerra deve explicação.",
  },
];

/**
 * A decisão como ela é GRAVADA — o contrato mais o que a tela precisa para exibir.
 *
 * `DecisaoDeModeracao` vem de `tipos-acesso.ts` e é o que atravessa para o Studio. Os três
 * campos daqui são de APRESENTAÇÃO e não pertencem ao contrato: título e origem existem
 * para o histórico não ter que reabrir a fila só para escrever uma linha, e `situacao` é o
 * resultado de `situacaoApos()`, gravado junto para que o registro diga em que estado o
 * item ficou sem depender de quem o lê aplicar a função de novo.
 *
 * ELE ESTENDE, NÃO REDECLARA. Um registro com os mesmos campos escritos à mão passaria a
 * divergir do contrato no primeiro campo que a S7 acrescentasse, e o sintoma seria o painel
 * do produtor lendo `undefined` num campo que a moderação nunca soube que devia escrever.
 */
export interface DecisaoRegistrada extends DecisaoDeModeracao {
  acao: AcaoDaModeracao;
  itemTitulo: string;
  origem: OrigemDoItem;
  /** O estado em que o item ficou. Sempre `situacaoApos(acao)`, nunca digitado. */
  situacao: Situacao;
}

/** A frase que a tela imprime sobre a assimetria. Produto, não comentário. */
export const FRASE_DA_ASSIMETRIA =
  "Das quatro ações, só o veto exige motivo escrito. Devolver aceita comentário e não o " +
  "cobra; aprovar e editar não pedem nenhum. A assimetria é deliberada: vetar é a única " +
  "ação que encerra o assunto sem devolver a palavra a quem submeteu, e é por isso que ela " +
  "é a única que deve explicação por escrito.";

// ---------------------------------------------------------------------------
// M2 — a ficha: os direitos, a classificação e a porta do termo
// ---------------------------------------------------------------------------

/**
 * Um bloco de conferência da ficha: o que a moderação olha antes de decidir.
 *
 * `bloqueiaPublicacao` é o campo que separa uma observação de uma BARREIRA. A tela precisa
 * dizer não só que falta crédito, mas que a falta impede a publicação — e por quê. Bloquear
 * sem explicar é a moderação silenciosa vista do outro lado: quem submeteu leva um não e
 * não sabe o que corrigir.
 */
export interface ConferenciaDaFicha {
  id: string;
  rotulo: string;
  /** O que a moderação confere, em texto de produto. */
  oQue: string;
  /** Por que isto é responsabilidade da moderação, e o que ela NÃO decide aqui. */
  limite: string;
  bloqueiaPublicacao: boolean;
}

export const CONFERENCIAS_DA_FICHA: readonly ConferenciaDaFicha[] = [
  {
    id: "credito",
    rotulo: "direitos e crédito de imagem",
    oQue:
      "O campo `creditoImagem`. Imagem declarada sem crédito não publica — e a ficha diz " +
      "por que, em vez de só desabilitar o botão.",
    limite:
      "A moderação confere a PRESENÇA do crédito, não a titularidade do direito. Quem " +
      "publica a imagem responde por ela; o que esta tela impede é o acervo do Itaú " +
      "Cultural exibir uma foto sem dizer de quem ela é.",
    bloqueiaPublicacao: true,
  },
  {
    id: "distribuicao",
    rotulo: "direito de distribuição e uso offline",
    oQue:
      "Se a mídia pode ser redistribuída e baixada para uso sem conexão — o que o app " +
      "oferece em «salvos» e no Play.",
    limite:
      "O acervo NÃO tem este campo em entidade nenhuma. A ficha declara a ausência com " +
      "denominador em vez de oferecer uma caixa que não guarda nada: uma tela que coleta o " +
      "que o modelo não sustenta produz silêncio, e silêncio é o que a plataforma se " +
      "proibiu de interpretar.",
    bloqueiaPublicacao: false,
  },
  {
    id: "classificacao",
    rotulo: "classificação indicativa",
    oQue: "A faixa etária declarada por quem realiza o evento.",
    limite:
      "A moderação CONFERE O DECLARADO, não arbitra. A distinção é de responsabilidade: " +
      "quem realiza o evento responde pela classificação, e uma plataforma que a atribui " +
      "por conta própria assume um risco que não é dela e tira de quem é. O campo " +
      "`faixaEtaria` não existe em `tipos.ts` — entrou por extensão em `tipos-acesso.ts` e " +
      "nenhuma entidade do acervo o preenche.",
    bloqueiaPublicacao: false,
  },
  {
    id: "termo",
    rotulo: "termo fora do vocabulário",
    oQue: "Termos vinculados ao item que não estão no vocabulário controlado.",
    limite:
      "A moderação ENCAMINHA ao Editor e não decide. Criar termo aqui abriria uma segunda " +
      "porta para o vocabulário, e um vocabulário com duas portas deixa de ser controlado " +
      "na primeira vez que as duas discordarem. O botão é «encaminhar», nunca «criar».",
    bloqueiaPublicacao: false,
  },
];

export const FRASE_DO_BLOQUEIO =
  "Uma barreira que não explica é um não sem endereço: quem submeteu não sabe o que " +
  "corrigir, e volta a submeter a mesma coisa. Por isso o que impede a publicação aparece " +
  "com o campo nomeado, o motivo escrito e de quem é a responsabilidade de preencher.";

// ---------------------------------------------------------------------------
// M9 — o histórico, e o que ele NÃO é (funcionalidade 121)
// ---------------------------------------------------------------------------

/**
 * Para onde cada ação leva o item, do lado de QUEM RECEBE.
 *
 * Uma decisão que não diz onde foi parar é um registro sem consequência: o histórico
 * mostraria «devolvido» e ninguém saberia onde procurar o que foi devolvido. `rotaDoOutroLado`
 * é o mesmo campo que `EntradaDeHistorico` já usa em `ocorrencias-studio.ts`, e existe pela
 * mesma razão — a decisão tem dois lados, e a tela de quem decide precisa apontar o outro.
 */
export interface DestinoDaAcao {
  acao: AcaoDaModeracao;
  /** O que aconteceu, do ponto de vista de quem recebeu. */
  doOutroLado: string;
  /** A rota onde a MESMA decisão aparece do lado de quem recebe, ou `null`. */
  rotaDoOutroLado: string | null;
  /** Por que a rota é `null`, quando é. Ausência declarada, nunca campo em branco. */
  porqueSemRota: string | null;
}

export const DESTINOS_DA_ACAO: readonly DestinoDaAcao[] = [
  {
    acao: "aprovar",
    // O TEXTO MUDOU EM 2026-08, com o perfil Produtor. Ele dizia «o item ENTRA no acervo
    // público» — e isso deixou de ser verdade quando a publicação passou a ser direta: o
    // item já estava no ar quando chegou aqui. Aprovar, agora, é a amostragem confirmando
    // que ele pode continuar.
    doOutroLado:
      "O item CONTINUA no ar. Com a publicação direta, ele já estava público quando chegou " +
      "à amostragem — aprovar é a fiscalização dizendo que ele pode ficar, com a " +
      "procedência de quem o publicou.",
    // `/acervo/` NÃO EXISTE, e nunca existiu: era uma rota escrita a partir do nome do
    // conceito, não do mapa de rotas. O `<Link>` do histórico a prefetchava e o console
    // acusava 404 em toda visita — o portão de console limpo pegou. `/descobrir/` é onde o
    // item de fato aparece para quem usa o app.
    rotaDoOutroLado: "/descobrir/",
    porqueSemRota: null,
  },
  {
    acao: "editar",
    doOutroLado:
      "A ficha volta para correção e o registro SEGUE na fila — `editar` não o tira de " +
      "`em-moderacao`, e por isso ele continua aparecendo aqui.",
    rotaDoOutroLado: "/moderacao/fila/",
    porqueSemRota: null,
  },
  {
    acao: "vetar",
    doOutroLado:
      "O item é barrado com motivo escrito e NÃO chega ao acervo público. Ele não volta a " +
      "ser editável: para seguir, é preciso um registro novo.",
    rotaDoOutroLado: null,
    porqueSemRota:
      "Não há tela do outro lado porque não há outro lado: o veto encerra o assunto, e é " +
      "exatamente por isso que ele é a única ação da fila que deve explicação por escrito. " +
      "O motivo fica aqui, no histórico, e é o que uma auditoria procura primeiro.",
  },
  {
    acao: "devolver",
    doOutroLado:
      "O registro volta ao Studio de quem submeteu, editável, com o comentário da moderação " +
      "à vista — quando houve comentário.",
    rotaDoOutroLado: "/studio/publicar/",
    porqueSemRota: null,
  },
];

/**
 * A frase que a M3 existe para imprimir. É a resposta ao RFP, e é produto — não nota.
 */
export const APROVAR_E_A_UNICA_PORTA =
  "Aprovar é a ÚNICA porta pela qual uma sugestão de IA vira dado público. Nenhuma delas " +
  "entra no acervo por decurso de prazo, por score alto, por volume ou por qualquer regra " +
  "automática: é preciso um humano apertar um botão, e o botão fica registrado com nome e " +
  "carimbo. O score ao lado de cada sugestão não decide nada — ele é a fração de cinco " +
  "perguntas sobre a ficha da própria entidade, exibidas marcadas uma a uma, para que quem " +
  "decide confira a conta em vez de confiar no número.";

// ---------------------------------------------------------------------------
// M7 — duplicatas entre organizações (113) · o que o produtor não decide
// ---------------------------------------------------------------------------

/**
 * Um grupo de duplicatas que a MODERAÇÃO decide, e não o produtor.
 *
 * A REGRA DE COMPETÊNCIA (163 contra 113): um produtor pode decidir sobre duplicata entre
 * os PRÓPRIOS registros — são dele, ele sabe qual é qual. Entre registros de fontes
 * diferentes nenhum dos dois lados pode decidir sem ser parte, e a decisão precisa de quem
 * não é. É a mesma razão pela qual ninguém julga a própria causa.
 *
 * O PROXY DE «ORGANIZAÇÃO», E ELE É DECLARADO. O acervo do Itaú Cultural **não publica a
 * organização** de nenhum registro: não existe esse campo. O que ele publica é a FONTE —
 * `evento:cms:*` veio do CMS da agenda, `evento:enc:*` veio do lote da Enciclopédia — e é
 * ela que esta tela usa para separar «mesma origem» de «origens diferentes». Chamar fonte
 * de organização sem dizer seria inventar um campo; usá-la dizendo é o recorte mais
 * próximo que o dado sustenta.
 */
export interface GrupoParaModeracao {
  id: string;
  estagio: string;
  estagioRotulo: string;
  score: number | null;
  /** `encenado`, `acervo` ou `cruzado` — a distinção que a fase 4 já fazia. */
  origem: string;
  /** As fontes distintas presentes no grupo. Duas ou mais é o que traz o grupo para cá. */
  fontes: string[];
  registros: { id: string; titulo: string; fonte: string; procedencia: string; rota: string }[];
  campos: { campo: string; rotulo: string; valores: string[]; divergente: boolean }[];
}

export const REGRA_DA_COMPETENCIA =
  "Um produtor decide duplicata entre os próprios registros — são dele, e ele sabe qual é " +
  "qual (funcionalidade 163). Quando o grupo junta registros de FONTES DIFERENTES, nenhum " +
  "dos dois lados pode decidir sem ser parte, e é aqui que a decisão vem parar. É a mesma " +
  "razão pela qual ninguém julga a própria causa, e é o que separa a 113 da 163.";

export const O_ACERVO_NAO_PUBLICA_ORGANIZACAO =
  "O acervo do Itaú Cultural NÃO publica a organização de nenhum registro — esse campo não " +
  "existe em entidade nenhuma. O que ele publica é a FONTE: `evento:cms:*` entrou pelo CMS " +
  "da agenda e `evento:enc:*` veio do lote da Enciclopédia. Esta tela usa a fonte como o " +
  "recorte mais próximo que o dado sustenta, e diz que está usando — chamar fonte de " +
  "organização sem avisar seria inventar um campo e exibi-lo com o crachá do IC.";

/** A fonte de um id do acervo: `cms`, `enc`, ou o que o id declarar. */
function fonteDoId(id: string): string {
  const partes = id.split(":");
  return partes.length >= 3 ? partes[1] : "desconhecida";
}

export interface PanoramaDasDuplicatas {
  /** Todos os grupos que a deduplicação encontrou. */
  totalDeGrupos: number;
  /** Os que ficam com o PRODUTOR — mesma fonte, decisão dele (163). */
  deUmaFonteSo: number;
  /** Quantos de fato juntam fontes diferentes. **Zero neste acervo**, e a tela diz. */
  cruzamFontes: number;
  /** Os grupos que a tela mostra. */
  grupos: GrupoParaModeracao[];
  /** Quantos dos que vieram são duplicata real do acervo, e não clone encenado. */
  doAcervoReal: number;
}

let duplicatasMemo: PanoramaDasDuplicatas | null = null;

/**
 * Os grupos que a moderação decide.
 *
 * O recorte é por FONTES DISTINTAS, e o denominador do que ficou de fora vai junto: uma
 * tela que mostrasse só os que vieram faria parecer que a deduplicação achou 44 grupos,
 * quando ela achou 84 e 40 são de competência do produtor.
 */
export function duplicatasParaModeracao(): PanoramaDasDuplicatas {
  if (duplicatasMemo) return duplicatasMemo;

  const todos = filaDeDuplicatas();
  const comFontes = todos.map((g) => ({
    g,
    // `autorado` NÃO é fonte: é a procedência dos 40 clones que a fase 4 plantou. Contá-lo
    // faria todo grupo encenado parecer «duas organizações» — o clone e o original que ele
    // viola são o MESMO registro em duas cópias, e não dois lados de uma disputa.
    fontes: [...new Set(
      g.registros.map((r) => fonteDoId(r.id)).filter((f) => f !== "autorado"),
    )].sort(),
  }));
  const cruzam = comFontes.filter((x) => x.fontes.length > 1);

  // O QUE FICA NA TELA QUANDO NÃO HÁ CASO CRUZADO. Nenhum dos 84 grupos junta registros de
  // fontes diferentes — todo achado deste acervo é de competência do PRODUTOR (163), não da
  // moderação (113). A tela mostra os grupos que existem, marcados como dele, em vez de
  // abrir vazia: uma tela vazia não distingue «não há caso» de «a busca não rodou», e a
  // diferença entre as duas é a única coisa que ela tem para dizer hoje.
  const paraMostrar = cruzam.length ? cruzam : comFontes;

  duplicatasMemo = {
    totalDeGrupos: todos.length,
    deUmaFonteSo: todos.length - cruzam.length,
    cruzamFontes: cruzam.length,
    doAcervoReal: todos.filter((g) => g.origem === "acervo").length,
    grupos: paraMostrar.slice(0, 8).map(({ g, fontes }) => ({
      id: g.id,
      estagio: g.estagio,
      estagioRotulo: g.estagioRotulo,
      score: g.score,
      origem: g.origem,
      fontes,
      registros: g.registros.map((r) => ({
        id: r.id,
        titulo: r.titulo,
        fonte: fonteDoId(r.id),
        procedencia: r.procedencia,
        rota: r.rota,
      })),
      campos: g.campos.map((c) => ({
        campo: c.campo,
        rotulo: c.rotulo,
        valores: c.valores,
        divergente: c.divergente,
      })),
    })),
  };
  return duplicatasMemo;
}

export const NAO_HA_CASO_CRUZADO =
  "**Nenhum dos 84 grupos que a deduplicação encontrou junta registros de fontes " +
  "diferentes.** Todo achado deste acervo é de competência do produtor, e não da " +
  "moderação — e isso não é defeito da busca: é o que o acervo tem. A tela existe assim " +
  "mesmo, com os grupos que há e a competência marcada em cada um, porque o dia em que uma " +
  "segunda organização publicar no mesmo acervo é o dia em que o primeiro caso aparece, e " +
  "aí não pode ser preciso construir a tela às pressas. Uma tela vazia diria a mesma coisa " +
  "que uma busca que não rodou.";

export const DUPLICATA_DO_ACERVO_E_REAL =
  "Os grupos de origem `acervo` são DUPLICATA REAL ENCONTRADA EM ACERVO REAL: ninguém os " +
  "plantou. Os de origem `encenado` são os 40 clones que a fase 4 criou de propósito, para " +
  "provar que o motor os encontra. A distinção fica na tela porque um protótipo que " +
  "mistura os dois faz o achado real parecer parte da encenação — e o achado real é a " +
  "prova de que a deduplicação tem trabalho para fazer no dia em que for ligada.";

// ---------------------------------------------------------------------------
// M4 — revisão de similaridade (112) · governar 47.259 arestas sem fingir
// ---------------------------------------------------------------------------

/**
 * Uma família de arestas `semelhante_a` que compartilham o padrão de justificativa.
 *
 * O PROBLEMA, MEDIDO: `semelhante_a` é **71% do grafo** — 47.259 de 66.563 arestas, todas
 * de máquina, todas com `motivo` obrigatório, nenhuma revisada por humano. Uma fila item a
 * item levaria anos, e é aritmética simples: a um minuto por aresta, oito horas por dia,
 * são mais de quatro meses de trabalho contínuo para uma pessoa.
 *
 * **Fingir que revisou seria pior do que não revisar.** Uma tela que mostrasse cem arestas
 * e um botão «aprovar todas» produziria um carimbo de revisão humana sobre 47 mil ligações
 * que ninguém leu — e o carimbo é justamente o que dá a elas o peso que hoje não têm.
 *
 * A SAÍDA É GOVERNAR A REGRA, NÃO A ARESTA. As arestas compartilham famílias de
 * justificativa — «Outro verbete de artes visuais» são 3.499 delas —, e decidir sobre a
 * família é uma decisão que uma pessoa consegue de fato tomar: ela lê a regra, lê uma
 * amostra, e diz se a regra se sustenta. O que não se pode é chamar isso de «revisado» sem
 * dizer quantas a decisão alcançou e quantas seguem sem revisão.
 */
export interface FamiliaDeSimilaridade {
  id: string;
  /** O padrão de justificativa, por extenso — é ele que agrupa. */
  padrao: string;
  /** Quantas arestas do grafo inteiro caem nesta família. MEDIDO. */
  arestas: number;
  /** A amostra que a tela mostra, com os dois lados de cada ligação. */
  amostra: { de: string; para: string; motivo: string }[];
}

export interface PanoramaDaSimilaridade {
  /** O total de `semelhante_a` no grafo. Contado, nunca digitado. */
  totalDeArestas: number;
  /** O total de arestas do grafo, para a fração ser conferível. */
  totalDoGrafo: number;
  /** Quantas famílias distintas existem. */
  totalDeFamilias: number;
  /** As famílias que a tela mostra. */
  familias: FamiliaDeSimilaridade[];
  /** Quantas arestas as famílias mostradas somam. */
  arestasNasFamilias: number;
  /** Famílias que a tela NÃO mostra, e quantas arestas elas somam. */
  familiasNaCauda: number;
  arestasNaCauda: number;
  /** O tamanho da amostra por família, e o método. Declarados. */
  tamanhoDaAmostra: number;
  metodoDaAmostra: string;
}

/** Quantas famílias a tela mostra. A cauda entra como número, não some. */
export const FAMILIAS_MOSTRADAS = 12;

/** Quantas ligações de cada família a tela exibe. */
export const AMOSTRA_POR_FAMILIA = 3;

export const REGRA_DA_AMOSTRA_DE_SIMILARIDADE =
  `As ${AMOSTRA_POR_FAMILIA} ligações de cada família são as PRIMEIRAS na ordem do ` +
  "`id` da entidade de origem — chave estável do acervo, nunca sorteio. Não é uma amostra " +
  "aleatória e a tela não a chama de representativa: é um recorte determinístico, que duas " +
  "gerações do acervo reproduzem igual. Uma amostra sorteada mudaria a cada build e faria " +
  "duas pessoas conferirem coisas diferentes achando que conferiram a mesma.";

export const FRASE_DA_REVISAO_HONESTA =
  "Nenhuma destas arestas foi revisada por humano até hoje: são 47.259 ligações de máquina " +
  "sustentando 71% do grafo. Esta tela não as revisa uma a uma — ela governa a REGRA que as " +
  "produziu, que é a única decisão que uma pessoa consegue de fato tomar sobre 47 mil " +
  "coisas. E o contador ao lado diz, sempre, quantas a decisão alcançou e quantas seguem " +
  "sem revisão nenhuma. Sem denominador, «revisado» mente.";

let panoramaMemo: PanoramaDaSimilaridade | null = null;

export function panoramaDaSimilaridade(): PanoramaDaSimilaridade {
  if (panoramaMemo) return panoramaMemo;

  const familias = new Map<
    string,
    { arestas: number; amostra: { de: string; para: string; motivo: string }[] }
  >();
  let total = 0;

  for (const classe of Object.keys(contagens().porClasse) as ClasseEntidade[]) {
    for (const slug of slugsPorTipo(classe)) {
      const e = porSlug(classe, slug);
      if (!e) continue;
      for (const v of vizinhos(e.id, "semelhante_a")) {
        // `semelhante_a` é registrada nos dois sentidos pelo gerador; contar só as que
        // SAEM evita contar cada ligação duas vezes e chegar a um total que não existe.
        if (v.aresta.de !== e.id) continue;
        total += 1;
        const m = motivoDaAresta(v.aresta, e, v.entidade);
        // O padrão da família é o começo da frase, antes da primeira pontuação: é a parte
        // que se repete — «Outro verbete de artes visuais» — e o resto é o que varia.
        const padrao = m.texto.split(/[:;,]/)[0].slice(0, 70).trim();
        const atual = familias.get(padrao) ?? { arestas: 0, amostra: [] };
        atual.arestas += 1;
        if (atual.amostra.length < AMOSTRA_POR_FAMILIA) {
          atual.amostra.push({ de: e.titulo, para: v.entidade.titulo, motivo: m.texto });
        }
        familias.set(padrao, atual);
      }
    }
  }

  const ordenadas = [...familias.entries()].sort(
    (a, b) => b[1].arestas - a[1].arestas || (a[0] < b[0] ? -1 : 1),
  );
  const mostradas = ordenadas.slice(0, FAMILIAS_MOSTRADAS);
  const cauda = ordenadas.slice(FAMILIAS_MOSTRADAS);

  panoramaMemo = {
    totalDeArestas: total,
    // De `meta.json`, escrito por `gerar-grafo.mjs` num processo separado — a mesma
    // testemunha independente que o Observatório usa. O total de arestas não sai de
    // `contagens()`, que só conta entidades.
    totalDoGrafo: Object.values(META_DAS_ARESTAS).reduce((a, b) => a + b, 0),
    totalDeFamilias: ordenadas.length,
    familias: mostradas.map(([padrao, v], i) => ({
      id: `familia:${i}`,
      padrao,
      arestas: v.arestas,
      amostra: v.amostra,
    })),
    arestasNasFamilias: mostradas.reduce((s, [, v]) => s + v.arestas, 0),
    familiasNaCauda: cauda.length,
    arestasNaCauda: cauda.reduce((s, [, v]) => s + v.arestas, 0),
    tamanhoDaAmostra: AMOSTRA_POR_FAMILIA,
    metodoDaAmostra: REGRA_DA_AMOSTRA_DE_SIMILARIDADE,
  };
  return panoramaMemo;
}

// ---------------------------------------------------------------------------
// M5 — elenco declarado (116) · a barreira ética do sistema
// ---------------------------------------------------------------------------

/**
 * Um vínculo de elenco esperando conferência: alguém afirmou que uma pessoa real se
 * apresentou em algum lugar.
 *
 * POR QUE ESTA TELA EXISTE. A equipe **se recusou a autorar arestas de elenco** no
 * protótipo, e a razão está registrada: autorar elenco seria uma afirmação factual falsa
 * sobre pessoas reais. Quando o produtor passa a declarar elenco, alguém precisa conferir —
 * senão a plataforma publica, em nome do Itaú Cultural, que uma pessoa real se apresentou
 * onde não se apresentou. Nenhuma outra tela desta sessão decide sobre um terceiro que não
 * está na conversa.
 *
 * OS VÍNCULOS SÃO REAIS. Eles saem das 508 arestas `atua_em` do acervo, com o papel que o
 * acervo declara. O que é encenado — e a tela diz — é a SITUAÇÃO: tratá-los como se
 * tivessem acabado de ser submetidos por um produtor, para haver o que conferir.
 */
export interface VinculoDeElenco {
  id: string;
  /** O agente afirmado. Quando `verbeteId` é `null`, é só um nome digitado. */
  agenteNome: string;
  /** O verbete da Enciclopédia, quando o nome casa com um. `null` vira proposta (M6). */
  verbeteId: string | null;
  verbeteResumo: string | null;
  verbeteRota: string | null;
  /** `artista`, `colunista` ou `participante` — o vocabulário que o acervo usa. */
  papel: string;
  eventoId: string;
  eventoTitulo: string;
  /**
   * `true` quando o nome digitado NÃO casou com verbete nenhum. Estes não se decidem
   * aqui: vão para a reconciliação (M6) antes, porque confirmar um vínculo com um agente
   * que não existe criaria a pessoa pela porta dos fundos.
   */
  proposto: boolean;
}

export const FRASE_DO_ELENCO =
  "O que se decide aqui é uma AFIRMAÇÃO SOBRE UMA PESSOA REAL: que ela se apresentou neste " +
  "evento, neste papel. É a única tela da moderação em que a pessoa afetada não está na " +
  "conversa e não pode se defender — quem submeteu afirma, quem modera confere, e a pessoa " +
  "de quem se fala só descobre depois de publicado. Por isso a confirmação não é um " +
  "carimbo: é uma conferência contra o verbete, e a recusa exige motivo como o veto exige.";

export const POR_QUE_NAO_AUTORAMOS_ELENCO =
  "Nenhuma aresta de elenco foi autorada por nós neste protótipo, e a recusa é deliberada: " +
  "escrever que uma pessoa real participou de um evento é uma afirmação factual, e uma " +
  "afirmação factual inventada sobre alguém não deixa de ser falsa por estar num protótipo. " +
  "Os vínculos desta tela são os que o ACERVO já declara — 508 arestas `atua_em`, com os " +
  "papéis que ele usa. O que encenamos é a situação de eles estarem esperando decisão.";

// ---------------------------------------------------------------------------
// M6 — reconciliação com a Enciclopédia (117) · o único caminho de escrita
// ---------------------------------------------------------------------------

/**
 * Um candidato do acervo a ser o verbete de um nome proposto.
 *
 * A comparação é CAMPO A CAMPO, no padrão de `CampoComparado` das duplicatas: o que decide
 * não é uma pontuação de parecença entre textos, é a ficha ao lado da ficha. Duas pessoas
 * podem ter nomes quase idênticos e serem duas pessoas — e é exatamente esse o caso em que
 * uma medida de similaridade erra com confiança alta.
 */
export interface CandidatoDeVerbete {
  id: string;
  titulo: string;
  classe: ClasseEntidade;
  resumo: string | null;
  rota: string | null;
  /** Quantas arestas o acervo já liga a este verbete. Alcance, não parecença. */
  grau: number;
  /** O que fez este candidato aparecer, por extenso. Nunca «similaridade 0,87». */
  porqueApareceu: string;
}

export interface PropostaDeAgente {
  id: string;
  /** O nome como o produtor digitou. */
  nomeDigitado: string;
  /** De onde veio a proposta — o vínculo de elenco que a originou. */
  vinculoId: string;
  eventoTitulo: string;
  papel: string;
  candidatos: CandidatoDeVerbete[];
}

export const VERBETE_E_AUTORIDADE_DA_ENCICLOPEDIA =
  "O verbete é autoridade da Enciclopédia Itaú Cultural. A moderação LIGA a proposta a um " +
  "verbete existente, ou encaminha a criação ao Editor — ela **nunca edita o verbete**. São " +
  "575 pessoas no protótipo e 43.614 na base completa: pessoas reais que nunca se " +
  "cadastraram e cujo texto foi escrito por quem o escreveu. Um produtor editando o verbete " +
  "de um artista real seria a violação exata que este projeto se proibiu, e reconciliar é o " +
  "único caminho de escrita que não a comete.";

/** Quantos vínculos a tela encena. Declarado, e citado na tela. */
export const VINCULOS_NA_FILA = 10;

/**
 * A GRAFIA VARIANTE que vira proposta.
 *
 * Ela não inventa pessoa: é o MESMO nome do acervo, escrito sem acento e sem pontuação —
 * «A. C. D'Ávila» digitado como «AC Davila». É o caso real da reconciliação, e o único
 * jeito honesto de encenar «o produtor digitou um nome que o sistema não achou» sem
 * fabricar uma pessoa que não existe. A tela declara que a grafia é encenada.
 */
function grafiaVariante(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.'’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

let elencoMemo: VinculoDeElenco[] | null = null;

/**
 * Os vínculos de elenco esperando conferência.
 *
 * Determinístico: os agentes são varridos na ordem de `slugsPorTipo`, e a cota é fechada
 * com passo fixo. Duas gerações do acervo com o mesmo dado produzem a mesma lista.
 *
 * A cada terceiro vínculo, o nome entra como GRAFIA VARIANTE e o verbete some — é o que
 * produz as propostas da M6. A proporção é declarada na tela: um terço não é medida do
 * mundo, é encenação nossa para haver os dois casos à vista.
 */
export function elencoParaConferir(): VinculoDeElenco[] {
  if (elencoMemo) return elencoMemo;

  const brutos: { agente: Entidade; papel: string; evento: Entidade }[] = [];
  for (const classe of ["pessoa", "coletivo"] as const) {
    for (const slug of slugsPorTipo(classe)) {
      const a = porSlug(classe, slug);
      if (!a) continue;
      for (const v of vizinhos(a.id, "atua_em")) {
        // `atua_em` é dirigida: o agente aponta para o acontecimento. Sem o filtro, um
        // evento apareceria como se atuasse numa pessoa.
        if (v.aresta.de !== a.id) continue;
        if (!v.aresta.papel) continue;
        brutos.push({ agente: a, papel: v.aresta.papel, evento: v.entidade });
      }
    }
  }
  brutos.sort((x, y) =>
    x.agente.id < y.agente.id ? -1 : x.agente.id > y.agente.id ? 1 : x.evento.id < y.evento.id ? -1 : 1,
  );

  elencoMemo = amostrar(brutos, VINCULOS_NA_FILA).map((b, i) => {
    const proposto = i % 3 === 2;
    return {
      id: `elenco:${b.agente.id}:${b.evento.id}`,
      agenteNome: proposto ? grafiaVariante(b.agente.titulo) : b.agente.titulo,
      verbeteId: proposto ? null : b.agente.id,
      verbeteResumo: proposto ? null : (b.agente.resumo ?? null),
      verbeteRota: proposto ? null : rotaDe(b.agente),
      papel: b.papel,
      eventoId: b.evento.id,
      eventoTitulo: b.evento.titulo,
      proposto,
    };
  });
  return elencoMemo;
}

/**
 * As propostas de agente, com os candidatos do acervo.
 *
 * O casamento é por NOME NORMALIZADO — `normalizar` é a mesma função que o índice de busca
 * usa, e não uma segunda normalização escrita aqui. Uma segunda normalização daria
 * resultados diferentes da busca do produto no dia em que uma das duas mudasse, e o
 * sintoma seria a moderação não achar o verbete que a busca acha.
 */
export function propostasDeAgente(): PropostaDeAgente[] {
  const porNomeNormalizado = new Map<string, Entidade[]>();
  for (const classe of ["pessoa", "coletivo"] as const) {
    for (const slug of slugsPorTipo(classe)) {
      const e = porSlug(classe, slug);
      if (!e) continue;
      const chave = normalizar(grafiaVariante(e.titulo));
      const lista = porNomeNormalizado.get(chave);
      if (lista) lista.push(e);
      else porNomeNormalizado.set(chave, [e]);
    }
  }

  return elencoParaConferir()
    .filter((v) => v.proposto)
    .map((v) => {
      const chave = normalizar(grafiaVariante(v.agenteNome));
      const achados = porNomeNormalizado.get(chave) ?? [];
      return {
        id: `proposta:${v.id}`,
        nomeDigitado: v.agenteNome,
        vinculoId: v.id,
        eventoTitulo: v.eventoTitulo,
        papel: v.papel,
        candidatos: achados.slice(0, 4).map((e) => ({
          id: e.id,
          titulo: e.titulo,
          classe: e.classe,
          resumo: e.resumo ?? null,
          rota: rotaDe(e),
          grau: vizinhos(e.id).length,
          porqueApareceu:
            `O nome digitado, normalizado, é idêntico ao título deste verbete ` +
            `normalizado. Nenhuma medida de parecença entrou na conta — ou casa, ou não ` +
            `aparece.`,
        })),
      };
    });
}

/**
 * Quantas pessoas o acervo tem. **CONTADO, nunca digitado** — o número é o denominador do
 * risco de uma reconciliação errada, e um valor escrito à mão passaria a mentir na primeira
 * regeração do grafo.
 */
export const PESSOAS_NO_PROTOTIPO = slugsPorTipo("pessoa").length;

/**
 * O tamanho da Enciclopédia completa, fora deste protótipo.
 *
 * Este É digitado, e a diferença importa: ele não sai do grafo porque o grafo não o tem. É
 * um número da base do Itaú Cultural, citado como referência de escala, e está aqui rotulado
 * como tal em vez de aparecer na tela como se tivesse sido contado.
 */
export const PESSOAS_NA_BASE_COMPLETA = 43_614;

export const REGRA_DA_RECONCILIACAO =
  "Os candidatos aparecem por CASAMENTO DE NOME NORMALIZADO — acentuação, caixa e " +
  "pontuação removidas —, e por mais nada. Não há pontuação de similaridade: um número " +
  "alto entre dois nomes parecidos é exatamente o que faz duas pessoas diferentes virarem " +
  "uma só, e o erro é irreversível do ponto de vista de quem foi apagado. A decisão é da " +
  "ficha ao lado da ficha, e quando nenhuma serve o caminho é encaminhar ao Editor.";

// ---------------------------------------------------------------------------
// M8 — escopo, escalonamento e delegação (122 a 125)
// ---------------------------------------------------------------------------

/**
 * Para onde vai o que cai FORA do escopo de quem está moderando (123).
 *
 * O escalonamento não é «avisar alguém»: é nomear o destinatário. Um item fora do escopo
 * que só some da lista vira trabalho de ninguém — e a fila do país inteiro é feita de
 * itens que estão fora do escopo de quase todo mundo.
 */
export interface Escalonamento {
  id: string;
  /** O que dispara o escalonamento, em texto de produto. */
  quando: string;
  /** Quem recebe. NUNCA «a equipe» — um nível de acesso nomeado. */
  paraQuem: string;
  /** Por que é esse e não outro. */
  porque: string;
}

export const ESCALONAMENTOS: readonly Escalonamento[] = [
  {
    id: "fora-do-territorio",
    quando: "o item está situado num território que não é o do moderador de plantão",
    paraQuem: "moderação com escopo daquele território",
    porque:
      "Quem responde por uma praça conhece o calendário, os espaços e os coletivos dela. " +
      "Decidir de longe sobre uma praça que não se conhece é o centralismo que a moderação " +
      "por escopo existe para desfazer.",
  },
  {
    id: "sem-territorio",
    quando: "o acervo não situa o item em território nenhum",
    paraQuem: "moderação nacional",
    porque:
      "Sem território não há escopo territorial que o alcance, e um item que nenhum escopo " +
      "alcança fica parado para sempre. O escopo nacional é o que existe para não deixar " +
      "buraco: ele é o padrão de quem responde pelo país, não um privilégio.",
  },
  {
    id: "duplicata-cruzada",
    quando: "o grupo de duplicatas cruza organizações distintas",
    paraQuem: "moderação nacional",
    porque:
      "Um produtor pode decidir sobre duplicata entre os próprios registros. Entre " +
      "organizações diferentes, nenhum dos dois lados pode decidir sem ser parte — e a " +
      "decisão precisa de quem não é.",
  },
  {
    id: "afirmacao-sobre-pessoa",
    quando: "a decisão é sobre elenco declarado ou proposta de agente",
    paraQuem: "moderação nacional, e nunca ao produtor",
    porque:
      "É afirmação factual sobre uma pessoa real. Devolver ao produtor a decisão sobre o " +
      "que se afirma de terceiros é exatamente o que a plataforma se proibiu.",
  },
];

/**
 * A delegação temporária de escopo (125).
 *
 * Ela tem início e fim declarados, e não é «passar a senha». O que a torna auditável é o
 * mesmo que torna a decisão auditável: quem, o quê, de quando a quando — e o registro
 * permanece depois de ela terminar, porque a pergunta «quem respondia por isto naquela
 * semana» é a que uma auditoria faz.
 */
export interface Delegacao {
  id: string;
  /** Quem delegou. Autorado, e a tela diz que é. */
  de: string;
  /** Quem assumiu. */
  para: string;
  escopo: IdDoEscopo;
  /** "22.08.2026" — derivado de `DATA_DE_REFERENCIA`, nunca do relógio. */
  inicio: string;
  fim: string;
  motivo: string;
  /** `true` enquanto a data de referência estiver dentro do intervalo. */
  vigente: boolean;
}

export const REGRA_DA_DELEGACAO =
  "Uma delegação sem fim declarado é uma transferência de responsabilidade sem data de " +
  "volta — e ninguém consegue dizer, depois, quem respondia por aquele escopo naquela " +
  "semana. Por isso início e fim são obrigatórios, e o registro permanece depois de a " +
  "delegação terminar: o histórico de quem respondeu pelo quê é o que uma auditoria " +
  "procura, e ele não pode desaparecer quando a pessoa volta de férias.";

/**
 * As delegações encenadas.
 *
 * TODA ARITMÉTICA DE DATA AQUI É SOBRE `AAAAMMDD` — um inteiro que ordena. Duas armadilhas
 * de uma vez: `new Date("2026-08-22")` é lido como meia-noite UTC e, em fuso brasileiro,
 * devolve o dia anterior; e `"03.09.2026" < "22.08.2026"` é verdadeiro em comparação de
 * texto, porque ela compara o dia primeiro. As datas só viram `DD.MM.AAAA` na saída, depois
 * de toda comparação já ter acontecido.
 */
function comoNumero(ano: number, mes: number, dia: number): number {
  return ano * 10000 + mes * 100 + dia;
}

const DIAS_NO_MES: readonly number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Desloca N dias a partir da data de referência. Devolve as partes, não uma string. */
function deslocarDias(n: number): { ano: number; mes: number; dia: number } {
  const [ano0, mes0, dia0] = DATA_DE_REFERENCIA.slice(0, 10).split("-").map(Number);
  let ano = ano0;
  let mes = mes0;
  let dia = dia0 + n;
  // 2026 não é bissexto, e o acervo é de 2026: a tabela fixa basta e não introduz um
  // cálculo de ano bissexto que ninguém consegue conferir a olho nesta tela.
  for (;;) {
    const noMes = DIAS_NO_MES[mes - 1] ?? 31;
    if (dia > noMes) {
      dia -= noMes;
      mes += 1;
      if (mes > 12) {
        mes = 1;
        ano += 1;
      }
      continue;
    }
    if (dia < 1) {
      mes -= 1;
      if (mes < 1) {
        mes = 12;
        ano -= 1;
      }
      dia += DIAS_NO_MES[mes - 1] ?? 31;
      continue;
    }
    return { ano, mes, dia };
  }
}

function comoDataCurta(p: { ano: number; mes: number; dia: number }): string {
  return `${String(p.dia).padStart(2, "0")}.${String(p.mes).padStart(2, "0")}.${p.ano}`;
}

export function delegacoesDeExemplo(): Delegacao[] {
  const hoje = deslocarDias(0);
  const agora = comoNumero(hoje.ano, hoje.mes, hoje.dia);

  const monta = (
    id: string,
    para: string,
    escopo: IdDoEscopo,
    deDias: number,
    ateDias: number,
    motivo: string,
  ): Delegacao => {
    const i = deslocarDias(deDias);
    const f = deslocarDias(ateDias);
    return {
      id,
      de: MODERADOR_AUTORADO,
      para,
      escopo,
      inicio: comoDataCurta(i),
      fim: comoDataCurta(f),
      motivo,
      // Comparação sobre o INTEIRO, nunca sobre o texto formatado.
      vigente:
        comoNumero(i.ano, i.mes, i.dia) <= agora && agora <= comoNumero(f.ano, f.mes, f.dia),
    };
  };

  return [
    monta(
      "delegacao:para",
      "Moderação · escopo do Pará (perfil autorado)",
      "territorial",
      -3,
      9,
      "Férias de quem responde pela praça; a fila do Pará não pode parar.",
    ),
    monta(
      "delegacao:musica",
      "Moderação · escopo de música (perfil autorado)",
      "linguagem",
      -40,
      -26,
      "Pico de submissões no período de festivais.",
    ),
  ];
}

export const O_HISTORICO_E_DO_MODERADOR =
  "Este histórico é o das decisões DESTE moderador, e serve para ele responder pelo que " +
  "decidiu. Ele NÃO compara moderadores, não mede tempo médio de fila e não pontua " +
  "concordância entre pessoas: isso é a funcionalidade 169, é do Admin, e misturar as duas " +
  "aqui transformaria a ferramenta de quem responde pelas próprias decisões na ferramenta " +
  "de quem avalia o desempenho dela — que é outra coisa, com outro dono e outras " +
  "salvaguardas.";

export const POR_QUE_O_VETO_SEPARADO =
  "Os vetos aparecem separados, com o motivo por extenso, porque é o que uma auditoria abre " +
  "primeiro: das quatro ações, o veto é a única que encerra o assunto sem devolver a " +
  "palavra a quem submeteu. Um veto cujo motivo estivesse a três cliques de distância " +
  "seria, na prática, um veto sem motivo.";

// ---------------------------------------------------------------------------
// D-90 — o que o acervo não sustenta na tela 34
// ---------------------------------------------------------------------------

export interface DeclaracaoDaModeracao {
  campo: string;
  texto: string;
}

/**
 * A tela 34 pede coisas que o acervo não tem, e o denominador de cada ausência é MEDIDO
 * aqui em vez de escrito à mão. Campo vazio sem frase é o beco que a fase 5 decidiu não
 * ter (D-90).
 */
export function declaracoesDaModeracao(): DeclaracaoDaModeracao[] {
  const fila = filaDaModeracao();
  const semTerritorio = fila.filter((i) => i.territorio === null).length;
  const semLinguagem = fila.filter((i) => i.linguagens.length === 0).length;
  const semResumo = fila.filter((i) => !i.resumo).length;
  return [
    {
      campo: "quem submeteu",
      texto:
        `O acervo não publica o autor da submissão de nenhum dos ${fila.length} itens: não ` +
        "há campo de submissor nas entidades do Itaú Cultural. A fila mostra a ORIGEM do " +
        "item, que o dado sustenta, e não o nome de quem o enviou, que ele não sustenta. " +
        "Inventar um nome aqui seria fabricar autoria — o oposto do que esta tela demonstra.",
    },
    {
      campo: "data de entrada na fila",
      texto:
        "Nenhuma registro do acervo carrega data de submissão, então a fila não ordena por " +
        "«mais antigo primeiro». A ordem é a da regra de amostragem declarada, e a tela diz " +
        "isso em vez de exibir uma antiguidade que não existe.",
    },
    {
      campo: "território",
      texto:
        `${semTerritorio} dos ${fila.length} itens não têm território no acervo. Eles somem ` +
        "do escopo territorial e o número aparece ao lado do escopo, para o recorte menor " +
        "não parecer fila mais curta.",
    },
    {
      campo: "linguagem",
      texto:
        `${semLinguagem} dos ${fila.length} itens não têm linguagem classificada, e ${semResumo} ` +
        "não têm resumo. Nos dois casos o campo aparece declarado vazio, com a frase, em " +
        "vez de sumir da ficha.",
    },
  ];
}


// ---------------------------------------------------------------------------
// Os números — o que a tela cita, e o TETO que impede o grafo de atravessar
// ---------------------------------------------------------------------------

/**
 * 60 KB. O teto de DTO deste plano, medido a cada build — e é PORTÃO, não meta.
 *
 * Ele era medido sobre a fila MAIS o catálogo de arrasto do editor de trilha, porque os
 * dois moravam no mesmo módulo. As duas telas nunca viajaram juntas: a fila serve
 * `/moderacao/fila/` e o catálogo serve `/redacao/trilha/`, e somá-los media um payload
 * que nenhum navegador recebeu. Depois da separação cada superfície é medida contra o
 * MESMO teto, que continua sendo o orçamento de uma página.
 *
 * Todo campo novo no item da fila come da margem. Se estourar, ACHATE — não aumente o
 * teto. O precedente da casa é `PROCEDENCIA_DA_ATRIBUICAO`, que virou constante de módulo
 * porque, como campo por item, custava 2,2 KB para afirmar sessenta vezes a mesma coisa.
 */
export const TETO_DO_DTO = 61440;

export interface NumerosDaModeracao {
  itensNaFila: number;
  itensPorOrigem: Record<OrigemDoItem, number>;
  itensComScore: number;
  scoreMinimo: number;
  scoreMaximo: number;
  componentesDoScore: number;
  escopos: Record<IdDoEscopo, number>;
  acoes: number;
  acoesQueExigemMotivo: number;
  limitesDaIa: number;
  /** Itens cuja UF o acervo resolve. O resto entra na declaração, com denominador. */
  itensComUf: number;
  /** Unidades federativas distintas presentes na fila. */
  ufsNaFila: number;
  motivosDeDenuncia: number;
  /**
   * Registros vivos vindos do Studio da S7. **Zero enquanto a tarefa 5 estiver bloqueada**,
   * e é por isso que ele é um campo medido e não uma ausência silenciosa: a fila tem duas
   * fontes por desenho, e a tela declara que a segunda está vazia em vez de fingir que não
   * existe.
   */
  registrosVivos: number;
  bytesDoDto: number;
  tetoDoDto: number;
}

let numerosMemo: NumerosDaModeracao | null = null;

export function numerosDaModeracao(): NumerosDaModeracao {
  if (numerosMemo) return numerosMemo;

  const fila = filaDaModeracao();
  const scores = fila.filter((i) => i.score !== null).map((i) => i.score as number);

  // O MESMO objeto que a página passa ao componente. Medir outra coisa mediria outra
  // coisa: foi assim que 05-01 descobriu, tarde, que o DTO dele tinha 148 KB.
  const bytes = JSON.stringify({ fila }).length;
  if (bytes > TETO_DO_DTO) {
    throw new Error(
      `moderacao.ts: o DTO da fila ficou com ${bytes} bytes, acima do teto declarado de ` +
        `${TETO_DO_DTO} (60 KB, orçamento de uma página). REDUZA ITENS_POR_ORIGEM ` +
        `(${ITENS_POR_ORIGEM}) ou ACHATE um campo do item — não relaxe o teto: ele é o que ` +
        "impede as 7.810 entidades de irem para o navegador.",
    );
  }

  numerosMemo = {
    itensNaFila: fila.length,
    itensPorOrigem: {
      produtor: fila.filter((i) => i.origem === "produtor").length,
      ingestao: fila.filter((i) => i.origem === "ingestao").length,
      ia: fila.filter((i) => i.origem === "ia").length,
      denuncia: fila.filter((i) => i.origem === "denuncia").length,
    },
    itensComScore: scores.length,
    scoreMinimo: Math.min(...scores),
    scoreMaximo: Math.max(...scores),
    componentesDoScore: COMPONENTES_DO_SCORE.length,
    escopos: {
      nacional: ESCOPOS_DE_CURADORIA[0].alcance,
      territorial: ESCOPOS_DE_CURADORIA[1].alcance,
      linguagem: ESCOPOS_DE_CURADORIA[2].alcance,
    },
    acoes: ACOES_DA_MODERACAO.length,
    acoesQueExigemMotivo: ACOES_DA_MODERACAO.filter((a) => a.motivo === "obrigatorio").length,
    limitesDaIa: LIMITES_DA_IA.length,
    itensComUf: fila.filter((i) => i.uf !== null).length,
    ufsNaFila: new Set(fila.map((i) => i.uf).filter(Boolean)).size,
    motivosDeDenuncia: MOTIVOS_DE_DENUNCIA.length,
    registrosVivos: 0,
    bytesDoDto: bytes,
    tetoDoDto: TETO_DO_DTO,
  };
  return numerosMemo;
}
