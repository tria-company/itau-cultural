"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ICONE_CONFERIDO, ICONE_MAIS, ICONE_TOCAR } from "@/componentes/base/icones";
import { CtaSpotify, PalcoCheio } from "@/componentes/palco";
import { CHAVE_LISTA_PLAY, useMinhaLista } from "@/componentes/base/minha-lista";
import { CapaSemImagem } from "@/componentes/capa-sem-imagem";
import { FichaDeAcessibilidade } from "@/componentes/ficha-acessibilidade";
import { gravarConcluidas, lerConcluidas } from "@/componentes/play";
import {
  creditoQueCredita,
  diaParaIso,
  diaParaTexto,
  DIMENSOES_DO_FILTRO,
  ROTULOS_DE_DIMENSAO,
} from "@/dados/play-wire";
import type { EspecieSpotify } from "@/dados/corpos-wire";
import type { Acessibilidade } from "@/dados/tipos";

/**
 * player.tsx — a página de uma mídia (D-92, `docs/telas.md` tela 20).
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * REFORMULAÇÃO DE 23/08 — A FICHA VIRA A PÁGINA DE UM TÍTULO.
 *
 * A tela era um documento: cabeçalho, capa, aviso, resumo, ficha, botão, links. Cada
 * bloco no seu quadrado, tudo com o mesmo peso, e nada dizendo para onde ir depois. A
 * referência da reunião (Netflix, Spotify) resolve isso com três coisas, e são estas três
 * que esta tela passou a ter:
 *
 * 1. **A CAPA SANGRA E O TEXTO ENTRA POR CIMA DELA.** No telefone ela é uma faixa 16:9
 *    com o título e o botão logo abaixo; na web ela é um painel largo com o texto na
 *    metade esquerda. A imagem deixou de ser uma figura no meio da página e virou o fundo
 *    do título, que é o que o vocabulário de streaming faz.
 *
 * 2. **A COLEÇÃO INTEIRA, LOGO ABAIXO.** É a lista de episódios da Netflix e a lista do
 *    programa no Spotify — a mesma peça, porque no acervo é o mesmo dado: as irmãs de
 *    fileira desta mídia, na ordem em que foram publicadas. O rótulo muda com a ORIGEM da
 *    fileira: só quando ela nasceu do nome repetido no título é que se pode chamar aquilo
 *    de programa. Quando nasceu do tema, são mídias que dividem um assunto, e dizer
 *    «episódios» afirmaria uma série que o acervo não declara (`colecaoDaMidia`).
 *
 * 3. **SEMELHANTES, PELA ARESTA DO GRAFO.** Não é «porque você assistiu» — isso exigiria
 *    dado de uso, que este acervo não tem e que a vitrine já se recusou a fabricar.
 *    `semelhante_a` é aresta declarada, derivada, e mídia sem ela simplesmente não desenha
 *    a seção.
 *
 * O QUE NÃO VEIO DA REFERÊNCIA, e por quê: nada de porcentagem de compatibilidade, nada de
 * classificação indicativa, nada de «Top 10», nada de trailer, nada de avaliação com
 * polegar. Os cinco dependem de dado que o acervo não publica.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * O PLAYER NÃO TOCA MÍDIA, E ISSO NÃO É UM DEFEITO ESCONDIDO: É A TELA DIZENDO O QUE É.
 *
 * O acervo carregado traz a FICHA e a CAPA de cada mídia. O arquivo de áudio ou vídeo não
 * está aqui e não é buscado de lugar nenhum: nada nesta tela carrega de fora — nem `<img>`
 * remoto, nem `<iframe>`, nem `<video>`/`<audio>` com `src` remoto, nem `fetch` (T-05-33).
 *
 * POR ISSO O BOTÃO PRIMÁRIO É UM LINK PARA A FONTE, e não um triângulo que finge. Ele tem
 * a forma do play da referência — disco claro, triângulo preto — e o rótulo do que
 * realmente acontece: a página do Itaú Cultural, onde o vídeo está. Quando a mídia não
 * declara `fonte`, o botão não existe: um play que não leva a lugar nenhum é pior que
 * nenhum play. O bloco que explica a ausência do arquivo continua na tela, mais abaixo.
 *
 * A CONCLUSÃO É UM GESTO HUMANO, NUNCA AUTOMÁTICA (D-92, T-05-36). Nada de temporizador,
 * nada de gravar ao abrir, nada de «assistido» por rolagem. `data-assistido` mede ZERO até
 * o clique. Um protótipo que registra sozinho estaria inventando um dado de uso que
 * ninguém produziu.
 *
 * O carimbo da conclusão vem da DATA DE REFERÊNCIA DO BUILD, jamais do relógio do runtime:
 * sob `output: "export"` o HTML é gerado no build, e um `new Date()` no cliente faria o
 * HTML exportado e a página hidratada divergirem.
 */

export interface MidiaDoPlayer {
  slug: string;
  titulo: string;
  rotuloCategoria: string;
  resumo: string;
  imagem?: string;
  imagemAlt?: string;
  creditoImagem?: string;
  dia: number;
  linguagens: string[];
  temas: string[];
  fonte?: string;
  acessibilidade: Acessibilidade;
  declaraAcessibilidade: boolean;
  procedencia: string;
  youtubeId?: string;
  spotify?: { url: string; especie: EspecieSpotify };
}

export interface LigacaoNomeada {
  slug: string;
  titulo: string;
  rota: string;
  motivo?: string;
}

/** Uma irmã de coleção ou uma semelhante — o que cabe num cartão, sem resumo. */
export interface MidiaVizinha {
  slug: string;
  titulo: string;
  rota: string;
  imagem?: string;
  rotuloCategoria: string;
  dia?: number;
  libras?: boolean;
}

export interface ColecaoNoFio {
  rotulo: string;
  origem: "colecao" | "tema" | "categoria";
  total: number;
  irmas: MidiaVizinha[];
}

export function Player({
  midia,
  colecao,
  semelhantes,
  eventos,
  aprofunda,
  dataDeReferencia,
}: {
  midia: MidiaDoPlayer;
  /** A fileira a que esta mídia pertence, com as irmãs. Ausente é estado válido. */
  colecao?: ColecaoNoFio;
  /** `semelhante_a` saindo desta mídia, com teto. Vazio para quem não tem a aresta. */
  semelhantes: MidiaVizinha[];
  /** Os eventos de que ESTA mídia fala — `fala_sobre`, a única ponte real. */
  eventos: LigacaoNomeada[];
  /** As arestas `aprofunda` que saem desta mídia. Medido no acervo: ZERO nas 529. */
  aprofunda: LigacaoNomeada[];
  dataDeReferencia: string;
}) {
  const [palcoAberto, setPalcoAberto] = useState(false);
  const [concluidas, setConcluidas] = useState<string[]>([]);
  const [hidratado, setHidratado] = useState(false);
  const minhaLista = useMinhaLista(CHAVE_LISTA_PLAY);

  // A leitura mora no efeito: ler `localStorage` no primeiro render divergiria da
  // hidratação, porque o HTML foi gerado no build.
  useEffect(() => {
    setConcluidas(lerConcluidas());
    setHidratado(true);
  }, []);

  const assistida = concluidas.includes(midia.slug);
  const naLista = minhaLista.tem(midia.slug);

  function concluir() {
    // CONJUNTO, não pilha: o `Set` é o que torna a conclusão idempotente.
    const proximo = [...new Set([...concluidas, midia.slug])];
    setConcluidas(proximo);
    gravarConcluidas(proximo);
  }

  function desfazer() {
    const proximo = concluidas.filter((s) => s !== midia.slug);
    setConcluidas(proximo);
    gravarConcluidas(proximo);
  }

  /**
   * O RÓTULO DA LISTA DE IRMÃS MUDA COM A ORIGEM DA FILEIRA, e é aqui que a honestidade
   * dessa seção mora. «Episódios» afirma uma série; o acervo só sustenta isso quando a
   * fileira nasceu do nome repetido no título.
   */
  const tituloDaColecao =
    colecao?.origem === "colecao" ? `Episódios · ${colecao.rotulo}` : `Mais em ${colecao?.rotulo}`;

  return (
    <article data-player={midia.slug} data-assistido={assistida ? "1" : "0"} className="midia">
      {/* ------------------------------------------------------------------------ capa */}
      <header
        className="midia-capa"
        data-sem-arquivo={midia.youtubeId || midia.spotify ? undefined : ""}
      >
        {midia.imagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={midia.imagem}
            alt={midia.imagemAlt ?? midia.titulo}
            decoding="async"
            className="midia-capa-foto"
          />
        ) : (
          <CapaSemImagem
            titulo={midia.titulo}
            classe="midia"
            linguagens={midia.linguagens}
            className="midia-capa-foto"
          />
        )}
        <span className="midia-capa-veu" aria-hidden />

        <div className="midia-capa-texto">
          <p className="midia-capa-tipo tipo-micro">
            {midia.rotuloCategoria}
            {colecao?.origem === "colecao" ? ` · ${colecao.rotulo}` : ""}
          </p>
          <h1 className="midia-capa-titulo tipo-titulo-1">{midia.titulo}</h1>

          <p className="midia-capa-meta tipo-legenda">
            <time dateTime={diaParaIso(midia.dia)}>{diaParaTexto(midia.dia)}</time>
            <span>Acervo do Itaú Cultural</span>
            {midia.acessibilidade.libras ? <span className="midia-selo">Libras</span> : null}
            {colecao?.origem === "colecao" ? (
              <span>
                {colecao.total} {colecao.total === 1 ? "episódio" : "episódios"}
              </span>
            ) : null}
          </p>

          {midia.resumo ? (
            /* O resumo INTEIRO, e ele sobe para a capa: é a sinopse, e é o que a
               referência põe embaixo do título. Ele não viaja no catálogo — esta rota é
               de servidor e não paga chunk. */
            <p data-resumo className="midia-capa-resumo tipo-detalhe">
              {midia.resumo}
            </p>
          ) : null}

          <div className="midia-capa-acoes">
            {midia.spotify ? (
              <CtaSpotify url={midia.spotify.url} especie={midia.spotify.especie} />
            ) : null}

            <button
              type="button"
              data-na-lista={naLista ? "sim" : "nao"}
              aria-pressed={naLista}
              onClick={() => minhaLista.alternar(midia.slug)}
              className="midia-botao tipo-detalhe"
            >
              {naLista ? ICONE_CONFERIDO : ICONE_MAIS}
              {naLista ? "Na minha lista" : "Minha lista"}
            </button>
          </div>

          {/* Crédito obrigatório QUANDO ELE CREDITA: o acervo é de terceiros e a
              procedência é argumento da proposta, não rodapé. «Foto: divulgação» não
              credita ninguém e cobre um terço do catálogo — quem separa uma coisa da outra
              é `creditoQueCredita`, em `play-wire.ts`, com a medição. */}
          {creditoQueCredita(midia.creditoImagem) ? (
            <p className="midia-capa-credito tipo-micro">
              Foto: {creditoQueCredita(midia.creditoImagem)}
            </p>
          ) : null}
        </div>
      </header>

      {/* A REPRODUÇÃO ABRE EM CAMADA, e não embutida na página (27.08, pedido do
          cliente). Embutida, a pessoa assistia com o cabeçalho, a coleção e a barra de
          abas em volta — atenção disputada, e no telefone o toque errado a um dedo de
          distância. Em camada o resto fica inerte, e a saída é botão ou Escape.

          O CARTAZ CONTINUA SENDO O GATILHO: capa, véu e o botão de reproduzir. O que
          mudou é para onde ele leva. E o iframe segue nascendo só depois do clique — o
          portão de zero-rede mede o carregamento da página, e nada é buscado antes. */}
      {midia.youtubeId || midia.spotify ? (
        <>
          <button
            type="button"
            className="palco-yt"
            data-palco={midia.youtubeId ? "youtube" : "spotify"}
            onClick={() => setPalcoAberto(true)}
            aria-label={`Reproduzir ${midia.titulo}`}
          >
            {midia.imagem ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={midia.imagem} alt="" className="palco-yt-foto" />
            ) : (
              <span className="palco-yt-fundo" aria-hidden />
            )}
            <span className="palco-yt-veu" aria-hidden />
            <span className="palco-yt-play">
              {ICONE_TOCAR}
              Reproduzir
            </span>
          </button>

          <PalcoCheio
            aberto={palcoAberto}
            aoFechar={() => setPalcoAberto(false)}
            titulo={midia.titulo}
            youtubeId={midia.youtubeId}
            spotifyUrl={midia.spotify?.url}
          />
        </>
      ) : null}

      {/* ------------------------------------------------- a coleção: episódios ou tema
       *
       * A MESMA PEÇA SERVE SÉRIE E PODCAST, porque no acervo é o mesmo dado. O que muda é
       * o rótulo, e ele vem da ORIGEM da fileira. */}
      {colecao?.irmas.length ? (
        <section data-colecao={colecao.rotulo} className="midia-secao">
          <h2 className="midia-secao-titulo tipo-titulo-3">{tituloDaColecao}</h2>
          <ol className="midia-episodios">
            {colecao.irmas.map((o) => (
              <li key={o.slug}>
                <Link href={o.rota} data-irma={o.slug} className="midia-episodio">
                  <span className="midia-episodio-quadro">
                    {o.imagem ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={o.imagem}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="midia-episodio-foto"
                      />
                    ) : (
                      <CapaSemImagem
                        titulo={o.titulo}
                        classe="midia"
                        rotulo={o.rotuloCategoria}
                        linguagens={[]}
                        className="size-full"
                      />
                    )}
                    <span className="midia-episodio-play" aria-hidden>
                      {ICONE_TOCAR}
                    </span>
                  </span>
                  <span className="midia-episodio-texto">
                    <span className="midia-episodio-titulo tipo-detalhe">{o.titulo}</span>
                    <span className="midia-episodio-pe tipo-micro">
                      {o.dia ? (
                        <time dateTime={diaParaIso(o.dia)}>{diaParaTexto(o.dia)}</time>
                      ) : null}
                      {o.libras ? <span className="midia-selo">Libras</span> : null}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* -------------------------------------------------------------- semelhantes */}
      {semelhantes.length ? (
        <section data-semelhantes={semelhantes.length} className="midia-secao">
          <h2 className="midia-secao-titulo tipo-titulo-3">Semelhantes no acervo</h2>
          {/* O QUE ELAS SÃO, EM UMA LINHA. Sem isto a fileira parece recomendação
              personalizada, que é justamente o que ela não é. */}
          <p className="tipo-legenda text-tinta-3">
            Ligadas a esta pela relação «semelhante a» do acervo — não por histórico de uso,
            que este acervo não tem.
          </p>
          <ul className="midia-trilho">
            {semelhantes.map((o) => (
              <li key={o.slug}>
                <Link href={o.rota} data-semelhante={o.slug} className="midia-vizinha">
                  <span className="midia-vizinha-quadro">
                    {o.imagem ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={o.imagem}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="midia-vizinha-foto"
                      />
                    ) : (
                      <CapaSemImagem
                        titulo={o.titulo}
                        classe="midia"
                        rotulo={o.rotuloCategoria}
                        linguagens={[]}
                        className="size-full"
                      />
                    )}
                  </span>
                  <span className="midia-vizinha-tipo tipo-micro">{o.rotuloCategoria}</span>
                  <span className="midia-vizinha-titulo tipo-legenda">{o.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* --------------------------------------- acessibilidade em evidência (tela 20) */}
      <section className="midia-secao">
        <h2 className="midia-secao-titulo tipo-titulo-3">Recursos de acessibilidade</h2>

        {/* Os TRÊS da tela 20 como controles de primeira ordem — legenda, Libras e
            audiodescrição —, cada um dizendo se ESTA mídia declara aquela dimensão. E,
            quando não declara, se é DECLARADO-AUSENTE ou NÃO-DECLARADO (D-43): «ausência
            de declaração não é negação», e achatar as duas afirmaria, em nome do Itaú
            Cultural, que o recurso não existe quando a fonte só não falou dele. */}
        <ul className="flex flex-wrap gap-1.5">
          {DIMENSOES_DO_FILTRO.map((campo) => {
            const presente = midia.acessibilidade[campo];
            const estado = presente
              ? "presente"
              : midia.declaraAcessibilidade
                ? "ausente-declarada"
                : "nao-declarada";
            return (
              <li
                key={campo}
                data-recurso-em-evidencia={campo}
                data-estado={estado}
                className="player-recurso"
              >
                <span className="player-recurso-nome">{ROTULOS_DE_DIMENSAO[campo]}</span>
                <span className="player-recurso-estado">
                  {estado === "presente"
                    ? "declarado"
                    : estado === "ausente-declarada"
                      ? "declarado ausente"
                      : "não declarado"}
                </span>
              </li>
            );
          })}
        </ul>

        {/* A ficha das 8, sempre as 8, no vocabulário que a fase 2 já fixou. Reusada em
            vez de reescrita: um segundo vocabulário para a mesma coisa divergiria. */}
        <FichaDeAcessibilidade
          acessibilidade={midia.acessibilidade}
          declaraDimensoes={midia.declaraAcessibilidade}
          fonteDaDeclaracao="Enciclopédia Itaú Cultural"
        />
      </section>

      {/* ------------------------------------------- concluir → repertório (D-92) */}
      <section className="midia-painel">
        <h2 className="tipo-detalhe font-bold">Marcar no meu repertório</h2>

        {assistida ? (
          <>
            <p data-registro className="tipo-detalhe">
              Registrada no seu repertório em{" "}
              <time dateTime={dataDeReferencia}>
                {diaParaTexto(Number(dataDeReferencia.replace(/-/g, "")))}
              </time>
              .
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" data-concluir onClick={concluir} className="player-botao" aria-pressed>
                Concluída
              </button>
              <button
                type="button"
                data-desfazer
                onClick={desfazer}
                className="tipo-legenda underline decoration-borda-forte underline-offset-4"
              >
                desfazer
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="tipo-legenda text-tinta-2">
              {hidratado
                ? "Nada foi registrado ainda."
                : "Lendo o que ficou guardado neste navegador…"}
            </p>
            <button
              type="button"
              data-concluir
              onClick={concluir}
              className="player-botao"
              aria-pressed={false}
            >
              Marcar como concluída
            </button>
          </>
        )}
      </section>

      {eventos.length || aprofunda.length ? (
        <section data-veja-isto className="midia-painel">
          <h2 className="tipo-detalhe font-bold">Eventos relacionados</h2>
          <ul className="flex flex-col gap-1">
            {[...eventos, ...aprofunda].map((l) => (
              <li key={l.rota}>
                <Link
                  href={l.rota}
                  data-ligacao={l.slug}
                  className="tipo-detalhe underline decoration-borda-forte underline-offset-4 hover:decoration-current"
                >
                  {l.titulo}
                </Link>
                {l.motivo ? <span className="tipo-legenda text-tinta-2"> — {l.motivo}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="tipo-legenda">
        <Link href="/play/" className="underline decoration-borda-forte underline-offset-4">
          ← voltar ao catálogo
        </Link>
      </p>
    </article>
  );
}
