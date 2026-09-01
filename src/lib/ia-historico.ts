/**
 * ia-historico.ts — as conversas anteriores com a estrelinha, guardadas no navegador.
 *
 * ATÉ AQUI ELAS NÃO EXISTIAM. «Nova conversa» limpava o estado e a conversa anterior
 * sumia sem deixar rastro — não havia onde procurá-la, porque não havia o que procurar.
 * Só os ROTEIROS salvos eram persistidos, e roteiro é o resultado, não o caminho até ele.
 *
 * D-25 continua valendo: `localStorage`, sem conta e sem servidor. O que é guardado é o
 * que a própria pessoa escreveu e o que a tela respondeu — nada sai do aparelho.
 *
 * O TETO EXISTE E É DECLARADO. Sem ele, o histórico cresce até a primeira tela demorar a
 * abrir num aparelho antigo, e o sintoma não seria «meu histórico está grande», seria «o
 * app ficou lento». Vinte conversas é o que cabe numa folha rolável sem paginação — e a
 * tela DIZ quando cortou, em vez de deixar a mais antiga sumir em silêncio.
 */

const CHAVE = "agenda-cultural:ia-conversas";

/** Quantas conversas ficam guardadas. A mais antiga sai quando entra a vigésima primeira. */
export const TETO_DE_CONVERSAS = 20;

export interface ConversaGuardada<M = unknown, P = unknown> {
  id: string;
  /**
   * Conversa de DEMONSTRAÇÃO, semeada quando o histórico está vazio.
   *
   * O campo existe para a tela poder dizer que ela é exemplo. Um histórico que chega
   * cheio sem a pessoa ter conversado nada é plausível e falso — e a regra do produto é
   * que o que é nosso se declara. Some na primeira conversa de verdade.
   */
  exemplo?: boolean;
  /** Milissegundos. Ordena a lista e alimenta a data mostrada. */
  quando: number;
  /** A primeira coisa que a pessoa escreveu — é como ela reconhece a conversa depois. */
  titulo: string;
  mensagens: M[];
  pedido: P;
}

/**
 * O que fazer quando o storage recusa.
 *
 * Modo privado, cota estourada e iframe bloqueado são os três casos reais, e nenhum é
 * culpa de quem está usando: o histórico é conveniência e a conversa na tela continua
 * inteira. Mas engolir o erro em silêncio é o que faz alguém passar uma tarde procurando
 * por que o histórico «às vezes não salva» — então em desenvolvimento ele aparece.
 */
function storageRecusou(operacao: string, erro: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`ia-historico: ${operacao} não persistiu`, erro);
  }
}

/**
 * Leitura defensiva, como o resto do protótipo faz: storage é editável pelo avaliador
 * (T-02-02) e formato estranho derruba a tela, não o build. Qualquer coisa fora do
 * esperado devolve lista vazia — o histórico é conveniência, nunca requisito.
 */
export function lerConversas<M, P>(): ConversaGuardada<M, P>[] {
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const valor: unknown = JSON.parse(bruto);
    if (!Array.isArray(valor)) return [];
    return valor.filter(
      (c): c is ConversaGuardada<M, P> =>
        Boolean(c) &&
        typeof c === "object" &&
        typeof (c as ConversaGuardada).id === "string" &&
        typeof (c as ConversaGuardada).titulo === "string" &&
        Array.isArray((c as ConversaGuardada).mensagens),
    );
  } catch (erro) {
    storageRecusou("leitura", erro);
    return [];
  }
}

function gravar<M, P>(lista: ConversaGuardada<M, P>[], operacao: string): ConversaGuardada<M, P>[] {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch (erro) {
    storageRecusou(operacao, erro);
  }
  return lista;
}

/**
 * Grava a conversa corrente, substituindo a versão anterior dela.
 *
 * Substituir e não acrescentar: a conversa cresce a cada turno, e uma entrada por turno
 * encheria a lista com dez cópias da mesma conversa. O `id` é o que identifica a conversa
 * viva, e quem o cria é quem a começou.
 */
export function guardarConversa<M, P>(conversa: ConversaGuardada<M, P>): ConversaGuardada<M, P>[] {
  const atuais = lerConversas<M, P>().filter((c) => c.id !== conversa.id);
  return gravar([conversa, ...atuais].slice(0, TETO_DE_CONVERSAS), "gravação");
}

/**
 * Semeia o histórico com exemplos, e SÓ quando ele está vazio.
 *
 * Nunca sobrescreve: quem já conversou tem o próprio histórico, e substituí-lo por
 * demonstração seria apagar o trabalho de alguém para mostrar uma tela mais bonita.
 * Devolve o que ficou valendo, semeado ou não.
 */
export function semearExemplos<M, P>(exemplos: ConversaGuardada<M, P>[]): ConversaGuardada<M, P>[] {
  const atuais = lerConversas<M, P>();
  if (atuais.length) return atuais;
  return gravar(exemplos.slice(0, TETO_DE_CONVERSAS), "semeadura");
}

export function removerConversa<M, P>(id: string): ConversaGuardada<M, P>[] {
  return gravar(
    lerConversas<M, P>().filter((c) => c.id !== id),
    "remoção",
  );
}

/** «hoje», «ontem» ou a data curta. Quem procura uma conversa procura por quando falou. */
export function quandoPorExtenso(quando: number, agora: number): string {
  const dia = 24 * 60 * 60 * 1000;
  const zerar = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const diferenca = Math.round((zerar(agora) - zerar(quando)) / dia);
  if (diferenca <= 0) return "hoje";
  if (diferenca === 1) return "ontem";
  if (diferenca < 7) return `há ${diferenca} dias`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(quando);
}
