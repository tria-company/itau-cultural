"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  PREFIXO_DA_PUBLICACAO,
  SLUGS_RESERVADOS,
  capaSemeada,
} from "@/dados/comunidade-capas";
import { imagemVazia } from "@/dados/tipos-produtor";
import type { ImagemDeclarada } from "@/dados/tipos-produtor";

/**
 * comunidade-estado.ts — o que o Produtor mudou na comunidade da casa.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ARMAZÉM PRÓPRIO, PELA MESMA RAZÃO DE `perfil-estado.ts`: o sujeito é outro. O
 * `produtor.v1` é sobre os REGISTROS que se publica nas onze pautas; este é sobre a
 * identidade da comunidade e o que se posta nela. Misturar faria o reinício de um apagar
 * o outro sem que ninguém tivesse pedido.
 *
 * SOBREPOSIÇÃO, NUNCA SUBSTITUIÇÃO. Campo vazio quer dizer «vale o que a semente diz».
 * É o que permite trocar só o nome sem herdar a responsabilidade de redigitar a descrição,
 * e é o que faz uma mudança futura na semente ainda chegar a quem não a sobrescreveu.
 *
 * O TEXTO DA PUBLICAÇÃO MORA AQUI, e a publicação em si mora no motor. Parecem duas
 * verdades e não são: o motor guarda o que está no ar, e este armazém guarda o rascunho,
 * que é o que permite reabrir a folha e editar sem reler o estado do motor.
 *
 * SEM RELÓGIO E SEM SORTEIO. O carimbo é `dataDeReferencia`, entregue pelo servidor; o id
 * é o maior sufixo numérico mais um. É o que faz a captura de ontem bater com a de hoje.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const CHAVE_DA_COMUNIDADE = "produtor.comunidade.v1";
const VERSAO = 1;

// O prefixo e o teto vivem em `@/dados/comunidade-capas`, que não é módulo de cliente:
// o `generateStaticParams` da rota precisa deles no servidor. Ver a nota de lá.
export { PREFIXO_DA_PUBLICACAO, SLUGS_RESERVADOS };

export interface PerfilDaComunidade {
  /** Vazio: vale o nome semeado. */
  nome: string;
  descricao: string;
  /** Uma linha sob o nome, na capa. */
  chamada: string;
  capa: ImagemDeclarada | null;
  uf: string;
  quemPublica: "so-a-casa" | "quem-segue";
  comentariosAbertos: boolean;
  atualizadoEm: string;
}

export interface RascunhoDePublicacao {
  id: string;
  comunidadeId: string;
  titulo: string;
  corpo: string;
  etiqueta: string;
  imagem: ImagemDeclarada | null;
  criadaEm: string;
  /** Já emitida no motor, isto é: está no ar. */
  publicada: boolean;
}

export interface EstadoDaComunidade {
  versao: number;
  perfis: Record<string, PerfilDaComunidade>;
  rascunhos: RascunhoDePublicacao[];
  atualizadoEm: string;
}

function perfilVazio(): PerfilDaComunidade {
  return {
    nome: "",
    descricao: "",
    chamada: "",
    capa: null,
    uf: "",
    quemPublica: "so-a-casa",
    comentariosAbertos: true,
    atualizadoEm: "",
  };
}

let estado: EstadoDaComunidade | null = null;
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

/** No servidor não há armazém: devolver semente faria o HTML afirmar o que o cliente nega. */
function lerNoServidor(): EstadoDaComunidade | null {
  return null;
}

function doZero(): EstadoDaComunidade {
  return { versao: VERSAO, perfis: {}, rascunhos: [], atualizadoEm: dataDeReferencia };
}

function pareceEstado(v: unknown): v is EstadoDaComunidade {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Partial<EstadoDaComunidade>;
  return (
    e.versao === VERSAO &&
    typeof e.perfis === "object" &&
    e.perfis !== null &&
    Array.isArray(e.rascunhos)
  );
}

/**
 * NORMALIZAÇÃO POR FORMA, a mesma disciplina de `produtor-estado.ts`: cada campo lido
 * entra só se o tipo bater com o do vazio. Um `capa: "…"` gravado por versão antiga
 * derrubaria a tela no primeiro `capa.credito`, e é exatamente esse defeito que já
 * aconteceu neste projeto uma vez.
 */
function normalizarPerfil(bruto: unknown): PerfilDaComunidade {
  const vazio = perfilVazio();
  if (typeof bruto !== "object" || bruto === null) return vazio;
  const b = bruto as Record<string, unknown>;
  const saida = { ...vazio };
  for (const chave of Object.keys(vazio) as (keyof PerfilDaComunidade)[]) {
    const valor = b[chave];
    if (valor === undefined) continue;
    const padrao = vazio[chave];
    if (padrao === null) {
      if (valor === null || (typeof valor === "object" && !Array.isArray(valor))) {
        (saida[chave] as unknown) = valor;
      }
      continue;
    }
    if (typeof valor === typeof padrao) (saida[chave] as unknown) = valor;
  }
  return saida;
}

function normalizarRascunho(bruto: unknown): RascunhoDePublicacao | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const b = bruto as Record<string, unknown>;
  if (typeof b.id !== "string" || b.id === "") return null;
  const capa = b.imagem;
  return {
    id: b.id,
    comunidadeId: typeof b.comunidadeId === "string" ? b.comunidadeId : "",
    titulo: typeof b.titulo === "string" ? b.titulo : "",
    corpo: typeof b.corpo === "string" ? b.corpo : "",
    etiqueta: typeof b.etiqueta === "string" ? b.etiqueta : "",
    imagem:
      typeof capa === "object" && capa !== null && !Array.isArray(capa)
        ? (capa as ImagemDeclarada)
        : null,
    criadaEm: typeof b.criadaEm === "string" ? b.criadaEm : "",
    publicada: b.publicada === true,
  };
}

function lerChave(): unknown {
  let cru: string | null = null;
  try {
    cru = window.localStorage.getItem(CHAVE_DA_COMUNIDADE);
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

function gravar(proximo: EstadoDaComunidade) {
  estado = proximo;
  try {
    window.localStorage.setItem(CHAVE_DA_COMUNIDADE, JSON.stringify(proximo));
  } catch (erro) {
    // Cota estourada custa o «recarregar preserva», nada além disso.
    console.error("comunidade-estado: não consegui gravar", erro);
  }
  avisar();
}

function hidratar(hoje: string) {
  dataDeReferencia = hoje;
  if (estado !== null) return;

  const bruto = lerChave();
  if (bruto === null || !pareceEstado(bruto)) {
    if (bruto !== null) {
      console.warn("comunidade-estado: forma inesperada no armazém, recomeçando do zero");
    }
    estado = doZero();
    avisar();
    return;
  }
  const perfis: Record<string, PerfilDaComunidade> = {};
  for (const [id, p] of Object.entries(bruto.perfis)) perfis[id] = normalizarPerfil(p);
  estado = {
    versao: VERSAO,
    perfis,
    rascunhos: bruto.rascunhos
      .map(normalizarRascunho)
      .filter((x): x is RascunhoDePublicacao => x !== null),
    atualizadoEm: typeof bruto.atualizadoEm === "string" ? bruto.atualizadoEm : hoje,
  };
  avisar();
}

// ---------------------------------------------------------------------------
// O nome vigente — o único ponto de contato com arquivo portado
// ---------------------------------------------------------------------------

/**
 * O NOME QUE O PRODUTOR DEU, ou `null` quando ele não deu nenhum.
 *
 * Função de módulo, e não gancho: `comunidade.tsx` a chama de dentro de `nomeDe`, que é
 * uma função pura usada em três telas. Antes de hidratar devolve `null`, e quem chama cai
 * no nome semeado — que é o mesmo que o HTML do build traz, então a hidratação não diverge.
 */
export function nomeGerido(comunidadeId: string): string | null {
  const nome = estado?.perfis[comunidadeId]?.nome?.trim();
  return nome ? nome : null;
}

// ---------------------------------------------------------------------------
// O gancho
// ---------------------------------------------------------------------------

/** O perfil vigente: a semente com o que o produtor mudou por cima. */
export interface PerfilVigente {
  nome: string;
  descricao: string;
  chamada: string;
  imagem: string;
  imagemAlt: string;
  imagemCredito: string;
  uf: string;
  quemPublica: PerfilDaComunidade["quemPublica"];
  comentariosAbertos: boolean;
}

export interface SementeDoPerfil {
  nome: string;
  descricao: string;
  chamada: string;
  imagem: string;
  imagemAlt: string;
  imagemCredito: string;
}

export function vigenteDe(
  semente: SementeDoPerfil,
  perfil: PerfilDaComunidade | undefined,
): PerfilVigente {
  const capaPropria =
    perfil?.capa && perfil.capa.caminho.trim() !== "" ? perfil.capa : null;
  return {
    nome: perfil?.nome?.trim() || semente.nome,
    descricao: perfil?.descricao?.trim() || semente.descricao,
    chamada: perfil?.chamada?.trim() || semente.chamada,
    imagem: capaPropria ? capaPropria.caminho : semente.imagem,
    imagemAlt: capaPropria ? capaPropria.alt : semente.imagemAlt,
    imagemCredito: capaPropria ? capaPropria.credito : semente.imagemCredito,
    uf: perfil?.uf ?? "",
    quemPublica: perfil?.quemPublica ?? "so-a-casa",
    comentariosAbertos: perfil?.comentariosAbertos ?? true,
  };
}

export interface ArmazemDaComunidade {
  pronto: boolean;
  perfil: PerfilDaComunidade;
  vigente: PerfilVigente;
  rascunhos: RascunhoDePublicacao[];
  alterarPerfil: (mudanca: Partial<PerfilDaComunidade>) => void;
  criarRascunho: () => string | null;
  alterarRascunho: (id: string, mudanca: Partial<RascunhoDePublicacao>) => void;
  marcarPublicada: (id: string) => void;
  esquecerRascunho: (id: string) => void;
  limpar: () => void;
}

export function useComunidadeGerida(
  comunidadeId: string,
  semente: SementeDoPerfil,
  hoje: string,
): ArmazemDaComunidade {
  useEffect(() => {
    hidratar(hoje);
  }, [hoje]);

  const atual = useSyncExternalStore(assinar, lerLoja, lerNoServidor);

  const alterarPerfil = useCallback(
    (mudanca: Partial<PerfilDaComunidade>) => {
      if (estado === null) return;
      const antes = estado.perfis[comunidadeId] ?? perfilVazio();
      gravar({
        ...estado,
        perfis: {
          ...estado.perfis,
          [comunidadeId]: { ...antes, ...mudanca, atualizadoEm: dataDeReferencia },
        },
        atualizadoEm: dataDeReferencia,
      });
    },
    [comunidadeId],
  );

  /** `null` quando os slugs reservados acabaram: melhor recusar do que gerar um 404. */
  const criarRascunho = useCallback((): string | null => {
    if (estado === null) return null;
    const usados = estado.rascunhos
      .map((r) => Number(r.id.replace(PREFIXO_DA_PUBLICACAO, "")))
      .filter((n) => Number.isFinite(n));
    const proximo = (usados.length > 0 ? Math.max(...usados) : 0) + 1;
    if (proximo > SLUGS_RESERVADOS) return null;
    const id = PREFIXO_DA_PUBLICACAO + String(proximo).padStart(3, "0");
    gravar({
      ...estado,
      rascunhos: [
        ...estado.rascunhos,
        {
          id,
          comunidadeId,
          titulo: "",
          corpo: "",
          etiqueta: "",
          imagem: imagemVazia(),
          criadaEm: dataDeReferencia,
          publicada: false,
        },
      ],
      atualizadoEm: dataDeReferencia,
    });
    return id;
  }, [comunidadeId]);

  const alterarRascunho = useCallback(
    (id: string, mudanca: Partial<RascunhoDePublicacao>) => {
      if (estado === null) return;
      gravar({
        ...estado,
        rascunhos: estado.rascunhos.map((r) => (r.id === id ? { ...r, ...mudanca } : r)),
        atualizadoEm: dataDeReferencia,
      });
    },
    [],
  );

  const marcarPublicada = useCallback((id: string) => {
    if (estado === null) return;
    gravar({
      ...estado,
      rascunhos: estado.rascunhos.map((r) => (r.id === id ? { ...r, publicada: true } : r)),
      atualizadoEm: dataDeReferencia,
    });
  }, []);

  const esquecerRascunho = useCallback((id: string) => {
    if (estado === null) return;
    gravar({
      ...estado,
      rascunhos: estado.rascunhos.filter((r) => r.id !== id),
      atualizadoEm: dataDeReferencia,
    });
  }, []);

  const limpar = useCallback(() => {
    gravar(doZero());
  }, []);

  const perfil = atual?.perfis[comunidadeId] ?? perfilVazio();
  const vigente = useMemo(() => vigenteDe(semente, atual?.perfis[comunidadeId]), [semente, atual, comunidadeId]);

  return {
    pronto: atual !== null,
    perfil,
    vigente,
    rascunhos: atual?.rascunhos ?? [],
    alterarPerfil,
    criarRascunho,
    alterarRascunho,
    marcarPublicada,
    esquecerRascunho,
    limpar,
  };
}

/** A semente de perfil montada a partir do dado do build. Serve às duas telas. */
export function sementeDoPerfil(
  comunidadeId: string,
  nome: string,
  descricao: string,
): SementeDoPerfil {
  const capa = capaSemeada(comunidadeId);
  return {
    nome,
    descricao,
    chamada: capa?.chamada ?? "",
    imagem: capa?.imagem ?? "",
    imagemAlt: capa?.imagemAlt ?? "",
    imagemCredito: capa?.imagemCredito ?? "",
  };
}
