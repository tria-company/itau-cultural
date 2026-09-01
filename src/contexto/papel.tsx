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

/**
 * papel.tsx, qual perfil está usando o protótipo.
 *
 * ISTO NÃO É AUTENTICAÇÃO, E A TELA DIZ ISSO COM TODAS AS LETRAS. D-25 continua de pé: não
 * há cadastro, senha, sessão nem verificação de nada. O papel é uma preferência gravada no
 * navegador, e serve a UMA coisa, decidir o que a navegação oferece. Num artefato estático
 * exportado, toda rota que existe responde a quem digita a URL, e não há como não responder:
 * o HTML já está no disco. Chamar isto de controle de acesso seria a mentira mais cara que
 * este produto poderia contar sobre si mesmo.
 *
 * NO MOLDE DE `visao.tsx`, DE PROPÓSITO. Mesma forma de provider, mesma chave prefixada,
 * mesma leitura só em `useEffect`, mesmo sinalizador `hidratado`. Duas formas diferentes
 * para o mesmo problema fariam a segunda repetir os erros que a primeira já corrigiu, e o
 * erro que ela corrigiu é exatamente o que este arquivo precisa não cometer: ler
 * `localStorage` durante o render faz o HTML exportado divergir da página hidratada.
 */

export const PAPEIS = ["publico", "produtor", "moderacao", "observatorio", "admin"] as const;
export type Papel = (typeof PAPEIS)[number];

export interface DescricaoDoPapel {
  papel: Papel;
  rotulo: string;
  /** Uma frase do que este perfil faz. É o que a tela de entrada mostra. */
  resumo: string;
  /** Para onde ele vai ao entrar. Com barra final: o export estático serve diretório. */
  chegada: string;
  /** Os prefixos de rota que a navegação oferece a ele. */
  superficies: readonly string[];
  /**
   * `true` quando a chegada dele é superfície de desktop (D-67).
   *
   * QUEM ESCOLHE PRECISA SABER ANTES. Trocar para Moderação no telefone leva a uma tela
   * que diz «isto é superfície de desktop», e descobrir isso DEPOIS do toque é a pessoa
   * perder o lugar para aprender uma regra que a lista podia ter dito. O Studio é a
   * exceção declarada: ele foi desenhado para o telefone.
   */
  soWeb: boolean;
}

/**
 * Os cinco perfis da demonstração.
 *
 * O PRODUTOR RECEBE O STUDIO INTEIRO. Ele alimenta as onze pautas do produto, agenda,
 * play, cast, museu, cursos, editorial, curadoria, programa, editais, espaços e mídia. O
 * que ele não faz é reescrever verbete de artista real: ali ele referencia, vincula com
 * papel e propõe, e a decisão fica com a Moderação.
 *
 * A ORGANIZAÇÃO NÃO ESTÁ AQUI, e a ausência é decisão e não esquecimento. As dez telas que
 * ela tinha dentro de `/studio/` descreviam ações que ela não fará: espaço, mídia, programa,
 * formação, editais, lote e alcance passaram ao Produtor. O que sobra dela, ficha da
 * instituição, verificação, equipe, alçadas e sucessão, ganha forma própria depois, e um
 * perfil vazio na tela de entrada prometeria uma superfície que ainda não existe.
 */
export const DESCRICAO_DO_PAPEL: Record<Papel, DescricaoDoPapel> = {
  publico: {
    papel: "publico",
    rotulo: "Público",
    resumo: "Quem descobre, salva e vai. É o produto inteiro, sem bastidor nenhum.",
    chegada: "/descobrir/",
    superficies: [],
    soWeb: false,
  },
  produtor: {
    papel: "produtor",
    rotulo: "Produtor",
    resumo:
      "Quem alimenta o produto: agenda, play, cast, museu, cursos, editorial, curadoria, " +
      "programa, editais, espaços e mídia. Publica direto ao ar.",
    chegada: "/studio/",
    superficies: ["/studio"],
    soWeb: false,
  },
  moderacao: {
    papel: "moderacao",
    rotulo: "Moderação",
    resumo:
      "Fiscalização posterior: amostra o que foi publicado, resolve duplicata e decide " +
      "sobre denúncia. Suspende, veta e devolve, sempre com motivo escrito.",
    chegada: "/moderacao/fila/",
    superficies: ["/moderacao"],
    soWeb: true,
  },
  observatorio: {
    papel: "observatorio",
    rotulo: "Observatório",
    resumo: "Quem mede: procedência, território, ausência e impacto, sem escrever no acervo.",
    chegada: "/observatorio/",
    superficies: ["/observatorio"],
    soWeb: true,
  },
  /**
   * O ADMINISTRADOR USA O MESMO APLICATIVO, e é isso que o define.
   *
   * Ele não tem console próprio. Abre `/descobrir` como qualquer pessoa, navega pelas mesmas
   * telas, e em cima de cada item ganha o que pode fazer com ele: editar, mover, suspender e
   * apagar. Quem não é administrador não vê nada disso, e o aplicativo é idêntico.
   *
   * `soWeb` É FALSO, e a mudança tem consequência. Enquanto ele era console de governança,
   * era mesa de trabalho. Agora é o produto, e o produto abre no telefone: o administrador
   * precisa poder agir onde as pessoas estão.
   */
  admin: {
    papel: "admin",
    rotulo: "Administração",
    resumo:
      "O mesmo aplicativo, com poder de editar, mover, suspender e apagar qualquer coisa " +
      "que esteja nele.",
    chegada: "/descobrir/",
    superficies: ["/admin", "/moderacao", "/observatorio", "/studio", "/redacao", "/roteiro"],
    soWeb: false,
  },
};

export const PAPEL_NAO_E_SEGURANCA =
  "Isto NÃO é autenticação. Não há cadastro, senha nem sessão: escolher um perfil grava " +
  "uma preferência no seu navegador e muda o que a navegação oferece. Toda rota continua " +
  "abrindo por URL, num artefato estático exportado o HTML já está no disco, e não há " +
  "como não abrir.";

const CHAVE_ARMAZENAMENTO = "agenda-cultural:papel";
const PAPEL_INICIAL: Papel = "publico";

interface ContextoPapel {
  papel: Papel;
  definirPapel: (papel: Papel) => void;
  /** Falso até o `localStorage` ter sido lido, evita piscar o papel errado. */
  hidratado: boolean;
  /** `true` quando a navegação deve oferecer esta superfície a este papel. */
  alcanca: (rota: string) => boolean;
}

const Contexto = createContext<ContextoPapel | null>(null);

function ehPapel(valor: unknown): valor is Papel {
  return typeof valor === "string" && (PAPEIS as readonly string[]).includes(valor);
}

export function PapelProvider({ children }: { children: ReactNode }) {
  const [papel, setPapel] = useState<Papel>(PAPEL_INICIAL);
  const [hidratado, setHidratado] = useState(false);

  // Sob `output: "export"` o HTML é gerado no build. Ler `localStorage` na primeira
  // renderização produziria divergência de hidratação, por isso a leitura mora aqui.
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE_ARMAZENAMENTO);
      // VALOR DESCONHECIDO CAI EM `publico`, E NUNCA PROPAGA. É a lição de T-02-02, quando
      // uma persona gravada com id que deixara de existir atravessou três telas antes de
      // virar `undefined.nome`. O que vem do armazenamento é entrada externa.
      if (ehPapel(salvo)) setPapel(salvo);
      else if (salvo !== null) setPapel(PAPEL_INICIAL);
    } catch {
      // localStorage bloqueado (modo privado, iframe): o papel inicial serve.
    }
    setHidratado(true);
  }, []);

  const definirPapel = useCallback((proximo: Papel) => {
    // A guarda vale também aqui: um valor vindo de código chamador errado não pode entrar
    // na loja só porque não passou pelo armazenamento.
    const seguro: Papel = ehPapel(proximo) ? proximo : PAPEL_INICIAL;
    setPapel(seguro);
    try {
      window.localStorage.setItem(CHAVE_ARMAZENAMENTO, seguro);
    } catch {
      // Persistir é conveniência; não travar a troca se o storage recusar.
    }
  }, []);

  const alcanca = useCallback(
    (rota: string) => DESCRICAO_DO_PAPEL[papel].superficies.some((p) => rota.startsWith(p)),
    [papel],
  );

  const valor = useMemo(
    () => ({ papel, definirPapel, hidratado, alcanca }),
    [papel, definirPapel, hidratado, alcanca],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePapel(): ContextoPapel {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("usePapel precisa estar dentro de <PapelProvider>");
  return ctx;
}

/** A rota de chegada de um papel. Fora do provider porque a tela de entrada a usa para
 *  navegar no mesmo gesto em que grava, sem esperar um render. */
export function chegadaDe(papel: Papel): string {
  return DESCRICAO_DO_PAPEL[papel].chegada;
}
