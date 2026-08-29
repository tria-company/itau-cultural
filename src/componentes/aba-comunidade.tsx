"use client";

import { useState } from "react";
import { Explorar } from "@/componentes/comunidade-explorar";
import { MeuFeed } from "@/componentes/comunidade-meu-feed";
import { usePontos } from "@/contexto/pontos";
import { PRODUTOR_DA_CASA, comunidadePorId } from "@/dados/comunidade";

/**
 * aba-comunidade.tsx — as duas metades da aba Comunidade.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MEU FEED E EXPLORAR, no topo (pedido de 29/08/2026). O primeiro é o que as comunidades
 * que ele segue publicaram, misturado e do mais novo para o mais velho. O segundo é o resto,
 * das que ele ainda NÃO segue, ordenado pelo que ele já demonstrou interesse. As duas listas
 * nunca mostram o mesmo post: é isso que faz valer a pena trocar de aba.
 *
 * A ABA QUE ABRE DEPENDE DE TER FEED. Quem não segue ninguém cai em Explorar, porque «Meu
 * feed» vazio como primeira tela é uma porta fechada; quem segue alguém cai no feed, que é
 * o que ele voltou aqui para ver. Trocar continua a um toque, nos dois casos.
 *
 * O TRILHO É `.prod-trilho-abas`, que já existe e já sabe desenhar aba ativa e inativa. Um
 * segmentado novo aqui seria uma terceira gramática para a mesma pergunta, e este projeto já
 * aposentou um por isso.
 *
 * QUEM DECIDE É O CLIENTE, porque quem sabe é o `localStorage`. No servidor não há
 * assinatura, o HTML do build sai em Explorar, e é o que uma pessoa sem estado vê.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function AbaComunidade() {
  const { motor, hidratado } = usePontos();

  const segueAlguma =
    hidratado &&
    motor.atual.assinadas.some((id) => comunidadePorId(id)?.donoId !== PRODUTOR_DA_CASA);

  // `null` = ainda não escolheu à mão, e vale a regra. Assim que ele toca numa aba, a
  // escolha dele vence, inclusive a de ficar no feed vazio para ver que está vazio.
  const [escolhida, setEscolhida] = useState<"feed" | "explorar" | null>(null);
  const atual = escolhida ?? (segueAlguma ? "feed" : "explorar");

  return (
    <div className="prod-corpo" data-aba-comunidade={atual}>
      <div className="prod-trilho-abas" role="tablist" aria-label="O que mostrar">
        <button
          type="button"
          role="tab"
          className="prod-pauta"
          data-ativa={atual === "feed" ? "sim" : "nao"}
          aria-selected={atual === "feed"}
          onClick={() => setEscolhida("feed")}
          data-aba="feed"
        >
          Meu feed
        </button>
        <button
          type="button"
          role="tab"
          className="prod-pauta"
          data-ativa={atual === "explorar" ? "sim" : "nao"}
          aria-selected={atual === "explorar"}
          onClick={() => setEscolhida("explorar")}
          data-aba="explorar"
        >
          Explorar
        </button>
      </div>

      {atual === "feed" ? <MeuFeed /> : <Explorar />}
    </div>
  );
}
