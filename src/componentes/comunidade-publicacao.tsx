"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ICONE_CHEVRON_ESQUERDA,
  ICONE_CORACAO,
  ICONE_CORACAO_CHEIO,
  ICONE_ENVIAR,
  ICONE_FALA,
} from "@/componentes/base/icones";
import { Monograma, assinaturaDe, nomeDe } from "@/componentes/comunidade";
import { comentariosAbertosDe } from "@/componentes/comunidade-estado";
import { PalcoYoutube } from "@/componentes/palco";
import { Vazio } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";
import type { ComentarioDefinido } from "@/lib/pontos/tipos";

function Thread({
  comentario,
  indiceRaiz,
  indiceResposta,
  aoResponder,
  aoApagar,
  profundidade = 0,
}: {
  comentario: ComentarioDefinido;
  indiceRaiz: number;
  /** `null` no comentário raiz; o índice quando é resposta. */
  indiceResposta?: number | null;
  aoResponder: (nome: string, indiceRaiz: number) => void;
  /** Só chega quando quem lê mantém a comunidade. `undefined` some da tela. */
  aoApagar?: (raiz: number, resposta: number | null) => void;
  profundidade?: number;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [curtiu, setCurtiu] = useState(false);
  const reacoes = (comentario.reacoes ?? 0) + (curtiu ? 1 : 0);
  const temRespostas = Boolean(comentario.respostas?.length);
  const nome = nomeDe(comentario.autorId);

  return (
    <div className="thread">
      <div className="thread-coluna">
        <Monograma autorId={comentario.autorId} pequeno={profundidade > 0} />
        {temRespostas && <span className="thread-trilho" aria-hidden="true" />}
      </div>

      <div className="thread-corpo">
        <span className="tipo-legenda">
          <span className="font-bold">{nome}</span>
          {comentario.quandoRotulo && (
            <span className="text-tinta-3"> · {comentario.quandoRotulo}</span>
          )}
        </span>
        <p className="tipo-detalhe">{comentario.corpo}</p>

        <div className="thread-acoes">
          <button
            type="button"
            className="thread-acao"
            data-ativa={curtiu ? "sim" : "nao"}
            onClick={() => setCurtiu((v) => !v)}
            aria-pressed={curtiu}
            aria-label="Curtir comentário"
          >
            {curtiu ? ICONE_CORACAO_CHEIO : ICONE_CORACAO}
            <span>{reacoes}</span>
          </button>
          {profundidade === 0 && (
            <button
              type="button"
              className="thread-acao"
              onClick={() => aoResponder(nome, indiceRaiz)}
            >
              Responder
            </button>
          )}

          {/* APAGAR NO PRÓPRIO COMENTÁRIO (2026-08-28), em dois tempos e sem folha: é
              destrutivo e não desfaz, então a confirmação mora onde o gesto mora. */}
          {aoApagar ? (
            confirmando ? (
              <>
                <button
                  type="button"
                  className="thread-acao"
                  onClick={() => aoApagar(indiceRaiz, indiceResposta ?? null)}
                  data-apagar-comentario
                >
                  Apagar mesmo
                </button>
                <button
                  type="button"
                  className="thread-acao"
                  onClick={() => setConfirmando(false)}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                className="thread-acao"
                onClick={() => setConfirmando(true)}
                data-pedir-apagar-comentario
              >
                Apagar
              </button>
            )
          ) : null}
        </div>

        {temRespostas && (
          <div className="thread-respostas">
            {comentario.respostas?.map((resposta, i) => (
              <Thread
                key={i}
                comentario={resposta}
                indiceRaiz={indiceRaiz}
                indiceResposta={i}
                aoResponder={aoResponder}
                aoApagar={aoApagar}
                profundidade={profundidade + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PublicacaoAberta({
  id,
  /** Quem mantém a comunidade pode apagar comentário. Padrão: não pode. */
  podeModerar = false,
  /** Chega só quando a publicação é de quem está lendo. `undefined` some da tela. */
  aoApagarPost,
}: {
  id: string;
  podeModerar?: boolean;
  aoApagarPost?: () => void;
}) {
  const [apagando, setApagando] = useState(false);
  const router = useRouter();
  const { motor, hidratado } = usePontos();
  const [texto, setTexto] = useState("");
  const [respondendo, setRespondendo] = useState<{ indice: number; nome: string } | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  const publicacao = motor.atual.publicacoes.find((p) => p.id === id);
  if (!publicacao) return <Vazio>Esta publicação não existe mais.</Vazio>;

  const reagi = hidratado && (motor.atual.reacoesDadas[publicacao.id] ?? 0) > 0;
  const aceitaComentario = comentariosAbertosDe(publicacao.comunidadeId);
  const total = publicacao.comentarios.reduce(
    (soma, c) => soma + 1 + (c.respostas?.length ?? 0),
    0,
  );

  function responder(nome: string, indice: number) {
    setRespondendo({ indice, nome: nome.split(" ")[0] });
    campo.current?.focus();
  }

  function apagarComentario(raiz: number, resposta: number | null) {
    motor.emitir(
      "comunidade.comentario.removido",
      { tipo: "publicacao", id: publicacao!.id },
      resposta === null ? { raiz } : { raiz, resposta },
    );
  }

  function enviar() {
    const corpo = texto.trim();
    if (!corpo) return;
    motor.emitir(
      "comunidade.comentario.criado",
      { tipo: "publicacao", id: publicacao!.id },
      { corpo, respostaA: respondendo?.indice },
    );
    setTexto("");
    setRespondendo(null);
  }

  return (
    // `comunidade-coluna`: a mesma largura de leitura do feed, na web. Ver studio-produtor.css.
    <div className="flex flex-col gap-4 comunidade-coluna">
      <div className="aberta-foto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={publicacao.imagem} alt={publicacao.imagemAlt} />
        <span className="aberta-veu" aria-hidden="true" />
        <div className="aberta-autor">
          <button
            type="button"
            className="aberta-voltar"
            onClick={() => router.back()}
            aria-label="Voltar"
          >
            {ICONE_CHEVRON_ESQUERDA}
          </button>
          <Monograma autorId={publicacao.autorId} />
          <div className="flex min-w-0 flex-col">
            <span className="tipo-detalhe font-bold">{nomeDe(publicacao.autorId)}</span>
            <span className="tipo-legenda">
              {assinaturaDe(publicacao.autorId, publicacao.diasAtras)}
            </span>
          </div>
        </div>
      </div>

      {/* O VÍDEO VEM DEPOIS DO CABEÇALHO: a foto de cima é a capa, com o voltar e o autor;
          o vídeo é o conteúdo. O iframe só nasce depois do clique. */}
      {publicacao.video ? (
        <PalcoYoutube
          id={publicacao.video}
          titulo={publicacao.titulo}
          poster={publicacao.imagem}
        />
      ) : null}

      <div className="flex flex-col gap-2">
        <h2 className="tipo-destaque font-bold">{publicacao.titulo}</h2>
        {publicacao.corpo && <p className="tipo-detalhe">{publicacao.corpo}</p>}
        <span className="credito-foto">
          Foto: {publicacao.imagemCredito}
          {publicacao.fonte && (
            <>
              {" · "}
              <a href={publicacao.fonte} target="_blank" rel="noopener noreferrer">
                ver no site do Itaú Cultural
              </a>
            </>
          )}
        </span>

        <div className="publicacao-rodape">
          <button
            type="button"
            className="pastilha"
            data-ativa={reagi ? "sim" : "nao"}
            onClick={() =>
              !reagi &&
              motor.emitir("comunidade.reacao.dada", { tipo: "publicacao", id: publicacao.id })
            }
            aria-pressed={reagi}
            aria-label="Reagir"
          >
            {reagi ? ICONE_CORACAO_CHEIO : ICONE_CORACAO}
            <span>{publicacao.reacoes}</span>
          </button>
          <span className="tipo-legenda text-tinta-3 inline-flex items-center gap-1">
            <span className="inline-flex size-3.5">{ICONE_FALA}</span>
            {total} {total === 1 ? "comentário" : "comentários"}
          </span>

          {/* APAGAR O POST TAMBÉM AQUI (pedido de 2026-08-28): quem abriu a publicação
              para ler os comentários e decidiu tirá-la não deveria ter de voltar ao feed
              para achar o botão. Dois tempos, no lugar, como no cartão. */}
          {aoApagarPost ? (
            <span className="publicacao-dono">
              {apagando ? (
                <>
                  <button
                    type="button"
                    className="pastilha"
                    onClick={aoApagarPost}
                    data-apagar-post
                  >
                    Apagar mesmo
                  </button>
                  <button
                    type="button"
                    className="pastilha"
                    onClick={() => setApagando(false)}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="pastilha"
                  onClick={() => setApagando(true)}
                  data-pedir-apagar-post
                >
                  Apagar
                </button>
              )}
            </span>
          ) : null}
        </div>
      </div>

      <section className="estante">
        {publicacao.comentarios.length === 0 ? (
          <p className="tipo-legenda text-tinta-3">Seja a primeira pessoa a comentar.</p>
        ) : (
          publicacao.comentarios.map((c, i) => (
            <Thread
              key={i}
              comentario={c}
              indiceRaiz={i}
              indiceResposta={null}
              aoResponder={responder}
              aoApagar={podeModerar ? apagarComentario : undefined}
            />
          ))
        )}
      </section>

      {respondendo && (
        <div className="tipo-legenda text-tinta-2 flex items-center gap-2">
          Respondendo a <span className="font-bold">{respondendo.nome}</span>
          <button
            type="button"
            className="botao-discreto"
            style={{ padding: "0.1rem 0.6rem" }}
            onClick={() => setRespondendo(null)}
          >
            cancelar
          </button>
        </div>
      )}

      {/* COMENTÁRIO FECHADO É CAMPO QUE NÃO APARECE, e não campo que aparece e recusa.
          A chave existe desde 28/08 e era gravada sem que ninguém a lesse; passou a valer
          em 29/08/2026. Quem lê continua vendo a conversa que já está lá. */}
      {aceitaComentario ? (
        <div className="responder">
          <label className="sr-only" htmlFor="responder">
            Seu comentário
          </label>
          <input
            id="responder"
            ref={campo}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Responder com algo útil…"
            onKeyDown={(e) => {
              if (e.key === "Enter") enviar();
            }}
          />
          <button type="button" onClick={enviar} disabled={!texto.trim()} aria-label="Enviar">
            {ICONE_ENVIAR}
          </button>
        </div>
      ) : (
        <p className="tipo-legenda text-tinta-2" data-comentarios-fechados>
          Esta comunidade está com os comentários fechados.
        </p>
      )}
    </div>
  );
}
