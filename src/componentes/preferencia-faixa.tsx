"use client";

import { useState } from "react";
import { useSessao } from "@/contexto/sessao";

/**
 * preferencia-faixa.tsx — o recorte de preferência que Play, Cast, Cursos e Notícias
 * abrem, e o único componente dos quatro.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * TRÊS REGRAS QUE VALEM NOS QUATRO APPS, e é por elas que existe um componente só:
 *
 * 1. **NUNCA É PORTEIRO E NUNCA É MODAL.** A faixa mora acima do conteúdo, rola junto e
 *    some quando a preferência já existe — vira uma linha discreta com «mudar». Quem
 *    chegou para ver o catálogo vê o catálogo; quem quiser recortar, recorta.
 *
 * 2. **SÓ O NOME NA PASTILHA (27.08).** A contagem do acervo e a declaração de ausência
 *    saíram das quatro faixas por pedido: eram texto e número em cima de uma escolha que
 *    se faz pelo rótulo. O que elas diziam continua verdadeiro e continua medido em
 *    `medidasDasFaixas()` — o que saiu foi a exibição.
 *
 *    O QUE ISSO CUSTA, dito para quem for reverter: as declarações eram a peça que
 *    sustentava «ausência declarada com denominador» dentro do produto. Sem elas, quem
 *    abre o Play não fica sabendo que o acervo não tem gênero de filme, e quem abre o
 *    Cast não fica sabendo que 100 dos 336 podcasts não declaram linguagem. A informação
 *    não sumiu do código; sumiu da tela.
 *
 * A preferência ORDENA, não corta. Um recorte que esvazia a tela transforma uma escolha
 * de gosto numa parede — e nenhum dos quatro apps tem acervo suficiente para sobreviver a
 * um filtro de verdade em toda combinação.
 */

export interface OpcaoDePreferencia {
  valor: string;
  rotulo: string;
}

export function PreferenciaFaixa({
  app,
  pergunta,
  opcoes,
}: {
  /** Chave do app no estado: `play`, `cast`, `cursos`, `noticias`. */
  app: string;
  pergunta: string;
  opcoes: readonly OpcaoDePreferencia[];
}) {
  const { preferencias, alternarPreferencia, hidratado } = useSessao();
  const [editando, setEditando] = useState(false);

  const marcadas = hidratado ? (preferencias[app] ?? []) : [];

  // Antes de hidratar, `marcadas` é vazio e a faixa aparece — que é exatamente o HTML do
  // build. Trocar isso por um estado de carregamento faria a tela piscar a cada visita
  // para esconder um componente que não é urgente.
  if (marcadas.length > 0 && !editando) {
    const rotulos = opcoes
      .filter((o) => marcadas.includes(o.valor))
      .map((o) => o.rotulo)
      .join(", ");
    return (
      <p className="pref-resumo">
        <span>Mostrando primeiro: {rotulos}</span>
        {/* «Mudar» REABRE a faixa com as escolhas intactas. A primeira escrita deste
            componente desmarcava tudo aqui — o rótulo prometia editar e a ação apagava,
            sem aviso e sem volta. */}
        <button type="button" className="onb-texto-acao" onClick={() => setEditando(true)}>
          Mudar
        </button>
      </p>
    );
  }

  return (
    <section className="pref" aria-label={pergunta}>
      <h2 className="pref-pergunta">{pergunta}</h2>

      <div className="pref-opcoes">
        {opcoes.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            aria-pressed={marcadas.includes(opcao.valor)}
            onClick={() => alternarPreferencia(app, opcao.valor)}
            className="pref-pastilha"
          >
            <span>{opcao.rotulo}</span>
          </button>
        ))}
      </div>

      {editando ? (
        <button type="button" className="onb-texto-acao" onClick={() => setEditando(false)}>
          Pronto
        </button>
      ) : null}
    </section>
  );
}
