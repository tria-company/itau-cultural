"use client";

/**
 * pontos-estado.ts, o que já foi resgatado na loja de pontos.
 *
 * ARMAZÉM PRÓPRIO, como o do perfil, e pelo mesmo motivo: reiniciar a demonstração devolve
 * os REGISTROS à semente, e apagar junto o que a pessoa resgatou faria o reinício punir
 * quem estava demonstrando. Os pontos GANHOS não moram aqui: eles são calculados do estado
 * dos registros a cada render, e guardar um saldo seria criar uma segunda verdade que
 * diverge da primeira no primeiro registro editado.
 *
 * Mesma disciplina do resto: `localStorage` só depois de montar, validação na leitura,
 * loja de módulo com `useSyncExternalStore`. Sem relógio, sem sorteio, sem requisição.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";

export const CHAVE_DOS_PONTOS = "produtor.pontos.v1";

let estado: string[] | null = null;
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

function lerLoja(): string[] | null {
  return estado;
}

/** O servidor não tem armazenamento: devolve `null` e a tela espera a hidratação. */
function lerNoServidor(): string[] | null {
  return null;
}

function ehListaDeTexto(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((i) => typeof i === "string");
}

function gravar(proximo: string[]) {
  estado = proximo;
  try {
    window.localStorage.setItem(CHAVE_DOS_PONTOS, JSON.stringify(proximo));
  } catch (erro) {
    console.error("Pontos: não foi possível gravar.", erro);
  }
  avisar();
}

function hidratar() {
  if (estado !== null) return;
  let cru: string | null = null;
  try {
    cru = window.localStorage.getItem(CHAVE_DOS_PONTOS);
  } catch {
    // Armazenamento bloqueado: a lista vazia serve, e nada trava.
  }
  let lido: unknown = null;
  if (cru !== null) {
    try {
      lido = JSON.parse(cru);
    } catch {
      // Conteúdo ilegível: recomeça do vazio, sem derrubar a tela.
    }
  }
  estado = ehListaDeTexto(lido) ? lido : [];
  avisar();
}

export interface ArmazemDosPontos {
  /** `false` até o armazenamento ter sido lido. */
  pronto: boolean;
  /** Os ids das recompensas já resgatadas. */
  resgatados: string[];
  /**
   * Resgata, se o saldo cobrir. A CONFERÊNCIA É AQUI TAMBÉM, e não só no `disabled` do
   * botão: é a mesma trava dupla de `publicar()`, e existe pela mesma razão. Um botão
   * desabilitado é uma barreira de tela; o armazém que aceita qualquer coisa é um
   * defeito esperando a primeira chamada que não venha da tela.
   */
  resgatar: (id: string, custo: number, saldo: number) => void;
  devolver: (id: string) => void;
}

export function usePontos(): ArmazemDosPontos {
  useEffect(() => {
    hidratar();
  }, []);

  const atual = useSyncExternalStore(assinar, lerLoja, lerNoServidor);

  const resgatar = useCallback((id: string, custo: number, saldo: number) => {
    const lista = estado ?? [];
    if (lista.includes(id)) return;
    if (saldo < custo) {
      console.warn(
        `Pontos: resgate de ${id} recusado, custo ${custo} acima do saldo ${saldo}.`,
      );
      return;
    }
    gravar([...lista, id]);
  }, []);

  const devolver = useCallback((id: string) => {
    gravar((estado ?? []).filter((i) => i !== id));
  }, []);

  return { pronto: atual !== null, resgatados: atual ?? [], resgatar, devolver };
}
