"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { RECOMPENSAS } from "@/dados/recompensas";
import { PERSONAS } from "@/dados/personas";
import type { EstadoDoMotor, RecompensaDefinida, Resgate } from "@/lib/pontos/tipos";

/**
 * loja-estado.ts — o que o Produtor mudou na loja, e só isso.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SOBREPOSIÇÃO, NUNCA CÓPIA. O armazém guarda apenas o que divergiu da semente: os
 * campos alterados de um item, os itens criados aqui, os que foram tirados de cartaz e
 * quantos de cada um já saíram. A vitrine, a carteira e o motor continuam lendo o array
 * `RECOMPENSAS` de `@/dados/recompensas`, que este arquivo RECONCILIA no lugar.
 *
 * É essa escolha que compra três coisas de uma vez:
 *
 * · o motor não muda uma linha. Ele acha o item em `find`, cobra o preço, confere o
 *   estoque e decrementa no MESMO objeto que a gestão editou.
 * · `scripts/verificar-pontos.ts` continua verde. Ele roda em Node, onde nenhum armazém
 *   hidrata: lá `RECOMPENSAS` está intocado, com o item de custo 520, o `rec-exposicao` e
 *   o decremento de exatamente 1 que as suas asserções exigem.
 * · `VERSAO_DO_FORMATO` do motor fica onde está. Guardar catálogo dentro do estado do
 *   motor obrigaria a subir a versão, e subir a versão DESCARTA livro, emblemas, resgates
 *   e guardadas de todo navegador que já abriu o app.
 *
 * O ESTOQUE É DA LOJA, NÃO DA PESSOA. O consumo é gravado aqui, fora do estado por
 * persona: o que uma pessoa resgatou, outra não pode resgatar de novo. É o que qualquer
 * produtor espera de um estoque, e é também o que faz o número sobreviver ao recarregar —
 * antes disto, recarregar repunha a prateleira cheia com os resgates ainda na carteira.
 *
 * SEM RELÓGIO E SEM SORTEIO. Todo carimbo é `dataDeReferencia`, que vem do servidor por
 * prop; todo id é o maior sufixo numérico mais um. Duas sessões chegam ao mesmo id no
 * mesmo passo, e a captura de ontem bate com a de hoje.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const CHAVE_DA_LOJA = "produtor.loja.v1";
const VERSAO = 1;

/** O prefixo dos itens nascidos aqui. É o que os torna auditáveis numa lista só. */
export const PREFIXO_DO_PRODUTOR = "rec-produtor-";

export interface EstadoDaLoja {
  versao: number;
  /** Só os campos mudados de um item semeado. Campo ausente: vale a semente. */
  ajustes: Record<string, Partial<RecompensaDefinida>>;
  /** Itens que o produtor criou, em forma completa. */
  criados: RecompensaDefinida[];
  /** Tirados de cartaz. NUNCA apagados: a carteira depende do histórico. */
  retirados: string[];
  /** Quantos de cada item já saíram. É o que faz o estoque sobreviver ao recarregar. */
  consumo: Record<string, number>;
  atualizadoEm: string;
}

/**
 * A SEMENTE, tirada no carregamento do módulo — antes de qualquer clique, e antes de o
 * motor ter decrementado o que quer que seja. Sem esta cópia, `aplicar()` reconciliaria
 * sobre um array já mexido e o estoque derivaria a cada leitura.
 */
const SEMENTE = new Map(RECOMPENSAS.map((r) => [r.id, { ...r }]));

let estado: EstadoDaLoja | null = null;
let dataDeReferencia = "";
const ouvintes = new Set<() => void>();

function avisar() {
  for (const o of ouvintes) o();
}

function assinar(o: () => void) {
  ouvintes.add(o);
  return () => {
    ouvintes.delete(o);
  };
}

function lerLoja() {
  return estado;
}

/**
 * No servidor não há armazém. Devolver a semente faria o HTML exportado afirmar um
 * estado que o navegador contradiz no primeiro quadro.
 */
function lerNoServidor(): EstadoDaLoja | null {
  return null;
}

function doZero(): EstadoDaLoja {
  return {
    versao: VERSAO,
    ajustes: {},
    criados: [],
    retirados: [],
    consumo: {},
    atualizadoEm: dataDeReferencia,
  };
}

/**
 * RECONCILIA O ARRAY VIVO. Chamada dentro de `hidratar` e de `gravar`, sempre ANTES de
 * `avisar()`: quem assina re-renderiza com o array já certo, e o motor lê o mesmo objeto.
 */
function aplicar(e: EstadoDaLoja) {
  for (const vivo of RECOMPENSAS) {
    const base = SEMENTE.get(vivo.id);
    if (!base) continue;
    Object.assign(vivo, base, e.ajustes[vivo.id] ?? {});
    if (vivo.estoque !== null) {
      vivo.estoque = Math.max(0, vivo.estoque - (e.consumo[vivo.id] ?? 0));
    }
  }

  for (const criado of e.criados) {
    const gasto = e.consumo[criado.id] ?? 0;
    const comEstoque: RecompensaDefinida = {
      ...criado,
      estoque: criado.estoque === null ? null : Math.max(0, criado.estoque - gasto),
    };
    const vivo = RECOMPENSAS.find((r) => r.id === criado.id);
    if (vivo) Object.assign(vivo, comEstoque);
    else RECOMPENSAS.push(comEstoque);
  }

  for (const id of e.retirados) {
    const i = RECOMPENSAS.findIndex((r) => r.id === id);
    if (i >= 0) RECOMPENSAS.splice(i, 1);
  }
}

/** O conteúdo do armazenamento é entrada externa: alguém edita à mão, e a tela não cai. */
function pareceEstado(v: unknown): v is EstadoDaLoja {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Partial<EstadoDaLoja>;
  return (
    e.versao === VERSAO &&
    typeof e.ajustes === "object" &&
    e.ajustes !== null &&
    Array.isArray(e.criados) &&
    Array.isArray(e.retirados) &&
    typeof e.consumo === "object" &&
    e.consumo !== null
  );
}

/** Item criado por versão antiga entra mesclado sobre a forma vazia, nunca cru. */
function normalizarItem(bruto: unknown): RecompensaDefinida | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const b = bruto as Record<string, unknown>;
  if (typeof b.id !== "string" || b.id === "") return null;
  return {
    id: b.id,
    familia: (typeof b.familia === "string"
      ? b.familia
      : "acesso") as RecompensaDefinida["familia"],
    titulo: typeof b.titulo === "string" ? b.titulo : "",
    descricao: typeof b.descricao === "string" ? b.descricao : "",
    custo: typeof b.custo === "number" && Number.isFinite(b.custo) ? b.custo : 0,
    estoque: typeof b.estoque === "number" ? b.estoque : null,
    imagem: typeof b.imagem === "string" ? b.imagem : "",
    imagemAlt: typeof b.imagemAlt === "string" ? b.imagemAlt : "",
    imagemCredito: typeof b.imagemCredito === "string" ? b.imagemCredito : "",
    entrega: (typeof b.entrega === "string"
      ? b.entrega
      : "presencial") as RecompensaDefinida["entrega"],
  };
}

function lerChave(): unknown {
  let cru: string | null = null;
  try {
    cru = window.localStorage.getItem(CHAVE_DA_LOJA);
  } catch {
    return null;
  }
  if (!cru) return null;
  try {
    return JSON.parse(cru);
  } catch {
    return null;
  }
}

function gravar(proximo: EstadoDaLoja) {
  estado = proximo;
  aplicar(proximo);
  try {
    window.localStorage.setItem(CHAVE_DA_LOJA, JSON.stringify(proximo));
  } catch (erro) {
    // Cota estourada custa o «recarregar preserva», e nada mais: a sessão continua.
    console.error("loja-estado: não consegui gravar", erro);
  }
  avisar();
}

function hidratar(hoje: string) {
  dataDeReferencia = hoje;
  if (estado !== null) return;

  const bruto = lerChave();
  if (bruto === null) {
    estado = doZero();
    aplicar(estado);
    avisar();
    return;
  }
  if (!pareceEstado(bruto)) {
    console.warn("loja-estado: forma inesperada no armazém, recomeçando do zero");
    estado = doZero();
    aplicar(estado);
    avisar();
    return;
  }
  estado = {
    ...bruto,
    criados: bruto.criados
      .map(normalizarItem)
      .filter((x): x is RecompensaDefinida => x !== null),
  };
  aplicar(estado);
  avisar();
}

/** Maior sufixo numérico mais um. Determinístico, sem sorteio. */
function proximoId(): string {
  const usados = (estado?.criados ?? [])
    .map((r) => Number(r.id.replace(PREFIXO_DO_PRODUTOR, "")))
    .filter((n) => Number.isFinite(n));
  const maior = usados.length > 0 ? Math.max(...usados) : 0;
  return PREFIXO_DO_PRODUTOR + String(maior + 1).padStart(3, "0");
}

/** Quantos de cada item os resgates desta persona consumiram. */
function contarPorItem(resgates: readonly Resgate[]): Record<string, number> {
  const conta: Record<string, number> = {};
  for (const r of resgates) conta[r.recompensaId] = (conta[r.recompensaId] ?? 0) + 1;
  return conta;
}

// ---------------------------------------------------------------------------
// O que as telas usam
// ---------------------------------------------------------------------------

/**
 * A VITRINE OBEDECE À GESTÃO. Hidrata, assina e persiste o consumo desta persona.
 * O motor já decrementou o array vivo ao resgatar; o que se grava aqui é o número, para
 * o próximo carregamento nascer com a prateleira no ponto certo.
 */
export function useVitrineGerida(
  hoje: string,
  resgates: readonly Resgate[],
  /**
   * O CONTADOR DE VERSÃO DO MOTOR, e não o array de resgates.
   *
   * `s.resgates.unshift(...)` muta a lista NO LUGAR: a referência é a mesma antes e
   * depois de resgatar, e um efeito que dependesse dela nunca voltaria a rodar. O
   * consumo ficava sem gravar, e recarregar repunha a prateleira cheia com o resgate
   * ainda na carteira (medido, 2026-08-28).
   */
  versaoDoMotor: number,
  /**
   * SE O MOTOR JÁ LEU O QUE ESTAVA GRAVADO. Sem esta guarda o efeito rodava no primeiro
   * quadro, quando `resgates` ainda é a lista vazia do servidor, contava zero, e gravava
   * `consumo: {}` por cima do que a sessão anterior tinha deixado. O estoque voltava
   * cheio a cada recarregamento e o resgate continuava na carteira: a loja dava o item
   * de graça, uma vez por visita (medido, 2026-08-28).
   */
  motorHidratado: boolean,
): boolean {
  useEffect(() => {
    hidratar(hoje);
  }, [hoje]);

  const atual = useSyncExternalStore(assinar, lerLoja, lerNoServidor);

  useEffect(() => {
    if (estado === null || !motorHidratado) return;
    const conta = contarPorItem(resgates);
    const mesmo =
      Object.keys(conta).length === Object.keys(estado.consumo).length &&
      Object.entries(conta).every(([id, n]) => estado?.consumo[id] === n);
    if (mesmo) return;
    gravar({ ...estado, consumo: conta, atualizadoEm: hoje });
    // `resgates` fica fora das dependências de propósito: ver a nota do parâmetro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versaoDoMotor, hoje, motorHidratado]);

  return atual !== null;
}

/** O item vigente, ou `null` quando o produtor o tirou de cartaz. */
export function useItemGerido(semente: RecompensaDefinida): RecompensaDefinida | null {
  const atual = useSyncExternalStore(assinar, lerLoja, lerNoServidor);
  if (atual === null) return semente;
  if (atual.retirados.includes(semente.id)) return null;
  return RECOMPENSAS.find((r) => r.id === semente.id) ?? semente;
}

export interface ArmazemDaLoja {
  pronto: boolean;
  itens: RecompensaDefinida[];
  retirados: string[];
  criar: (item: Omit<RecompensaDefinida, "id">) => string;
  alterar: (id: string, mudanca: Partial<RecompensaDefinida>) => void;
  retirar: (id: string) => void;
  devolver: (id: string) => void;
  reporEstoque: (id: string, quantos: number) => void;
  limpar: () => void;
}

export function useLojaGerida(hoje: string): ArmazemDaLoja {
  useEffect(() => {
    hidratar(hoje);
  }, [hoje]);

  const atual = useSyncExternalStore(assinar, lerLoja, lerNoServidor);

  const criar = useCallback((item: Omit<RecompensaDefinida, "id">) => {
    if (estado === null) return "";
    const id = proximoId();
    gravar({
      ...estado,
      criados: [...estado.criados, { ...item, id }],
      atualizadoEm: dataDeReferencia,
    });
    return id;
  }, []);

  /**
   * O ESTOQUE QUE ENTRA É O QUE RESTA; O QUE SE GRAVA É O TOTAL.
   *
   * O armazém guarda quantos existiram e desconta o consumo na hora de desenhar. A folha
   * de edição mostra o que a vitrine mostra, que é o que sobrou -- e é assim que um
   * lojista conta. Se o número digitado fosse gravado cru, o consumo seria descontado
   * DUAS vezes: abrir a folha de um item com um resgate e salvar sem mexer em nada
   * derrubaria o estoque em um, toda vez.
   *
   * Somar o consumo de volta antes de gravar torna a operação idempotente: salvar sem
   * mexer não muda nada, e digitar «12» significa «há doze para vender».
   */
  const alterar = useCallback((id: string, mudanca: Partial<RecompensaDefinida>) => {
    if (estado === null) return;
    const efetiva =
      typeof mudanca.estoque === "number"
        ? { ...mudanca, estoque: mudanca.estoque + (estado.consumo[id] ?? 0) }
        : mudanca;
    const criado = estado.criados.find((r) => r.id === id);
    if (criado) {
      gravar({
        ...estado,
        criados: estado.criados.map((r) => (r.id === id ? { ...r, ...efetiva } : r)),
        atualizadoEm: dataDeReferencia,
      });
      return;
    }
    gravar({
      ...estado,
      ajustes: { ...estado.ajustes, [id]: { ...(estado.ajustes[id] ?? {}), ...efetiva } },
      atualizadoEm: dataDeReferencia,
    });
  }, []);

  const retirar = useCallback((id: string) => {
    if (estado === null || estado.retirados.includes(id)) return;
    gravar({
      ...estado,
      retirados: [...estado.retirados, id],
      atualizadoEm: dataDeReferencia,
    });
  }, []);

  const devolver = useCallback((id: string) => {
    if (estado === null) return;
    gravar({
      ...estado,
      retirados: estado.retirados.filter((x) => x !== id),
      atualizadoEm: dataDeReferencia,
    });
  }, []);

  /**
   * REPOR ZERA O CONSUMO daquele item e grava o novo declarado. Sem zerar, repor 50
   * num item com 8 consumidos entregaria 42 à prateleira, e o produtor teria de fazer
   * a conta de cabeça para saber quanto pôs.
   */
  const reporEstoque = useCallback((id: string, quantos: number) => {
    if (estado === null) return;
    const consumo = { ...estado.consumo };
    delete consumo[id];
    const criado = estado.criados.find((r) => r.id === id);
    if (criado) {
      gravar({
        ...estado,
        criados: estado.criados.map((r) => (r.id === id ? { ...r, estoque: quantos } : r)),
        consumo,
        atualizadoEm: dataDeReferencia,
      });
      return;
    }
    gravar({
      ...estado,
      ajustes: { ...estado.ajustes, [id]: { ...(estado.ajustes[id] ?? {}), estoque: quantos } },
      consumo,
      atualizadoEm: dataDeReferencia,
    });
  }, []);

  const limpar = useCallback(() => {
    gravar({ ...doZero(), atualizadoEm: dataDeReferencia });
  }, []);

  const itens = useMemo(() => (atual === null ? [] : [...RECOMPENSAS]), [atual]);

  return {
    pronto: atual !== null,
    itens,
    retirados: atual?.retirados ?? [],
    criar,
    alterar,
    retirar,
    devolver,
    reporEstoque,
    limpar,
  };
}

// ---------------------------------------------------------------------------
// O painel de resgates
// ---------------------------------------------------------------------------

export interface LinhaDoPainel {
  personaId: string;
  personaNome: string;
  resgate: Resgate;
  /** 1 = o mais recente daquela pessoa. `resgates` guarda o novo em primeiro. */
  ordem: number;
}

/**
 * QUEM RESGATOU É A CHAVE. O resgate não carrega autor porque o estado inteiro pertence
 * a uma persona e mora em `agenda-cultural:pontos:<personaId>`. Acrescentar o id dentro
 * do resgate seria repetir o que o endereço já diz. O painel varre as personas.
 *
 * Só roda no cliente, dentro de efeito: sob `output: "export"` o HTML sai do build, e
 * ler armazenamento no render faria a página hidratada divergir dele.
 */
export function resgatesDeTodasAsPersonas(): LinhaDoPainel[] {
  const linhas: LinhaDoPainel[] = [];
  for (const persona of PERSONAS) {
    let cru: string | null = null;
    try {
      cru = window.localStorage.getItem("agenda-cultural:pontos:" + persona.id);
    } catch {
      continue;
    }
    if (!cru) continue;
    try {
      const guardado = JSON.parse(cru) as { estado?: Partial<EstadoDoMotor> };
      const resgates = guardado.estado?.resgates;
      if (!Array.isArray(resgates)) continue;
      resgates.forEach((resgate, i) =>
        linhas.push({
          personaId: persona.id,
          personaNome: persona.nome,
          resgate: resgate as Resgate,
          ordem: i + 1,
        }),
      );
    } catch {
      // Armazenamento corrompido é o mesmo que nada guardado: nunca tela quebrada.
    }
  }
  return linhas;
}

/** O gancho do painel: varre no efeito, guarda em estado, e diz quando terminou. */
export function usePainelDeResgates(gatilho: unknown): {
  pronto: boolean;
  linhas: LinhaDoPainel[];
} {
  const [linhas, setLinhas] = useState<LinhaDoPainel[] | null>(null);
  useEffect(() => {
    setLinhas(resgatesDeTodasAsPersonas());
  }, [gatilho]);
  return { pronto: linhas !== null, linhas: linhas ?? [] };
}
