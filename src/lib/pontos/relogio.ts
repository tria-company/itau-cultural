/**
 * relogio.ts — o relógio VIRTUAL do motor de pontos.
 *
 * Nenhum módulo de `lib/pontos/` chama `Date.now()`. Todos leem daqui, e a razão é
 * a demonstração: sequência semanal, expiração de missão e fim de temporada só
 * provam o que prometem se der para atravessar uma semana na frente da banca. Com
 * `Date.now()` cravado no código, a tela de sequência seria uma foto — mostraria o
 * número 3 e nunca mostraria o número virando 4, nem a escada de proteção agindo.
 *
 * A ÂNCORA É FIXA, e isso é obrigatório aqui: sob `output: "export"` o HTML sai do
 * build e um relógio real faria o primeiro render do cliente divergir do HTML
 * gerado — o mesmo motivo pelo qual `sessao.tsx` lê `localStorage` no efeito e
 * nunca no render. Âncora fixa é estado inicial determinístico entre recargas.
 */

export const DIA_MS = 86_400_000;
export const HORA_MS = 3_600_000;

/** Segunda-feira, 24/08/2026 às 09h41. Segunda porque a semana da sequência começa aí. */
export const EPOCA = new Date(2026, 7, 24, 9, 41, 0, 0).getTime();

export function indiceDoDia(agora: number): number {
  return Math.floor((agora - EPOCA) / DIA_MS);
}

/** 0 = segunda … 6 = domingo. A âncora é uma segunda, então o resto bate. */
export function diaDaSemana(agora: number): number {
  return ((indiceDoDia(agora) % 7) + 7) % 7;
}

export function indiceDaSemana(agora: number): number {
  return Math.floor(indiceDoDia(agora) / 7);
}

/** A chave de período do dia — é ela que reseta missão diária e teto diário. */
export function chaveDoDia(agora: number): string {
  return "d" + indiceDoDia(agora);
}

/** A chave de período da semana — reseta missão semanal e fecha a sequência. */
export function chaveDaSemana(agora: number): string {
  return "s" + indiceDaSemana(agora);
}

/** Hora local 0..23 do relógio virtual. Usada pelo silêncio noturno das notificações. */
export function horaDe(agora: number): number {
  return new Date(agora).getHours();
}

const DIAS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

export function rotuloDoDia(indice: number): string {
  return DIAS[indice] ?? "";
}
