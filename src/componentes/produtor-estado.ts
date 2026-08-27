"use client";

/**
 * produtor-estado.ts, o armazém ÚNICO do perfil Produtor, no navegador.
 *
 * POR QUE UM SÓ. Antes deste arquivo havia dois: `studio.v1` (a jornada do produtor, em
 * `studio-estado.ts`) e `studio.org.v1` (a Organização, em `studio-org-estado.ts`), gravados
 * por telas que dividem a mesma pasta `/studio/`. Dois armazéns sobre um perfil só produzem
 * o defeito que ninguém vê: o painel conta cinco registros, a lista mostra três, e as duas
 * telas estão certas, cada uma sobre a própria chave.
 *
 * A MIGRAÇÃO NÃO APAGA O QUE ESTAVA GRAVADO. `hidratar` lê `produtor.v1` primeiro; se ela
 * não existir, lê as duas chaves antigas, converte e grava a nova, **e deixa as antigas
 * onde estão**. Apagar antes de a nova estar de pé transformaria um erro de conversão em
 * perda de trabalho, e o produtor não teria como voltar.
 *
 * MÓDULO DE CLIENTE, E POR ISSO NÃO IMPORTA DADO POR VALOR (DP-F). A semente e o contexto
 * chegam por PARÂMETRO, vindos do componente de servidor que os leu no build. Um import de
 * `@/dados/grafo` aqui arrastaria 23 MB para o navegador.
 *
 * `localStorage` SÓ DEPOIS DE MONTAR. O estado nasce `null` e só vira lista quando
 * `hidratar` roda dentro de um `useEffect`. Ler o armazenamento durante o render faria o
 * HTML exportado e a página hidratada divergirem.
 *
 * SEM RELÓGIO E SEM SORTEIO. Todo carimbo é `DATA_DE_REFERENCIA`, que chega junto com a
 * semente; todo id é sequencial sobre o que já existe.
 */

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  CHAVES_HERDADAS,
  CHAVE_DO_PRODUTOR,
  comChavesDoRegistro,
  daFormaAntiga,
  ordenarRegistros,
  podePublicar,
  registroVazio,
} from "@/dados/tipos-produtor";
import type {
  ContextoDoProdutor,
  Pauta,
  Registro,
  Situacao,
} from "@/dados/tipos-produtor";
import { editavel } from "@/dados/tipos-acesso";
import type { RascunhoDoProdutor } from "@/dados/tipos-acesso";

/** A versão da forma persistida. Sobe junto com o sufixo de `CHAVE_DO_PRODUTOR`. */
const VERSAO = 1;

export interface EstadoDoProdutor {
  versao: number;
  registros: Registro[];
  /** Qual registro as fichas estão editando. Mora aqui, e não na URL, porque a ficha
   *  atravessa oito atos e um parâmetro perdido no meio faria o ato 8 revisar outro
   *  registro, e ninguém teria como saber que trocou. */
  atualId: string | null;
  /** O que já foi migrado das chaves antigas, para não migrar duas vezes. */
  migradoDe: string[];
}

// ---------------------------------------------------------------------------
// A loja, módulo, e não `useState` por tela
// ---------------------------------------------------------------------------

let estado: EstadoDoProdutor | null = null;
let semente: Registro[] = [];
let contexto: ContextoDoProdutor = { dataDeReferencia: "", autor: "", organizacao: "" };

const ouvintes = new Set<() => void>();

function avisar() {
  for (const o of ouvintes) o();
}

function assinar(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function lerLoja(): EstadoDoProdutor | null {
  return estado;
}

/** O que o servidor «vê». Sempre `null`: no build não há armazenamento, e devolver a
 *  semente aqui faria o HTML exportado afirmar um estado que o navegador contradiz. */
function lerNoServidor(): EstadoDoProdutor | null {
  return null;
}

// ---------------------------------------------------------------------------
// Validação na LEITURA, o conteúdo do armazenamento é entrada externa
// ---------------------------------------------------------------------------

/**
 * O que veio do `localStorage` tem a forma que este código espera?
 *
 * ESTREITA DE PROPÓSITO: confere o que as fichas realmente leem e descarta o resto. Um
 * objeto com forma errada aceito aqui viraria `undefined.map` três telas adiante, longe da
 * causa. O projeto não tem zod entre as dependências e acrescentá-lo é mudança fora deste
 * trabalho, então a checagem é manual.
 */
function pareceEstado(v: unknown): v is EstadoDoProdutor {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  if (o.versao !== VERSAO) return false;
  if (!Array.isArray(o.registros)) return false;
  if (o.atualId !== null && typeof o.atualId !== "string") return false;
  if (!Array.isArray(o.migradoDe)) return false;
  return o.registros.every(pareceRegistro);
}

function pareceRegistro(r: unknown): boolean {
  if (typeof r !== "object" || r === null) return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    typeof x.pauta === "string" &&
    typeof x.situacao === "string" &&
    typeof x.visibilidade === "string" &&
    typeof x.titulo === "string" &&
    typeof x.declaraAcessibilidade === "boolean" &&
    Array.isArray(x.linguagens) &&
    Array.isArray(x.pendencias)
  );
}

/** A forma antiga da S7, conferida antes de converter. */
function pareceRascunhoAntigo(r: unknown): r is RascunhoDoProdutor {
  if (typeof r !== "object" || r === null) return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    typeof x.situacao === "string" &&
    typeof x.titulo === "string" &&
    Array.isArray(x.temporadas) &&
    Array.isArray(x.ocorrencias) &&
    Array.isArray(x.elenco) &&
    typeof x.declaraAcessibilidade === "boolean"
  );
}

// ---------------------------------------------------------------------------
// Leitura e escrita
// ---------------------------------------------------------------------------

function doZero(): EstadoDoProdutor {
  const registros = semente.map((r) => ({ ...r }));
  return {
    versao: VERSAO,
    registros,
    atualId: registros[0]?.id ?? null,
    migradoDe: [],
  };
}

function gravar(proximo: EstadoDoProdutor) {
  estado = proximo;
  try {
    window.localStorage.setItem(CHAVE_DO_PRODUTOR, JSON.stringify(proximo));
  } catch (erro) {
    // Não engolir: em janela anônima ou com cota estourada a gravação falha, e a jornada
    // continua funcionando NA SESSÃO, o que se perde é só o «recarregar preserva». Quem
    // depura precisa ver; quem apresenta não pode ser interrompido.
    console.error("Produtor: não foi possível gravar o estado.", erro);
  }
  avisar();
}

function lerChave(chave: string): unknown {
  let cru: string | null = null;
  try {
    cru = window.localStorage.getItem(chave);
  } catch {
    return null;
  }
  if (cru === null) return null;
  try {
    return JSON.parse(cru);
  } catch {
    return null;
  }
}

/**
 * O que as duas chaves antigas guardavam, convertido, e NADA é apagado.
 *
 * Só a agenda migra: `studio.v1` guarda `RascunhoDoProdutor`, que é a ficha do evento.
 * `studio.org.v1` guarda cadastros de espaço, instituição, mídia, programa, formação e
 * edital, numa forma indexada por id do acervo, e ela é lida em S6/S7/S9 quando cada ficha
 * for portada, migrar tudo agora produziria registros sem título nenhum no painel.
 */
function migrarDoAntigo(): { registros: Registro[]; de: string[] } {
  const registros: Registro[] = [];
  const de: string[] = [];

  const antigo = lerChave(CHAVES_HERDADAS[0]);
  if (typeof antigo === "object" && antigo !== null) {
    const o = antigo as Record<string, unknown>;
    if (Array.isArray(o.rascunhos)) {
      const validos = o.rascunhos.filter(pareceRascunhoAntigo);
      if (validos.length > 0) {
        registros.push(...validos.map((r) => comChavesDoRegistro(daFormaAntiga(r, contexto))));
        de.push(CHAVES_HERDADAS[0]);
      }
    }
  }

  return { registros, de };
}

/**
 * Lê o armazenamento e liga a loja. Idempotente: chamar de novo não relê nem sobrescreve,
 * várias telas montam o mesmo gancho, e a segunda não pode desfazer o que a primeira leu.
 */
function hidratar(sementeNova: Registro[], contextoNovo: ContextoDoProdutor) {
  semente = sementeNova;
  contexto = contextoNovo;
  if (estado !== null) return;

  const lido = lerChave(CHAVE_DO_PRODUTOR);

  if (lido === null) {
    // Primeira vez nesta versão: semeia, e depois absorve o que as chaves antigas tinham.
    const base = doZero();
    const { registros, de } = migrarDoAntigo();
    const idsDaSemente = new Set(base.registros.map((r) => r.id));
    const novos = registros.filter((r) => !idsDaSemente.has(r.id));
    gravar({
      ...base,
      registros: [...novos, ...base.registros],
      migradoDe: de,
    });
    return;
  }

  if (!pareceEstado(lido)) {
    // Versão antiga ou conteúdo estranho: recomeça, e DIZ que recomeçou. Migrar em
    // silêncio faria a demonstração perder trabalho sem ninguém entender por quê.
    console.warn("Produtor: estado com forma inesperada; a demonstração recomeçou do zero.");
    gravar(doZero());
    return;
  }

  estado = lido;
  avisar();
}

// ---------------------------------------------------------------------------
// Operações
// ---------------------------------------------------------------------------

function comRegistro(id: string, transformar: (r: Registro) => Registro) {
  if (estado === null) return;
  gravar({
    ...estado,
    registros: estado.registros.map((r) =>
      r.id === id ? comChavesDoRegistro(transformar(r)) : r,
    ),
  });
}

/**
 * O próximo id da pauta. Determinístico: o maior sufixo numérico já usado naquela pauta,
 * mais um. Dois navegadores rodando a mesma demonstração chegam ao mesmo id para o mesmo
 * passo, e a captura de tela de ontem continua batendo com a de hoje.
 */
function proximoId(registros: readonly Registro[], pauta: Pauta): string {
  let maior = 0;
  for (const r of registros) {
    if (r.pauta !== pauta) continue;
    const n = Number.parseInt(r.id.slice(r.id.lastIndexOf(":") + 1), 10);
    if (Number.isFinite(n) && n > maior) maior = n;
  }
  return `${pauta}:produtor:${String(maior + 1).padStart(3, "0")}`;
}

/** O que a cópia NÃO leva: data, situação, publicação e alcance.
 *
 *  Duplicar é a ação mais usada de um produtor real, a próxima temporada, a próxima
 *  edição, o próximo episódio nascem da anterior. Levar as datas junto faria a cópia
 *  anunciar sessões do mês passado, e o alcance da cópia começaria mentindo. */
function duplicado(r: Registro, id: string, ctx: ContextoDoProdutor): Registro {
  const base = {
    ...r,
    id,
    situacao: "rascunho" as Situacao,
    titulo: `${r.titulo} (cópia)`,
    publicadoEm: null,
    criadoEm: ctx.dataDeReferencia,
    motivoDaDevolucao: null,
  };
  if (base.pauta === "agenda") {
    return { ...base, temporadas: [], sessoes: [] };
  }
  if (base.pauta === "cursos") {
    return { ...base, inicio: "", fim: "", prazoDeInscricao: null };
  }
  if (base.pauta === "editorial") {
    return { ...base, data: ctx.dataDeReferencia };
  }
  if (base.pauta === "curadoria") {
    return { ...base, vigenciaInicio: "", vigenciaFim: "" };
  }
  if (base.pauta === "editais") {
    return { ...base, prazo: "" };
  }
  return base;
}

// ---------------------------------------------------------------------------
// O gancho
// ---------------------------------------------------------------------------

export interface ArmazemDoProdutor {
  /** `false` até o armazenamento ter sido lido. A tela mostra carregamento, não a semente. */
  pronto: boolean;
  registros: Registro[];
  /** Já ordenados: o que pede ação primeiro. */
  ordenados: Registro[];
  atual: Registro | null;
  contexto: ContextoDoProdutor;
  /** As chaves antigas que foram absorvidas, a tela declara isso em vez de escondê-lo. */
  migradoDe: string[];

  escolher: (id: string) => void;
  /** Altera o registro atual. O recálculo de chave e pendências é automático. */
  alterar: (mudanca: Partial<Registro>) => void;
  alterarId: (id: string, mudanca: Partial<Registro>) => void;
  /** Cria um registro em branco da pauta, já selecionado, e devolve o id. */
  criar: (pauta: Pauta) => string;
  duplicar: (id: string) => string | null;
  remover: (id: string) => void;
  /**
   * Publica, **e recusa por conta própria** quando há impedimento.
   *
   * Devolve `false` quando recusou. Duas travas, como o veto já faz: a tela desabilita o
   * botão, e esta função confere de novo. Uma trava só seria trava de aparência.
   */
  publicar: (id: string) => boolean;
  mudarSituacao: (id: string, situacao: Situacao, motivo?: string | null) => void;
  /** Devolve a demonstração ao estado semeado. Uma apresentação roda duas vezes. */
  reiniciar: () => void;
  /** `true` quando o registro atual está nas mãos do produtor. */
  editavelAgora: boolean;
}

/**
 * O estado do perfil, igual para todas as telas.
 *
 * `useSyncExternalStore` e não `useState` por tela: o painel, a ficha e a grade podem estar
 * montados ao mesmo tempo, e três cópias do mesmo registro divergiriam no primeiro
 * salvamento. Uma loja de módulo com assinantes é o mecanismo mais simples que a casa já
 * usa, e não acrescenta dependência.
 */
export function useProdutor(
  sementeDoServidor: Registro[],
  contextoDoServidor: ContextoDoProdutor,
): ArmazemDoProdutor {
  useEffect(() => {
    hidratar(sementeDoServidor, contextoDoServidor);
  }, [sementeDoServidor, contextoDoServidor]);

  const atualEstado = useSyncExternalStore(assinar, lerLoja, lerNoServidor);

  const escolher = useCallback((id: string) => {
    if (estado === null) return;
    gravar({ ...estado, atualId: id });
  }, []);

  const alterarId = useCallback((id: string, mudanca: Partial<Registro>) => {
    comRegistro(id, (r) => ({ ...r, ...mudanca }) as Registro);
  }, []);

  const alterar = useCallback((mudanca: Partial<Registro>) => {
    if (estado?.atualId) comRegistro(estado.atualId, (r) => ({ ...r, ...mudanca }) as Registro);
  }, []);

  const criar = useCallback((pauta: Pauta) => {
    const base = estado ?? doZero();
    const id = proximoId(base.registros, pauta);
    const novo = comChavesDoRegistro(registroVazio(id, pauta, contexto));
    gravar({ ...base, registros: [novo, ...base.registros], atualId: id });
    return id;
  }, []);

  const duplicar = useCallback((id: string) => {
    if (estado === null) return null;
    const original = estado.registros.find((r) => r.id === id);
    if (!original) return null;
    const novoId = proximoId(estado.registros, original.pauta);
    const copia = comChavesDoRegistro(duplicado(original, novoId, contexto));
    gravar({ ...estado, registros: [copia, ...estado.registros], atualId: novoId });
    return novoId;
  }, []);

  const remover = useCallback((id: string) => {
    if (estado === null) return;
    const restantes = estado.registros.filter((r) => r.id !== id);
    gravar({
      ...estado,
      registros: restantes,
      atualId: estado.atualId === id ? (restantes[0]?.id ?? null) : estado.atualId,
    });
  }, []);

  const publicar = useCallback((id: string) => {
    if (estado === null) return false;
    const alvo = estado.registros.find((r) => r.id === id);
    if (!alvo) return false;
    // A SEGUNDA TRAVA. A tela já desabilitou o botão; esta linha recusa mesmo assim, para
    // quem chegar por outro caminho. É a mesma disciplina que o veto da moderação usa.
    if (!podePublicar(alvo)) {
      console.warn("Produtor: publicação recusada, há impedimento bloqueante.", id);
      return false;
    }
    comRegistro(id, (r) => ({
      ...r,
      situacao: "publicado",
      publicadoEm: contexto.dataDeReferencia,
      motivoDaDevolucao: null,
    }));
    return true;
  }, []);

  const mudarSituacao = useCallback(
    (id: string, situacao: Situacao, motivo: string | null = null) => {
      comRegistro(id, (r) => ({
        ...r,
        situacao,
        publicadoEm: situacao === "publicado" ? contexto.dataDeReferencia : r.publicadoEm,
        motivoDaDevolucao:
          situacao === "devolvido" || situacao === "suspenso" || situacao === "vetado"
            ? motivo
            : null,
      }));
    },
    [],
  );

  const reiniciar = useCallback(() => {
    try {
      window.localStorage.removeItem(CHAVE_DO_PRODUTOR);
    } catch (erro) {
      console.error("Produtor: não foi possível limpar o estado.", erro);
    }
    gravar(doZero());
  }, []);

  const registros = useMemo(() => atualEstado?.registros ?? [], [atualEstado]);
  const ordenados = useMemo(() => ordenarRegistros(registros), [registros]);
  const atual = registros.find((r) => r.id === atualEstado?.atualId) ?? registros[0] ?? null;

  return {
    pronto: atualEstado !== null,
    registros,
    ordenados,
    atual,
    contexto: contextoDoServidor,
    migradoDe: atualEstado?.migradoDe ?? [],
    escolher,
    alterar,
    alterarId,
    criar,
    duplicar,
    remover,
    publicar,
    mudarSituacao,
    reiniciar,
    editavelAgora: atual !== null && editavel(atual.situacao),
  };
}

/**
 * A leitura sem gancho, para quem só precisa contar.
 *
 * Não hidrata: devolve `null` antes de a loja estar ligada. Quem chama tem de tolerar isso,
 * e é de propósito, porque a alternativa seria uma segunda hidratação disputando com a
 * primeira.
 */
export function lerRegistros(): readonly Registro[] | null {
  return estado?.registros ?? null;
}

/**
 * A INTENÇÃO DE ABRIR A FICHA, entre páginas. A rota da pauta abre num PAINEL da
 * categoria (número, melhores, em edição), e só entra nas etapas quando a pessoa pede.
 * Quem já pediu antes de navegar («Criar» do painel, «Editar» de uma linha) não pode
 * cair no painel de novo: marca aqui, e a página de chegada consome. Variável de módulo,
 * não armazenamento: sobrevive à navegação de cliente e morre no recarregamento, que é
 * exatamente o alcance que uma intenção tem.
 */
let intencaoDeAbrirFicha = false;

export function marcarAberturaDaFicha(): void {
  intencaoDeAbrirFicha = true;
}

export function consumirAberturaDaFicha(): boolean {
  const pedida = intencaoDeAbrirFicha;
  intencaoDeAbrirFicha = false;
  return pedida;
}

/**
 * A INTENÇÃO DE ABRIR O DETALHE, irmã da de cima. Quem toca num comentário na
 * Comunidade quer o REGISTRO que o recebeu, não a lista da pauta dele.
 */
let intencaoDeAbrirDetalhe = false;

export function marcarAberturaDoDetalhe(): void {
  intencaoDeAbrirDetalhe = true;
}

export function consumirAberturaDoDetalhe(): boolean {
  const pedida = intencaoDeAbrirDetalhe;
  intencaoDeAbrirDetalhe = false;
  return pedida;
}

/**
 * A INTENÇÃO DE CRIAR, irmã das duas de cima, com um dado a mais: qual pauta. A folha
 * de criação não carrega o armazém (carregá-lo poria a semente inteira na coluna
 * lateral de todas as telas); ela marca a pauta aqui e navega, e a página de chegada
 * cria o registro QUANDO o armazém dela hidratar. Criar antes de hidratar perderia o
 * registro no instante em que a hidratação sobrescrevesse o estado.
 */
let pautaParaCriar: string | null = null;
const ouvintesDeCriacao = new Set<() => void>();

/**
 * COM ASSINATURA, ao contrário das outras duas intenções, e a razão é medida: quem
 * cria a partir da folha JÁ ESTANDO na rota da pauta não navega para lugar nenhum (o
 * push para a mesma rota não remonta a página), então o efeito de montagem nunca
 * redispara e a intenção ficava gravada sem ninguém consumir. O assinante acorda o
 * componente na hora em que a marca acontece, montado ou não.
 */
export function marcarCriacaoDaPauta(pauta: string): void {
  pautaParaCriar = pauta;
  for (const o of ouvintesDeCriacao) o();
}

export function assinarCriacaoDaPauta(ouvinte: () => void): () => void {
  ouvintesDeCriacao.add(ouvinte);
  return () => {
    ouvintesDeCriacao.delete(ouvinte);
  };
}

export function pautaPendenteDeCriacao(): string | null {
  return pautaParaCriar;
}

/** No servidor não há intenção nenhuma: o HTML exportado nasce sem pendência. */
export function pautaPendenteNoServidor(): string | null {
  return null;
}

export function consumirCriacaoDaPauta(): string | null {
  const pedida = pautaParaCriar;
  pautaParaCriar = null;
  return pedida;
}
