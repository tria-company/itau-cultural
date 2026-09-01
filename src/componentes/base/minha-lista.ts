"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * minha-lista.ts — a lista que a pessoa monta nas paredes do Play e do Cast.
 *
 * POR QUE ELA NÃO ENTRA EM `sessao.tsx`. O contexto de sessão guarda `salvos`, que é uma
 * lista de IDS DE OCORRÊNCIA — sessões datadas da agenda, que `/salvos` resolve num índice
 * de ocorrências e mostra com horário, lugar e alerta de mudança. Um slug de mídia jogado
 * lá dentro não resolve em nada: sairia da tela em silêncio ou como uma linha quebrada.
 * São duas listas porque são duas coisas: uma é «vou nesse dia», a outra é «quero ver
 * depois».
 *
 * POR QUE UMA CHAVE POR TELA, e não uma só. O Play cataloga mídia de streaming, o Cast
 * cataloga episódio de podcast e Cursos cataloga formação; cada parede lê o próprio
 * catálogo e só sabe resolver os próprios slugs. Uma chave compartilhada faria a
 * fileira do Cast tentar desenhar um vídeo que ela não tem.
 *
 * ONDE ELA APARECE. Numa fileira «Minha lista» no alto da própria parede, e só quando tem
 * item. É a regra de não deixar beco: uma lista em que se pode pôr coisas e que não se
 * pode ver é um botão que finge. Tirar é o mesmo gesto de pôr, no mesmo cartaz.
 *
 * ELA NÃO É UMA PRATELEIRA DO ACERVO. As prateleiras do Play são uma PARTIÇÃO do recorte —
 * cada mídia em exatamente uma fileira, somando o total. Esta é da pessoa, repete itens que
 * já estão em outra fileira de propósito, e por isso não carrega `data-prateleira`.
 */

export const CHAVE_LISTA_PLAY = "agenda-cultural:play-minha-lista";
export const CHAVE_LISTA_CAST = "agenda-cultural:cast-minha-lista";
export const CHAVE_LISTA_CURSOS = "agenda-cultural:cursos-minha-lista";

/**
 * Leitura tolerante, no molde de `lerLista` de `sessao.tsx`: o valor vem de storage
 * EDITÁVEL por quem avalia. Valor que não é lista devolve lista vazia e a tela continua de
 * pé; item que não é string é descartado.
 */
function ler(chave: string): string[] {
  try {
    const bruto = window.localStorage.getItem(chave);
    if (!bruto) return [];
    const valor: unknown = JSON.parse(bruto);
    if (!Array.isArray(valor)) return [];
    return valor.filter((v): v is string => typeof v === "string");
  } catch {
    // Storage bloqueado ou JSON corrompido: os dois casos significam «não há lista
    // guardada», que é a lista vazia.
    return [];
  }
}

/**
 * Devolve `true` quando a lista foi guardada de verdade. Quem chama decide o que fazer com
 * o `false` — aqui a tela segue com a lista em memória, e é a decisão certa: perder a lista
 * ao fechar a aba é pior que não poder montá-la.
 */
function gravar(chave: string, slugs: string[]): boolean {
  try {
    window.localStorage.setItem(chave, JSON.stringify(slugs));
    return true;
  } catch {
    // Modo privado ou iframe: o storage recusa a escrita.
    return false;
  }
}

export interface MinhaLista {
  /** Os slugs, na ordem em que entraram — o mais novo por último. */
  readonly slugs: readonly string[];
  readonly tem: (slug: string) => boolean;
  readonly alternar: (slug: string) => void;
  /** Falso até o storage ter sido lido. A fileira não pinta antes disso. */
  readonly hidratado: boolean;
  /**
   * Falso quando o storage recusou a última escrita — a lista vale só para esta aba. A
   * parede diz isso em uma linha em vez de deixar a pessoa descobrir ao voltar.
   */
  readonly persistida: boolean;
}

export function useMinhaLista(chave: string): MinhaLista {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [hidratado, setHidratado] = useState(false);
  const [persistida, setPersistida] = useState(true);

  // A leitura mora no efeito, nunca no primeiro render: sob `output: "export"` o HTML é
  // gerado no build e ler `localStorage` no render divergiria da hidratação.
  useEffect(() => {
    setSlugs(ler(chave));
    setHidratado(true);
  }, [chave]);

  const alternar = useCallback(
    (slug: string) => {
      setSlugs((atual) => {
        const proxima = atual.includes(slug) ? atual.filter((s) => s !== slug) : [...atual, slug];
        setPersistida(gravar(chave, proxima));
        return proxima;
      });
    },
    [chave],
  );

  const tem = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  return { slugs, tem, alternar, hidratado, persistida };
}

// ---------------------------------------------------------------------------
// Continuar assistindo — o que a pessoa abriu, na ordem em que abriu
// ---------------------------------------------------------------------------

/**
 * A chave do histórico do Play.
 *
 * NÃO É POSIÇÃO DE REPRODUÇÃO, e a diferença importa. A funcionalidade 26 — «player com
 * retomada» — está marcada `não sustentada` porque o acervo não guarda em que segundo
 * alguém parou, e inventar esse número seria fabricar dado. O que esta lista guarda é
 * outra coisa, e é real: QUAIS itens a pessoa abriu, e em que ordem. É o suficiente para
 * a fileira existir sem prometer o que não há.
 */
export const CHAVE_VISTOS_PLAY = "agenda-cultural:play-vistos";

/** Quantos itens a fileira guarda. Além disso deixa de ser «continuar» e vira arquivo. */
export const TETO_DE_VISTOS = 12;

export interface Vistos {
  /** Os slugs, do mais recente para o mais antigo. */
  readonly slugs: readonly string[];
  /** Põe o slug no topo. Reabrir algo o traz de volta para a frente. */
  readonly registrar: (slug: string) => void;
  readonly hidratado: boolean;
}

export function useVistos(chave: string): Vistos {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    setSlugs(ler(chave));
    setHidratado(true);
  }, [chave]);

  const registrar = useCallback(
    (slug: string) => {
      setSlugs((atual) => {
        const proxima = [slug, ...atual.filter((s) => s !== slug)].slice(0, TETO_DE_VISTOS);
        gravar(chave, proxima);
        return proxima;
      });
    },
    [chave],
  );

  return { slugs, registrar, hidratado };
}
