"use client";

import type { Impedimento } from "@/dados/tipos-produtor";

/**
 * base/lista-de-impedimentos.tsx, o que falta, com o endereço de onde se resolve.
 *
 * UM SCORE QUE APONTA O QUE FALTA SEM DIZER ONDE É ENIGMA. «falta o crédito da imagem» numa
 * ficha de oito atos deixa a pessoa abrindo um por um. Cada item aqui é um botão que leva ao
 * ato que resolve, e quando a falta depende de outro nível, o nível é nomeado.
 *
 * A SEPARAÇÃO ENTRE O QUE BLOQUEIA E O QUE SÓ DIMINUI É DO PRODUTO. Crédito de imagem
 * bloqueia (165); ficha de acessibilidade incompleta bloqueia (D-43); resumo curto não. Misturar
 * os dois faria a pessoa tratar tudo como opcional, ou tudo como obstáculo.
 */

export function ListaDeImpedimentos({
  impedimentos,
  aoIrParaAto,
  /** O total de conferências, para o número ter denominador. */
  total,
}: {
  impedimentos: readonly Impedimento[];
  aoIrParaAto?: (ato: number) => void;
  total: number;
}) {
  const bloqueiam = impedimentos.filter((i) => i.bloqueia);
  const diminuem = impedimentos.filter((i) => !i.bloqueia);
  const resolvidos = total - impedimentos.length;

  if (impedimentos.length === 0) {
    return (
      <div className="prod-impedimentos" data-impedimentos="0">
        <p className="prod-impedimentos-frase">
          Nada falta. {total} de {total} conferências resolvidas, este registro publica.
        </p>
      </div>
    );
  }

  return (
    <div className="prod-impedimentos" data-impedimentos={String(bloqueiam.length)}>
      {/* O NÚMERO COM DENOMINADOR, sempre. «3 pendências» não diz se são três de quatro ou
          três de quarenta, e as duas leituras levam a decisões opostas. */}
      <p className="prod-impedimentos-frase">
        {resolvidos} de {total} conferências resolvidas.
        {bloqueiam.length > 0
          ? ` ${bloqueiam.length} ${bloqueiam.length === 1 ? "impede" : "impedem"} publicar.`
          : " Nada impede publicar."}
      </p>

      {bloqueiam.length > 0 ? (
        <ul className="prod-impedimentos-lista" data-bloqueiam>
          {bloqueiam.map((i, n) => (
            <li key={`b${n}`}>
              <Item impedimento={i} aoIrParaAto={aoIrParaAto} />
            </li>
          ))}
        </ul>
      ) : null}

      {diminuem.length > 0 ? (
        <details className="prod-impedimentos-opcionais">
          <summary>
            {diminuem.length} {diminuem.length === 1 ? "falta" : "faltas"} que não{" "}
            {diminuem.length === 1 ? "impede" : "impedem"} publicar
          </summary>
          <ul className="prod-impedimentos-lista">
            {diminuem.map((i, n) => (
              <li key={`d${n}`}>
                <Item impedimento={i} aoIrParaAto={aoIrParaAto} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function Item({
  impedimento,
  aoIrParaAto,
}: {
  impedimento: Impedimento;
  aoIrParaAto?: (ato: number) => void;
}) {
  const podeIr = aoIrParaAto !== undefined && impedimento.ato >= 0;
  return (
    <div className="prod-impedimento" data-bloqueia={impedimento.bloqueia ? "sim" : "nao"}>
      <span className="prod-impedimento-texto">{impedimento.texto}</span>
      {impedimento.dono ? (
        <span className="prod-pendencia-dono">{impedimento.dono}</span>
      ) : null}
      {podeIr ? (
        <button
          type="button"
          className="prod-impedimento-ir"
          onClick={() => aoIrParaAto(impedimento.ato)}
          data-ir-para-ato={String(impedimento.ato)}
        >
          resolver em «{impedimento.rotuloDoAto}» ▸
        </button>
      ) : (
        <span className="prod-campo-nota">em «{impedimento.rotuloDoAto}»</span>
      )}
    </div>
  );
}
