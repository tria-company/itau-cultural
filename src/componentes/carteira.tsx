"use client";

import Link from "next/link";
import { useState } from "react";
import { BarraDeNivel, Fichas, Moeda, Painel, SeloDaSequencia, SemanaDaSequencia, Vazio } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";
import { FASES_DE_ENTREGA, recompensaPorId } from "@/dados/recompensas";
import { CONFIG } from "@/dados/pontos";
import { extrato } from "@/lib/pontos/livro";
import type { Ativo, FaseDoResgate, Resgate } from "@/lib/pontos/tipos";

const ROTULO_DO_ATIVO: Record<Ativo, string> = {
  ficha: "Fichas",
  percurso: "Percurso",
  reputacao: "Reputação",
};

function Esteira({ fase }: { fase: FaseDoResgate }) {
  const atual = FASES_DE_ENTREGA.findIndex((f) => f.id === fase);
  return (
    <div className="esteira">
      {FASES_DE_ENTREGA.map((etapa, i) => (
        <div key={etapa.id} className="esteira-etapa" data-alcancada={i <= atual ? "sim" : "nao"}>
          <span className="esteira-trilho" />
          <span>{etapa.rotulo}</span>
        </div>
      ))}
    </div>
  );
}

function CartaoDeResgate({ resgate }: { resgate: Resgate }) {
  // O RECIBO E DO RESGATE, nao do catalogo. Ele lia o catalogo vigente e sumia com
  // `return null` quando o item saia da loja; desde que o produtor pode tirar item e
  // mudar preco (2026-08-28), isso apagaria da carteira uma compra que aconteceu.
  const recompensa = recompensaPorId(resgate.recompensaId);
  const titulo = resgate.titulo ?? recompensa?.titulo ?? "Item fora da loja";
  const custo = resgate.custoPago ?? recompensa?.custo ?? 0;

  return (
    <li className="cartao">
      <div className="flex items-baseline justify-between gap-2">
        <span className="tipo-detalhe font-bold">{titulo}</span>
        <span className="tipo-legenda text-tinta-2 saldo-linha">
          <Moeda /> {custo}
        </span>
      </div>
      {/* RESGATE POR LINK NÃO TEM ESTEIRA. Cinco degraus todos acesos, num pedido que
          nunca teve etapa, seria a tela contando uma entrega que a casa não fez. O que ele
          tem é o cupom, e a porta para onde a retirada acontece de verdade. */}
      {resgate.link ? (
        <>
          <p className="tipo-legenda text-tinta-2">
            Cupom <strong data-cupom-do-recibo>{resgate.cupom || "no carrinho"}</strong>
          </p>
          <a
            href={resgate.link}
            target="_blank"
            rel="noreferrer"
            className="tipo-legenda"
            data-abrir-loja-de-fora
          >
            Abrir {resgate.lojaDeFora || "a loja"} ↗
          </a>
        </>
      ) : (
        <Esteira fase={resgate.fase} />
      )}
    </li>
  );
}

export function Carteira() {
  const { motor, hidratado, persistido } = usePontos();
  const [aba, setAba] = useState<Ativo>("ficha");

  if (!hidratado) {
    return <div className="saldo-painel" aria-busy="true" style={{ minHeight: "12rem" }} />;
  }

  const fichas = motor.saldoDe("ficha");
  const nivel = motor.nivel();
  const sequencia = motor.atual.sequencia;
  const linhas = extrato(motor.atual, aba);
  const resgates = motor.atual.resgates;

  return (
    <div className="flex flex-col gap-5">
      <div className="saldo-painel">
        <div className="flex flex-col gap-1">
          <span className="tipo-legenda text-tinta-2">Suas {CONFIG.termos.fichaPlural}</span>
          <span className="saldo-numero">
            <Moeda />
            {fichas.toLocaleString("pt-BR")}
          </span>
        </div>

        <BarraDeNivel nivel={nivel} />

        <div className="saldo-grade">
          <div className="saldo-celula">
            <span className="saldo-celula-valor">{motor.saldoDe("percurso").toLocaleString("pt-BR")}</span>
            <span className="tipo-legenda text-tinta-2">de percurso</span>
          </div>
          <div className="saldo-celula">
            <span className="saldo-celula-valor">{motor.saldoDe("reputacao").toLocaleString("pt-BR")}</span>
            <span className="tipo-legenda text-tinta-2">de reputação</span>
          </div>
          <div className="saldo-celula">
            <span className="saldo-celula-valor">{motor.atual.linguagensAlcancadas.length}</span>
            <span className="tipo-legenda text-tinta-2">linguagens atravessadas</span>
          </div>
          <div className="saldo-celula">
            <span className="saldo-celula-valor">{motor.atual.ufsAlcancadas.length}</span>
            <span className="tipo-legenda text-tinta-2">estados alcançados</span>
          </div>
        </div>

        <Link href="/studio/pontos/loja/" className="botao-acao no-underline">
          Ver o que dá para resgatar
        </Link>
      </div>

      <Painel titulo="Sequência" acao={<SeloDaSequencia fase={sequencia.fase} />}>
        <div className="flex items-baseline gap-2">
          <span className="saldo-celula-valor">{sequencia.contagem}</span>
          <span className="tipo-detalhe text-tinta-2">
            semanas seguidas · melhor: {sequencia.melhor} · {sequencia.protecoes}{" "}
            {sequencia.protecoes === 1 ? "proteção" : "proteções"}
          </span>
        </div>
        <SemanaDaSequencia marcas={sequencia.marcas} />
        <p className="tipo-legenda text-tinta-2">
          Basta um gesto por semana: terminar algo, ler uma matéria inteira ou confirmar presença
          num evento.
        </p>
      </Painel>

      <Painel titulo="Entregas">
        {resgates.length === 0 ? (
          <Vazio>
            Nada resgatado ainda. Quando você resgatar, a entrega aparece aqui com as cinco etapas.
          </Vazio>
        ) : (
          <ul className="flex list-none flex-col gap-3 p-0">
            {resgates.map((r) => (
              <CartaoDeResgate key={r.id} resgate={r} />
            ))}
          </ul>
        )}
      </Painel>

      <Painel titulo="Extrato">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ROTULO_DO_ATIVO) as Ativo[]).map((ativo) => (
            <button
              key={ativo}
              type="button"
              className="botao-discreto"
              data-ativo={aba === ativo ? "sim" : "nao"}
              aria-pressed={aba === ativo}
              onClick={() => setAba(ativo)}
            >
              {ROTULO_DO_ATIVO[ativo]}
            </button>
          ))}
        </div>

        {linhas.length === 0 ? (
          <Vazio>Nenhum movimento de {ROTULO_DO_ATIVO[aba].toLowerCase()} ainda.</Vazio>
        ) : (
          <ul className="extrato-lista">
            {linhas.map((linha) => (
              <li key={linha.id} className="extrato-linha">
                <span className="tipo-detalhe">{linha.motivo}</span>
                <span className="extrato-valor" data-sentido={linha.sentido}>
                  {linha.sentido === "credito" ? "+" : "−"}
                  {linha.valor.toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="tipo-legenda text-tinta-2">
          Cada linha aponta para o gesto que a originou. O saldo é a soma delas, nunca um número
          guardado à parte.
        </p>
      </Painel>

      {!persistido && (
        <p className="aviso" data-tom="acao">
          Este navegador não está guardando o seu saldo — ele vale só nesta aba.
        </p>
      )}
    </div>
  );
}
