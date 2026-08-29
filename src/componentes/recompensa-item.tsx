"use client";

import Link from "next/link";
import { useState } from "react";
import { Moeda } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";
import { useItemGerido } from "@/componentes/loja-estado";
import type { RecompensaDefinida } from "@/lib/pontos/tipos";

const ROTULO_DA_ENTREGA: Record<RecompensaDefinida["entrega"], string> = {
  presencial: "Retirada ou uso presencial, no Itaú Cultural.",
  digital: "Liberado na hora, dentro do app.",
  correio: "Enviado pelo correio para o endereço que você informar.",
  "no-produto": "Vale dentro do próprio app, sem envio.",
  link: "Retirada numa loja de fora, com o cupom que zera o carrinho.",
};

export function RecompensaItem({ recompensa: semente }: { recompensa: RecompensaDefinida }) {
  const { motor, hidratado } = usePontos();
  // O ITEM VIGENTE, e nao o do build: o Produtor pode ter mudado o preco ou tirado este
  // item de cartaz (2026-08-28). `null` significa retirado.
  const recompensa = useItemGerido(semente);
  const [resgatando, setResgatando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState(false);

  if (!recompensa) {
    return (
      <p className="aviso">
        Este item saiu da loja. Quem já resgatou continua com ele na carteira.
      </p>
    );
  }

  const idDoItem = recompensa.id;
  const fichas = hidratado ? motor.saldoDe("ficha") : 0;
  const faltam = recompensa.custo - fichas;
  const esgotada = recompensa.estoque !== null && recompensa.estoque <= 0;
  const podeResgatar = hidratado && faltam <= 0 && !esgotada && !feito;

  function resgatar() {
    if (!podeResgatar || resgatando) return;
    setResgatando(true);
    setErro(null);

    const rastro = motor.emitir("recompensa.resgatada", {
      tipo: "recompensa",
      // `id` fora do fecho: a funcao e hasteada e o estreitamento da guarda acima
      // nao alcanca o corpo dela.
      id: idDoItem,
    });

    const barrado = rastro.efeitos.find((e) => e.tipo === "tetoAtingido");
    if (barrado) {
      setErro(barrado.oQue);
    } else {
      setFeito(true);
    }
    setResgatando(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="folha-foto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={recompensa.imagem} alt={recompensa.imagemAlt} />
      </div>

      <div className="cartao">
        <span className="recompensa-preco text-xl">
          <Moeda />
          {recompensa.custo}
        </span>
        <p className="tipo-detalhe">{recompensa.descricao}</p>
        <p className="tipo-legenda text-tinta-2">{ROTULO_DA_ENTREGA[recompensa.entrega]}</p>
        {recompensa.estoque !== null && (
          <p className="tipo-legenda text-tinta-2">
            {recompensa.estoque > 0
              ? `${recompensa.estoque} ${recompensa.estoque === 1 ? "disponível" : "disponíveis"}`
              : "Esgotado nesta temporada."}
          </p>
        )}
      </div>

      {feito ? (
        <>
          {/* DUAS ENTREGAS, DUAS RESPOSTAS. A esteira de cinco fases descreve o que a
              casa faz; quando quem entrega é uma loja de fora, o que a pessoa precisa
              agora é o cupom e o endereço, e não um lugar para acompanhar.

              O `<a>` externo segue o gesto que o produto já usa para o botão da Sympla
              (`evento/[slug]/page.tsx`): outra aba, `rel="noreferrer"`, seta, e a legenda
              dizendo que se está saindo. Âncora que a pessoa clica não é requisição que o
              protótipo faz, e é o que sustenta a promessa de zero rede em runtime. */}
          {recompensa.entrega === "link" ? (
            <>
              <p className="aviso" data-tom="acao">
                Resgatado. Use o cupom{" "}
                <strong data-cupom-do-resgate>{recompensa.cupom || "no carrinho"}</strong>{" "}
                para zerar o carrinho.
              </p>
              <a
                href={recompensa.link}
                target="_blank"
                rel="noreferrer"
                className="botao-acao no-underline"
                data-abrir-loja-de-fora
              >
                Abrir {recompensa.lojaDeFora || "a loja"} ↗
              </a>
              <p className="tipo-legenda text-tinta-2 italic">
                Você sai do app. A retirada acontece lá.
              </p>
            </>
          ) : (
            <>
              <p className="aviso" data-tom="acao">
                Resgatado. A entrega já está na sua carteira, com as cinco etapas.
              </p>
              <Link href="/studio/pontos/" className="botao-acao no-underline">
                Acompanhar a entrega
              </Link>
            </>
          )}
        </>
      ) : (
        <>
          {erro && (
            <p className="aviso" data-tom="acao" role="alert">
              {erro}
            </p>
          )}
          <button type="button" className="botao-acao" onClick={resgatar} disabled={!podeResgatar || resgatando}>
            {resgatando
              ? "Resgatando…"
              : esgotada
                ? "Esgotado"
                : !hidratado
                  ? "Carregando saldo…"
                  : faltam > 0
                    ? `Faltam ${faltam.toLocaleString("pt-BR")} fichas`
                    : "Resgatar"}
          </button>
          {hidratado && faltam > 0 && !esgotada && (
            <p className="tipo-legenda text-tinta-2">
              Você tem {fichas.toLocaleString("pt-BR")}. Terminar um curso rende 25; confirmar
              presença num evento rende 20.
            </p>
          )}
        </>
      )}

      <p className="credito-foto">Foto: {recompensa.imagemCredito}</p>

      <Link href="/studio/pontos/loja/" className="botao-discreto no-underline self-start">
        ← Voltar às recompensas
      </Link>
    </div>
  );
}
