"use client";

import Link from "next/link";
import { Monograma, assinaturaDe, nomeDe } from "@/componentes/comunidade";
import { Vazio } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";
import { comunidadePorId } from "@/dados/comunidade";

export function Guardadas() {
  const { motor, hidratado } = usePontos();

  if (!hidratado) {
    return <div className="saldo-painel" aria-busy="true" style={{ minHeight: "10rem" }} />;
  }

  const guardadas = motor.atual.publicacoesSalvas;
  const publicacoes = motor.atual.publicacoes.filter((p) => guardadas.includes(p.id));

  if (publicacoes.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <Vazio>
          Nada guardado ainda. Toque no marcador de uma publicação para ela ficar aqui, de
          qualquer comunidade.
        </Vazio>
        <Link href="/studio/comunidade/" className="botao-acao no-underline self-start">
          Ir para a comunidade
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {publicacoes.map((p) => {
        const comunidade = comunidadePorId(p.comunidadeId);
        return (
          <Link
            key={p.id}
            href={`/studio/comunidade/publicacao/${p.id}/`}
            className="comunidade-cartao no-underline"
          >
            <span className="guardada-capa">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imagem} alt={p.imagemAlt} loading="lazy" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="tipo-detalhe font-bold">{p.titulo}</span>
              <span className="tipo-legenda text-tinta-2">
                {nomeDe(p.autorId)} · {assinaturaDe(p.autorId, p.diasAtras)}
              </span>
              {comunidade && (
                <span className="tipo-legenda text-tinta-3">em {comunidade.nome}</span>
              )}
            </span>
            <Monograma autorId={p.autorId} pequeno />
          </Link>
        );
      })}
    </div>
  );
}
