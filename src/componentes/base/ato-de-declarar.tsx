"use client";

import { useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";

/**
 * base/ato-de-declarar.tsx, «Declaro que não oferece nenhum destes recursos».
 *
 * ELE É UM ATO, NÃO UM CAMPO, e a forma diz isso. Botão de largura inteira, SEM raio de
 * pílula: a pílula é a forma dos controles curtos deste design system (chip, botão, filtro),
 * e usar a mesma forma aqui faria o ato parecer mais uma opção. O que ele afirma tem peso
 * igual ao de salvar.
 *
 * POR QUE ELE PRECISA EXISTIR (D-43). Oito caixas desmarcadas significam «não oferece» e
 * «ninguém declarou» ao mesmo tempo, e a plataforma se proibiu de interpretar silêncio,
 * 2.702 registros do acervo estão exatamente nesse silêncio. O campo separado é o que
 * desfaz a ambiguidade, e é por isso que ele não pode ser derivado do conteúdo da ficha.
 *
 * MARCAR QUALQUER DIMENSÃO TAMBÉM DECLARA. Quem marca «Libras» está dizendo o que oferece,
 * e isso já é uma declaração, pedir o ato depois seria burocracia.
 *
 * DESMARCAR A ÚLTIMA NÃO DEVOLVE AO SILÊNCIO. Este é o ponto delicado. Se desmarcar a
 * última caixa apagasse a declaração, uma pessoa corrigindo um engano voltaria o registro
 * ao estado que a plataforma se proibiu de ter, e sem perceber, porque o gesto foi
 * desmarcar uma caixa. Desfazer uma declaração exige ato próprio, com confirmação.
 */

export const FRASE_DO_ATO =
  "Declaro que este registro não oferece nenhum destes recursos.";

export const POR_QUE_O_ATO =
  "Oito caixas desmarcadas significam «não oferece» e «não declarou» ao mesmo tempo. " +
  "Este botão separa as duas coisas, e é por isso que ele tem peso de ato, e não de campo.";

export function AtoDeDeclarar({
  declarado,
  algumMarcado,
  aoDeclarar,
  aoDesfazer,
  frase = FRASE_DO_ATO,
}: {
  declarado: boolean;
  /** `true` quando alguma dimensão está marcada, o ato some, porque já houve declaração. */
  algumMarcado: boolean;
  aoDeclarar: () => void;
  aoDesfazer: () => void;
  frase?: string;
}) {
  const [desfazendo, setDesfazendo] = useState(false);

  if (declarado) {
    return (
      <div className="prod-declarado" data-declarado="sim">
        <p className="prod-declarado-frase">
          {algumMarcado
            ? "Ficha resolvida: o que este registro oferece está marcado acima."
            : "Ficha resolvida: você declarou que não oferece nenhum destes recursos."}
        </p>

        {/* DESFAZER É ATO PRÓPRIO. Um botão direto devolveria o registro ao silêncio no
            primeiro clique errado, e o silêncio é o estado que a plataforma se proibiu. */}
        {desfazendo ? (
          <div className="prod-declarado-confirma">
            <p className="prod-campo-nota">
              Desfazer devolve este registro ao SILÊNCIO, nem «oferece», nem «não oferece».
              É o estado em que 2.702 registros do acervo estão hoje, e o que esta ficha
              existe para tirar deles.
            </p>
            <div className="prod-declarado-acoes">
              <BotaoDoStudio
                curto
                aoClicar={() => {
                  aoDesfazer();
                  setDesfazendo(false);
                }}
                data-acao="confirmar-desfazer-declaracao"
              >
                Devolver ao silêncio
              </BotaoDoStudio>
              <BotaoDoStudio curto aoClicar={() => setDesfazendo(false)}>
                Cancelar
              </BotaoDoStudio>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="prod-desfazer-declaracao"
            onClick={() => setDesfazendo(true)}
            data-acao="desfazer-declaracao"
          >
            desfazer a declaração
          </button>
        )}
      </div>
    );
  }

  if (algumMarcado) {
    // Marcar já declarou. O ato não aparece, pedir confirmação do que a pessoa acabou de
    // afirmar seria burocracia, e burocracia é o que faz alguém marcar qualquer coisa para
    // seguir adiante.
    return null;
  }

  return (
    <div className="prod-ato-declarar">
      <p className="prod-campo-nota">{POR_QUE_O_ATO}</p>
      <button
        type="button"
        className="prod-botao-ato"
        onClick={aoDeclarar}
        data-acao="declarar-ausencia"
      >
        {frase}
      </button>
    </div>
  );
}
