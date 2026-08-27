"use client";

import Link from "next/link";
import { ICONE_CONFERIDO, ICONE_MAIS, ICONE_TOCAR } from "@/componentes/base/icones";

/**
 * acoes-do-cartaz.tsx, a barra que aparece quando o ponteiro para em cima do cartaz, nas
 * paredes do Play e do Cast.
 *
 * O GESTO É O DA NETFLIX E O DO SPOTIFY, e é de propósito: parar em cima de um cartaz e
 * ver o item crescer com um botão redondo e um «+» é vocabulário que ninguém precisa
 * aprender. A regra da reunião de 23/08 vale aqui inteira, «vamos evitar reinventar a
 * roda».
 *
 * O BOTÃO REDONDO NÃO TOCA NADA, E NÃO FINGE QUE TOCA. O acervo carregado traz a FICHA e a
 * CAPA de cada mídia; o arquivo de áudio ou vídeo não está aqui, e a página do item declara
 * isso por extenso (`data-sem-arquivo` em `player.tsx`). Então ele tem a FORMA do play e o
 * rótulo do que realmente acontece: abrir a mídia. Um triângulo que inicia uma reprodução
 * inexistente seria a mentira mais barata destas duas telas, é o que o cabeçalho de
 * `play.tsx` já recusava quando decidiu que o botão não diria «assistir».
 *
 * OS DOIS BOTÕES SÃO IRMÃOS DO LINK, NUNCA FILHOS DELE. Um `<button>` dentro de um `<a>` é
 * HTML inválido e, na prática, um alvo que o teclado alcança mas não aciona. O link do
 * cartaz cobre o cartão inteiro por `::after` (ver `play.css`), e estes controles sobem por
 * cima dele com `position: relative`, daí o `stopPropagation` não ser necessário.
 *
 * NO TOQUE A BARRA NÃO SE ESCONDE. Sem ponteiro não há hover, e uma ação que só existe no
 * hover é uma ação que o telefone não tem. `@media (hover: none)` deixa a barra sempre
 * visível, ver o bloco no fim de `play.css`.
 */
export function AcoesDoCartaz({
  rota,
  titulo,
  naLista,
  aoAlternarLista,
  className,
}: {
  rota: string;
  /** O título da mídia. Entra no rótulo acessível de cada botão, sem ele, um leitor de
   *  tela anuncia «abrir» quarenta vezes seguidas sem dizer o quê. */
  titulo: string;
  naLista: boolean;
  aoAlternarLista: () => void;
  className: string;
}) {
  return (
    <div className={className}>
      <Link href={rota} className="cartaz-acao cartaz-acao--tocar" aria-label={`Abrir ${titulo}`}>
        {ICONE_TOCAR}
      </Link>

      <button
        type="button"
        data-na-lista={naLista ? "sim" : "nao"}
        aria-pressed={naLista}
        aria-label={naLista ? `Tirar ${titulo} da minha lista` : `Pôr ${titulo} na minha lista`}
        onClick={aoAlternarLista}
        className="cartaz-acao cartaz-acao--lista"
      >
        {naLista ? ICONE_CONFERIDO : ICONE_MAIS}
      </button>
    </div>
  );
}
