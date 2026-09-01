import Link from "next/link";
import { ICONE_LIVRO, ICONE_SETA } from "@/componentes/base/icones";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { dataCurta } from "@/componentes/cartao-leitura";
import { Grafismo } from "@/componentes/grafismo";
import { CtaSpotify, PalcoYoutube } from "@/componentes/palco";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import type { BlocoCorpo } from "@/dados/corpos-wire";
import type { MateriaCompleta } from "@/dados/materias";

/**
 * materia.tsx — a página de um texto. Cara muda com a família: notícia sangra,
 * entrevista retrata, coluna fala, opinião cita, publicação empilha capa de
 * livro. Nenhuma delas é um cartão grande com «abrir no site».
 */

function Bloco({ bloco, poster, titulo }: { bloco: BlocoCorpo; poster?: string; titulo: string }) {
  if (bloco.tipo === "p") return <p className="materia-p">{bloco.texto}</p>;
  if (bloco.tipo === "h") return <h2 className="materia-h">{bloco.texto}</h2>;
  if (bloco.tipo === "citacao") return <blockquote className="materia-citacao">{bloco.texto}</blockquote>;
  if (bloco.tipo === "youtube") {
    return <PalcoYoutube id={bloco.id} titulo={bloco.titulo ?? titulo} poster={poster} />;
  }
  return <CtaSpotify url={bloco.url} especie={bloco.especie} />;
}

export function Materia({ materia }: { materia: MateriaCompleta }) {
  const data = dataCurta(materia.dia);
  const youtubeNoCorpo = materia.blocos.some((b) => b.tipo === "youtube");

  return (
    <article className="materia" data-familia={materia.familia} data-materia={materia.slug}>
      <header className="materia-abertura">
        {materia.familia === "publicacao" ? (
          <div className="materia-livro">
            <CapaDeCartao
              titulo={materia.titulo}
              classe="publicacao"
              linguagens={materia.linguagens}
              imagem={materia.imagem}
              creditoImagem={materia.creditoImagem}
              alt={materia.imagemAlt}
              className="materia-livro-capa"
            />
            <span className="materia-livro-marca" aria-hidden>
              {ICONE_LIVRO}
            </span>
          </div>
        ) : materia.familia === "opiniao" ? (
          <span className="materia-aspas" aria-hidden>
            “
          </span>
        ) : materia.imagem ? (
          <figure className="materia-hero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={materia.imagem}
              alt={materia.imagemAlt ?? materia.titulo}
              decoding="async"
              className="materia-hero-foto"
            />
            {materia.creditoImagem ? (
              <figcaption className="materia-hero-credito">Foto: {materia.creditoImagem}</figcaption>
            ) : null}
          </figure>
        ) : null}

        <p className="materia-kicker tipo-micro">
          <Grafismo variacao="barra" className="h-[0.8em] w-auto" />
          {materia.rotuloCategoria}
          {data ? (
            <>
              {" · "}
              <time dateTime={String(materia.dia)}>{data}</time>
            </>
          ) : null}
        </p>
        <h1 className="materia-titulo tipo-titulo-1">{materia.titulo}</h1>
        {materia.autor ? (
          <p className="materia-autor">
            <strong>{materia.autor.nome}</strong>
            {materia.autor.descricao ? (
              <span className="tipo-legenda text-tinta-2"> — {materia.autor.descricao}</span>
            ) : null}
          </p>
        ) : null}
        {materia.resumo ? <p className="materia-lead tipo-destaque">{materia.resumo}</p> : null}
        {materia.linguagens.length ? <SelosDeLinguagem ids={materia.linguagens} /> : null}
      </header>

      {materia.youtubeId && !youtubeNoCorpo ? (
        <PalcoYoutube id={materia.youtubeId} titulo={materia.titulo} poster={materia.imagem} />
      ) : null}
      {materia.spotify && !materia.blocos.some((b) => b.tipo === "spotify") ? (
        <CtaSpotify url={materia.spotify.url} especie={materia.spotify.especie} />
      ) : null}

      {materia.blocos.length ? (
        <div className="materia-corpo">
          {materia.blocos.map((bloco, i) => (
            <Bloco
              key={`${bloco.tipo}-${i}`}
              bloco={bloco}
              poster={materia.imagem}
              titulo={materia.titulo}
            />
          ))}
        </div>
      ) : null}

      {materia.relacionados.length ? (
        <section className="materia-segue">
          <h2 className="materia-segue-titulo tipo-titulo-3">
            <Grafismo variacao="barra" className="h-[0.8em] w-auto" />
            Continua nisto
          </h2>
          <ul className="materia-segue-lista">
            {materia.relacionados.map((item) => (
              <li key={`${item.classe}:${item.slug}`}>
                <Link href={item.rota} className="materia-segue-item">
                  <span className="materia-segue-tipo tipo-micro">{item.classe}</span>
                  <span className="materia-segue-nome tipo-detalhe">{item.titulo}</span>
                  {item.motivo ? (
                    <span className="materia-segue-motivo tipo-legenda">{item.motivo}</span>
                  ) : null}
                  <span aria-hidden>{ICONE_SETA}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="materia-voltar tipo-legenda">
        <Link href="/noticias/" className="underline decoration-borda-forte underline-offset-4">
          ← voltar às notícias
        </Link>
      </p>
    </article>
  );
}
