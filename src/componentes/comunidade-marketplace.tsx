"use client";

import Link from "next/link";
import { useState } from "react";
import { usePontos } from "@/contexto/pontos";
import { comunidadesDoMarketplace, comunidadesPorUf } from "@/dados/comunidade";

export function Marketplace() {
  const { motor, hidratado } = usePontos();
  const [soAssinadas, setSoAssinadas] = useState(false);

  const assinadas = hidratado ? motor.atual.assinadas : [];
  const grupos = comunidadesPorUf();
  const total = comunidadesDoMarketplace().length;

  function assinar(id: string) {
    motor.emitir("comunidade.assinada", { tipo: "comunidade", id });
  }

  const visiveis = grupos
    .map((g) => ({
      ...g,
      comunidades: soAssinadas
        ? g.comunidades.filter((c) => assinadas.includes(c.id))
        : g.comunidades,
    }))
    .filter((g) => g.comunidades.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="saldo-painel">
        <p className="tipo-detalhe">
          {total} comunidades de produtores e organizações, em {grupos.length} estados. Cada uma é
          uma instituição ou coletivo que já está no acervo.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="botao-discreto"
            data-ativo={soAssinadas ? "nao" : "sim"}
            aria-pressed={!soAssinadas}
            onClick={() => setSoAssinadas(false)}
          >
            Todas
          </button>
          <button
            type="button"
            className="botao-discreto"
            data-ativo={soAssinadas ? "sim" : "nao"}
            aria-pressed={soAssinadas}
            onClick={() => setSoAssinadas(true)}
          >
            Que eu assino · {assinadas.filter((id) => id !== "ic").length}
          </button>
        </div>
      </div>

      {visiveis.length === 0 ? (
        <p className="aviso">
          Você ainda não assina nenhuma comunidade. Toque em «Todas» para ver as {total}.
        </p>
      ) : (
        visiveis.map((grupo) => (
          <section key={grupo.uf} className="flex flex-col gap-2">
            <h2 className="tipo-detalhe font-bold">{grupo.uf}</h2>
            <div className="flex flex-col gap-2">
              {grupo.comunidades.map((c) => {
                const assinada = assinadas.includes(c.id);
                return (
                  <div key={c.id} className="comunidade-cartao">
                    <span className="uf-selo">{c.uf}</span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Link href={`/studio/comunidade/${c.id}/`} className="tipo-detalhe font-bold no-underline">
                        {c.nome}
                      </Link>
                      <span className="tipo-legenda text-tinta-2">{c.descricao}</span>
                      <span className="tipo-legenda text-tinta-3">
                        {c.assinantes.toLocaleString("pt-BR")} pessoas
                      </span>
                    </div>
                    <button
                      type="button"
                      className="botao-discreto"
                      data-ativo={assinada ? "sim" : "nao"}
                      onClick={() => assinar(c.id)}
                      disabled={assinada || !hidratado}
                    >
                      {assinada ? "Assinando" : "Assinar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
