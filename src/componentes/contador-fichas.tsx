"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { EstrelaXp } from "@/componentes/estrela-xp";
import { Moeda } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";

/**
 * O par de saldos do cabeçalho: percurso e ficha, nessa ordem.
 *
 * O PERCURSO VEM PRIMEIRO porque é o que não gasta — ele mede quem a pessoa
 * virou, e o número só sobe. A ficha vem depois porque é o saldo que ela vai
 * gastar. Invertida, a leitura do topo passaria a ser «quanto eu tenho para
 * torrar», que é a leitura de um programa de milhagem.
 */
export function ContadorDeFichas() {
  const { motor, hidratado } = usePontos();
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  if (!hidratado) return null;

  const fichas = motor.saldoDe("ficha");
  const percurso = motor.saldoDe("percurso");
  const nivel = motor.nivel();

  return (
    <span className="barra-saldos ml-auto">
      {/* A ESTRELA ABRE UM PAINEL, e não vai direto para a escada. O número
          sozinho não responde «quanto falta»; o painel responde em duas linhas e
          oferece a tela inteira a quem quiser mais. Ir direto obrigaria a trocar
          de tela para descobrir uma coisa que cabe num toque. */}
      <span
        className="saldo-xp"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setAberto(false);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Escape") return;
          setAberto(false);
          botao.current?.focus();
        }}
      >
        <button
          type="button"
          ref={botao}
          className="saldo-pilula"
          aria-expanded={aberto}
          aria-controls="painel-do-nivel"
          aria-label={`${percurso} de percurso. Nível ${nivel.numero}, ${nivel.nome}. Ver seu nível.`}
          onClick={() => setAberto((v) => !v)}
        >
          <EstrelaXp />
          <span className="tipo-legenda font-bold">{percurso.toLocaleString("pt-BR")}</span>
        </button>

        {aberto && (
          <div id="painel-do-nivel" className="painel-nivel" role="group">
            <span className="tipo-detalhe font-bold">
              Nível {nivel.numero} · {nivel.nome}
            </span>
            <span className="nivel-barra">
              <span
                className="nivel-preenchimento"
                style={{ width: `${nivel.fracao * 100}%` }}
              />
            </span>
            <span className="tipo-legenda text-tinta-2">
              {nivel.noTopo
                ? "Você chegou ao último degrau da escada."
                : `Faltam ${nivel.falta.toLocaleString("pt-BR")} de percurso para o nível ${nivel.numero + 1}`}
            </span>
            <Link
              href="/desafios/niveis/"
              className="botao-acao no-underline"
              onClick={() => setAberto(false)}
            >
              Ver todos os níveis
            </Link>
          </div>
        )}
      </span>

      <Link
        href="/meu/carteira/"
        className="saldo-pilula no-underline"
        aria-label={`${fichas} fichas. Abrir a carteira.`}
      >
        <Moeda />
        <span className="tipo-legenda font-bold">{fichas.toLocaleString("pt-BR")}</span>
      </Link>
    </span>
  );
}
