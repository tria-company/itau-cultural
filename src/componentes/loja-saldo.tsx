"use client";

import Link from "next/link";
import { Fichas } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";

/**
 * loja-saldo.tsx — quanto você tem, no alto da vitrine, e a porta da Carteira.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A CARTEIRA DEIXOU DE SER SUB-MENU (29/08/2026). A aba Loja tinha dois filhos na coluna,
 * «Carteira» e «Resgates»; Resgates virou tela do Studio, e um sub-menu de um item só é
 * pior que nenhum. Sobrou a pergunta que faz alguém abrir a Carteira, que é «quanto eu
 * tenho» — e ela se responde aqui em cima, onde a pessoa já está olhando para preços.
 *
 * O saldo é o link. Quem quiser o extrato, o nível e as entregas clica no número.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function SaldoDaLoja() {
  const { motor, hidratado } = usePontos();

  return (
    <Link href="/studio/pontos/" className="prod-vinculo" data-saldo-da-loja>
      <span className="prod-registro-corpo">
        <strong className="prod-registro-titulo">
          {hidratado ? <Fichas quantas={motor.saldoDe("ficha")} /> : "—"}
        </strong>
        <span className="prod-registro-meta">
          {hidratado
            ? `nível ${motor.nivel().numero} · ${motor.nivel().nome}`
            : "somando as suas fichas"}
        </span>
      </span>
      <span className="prod-registro-acoes">
        <span className="pastilha">Carteira ›</span>
      </span>
    </Link>
  );
}
