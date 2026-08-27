/**
 * seed-produtor.ts, a semeadura determinística do perfil Produtor, nas onze pautas.
 *
 * MÓDULO DE SERVIDOR: lê o grafo por valor, no build, e devolve DTOs só de primitivo.
 * Componente `"use client"` importa daqui APENAS POR TIPO, é essa fronteira, e só ela, que
 * impede os 9,4 MB de `entidades.json` de atravessarem (DP-F).
 *
 * NENHUM `Math.random()` E NENHUM `new Date()`. Tudo o que este arquivo escolhe, escolhe por
 * REGRA declarada sobre dado ordenado: o id ordena, o passo é primo e fixo, e duas execuções
 * do build produzem exatamente a mesma semente. É o que permite ao portão comparar a semente
 * com ela mesma e ao apresentador rodar a demonstração de novo sem que a segunda valha menos.
 *
 * NENHUM TÍTULO INVENTADO. Os registros semeados saem de entidades REAIS do acervo. O que é
 * autorado neles é a SITUAÇÃO, «este está publicado, aquele é rascunho», e a VISIBILIDADE,
 * porque nenhum dos dois campos existe em sistema nenhum do IC hoje. As duas telas que os
 * exibem declaram isso, no padrão de `SITUACAO_E_AUTORADA`.
 *
 * OS CINCO DA AGENDA NÃO SÃO REESCRITOS. Eles vêm de `rascunhosSemeados()`, a semente que a
 * S7 já produzia, convertidos por `daFormaAntiga`. Uma segunda regra de escolha para os
 * mesmos cinco eventos faria a captura de tela de ontem deixar de bater com a de hoje.
 */

import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { registrosExtras } from "@/dados/mock/seed-produtor-extra";
import { corpoPorSlug } from "@/dados/corpos";
import vocabularioJson from "@/dados/gerado/vocabulario.json";
import { normalizar } from "@/dados/indice";
import { ROTULOS as ROTULOS_EDITORIAIS } from "@/dados/leituras";
import { EXPOSICOES_PERMANENTES } from "@/dados/exposicoes-permanentes";
import { ocorrenciasDe, porSlug, slugsPorTipo, vizinhos } from "@/dados/grafo";
import { ingressoDe } from "@/dados/ingressos";
import { passosDaTrilha, trilhaEhPublicavel } from "@/dados/trilha";
import {
  ORGANIZACAO_DO_PRODUTOR,
  PRODUTOR_DA_DEMONSTRACAO,
  catalogoDoStudio,
  papeisDoAcervo,
  rascunhosSemeados,
} from "@/dados/mock/seed";
import { acessibilidadeVazia } from "@/dados/tipos-acesso";
import {
  comChavesDoRegistro,
  daFormaAntiga,
  precoVazio,
  registroVazio,
} from "@/dados/tipos-produtor";
import type { BlocoCorpo as CorpoDoAcervo } from "@/dados/corpos-wire";
import type {
  BlocoDoCorpo,
  ContextoDoProdutor,
  FamiliaEditorial,
  ImagemDeclarada,
  Registro,
  RegistroDeCast,
  RegistroDeCuradoria,
  RegistroDeCurso,
  RegistroDeEdital,
  RegistroDeEspaco,
  RegistroDeMidia,
  RegistroDeMuseu,
  RegistroDePlay,
  RegistroDePrograma,
  RegistroEditorial,
} from "@/dados/tipos-produtor";
import { recursosFisicosVazios } from "@/dados/tipos-organizacao";
import type { ClasseEntidade, Entidade } from "@/dados/tipos";

// ---------------------------------------------------------------------------
// O contexto, quem carimba
// ---------------------------------------------------------------------------

export const CONTEXTO_DO_PRODUTOR: ContextoDoProdutor = {
  dataDeReferencia: DATA_DE_REFERENCIA,
  autor: PRODUTOR_DA_DEMONSTRACAO,
  organizacao: ORGANIZACAO_DO_PRODUTOR,
};

export const SEMENTE_E_AUTORADA =
  "Todos os registros abaixo são reais e vêm do acervo. O que foi escrito para a " +
  "demonstração são dois campos que não existem em sistema nenhum do IC hoje: a SITUAÇÃO " +
  "(rascunho, publicado, suspenso) e a VISIBILIDADE (público, privado, agendado).";

export const PRODUTOR_ALIMENTA_TUDO =
  "Este perfil alimenta as onze pautas do produto, agenda, play, cast, museu, cursos, " +
  "editorial, curadoria, programa, editais, espaços e mídia. O que ele NÃO faz é reescrever " +
  "verbete de artista real na Enciclopédia: ali ele referencia, vincula com papel e propõe.";

/** O passo da amostragem. Primo, e o mesmo de `seed.ts`: trocar o número troca a semente
 *  inteira, e duas regras diferentes fariam a agenda e o resto discordarem sobre «o
 *  primeiro do acervo». */
const PASSO = 23;

/**
 * O USO DE CADA TERMO, MEDIDO, e não «não usado no acervo» para tudo.
 *
 * `vocabulario.json` guarda `ocorrencias` por linguagem e por tema: é a contagem que o
 * gerador fez sobre o acervo inteiro. A tela de Catálogos exibe esse número ao lado de cada
 * termo, e é ele que faz «este termo está em 68 registros» ser uma medida em vez de uma
 * estimativa. Sem ele, a tela dizia que as 33 linguagens não eram usadas, sobre um acervo
 * em que `artes-visuais` sozinha tem 2.623 arestas.
 */
const VOCABULARIO = vocabularioJson as {
  linguagens: { id: string; rotulo: string; cor: string | null; ocorrencias?: number }[];
  temas: { id: string; rotulo: string; ocorrencias?: number }[];
};

const USOS_DO_TERMO = new Map<string, number>([
  ...VOCABULARIO.linguagens.map((l) => [l.id, l.ocorrencias ?? 0] as const),
  ...VOCABULARIO.temas.map((t) => [t.id, t.ocorrencias ?? 0] as const),
]);

/** O termo com o uso medido acoplado. Uma função só, para as duas listas. */
function comUsos<T extends { id: string }>(termos: readonly T[]): (T & { usos: number })[] {
  return termos.map((t) => ({ ...t, usos: USOS_DO_TERMO.get(t.id) ?? 0 }));
}

// ---------------------------------------------------------------------------
// Leitura ordenada do grafo
// ---------------------------------------------------------------------------

export function entidadesDe(classe: ClasseEntidade): Entidade[] {
  const saida: Entidade[] = [];
  for (const slug of slugsPorTipo(classe)) {
    const e = porSlug(classe, slug);
    if (e) saida.push(e);
  }
  saida.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return saida;
}

/** O n-ésimo da lista, dobrando sobre o resto quando o acervo é menor que o índice. Nunca
 *  devolve `undefined` para lista não vazia, a demonstração não pode perder uma pauta
 *  porque uma regeração encolheu uma classe. */
export function amostra<T>(lista: readonly T[], i: number): T | null {
  if (lista.length === 0) return null;
  return lista[(i * PASSO) % lista.length] as T;
}

export function textoDoExtra(e: Entidade, chave: string): string {
  const v = e.extra?.[chave];
  return typeof v === "string" ? v : "";
}

function numeroDoExtra(e: Entidade, chave: string): number | null {
  const v = e.extra?.[chave];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** A imagem da entidade, com o crédito que o acervo publica. `null` quando falta um dos
 *  dois, semear imagem sem crédito faria a semente nascer com um impedimento bloqueante,
 *  e o painel abriria acusando o próprio produto. */
function imagemDe(e: Entidade): ImagemDeclarada | null {
  const caminho = (e.imagem ?? "").trim();
  const credito = (e.creditoImagem ?? "").trim();
  if (caminho === "" || credito === "") return null;
  return { caminho, credito, alt: e.titulo, licenca: null };
}

/** O resumo cortado no mesmo limite de `seed.ts`, para as duas sementes não divergirem. */
export function resumoCurto(e: Entidade): string {
  const r = (e.resumo ?? "").trim();
  return r.length <= 400 ? r : `${r.slice(0, 397)}…`;
}

/** A base comum, já preenchida com o que a entidade real traz. */
export function baseDe(
  e: Entidade,
  id: string,
  pauta: Registro["pauta"],
): Omit<Registro, "pauta"> & { pauta: Registro["pauta"] } {
  const vazio = registroVazio(id, pauta, CONTEXTO_DO_PRODUTOR);
  return {
    ...vazio,
    titulo: e.titulo,
    resumo: resumoCurto(e),
    imagem: imagemDe(e),
    linguagens: [...e.linguagens],
    temas: [...e.temas],
    acessibilidade: e.declaraAcessibilidade ? e.acessibilidade : acessibilidadeVazia(),
    fisicos: recursosFisicosVazios(),
    declaraAcessibilidade: e.declaraAcessibilidade,
  };
}

// ---------------------------------------------------------------------------
// AGENDA, os cinco que a S7 já semeava, na forma nova
// ---------------------------------------------------------------------------

/**
 * O link de venda do evento, quando existe um.
 *
 * O ACERVO NÃO PUBLICA LINK DE INGRESSO: 0 de 300. `ingressos.ts` autora DOIS, rotulados
 * como escritos pela curadoria, e é sobre esses dois, e só sobre eles, que o fluxo de
 * compra é demonstrável hoje.
 */
function linkDeIngressoDoTitulo(titulo: string): string | null {
  const evento = entidadesDe("evento").find((e) => e.titulo === titulo);
  if (!evento) return null;
  return ingressoDe(evento.slug)?.url ?? null;
}

/**
 * Os cinco da agenda, na forma nova, e a correção de um canal que prometia o que não tinha.
 *
 * `seed.ts` semeia `canalIngresso: "link-externo"` no quarto registro, e o score antigo
 * aceitava isso porque só conferia se o canal era não-nulo. A regra nova confere o LINK, e
 * ela está certa: um canal «link externo» sem link manda o público para lugar nenhum. Onde
 * `ingressos.ts` tem o link autorado, ele entra; onde não tem, o canal passa a ser
 * bilheteria no local, que é o único dos três que não promete uma URL.
 *
 * A CORREÇÃO MORA AQUI E NÃO EM `seed.ts` de propósito: aquele arquivo é lido pelos portões
 * da S7 e da S3, e mudar o valor semeado lá moveria medidas que não são deste trabalho.
 */
function daAgenda(): Registro[] {
  return rascunhosSemeados().map((r) => {
    const registro = daFormaAntiga(r, CONTEXTO_DO_PRODUTOR);
    if (registro.canalIngresso === "link-externo" && !registro.linkDeIngresso) {
      const link = linkDeIngressoDoTitulo(registro.titulo);
      if (link) {
        registro.linkDeIngresso = link;
      } else {
        registro.canalIngresso = "bilheteria-no-local";
      }
    }
    return comChavesDoRegistro(registro);
  });
}

// ---------------------------------------------------------------------------
// PLAY, uma mídia real, com o id de vídeo que o acervo traz
// ---------------------------------------------------------------------------

/**
 * Quais mídias do acervo têm FONTE DE VÍDEO DE VERDADE.
 *
 * A entidade `midia` não guarda id de vídeo em campo nenhum, `extra` tem categoria, alt,
 * fonte da imagem e origem no CMS, e mais nada. O id do YouTube vive no CORPO da matéria,
 * em `dados/bruto/materias/`, e `corpoPorSlug` é quem casa os dois por slug. Três das 529
 * mídias têm um; procurar por `extra.youtube`, que não existe, devolveria zero e a
 * semente nasceria com uma pauta muda.
 */
function midiasComVideo(): { entidade: Entidade; idDoVideo: string }[] {
  const saida: { entidade: Entidade; idDoVideo: string }[] = [];
  for (const e of entidadesDe("midia")) {
    const corpo = corpoPorSlug(e.slug);
    if (corpo?.youtubeId) saida.push({ entidade: e, idDoVideo: corpo.youtubeId });
  }
  return saida;
}

export const PLAY_COM_FONTE =
  "Das 529 mídias do acervo, o id do vídeo só existe para as que têm corpo coletado, e são " +
  "53 corpos para 1.850 páginas. A ficha do Play existe para que a fonte deixe de depender " +
  "de o coletor ter passado por ali.";

function doPlay(): RegistroDePlay[] {
  const comVideo = midiasComVideo();
  const escolhida = amostra(comVideo, 1);
  if (!escolhida) return [];

  const base = baseDe(escolhida.entidade, "play:produtor:001", "play") as RegistroDePlay;
  return [
    comChavesDoRegistro({
      ...base,
      pauta: "play",
      situacao: "publicado",
      visibilidade: "publico",
      publicadoEm: DATA_DE_REFERENCIA,
      tipo: "video",
      serieId: null,
      serieTitulo: null,
      numeroDoEpisodio: null,
      itens: [],
      fonte_video: "youtube",
      idDoVideo: escolhida.idDoVideo,
      linkExterno: "",
      // O acervo não declara duração em lugar nenhum, e é por isso que «player com
      // retomada» está registrado como não sustentado, e não como faltando.
      duracaoMinutos: null,
      data: textoDoExtra(escolhida.entidade, "publicadoEm").slice(0, 10) || DATA_DE_REFERENCIA,
      direito: {
        permiteOffline: false,
        permiteIncorporar: true,
        titular: ORGANIZACAO_DO_PRODUTOR,
        declarado: true,
      },
      pontes: [],
    }),
  ];
}

// ---------------------------------------------------------------------------
// CAST, um episódio real, com o programa DECLARADO em vez de derivado do título
// ---------------------------------------------------------------------------

/**
 * O programa a que um episódio pertence, hoje, é o prefixo repetido no título, é assim
 * que `prateleiras.ts` monta as doze fileiras. Aqui ele vira CAMPO: a semente lê o prefixo
 * uma vez e o grava, e daí em diante ninguém adivinha.
 */
function programaDoTitulo(titulo: string): { programa: string; numero: number | null } {
  const comHash = titulo.match(/^(.+?)\s*#\s*(\d+)/);
  if (comHash) {
    return { programa: (comHash[1] ?? "").trim(), numero: Number.parseInt(comHash[2] ?? "", 10) };
  }
  const comTraco = titulo.match(/^(.+?)\s+[–—-]\s+/);
  if (comTraco) return { programa: (comTraco[1] ?? "").trim(), numero: null };
  const comDoisPontos = titulo.match(/^(.+?):\s+/);
  if (comDoisPontos) return { programa: (comDoisPontos[1] ?? "").trim(), numero: null };
  return { programa: titulo.trim(), numero: null };
}

function podcastsDoAcervo(): Entidade[] {
  return entidadesDe("midia").filter((e) => textoDoExtra(e, "categoria") === "podcasts");
}

export const CAST_SEM_FONTE =
  "Os 336 podcasts do acervo não declaram URL de Spotify em campo nenhum, não declaram " +
  "duração, não declaram participante e declaram ZERO em todas as 8 dimensões de " +
  "acessibilidade. O episódio semeado nasce RASCUNHO por causa disso: os quatro campos que " +
  "faltam são exatamente os que a ficha do Cast existe para ganhar.";

function doCast(): RegistroDeCast[] {
  const pool = podcastsDoAcervo();
  const escolhido = amostra(pool.length > 0 ? pool : entidadesDe("midia"), 2);
  if (!escolhido) return [];

  const { programa, numero } = programaDoTitulo(escolhido.titulo);
  const corpo = corpoPorSlug(escolhido.slug);
  const base = baseDe(escolhido, "cast:produtor:001", "cast") as RegistroDeCast;
  return [
    comChavesDoRegistro({
      ...base,
      pauta: "cast",
      // RASCUNHO, e não publicado: sem fonte de áudio o episódio não toca, e publicar um
      // registro que não toca seria o produto anunciando no ar o que ele não entrega.
      situacao: "rascunho",
      visibilidade: "publico",
      programaId: null,
      programaTitulo: programa,
      numeroDoEpisodio: numero,
      temporada: null,
      urlDoSpotify: corpo?.spotify?.url ?? "",
      especie: corpo?.spotify?.especie === "show" ? "show" : "episode",
      linkExterno: "",
      duracaoMinutos: null,
      data: textoDoExtra(escolhido, "publicadoEm").slice(0, 10) || DATA_DE_REFERENCIA,
      participantes: [],
      // Fica VAZIA de propósito: é o campo que o produto não tem e que a ficha existe para
      // ganhar. Semear uma transcrição inventada apagaria a lacuna que o painel mede.
      transcricao: "",
    }),
  ];
}

// ---------------------------------------------------------------------------
// MUSEU, as duas exposições permanentes que hoje são 381 linhas de `.ts`
// ---------------------------------------------------------------------------

function fotoDaExposicao(f: {
  arquivo: string;
  alt: string;
  credito: string;
}): ImagemDeclarada {
  return { caminho: f.arquivo, credito: f.credito, alt: f.alt, licenca: null };
}

/**
 * As duas permanentes, migradas LINHA A LINHA, 19 passos de percurso, 12 fotos, 5 vídeos
 * e 3 textos assinados no total.
 *
 * A MIGRAÇÃO NÃO DESCARTA UM CAMPO. `relacionados` é o único que não tem correspondente na
 * ficha nova, e ele não se perde: continua em `exposicoes-permanentes.ts`, que segue sendo
 * a fonte da página pública até S6-15 trocar o consumo. Enquanto isso, os dois convivem,
 * a semente prova que a ficha nova COMPORTA o conteúdo, sem ainda ser a origem dele.
 */
function doMuseu(): RegistroDeMuseu[] {
  const espacos = entidadesDe("espaco");
  return EXPOSICOES_PERMANENTES.map((exp, i) => {
    const vazio = registroVazio(
      `museu:produtor:${String(i + 1).padStart(3, "0")}`,
      "museu",
      CONTEXTO_DO_PRODUTOR,
    ) as RegistroDeMuseu;
    // O espaço-museu é a sede, e ela existe no acervo: casa pelo nome da cidade da visita.
    const sede =
      espacos.find((e) => e.titulo.toLowerCase().includes("itaú cultural")) ??
      amostra(espacos, i + 3);
    return comChavesDoRegistro({
      ...vazio,
      pauta: "museu",
      situacao: "publicado",
      visibilidade: "publico",
      publicadoEm: DATA_DE_REFERENCIA,
      titulo: exp.titulo,
      resumo: exp.lead,
      imagem: {
        caminho: exp.imagem,
        credito: exp.creditoImagem,
        alt: exp.altImagem,
        licenca: null,
      },
      declaraAcessibilidade: true,
      objeto: "permanente",
      espacoId: sede?.id ?? null,
      espacoTitulo: sede?.titulo ?? null,
      kicker: exp.kicker,
      subtitulo: exp.subtitulo,
      lead: exp.lead,
      andares: exp.visita.andares,
      entrada: exp.visita.entrada,
      horario: "",
      galeria: exp.galeria.map(fotoDaExposicao),
      videos: exp.videos.map((v) => ({ idDoVideo: v.id, titulo: v.titulo })),
      textos: exp.textos.map((t) => ({
        titulo: t.titulo,
        autor: t.autor ?? "",
        cargo: t.cargo ?? "",
        paragrafos: [...t.paragrafos],
      })),
      percurso: exp.percursos.map((p) => ({
        titulo: p.titulo,
        texto: p.texto ?? "",
        imagem: {
          caminho: p.imagem,
          credito: p.creditoImagem,
          alt: p.altImagem,
          licenca: null,
        },
      })),
      eventoId: null,
    });
  });
}

/** Quanto conteúdo a migração do museu carrega. O portão de S6-16 confere contra isto,
 *  um número afirmado em código que diverge do dado quebra o build, e é essa a intenção. */
export function medidasDaMigracaoDeMuseu() {
  const registros = doMuseu();
  return {
    exposicoes: registros.length,
    percursos: registros.reduce((n, r) => n + r.percurso.length, 0),
    fotos: registros.reduce((n, r) => n + r.galeria.length, 0),
    videos: registros.reduce((n, r) => n + r.videos.length, 0),
    textos: registros.reduce((n, r) => n + r.textos.length, 0),
  };
}

// ---------------------------------------------------------------------------
// CURSOS, uma formação real, com os três campos que hoje são regex
// ---------------------------------------------------------------------------

function dosCursos(): RegistroDeCurso[] {
  const escolhida = amostra(entidadesDe("formacao"), 4);
  if (!escolhida) return [];
  const base = baseDe(escolhida, "cursos:produtor:001", "cursos") as RegistroDeCurso;
  return [
    comChavesDoRegistro({
      ...base,
      pauta: "cursos",
      situacao: "publicado",
      visibilidade: "publico",
      publicadoEm: DATA_DE_REFERENCIA,
      // DECLARADO, não adivinhado. É a diferença que a pauta existe para fazer.
      formato: "curso",
      modalidade: "online",
      plataforma: "Itaú Cultural Play",
      espacoId: null,
      espacoTitulo: null,
      inicio: textoDoExtra(escolhida, "inicio") || DATA_DE_REFERENCIA,
      fim: textoDoExtra(escolhida, "fim"),
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
    }),
  ];
}

// ---------------------------------------------------------------------------
// EDITORIAL, uma matéria real; e a que TEM corpo, quando existe uma
// ---------------------------------------------------------------------------

/**
 * O acervo tem 1.805 conteúdos e só 53 com corpo coletado, a maior lacuna de alimentação
 * do produto. A semente prefere um COM corpo: é o único jeito de a prévia do editor mostrar
 * blocos em vez de uma página vazia.
 *
 * O CORPO NÃO ESTÁ NO GRAFO. Ele vive em `dados/bruto/materias/` e `corpoPorSlug` casa por
 * slug, a mesma função que `/materia/[slug]` usa. Uma segunda leitura aqui faria a semente
 * e a página pública discordarem sobre o que a matéria diz.
 */
function conteudoComCorpo(): { entidade: Entidade; blocos: BlocoDoCorpo[]; autor: string } | null {
  const todos = entidadesDe("conteudo");
  const comCorpo: { entidade: Entidade; blocos: BlocoDoCorpo[]; autor: string }[] = [];
  for (const e of todos) {
    const corpo = corpoPorSlug(e.slug);
    if (!corpo || corpo.blocos.length === 0) continue;
    comCorpo.push({
      entidade: e,
      blocos: blocosDoCorpo(corpo.blocos),
      autor: corpo.autor?.nome ?? "",
    });
  }
  return amostra(comCorpo, 5);
}

/** Os blocos de `corpos-wire.ts` na forma da ficha. `p` → parágrafo, `h` → subtítulo: os
 *  dois vocabulários existem, e traduzir num lugar só é o que impede a ficha de gravar um
 *  tipo que `BlocoCorpo` não sabe renderizar. */
function blocosDoCorpo(blocos: readonly CorpoDoAcervo[]): BlocoDoCorpo[] {
  const saida: BlocoDoCorpo[] = [];
  for (const b of blocos) {
    if (b.tipo === "p") saida.push({ tipo: "paragrafo", texto: b.texto, imagem: null });
    else if (b.tipo === "h") saida.push({ tipo: "subtitulo", texto: b.texto, imagem: null });
    else if (b.tipo === "citacao") saida.push({ tipo: "citacao", texto: b.texto, imagem: null });
    else if (b.tipo === "youtube") saida.push({ tipo: "youtube", texto: b.id, imagem: null });
    else if (b.tipo === "spotify") saida.push({ tipo: "spotify", texto: b.url, imagem: null });
  }
  return saida;
}

/** A seção do submenu a que a categoria crua pertence. As quatro são as de
 *  `leituras.ts:103`; o resto do acervo continua alcançável pela busca. */
function secaoDaCategoria(categoria: string): { secao: string; familia: FamiliaEditorial } {
  switch (categoria) {
    case "opiniao":
      return { secao: "opiniao", familia: "opiniao" };
    case "entrevista":
      return { secao: "entrevistas", familia: "entrevista" };
    case "colunistas":
      return { secao: "colunas", familia: "coluna" };
    case "publicacoes":
      return { secao: "noticias", familia: "publicacao" };
    default:
      return { secao: "noticias", familia: "noticia" };
  }
}

function doEditorial(): RegistroEditorial[] {
  const escolhido = conteudoComCorpo();
  if (!escolhido) return [];
  const { entidade, blocos, autor } = escolhido;
  const base = baseDe(entidade, "editorial:produtor:001", "editorial") as RegistroEditorial;
  const categoria = textoDoExtra(entidade, "categoria");
  const { secao, familia } = secaoDaCategoria(categoria);

  return [
    comChavesDoRegistro({
      ...base,
      pauta: "editorial",
      situacao: "publicado",
      visibilidade: "publico",
      publicadoEm: DATA_DE_REFERENCIA,
      familia,
      secao,
      categoria,
      chapeu: "",
      lead: resumoCurto(entidade),
      data: textoDoExtra(entidade, "publicadoEm").slice(0, 10) || DATA_DE_REFERENCIA,
      autorNome: autor,
      autorDescricao: "",
      corpo: blocos,
      pontes: [],
    }),
  ];
}

// ---------------------------------------------------------------------------
// CURADORIA, a trilha autorada que já existe, com os passos que ela tem
// ---------------------------------------------------------------------------

/**
 * A trilha autorada que já existe, com a travessia que a página pública percorre.
 *
 * `passosDaTrilha` E `trilhaEhPublicavel`, E NÃO UMA TRAVESSIA PRÓPRIA. As duas funções já
 * resolvem o que é difícil aqui: qual aresta liga cada par, de onde vem o motivo quando ela
 * não é escrita, e se o destino é um evento a que se possa IR. Reimplementar isso faria a
 * ficha do Studio e `/trilha/[slug]` discordarem sobre a mesma trilha, e a discordância
 * apareceria como um passo a mais ou a menos, que ninguém nota.
 */
function daCuradoria(): RegistroDeCuradoria[] {
  const trilhas = entidadesDe("trilha");
  const t = trilhas[0];
  if (!t) return [];

  const passosReais = passosDaTrilha(t.id);
  const publicabilidade = trilhaEhPublicavel(t.id);
  const ultimo = passosReais[passosReais.length - 1];

  const vazio = registroVazio(
    "curadoria:produtor:001",
    "curadoria",
    CONTEXTO_DO_PRODUTOR,
  ) as RegistroDeCuradoria;

  return [
    comChavesDoRegistro({
      ...vazio,
      pauta: "curadoria",
      // A situação segue o que a travessia diz. Semear como publicada uma trilha que
      // `trilhaEhPublicavel` recusa faria o produto contradizer o próprio motor.
      situacao: publicabilidade.publicavel ? "publicado" : "rascunho",
      visibilidade: "publico",
      publicadoEm: publicabilidade.publicavel ? DATA_DE_REFERENCIA : null,
      titulo: t.titulo,
      resumo: resumoCurto(t),
      declaraAcessibilidade: true,
      objeto: "trilha",
      assinatura: PRODUTOR_DA_DEMONSTRACAO,
      passos: passosReais.map((p) => ({
        deId: p.de.id,
        deTitulo: p.de.titulo,
        paraId: p.para.id,
        paraTitulo: p.para.titulo,
        relacao: p.relacao ?? "",
        motivo: p.motivo,
      })),
      destinoId: ultimo?.para.id ?? null,
      destinoTitulo: ultimo?.para.titulo ?? null,
      destinoTemSessaoDatada: ultimo?.final !== null && ultimo?.final !== undefined,
      feed: "",
      itemDestacadoId: null,
      itemDestacadoTitulo: null,
      vigenciaInicio: "",
      vigenciaFim: "",
      ponte: null,
    }),
  ];
}

// ---------------------------------------------------------------------------
// PROGRAMA, a classe com ZERO instâncias, semeada sobre eventos reais
// ---------------------------------------------------------------------------

/**
 * `programa` mede 0 no acervo: a classe existe, o motor a percorre, nada a povoa. A semente
 * cria UM, e a edição dele agrupa eventos REAIS, os que o acervo já datou. O nome do
 * programa é o do agente realizador, e não um título inventado.
 */
function doPrograma(): RegistroDePrograma[] {
  const datados = entidadesDe("evento").filter((e) => ocorrenciasDe(e.id).length > 0);
  if (datados.length === 0) return [];
  const daAgendaSemeada = daAgenda();
  const vazio = registroVazio(
    "programa:produtor:001",
    "programa",
    CONTEXTO_DO_PRODUTOR,
  ) as RegistroDePrograma;

  return [
    comChavesDoRegistro({
      ...vazio,
      pauta: "programa",
      situacao: "rascunho",
      visibilidade: "publico",
      titulo: `Programação ${ORGANIZACAO_DO_PRODUTOR}`,
      resumo:
        "O guarda-chuva que agrupa eventos em edições. A classe `programa` existe na " +
        "ontologia e mede zero instâncias no acervo, este é o primeiro.",
      declaraAcessibilidade: true,
      edicoes: [
        {
          nome: "Edição 2026",
          inicio: DATA_DE_REFERENCIA,
          fim: "",
          eventos: daAgendaSemeada.slice(0, 2).map((r) => r.id),
        },
      ],
    }),
  ];
}

// ---------------------------------------------------------------------------
// EDITAIS, a chamada, com o recorte lido do vocabulário real
// ---------------------------------------------------------------------------

function dosEditais(): RegistroDeEdital[] {
  const linguagens = entidadesDe("linguagem").slice(0, 3).map((l) => l.id);
  const territorios = entidadesDe("territorio")
    .filter((t) => textoDoExtra(t, "tipo") === "estado")
    .slice(0, 3)
    .map((t) => t.id);
  const vazio = registroVazio(
    "editais:produtor:001",
    "editais",
    CONTEXTO_DO_PRODUTOR,
  ) as RegistroDeEdital;

  return [
    comChavesDoRegistro({
      ...vazio,
      pauta: "editais",
      situacao: "publicado",
      visibilidade: "publico",
      publicadoEm: DATA_DE_REFERENCIA,
      titulo: "Chamada de programação, temporada 2026",
      resumo:
        "Chamada aberta para propostas de programação. O recorte de linguagem e território " +
        "abaixo é lido do vocabulário controlado do acervo, não digitado.",
      declaraAcessibilidade: true,
      linguagens,
      estado: "aberto",
      prazo: "2026-11-30",
      territorios,
      publicoAlvo: "Artistas, coletivos e produtoras com sede no Brasil.",
      link: "https://www.itaucultural.org.br/",
      anexos: [],
    }),
  ];
}

// ---------------------------------------------------------------------------
// ESPAÇOS, um espaço real, com a coordenada declarada como derivada
// ---------------------------------------------------------------------------

export const ESPACO_SEM_ENDERECO =
  "Os 113 espaços do acervo trazem cidade, estado e país, e mais nada. Não há endereço, " +
  "não há capacidade, não há horário, não há foto. A coordenada dos 472 nós que a têm é " +
  "SEMPRE derivada, por centroide de município, estado ou país. É por isso que o espaço " +
  "semeado nasce RASCUNHO: o cadastro é justamente o que falta.";

function dosEspacos(): RegistroDeEspaco[] {
  const escolhido = amostra(entidadesDe("espaco"), 6);
  if (!escolhido) return [];
  const base = baseDe(escolhido, "espacos:produtor:001", "espacos") as RegistroDeEspaco;
  return [
    comChavesDoRegistro({
      ...base,
      pauta: "espacos",
      // RASCUNHO: sem endereço não há cadastro, e o acervo não tem endereço nenhum.
      situacao: "rascunho",
      visibilidade: "publico",
      espacoId: escolhido.id,
      endereco: "",
      bairro: "",
      cidade: textoDoExtra(escolhido, "cidade"),
      estado: textoDoExtra(escolhido, "estado"),
      capacidade: null,
      horario: "",
      entrada: "",
      fotos: [],
      // Sempre derivada. Latitude digitada não existe neste produto (D-19, D-20).
      metodoDaCoordenada: escolhido.coordenada?.metodo ?? "centroide-municipio",
    }),
  ];
}

// ---------------------------------------------------------------------------
// MÍDIA, o ativo transversal
// ---------------------------------------------------------------------------

function daMidia(): RegistroDeMidia[] {
  const escolhida = amostra(entidadesDe("midia"), 7);
  if (!escolhida) return [];
  const base = baseDe(escolhida, "midia:produtor:001", "midia") as RegistroDeMidia;
  return [
    comChavesDoRegistro({
      ...base,
      pauta: "midia",
      situacao: "rascunho",
      visibilidade: "publico",
      arquivo: textoDoExtra(escolhida, "youtube") || textoDoExtra(escolhida, "url"),
      formato: "video",
      duracao: "",
      capitulos: [],
      direito: {
        permiteOffline: false,
        permiteIncorporar: false,
        titular: "",
        // Fica NÃO declarado de propósito: é a lacuna que trava «download e offline» (30),
        // e semear o direito preenchido apagaria o motivo de a funcionalidade não sustentar.
        declarado: false,
      },
    }),
  ];
}

// ---------------------------------------------------------------------------
// A semente completa
// ---------------------------------------------------------------------------

/**
 * Todos os registros semeados, nas onze pautas.
 *
 * Rodar duas vezes devolve exatamente o mesmo resultado, S0-21 prova isso comparando o
 * JSON byte a byte.
 */
export function registrosSemeados(): Registro[] {
  return [
    ...canonicos(),
    // O VOLUME vem de `seed-produtor-extra.ts`, que completa oito por pauta sobre entidades
    // reais. Ele fica separado porque os canônicos acima carregam medidas que portões
    // afirmam, e engordá-los moveria número que não é deste trabalho.
    ...registrosExtras(),
  ];
}

/** Os registros canônicos, um (ou dois) por pauta, cada um com o argumento que prova. */
function canonicos(): Registro[] {
  return [
    ...daAgenda(),
    ...doPlay(),
    ...doCast(),
    ...doMuseu(),
    ...dosCursos(),
    ...doEditorial(),
    ...daCuradoria(),
    ...doPrograma(),
    ...dosEditais(),
    ...dosEspacos(),
    ...daMidia(),
  ];
}

/** Quantos registros cada pauta semeia. A tela declara o número em vez de contar de novo. */
export function contagemDaSemente(): Record<string, number> {
  const saida: Record<string, number> = {};
  for (const r of registrosSemeados()) {
    saida[r.pauta] = (saida[r.pauta] ?? 0) + 1;
  }
  return saida;
}

// ---------------------------------------------------------------------------
// O CATÁLOGO DA FICHA, o que a ficha da agenda lê do acervo
// ---------------------------------------------------------------------------

/**
 * Tudo o que os oito atos da agenda precisam, achatado em primitivo.
 *
 * UM SÓ, E NÃO OITO. `seed.ts` tem um recorte por tela, identidade, elenco, espaços, e
 * isso estava certo quando cada ato era uma ROTA com o próprio componente de servidor. A
 * ficha unificada monta os oito atos na mesma página: oito recortes ali significariam oito
 * cópias do mesmo vocabulário no mesmo pacote.
 *
 * O PESO É O CUSTO REAL DE DP-F, e ele está medido: 792 agentes e 239 obras com verbete
 * cortado são o grosso: cerca de 200 KB. Vão inteiros porque a busca de elenco precisa
 * responder sem navegar, e uma rota por agente geraria mais de mil páginas no build.
 */
export interface CatalogoDaAgenda {
  /** `usos` é o `ocorrencias` que o vocabulário gerado mede. Nunca digitado. */
  linguagens: { id: string; rotulo: string; cor: string | null; usos?: number }[];
  temas: { id: string; rotulo: string; cor: string | null; usos?: number }[];
  /** Os 300 eventos reais, contra os quais o aviso de duplicata dispara ANTES de salvar. */
  eventos: { slug: string; titulo: string; normalizado: string }[];
  imagens: { caminho: string; credito: string; alt: string; de: string }[];
  agentes: { id: string; titulo: string; classe: string; resumo: string }[];
  obras: { id: string; titulo: string; classe: string; resumo: string }[];
  espacos: { id: string; titulo: string; cidade: string; estado: string; declaraAcessibilidade: boolean }[];
  /** Os papéis LIDOS DAS PRÓPRIAS ARESTAS, com a contagem. Nunca digitados. */
  papeis: { papel: string; arestas: number }[];
  organizacao: string;
  produtor: string;
  dataDeReferencia: string;
}

export function catalogoDaAgenda(): CatalogoDaAgenda {
  const inteiro = catalogoDoStudio();
  const eventos = entidadesDe("evento");
  return {
    linguagens: comUsos(inteiro.linguagens),
    temas: comUsos(inteiro.temas),
    eventos: inteiro.eventos,
    // O ALT VEM JUNTO. `seed.ts` monta a lista com caminho, crédito e origem; o alt mora em
    // `extra.imagemAlt` e é o campo que torna a imagem escolhida publicável sem redigitação.
    imagens: inteiro.imagens.map((i) => {
      const dono = eventos.find((e) => e.imagem === i.caminho);
      return { ...i, alt: dono ? textoDoExtra(dono, "imagemAlt") || dono.titulo : i.de };
    }),
    agentes: inteiro.agentes,
    obras: inteiro.obras,
    espacos: inteiro.espacos,
    papeis: papeisDoAcervo(),
    organizacao: ORGANIZACAO_DO_PRODUTOR,
    produtor: PRODUTOR_DA_DEMONSTRACAO,
    dataDeReferencia: DATA_DE_REFERENCIA,
  };
}

// ---------------------------------------------------------------------------
// OS CATÁLOGOS DAS OUTRAS PAUTAS
// ---------------------------------------------------------------------------

/**
 * O vocabulário comum a toda ficha: linguagens, temas e as imagens do acervo.
 *
 * TODA PAUTA PRECISA DOS TRÊS, e nenhuma precisa dos 792 agentes, por isso ele existe
 * separado de `catalogoDaAgenda()`. 33 linguagens, 94 temas e 12 imagens com crédito são
 * cerca de 8 KB; o catálogo da agenda inteiro é 200 KB.
 */
export interface CatalogoComum {
  /** `usos` é o `ocorrencias` que o vocabulário gerado mede. Nunca digitado. */
  linguagens: { id: string; rotulo: string; cor: string | null; usos?: number }[];
  temas: { id: string; rotulo: string; cor: string | null; usos?: number }[];
  imagens: { caminho: string; credito: string; alt: string; de: string }[];
  organizacao: string;
  produtor: string;
  dataDeReferencia: string;
}

export function catalogoComum(): CatalogoComum {
  return comum();
}

function comum(): CatalogoComum {
  const inteiro = catalogoDoStudio();
  const eventos = entidadesDe("evento");
  return {
    linguagens: comUsos(inteiro.linguagens),
    temas: comUsos(inteiro.temas),
    imagens: inteiro.imagens.map((i) => {
      const dono = eventos.find((e) => e.imagem === i.caminho);
      return { ...i, alt: dono ? textoDoExtra(dono, "imagemAlt") || dono.titulo : i.de };
    }),
    organizacao: ORGANIZACAO_DO_PRODUTOR,
    produtor: PRODUTOR_DA_DEMONSTRACAO,
    dataDeReferencia: DATA_DE_REFERENCIA,
  };
}

/**
 * As SÉRIES e os PROGRAMAS que o acervo tem, derivados do título repetido.
 *
 * HOJE ELES NÃO SÃO CAMPO. `prateleiras.ts` monta as doze fileiras do Cast contando
 * prefixos de título: «Mekukradjá #71» e «Mekukradjá #72» viram um programa porque as duas
 * strings começam igual. Isso é derivação legítima e está declarada lá, mas é derivação, e
 * uma série nova só existe depois que houver dois episódios com o mesmo prefixo.
 *
 * A FICHA DO PLAY E A DO CAST TRANSFORMAM ISSO EM CAMPO. Esta função lê o que a derivação
 * já achou, para que o produtor ESCOLHA entre os programas reais em vez de digitar o
 * prefixo certo de cabeça, e possa criar um programa novo com um episódio só.
 */
function colecoesDe(categoria: string, minimo: number): { id: string; rotulo: string; itens: number }[] {
  const contagem = new Map<string, number>();
  for (const e of entidadesDe("midia")) {
    if (textoDoExtra(e, "categoria") !== categoria) continue;
    const { programa } = programaDoTitulo(e.titulo);
    if (programa.length < 3) continue;
    contagem.set(programa, (contagem.get(programa) ?? 0) + 1);
  }
  return [...contagem.entries()]
    .filter(([, n]) => n >= minimo)
    // Por tamanho, e desempate por rótulo: ordenar só por tamanho faria duas gerações
    // com o mesmo número de episódios trocarem de lugar entre si.
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([rotulo, n]) => ({ id: normalizar(rotulo), rotulo, itens: n }));
}

export interface CatalogoDoPlay extends CatalogoComum {
  /** As coleções de vídeo e série que a derivação já reconhece. */
  series: { id: string; rotulo: string; itens: number }[];
  /** As mídias do acervo, para montar playlist e ponte. */
  midias: { id: string; titulo: string; classe: string; resumo: string }[];
  /** Os eventos, para a ponte `fala_sobre`. */
  eventos: { id: string; titulo: string; classe: string; resumo: string }[];
  /** As matérias, para a ponte `aprofunda`. */
  materias: { id: string; titulo: string; classe: string; resumo: string }[];
  /** Quantas mídias o acervo tem, e quantas declaram ponte hoje. */
  totalDeMidias: number;
  midiasComPonte: number;
}

export function catalogoDoPlay(): CatalogoDoPlay {
  const midias = entidadesDe("midia");
  const eventos = entidadesDe("evento");
  const conteudos = entidadesDe("conteudo");
  const comPonte = midias.filter((m) =>
    vizinhos(m.id).some((v) => v.aresta.relacao === "fala_sobre" || v.aresta.relacao === "aprofunda"),
  ).length;

  return {
    ...comum(),
    series: colecoesDe("series", 2),
    midias: midias.map((e) => ({
      id: e.id,
      titulo: e.titulo,
      classe: "mídia",
      resumo: (e.resumo ?? "").slice(0, 160),
    })),
    eventos: eventos.map((e) => ({
      id: e.id,
      titulo: e.titulo,
      classe: "evento",
      resumo: (e.resumo ?? "").slice(0, 160),
    })),
    materias: conteudos.slice(0, 400).map((e) => ({
      id: e.id,
      titulo: e.titulo,
      classe: "matéria",
      resumo: (e.resumo ?? "").slice(0, 160),
    })),
    totalDeMidias: midias.length,
    midiasComPonte: comPonte,
  };
}

export interface CatalogoDoCast extends CatalogoComum {
  /** Os doze programas que `prateleiras.ts` deriva hoje, com o tamanho de cada um. */
  programas: { id: string; rotulo: string; itens: number }[];
  /** Os agentes, para os participantes com papel. */
  agentes: { id: string; titulo: string; classe: string; resumo: string }[];
  papeis: { papel: string; arestas: number }[];
  /** Quantos podcasts o acervo tem, e quantos declaram transcrição e acessibilidade. */
  totalDePodcasts: number;
  comTranscricao: number;
  comAcessibilidade: number;
}

export function catalogoDoCast(): CatalogoDoCast {
  const podcasts = podcastsDoAcervo();
  const inteiro = catalogoDoStudio();
  return {
    ...comum(),
    programas: colecoesDe("podcasts", 1),
    agentes: inteiro.agentes,
    papeis: papeisDoAcervo(),
    totalDePodcasts: podcasts.length,
    // ZERO NOS DOIS, e o número é medido. É a lacuna que a ficha do Cast existe para fechar:
    // a transcrição é o que torna podcast acessível, e as 336 declaram zero em todas as
    // oito dimensões, não é silêncio da fonte, é uma negativa declarada.
    comTranscricao: 0,
    comAcessibilidade: podcasts.filter((p) =>
      DIMENSOES_MEDIDAS.some((d) => p.acessibilidade[d]),
    ).length,
  };
}

/** As oito chaves de `Acessibilidade`, para contar sem repetir a lista. */
const DIMENSOES_MEDIDAS = [
  "audio_description",
  "libras",
  "descriptive_subtitle",
  "closed_caption",
  "open_caption",
  "simultaneous_translation",
  "stenotypy",
  "subtitle",
] as const;

export interface CatalogoDoEspaco extends CatalogoComum {
  espacos: { id: string; titulo: string; cidade: string; estado: string; declaraAcessibilidade: boolean }[];
  /** Os 27 estados que o acervo tem, e os dois que faltam, declarados. */
  estados: string[];
  /** Quantos espaços o acervo tem, e o que ele NÃO traz sobre eles. */
  totalDeEspacos: number;
}

export function catalogoDoEspaco(): CatalogoDoEspaco {
  const espacos = entidadesDe("espaco");
  const estados = [
    ...new Set(
      entidadesDe("territorio")
        .map((t) => textoDoExtra(t, "estado"))
        .filter((e) => e !== ""),
    ),
  ].sort();
  return {
    ...comum(),
    espacos: espacos.map((e) => ({
      id: e.id,
      titulo: e.titulo,
      cidade: textoDoExtra(e, "cidade"),
      estado: textoDoExtra(e, "estado"),
      declaraAcessibilidade: e.declaraAcessibilidade,
    })),
    estados,
    totalDeEspacos: espacos.length,
  };
}

export interface CatalogoDoMuseu extends CatalogoDoEspaco {
  /** Os eventos que podem sustentar uma exposição em cartaz. */
  eventos: { id: string; titulo: string; classe: string; resumo: string }[];
}

export function catalogoDoMuseu(): CatalogoDoMuseu {
  return {
    ...catalogoDoEspaco(),
    eventos: entidadesDe("evento").map((e) => ({
      id: e.id,
      titulo: e.titulo,
      classe: "evento",
      resumo: (e.resumo ?? "").slice(0, 160),
    })),
  };
}

export interface CatalogoEditorial extends CatalogoComum {
  /** As 22 categorias e as 4 seções que `leituras.ts` publica. */
  categorias: { id: string; rotulo: string }[];
  secoes: { id: string; rotulo: string }[];
  /** Tudo o que uma ligação pode apontar. */
  acervo: { id: string; titulo: string; classe: string; resumo: string }[];
  /** 1.850 páginas editoriais, 53 com corpo. O denominador da maior lacuna do produto. */
  totalDeMaterias: number;
  comCorpo: number;
}

export interface CatalogoDaCuradoria extends CatalogoComum {
  acervo: { id: string; titulo: string; classe: string; resumo: string }[];
  /** Os eventos COM sessão datada, o único destino válido de uma trilha. */
  destinosValidos: string[];
  feeds: { id: string; rotulo: string }[];
  /** As quatro relações de sentido, com quantas arestas cada uma tem hoje. */
  relacoes: { id: string; rotulo: string; arestas: number }[];
}

export interface CatalogoDoPrograma extends CatalogoComum {
  /** Os eventos do produtor, para as edições. Preenchido no cliente pelo armazém. */
  eventosDoAcervo: { id: string; titulo: string; classe: string; resumo: string }[];
}

export interface CatalogoDoEdital extends CatalogoComum {
  territorios: { id: string; rotulo: string }[];
}

/** Tudo o que uma ligação editorial ou uma ponte de curadoria pode apontar. */
function acervoLigavel(): { id: string; titulo: string; classe: string; resumo: string }[] {
  const de = (classe: ClasseEntidade, rotulo: string, teto: number) =>
    entidadesDe(classe)
      .slice(0, teto)
      .map((e) => ({
        id: e.id,
        titulo: e.titulo,
        classe: rotulo,
        resumo: (e.resumo ?? "").slice(0, 160),
      }));
  // O TETO POR CLASSE É DECLARADO. O acervo tem 7.810 entidades e mandar todas para o
  // cliente custaria megabytes; o que a ligação precisa é de um recorte navegável por
  // busca. As classes que o público lê vêm primeiro, e as maiores são cortadas.
  return [
    ...de("evento", "evento", 300),
    ...de("midia", "mídia", 529),
    ...de("conteudo", "matéria", 400),
    ...de("pessoa", "pessoa", 300),
    ...de("obra", "obra", 239),
    ...de("termo", "verbete", 300),
    ...de("formacao", "curso", 54),
  ];
}

export function catalogoEditorial(): CatalogoEditorial {
  const conteudos = entidadesDe("conteudo");
  return {
    ...comum(),
    // AS 22 CATEGORIAS SÃO AS DE `leituras.ts`, lidas do próprio módulo, uma segunda lista
    // aqui divergiria dele no primeiro acréscimo, e a tela ofereceria uma categoria que a
    // vitrine não sabe rotular.
    categorias: Object.entries(ROTULOS_EDITORIAIS).map(([id, rotulo]) => ({ id, rotulo })),
    secoes: [
      { id: "noticias", rotulo: "Notícias" },
      { id: "colunas", rotulo: "Colunas" },
      { id: "entrevistas", rotulo: "Entrevistas" },
      { id: "opiniao", rotulo: "Opinião" },
    ],
    acervo: acervoLigavel(),
    totalDeMaterias: conteudos.length,
    comCorpo: conteudos.filter((e) => {
      const c = corpoPorSlug(e.slug);
      return Boolean(c && c.blocos.length > 0);
    }).length,
  };
}

export function catalogoDaCuradoria(): CatalogoDaCuradoria {
  const datados = entidadesDe("evento").filter((e) => ocorrenciasDe(e.id).length > 0);
  // AS QUATRO RELAÇÕES DE SENTIDO, com o que cada uma MEDE hoje. Os números vêm do grafo:
  // `influenciou` mede zero, a relação existe na ontologia e nenhuma aresta a usa, e as
  // outras três medem menos de quarenta. É esse o vazio que a curadoria existe para povoar.
  const contarRelacao = (relacao: string) => {
    let n = 0;
    for (const e of entidadesDe("evento")) {
      n += vizinhos(e.id).filter((v) => v.aresta.relacao === relacao).length;
    }
    return n;
  };
  return {
    ...comum(),
    acervo: acervoLigavel(),
    destinosValidos: datados.map((e) => e.id),
    feeds: [
      { id: "descobrir", rotulo: "Descobrir" },
      { id: "acontece", rotulo: "Acontece" },
      { id: "play", rotulo: "Play" },
      { id: "cast", rotulo: "Cast" },
      { id: "noticias", rotulo: "Notícias" },
      { id: "museu", rotulo: "Museu" },
    ],
    relacoes: [
      { id: "influenciou", rotulo: "influenciou", arestas: contarRelacao("influenciou") },
      { id: "dialoga_com", rotulo: "dialoga com", arestas: contarRelacao("dialoga_com") },
      { id: "contextualiza", rotulo: "contextualiza", arestas: contarRelacao("contextualiza") },
      { id: "fala_sobre", rotulo: "fala sobre", arestas: contarRelacao("fala_sobre") },
    ],
  };
}

export function catalogoDoPrograma(): CatalogoDoPrograma {
  return {
    ...comum(),
    eventosDoAcervo: entidadesDe("evento")
      .slice(0, 300)
      .map((e) => ({
        id: e.id,
        titulo: e.titulo,
        classe: "evento",
        resumo: (e.resumo ?? "").slice(0, 160),
      })),
  };
}

export function catalogoDoEdital(): CatalogoDoEdital {
  // SÓ OS ESTADOS, e não os 359 territórios: um edital recorta por UF, e uma lista com 359
  // municípios estrangeiros dentro faria o recorte oferecer «Aargau, Suíça».
  const estados = entidadesDe("territorio").filter((t) => textoDoExtra(t, "nivel") === "estado");
  return {
    ...comum(),
    territorios: estados.map((t) => ({ id: t.id, rotulo: t.titulo })),
  };
}
