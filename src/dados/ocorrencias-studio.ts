/**
 * ocorrencias-studio.ts, o dado da tela 32, gestão de ocorrências do Studio (STUD-02).
 *
 * A AFIRMAÇÃO QUE ESTE MÓDULO EXISTE PARA SUSTENTAR. Evento, Temporada e Ocorrência são
 * registros PRÓPRIOS (DADO-02), e não datas aninhadas dentro de um evento. A consequência
 * prática é a tela inteira: alterar uma sessão altera UM registro, e o evento, título,
 * resumo, período declarado, procedência, sai da operação byte a byte igual. Num modelo de
 * catálogo, com as sessões dentro do evento, mudar um horário reescreveria o evento e o
 * aviso só poderia ser endereçado ao evento inteiro. É por isso que o Cenário 4 é
 * demonstrável aqui e não seria lá.
 *
 * DP-F: roda NO BUILD. Alcança `grafo.ts` (23 MB de JSON) por `alerta.ts`, `repertorio.ts` e
 * diretamente, e NENHUM arquivo `"use client"` pode importar este módulo por valor. O que
 * atravessa a fronteira é o DTO, que é só primitivo. D-47: toda leitura do acervo passa por
 * `grafo.ts`, nunca `entidades.json` ou `ocorrencias.json` direto.
 *
 * O QUE ESTE MÓDULO NÃO FAZ, E É O PONTO. Ele NÃO recalcula as alterações autoradas: elas
 * vêm de `alerta.ts`, que a fase 3 já fixou, e são reexportadas na forma que o histórico
 * precisa. Duas fontes para a mesma alteração é exatamente como o Studio e `/salvos`
 * passariam a discordar sobre o que aconteceu, e o Cenário 4 depende de as duas telas
 * mostrarem A MESMA mudança, uma do lado de quem causa e outra do lado de quem recebe.
 *
 * Pelo mesmo motivo, a chave de ocorrência é `chaveDeOcorrencia`/`indiceDeSalvaveis` de
 * `repertorio.ts`, e não uma segunda regra escrita aqui. Duas implementações da mesma chave
 * é o jeito clássico de o salvo sumir de uma tela e aparecer na outra.
 */

import {
  DATA_DE_REFERENCIA,
  EVENTO_DO_CANCELAMENTO,
  EVENTO_DO_PAR,
  alteracoes,
  parDeDemonstracao,
  type AlteracaoAutorada,
} from "./alerta";
import { ocorrenciasDe, porSlug, slugsPorTipo, temporadasDe } from "./grafo";
import { PERSONAS } from "./personas";
import { chaveDeOcorrencia, indiceDeSalvaveis } from "./repertorio";
import type { Entidade } from "./tipos";

// ---------------------------------------------------------------------------
// Constantes de operação, autoradas, e declaradas como tal
// ---------------------------------------------------------------------------

/** O evento em que o Studio abre. É o do Cenário 4, para o roteiro e o alerta caírem no
 * mesmo lugar; consumido de `alerta.ts` em vez de redigitado. */
export const EVENTO_PADRAO_DO_STUDIO = EVENTO_DO_PAR;

/** A data de referência do build, reexportada. NUNCA o relógio do runtime (T-03-10). */
export const DATA_DE_REFERENCIA_DO_STUDIO = DATA_DE_REFERENCIA;

/** A hora autorada do carimbo. Fixa pelo mesmo motivo que a data: ler `new Date()` no
 * cliente faria o HTML exportado divergir da página hidratada e exporia o fuso de quem
 * avalia. */
const HORA_DO_CARIMBO = "09:40";

/**
 * Quem alterou. D-25: **não há autenticação neste protótipo**. O nome é autorado e a tela
 * diz que é, ele está ali para mostrar que a alteração FICA REGISTRADA (T-04-14), não para
 * simular um login que o protótipo não tem.
 */
export const OPERADOR_DO_STUDIO = "Operação de programação (perfil autorado)";

export const OPERADOR_E_AUTORADO =
  "Não há autenticação neste protótipo. O nome de quem alterou é autorado e aparece " +
  "rotulado, em vez de simular um login: o que a tela precisa provar é que a alteração fica " +
  "registrada com autor e carimbo, e não que sabemos quem está do outro lado. O carimbo é " +
  // `dataCurta` e não a ISO crua: esta frase é lida em português, no meio de um parágrafo,
  // enquanto a mesma tela mostra carimbos em «DD.MM.AAAA». Duas grafias da mesma data na
  // mesma superfície fazem quem lê parar para decidir se são a mesma coisa.
  `derivado da data de referência do build (${dataCurta(DATA_DE_REFERENCIA)}), nunca do relógio de quem ` +
  "abre a página.";

/** O prefixo comum dos ids de ocorrência, para o DTO não repetir 20 caracteres 2.425 vezes. */
export const PREFIXO_DA_OCORRENCIA = indiceDeSalvaveis().prefixo;

// ---------------------------------------------------------------------------
// DTO
// ---------------------------------------------------------------------------

/**
 * As sessões de um evento em UMA STRING: `resto|AAAA-MM-DDTHH:mm|g` por sessão, separadas
 * por `;`.
 *
 * MEDIDO, e é por isso que não é um array de tuplas (T-04-19). O seletor troca de evento SEM
 * navegar, então as 2.425 sessões dos 129 eventos precisam estar no cliente. Em array de
 * tuplas, cada aspa e cada colchete vira barra invertida dentro do payload RSC: a página
 * exportada saiu em **268.367 bytes**. Achatada em string, sem uma aspa dentro, saiu em
 * **219.854**, a tabela de sessões em si caiu de ~110 KB de tuplas para **53.013
 * caracteres**. O resto do peso é legítimo: 129 títulos, resumos e URLs de fonte.
 *
 * O id inteiro é recomposto com `PREFIXO_DA_OCORRENCIA` mais `prefixoLocal` do evento, os
 * dois viajam uma vez cada, em vez de `ocorrencia:derivado:13845-t1-o` 53 vezes.
 */
export const SEPARADOR_DE_SESSAO = ";";
export const SEPARADOR_DE_CAMPO = "|";

/** A ficha imutável de um evento, mais as sessões dele. A ficha não tem caminho de escrita
 * em lugar nenhum desta tela (T-04-15): nenhum controle da tabela alcança estes campos. */
export interface EventoDoStudio {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  /** `ic` | `derivado` | `autorado`, o rótulo que nunca sai da tela. */
  procedencia: string;
  /** A URL de origem quando a procedência é `ic`. `null` quando o acervo não declara. */
  fonte: string | null;
  /** Ids de linguagem do vocabulário controlado. Vem VAZIO em muitos eventos do CMS. */
  linguagens: string[];
  /** "22.07.2026 – 18.10.2026", derivado das sessões. */
  periodo: string;
  /** Quantas temporadas o evento tem, o nível intermediário de DADO-02. */
  temporadas: number;
  /** A rota pública do evento, para o Studio levar de volta ao que ele opera. */
  rota: string;
  /** Quantas sessões o evento tem. Explícito para a tela não ter de decodificar a string
   * só para exibir a contagem no seletor, 129 vezes. */
  totalDeSessoes: number;
  /** O trecho que todos os sufixos de id deste evento compartilham (`"13845-t1-o00"`). */
  prefixoLocal: string;
  /** `resto|AAAA-MM-DDTHH:mm|g;…`, ver `SEPARADOR_DE_SESSAO`. */
  sessoes: string;
}

/** Uma entrada do histórico. Serve tanto para as alterações autoradas de `alerta.ts` quanto
 * para as que o operador confirma na tela (T-04-14). */
export interface EntradaDeHistorico {
  ocorrenciaId: string;
  eventoId: string;
  eventoTitulo: string;
  campo: string;
  campoRotulo: string;
  de: string;
  para: string;
  /** "22.08.2026", a data da sessão atingida. */
  dataDaSessao: string;
  quem: string;
  quando: string;
  /** `autorado` nas duas de `alerta.ts`; `operador` no que se confirma aqui. */
  origem: "autorado" | "operador";
  /** A frase que declara o que «autorado» significa. Só nas de `alerta.ts`. */
  frase: string | null;
  /** A rota onde a MESMA alteração aparece do lado de quem recebe. */
  rotaDoOutroLado: string;
}

/** As duas sessões do par do Cenário 4, para a semeadura não depender de digitação. */
export interface ParDoStudio {
  eventoId: string;
  eventoTitulo: string;
  atingida: { id: string; dataCurta: string; hora: string };
  intacta: { id: string; dataCurta: string; hora: string };
}

export interface NumerosDoAcervo {
  eventos: number;
  eventosComSessao: number;
  ocorrencias: number;
  ocorrenciasComEspaco: number;
  eventosQueDeclaramIngresso: number;
  personas: number;
  ocorrenciasSalvasSemeadas: number;
  /** Ids no repertório das personas que o índice do build NÃO resolve. */
  salvamentosSemeadosDescartados: number;
}

export interface DeclaracaoHonesta {
  chave: string;
  rotulo: string;
  texto: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** "2026-08-22" → "22.08.2026". A mesma regra de `repertorio.ts` e `alerta.ts`, pelo mesmo
 * motivo: comparar `DD.MM.AAAA` com ISO como string é comparação quebrada, então a
 * conversão acontece uma vez, na saída, e nunca no meio de uma ordenação. */
function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}.${mes}.${ano}` : iso;
}

/** `1304` → `"1.304"`. Sem `toLocaleString`: o separador não pode depender do locale da
 * máquina que roda o build, senão o número da tela muda de forma entre um build e outro. */
export function comSeparador(n: number): string {
  const s = String(Math.trunc(Math.abs(n)));
  let saida = "";
  for (let i = 0; i < s.length; i += 1) {
    if (i > 0 && (s.length - i) % 3 === 0) saida += ".";
    saida += s[i];
  }
  return (n < 0 ? "-" : "") + saida;
}

/**
 * O maior trecho inicial que TODOS os sufixos compartilham. Nenhum separador entra na conta:
 * o resto é recolado ao prefixo pelo cliente, e um prefixo que corte no meio de um campo
 * continuaria recompondo o id certo, mas é mais fácil de conferir se não cortar.
 */
function prefixoComum(sufixos: string[]): string {
  if (!sufixos.length) return "";
  let prefixo = sufixos[0] ?? "";
  for (const s of sufixos) {
    let i = 0;
    while (i < prefixo.length && i < s.length && prefixo[i] === s[i]) i += 1;
    prefixo = prefixo.slice(0, i);
    if (!prefixo) break;
  }
  return prefixo;
}

/** Todos os eventos do grafo, sem repetir, em ordem de id. `slugsPorTipo` é a única porta
 * que `grafo.ts` abre para varrer uma classe inteira (D-47). */
function todosOsEventos(): Entidade[] {
  const vistos = new Set<string>();
  const saida: Entidade[] = [];
  for (const slug of slugsPorTipo("evento")) {
    const e = porSlug("evento", slug);
    if (!e || vistos.has(e.id)) continue;
    vistos.add(e.id);
    saida.push(e);
  }
  return saida.sort((a, b) => a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------------------
// Os 129 eventos com sessão
// ---------------------------------------------------------------------------

let CACHE_EVENTOS: EventoDoStudio[] | null = null;

/**
 * Os eventos que o Studio opera: os que TÊM sessão.
 *
 * Medido: **129 de 300**, todos do CMS. As entidades da Enciclopédia devolvem zero
 * ocorrências, elas são o acervo histórico, sem programação datada,, então não entram no
 * seletor. Isso é DITO na tela (declaração 3), e não escondido: um seletor com 300 eventos
 * dos quais 171 abrem uma tabela vazia seria pior do que um seletor com 129 que abrem.
 */
export function eventosDoStudio(): EventoDoStudio[] {
  if (CACHE_EVENTOS) return CACHE_EVENTOS;

  const saida: EventoDoStudio[] = [];

  for (const evento of todosOsEventos()) {
    const ocorrencias = ocorrenciasDe(evento.id);
    if (!ocorrencias.length) continue;

    const primeira = ocorrencias[0];
    const ultima = ocorrencias[ocorrencias.length - 1];
    const sufixos = ocorrencias.map((o) => chaveDeOcorrencia(o.id, PREFIXO_DA_OCORRENCIA));
    const prefixoLocal = prefixoComum(sufixos);

    saida.push({
      id: evento.id,
      slug: evento.slug,
      titulo: evento.titulo,
      resumo: evento.resumo ?? "",
      procedencia: evento.procedencia,
      fonte: evento.fonte ?? null,
      linguagens: evento.linguagens ?? [],
      periodo:
        primeira && ultima
          ? `${dataCurta(primeira.inicio)} – ${dataCurta(ultima.inicio)}`
          : "período não declarado",
      temporadas: temporadasDe(evento.id).length,
      rota: `/evento/${evento.slug}/`,
      totalDeSessoes: ocorrencias.length,
      prefixoLocal,
      sessoes: ocorrencias
        .map((o, i) =>
          [
            sufixos[i]?.slice(prefixoLocal.length) ?? "",
            o.inicio.slice(0, 16),
            o.gratuito ? "1" : "0",
          ].join(SEPARADOR_DE_CAMPO),
        )
        .join(SEPARADOR_DE_SESSAO),
    });
  }

  CACHE_EVENTOS = saida;
  return saida;
}

/** A ficha de um evento. `undefined` quando o id não é de evento com sessão. */
export function eventoDoStudio(id: string): EventoDoStudio | undefined {
  return eventosDoStudio().find((e) => e.id === id);
}

// ---------------------------------------------------------------------------
// Os salvamentos semeados, a metade do número de impacto que vem de `personas.json`
// ---------------------------------------------------------------------------

let CACHE_SEMEADOS: { mapa: Record<string, string[]>; descartados: number } | null = null;

/**
 * Ocorrência → nomes das personas que a têm no repertório semeado.
 *
 * A chave é a de `repertorio.ts`, sem prefixo, para o cliente casar sem uma segunda regra.
 *
 * T-04-13, primeira metade: um id do repertório que o índice do build NÃO resolve é
 * DESCARTADO e contado, em vez de virar uma pessoa fantasma no número de impacto. Hoje são
 * 4 entradas, todas de Joana, todas resolvidas, e 0 descartadas.
 */
function semeados(): { mapa: Record<string, string[]>; descartados: number } {
  if (CACHE_SEMEADOS) return CACHE_SEMEADOS;

  const indice = indiceDeSalvaveis();
  const mapa: Record<string, string[]> = {};
  let descartados = 0;

  for (const persona of PERSONAS) {
    for (const id of persona.repertorio?.ocorrenciasSalvas ?? []) {
      const chave = chaveDeOcorrencia(id, indice.prefixo);
      if (!indice.ocorrencias[chave]) {
        descartados += 1;
        continue;
      }
      const lista = (mapa[chave] ??= []);
      if (!lista.includes(persona.nome)) lista.push(persona.nome);
    }
  }

  CACHE_SEMEADOS = { mapa, descartados };
  return CACHE_SEMEADOS;
}

/** O mapa `chave da ocorrência → nomes`, para o cliente somar o conjunto de pessoas. */
export function salvamentosSemeados(): Record<string, string[]> {
  return semeados().mapa;
}

// ---------------------------------------------------------------------------
// O histórico que já nasce cheio, as alterações de `alerta.ts`
// ---------------------------------------------------------------------------

/**
 * As duas alterações autoradas, na forma de entrada de histórico.
 *
 * REEXPORTADAS, e não recalculadas: `alteracoes()` é de `alerta.ts`, e é o mesmo objeto que
 * `/salvos` consome do outro lado. É isso, e só isso, que faz as duas metades do Cenário 4
 * mostrarem A MESMA mudança, o Studio não escreve na tela de Salvos, e não precisa.
 */
export function historicoAutorado(): EntradaDeHistorico[] {
  return alteracoes().map(
    (a: AlteracaoAutorada): EntradaDeHistorico => ({
      ocorrenciaId: a.ocorrenciaId,
      eventoId: a.eventoId,
      eventoTitulo: a.eventoTitulo,
      campo: a.campo,
      campoRotulo: a.campoRotulo,
      de: a.de,
      para: a.para,
      dataDaSessao: a.dataCurta,
      quem: a.quemInformou,
      quando: a.informadoEmCurto,
      origem: "autorado",
      frase: a.frase,
      rotaDoOutroLado: "/salvos/",
    }),
  );
}

/** As alterações autoradas deste evento. `alerta.ts` põe uma em cada evento, de propósito. */
export function historicoAutoradoDe(eventoId: string): EntradaDeHistorico[] {
  return historicoAutorado().filter((h) => h.eventoId === eventoId);
}

/** O carimbo que uma alteração feita AGORA no Studio recebe. Derivado da data de referência
 * do build, nunca do relógio (T-03-10). */
export const CARIMBO_DA_ALTERACAO = `${dataCurta(DATA_DE_REFERENCIA)}, ${HORA_DO_CARIMBO.replace(
  ":",
  "h",
)}`;

// ---------------------------------------------------------------------------
// O par do Cenário 4
// ---------------------------------------------------------------------------

/** As duas sessões que a semeadura salva. Vêm de `alerta.ts`, com os MESMOS ids que
 * `/salvos` semeia, digitá-los aqui seria criar a segunda fonte que a tela existe para
 * não ter. */
export function parDoCenario4(): ParDoStudio {
  const par = parDeDemonstracao();
  return {
    eventoId: par.eventoId,
    eventoTitulo: par.eventoTitulo,
    atingida: { id: par.atingida.id, dataCurta: par.atingida.dataCurta, hora: par.atingida.hora },
    intacta: { id: par.intacta.id, dataCurta: par.intacta.dataCurta, hora: par.intacta.hora },
  };
}

/**
 * Ocorrência → horário proposto, para o formulário de edição já abrir com a mudança do
 * roteiro preenchida. Vem das alterações de `alerta.ts`: confirmar a linha do Cenário 4 no
 * Studio produz EXATAMENTE a mudança que `/salvos` mostra do outro lado, e não uma parecida.
 */
export function horariosPropostos(): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const a of alteracoes()) {
    if (a.campo === "horario") saida[a.ocorrenciaId] = a.para;
  }
  return saida;
}

// ---------------------------------------------------------------------------
// Os números honestos
// ---------------------------------------------------------------------------

let CACHE_NUMEROS: NumerosDoAcervo | null = null;

export function numerosDoAcervo(): NumerosDoAcervo {
  if (CACHE_NUMEROS) return CACHE_NUMEROS;

  let ocorrencias = 0;
  let comEspaco = 0;
  let declaramIngresso = 0;
  let eventos = 0;

  for (const evento of todosOsEventos()) {
    eventos += 1;
    const lista = ocorrenciasDe(evento.id);
    ocorrencias += lista.length;
    let algumPago = false;
    for (const o of lista) {
      if (o.espacoId) comEspaco += 1;
      if (!o.gratuito) algumPago = true;
    }
    if (algumPago) declaramIngresso += 1;
  }

  const { mapa, descartados } = semeados();

  CACHE_NUMEROS = {
    eventos,
    eventosComSessao: eventosDoStudio().length,
    ocorrencias,
    ocorrenciasComEspaco: comEspaco,
    eventosQueDeclaramIngresso: declaramIngresso,
    personas: PERSONAS.length,
    ocorrenciasSalvasSemeadas: Object.keys(mapa).length,
    salvamentosSemeadosDescartados: descartados,
  };
  return CACHE_NUMEROS;
}

// ---------------------------------------------------------------------------
// O que o acervo NÃO sustenta, produto, e não comentário
// ---------------------------------------------------------------------------

/**
 * As quatro declarações, calculadas sobre o dado.
 *
 * Elas ficam na tela, como a declaração honesta da tela de duplicatas: a honestidade sobre
 * o dado é o argumento da proposta, não a nota de rodapé sobre ele. Os números são
 * interpolados do que `numerosDoAcervo()` mediu, um literal
 * digitado na tela faria a apresentação afirmar, na primeira regeração do grafo, número que
 * o acervo não sustenta.
 */
export function declaracoesDoQueNaoSustenta(): DeclaracaoHonesta[] {
  const n = numerosDoAcervo();

  return [
    {
      chave: "espaco",
      rotulo: "nenhuma sessão tem espaço",
      texto:
        `Nenhuma das ${comSeparador(n.ocorrencias)} ocorrências do acervo declara espaço: são ` +
        `${comSeparador(n.ocorrenciasComEspaco)} de ${comSeparador(n.ocorrencias)}. A coluna ` +
        `«espaço» existe nesta tabela e vem vazia, DECLARADA em vez de omitida, omitir a ` +
        `coluna esconderia que o dado falta; declará-la mostra exatamente onde a ingestão ` +
        `precisa melhorar. Sem espaço não há endereço, não há acessibilidade do local e não ` +
        `há mapa da sessão.`,
    },
    {
      chave: "gratuidade",
      rotulo: "a gratuidade não recorta nada",
      texto:
        `Nenhum dos ${comSeparador(n.eventos)} eventos declara ingresso: são ` +
        `${comSeparador(n.eventosQueDeclaramIngresso)} de ${comSeparador(n.eventos)}. A fonte ` +
        `tem só um booleano de gratuidade e ele vale o mesmo para todo mundo, então «entrada ` +
        `franca» aqui é verdade POR PADRÃO e não por fato, o rótulo da coluna carrega o ` +
        `qualificador em vez de afirmar gratuidade, como a tela de Salvos já faz. Filtrar por ` +
        `preço neste acervo devolveria tudo.`,
    },
    {
      chave: "escopo",
      rotulo: "o Studio opera sobre 129 eventos",
      texto:
        `O seletor traz ${comSeparador(n.eventosComSessao)} eventos, e não os ` +
        `${comSeparador(n.eventos)} do acervo: são os do CMS que têm sessão. As entidades da ` +
        `Enciclopédia devolvem zero ocorrências, elas são o acervo histórico, sem programação ` +
        `datada, e por isso ficam de fora, dito e não escondido. Gestão de ocorrência sobre ` +
        `evento sem ocorrência é tela vazia com aparência de defeito.`,
    },
    {
      chave: "alteracao",
      rotulo: "a alteração é autorada e o protótipo não escreve",
      texto:
        `Nenhum sistema do Itaú Cultural publica histórico de mudança de sessão: as ` +
        `${comSeparador(n.ocorrencias)} ocorrências deste grafo são derivadas do período real ` +
        `do evento e nenhuma delas registra alteração. A sessão e a data são reais; a mudança ` +
        `é nossa, e aparece rotulada em vez de passar por dado do acervo. Confirmar aqui não ` +
        `grava em servidor nenhum, o protótipo é estático, e é justamente essa lacuna que a ` +
        `plataforma existe para fechar.`,
    },
  ];
}

/** A frase que fecha D-73, e que a tela existe para tornar visível. */
export const FRASE_DE_D73 =
  "Alterar uma sessão não invalida o evento. Depois de confirmar, todos os campos da ficha " +
  "acima continuam com exatamente os mesmos valores, e isso é consequência direta de Evento, " +
  "Temporada e Ocorrência serem registros próprios (DADO-02). Num modelo de catálogo, com as " +
  "datas aninhadas dentro do evento, mudar uma sessão reescreveria o evento inteiro, e o aviso " +
  "só poderia ser do evento, chegaria a quem salvou qualquer uma das outras sessões.";

/** A frase que amarra as duas metades do Cenário 4. */
export const FRASE_DAS_DUAS_METADES =
  "As alterações marcadas «autorado» abaixo são as mesmas que a tela de Salvos, em /salvos/, " +
  "exibe do lado de quem recebe o aviso. Não há cópia entre as duas telas: as duas leem a " +
  "mesma fonte no build, e é por isso que a propagação é crível sem servidor.";

/** Reexportadas para a página citar o par sem reimportar `alerta.ts`. */
export { EVENTO_DO_PAR, EVENTO_DO_CANCELAMENTO };
