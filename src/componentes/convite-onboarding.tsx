"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSessao } from "@/contexto/sessao";

/**
 * convite-onboarding.tsx — o convite que aparece logo depois de entrar.
 *
 * POR QUE UM POP-UP, se o convite já existe no feed. Porque são momentos diferentes: o
 * cartão do feed é passivo e espera ser notado; este aparece no instante em que a pessoa
 * acabou de decidir que quer estar aqui — e é o único instante em que semear parece
 * consequência natural de ter entrado, e não tarefa extra.
 *
 * ELE TEM SAÍDA, E A SAÍDA É REAL. «Agora não» fecha, não volta nesta sessão, e o cartão
 * do feed continua lá para quem mudar de ideia. Modal sem escape é o padrão escuro que
 * transforma convite em pedágio — e a entrada já é obrigatória; a semeadura não precisa
 * ser.
 *
 * APARECE UMA VEZ. A marca fica em `sessionStorage`, não em `localStorage`: recusar hoje
 * não deve calar o convite para sempre, e quem volta amanhã merece ser perguntado de novo.
 *
 * LEITURA SÓ DEPOIS DE MONTAR. `sessionStorage` no render faria o HTML exportado divergir
 * da página hidratada — o mesmo defeito que a casa já corrigiu duas vezes.
 */

const CHAVE = "convite-onboarding-visto";

export function ConviteOnboarding() {
  const router = useRouter();
  const { hidratado } = useSessao();
  const [aberto, setAberto] = useState(false);
  const primeiro = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!hidratado) return;
    let visto = true;
    try {
      visto = sessionStorage.getItem(CHAVE) === "sim";
    } catch {
      // Janela privada ou storage bloqueado: não insistir é melhor que repetir.
      visto = true;
    }
    if (!visto) setAberto(true);
  }, [hidratado]);

  useEffect(() => {
    if (aberto) primeiro.current?.focus();
  }, [aberto]);

  function fechar() {
    try {
      sessionStorage.setItem(CHAVE, "sim");
    } catch {
      // Sem storage o convite volta na próxima navegação. É pior que o ideal e melhor
      // que quebrar a tela por causa de uma preferência de navegador.
    }
    setAberto(false);
  }

  if (!aberto) return null;

  return (
    <div
      className="convite-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="convite-modal-titulo"
      onKeyDown={(e) => {
        if (e.key === "Escape") fechar();
      }}
    >
      <button type="button" className="convite-modal-fundo" aria-label="Fechar" onClick={fechar} />

      <div className="convite-modal-folha">
        <span className="convite-modal-mosaico" aria-hidden="true">
          {CAPAS.map((capa) => (
            <img key={capa} src={`/acervo/${capa}`} alt="" loading="lazy" />
          ))}
        </span>
        <span className="convite-modal-veu" aria-hidden="true" />

        <div className="convite-modal-corpo">
          <h2 id="convite-modal-titulo" className="convite-modal-titulo">
            Queremos conhecer você melhor
          </h2>
          <p className="convite-modal-texto">
            São três toques para o acervo deixar de ser genérico e passar a ser seu.
          </p>

          <button
            ref={primeiro}
            type="button"
            className="convite-modal-primario"
            onClick={() => {
              fechar();
              router.push("/onboarding/2/");
            }}
          >
            Escolher o que te interessa
          </button>

          <button type="button" className="convite-modal-pular" onClick={fechar}>
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

/** As mesmas seis capas do convite no feed, por passo fixo — nunca sorteadas. */
const CAPAS: readonly string[] = [
  "00353485916976e8.jpg",
  "2ad9c5a3dc7aba46.jpeg",
  "570d00b961da83b4.jpg",
  "7fa0f481355e9b63.jpeg",
  "a987698beeb72b46.jpg",
  "d46fb4aabf7493f9.jpg",
];
