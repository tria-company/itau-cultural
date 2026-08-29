"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { usePainelDeResgates } from "@/componentes/loja-estado";
import { usePontos } from "@/contexto/pontos";
import { FASES_DE_ENTREGA } from "@/dados/recompensas";
import type { FaseDoResgate } from "@/lib/pontos/tipos";

/**
 * loja-gestao.tsx — quem resgatou o quê, quando, e em que pé está a entrega.
 *
 * O CATÁLOGO SAIU DAQUI em 28/08 e foi para a vitrine; em 29/08 ele saiu da vitrine também
 * e foi para `/studio/minha-loja/`, junto com esta tela. O que ficou provado nas duas
 * mudanças: gestão de item mora onde o item se desenha, e o que é gestão mora no Studio.
 *
 * O que sobra é o que é lista e não cabe num cartão: o histórico de resgates, com quem,
 * quando, quanto pagou e a esteira. O relógio do motor é virtual e ancorado, e os dois
 * botões de avançar existem para a esteira poder andar na frente de quem assiste.
 */

/** A data virtual do motor, escrita como gente lê. */
function quando(em: number): string {
  const d = new Date(em);
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${dois(d.getDate())}.${dois(d.getMonth() + 1)}.${d.getFullYear()} · ${dois(
    d.getHours(),
  )}h${dois(d.getMinutes())}`;
}

function proximaFase(fase: FaseDoResgate): FaseDoResgate | null {
  const i = FASES_DE_ENTREGA.findIndex((f) => f.id === fase);
  const seguinte = FASES_DE_ENTREGA[i + 1];
  return seguinte ? seguinte.id : null;
}

export function GestaoDaLoja() {
  const { motor, hidratado } = usePontos();
  const [dia, setDia] = useState(0);
  const painel = usePainelDeResgates(hidratado ? motor.lerVersao() + dia : 0);

  const fichas = useMemo(
    () => painel.linhas.reduce((n, l) => n + (l.resgate.custoPago ?? 0), 0),
    [painel.linhas],
  );
  const entregues = useMemo(
    () => painel.linhas.filter((l) => l.resgate.fase === "entregue").length,
    [painel.linhas],
  );

  return (
    <>
      <header className="prod-cabecalho" data-coluna-de-leitura>
        <div className="prod-cabecalho-linha">
          <Link
            href="/studio/minha-loja/"
            className="prod-superficie prod-voltar"
            data-voltar-studio
          >
            <span className="prod-voltar-texto">‹ Loja</span>
            <span className="prod-voltar-x" aria-hidden>
              ✕
            </span>
          </Link>
          <span className="prod-contagem">
            {painel.linhas.length} {painel.linhas.length === 1 ? "resgate" : "resgates"}
          </span>
        </div>
        <h1 className="prod-titulo">Resgates</h1>
      </header>

      <div className="prod-corpo" data-gestao-da-loja>
        <div className="prod-inicio-stats" data-numeros-dos-resgates>
          <span className="prod-inicio-stat">
            <strong>{painel.linhas.length}</strong>
            <span>{painel.linhas.length === 1 ? "resgate" : "resgates"}</span>
          </span>
          <span className="prod-inicio-stat">
            <strong>{fichas}</strong>
            <span>fichas gastas</span>
          </span>
          <span className="prod-inicio-stat">
            <strong>{entregues}</strong>
            <span>{entregues === 1 ? "entregue" : "entregues"}</span>
          </span>
        </div>

        {painel.linhas.length === 0 ? (
          <div className="prod-vazio">
            <p className="prod-vazio-frase">Nenhum resgate ainda.</p>
          </div>
        ) : (
          <section className="prod-secao">
            {painel.linhas.map((l) => {
              const seguinte = proximaFase(l.resgate.fase);
              const daContaAberta = hidratado && l.personaId === motor.atual.personaId;
              return (
                <div
                  className="prod-vinculo"
                  key={`${l.personaId}:${l.resgate.id}`}
                  data-resgate={l.resgate.id}
                >
                  <span className="prod-registro-corpo">
                    <strong className="prod-registro-titulo">
                      {l.resgate.titulo ?? l.resgate.recompensaId}
                    </strong>
                    <span className="prod-registro-meta">
                      {l.personaNome} · {quando(l.resgate.em)} ·{" "}
                      {l.resgate.custoPago ?? 0} fichas
                    </span>
                  </span>
                  <span className="prod-registro-acoes">
                    <span className="prod-situacao" data-situacao="publicado">
                      {FASES_DE_ENTREGA.find((f) => f.id === l.resgate.fase)?.rotulo ??
                        l.resgate.fase}
                    </span>
                    {seguinte && daContaAberta ? (
                      <BotaoDoStudio
                        curto
                        aoClicar={() => motor.moverResgate(l.resgate.id, seguinte)}
                        data-acao="avancar-fase"
                      >
                        avançar
                      </BotaoDoStudio>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </section>
        )}

        <div className="prod-linha-de-acao">
          <BotaoDoStudio
            curto
            aoClicar={() => {
              motor.avancarDias(1);
              setDia((d) => d + 1);
            }}
            data-avancar-um-dia
          >
            Avançar 1 dia
          </BotaoDoStudio>
          <BotaoDoStudio
            curto
            aoClicar={() => {
              motor.avancarDias(7);
              setDia((d) => d + 7);
            }}
            data-avancar-uma-semana
          >
            Avançar 7 dias
          </BotaoDoStudio>
        </div>
      </div>
    </>
  );
}
