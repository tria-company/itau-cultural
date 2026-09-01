"use client";

import Image from "next/image";
import { useSessao } from "@/contexto/sessao";
import type { RostoDeSemente } from "@/dados/sementes-wire";

/**
 * museu-reentrada.tsx — a única «faixa de preferência» do Museu, e ela não é uma pergunta
 * nova: é uma REENTRADA no passo de obras do onboarding.
 *
 * POR QUE NÃO É PERGUNTA PRÓPRIA. Escolher obras aqui é exatamente a mesma operação do
 * passo 4 e grava exatamente a mesma semente. Inventar um segundo eixo de preferência para
 * o Museu seria perguntar duas vezes a mesma coisa com dois nomes — e o Museu não tem
 * eixo próprio para oferecer: são 22 espaços, 2 exposições permanentes e 5 eventos
 * expositivos únicos. Uma pergunta de gosto sobre cinco itens é teatro.
 *
 * O QUE ELA RESOLVE. Quem pulou o onboarding e chegou ao Museu está na melhor tela
 * possível para semear: uma parede de obras com imagem, onde reconhecer não depende de
 * saber o nome de ninguém. Some assim que houver semente de entidade suficiente — não é
 * um recorte permanente da tela.
 */

/** Acima disto o perfil já tem de onde caminhar e a faixa sai da frente. */
const BASTANTE = 3;

/** Uma parede, não um catálogo: o Museu continua sendo a tela, isto é um convite. */
const NA_PAREDE = 8;

export function MuseuReentrada({ obras }: { obras: RostoDeSemente[] }) {
  const { sementes, alternarSemente, hidratado } = useSessao();

  // ANTES DE HIDRATAR A FAIXA APARECE, e isso não é descuido. Devolver `null` até o
  // `localStorage` ser lido tirava a seção inteira do HTML estático — ela passava a
  // existir só depois do JavaScript, e sumia de qualquer verificação que leia o build. O
  // HTML de saída passa a ser o estado de quem ainda não semeou, que é quem chega aqui.
  const marcadas = hidratado ? sementes.filter((c) => c.startsWith("e:")) : [];
  if (hidratado && marcadas.length >= BASTANTE) return null;

  return (
    <section className="pref" aria-label="Escolha obras que te param">
      <h2 className="pref-pergunta">Escolha 3 obras que te param.</h2>

      <div className="onb-grade">
        {obras.slice(0, NA_PAREDE).map((obra) => {
          const ativa = sementes.includes(obra.chave);
          return (
            <button
              key={obra.chave}
              type="button"
              aria-pressed={ativa}
              onClick={() => alternarSemente(obra.chave)}
              className="onb-rosto"
            >
              <span className="onb-rosto-foto">
                {obra.imagem ? (
                  <Image
                    src={obra.imagem}
                    alt={`Reprodução de ${obra.titulo}`}
                    width={240}
                    height={320}
                    unoptimized
                  />
                ) : null}
                {ativa ? (
                  <span className="onb-marca" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </span>
              <span className="onb-rosto-texto">
                <span className="onb-rosto-nome">{obra.titulo}</span>
                <span className="onb-rosto-classe">Obra</span>
              </span>
            </button>
          );
        })}
      </div>

    </section>
  );
}
