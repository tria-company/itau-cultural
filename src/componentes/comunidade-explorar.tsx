"use client";

import { useMemo } from "react";
import { Cartao } from "@/componentes/comunidade";
import { Painel } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";
import { COMUNIDADES, PRODUTOR_DA_CASA } from "@/dados/comunidade";
import type { PublicacaoDefinida } from "@/lib/pontos/tipos";

/**
 * comunidade-explorar.tsx — o que existe além do que você segue.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A OUTRA METADE DA ABA (pedido de 29/08/2026). «Meu feed» é o que as comunidades que ele
 * segue publicaram; aqui é o resto, das que ele ainda não segue. As duas listas nunca
 * mostram o mesmo post, e é isso que faz explorar valer a pena abrir.
 *
 * O INTERESSE É MEDIDO, E NÃO ADIVINHADO. O motor guarda `linguagensAlcancadas`, as
 * linguagens que a pessoa já atravessou de fato — assistiu, ouviu, foi. Cada comunidade
 * declara as suas. A afinidade é o tamanho da interseção, e vale dez dias de novidade: um
 * post de uma semana atrás numa linguagem que ela persegue vem antes de um de ontem numa
 * que ela nunca tocou.
 *
 * SEM SINAL, VALE A NOVIDADE. Persona nova tem `linguagensAlcancadas` vazio, a afinidade dá
 * zero para todo mundo, e a ordem cai em recência pura. A tela diz isso, em vez de fingir
 * personalização que ainda não existe.
 *
 * «ALEATÓRIO» AQUI É ESPALHAR, E NÃO SORTEAR. `Math.random()` faria o HTML exportado
 * divergir da página hidratada, e é proibido neste projeto por isso. O desempate é um hash
 * do id do post: estável entre recarregamentos, e suficiente para que os cinco posts de uma
 * mesma comunidade não desabem em bloco no topo.
 *
 * O TETO É DECLARADO. São 115 publicações no acervo, e despejar todas numa página é uma
 * tela que nunca acaba. Ela mostra quarenta e DIZ que mostra quarenta: corte silencioso lê
 * como «isto é tudo que existe».
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TETO = 40;

/** Espalha sem sortear: mesmo id, mesmo número, sempre. */
function espalhar(id: string): number {
  let h = 7;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 9973;
  return h;
}

export function Explorar() {
  const { motor, hidratado } = usePontos();

  const alcancadas = hidratado ? motor.atual.linguagensAlcancadas : [];
  const seguidas = hidratado ? motor.atual.assinadas : [];
  const publicacoes = motor.atual.publicacoes;

  const { visiveis, total } = useMemo(() => {
    /** Quantas linguagens desta comunidade a pessoa já atravessou. */
    const afinidade = new Map<string, number>();
    for (const c of COMUNIDADES) {
      afinidade.set(c.id, c.linguagens.filter((l) => alcancadas.includes(l)).length);
    }

    const deFora = new Set(
      COMUNIDADES.filter(
        (c) => c.donoId !== PRODUTOR_DA_CASA && !seguidas.includes(c.id),
      ).map((c) => c.id),
    );

    const candidatos = publicacoes.filter((p) => deFora.has(p.comunidadeId));

    const nota = (p: PublicacaoDefinida) =>
      (afinidade.get(p.comunidadeId) ?? 0) * 10 - p.diasAtras;

    const ordenados = candidatos
      .slice()
      .sort((a, b) => nota(b) - nota(a) || espalhar(a.id) - espalhar(b.id));

    /**
     * INTERCALA POR COMUNIDADE, uma de cada vez.
     *
     * Só ordenar por nota punha as cinco publicações de uma mesma comunidade em bloco no
     * topo, porque elas dividem a afinidade e quase dividem a idade: a tela abria com dois
     * posts seguidos da BaSiraH (visto em captura, 29/08/2026). Explorar assim não explora
     * nada, mostra uma comunidade de cada vez.
     *
     * O rodízio preserva a ordem dentro de cada comunidade e a ordem entre elas — a de
     * maior afinidade abre —, e garante que dois vizinhos nunca sejam da mesma casa
     * enquanto houver de onde tirar.
     */
    const porComunidade = new Map<string, PublicacaoDefinida[]>();
    for (const p of ordenados) {
      const fila = porComunidade.get(p.comunidadeId);
      if (fila) fila.push(p);
      else porComunidade.set(p.comunidadeId, [p]);
    }

    const filas = [...porComunidade.values()];
    const rodizio: PublicacaoDefinida[] = [];
    for (let volta = 0; rodizio.length < ordenados.length; volta += 1) {
      for (const fila of filas) if (fila[volta]) rodizio.push(fila[volta]);
    }

    return { visiveis: rodizio.slice(0, TETO), total: rodizio.length };
  }, [publicacoes, alcancadas, seguidas]);

  const comSinal = alcancadas.length > 0;

  return (
    <div data-explorar>
      <div className="prod-vinculo" data-resumo-do-explorar>
        <span className="prod-registro-corpo">
          <strong className="prod-registro-titulo">
            {Math.min(TETO, total)} de {total}
          </strong>
          <span className="prod-registro-meta">
            {comSinal
              ? `mais perto de ${alcancadas.slice(0, 3).join(", ")}, que você já atravessou`
              : "as mais recentes, até você atravessar alguma linguagem"}
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-4 comunidade-coluna">
        {visiveis.length === 0 ? (
          <Painel titulo="Nada para explorar">
            Você já segue todas as comunidades que existem aqui.
          </Painel>
        ) : (
          visiveis.map((p) => <Cartao key={p.id} publicacao={p} />)
        )}
      </div>
    </div>
  );
}
