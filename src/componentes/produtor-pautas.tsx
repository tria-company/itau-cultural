"use client";

import Link from "next/link";
import { DESCRICAO_DA_PAUTA, PAUTAS } from "@/dados/tipos-produtor";
import type { Pauta } from "@/dados/tipos-produtor";

/**
 * produtor-pautas.tsx, a aba «Studio»: o que este perfil publica.
 *
 * ELA NASCEU DO INÍCIO (2026-08-27). Os onze atalhos com imagem viviam no painel e
 * empurravam para baixo da dobra tudo o que o início existe para mostrar: os números, o
 * gráfico, os tops. Escolher O QUE publicar e ver COMO VAI o que já está publicado são
 * duas perguntas diferentes, e agora cada uma tem a própria tela.
 *
 * A PAUTA SEM FICHA APARECE, DESABILITADA, com o objetivo dela no `title`: é a diferença
 * entre uma superfície que mostra o próprio tamanho e uma que esconde o que falta.
 */

export interface ImagemDeAtalho {
  caminho: string;
  credito: string;
  alt: string;
  de: string;
}

export function PautasDoStudio({
  pautasComFicha,
  imagens,
}: {
  pautasComFicha: readonly Pauta[];
  imagens: ImagemDeAtalho[];
}) {
  const prontas = new Set(pautasComFicha);
  const imagemDaPauta = (p: Pauta): ImagemDeAtalho | null => {
    if (imagens.length === 0) return null;
    return imagens[PAUTAS.indexOf(p) % imagens.length] ?? null;
  };

  return (
    <>
      <header className="prod-cabecalho">
        <div className="prod-cabecalho-linha">
          <Link href="/studio/" className="prod-superficie prod-voltar" data-voltar-studio>
            <span className="prod-voltar-texto">‹ Studio</span>
            <span className="prod-voltar-x" aria-hidden>
              ✕
            </span>
          </Link>
          <span className="prod-contagem">{prontas.size} de {PAUTAS.length} prontas</span>
        </div>
        <h1 className="prod-titulo">O que você publica</h1>
      </header>

      <div className="prod-corpo prod-painel" data-pautas-do-studio>
        <section className="prod-secao" aria-labelledby="prod-atalhos-titulo">
          <h2 className="prod-secao-titulo" id="prod-atalhos-titulo">
            Publicar
          </h2>
          <div className="prod-atalhos" data-atalhos-pautas>
            {PAUTAS.map((p) => {
              const d = DESCRICAO_DA_PAUTA[p];
              const img = imagemDaPauta(p);
              const capa = (
                <span className="prod-atalho-capa">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element -- capa local do acervo
                    <img src={img.caminho} alt="" loading="lazy" />
                  ) : null}
                  {img ? <span className="prod-atalho-credito">{img.credito}</span> : null}
                </span>
              );
              if (!prontas.has(p)) {
                return (
                  <div
                    key={p}
                    className="prod-atalho"
                    data-atalho={p}
                    data-pronta="nao"
                    title={`${d.objetivo} Ficha ainda não construída.`}
                  >
                    {capa}
                    <span className="prod-atalho-rotulo">
                      {d.rotulo}
                      <span className="prod-atalho-breve">em breve</span>
                    </span>
                  </div>
                );
              }
              return (
                <Link key={p} href={d.rota} className="prod-atalho" data-atalho={p} title={d.objetivo}>
                  {capa}
                  <span className="prod-atalho-rotulo">
                    {d.rotulo}
                    <span aria-hidden>▸</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
