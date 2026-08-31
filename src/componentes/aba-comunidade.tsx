"use client";

import { useState } from "react";
import { ComunidadesParaLer } from "@/componentes/comunidades-para-ler";
import { Explorar } from "@/componentes/comunidade-explorar";
import { MeuFeed } from "@/componentes/comunidade-meu-feed";
import { usePontos } from "@/contexto/pontos";
import { PRODUTOR_DA_CASA, comunidadePorId } from "@/dados/comunidade";

/**
 * aba-comunidade.tsx — as tres metades da aba Comunidade.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MEU FEED, EXPLORAR E DESCOBRIR, no topo. As duas primeiras são feed de posts: o que as
 * comunidades que ele segue publicaram, e o resto, das que ele ainda NÃO segue, ordenado
 * pelo que ele já demonstrou interesse. Elas nunca mostram o mesmo post, e é isso que faz
 * valer a pena trocar. A terceira não é feed: é a galeria de comunidades, para escolher
 * quem seguir.
 *
 * DESCOBRIR VIROU ABA EM 31/08/2026. Ela era uma pastilha «Descobrir ›» dentro da linha de
 * resumo, um destino de terceira classe escondido no canto de um cartão. É uma das três
 * coisas que se faz aqui, e as três agora estão no mesmo lugar.
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
type Metade = "feed" | "explorar" | "descobrir";

const ABAS: { id: Metade; rotulo: string }[] = [
  { id: "feed", rotulo: "Meu feed" },
  { id: "explorar", rotulo: "Explorar" },
  { id: "descobrir", rotulo: "Descobrir" },
];

export function AbaComunidade({ inicial }: { inicial?: Metade }) {
  const { motor, hidratado } = usePontos();

  const segueAlguma =
    hidratado &&
    motor.atual.assinadas.some((id) => comunidadePorId(id)?.donoId !== PRODUTOR_DA_CASA);

  // `null` = ainda não escolheu à mão, e vale a regra. Assim que ele toca numa aba, a
  // escolha dele vence, inclusive a de ficar no feed vazio para ver que está vazio.
  const [escolhida, setEscolhida] = useState<Metade | null>(null);
  const atual = escolhida ?? inicial ?? (segueAlguma ? "feed" : "explorar");

  return (
    <div className="prod-corpo" data-aba-comunidade={atual}>
      <div className="prod-trilho-abas" role="tablist" aria-label="O que mostrar">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            className="prod-pauta"
            data-ativa={atual === a.id ? "sim" : "nao"}
            aria-selected={atual === a.id}
            onClick={() => setEscolhida(a.id)}
            data-aba={a.id}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {atual === "feed" ? <MeuFeed /> : atual === "explorar" ? <Explorar /> : <ComunidadesParaLer />}
    </div>
  );
}
