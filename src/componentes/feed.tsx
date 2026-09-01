"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ConviteOnboarding } from "./convite-onboarding";
import { Cartao } from "@/componentes/cartao";
import { useSessao } from "@/contexto/sessao";
import type { AvisoFeed, Cartao as CartaoDTO, DiagnosticoFeed } from "@/dados/cartao";
import { comporFeed, type PrecomputoDeSementes } from "@/dados/sementes-wire";

/**
 * feed.tsx — o lado cliente de Descobrir (D-26, D-27, D-32, D-45).
 *
 * A CAMINHADA CONTINUA RODANDO NO BUILD. O que mudou com a S8 é quem escolhe entre os
 * resultados dela, e são dois caminhos que convivem:
 *
 * 1. **Sem semente** — o comportamento de sempre. As 96 combinações (3 personas × 32
 *    subconjuntos de disposição) vieram prontas do build e trocar de disposição ou de
 *    persona muda **um índice**. É isso que faz D-32 e D-45 serem demonstráveis ao vivo.
 *
 * 2. **Com semente** — o perfil que a pessoa montou no onboarding. Aqui o componente
 *    COMPÕE: une as listas pré-computadas das sementes marcadas e ranqueia pela
 *    interseção. Não é caminhada — a travessia já aconteceu no build, por semente; o que
 *    roda aqui é união, contagem e rodízio de classe, tudo sobre índices.
 *
 * A composição precisa acontecer no cliente porque o número de combinações de sementes é
 * astronômico: 709 sementes oferecíveis em subconjuntos de até 12 não cabem em nenhum
 * precômputo. O que cabe — e foi medido em 0,88 MB — é uma lista por semente.
 *
 * DP-F: nenhuma linha deste arquivo conhece `@/dados/grafo`. Os tipos vêm de
 * `@/dados/cartao`, que é o DTO da fronteira e não importa acervo nenhum. Os 23 MB de grafo
 * ficam do lado de lá.
 *
 * A CHAVE DA COMBINAÇÃO É UMA MÁSCARA DE BITS, e a ordem vem do servidor em
 * `ordemDisposicoes`. Foi de propósito: uma função de chave escrita dos dois lados da
 * fronteira diverge na primeira edição, e o sintoma seria uma combinação que existe no
 * build e nunca é encontrada no navegador — ou seja, a disposição que não muda nada, que é
 * exatamente o defeito que D-32 existe para impedir.
 *
 * ANTES DE HIDRATAR o contexto de sessão devolve a persona padrão e nenhuma disposição, que
 * é exatamente o que saiu no HTML estático. A tela não pisca e o feed existe mesmo antes de
 * o JavaScript carregar.
 */

export interface CombinacaoFeedProps {
  disposicoes: string[];
  lista: number;
  avisos: AvisoFeed[];
  diagnostico: DiagnosticoFeed;
}

export interface FeedProps {
  /** Ordem canônica das disposições. O índice da combinação é a máscara sobre ela. */
  ordemDisposicoes: string[];
  listas: CartaoDTO[][];
  porPersona: Record<string, CombinacaoFeedProps[]>;
  personaPadrao: string;
  /** As listas por semente, do build. Medido em 0,88 MB com o teto de 24. */
  precomputoSementes: PrecomputoDeSementes;
  /** Cartões no feed. Vem de `LIMITE_FEED`, em `feeds.ts`, para não haver dois números. */
  limite: number;
}

export function Feed({
  ordemDisposicoes,
  listas,
  porPersona,
  personaPadrao,
  precomputoSementes,
  limite,
}: FeedProps) {
  const { personaId, disposicoes, sementes } = useSessao();

  /**
   * O feed do perfil, quando existe. `null` — e não lista vazia — quando não há semente:
   * a diferença é o que decide entre «este é o seu feed» e «este é o feed base», e a tela
   * diz qual dos dois está mostrando.
   */
  const doPerfil = useMemo(
    () => (sementes.length ? comporFeed(precomputoSementes, sementes, limite) : null),
    [sementes, precomputoSementes, limite],
  );

  // T-02-02: `personaId` vem do `localStorage`, que o avaliador pode editar. `sessao.tsx`
  // já valida contra a lista de personas; aqui a reserva é estrutural — persona sem
  // combinação cai na padrão em vez de estourar a tela.
  const doPersona = porPersona[personaId] ?? porPersona[personaPadrao] ?? [];

  const mascara = ordemDisposicoes.reduce(
    (m, id, i) => (disposicoes.includes(id) ? m | (1 << i) : m),
    0,
  );
  const combinacao = doPersona[mascara] ?? doPersona[0];
  const doBuild = combinacao ? (listas[combinacao.lista] ?? []) : [];

  /**
   * O cartão do perfil chega SEM `caminho` — ele é 56% do payload e por isso não viaja
   * (ver `sementes-wire.ts`). A lista vazia aqui não é um caminho inventado nem um caminho
   * perdido: a tela «por que isto apareceu» monta a explicação em `explicacao.ts`, que
   * recalcula a travessia no build a partir do acervo, e nunca leu este campo.
   */
  const cartoes: CartaoDTO[] = doPerfil
    ? doPerfil.map((c) => ({ ...c.cartao, motivo: c.motivo, caminho: [] }))
    : doBuild;

  // Redesenho 2026-08: o destaque curado (D-29) sai da grade e abre a seção — a
  // MESMA carta da mesma combinação, só que fora do rodízio visual. A faixa do
  // próprio cartão («Destaque curado») é o rótulo da seção; um h2 por cima
  // repetiria a frase a dois dedos de distância. A serendipidade (D-30) continua
  // dentro da grade, na posição que a caminhada lhe deu.
  const destaque = cartoes.find((c) => c.especial === "curado");
  const paraVoce = destaque ? cartoes.filter((c) => c !== destaque) : cartoes;

/**
 * As seis capas do convite de semeadura.
 *
 * ESCOLHIDAS POR PASSO FIXO sobre a ordem do diretório, e não a dedo nem por sorteio: o
 * convite aparece em todas as páginas do export, e um `Math.random()` faria o HTML
 * exportado divergir da página hidratada na primeira renderização.
 */
const CAPAS_DO_CONVITE: readonly string[] = [
  "00353485916976e8.jpg",
  "2ad9c5a3dc7aba46.jpeg",
  "570d00b961da83b4.jpg",
  "7fa0f481355e9b63.jpeg",
  "a987698beeb72b46.jpg",
  "d46fb4aabf7493f9.jpg",
];

  return (
    <div className="flex flex-col gap-3">
      <ConviteOnboarding />
      {/* SEM SEMENTE O FEED FUNCIONA E DIZ QUE ESTÁ GENÉRICO. Ele não é um erro nem um
          vazio: é o feed base, e a pessoa precisa saber que existe um mais seu a três
          toques de distância. Some assim que a primeira semente é marcada.

          SEM GUARDA DE `hidratado`, de propósito. A primeira escrita tinha
          `hidratado && !doPerfil`, e o aviso não existia em nenhuma das 5.475 páginas do
          export — só aparecia depois do JavaScript. `doPerfil` já é `null` antes de
          hidratar, que é exatamente o estado de quem ainda não semeou. */}
      {!doPerfil ? (
        <Link href="/onboarding/2/" className="convite-semente no-underline">
          {/* Seis capas reais do acervo, escolhidas por passo fixo sobre a ordem do
              diretório — nunca sorteadas, para o mesmo convite sair igual em todas as
              5.475 páginas do export. O mosaico é o argumento: o acervo é grande, e a
              tela pergunta qual parte dele é sua. */}
          <span className="convite-semente-mosaico" aria-hidden="true">
            {CAPAS_DO_CONVITE.map((capa) => (
              <img key={capa} src={`/acervo/${capa}`} alt="" loading="lazy" />
            ))}
          </span>
          <span className="convite-semente-veu" aria-hidden="true" />
          <span className="convite-semente-corpo">
            <span className="convite-semente-titulo">Queremos conhecer você melhor</span>
            <span className="convite-semente-texto">
              Este é o feed base do acervo. Diga o que te move e ele passa a ser seu.
            </span>
            <span className="convite-semente-acao">Escolher o que te interessa</span>
          </span>
        </Link>
      ) : null}

      {/* Os avisos do motor. NÃO são opcionais: quando um corte marcado não pôde filtrar
          porque o acervo não declara o campo, a tela diz isso. É desconfortável e é o
          ponto — a diferença entre um filtro que mente e um que se declara. */}
      {combinacao?.avisos.length ? (
        <ul className="flex flex-col gap-2">
          {combinacao.avisos.map((aviso: AvisoFeed) => (
            <li
              key={aviso.origem}
              data-aviso={aviso.origem}
              className="rounded-lg border border-acao bg-superficie p-2.5 text-xs leading-snug"
            >
              {aviso.texto}
            </li>
          ))}
        </ul>
      ) : null}

      {destaque ? (
        // `data-destaque-curado` e `data-classe` continuam no invólucro: são os
        // contratos que os gates leem. WEB-01 exige o destaque MAIS LARGO que um
        // cartão comum — fora da grade ele ocupa a largura inteira do bloco — e a
        // asserção de contenção dos selos passou a aceitar `.descobrir-destaque`
        // como contêiner na MESMA mudança (verificar-fase5.mjs, WEB-01).
        <div
          data-classe={destaque.classe}
          data-destaque-curado={destaque.especial}
          className="descobrir-destaque"
        >
          <Cartao cartao={destaque} />
        </div>
      ) : null}

      {cartoes.length ? (
        <h2 className="tipo-titulo-3 font-bold">Para você</h2>
      ) : null}

      {cartoes.length ? (
        // A GRADE DA VISÃO WEB MORA AQUI E É SÓ LAYOUT (D-79, D-80, plano 05-02).
        //
        // `web-grade` e `data-grade-web` viajam nos DOIS estados de visão: as regras que
        // as animam estão todas sob `[data-view="web"]`, em `web.css` e
        // `web-descobrir.css`, e na visão app não existe uma que case. É por isso que não
        // há nenhum `if (visao === …)` neste arquivo — um ramo em JavaScript por visão
        // faria o mesmo componente renderizar árvores diferentes, que é exatamente o que
        // D-05 proíbe, e ainda quebraria a hidratação, porque a visão só é conhecida
        // depois de ler o `localStorage`.
        //
        // `flex flex-col gap-3` continua e continua valendo NA VISÃO APP. Na web,
        // `.web-grade` ganha por ser regra sem camada — os utilitários do Tailwind moram
        // em `@layer utilities` e perdem para qualquer declaração fora de camada.
        <div data-feed data-grade-web="sim" className="web-grade flex flex-col gap-3">
          {paraVoce.map((cartao) => (
            // `data-classe` no invólucro é contrato de verificação da fase: os gates leem
            // a heterogeneidade daqui, sem depender de texto visível nem de classe de CSS.
            //
            // `data-destaque-curado` carrega o MESMO valor de `data-especial` que
            // `cartao.tsx` já lê — `curado` (D-29) ou `serendipidade` (D-30). Não é um
            // segundo critério de destaque: é o primeiro, subido um nível para o
            // invólucro, porque quem ocupa duas colunas é o ITEM DA GRADE, e o item da
            // grade é este `div`, não o `<article>` lá dentro.
            <div
              key={cartao.id}
              data-classe={cartao.classe}
              data-destaque-curado={cartao.especial ?? undefined}
              className={cartao.especial ? "web-grade-largo" : undefined}
            >
              <Cartao cartao={cartao} />
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-borda-forte p-4 text-sm text-tinta-2">
          Nenhum candidato sobrou com esta combinação. Desmarque um corte para voltar ao
          feed base.
        </p>
      )}

    </div>
  );
}

