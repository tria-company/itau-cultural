"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSessao } from "@/contexto/sessao";
import {
  ampliacaoDeRepertorio,
  type LinguagemDeSemente,
  type PrecomputoDeSementes,
} from "@/dados/sementes-wire";

/**
 * repertorio-do-perfil.tsx — a ampliação de repertório do perfil que a pessoa montou,
 * que é a métrica de impacto cultural que o RFP pede.
 *
 * ATÉ AQUI ELA SÓ EXISTIA PARA AS TRÊS PERSONAS. `repertorio.ts` calcula, no build, o
 * atravessado e o adjacente a um salto de Maria, Carlos e Joana — e um indicador de
 * impacto que só sabe medir três perfis fictícios não mede impacto nenhum. Este
 * componente responde a mesma pergunta sobre as sementes que a pessoa escolheu.
 *
 * UM SALTO, e não os dois da caminhada do feed. São perguntas diferentes: o feed responde
 * «o que te interessaria ver agora»; aqui é «o que está encostado no que você já
 * atravessou». Reusar a expansão de dois saltos responderia a pergunta errada com o
 * número certo, que é a pior combinação.
 *
 * O NÚMERO É EXATO, e isso custou payload. As linguagens por semente são pré-computadas
 * SEM o teto de 24 que corta as travessias — medir ampliação sobre a amostra que coube no
 * fio seria apresentar recorte como medida. Ver `sementes.ts`.
 */
export function RepertorioDoPerfil({
  precomputo,
  linguagens,
}: {
  precomputo: PrecomputoDeSementes;
  linguagens: LinguagemDeSemente[];
}) {
  const { sementes, hidratado } = useSessao();

  const rotuloDe = useMemo(() => {
    const mapa = new Map(linguagens.map((l) => [l.slug, l.rotulo]));
    return (slug: string) => mapa.get(slug) ?? slug;
  }, [linguagens]);

  const ampliacao = useMemo(
    () => ampliacaoDeRepertorio(precomputo, sementes),
    [precomputo, sementes],
  );

  // Sem semente não há o que medir — e o vazio aqui não é um erro, é um convite. Mostrar
  // «0 linguagens ampliadas» seria dar um número onde não houve medição.
  //
  // Antes de hidratar cai neste mesmo ramo, de propósito: é o estado de quem ainda não
  // semeou, e é ele que precisa estar no HTML estático. Devolver `null` aqui tirava a
  // seção do build inteiro.
  if (!hidratado || !sementes.length) {
    return (
      <section className="pref" aria-label="Repertório do seu perfil">
        <h2 className="pref-pergunta">O seu repertório ainda não começou.</h2>
        <p className="declaracao">
          Este mapa mede o quanto o que você escolheu te leva para linguagens que você
          ainda não atravessou. Ele precisa de pelo menos uma escolha sua para existir.
        </p>
        <p>
          <Link href="/onboarding/2/" className="onb-texto-acao">
            Escolher o que te interessa
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="pref" aria-label="Repertório do seu perfil">
      <h2 className="pref-pergunta">
        O seu perfil alcança {ampliacao.alcancadas} das {linguagens.length} linguagens do
        acervo.
      </h2>

      <p className="pref-resumo">
        <span>
          Você atravessou {ampliacao.atravessadas.length}:{" "}
          {ampliacao.atravessadas.map(rotuloDe).join(", ")}.
        </span>
      </p>

      {ampliacao.novas.length ? (
        <>
          <p className="pref-resumo">
            <span>
              <strong>{ampliacao.novas.length}</strong>{" "}
              {ampliacao.novas.length === 1 ? "está" : "estão"} a um passo e você ainda não
              atravessou:
            </span>
          </p>
          <div className="pref-opcoes">
            {ampliacao.novas.map((slug) => (
              <span key={slug} className="pref-pastilha">
                {rotuloDe(slug)}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="declaracao">
          Não há linguagem nova a um passo das suas escolhas. Marque algo de outra
          linguagem no onboarding para o mapa ter para onde crescer.
        </p>
      )}

      <p className="declaracao">
        Adjacente a <strong>um passo</strong>, nunca a dez: cada linguagem desta lista está
        ligada por uma aresta do acervo a algo que você marcou. A contagem é sobre o
        alcance inteiro das suas sementes, não sobre os cartões que aparecem no feed.
      </p>
    </section>
  );
}
