/**
 * validacao.ts — a porta única por onde toda prova passa antes de valer ponto.
 *
 * ESTE ARQUIVO É O ÚNICO QUE MUDA quando existir um servidor. A tela chama
 * `validar()`, recebe um `Veredito` e não sabe — nem precisa saber — se do outro
 * lado tem um modelo multimodal ou a tabela determinística que está aqui embaixo.
 * Todo o resto do módulo (esteira, histórico, placar, celebração) foi escrito
 * contra o `Veredito`, não contra a implementação.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE A ANÁLISE É ENCENADA, e não uma chamada de verdade
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * O aplicativo é export estático (D-24, `next.config.ts`): o artefato final é uma
 * pasta de HTML, sem servidor, sem rota de API, sem processo. Uma chamada real a
 * um modelo teria que sair do navegador com a chave dentro do pacote — quer
 * dizer, chave publicada para qualquer visitante. Não é uma limitação de esforço,
 * é o que a arquitetura permite hoje.
 *
 * A TELA DECLARA ISSO, no rodapé da esteira. É a mesma linha que `/entrar` já
 * segue ao dizer «mock explícito: este protótipo não tem autenticação», e a mesma
 * que a moderação segue ao lembrar que «informação inventada sobre alguém não
 * deixa de ser falsa por estar num protótipo». Encenar em silêncio seria a única
 * versão disto que o projeto não aceita.
 *
 * O QUE AQUI É VERDADE, e não encenação:
 *
 *   · a trava de duplicidade. Mesmo hash já enviado é recusa de verdade, decidida
 *     antes de qualquer pontuação, e é a única antifraude que dá para honrar sem
 *     servidor — mas essa honra por inteiro.
 *   · a leitura do arquivo. O que a esteira mostra como «dados extraídos» são
 *     fatos medidos — nome, peso, hash, duplicidade — nunca uma descrição de cena
 *     inventada sobre uma foto que ninguém olhou.
 *
 * O QUE É ENCENADO: o veredito e o número de confiança.
 */

import type { RegrasDeAceite } from "./tipos";

/**
 * O corte do escopo funcional: abaixo disto, a decisão não é da máquina.
 *
 * Ele NÃO mede se a prova está certa — mede o quanto a análise confia na própria
 * conclusão. Por isso uma recusa pode vir com confiança alta (88% de certeza de
 * que não cumpre) e uma aprovação pode não vir com 58% (não sei dizer, decide
 * você). Confundir as duas coisas produz a esteira que aprova o que não entendeu.
 */
export const LIMIAR_DE_CONFIANCA = 80;

/** As cinco etapas que a tela anima enquanto espera. Nome único, aqui. */
export const ETAPAS_DA_ANALISE = [
  "Prova recebida",
  "Leitura do arquivo",
  "Checagem das regras da missão",
  "Antifraude: duplicidade e autenticidade",
  "Decisão com score de confiança",
] as const;

export interface Prova {
  missaoId: string;
  /** Hash do arquivo original — a identidade que a trava de duplicidade usa. */
  hash: string;
  nome: string;
  /** Bytes do arquivo original, para a leitura dizer o peso de verdade. */
  bytes: number;
  regras: RegrasDeAceite;
  /** Hashes já enviados por qualquer pessoa nesta missão. */
  jaEnviados: readonly string[];
}

/**
 * `sim` conclui, `nao` recusa, `indefinida` sempre cai para gente — mesmo com
 * confiança alta, porque «não sei» com certeza continua sendo não sei.
 */
export type Aderencia = "sim" | "nao" | "indefinida";

export interface Veredito {
  fase: "aprovada" | "em-moderacao" | "recusada";
  aderencia: Aderencia;
  /** 0 a 100. */
  confianca: number;
  /** Fatos medidos sobre o arquivo. Nunca descrição de cena. */
  leitura: string;
  /** Preenchido em recusa. Recusar sem dizer por quê é o que gera revolta. */
  motivo?: string;
}

export type Validador = (prova: Prova) => Promise<Veredito>;

/* ── A implementação de hoje ─────────────────────────────────────────────── */

/**
 * FNV-1a de 32 bits. Não é criptografia e não precisa ser: o que se quer aqui é
 * um número estável a partir da mesma entrada, para a mesma demonstração dar o
 * mesmo resultado toda vez que for ensaiada.
 */
function digito(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % 100;
}

function peso(bytes: number): string {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1).replace(".", ",") + " MB";
  return Math.max(1, Math.round(bytes / 1024)) + " kB";
}

export const validadorEncenado: Validador = async (prova) => {
  // A duplicidade decide ANTES de qualquer score. Ela é a única regra desta
  // esteira que é verdade medida, e verdade medida não disputa espaço com
  // encenação: se a mesma imagem já entrou, não há o que analisar.
  if (prova.jaEnviados.includes(prova.hash)) {
    return {
      fase: "recusada",
      aderencia: "nao",
      confianca: 100,
      leitura: `${prova.nome} · ${peso(prova.bytes)} · duplicata de um envio anterior`,
      motivo:
        "Esta mesma imagem já foi enviada nesta missão. Cada comprovação precisa de um registro próprio.",
    };
  }

  const leitura = `${prova.nome} · ${peso(prova.bytes)} · nenhuma duplicata`;
  const h = digito(prova.missaoId + ":" + prova.hash);

  if (h < 12) {
    return {
      fase: "recusada",
      aderencia: "nao",
      confianca: 82 + (h % 14),
      leitura,
      motivo:
        prova.regras.naoVale[0] ??
        "O registro não atende às regras de aceite desta missão.",
    };
  }

  if (h < 34) {
    return {
      fase: "em-moderacao",
      aderencia: "indefinida",
      // Sempre abaixo do limiar: é o que justifica ter ido para a fila humana.
      confianca: 48 + (h % 30),
      leitura,
    };
  }

  return {
    fase: "aprovada",
    aderencia: "sim",
    confianca: LIMIAR_DE_CONFIANCA + (h % 20),
    leitura,
  };
};

/**
 * O validador em uso. Trocar por uma implementação de servidor é reatribuir esta
 * constante — nenhuma tela, nenhum componente e nenhum portão de verificação
 * precisa saber.
 */
export const validar: Validador = validadorEncenado;
