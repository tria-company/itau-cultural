/**
 * admin-acoes.ts, o vocabulário do que o administrador faz.
 *
 * CLIENTE-SEGURO: nenhum import. O administrador age dentro do aplicativo, em telas que já
 * são de cliente, e um import de módulo de dado aqui arrastaria o acervo para o pacote.
 *
 * NADA SE ESCREVE SEM AUTOR E CARIMBO. É a regra da plataforma, e vale para ele também.
 */

export const ACOES = ["editar", "mover", "suspender", "reativar", "apagar"] as const;
export type Acao = (typeof ACOES)[number];

export const ROTULO_DA_ACAO: Record<Acao, string> = {
  editar: "Editar",
  mover: "Mover",
  suspender: "Suspender",
  reativar: "Reativar",
  apagar: "Apagar",
};

/** O que o administrador alcança. O tipo dita que controles a tira oferece. */
export const ALVOS = [
  "publicacao",
  "comentario",
  "comunidade",
  "evento",
  "pessoa",
  /**
   * O ITEM GENÉRICO: mídia do Play, episódio do Cast, objeto do Museu, matéria, obra.
   *
   * Cinco telas com a mesma necessidade não pedem cinco tipos. O que o tipo decide é o
   * conjunto de verbos e o rótulo da frase; para todas elas os dois são iguais.
   */
  "item",
] as const;
export type TipoDeAlvo = (typeof ALVOS)[number];

export const ROTULO_DO_ALVO: Record<TipoDeAlvo, string> = {
  item: "item",
  publicacao: "publicação",
  comentario: "comentário",
  comunidade: "comunidade",
  evento: "evento",
  pessoa: "pessoa",
};

export interface AcaoDoAdmin {
  acao: Acao;
  tipo: TipoDeAlvo;
  /** O id do que foi tocado. */
  alvo: string;
  /** O título como estava na hora, para o registro não depender do dado seguir existindo. */
  titulo: string;
  /** Para `mover`: para onde. Para `editar`: o campo mudado. Vazio nas outras. */
  destino: string;
  motivo: string;
  autor: string;
  carimbo: string;
}

/**
 * SUSPENDER E APAGAR PEDEM MOTIVO; as outras não.
 *
 * As duas tiram algo do ar sem devolver a palavra a quem publicou. Editar e mover deixam o
 * conteúdo vivo e visível, e exigir justificativa neles só ensinaria a escrever "ajuste".
 */
export function motivoObrigatorio(acao: Acao): boolean {
  return acao === "suspender" || acao === "apagar";
}

export const MINIMO_DO_MOTIVO = 8;

/** O que falta para a ação poder ser registrada, em português, para a tela dizer. */
export function oQueFalta(acao: Acao, motivo: string, destino: string): string[] {
  const falta: string[] = [];
  if (motivoObrigatorio(acao) && motivo.trim().length < MINIMO_DO_MOTIVO) {
    falta.push(`um motivo com pelo menos ${MINIMO_DO_MOTIVO} caracteres`);
  }
  if (acao === "mover" && destino.trim() === "") falta.push("para onde mover");
  if (acao === "editar" && destino.trim() === "") falta.push("o texto novo");
  return falta;
}

/** Só o que veio do nosso formato volta. O armazenamento é editável por quem avalia. */
export function acoesValidas(bruto: unknown): AcaoDoAdmin[] {
  if (!Array.isArray(bruto)) return [];
  return bruto.filter((r): r is AcaoDoAdmin => {
    if (!r || typeof r !== "object") return false;
    const m = r as Record<string, unknown>;
    return (
      typeof m.acao === "string" &&
      (ACOES as readonly string[]).includes(m.acao) &&
      typeof m.tipo === "string" &&
      (ALVOS as readonly string[]).includes(m.tipo) &&
      typeof m.alvo === "string" &&
      typeof m.titulo === "string" &&
      typeof m.destino === "string" &&
      typeof m.motivo === "string" &&
      typeof m.autor === "string" &&
      typeof m.carimbo === "string"
    );
  });
}

/** Quem administra. Autorado: não há autenticação, e a tela diz isso. */
export const ADMIN_AUTORADO = "Administração";

export const CHAVE_DO_ADMIN = "admin.acoes.v1";
