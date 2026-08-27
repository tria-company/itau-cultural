"use client";

/**
 * perfil-estado.ts, os dados pessoais do produtor, no navegador.
 *
 * ARMAZÉM PRÓPRIO, SEPARADO DE `produtor.v1`. O perfil é sobre a PESSOA (nome, contato,
 * foto) e o outro é sobre os REGISTROS que ela publica. Misturar os dois faria o botão de
 * reiniciar a demonstração apagar também o nome que a pessoa acabou de escrever, e o
 * reinício é sobre o conteúdo, nunca sobre quem está na cadeira.
 *
 * MESMA DISCIPLINA DO RESTO: `localStorage` só depois de montar, validação na leitura,
 * loja de módulo com `useSyncExternalStore` para todas as telas lerem a mesma cópia.
 * Sem relógio, sem sorteio, sem requisição.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";

export interface PerfilDoProdutor {
  nome: string;
  funcao: string;
  email: string;
  telefone: string;
  bio: string;
  /** Caminho de uma imagem do acervo, escolhida como foto. `null` mostra as iniciais. */
  foto: string | null;
  /** O crédito da foto escolhida. Imagem do acervo leva o nome de quem a fez. */
  fotoCredito: string | null;
}

export const CHAVE_DO_PERFIL = "produtor.perfil.v1";

const VAZIO: PerfilDoProdutor = {
  nome: "",
  funcao: "",
  email: "",
  telefone: "",
  bio: "",
  foto: null,
  fotoCredito: null,
};

let estado: PerfilDoProdutor | null = null;
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

function lerLoja(): PerfilDoProdutor | null {
  return estado;
}

/** O servidor não tem armazenamento: devolve `null` e a tela espera a hidratação. */
function lerNoServidor(): PerfilDoProdutor | null {
  return null;
}

/** O que veio do armazenamento é entrada externa: forma errada cai no vazio, sem propagar. */
function parecePerfil(v: unknown): v is PerfilDoProdutor {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.nome === "string" &&
    typeof o.funcao === "string" &&
    typeof o.email === "string" &&
    typeof o.telefone === "string" &&
    typeof o.bio === "string" &&
    (o.foto === null || typeof o.foto === "string") &&
    (o.fotoCredito === null || typeof o.fotoCredito === "string")
  );
}

function gravar(proximo: PerfilDoProdutor) {
  estado = proximo;
  try {
    window.localStorage.setItem(CHAVE_DO_PERFIL, JSON.stringify(proximo));
  } catch (erro) {
    console.error("Perfil: não foi possível gravar.", erro);
  }
  avisar();
}

function hidratar() {
  if (estado !== null) return;
  let cru: string | null = null;
  try {
    cru = window.localStorage.getItem(CHAVE_DO_PERFIL);
  } catch {
    // Armazenamento bloqueado: o perfil vazio serve, e nada trava.
  }
  if (cru === null) {
    estado = { ...VAZIO };
    avisar();
    return;
  }
  let lido: unknown = null;
  try {
    lido = JSON.parse(cru);
  } catch {
    // Conteúdo ilegível: recomeça do vazio, sem derrubar a tela.
  }
  estado = parecePerfil(lido) ? lido : { ...VAZIO };
  avisar();
}

export interface ArmazemDoPerfil {
  /** `false` até o armazenamento ter sido lido. */
  pronto: boolean;
  perfil: PerfilDoProdutor;
  alterar: (mudanca: Partial<PerfilDoProdutor>) => void;
  /** Volta ao vazio. Só o perfil: os registros não são tocados. */
  limpar: () => void;
}

export function usePerfil(): ArmazemDoPerfil {
  useEffect(() => {
    hidratar();
  }, []);

  const atual = useSyncExternalStore(assinar, lerLoja, lerNoServidor);

  const alterar = useCallback((mudanca: Partial<PerfilDoProdutor>) => {
    gravar({ ...(estado ?? VAZIO), ...mudanca });
  }, []);

  const limpar = useCallback(() => {
    try {
      window.localStorage.removeItem(CHAVE_DO_PERFIL);
    } catch (erro) {
      console.error("Perfil: não foi possível limpar.", erro);
    }
    gravar({ ...VAZIO });
  }, []);

  return {
    pronto: atual !== null,
    perfil: atual ?? VAZIO,
    alterar,
    limpar,
  };
}

/**
 * As iniciais para o avatar sem foto: as duas primeiras palavras do nome, ou da
 * organização quando o nome ainda não foi escrito.
 */
export function iniciaisDe(nome: string, alternativa: string): string {
  const base = (nome.trim() || alternativa).split(/\s+/).filter((p) => p.length > 0);
  const primeira = base[0]?.[0] ?? "";
  const segunda = base[1]?.[0] ?? "";
  return (primeira + segunda).toUpperCase() || "?";
}
