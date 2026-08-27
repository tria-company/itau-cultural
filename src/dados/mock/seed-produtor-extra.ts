/**
 * seed-produtor-extra.ts, o volume da demonstração: oito registros por pauta.
 *
 * POR QUE UM ARQUIVO SEPARADO. `seed-produtor.ts` semeia o registro CANÔNICO de cada pauta,
 * e cada um deles carrega um argumento medido: o Cast nasce rascunho porque o acervo não
 * declara fonte de áudio, o Espaço nasce rascunho porque não há endereço em lugar nenhum, e
 * `medidasDaMigracaoDeMuseu()` afirma 2 exposições permanentes contra um portão que quebra
 * o build se o número mudar. Engordar aqueles seeders mexeria nas medidas que eles provam.
 * Este arquivo só ACRESCENTA volume, e os canônicos continuam intocados.
 *
 * O VOLUME NÃO INVENTA CONTEÚDO. Cada registro extra nasce de uma entidade REAL do acervo,
 * lida na mesma ordem determinística do canônico: título, resumo, capa com crédito e
 * vocabulário vêm do grafo. O que é autorado, e só isso, são os poucos campos que o acervo
 * não tem (a chamada do edital, as edições do programa), e eles repetem a forma do
 * registro canônico, que já declara isso.
 *
 * A SITUAÇÃO SEGUE O ARGUMENTO DA PAUTA. Onde o canônico nasce rascunho por uma lacuna
 * medida (cast, espaços, mídia, programa), os extras nascem rascunho pela mesma razão:
 * publicá-los faria a semente contradizer o motivo que a própria tela declara.
 *
 * DETERMINISMO, como o resto: `amostra` é aritmética sobre índice, sem sorteio e sem
 * relógio. Rodar duas vezes devolve o mesmo JSON, byte a byte.
 */

import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { corpoPorSlug } from "@/dados/corpos";
import { ocorrenciasDe } from "@/dados/grafo";
import { ORGANIZACAO_DO_PRODUTOR, PRODUTOR_DA_DEMONSTRACAO } from "@/dados/mock/seed";
import {
  CONTEXTO_DO_PRODUTOR,
  amostra,
  baseDe,
  entidadesDe,
  resumoCurto,
  textoDoExtra,
} from "@/dados/mock/seed-produtor";
import { comChavesDoRegistro, precoVazio, registroVazio } from "@/dados/tipos-produtor";
import type { Entidade } from "@/dados/tipos";
import type {
  Registro,
  RegistroDeCast,
  RegistroDeCuradoria,
  RegistroDeEdital,
  RegistroDeEspaco,
  RegistroDeMidia,
  RegistroDeMuseu,
  RegistroDePlay,
  RegistroDePrograma,
  RegistroDeCurso,
  RegistroEditorial,
} from "@/dados/tipos-produtor";

/** Quantos registros cada pauta tem no fim, somando o canônico com os extras daqui. */
export const REGISTROS_POR_PAUTA = 8;

/** O id dos extras começa em 100 para nunca colidir com o canônico, que usa 001 e 002. */
function idExtra(pauta: string, i: number): string {
  return `${pauta}:produtor:${String(100 + i)}`;
}

/**
 * `n` entidades DISTINTAS da lista, a partir de um deslocamento próprio da pauta. Duas
 * pautas com deslocamentos diferentes não semeiam o mesmo evento duas vezes, e o `Set`
 * garante que a dobra de `amostra` não repita dentro da mesma pauta.
 */
function varias(lista: readonly Entidade[], deslocamento: number, n: number): Entidade[] {
  const vistos = new Set<string>();
  const saida: Entidade[] = [];
  for (let i = 0; saida.length < n && i < lista.length * 3; i += 1) {
    const e = amostra(lista, deslocamento + i);
    if (!e || vistos.has(e.id)) continue;
    vistos.add(e.id);
    saida.push(e);
  }
  return saida;
}

/** Publicado sim, publicado não: a lista fica viva sem que a metade publicada dependa
 *  de sorteio. O índice decide, e o índice é estável. */
function situacaoAlternada(i: number): "publicado" | "rascunho" {
  return i % 3 === 2 ? "rascunho" : "publicado";
}

function carimbo(situacao: "publicado" | "rascunho"): string | null {
  return situacao === "publicado" ? DATA_DE_REFERENCIA : null;
}

// ---------------------------------------------------------------------------

function agendaExtra(): Registro[] {
  const eventos = entidadesDe("evento").filter((e) => ocorrenciasDe(e.id).length > 0);
  return varias(eventos, 11, 3).map((e, i) => {
    const situacao = situacaoAlternada(i);
    const base = baseDe(e, idExtra("agenda", i + 1), "agenda") as Registro & { pauta: "agenda" };
    const ocorrencias = ocorrenciasDe(e.id);
    const temporadaId = `temporada:${e.id}`;
    return comChavesDoRegistro({
      ...base,
      pauta: "agenda" as const,
      situacao,
      visibilidade: "publico" as const,
      publicadoEm: carimbo(situacao),
      obraId: null,
      obraTitulo: null,
      obraProposta: false,
      modalidade: "presencial" as const,
      plataforma: "",
      linkDaTransmissao: "",
      aoVivo: false,
      formato: "espetaculo" as const,
      programacao: "sessoes" as const,
      elenco: [],
      temporadas: [
        {
          id: temporadaId,
          espacoId: null,
          espacoTitulo: null,
          inicio: (ocorrencias[0]?.inicio ?? DATA_DE_REFERENCIA).slice(0, 10),
          fim: (ocorrencias[ocorrencias.length - 1]?.inicio ?? DATA_DE_REFERENCIA).slice(0, 10),
          longaDuracao: false,
          espacoPedido: false,
        },
      ],
      // As sessões são as OCORRÊNCIAS REAIS do acervo, com a hora que ele publica.
      sessoes: ocorrencias.slice(0, 4).map((o, j) => ({
        id: `sessao:${e.id}:${j}`,
        temporadaId,
        inicio: o.inicio.length >= 16 ? o.inicio.slice(0, 16) : `${o.inicio.slice(0, 10)}T20:00`,
        fim: null,
        duracaoMinutos: null,
        espacoId: null,
        gratuito: true,
        preco: null,
        precoEstruturado: null,
        esgotado: false,
        cancelada: false,
        motivoDoCancelamento: null,
      })),
      cobranca: "gratuito" as const,
      preco: precoVazio(),
      canalIngresso: "bilheteria-no-local" as const,
      linkDeIngresso: null,
      inscricao: null,
      vagas: null,
      prazoDeInscricao: null,
      faixaEtaria: "livre" as const,
      acessibilidadeVariaPorSessao: false,
      programaId: null,
    });
  });
}

function playExtra(): RegistroDePlay[] {
  return varias(entidadesDe("midia"), 17, 7).map((e, i) => {
    // Só as mídias com corpo coletado têm id de vídeo; sem ele o registro nasce RASCUNHO,
    // que é a mesma regra do canônico: um Play sem fonte não toca.
    const idDoVideo = corpoPorSlug(e.slug)?.youtubeId ?? "";
    const situacao = idDoVideo === "" ? "rascunho" : "publicado";
    const base = baseDe(e, idExtra("play", i + 1), "play") as RegistroDePlay;
    return comChavesDoRegistro({
      ...base,
      pauta: "play" as const,
      situacao,
      visibilidade: "publico" as const,
      publicadoEm: carimbo(situacao),
      tipo: "video" as const,
      serieId: null,
      serieTitulo: null,
      numeroDoEpisodio: null,
      itens: [],
      fonte_video: "youtube" as const,
      idDoVideo,
      linkExterno: "",
      duracaoMinutos: null,
      data: textoDoExtra(e, "publicadoEm").slice(0, 10) || DATA_DE_REFERENCIA,
      direito: {
        permiteOffline: false,
        permiteIncorporar: true,
        titular: ORGANIZACAO_DO_PRODUTOR,
        declarado: true,
      },
      pontes: [],
    });
  });
}

function castExtra(): RegistroDeCast[] {
  const podcasts = entidadesDe("midia").filter((e) => textoDoExtra(e, "categoria") === "podcasts");
  return varias(podcasts.length > 0 ? podcasts : entidadesDe("midia"), 29, 7).map((e, i) => {
    const corpo = corpoPorSlug(e.slug);
    const base = baseDe(e, idExtra("cast", i + 1), "cast") as RegistroDeCast;
    return comChavesDoRegistro({
      ...base,
      pauta: "cast" as const,
      // RASCUNHO, como o canônico: os 336 podcasts do acervo não declaram fonte de áudio,
      // e publicar um episódio que não toca seria anunciar o que o produto não entrega.
      situacao: "rascunho" as const,
      visibilidade: "publico" as const,
      programaId: null,
      programaTitulo: e.titulo.split(/[#:]/)[0]?.trim() ?? e.titulo,
      numeroDoEpisodio: null,
      temporada: null,
      urlDoSpotify: corpo?.spotify?.url ?? "",
      especie: corpo?.spotify?.especie === "show" ? ("show" as const) : ("episode" as const),
      linkExterno: "",
      duracaoMinutos: null,
      data: textoDoExtra(e, "publicadoEm").slice(0, 10) || DATA_DE_REFERENCIA,
      participantes: [],
      transcricao: "",
    });
  });
}

function museuExtra(): RegistroDeMuseu[] {
  // EM CARTAZ, e não permanente: as duas permanentes são a migração medida, e um portão
  // afirma que são duas. O que entra aqui é exposição em cartaz, sobre evento real.
  const eventos = entidadesDe("evento").filter((e) =>
    (e.titulo + (e.resumo ?? "")).toLowerCase().includes("exposi"),
  );
  const pool = eventos.length >= 6 ? eventos : entidadesDe("evento");
  return varias(pool, 37, 6).map((e, i) => {
    const situacao = situacaoAlternada(i);
    const base = baseDe(e, idExtra("museu", i + 1), "museu") as RegistroDeMuseu;
    return comChavesDoRegistro({
      ...base,
      pauta: "museu" as const,
      situacao,
      visibilidade: "publico" as const,
      publicadoEm: carimbo(situacao),
      objeto: "em-cartaz" as const,
      espacoId: null,
      espacoTitulo: null,
      kicker: "",
      subtitulo: "",
      lead: resumoCurto(e),
      andares: "",
      entrada: "",
      horario: "",
      galeria: [],
      videos: [],
      textos: [],
      percurso: [],
      eventoId: null,
    });
  });
}

function cursosExtra(): RegistroDeCurso[] {
  return varias(entidadesDe("formacao"), 43, 7).map((e, i) => {
    const situacao = situacaoAlternada(i);
    const base = baseDe(e, idExtra("cursos", i + 1), "cursos") as RegistroDeCurso;
    return comChavesDoRegistro({
      ...base,
      pauta: "cursos" as const,
      situacao,
      visibilidade: "publico" as const,
      publicadoEm: carimbo(situacao),
      formato: "curso" as const,
      modalidade: "online" as const,
      plataforma: "Itaú Cultural Play",
      espacoId: null,
      espacoTitulo: null,
      inicio: textoDoExtra(e, "inicio") || DATA_DE_REFERENCIA,
      fim: textoDoExtra(e, "fim"),
      diasEHorarios: "",
      cargaHoraria: "",
      inscricaoAberta: false,
      vagas: null,
      prazoDeInscricao: null,
      linkDeInscricao: "",
      cobranca: "gratuito" as const,
      preco: precoVazio(),
      publicoAlvo: "",
      preRequisitos: "",
      certificado: false,
      materialDidatico: [],
      aceitaVisitaEducativa: false,
      cancelado: false,
      motivoDoCancelamento: null,
    });
  });
}

function editorialExtra(): RegistroEditorial[] {
  return varias(entidadesDe("conteudo"), 53, 7).map((e, i) => {
    const corpo = corpoPorSlug(e.slug);
    const blocos = (corpo?.blocos ?? [])
      .map((b) =>
        b.tipo === "p"
          ? { tipo: "paragrafo" as const, texto: b.texto, imagem: null }
          : b.tipo === "h"
            ? { tipo: "subtitulo" as const, texto: b.texto, imagem: null }
            : null,
      )
      .filter((b): b is { tipo: "paragrafo" | "subtitulo"; texto: string; imagem: null } => b !== null);
    // Sem corpo coletado a matéria nasce RASCUNHO: publicar uma página sem texto é
    // exatamente a lacuna que o produto mede (53 corpos para 1.850 páginas).
    const situacao = blocos.length > 0 ? "publicado" : "rascunho";
    const base = baseDe(e, idExtra("editorial", i + 1), "editorial") as RegistroEditorial;
    return comChavesDoRegistro({
      ...base,
      pauta: "editorial" as const,
      situacao,
      visibilidade: "publico" as const,
      publicadoEm: carimbo(situacao),
      familia: "noticia" as const,
      secao: "noticias",
      categoria: textoDoExtra(e, "categoria"),
      chapeu: "",
      lead: resumoCurto(e),
      data: textoDoExtra(e, "publicadoEm").slice(0, 10) || DATA_DE_REFERENCIA,
      autorNome: corpo?.autor?.nome ?? "",
      autorDescricao: "",
      corpo: blocos,
      pontes: [],
    });
  });
}

function curadoriaExtra(): RegistroDeCuradoria[] {
  // O acervo tem UMA trilha. Os extras são DESTAQUES e PONTES, que são os outros dois
  // objetos da pauta, e são justamente as arestas que medem zero hoje.
  const eventos = entidadesDe("evento");
  const obras = entidadesDe("obra");
  return Array.from({ length: 7 }, (_, i) => {
    const alvo = amostra(eventos, 59 + i);
    const outro = amostra(obras.length > 0 ? obras : eventos, 71 + i);
    const ehPonte = i % 2 === 1;
    const situacao = situacaoAlternada(i);
    const vazio = registroVazio(
      idExtra("curadoria", i + 1),
      "curadoria",
      CONTEXTO_DO_PRODUTOR,
    ) as RegistroDeCuradoria;
    return comChavesDoRegistro({
      ...vazio,
      pauta: "curadoria" as const,
      situacao,
      visibilidade: "publico" as const,
      publicadoEm: carimbo(situacao),
      titulo: ehPonte
        ? `Ponte: ${alvo?.titulo ?? "acervo"}`
        : `Destaque: ${alvo?.titulo ?? "acervo"}`,
      resumo: ehPonte
        ? "Uma aresta escrita à mão entre dois nós do acervo, com o motivo que o público lê."
        : "Um item em posição de destaque num feed, por um período declarado.",
      declaraAcessibilidade: true,
      objeto: ehPonte ? ("ponte" as const) : ("destaque" as const),
      assinatura: PRODUTOR_DA_DEMONSTRACAO,
      passos: [],
      destinoId: null,
      destinoTitulo: null,
      destinoTemSessaoDatada: false,
      feed: ehPonte ? "" : "descobrir",
      itemDestacadoId: ehPonte ? null : (alvo?.id ?? null),
      itemDestacadoTitulo: ehPonte ? null : (alvo?.titulo ?? null),
      vigenciaInicio: ehPonte ? "" : DATA_DE_REFERENCIA,
      vigenciaFim: "",
      ponte: ehPonte
        ? {
            relacao: "dialoga_com",
            alvoId: outro?.id ?? "",
            alvoTitulo: outro?.titulo ?? "",
            motivo: "As duas obras tratam do mesmo território, por caminhos diferentes.",
          }
        : null,
    });
  });
}

function programaExtra(): RegistroDePrograma[] {
  const eventos = entidadesDe("evento").filter((e) => ocorrenciasDe(e.id).length > 0);
  return Array.from({ length: 7 }, (_, i) => {
    const semente = amostra(eventos, 79 + i);
    const vazio = registroVazio(
      idExtra("programa", i + 1),
      "programa",
      CONTEXTO_DO_PRODUTOR,
    ) as RegistroDePrograma;
    return comChavesDoRegistro({
      ...vazio,
      pauta: "programa" as const,
      // RASCUNHO, como o canônico: `programa` mede zero instâncias no acervo, e o que a
      // pauta prova é que a classe passa a ter quem a povoe.
      situacao: "rascunho" as const,
      visibilidade: "publico" as const,
      titulo: `Programa: ${semente?.titulo ?? `edição ${i + 1}`}`,
      resumo:
        "O guarda-chuva que agrupa eventos em edições. A classe existe na ontologia e mede " +
        "zero instâncias no acervo.",
      declaraAcessibilidade: true,
      edicoes: [{ nome: `Edição ${2026 - (i % 3)}`, inicio: DATA_DE_REFERENCIA, fim: "", eventos: [] }],
    });
  });
}

function editaisExtra(): RegistroDeEdital[] {
  const linguagens = entidadesDe("linguagem");
  const estados = entidadesDe("territorio").filter((t) => textoDoExtra(t, "tipo") === "estado");
  const ESTADOS_DO_EDITAL = ["aberto", "em-julgamento", "encerrado", "resultado"] as const;
  return Array.from({ length: 7 }, (_, i) => {
    const situacao = situacaoAlternada(i);
    const vazio = registroVazio(
      idExtra("editais", i + 1),
      "editais",
      CONTEXTO_DO_PRODUTOR,
    ) as RegistroDeEdital;
    const recorte = linguagens.slice(i % 4, (i % 4) + 3).map((l) => l.id);
    return comChavesDoRegistro({
      ...vazio,
      pauta: "editais" as const,
      situacao,
      visibilidade: "publico" as const,
      publicadoEm: carimbo(situacao),
      titulo: `Chamada ${i + 2}, ${linguagens[i % Math.max(1, linguagens.length)]?.titulo ?? "programação"}`,
      resumo:
        "Chamada aberta para propostas. O recorte de linguagem e território é lido do " +
        "vocabulário controlado do acervo, não digitado.",
      declaraAcessibilidade: true,
      linguagens: recorte,
      estado: ESTADOS_DO_EDITAL[i % ESTADOS_DO_EDITAL.length] ?? "aberto",
      prazo: `2026-${String(((i + 8) % 12) + 1).padStart(2, "0")}-28`,
      territorios: estados.slice(i % 5, (i % 5) + 3).map((t) => t.id),
      publicoAlvo: "Artistas, coletivos e produtoras com sede no Brasil.",
      link: "https://www.itaucultural.org.br/",
      anexos: [],
    });
  });
}

function espacosExtra(): RegistroDeEspaco[] {
  return varias(entidadesDe("espaco"), 83, 7).map((e, i) => {
    const base = baseDe(e, idExtra("espacos", i + 1), "espacos") as RegistroDeEspaco;
    return comChavesDoRegistro({
      ...base,
      pauta: "espacos" as const,
      // RASCUNHO, como o canônico: os 113 espaços do acervo não trazem endereço nenhum,
      // e é o cadastro que falta.
      situacao: "rascunho" as const,
      visibilidade: "publico" as const,
      espacoId: e.id,
      endereco: "",
      bairro: "",
      cidade: textoDoExtra(e, "cidade"),
      estado: textoDoExtra(e, "estado"),
      capacidade: null,
      horario: "",
      entrada: "",
      fotos: [],
      metodoDaCoordenada: e.coordenada?.metodo ?? "centroide-municipio",
    });
  });
}

function midiaExtra(): RegistroDeMidia[] {
  return varias(entidadesDe("midia"), 89, 7).map((e, i) => {
    const base = baseDe(e, idExtra("midia", i + 1), "midia") as RegistroDeMidia;
    return comChavesDoRegistro({
      ...base,
      pauta: "midia" as const,
      // RASCUNHO, como o canônico: o direito de uso não é declarado em lugar nenhum do
      // acervo, e é ele que trava «download e offline».
      situacao: "rascunho" as const,
      visibilidade: "publico" as const,
      arquivo: textoDoExtra(e, "youtube") || textoDoExtra(e, "url"),
      formato: "video" as const,
      duracao: "",
      capitulos: [],
      direito: {
        permiteOffline: false,
        permiteIncorporar: false,
        titular: "",
        declarado: false,
      },
    });
  });
}

/** Os registros que completam as oito por pauta. A ordem é a das pautas, como no canônico. */
export function registrosExtras(): Registro[] {
  return [
    ...agendaExtra(),
    ...playExtra(),
    ...castExtra(),
    ...museuExtra(),
    ...cursosExtra(),
    ...editorialExtra(),
    ...curadoriaExtra(),
    ...programaExtra(),
    ...editaisExtra(),
    ...espacosExtra(),
    ...midiaExtra(),
  ];
}
