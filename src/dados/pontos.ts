/**
 * pontos.ts — a economia do programa: configuração, regras, missões e emblemas.
 *
 * ESTE ARQUIVO É A ECONOMIA INTEIRA, de propósito. Quanto vale um documentário,
 * quanto vale estar presente, quanto vale sair da própria linguagem — tudo num
 * lugar só, legível por quem não programa. Espalhar isso pelas telas faria cada
 * ajuste de balanceamento virar uma caçada, e balanceamento é o que mais muda.
 *
 * ELE NÃO IMPORTA O GRAFO (DP-F). São literais tipados; o motor é cliente e o
 * grafo tem 23 MB. O que o motor precisa saber sobre o acervo chega pelo contexto
 * do evento, calculado por quem já tem o dado.
 *
 * A ESCALA, e por que ela é esta. Uma pessoa engajada faz num mês algo como 4
 * audiovisuais, 4 episódios, 10 matérias, 1 curso, 1 presença e 20 dias de
 * acesso — o que soma perto de 140 fichas antes de qualquer bônus. A cortesia
 * mais barata das recompensas custa 90 e a de sessão custa 180: meio mês para o primeiro
 * resgate, um mês para o resgate que a pessoa quer. Escala única para as recompensas
 * inteira, porque duas escalas destravam uma prateleira e travam a outra.
 */

// O relógio VIRTUAL, nunca `Date.now()`: as janelas das missões cumulativas têm
// que cair sempre no mesmo lugar em relação à âncora, senão o ciclo de 21 dias
// abre ou fecha dependendo do dia em que a demonstração for feita.
import { DIA_MS, EPOCA } from "@/lib/pontos/relogio";
import type {
  ConfiguracaoDoPrograma,
  EmblemaDefinido,
  MissaoDefinida,
  Regra,
} from "@/lib/pontos/tipos";

/* ── Configuração ────────────────────────────────────────────────────────── */

export const CONFIG: ConfiguracaoDoPrograma = {
  nome: "Repertório",
  termos: {
    ficha: "ficha",
    fichaPlural: "fichas",
    percurso: "percurso",
    nivel: "nível",
  },

  /**
   * Os nomes vêm da metáfora que o produto inteiro já usa — caminhada, trilha,
   * travessia (`dados/caminhada.ts`, `dados/repertorio.ts`). Nível de app que se
   * chama «Bronze/Prata/Ouro» pertence a programa de milhagem; aqui ele descreve
   * alguém que anda por um acervo.
   *
   * DEZOITO NÍVEIS, e não cinco, porque cinco acabavam em seis semanas.
   *
   * A conta que justifica a mudança: somando as regras deste arquivo, um mês de
   * uso engajado — 4 audiovisuais, 4 episódios, 10 matérias, um curso, uma
   * presença e 20 dias de acesso — rende perto de 2.000 de percurso. Com teto em
   * 2.800, a escada inteira era vencida antes do segundo mês, e a partir dali o
   * nível parava de dizer qualquer coisa sobre quem a pessoa virou.
   *
   * A CURVA É ACELERADA DE PROPÓSITO: os quatro primeiros degraus cabem na
   * primeira quinzena, porque quem chega precisa sentir movimento; os últimos
   * levam meses, porque no fim o que o nível mede é permanência. Os cinco nomes
   * originais continuam na escada, nas mesmas posições relativas — quem já
   * jogava não perde a identidade que tinha.
   *
   * OS NOMES SÃO A COISA MAIS BARATA DE TROCAR aqui: são literais, e nenhuma
   * lógica depende deles. A curva é o que exige medição.
   */
  nomesDeNivel: [
    "Curioso",
    "Visitante",
    "Frequentador",
    "Presença certa",
    "Andarilho",
    "Caminhante",
    "Trilheiro",
    "Atravessador",
    "Cartógrafo",
    "Colecionador de olhares",
    "Guia de sala",
    "Anfitrião",
    "Contador de histórias",
    "Curador de bolso",
    "Mestre de trilha",
    "Farol",
    "Memória viva",
    "Repertório vivo",
  ],
  /**
   * O SEGUNDO DEGRAU É 250 E NÃO 150 por causa do saldo de abertura.
   *
   * O motor abre com 180 de percurso («o que você já tinha atravessado», em
   * `motor.ts`). Com o degrau em 150, toda persona nasceria no nível 2 e
   * «Curioso» seria um nome que ninguém ocupa nunca — um degrau morto no primeiro
   * lugar da escada. Quem pegou isso foi o portão 5, que confere o nível inicial.
   */
  limiaresDeNivel: [
    0, 250, 400, 800, 1400, 2200, 3400, 5000, 7000, 9500, 12500, 16000, 20000, 25000, 31000,
    38000, 46000, 55000,
  ],

  temporada: {
    titulo: "Temporada Travessias",
    descricao:
      "A cada temporada, as linguagens que você ainda não atravessou valem mais. O nível e os emblemas são permanentes; o que reinicia é a contagem da temporada.",
    diasRestantes: 18,
  },

  /**
   * O bônus vale mais que o próprio item na maioria dos casos, e é intencional:
   * o programa não quer que você veja mais do mesmo, quer que você saia do que já
   * conhece. Um documentário da sua linguagem rende 5 fichas; o primeiro de uma
   * linguagem nova rende 35.
   */
  bonus: { linguagemNova: 30, territorioNovo: 25 },
};

/* ── Regras ──────────────────────────────────────────────────────────────── */

/**
 * O MESMO ITEM NUNCA CONTA DUAS VEZES, e isso não está escrito aqui: mora em
 * `UMA_VEZ_POR_ITEM`, no motor, porque precisa barrar o evento inteiro — regra,
 * missão e sequência juntas. Enquanto o freio era por regra, reassistir o mesmo
 * documentário três vezes fechava sozinho a missão de temporada.
 *
 * OS TETOS DIÁRIOS são o degrau acima: limitam o VOLUME mesmo quando cada item é
 * legítimo e diferente. Ler 40 matérias num dia não é leitura.
 */
export const REGRAS: Regra[] = [
  {
    id: "r-play",
    versao: 1,
    descreve: "Terminar um filme, série ou documentário no Play",
    quando: "play.midia.concluida",
    entao: [
      { conceder: { ativo: "percurso", valor: 50, motivo: "Audiovisual concluído" } },
      { conceder: { ativo: "ficha", valor: 5, motivo: "Audiovisual concluído" } },
    ],
  },
  {
    id: "r-cast",
    versao: 1,
    descreve: "Ouvir um episódio do Cast até o fim",
    quando: "cast.episodio.concluido",
    entao: [
      { conceder: { ativo: "percurso", valor: 40, motivo: "Episódio concluído" } },
      { conceder: { ativo: "ficha", valor: 4, motivo: "Episódio concluído" } },
    ],
  },
  {
    id: "r-leitura",
    versao: 1,
    descreve: "Ler uma matéria inteira",
    quando: "leitura.materia.concluida",
    maxPorDia: 5,
    entao: [
      { conceder: { ativo: "percurso", valor: 25, motivo: "Matéria lida" } },
      { conceder: { ativo: "ficha", valor: 2, motivo: "Matéria lida" } },
    ],
  },
  {
    id: "r-aula",
    versao: 1,
    descreve: "Concluir uma aula de um curso",
    quando: "curso.aula.concluida",
    entao: [
      { conceder: { ativo: "percurso", valor: 60, motivo: "Aula concluída" } },
      { conceder: { ativo: "ficha", valor: 6, motivo: "Aula concluída" } },
    ],
  },
  {
    id: "r-curso",
    versao: 1,
    descreve: "Concluir um curso inteiro",
    quando: "curso.concluido",
    entao: [
      { conceder: { ativo: "percurso", valor: 200, motivo: "Curso concluído" } },
      { conceder: { ativo: "ficha", valor: 25, motivo: "Curso concluído" } },
    ],
  },
  {
    /**
     * O MAIOR VALOR DO PROGRAMA, e não por acaso: estar presente é a única coisa
     * que a plataforma não consegue substituir. Um app cultural que pague mais por
     * assistir em casa do que por ir ao teatro está otimizando contra si mesmo.
     */
    id: "r-presenca",
    versao: 1,
    descreve: "Confirmar presença num evento com o código do produtor",
    quando: "ocorrencia.presenca.confirmada",
    entao: [
      { conceder: { ativo: "percurso", valor: 150, motivo: "Presença confirmada" } },
      { conceder: { ativo: "ficha", valor: 20, motivo: "Presença confirmada" } },
    ],
  },
  {
    id: "r-salvar",
    versao: 1,
    descreve: "Salvar uma sessão na agenda",
    quando: "ocorrencia.salva",
    maxPorDia: 5,
    entao: [{ conceder: { ativo: "percurso", valor: 10, motivo: "Sessão salva na agenda" } }],
  },
  {
    /**
     * Um dia distinto, não uma sessão. Abrir o app vinte vezes num sábado é um
     * sábado; abrir em três dias diferentes é hábito. O motor já garante o «uma vez
     * por dia» ao registrar a chave do dia; o teto aqui é cinto e suspensório.
     */
    id: "r-retorno",
    versao: 1,
    descreve: "Voltar ao app num dia em que ainda não tinha entrado",
    quando: "acesso.dia.distinto",
    maxPorDia: 1,
    entao: [
      { conceder: { ativo: "percurso", valor: 15, motivo: "Mais um dia de repertório" } },
      { conceder: { ativo: "ficha", valor: 2, motivo: "Mais um dia de repertório" } },
    ],
  },
  {
    id: "r-guardar-publicacao",
    versao: 1,
    descreve: "Guardar uma publicação para ler depois",
    quando: "comunidade.publicacao.salva",
    maxPorDia: 5,
    entao: [{ conceder: { ativo: "percurso", valor: 5, motivo: "Publicação guardada" } }],
  },
  {
    id: "r-comentar",
    versao: 1,
    descreve: "Responder alguém na comunidade",
    quando: "comunidade.comentario.criado",
    maxPorDia: 3,
    entao: [
      { conceder: { ativo: "percurso", valor: 20, motivo: "Resposta na comunidade" } },
      { conceder: { ativo: "reputacao", valor: 6, motivo: "Ajuda a outra pessoa" } },
    ],
  },
  {
    id: "r-reagir",
    versao: 1,
    descreve: "Reagir a uma publicação",
    quando: "comunidade.reacao.dada",
    maxPorDia: 10,
    entao: [{ conceder: { ativo: "percurso", valor: 3, motivo: "Reconhecimento a alguém" } }],
  },
  {
    id: "r-assinar",
    versao: 1,
    descreve: "Assinar uma comunidade do marketplace",
    quando: "comunidade.assinada",
    maxPorDia: 3,
    entao: [{ conceder: { ativo: "percurso", valor: 10, motivo: "Entrou numa comunidade" } }],
  },
  {
    id: "r-disposicoes",
    versao: 1,
    descreve: "Dizer do que você gosta no início",
    quando: "perfil.disposicoes.escolhidas",
    maxPorPersona: 1,
    entao: [
      { conceder: { ativo: "percurso", valor: 60, motivo: "Repertório declarado" } },
      { conceder: { ativo: "ficha", valor: 10, motivo: "Boas-vindas" } },
    ],
  },
];

/* ── Missões ─────────────────────────────────────────────────────────────── */

/**
 * TODA MISSÃO TEM `rota`. Uma missão que pede «ouça um episódio» e não leva ao
 * Cast transfere para a pessoa o trabalho de achar o Cast, e esse trabalho custa
 * mais que a recompensa. Missão sem porta é beco.
 */
export const MISSOES: MissaoDefinida[] = [
  {
    id: "m-dia-leitura",
    tipo: "diaria",
    titulo: "Leia uma matéria hoje",
    descricao: "Uma matéria inteira do acervo editorial. Dois minutos.",
    alvo: 1,
    avancaCom: ["leitura.materia.concluida"],
    percurso: 20,
    fichas: 2,
    minutos: 2,
    expiraEm: "dia",
    rota: "/noticias",
  },
  {
    id: "m-sem-travessia",
    tipo: "semanal",
    titulo: "Atravesse uma linguagem nova",
    descricao: "Termine algo de uma linguagem que ainda não está no seu repertório.",
    alvo: 1,
    avancaCom: ["play.midia.concluida", "cast.episodio.concluido", "leitura.materia.concluida"],
    percurso: 120,
    fichas: 15,
    minutos: 20,
    expiraEm: "semana",
    rota: "/descobrir",
  },
  {
    id: "m-sem-social",
    tipo: "social",
    titulo: "Responda alguém na comunidade",
    descricao: "Uma resposta que ajude quem perguntou.",
    alvo: 1,
    avancaCom: ["comunidade.comentario.criado"],
    percurso: 50,
    fichas: 5,
    minutos: 3,
    expiraEm: "semana",
    rota: "/comunidade",
  },
  {
    id: "m-sem-agenda",
    tipo: "semanal",
    titulo: "Guarde uma sessão para ir",
    descricao: "Salve na agenda alguma coisa que acontece perto de você.",
    alvo: 1,
    avancaCom: ["ocorrencia.salva"],
    percurso: 40,
    fichas: 4,
    minutos: 2,
    expiraEm: "semana",
    rota: "/acontece",
  },
  {
    id: "m-territorio",
    tipo: "territorio",
    titulo: "Conheça outro estado",
    descricao:
      "Descubra algo de uma unidade da federação que ainda não está no seu mapa. São 25 no acervo — e duas que ainda não existem nele.",
    alvo: 1,
    avancaCom: ["play.midia.concluida", "leitura.materia.concluida", "ocorrencia.salva"],
    percurso: 90,
    fichas: 12,
    minutos: 10,
    expiraEm: "semana",
    rota: "/mapa",
  },
  {
    id: "m-temporada-trilha",
    tipo: "temporada",
    titulo: "Complete uma trilha inteira",
    descricao: "Do rap ao teatro documentário: três passos, três linguagens.",
    alvo: 3,
    avancaCom: ["play.midia.concluida", "leitura.materia.concluida", "cast.episodio.concluido"],
    percurso: 300,
    fichas: 40,
    minutos: 0,
    expiraEm: "temporada",
    rota: "/trilha/do-rap-ao-teatro-documentario",
  },

  /* ── Primeiros passos: uma trilha por app do hub ────────────────────────── */

  /**
   * DOZE MISSÕES DE ABERTURA, uma para cada aplicativo de `dados/apps.ts`, e o
   * catálogo do hub é a fonte: app que nascer lá pede a trilha dele aqui.
   *
   * A ESCALA É PROPOSITAL. Vinte de percurso cada, doze delas, dá 240 — e o
   * nível 2 entra em 250. Quem percorre o aplicativo inteiro chega à véspera de
   * subir de nível e sobe no primeiro gesto de verdade que fizer depois. Pagar
   * mais faria o nível 2 ser um prêmio por ter passeado; pagar menos faria a
   * abertura não valer o trabalho.
   *
   * TODAS SÃO NATIVAS. Pedir foto de uma ação que acontece dentro do próprio app
   * seria pedir prova de algo que a plataforma acabou de ver acontecer.
   */
  {
    id: "m-abre-play",
    tipo: "onboarding",
    grupo: "primeiros-passos",
    modelo: "unica",
    titulo: "Primeira sessão",
    descricao: "Assista até o fim um filme, uma série ou uma mostra do Play.",
    alvo: 1,
    avancaCom: ["play.midia.concluida"],
    percurso: 20,
    fichas: 3,
    minutos: 15,
    expiraEm: "nunca",
    rota: "/play",
  },
  {
    id: "m-abre-cast",
    tipo: "onboarding",
    grupo: "primeiros-passos",
    modelo: "unica",
    titulo: "Aperte o play na conversa",
    descricao: "Ouça um episódio inteiro do Cast.",
    alvo: 1,
    avancaCom: ["cast.episodio.concluido"],
    percurso: 20,
    fichas: 3,
    minutos: 30,
    expiraEm: "nunca",
    rota: "/cast",
  },
  {
    id: "m-abre-noticias",
    tipo: "onboarding",
    grupo: "primeiros-passos",
    modelo: "unica",
    titulo: "O que saiu hoje",
    descricao: "Leia uma matéria inteira do acervo editorial.",
    alvo: 1,
    avancaCom: ["leitura.materia.concluida"],
    percurso: 20,
    fichas: 3,
    minutos: 2,
    expiraEm: "nunca",
    rota: "/noticias",
  },
  {
    id: "m-abre-cursos",
    tipo: "onboarding",
    grupo: "primeiros-passos",
    modelo: "unica",
    titulo: "Sente na primeira aula",
    descricao: "Conclua uma aula de qualquer curso aberto.",
    alvo: 1,
    avancaCom: ["curso.aula.concluida"],
    percurso: 20,
    fichas: 3,
    minutos: 12,
    expiraEm: "nunca",
    rota: "/cursos",
  },
  {
    id: "m-abre-acontece",
    tipo: "onboarding",
    grupo: "primeiros-passos",
    modelo: "unica",
    titulo: "Marque na agenda",
    descricao: "Salve uma sessão que acontece perto de você.",
    alvo: 1,
    avancaCom: ["ocorrencia.salva"],
    percurso: 20,
    fichas: 3,
    minutos: 2,
    expiraEm: "nunca",
    rota: "/acontece",
  },
  {
    id: "m-abre-comunidade",
    tipo: "onboarding",
    grupo: "primeiros-passos",
    modelo: "unica",
    titulo: "Puxe uma cadeira",
    descricao: "Assine uma comunidade de produtor, coletivo ou instituição.",
    alvo: 1,
    avancaCom: ["comunidade.assinada"],
    percurso: 20,
    fichas: 3,
    minutos: 1,
    expiraEm: "nunca",
    rota: "/comunidade",
  },
  {
    id: "m-abre-museu",
    tipo: "onboarding",
    grupo: "primeiros-passos",
    modelo: "unica",
    titulo: "Entre na exposição",
    descricao: "Percorra uma exposição do museu virtual até a última sala.",
    alvo: 1,
    avancaCom: ["museu.exposicao.percorrida"],
    percurso: 20,
    fichas: 3,
    minutos: 8,
    expiraEm: "nunca",
    rota: "/museu",
  },
  {
    id: "m-abre-mapa",
    tipo: "onboarding",
    grupo: "primeiros-passos",
    modelo: "unica",
    titulo: "Ache sua cidade",
    descricao: "Abra o mapa e chegue no seu território.",
    alvo: 1,
    avancaCom: ["mapa.territorio.aberto"],
    percurso: 20,
    fichas: 3,
    minutos: 2,
    expiraEm: "nunca",
    rota: "/mapa",
  },
  {
    id: "m-abre-descobrir",
    tipo: "onboarding",
    grupo: "primeiros-passos",
    modelo: "unica",
    titulo: "Deixe o feed te explicar",
    descricao: "Abra um item do Descobrir e leia por que ele apareceu para você.",
    alvo: 1,
    avancaCom: ["descobrir.item.aberto"],
    percurso: 20,
    fichas: 3,
    minutos: 2,
    expiraEm: "nunca",
    rota: "/descobrir",
  },
  {
    id: "m-abre-buscar",
    tipo: "onboarding",
    grupo: "primeiros-passos",
    modelo: "unica",
    titulo: "Atravesse o acervo",
    descricao: "Uma busca que termina em alguma coisa aberta.",
    alvo: 1,
    avancaCom: ["busca.concluida"],
    percurso: 20,
    fichas: 3,
    minutos: 2,
    expiraEm: "nunca",
    rota: "/buscar",
  },
  {
    id: "m-abre-ia",
    tipo: "onboarding",
    grupo: "primeiros-passos",
    modelo: "unica",
    titulo: "Peça um programa",
    descricao: "Descreva o programa que você quer e receba o roteiro.",
    alvo: 1,
    avancaCom: ["ia.roteiro.gerado"],
    percurso: 20,
    fichas: 3,
    minutos: 3,
    expiraEm: "nunca",
    rota: "/ia",
  },
  {
    /**
     * A ÚNICA DA ABERTURA QUE NÃO ABRE NO DIA UM, e o card diz isso: resgatar
     * custa ficha, e quem acabou de chegar não tem. Deixá-la travada sem
     * explicação faria a trilha de doze parecer quebrada logo na estreia.
     */
    id: "m-abre-recompensas",
    tipo: "onboarding",
    grupo: "primeiros-passos",
    modelo: "unica",
    titulo: "O primeiro resgate",
    descricao:
      "Troque fichas por alguma coisa na loja. Esta abre depois: junte fichas nas outras primeiro.",
    alvo: 1,
    avancaCom: ["recompensa.resgatada"],
    percurso: 20,
    fichas: 3,
    minutos: 2,
    expiraEm: "nunca",
    rota: "/recompensas",
  },

  /* ── Perfil ─────────────────────────────────────────────────────────────── */

  {
    id: "m-perfil-completo",
    tipo: "onboarding",
    modelo: "unica",
    titulo: "Complete seu perfil",
    descricao: "Foto, uma linha sobre você e a sua cidade. É o que faz a comunidade te achar.",
    alvo: 1,
    avancaCom: ["perfil.completo"],
    percurso: 50,
    fichas: 5,
    minutos: 3,
    expiraEm: "nunca",
    rota: "/meu",
    tagAoConcluir: "perfil-completo",
    emblemaId: "e-perfil-completo",
  },
  {
    id: "m-perfil-interesses",
    tipo: "onboarding",
    modelo: "unica",
    titulo: "Diga o que te move",
    descricao: "Escolha ao menos três temas. É deles que sai tudo que o app te mostra depois.",
    alvo: 1,
    avancaCom: ["perfil.disposicoes.escolhidas"],
    percurso: 30,
    fichas: 4,
    minutos: 2,
    expiraEm: "nunca",
    rota: "/meu/disposicoes",
    emblemaId: "e-jornada-iniciada",
  },

  /* ── Campo: as missões que pedem prova ──────────────────────────────────── */

  {
    /**
     * A MISSÃO QUE DEFENDE A TESE DO PROGRAMA. O placar não conta fotos, conta
     * ESTADOS diferentes — a mesma coisa que o bônus de travessia já paga no
     * livro, agora visível como disputa. Um ranking por volume aqui premiaria
     * quem fotografa muito no próprio bairro, que é o oposto do que se quer.
     */
    id: "m-campo-brasil",
    tipo: "campo",
    modelo: "cumulativa",
    prova: "midia",
    titulo: "O Brasil que não é o seu",
    descricao:
      "Registre uma manifestação cultural de um estado que não é o seu: festa, feira, artesanato, arquitetura, cozinha.",
    alvo: 5,
    avancaCom: ["missao.prova.aprovada"],
    porEnvio: { percurso: 60, fichas: 8 },
    percurso: 250,
    fichas: 40,
    minutos: 0,
    expiraEm: "ciclo",
    ciclo: { comecaEm: EPOCA - 7 * DIA_MS, fechaEm: EPOCA + 14 * DIA_MS },
    rota: "/desafios/m-campo-brasil",
    maxEnviosPorDia: 1,
    vagas: 1500,
    vagasTomadas: 1284,
    ranking: { metrica: "territorios", bonus: [500, 300, 100] },
    tagAoConcluir: "brasil-alem-2026",
    emblemaId: "e-brasil-alem",
    regrasDeAceite: {
      vale: [
        "Foto sua no lugar, com referência visível de onde é",
        "Festa, feira, ofício, fachada, prato ou instrumento da região",
        "Registro feito na viagem, não antes nem depois",
      ],
      naoVale: [
        "Imagem tirada da internet ou de material de divulgação",
        "Estado que você já contou nesta missão",
        "Foto sem nada que identifique o lugar",
      ],
    },
  },
  {
    /**
     * SEM RANKING DE PROPÓSITO. Esta é a missão de menor barreira do catálogo —
     * cultura que não pede ingresso — e é justamente quem tem menos acesso que
     * ela alcança. Pôr placar aqui transformaria a porta de entrada mais larga
     * numa competição contra quem tem mais tempo livre.
     */
    id: "m-campo-rua",
    tipo: "campo",
    modelo: "cumulativa",
    prova: "midia",
    titulo: "Arte fora do museu",
    descricao:
      "Grafite, cordel, carranca, azulejo de fachada, mural de escola, carro de som, bloco. Cultura que não pede ingresso.",
    alvo: 8,
    avancaCom: ["missao.prova.aprovada"],
    porEnvio: { percurso: 25, fichas: 4 },
    percurso: 150,
    fichas: 25,
    minutos: 0,
    expiraEm: "ciclo",
    ciclo: { comecaEm: EPOCA - 7 * DIA_MS, fechaEm: EPOCA + 14 * DIA_MS },
    rota: "/desafios/m-campo-rua",
    maxEnviosPorDia: 2,
    emblemaId: "e-arte-de-rua",
    regrasDeAceite: {
      vale: [
        "Obra em espaço público, enquadrada de forma legível",
        "Arte de rua, ofício popular, fachada ou intervenção urbana",
        "Uma obra diferente a cada envio",
      ],
      naoVale: [
        "Obra dentro de instituição — essa vale na missão de exposição",
        "Foto repetida de uma obra já enviada",
        "Imagem sem obra nenhuma em quadro",
      ],
    },
  },
  {
    id: "m-primeira-exposicao",
    tipo: "campo",
    modelo: "unica",
    prova: "midia",
    titulo: "Sua primeira exposição",
    descricao:
      "Vá a uma exposição e registre. Uma foto aprovada encerra — é a missão que ensina o envio de prova.",
    alvo: 1,
    avancaCom: ["missao.prova.aprovada"],
    percurso: 150,
    fichas: 20,
    minutos: 0,
    expiraEm: "nunca",
    rota: "/desafios/m-primeira-exposicao",
    tagAoConcluir: "primeira-exposicao",
    emblemaId: "e-primeira-exposicao",
    regrasDeAceite: {
      vale: [
        "Foto dentro do espaço, com obra ou sinalização da mostra em quadro",
        "Print do ingresso com data legível",
        "Registro feito no dia da visita",
      ],
      naoVale: [
        "Foto da fachada sem nada da exposição",
        "Imagem de divulgação da mostra",
        "Print sem data",
      ],
    },
  },
  {
    id: "m-leve-alguem",
    tipo: "campo",
    modelo: "unica",
    prova: "midia",
    titulo: "Leve alguém",
    descricao: "Chame uma pessoa que não iria sozinha e vão juntos. Registre os dois lá.",
    alvo: 1,
    avancaCom: ["missao.prova.aprovada"],
    percurso: 180,
    fichas: 25,
    minutos: 0,
    expiraEm: "nunca",
    rota: "/desafios/m-leve-alguem",
    emblemaId: "e-leve-alguem",
    regrasDeAceite: {
      vale: [
        "Os dois ingressos, ou vocês dois no espaço",
        "Registro feito no dia, no local",
      ],
      naoVale: ["Um ingresso só", "Foto de outro dia ou de outro lugar"],
    },
  },
  {
    id: "m-roteiro-afetivo",
    tipo: "campo",
    modelo: "cumulativa",
    prova: "midia",
    titulo: "Roteiro afetivo",
    descricao:
      "Três paradas de um roteiro histórico da sua cidade, no seu ritmo. Uma foto em cada.",
    alvo: 3,
    avancaCom: ["missao.prova.aprovada"],
    porEnvio: { percurso: 40, fichas: 5 },
    percurso: 200,
    fichas: 30,
    minutos: 0,
    expiraEm: "ciclo",
    ciclo: { comecaEm: EPOCA - 7 * DIA_MS, fechaEm: EPOCA + 14 * DIA_MS },
    rota: "/desafios/m-roteiro-afetivo",
    maxEnviosPorDia: 3,
    emblemaId: "e-roteiro",
    regrasDeAceite: {
      vale: [
        "Uma parada por envio, com o ponto identificável na imagem",
        "As três paradas do mesmo roteiro",
      ],
      naoVale: ["A mesma parada duas vezes", "Ponto de outra cidade"],
    },
  },
  {
    /**
     * A FOTO AQUI É DE OUTRA PESSOA por definição — é disso que a missão trata.
     * Por isso ela pede autorização em «o que vale», na voz da tela, e não numa
     * trava técnica: o combinado com quem ensinou é da pessoa que fotografou.
     */
    id: "m-quem-ensinou",
    tipo: "campo",
    modelo: "unica",
    prova: "midia",
    titulo: "Quem te ensinou",
    descricao:
      "Registre alguém que te passou uma tradição: bordado, receita, reza, brincadeira, instrumento.",
    alvo: 1,
    avancaCom: ["missao.prova.aprovada"],
    percurso: 200,
    fichas: 30,
    minutos: 0,
    expiraEm: "nunca",
    rota: "/desafios/m-quem-ensinou",
    emblemaId: "e-quem-ensinou",
    regrasDeAceite: {
      vale: [
        "A pessoa, ou as mãos dela, junto do que ela faz",
        "Combinado com ela antes — a imagem é dela também",
        "Ofício, receita, canto, reza ou brincadeira passados de alguém para você",
      ],
      naoVale: ["Foto de acervo ou de internet", "Registro feito sem a pessoa saber"],
    },
  },

  /* ── Hábito ─────────────────────────────────────────────────────────────── */

  {
    /**
     * PLACAR POR OFENSIVA, e é o que diferencia esta da missão diária de leitura
     * que já existe: aqui dez matérias num domingo valem UM dia. É a tese de
     * letramento em doses — quem lê todo dia sobe, quem maratona não.
     */
    id: "m-cinco-minutos",
    tipo: "campo",
    modelo: "cumulativa",
    titulo: "Cinco minutos de Brasil",
    descricao: "Uma matéria por dia, no seu café. O placar conta dias diferentes, não volume.",
    alvo: 14,
    avancaCom: ["leitura.materia.concluida"],
    percurso: 220,
    fichas: 35,
    minutos: 2,
    expiraEm: "ciclo",
    ciclo: { comecaEm: EPOCA - 7 * DIA_MS, fechaEm: EPOCA + 14 * DIA_MS },
    rota: "/noticias",
    ranking: { metrica: "frequencia", bonus: [400, 250, 100] },
    emblemaId: "e-leitor-diario",
  },
  {
    id: "m-semana-viva",
    tipo: "campo",
    modelo: "cumulativa",
    titulo: "Semana viva",
    descricao: "Sete dias diferentes com alguma coisa acontecendo. Sem pressa, sem maratona.",
    alvo: 7,
    avancaCom: ["acesso.dia.distinto"],
    percurso: 80,
    fichas: 10,
    minutos: 1,
    expiraEm: "temporada",
    rota: "/descobrir",
  },
  {
    id: "m-estive-la",
    tipo: "campo",
    modelo: "unica",
    titulo: "Estive lá",
    descricao: "Vá a uma sessão e leia o código que o produtor mostra no local.",
    alvo: 1,
    avancaCom: ["ocorrencia.presenca.confirmada"],
    percurso: 120,
    fichas: 15,
    minutos: 0,
    expiraEm: "nunca",
    rota: "/acontece",
    emblemaId: "e-presenca-1",
  },
  {
    id: "m-curso-inteiro",
    tipo: "campo",
    modelo: "unica",
    titulo: "Termine um curso",
    descricao: "Do começo ao fim, com o certificado no perfil.",
    alvo: 1,
    avancaCom: ["curso.concluido"],
    percurso: 200,
    fichas: 25,
    minutos: 0,
    expiraEm: "nunca",
    rota: "/cursos",
  },
];

/* ── Emblemas ────────────────────────────────────────────────────────────── */

/**
 * `comoGanhar` é obrigatório e aparece na tela ANTES do emblema ser ganho.
 * Emblema misterioso é enfeite: a pessoa vê um cadeado, não entende o que fazer e
 * ele deixa de ser meta. Dito na tela, ele vira o mapa do que o produto quer.
 */
export const EMBLEMAS: EmblemaDefinido[] = [
  {
    id: "e-sequencia-4",
    titulo: "Mês de repertório",
    descricao: "Quatro semanas seguidas com pelo menos um gesto cultural.",
    criterio: "sequencia_4",
    comoGanhar: "Termine alguma coisa — ou vá a algum lugar — em quatro semanas seguidas.",
  },
  {
    id: "e-nivel-3",
    titulo: "Andarilho",
    // O ID guarda o nome antigo de propósito: mudá-lo apagaria o emblema de quem
    // já o tinha, porque o estado guarda `emblemaId` e não o critério.
    descricao: "Chegou a Andarilho, o quinto nível de percurso.",
    criterio: "nivel_5",
    comoGanhar: "Acumule 1.400 de percurso.",
  },
  {
    id: "e-linguagens-8",
    titulo: "Oito linguagens",
    descricao: "Atravessou oito das 33 linguagens do acervo.",
    criterio: "linguagens_8",
    comoGanhar: "Termine algo de oito linguagens diferentes. O bônus de travessia conta.",
  },
  {
    id: "e-territorios-5",
    titulo: "Cinco estados",
    descricao: "Alcançou cinco unidades da federação.",
    criterio: "territorios_5",
    comoGanhar: "Descubra algo de cinco estados diferentes — o mapa mostra quais faltam.",
  },
  {
    id: "e-presenca-1",
    titulo: "Estive lá",
    descricao: "Confirmou presença num evento pela primeira vez.",
    criterio: "presencas_1",
    comoGanhar: "Vá a uma sessão e leia o código que o produtor mostra no local.",
  },
  {
    id: "e-reputacao-50",
    titulo: "Voz da comunidade",
    descricao: "Cinquenta de reputação ajudando outras pessoas.",
    criterio: "reputacao_50",
    comoGanhar: "Responda, publique e reconheça o trabalho dos outros na comunidade.",
  },
  {
    id: "e-comunidades-3",
    titulo: "Em rede",
    descricao: "Assina três comunidades do marketplace.",
    criterio: "comunidades_3",
    comoGanhar: "Entre em três comunidades de produtores ou organizações.",
  },

  /* ── Os selos que uma missão entrega ao fechar ──────────────────────────── */

  /**
   * O critério destes é `missao_<id>` — eles não são conquistados por acúmulo, e
   * sim entregues pela missão que os declara em `emblemaId`. A tela de conquistas
   * lê o mesmo critério de sempre e mostra a barra certa; o motor concede no
   * momento em que a missão fecha, sem uma segunda regra dizendo a mesma coisa.
   */
  {
    id: "e-perfil-completo",
    titulo: "Perfil completo",
    descricao: "Foto, apresentação e cidade no lugar.",
    criterio: "missao_m-perfil-completo",
    comoGanhar: "Complete seu perfil: foto, uma linha sobre você e a sua cidade.",
  },
  {
    id: "e-jornada-iniciada",
    titulo: "Jornada iniciada",
    descricao: "Disse ao aplicativo o que te move.",
    criterio: "missao_m-perfil-interesses",
    comoGanhar: "Escolha ao menos três temas de interesse.",
  },
  {
    id: "e-primeira-exposicao",
    titulo: "Primeira exposição",
    descricao: "Foi a uma mostra e registrou.",
    criterio: "missao_m-primeira-exposicao",
    comoGanhar: "Vá a uma exposição e envie a foto do que você viu.",
  },
  {
    id: "e-brasil-alem",
    titulo: "O Brasil que não é o seu",
    descricao: "Registrou cultura de cinco estados que não são o seu.",
    criterio: "missao_m-campo-brasil",
    comoGanhar: "Registre uma manifestação cultural em cinco estados diferentes do seu.",
  },
  {
    id: "e-arte-de-rua",
    titulo: "Olho de rua",
    descricao: "Oito registros de arte que não pede ingresso.",
    criterio: "missao_m-campo-rua",
    comoGanhar: "Envie oito registros de arte em espaço público.",
  },
  {
    id: "e-leve-alguem",
    titulo: "Levei junto",
    descricao: "Chamou alguém que não iria sozinha.",
    criterio: "missao_m-leve-alguem",
    comoGanhar: "Vá a uma sessão com alguém e registre os dois lá.",
  },
  {
    id: "e-roteiro",
    titulo: "Roteiro andado",
    descricao: "Três paradas de um roteiro histórico, a pé.",
    criterio: "missao_m-roteiro-afetivo",
    comoGanhar: "Registre as três paradas de um roteiro histórico da sua cidade.",
  },
  {
    id: "e-quem-ensinou",
    titulo: "Quem me ensinou",
    descricao: "Registrou quem passou adiante uma tradição.",
    criterio: "missao_m-quem-ensinou",
    comoGanhar: "Registre, com autorização, alguém que te ensinou um ofício ou uma tradição.",
  },
  {
    id: "e-leitor-diario",
    titulo: "Cinco minutos por dia",
    descricao: "Quatorze dias de leitura no ciclo.",
    criterio: "missao_m-cinco-minutos",
    comoGanhar: "Leia uma matéria por dia em quatorze dias do ciclo.",
  },
];
