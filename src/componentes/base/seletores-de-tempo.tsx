"use client";

/**
 * base/seletores-de-tempo.tsx, data e hora, sem biblioteca.
 *
 * SEM BIBLIOTECA, e não por economia de bytes: acrescentar dependência é mudança fora deste
 * trabalho, e `<input type="date">` e `<input type="time">` já resolvem o teclado certo em
 * telefone, o formato local na exibição e o valor ISO na leitura. O que eles NÃO resolvem é
 * a aritmética, e é aí que mora o defeito.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A ARMADILHA DO FUSO, escrita por extenso porque ela não deixa sintoma.
 *
 * `new Date("2026-09-12T20:00")`, sem sufixo de fuso, é interpretado como HORA LOCAL. Em
 * São Paulo isso é 23:00Z. `getHours()` devolve 20, certo; mas `toISOString()` devolve
 * `2026-09-12T23:00:00Z`, e `.slice(0,10)` devolve o dia certo por acaso. Some três horas e
 * meia numa sessão que começa às 21:00 e o dia vira 13, a grade sai deslocada UM DIA, e
 * nenhum portão vê, porque o número continua sendo uma data válida.
 *
 * `Date.UTC` na entrada e `getUTC*` na leitura fecham os dois lados: nada nesta ficha é um
 * instante no mundo, é uma etiqueta de calendário, e etiqueta de calendário não tem fuso.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * SEM RELÓGIO. Nenhum `new Date()` sem argumento e nenhum `Date.now()`: o HTML exportado e
 * a página hidratada precisam coincidir, e um valor lido do relógio faria os dois divergirem
 * na primeira renderização. O «hoje» chega por prop, vindo de `DATA_DE_REFERENCIA`.
 */

/** `"2026-09-12"` → `{a: 2026, m: 9, d: 12}`. `null` quando não é uma data ISO. */
export function partesDaData(iso: string): { a: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const a = Number(m[1]);
  const mes = Number(m[2]);
  const d = Number(m[3]);
  if (mes < 1 || mes > 12 || d < 1 || d > 31) return null;
  return { a, m: mes, d };
}

/** `"2026-09-12"` → `"12.09.2026"`. Sem `toLocaleDateString`: o separador não pode depender
 *  do locale da máquina que roda o build, senão a data muda de forma entre dois builds. */
export function dataLegivel(iso: string): string {
  const p = partesDaData(iso);
  if (!p) return iso;
  const dd = String(p.d).padStart(2, "0");
  const mm = String(p.m).padStart(2, "0");
  return `${dd}.${mm}.${p.a}`;
}

/** Os dias entre duas datas ISO, inclusive. `null` quando alguma não é data ou a ordem
 *  está trocada, um intervalo que termina antes de começar é erro de digitação. */
export function diasEntre(inicio: string, fim: string): number | null {
  const a = partesDaData(inicio);
  const b = partesDaData(fim);
  if (!a || !b) return null;
  const ta = Date.UTC(a.a, a.m - 1, a.d);
  const tb = Date.UTC(b.a, b.m - 1, b.d);
  if (tb < ta) return null;
  return Math.round((tb - ta) / 86_400_000) + 1;
}

/** `"2026-09-12"` + 1 → `"2026-09-13"`. Atravessa mês e ano por construção. */
export function somarDias(iso: string, dias: number): string {
  const p = partesDaData(iso);
  if (!p) return iso;
  const t = new Date(Date.UTC(p.a, p.m - 1, p.d) + dias * 86_400_000);
  const dd = String(t.getUTCDate()).padStart(2, "0");
  const mm = String(t.getUTCMonth() + 1).padStart(2, "0");
  return `${t.getUTCFullYear()}-${mm}-${dd}`;
}

/**
 * O dia da semana, 0 = domingo. Em UTC, pelo motivo do cabeçalho.
 *
 * `getDay()` num `Date` construído de string sem fuso devolveria o dia LOCAL, e no Brasil
 * uma data à meia-noite UTC cai no dia anterior, a grade geraria sessões de segunda quando
 * o gerador pediu terça, e o defeito só apareceria a cada mudança de horário de verão.
 */
export function diaDaSemana(iso: string): number | null {
  const p = partesDaData(iso);
  if (!p) return null;
  return new Date(Date.UTC(p.a, p.m - 1, p.d)).getUTCDay();
}

export const NOMES_DOS_DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

// ---------------------------------------------------------------------------

export function SeletorDeData({
  valor,
  aoMudar,
  id,
  min,
  max,
  rotuloAria,
}: {
  valor: string;
  aoMudar: (iso: string) => void;
  id?: string;
  min?: string;
  max?: string;
  rotuloAria?: string;
}) {
  return (
    <input
      type="date"
      id={id}
      value={valor}
      min={min}
      max={max}
      aria-label={rotuloAria}
      onChange={(e) => aoMudar(e.target.value)}
      className="prod-campo-entrada"
      data-seletor-data
    />
  );
}

export function SeletorDeHora({
  valor,
  aoMudar,
  id,
  rotuloAria,
}: {
  /** `"20:00"`. */
  valor: string;
  aoMudar: (hhmm: string) => void;
  id?: string;
  rotuloAria?: string;
}) {
  return (
    <input
      type="time"
      id={id}
      value={valor}
      aria-label={rotuloAria}
      onChange={(e) => aoMudar(e.target.value)}
      className="prod-campo-entrada"
      data-seletor-hora
    />
  );
}
