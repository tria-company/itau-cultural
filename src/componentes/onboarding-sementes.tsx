"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useSessao } from "@/contexto/sessao";
import type { RostoDeSemente } from "@/dados/sementes-wire";

/**
 * onboarding-sementes.tsx — os passos 3 e 4 do onboarding cultural (S8): artistas numa
 * tela, obras na seguinte. É aqui que o algoritmo nasce — a entidade marcada vira o ponto
 * de partida da caminhada no grafo, e o cartão que chegar ao feed carrega a aresta que o
 * trouxe.
 *
 * AS DUAS TELAS SÃO INDEPENDENTES, e isso é uma consequência do acervo, não uma escolha
 * de desenho. MEDIDO: **zero arestas ligam pessoa a obra** neste grafo — nenhuma das 239
 * obras está ligada a nenhuma das 575 pessoas. As 404 pessoas que alcançam alguma obra em
 * dois saltos chegam lá por LINGUAGEM (30.134 caminhos) ou território (3.137), nunca por
 * autoria. E no texto: das 239 obras, 157 trazem `extra.detalhe` e só 3 citam alguma das
 * 575 pessoas — sendo que o nome ali costuma ser o do fotógrafo da reprodução, não o do
 * autor («1X125 · 2006 · Edouard Fraipont | Ampliação fotográfica»).
 *
 * Por isso a tela de obras NÃO se recorta pelos artistas escolhidos na anterior: o filtro
 * viria vazio para praticamente todo mundo, e preenchê-lo com obras da mesma linguagem
 * chamando de «obras desses artistas» seria inventar um vínculo que o acervo não tem.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * AS DUAS SAÍDAS SÃO REQUISITO, E O MOTIVO É MEDIDO
 *
 * A grade tem 194 rostos do acervo do Itaú Cultural. Reconhecer nomes dessa lista não é
 * garantido nem para quem trabalha com cultura — e uma tela de escolha que a pessoa não
 * consegue responder não é um passo do onboarding, é uma parede. Por isso:
 *
 *  - **«não conheço nenhum destes»** rerola a grade, sem sair da tela e sem penalidade;
 *  - **«pular»** segue adiante, e o feed passa a caminhar só pelas linguagens do passo 2
 *    — dizendo isso na tela de Descobrir, em vez de fingir um perfil.
 *
 * NEM TODA ENTIDADE É OFERECÍVEL, E ISSO SAIU DE UMA CONTAGEM. Das 847 sementes do
 * universo, 138 não alcançam nada no grafo em 1 ou 2 saltos — são ilhas — e 51 delas TÊM
 * foto. Sem esse corte, 51 cartas bonitas desta grade entregariam um feed vazio. Quem
 * corta é `sementes.ts`, no build, por `alcance`; esta tela recebe a lista já limpa.
 *
 * A BUSCA ALCANÇA MAIS DO QUE A GRADE. A grade só mostra quem tem imagem local, porque
 * uma parede de retângulos com nome é um teste de erudição, não um reconhecimento. Mas
 * quem procura por nome chega às 676 oferecíveis, e quem não tem foto aparece com as
 * iniciais no lugar dela.
 */

/** Quantos rostos a grade mostra por vez. Rerolar troca esta janela, não filtra. */
const POR_ROLAGEM = 24;

function iniciaisDe(titulo: string): string {
  return titulo
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function OnboardingSementes({
  grade,
  busca,
  pergunta,
  rotuloDaBusca,
}: {
  grade: RostoDeSemente[];
  busca: RostoDeSemente[];
  pergunta: string;
  rotuloDaBusca: string;
}) {
  const { sementes, alternarSemente, hidratado } = useSessao();
  const [rolagem, setRolagem] = useState(0);
  const [termo, setTermo] = useState("");

  /**
   * A grade ordenada pelo passo 2: quem marcou música vê músicos primeiro. Não é filtro —
   * quem marcou só música continua vendo o resto do acervo depois, porque o onboarding
   * serve para ampliar repertório e não para confirmá-lo.
   */
  const ordenada = useMemo(() => {
    const doPasso2 = new Set(
      sementes.filter((c) => c.startsWith("l:")).map((c) => c.slice(2)),
    );
    if (!doPasso2.size) return grade;
    return [...grade].sort((a, b) => {
      const na = a.linguagens.some((l) => doPasso2.has(l)) ? 0 : 1;
      const nb = b.linguagens.some((l) => doPasso2.has(l)) ? 0 : 1;
      return na - nb;
    });
  }, [grade, sementes]);

  const resultados = useMemo(() => {
    const limpo = termo.trim().toLocaleLowerCase("pt-BR");
    if (limpo.length < 2) return null;
    return busca
      .filter((r) => r.titulo.toLocaleLowerCase("pt-BR").includes(limpo))
      .slice(0, POR_ROLAGEM);
  }, [termo, busca]);

  const inicio = (rolagem * POR_ROLAGEM) % Math.max(1, ordenada.length);
  const janela = resultados ?? ordenada.slice(inicio, inicio + POR_ROLAGEM);

  return (
    <section className="flex flex-col gap-4">
      <div className="onb-cabeca">
        <h2 className="onb-pergunta">{pergunta}</h2>
      </div>

      <div className="onb-busca">
        <input
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder={rotuloDaBusca}
          aria-label={rotuloDaBusca}
        />
      </div>

      {resultados?.length === 0 ? (
        <p className="onb-aviso-feed">Nenhum nome do acervo casa com «{termo.trim()}».</p>
      ) : null}

      <div className="onb-grade">
        {janela.map((rosto) => {
          const ativo = hidratado && sementes.includes(rosto.chave);
          return (
            <button
              key={rosto.chave}
              type="button"
              aria-pressed={ativo}
              onClick={() => alternarSemente(rosto.chave)}
              className="onb-rosto"
            >
              <span className="onb-rosto-foto">
                {rosto.imagem ? (
                  <Image
                    src={rosto.imagem}
                    alt={`Retrato de ${rosto.titulo}`}
                    width={240}
                    height={320}
                    unoptimized
                  />
                ) : (
                  <span className="onb-iniciais" aria-hidden="true">
                    {iniciaisDe(rosto.titulo)}
                  </span>
                )}
                {ativo ? (
                  <span className="onb-marca" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </span>
              <span className="onb-rosto-texto">
                <span className="onb-rosto-nome">{rosto.titulo}</span>
                <span className="onb-rosto-classe">
                  {rosto.classe === "pessoa" ? "Artista" : "Obra"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {!resultados ? (
        <div className="onb-saidas">
          <button
            type="button"
            className="onb-texto-acao"
            onClick={() => setRolagem((r) => r + 1)}
          >
            Não conheço nenhum destes — mostre outros
          </button>
        </div>
      ) : null}

    </section>
  );
}
