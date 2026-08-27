"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { DESCRICAO_DO_PAPEL, PAPEIS, chegadaDe, usePapel } from "@/contexto/papel";
import type { Papel } from "@/contexto/papel";

/**
 * selecao-papel.tsx, os perfis de demonstração da tela de entrada.
 *
 * NO MOLDE DE `selecao-persona.tsx`, e a semelhança é deliberada: os dois controles ficam
 * um abaixo do outro na mesma tela, e duas gramáticas de botão ali fariam a pessoa achar
 * que estão fazendo coisas de natureza diferente. Fazem: persona é PARA QUEM o produto
 * recomenda; papel é O QUE a navegação oferece. Mas os dois são a mesma classe de gesto,
 * escolher e seguir, e o desenho diz isso.
 *
 * ELE NÃO É UM PORTÃO. Escolher grava a preferência e navega para a rota de chegada. Quem
 * digitar a URL de qualquer superfície continua entrando, e a tela declara isso acima.
 */
export function SelecaoPapel() {
  const router = useRouter();
  const { papel, definirPapel, hidratado } = usePapel();

  function escolher(escolhido: Papel) {
    definirPapel(escolhido);
    router.push(chegadaDe(escolhido));
  }

  return (
    <div className="flex flex-col gap-2">
      {PAPEIS.map((p) => {
        const d = DESCRICAO_DO_PAPEL[p];
        // Antes de hidratar, nenhum aparece marcado: o HTML do build não sabe o que o
        // navegador guardou, e fingir que sabe produz divergência de hidratação.
        const ativo = hidratado && papel === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => escolher(p)}
            aria-pressed={ativo}
            data-papel={p}
            className={clsx(
              "cursor-pointer rounded-xl border p-3 text-left transition-colors",
              ativo ? "border-acao bg-acao/10" : "border-borda hover:border-tinta",
            )}
          >
            <span className="block font-bold">{d.rotulo}</span>
            <span className="mt-0.5 block text-xs text-tinta-2">{d.resumo}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * A troca de papel sem passar por `/entrar`, o item do menu da conta.
 *
 * SEM NAVEGAR. Quem troca de papel a partir de uma tela qualquer quase sempre quer
 * continuar onde está e ver o que muda; empurrar para a rota de chegada tiraria a pessoa
 * do lugar toda vez. Quem quer o destino usa a tela de entrada, que navega.
 */
export function TrocaDePapel({ className }: { className?: string }) {
  const { papel, definirPapel, hidratado } = usePapel();

  return (
    <label className={clsx("flex flex-col gap-1", className)}>
      <span className="tipo-micro text-tinta-3">Entrando como</span>
      <select
        value={hidratado ? papel : "publico"}
        onChange={(e) => definirPapel(e.target.value as Papel)}
        data-troca-papel
        className="rounded-lg border border-borda bg-superficie px-2 py-1.5 tipo-detalhe"
      >
        {PAPEIS.map((p) => (
          <option key={p} value={p}>
            {DESCRICAO_DO_PAPEL[p].rotulo}
          </option>
        ))}
      </select>
    </label>
  );
}
