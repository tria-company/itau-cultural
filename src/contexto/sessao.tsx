"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PERSONA_PADRAO, personaIdValido } from "@/dados/personas";
import type { ChaveSemente } from "@/dados/sementes-wire";

/**
 * sessao.tsx — o estado de sessão do protótipo (D-46).
 *
 * Persona ativa, disposições escolhidas e ocorrências salvas. React Context com espelho
 * em `localStorage`, sem biblioteca de estado — o protótipo não justifica uma, e a fase 1
 * já resolveu a visão exatamente assim (`visao.tsx`). Este arquivo segue aquele padrão de
 * propósito, inclusive o sinalizador `hidratado`.
 *
 * D-25 continua valendo: NÃO HÁ AUTENTICAÇÃO. Isto é escolha de persona gravada no
 * navegador, não sessão de usuário. Nenhum dado pessoal entra aqui.
 *
 * DP-F: importa `personas.json` (3,4 KB) por `@/dados/personas`, nunca `@/dados/grafo`.
 * O grafo tem 23 MB e não atravessa a fronteira do cliente. `sementes-wire.ts` entra só
 * como TIPO — ele é o contrato da fronteira e não alcança acervo nenhum.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * AS SEMENTES (S8), E POR QUE `personaId` NÃO FOI TOCADO
 *
 * O onboarding cultural grava SEMENTES — linguagens e entidades que a pessoa escolheu — e
 * é delas que o feed passa a sair. O plano original era `personaId` virar alias de um
 * `perfilId` derivado dessas escolhas. **Isso teria apagado dados de outras telas.**
 *
 * MEDIDO nos consumidores: `contexto/pontos.tsx` usa `personaId` como CHAVE de
 * `localStorage` (`chaveDe(personaId)`), e `componentes/redacao-destaque.tsx` guarda os
 * destaques por `feed.personaId`. Trocar o valor de `personaId` mudaria as duas chaves —
 * e o sintoma seria a carteira de pontos zerada e os destaques sumidos, sem erro nenhum,
 * na primeira vez que alguém terminasse o onboarding.
 *
 * Então `personaId` continua sendo o que sempre foi, com o mesmo valor e a mesma chave, e
 * as sementes entram como estado NOVO ao lado dele. Quem chaveia continua chaveando; quem
 * monta feed passa a ler `sementes`. A troca de persona sai da INTERFACE numa tarefa
 * própria, e nem essa remoção precisa mexer no valor guardado.
 */

const CHAVE_PERSONA = "agenda-cultural:persona";
const CHAVE_DISPOSICOES = "agenda-cultural:disposicoes";
const CHAVE_SALVOS = "agenda-cultural:salvos";
const CHAVE_SEMENTES = "agenda-cultural:sementes";
/** Marca que a pessoa PASSOU pelo onboarding, mesmo tendo pulado sem marcar nada. */
const CHAVE_SEMEADO = "agenda-cultural:semeado";
/** As preferências de cada app, num objeto só: `{ play: ["series"], cast: [...] }`. */
const CHAVE_PREFERENCIAS = "agenda-cultural:preferencias";

interface ContextoSessao {
  personaId: string;
  definirPersona: (id: string) => void;
  /** Ids de disposição escolhidos no onboarding (DESC-01). Seleção múltipla. */
  disposicoes: string[];
  alternarDisposicao: (id: string) => void;
  definirDisposicoes: (ids: string[]) => void;
  /** Ids de ocorrência salvos (D-42). Alimenta Meu Repertório na onda 2. */
  salvos: string[];
  alternarSalvo: (id: string) => void;
  /**
   * As sementes do perfil cultural (S8): `l:<slug>` para linguagem, `e:<id>` para
   * entidade. Lista vazia é estado legítimo — o feed cai no acervo geral e DIZ isso.
   */
  sementes: ChaveSemente[];
  alternarSemente: (chave: ChaveSemente) => void;
  definirSementes: (chaves: ChaveSemente[]) => void;
  /**
   * Se a pessoa já atravessou o onboarding. Separado de `sementes.length > 0` porque
   * pular é uma resposta válida: quem pulou não deve ser mandado de volta para a mesma
   * tela a cada visita.
   */
  semeado: boolean;
  marcarSemeado: () => void;
  /**
   * O recorte que cada app guarda, por chave de app: `play`, `cast`, `cursos`,
   * `noticias`. Um objeto só, e não uma chave de storage por app, porque são quatro
   * listas curtas e quatro chaves separadas quebrariam juntas na primeira renomeação.
   */
  preferencias: Record<string, string[]>;
  alternarPreferencia: (app: string, valor: string) => void;
  /** Falso até o localStorage ter sido lido — evita piscar a persona errada. */
  hidratado: boolean;
}

const Contexto = createContext<ContextoSessao | null>(null);

/** Lista de strings guardada como JSON. Storage corrompido devolve lista vazia. */
function lerLista(chave: string): string[] {
  try {
    const bruto = window.localStorage.getItem(chave);
    if (!bruto) return [];
    const valor: unknown = JSON.parse(bruto);
    return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Mapa de listas guardado como JSON. Storage corrompido devolve mapa vazio — a mesma
 * leitura defensiva de `lerLista`, porque o valor vem de storage que o avaliador pode
 * editar (T-02-02) e uma tela não pode cair por causa disso.
 */
function lerMapa(chave: string): Record<string, string[]> {
  try {
    const bruto = window.localStorage.getItem(chave);
    if (!bruto) return {};
    const valor: unknown = JSON.parse(bruto);
    if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
    const saida: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      if (Array.isArray(v)) saida[k] = v.filter((x): x is string => typeof x === "string");
    }
    return saida;
  } catch {
    return {};
  }
}

function gravar(chave: string, valor: string) {
  try {
    window.localStorage.setItem(chave, valor);
  } catch {
    // Storage bloqueado (modo privado, iframe): persistir é conveniência, não requisito.
  }
}

export function SessaoProvider({ children }: { children: ReactNode }) {
  // O valor inicial é a PRIMEIRA persona, não o que está no storage: sob output: "export"
  // o HTML é gerado no build, e ler localStorage no primeiro render divergiria da
  // hidratação. A leitura mora no efeito abaixo, que só roda no cliente.
  const [personaId, setPersonaId] = useState<string>(PERSONA_PADRAO);
  const [disposicoes, setDisposicoes] = useState<string[]>([]);
  const [salvos, setSalvos] = useState<string[]>([]);
  const [sementes, setSementes] = useState<ChaveSemente[]>([]);
  const [semeado, setSemeado] = useState(false);
  const [preferencias, setPreferencias] = useState<Record<string, string[]>>({});
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    let salvo: string | null = null;
    try {
      salvo = window.localStorage.getItem(CHAVE_PERSONA);
    } catch {
      // idem
    }
    // T-02-02: o valor vem de storage editável pelo avaliador. Persona desconhecida cai
    // na primeira em vez de propagar id inválido para dentro do feed.
    setPersonaId(personaIdValido(salvo));
    setDisposicoes(lerLista(CHAVE_DISPOSICOES));
    setSalvos(lerLista(CHAVE_SALVOS));
    setSementes(lerLista(CHAVE_SEMENTES));
    setPreferencias(lerMapa(CHAVE_PREFERENCIAS));
    try {
      setSemeado(window.localStorage.getItem(CHAVE_SEMEADO) === "1");
    } catch {
      // idem
    }
    setHidratado(true);
  }, []);

  const definirPersona = useCallback((id: string) => {
    const valido = personaIdValido(id);
    setPersonaId(valido);
    gravar(CHAVE_PERSONA, valido);
  }, []);

  const definirDisposicoes = useCallback((ids: string[]) => {
    setDisposicoes(ids);
    gravar(CHAVE_DISPOSICOES, JSON.stringify(ids));
  }, []);

  const alternarDisposicao = useCallback((id: string) => {
    setDisposicoes((atual) => {
      const proxima = atual.includes(id) ? atual.filter((d) => d !== id) : [...atual, id];
      gravar(CHAVE_DISPOSICOES, JSON.stringify(proxima));
      return proxima;
    });
  }, []);

  const definirSementes = useCallback((chaves: ChaveSemente[]) => {
    setSementes(chaves);
    gravar(CHAVE_SEMENTES, JSON.stringify(chaves));
  }, []);

  const alternarSemente = useCallback((chave: ChaveSemente) => {
    setSementes((atual) => {
      const proxima = atual.includes(chave)
        ? atual.filter((c) => c !== chave)
        : [...atual, chave];
      gravar(CHAVE_SEMENTES, JSON.stringify(proxima));
      return proxima;
    });
  }, []);

  const alternarPreferencia = useCallback((app: string, valor: string) => {
    setPreferencias((atual) => {
      const lista = atual[app] ?? [];
      const proximaLista = lista.includes(valor)
        ? lista.filter((v) => v !== valor)
        : [...lista, valor];
      const proxima = { ...atual, [app]: proximaLista };
      gravar(CHAVE_PREFERENCIAS, JSON.stringify(proxima));
      return proxima;
    });
  }, []);

  const marcarSemeado = useCallback(() => {
    setSemeado(true);
    gravar(CHAVE_SEMEADO, "1");
  }, []);

  const alternarSalvo = useCallback((id: string) => {
    setSalvos((atual) => {
      const proxima = atual.includes(id) ? atual.filter((s) => s !== id) : [...atual, id];
      gravar(CHAVE_SALVOS, JSON.stringify(proxima));
      return proxima;
    });
  }, []);

  const valor = useMemo(
    () => ({
      personaId,
      definirPersona,
      disposicoes,
      alternarDisposicao,
      definirDisposicoes,
      salvos,
      alternarSalvo,
      sementes,
      alternarSemente,
      definirSementes,
      semeado,
      marcarSemeado,
      preferencias,
      alternarPreferencia,
      hidratado,
    }),
    [
      personaId,
      definirPersona,
      disposicoes,
      alternarDisposicao,
      definirDisposicoes,
      salvos,
      alternarSalvo,
      sementes,
      alternarSemente,
      definirSementes,
      semeado,
      marcarSemeado,
      preferencias,
      alternarPreferencia,
      hidratado,
    ],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ContextoSessao {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useSessao precisa estar dentro de <SessaoProvider>");
  return ctx;
}
