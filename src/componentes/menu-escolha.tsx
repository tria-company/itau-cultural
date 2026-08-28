"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface OpcaoDeMenu {
  id: string;
  rotulo: string;
  /** Texto curto à direita — a UF, no caso das comunidades. */
  nota?: string;
}

/**
 * menu-escolha.tsx — um menu suspenso desenhado, no lugar do `<select>` nativo.
 *
 * POR QUE NÃO O NATIVO. Ele é pintado pelo sistema operacional: fundo,
 * tipografia, marca de seleção e cantos vêm do macOS ou do Android, e nenhum
 * deles conhece a paleta do Itaú Cultural. Numa tela em que cada cartão foi
 * desenhado, o menu do sistema entra como corpo estranho.
 *
 * O QUE ELE MANTÉM DO NATIVO, porque é o que importa: `Escape` fecha, `Enter` e
 * `Espaço` abrem, as setas andam pela lista, o foco volta para o gatilho ao
 * fechar e clicar fora fecha. Menu desenhado que perde teclado é regressão, não
 * melhoria.
 */
export function MenuDeEscolha({
  rotulo,
  opcoes,
  valor,
  aoEscolher,
  textoVazio,
  placeholder,
}: {
  rotulo: string;
  opcoes: OpcaoDeMenu[];
  /** `null` quando nada da lista está escolhido. */
  valor: string | null;
  aoEscolher: (id: string) => void;
  /** O que dizer quando a lista está vazia. */
  textoVazio: string;
  /** O que mostrar no gatilho quando `valor` é nulo. */
  placeholder: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [focado, setFocado] = useState(0);
  const caixa = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const idPainel = useId();

  const vazio = opcoes.length === 0;
  const escolhida = opcoes.find((o) => o.id === valor);

  useEffect(() => {
    if (!aberto) return;
    function fora(e: MouseEvent) {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  function abrir() {
    if (vazio) return;
    setFocado(Math.max(0, opcoes.findIndex((o) => o.id === valor)));
    setAberto(true);
  }

  function escolher(id: string) {
    aoEscolher(id);
    setAberto(false);
    gatilho.current?.focus();
  }

  function teclas(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setAberto(false);
      gatilho.current?.focus();
      return;
    }
    if (!aberto) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        abrir();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocado((i) => Math.min(opcoes.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocado((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const alvo = opcoes[focado];
      if (alvo) escolher(alvo.id);
    }
  }

  return (
    <div className="seletor-campo" ref={caixa} onKeyDown={teclas}>
      <span className="seletor-rotulo" id={`${idPainel}-rotulo`}>
        {rotulo}
      </span>

      <button
        ref={gatilho}
        type="button"
        className="seletor-gatilho"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-labelledby={`${idPainel}-rotulo`}
        disabled={vazio}
        onClick={() => (aberto ? setAberto(false) : abrir())}
      >
        <span>{vazio ? textoVazio : (escolhida?.rotulo ?? placeholder)}</span>
        <span className="seletor-seta" aria-hidden="true" />
      </button>

      {aberto && (
        <ul className="seletor-painel" role="listbox" aria-labelledby={`${idPainel}-rotulo`}>
          {opcoes.map((opcao, i) => (
            <li key={opcao.id}>
              <button
                type="button"
                role="option"
                aria-selected={opcao.id === valor}
                className="seletor-opcao"
                autoFocus={i === focado}
                onClick={() => escolher(opcao.id)}
              >
                <span>{opcao.rotulo}</span>
                {opcao.nota && <span className="seletor-opcao-uf">{opcao.nota}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
