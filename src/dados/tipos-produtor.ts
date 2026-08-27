/**
 * tipos-produtor.ts, o contrato do perfil Produtor unificado.
 *
 * POR EXTENSÃO, E POR ISSO NÃO TOCA `tipos.ts` NEM `tipos-acesso.ts`. A ontologia é
 * contrato de outra sessão e `tipos-acesso.ts` é a fronteira que o Studio e a Moderação já
 * dividem: reabrir qualquer um dos dois faria esta sessão editar arquivo alheio para
 * acrescentar o que cabe num arquivo novo. Tudo aqui é ADITIVO, nenhum tipo existente
 * deixa de tipar por causa deste arquivo.
 *
 * O QUE ELE ACRESCENTA, e o que ele NÃO redeclara. `Situacao`, as três portas, as 6 faixas
 * etárias, os 3 canais de ingresso, as 8 dimensões, a cadeia de chaves e `scoreDoRascunho`
 * já existem em `tipos-acesso.ts` e são IMPORTADOS. Os 5 recursos físicos, os 4 estados de
 * edital, os 4 formatos de asset e o direito de distribuição já existem em
 * `tipos-organizacao.ts` e são importados também. Uma segunda lista de qualquer um deles
 * faria duas telas do mesmo produto discordarem sobre quantos valores o vocabulário tem.
 *
 * ELE PODE SER IMPORTADO POR VALOR NO CLIENTE (DP-F). Nenhum import de dado sai daqui:
 * `Acessibilidade`, `Ocorrencia` e `Entidade` entram por `import type` e são apagados na
 * compilação. Os únicos imports de valor são `tipos-acesso`, `tipos-organizacao` e
 * `indice`, os três já client-seguros pelo mesmo critério.
 *
 * SEM RELÓGIO E SEM SORTEIO. Nada aqui lê `new Date()` nem `Math.random()`. Toda data
 * chega por parâmetro, vinda de `DATA_DE_REFERENCIA`; todo id é sequencial.
 */

import type { Acessibilidade } from "./tipos";
import type {
  CanalIngresso,
  FaixaEtaria,
  OcorrenciaDoRascunho,
  Pendencia,
  RascunhoDoProdutor,
  Situacao,
  TemporadaDoRascunho,
  VinculoDeElenco,
} from "./tipos-acesso";
import {
  PROCEDENCIA_DO_PRODUTOR,
  acessibilidadeVazia,
  chaveDoEvento,
  pendenciasDoRascunho,
  scoreDoRascunho,
} from "./tipos-acesso";
import type {
  AcessibilidadeDeEspaco,
  DireitoDeDistribuicao,
  EstadoDoEdital,
  Falta,
  FormatoDeMidia,
  RecursosFisicos,
} from "./tipos-organizacao";
import { direitoVazio, recursosFisicosVazios } from "./tipos-organizacao";
import { normalizar } from "./indice";

export type {
  Acessibilidade,
  AcessibilidadeDeEspaco,
  DireitoDeDistribuicao,
  EstadoDoEdital,
  Falta,
  FormatoDeMidia,
  OcorrenciaDoRascunho,
  Pendencia,
  RascunhoDoProdutor,
  RecursosFisicos,
  Situacao,
  TemporadaDoRascunho,
  VinculoDeElenco,
};

// ---------------------------------------------------------------------------
// PAUTA, as onze coisas que o produtor alimenta
// ---------------------------------------------------------------------------

/**
 * A pauta é o que o registro É, e é ela que escolhe a ficha, a rota e a tela pública.
 *
 * ONZE E NÃO OITO. As três últimas, `espacos`, `midia`, `catalogos`, não produzem cartão
 * no app: elas produzem o que as outras oito CONSOMEM. Deixá-las de fora da enumeração
 * faria a navegação ter dois tipos de item, e o produtor não tem por que saber que o espaço
 * que ele cadastra é de outra espécie que o evento que o usa.
 *
 * A ORDEM É A DO PAINEL, e não alfabética: agenda primeiro porque é a pauta que o produto
 * existe para servir, e os três insumos por último porque ninguém começa o dia por eles.
 */
export const PAUTAS = [
  "agenda",
  "play",
  "cast",
  "museu",
  "cursos",
  "editorial",
  "curadoria",
  "programa",
  "editais",
  "espacos",
  "midia",
] as const;

export type Pauta = (typeof PAUTAS)[number];

export interface DescricaoDaPauta {
  pauta: Pauta;
  /** O rótulo curto, o que aparece no trilho de pautas. */
  rotulo: string;
  /** O nome de UM registro, «Novo evento», não «Novo agenda». */
  singular: string;
  /** A rota da ficha, com barra final: o export estático serve diretório. */
  rota: string;
  /** A tela pública que esta pauta alimenta. Vazio quando a pauta é insumo. */
  telaPublica: string;
  /** Uma frase do que ela é, exibida no menu «+ Criar». */
  objetivo: string;
}

export const DESCRICAO_DA_PAUTA: Record<Pauta, DescricaoDaPauta> = {
  agenda: {
    pauta: "agenda",
    rotulo: "Eventos",
    singular: "Novo evento",
    rota: "/studio/publicar/",
    telaPublica: "/acontece/",
    objetivo: "Espetáculo, exposição, show, oficina, com temporada, sessões e ingresso.",
  },
  play: {
    pauta: "play",
    rotulo: "Play",
    singular: "Nova mídia",
    rota: "/studio/play/",
    telaPublica: "/play/",
    objetivo: "Vídeo avulso, episódio de série ou playlist.",
  },
  cast: {
    pauta: "cast",
    rotulo: "Cast",
    singular: "Novo episódio",
    rota: "/studio/cast/",
    telaPublica: "/cast/",
    objetivo: "Episódio de podcast, com programa, participantes e transcrição.",
  },
  museu: {
    pauta: "museu",
    rotulo: "Museu",
    singular: "Novo objeto de museu",
    rota: "/studio/museu/",
    telaPublica: "/museu/",
    objetivo: "Espaço-museu, exposição permanente ou exposição em cartaz.",
  },
  cursos: {
    pauta: "cursos",
    rotulo: "Cursos",
    singular: "Nova formação",
    rota: "/studio/formacao/",
    telaPublica: "/cursos/",
    objetivo: "Curso, oficina, pós-graduação, encontro ou formação.",
  },
  editorial: {
    pauta: "editorial",
    rotulo: "Editorial",
    singular: "Nova matéria",
    rota: "/studio/editorial/",
    telaPublica: "/noticias/",
    objetivo: "Notícia, entrevista, coluna, opinião ou publicação, com corpo em blocos.",
  },
  curadoria: {
    pauta: "curadoria",
    rotulo: "Curadoria",
    singular: "Nova curadoria",
    rota: "/studio/curadoria/",
    telaPublica: "/descobrir/",
    objetivo: "Trilha curada, destaque de feed ou ponte de sentido.",
  },
  programa: {
    pauta: "programa",
    rotulo: "Programa",
    singular: "Novo programa",
    rota: "/studio/programa/",
    telaPublica: "/acontece/",
    objetivo: "O guarda-chuva que agrupa eventos em edições.",
  },
  editais: {
    pauta: "editais",
    rotulo: "Editais",
    singular: "Novo edital",
    rota: "/studio/editais/",
    telaPublica: "",
    objetivo: "Chamada pública, com prazo, recorte e estado.",
  },
  espacos: {
    pauta: "espacos",
    rotulo: "Espaços",
    singular: "Novo espaço",
    rota: "/studio/espacos/",
    telaPublica: "/mapa/",
    objetivo: "O lugar, endereço, horário, fotos e acessibilidade física.",
  },
  midia: {
    pauta: "midia",
    rotulo: "Mídia",
    singular: "Novo ativo",
    rota: "/studio/midia/",
    telaPublica: "",
    objetivo: "Arquivo com crédito, direito e ficha técnica. Subir uma vez, usar em muitas.",
  },
};

/** As pautas que produzem cartão no app. As três de fora são insumo das oito. */
export const PAUTAS_DE_VITRINE: readonly Pauta[] = PAUTAS.filter(
  (p) => DESCRICAO_DA_PAUTA[p].telaPublica !== "",
);

// ---------------------------------------------------------------------------
// VISIBILIDADE, quem enxerga o que já está publicado
// ---------------------------------------------------------------------------

/**
 * Visibilidade e situação são eixos DIFERENTES, e confundi-los é o erro clássico.
 *
 * `Situacao` responde «onde este registro está na cadeia de decisão»; `Visibilidade`
 * responde «quem o vê quando ele está publicado». Um registro pode estar `publicado` e
 * `privado` ao mesmo tempo, é o pré-lançamento que se manda por link antes de anunciar,
 * e um único campo não conseguiria dizer as duas coisas.
 */
export const VISIBILIDADES = ["publico", "privado", "agendado"] as const;
export type Visibilidade = (typeof VISIBILIDADES)[number];

export const ROTULO_DA_VISIBILIDADE: Record<Visibilidade, string> = {
  publico: "público",
  privado: "privado por link",
  agendado: "agendado",
};

export const EXPLICACAO_DA_VISIBILIDADE: Record<Visibilidade, string> = {
  publico: "Aparece nas vitrines, na busca e no mapa assim que for publicado.",
  privado:
    "Não entra em vitrine nem em busca. Quem tem o link abre, é o pré-lançamento que se " +
    "manda para a imprensa antes de anunciar.",
  agendado:
    "Fica invisível até a data escolhida. É o calendário editorial: escreve-se hoje, o " +
    "público lê no dia.",
};

// ---------------------------------------------------------------------------
// MODALIDADE, e a regra de qual campo cada uma exige
// ---------------------------------------------------------------------------

export const MODALIDADES = ["presencial", "online", "hibrido"] as const;
export type Modalidade = (typeof MODALIDADES)[number];

export const ROTULO_DA_MODALIDADE: Record<Modalidade, string> = {
  presencial: "presencial",
  online: "online",
  hibrido: "híbrido",
};

/**
 * O que cada modalidade EXIGE, e a assimetria é o ponto.
 *
 * Sem esta tabela a ficha pediria espaço para uma live e plataforma para um espetáculo, e
 * quem preenche aprenderia a ignorar campo obrigatório. É a regra que faz a modalidade
 * mudar a ficha em vez de só ser mais um seletor.
 */
export interface ExigenciaDaModalidade {
  espaco: boolean;
  plataforma: boolean;
  /** Só faz sentido quando há espaço: rampa e elevador não existem numa transmissão. */
  recursosFisicos: boolean;
}

export const EXIGE_POR_MODALIDADE: Record<Modalidade, ExigenciaDaModalidade> = {
  presencial: { espaco: true, plataforma: false, recursosFisicos: true },
  online: { espaco: false, plataforma: true, recursosFisicos: false },
  hibrido: { espaco: true, plataforma: true, recursosFisicos: true },
};

// ---------------------------------------------------------------------------
// FORMATO e PROGRAMAÇÃO do evento
// ---------------------------------------------------------------------------

/** Os oito formatos. Vocabulário aberto pelo catálogo (S10), fechado no contrato. */
export const FORMATOS_DE_EVENTO = [
  "espetaculo",
  "exposicao",
  "ocupacao",
  "show",
  "oficina",
  "encontro",
  "visita",
  "sessao",
] as const;
export type FormatoDeEvento = (typeof FORMATOS_DE_EVENTO)[number];

export const ROTULO_DO_FORMATO_DE_EVENTO: Record<FormatoDeEvento, string> = {
  espetaculo: "espetáculo",
  exposicao: "exposição",
  ocupacao: "ocupação",
  show: "show",
  oficina: "oficina",
  encontro: "encontro",
  visita: "visita",
  sessao: "sessão",
};

/**
 * Como o evento acontece no tempo, e é isto que dispensa ou obriga a grade de sessões.
 *
 * `vigencia` é a exposição: ela abre em setembro e fecha em novembro, e não tem «sessão das
 * 20h». Forçar uma grade sobre ela produziria sessenta sessões inventadas, uma por dia de
 * visitação, que é exatamente o defeito que `diasTruncados: 16282` mede no acervo de hoje.
 */
export const PROGRAMACOES = ["sessoes", "vigencia"] as const;
export type ProgramacaoDoEvento = (typeof PROGRAMACOES)[number];

export const ROTULO_DA_PROGRAMACAO: Record<ProgramacaoDoEvento, string> = {
  sessoes: "por sessões",
  vigencia: "vigência contínua",
};

export const EXPLICACAO_DA_PROGRAMACAO: Record<ProgramacaoDoEvento, string> = {
  sessoes: "Cada dia tem horário próprio. A grade do ato 5 é obrigatória.",
  vigencia:
    "Abre num dia e fecha em outro, sem sessão por horário, é a exposição. O ato 5 fica " +
    "dispensado e a temporada vira o período de visitação.",
};

// ---------------------------------------------------------------------------
// PREÇO, estruturado, porque «R$ 40» não responde «meia?»
// ---------------------------------------------------------------------------

export const COBRANCAS = ["gratuito", "pago", "gratuito-com-retirada"] as const;
export type Cobranca = (typeof COBRANCAS)[number];

export const ROTULO_DA_COBRANCA: Record<Cobranca, string> = {
  gratuito: "gratuito",
  pago: "pago",
  "gratuito-com-retirada": "gratuito, com retirada de ingresso",
};

/**
 * O preço com as duas metades que o público lê.
 *
 * `inteira` e `meia` em CENTAVOS, e não em reais com casa decimal: `40.5` e `40.50` são o
 * mesmo número em ponto flutuante e grafias diferentes na tela, e a soma de três ingressos
 * a `13.33` não fecha. Inteiro em centavos não tem esse problema.
 *
 * `de`/`ate` cobre a faixa, «de R$ 20 a R$ 80» é o que o teatro anuncia quando o preço
 * varia por setor, e sem os dois campos isso viraria texto livre que nenhum filtro lê.
 */
export interface Preco {
  inteira: number | null;
  meia: number | null;
  /** Faixa, quando o preço varia por setor. Em centavos, como as outras duas. */
  de: number | null;
  ate: number | null;
}

export function precoVazio(): Preco {
  return { inteira: null, meia: null, de: null, ate: null };
}

export function precoDeclarado(p: Preco): boolean {
  return p.inteira !== null || p.meia !== null || p.de !== null || p.ate !== null;
}

/** `4000` → `"R$ 40,00"`. Sem `toLocaleString`, pelo mesmo motivo de `comSeparador`: o
 *  separador não pode depender do locale da máquina que roda o build. */
export function emReais(centavos: number): string {
  const inteiros = Math.trunc(Math.abs(centavos) / 100);
  const resto = String(Math.abs(centavos) % 100).padStart(2, "0");
  let comPonto = "";
  const s = String(inteiros);
  for (let i = 0; i < s.length; i += 1) {
    if (i > 0 && (s.length - i) % 3 === 0) comPonto += ".";
    comPonto += s[i];
  }
  return `${centavos < 0 ? "-" : ""}R$ ${comPonto},${resto}`;
}

// ---------------------------------------------------------------------------
// A OCORRÊNCIA ESTENDIDA, fim, duração e o ingresso por sessão
// ---------------------------------------------------------------------------

/**
 * A sessão com os campos que o acervo não tem.
 *
 * `fim` E `duracaoMinutos` CONVIVEM de propósito, e não é redundância: o teatro anuncia
 * «90 minutos» e o cinema anuncia «até as 22h30». Derivar um do outro obrigaria a escolher
 * qual dos dois é a verdade, e a resposta muda por pauta. Quem preenche um vê o outro
 * calculado, e a tela diz qual foi digitado.
 */
export interface SessaoDoProdutor extends OcorrenciaDoRascunho {
  /** AAAA-MM-DDTHH:mm. `null` quando só a duração foi declarada. */
  fim: string | null;
  /** `null` quando só o fim foi declarado. */
  duracaoMinutos: number | null;
  /** Sobrescreve o preço do evento nesta sessão, a sessão-promoção de terça. */
  preco: number | null;
  precoEstruturado: Preco | null;
}

/** `"2026-09-12T20:00"` + 90 → `"2026-09-12T21:30"`.
 *
 *  ARITMÉTICA EM `Date.UTC` COM LEITORES `getUTC*`. `new Date("2026-09-12T20:00")` sem fuso
 *  é interpretado como HORA LOCAL, e `getHours()` num fuso brasileiro devolveria a hora
 *  certa, mas `toISOString()` devolveria 23:00Z, e a grade sairia deslocada um dia sem
 *  nenhum portão ver. UTC nos dois lados fecha. */
export function somarMinutos(inicio: string, minutos: number): string {
  const [dia, hora] = inicio.split("T");
  if (!dia || !hora) return inicio;
  const [a, m, d] = dia.split("-").map((n) => Number.parseInt(n, 10));
  const [hh, mm] = hora.split(":").map((n) => Number.parseInt(n, 10));
  if (![a, m, d, hh, mm].every((n) => Number.isFinite(n))) return inicio;
  const t = Date.UTC(a as number, (m as number) - 1, d as number, hh as number, mm as number);
  const fim = new Date(t + minutos * 60_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${fim.getUTCFullYear()}-${p(fim.getUTCMonth() + 1)}-${p(fim.getUTCDate())}` +
    `T${p(fim.getUTCHours())}:${p(fim.getUTCMinutes())}`
  );
}

/** O inverso: dois instantes, quantos minutos entre eles. Negativo vira `null`, uma sessão
 *  que termina antes de começar é erro de digitação, não duração. */
export function minutosEntre(inicio: string, fim: string): number | null {
  // ENTRADA EXTERNA ENTRA AQUI: sessões vindas do armazenamento podem não ter `inicio`,
  // e `undefined.split` derrubava a tela inteira (2026-08-27). Data ilegível é `null`,
  // nunca exceção: quem chama já trata o null.
  if (typeof inicio !== "string" || typeof fim !== "string") return null;
  const ms = (s: string): number | null => {
    const [dia, hora] = s.split("T");
    if (!dia || !hora) return null;
    const [a, m, d] = dia.split("-").map((n) => Number.parseInt(n, 10));
    const [hh, mm] = hora.split(":").map((n) => Number.parseInt(n, 10));
    if (![a, m, d, hh, mm].every((n) => Number.isFinite(n))) return null;
    return Date.UTC(a as number, (m as number) - 1, d as number, hh as number, mm as number);
  };
  const i = ms(inicio);
  const f = ms(fim);
  if (i === null || f === null || f <= i) return null;
  return Math.round((f - i) / 60_000);
}

// ---------------------------------------------------------------------------
// O REGISTRO, o guarda-chuva
// ---------------------------------------------------------------------------

/** Uma imagem com o que a torna publicável: crédito e texto alternativo. */
export interface ImagemDeclarada {
  caminho: string;
  /** Bloqueante (165). Imagem sem crédito não salva. */
  credito: string;
  /** Bloqueante para quem usa leitor de tela. Imagem sem alt é imagem que não existe. */
  alt: string;
  /** Licença de uso, quando declarada, as 21 fachadas de hoje vêm da Wikimedia. */
  licenca: string | null;
}

export function imagemVazia(): ImagemDeclarada {
  return { caminho: "", credito: "", alt: "", licenca: null };
}

export function imagemCompleta(i: ImagemDeclarada | null): boolean {
  return (
    i !== null &&
    i.caminho.trim() !== "" &&
    i.credito.trim() !== "" &&
    i.alt.trim() !== ""
  );
}

/**
 * O que TODO registro tem, seja qual for a pauta.
 *
 * SÓ PRIMITIVO, ARRAY E OBJETO LITERAL, a mesma disciplina de `RascunhoDoProdutor`. É isso
 * que o torna serializável em `localStorage` e transportável como DTO sem violar DP-F.
 */
export interface RegistroBase {
  /** `"<pauta>:produtor:<seq>"`, `seq` determinístico, nunca sorteado. */
  id: string;
  pauta: Pauta;
  situacao: Situacao;
  visibilidade: Visibilidade;
  /** AAAA-MM-DD. Só quando `visibilidade === "agendado"`. */
  agendadoPara: string | null;

  // ---- ato 1, comum a todas as fichas ----
  titulo: string;
  resumo: string;
  imagem: ImagemDeclarada | null;
  linguagens: string[];
  temas: string[];
  /** Termos digitados fora do vocabulário, aguardando o Editor, porta 3. */
  termosPropostos: string[];

  // ---- ato de acessibilidade, comum ----
  acessibilidade: Acessibilidade;
  fisicos: RecursosFisicos;
  /** O ATO de resolver a ficha, não o conteúdo dela (D-43). */
  declaraAcessibilidade: boolean;

  // ---- carimbos: sistema, nunca digitáveis ----
  procedencia: typeof PROCEDENCIA_DO_PRODUTOR;
  /** A organização a que o produtor pertence, o agente realizador da chave. */
  fonte: string;
  autor: string;
  chaveIdentidade: string;
  /** AAAA-MM-DD, sempre `DATA_DE_REFERENCIA`, nunca o relógio de quem avalia. */
  criadoEm: string;
  publicadoEm: string | null;
  pendencias: Pendencia[];
  /** O motivo escrito por quem suspendeu, vetou ou devolveu. */
  motivoDaDevolucao: string | null;
}

// ---- as onze fichas -------------------------------------------------------

export interface RegistroDeAgenda extends RegistroBase {
  pauta: "agenda";
  // ato 1, a chave
  obraId: string | null;
  obraTitulo: string | null;
  obraProposta: boolean;
  // ato 2, natureza
  modalidade: Modalidade;
  plataforma: string;
  linkDaTransmissao: string;
  aoVivo: boolean;
  formato: FormatoDeEvento | null;
  programacao: ProgramacaoDoEvento;
  // ato 3, elenco
  elenco: VinculoDeElenco[];
  // ato 4, temporadas
  temporadas: TemporadaDoRascunho[];
  // ato 5, sessões
  sessoes: SessaoDoProdutor[];
  // ato 6, comercial
  cobranca: Cobranca;
  preco: Preco;
  canalIngresso: CanalIngresso | null;
  linkDeIngresso: string | null;
  inscricao: string | null;
  vagas: number | null;
  prazoDeInscricao: string | null;
  faixaEtaria: FaixaEtaria | null;
  // ato 7
  acessibilidadeVariaPorSessao: boolean;
  /** O programa a que este evento pertence, quando pertence a algum. */
  programaId: string | null;
}

export const FONTES_DE_VIDEO = ["youtube", "vimeo", "externo"] as const;
export type FonteDeVideo = (typeof FONTES_DE_VIDEO)[number];

export const TIPOS_DE_PLAY = ["video", "episodio", "playlist"] as const;
export type TipoDePlay = (typeof TIPOS_DE_PLAY)[number];

export const ROTULO_DO_TIPO_DE_PLAY: Record<TipoDePlay, string> = {
  video: "vídeo avulso",
  episodio: "episódio de série",
  playlist: "playlist",
};

export interface PonteDoRegistro {
  /** `fala_sobre` · `aprofunda` · `contextualiza` · `dialoga_com` · `influenciou` · `curou`. */
  relacao: string;
  alvoId: string;
  alvoTitulo: string;
  /** O SELO que o público lê. Ponte sem motivo não publica. */
  motivo: string;
}

export interface RegistroDePlay extends RegistroBase {
  pauta: "play";
  tipo: TipoDePlay;
  /** O id da série. `null` em vídeo avulso e playlist. */
  serieId: string | null;
  serieTitulo: string | null;
  numeroDoEpisodio: number | null;
  /** Ids dos itens, em ordem. Só em playlist. */
  itens: string[];
  fonte_video: FonteDeVideo;
  /** Só o id do YouTube, nunca a URL inteira: o iframe nasce depois do clique. */
  idDoVideo: string;
  linkExterno: string;
  duracaoMinutos: number | null;
  /** AAAA-MM-DD. */
  data: string;
  direito: DireitoDeDistribuicao;
  pontes: PonteDoRegistro[];
}

export const ESPECIES_DE_SPOTIFY = ["show", "episode", "playlist"] as const;
export type EspecieDeSpotify = (typeof ESPECIES_DE_SPOTIFY)[number];

export interface ParticipanteDoCast {
  agenteId: string;
  agenteTitulo: string;
  papel: string;
  proposto: boolean;
}

export interface RegistroDeCast extends RegistroBase {
  pauta: "cast";
  programaId: string | null;
  programaTitulo: string;
  numeroDoEpisodio: number | null;
  temporada: number | null;
  /** URL do Spotify + a espécie que ela é. As duas, porque o embed muda com a espécie. */
  urlDoSpotify: string;
  especie: EspecieDeSpotify;
  linkExterno: string;
  duracaoMinutos: number | null;
  data: string;
  participantes: ParticipanteDoCast[];
  /** O que torna podcast acessível, e hoje as 336 do acervo declaram zero. */
  transcricao: string;
}

export const OBJETOS_DE_MUSEU = ["espaco-museu", "permanente", "em-cartaz"] as const;
export type ObjetoDeMuseu = (typeof OBJETOS_DE_MUSEU)[number];

export const ROTULO_DO_OBJETO_DE_MUSEU: Record<ObjetoDeMuseu, string> = {
  "espaco-museu": "espaço-museu",
  permanente: "exposição permanente",
  "em-cartaz": "exposição em cartaz",
};

export interface TextoAssinado {
  titulo: string;
  autor: string;
  cargo: string;
  paragrafos: string[];
}

export interface PassoDoPercurso {
  titulo: string;
  texto: string;
  imagem: ImagemDeclarada | null;
}

export interface VideoDaExposicao {
  idDoVideo: string;
  titulo: string;
}

export interface RegistroDeMuseu extends RegistroBase {
  pauta: "museu";
  objeto: ObjetoDeMuseu;
  /** O espaço-museu que hospeda. Obrigatório na permanente. */
  espacoId: string | null;
  espacoTitulo: string | null;
  kicker: string;
  subtitulo: string;
  lead: string;
  andares: string;
  entrada: string;
  horario: string;
  galeria: ImagemDeclarada[];
  videos: VideoDaExposicao[];
  textos: TextoAssinado[];
  percurso: PassoDoPercurso[];
  /** Quando `objeto === "em-cartaz"`, o id do registro de agenda que a sustenta. */
  eventoId: string | null;
}

export const FORMATOS_DE_CURSO = [
  "curso",
  "oficina",
  "pos-graduacao",
  "encontro",
  "formacao",
] as const;
export type FormatoDeCurso = (typeof FORMATOS_DE_CURSO)[number];

export const ROTULO_DO_FORMATO_DE_CURSO: Record<FormatoDeCurso, string> = {
  curso: "Curso",
  oficina: "Oficina",
  "pos-graduacao": "Pós-graduação",
  encontro: "Encontro",
  formacao: "Formação",
};

export interface RegistroDeCurso extends RegistroBase {
  pauta: "cursos";
  /** Hoje `classificarFormato()` adivinha isto por regex sobre o título. */
  formato: FormatoDeCurso | null;
  modalidade: Modalidade;
  plataforma: string;
  espacoId: string | null;
  espacoTitulo: string | null;
  inicio: string;
  fim: string;
  diasEHorarios: string;
  cargaHoraria: string;
  inscricaoAberta: boolean;
  vagas: number | null;
  prazoDeInscricao: string | null;
  linkDeInscricao: string;
  cobranca: Cobranca;
  preco: Preco;
  publicoAlvo: string;
  preRequisitos: string;
  certificado: boolean;
  materialDidatico: string[];
  aceitaVisitaEducativa: boolean;
  cancelado: boolean;
  motivoDoCancelamento: string | null;
}

export const FAMILIAS_EDITORIAIS = [
  "noticia",
  "entrevista",
  "coluna",
  "opiniao",
  "publicacao",
] as const;
export type FamiliaEditorial = (typeof FAMILIAS_EDITORIAIS)[number];

export const ROTULO_DA_FAMILIA: Record<FamiliaEditorial, string> = {
  noticia: "notícia",
  entrevista: "entrevista",
  coluna: "coluna",
  opiniao: "opinião",
  publicacao: "publicação",
};

/** O que a família muda NA CARA DA PÁGINA, `data-familia` já existe em `materia.css`. */
export const CARA_DA_FAMILIA: Record<FamiliaEditorial, string> = {
  noticia: "hero com foto, chapéu e lead",
  entrevista: "hero com foto e o entrevistado no chapéu",
  coluna: "hero com foto e a assinatura do colunista",
  opiniao: "abre com aspas, SEM foto, a opinião não tem rosto de reportagem",
  publicacao: "capa de livro em vez de foto de reportagem",
};

export const TIPOS_DE_BLOCO = [
  "paragrafo",
  "subtitulo",
  "citacao",
  "imagem",
  "youtube",
  "spotify",
] as const;
export type TipoDeBloco = (typeof TIPOS_DE_BLOCO)[number];

export const ROTULO_DO_BLOCO: Record<TipoDeBloco, string> = {
  paragrafo: "parágrafo",
  subtitulo: "subtítulo",
  citacao: "citação",
  imagem: "imagem",
  youtube: "vídeo do YouTube",
  spotify: "áudio do Spotify",
};

export interface BlocoDoCorpo {
  tipo: TipoDeBloco;
  /** O texto do parágrafo, do subtítulo ou da citação; o id no caso de mídia. */
  texto: string;
  /** Só em `imagem`. Crédito obrigatório dentro do corpo também. */
  imagem: ImagemDeclarada | null;
}

export interface RegistroEditorial extends RegistroBase {
  pauta: "editorial";
  familia: FamiliaEditorial | null;
  secao: string;
  categoria: string;
  chapeu: string;
  /** O lead, o `resumo` da base é o que o cartão mostra; este é o que a página abre. */
  lead: string;
  data: string;
  autorNome: string;
  autorDescricao: string;
  corpo: BlocoDoCorpo[];
  pontes: PonteDoRegistro[];
}

export const OBJETOS_DE_CURADORIA = ["trilha", "destaque", "ponte"] as const;
export type ObjetoDeCuradoria = (typeof OBJETOS_DE_CURADORIA)[number];

export const ROTULO_DO_OBJETO_DE_CURADORIA: Record<ObjetoDeCuradoria, string> = {
  trilha: "trilha curada",
  destaque: "destaque de feed",
  ponte: "ponte de sentido",
};

export interface PassoDaTrilha {
  deId: string;
  deTitulo: string;
  paraId: string;
  paraTitulo: string;
  relacao: string;
  /** Passo sem motivo IMPEDE publicar a trilha inteira. */
  motivo: string;
}

export interface RegistroDeCuradoria extends RegistroBase {
  pauta: "curadoria";
  objeto: ObjetoDeCuradoria;
  /** Quem assina. Curadoria anônima não é curadoria. */
  assinatura: string;
  passos: PassoDaTrilha[];
  /** O destino da trilha, tem de ser evento com sessão datada. */
  destinoId: string | null;
  destinoTitulo: string | null;
  destinoTemSessaoDatada: boolean;
  /** Em `destaque`: qual feed, e por quanto tempo. */
  feed: string;
  itemDestacadoId: string | null;
  itemDestacadoTitulo: string | null;
  vigenciaInicio: string;
  vigenciaFim: string;
  /** Em `ponte`: a aresta única. */
  ponte: PonteDoRegistro | null;
}

export interface EdicaoDoPrograma {
  nome: string;
  inicio: string;
  fim: string;
  /** Ids dos registros de agenda desta edição. */
  eventos: string[];
}

export interface RegistroDePrograma extends RegistroBase {
  pauta: "programa";
  edicoes: EdicaoDoPrograma[];
}

export interface RegistroDeEdital extends RegistroBase {
  pauta: "editais";
  estado: EstadoDoEdital;
  /** AAAA-MM-DD. */
  prazo: string;
  /** Recorte: quem pode se inscrever. */
  territorios: string[];
  publicoAlvo: string;
  link: string;
  anexos: string[];
}

export interface RegistroDeEspaco extends RegistroBase {
  pauta: "espacos";
  /** O id no acervo quando o espaço já existe; `null` quando é cadastro novo. */
  espacoId: string | null;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  capacidade: number | null;
  horario: string;
  entrada: string;
  fotos: ImagemDeclarada[];
  /** Sempre `"centroide-municipio"`: latitude digitada não existe neste produto. */
  metodoDaCoordenada: string;
}

export interface RegistroDeMidia extends RegistroBase {
  pauta: "midia";
  arquivo: string;
  formato: FormatoDeMidia | null;
  duracao: string;
  capitulos: { titulo: string; inicio: string }[];
  direito: DireitoDeDistribuicao;
}

/**
 * O registro, qualquer que seja a pauta.
 *
 * UNIÃO DISCRIMINADA e não uma interface com tudo opcional. Com a união, `impedimentosDe`
 * é obrigada pelo compilador a tratar as onze, acrescentar uma pauta nova sem escrever a
 * regra dela vira erro de tipo, e não uma tela que publica sem conferir nada.
 */
export type Registro =
  | RegistroDeAgenda
  | RegistroDePlay
  | RegistroDeCast
  | RegistroDeMuseu
  | RegistroDeCurso
  | RegistroEditorial
  | RegistroDeCuradoria
  | RegistroDePrograma
  | RegistroDeEdital
  | RegistroDeEspaco
  | RegistroDeMidia;

/** O registro de uma pauta nomeada, `PorPauta<"agenda">` é `RegistroDeAgenda`. */
export type PorPauta<P extends Pauta> = Extract<Registro, { pauta: P }>;

// ---------------------------------------------------------------------------
// A BASE VAZIA, o que toda ficha começa sendo
// ---------------------------------------------------------------------------

export interface ContextoDoProdutor {
  dataDeReferencia: string;
  autor: string;
  organizacao: string;
}

export function baseVazia(
  id: string,
  pauta: Pauta,
  ctx: ContextoDoProdutor,
): RegistroBase {
  return {
    id,
    pauta,
    situacao: "rascunho",
    visibilidade: "publico",
    agendadoPara: null,
    titulo: "",
    resumo: "",
    imagem: null,
    linguagens: [],
    temas: [],
    termosPropostos: [],
    acessibilidade: acessibilidadeVazia(),
    fisicos: recursosFisicosVazios(),
    declaraAcessibilidade: false,
    procedencia: PROCEDENCIA_DO_PRODUTOR,
    fonte: ctx.organizacao,
    autor: ctx.autor,
    chaveIdentidade: "",
    criadoEm: ctx.dataDeReferencia,
    publicadoEm: null,
    pendencias: [],
    motivoDaDevolucao: null,
  };
}

/**
 * Um registro em branco da pauta pedida.
 *
 * O `switch` é exaustivo por construção: o tipo de retorno é `Registro`, e uma pauta sem
 * caso não compila. É o que impede uma pauta nova de nascer com metade dos campos
 * `undefined` e explodir três telas adiante.
 */
export function registroVazio(id: string, pauta: Pauta, ctx: ContextoDoProdutor): Registro {
  const base = baseVazia(id, pauta, ctx);
  switch (pauta) {
    case "agenda":
      return {
        ...base,
        pauta: "agenda",
        obraId: null,
        obraTitulo: null,
        obraProposta: false,
        modalidade: "presencial",
        plataforma: "",
        linkDaTransmissao: "",
        aoVivo: true,
        formato: null,
        programacao: "sessoes",
        elenco: [],
        temporadas: [],
        sessoes: [],
        cobranca: "gratuito",
        preco: precoVazio(),
        canalIngresso: null,
        linkDeIngresso: null,
        inscricao: null,
        vagas: null,
        prazoDeInscricao: null,
        faixaEtaria: null,
        acessibilidadeVariaPorSessao: false,
        programaId: null,
      };
    case "play":
      return {
        ...base,
        pauta: "play",
        tipo: "video",
        serieId: null,
        serieTitulo: null,
        numeroDoEpisodio: null,
        itens: [],
        fonte_video: "youtube",
        idDoVideo: "",
        linkExterno: "",
        duracaoMinutos: null,
        data: ctx.dataDeReferencia,
        direito: direitoVazio(),
        pontes: [],
      };
    case "cast":
      return {
        ...base,
        pauta: "cast",
        programaId: null,
        programaTitulo: "",
        numeroDoEpisodio: null,
        temporada: null,
        urlDoSpotify: "",
        especie: "episode",
        linkExterno: "",
        duracaoMinutos: null,
        data: ctx.dataDeReferencia,
        participantes: [],
        transcricao: "",
      };
    case "museu":
      return {
        ...base,
        pauta: "museu",
        objeto: "permanente",
        espacoId: null,
        espacoTitulo: null,
        kicker: "",
        subtitulo: "",
        lead: "",
        andares: "",
        entrada: "",
        horario: "",
        galeria: [],
        videos: [],
        textos: [],
        percurso: [],
        eventoId: null,
      };
    case "cursos":
      return {
        ...base,
        pauta: "cursos",
        formato: null,
        modalidade: "presencial",
        plataforma: "",
        espacoId: null,
        espacoTitulo: null,
        inicio: "",
        fim: "",
        diasEHorarios: "",
        cargaHoraria: "",
        inscricaoAberta: false,
        vagas: null,
        prazoDeInscricao: null,
        linkDeInscricao: "",
        cobranca: "gratuito",
        preco: precoVazio(),
        publicoAlvo: "",
        preRequisitos: "",
        certificado: false,
        materialDidatico: [],
        aceitaVisitaEducativa: false,
        cancelado: false,
        motivoDoCancelamento: null,
      };
    case "editorial":
      return {
        ...base,
        pauta: "editorial",
        familia: null,
        secao: "",
        categoria: "",
        chapeu: "",
        lead: "",
        data: ctx.dataDeReferencia,
        autorNome: "",
        autorDescricao: "",
        corpo: [],
        pontes: [],
      };
    case "curadoria":
      return {
        ...base,
        pauta: "curadoria",
        objeto: "trilha",
        assinatura: ctx.autor,
        passos: [],
        destinoId: null,
        destinoTitulo: null,
        destinoTemSessaoDatada: false,
        feed: "",
        itemDestacadoId: null,
        itemDestacadoTitulo: null,
        vigenciaInicio: "",
        vigenciaFim: "",
        ponte: null,
      };
    case "programa":
      return { ...base, pauta: "programa", edicoes: [] };
    case "editais":
      return {
        ...base,
        pauta: "editais",
        estado: "aberto",
        prazo: "",
        territorios: [],
        publicoAlvo: "",
        link: "",
        anexos: [],
      };
    case "espacos":
      return {
        ...base,
        pauta: "espacos",
        espacoId: null,
        endereco: "",
        bairro: "",
        cidade: "",
        estado: "",
        capacidade: null,
        horario: "",
        entrada: "",
        fotos: [],
        metodoDaCoordenada: "centroide-municipio",
      };
    case "midia":
      return {
        ...base,
        pauta: "midia",
        arquivo: "",
        formato: null,
        duracao: "",
        capitulos: [],
        direito: direitoVazio(),
      };
  }
}

// ---------------------------------------------------------------------------
// IMPEDIMENTOS, a função única que responde «pode publicar?»
// ---------------------------------------------------------------------------

/**
 * Um impedimento é uma `Falta` COM ENDEREÇO: além do texto e do dono, ele diz qual ato
 * resolve. Um score que aponta o que falta sem dizer onde é enigma, e a lista de
 * impedimentos existe exatamente para não ser um.
 */
export interface Impedimento extends Falta {
  /** O índice do ato que resolve, dentro da ficha daquela pauta. `-1` quando é externo. */
  ato: number;
  /** O rótulo do ato, o que o link diz. */
  rotuloDoAto: string;
}

function falta(
  texto: string,
  bloqueia: boolean,
  ato: number,
  rotuloDoAto: string,
  dono: string | null = null,
): Impedimento {
  return { texto, bloqueia, dono, ato, rotuloDoAto };
}

/** O que TODA pauta exige, antes do que só ela exige. */
function impedimentosComuns(r: Registro): Impedimento[] {
  const saida: Impedimento[] = [];
  if ((r.titulo ?? "").trim().length < 3) {
    saida.push(falta("título com pelo menos 3 caracteres", true, 0, "Identidade"));
  }
  if (r.imagem !== null && r.imagem.caminho.trim() !== "") {
    if ((r.imagem.credito ?? "").trim() === "") {
      saida.push(falta("crédito da imagem, imagem sem crédito não publica (165)", true, 0, "Identidade"));
    }
    if ((r.imagem.alt ?? "").trim() === "") {
      saida.push(falta("texto alternativo da imagem", true, 0, "Identidade"));
    }
  }
  if ((r.resumo ?? "").trim().length < 20) {
    saida.push(falta("resumo, 27 dos 75 cartões de hoje não têm", false, 0, "Identidade"));
  }
  if (r.linguagens.length === 0) {
    saida.push(falta("pelo menos uma linguagem", false, 0, "Identidade"));
  }
  if (!r.declaraAcessibilidade) {
    saida.push(
      falta(
        "ficha de acessibilidade resolvida, marcada ou declarada ausente, nunca em silêncio",
        true,
        -1,
        "Acessibilidade",
      ),
    );
  }
  if (r.visibilidade === "agendado" && !r.agendadoPara) {
    saida.push(falta("data do agendamento", true, -1, "Publicação"));
  }
  if (r.termosPropostos.length > 0) {
    saida.push(
      falta(
        `${r.termosPropostos.length} termo(s) proposto(s) aguardando o vocabulário`,
        false,
        0,
        "Identidade",
        "Editor / Curador (130)",
      ),
    );
  }
  return saida;
}

function impedimentosDeAgenda(r: RegistroDeAgenda): Impedimento[] {
  const saida: Impedimento[] = [];
  const exige = EXIGE_POR_MODALIDADE[r.modalidade];

  if (r.formato === null) saida.push(falta("formato do evento", false, 1, "Natureza"));
  if (exige.plataforma && r.plataforma.trim() === "") {
    saida.push(falta("plataforma da transmissão", true, 1, "Natureza"));
  }
  if (r.elenco.some((v) => v.papel.trim() === "")) {
    saida.push(falta("papel em todo vínculo de elenco, a aresta `atua_em` o exige", true, 2, "Elenco"));
  }
  if (r.elenco.length === 0) {
    saida.push(falta("elenco, hoje 0 de 129 eventos datados o declaram", false, 2, "Elenco"));
  }
  if (r.temporadas.length === 0) {
    saida.push(falta("pelo menos uma temporada, com início e fim", true, 3, "Local e temporada"));
  }
  if (exige.espaco && r.temporadas.some((t) => t.espacoId === null)) {
    saida.push(
      falta(
        "espaço em toda temporada, sem ele a chave da sessão fica com duas partes de três",
        false,
        3,
        "Local e temporada",
        "Organização (142)",
      ),
    );
  }
  if (r.programacao === "sessoes" && r.sessoes.length === 0) {
    saida.push(falta("pelo menos uma sessão na grade", true, 4, "Grade de sessões"));
  }
  if (r.cobranca === "pago" && !precoDeclarado(r.preco)) {
    saida.push(falta("preço, «pago» sem valor não diz nada a quem vai comprar", true, 5, "Comercial"));
  }
  if (r.canalIngresso === "link-externo" && !(r.linkDeIngresso ?? "").trim()) {
    saida.push(falta("link de venda, o canal escolhido foi «link externo»", true, 5, "Comercial"));
  }
  if (r.canalIngresso === null) {
    saida.push(falta("canal de ingresso, hoje 2 de 300 eventos o declaram", false, 5, "Comercial"));
  }
  if (r.faixaEtaria === null) {
    saida.push(
      falta("faixa etária, sem ela a disposição «vou com criança» mente", false, 5, "Comercial"),
    );
  }
  if (r.obraId === null) {
    saida.push(falta("obra, componente 3 da chave de identidade", false, 0, "Identidade"));
  }
  if (r.obraProposta) {
    saida.push(
      falta(`obra proposta, «${r.obraTitulo ?? ""}»`, false, 0, "Identidade", "Moderador (117)"),
    );
  }
  const propostos = r.elenco.filter((v) => v.proposto).length;
  if (propostos > 0) {
    saida.push(
      falta(`${propostos} agente(s) proposto(s) à Enciclopédia`, false, 2, "Elenco", "Moderador (117)"),
    );
  }
  return saida;
}

function impedimentosDePlay(r: RegistroDePlay): Impedimento[] {
  const saida: Impedimento[] = [];
  if (r.fonte_video === "youtube" && r.idDoVideo.trim() === "") {
    saida.push(falta("id do vídeo no YouTube", true, 2, "Fonte"));
  }
  if (r.fonte_video === "externo" && r.linkExterno.trim() === "") {
    saida.push(falta("link do vídeo", true, 2, "Fonte"));
  }
  if (r.tipo === "episodio" && r.serieId === null && r.serieTitulo === null) {
    saida.push(falta("série, «episódio de série» sem série é vídeo avulso", true, 1, "Tipo"));
  }
  if (r.tipo === "playlist" && r.itens.length === 0) {
    saida.push(falta("pelo menos um item na playlist", true, 1, "Tipo"));
  }
  if (!r.direito.declarado) {
    saida.push(falta("direito de distribuição, sem ele o item não baixa nem incorpora", false, 3, "Direitos"));
  }
  if (r.direito.declarado && r.direito.titular.trim() === "") {
    saida.push(falta("titular do direito", true, 3, "Direitos"));
  }
  if (r.duracaoMinutos === null) {
    saida.push(falta("duração, sem ela não há barra de progresso honesta", false, 2, "Fonte"));
  }
  saida.push(...pontesSemMotivo(r.pontes, 4, "Pontes"));
  return saida;
}

function impedimentosDeCast(r: RegistroDeCast): Impedimento[] {
  const saida: Impedimento[] = [];
  if (r.programaTitulo.trim() === "") {
    saida.push(falta("programa, hoje ele é adivinhado do título do episódio", true, 0, "Programa"));
  }
  if (r.urlDoSpotify.trim() === "" && r.linkExterno.trim() === "") {
    saida.push(falta("a fonte do áudio, Spotify ou link", true, 2, "Áudio"));
  }
  if (r.duracaoMinutos === null) {
    saida.push(falta("duração do episódio", false, 2, "Áudio"));
  }
  if (r.participantes.some((p) => p.papel.trim() === "")) {
    saida.push(falta("papel em todo participante", true, 3, "Participantes"));
  }
  if (r.transcricao.trim() === "") {
    saida.push(
      falta(
        "transcrição, é o que torna podcast acessível, e hoje as 336 do acervo declaram zero",
        false,
        4,
        "Transcrição",
      ),
    );
  }
  return saida;
}

function impedimentosDeMuseu(r: RegistroDeMuseu): Impedimento[] {
  const saida: Impedimento[] = [];
  if (r.objeto === "permanente") {
    if (r.lead.trim() === "") saida.push(falta("lead da exposição", true, 0, "Cabeçalho"));
    if (r.espacoId === null) {
      saida.push(falta("espaço-museu que hospeda a exposição", true, 1, "Espaço e visita"));
    }
    if (r.galeria.length === 0) {
      saida.push(falta("pelo menos uma foto na galeria", false, 2, "Galeria"));
    }
    for (const foto of r.galeria) {
      if (foto.credito.trim() === "" || foto.alt.trim() === "") {
        saida.push(falta("crédito e alt em toda foto da galeria", true, 2, "Galeria"));
        break;
      }
    }
    for (const p of r.percurso) {
      if (p.titulo.trim() === "") {
        saida.push(falta("título em todo passo do percurso", true, 5, "Percurso"));
        break;
      }
    }
    for (const t of r.textos) {
      if (t.titulo.trim() === "" || t.paragrafos.length === 0) {
        saida.push(falta("título e ao menos um parágrafo em todo texto assinado", true, 4, "Textos"));
        break;
      }
    }
  }
  if (r.objeto === "em-cartaz" && r.eventoId === null) {
    saida.push(
      falta("o evento que sustenta a exposição em cartaz", true, 1, "Espaço e visita"),
    );
  }
  return saida;
}

function impedimentosDeCurso(r: RegistroDeCurso): Impedimento[] {
  const saida: Impedimento[] = [];
  const exige = EXIGE_POR_MODALIDADE[r.modalidade];
  if (r.formato === null) {
    saida.push(falta("formato, hoje uma regex sobre o título adivinha isto", true, 1, "Formato"));
  }
  if (exige.espaco && r.espacoId === null) {
    saida.push(falta("espaço do curso presencial", false, 2, "Modalidade e período", "Organização (142)"));
  }
  if (exige.plataforma && r.plataforma.trim() === "") {
    saida.push(falta("plataforma do curso online", true, 2, "Modalidade e período"));
  }
  if (r.inicio.trim() === "") saida.push(falta("data de início", true, 2, "Modalidade e período"));
  if (r.cobranca === "pago" && !precoDeclarado(r.preco)) {
    saida.push(falta("preço do curso pago", true, 3, "Inscrição"));
  }
  if (r.inscricaoAberta && r.linkDeInscricao.trim() === "" && r.vagas === null) {
    saida.push(falta("link ou número de vagas, a inscrição está declarada aberta", true, 3, "Inscrição"));
  }
  if (r.cancelado && !(r.motivoDoCancelamento ?? "").trim()) {
    saida.push(falta("motivo do cancelamento", true, 6, "Situação"));
  }
  if (r.cargaHoraria.trim() === "") {
    saida.push(falta("carga horária", false, 2, "Modalidade e período"));
  }
  return saida;
}

function impedimentosEditoriais(r: RegistroEditorial): Impedimento[] {
  const saida: Impedimento[] = [];
  if (r.familia === null) {
    saida.push(falta("família, é ela que decide a cara da página", true, 0, "Família"));
  }
  if (r.secao.trim() === "") {
    saida.push(falta("seção, seção vazia derruba o build de `/noticias/[secao]`", true, 1, "Seção"));
  }
  if (r.lead.trim() === "") saida.push(falta("lead", true, 2, "Cabeçalho"));
  if (r.corpo.length === 0) {
    saida.push(
      falta("corpo, hoje só 53 das 1.850 páginas do acervo têm", true, 4, "Corpo"),
    );
  }
  for (const b of r.corpo) {
    if (b.tipo === "imagem" && !imagemCompleta(b.imagem)) {
      saida.push(falta("crédito e alt em toda imagem do corpo", true, 4, "Corpo"));
      break;
    }
    if (b.tipo !== "imagem" && b.texto.trim() === "") {
      saida.push(falta("bloco vazio no corpo", true, 4, "Corpo"));
      break;
    }
  }
  if (r.autorNome.trim() === "") {
    saida.push(falta("autor, hoje só existe quando o crawl achou `columnist: true`", false, 3, "Autor"));
  }
  saida.push(...pontesSemMotivo(r.pontes, 5, "Ligações"));
  return saida;
}

function pontesSemMotivo(pontes: PonteDoRegistro[], ato: number, rotulo: string): Impedimento[] {
  const sem = pontes.filter((p) => p.motivo.trim() === "").length;
  if (sem === 0) return [];
  return [
    falta(
      `${sem} ligação(ões) sem motivo, o motivo é o SELO que o público lê, e selo em branco não publica`,
      true,
      ato,
      rotulo,
    ),
  ];
}

function impedimentosDeCuradoria(r: RegistroDeCuradoria): Impedimento[] {
  const saida: Impedimento[] = [];
  if (r.assinatura.trim() === "") {
    saida.push(falta("assinatura, curadoria anônima não é curadoria", true, 0, "Identidade"));
  }
  if (r.objeto === "trilha") {
    if (r.passos.length === 0) saida.push(falta("pelo menos um passo", true, 1, "Passos"));
    const semMotivo = r.passos.filter((p) => p.motivo.trim() === "");
    if (semMotivo.length > 0) {
      saida.push(
        falta(
          `${semMotivo.length} passo(s) sem motivo, o primeiro é «${semMotivo[0]?.deTitulo ?? ""} → ${semMotivo[0]?.paraTitulo ?? ""}»`,
          true,
          1,
          "Passos",
        ),
      );
    }
    if (r.destinoId === null) {
      saida.push(falta("destino final da trilha", true, 2, "Destino"));
    } else if (!r.destinoTemSessaoDatada) {
      saida.push(
        falta(
          "o destino tem de ser um evento com sessão datada, uma trilha que termina no nada não leva a lugar nenhum",
          true,
          2,
          "Destino",
        ),
      );
    }
  }
  if (r.objeto === "destaque") {
    if (r.feed.trim() === "") saida.push(falta("qual feed recebe o destaque", true, 1, "Destaque"));
    if (r.itemDestacadoId === null) saida.push(falta("o item destacado", true, 1, "Destaque"));
    if (r.vigenciaInicio.trim() === "" || r.vigenciaFim.trim() === "") {
      saida.push(falta("vigência do destaque", true, 1, "Destaque"));
    }
  }
  if (r.objeto === "ponte") {
    if (r.ponte === null || r.ponte.alvoId === "") {
      saida.push(falta("os dois lados da ponte", true, 1, "Ponte"));
    } else if (r.ponte.motivo.trim() === "") {
      saida.push(falta("motivo da ponte", true, 1, "Ponte"));
    }
  }
  return saida;
}

function impedimentosDePrograma(r: RegistroDePrograma): Impedimento[] {
  const saida: Impedimento[] = [];
  if (r.edicoes.length === 0) {
    saida.push(falta("pelo menos uma edição", true, 1, "Edições"));
  }
  for (const e of r.edicoes) {
    if (e.nome.trim() === "" || e.inicio.trim() === "") {
      saida.push(falta("nome e período em toda edição", true, 1, "Edições"));
      break;
    }
  }
  if (r.edicoes.every((e) => e.eventos.length === 0)) {
    saida.push(falta("nenhuma edição tem evento, a classe `programa` mede 0 instâncias hoje", false, 2, "Eventos"));
  }
  return saida;
}

function impedimentosDeEdital(r: RegistroDeEdital): Impedimento[] {
  const saida: Impedimento[] = [];
  if (r.prazo.trim() === "") saida.push(falta("prazo", true, 0, "Identidade"));
  if (r.link.trim() === "") saida.push(falta("link do edital", true, 3, "Link e anexos"));
  if (r.linguagens.length === 0 && r.territorios.length === 0) {
    saida.push(falta("recorte, sem linguagem nem território o edital casa com todo mundo", false, 2, "Recorte"));
  }
  return saida;
}

function impedimentosDeEspaco(r: RegistroDeEspaco): Impedimento[] {
  const saida: Impedimento[] = [];
  if (r.endereco.trim() === "") {
    saida.push(falta("endereço, sem ele o cadastro não acrescenta nada à derivação", true, 1, "Endereço"));
  }
  if (r.cidade.trim() === "" || r.estado.trim() === "") {
    saida.push(falta("cidade e UF, é delas que sai a coordenada por centroide", true, 1, "Endereço"));
  }
  for (const f of r.fotos) {
    if (!imagemCompleta(f)) {
      saida.push(falta("crédito e alt em toda foto do espaço", true, 3, "Fotos"));
      break;
    }
  }
  if (r.horario.trim() === "") saida.push(falta("horário de funcionamento", false, 2, "Visita"));
  return saida;
}

function impedimentosDeMidia(r: RegistroDeMidia): Impedimento[] {
  const saida: Impedimento[] = [];
  if (r.arquivo.trim() === "") saida.push(falta("arquivo ou URL", true, 0, "Arquivo"));
  if (r.formato === null) saida.push(falta("formato do ativo", true, 1, "Ficha técnica"));
  if (!r.direito.declarado) {
    saida.push(falta("direito de distribuição", true, 2, "Direitos"));
  } else if (r.direito.titular.trim() === "") {
    saida.push(falta("titular do direito", true, 2, "Direitos"));
  }
  if (r.duracao.trim() === "" && (r.formato === "audio" || r.formato === "video")) {
    saida.push(falta("duração, sem ela não há retomada que signifique alguma coisa", false, 1, "Ficha técnica"));
  }
  return saida;
}

/**
 * A função ÚNICA que responde «o que falta para publicar isto?».
 *
 * UMA SÓ, E POR ISSO ELA VALE PARA AS ONZE. Uma regra por tela produziria o defeito
 * clássico: o botão de publicar habilitado numa tela e a função recusando na outra, com o
 * produtor sem saber qual das duas está certa. Aqui a tela pergunta e a função responde,
 * e não há segunda opinião.
 *
 * O `switch` é exaustivo: acrescentar pauta sem escrever a regra dela vira erro de tipo.
 */
export function impedimentosDe(r: Registro): Impedimento[] {
  const comuns = impedimentosComuns(r);
  switch (r.pauta) {
    case "agenda":
      return [...comuns, ...impedimentosDeAgenda(r)];
    case "play":
      return [...comuns, ...impedimentosDePlay(r)];
    case "cast":
      return [...comuns, ...impedimentosDeCast(r)];
    case "museu":
      return [...comuns, ...impedimentosDeMuseu(r)];
    case "cursos":
      return [...comuns, ...impedimentosDeCurso(r)];
    case "editorial":
      return [...comuns, ...impedimentosEditoriais(r)];
    case "curadoria":
      return [...comuns, ...impedimentosDeCuradoria(r)];
    case "programa":
      return [...comuns, ...impedimentosDePrograma(r)];
    case "editais":
      return [...comuns, ...impedimentosDeEdital(r)];
    case "espacos":
      return [...comuns, ...impedimentosDeEspaco(r)];
    case "midia":
      return [...comuns, ...impedimentosDeMidia(r)];
  }
}

/**
 * `true` quando nada BLOQUEIA. As faltas que só diminuem a qualidade não impedem.
 *
 * DUAS TRAVAS, COMO O VETO JÁ FAZ. A tela desabilita o botão por esta função, e a operação
 * de publicar a chama de novo por conta própria antes de gravar. Uma trava só seria uma
 * trava de aparência: quem chamasse a operação por outro caminho passaria por cima dela.
 */
export function podePublicar(r: Registro): boolean {
  return !impedimentosDe(r).some((i) => i.bloqueia);
}

/** Só os textos do que bloqueia, o que a tela lista ao lado do botão desabilitado. */
export function motivosDeNaoPublicar(r: Registro): string[] {
  return impedimentosDe(r)
    .filter((i) => i.bloqueia)
    .map((i) => i.texto);
}

/**
 * O score de qualidade: quantos dos itens conferidos estão resolvidos.
 *
 * Para a agenda, `scoreDoRascunho` de `tipos-acesso.ts` continua sendo a fonte quando o
 * registro é um `RascunhoDoProdutor` legado. Para o registro novo, o denominador é o número
 * de conferências que `impedimentosDe` faz, e ele é declarado junto com o número, porque
 * um percentual sem denominador é exatamente o tipo de número que esta casa não publica.
 */
export interface ScoreDoRegistro {
  score: number;
  resolvidos: number;
  total: number;
  impedimentos: Impedimento[];
  bloqueiam: number;
  podePublicar: boolean;
}

/** Quantas conferências cada pauta faz. Medido: é o comprimento máximo que
 *  `impedimentosDe` pode devolver para um registro totalmente vazio daquela pauta. */
function totalDeConferencias(pauta: Pauta, ctx: ContextoDoProdutor): number {
  return impedimentosDe(registroVazio("medida", pauta, ctx)).length;
}

export function scoreDoRegistro(r: Registro, ctx: ContextoDoProdutor): ScoreDoRegistro {
  const impedimentos = impedimentosDe(r);
  const total = Math.max(totalDeConferencias(r.pauta, ctx), impedimentos.length);
  const resolvidos = total - impedimentos.length;
  return {
    score: total === 0 ? 100 : Math.round((resolvidos / total) * 100),
    resolvidos,
    total,
    impedimentos,
    bloqueiam: impedimentos.filter((i) => i.bloqueia).length,
    podePublicar: !impedimentos.some((i) => i.bloqueia),
  };
}

// ---------------------------------------------------------------------------
// A CHAVE DE IDENTIDADE por pauta
// ---------------------------------------------------------------------------

const SEM_VALOR = "—";
const SEPARADOR = "|";

/**
 * A chave de cada pauta, na mesma gramática de `chaveDoEvento`.
 *
 * A DA AGENDA DELEGA, e isso não é economia: `chaveDoEvento` é a função contra a qual a
 * fila de duplicatas dispara, e uma segunda implementação aqui faria o Studio gravar chave
 * que a fila não reconhece, a fila passaria a acusar o próprio Studio.
 */
export function chaveDoRegistro(r: Registro): string {
  if (r.pauta === "agenda") {
    return chaveDoEvento(r.titulo, r.fonte, r.obraTitulo).chave;
  }
  const t = normalizar(r.titulo);
  const a = normalizar(r.fonte);
  const terceiro = (() => {
    switch (r.pauta) {
      case "play":
        return normalizar(r.serieTitulo ?? r.idDoVideo);
      case "cast":
        return normalizar(`${r.programaTitulo} ${r.numeroDoEpisodio ?? ""}`);
      case "museu":
        return normalizar(r.espacoTitulo ?? r.objeto);
      case "cursos":
        return normalizar(`${r.formato ?? ""} ${r.inicio}`);
      case "editorial":
        return normalizar(`${r.secao} ${r.data}`);
      case "curadoria":
        return normalizar(`${r.objeto} ${r.assinatura}`);
      case "programa":
        return normalizar(r.edicoes.map((e) => e.nome).join(" "));
      case "editais":
        return normalizar(r.prazo);
      case "espacos":
        return normalizar(`${r.cidade} ${r.estado}`);
      case "midia":
        return normalizar(r.arquivo);
      default:
        return "";
    }
  })();
  return [r.pauta, t || SEM_VALOR, a || SEM_VALOR, terceiro || SEM_VALOR].join(SEPARADOR);
}

/**
 * As pendências de porta, recalculadas a partir do próprio registro.
 *
 * Elas não são campo que alguém marca: são consequência do que está gravado. Guardar a
 * lista à mão faria a tela mostrar pendência de um agente que já foi reconciliado.
 */
export function pendenciasDoRegistro(r: Registro): Pendencia[] {
  const saida: Pendencia[] = [];
  if (r.pauta === "agenda") {
    // Delega para a implementação que a P2..P8 já usa, montando o rascunho equivalente.
    saida.push(
      ...pendenciasDoRascunho({
        ...(registroLegado(r) as RascunhoDoProdutor),
      }),
    );
    return saida;
  }
  const propostos =
    r.pauta === "cast" ? r.participantes.filter((p) => p.proposto).length : 0;
  if (propostos > 0) {
    saida.push({
      porta: "moderacao",
      texto: `${propostos} participante(s) proposto(s) à Enciclopédia`,
    });
  }
  if (
    (r.pauta === "museu" && r.espacoId === null && r.objeto === "permanente") ||
    (r.pauta === "cursos" && r.modalidade !== "online" && r.espacoId === null)
  ) {
    saida.push({ porta: "organizacao", texto: "aguardando o cadastro de um espaço" });
  }
  if (r.termosPropostos.length > 0) {
    saida.push({
      porta: "editor",
      texto: `${r.termosPropostos.length} termo(s) proposto(s), ${r.termosPropostos.join(", ")}`,
    });
  }
  return saida;
}

/** O registro com chave e pendências refeitas. Chamada depois de toda edição. */
export function comChavesDoRegistro<R extends Registro>(r: R): R {
  return { ...r, chaveIdentidade: chaveDoRegistro(r), pendencias: pendenciasDoRegistro(r) };
}

// ---------------------------------------------------------------------------
// MIGRAÇÃO, `studio.v1` e `studio.org.v1` entram em `produtor.v1`
// ---------------------------------------------------------------------------

/** A chave versionada do armazém unificado. */
export const CHAVE_DO_PRODUTOR = "produtor.v1";

/** As duas chaves antigas. NÃO SÃO APAGADAS: a migração lê e deixa onde estão. */
export const CHAVES_HERDADAS = ["studio.v1", "studio.org.v1"] as const;

/**
 * Um `RascunhoDoProdutor` (a forma da S7) virando `RegistroDeAgenda` (a forma nova).
 *
 * NENHUM CAMPO SE PERDE. Os que a forma nova acrescentou nascem no valor que preserva o
 * comportamento de antes: `modalidade: "presencial"` porque toda temporada do acervo tem
 * espaço, `programacao` derivada de `longaDuracao`, `cobranca` derivada do `gratuito` das
 * sessões. Uma migração que zerasse esses três faria o registro migrado aparecer como
 * incompleto, e o produtor veria o próprio trabalho regredir na primeira abertura.
 */
export function daFormaAntiga(r: RascunhoDoProdutor, ctx: ContextoDoProdutor): RegistroDeAgenda {
  const longa = r.temporadas.some((t) => t.longaDuracao);
  const todasGratuitas = r.ocorrencias.length > 0 && r.ocorrencias.every((o) => o.gratuito);
  return {
    id: r.id,
    pauta: "agenda",
    situacao: r.situacao,
    visibilidade: "publico",
    agendadoPara: null,
    titulo: r.titulo,
    resumo: r.resumo,
    imagem: r.imagem
      ? { caminho: r.imagem, credito: r.creditoImagem ?? "", alt: r.titulo, licenca: null }
      : null,
    linguagens: r.linguagens,
    temas: r.temas,
    termosPropostos: r.termosPropostos,
    acessibilidade: r.acessibilidade,
    fisicos: recursosFisicosVazios(),
    declaraAcessibilidade: r.declaraAcessibilidade,
    procedencia: PROCEDENCIA_DO_PRODUTOR,
    fonte: r.fonte || ctx.organizacao,
    autor: r.autor || ctx.autor,
    chaveIdentidade: r.chaveIdentidade,
    criadoEm: r.enviadoEm ?? ctx.dataDeReferencia,
    publicadoEm: r.situacao === "publicado" ? r.enviadoEm : null,
    pendencias: r.pendencias,
    motivoDaDevolucao: r.motivoDaDevolucao,
    obraId: r.obraId,
    obraTitulo: r.obraTitulo,
    obraProposta: r.obraProposta,
    modalidade: "presencial",
    plataforma: "",
    linkDaTransmissao: "",
    aoVivo: true,
    formato: longa ? "exposicao" : null,
    programacao: longa ? "vigencia" : "sessoes",
    elenco: r.elenco,
    temporadas: r.temporadas,
    sessoes: r.ocorrencias.map((o) => ({
      ...o,
      fim: null,
      duracaoMinutos: null,
      precoEstruturado: null,
    })),
    cobranca: todasGratuitas ? "gratuito" : "pago",
    preco: precoVazio(),
    canalIngresso: r.canalIngresso,
    linkDeIngresso: r.linkDeIngresso,
    inscricao: r.inscricao,
    vagas: null,
    prazoDeInscricao: null,
    faixaEtaria: r.faixaEtaria,
    acessibilidadeVariaPorSessao: false,
    programaId: null,
  };
}

/**
 * O caminho de volta, o `RegistroDeAgenda` visto como a forma que a P2..P8 já lê.
 *
 * EXISTE PARA NÃO REESCREVER AS OITO TELAS DE UMA VEZ. Enquanto elas ainda falam a forma
 * antiga, a ponte deixa as duas conviverem sobre um armazém só; sem ela, a migração
 * obrigaria a portar oito telas antes de a primeira funcionar.
 */
export function registroLegado(r: RegistroDeAgenda): RascunhoDoProdutor {
  return {
    id: r.id,
    situacao: r.situacao,
    titulo: r.titulo,
    resumo: r.resumo,
    linguagens: r.linguagens,
    temas: r.temas,
    termosPropostos: r.termosPropostos,
    imagem: r.imagem?.caminho ?? null,
    creditoImagem: r.imagem?.credito ?? null,
    obraId: r.obraId,
    obraTitulo: r.obraTitulo,
    obraProposta: r.obraProposta,
    elenco: r.elenco,
    temporadas: r.temporadas,
    ocorrencias: r.sessoes,
    acessibilidade: r.acessibilidade,
    declaraAcessibilidade: r.declaraAcessibilidade,
    faixaEtaria: r.faixaEtaria,
    canalIngresso: r.canalIngresso,
    linkDeIngresso: r.linkDeIngresso,
    inscricao: r.inscricao,
    procedencia: PROCEDENCIA_DO_PRODUTOR,
    fonte: r.fonte,
    chaveIdentidade: r.chaveIdentidade,
    autor: r.autor,
    enviadoEm: r.publicadoEm ?? r.criadoEm,
    historico: [],
    pendencias: r.pendencias,
    motivoDaDevolucao: r.motivoDaDevolucao,
  };
}

/** O score de 12 itens da agenda, sobre o registro novo, reusando o de `tipos-acesso.ts`. */
export function scoreDaAgenda(r: RegistroDeAgenda) {
  return scoreDoRascunho(registroLegado(r));
}

// ---------------------------------------------------------------------------
// ORDENAÇÃO E BUSCA, o que o painel usa
// ---------------------------------------------------------------------------

/** A ordem em que os registros aparecem no painel: o que pede ação primeiro. */
const PESO_DA_SITUACAO: Record<Situacao, number> = {
  devolvido: 0,
  rascunho: 1,
  "em-moderacao": 2,
  suspenso: 3,
  publicado: 4,
  vetado: 5,
};

export function ordenarRegistros(lista: readonly Registro[]): Registro[] {
  return [...lista].sort((a, b) => {
    const p = PESO_DA_SITUACAO[a.situacao] - PESO_DA_SITUACAO[b.situacao];
    if (p !== 0) return p;
    // Id decrescente: o mais recente primeiro dentro do mesmo estado. Sem relógio.
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
}

/**
 * Tira o travessão de um texto vindo de contrato compartilhado.
 *
 * A regra da casa nova (2026-08): nenhum texto de tela usa travessão. Os textos que ESTA
 * superfície escreve já nascem sem ele; os que vêm de contratos de outras sessões, como as
 * frases de `tipos-acesso.ts`, não podem ser editados na origem sem mexer no que as suítes
 * daquelas sessões afirmam. A limpeza acontece na borda, na hora de renderizar.
 */
export function semTravessao(texto: string): string {
  return texto.split(" — ").join(", ").split("—").join(",");
}

export function casaComBusca(r: Registro, termo: string): boolean {
  const t = normalizar(termo).trim();
  if (t === "") return true;
  return normalizar(`${r.titulo} ${r.resumo}`).includes(t);
}
