"use client";

import { useState } from "react";
import { ICONE_MAIS } from "@/componentes/base/icones";
import { FolhaDeCriacao } from "@/componentes/folha-de-criacao";
import type { ImagemDaCriacao } from "@/componentes/folha-de-criacao";
import type { Pauta } from "@/dados/tipos-produtor";

/**
 * criar-da-lateral.tsx, o Criar da coluna lateral da web.
 *
 * ELE MORA DENTRO DO TRILHO, e é por isso que não precisa saber de visão nenhuma: o app
 * esconde o trilho inteiro por CSS, e o Criar de lá é o redondo da barra flutuante. Um
 * botão que soubesse em que visão está seria um ramo de JavaScript fazendo o trabalho que
 * D-05 manda o CSS fazer.
 *
 * A folha que ele abre é a MESMA da barra (`folha-de-criacao.tsx`): escolher a pauta, ver
 * o caminho, começar.
 */
export function CriarDaLateral({
  pautasComFicha,
  imagens,
}: {
  pautasComFicha: readonly Pauta[];
  imagens: ImagemDaCriacao[];
}) {
  const [criando, setCriando] = useState(false);

  return (
    <>
      <button
        type="button"
        className="prod-criar-lateral"
        onClick={() => setCriando(true)}
        data-criar-da-lateral
      >
        {ICONE_MAIS}
        Criar
      </button>
      <FolhaDeCriacao
        aberta={criando}
        aoFechar={() => setCriando(false)}
        pautasComFicha={pautasComFicha}
        imagens={imagens}
      />
    </>
  );
}
