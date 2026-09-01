/**
 * admin-equipe.ts, quem tem acesso ao quê.
 *
 * ZERO IMPORT DE DADO. Quem consulta este módulo é a tela da equipe, que é de cliente;
 * `admin-area.ts` alcança o grafo de 24 MB em um salto e não pode entrar nessa cadeia
 * (DP-F). Aqui só há nome, papel e permissão.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O QUADRO É AUTORADO, e a tela diz isso. O produto tem três personas, e elas são de
 * demonstração do app, não um quadro de funcionários; não existe no acervo uma lista de
 * quem trabalha no Itaú Cultural, e inventar uma com nome de gente real seria a mesma linha
 * que este produto se recusa a cruzar ao não autorar elenco. Então os doze nomes abaixo são
 * declaradamente inventados, com procedência «autorado», como o manual da casa exige para
 * todo dado que não veio da Enciclopédia.
 *
 * O QUE NÃO É INVENTADO são os PAPÉIS e o que cada um alcança: os cinco papéis são os de
 * `papel.tsx`, e as superfícies de cada um são as que aquele arquivo já declara. A tela
 * mostra a permissão real do produto, com nomes de exemplo em cima.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Os cinco papéis do produto, repetidos como união para não importar o contexto. */
export type PapelDaEquipe = "publico" | "produtor" | "moderacao" | "observatorio" | "admin";

export const PAPEIS_DA_EQUIPE: readonly PapelDaEquipe[] = [
  "admin",
  "moderacao",
  "observatorio",
  "produtor",
  "publico",
];

export const ROTULO_DO_PAPEL: Record<PapelDaEquipe, string> = {
  publico: "Público",
  produtor: "Produtor",
  moderacao: "Moderação",
  observatorio: "Observatório",
  admin: "Administração",
};

/** Uma linha do que o papel dá, em português, para a subtela poder listar. */
export const O_QUE_O_PAPEL_DA: Record<PapelDaEquipe, readonly string[]> = {
  publico: ["O aplicativo, como qualquer pessoa"],
  produtor: ["O aplicativo", "O Studio: as onze pautas e as fichas delas"],
  moderacao: ["O aplicativo", "A Moderação: a fila e as decisões"],
  observatorio: ["O aplicativo", "O Observatório: os painéis de medida"],
  admin: [
    "O aplicativo",
    "A Administração: editar, mover, suspender e apagar qualquer coisa",
    "O Studio, a Moderação, a Redação, o Observatório e o roteiro guiado",
  ],
};

/**
 * As onze pautas do Studio, e o que cada uma alimenta.
 *
 * É A MESMA TABELA de `DESCRICAO_DA_PAUTA`, reescrita aqui como texto para não arrastar o
 * módulo do Produtor para dentro da tela de equipe. Uma divergência entre as duas seria uma
 * pauta a mais ou a menos na subtela, e `sonda-admin-equipe` confere as onze.
 */
export const PAUTAS_DA_EQUIPE: readonly { id: string; rotulo: string; alimenta: string }[] = [
  { id: "agenda", rotulo: "Agenda", alimenta: "Acontece" },
  { id: "play", rotulo: "Play", alimenta: "Play" },
  { id: "cast", rotulo: "Cast", alimenta: "Cast" },
  { id: "museu", rotulo: "Museu", alimenta: "Museu" },
  { id: "cursos", rotulo: "Cursos", alimenta: "Cursos" },
  { id: "editorial", rotulo: "Editorial", alimenta: "Notícias" },
  { id: "curadoria", rotulo: "Curadoria", alimenta: "Descobrir" },
  { id: "programa", rotulo: "Programa", alimenta: "Acontece" },
  { id: "editais", rotulo: "Editais", alimenta: "nenhuma tela pública" },
  { id: "espacos", rotulo: "Espaços", alimenta: "Mapa" },
  { id: "midia", rotulo: "Mídia", alimenta: "nenhuma tela pública" },
];

export interface PessoaDaEquipe {
  id: string;
  nome: string;
  /** O que a pessoa faz, numa linha. */
  funcao: string;
  papel: PapelDaEquipe;
  /** AAAA-MM-DD. Determinístico, nunca o relógio de quem abre. */
  desde: string;
  /** As pautas que este produtor publica. Vazio para quem não é produtor. */
  pautas: readonly string[];
}

/**
 * O quadro, autorado.
 *
 * OS NOMES SÃO SÓ PRIMEIROS NOMES, e isso é deliberado: um nome completo se parece com uma
 * pessoa real, e nenhuma destas é. A tela declara a procedência em voz alta.
 */
export const EQUIPE_SEMEADA: readonly PessoaDaEquipe[] = [
  {
    id: "eq-01",
    nome: "Maria",
    funcao: "Coordenação de plataforma",
    papel: "admin",
    desde: "2024-02-05",
    pautas: [],
  },
  {
    id: "eq-02",
    nome: "Joana",
    funcao: "Curadoria de programação",
    papel: "produtor",
    desde: "2024-03-18",
    pautas: ["agenda", "programa", "curadoria"],
  },
  {
    id: "eq-03",
    nome: "Rafael",
    funcao: "Moderação de comunidades",
    papel: "moderacao",
    desde: "2024-06-01",
    pautas: [],
  },
  {
    id: "eq-04",
    nome: "Bia",
    funcao: "Produção de vídeo e podcast",
    papel: "produtor",
    desde: "2024-08-12",
    pautas: ["play", "cast", "midia"],
  },
  {
    id: "eq-05",
    nome: "Caio",
    funcao: "Editorial e notícias",
    papel: "produtor",
    desde: "2025-01-20",
    pautas: ["editorial"],
  },
  {
    id: "eq-06",
    nome: "Lúcia",
    funcao: "Acervo e museu",
    papel: "produtor",
    desde: "2025-02-10",
    pautas: ["museu", "espacos"],
  },
  {
    id: "eq-07",
    nome: "Téo",
    funcao: "Moderação da fila",
    papel: "moderacao",
    desde: "2025-04-07",
    pautas: [],
  },
  {
    id: "eq-08",
    nome: "Nina",
    funcao: "Indicadores e relatórios",
    papel: "observatorio",
    desde: "2025-05-19",
    pautas: [],
  },
  {
    id: "eq-09",
    nome: "Otávio",
    funcao: "Formação e cursos",
    papel: "produtor",
    desde: "2025-07-02",
    pautas: ["cursos", "editais"],
  },
  {
    id: "eq-10",
    nome: "Sara",
    funcao: "Atendimento e comunidade",
    papel: "publico",
    desde: "2026-01-15",
    pautas: [],
  },
  {
    id: "eq-11",
    nome: "Davi",
    funcao: "Estágio de conteúdo",
    papel: "publico",
    desde: "2026-03-03",
    pautas: [],
  },
  {
    id: "eq-12",
    nome: "Íris",
    funcao: "Administração adjunta",
    papel: "admin",
    desde: "2026-06-11",
    pautas: [],
  },
];

/** A procedência, dita na tela. */
export const PROCEDENCIA_DA_EQUIPE =
  "Quadro autorado para a demonstração: os nomes são inventados. Os papéis e o que cada um alcança são os do produto.";

/** O armazém da tela. Mesma família de `admin.acoes.v1`. */
export const CHAVE_DA_EQUIPE = "admin.equipe.v1";

export interface MudancaNaEquipe {
  papel?: PapelDaEquipe;
  pautas?: string[];
}

/** O que está gravado: só o que mudou, nunca uma cópia do quadro inteiro. */
export type SobreposicaoDaEquipe = Record<string, MudancaNaEquipe>;

/**
 * O quadro com as mudanças por cima.
 *
 * SOBREPOSIÇÃO, E NÃO CÓPIA. Gravar o quadro inteiro faria a semente congelar na versão do
 * dia em que a pessoa abriu: acrescentar alguém ao quadro depois disso não apareceria para
 * quem já tinha mexido em qualquer um. É a mesma disciplina de `loja-estado.ts`.
 */
export function equipeCom(sobre: SobreposicaoDaEquipe): PessoaDaEquipe[] {
  return EQUIPE_SEMEADA.map((p) => {
    const m = sobre[p.id];
    if (!m) return { ...p };
    return {
      ...p,
      papel: m.papel ?? p.papel,
      pautas: m.pautas ?? p.pautas,
    };
  });
}
