/**
 * tipos.ts — o contrato do motor de pontos.
 *
 * REGRA INVARIANTE: nenhuma tela escreve estado direto. Toda interação emite um
 * `EventoDeAtividade` e o resto é consequência — regra → concessão → linha de livro
 * → saldo derivado → efeito visual. Uma tela que fizesse `saldo += 10` quebraria a
 * única coisa que dá valor a este motor, que é conseguir responder *por que* alguém
 * tem 840 de percurso, linha por linha.
 *
 * A QUARTA PROCEDÊNCIA. O acervo tem `ic`, `derivado` e `autorado` (`dados/tipos.ts`),
 * e nenhuma delas descreve um ponto: ponto não sai do acervo, sai do USO. Por isso o
 * motor guarda a origem de cada linha (`eventoOrigemId`, `regraId`, `regraVersao`) em
 * vez de herdar a procedência do acervo. A promessa da proposta continua de pé — nada
 * é afirmado sem fonte —, só que a fonte aqui é o gesto da pessoa, não o CMS.
 */

/* ── Os três ativos, e por que não é um só ───────────────────────────────── */

/**
 * `ficha`     — a moeda. Entra pelo uso, SAI nas recompensas. É a única que debita.
 * `percurso`  — o quanto se andou. NUNCA debita e define o nível: se o resgate
 *               fizesse o nível cair, as recompensas puniria quem usa as recompensas.
 * `reputacao` — o quanto se contribuiu para os outros. Não compra nada; abre
 *               poder dentro do produto (propor trilha, destacar publicação).
 */
export type Ativo = "ficha" | "percurso" | "reputacao";

/* ── O evento: a unidade fundamental ─────────────────────────────────────── */

/**
 * Os nomes de evento do domínio cultural. Lista fechada de propósito — evento com
 * nome livre vira regra que nunca dispara e ninguém descobre por quê.
 *
 * A regra de corte: só entra aqui gesto que a PLATAFORMA OBSERVA. «Concluiu» é
 * observável (o player chegou ao fim); «gostou» não é. `presenca.confirmada` é o
 * único que vem de fora, e vem por código que o produtor gera no Studio — não por
 * autodeclaração.
 *
 * `missao.prova.aprovada` É A ÚNICA EXCEÇÃO, e ela confirma a regra em vez de
 * abri-la. Uma comprovação enviada NÃO emite evento: ela fica em `comprovacoes`
 * como fato pendente, sem tocar o livro. O evento só nasce quando existe um
 * VEREDITO — e aí o que a plataforma observa não é a foto, é a decisão. Enquanto
 * a análise não terminou, o saldo da pessoa é exatamente o mesmo de antes do
 * envio, que é o que impede «ponto que existe antes de ser merecido».
 */
export type NomeDeEvento =
  | "play.midia.concluida"
  | "cast.episodio.concluido"
  | "leitura.materia.concluida"
  | "curso.aula.concluida"
  | "curso.concluido"
  | "ocorrencia.salva"
  | "ocorrencia.presenca.confirmada"
  | "acesso.dia.distinto"
  | "comunidade.publicacao.salva"
  | "comunidade.comentario.criado"
  | "comunidade.reacao.dada"
  | "comunidade.assinada"
  | "recompensa.resgatada"
  | "perfil.disposicoes.escolhidas"
  | "perfil.completo"
  | "museu.exposicao.percorrida"
  | "mapa.territorio.aberto"
  | "descobrir.item.aberto"
  | "busca.concluida"
  | "ia.roteiro.gerado"
  | "missao.prova.aprovada";

/**
 * O contexto que a tela anexa ao evento. Os dois primeiros campos são o coração
 * da mecânica: eles são o que liga a economia à tese da proposta.
 */
export interface ContextoDeEvento {
  /**
   * O item concluído é de uma linguagem que esta pessoa ainda não tinha atravessado.
   * Quem responde é `dados/repertorio.ts`, que já calcula `linguagensNovas` — a
   * economia não recalcula travessia, ela LÊ o mesmo número que o Observatório
   * publica. Duas contas para a mesma coisa seria a garantia de divergirem.
   */
  linguagemNova?: string;
  /** Idem para território: o item é de uma UF que a pessoa ainda não alcançou. */
  territorioNovo?: string;
  /** Rótulo humano do item, para a linha do extrato dizer o que foi. */
  rotulo?: string;
  [chave: string]: unknown;
}

export interface EventoDeAtividade {
  eventoId: string;
  /** Persona ativa. NÃO é usuário: não há autenticação (D-25). */
  personaId: string;
  nome: NomeDeEvento;
  ocorridoEm: number;
  /** O que foi tocado — `{ tipo: "midia", id: "slug-da-serie" }`. */
  alvo?: { tipo: string; id: string };
  contexto?: ContextoDeEvento;
}

/* ── O livro: fonte da verdade dos saldos ────────────────────────────────── */

/**
 * Append-only. O saldo NUNCA é um número guardado; é soma sobre as linhas. É o que
 * permite a tela do extrato existir sem inventar nada e o Observatório auditar o
 * programa inteiro sem uma segunda fonte que possa discordar da primeira.
 */
export interface LinhaDoLivro {
  id: string;
  personaId: string;
  ativo: Ativo;
  /** Sempre positivo. O sinal mora em `sentido`. */
  valor: number;
  sentido: "credito" | "debito";
  /** Legível na tela: «Documentário concluído», «Resgate: cortesia». */
  motivo: string;
  eventoOrigemId: string;
  regraId?: string;
  regraVersao?: number;
  criadoEm: number;
}

/* ── Regras ──────────────────────────────────────────────────────────────── */

export interface ContextoDeRegra {
  evento: EventoDeAtividade;
  estado: EstadoDoMotor;
}

export type AcaoDeRegra =
  | { conceder: { ativo: Ativo; valor: number; motivo: string } }
  | { debitar: { ativo: Ativo; valor: number; motivo: string } }
  | { avancarMissoes: true }
  | { avaliarSequencia: true }
  | { concederEmblema: { emblemaId: string } };

export interface Regra {
  id: string;
  versao: number;
  /** Frase curta que a tela «Como ganhar» exibe. A regra se explica sozinha. */
  descreve: string;
  quando: NomeDeEvento | NomeDeEvento[];
  se?: (ctx: ContextoDeRegra) => boolean;
  entao: AcaoDeRegra[];
  /** Teto de execuções na vida da persona. */
  maxPorPersona?: number;
  /** Teto diário de integridade — o freio antifraude barato. */
  maxPorDia?: number;
}

/* ── Missões ─────────────────────────────────────────────────────────────── */

export type TipoDeMissao =
  | "diaria"
  | "semanal"
  | "temporada"
  | "social"
  | "territorio"
  | "onboarding"
  | "campo";

/**
 * De onde vem a prova de que a missão foi cumprida.
 *
 * `nativa` — a plataforma VIU acontecer: o evento entra pelo motor e a missão
 *            fecha sozinha, sem fila, sem espera, sem arquivo.
 * `midia`  — a pessoa envia uma foto ou print. Passa pela análise antes de valer.
 *
 * Os outros três formatos do escopo original (nota fiscal, texto livre e link
 * público) NÃO existem aqui, e não por falta de tempo: a Fundação não vende, o
 * que tira o caso de uso da nota fiscal, e os outros dois foram cortados no
 * recorte de 2026-08-26 para o catálogo caber em dois formatos bem-feitos em vez
 * de quatro pela metade.
 */
export type FormatoDeProva = "nativa" | "midia";

/**
 * `unica`      — uma conclusão encerra a missão para sempre. Sem placar: o foco é
 *                a conquista individual.
 * `cumulativa` — janela com início e fechamento em que a pessoa acumula. Pode ter
 *                placar próprio.
 */
export type ModeloDeMissao = "unica" | "cumulativa";

/**
 * Como o placar de uma missão cumulativa ordena.
 *
 * `frequencia`  — dias DIFERENTES com pelo menos uma prova aprovada. Estilo
 *                 ofensiva: premia constância, e quem despeja dez provas num
 *                 domingo não passa na frente de quem fez uma por dia.
 * `volume`      — total acumulado de provas validadas na janela. Estilo XP.
 * `territorios` — unidades da federação distintas alcançadas. É a métrica que
 *                 amarra o placar à tese de travessia do programa: o ranking
 *                 mede o quanto você saiu do seu canto, não o quanto produziu.
 */
export type MetricaDeRanking = "frequencia" | "volume" | "territorios";

/**
 * As duas listas que a análise usa E que a tela mostra ao membro, palavra por
 * palavra. Fonte única de propósito: regra que a pessoa não leu antes de enviar
 * é reprovação que ela vai sentir como arbitrária.
 */
export interface RegrasDeAceite {
  vale: string[];
  naoVale: string[];
}

export interface MissaoDefinida {
  id: string;
  tipo: TipoDeMissao;
  titulo: string;
  descricao: string;
  alvo: number;
  avancaCom: NomeDeEvento[];
  percurso: number;
  fichas: number;
  /** Minutos estimados. A diária tem que caber em dois. */
  minutos: number;
  expiraEm: "dia" | "semana" | "temporada" | "ciclo" | "nunca";
  /** Rota interna que cumpre a missão. Missão sem porta é beco. */
  rota: string;

  /* ── O que a onda de 2026-08 acrescentou ──────────────────────────────── */

  /** Ausente é `nativa`: as seis missões originais não migraram e não precisam. */
  prova?: FormatoDeProva;
  /** Ausente é `unica`. Só faz sentido declarar em missão de prova. */
  modelo?: ModeloDeMissao;
  /** A janela da cumulativa. Obrigatória quando `expiraEm` é `ciclo`. */
  ciclo?: { comecaEm: number; fechaEm: number };
  /** Exibidas na tela e usadas pela análise. Só em missão de `midia`. */
  regrasDeAceite?: RegrasDeAceite;
  /** Trava anti-spam. Ausente é sem limite. */
  maxEnviosPorDia?: number;
  /** Participações totais disponíveis. Ausente é sem limite. */
  vagas?: number;
  /** Quantas vagas já foram tomadas por OUTRAS pessoas — número de cenário. */
  vagasTomadas?: number;
  /**
   * O que CADA prova aprovada paga na hora, antes de a missão fechar.
   *
   * São as três dinâmicas do escopo, expressas por presença e ausência em vez de
   * um enum: só `porEnvio` é hábito; só `ranking.bonus` é competição pura; os
   * dois juntos são a combinada. Um campo `dinamica: "..."` além destes seria uma
   * terceira fonte capaz de discordar das outras duas.
   */
  porEnvio?: { percurso: number; fichas: number };
  /** Placar próprio. Só em cumulativa; ausente é sem placar. */
  ranking?: { metrica: MetricaDeRanking; bonus: [number, number, number] };
  /** Tag de segmentação aplicada ao perfil na conclusão. */
  tagAoConcluir?: string;
  /** Emblema concedido na conclusão, do catálogo de emblemas. */
  emblemaId?: string;
  /** Agrupamento na tela. `primeiros-passos` sai do hub quando todas fecham. */
  grupo?: "primeiros-passos";
}

export interface MissaoEmCurso {
  missaoId: string;
  progresso: number;
  concluidaEm?: number;
  /** Período em que este progresso vale. Vira o período, o progresso zera. */
  chaveDoPeriodo: string;
}

/* ── Comprovações ────────────────────────────────────────────────────────── */

/**
 * `enviada`      — está no aparelho, a análise ainda não começou.
 * `analisando`   — a esteira está rodando; a tela mostra as cinco etapas.
 * `aprovada`     — passou. É AQUI, e só aqui, que `missao.prova.aprovada` é
 *                  emitido e o livro recebe linha.
 * `em-moderacao` — a análise não teve confiança suficiente e passou a bola para
 *                  uma pessoa. Não credita nada enquanto estiver assim.
 * `recusada`     — reprovada, com motivo escrito. Não credita.
 */
export type FaseDaComprovacao =
  | "enviada"
  | "analisando"
  | "aprovada"
  | "em-moderacao"
  | "recusada";

/**
 * O arquivo que a pessoa enviou — e o que dele sobrevive.
 *
 * A FOTO ORIGINAL NUNCA É GUARDADA. O estado inteiro mora em `localStorage`
 * (`contexto/pontos.tsx`), que tem cota da ordem de 5 MB: três fotos de celular
 * em dataURL a estouram e a persistência morre em silêncio, levando junto o
 * livro, os emblemas e o resto. Guardamos uma miniatura de 320px e o hash do
 * original — que é, de todo modo, o que a trava antiduplicidade precisa.
 */
export interface ArquivoDaProva {
  nome: string;
  /** dataURL da miniatura reduzida. */
  miniatura: string;
  /** Hash do arquivo original. A mesma foto duas vezes não passa. */
  hash: string;
}

export interface Comprovacao {
  id: string;
  missaoId: string;
  arquivo: ArquivoDaProva;
  fase: FaseDaComprovacao;
  /** 0 a 100. O corte de 80 manda para moderação humana. */
  confianca: number;
  /** O que a análise leu da cena. Alimenta o painel e o texto da recusa. */
  leitura?: string;
  /** Obrigatório em recusa: reprovar sem dizer por quê é o que gera revolta. */
  motivo?: string;
  /** UF declarada pela pessoa. Alimenta o placar por territórios. */
  uf?: string;
  enviadaEm: number;
  decididaEm?: number;
}

/* ── Sequência ───────────────────────────────────────────────────────────── */

/**
 * O fluxo de perda NUNCA é «faltou → zero». É segura → em risco → carência →
 * congelada (se houver proteção) → quebrada. Zerar de uma vez é o desenho que faz
 * a pessoa desistir no primeiro tropeço, e num app cultural o tropeço é a regra:
 * ninguém vai ao teatro toda semana.
 */
export type FaseDaSequencia = "segura" | "em-risco" | "carencia" | "congelada" | "quebrada";

export interface Sequencia {
  ritmo: "diaria" | "semanal";
  contagem: number;
  melhor: number;
  fase: FaseDaSequencia;
  /** Proteções no inventário. Consome uma ao congelar. */
  protecoes: number;
  /** Marcas do período corrente — 7 casas na semana. */
  marcas: boolean[];
  valeuNestePeriodo: boolean;
  historico: { chaveDoPeriodo: string; manteve: boolean; congelada?: boolean }[];
}

/* ── Emblemas ────────────────────────────────────────────────────────────── */

export interface EmblemaDefinido {
  id: string;
  titulo: string;
  descricao: string;
  /** `"sequencia_4"`, `"nivel_3"`, `"linguagens_8"`, `"presencas_1"`. */
  criterio: string;
  /** Como ganhar, dito na tela. Emblema misterioso é enfeite, não meta. */
  comoGanhar: string;
}

export interface EmblemaConcedido {
  emblemaId: string;
  concedidoEm: number;
}

/* ── Comunidade ──────────────────────────────────────────────────────────── */

/**
 * Uma comunidade É UMA ENTIDADE DO GRAFO com canal aberto — instituição, coletivo
 * ou produtor que o acervo já reconhece. Não se cria comunidade do nada aqui: o
 * `entidadeId` é a amarra que impede o marketplace de virar uma lista de nomes
 * inventados ao lado de um acervo com procedência.
 */
export interface ComunidadeDefinida {
  id: string;
  /** Id canônico no grafo (`"instituicao:ic:123"`), ou `null` na oficial do IC. */
  entidadeId: string | null;
  nome: string;
  descricao: string;
  /** `oficial` é a do Itaú Cultural; as outras são do marketplace. */
  natureza: "oficial" | "instituicao" | "coletivo" | "produtor" | "pessoa";
  /** URL do verbete na Enciclopédia. É a prova de que a entidade existe. */
  fonte?: string;
  /**
   * A comunidade é CURADA pelo Itaú Cultural, não escrita pela pessoa que dá
   * nome a ela. Existe para a tela poder dizer isso: dar a uma artista viva uma
   * comunidade onde ela «publica» sem ter publicado seria pôr palavra na boca de
   * pessoa real — a mesma linha que o projeto se recusou a cruzar ao não autorar
   * elenco. Aqui a curadoria assina, e a tela declara a assinatura.
   */
  curada?: boolean;
  /** UF de origem — o marketplace ordena por território, não por tamanho. */
  uf?: string;
  linguagens: string[];
  assinantes: number;
}

export interface ComentarioDefinido {
  autorId: string;
  corpo: string;
  reacoes?: number;
  quandoRotulo?: string;
  respostas?: ComentarioDefinido[];
}

export interface PublicacaoDefinida {
  id: string;
  comunidadeId: string;
  autorId: string;
  titulo: string;
  corpo: string;
  etiqueta?: string;
  /** Capa do acervo. Toda publicação tem uma — nenhuma cena inventada. */
  imagem: string;
  imagemAlt: string;
  imagemCredito: string;
  /** URL da matéria no site do Itaú Cultural, quando a publicação vem do acervo. */
  fonte?: string;
  reacoes: number;
  comentarios: ComentarioDefinido[];
  diasAtras: number;
  /** Publicação do próprio Itaú Cultural. */
  oficial?: boolean;
  enquete?: { opcoes: { rotulo: string; pct: number }[] };
}

export interface PessoaDaComunidade {
  id: string;
  nome: string;
  /** Avatar é monograma em CSS, nunca foto — não temos foto de ninguém real. */
  monograma: string;
  cidade: string;
  uf: string;
}

/* ── Recompensas ─────────────────────────────────────────────────────────────── */

export type FamiliaDeRecompensa =
  | "acesso"
  | "editorial"
  | "bastidor"
  | "poder"
  | "devolver";

export interface RecompensaDefinida {
  id: string;
  familia: FamiliaDeRecompensa;
  titulo: string;
  descricao: string;
  custo: number;
  /** `null` = sem limite (as famílias `poder` e `devolver` não têm estoque). */
  estoque: number | null;
  imagem: string;
  imagemAlt: string;
  imagemCredito: string;
  /** O que a pessoa recebe de fato, dito antes do resgate. */
  entrega: "presencial" | "digital" | "correio" | "no-produto";
}

export type FaseDoResgate =
  | "resgatado"
  | "processando"
  | "separado"
  | "enviado"
  | "entregue";

export interface Resgate {
  id: string;
  recompensaId: string;
  fase: FaseDoResgate;
  em: number;
}

/* ── Efeitos ─────────────────────────────────────────────────────────────── */

export type EfeitoDoMotor =
  | { tipo: "concessao"; ativo: Ativo; valor: number; motivo: string }
  | { tipo: "subiuDeNivel"; nivel: number; nome: string }
  | { tipo: "emblema"; emblema: EmblemaDefinido }
  | { tipo: "missaoConcluida"; missao: MissaoDefinida }
  | { tipo: "metaDaSemanaFechada"; feitas: number }
  | { tipo: "sequenciaEstendida"; contagem: number }
  | { tipo: "sequenciaEmRisco" }
  | { tipo: "sequenciaCongelada" }
  | { tipo: "sequenciaQuebrada"; perdida: number }
  | { tipo: "linguagemNova"; linguagem: string }
  | { tipo: "territorioNovo"; uf: string }
  | { tipo: "resgateFeito"; recompensa: RecompensaDefinida }
  | { tipo: "provaDecidida"; comprovacao: Comprovacao; missao: MissaoDefinida }
  | { tipo: "tagConcedida"; tag: string }
  | { tipo: "tetoAtingido"; oQue: string };

/* ── Rastro — o que a tela «Como ganhar» e o Observatório leem ───────────── */

export interface Rastro {
  evento: EventoDeAtividade;
  dispararam: { regraId: string; versao: number; descreve: string }[];
  ignoradas: { regraId: string; motivo: string }[];
  linhas: LinhaDoLivro[];
  efeitos: EfeitoDoMotor[];
}

/* ── Estado ──────────────────────────────────────────────────────────────── */

export interface EstadoDoMotor {
  personaId: string;
  agora: number;
  livro: LinhaDoLivro[];
  missoes: Record<string, MissaoEmCurso>;
  sequencia: Sequencia;
  emblemas: EmblemaConcedido[];
  resgates: Resgate[];
  /** Publicações do feed vivo — as minhas entram aqui no topo. */
  publicacoes: PublicacaoDefinida[];
  /** Ids das comunidades que esta persona assina. */
  assinadas: string[];
  /** Ids das publicações guardadas para ler depois. */
  publicacoesSalvas: string[];
  reacoesDadas: Record<string, number>;
  presencas: string[];
  /** Linguagens já atravessadas, para o bônus não pagar duas vezes. */
  linguagensAlcancadas: string[];
  ufsAlcancadas: string[];
  /** Dias distintos de acesso já contados. */
  diasDistintos: string[];
  /** Provas enviadas, em qualquer fase. Só as aprovadas viraram linha do livro. */
  comprovacoes: Comprovacao[];
  /**
   * Tags de segmentação ganhas ao concluir missão. Elas não valem ponto: valem
   * ACESSO — é por elas que conteúdo segmentado abre sem o gestor mexer em lista
   * de gente na mão.
   */
  tags: string[];
  execucoesPorRegra: Record<string, number>;
  execucoesHoje: Record<string, number>;
  /** `"evento:tipo:id"` já pontuado — o freio de item repetido, em `motor.ts`. */
  itensPontuados: Record<string, true>;
  ultimoRastro?: Rastro;
  sequenciaDeEventos: number;
}

/* ── Configuração do programa ────────────────────────────────────────────── */

export interface ConfiguracaoDoPrograma {
  nome: string;
  /** Como a moeda se chama na tela. Trocar o nome do programa é trocar isto. */
  termos: { ficha: string; fichaPlural: string; percurso: string; nivel: string };
  nomesDeNivel: string[];
  /** Percurso acumulado para ENTRAR em cada nível. Índice 0 é sempre 0. */
  limiaresDeNivel: number[];
  temporada: { titulo: string; descricao: string; diasRestantes: number };
  /** Bônus por atravessar linguagem/território novo. O coração da mecânica. */
  bonus: { linguagemNova: number; territorioNovo: number };
}

export interface DadosDoPrograma {
  config: ConfiguracaoDoPrograma;
  regras: Regra[];
  missoes: MissaoDefinida[];
  emblemas: EmblemaDefinido[];
  recompensas: RecompensaDefinida[];
  comunidades: ComunidadeDefinida[];
  publicacoes: PublicacaoDefinida[];
  pessoas: PessoaDaComunidade[];
}
