"use client";

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

/**
 * guarda-de-erro.tsx, a tela que conta o que quebrou em vez de morrer em branco.
 *
 * NASCEU DE UMA TELA BRANCA EM PRODUÇÃO (2026-08-27): um registro gravado por versão
 * antiga derrubava o render, o React desmontava a árvore inteira, e quem estava usando
 * via o vazio, sem mensagem, sem saída. Uma demonstração que quebra em silêncio quebra
 * duas vezes: a tela e a confiança.
 *
 * A guarda captura o erro de render, DIZ qual foi (a mensagem inteira, porque é ela que
 * permite consertar), e oferece as duas saídas honestas: recarregar, e recomeçar a
 * demonstração apagando o estado gravado deste navegador.
 */
export class GuardaDeErro extends Component<
  { children: ReactNode },
  { erro: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro: Error) {
    return { erro };
  }

  override componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error("GuardaDeErro capturou:", erro, info.componentStack);
  }

  override render() {
    if (this.state.erro === null) return this.props.children;

    return (
      <div className="prod-erro" role="alert" data-erro-capturado>
        <p className="prod-erro-titulo">A tela quebrou ao desenhar.</p>
        <p className="prod-erro-corpo">
          O erro está aqui embaixo, inteiro, porque é ele que permite consertar. Se
          recarregar não resolver, recomeçar apaga o que está gravado neste navegador e
          volta à semente da demonstração.
        </p>
        <pre className="prod-erro-detalhe">{String(this.state.erro?.stack ?? this.state.erro)}</pre>
        <div className="prod-erro-acoes">
          <button
            type="button"
            className="prod-botao"
            data-porte="curto"
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
          <button
            type="button"
            className="prod-botao"
            data-porte="curto"
            data-primaria="sim"
            onClick={() => {
              try {
                window.localStorage.removeItem("produtor.v1");
              } catch {
                // sem armazenamento não há o que apagar
              }
              window.location.reload();
            }}
            data-recomecar-demonstracao
          >
            Apagar o estado e recomeçar
          </button>
        </div>
      </div>
    );
  }
}
