"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useSessao } from "@/contexto/sessao";

/**
 * entrar.tsx — a entrada da plataforma.
 *
 * A TELA INTEIRA É A IMAGEM, e isso é decisão. Uma faixa de foto no topo com uma lista de
 * botões embaixo é formulário com enfeite; a entrada de um produto cultural é o primeiro
 * lugar onde o acervo aparece, e ele aparece em tela cheia, com o formulário flutuando por
 * cima. É a única tela do produto em que a foto não divide espaço com nada.
 *
 * TRÊS DECISÕES QUE ELA CARREGA:
 *
 * 1. **E-mail e senha primeiro, social depois.** Quem já tem conta entra sem pensar; a
 *    alternativa fica abaixo, separada por uma linha. O contrário — social em cima,
 *    formulário escondido — empurra para provedor de terceiro quem já é da casa.
 *
 * 2. **Entrar é obrigatório.** Não há saída lateral para o conteúdo: a plataforma pede
 *    conta antes de mostrar o acervo. Decisão do cliente em 26.08, e ela muda o funil —
 *    quem chega por link compartilhado passa por aqui.
 */

export function Entrar() {
  const router = useRouter();
  const { hidratado } = useSessao();
  const [enviando, setEnviando] = useState(false);

  const entrar = useCallback(() => {
    setEnviando(true);
    // Armar o convite de semeadura para a próxima tela. `sessionStorage` e não
    // `localStorage`: quem recusar hoje volta a ser perguntado amanhã.
    try {
      sessionStorage.removeItem("convite-onboarding-visto");
    } catch {
      // Sem storage o convite simplesmente não arma. Não é motivo para travar a entrada.
    }
    router.push("/descobrir/");
  }, [router]);

  return (
    <div className="entrar">
      {/* MOTION DE FUNDO, ARQUIVO LOCAL. Nada de `<iframe>` de terceiro: o README declara
          «requisições externas em execução: zero», e a entrada não pode ser a tela que
          quebra a afirmação. O `poster` é a capa do acervo — ela aparece enquanto o vídeo
          carrega e fica no lugar dele em `prefers-reduced-motion`. */}
      <video
        className="entrar-fundo"
        src="/entrada/motion.mp4"
        poster="/hub/heroi.jpg"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="entrar-veu" />

      <div className="entrar-painel">
        <header className="entrar-marca">
          <img src="/marca/itau-cultural-negativo.svg" alt="Itaú Cultural" className="entrar-logo" />
        </header>

        <form
          className="entrar-forma"
          onSubmit={(e) => {
            e.preventDefault();
            entrar();
          }}
        >
          <label className="entrar-campo">
            <span className="entrar-campo-rotulo">E-mail</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="seu@email.com"
              className="entrar-entrada"
            />
          </label>

          <label className="entrar-campo">
            <span className="entrar-campo-rotulo">Senha</span>
            <input
              type="password"
              name="senha"
              autoComplete="current-password"
              placeholder="••••••••"
              className="entrar-entrada"
            />
          </label>

          <button type="submit" className="entrar-primario" disabled={!hidratado || enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </button>

          <button type="button" className="entrar-elo entrar-elo-centro">
            Esqueci minha senha
          </button>
        </form>

        <div className="entrar-ou">
          <span>ou</span>
        </div>

        <div className="entrar-sociais">
          <button type="button" className="entrar-social" data-provedor="google" onClick={entrar}>
            <span aria-hidden="true" className="entrar-social-glifo">G</span>
            Continuar com Google
          </button>
          <button type="button" className="entrar-social" data-provedor="apple" onClick={entrar}>
            <span aria-hidden="true" className="entrar-social-glifo"></span>
            Continuar com Apple
          </button>
        </div>

        <p className="entrar-criar">
          Ainda não tem conta?{" "}
          <button type="button" className="entrar-elo" onClick={() => router.push("/entrar/criar/")}>
            Criar conta
          </button>
        </p>

      </div>
    </div>
  );
}
