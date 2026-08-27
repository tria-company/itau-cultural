/**
 * desempenho-produtor.ts, os números da última publicação, para o painel.
 *
 * TUDO AQUI É AUTORADO E DETERMINÍSTICO, e o painel diz isso ao lado do gráfico. Não há
 * usuários neste protótipo e não existe servidor medindo plays, vendas ou leituras: os
 * números saem do próprio id do registro, por soma de caracteres alimentando um gerador
 * congruente (Park-Miller), reprodutível entre dois carregamentos e entre duas máquinas.
 * É a mesma disciplina de `quantosSalvaram` em produtor-sessoes.tsx: o que a tela prova
 * é o MECANISMO, a métrica certa para cada pauta, mostrada no lugar onde quem publica
 * decide o que fazer em seguida.
 *
 * A MÉTRICA MUDA COM A PAUTA, e é essa a tese da tela. Evento se mede em ingresso,
 * receita e em quantos dias falta para a próxima sessão; audiovisual se mede em play,
 * tempo médio assistido e conclusão; matéria se mede em leitura. Um painel que mostra
 * «visualizações» para tudo não responde a pergunta de ninguém.
 *
 * MÓDULO SEM GRAFO (DP-F): importa só o contrato. Nada de relógio nem de sorteio: a
 * data de referência entra por parâmetro e a aritmética é a de `minutosEntre` (UTC).
 */

import { emReais, minutosEntre } from "@/dados/tipos-produtor";
import type { Registro, RegistroDeAgenda } from "@/dados/tipos-produtor";

/** Quantos dias a série cobre. Duas semanas: cabe em 370px e ainda mostra tendência. */
export const DIAS_DA_SERIE = 14;

export const DESEMPENHO_E_AUTORADO =
  "Números autorados e determinísticos: não há usuários neste protótipo, nem servidor " +
  "medindo plays ou vendas. O que o painel prova é o mecanismo, a métrica certa para " +
  "cada pauta.";

export type Desempenho =
  | {
      familia: "evento";
      ingressos: number;
      /** `true` quando a cobrança do evento não é «pago». */
      gratuito: boolean;
      /** `true` em vigência contínua (exposição): não há «próxima sessão» a contar. */
      vigencia: boolean;
      /** Em centavos. `null` quando gratuito, ou pago ainda sem preço declarado. */
      receita: number | null;
      /** 0 a 100. */
      ocupacao: number;
      /** Dias até a próxima sessão não cancelada. `null` sem sessão futura. */
      proximaEmDias: number | null;
      serie: number[];
    }
  | {
      familia: "audiovisual";
      plays: number;
      tempoMedioMinutos: number;
      /** 0 a 100: quem chegou ao fim. */
      conclusao: number;
      serie: number[];
    }
  | {
      familia: "leitura";
      leituras: number;
      tempoMedioMinutos: number;
      /** 0 a 100: quem leu até o fim. */
      ateOFim: number;
      serie: number[];
    }
  | {
      familia: "alcance";
      vistas: number;
      salvos: number;
      compartilhamentos: number;
      serie: number[];
    };

/**
 * Os comentários que um registro publicado recebeu. AUTORADOS, como o resto: não há
 * usuários neste protótipo. Duas ou três linhas por registro, tiradas do pool pelo id
 * — nunca quatro: com passo 2 num pool de seis, o quarto índice cicla e repete o
 * comentário que a primeira linha já mostrou.
 *
 * FONTE ÚNICA. A tela do registro mostra os comentários dele; a Comunidade mostra os de
 * todos juntos. Dois geradores fariam o mesmo registro ter comentários diferentes em duas
 * telas do mesmo produto.
 */
const COMENTARIOS_AUTORADOS = [
  { nome: "Marina P.", texto: "Fui no sábado e valeu cada minuto." },
  { nome: "Carlos Eduardo", texto: "A curadoria está impecável, parabéns à equipe." },
  { nome: "Ju Santana", texto: "Alguém sabe se vai ter outra data?" },
  { nome: "Rafael T.", texto: "Levei as crianças e elas amaram." },
  { nome: "Beatriz N.", texto: "Voltaria mais vezes, experiência linda." },
  { nome: "Pedro Lima", texto: "Já salvei para a próxima." },
] as const;

export interface ComentarioAutorado {
  nome: string;
  texto: string;
  /** Há quantos dias ele chegou, contado da data de referência. */
  haDias: number;
}

export function comentariosDe(id: string): ComentarioAutorado[] {
  const soma = sementeDe(id);
  const quantos = 2 + (soma % 2);
  return Array.from({ length: quantos }, (_, i) => {
    const c = COMENTARIOS_AUTORADOS[(soma + i * 2) % COMENTARIOS_AUTORADOS.length];
    return { nome: c.nome, texto: c.texto, haDias: 1 + ((soma + i * 3) % 9) };
  });
}

/** A soma dos caracteres do id, a mesma semente de `quantosSalvaram`. */
function sementeDe(texto: string): number {
  let soma = 0;
  for (let i = 0; i < texto.length; i += 1) soma += texto.charCodeAt(i) * (i + 1);
  return soma;
}

/**
 * Park-Miller: um gerador congruente mínimo. NÃO é `Math.random`, e é por isso que ele
 * está aqui: a mesma semente produz sempre a mesma sequência, e o export estático exige
 * que dois renders do mesmo registro pintem o mesmo gráfico.
 */
function ruidoDe(semente: number): () => number {
  let x = semente % 2147483647;
  if (x <= 0) x += 2147483646;
  return () => {
    x = (x * 16807) % 2147483647;
    return x / 2147483647;
  };
}

/**
 * Os últimos `DIAS_DA_SERIE` dias, na escala pedida, com leve subida no fim: a série de
 * uma publicação recente cresce, e um gráfico que desce contaria outra história.
 */
function serieDe(id: string, escala: number): number[] {
  const proximo = ruidoDe(sementeDe(id));
  const serie: number[] = [];
  for (let i = 0; i < DIAS_DA_SERIE; i += 1) {
    const tendencia = 0.55 + (0.45 * i) / (DIAS_DA_SERIE - 1);
    serie.push(Math.max(0, Math.round(escala * tendencia * (0.35 + proximo() * 0.65))));
  }
  return serie;
}

function soma(serie: number[]): number {
  return serie.reduce((n, v) => n + v, 0);
}

/**
 * Dias inteiros de `deDia` (AAAA-MM-DD) até `ateInstante` (AAAA-MM-DDTHH:mm), negativos
 * quando o instante já passou. `minutosEntre` devolve `null` para fim <= início (foi
 * desenhado para duração), então o passado é medido pela subtração invertida; só a
 * data ilegível continua `null`. Sem isto, uma sessão à meia-noite exata do dia de
 * referência caia no `null` e sumia da conta de próxima sessão.
 */
function diasAte(deDia: string, ateInstante: string): number | null {
  const zero = `${deDia}T00:00`;
  if (ateInstante === zero) return 0;
  const direto = minutosEntre(zero, ateInstante);
  if (direto !== null) return Math.floor(direto / (24 * 60));
  const inverso = minutosEntre(ateInstante, zero);
  return inverso === null ? null : -Math.ceil(inverso / (24 * 60));
}

function desempenhoDeEvento(r: RegistroDeAgenda, dataDeReferencia: string): Desempenho {
  const proximo = ruidoDe(sementeDe(r.id));
  const capacidade = 40 + Math.round(proximo() * 180);
  const serie = serieDe(r.id, Math.max(4, Math.round(capacidade / 6)));
  const ingressos = soma(serie);

  // O PREÇO EFETIVO de uma sessão é o override dela, senão o preço-base do evento (a
  // inteira, senão a meia, senão o piso da faixa): o contrato diz que `SessaoDoProdutor.
  // preco` SOBRESCREVE o preço do evento, ele não é a única fonte. Ler só a sessão
  // fazia todo evento pago do fluxo normal aparecer como gratuito.
  const gratuito = r.cobranca !== "pago";
  const base = r.preco.inteira ?? r.preco.meia ?? r.preco.de ?? null;
  const efetivos = r.sessoes
    .filter((s) => !s.cancelada)
    .map((s) => s.preco ?? base)
    .filter((p): p is number => p !== null && p > 0);
  const precoMedio = gratuito
    ? null
    : efetivos.length > 0
      ? Math.round(soma(efetivos) / efetivos.length)
      : base !== null && base > 0
        ? base
        : null;
  const receita = precoMedio === null ? null : ingressos * precoMedio;

  let proximaEmDias: number | null = null;
  for (const s of r.sessoes) {
    if (s.cancelada) continue;
    const dias = diasAte(dataDeReferencia, s.inicio);
    if (dias === null || dias < 0) continue;
    if (proximaEmDias === null || dias < proximaEmDias) proximaEmDias = dias;
  }

  const ocupacao = Math.min(
    100,
    Math.round((ingressos / Math.max(1, capacidade * Math.max(1, r.sessoes.length))) * 100),
  );

  return {
    familia: "evento",
    ingressos,
    gratuito,
    vigencia: r.programacao === "vigencia",
    receita,
    ocupacao,
    proximaEmDias,
    serie,
  };
}

/** A métrica certa para a pauta do registro, na data de referência. */
export function desempenhoDe(registro: Registro, dataDeReferencia: string): Desempenho {
  if (registro.pauta === "agenda") return desempenhoDeEvento(registro, dataDeReferencia);

  const proximo = ruidoDe(sementeDe(registro.id));

  if (registro.pauta === "play" || registro.pauta === "cast") {
    const serie = serieDe(registro.id, 60 + Math.round(proximo() * 240));
    const duracao =
      "duracaoMinutos" in registro && registro.duracaoMinutos !== null
        ? registro.duracaoMinutos
        : null;
    // Quem assiste não assiste inteiro: o tempo médio é uma fração da duração declarada,
    // e sem duração declarada cai num valor plausível de episódio.
    const tempoMedioMinutos =
      duracao === null
        ? 6 + Math.round(proximo() * 18)
        : Math.max(1, Math.round(duracao * (0.45 + proximo() * 0.3)));
    return {
      familia: "audiovisual",
      plays: soma(serie),
      tempoMedioMinutos,
      conclusao: 35 + Math.round(proximo() * 45),
      serie,
    };
  }

  if (registro.pauta === "editorial") {
    const serie = serieDe(registro.id, 90 + Math.round(proximo() * 300));
    return {
      familia: "leitura",
      leituras: soma(serie),
      tempoMedioMinutos: 2 + Math.round(proximo() * 6),
      ateOFim: 30 + Math.round(proximo() * 50),
      serie,
    };
  }

  const serie = serieDe(registro.id, 30 + Math.round(proximo() * 160));
  const vistas = soma(serie);
  return {
    familia: "alcance",
    vistas,
    salvos: Math.round(vistas * (0.05 + proximo() * 0.12)),
    compartilhamentos: Math.round(vistas * (0.01 + proximo() * 0.05)),
    serie,
  };
}

/**
 * A última semana da série sobre a anterior, em percentual inteiro. É a leitura mais
 * intuitiva de um gráfico: não «quanto», mas «está subindo?», dita em uma palavra.
 */
export function variacaoSemanal(serie: number[]): number {
  const metade = Math.floor(serie.length / 2);
  const anterior = serie.slice(0, metade).reduce((n, v) => n + v, 0);
  const ultima = serie.slice(serie.length - metade).reduce((n, v) => n + v, 0);
  return Math.round(((ultima - anterior) / Math.max(1, anterior)) * 100);
}

/** Milhar com ponto, sem `toLocaleString`: o export estático exige o mesmo texto
 *  no build e no navegador. */
export function milhar(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** O número principal de um registro, para ordenar e somar. */
export function heroiDe(d: Desempenho): { valor: number; rotulo: string } {
  if (d.familia === "evento") return { valor: d.ingressos, rotulo: "ingressos" };
  if (d.familia === "audiovisual") return { valor: d.plays, rotulo: "plays" };
  if (d.familia === "leitura") return { valor: d.leituras, rotulo: "leituras" };
  return { valor: d.vistas, rotulo: "visualizações" };
}

export interface MetricaDaLinha {
  valor: string;
  rotulo: string;
  /** `true` nas que só cabem na web; o app mostra a principal. */
  extra?: boolean;
}

/**
 * As métricas de UMA linha de listagem, na ordem de leitura: a principal primeiro,
 * as demais marcadas como extra. É a mesma fonte da tela do registro: duas tabelas
 * com números diferentes para o mesmo vídeo seriam o produto discordando de si.
 */
export function metricasDe(d: Desempenho): MetricaDaLinha[] {
  if (d.familia === "evento") {
    return [
      { valor: milhar(d.ingressos), rotulo: "ingressos" },
      {
        valor: d.gratuito ? "grátis" : d.receita === null ? "a declarar" : emReais(d.receita),
        rotulo: "receita",
        extra: true,
      },
      { valor: `${d.ocupacao}%`, rotulo: "ocupação", extra: true },
    ];
  }
  if (d.familia === "audiovisual") {
    return [
      { valor: milhar(d.plays), rotulo: "plays" },
      { valor: minutosLegiveis(d.tempoMedioMinutos), rotulo: "tempo médio", extra: true },
      { valor: `${d.conclusao}%`, rotulo: "até o fim", extra: true },
      { valor: milhar(Math.round(d.plays * 0.09)), rotulo: "salvos", extra: true },
    ];
  }
  if (d.familia === "leitura") {
    return [
      { valor: milhar(d.leituras), rotulo: "leituras" },
      { valor: minutosLegiveis(d.tempoMedioMinutos), rotulo: "tempo médio", extra: true },
      { valor: `${d.ateOFim}%`, rotulo: "até o fim", extra: true },
    ];
  }
  return [
    { valor: milhar(d.vistas), rotulo: "visualizações" },
    { valor: milhar(d.salvos), rotulo: "salvos", extra: true },
    { valor: milhar(d.compartilhamentos), rotulo: "compartilhados", extra: true },
  ];
}

/** "1 h 05" acima de uma hora, "12 min" abaixo. */
export function minutosLegiveis(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}
