"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * base/folha.tsx, a superfície que sobe do pé no app e cola no lado na web.
 *
 * UMA PRIMITIVA, DUAS VISÕES, UMA ÁRVORE. `busca-folha` já fazia isto em `buscar.tsx`, e
 * `mapa.tsx` fazia de novo, e cada uma resolveu o scrim, o Escape e o foco à sua maneira. A
 * terceira cópia seria a que diverge. Aqui é uma só, e a divergência entre app e web é CSS
 * puro sob `[data-view]` (D-05).
 *
 * `absolute` CONTRA A MOLDURA, NUNCA `fixed`. Dentro do telefone de 390px o `fixed` escapa
 * para a largura da janela: a folha cobriria a página inteira e o aparelho ficaria por baixo.
 * O único `fixed` legítimo do projeto mora no `.canto` de `casca.tsx` (D-03, D-04).
 *
 * POR QUE ELA NÃO É `<dialog>`. O elemento nativo abre no TOP LAYER do navegador, acima de
 * tudo, inclusive acima da moldura, e centrado na janela. É exatamente o que D-03 proíbe:
 * a ilusão do aparelho quebra e a folha aparece no meio do desktop. O que o `<dialog>`
 * traria de graça, foco preso, Escape, inerte atrás, está escrito abaixo, à mão, porque é
 * mais barato que perder a moldura.
 */

export interface PropsFolha {
  aberta: boolean;
  /** O título. Vira o `aria-labelledby`, folha sem nome é folha que o leitor não anuncia. */
  titulo: string;
  /** Uma linha do que se escolhe aqui. Opcional. */
  descricao?: string;
  aoFechar: () => void;
  children: ReactNode;
  /** O que fica grudado no pé da folha, normalmente o «Confirmar (2)». */
  rodape?: ReactNode;
}

export function Folha({ aberta, titulo, descricao, aoFechar, children, rodape }: PropsFolha) {
  const caixa = useRef<HTMLDivElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  // Escape fecha, e o foco volta para quem abriu. Sem a segunda metade, fechar a folha
  // deixa o foco no `<body>` e a próxima tecla de tabulação recomeça do topo da página,
  // quem navega por teclado perde o lugar toda vez que desiste de uma escolha.
  useEffect(() => {
    if (!aberta) return;
    focoAnterior.current = document.activeElement as HTMLElement | null;

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        aoFechar();
        return;
      }
      if (e.key !== "Tab" || !caixa.current) return;
      // Foco preso na folha. Sem isto, tabular sai por baixo do scrim e vai parar nos
      // controles da tela que a folha está cobrindo, controles que a pessoa não vê.
      const focaveis = caixa.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0] as HTMLElement;
      const ultimo = focaveis[focaveis.length - 1] as HTMLElement;
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener("keydown", aoTeclar, true);
    // Um quadro depois: o elemento acabou de entrar e ainda não tem retângulo.
    const t = setTimeout(() => {
      caixa.current?.querySelector<HTMLElement>("input, button, [tabindex]")?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", aoTeclar, true);
      clearTimeout(t);
      focoAnterior.current?.focus?.();
    };
  }, [aberta, aoFechar]);

  if (!aberta) return null;

  return (
    <>
      {/* O scrim é irmão da folha e não pai: um clique nele fecha, e um clique DENTRO da
          folha não pode borbulhar até ele. Aninhar produziria o defeito clássico, a folha
          fechando quando a pessoa clica num item dela. */}
      <div className="prod-scrim" onClick={aoFechar} data-scrim aria-hidden />
      <div
        ref={caixa}
        className="prod-folha"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        data-folha
      >
        <div className="prod-folha-cabeca">
          {/* A alça. Decorativa no desktop, e é ela que diz «isto arrasta» no telefone. */}
          <span className="prod-folha-alca" aria-hidden />
          <div className="prod-folha-titulos">
            <h2 className="prod-folha-titulo">{titulo}</h2>
            {descricao ? <p className="prod-folha-descricao">{descricao}</p> : null}
          </div>
          <button
            type="button"
            className="prod-folha-fechar"
            onClick={aoFechar}
            aria-label={`Fechar ${titulo}`}
            data-fechar-folha
          >
            ✕
          </button>
        </div>

        <div className="prod-folha-corpo">{children}</div>

        {rodape ? <div className="prod-folha-rodape">{rodape}</div> : null}
      </div>
    </>
  );
}
