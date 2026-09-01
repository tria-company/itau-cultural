"use client";

import { useEffect, useRef, useState } from "react";
import { ICONE_EXTERNO, ICONE_TOCAR } from "@/componentes/base/icones";
import type { EspecieSpotify } from "@/dados/corpos-wire";

/**
 * palco.tsx — YouTube só depois do toque; Spotify como saída nomeada.
 *
 * O iframe não nasce no HTML: o portão de zero-rede mede o carregamento, e
 * um embed no DOM já seria requisição do protótipo. O clique da pessoa é o
 * mesmo estatuto que o link tinha — ela não sai da página.
 */

const ROTULO_SPOTIFY: Record<EspecieSpotify, string> = {
  playlist: "Ouvir a playlist no Spotify",
  album: "Ouvir o álbum no Spotify",
  track: "Ouvir a faixa no Spotify",
  episode: "Ouvir o episódio no Spotify",
  show: "Ouvir o programa no Spotify",
};

export function PalcoYoutube({
  id,
  titulo,
  poster,
}: {
  id: string;
  titulo: string;
  poster?: string;
}) {
  const [ligado, setLigado] = useState(false);

  if (!ligado) {
    return (
      <button
        type="button"
        className="palco-yt"
        data-palco="youtube"
        onClick={() => setLigado(true)}
        aria-label={`Reproduzir ${titulo}`}
      >
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="palco-yt-foto" />
        ) : (
          <span className="palco-yt-fundo" aria-hidden />
        )}
        <span className="palco-yt-veu" aria-hidden />
        <span className="palco-yt-play">
          {ICONE_TOCAR}
          Reproduzir
        </span>
      </button>
    );
  }

  return (
    <div className="palco-yt palco-yt--ligado" data-palco="youtube-ligado">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
        title={titulo}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="palco-yt-frame"
      />
    </div>
  );
}

export function CtaSpotify({ url, especie }: { url: string; especie: EspecieSpotify }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="cta-spotify"
      data-saida="spotify"
    >
      {ICONE_EXTERNO}
      {ROTULO_SPOTIFY[especie]}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Tela cheia — o palco que isola o resto da interface
// ---------------------------------------------------------------------------

/**
 * PalcoCheio — reprodução em camada, cobrindo tudo.
 *
 * POR QUE UMA CAMADA E NÃO UM BLOCO NA PÁGINA. Dar play e continuar vendo a barra de
 * abas, o cabeçalho e três fileiras de capas é pedir para a pessoa assistir com o resto
 * do app puxando a atenção — e, no telefone, é convidar o toque errado. Em camada, o que
 * está atrás fica inerte: `inert` tira o conteúdo do alcance do teclado e do leitor de
 * tela, não só da vista.
 *
 * OS CONTROLES SÃO OS DO PRÓPRIO PLAYER. Pausar, avançar, voltar e acelerar já existem no
 * YouTube e no Spotify, e reescrevê-los exigiria a API de iframe deles — mais script
 * externo, mais coisa para quebrar, e um controle nosso que mente quando o player de lá
 * discorda. O que esta camada acrescenta é o enquadramento e a saída.
 *
 * O IFRAME SÓ NASCE AQUI DENTRO, depois do clique. O portão de zero-rede mede o
 * carregamento da página, e nada é buscado até a pessoa pedir.
 */
export function PalcoCheio({
  aberto,
  aoFechar,
  titulo,
  youtubeId,
  spotifyUrl,
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  youtubeId?: string;
  spotifyUrl?: string;
}) {
  const fechar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (aberto) fechar.current?.focus();
  }, [aberto]);

  if (!aberto || (!youtubeId && !spotifyUrl)) return null;

  /* O id do episódio sai da URL do Spotify: `/episode/<id>` vira `/embed/episode/<id>`.
     Sem casar o padrão, a camada não abre — melhor não abrir do que abrir vazia. */
  /* `theme=0` pede o player escuro do Spotify. Sem ele o incorporador entrega o card
     claro, que sobre a camada preta vira uma placa branca no meio da tela. */
  const spotifyEmbed = spotifyUrl
    ? spotifyUrl.replace(
        /open\.spotify\.com\/(episode|show|track|album|playlist)\//,
        "open.spotify.com/embed/$1/",
      ) + (spotifyUrl.includes("?") ? "&theme=0" : "?theme=0")
    : undefined;

  return (
    <div
      className="palco-cheio"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onKeyDown={(e) => {
        if (e.key === "Escape") aoFechar();
      }}
    >
      <div className="palco-cheio-topo">
        <p className="palco-cheio-titulo">{titulo}</p>
        <button
          ref={fechar}
          type="button"
          className="palco-cheio-fechar"
          onClick={aoFechar}
          aria-label="Fechar a reprodução"
        >
          Fechar
        </button>
      </div>

      <div className="palco-cheio-quadro" data-formato={youtubeId ? "video" : "audio"}>
        {youtubeId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
            title={titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="palco-cheio-frame"
          />
        ) : (
          <iframe
            src={spotifyEmbed}
            title={titulo}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            className="palco-cheio-frame"
          />
        )}
      </div>
    </div>
  );
}
