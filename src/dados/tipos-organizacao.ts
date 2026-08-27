/**
 * tipos-organizacao.ts, o contrato do nível 6 · Organização.
 *
 * MÓDULO DE CLIENTE-SEGURO, e isso é requisito e não acaso (DP-F): nenhum import de dado
 * sai daqui. `Acessibilidade`, `MetodoCoordenada` e `ProcedenciaDePapel` entram como
 * `import type` e somem na compilação, então nenhum byte dos 9,4 MB de `entidades.json`
 * atravessa por causa deste arquivo. É o espelho de `tipos-acesso.ts`, que a S7 escreveu
 * para o nível 7, e o que aquele arquivo já define, este NÃO redeclara: as 8 dimensões,
 * `Situacao`, as três portas e o ato de declarar vêm de lá, por import.
 *
 * POR QUE ELE EXISTE EM VEZ DE UMA EDIÇÃO EM `tipos-acesso.ts`. Aquele arquivo é da S7,
 * que está rodando agora na mesma pasta. As duas adições que a jornada da Organização
 * exige, os recursos físicos do lugar e o cadastro que converte um espaço derivado,
 * entram aqui por EXTENSÃO, sem tocar o arquivo da outra sessão. A consolidação está
 * registrada como PEDIDO-S6-01 em `.planning/estado/S6.md`.
 *
 * SEM RELÓGIO E SEM SORTEIO. Nada aqui lê `new Date()` nem `Math.random()`: o HTML
 * exportado e a página hidratada precisam coincidir.
 */

import type { Acessibilidade, MetodoCoordenada } from "./tipos";
import type { ProcedenciaDePapel } from "./tipos-acesso";
import { acessibilidadeVazia } from "./tipos-acesso";
/**
 * A normalização de título vem do ÍNDICE DE BUSCA, e não é reescrita aqui.
 *
 * Ela é a primeira parte do critério de identidade do evento, e a fila de duplicatas dispara
 * contra ela. Uma segunda implementação, ainda que «equivalente», faria o lote importado
 * gravar chave diferente da que o acervo usa, e o sintoma seria a duplicata que a máquina não
 * acha. `normalizar` é função de string sem dependência de dado: importá-la por valor no
 * cliente não arrasta byte nenhum do grafo, exatamente como `tipos-acesso.ts` já faz.
 */
import { normalizar } from "./indice";

// ---------------------------------------------------------------------------
// Os recursos físicos do lugar, PEDIDO-S6-01
// ---------------------------------------------------------------------------

/**
 * Rampa, elevador, banheiro adaptado, piso tátil e vaga reservada.
 *
 * ELES NÃO CABEM NAS 8 DIMENSÕES DE `Acessibilidade`, e é por isso que existem aqui em
 * vez de lá. As oito são de MÍDIA, audiodescrição, Libras, legenda, tradução simultânea,
 * estenotipia. Estas cinco são do LUGAR, e são as que decidem se alguém consegue chegar.
 * Enfiar rampa dentro de `closed_caption` seria fabricar classificação: o mesmo erro que
 * o projeto recusou quando promoveu quatro linguagens em vez de mapear «Rádio →
 * audiovisual».
 *
 * A lista é fechada de propósito. Um campo de texto livre aqui produziria «rampa»,
 * «rampa de acesso» e «acesso por rampa» como três recursos diferentes, e a busca por
 * espaço acessível passaria a depender de como cada organização escreveu.
 */
export const RECURSOS_FISICOS = [
  "rampa",
  "elevador",
  "banheiro_adaptado",
  "piso_tatil",
  "vaga_reservada",
] as const;

export type RecursoFisico = (typeof RECURSOS_FISICOS)[number];

export const ROTULO_DO_RECURSO: Record<RecursoFisico, string> = {
  rampa: "rampa de acesso",
  elevador: "elevador",
  banheiro_adaptado: "banheiro adaptado",
  piso_tatil: "piso tátil",
  vaga_reservada: "vaga reservada",
};

export type RecursosFisicos = Record<RecursoFisico, boolean>;

export function recursosFisicosVazios(): RecursosFisicos {
  return {
    rampa: false,
    elevador: false,
    banheiro_adaptado: false,
    piso_tatil: false,
    vaga_reservada: false,
  };
}

// ---------------------------------------------------------------------------
// A ficha do espaço, as 8 de mídia MAIS as 5 do lugar, com UM ato
// ---------------------------------------------------------------------------

/**
 * A ficha completa de um espaço.
 *
 * `declarada` registra O ATO DE PREENCHER, não o conteúdo, a mesma disciplina de
 * `declaraAcessibilidade` em `Entidade` (§10 da ontologia). Treze booleanos em `false`
 * significam «não oferece» e «não declarou» ao mesmo tempo, e é essa ambiguidade que o
 * campo separado existe para desfazer.
 *
 * UM ATO PARA AS DUAS METADES, e não dois. A pergunta que o ato responde é «esta ficha
 * foi preenchida?», e ela é uma só: quem declara que o espaço não tem rampa está no mesmo
 * gesto declarando que preencheu a ficha do espaço. Dois atos separados criariam um
 * quarto estado, «declarou o lugar mas não a mídia», que nenhuma tela do produto sabe
 * exibir.
 */
export interface AcessibilidadeDeEspaco {
  dimensoes: Acessibilidade;
  fisicos: RecursosFisicos;
  declarada: boolean;
}

export function acessibilidadeDeEspacoVazia(): AcessibilidadeDeEspaco {
  return { dimensoes: acessibilidadeVazia(), fisicos: recursosFisicosVazios(), declarada: false };
}

export function algumRecursoMarcado(f: RecursosFisicos): boolean {
  return RECURSOS_FISICOS.some((r) => f[r]);
}

/**
 * O ato, escrito uma vez.
 *
 * SEM SUJEITO NA FRASE, e é decisão: o mesmo ato serve o espaço e a instituição, e «este
 * espaço» no botão da tela de instituição afirmaria a coisa errada. O sujeito vem do título
 * do painel, que já diz de quem é a ficha. É a redação de §10 da ontologia, palavra por
 * palavra, duas telas com duas redações do mesmo ato fariam parecer que são dois atos.
 */
export const FRASE_DO_ATO =
  "Declaro que não oferece nenhum destes recursos.";

/** Por que o ato tem peso igual ao de salvar, dito para quem opera a tela. */
export const POR_QUE_O_ATO =
  "Sem este botão, treze caixas desmarcadas seriam lidas como «não declarou», e a " +
  "plataforma se proibiu de interpretar silêncio. Declarar que não oferece é uma " +
  "informação; deixar em branco não é.";

// ---------------------------------------------------------------------------
// A conversão de procedência, o que a O2 existe para fazer
// ---------------------------------------------------------------------------

/**
 * A procedência que a Organização carimba.
 *
 * ESCOLHA REGISTRADA, NÃO INVENTADA. `Procedencia` tem hoje três valores (`ic`,
 * `derivado`, `autorado`) e o PRD §6 prevê seis em produção: os três mais `parceiro`,
 * `produtor`, `ia` e `curador`. Nenhum deles se chama «organização», e acrescentar um
 * sexto valor seria mudança de ontologia, que esta sessão não faz sozinha.
 *
 * Entre os que existem, `parceiro` é o único que descreve uma instituição escrevendo em
 * nome próprio: `produtor` é o nível 7, `curador` é o nível 5 e `ia` é máquina. A escolha
 * está registrada como PEDIDO-S6-05, se a resposta for outra, muda esta constante e
 * nada mais, porque nenhuma tela escreve o valor à mão.
 */
export const PROCEDENCIA_DA_ORGANIZACAO: ProcedenciaDePapel = "parceiro";

/** O que o selo de conversão afirma, dito para quem confere. */
export const FRASE_DA_CONVERSAO =
  "Um espaço derivado foi INFERIDO por regra a partir de um texto do acervo. Um espaço " +
  "cadastrado foi DECLARADO por quem responde por ele. A tela mostra a passagem de um " +
  "para o outro porque é ela, e não o número de campos preenchidos, que muda o que a " +
  "plataforma pode afirmar.";

// ---------------------------------------------------------------------------
// A coordenada continua derivada, a regra dura desta tela
// ---------------------------------------------------------------------------

/**
 * O método que a coordenada assume DEPOIS que a organização cadastra o endereço.
 *
 * NÃO EXISTE LATITUDE DIGITADA, e essa é a regra mais fácil de quebrar sem perceber: um
 * campo «lat/lon» no formulário pareceria completude e produziria coordenada `autorado`,
 * que o tipo `Coordenada` PROÍBE, `procedencia` ali é o literal `"derivado"`, não um
 * enum. O que o endereço muda é o MÉTODO: um espaço sem endereço é posicionado por
 * deslocamento em torno da cidade; com endereço, o centroide do município passa a ser
 * a derivação declarada.
 *
 * Continua sendo derivação, e a tela diz que continua. Geocodificar de verdade exigiria
 * serviço externo, que o protótipo não tem, e fingir que tem seria pior do que não ter.
 */
export const METODO_APOS_ENDERECO: MetodoCoordenada = "centroide-municipio";

export const FRASE_DA_COORDENADA =
  "A coordenada continua `derivado` depois do cadastro, e isso não é limitação do " +
  "protótipo: o tipo `Coordenada` fixa `procedencia: \"derivado\"` como literal. O que o " +
  "endereço muda é o MÉTODO da derivação, que a tela mostra ao lado do ponto. Latitude " +
  "digitada não existe em lugar nenhum deste produto.";

// ---------------------------------------------------------------------------
// O cadastro, o que a organização escreve por cima do espaço derivado
// ---------------------------------------------------------------------------

/**
 * O que a Organização acrescenta a um espaço do acervo.
 *
 * Note o que NÃO está aqui: `titulo`, `cidade`, `estado` e `resumo` continuam vindo do
 * acervo. A O2 não reescreve o que o Itaú Cultural já publicou, ela DECLARA o que
 * faltava. Um formulário que deixasse editar o título produziria, na primeira
 * regeração do grafo, dois nomes para o mesmo lugar e um par novo na fila de duplicatas.
 */
export interface CadastroDeEspaco {
  espacoId: string;
  /** Logradouro e número. Texto, porque é o que a organização tem, não é geocódigo. */
  endereco: string;
  bairro: string;
  /** Lotação declarada. `null` enquanto ninguém declarou, nunca `0`, que seria «cabe
   *  ninguém» e é uma afirmação diferente de «não sei». */
  capacidade: number | null;
  acessibilidade: AcessibilidadeDeEspaco;
  /** Quem cadastrou. Nunca anônimo: §3 da ontologia diz que nenhum papel escreve sem
   *  deixar autor, admin incluído. */
  autor: string;
  /** `DATA_DE_REFERENCIA`, vinda do servidor. Nunca o relógio do navegador. */
  quando: string;
}

/** Os campos que fazem o espaço deixar de ser inferência. Sem endereço não há cadastro:
 *  o resto do formulário pode ficar vazio e o espaço continua declarado, mas um cadastro
 *  sem endereço não acrescenta nada ao que a derivação já tinha. */
export function cadastrado(c: CadastroDeEspaco | undefined): boolean {
  return c !== undefined && c.endereco.trim().length > 0;
}

// ---------------------------------------------------------------------------
// O que falta, NOMEADO, o padrão da coluna da direita
// ---------------------------------------------------------------------------

/**
 * Uma falta, com dono.
 *
 * `bloqueia` separa o que impede a publicação do que só diminui a qualidade do registro,
 * e a distinção é do produto: crédito de imagem bloqueia (165); ficha de acessibilidade
 * incompleta não. `dono` nomeia o nível responsável quando a falta depende de outro nível
 *, §8 da ontologia proíbe beco sem saída, e uma pendência sem dono é exatamente isso.
 */
export interface Falta {
  texto: string;
  bloqueia: boolean;
  dono: string | null;
}

/**
 * O que falta num espaço, na ordem em que a tela mostra.
 *
 * A ordem é a do impacto, e não a do formulário: quem abre a coluna da direita precisa
 * ver primeiro o que impede o espaço de servir para alguma coisa. Endereço primeiro
 * porque sem ele o cadastro não existe; a ficha depois, porque é a que o app público lê.
 */
export function faltasDoEspaco(
  c: CadastroDeEspaco | undefined,
  declaraNoAcervo: boolean,
): Falta[] {
  const saida: Falta[] = [];

  if (!cadastrado(c)) {
    saida.push({
      texto: "endereço, sem ele o espaço continua sendo inferência do acervo",
      bloqueia: true,
      dono: null,
    });
  }
  if (c && c.bairro.trim().length === 0) {
    saida.push({ texto: "bairro", bloqueia: false, dono: null });
  }
  if (c && c.capacidade === null) {
    saida.push({ texto: "capacidade declarada", bloqueia: false, dono: null });
  }
  if (!c?.acessibilidade.declarada && !declaraNoAcervo) {
    saida.push({
      texto:
        "ficha de acessibilidade, nem os recursos, nem o ato de declarar que não oferece",
      bloqueia: false,
      dono: null,
    });
  }
  saida.push({
    texto: "verificação da organização, o estado é do Admin, e esta tela encaminha",
    bloqueia: false,
    dono: "Admin (92)",
  });

  return saida;
}

// ---------------------------------------------------------------------------
// A instituição, O1, e ela HERDA o padrão do espaço
// ---------------------------------------------------------------------------

/**
 * O estado da verificação da instituição (funcionalidade 141).
 *
 * TRÊS VALORES, E O TERCEIRO É O PONTO. `nao-verificada` é onde estão as 246 hoje;
 * `solicitada` é o que ESTA tela produz; `verificada` é o que só o Admin (92) escreve. A
 * Organização **não se verifica**, se verificasse, a verificação não valeria nada, porque
 * quem responde pelo dado estaria atestando o próprio dado. A tela encaminha e mostra o
 * estado; ela não decide.
 */
export type EstadoDaVerificacao = "nao-verificada" | "solicitada" | "verificada";

export const ROTULO_DA_VERIFICACAO: Record<EstadoDaVerificacao, string> = {
  "nao-verificada": "não verificada",
  solicitada: "verificação solicitada",
  verificada: "verificada",
};

export const QUEM_VERIFICA =
  "Quem verifica é o Admin (92), e não a própria organização: uma instituição que " +
  "atestasse a si mesma produziria um selo que não afirma nada. Esta tela encaminha o " +
  "pedido, mostra o que falta para ele ser aceito, e para aí.";

/**
 * O que a Organização escreve na própria ficha institucional.
 *
 * A ACESSIBILIDADE É A MESMA ESTRUTURA DO ESPAÇO, e isso é reuso e não preguiça: uma
 * instituição também é um lugar onde se entra, e rampa, elevador e banheiro adaptado
 * significam ali exatamente o que significam no espaço. Um segundo tipo com os mesmos treze
 * campos faria a mesma pergunta ter duas respostas possíveis no mesmo produto.
 *
 * Note o que NÃO está aqui, de novo: `titulo`, `resumo`, `linguagens` e `fonte` continuam
 * vindo da Enciclopédia. As 246 instituições são 100% `ic`, elas já existem, com verbete
 * escrito. A O1 não reescreve o verbete: ela declara o que o verbete não tem.
 */
export interface CadastroDeInstituicao {
  instituicaoId: string;
  /** Como falar com quem responde. Um campo e não três: e-mail, telefone e site cabem no
   *  mesmo texto, e três campos vazios pesam mais na tela do que um. */
  contato: string;
  endereco: string;
  /** O crédito que falta nas imagens sem ele. Crédito é bloqueante (165). */
  creditoImagem: string;
  acessibilidade: AcessibilidadeDeEspaco;
  verificacao: EstadoDaVerificacao;
  autor: string;
  quando: string;
}

/** O que a instituição precisa ter para o pedido de verificação fazer sentido. Não é
 *  validação de formulário: é a lista que o Admin vai olhar, mostrada ANTES de pedir. */
export function faltasDaInstituicao(
  c: CadastroDeInstituicao | undefined,
  temImagem: boolean,
  temCreditoNoAcervo: boolean,
  declaraNoAcervo: boolean,
): Falta[] {
  const saida: Falta[] = [];

  if (!c || c.endereco.trim().length === 0) {
    saida.push({
      texto: "endereço, nenhuma das 246 instituições tem coordenada, e sem lugar ela não aparece no mapa",
      bloqueia: false,
      dono: null,
    });
  }
  if (!c || c.contato.trim().length === 0) {
    saida.push({ texto: "contato de quem responde pela instituição", bloqueia: false, dono: null });
  }
  if (temImagem && !temCreditoNoAcervo && (!c || c.creditoImagem.trim().length === 0)) {
    saida.push({
      texto: "crédito da imagem, a imagem existe e o crédito não, e crédito é bloqueante (165)",
      bloqueia: true,
      dono: null,
    });
  }
  if (!c?.acessibilidade.declarada && !declaraNoAcervo) {
    saida.push({
      texto: "ficha de acessibilidade, nem os recursos, nem o ato de declarar que não oferece",
      bloqueia: false,
      dono: null,
    });
  }
  saida.push({
    texto:
      c?.verificacao === "solicitada"
        ? "a verificação está com o Admin, a organização não se verifica"
        : "verificação ainda não solicitada",
    bloqueia: false,
    dono: "Admin (92)",
  });

  return saida;
}

// ---------------------------------------------------------------------------
// As dez telas, a navegação da superfície
// ---------------------------------------------------------------------------

/**
 * As dez telas do nível 6, na ordem em que fazem sentido para quem opera.
 *
 * POR QUE A NAVEGAÇÃO MORA AQUI e não na raiz do Studio. `/studio/page.tsx` é da S7 ·
 * Produtor, que divide esta pasta com a Organização e está rodando em paralelo. Editar a
 * raiz dela seria invadir território; então cada tela desta sessão carrega a navegação no
 * próprio cabeçalho, como a Redação faz. O acréscimo na raiz está registrado como
 * PEDIDO-S6-03 e é commit da S7.
 *
 * `pronta` NÃO É DECORAÇÃO. Uma tela que ainda não existe vira link para 404, e um 404 no
 * meio de uma demonstração ao vivo é pior do que um item apagado, porque quem clicou já
 * perdeu o lugar. Enquanto `pronta` for `false`, o item aparece nomeado e desabilitado: a
 * pessoa vê que a superfície tem dez telas e vê quais já respondem. A bandeira vira `true`
 * no MESMO commit que cria a rota.
 */
export interface TelaDaOrganizacao {
  id: string;
  rotulo: string;
  rota: string;
  /** O que a tela resolve, em uma linha. Vira `title`, quem passa o cursor descobre. */
  objetivo: string;
  pronta: boolean;
}

export const TELAS_DA_ORGANIZACAO: readonly TelaDaOrganizacao[] = [
  {
    id: "instituicao",
    rotulo: "Instituição",
    rota: "/studio/instituicao",
    objetivo: "A identidade que responde pelo que a organização publica",
    pronta: true,
  },
  {
    id: "espacos",
    rotulo: "Espaços",
    rota: "/studio/espacos",
    objetivo: "Onde o espaço deixa de ser inferência e passa a ser cadastro",
    pronta: true,
  },
  {
    id: "equipe",
    rotulo: "Equipe",
    rota: "/studio/equipe",
    objetivo: "Quem publica em nome da organização, e com qual alçada",
    pronta: true,
  },
  {
    id: "midia",
    rotulo: "Mídia",
    rota: "/studio/midia",
    objetivo: "O acervo de ativos, com crédito bloqueante e direito declarado",
    pronta: true,
  },
  {
    id: "programa",
    rotulo: "Programa",
    rota: "/studio/programa",
    objetivo: "A camada acima do evento, a única classe com zero instâncias",
    pronta: true,
  },
  {
    id: "formacao",
    rotulo: "Formação",
    rota: "/studio/formacao",
    objetivo: "Cursos, biblioteca e a agenda de visita educativa",
    pronta: true,
  },
  {
    id: "editais",
    rotulo: "Editais",
    rota: "/studio/editais",
    objetivo: "A funcionalidade que não tinha classe nem módulo",
    pronta: true,
  },
  {
    id: "integracao",
    rotulo: "Integração",
    rota: "/studio/integracao",
    objetivo: "Importar em lote sem digitar duas vezes",
    pronta: true,
  },
  {
    id: "alcance",
    rotulo: "Alcance",
    rota: "/studio/alcance",
    objetivo: "O retorno para quem publica, sem número que o acervo não sustenta",
    pronta: true,
  },
  {
    id: "conformidade",
    rotulo: "Conformidade",
    rota: "/studio/conformidade",
    objetivo: "A fila dos próprios produtores, que a organização não via",
    pronta: true,
  },
];

// ---------------------------------------------------------------------------
// A equipe e as alçadas, O7, e a forma é NOVA
// ---------------------------------------------------------------------------

/**
 * O que um colaborador pode fazer DENTRO da organização.
 *
 * VOCABULÁRIO FECHADO, e o que ele não tem é tão importante quanto o que tem: **nenhuma
 * alçada desta lista promove ninguém a moderador, editor ou admin.** A Organização concede
 * dentro dela; conceder entre níveis é do Admin, e a diferença é o que impede uma
 * instituição de se dar poderes de governança da plataforma. Um campo de texto livre aqui
 * produziria «publicar», «pode publicar» e «publicação» como três alçadas diferentes.
 */
export const ALCADAS = [
  "rascunhar",
  "publicar",
  "gerir_espacos",
  "subir_midia",
  "gerir_equipe",
] as const;

export type Alcada = (typeof ALCADAS)[number];

export const ROTULO_DA_ALCADA: Record<Alcada, string> = {
  rascunhar: "rascunhar",
  publicar: "publicar direto",
  gerir_espacos: "gerir espaços",
  subir_midia: "subir mídia",
  gerir_equipe: "gerir a equipe",
};

/** O que cada alçada permite, para quem está concedendo. Um rótulo sozinho faz quem
 *  concede adivinhar, e quem adivinha concede demais. */
export const EXPLICACAO_DA_ALCADA: Record<Alcada, string> = {
  rascunhar: "Cria e edita registros, e para aí. Nada que ela escreve sai do Studio sozinho.",
  publicar: "Envia o registro à moderação em nome da organização. É a alçada que assina.",
  gerir_espacos: "Cadastra e edita os espaços da organização, a ficha que a ocorrência herda.",
  subir_midia: "Acrescenta mídia ao acervo da organização, com o crédito obrigatório junto.",
  gerir_equipe: "Convida, remove e concede alçada. Só o titular a tem, e ela não se concede.",
};

export const LIMITE_DA_ALCADA =
  "Nenhuma destas cinco promove ninguém a moderador, editor ou admin. A Organização concede " +
  "DENTRO dela; conceder entre níveis é do Admin (87), e é essa fronteira que impede uma " +
  "instituição de se dar poderes de governança da plataforma.";

/** Onde o vínculo está. `removido` não some da lista: quem saiu continua no histórico, e o
 *  que ele publicou continua publicado, é exatamente o que a tela existe para provar. */
export type EstadoDoVinculo = "convidado" | "ativo" | "removido";

export const ROTULO_DO_VINCULO: Record<EstadoDoVinculo, string> = {
  convidado: "convite enviado",
  ativo: "ativo",
  removido: "removido",
};

export interface Colaborador {
  id: string;
  /** Papel na organização, não nome de pessoa. Ver `COLABORADORES_AUTORADOS`. */
  nome: string;
  email: string;
  alcadas: Alcada[];
  estado: EstadoDoVinculo;
  /** Quem responde pela organização. Exatamente um por vez, e a troca é explícita. */
  titular: boolean;
  autor: string;
  quando: string;
}

/** Uma linha do histórico da equipe. Toda concessão, remoção e sucessão gera uma, sem
 *  autor e sem carimbo, «a alçada mudou» não é registro, é rumor. */
export interface EntradaDeEquipe {
  quando: string;
  autor: string;
  texto: string;
}

export const EQUIPE_E_AUTORADA =
  "Os vínculos desta tela são autorados para a demonstração: não há autenticação real no " +
  "protótipo, e o acervo do Itaú Cultural não publica quadro de pessoal. Os perfis são " +
  "PAPÉIS e não pessoas, usar as 575 pessoas reais da Enciclopédia como colaboradoras " +
  "fabricaria um vínculo de emprego que ninguém declarou.";

/**
 * A equipe com que a demonstração abre.
 *
 * PAPÉIS, NUNCA NOMES. O acervo tem 575 pessoas reais, e vincular qualquer uma delas a uma
 * instituição como «colaboradora» seria afirmar um fato sobre uma pessoa real que a fonte
 * não afirma. Nomes inventados teriam o problema oposto e igualmente ruim: pareceriam dado.
 * A saída é a mesma que a casa já usa em `OPERADOR_DO_STUDIO`, o papel é o nome.
 *
 * Os quatro cobrem as combinações que a tela precisa mostrar: o titular, um que publica, um
 * que só rascunha, e um convite ainda não aceito.
 */
export function equipeAutorada(autor: string, quando: string): Colaborador[] {
  return [
    {
      id: "colab-1",
      nome: autor,
      email: "gestao@exemplo.org",
      alcadas: ["rascunhar", "publicar", "gerir_espacos", "subir_midia", "gerir_equipe"],
      estado: "ativo",
      titular: true,
      autor,
      quando,
    },
    {
      id: "colab-2",
      nome: "Produção de programação (perfil autorado)",
      email: "producao@exemplo.org",
      alcadas: ["rascunhar", "publicar", "subir_midia"],
      estado: "ativo",
      titular: false,
      autor,
      quando,
    },
    {
      id: "colab-3",
      nome: "Educativo (perfil autorado)",
      email: "educativo@exemplo.org",
      alcadas: ["rascunhar"],
      estado: "ativo",
      titular: false,
      autor,
      quando,
    },
    {
      id: "colab-4",
      nome: "Comunicação (perfil autorado)",
      email: "comunicacao@exemplo.org",
      alcadas: ["rascunhar", "subir_midia"],
      estado: "convidado",
      titular: false,
      autor,
      quando,
    },
  ];
}

/**
 * O titular pode ser removido?
 *
 * NÃO, E É A REGRA INTEIRA DA TELA. A funcionalidade 140 existe porque a pessoa sai e a
 * instituição fica: se remover o titular fosse possível, a organização perderia o dono por
 * ABANDONO, ninguém responderia por ela, e o perfil ficaria órfão exatamente como o
 * estagiário que leva o cadastro embora. A sucessão é o único caminho, e ela é explícita,
 * com autor e carimbo.
 */
export function podeRemover(c: Colaborador): boolean {
  return !c.titular && c.estado !== "removido";
}

export const POR_QUE_A_SUCESSAO =
  "A titularidade se transfere; ela não se abandona. Remover o titular deixaria a " +
  "organização sem quem responde por ela, e o perfil ficaria órfão, que é exatamente o " +
  "problema que esta tela existe para impedir. Por isso o botão de remover não existe para " +
  "o titular: primeiro se transfere, depois se remove.";

export function faltasDaEquipe(equipe: Colaborador[]): Falta[] {
  const saida: Falta[] = [];
  const ativos = equipe.filter((c) => c.estado === "ativo");
  const convidados = equipe.filter((c) => c.estado === "convidado");

  if (!equipe.some((c) => c.titular && c.estado === "ativo")) {
    saida.push({
      texto: "a organização está sem titular ativo, ninguém responde por ela",
      bloqueia: true,
      dono: null,
    });
  }
  if (!ativos.some((c) => c.alcadas.includes("publicar"))) {
    saida.push({
      texto: "ninguém com alçada de publicar, a organização não consegue enviar à moderação",
      bloqueia: true,
      dono: null,
    });
  }
  if (!ativos.some((c) => c.alcadas.includes("gerir_espacos"))) {
    saida.push({
      texto: "ninguém com alçada de gerir espaços, a porta que o produtor usa fica sem dono",
      bloqueia: false,
      dono: null,
    });
  }
  if (convidados.length > 0) {
    saida.push({
      texto: `${convidados.length === 1 ? "1 convite ainda não aceito" : `${convidados.length} convites ainda não aceitos`}`,
      bloqueia: false,
      dono: null,
    });
  }
  saida.push({
    texto: "promover alguém a moderador ou editor, não é desta tela",
    bloqueia: false,
    dono: "Admin (87)",
  });

  return saida;
}

// ---------------------------------------------------------------------------
// A mídia, O5. Ficha técnica e direito de distribuição, as duas formas novas
// ---------------------------------------------------------------------------

/**
 * O formato do ativo. Vocabulário fechado, e ele NÃO é derivado da categoria do acervo.
 *
 * Seria fácil mapear «podcasts → áudio» e «videos → vídeo» e preencher os 529 de uma vez.
 * Seria também uma inferência apresentada como declaração: `categoria` é onde o CMS
 * publica o item, não o que o arquivo é, «séries» tem vídeo e tem texto. O formato é campo
 * que a organização DECLARA, e enquanto ninguém declarou a tela diz que ninguém declarou.
 */
export const FORMATOS_DE_MIDIA = ["audio", "video", "texto", "imagem"] as const;
export type FormatoDeMidia = (typeof FORMATOS_DE_MIDIA)[number];

export const ROTULO_DO_FORMATO: Record<FormatoDeMidia, string> = {
  audio: "áudio",
  video: "vídeo",
  texto: "texto",
  imagem: "imagem",
};

/** Um capítulo do ativo. `inicio` é texto e não segundos porque quem preenche digita
 *  «12:30», e converter na entrada esconderia o erro de digitação até a hora de tocar. */
export interface CapituloDeMidia {
  titulo: string;
  inicio: string;
}

/**
 * A ficha técnica, a lacuna que destrava «player com retomada» (26).
 *
 * Sem duração declarada não há barra de progresso honesta, e sem capítulo não há retomada
 * que signifique alguma coisa: retomar aos 43% de um podcast de duas horas é retomar no
 * meio de uma frase. É por isso que a funcionalidade 26 está «não sustentada» e não
 * «faltando», o que falta é dado, não tela.
 */
export interface FichaTecnicaDeMidia {
  duracao: string;
  formato: FormatoDeMidia | null;
  capitulos: CapituloDeMidia[];
}

export function fichaTecnicaVazia(): FichaTecnicaDeMidia {
  return { duracao: "", formato: null, capitulos: [] };
}

/**
 * O direito de distribuição, item a item, a lacuna que destrava «download e offline» (30).
 *
 * `declarado` EXISTE PELO MESMO MOTIVO DE `declaraAcessibilidade`, e a repetição é
 * deliberada: dois booleanos em `false` significam «não permite» e «ninguém declarou» ao
 * mesmo tempo, e distribuir um ativo porque ninguém disse que não seria a leitura mais cara
 * que este produto poderia fazer de um silêncio. Um item sem direito declarado não baixa.
 */
export interface DireitoDeDistribuicao {
  permiteOffline: boolean;
  permiteIncorporar: boolean;
  /** Quem detém o direito. Texto, porque o titular pode não estar no grafo. */
  titular: string;
  declarado: boolean;
}

export function direitoVazio(): DireitoDeDistribuicao {
  return { permiteOffline: false, permiteIncorporar: false, titular: "", declarado: false };
}

export const FRASE_DO_DIREITO =
  "Enquanto o direito não for declarado, o item não baixa e não é incorporado, e a razão " +
  "não é cautela jurídica genérica: é a mesma regra da acessibilidade. Dois booleanos em " +
  "«false» significam «não permite» e «ninguém declarou» ao mesmo tempo, e tratar silêncio " +
  "como permissão é a leitura mais cara que este produto poderia fazer.";

export const POR_QUE_OFFLINE_IMPORTA =
  "Offline é onde a falta mais dói, e o acervo diz por quê: a maior parte das mídias é " +
  "podcast, e podcast é o formato que mais se ouve sem rede, no ônibus, no metrô, na rua.";

/** O que a Organização escreve sobre um ativo do acervo. */
export interface CadastroDeMidia {
  midiaId: string;
  /** O crédito que falta nos itens sem ele. Bloqueante (165). */
  creditoImagem: string;
  fichaTecnica: FichaTecnicaDeMidia;
  direito: DireitoDeDistribuicao;
  /** As 8 dimensões, com o mesmo ato, mídia é onde elas nasceram. */
  acessibilidade: AcessibilidadeDeEspaco;
  autor: string;
  quando: string;
}

/** Um item publica? Crédito é a única condição bloqueante, as outras faltas diminuem o
 *  que o item entrega, e não o direito de ele existir no acervo. */
export function midiaPublica(
  creditoNoAcervo: string | null,
  cadastro: CadastroDeMidia | undefined,
): boolean {
  return Boolean(creditoNoAcervo) || (cadastro?.creditoImagem.trim().length ?? 0) > 0;
}

export function faltasDaMidia(
  creditoNoAcervo: string | null,
  cadastro: CadastroDeMidia | undefined,
): Falta[] {
  const saida: Falta[] = [];

  if (!midiaPublica(creditoNoAcervo, cadastro)) {
    saida.push({
      texto: "crédito, nenhuma mídia publica sem crédito (165), e esta não publica",
      bloqueia: true,
      dono: null,
    });
  }
  if (!cadastro || cadastro.fichaTecnica.duracao.trim().length === 0) {
    saida.push({
      texto: "duração, sem ela não há barra de progresso honesta, e «player com retomada» (26) segue não sustentada",
      bloqueia: false,
      dono: null,
    });
  }
  if (!cadastro || cadastro.fichaTecnica.formato === null) {
    saida.push({ texto: "formato declarado, o acervo publica categoria, não formato", bloqueia: false, dono: null });
  }
  if (!cadastro || cadastro.fichaTecnica.capitulos.length === 0) {
    saida.push({
      texto: "capítulos, retomar aos 43% de um podcast de duas horas é retomar no meio de uma frase",
      bloqueia: false,
      dono: null,
    });
  }
  if (!cadastro?.direito.declarado) {
    saida.push({
      texto: "direito de distribuição, enquanto não for declarado, o item não baixa (30)",
      bloqueia: false,
      dono: null,
    });
  }
  saida.push({
    texto: "conferência dos direitos de imagem, a decisão é da fila de moderação",
    bloqueia: false,
    dono: "Moderador (114, 115)",
  });

  return saida;
}

// ---------------------------------------------------------------------------
// O programa, O3. A única classe da ontologia com ZERO instâncias
// ---------------------------------------------------------------------------

/**
 * Uma edição do programa, Rumos 2015, Rumos 2017.
 *
 * `rotulo` e não «ano»: nem toda edição é anual, e um campo numérico obrigaria «Temporada
 * 2024/2025» a virar dois registros ou uma mentira.
 */
export interface EdicaoDePrograma {
  rotulo: string;
  inicio: string;
  fim: string;
}

/**
 * O guarda-chuva acima do evento.
 *
 * `programa` EXISTE NO TIPO E NÃO EXISTE NO ACERVO, zero instâncias em 7.810 entidades. O
 * motor de caminhada a percorre e nada a popula. Por isso esta é a única tela da sessão que
 * não tem lista para editar: ela CRIA, e o que aparece nela é o que a organização criou na
 * demonstração.
 *
 * `eventoIds` aponta para eventos REAIS do acervo. É o desenho inteiro da tela: o
 * guarda-chuva é autorado, os 300 eventos embaixo dele não são, e é essa mistura que deixa
 * ver o que a classe faria se alguém a povoasse.
 */
export interface Programa {
  id: string;
  titulo: string;
  resumo: string;
  edicoes: EdicaoDePrograma[];
  eventoIds: string[];
  autor: string;
  quando: string;
}

export const PROGRAMA_TEM_ZERO =
  "«programa» é a única das 20 classes da ontologia com zero instâncias: ela existe em " +
  "`tipos.ts`, o motor de caminhada a percorre, e nada no acervo a popula. Tudo o que " +
  "aparece nesta tela foi criado aqui, agora, e os eventos reunidos embaixo, não.";

export function faltasDoPrograma(p: Programa | undefined): Falta[] {
  const saida: Falta[] = [];
  if (!p) return saida;

  if (p.titulo.trim().length === 0) {
    saida.push({ texto: "título, sem ele o programa não tem como ser referenciado", bloqueia: true, dono: null });
  }
  if (p.resumo.trim().length === 0) {
    saida.push({ texto: "resumo, é o que o app público mostra acima dos eventos reunidos", bloqueia: false, dono: null });
  }
  if (p.edicoes.length === 0) {
    saida.push({
      texto: "nenhuma edição, um programa sem edição é indistinguível de uma etiqueta",
      bloqueia: false,
      dono: null,
    });
  }
  if (p.eventoIds.length === 0) {
    saida.push({
      texto: "nenhum evento reunido, o guarda-chuva existe e não cobre nada",
      bloqueia: false,
      dono: null,
    });
  }
  saida.push({
    texto: "aprovação do programa antes de ir ao acervo público",
    bloqueia: false,
    dono: "Moderador (108)",
  });
  return saida;
}

// ---------------------------------------------------------------------------
// A formação, O4. Curso, biblioteca e a visita educativa
// ---------------------------------------------------------------------------

/**
 * O estado de uma visita educativa.
 *
 * A funcionalidade 145 é GESTÃO DE RESERVA, não publicação: uma escola pede, alguém
 * confirma ou recusa, e o número de pessoas entra na conta das vagas. Uma tela que só
 * publicasse «temos visitas educativas» seria um cartaz, e a diferença entre um cartaz e
 * uma agenda é exatamente a turma que aparece na porta sem ter lugar.
 */
export type EstadoDaVisita = "solicitada" | "confirmada" | "recusada";

export const ROTULO_DA_VISITA: Record<EstadoDaVisita, string> = {
  solicitada: "solicitada",
  confirmada: "confirmada",
  recusada: "recusada",
};

export interface VisitaEducativa {
  id: string;
  formacaoId: string;
  escola: string;
  data: string;
  horario: string;
  /** Quantas pessoas a escola traz. Entra na conta das vagas, é o que faz a agenda ser
   *  agenda. `null` é «não informou», e uma visita sem número não se confirma. */
  pessoas: number | null;
  estado: EstadoDaVisita;
  observacao: string;
  autor: string;
  quando: string;
}

/** Um material da área do educador. */
export interface MaterialDidatico {
  titulo: string;
  descricao: string;
}

export interface CadastroDeFormacao {
  formacaoId: string;
  inscricaoAberta: boolean;
  /** Lotação da oferta. `null` enquanto ninguém declarou, e sem ela nenhuma visita se
   *  confirma, porque confirmar contra um teto desconhecido é aceitar qualquer coisa. */
  vagas: number | null;
  materiais: MaterialDidatico[];
  autor: string;
  quando: string;
}

/**
 * Uma visita pode ser confirmada?
 *
 * TRÊS CONDIÇÕES, E CADA UMA VIRA UMA FRASE NA TELA. Sem vagas declaradas não há teto
 * contra o que conferir; sem número de pessoas não há o que somar; e a soma das visitas já
 * confirmadas mais esta não pode passar do teto. Confirmar sem essa conta é o que produz
 * a turma que chega e não cabe.
 */
export function porQueNaoConfirma(
  visita: VisitaEducativa,
  vagas: number | null,
  jaConfirmadas: number,
): string | null {
  if (visita.estado === "confirmada") return null;
  if (vagas === null) return "a oferta não declarou vagas, não há teto contra o que conferir";
  if (visita.pessoas === null) return "a escola não informou quantas pessoas vêm";
  if (jaConfirmadas + visita.pessoas > vagas) {
    return `não cabe: ${jaConfirmadas} já confirmadas mais ${visita.pessoas} passa das ${vagas} vagas`;
  }
  return null;
}

export const EDUCADOR_FORA_DOS_OITO =
  "O material didático é publicado aqui, mas o ACESSO do educador ficou fora dos oito " +
  "níveis desta versão: professor com turma não é público comum, e criar um nono nível " +
  "sem o resto do modelo pronto seria inventar governança. A tela declara a falta em vez " +
  "de fingir que o material é público.";

export const FORMACAO_E_O_MODELO =
  "As formações são a única classe do acervo com 100% de ficha de acessibilidade, imagem e " +
  "crédito. Elas são o modelo do que dado bem preenchido parece, e o argumento de que, " +
  "quando a fonte preenche, o produto fica melhor sem mudar uma linha de código.";

export function faltasDaFormacao(
  cadastro: CadastroDeFormacao | undefined,
  visitasPendentes: number,
): Falta[] {
  const saida: Falta[] = [];

  if (!cadastro || cadastro.vagas === null) {
    saida.push({
      texto: "vagas, sem elas nenhuma visita se confirma, porque não há teto contra o que conferir",
      bloqueia: true,
      dono: null,
    });
  }
  if (!cadastro?.inscricaoAberta) {
    saida.push({ texto: "inscrição fechada, a oferta aparece e não recebe ninguém", bloqueia: false, dono: null });
  }
  if (!cadastro || cadastro.materiais.length === 0) {
    saida.push({ texto: "nenhum material didático publicado", bloqueia: false, dono: null });
  }
  if (visitasPendentes > 0) {
    saida.push({
      texto: `${visitasPendentes} visita(s) esperando resposta, escola sem resposta remarca com outra instituição`,
      bloqueia: false,
      dono: null,
    });
  }
  saida.push({
    texto: "acesso do educador como nível próprio, fora dos oito desta versão",
    bloqueia: false,
    dono: "Admin (87)",
  });
  return saida;
}

// ---------------------------------------------------------------------------
// O edital, O6. Forma NOVA: a classe não existe em `ClasseEntidade`
// ---------------------------------------------------------------------------

/**
 * O estado do edital.
 *
 * QUATRO VALORES, E O TERCEIRO É O QUE FALTA NA MAIORIA DOS SISTEMAS. «Em julgamento» é o
 * intervalo entre encerrar a inscrição e sair o resultado, o período em que quem se
 * inscreveu mais quer saber onde está. Um edital que pula de «encerrado» para «resultado»
 * deixa esse intervalo sem nome, e quem esperou não sabe se foi esquecido.
 */
export const ESTADOS_DO_EDITAL = ["aberto", "encerrado", "em-julgamento", "resultado"] as const;
export type EstadoDoEdital = (typeof ESTADOS_DO_EDITAL)[number];

export const ROTULO_DO_EDITAL: Record<EstadoDoEdital, string> = {
  aberto: "aberto",
  encerrado: "encerrado",
  "em-julgamento": "em julgamento",
  resultado: "resultado publicado",
};

export const EXPLICACAO_DO_EDITAL: Record<EstadoDoEdital, string> = {
  aberto: "Recebendo inscrição. É o único estado em que a lista de inscritos cresce.",
  encerrado: "O prazo passou e ninguém mais se inscreve. Ainda não há julgamento.",
  "em-julgamento":
    "Encerrado e sendo avaliado. É o intervalo em que quem se inscreveu mais quer saber onde " +
    "está, e é justamente ele que costuma não ter nome nos sistemas.",
  resultado: "O resultado saiu e está publicado.",
};

export const EDITAL_E_FORMA_NOVA =
  "«edital» não existe em `ClasseEntidade`: um grep por edital em `src/dados/` não retorna " +
  "nada, e três funcionalidades do catálogo o pressupõem no grafo. A forma foi criada aqui, " +
  "por extensão aditiva, sem tocar `tipos.ts` e sem ser forçada dentro de «formacao» nem de " +
  "«programa», nenhuma das duas carrega prazo, critério estruturado nem estado de " +
  "julgamento, e enfiar edital numa delas seria fabricar classificação.";

/**
 * Uma inscrição, e o funil da funcionalidade 49.
 *
 * `viraAgente` é o ponto: quem se inscreve num edital **entra no grafo como agente**, e é
 * assim que a plataforma ganha produtor sem campanha de cadastro. O edital é a porta de
 * entrada que a proposta descreve, e ela só existe porque alguém publica o edital, e
 * ninguém publicava.
 */
export interface InscricaoNoEdital {
  id: string;
  proponente: string;
  /** Unidade federativa do proponente. Estruturada, para casar com o critério. */
  territorio: string;
  /** Id de linguagem do vocabulário controlado, não rótulo livre. */
  linguagem: string;
  viraAgente: boolean;
  autor: string;
  quando: string;
}

/**
 * O edital.
 *
 * OS CRITÉRIOS SÃO DADO ESTRUTURADO, e não texto livre. É essa escolha, e só ela, que
 * permite o casamento com o perfil do produtor (48): «edital para dança no Pará» só encontra
 * quem faz dança no Pará se «dança» e «Pará» forem valores de vocabulário dos dois lados. Um
 * campo de texto com «voltado a companhias de dança da região Norte» é legível para uma
 * pessoa e mudo para o sistema, e a funcionalidade 166, que alerta o produtor sobre edital
 * compatível, depende inteiramente disso.
 */
export interface Edital {
  id: string;
  titulo: string;
  resumo: string;
  prazo: string;
  estado: EstadoDoEdital;
  linguagens: string[];
  territorios: string[];
  publicoAlvo: string;
  inscricoes: InscricaoNoEdital[];
  autor: string;
  quando: string;
}

/** O perfil contra o qual o edital casa. É o recorte mínimo do produtor que a 48 usa. */
export interface PerfilDoProponente {
  territorio: string;
  linguagem: string;
}

export interface Casamento {
  territorioCasa: boolean;
  linguagemCasa: boolean;
  /** `true` quando o edital não recorta aquela dimensão, sem critério, tudo passa. */
  territorioAberto: boolean;
  linguagemAberto: boolean;
}

/**
 * O edital casa com este perfil?
 *
 * CRITÉRIO VAZIO É «SERVE PARA TODOS», e não «não serve para ninguém». A distinção parece
 * óbvia e é onde o casamento erra: um edital sem recorte de território é nacional, e tratá-lo
 * como sem correspondência esconderia dele exatamente os produtores que ele quer alcançar.
 */
export function casaComPerfil(e: Edital, p: PerfilDoProponente): Casamento {
  const territorioAberto = e.territorios.length === 0;
  const linguagemAberto = e.linguagens.length === 0;
  return {
    territorioAberto,
    linguagemAberto,
    territorioCasa: territorioAberto || e.territorios.includes(p.territorio),
    linguagemCasa: linguagemAberto || e.linguagens.includes(p.linguagem),
  };
}

export function faltasDoEdital(e: Edital | undefined): Falta[] {
  const saida: Falta[] = [];
  if (!e) return saida;

  if (e.prazo.trim().length === 0) {
    saida.push({ texto: "prazo, um edital sem data de fechamento não fecha", bloqueia: true, dono: null });
  }
  if (e.linguagens.length === 0 && e.territorios.length === 0) {
    saida.push({
      texto:
        "nenhum critério estruturado, sem eles o alerta de edital compatível (166) não tem o que comparar",
      bloqueia: false,
      dono: null,
    });
  }
  if (e.publicoAlvo.trim().length === 0) {
    saida.push({ texto: "público-alvo", bloqueia: false, dono: null });
  }
  if (e.estado === "aberto" && e.inscricoes.length === 0) {
    saida.push({ texto: "nenhuma inscrição recebida", bloqueia: false, dono: null });
  }
  const propostos = e.inscricoes.filter((i) => i.viraAgente).length;
  if (propostos > 0) {
    saida.push({
      texto: `${propostos} proponente(s) entram no grafo como agente e passam por reconciliação`,
      bloqueia: false,
      dono: "Moderador (117)",
    });
  }
  return saida;
}

// ---------------------------------------------------------------------------
// A importação em lote, O8
// ---------------------------------------------------------------------------

export const ORIGENS_DE_LOTE = ["ical", "json"] as const;
export type OrigemDeLote = (typeof ORIGENS_DE_LOTE)[number];

export const ROTULO_DA_ORIGEM: Record<OrigemDeLote, string> = {
  ical: "iCal (.ics)",
  json: "JSON",
};

/**
 * O que a importação NÃO traz, dito antes de ela rodar.
 *
 * É a frase mais útil da tela. Um lote de agenda traz título, data e, com sorte, o nome do
 * local em texto livre, e não traz espaço cadastrado, elenco com papel, preço, canal de
 * ingresso nem ficha de acessibilidade. Uma tela que só mostrasse «12 eventos importados»
 * faria parecer que o trabalho acabou; o que acabou foi a digitação.
 */
export const O_QUE_O_LOTE_NAO_TRAZ: readonly string[] = [
  "espaço cadastrado, o arquivo traz nome de local em texto, e nome de local não é espaço",
  "elenco com papel, a aresta «atua_em» exige papel, e nenhum formato de agenda o carrega",
  "preço e canal de ingresso",
  "ficha de acessibilidade, nem os recursos, nem o ato de declarar que não oferece",
];

/** Uma linha do lote, já lida e conferida contra o acervo. */
export interface LinhaDoLote {
  titulo: string;
  inicio: string;
  fim: string;
  /** O nome do local como o arquivo o traz. TEXTO, e a tela não o promove a espaço. */
  local: string;
  /** Título normalizado, a mesma normalização do índice de busca. */
  normalizado: string;
  /** Título de evento do acervo que colide por identidade, quando há. */
  colideCom: string | null;
  /** O que ficou vazio nesta linha, nomeado. */
  vazios: string[];
}

export interface Lote {
  id: string;
  origem: OrigemDeLote;
  linhas: LinhaDoLote[];
  /** `null` enquanto o lote é só prévia. Aplicar é ato, e carimba. */
  aplicadoEm: string | null;
  autor: string;
  quando: string;
}

/**
 * A chave de integração.
 *
 * QUEM EMITE E LIMITA É O ADMIN (97). A organização vê a própria chave, usa e revoga, e
 * não existe caminho neste módulo para criar uma. É a terceira segregação da sessão, junto
 * com «a organização não se verifica» e «a organização não declara fato de evento», e as
 * três seguem a mesma disciplina: a impossibilidade mora no código, não num aviso.
 */
export interface ChaveDeIntegracao {
  id: string;
  rotulo: string;
  /** O recorte que o Admin concedeu. Texto vindo do outro nível, não editável aqui. */
  escopo: string;
  limitePorDia: number;
  emitidaPor: string;
  emitidaEm: string;
  revogada: boolean;
}

export const QUEM_EMITE_A_CHAVE =
  "A chave é emitida e limitada pelo Admin (97). A organização vê a própria, usa e revoga, " +
  "e não há nesta tela caminho para criar uma. Emitir a própria credencial e definir o " +
  "próprio limite seria a organização se autorizando, que é o mesmo defeito de ela se " +
  "verificar.";

/** Desdobra uma linha de iCal, tratando a continuação por espaço que o formato permite. */
function linhasDesdobradas(texto: string): string[] {
  const cruas = texto.split(/\r?\n/);
  const saida: string[] = [];
  for (const l of cruas) {
    if (/^[ \t]/.test(l) && saida.length > 0) saida[saida.length - 1] += l.slice(1);
    else saida.push(l);
  }
  return saida;
}

/**
 * Lê um lote de iCal ou de JSON.
 *
 * O LEITOR É ESTREITO DE PROPÓSITO. Ele pega `SUMMARY`, `DTSTART`, `DTEND` e `LOCATION`, e
 * ignora o resto, não porque o resto não importe, mas porque fingir que lê um iCal completo
 * seria prometer um comportamento que este protótipo não tem. O que ele NÃO entende, ele
 * deixa de fora, e a tela lista o que ficou vazio.
 *
 * ENTRADA EXTERNA: nada aqui confia no formato. JSON malformado, campo ausente e tipo errado
 * caem no mesmo lugar, uma linha com o campo vazio e o nome dele na lista de vazios.
 */
export function lerLote(texto: string, origem: OrigemDeLote): Omit<LinhaDoLote, "colideCom">[] {
  const brutas: { titulo: string; inicio: string; fim: string; local: string }[] = [];

  if (origem === "ical") {
    let atual: Record<string, string> | null = null;
    for (const linha of linhasDesdobradas(texto)) {
      if (/^BEGIN:VEVENT/i.test(linha)) atual = {};
      else if (/^END:VEVENT/i.test(linha)) {
        if (atual) {
          brutas.push({
            titulo: atual.SUMMARY ?? "",
            inicio: atual.DTSTART ?? "",
            fim: atual.DTEND ?? "",
            local: atual.LOCATION ?? "",
          });
        }
        atual = null;
      } else if (atual) {
        const corte = linha.indexOf(":");
        if (corte > 0) {
          const chave = linha.slice(0, corte).split(";")[0].toUpperCase();
          atual[chave] = linha.slice(corte + 1).trim();
        }
      }
    }
  } else {
    let lido: unknown = null;
    try {
      lido = JSON.parse(texto);
    } catch {
      // Arquivo ilegível é lote vazio, e a tela diz que veio vazio. Lançar aqui derrubaria
      // a tela inteira por causa de um arquivo que a pessoa pode simplesmente trocar.
      return [];
    }
    const lista = Array.isArray(lido) ? lido : [];
    for (const item of lista) {
      if (typeof item !== "object" || item === null) continue;
      const o = item as Record<string, unknown>;
      brutas.push({
        titulo: typeof o.titulo === "string" ? o.titulo : "",
        inicio: typeof o.inicio === "string" ? o.inicio : "",
        fim: typeof o.fim === "string" ? o.fim : "",
        local: typeof o.local === "string" ? o.local : "",
      });
    }
  }

  return brutas.map((b) => {
    const vazios: string[] = [];
    if (b.titulo.trim().length === 0) vazios.push("título");
    if (b.inicio.trim().length === 0) vazios.push("início");
    if (b.fim.trim().length === 0) vazios.push("fim");
    if (b.local.trim().length === 0) vazios.push("local");
    return { ...b, normalizado: normalizar(b.titulo), vazios };
  });
}

/**
 * Uma linha pode ser gravada?
 *
 * SÓ COM TÍTULO. O critério de identidade do evento é «título normalizado + agente
 * realizador + obra», e sem o primeiro terço não há chave nenhuma, gravar assim produziria
 * registro sem identidade, e a fila de duplicatas passaria a acusar o próprio sistema. Os
 * outros vazios diminuem o registro; este o impede.
 */
export function linhaGravavel(l: LinhaDoLote): boolean {
  return l.titulo.trim().length > 0;
}

export const POR_QUE_A_PREVIA =
  "A prévia vem sempre antes de aplicar, e não é cautela genérica: o lote é a origem " +
  "clássica de duplicata, e o critério de identidade roda ANTES de gravar. Aplicar sem ver " +
  "seria deixar a máquina criar exatamente os pares que a fila de duplicatas existe para " +
  "desfazer depois.";

// ---------------------------------------------------------------------------
// O alcance, O9. A tela onde é mais fácil mentir
// ---------------------------------------------------------------------------

/**
 * O que o acervo NÃO sustenta, item a item, com o motivo.
 *
 * ESTA CONSTANTE É O CONTEÚDO PRINCIPAL DA O9, e não um rodapé de ressalva. Um painel de
 * alcance com número inventado destrói o argumento de procedência da proposta inteira, e
 * num painel institucional ninguém confere, que é exatamente o que torna a mentira barata.
 * Cada linha aqui é um número que a tela PODERIA exibir e escolhe não exibir, com a razão.
 */
export const O_QUE_O_ALCANCE_NAO_SUSTENTA: readonly { medida: string; porque: string }[] = [
  {
    medida: "público presente",
    porque:
      "não existe sinal de presença no acervo: nenhuma ocorrência declara lotação, bilheteria " +
      "ou contagem de porta. Um número aqui seria inventado inteiro.",
  },
  {
    medida: "visualizações e escutas",
    porque:
      "o acervo traz a mídia, não a métrica dela. Play e Cast são telas do produto; o " +
      "contador de reprodução mora no serviço que serve o arquivo, e não há um.",
  },
  {
    medida: "inscrições efetivadas",
    porque:
      "a inscrição existe como funcionalidade e não como dado: nenhum registro do acervo " +
      "guarda quem se inscreveu em quê.",
  },
  {
    medida: "comparação com o próprio histórico",
    porque:
      "comparar exige duas medidas do mesmo indicador em datas diferentes. O grafo é uma " +
      "fotografia, e a data de referência é uma só.",
  },
  {
    medida: "alcance por faixa etária ou perfil",
    porque:
      "o campo de faixa etária é adição de contrato desta onda e ainda não tem dado; perfil " +
      "de público autenticado é do nível 8, e o acervo tem 3 pessoas-usuárias.",
  },
];

export const REGRA_DO_ALCANCE =
  "Se o dado não sustenta, a tela diz. Um painel de alcance com número inventado destrói o " +
  "argumento de procedência da proposta inteira, e num painel institucional ninguém " +
  "confere, que é justamente o que torna a mentira barata.";

// ---------------------------------------------------------------------------
// A conformidade, O10, funcionalidade 168
// ---------------------------------------------------------------------------

export const CONFORMIDADE_NAO_E_VIGILANCIA =
  "Isto é conformidade, não vigilância: mede o REGISTRO, não a pessoa. O recorte por " +
  "colaborador existe para a organização corrigir processo, três devoluções pelo mesmo " +
  "motivo são um problema de instrução, não de quem preencheu,, e nenhuma medida daqui " +
  "vira nota de desempenho de ninguém.";

export const COMO_A_O10_LE_A_FILA =
  "A fila do produtor mora sob outra chave de armazenamento, escrita pelo nível 7. Esta tela " +
  "a lê pelo CONTRATO COMPARTILHADO, a chave e o tipo do rascunho são exportados por " +
  "`tipos-acesso.ts`, que existe exatamente para atravessar níveis,, e a lê em LEITURA: não " +
  "há aqui nenhum caminho que escreva no registro do produtor. A organização vê a fila; quem " +
  "decide sobre ela continua sendo a moderação.";
