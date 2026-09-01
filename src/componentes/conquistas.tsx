"use client";

import { Moeda, Painel } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";
import { CONFIG, REGRAS } from "@/dados/pontos";
import { progressoDoCriterio } from "@/lib/pontos/emblemas";

export function Conquistas() {
  const { motor } = usePontos();

  const estado = motor.atual;
  const ganhos = new Set(estado.emblemas.map((e) => e.emblemaId));

  return (
    <div className="flex flex-col gap-5">
      <Painel titulo="Emblemas">
        <div className="grid gap-3 desk:grid-cols-2">
          {motor.catalogo.emblemas.map((emblema) => {
            const ganho = ganhos.has(emblema.id);
            const { atual, alvo } = progressoDoCriterio(estado, CONFIG, emblema.criterio);

            return (
              <div key={emblema.id} className="emblema" data-ganho={ganho ? "sim" : "nao"}>
                <span className="tipo-detalhe font-bold">{emblema.titulo}</span>
                <span className="tipo-legenda text-tinta-2">
                  {ganho ? emblema.descricao : emblema.comoGanhar}
                </span>
                {!ganho && (
                  <span className="tipo-legenda text-tinta-3">
                    {Math.min(atual, alvo)} de {alvo}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Painel>

      <Painel titulo="Como se ganha ficha">
        <ul className="extrato-lista">
          {REGRAS.map((regra) => {
            const conceder = regra.entao.find((a) => "conceder" in a && a.conceder.ativo === "ficha");
            const fichas = conceder && "conceder" in conceder ? conceder.conceder.valor : 0;

            return (
              <li key={regra.id} className="extrato-linha">
                <span className="tipo-detalhe">
                  {regra.descreve}
                  {regra.maxPorDia !== undefined && (
                    <span className="tipo-legenda text-tinta-3"> · até {regra.maxPorDia}/dia</span>
                  )}
                </span>
                <span className="extrato-valor saldo-linha" data-sentido="credito">
                  {fichas > 0 ? (
                    <>
                      <Moeda />
                      {fichas}
                    </>
                  ) : (
                    <span className="tipo-legenda">percurso</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="tipo-legenda text-tinta-2">
          Terminar algo de uma linguagem que você ainda não atravessou rende{" "}
          {CONFIG.bonus.linguagemNova} fichas a mais. De um estado novo, {CONFIG.bonus.territorioNovo}.
          O mesmo item nunca conta duas vezes.
        </p>
      </Painel>
    </div>
  );
}
