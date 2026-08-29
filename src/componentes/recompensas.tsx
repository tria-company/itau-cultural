"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Moeda } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";
import { useVitrineGerida } from "@/componentes/loja-estado";
import { FAMILIAS, recompensasDaFamilia } from "@/dados/recompensas";
import type { RecompensaDefinida } from "@/lib/pontos/tipos";

const ROTULO_DA_ENTREGA: Record<RecompensaDefinida["entrega"], string> = {
  presencial: "Retirada ou uso presencial, no Itaú Cultural.",
  digital: "Liberado na hora, dentro do app.",
  correio: "Enviado pelo correio para o endereço que você informar.",
  "no-produto": "Vale dentro do próprio app, sem envio.",
  link: "Retirada numa loja de fora, com o cupom que zera o carrinho.",
};

function Cartao({
  recompensa,
  fichas,
  aoAbrir,
}: {
  recompensa: RecompensaDefinida;
  fichas: number;
  aoAbrir: () => void;
}) {
  const esgotada = recompensa.estoque !== null && recompensa.estoque <= 0;
  const alcancavel = fichas >= recompensa.custo && !esgotada;

  return (
    <button
      type="button"
      className="recompensa-cartao"
      data-alcancavel={alcancavel ? "sim" : "nao"}
      onClick={aoAbrir}
    >
      <span className="recompensa-foto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={recompensa.imagem} alt={recompensa.imagemAlt} loading="lazy" />
      </span>
      <span className="recompensa-corpo">
        <span className="tipo-detalhe font-bold">{recompensa.titulo}</span>
        <span className="recompensa-resumo">{recompensa.descricao}</span>
        <span className="recompensa-preco mt-auto">
          <Moeda />
          {recompensa.custo}
        </span>
        {esgotada ? (
          <span className="recompensa-falta">esgotado</span>
        ) : alcancavel ? (
          <span className="tipo-legenda font-bold text-acao-tinta">dá para resgatar</span>
        ) : (
          <span className="recompensa-falta">
            faltam {(recompensa.custo - fichas).toLocaleString("pt-BR")}
          </span>
        )}
      </span>
    </button>
  );
}

function FolhaDoItem({
  recompensa,
  aoFechar,
}: {
  recompensa: RecompensaDefinida;
  aoFechar: () => void;
}) {
  const { motor, hidratado } = usePontos();
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState(false);
  const [alvo, setAlvo] = useState<HTMLElement | null>(null);

  // A folha é entregue DENTRO da moldura do telefone, não no `body`. Sem isto
  // ela se ancora na janela e abre por cima do aparelho desenhado na tela.
  // Fora da visão app a moldura não existe e a janela é o ancoradouro certo.
  useEffect(() => {
    setAlvo(document.querySelector<HTMLElement>(".moldura") ?? document.body);
  }, []);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") aoFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  if (!alvo) return null;

  const fichas = hidratado ? motor.saldoDe("ficha") : 0;
  const faltam = recompensa.custo - fichas;
  const esgotada = recompensa.estoque !== null && recompensa.estoque <= 0;
  const podeResgatar = hidratado && faltam <= 0 && !esgotada && !feito;

  function resgatar() {
    if (!podeResgatar) return;
    setErro(null);
    const rastro = motor.emitir("recompensa.resgatada", {
      tipo: "recompensa",
      id: recompensa.id,
    });
    const barrado = rastro.efeitos.find((e) => e.tipo === "tetoAtingido");
    if (barrado) setErro(barrado.oQue);
    else setFeito(true);
  }

  return createPortal(
    <div
      className="folha-fundo"
      data-solta={alvo === document.body ? "sim" : "nao"}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`folha-${recompensa.id}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div className="folha-item">
        <div className="folha-foto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={recompensa.imagem} alt={recompensa.imagemAlt} />
          <button type="button" className="folha-fechar" onClick={aoFechar} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="folha-corpo">
          <h2 id={`folha-${recompensa.id}`} className="tipo-titulo-3 font-bold">
            {recompensa.titulo}
          </h2>
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
              <button
                type="button"
                className="botao-acao"
                onClick={resgatar}
                disabled={!podeResgatar}
              >
                {esgotada
                  ? "Esgotado"
                  : !hidratado
                    ? "Carregando saldo…"
                    : faltam > 0
                      ? `Faltam ${faltam.toLocaleString("pt-BR")} fichas`
                      : "Resgatar"}
              </button>
              {/* Saldo insuficiente não pode ser um beco: a saída fica logo abaixo
                  do botão travado, e leva para onde as fichas são ganhas. */}
              {hidratado && faltam > 0 && !esgotada && (
                <>
                  <Link href="/studio/comunidade/" className="botao-acao no-underline">
                    Ganhar fichas
                  </Link>
                  <p className="tipo-legenda text-tinta-2">
                    Você tem {fichas.toLocaleString("pt-BR")}. Concluir um curso rende 25 fichas;
                    confirmar presença num evento, 20.
                  </p>
                </>
              )}
            </>
          )}

          <p className="credito-foto">Foto: {recompensa.imagemCredito}</p>
        </div>
      </div>
    </div>,
    alvo,
  );
}

export function Recompensas({
  hoje,
  /** O que o dono da loja pode fazer com CADA item. `undefined` some da tela. */
  acoesDoItem,
  /** O botao de criar item, montado por quem sabe se a loja e sua. */
  acaoDeCriar,
}: {
  hoje: string;
  acoesDoItem?: (r: RecompensaDefinida) => ReactNode;
  acaoDeCriar?: ReactNode;
}) {
  const { motor, hidratado } = usePontos();
  const [aberta, setAberta] = useState<RecompensaDefinida | null>(null);

  // A VITRINE OBEDECE A GESTAO do Produtor (2026-08-28). O gancho reconcilia o array
  // `RECOMPENSAS` com o armazem `produtor.loja.v1` e repinta esta tela quando ele muda;
  // a linha que filtra por familia, logo abaixo, continua igual a do ramo de origem.
  useVitrineGerida(hoje, motor.atual.resgates, motor.lerVersao(), hidratado);

  const fichas = hidratado ? motor.saldoDe("ficha") : 0;
  const fechar = useCallback(() => setAberta(null), []);

  return (
    <div className="flex flex-col gap-5">
      {/* CRIAR MORA NA VITRINE, que e onde o item vai aparecer. */}
      {acaoDeCriar ? <div className="recompensa-criar">{acaoDeCriar}</div> : null}

      {FAMILIAS.map((familia) => {
        const itens = recompensasDaFamilia(familia.id);
        if (itens.length === 0) return null;

        return (
          <section key={familia.id} className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <h2 className="tipo-detalhe font-bold">{familia.rotulo}</h2>
              <p className="tipo-legenda text-tinta-2">{familia.resumo}</p>
            </div>
            <div className="recompensa-grade">
              {itens.map((r) => (
                // O cartao e um <button>, e botao nao aninha botao: o lapis de quem
                // opera a loja vai por FORA dele, sobreposto no canto da foto.
                <div className="recompensa-item" key={r.id}>
                  <Cartao recompensa={r} fichas={fichas} aoAbrir={() => setAberta(r)} />
                  {acoesDoItem ? (
                    <div className="recompensa-dono">{acoesDoItem(r)}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {aberta && <FolhaDoItem recompensa={aberta} aoFechar={fechar} />}
    </div>
  );
}
