/**
 * motor.ts — o motor de pontos. A única porta de entrada é `emitir()`.
 *
 *   evento → regras → concessão → linha do livro → saldo derivado → efeito
 *
 * NENHUMA TELA ESCREVE ESTADO. Uma tela que fizesse `saldo += 10` destruiria a
 * única coisa que dá valor a este motor: conseguir responder «por que esta pessoa
 * tem 840 de percurso?» com uma lista de linhas, cada uma apontando para o evento
 * e a versão da regra que a originou. É o mesmo compromisso que o resto do projeto
 * tem com procedência, aplicado a um dado que o acervo não tem.
 *
 * ELE VIVE FORA DO REACT. Classe pura, sem `useState` dentro, exposta por
 * `useSyncExternalStore` em `contexto.tsx`. Duas razões: dá para exercitar o motor
 * inteiro num script de verificação sem montar UI nenhuma, e trocar de persona
 * CONSTRÓI UM MOTOR NOVO — nenhum estado da Maria sobrevive à troca para o Carlos,
 * que é a garantia que um singleton mutável não daria.
 *
 * DP-F: este módulo NÃO alcança `@/dados/grafo` nem nada que o importe. Ele é
 * cliente e o grafo tem 23 MB. O que ele precisa saber sobre o acervo — se a
 * linguagem é nova, se a UF é nova — chega pelo CONTEXTO do evento, calculado por
 * quem já tem o dado em mãos.
 */

import { emblemasPendentes, criterioCumprido } from "./emblemas";
import { novaLinha, saldo } from "./livro";
import { avancarMissoes, metaDaSemana } from "./missoes";
import { nivelPara, type Nivel } from "./niveis";
import { EPOCA, DIA_MS, chaveDaSemana, chaveDoDia, indiceDaSemana } from "./relogio";
import {
  aoGestoValido,
  aoVirarPeriodo,
  marcarRiscoSePreciso,
  sequenciaInicial,
} from "./sequencia";
import type { Veredito } from "./validacao";
import type {
  ArquivoDaProva,
  Ativo,
  Comprovacao,
  ContextoDeEvento,
  DadosDoPrograma,
  EfeitoDoMotor,
  EstadoDoMotor,
  EventoDeAtividade,
  LinhaDoLivro,
  NomeDeEvento,
  Rastro,
  Regra,
} from "./tipos";

/**
 * Os gestos que mantêm a sequência viva. Salvar na agenda e assinar comunidade
 * ficam DE FORA de propósito: são gestos de um toque, e uma sequência que se
 * mantém com um toque não mede hábito cultural nenhum — mede abrir o app.
 */
/**
 * Os eventos em que o MESMO item nunca conta duas vezes.
 *
 * O freio precisa valer para o evento inteiro, não para cada regra. Enquanto ele
 * morava dentro de `Regra`, a regra era barrada mas a MISSÃO continuava avançando:
 * dar play cinco vezes no mesmo documentário fechava sozinho a missão de temporada,
 * que pede três itens. «Este item já contou» é um fato sobre o item, não sobre uma
 * das regras que olham para ele — então a verificação mora aqui, antes de tudo.
 */
const UMA_VEZ_POR_ITEM = new Set<NomeDeEvento>([
  "play.midia.concluida",
  "cast.episodio.concluido",
  "leitura.materia.concluida",
  "curso.aula.concluida",
  "curso.concluido",
  "ocorrencia.presenca.confirmada",
  "ocorrencia.salva",
]);

const VALE_SEQUENCIA = new Set<NomeDeEvento>([
  "play.midia.concluida",
  "cast.episodio.concluido",
  "leitura.materia.concluida",
  "curso.aula.concluida",
  "curso.concluido",
  "ocorrencia.presenca.confirmada",
  "comunidade.comentario.criado",
  // Uma prova aprovada é gesto cultural com o mesmo peso dos outros: ir a uma
  // exposição e registrar sustenta a ofensiva tanto quanto terminar um episódio.
  "missao.prova.aprovada",
]);

function estadoInicial(personaId: string, dados: DadosDoPrograma): EstadoDoMotor {
  const agora = EPOCA;

  const estado: EstadoDoMotor = {
    personaId,
    agora,
    livro: [],
    missoes: {},
    sequencia: sequenciaInicial(),
    emblemas: [],
    resgates: [],
    publicacoes: dados.publicacoes.map((p) => ({ ...p, comentarios: [...p.comentarios] })),
    assinadas: ["ic"],
    publicacoesSalvas: [],
    reacoesDadas: {},
    presencas: [],
    linguagensAlcancadas: [],
    ufsAlcancadas: [],
    diasDistintos: [chaveDoDia(agora)],
    comprovacoes: [],
    tags: [],
    execucoesPorRegra: {},
    execucoesHoje: {},
    itensPontuados: {},
    sequenciaDeEventos: 0,
  };

  // O saldo de abertura entra COMO LINHA DO LIVRO, nunca como número solto. Se
  // entrasse como campo, a primeira pergunta do extrato — «de onde vieram estas
  // 45 fichas?» — não teria resposta, e o livro deixaria de fechar na linha um.
  estado.livro.push(
    novaLinha(estado, {
      ativo: "percurso",
      valor: 180,
      sentido: "credito",
      motivo: "Saldo de abertura (o que você já tinha atravessado)",
      eventoOrigemId: "evt_abertura",
    }),
    novaLinha(estado, {
      ativo: "ficha",
      valor: 45,
      sentido: "credito",
      motivo: "Saldo de abertura",
      eventoOrigemId: "evt_abertura",
    }),
    novaLinha(estado, {
      ativo: "reputacao",
      valor: 12,
      sentido: "credito",
      motivo: "Saldo de abertura",
      eventoOrigemId: "evt_abertura",
    }),
  );

  return estado;
}

export class Motor {
  private estado: EstadoDoMotor;
  private readonly dados: DadosDoPrograma;
  private versao = 0;
  private ouvintes = new Set<() => void>();
  private ouvintesDeEfeito = new Set<(efeitos: EfeitoDoMotor[]) => void>();

  constructor(personaId: string, dados: DadosDoPrograma, restaurado?: EstadoDoMotor) {
    this.dados = dados;
    this.estado = restaurado ?? estadoInicial(personaId, dados);
  }

  /* ── Leitura ───────────────────────────────────────────────────────────── */

  get atual(): EstadoDoMotor {
    return this.estado;
  }

  get catalogo(): DadosDoPrograma {
    return this.dados;
  }

  saldoDe(ativo: Ativo): number {
    return saldo(this.estado, ativo);
  }

  nivel(): Nivel {
    const { limiaresDeNivel, nomesDeNivel } = this.dados.config;
    return nivelPara(saldo(this.estado, "percurso"), limiaresDeNivel, nomesDeNivel);
  }

  meta() {
    return metaDaSemana(this.estado, this.dados.missoes);
  }

  /* ── Assinatura (useSyncExternalStore) ─────────────────────────────────── */

  // O desassinante devolve `void`, não o `boolean` de `Set.delete`: tanto
  // `useSyncExternalStore` quanto o retorno de `useEffect` exigem `void ou
  // Destructor`, e devolver o booleano faz o React tratá-lo como destrutor
  // inválido — o tipo reclama, e em runtime a limpeza fica frágil.
  assinar = (ouvinte: () => void): (() => void) => {
    this.ouvintes.add(ouvinte);
    return () => {
      this.ouvintes.delete(ouvinte);
    };
  };

  lerVersao = () => this.versao;

  /** Efeitos são consumidos por quem desenha comemoração, não pelo render. */
  aoEfeito = (ouvinte: (efeitos: EfeitoDoMotor[]) => void): (() => void) => {
    this.ouvintesDeEfeito.add(ouvinte);
    return () => {
      this.ouvintesDeEfeito.delete(ouvinte);
    };
  };

  private confirmar(efeitos: EfeitoDoMotor[]) {
    this.versao++;
    for (const ouvinte of this.ouvintes) ouvinte();
    if (efeitos.length) for (const ouvinte of this.ouvintesDeEfeito) ouvinte(efeitos);
  }

  /* ── A porta de entrada ────────────────────────────────────────────────── */

  emitir(
    nome: NomeDeEvento,
    alvo?: { tipo: string; id: string },
    contexto?: ContextoDeEvento,
  ): Rastro {
    const s = this.estado;
    s.sequenciaDeEventos++;

    const evento: EventoDeAtividade = {
      eventoId: "evt_" + s.sequenciaDeEventos,
      personaId: s.personaId,
      nome,
      ocorridoEm: s.agora,
      alvo,
      contexto,
    };

    const rastro: Rastro = {
      evento,
      dispararam: [],
      ignoradas: [],
      linhas: [],
      efeitos: [],
    };

    // O item repetido para AQUI: nem regra, nem missão, nem sequência, nem
    // embutido. Sem `confirmar()`, porque nada mudou — e um commit sem mudança
    // faria toda tela assinada re-renderizar à toa.
    if (UMA_VEZ_POR_ITEM.has(nome) && alvo) {
      const chave = nome + ":" + alvo.tipo + ":" + alvo.id;
      if (s.itensPontuados[chave]) {
        rastro.ignoradas.push({ regraId: "-", motivo: "este item já pontuou" });
        s.ultimoRastro = rastro;
        return rastro;
      }
      s.itensPontuados[chave] = true;
    }

    const nivelAntes = this.nivel().numero;
    const metaAntes = this.meta();

    // O FATO PODE NÃO TER ACONTECIDO. Um resgate barrado por saldo ou estoque
    // emite o mesmo evento de um resgate que deu certo, e antes disto tudo o que
    // vem depois seguia em frente: a missão «O primeiro resgate» fechava e pagava
    // por uma troca que nunca ocorreu. Quando o embutido recusa o fato, nada mais
    // corre — nem regra, nem bônus, nem sequência, nem missão.
    if (!this.embutidos(evento, rastro)) {
      s.ultimoRastro = rastro;
      this.confirmar(rastro.efeitos);
      return rastro;
    }

    this.avaliarRegras(evento, rastro);
    this.bonusDeTravessia(evento, rastro);

    if (VALE_SEQUENCIA.has(nome)) this.avancarSequencia(rastro);

    // Missões avançam DEPOIS das regras: uma missão que fecha por causa deste
    // evento paga o próprio prêmio na mesma emissão, e a pessoa vê as duas
    // concessões juntas em vez de descobrir a segunda no próximo carregamento.
    // Prova aprovada anda SÓ na missão a que pertence — ver `avancarMissoes`.
    const restrita = nome === "missao.prova.aprovada" ? alvo?.id : undefined;

    // A pontuação por envio é paga ANTES do avanço: ela vale por cada prova
    // aprovada, inclusive nas que não fecham a missão. É a dinâmica de hábito.
    if (nome === "missao.prova.aprovada" && restrita) {
      const missao = this.dados.missoes.find((m) => m.id === restrita);
      if (missao?.porEnvio) {
        const motivo = "Prova aprovada: " + missao.titulo;
        if (missao.porEnvio.percurso > 0) {
          this.creditar(rastro, "percurso", missao.porEnvio.percurso, motivo, evento.eventoId);
        }
        if (missao.porEnvio.fichas > 0) {
          this.creditar(rastro, "ficha", missao.porEnvio.fichas, motivo, evento.eventoId);
        }
      }
    }

    for (const avanco of avancarMissoes(s, this.dados.missoes, nome, 1, restrita)) {
      if (!avanco.concluiu) continue;
      this.creditar(rastro, "percurso", avanco.missao.percurso, "Missão: " + avanco.missao.titulo, evento.eventoId);
      if (avanco.missao.fichas > 0) {
        this.creditar(rastro, "ficha", avanco.missao.fichas, "Missão: " + avanco.missao.titulo, evento.eventoId);
      }

      // A tag é o que a conclusão ENTREGA além de ponto: ela abre conteúdo
      // segmentado sem ninguém mexer em lista de gente na mão.
      const tag = avanco.missao.tagAoConcluir;
      if (tag && !s.tags.includes(tag)) {
        s.tags.push(tag);
        rastro.efeitos.push({ tipo: "tagConcedida", tag });
      }

      const emblemaId = avanco.missao.emblemaId;
      if (emblemaId && !s.emblemas.some((e) => e.emblemaId === emblemaId)) {
        const emblema = this.dados.emblemas.find((e) => e.id === emblemaId);
        if (emblema) {
          s.emblemas.push({ emblemaId, concedidoEm: s.agora });
          rastro.efeitos.push({ tipo: "emblema", emblema });
        }
      }

      rastro.efeitos.push({ tipo: "missaoConcluida", missao: avanco.missao });
    }

    for (const emblema of emblemasPendentes(s, this.dados.emblemas)) {
      if (!criterioCumprido(s, this.dados.config, emblema)) continue;
      s.emblemas.push({ emblemaId: emblema.id, concedidoEm: s.agora });
      rastro.efeitos.push({ tipo: "emblema", emblema });
    }

    const nivelDepois = this.nivel();
    if (nivelDepois.numero > nivelAntes) {
      rastro.efeitos.push({
        tipo: "subiuDeNivel",
        nivel: nivelDepois.numero,
        nome: nivelDepois.nome,
      });
    }

    const metaDepois = this.meta();
    if (metaAntes.feitas < metaAntes.alvo && metaDepois.feitas >= metaDepois.alvo) {
      rastro.efeitos.push({ tipo: "metaDaSemanaFechada", feitas: metaDepois.feitas });
    }

    s.ultimoRastro = rastro;
    this.confirmar(rastro.efeitos);
    return rastro;
  }

  /* ── Comprovações ──────────────────────────────────────────────────────── */

  /**
   * Registra a prova enviada. NÃO EMITE EVENTO E NÃO TOCA O LIVRO — é só um fato
   * pendente entrando na fila. O saldo depois desta chamada é idêntico ao de
   * antes dela, e é isso que separa este desenho daquele em que o ponto chega
   * antes de ser merecido e some depois num estorno que a pessoa não entende.
   */
  registrarProva(missaoId: string, arquivo: ArquivoDaProva, uf?: string): Comprovacao {
    const s = this.estado;
    s.sequenciaDeEventos++;

    const comprovacao: Comprovacao = {
      id: "cpv_" + s.sequenciaDeEventos,
      missaoId,
      arquivo,
      fase: "analisando",
      confianca: 0,
      uf,
      enviadaEm: s.agora,
    };

    s.comprovacoes.unshift(comprovacao);
    this.confirmar([]);
    return comprovacao;
  }

  /**
   * Aplica o veredito. A aprovação — e SÓ ela — vira evento, e daí para frente é
   * o caminho de sempre: regra, concessão, linha do livro, missão, emblema.
   */
  decidirProva(
    comprovacaoId: string,
    veredito: Veredito,
  ): { comprovacao: Comprovacao; efeitos: EfeitoDoMotor[] } {
    const s = this.estado;
    const comprovacao = s.comprovacoes.find((c) => c.id === comprovacaoId);
    if (!comprovacao) {
      throw new Error("Comprovação inexistente: " + comprovacaoId);
    }

    comprovacao.fase = veredito.fase;
    comprovacao.confianca = veredito.confianca;
    comprovacao.leitura = veredito.leitura;
    comprovacao.motivo = veredito.motivo;
    comprovacao.decididaEm = s.agora;

    const missao = this.dados.missoes.find((m) => m.id === comprovacao.missaoId);
    const decidida: EfeitoDoMotor[] = missao
      ? [{ tipo: "provaDecidida", comprovacao, missao }]
      : [];

    if (veredito.fase !== "aprovada") {
      this.confirmar(decidida);
      return { comprovacao, efeitos: decidida };
    }

    const rastro = this.emitir("missao.prova.aprovada", {
      tipo: "missao",
      id: comprovacao.missaoId,
    });

    // `emitir` já confirmou com os efeitos dele; esta segunda confirmação leva a
    // decisão em si, que é o que a celebração escuta.
    this.confirmar(decidida);
    return { comprovacao, efeitos: [...rastro.efeitos, ...decidida] };
  }

  /* ── Comportamentos que não são regra ──────────────────────────────────── */

  /**
   * O que muda o estado do MUNDO, e por isso não pode viver numa regra: regra
   * concede ativo, embutido registra fato. Separar os dois é o que permite trocar
   * a economia inteira (quanto vale cada coisa) sem tocar no que o produto faz.
   *
   * DEVOLVE SE O FATO ACONTECEU. Quase todo evento é um fato consumado quando
   * chega aqui — o player terminou, a pessoa comentou. O resgate é a exceção: ele
   * PEDE alguma coisa que o motor pode recusar, e recusar em silêncio deixaria o
   * resto da emissão pagando por um gesto que não houve.
   */
  private embutidos(evento: EventoDeAtividade, rastro: Rastro): boolean {
    const s = this.estado;
    const ctx = evento.contexto ?? {};

    switch (evento.nome) {
      case "acesso.dia.distinto": {
        const chave = chaveDoDia(s.agora);
        if (s.diasDistintos.includes(chave)) break;
        s.diasDistintos.push(chave);
        break;
      }

      case "ocorrencia.presenca.confirmada": {
        const id = evento.alvo?.id;
        if (!id || s.presencas.includes(id)) break;
        s.presencas.push(id);
        break;
      }

      case "comunidade.reacao.dada": {
        const id = evento.alvo?.id ?? "";
        s.reacoesDadas[id] = (s.reacoesDadas[id] ?? 0) + 1;
        const publicacao = s.publicacoes.find((p) => p.id === id);
        if (publicacao) publicacao.reacoes += 1;
        break;
      }

      case "comunidade.assinada": {
        const id = evento.alvo?.id;
        if (!id || s.assinadas.includes(id)) break;
        s.assinadas.push(id);
        break;
      }

      case "comunidade.publicacao.salva": {
        const id = evento.alvo?.id;
        if (!id) break;
        // Alternar: o mesmo gesto guarda e devolve. Salvar sem poder dessalvar
        // é uma lista que só cresce, e ninguém volta numa lista assim.
        s.publicacoesSalvas = s.publicacoesSalvas.includes(id)
          ? s.publicacoesSalvas.filter((x) => x !== id)
          : [...s.publicacoesSalvas, id];
        break;
      }

      case "comunidade.comentario.criado": {
        const publicacao = s.publicacoes.find((p) => p.id === evento.alvo?.id);
        if (!publicacao) break;
        const comentario = {
          autorId: "eu",
          corpo: (ctx.corpo as string) ?? "",
          quandoRotulo: "agora",
          respostas: [],
        };
        const indicePai = ctx.respostaA as number | undefined;
        if (indicePai !== undefined && publicacao.comentarios[indicePai]) {
          const pai = publicacao.comentarios[indicePai];
          pai.respostas = [...(pai.respostas ?? []), comentario];
        } else {
          publicacao.comentarios.push(comentario);
        }
        break;
      }

      case "recompensa.resgatada": {
        const recompensa = this.dados.recompensas.find((r) => r.id === evento.alvo?.id);
        if (!recompensa) return false;

        // REVALIDA O SALDO mesmo com a tela já tendo validado. A tela valida para
        // não oferecer o que não dá; o motor valida porque é ele que responde pelo
        // livro — e um debitar que passa por cima do saldo produz saldo negativo,
        // que nenhuma tela sabe desenhar.
        if (saldo(s, "ficha") < recompensa.custo) {
          rastro.efeitos.push({ tipo: "tetoAtingido", oQue: "Fichas insuficientes" });
          return false;
        }
        if (recompensa.estoque !== null && recompensa.estoque <= 0) {
          rastro.efeitos.push({ tipo: "tetoAtingido", oQue: "Recompensa esgotada" });
          return false;
        }

        const linha = novaLinha(s, {
          ativo: "ficha",
          valor: recompensa.custo,
          sentido: "debito",
          motivo: "Resgate: " + recompensa.titulo,
          eventoOrigemId: evento.eventoId,
        });
        s.livro.push(linha);
        rastro.linhas.push(linha);

        // O estoque DECREMENTA. Na origem deste porte ele não decrementava, e o
        // efeito era umas recompensas que aceita mais resgates do que tem itens — o tipo
        // de bug que só aparece no dia da entrega.
        if (recompensa.estoque !== null) recompensa.estoque -= 1;

        s.resgates.unshift({
          id: "res_" + s.sequenciaDeEventos,
          recompensaId: recompensa.id,
          fase: "resgatado",
          em: s.agora,
        });
        rastro.efeitos.push({ tipo: "resgateFeito", recompensa });
        break;
      }

      default:
        break;
    }

    return true;
  }

  /* ── Regras ────────────────────────────────────────────────────────────── */

  private avaliarRegras(evento: EventoDeAtividade, rastro: Rastro) {
    const s = this.estado;

    for (const regra of this.dados.regras) {
      const quando = Array.isArray(regra.quando) ? regra.quando : [regra.quando];
      if (!quando.includes(evento.nome)) continue;

      if (regra.se && !regra.se({ evento, estado: s })) {
        rastro.ignoradas.push({ regraId: regra.id, motivo: "condição não bateu" });
        continue;
      }

      if (regra.maxPorPersona !== undefined) {
        if ((s.execucoesPorRegra[regra.id] ?? 0) >= regra.maxPorPersona) {
          rastro.ignoradas.push({ regraId: regra.id, motivo: "teto da persona atingido" });
          continue;
        }
      }

      if (regra.maxPorDia !== undefined) {
        const chave = regra.id + ":" + chaveDoDia(s.agora);
        if ((s.execucoesHoje[chave] ?? 0) >= regra.maxPorDia) {
          rastro.ignoradas.push({ regraId: regra.id, motivo: "teto diário atingido" });
          rastro.efeitos.push({ tipo: "tetoAtingido", oQue: regra.descreve });
          continue;
        }
        s.execucoesHoje[chave] = (s.execucoesHoje[chave] ?? 0) + 1;
      }

      s.execucoesPorRegra[regra.id] = (s.execucoesPorRegra[regra.id] ?? 0) + 1;
      rastro.dispararam.push({
        regraId: regra.id,
        versao: regra.versao,
        descreve: regra.descreve,
      });

      this.aplicar(regra, evento, rastro);
    }
  }

  private aplicar(regra: Regra, evento: EventoDeAtividade, rastro: Rastro) {
    for (const acao of regra.entao) {
      if ("conceder" in acao) {
        this.creditar(
          rastro,
          acao.conceder.ativo,
          acao.conceder.valor,
          acao.conceder.motivo,
          evento.eventoId,
          regra,
        );
      } else if ("debitar" in acao) {
        const linha = novaLinha(this.estado, {
          ativo: acao.debitar.ativo,
          valor: acao.debitar.valor,
          sentido: "debito",
          motivo: acao.debitar.motivo,
          eventoOrigemId: evento.eventoId,
          regraId: regra.id,
          regraVersao: regra.versao,
        });
        this.estado.livro.push(linha);
        rastro.linhas.push(linha);
      } else if ("concederEmblema" in acao) {
        const jaTem = this.estado.emblemas.some((e) => e.emblemaId === acao.concederEmblema.emblemaId);
        if (jaTem) continue;
        const emblema = this.dados.emblemas.find((e) => e.id === acao.concederEmblema.emblemaId);
        if (!emblema) continue;
        this.estado.emblemas.push({ emblemaId: emblema.id, concedidoEm: this.estado.agora });
        rastro.efeitos.push({ tipo: "emblema", emblema });
      }
    }
  }

  private creditar(
    rastro: Rastro,
    ativo: Ativo,
    valor: number,
    motivo: string,
    eventoId: string,
    regra?: Regra,
  ): LinhaDoLivro {
    const linha = novaLinha(this.estado, {
      ativo,
      valor,
      sentido: "credito",
      motivo,
      eventoOrigemId: eventoId,
      regraId: regra?.id,
      regraVersao: regra?.versao,
    });
    this.estado.livro.push(linha);
    rastro.linhas.push(linha);
    rastro.efeitos.push({ tipo: "concessao", ativo, valor, motivo });
    return linha;
  }

  /* ── O bônus que amarra a economia à tese ──────────────────────────────── */

  /**
   * Atravessar uma linguagem ou um território pela primeira vez vale mais, e essa
   * é a diferença entre este programa e um contador de cliques. O indicador de
   * ampliação de repertório — que é a métrica de impacto que a proposta defende —
   * deixa de ser um número no Observatório e vira o que a pessoa SENTE ao ganhar.
   *
   * O bônus é uma LINHA PRÓPRIA no livro, com motivo dizendo qual linguagem foi.
   * Somá-lo ao crédito principal daria o mesmo saldo e apagaria a única informação
   * que interessa aqui: que aquela ficha veio de sair do próprio repertório.
   */
  private bonusDeTravessia(evento: EventoDeAtividade, rastro: Rastro) {
    const s = this.estado;
    const ctx = evento.contexto;
    if (!ctx) return;

    const linguagem = ctx.linguagemNova;
    if (linguagem && !s.linguagensAlcancadas.includes(linguagem)) {
      s.linguagensAlcancadas.push(linguagem);
      this.creditar(
        rastro,
        "ficha",
        this.dados.config.bonus.linguagemNova,
        "Primeira vez em " + linguagem,
        evento.eventoId,
      );
      rastro.efeitos.push({ tipo: "linguagemNova", linguagem });
    }

    const uf = ctx.territorioNovo;
    if (uf && !s.ufsAlcancadas.includes(uf)) {
      s.ufsAlcancadas.push(uf);
      this.creditar(
        rastro,
        "ficha",
        this.dados.config.bonus.territorioNovo,
        "Primeira vez em " + uf,
        evento.eventoId,
      );
      rastro.efeitos.push({ tipo: "territorioNovo", uf });
    }
  }

  /* ── Sequência ─────────────────────────────────────────────────────────── */

  private avancarSequencia(rastro: Rastro) {
    const resultado = aoGestoValido(this.estado.sequencia, this.estado.agora);
    this.estado.sequencia = resultado.sequencia;
    if (resultado.estendeu) {
      rastro.efeitos.push({ tipo: "sequenciaEstendida", contagem: resultado.sequencia.contagem });
    }
  }

  /* ── Viagem no tempo ───────────────────────────────────────────────────── */

  /**
   * Avança o relógio virtual e faz o motor reagir a cada fronteira de SEMANA
   * cruzada, uma por vez. Pular direto para o destino saltaria as viradas
   * intermediárias e a escada de proteção nunca desceria um degrau — que é
   * justamente o que a demonstração precisa mostrar.
   */
  avancarDias(dias: number): EfeitoDoMotor[] {
    const s = this.estado;
    const efeitos: EfeitoDoMotor[] = [];
    const semanaAntes = indiceDaSemana(s.agora);

    s.agora += dias * DIA_MS;

    for (let semana = semanaAntes; semana < indiceDaSemana(s.agora); semana++) {
      const resultado = aoVirarPeriodo(s.sequencia, "s" + semana);
      s.sequencia = resultado.sequencia;
      if (resultado.emRisco) efeitos.push({ tipo: "sequenciaEmRisco" });
      if (resultado.congelou) efeitos.push({ tipo: "sequenciaCongelada" });
      if (resultado.quebrou) efeitos.push({ tipo: "sequenciaQuebrada", perdida: resultado.quebrou });
    }

    const risco = marcarRiscoSePreciso(s.sequencia, s.agora);
    s.sequencia = risco.sequencia;
    if (risco.virou) efeitos.push({ tipo: "sequenciaEmRisco" });

    // Entregas andam com o tempo: um resgate parado em «resgatado» para sempre é
    // um beco — a tela promete cinco etapas e mostra uma.
    const FASES = ["resgatado", "processando", "separado", "enviado", "entregue"] as const;
    for (const resgate of s.resgates) {
      const indice = FASES.indexOf(resgate.fase);
      const avanco = Math.min(FASES.length - 1, indice + dias);
      resgate.fase = FASES[avanco];
    }

    this.confirmar(efeitos);
    return efeitos;
  }

  /** A chave da semana corrente — usada pelo rótulo da tela de sequência. */
  chaveDaSemanaAtual(): string {
    return chaveDaSemana(this.estado.agora);
  }
}

