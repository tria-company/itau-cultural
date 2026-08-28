"use client";

import type { ReactNode } from "react";
import { CONFIG } from "@/dados/pontos";
import type { Nivel } from "@/lib/pontos/niveis";
import type { FaseDaSequencia } from "@/lib/pontos/tipos";

/** A moeda do programa, desenhada em CSS. */
export function Moeda() {
  return <span className="ficha-moeda" aria-hidden="true" />;
}

export function Fichas({ quantas }: { quantas: number }) {
  return (
    <span className="saldo-linha">
      <Moeda />
      <span>{quantas.toLocaleString("pt-BR")}</span>
    </span>
  );
}

export function BarraDeNivel({ nivel }: { nivel: Nivel }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="tipo-detalhe font-bold">{nivel.nome}</span>
        <span className="tipo-legenda text-tinta-2">
          {nivel.noTopo
            ? "nível máximo"
            : `faltam ${nivel.falta.toLocaleString("pt-BR")} de ${CONFIG.termos.percurso}`}
        </span>
      </div>
      <div
        className="nivel-barra"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(nivel.fracao * 100)}
        aria-label={`Progresso até o próximo nível: ${Math.round(nivel.fracao * 100)}%`}
      >
        <span className="nivel-preenchimento" style={{ width: `${nivel.fracao * 100}%` }} />
      </div>
    </div>
  );
}

const ROTULO_DA_FASE: Record<FaseDaSequencia, string> = {
  segura: "em dia",
  "em-risco": "termina no domingo",
  carencia: "carência — dá para recuperar",
  congelada: "congelada por uma proteção",
  quebrada: "recomeça no próximo gesto",
};

export function SeloDaSequencia({ fase }: { fase: FaseDaSequencia }) {
  return (
    <span className="sequencia-estado" data-fase={fase}>
      {ROTULO_DA_FASE[fase]}
    </span>
  );
}

const DIAS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

export function SemanaDaSequencia({ marcas }: { marcas: boolean[] }) {
  return (
    <div className="sequencia-semana">
      {DIAS.map((dia, i) => (
        <div key={dia} className="sequencia-dia">
          <span
            className="sequencia-marca"
            data-marcada={marcas[i] ? "sim" : "nao"}
            aria-hidden="true"
          />
          <span>{dia}</span>
        </div>
      ))}
      <span className="sr-only">
        {marcas.filter(Boolean).length} de 7 dias com atividade nesta semana.
      </span>
    </div>
  );
}

export function Painel({
  titulo,
  acao,
  children,
}: {
  titulo: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="estante">
      <div className="estante-cabeca">
        <h2 className="estante-titulo">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="aviso">{children}</p>;
}
