"use client";

import { useCallback, useSyncExternalStore } from "react";
import { usePapel } from "@/contexto/papel";
import {
  ADMIN_AUTORADO,
  CHAVE_DO_ADMIN,
  acoesValidas,
  type Acao,
  type AcaoDoAdmin,
  type TipoDeAlvo,
} from "@/dados/admin-acoes";

/**
 * admin-estado.ts, o que o administrador mudou neste navegador.
 *
 * SOBREPOSIÇÃO, NUNCA CÓPIA. O armazém guarda só o que divergiu: os ids suspensos, os
 * apagados, os textos trocados e os movidos. O acervo continua sendo o acervo, e nenhuma
 * tela precisa saber que existe um administrador para continuar funcionando. É o mesmo
 * arranjo de `loja-estado.ts`, e pela mesma razão.
 *
 * O REGISTRO É APPEND-ONLY. Toda ação entra na lista com autor e carimbo, e nada a remove.
 * Reiniciar apaga a lista inteira, que é diferente de apagar uma linha dela.
 */

interface Estado {
  suspensos: string[];
  apagados: string[];
  /** id do alvo, texto novo. */
  edicoes: Record<string, string>;
  /** id do alvo, id do destino. */
  movidos: Record<string, string>;
  registro: AcaoDoAdmin[];
}

const VAZIO: Estado = { suspensos: [], apagados: [], edicoes: {}, movidos: {}, registro: [] };

let estado: Estado = VAZIO;
let hidratou = false;
const ouvintes = new Set<() => void>();

function avisar() {
  for (const o of ouvintes) o();
}

function ler(): Estado {
  try {
    const bruto = window.localStorage.getItem(CHAVE_DO_ADMIN);
    if (bruto === null) return VAZIO;
    const j = JSON.parse(bruto) as Partial<Estado>;
    return {
      suspensos: Array.isArray(j.suspensos) ? j.suspensos.filter((x) => typeof x === "string") : [],
      apagados: Array.isArray(j.apagados) ? j.apagados.filter((x) => typeof x === "string") : [],
      edicoes: j.edicoes && typeof j.edicoes === "object" ? j.edicoes : {},
      movidos: j.movidos && typeof j.movidos === "object" ? j.movidos : {},
      registro: acoesValidas(j.registro),
    };
  } catch {
    return VAZIO;
  }
}

function gravar(proximo: Estado) {
  estado = proximo;
  try {
    window.localStorage.setItem(CHAVE_DO_ADMIN, JSON.stringify(proximo));
  } catch {
    // Modo privado ou armazenamento cheio. A mudança vale nesta sessão e some ao recarregar,
    // e a tira de controles diz isso.
  }
  avisar();
}

function assinar(ouvinte: () => void) {
  // A leitura mora aqui, e não no render: sob export estático o HTML vem do build, e ler o
  // armazenamento durante o render faria a página hidratada divergir do artefato.
  if (!hidratou) {
    hidratou = true;
    estado = ler();
  }
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

const noServidor = () => VAZIO;

export interface Alvo {
  tipo: TipoDeAlvo;
  id: string;
  titulo: string;
}

export interface PoderDeAdmin {
  /** `true` quando o perfil escolhido é o de administração. */
  ehAdmin: boolean;
  /** Falso até o papel ter sido lido do navegador. */
  pronto: boolean;
  suspenso: (id: string) => boolean;
  apagado: (id: string) => boolean;
  /** O texto que o administrador pôs no lugar, ou `null`. */
  edicao: (id: string) => string | null;
  /** Para onde ele moveu, ou `null`. */
  destino: (id: string) => string | null;
  registro: readonly AcaoDoAdmin[];
  aplicar: (acao: Acao, alvo: Alvo, motivo: string, destino: string) => void;
  reiniciar: () => void;
}

export function usePoderDeAdmin(carimbo: string): PoderDeAdmin {
  const { papel, hidratado } = usePapel();
  const atual = useSyncExternalStore(assinar, () => estado, noServidor);

  const aplicar = useCallback(
    (acao: Acao, alvo: Alvo, motivo: string, destino: string) => {
      const linha: AcaoDoAdmin = {
        acao,
        tipo: alvo.tipo,
        alvo: alvo.id,
        titulo: alvo.titulo,
        destino,
        motivo,
        autor: ADMIN_AUTORADO,
        carimbo,
      };
      const p: Estado = { ...atual, registro: [linha, ...atual.registro] };

      if (acao === "suspender") p.suspensos = [...new Set([...p.suspensos, alvo.id])];
      if (acao === "reativar") p.suspensos = p.suspensos.filter((x) => x !== alvo.id);
      if (acao === "apagar") p.apagados = [...new Set([...p.apagados, alvo.id])];
      if (acao === "editar") p.edicoes = { ...p.edicoes, [alvo.id]: destino };
      if (acao === "mover") p.movidos = { ...p.movidos, [alvo.id]: destino };

      gravar(p);
    },
    [atual, carimbo],
  );

  const reiniciar = useCallback(() => {
    try {
      window.localStorage.removeItem(CHAVE_DO_ADMIN);
    } catch {
      // idem
    }
    gravar(VAZIO);
  }, []);

  return {
    ehAdmin: hidratado && papel === "admin",
    pronto: hidratado,
    suspenso: (id) => atual.suspensos.includes(id),
    apagado: (id) => atual.apagados.includes(id),
    edicao: (id) => atual.edicoes[id] ?? null,
    destino: (id) => atual.movidos[id] ?? null,
    registro: atual.registro,
    aplicar,
    reiniciar,
  };
}
